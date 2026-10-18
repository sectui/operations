import { test } from "node:test";
import { expect } from "./test/expect.ts";
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

test("arguments", () => {
  expect(render("to-hex(delimiter=colon, uppercase){hi?}")).toBe("68:69:3F");
  expect(render("url-encode(encode-all){a=b}")).toBe("a%3Db");
  expect(render("url-decode(plus-as-space=false){a+b}")).toBe("a+b");
  expect(render("to-base64( padding = false ){a}")).toBe("YQ");
  expect(render("to-base64(){a}")).toBe("YQ==");
  expect(render("url-encode(encode-all){to-base64(padding=false){a?}}")).toBe("YT8");
});

test("quoted argument values", () => {
  expect(render('to-hex(delimiter="colon"){hi}')).toBe("68:69");
  expect(render("to-hex(delimiter='colon'){hi}")).toBe("68:69");
  expect(() => render('to-hex(delimiter="a,b)c\\"d{}"){x}')).toThrow('Invalid value "a,b)c\\"d{}"');
  expect(() => render("to-hex(delimiter='say \"hi\" \\\\'){x}")).toThrow('Invalid value "say \\"hi\\" \\\\"');
});

test("parenthesized text without a block stays text", () => {
  expect(render("call to-base64(hello) now")).toBe("call to-base64(hello) now");
  expect(render('to-base64("unterminated){x}')).toBe('to-base64("unterminated){x}');
});

test("parse exposes coerced arguments", () => {
  expect(parse("url-decode(plus-as-space=false){x}")).toEqual([
    { type: "op", id: "url-decode", args: { plusAsSpace: false }, children: [{ type: "text", value: "x" }], start: 0 },
  ]);
});

test("argument errors", () => {
  const cases: [string, string][] = [
    ["ok to-base64(nope=1){x}", 'Unknown argument "nope" for "to-base64" (expected: padding) (line 1, column 14)'],
    ["to-hex(delimiter=foo){x}", 'Invalid value "foo"'],
    ["to-base64(padding=maybe){x}", '"padding" expects true or false'],
    ["to-base64(padding, padding){x}", 'Duplicate argument "padding"'],
    ["to-hex(delimiter=a b){x}", 'Unexpected "b"'],
    ["to-hex(delimiter=a!b){x}", 'Unexpected "!"'],
    ["to-base64(padding,){x}", "Expected an argument name"],
    ["to-hex(delimiter=){x}", "Expected a value"],
  ];
  for (const [source, message] of cases) {
    expect(() => parse(source)).toThrow(TemplateError);
    expect(() => parse(source)).toThrow(message);
  }
});

test("error positions are reported as line and column", () => {
  try {
    parse("first line\n  to-base64{abc");
    throw new Error("should have thrown");
  } catch (error) {
    expect(error).toBeInstanceOf(TemplateError);
    const { line, column, position } = error as TemplateError;
    expect({ line, column, position }).toEqual({ line: 2, column: 3, position: 13 });
  }
});

test("operation failures point to the failing block", () => {
  expect(() => render("ok\n  from-base64(strict){!!}")).toThrow(
    'from-base64: Invalid Base64: unexpected character "!" at offset 0 (line 2, column 3)',
  );
});
