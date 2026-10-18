import { defineOperation } from "../../operation.ts";
import { mapLines, mapText } from "./lines.ts";

export const sortLines = defineOperation({
  id: "sort-lines",
  name: "Sort lines",
  description: "Sorts the lines by Unicode code point, like `LC_ALL=C sort`, or in natural order.",
  category: "Text",
  output: "binary",
  aliases: ["sort", "order"],
  args: {
    reverse: { type: "boolean", name: "Reverse", description: "Sort in descending order.", default: false },
    ignoreCase: { type: "boolean", name: "Ignore case", default: false },
    natural: {
      type: "boolean",
      name: "Natural order",
      description: 'Compare numbers by value ("2" before "10") and letters alphabetically ("a" before "B").',
      default: false,
    },
  },
  examples: [
    { input: "b\nB\na\n10\n2", output: "10\n2\nB\na\nb" },
    { input: "b\nB\na\n10\n2", args: { natural: true, ignoreCase: true }, output: "2\n10\na\nb\nB" },
    { input: "a\nc\nb", args: { reverse: true }, output: "c\nb\na" },
  ],
  run(input, { reverse, ignoreCase, natural }) {
    const collator = new Intl.Collator("en", { numeric: true, sensitivity: ignoreCase ? "accent" : "variant" });
    const key = (line: string) => (ignoreCase ? line.toLowerCase() : line);
    const compare = natural ? collator.compare : (a: string, b: string) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0);
    return mapText(input, (text) => mapLines(text, (lines) => lines.toSorted(reverse ? (a, b) => compare(b, a) : compare)));
  },
});

/** Mulberry32, seeded with the FNV-1a hash of the seed: reproducible, not cryptographically secure. */
function seededRandom(seed: string): () => number {
  let state = 0x811c9dc5;
  for (const byte of new TextEncoder().encode(seed)) state = Math.imul(state ^ byte, 0x01000193);
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32;
  };
}

const secureRandom = () => crypto.getRandomValues(new Uint32Array(1))[0]! / 2 ** 32;

export const shuffleLines = defineOperation({
  id: "shuffle-lines",
  name: "Shuffle lines",
  description: "Puts the lines in a random order.",
  category: "Text",
  output: "binary",
  aliases: ["shuf", "randomize"],
  args: {
    seed: {
      type: "string",
      name: "Seed",
      description: "Gives the same order every time for the same seed and input. Leave empty for a random order.",
      default: "",
    },
  },
  examples: [{ input: "a\nb\nc\nd", args: { seed: "42" }, output: "c\na\nd\nb" }],
  run(input, { seed }) {
    const random = seed ? seededRandom(seed) : secureRandom;
    return mapText(input, (text) =>
      mapLines(text, (lines) => {
        // Fisher-Yates.
        const shuffled = [...lines];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
        }
        return shuffled;
      }),
    );
  },
});

export const uniqueLines = defineOperation({
  id: "unique-lines",
  name: "Unique lines",
  description: "Removes duplicate lines, keeping the first occurrence of each, even when duplicates are not adjacent.",
  category: "Text",
  output: "binary",
  aliases: ["uniq", "dedupe", "remove duplicates"],
  args: {
    ignoreCase: { type: "boolean", name: "Ignore case", default: false },
  },
  examples: [
    { input: "a\nb\na\nc\nb", output: "a\nb\nc" },
    { input: "a\nA\nb", args: { ignoreCase: true }, output: "a\nb" },
  ],
  run(input, { ignoreCase }) {
    return mapText(input, (text) =>
      mapLines(text, (lines) => {
        const seen = new Set<string>();
        return lines.filter((line) => {
          const key = ignoreCase ? line.toLowerCase() : line;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      }),
    );
  },
});

export const reverseLines = defineOperation({
  id: "reverse-lines",
  name: "Reverse lines",
  description: "Reverses the order of the lines, like `tac`.",
  category: "Text",
  output: "binary",
  aliases: ["tac"],
  args: {},
  examples: [{ input: "a\nb\nc\n", output: "c\nb\na\n" }],
  run: (input) => mapText(input, (text) => mapLines(text, (lines) => lines.toReversed())),
});

export const addLineNumbers = defineOperation({
  id: "add-line-numbers",
  name: "Add line numbers",
  description: "Prefixes every line with its number, right-aligned, like `cat -n`.",
  category: "Text",
  output: "binary",
  aliases: ["line numberer", "nl", "cat -n"],
  args: {
    start: { type: "number", name: "First number", default: 1 },
    separator: { type: "string", name: "Separator", description: "Placed between the number and the line.", default: " " },
  },
  examples: [
    { input: "a\nb", output: "1 a\n2 b" },
    { input: "a\nb\nc", args: { start: 9, separator: ": " }, output: " 9: a\n10: b\n11: c" },
  ],
  run(input, { start, separator }) {
    return mapText(input, (text) =>
      mapLines(text, (lines) => {
        const width = Math.max(String(start).length, String(start + lines.length - 1).length);
        return lines.map((line, i) => String(start + i).padStart(width) + separator + line);
      }),
    );
  },
});
