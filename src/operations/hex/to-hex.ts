import { defineOperation } from "../../operation.ts";

const DELIMITERS = [
  { value: "none", label: "None: 68656c6c6f" },
  { value: "space", label: "Space: 68 65 6c 6c 6f" },
  { value: "colon", label: "Colon: 68:65:6c:6c:6f" },
  { value: "comma", label: "Comma: 68,65,6c,6c,6f" },
  { value: "escape", label: "Escape sequences: \\x68\\x65\\x6c\\x6c\\x6f" },
  { value: "0x", label: "C array: 0x68, 0x65, 0x6c, 0x6c, 0x6f" },
] as const;

const FORMATS: Record<(typeof DELIMITERS)[number]["value"], { prefix: string; separator: string }> = {
  none: { prefix: "", separator: "" },
  space: { prefix: "", separator: " " },
  colon: { prefix: "", separator: ":" },
  comma: { prefix: "", separator: "," },
  escape: { prefix: "\\x", separator: "" },
  "0x": { prefix: "0x", separator: ", " },
};

export const toHex = defineOperation({
  id: "to-hex",
  name: "To Hex",
  description: 'Encodes raw bytes as hexadecimal text. e.g. "hello" becomes "68656c6c6f".',
  category: "Encoding",
  output: "text",
  aliases: ["hex encode", "base16", "xxd"],
  inverse: "from-hex",
  infoUrl: "https://wikipedia.org/wiki/Hexadecimal",
  args: {
    delimiter: { type: "select", name: "Delimiter", options: DELIMITERS, default: "none" },
    uppercase: { type: "boolean", name: "Uppercase", default: false },
  },
  examples: [
    { input: "hello", output: "68656c6c6f" },
    { input: "hello", args: { delimiter: "colon", uppercase: true }, output: "68:65:6C:6C:6F" },
    { input: "hi", args: { delimiter: "escape" }, output: "\\x68\\x69" },
  ],
  run(input, { delimiter, uppercase }) {
    const { prefix, separator } = FORMATS[delimiter];
    const hex = input.toHex();
    const digits = uppercase ? hex.toUpperCase() : hex;
    const bytes = digits.match(/../g) ?? [];
    return new TextEncoder().encode(bytes.map((byte) => prefix + byte).join(separator));
  },
});
