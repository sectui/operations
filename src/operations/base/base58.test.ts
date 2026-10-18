import { test } from "node:test";
import { expect } from "../../test/expect.ts";
import { run, runText } from "../../registry.ts";

test("base58 keeps leading zero bytes", () => {
  expect(runText("to-base58", new Uint8Array([0, 0, 0xff]))).toBe("115Q");
  expect(run("from-base58", "115Q")).toEqual(new Uint8Array([0, 0, 0xff]));
  expect(runText("to-base58", "")).toBe("");
  expect(run("from-base58", "")).toEqual(new Uint8Array());
});

test("base58 alphabets", () => {
  expect(runText("to-base58", "hello", { alphabet: "flickr" })).toBe("cM8DuyF");
  expect(runText("from-base58", "cM8DuyF", { alphabet: "flickr" })).toBe("hello");
});

test("from-base58 rejects characters outside the alphabet", () => {
  expect(() => run("from-base58", "0OIl")).toThrow('Invalid Base58: unexpected character "0"');
});

test("round trips", () => {
  for (let length = 0; length < 64; length++) {
    const bytes = crypto.getRandomValues(new Uint8Array(length));
    if (length % 3 === 0) bytes.fill(0, 0, 2);
    expect(run("from-base58", run("to-base58", bytes))).toEqual(bytes);
  }
});
