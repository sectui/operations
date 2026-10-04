import { defineOperation } from "../../operation";
import { BASE64_ALPHABETS } from "./alphabets";

export const toBase64 = defineOperation({
  id: "to-base64",
  name: "To Base64",
  description: "Encodes raw bytes as Base64 text. e.g. \"hello\" becomes \"aGVsbG8=\".",
  category: "Encoding",
  aliases: ["b64", "base64 encode"],
  inverse: "from-base64",
  infoUrl: "https://wikipedia.org/wiki/Base64",
  args: {
    alphabet: { type: "select", name: "Alphabet", options: BASE64_ALPHABETS, default: "base64" },
    padding: { type: "boolean", name: "Padding (=)", default: true },
  },
  run(input, { alphabet, padding }) {
    const text = input.toBase64({ alphabet, omitPadding: !padding });
    return new TextEncoder().encode(text);
  },
});
