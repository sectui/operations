import { test } from "node:test";
import { expect } from "../../test/expect.ts";
import { run, runText } from "../../registry.ts";

const DEADBEEF = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);

test("to-base64", () => {
  expect(runText("to-base64", "hello")).toBe("aGVsbG8=");
  expect(runText("to-base64", "")).toBe("");
  expect(runText("to-base64", DEADBEEF)).toBe("3q2+7w==");
  expect(runText("to-base64", DEADBEEF, { padding: false })).toBe("3q2+7w");
});

test("from-base64", () => {
  expect(runText("from-base64", "aGVsbG8=")).toBe("hello");
  expect(run("from-base64", "3q2+7w==")).toEqual(DEADBEEF);
  expect(() => run("from-base64", "3q2-7w", { strict: true })).toThrow('unexpected character "-"');
});

test("from-base64 is lenient by default", () => {
  expect(runText("from-base64", " aGVs\nbG8 ")).toBe("hello");
  expect(runText("from-base64", "aGVsbG8")).toBe("hello");
});

test("from-base64 strict", () => {
  expect(() => run("from-base64", "aGVs!bG8=", { strict: true })).toThrow();
  expect(() => run("from-base64", "aGVsbG8", { strict: true })).toThrow();
  expect(runText("from-base64", "aGVsbG8=", { strict: true })).toBe("hello");
});

test("round trip", () => {
  const bytes = crypto.getRandomValues(new Uint8Array(257));
  expect(run("from-base64", run("to-base64", bytes))).toEqual(bytes);
});
