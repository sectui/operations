import { defineOperation } from "../../operation.ts";
import { decodeBase64, encodeBase64 } from "./base64.ts";

export const toBase64url = defineOperation({
  id: "to-base64url",
  name: "To Base64url",
  description: 'Encodes raw bytes as URL-safe Base64 (- and _ instead of + and /), without padding by default. e.g. "ÿÿ" becomes "w7_Dvw".',
  category: "Encoding",
  output: "text",
  aliases: ["b64url", "base64url encode"],
  inverse: "from-base64url",
  infoUrl: "https://datatracker.ietf.org/doc/html/rfc4648#section-5",
  args: {
    padding: { type: "boolean", name: "Padding (=)", default: false },
  },
  examples: [
    { input: "ÿÿ", output: "w7_Dvw" },
    { input: "ÿÿ", args: { padding: true }, output: "w7_Dvw==" },
  ],
  run: (input, { padding }) => encodeBase64(input, "base64url", padding),
});

export const fromBase64url = defineOperation({
  id: "from-base64url",
  name: "From Base64url",
  description: 'Decodes URL-safe Base64 (- and _ instead of + and /) into raw bytes. e.g. "w7_Dvw" becomes "ÿÿ".',
  category: "Encoding",
  output: "binary",
  aliases: ["b64url", "base64url decode", "jwt"],
  inverse: "to-base64url",
  infoUrl: "https://datatracker.ietf.org/doc/html/rfc4648#section-5",
  args: {
    strict: {
      type: "boolean",
      name: "Strict mode",
      description: "Fail on non-alphabet characters and invalid padding instead of ignoring them.",
      default: false,
    },
  },
  examples: [
    { input: "w7_Dvw", output: "ÿÿ" },
    { input: "w7_Dvw==", output: "ÿÿ" },
  ],
  run: (input, { strict }) => decodeBase64(input, "base64url", strict),
});
