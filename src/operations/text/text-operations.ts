import { defineOperation } from "../../operation.ts";
import { mapText } from "./lines.ts";

export const reverseText = defineOperation({
  id: "reverse-text",
  name: "Reverse text",
  description: 'Reverses the order of the characters. Accented letters and emoji stay intact. e.g. "héllo" becomes "olléh".',
  category: "Text",
  output: "binary",
  aliases: ["reverse string", "mirror"],
  args: {},
  examples: [
    { input: "héllo", output: "olléh" },
    { input: "a👍🏽b", output: "b👍🏽a" },
  ],
  run: (input) =>
    mapText(input, (text) => {
      const graphemes = [...new Intl.Segmenter().segment(text)].map((s) => s.segment);
      return graphemes.reverse().join("");
    }),
});

export const removeNewlines = defineOperation({
  id: "remove-newlines",
  name: "Remove newlines",
  description: "Removes every line break (LF, CRLF and CR), or replaces it with the given text.",
  category: "Text",
  output: "binary",
  aliases: ["join lines", "single line", "strip newlines"],
  args: {
    replacement: { type: "string", name: "Replacement", default: "" },
  },
  examples: [
    { input: "a\nb\r\nc", output: "abc" },
    { input: "a\nb\nc", args: { replacement: ", " }, output: "a, b, c" },
  ],
  run: (input, { replacement }) => mapText(input, (text) => text.replace(/\r\n|\r|\n/g, replacement)),
});

export const removeWhitespace = defineOperation({
  id: "remove-whitespace",
  name: "Remove whitespace",
  description: "Removes all spaces, tabs, line breaks and other Unicode whitespace.",
  category: "Text",
  output: "binary",
  aliases: ["remove spaces", "strip whitespace", "trim"],
  args: {
    keepNewlines: { type: "boolean", name: "Keep line breaks", default: false },
  },
  examples: [
    { input: "a b\tc\nd", output: "abcd" },
    { input: "a b\nc d", args: { keepNewlines: true }, output: "ab\ncd" },
  ],
  run: (input, { keepNewlines }) => mapText(input, (text) => text.replace(keepNewlines ? /[^\S\r\n]+/g : /\s+/g, "")),
});

const QUOTES = [
  { value: "double", label: 'Double quotes (")' },
  { value: "single", label: "Single quotes (')" },
  { value: "both", label: "Both" },
] as const;

const QUOTE_PATTERNS: Record<(typeof QUOTES)[number]["value"], string> = { double: '"', single: "'", both: "\"'" };

export const escapeQuotes = defineOperation({
  id: "escape-quotes",
  name: "Escape quotes",
  description: 'Puts a backslash before quotes, and before backslashes so the result is unambiguous. e.g. say "hi" becomes say \\"hi\\".',
  category: "Text",
  output: "binary",
  aliases: ["escape string", "addslashes"],
  args: {
    quotes: { type: "select", name: "Quotes", options: QUOTES, default: "double" },
    escapeBackslashes: { type: "boolean", name: "Escape backslashes", default: true },
  },
  examples: [
    { input: 'say "hi" \\o/', output: 'say \\"hi\\" \\\\o/' },
    { input: `it's "ok"`, args: { quotes: "single" }, output: `it\\'s "ok"` },
    { input: `'a' "b" \\`, args: { quotes: "both", escapeBackslashes: false }, output: `\\'a\\' \\"b\\" \\` },
  ],
  run(input, { quotes, escapeBackslashes }) {
    const pattern = new RegExp(`[${QUOTE_PATTERNS[quotes]}${escapeBackslashes ? "\\\\" : ""}]`, "g");
    return mapText(input, (text) => text.replace(pattern, "\\$&"));
  },
});
