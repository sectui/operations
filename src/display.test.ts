import { test } from "node:test";
import { expect } from "./test/expect.ts";
import { hexdump, isPrintable } from "./display.ts";

const bytes = (s: string) => new TextEncoder().encode(s);

test("isPrintable accepts text", () => {
  expect(isPrintable(bytes("hello\tworld\r\nété 🎉"))).toBe(true);
  expect(isPrintable(new Uint8Array())).toBe(true);
});

test("isPrintable rejects binary and terminal control characters", () => {
  expect(isPrintable(new Uint8Array([0xde, 0xad, 0xbe, 0xef]))).toBe(false);
  expect(isPrintable(bytes("\x1b[31mred"))).toBe(false);
  expect(isPrintable(bytes("\x1b]0;title\x07"))).toBe(false);
  expect(isPrintable(bytes("\u009b31m"))).toBe(false);
  expect(isPrintable(bytes("\x00"))).toBe(false);
  expect(isPrintable(bytes("abc‮dcb"))).toBe(false);
});

test("hexdump", () => {
  expect(hexdump(bytes("hello, world!\n\x00\xff"))).toBe(
    [
      "00000000  68 65 6c 6c 6f 2c 20 77  6f 72 6c 64 21 0a 00 c3  |hello, world!...|",
      "00000010  bf                                                |.|",
      "00000011",
    ].join("\n"),
  );
  expect(hexdump(new Uint8Array())).toBe("00000000");
});
