import { expect, test } from "bun:test";
import { parse, render, TemplateError } from "@sectui/operations/template";

test("basic example", () => {
  expect(render("hello my name is to-base64{hadi}")).toBe("hello my name is aGFkaQ==");
});

test("nesting", () => {
  expect(render("url-encode{to-base64{hadi} ok}")).toBe("aGFkaQ==%20ok");
  expect(render("from-base64{to-base64{a to-base64{b}}}")).toBe("a Yg==");
});

test("unknown text is left untouched", () => {
  expect(render('{x} foo{x} json: {"a": 1}')).toBe('{x} foo{x} json: {"a": 1}');
  expect(render("xto-base64{a}")).toBe("xto-base64{a}");
});

test("escapes", () => {
  expect(render("to-base64{a\\}b}")).toBe("YX1i");
  expect(render("to-base64\\{a}")).toBe("to-base64{a}");
});

test("unclosed brace", () => {
  expect(() => parse("ok to-base64{abc")).toThrow(TemplateError);
});
