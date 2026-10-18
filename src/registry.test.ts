import { describe, test } from "node:test";
import { expect } from "./test/expect.ts";
import { OperationError } from "./errors.ts";
import type { ArgDef } from "./operation.ts";
import { getOperation, isOperationId, operations, run, runText } from "./registry.ts";

test("ids are unique and kebab-case", () => {
  const ids = operations.map((op) => op.id);
  expect(new Set(ids).size).toBe(ids.length);
  for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
});

test("inverses are symmetric", () => {
  for (const op of operations) {
    if (op.inverse) expect(getOperation(op.inverse).inverse).toBe(op.id);
  }
});

test("select defaults are valid options", () => {
  for (const op of operations) {
    for (const arg of Object.values<ArgDef>(op.args)) {
      if (arg.type === "select") expect(arg.options.map((o) => o.value)).toContain(arg.default);
    }
  }
});

describe("examples", () => {
  for (const op of operations) {
    for (const example of op.examples) {
      test(`${op.id} ${JSON.stringify(example)}`, () => {
        expect(runText(op.id, example.input, example.args as never)).toBe(example.output);
      });
    }
  }
});

test("text operations only produce printable output", () => {
  for (const op of operations.filter((op) => op.output === "text")) {
    const bytes = crypto.getRandomValues(new Uint8Array(256));
    expect(runText(op.id, bytes)).toMatch(/^[\x20-\x7e]*$/);
  }
});

describe("errors", () => {
  test("are OperationErrors tagged with the operation id", () => {
    try {
      run("from-base64", "a!", { strict: true });
      throw new Error("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(OperationError);
      expect((error as OperationError).operation).toBe("from-base64");
      expect((error as Error).message).toBe('Invalid Base64: unexpected character "!" at offset 1');
    }
  });

  test("unknown arguments are rejected", () => {
    // @ts-expect-error -- intentionally invalid argument
    expect(() => run("to-base64", "x", { nope: 1 })).toThrow('Unknown argument "nope"');
  });

  test("argument values are checked at runtime", () => {
    expect(() => run("to-hex", "x", { delimiter: "foo" as never })).toThrow('Invalid value "foo" for "delimiter"');
    expect(() => run("url-encode", "x", { encodeAll: "no" as never })).toThrow('"encodeAll" expects true or false');
  });

  test("isOperationId narrows strings", () => {
    expect(isOperationId("to-base64")).toBe(true);
    expect(isOperationId("nope")).toBe(false);
  });
});
