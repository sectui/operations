// The subset of the Jest/bun:test `expect` API used by this repository's tests,
// on top of node:assert. Tests import `test` / `describe` from node:test.
import assert from "node:assert/strict";

type ErrorMatcher = string | RegExp | (new (...args: never[]) => Error);

function matchesError(error: unknown, expected: ErrorMatcher | undefined): boolean {
  if (expected === undefined) return true;
  if (typeof expected === "function") return error instanceof expected;
  const message = error instanceof Error ? error.message : String(error);
  return typeof expected === "string" ? message.includes(expected) : expected.test(message);
}

export function expect<T>(actual: T) {
  return {
    /** Same value (Object.is). */
    toBe: (expected: T) => assert.equal(actual, expected),
    /** Deep equality. */
    toEqual: (expected: unknown) => assert.deepEqual(actual, expected),
    toContain: (item: unknown) =>
      assert.ok(
        (actual as { includes(x: unknown): boolean }).includes(item),
        `expected ${JSON.stringify(actual)} to contain ${JSON.stringify(item)}`,
      ),
    toMatch: (pattern: RegExp | string) => assert.match(String(actual), typeof pattern === "string" ? new RegExp(pattern) : pattern),
    toStartWith: (prefix: string) =>
      assert.ok(String(actual).startsWith(prefix), `expected ${JSON.stringify(actual)} to start with ${JSON.stringify(prefix)}`),
    toBeInstanceOf: (cls: new (...args: never[]) => unknown) => assert.ok(actual instanceof cls, `expected an instance of ${cls.name}`),
    /** `actual` is a function: it must throw, with a message containing `expected` (string), matching it (RegExp), or of that class. */
    toThrow: (expected?: ErrorMatcher) =>
      assert.throws(actual as () => unknown, (error: unknown) => {
        assert.ok(matchesError(error, expected), `unexpected error: ${error instanceof Error ? error.message : String(error)}`);
        return true;
      }),
    not: {
      toBe: (expected: T) => assert.notEqual(actual, expected),
    },
  };
}
