import { test } from "node:test";
import { expect } from "../../test/expect.ts";
import { run, runText } from "../../registry.ts";

const DEADBEEF = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);

test("base64url", () => {
  expect(runText("to-base64url", DEADBEEF)).toBe("3q2-7w");
  expect(run("from-base64url", "3q2-7w")).toEqual(DEADBEEF);
  const bytes = crypto.getRandomValues(new Uint8Array(257));
  expect(run("from-base64url", run("to-base64url", bytes))).toEqual(bytes);
});
