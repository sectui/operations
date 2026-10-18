import { OperationError } from "../../errors.ts";

export function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new OperationError(`Invalid JSON: ${(error as Error).message}`);
  }
}

// Strings, or runs of anything else that is not whitespace or punctuation (numbers, literals).
const TOKEN = /"(?:[^"\\]|\\.)*"|[{}[\],:]|[^\s{}[\],:"]+/g;

/**
 * Re-indents valid JSON without parsing values, so numbers keep their exact digits (no precision
 * loss on large integers) and key order and duplicate keys are preserved. An empty `indent` minifies.
 */
export function formatJson(text: string, indent: string): string {
  parseJson(text);
  const tokens = text.match(TOKEN) ?? [];
  const newline = (depth: number) => (indent ? "\n" + indent.repeat(depth) : "");
  let out = "";
  let depth = 0;
  for (const [i, token] of tokens.entries()) {
    const next = tokens[i + 1];
    if (token === "{" || token === "[") {
      // Keep empty objects and arrays on one line.
      if (next === "}" || next === "]") out += token;
      else out += token + newline(++depth);
    } else if (token === "}" || token === "]") {
      const previous = tokens[i - 1];
      if (previous === "{" || previous === "[") out += token;
      else out += newline(--depth) + token;
    } else if (token === ",") out += "," + newline(depth);
    else if (token === ":") out += indent ? ": " : ":";
    else out += token;
  }
  return out;
}

export const JSON_INDENTS = [
  { value: "2", label: "2 spaces" },
  { value: "4", label: "4 spaces" },
  { value: "tab", label: "Tab" },
  { value: "minify", label: "None, on a single line" },
] as const;

export const INDENT_STRINGS: Record<(typeof JSON_INDENTS)[number]["value"], string> = {
  "2": "  ",
  "4": "    ",
  tab: "\t",
  minify: "",
};
