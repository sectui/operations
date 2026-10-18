/**
 * Splits text into lines. The line ending is CRLF if the text contains one, else LF. A final line
 * ending does not start a new line: "a\nb\n" gives ["a", "b"], and "" gives no lines.
 */
export function splitLines(text: string): { lines: string[]; eol: string; trailing: boolean } {
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const trailing = text.endsWith(eol);
  const body = trailing ? text.slice(0, -eol.length) : text;
  return { lines: text === "" ? [] : body.split(eol), eol, trailing };
}

/** Applies `fn` to the lines of `text`, keeping its line ending and final line ending. */
export function mapLines(text: string, fn: (lines: string[]) => string[]): string {
  const { lines, eol, trailing } = splitLines(text);
  if (!lines.length) return text;
  return fn(lines).join(eol) + (trailing ? eol : "");
}

/** Decodes the input as UTF-8, transforms it, and encodes the result back. */
export function mapText(input: Uint8Array, fn: (text: string) => string): Uint8Array {
  return new TextEncoder().encode(fn(new TextDecoder().decode(input)));
}
