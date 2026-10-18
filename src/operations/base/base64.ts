import { OperationError } from "../../errors.ts";
import { defineOperation } from "../../operation.ts";

type Base64Alphabet = "base64" | "base64url";

const NON_ALPHABET: Record<Base64Alphabet, RegExp> = {
  base64: /[^A-Za-z0-9+/]/g,
  base64url: /[^A-Za-z0-9\-_]/g,
};

function invalidInput(text: string, alphabet: Base64Alphabet, strict: boolean): OperationError {
  if (strict) {
    const unpadded = text.replace(/=+$/, "");
    const bad = new RegExp(NON_ALPHABET[alphabet].source).exec(unpadded);
    if (bad) return new OperationError(`Invalid Base64: unexpected character "${bad[0]}" at offset ${bad.index}`);
    return new OperationError("Invalid Base64: missing or incorrect padding");
  }
  return new OperationError("Invalid Base64: truncated input (the last group has a single character)");
}

export function encodeBase64(input: Uint8Array, alphabet: Base64Alphabet, padding: boolean): Uint8Array {
  return new TextEncoder().encode(input.toBase64({ alphabet, omitPadding: !padding }));
}

export function decodeBase64(input: Uint8Array, alphabet: Base64Alphabet, strict: boolean): Uint8Array {
  let text = new TextDecoder().decode(input);
  if (!strict) text = text.replace(NON_ALPHABET[alphabet], "");
  try {
    return Uint8Array.fromBase64(text, { alphabet, lastChunkHandling: strict ? "strict" : "loose" });
  } catch {
    throw invalidInput(text, alphabet, strict);
  }
}

export const toBase64 = defineOperation({
  id: "to-base64",
  name: "To Base64",
  description: 'Encodes raw bytes as Base64 text. e.g. "hello" becomes "aGVsbG8=".',
  category: "Encoding",
  output: "text",
  aliases: ["b64", "base64 encode"],
  inverse: "from-base64",
  infoUrl: "https://wikipedia.org/wiki/Base64",
  args: {
    padding: { type: "boolean", name: "Padding (=)", default: true },
  },
  examples: [
    { input: "hello", output: "aGVsbG8=" },
    { input: "hello", args: { padding: false }, output: "aGVsbG8" },
  ],
  run: (input, { padding }) => encodeBase64(input, "base64", padding),
});

export const fromBase64 = defineOperation({
  id: "from-base64",
  name: "From Base64",
  description: 'Decodes Base64 text into raw bytes. e.g. "aGVsbG8=" becomes "hello".',
  category: "Encoding",
  output: "binary",
  aliases: ["b64", "base64 decode"],
  inverse: "to-base64",
  infoUrl: "https://wikipedia.org/wiki/Base64",
  args: {
    strict: {
      type: "boolean",
      name: "Strict mode",
      description: "Fail on non-alphabet characters and invalid padding instead of ignoring them.",
      default: false,
    },
  },
  examples: [
    { input: "aGVsbG8=", output: "hello" },
    { input: "aGVs\nbG8", output: "hello" },
  ],
  run: (input, { strict }) => decodeBase64(input, "base64", strict),
});
