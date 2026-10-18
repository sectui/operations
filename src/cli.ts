#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { buffer } from "node:stream/consumers";
import { parseArgs, type ParseArgsOptionsConfig } from "node:util";
import { coerceArg, kebab } from "./args.ts";
import { cliExample, cliFlag } from "./cli-flags.ts";
import { completions, SHELLS, type Shell } from "./completions.ts";
import { hexdump, isPrintable } from "./display.ts";
import { OperationError } from "./errors.ts";
import type { ArgDef, Operation } from "./operation.ts";
import { getOperation, isOperationId, operations, run } from "./registry.ts";
import { renderBytes } from "./template.ts";

type Package = { version: string; description: string };
/** Inlined by scripts/bundle.ts, undefined everywhere else. */
declare const BUNDLED_PACKAGE: Package | undefined;

// Read at run time: the same relative path works from src/ and from the built dist/.
const pkg: Package =
  typeof BUNDLED_PACKAGE !== "undefined"
    ? BUNDLED_PACKAGE
    : (JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as Package);

class UsageError extends Error {}

const USAGE = `ops ${pkg.version} - ${pkg.description}

Usage:
  ops <operation> [options] [input]   Apply an operation (input from stdin if omitted)
  ops render [text]                   Replace operation{...} blocks in text
  ops list                            List available operations
  ops help [operation]                Show help
  ops completions <${SHELLS.join("|")}>       Print a shell completion script

Global options:
  --raw    Write binary output to the terminal as is (by default it is shown as a hexdump)
  --help   Show help

Examples:
  ops to-base64 hello
  echo -n aGVsbG8= | ops from-base64
  cat token.txt | ops from-base64 | ops url-encode --encode-all
  ops render "hello my name is to-base64{hadi}"`;

const RENDER_HELP = `ops render [--raw] [text]

Replaces every operation{...} block in the text (or stdin) with the result of the operation.
Arguments go between parentheses: to-hex(delimiter=colon){hadi}

Example:
  ops render "hello my name is to-base64{hadi}"`;

function describeArg(key: string, def: ArgDef): string {
  const value = def.type === "select" ? ` <${def.options.map((o) => o.value).join("|")}>` : def.type === "boolean" ? "" : ` <${def.type}>`;
  const details = [def.name, def.description, def.type === "boolean" ? undefined : `default: ${def.default}`].filter(Boolean).join(". ");
  return `  ${cliFlag(key, def)}${value}\n      ${details}`;
}

function operationHelp(op: Operation): string {
  const lines = [`${op.id} - ${op.name}`, "", op.description];
  if (op.aliases?.length) lines.push("", `Aliases: ${op.aliases.join(", ")}`);
  if (op.inverse) lines.push(`Inverse: ${op.inverse}`);
  const args = Object.entries(op.args);
  if (args.length) lines.push("", "Options:", ...args.map(([key, def]) => describeArg(key, def)));
  lines.push("", "Examples:", ...op.examples.map((ex) => `  ${cliExample(op, ex)}\n      -> ${JSON.stringify(ex.output)}`));
  return lines.join("\n");
}

function list(): string {
  const byCategory = Map.groupBy(operations, (op) => op.category);
  const width = Math.max(...operations.map((op) => op.id.length));
  return [...byCategory]
    .map(([category, ops]) => [category, ...ops.map((op) => `  ${op.id.padEnd(width)}  ${op.name}`)].join("\n"))
    .join("\n\n");
}

/** Extracts the global flags, which are only recognized before a `--` separator. */
function splitGlobalFlags(argv: string[]) {
  const end = argv.includes("--") ? argv.indexOf("--") : argv.length;
  const isGlobal = (arg: string, i: number) => i < end && ["--raw", "--help", "-h"].includes(arg);
  return {
    raw: argv.some((arg, i) => isGlobal(arg, i) && arg === "--raw"),
    help: argv.some((arg, i) => isGlobal(arg, i) && arg !== "--raw"),
    rest: argv.filter((arg, i) => !isGlobal(arg, i)),
  };
}

function parse(argv: string[], options: ParseArgsOptionsConfig, helpHint: string) {
  try {
    return parseArgs({ args: argv, options, allowPositionals: true, allowNegative: true, strict: true });
  } catch (error) {
    throw new UsageError(`${(error as Error).message} (see: ${helpHint})`);
  }
}

function parseOperationArgs(op: Operation, argv: string[]) {
  const options: ParseArgsOptionsConfig = {};
  for (const [key, def] of Object.entries(op.args)) {
    options[kebab(key)] = { type: def.type === "boolean" ? "boolean" : "string" };
  }
  const parsed = parse(argv, options, `ops help ${op.id}`);

  const args: Record<string, unknown> = {};
  for (const [key, def] of Object.entries(op.args)) {
    const raw = parsed.values[kebab(key)];
    if (raw === undefined || Array.isArray(raw)) continue;
    try {
      args[key] = coerceArg(def, `--${kebab(key)}`, raw);
    } catch (error) {
      throw new UsageError((error as Error).message);
    }
  }
  return { args, positionals: parsed.positionals };
}

async function readInput(positionals: string[]): Promise<Uint8Array> {
  if (positionals.length) return new TextEncoder().encode(positionals.join(" "));
  if (process.stdin.isTTY) throw new UsageError("No input: pass it as an argument or pipe it through stdin");
  return new Uint8Array(await buffer(process.stdin));
}

async function write(output: Uint8Array | string, { raw = false } = {}) {
  let bytes = typeof output === "string" ? new TextEncoder().encode(output) : output;
  if (process.stdout.isTTY) {
    // Decoded data may hold escape sequences that would drive the terminal.
    if (!raw && !isPrintable(bytes)) {
      console.error("ops: output contains binary data or control characters, shown as a hexdump (use --raw to print it as is)");
      bytes = new TextEncoder().encode(hexdump(bytes));
    }
    // Keep the shell prompt off the output line, without altering piped bytes.
    bytes = new Uint8Array([...bytes, 0x0a]);
  }
  await new Promise<void>((resolve, reject) => process.stdout.write(bytes, (error) => (error ? reject(error) : resolve())));
}

async function main(argv: string[]): Promise<void> {
  const [command, ...args] = argv;
  const { raw, help, rest } = splitGlobalFlags(args);

  if (command === undefined || command === "--help" || command === "-h") return write(USAGE);
  if (command === "--version" || command === "-v") return write(pkg.version);
  if (command === "list") return write(list());

  if (command === "help") {
    const id = rest[0];
    if (id === undefined) return write(USAGE);
    if (id === "render") return write(RENDER_HELP);
    if (!isOperationId(id)) throw new UsageError(`Unknown operation "${id}" (see: ops list)`);
    return write(operationHelp(getOperation(id)));
  }

  if (command === "completions") {
    const shell = rest[0];
    if (!SHELLS.includes(shell as Shell)) throw new UsageError(`Expected a shell: ${SHELLS.join(", ")}`);
    return write(completions(shell as Shell));
  }

  if (command === "render") {
    if (help) return write(RENDER_HELP);
    const { positionals } = parse(rest, {}, "ops help render");
    const input = await readInput(positionals);
    return write(renderBytes(new TextDecoder().decode(input)), { raw });
  }

  if (!isOperationId(command)) throw new UsageError(`Unknown operation "${command}" (see: ops list)`);
  const op = getOperation(command);
  if (help) return write(operationHelp(op));

  const { args: opArgs, positionals } = parseOperationArgs(op, rest);
  return write(run(command, await readInput(positionals), opArgs as never), { raw });
}

if (import.meta.main) {
  // The reader went away (e.g. `ops ... | head`): stop quietly like other Unix tools.
  process.stdout.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EPIPE") process.exit(0);
    throw error;
  });
  try {
    await main(process.argv.slice(2));
  } catch (error) {
    // The reader went away (e.g. `ops ... | head`): stop quietly like other Unix tools.
    if ((error as { code?: string }).code === "EPIPE") process.exit(0);
    const message = error instanceof Error ? error.message : String(error);
    const prefix = error instanceof OperationError && error.operation ? `${error.operation}: ` : "";
    console.error(`ops: ${prefix}${message}`);
    process.exit(error instanceof UsageError ? 2 : 1);
  }
}
