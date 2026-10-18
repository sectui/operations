import { kebab } from "./args.ts";
import type { ArgDef, Example, Operation } from "./operation.ts";

/** The flag users type: booleans that default to true are toggled with `--no-*`. */
export function cliFlag(key: string, def: ArgDef): string {
  return def.type === "boolean" && def.default ? `--no-${kebab(key)}` : `--${kebab(key)}`;
}

/** Quotes a value for a POSIX shell, using $'...' when it contains control characters. */
export function shellQuote(value: string): string {
  if (/^[\w\-.,/=+:@%]+$/.test(value)) return value;
  if (!/[\x00-\x1f\x7f]/.test(value)) return `'${value.replaceAll("'", `'\\''`)}'`;
  const escaped = value.replace(/[\\'\x00-\x1f\x7f]/g, (c) =>
    c === "\n" ? "\\n" : c === "\t" ? "\\t" : c === "\\" || c === "'" ? `\\${c}` : `\\x${c.charCodeAt(0).toString(16).padStart(2, "0")}`,
  );
  return `$'${escaped}'`;
}

/** The CLI invocation of an example, e.g. `ops to-base64 --no-padding hi`. */
export function cliExample(op: Operation, example: Example): string {
  const parts = ["ops", op.id];
  for (const [key, value] of Object.entries(example.args ?? {})) {
    const def = op.args[key]!;
    if (def.type !== "boolean") parts.push(`--${kebab(key)}`, shellQuote(String(value)));
    else if (value !== def.default) parts.push(cliFlag(key, def));
  }
  parts.push(shellQuote(example.input));
  return parts.join(" ");
}
