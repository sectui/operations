import type { ArgDef, Operation } from "./operation.ts";

export const kebab = (key: string) => key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/** Finds an argument by its kebab-case name, as used by the CLI and templates. */
export function findArg(op: Operation, name: string): [key: string, def: ArgDef] | undefined {
  return Object.entries(op.args).find(([key]) => kebab(key) === name);
}

/** Throws a readable error if `value` does not fit the argument definition. */
export function checkArg(def: ArgDef, name: string, value: unknown): void {
  switch (def.type) {
    case "boolean":
      if (typeof value !== "boolean") throw new Error(`"${name}" expects true or false, got ${JSON.stringify(value)}`);
      return;
    case "string":
      if (typeof value !== "string") throw new Error(`"${name}" expects a string, got ${JSON.stringify(value)}`);
      return;
    case "number":
      if (typeof value !== "number" || Number.isNaN(value)) {
        throw new Error(`"${name}" expects a number, got ${JSON.stringify(value)}`);
      }
      if ((def.min !== undefined && value < def.min) || (def.max !== undefined && value > def.max)) {
        throw new Error(`"${name}" must be between ${def.min ?? "-∞"} and ${def.max ?? "∞"}, got ${value}`);
      }
      return;
    case "select":
      if (!def.options.some((o) => o.value === value)) {
        const expected = def.options.map((o) => o.value).join(", ");
        throw new Error(`Invalid value ${JSON.stringify(value)} for "${name}" (expected: ${expected})`);
      }
  }
}

/** Converts a raw CLI or template value to the argument's type, then checks it. */
export function coerceArg(def: ArgDef, name: string, raw: string | boolean): unknown {
  let value: unknown = raw;
  if (typeof raw === "string") {
    if (def.type === "boolean" && (raw === "true" || raw === "false")) value = raw === "true";
    if (def.type === "number" && raw.trim() !== "") value = Number(raw);
  }
  if (def.type === "number" && typeof value !== "number") {
    throw new Error(`"${name}" expects a number, got ${JSON.stringify(raw)}`);
  }
  checkArg(def, name, value);
  return value;
}
