import { test } from "node:test";
import { expect } from "../../test/expect.ts";
import { run, runText } from "../../registry.ts";

test("json-format keeps strings and numbers as written", () => {
  const json = '{"a":"x,{}[]:\\"y","b":[[],{}],"c":-1.5e10,"d":12345678901234567890}';
  expect(runText("json-format", json, { indent: "tab" })).toBe(
    '{\n\t"a": "x,{}[]:\\"y",\n\t"b": [\n\t\t[],\n\t\t{}\n\t],\n\t"c": -1.5e10,\n\t"d": 12345678901234567890\n}',
  );
  expect(runText("json-format", ' "x" ')).toBe('"x"');
});

test("invalid input", () => {
  expect(() => run("json-format", "{a:1}")).toThrow("Invalid JSON");
  expect(() => run("json-to-yaml", "{")).toThrow("Invalid JSON");
  expect(() => run("yaml-to-json", "a: 1\n---\nb: 2")).toThrow("Invalid YAML");
});

test("json-to-yaml keeps large integers", () => {
  expect(runText("json-to-yaml", '{"id":12345678901234567890}')).toBe("id: 12345678901234567890\n");
});

test("yaml-to-json of an empty document", () => {
  expect(runText("yaml-to-json", "")).toBe("null");
});

test("round trip", () => {
  const json = '{"a":[1,"yes",null,{"b":"off"}],"c":"2024-01-01"}';
  expect(runText("yaml-to-json", runText("json-to-yaml", json), { indent: "minify" })).toBe(json);
});
