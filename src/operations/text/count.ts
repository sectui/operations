import { defineOperation } from "../../operation.ts";
import { splitLines } from "./lines.ts";

const encodeNumber = (n: number) => new TextEncoder().encode(String(n));

const UNITS = [
  { value: "graphemes", label: "Characters as displayed (é and 👍🏽 count as 1)" },
  { value: "codepoints", label: "Unicode code points" },
  { value: "bytes", label: "Bytes" },
] as const;

export const countChars = defineOperation({
  id: "count-chars",
  name: "Count characters",
  description: "Counts the characters of the input, line breaks included, like `wc -m`.",
  category: "Text",
  output: "text",
  aliases: ["length", "wc -m", "char count"],
  args: {
    unit: { type: "select", name: "Unit", options: UNITS, default: "graphemes" },
  },
  examples: [
    { input: "héllo 👍🏽", output: "7" },
    { input: "héllo 👍🏽", args: { unit: "codepoints" }, output: "8" },
    { input: "héllo 👍🏽", args: { unit: "bytes" }, output: "15" },
  ],
  run(input, { unit }) {
    if (unit === "bytes") return encodeNumber(input.length);
    const text = new TextDecoder().decode(input);
    if (unit === "codepoints") return encodeNumber([...text].length);
    return encodeNumber([...new Intl.Segmenter().segment(text)].length);
  },
});

export const countLines = defineOperation({
  id: "count-lines",
  name: "Count lines",
  description: "Counts the lines of the input. Unlike `wc -l`, a last line without a line break is counted.",
  category: "Text",
  output: "text",
  aliases: ["wc -l", "line count"],
  args: {},
  examples: [
    { input: "a\nb\nc", output: "3" },
    { input: "a\nb\n", output: "2" },
    { input: "", output: "0" },
  ],
  run: (input) => encodeNumber(splitLines(new TextDecoder().decode(input)).lines.length),
});

export const countWords = defineOperation({
  id: "count-words",
  name: "Count words",
  description: "Counts the words of the input, separated by whitespace, like `wc -w`.",
  category: "Text",
  output: "text",
  aliases: ["wc -w", "word count"],
  args: {},
  examples: [{ input: "  hello big\n world ", output: "3" }],
  run: (input) => encodeNumber(new TextDecoder().decode(input).split(/\s+/).filter(Boolean).length),
});
