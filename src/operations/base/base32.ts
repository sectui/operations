import { OperationError } from "../../errors.ts";
import { defineOperation } from "../../operation.ts";
import { BASE32_ALPHABETS, BASE32_CHARS } from "./alphabets.ts";

export const toBase32 = defineOperation({
  id: "to-base32",
  name: "To Base32",
  description: 'Encodes raw bytes as Base32 text. e.g. "hello" becomes "NBSWY3DP".',
  category: "Encoding",
  output: "text",
  aliases: ["b32", "base32 encode"],
  inverse: "from-base32",
  infoUrl: "https://wikipedia.org/wiki/Base32",
  args: {
    alphabet: { type: "select", name: "Alphabet", options: BASE32_ALPHABETS, default: "base32" },
    padding: { type: "boolean", name: "Padding (=)", default: true },
  },
  examples: [
    { input: "hello", output: "NBSWY3DP" },
    { input: "hi", output: "NBUQ====" },
    { input: "hi", args: { alphabet: "base32hex", padding: false }, output: "D1KG" },
  ],
  run(input, { alphabet, padding }) {
    const chars = BASE32_CHARS[alphabet];
    let out = "";
    let buffer = 0;
    let bits = 0;
    for (const byte of input) {
      buffer = ((buffer << 8) | byte) & 0xfff;
      bits += 8;
      while (bits >= 5) {
        bits -= 5;
        out += chars[(buffer >> bits) & 31];
      }
    }
    if (bits > 0) out += chars[(buffer << (5 - bits)) & 31];
    if (padding) out = out.padEnd(Math.ceil(out.length / 8) * 8, "=");
    return new TextEncoder().encode(out);
  },
});

// Number of characters in a final group that can encode whole bytes (2 -> 1 byte, 4 -> 2, 5 -> 3, 7 -> 4).
const VALID_TAIL = new Set([0, 2, 4, 5, 7]);

export const fromBase32 = defineOperation({
  id: "from-base32",
  name: "From Base32",
  description: 'Decodes Base32 text into raw bytes, ignoring case, whitespace and padding. e.g. "NBSWY3DP" becomes "hello".',
  category: "Encoding",
  output: "binary",
  aliases: ["b32", "base32 decode"],
  inverse: "to-base32",
  infoUrl: "https://wikipedia.org/wiki/Base32",
  args: {
    alphabet: { type: "select", name: "Alphabet", options: BASE32_ALPHABETS, default: "base32" },
  },
  examples: [
    { input: "NBSWY3DP", output: "hello" },
    { input: "nbuq====", output: "hi" },
    { input: "D1KG", args: { alphabet: "base32hex" }, output: "hi" },
  ],
  run(input, { alphabet }) {
    const chars = BASE32_CHARS[alphabet];
    const text = new TextDecoder().decode(input).replace(/\s+/g, "").replace(/=+$/, "").toUpperCase();
    if (!VALID_TAIL.has(text.length % 8)) {
      throw new OperationError("Invalid Base32: truncated input (the last group has an impossible length)");
    }
    const out = new Uint8Array(Math.floor((text.length * 5) / 8));
    let n = 0;
    let buffer = 0;
    let bits = 0;
    for (let i = 0; i < text.length; i++) {
      const value = chars.indexOf(text[i]!);
      if (value < 0) throw new OperationError(`Invalid Base32: unexpected character "${text[i]}"`);
      buffer = ((buffer << 5) | value) & 0xfff;
      bits += 5;
      if (bits >= 8) {
        bits -= 8;
        out[n++] = (buffer >> bits) & 0xff;
      }
    }
    return out;
  },
});
