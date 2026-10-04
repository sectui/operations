import { defineOperation } from "../../operation";
import { BASE64_ALPHABETS, type Base64Alphabet } from "./alphabets";

const NON_ALPHABET: Record<Base64Alphabet, RegExp> = {
  base64: /[^A-Za-z0-9+/]/g,
  base64url: /[^A-Za-z0-9\-_]/g,
};

export const fromBase64 = defineOperation({
  id: "from-base64",
  name: "From Base64",
  description: "Decodes Base64 text into raw bytes. e.g. \"aGVsbG8=\" becomes \"hello\".",
  category: "Encoding",
  aliases: ["b64", "base64 decode"],
  inverse: "to-base64",
  infoUrl: "https://wikipedia.org/wiki/Base64",
  args: {
    alphabet: { type: "select", name: "Alphabet", options: BASE64_ALPHABETS, default: "base64" },
    strict: {
      type: "boolean",
      name: "Strict mode",
      description: "Fail on non-alphabet characters and invalid padding instead of ignoring them.",
      default: false,
    },
  },
  run(input, { alphabet, strict }) {
    let text = new TextDecoder().decode(input);
    if (!strict) text = text.replace(NON_ALPHABET[alphabet], "");
    return Uint8Array.fromBase64(text, {
      alphabet,
      lastChunkHandling: strict ? "strict" : "loose",
    });
  },
});
