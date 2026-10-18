import { test } from "node:test";
import { expect } from "../../test/expect.ts";
import { run, runText } from "../../registry.ts";

// RFC 4648 §10 test vectors.
const VECTORS = [
  ["", "", ""],
  ["f", "MY======", "CO======"],
  ["fo", "MZXQ====", "CPNG===="],
  ["foo", "MZXW6===", "CPNMU==="],
  ["foob", "MZXW6YQ=", "CPNMUOG="],
  ["fooba", "MZXW6YTB", "CPNMUOJ1"],
  ["foobar", "MZXW6YTBOI======", "CPNMUOJ1E8======"],
] as const;

test("RFC 4648 vectors", () => {
  for (const [plain, base32, base32hex] of VECTORS) {
    expect(runText("to-base32", plain)).toBe(base32);
    expect(runText("to-base32", plain, { alphabet: "base32hex" })).toBe(base32hex);
    expect(runText("from-base32", base32)).toBe(plain);
    expect(runText("from-base32", base32hex, { alphabet: "base32hex" })).toBe(plain);
  }
});

test("from-base32 ignores case, whitespace and padding", () => {
  expect(runText("from-base32", " mzxw\n6ytb oi ")).toBe("foobar");
});

test("from-base32 rejects invalid input", () => {
  expect(() => run("from-base32", "MZXW1===")).toThrow('unexpected character "1"');
  expect(() => run("from-base32", "MZX")).toThrow("truncated input");
});

test("round trip", () => {
  const bytes = crypto.getRandomValues(new Uint8Array(257));
  for (const alphabet of ["base32", "base32hex"] as const) {
    expect(run("from-base32", run("to-base32", bytes, { alphabet }), { alphabet })).toEqual(bytes);
  }
});
