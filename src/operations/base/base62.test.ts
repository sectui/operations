import { test } from "node:test";
import { expect } from "../../test/expect.ts";
import { run, runText } from "../../registry.ts";

test("base62 keeps leading zero bytes", () => {
  expect(runText("to-base62", new Uint8Array([0, 1]))).toBe("01");
  expect(run("from-base62", "01")).toEqual(new Uint8Array([0, 1]));
});

test("round trips", () => {
  for (let length = 0; length < 64; length++) {
    const bytes = crypto.getRandomValues(new Uint8Array(length));
    if (length % 3 === 0) bytes.fill(0, 0, 2);
    expect(run("from-base62", run("to-base62", bytes))).toEqual(bytes);
  }
});
