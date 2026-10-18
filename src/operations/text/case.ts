import { defineOperation } from "../../operation.ts";
import { mapLines, mapText } from "./lines.ts";

// Words of an identifier or a sentence: "XMLHttpRequest v2" -> XML, Http, Request, v, 2.
const WORD = /\p{Lu}+(?=\p{Lu}\p{Ll})|\p{Lu}?[\p{Ll}\p{Lo}\p{M}]+|\p{Lu}+\p{M}*|\p{Lt}[\p{Ll}\p{M}]*|\p{N}+/gu;

function words(line: string): string[] {
  return line.replace(/['’]/g, "").match(WORD) ?? [];
}

const capitalize = (word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();

/** Defines an operation that rebuilds each line from its words. */
function defineCaseOperation<const Id extends string>(
  id: Id,
  name: string,
  description: string,
  aliases: string[],
  join: (words: string[]) => string,
  example: { input: string; output: string },
) {
  return defineOperation({
    id,
    name,
    description: `${description} Each line is converted separately.`,
    category: "Text",
    output: "binary",
    aliases,
    args: {},
    examples: [example],
    run: (input) => mapText(input, (text) => mapLines(text, (lines) => lines.map((line) => join(words(line))))),
  });
}

export const toCamelCase = defineCaseOperation(
  "to-camel-case",
  "To camelCase",
  'Joins the words with the first one in lowercase and the others capitalized. e.g. "hello world" becomes "helloWorld".',
  ["camelcase", "lower camel case"],
  (words) => words.map((word, i) => (i ? capitalize(word) : word.toLowerCase())).join(""),
  { input: "Hello big_world\nXMLHttpRequest", output: "helloBigWorld\nxmlHttpRequest" },
);

export const toPascalCase = defineCaseOperation(
  "to-pascal-case",
  "To PascalCase",
  'Joins the capitalized words. e.g. "hello world" becomes "HelloWorld".',
  ["pascalcase", "upper camel case"],
  (words) => words.map(capitalize).join(""),
  { input: "hello big_world", output: "HelloBigWorld" },
);

export const toSnakeCase = defineCaseOperation(
  "to-snake-case",
  "To snake_case",
  'Joins the lowercase words with underscores. e.g. "helloWorld" becomes "hello_world".',
  ["snakecase", "underscore"],
  (words) => words.map((word) => word.toLowerCase()).join("_"),
  { input: "Hello bigWorld", output: "hello_big_world" },
);

export const toKebabCase = defineCaseOperation(
  "to-kebab-case",
  "To kebab-case",
  'Joins the lowercase words with hyphens. e.g. "helloWorld" becomes "hello-world".',
  ["kebabcase", "dash case", "hyphen"],
  (words) => words.map((word) => word.toLowerCase()).join("-"),
  { input: "Hello bigWorld", output: "hello-big-world" },
);

// Letters that Unicode decomposition does not reduce to ASCII.
const TRANSLITERATIONS: Record<string, string> = { ß: "ss", æ: "ae", œ: "oe", ø: "o", đ: "d", ł: "l", þ: "th", ð: "d" };

export const toSlug = defineOperation({
  id: "to-slug",
  name: "To slug",
  description:
    'Makes a URL-friendly slug: removes accents, lowercases, and replaces everything but letters and digits with a separator. e.g. "Héllo, World!" becomes "hello-world". Each line is converted separately.',
  category: "Text",
  output: "binary",
  aliases: ["slugify", "permalink"],
  args: {
    separator: { type: "string", name: "Separator", default: "-" },
  },
  examples: [
    { input: "Héllo, World!", output: "hello-world" },
    { input: "Straße & Œuvre", args: { separator: "_" }, output: "strasse_oeuvre" },
  ],
  run: (input, { separator }) =>
    mapText(input, (text) =>
      mapLines(text, (lines) =>
        lines.map((line) =>
          line
            .toLowerCase()
            .replace(/[ßæœøđłþð]/g, (ch) => TRANSLITERATIONS[ch]!)
            .normalize("NFKD")
            .replace(/\p{M}/gu, "")
            .replace(/[^a-z0-9]+/g, " ")
            .trim()
            .replaceAll(" ", separator),
        ),
      ),
    ),
});

export const toTitleCase = defineOperation({
  id: "to-title-case",
  name: "To Title Case",
  description: 'Capitalizes the first letter of every word and lowercases the others. e.g. "hello WORLD" becomes "Hello World".',
  category: "Text",
  output: "binary",
  aliases: ["capitalize", "titlecase"],
  args: {},
  examples: [{ input: "hello WORLD, don't panic", output: "Hello World, Don't Panic" }],
  run: (input) => mapText(input, (text) => text.replace(/[\p{L}\p{N}][\p{L}\p{N}\p{M}'’]*/gu, capitalize)),
});

export const toUpperCase = defineOperation({
  id: "to-upper-case",
  name: "To UPPER CASE",
  description: 'Converts the text to uppercase. e.g. "héllo" becomes "HÉLLO".',
  category: "Text",
  output: "binary",
  aliases: ["uppercase", "capitals"],
  args: {},
  examples: [{ input: "héllo world", output: "HÉLLO WORLD" }],
  run: (input) => mapText(input, (text) => text.toUpperCase()),
});

export const toLowerCase = defineOperation({
  id: "to-lower-case",
  name: "To lower case",
  description: 'Converts the text to lowercase. e.g. "HÉLLO" becomes "héllo".',
  category: "Text",
  output: "binary",
  aliases: ["lowercase"],
  args: {},
  examples: [{ input: "HÉLLO World", output: "héllo world" }],
  run: (input) => mapText(input, (text) => text.toLowerCase()),
});
