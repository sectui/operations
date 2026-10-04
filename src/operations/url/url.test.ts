import { expect, test } from "bun:test";
import { run, runText } from "../../registry";

test("url-encode", () => {
  expect(runText("url-encode", "a b&c=é")).toBe("a%20b&c=%C3%A9");
  expect(runText("url-encode", "https://x.fr/?q=1")).toBe("https://x.fr/?q=1");
  expect(runText("url-encode", "https://x.fr/?q=1", { encodeAll: true })).toBe("https%3A%2F%2Fx.fr%2F%3Fq%3D1");
  expect(runText("url-encode", new Uint8Array([0xff, 0x00]))).toBe("%FF%00");
});

test("url-decode", () => {
  expect(runText("url-decode", "a%20b%26c%3d%C3%A9")).toBe("a b&c=é");
  expect(runText("url-decode", "a+b")).toBe("a b");
  expect(runText("url-decode", "a+b", { plusAsSpace: false })).toBe("a+b");
  expect(runText("url-decode", "100% %zz %4")).toBe("100% %zz %4");
  expect(run("url-decode", "%FF%00")).toEqual(new Uint8Array([0xff, 0x00]));
});

test("round trip", () => {
  const bytes = crypto.getRandomValues(new Uint8Array(257));
  expect(run("url-decode", run("url-encode", bytes), { plusAsSpace: false })).toEqual(bytes);
});
