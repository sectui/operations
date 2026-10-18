import { defineOperation } from "../../operation.ts";
import { BASE58_ALPHABETS, BASE58_CHARS } from "./alphabets.ts";
import { decodeBaseX, encodeBaseX } from "./big-number.ts";

export const toBase58 = defineOperation({
  id: "to-base58",
  name: "To Base58",
  description:
    'Encodes raw bytes as Base58 text, as used by Bitcoin addresses. Leading zero bytes become "1". e.g. "hello" becomes "Cn8eVZg".',
  category: "Encoding",
  output: "text",
  aliases: ["b58", "base58 encode", "bitcoin"],
  inverse: "from-base58",
  infoUrl: "https://wikipedia.org/wiki/Binary-to-text_encoding#Base58",
  args: {
    alphabet: { type: "select", name: "Alphabet", options: BASE58_ALPHABETS, default: "bitcoin" },
  },
  examples: [
    { input: "hello", output: "Cn8eVZg" },
    { input: "Hello World!", output: "2NEpo7TZRRrLZSi2U" },
  ],
  run: (input, { alphabet }) => new TextEncoder().encode(encodeBaseX(input, BASE58_CHARS[alphabet])),
});

export const fromBase58 = defineOperation({
  id: "from-base58",
  name: "From Base58",
  description: 'Decodes Base58 text into raw bytes, ignoring whitespace. e.g. "Cn8eVZg" becomes "hello".',
  category: "Encoding",
  output: "binary",
  aliases: ["b58", "base58 decode", "bitcoin"],
  inverse: "to-base58",
  infoUrl: "https://wikipedia.org/wiki/Binary-to-text_encoding#Base58",
  args: {
    alphabet: { type: "select", name: "Alphabet", options: BASE58_ALPHABETS, default: "bitcoin" },
  },
  examples: [
    { input: "Cn8eVZg", output: "hello" },
    { input: "2NEpo7TZRRrLZSi2U", output: "Hello World!" },
  ],
  run(input, { alphabet }) {
    const text = new TextDecoder().decode(input).replace(/\s+/g, "");
    return decodeBaseX(text, BASE58_CHARS[alphabet], "Base58");
  },
});
