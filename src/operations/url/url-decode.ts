import { defineOperation } from "../../operation.ts";

const PERCENT = 0x25;
const PLUS = 0x2b;
const SPACE = 0x20;

function hexValue(byte: number | undefined): number {
  if (byte === undefined) return -1;
  if (byte >= 0x30 && byte <= 0x39) return byte - 0x30;
  const lower = byte | 0x20;
  if (lower >= 0x61 && lower <= 0x66) return lower - 0x61 + 10;
  return -1;
}

export const urlDecode = defineOperation({
  id: "url-decode",
  name: "URL Decode",
  description: "Decodes %XX sequences (percent-encoding) into bytes. Invalid sequences are left as is.",
  category: "Encoding",
  output: "binary",
  aliases: ["percent decode", "urldecode"],
  inverse: "url-encode",
  infoUrl: "https://wikipedia.org/wiki/Percent-encoding",
  args: {
    plusAsSpace: {
      type: "boolean",
      name: 'Treat "+" as space',
      description: "HTML form behavior (application/x-www-form-urlencoded).",
      default: true,
    },
  },
  examples: [
    { input: "a%20b%26c%3D%C3%A9", output: "a b&c=é" },
    { input: "a+b", output: "a b" },
    { input: "a+b", args: { plusAsSpace: false }, output: "a+b" },
  ],
  run(input, { plusAsSpace }) {
    const out = new Uint8Array(input.length);
    let n = 0;
    for (let i = 0; i < input.length; i++) {
      const byte = input[i]!;
      if (byte === PERCENT) {
        const hi = hexValue(input[i + 1]);
        const lo = hexValue(input[i + 2]);
        if (hi >= 0 && lo >= 0) {
          out[n++] = (hi << 4) | lo;
          i += 2;
          continue;
        }
      }
      out[n++] = byte === PLUS && plusAsSpace ? SPACE : byte;
    }
    return out.slice(0, n);
  },
});
