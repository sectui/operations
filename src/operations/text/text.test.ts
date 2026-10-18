import { test } from "node:test";
import { expect } from "../../test/expect.ts";
import { runText } from "../../registry.ts";

test("case conversions split identifiers into words", () => {
  expect(runText("to-camel-case", "user_id\nversion2Beta\nPDF-to HTML")).toBe("userId\nversion2Beta\npdfToHtml");
  expect(runText("to-snake-case", "élan vitalÉtat")).toBe("élan_vital_état");
  expect(runText("to-kebab-case", "don't stop")).toBe("dont-stop");
  expect(runText("to-pascal-case", "  ")).toBe("");
});

test("to-slug", () => {
  expect(runText("to-slug", "  --Ça va? ok-- ")).toBe("ca-va-ok");
  expect(runText("to-slug", "A\nB c")).toBe("a\nb-c");
});

test("line operations keep the line ending and the final newline", () => {
  expect(runText("sort-lines", "b\na\n")).toBe("a\nb\n");
  expect(runText("sort-lines", "b\r\na\r\n")).toBe("a\r\nb\r\n");
  expect(runText("reverse-lines", "a\r\nb")).toBe("b\r\na");
  expect(runText("unique-lines", "a\na\n")).toBe("a\n");
  expect(runText("add-line-numbers", "a\nb\n", { start: 0 })).toBe("0 a\n1 b\n");
  expect(runText("sort-lines", "")).toBe("");
});

test("shuffle-lines keeps every line", () => {
  const lines = Array.from({ length: 50 }, (_, i) => String(i));
  const shuffled = runText("shuffle-lines", lines.join("\n")).split("\n");
  expect(shuffled.toSorted()).toEqual(lines.toSorted());
  const seeded = (seed: string) => runText("shuffle-lines", lines.join("\n"), { seed });
  expect(seeded("x")).toBe(seeded("x"));
  expect(seeded("x")).not.toBe(seeded("y"));
});

test("reverse-text keeps line breaks and graphemes intact", () => {
  expect(runText("reverse-text", "ab\r\ncd")).toBe("dc\r\nba");
  expect(runText("reverse-text", "🇫🇷é")).toBe("é🇫🇷");
});

test("escape-quotes", () => {
  // a\"b: only the quote is escaped, so the result is ambiguous without escaping backslashes.
  expect(runText("escape-quotes", String.raw`a\"b`, { escapeBackslashes: false })).toBe(String.raw`a\\"b`);
  expect(runText("escape-quotes", String.raw`a\"b`)).toBe(String.raw`a\\\"b`);
});

test("counts", () => {
  expect(runText("count-chars", "")).toBe("0");
  expect(runText("count-chars", "é")).toBe("1");
  expect(runText("count-lines", "\n")).toBe("1");
  expect(runText("count-words", "")).toBe("0");
});
