import { test } from "node:test";
import { expect } from "../../test/expect.ts";
import { run, runText } from "../../registry.ts";

test("to-hex delimiters", () => {
  expect(runText("to-hex", "")).toBe("");
  expect(runText("to-hex", "hi", { delimiter: "space" })).toBe("68 69");
  expect(runText("to-hex", "hi", { delimiter: "comma" })).toBe("68,69");
  expect(runText("to-hex", "hi", { delimiter: "0x", uppercase: true })).toBe("0x68, 0x69");
  expect(runText("to-hex", new Uint8Array([0xab]), { delimiter: "escape", uppercase: true })).toBe("\\xAB");
});

test("from-hex rejects invalid input", () => {
  expect(() => run("from-hex", "abc")).toThrow("odd number of digits");
  expect(() => run("from-hex", "zz")).toThrow('unexpected character "z"');
});

test("round trip with every delimiter", () => {
  const bytes = crypto.getRandomValues(new Uint8Array(257));
  for (const delimiter of ["none", "space", "colon", "comma", "escape", "0x"] as const) {
    expect(run("from-hex", run("to-hex", bytes, { delimiter }))).toEqual(bytes);
  }
});
