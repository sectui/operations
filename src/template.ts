import { coerceArg, findArg, kebab } from "./args.ts";
import { getOperation, isOperationId, run, type OperationId } from "./registry.ts";

// Syntax: `op{content}` or `op(name=value, flag){content}`, nestable.
// Only known operation ids are interpreted: `{x}`, `foo{x}` or `op(text)` stay plain text.
// In content, `\{`, `\}` and `\\` produce the literal character.
// Argument values are bare (`[A-Za-z0-9-_.+/=]`) or quoted with " or ', where
// `\"`, `\'` and `\\` escape; anything else inside quotes is literal.

export type TemplateNode =
  | { type: "text"; value: string }
  | { type: "op"; id: OperationId; args: Record<string, unknown>; children: TemplateNode[]; start: number };

export class TemplateError extends Error {
  override name = "TemplateError";
  /** 1-based line and column of `position`. */
  readonly line: number;
  readonly column: number;
  /** Offset in the source. */
  readonly position: number;

  constructor(message: string, source: string, position: number) {
    const before = source.slice(0, position);
    const line = before.split("\n").length;
    const column = position - before.lastIndexOf("\n");
    super(`${message} (line ${line}, column ${column})`);
    this.position = position;
    this.line = line;
    this.column = column;
  }
}

const OP_START = /([a-z0-9]+(?:-[a-z0-9]+)*)([{(])/y;
const IDENT_CHAR = /[a-z0-9-]/;
const ARG_NAME = /[a-z0-9]+(?:-[a-z0-9]+)*/y;
const BARE_VALUE = /[A-Za-z0-9\-_.+/=]+/y;
const SPACE = /\s/;

/** Index of the `)` closing an argument list opened before `from`, ignoring quoted parts; -1 if none. */
function findArgsEnd(source: string, from: number): number {
  let quote: string | null = null;
  for (let j = from; j < source.length; j++) {
    const c = source[j]!;
    if (quote) {
      if (c === "\\") j++;
      else if (c === quote) quote = null;
    } else if (c === '"' || c === "'") {
      quote = c;
    } else if (c === ")") {
      return j;
    }
  }
  return -1;
}

function parseArgList(id: OperationId, source: string, from: number, end: number): Record<string, unknown> {
  const op = getOperation(id);
  const args: Record<string, unknown> = {};
  let j = from;

  const skipSpaces = () => {
    while (j < end && SPACE.test(source[j]!)) j++;
  };
  const fail = (message: string, at = j): never => {
    throw new TemplateError(message, source, at);
  };

  const parseValue = (): string => {
    const quote = source[j];
    if (quote === '"' || quote === "'") {
      let value = "";
      for (j++; source[j] !== quote; j++) {
        if (j >= end) fail("Unterminated quote");
        if (source[j] === "\\" && (source[j + 1] === quote || source[j + 1] === "\\")) j++;
        value += source[j];
      }
      j++;
      return value;
    }
    BARE_VALUE.lastIndex = j;
    const match = BARE_VALUE.exec(source);
    if (!match || BARE_VALUE.lastIndex > end) return fail("Expected a value (use quotes for special characters)");
    j = BARE_VALUE.lastIndex;
    return match[0];
  };

  skipSpaces();
  while (j < end) {
    const nameStart = j;
    ARG_NAME.lastIndex = j;
    const name = ARG_NAME.exec(source)?.[0];
    if (!name || ARG_NAME.lastIndex > end) fail("Expected an argument name");
    j = ARG_NAME.lastIndex;

    const arg = findArg(op, name!);
    if (!arg) {
      const expected = Object.keys(op.args).map(kebab).join(", ") || "none";
      fail(`Unknown argument "${name}" for "${id}" (expected: ${expected})`, nameStart);
    }
    const [key, def] = arg!;
    if (Object.hasOwn(args, key)) fail(`Duplicate argument "${name}"`, nameStart);

    skipSpaces();
    let raw: string | boolean = true;
    if (source[j] === "=") {
      j++;
      skipSpaces();
      raw = parseValue();
    }
    skipSpaces();
    if (j < end && source[j] !== ",") fail(`Unexpected "${source[j]}" (use quotes for special characters)`);

    try {
      args[key] = coerceArg(def, name!, raw);
    } catch (error) {
      fail((error as Error).message, nameStart);
    }

    if (j < end) {
      j++;
      skipSpaces();
      if (j >= end) fail("Expected an argument name");
    }
  }
  return args;
}

export function parse(source: string): TemplateNode[] {
  let i = 0;

  function parseNodes(open: { start: number } | null): TemplateNode[] {
    const nodes: TemplateNode[] = [];
    let text = "";
    const flush = () => {
      if (text) nodes.push({ type: "text", value: text });
      text = "";
    };

    while (i < source.length) {
      const ch = source[i]!;

      if (ch === "\\" && i + 1 < source.length && "{}\\".includes(source[i + 1]!)) {
        text += source[i + 1];
        i += 2;
        continue;
      }

      if (ch === "}" && open) {
        i++;
        flush();
        return nodes;
      }

      if (i === 0 || !IDENT_CHAR.test(source[i - 1]!)) {
        OP_START.lastIndex = i;
        const match = OP_START.exec(source);
        const id = match?.[1];
        if (id && isOperationId(id)) {
          let args: Record<string, unknown> = {};
          let contentStart = OP_START.lastIndex;
          const argsEnd = match![2] === "(" ? findArgsEnd(source, contentStart) : -1;
          const isBlock = match![2] === "{" || (argsEnd >= 0 && source[argsEnd + 1] === "{");
          if (isBlock) {
            if (argsEnd >= 0) {
              args = parseArgList(id, source, contentStart, argsEnd);
              contentStart = argsEnd + 2;
            }
            flush();
            const start = i;
            i = contentStart;
            nodes.push({ type: "op", id, args, children: parseNodes({ start }), start });
            continue;
          }
        }
      }

      text += ch;
      i++;
    }

    if (open) throw new TemplateError("Missing closing brace", source, open.start);
    flush();
    return nodes;
  }

  return parseNodes(null);
}

function evaluate(nodes: TemplateNode[], source: string): Uint8Array {
  const parts = nodes.map((node) => {
    if (node.type === "text") return new TextEncoder().encode(node.value);
    const input = evaluate(node.children, source);
    try {
      return run(node.id, input, node.args as never);
    } catch (error) {
      throw new TemplateError(`${node.id}: ${(error as Error).message}`, source, node.start);
    }
  });
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

export function renderBytes(source: string): Uint8Array {
  return evaluate(parse(source), source);
}

export function render(source: string): string {
  return new TextDecoder().decode(renderBytes(source));
}
