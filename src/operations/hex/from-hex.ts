import { OperationError } from "../../errors.ts";
import { defineOperation } from "../../operation.ts";

// "0x" and "\x" prefixes, whitespace and common separators.
const IGNORED = /0x|\\x|[\s:,;.%-]/gi;

export const fromHex = defineOperation({
  id: "from-hex",
  name: "From Hex",
  description:
    'Decodes hexadecimal text into raw bytes, ignoring case, whitespace, separators (: , ; . % -) and 0x or \\x prefixes. e.g. "68656c6c6f" becomes "hello".',
  category: "Encoding",
  output: "binary",
  aliases: ["hex decode", "base16", "unhex", "xxd -r"],
  inverse: "to-hex",
  infoUrl: "https://wikipedia.org/wiki/Hexadecimal",
  args: {},
  examples: [
    { input: "68656c6c6f", output: "hello" },
    { input: "68:65:6C:6C:6F", output: "hello" },
    { input: "0x68, 0x69", output: "hi" },
    { input: "\\x68\\x69", output: "hi" },
  ],
  run(input) {
    const hex = new TextDecoder().decode(input).replace(IGNORED, "");
    const bad = /[^0-9a-f]/i.exec(hex);
    if (bad) throw new OperationError(`Invalid hex: unexpected character "${bad[0]}"`);
    if (hex.length % 2) throw new OperationError("Invalid hex: odd number of digits");
    return Uint8Array.fromHex(hex);
  },
});
