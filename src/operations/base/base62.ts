import { defineOperation } from "../../operation.ts";
import { BASE62_ALPHABETS, BASE62_CHARS } from "./alphabets.ts";
import { decodeBaseX, encodeBaseX } from "./big-number.ts";

export const toBase62 = defineOperation({
  id: "to-base62",
  name: "To Base62",
  description: 'Encodes raw bytes as Base62 text (letters and digits only). Leading zero bytes become "0". e.g. "hello" becomes "7tQLFHz".',
  category: "Encoding",
  output: "text",
  aliases: ["b62", "base62 encode"],
  inverse: "from-base62",
  infoUrl: "https://wikipedia.org/wiki/Base62",
  args: {
    alphabet: { type: "select", name: "Alphabet", options: BASE62_ALPHABETS, default: "0-9A-Za-z" },
  },
  examples: [
    { input: "hello", output: "7tQLFHz" },
    { input: "hello", args: { alphabet: "0-9a-zA-Z" }, output: "7TqlfhZ" },
  ],
  run: (input, { alphabet }) => new TextEncoder().encode(encodeBaseX(input, BASE62_CHARS[alphabet])),
});

export const fromBase62 = defineOperation({
  id: "from-base62",
  name: "From Base62",
  description: 'Decodes Base62 text into raw bytes, ignoring whitespace. e.g. "7tQLFHz" becomes "hello".',
  category: "Encoding",
  output: "binary",
  aliases: ["b62", "base62 decode"],
  inverse: "to-base62",
  infoUrl: "https://wikipedia.org/wiki/Base62",
  args: {
    alphabet: { type: "select", name: "Alphabet", options: BASE62_ALPHABETS, default: "0-9A-Za-z" },
  },
  examples: [
    { input: "7tQLFHz", output: "hello" },
    { input: "7TqlfhZ", args: { alphabet: "0-9a-zA-Z" }, output: "hello" },
  ],
  run(input, { alphabet }) {
    const text = new TextDecoder().decode(input).replace(/\s+/g, "");
    return decodeBaseX(text, BASE62_CHARS[alphabet], "Base62");
  },
});
