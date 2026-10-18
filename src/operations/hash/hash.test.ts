import bcrypt from "bcryptjs";
import { test } from "node:test";
import { expect } from "../../test/expect.ts";
import { run, runText } from "../../registry.ts";

test("digests of the empty input", () => {
  expect(runText("md5", "")).toBe("d41d8cd98f00b204e9800998ecf8427e");
  expect(runText("sha1", "")).toBe("da39a3ee5e6b4b0d3255bfef95601890afd80709");
  expect(runText("sha256", "")).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  expect(runText("sha3-256", "")).toBe("a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a");
});

test("hashes raw bytes", () => {
  expect(runText("sha1", new Uint8Array([0xff]))).toBe("85e53271e14006f0265921d02d4d736cdc580b0b");
});

test("bcrypt uses a random salt by default", () => {
  const a = runText("bcrypt", "secret", { rounds: 4 });
  const b = runText("bcrypt", "secret", { rounds: 4 });
  expect(a).toMatch(/^\$2b\$04\$[./A-Za-z0-9]{53}$/);
  expect(a).not.toBe(b);
});

test("bcrypt output can be verified", async () => {
  const hash = runText("bcrypt", "secret", { rounds: 4 });
  expect(await bcrypt.compare("secret", hash)).toBe(true);
  expect(await bcrypt.compare("other", hash)).toBe(false);
});

test("bcrypt rejects invalid arguments", () => {
  expect(() => run("bcrypt", "x", { salt: "short" })).toThrow("Invalid salt");
  expect(() => run("bcrypt", "x", { rounds: 4.5 })).toThrow("Invalid cost");
  expect(() => run("bcrypt", "x", { rounds: 3 })).toThrow("between 4 and 31");
});
