import { expect, test } from "bun:test";
import type { ArgDef } from "./operation";
import { getOperation, isOperationId, operations, runText } from "./registry";

test("ids are unique and kebab-case", () => {
  const ids = operations.map((op) => op.id);
  expect(new Set(ids).size).toBe(ids.length);
  for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
});

test("inverses exist and are symmetric", () => {
  for (const op of operations) {
    if (!op.inverse) continue;
    expect(isOperationId(op.inverse)).toBe(true);
    expect(getOperation(op.inverse as never).inverse).toBe(op.id);
  }
});

test("select defaults are valid options", () => {
  for (const op of operations) {
    for (const arg of Object.values<ArgDef>(op.args)) {
      if (arg.type === "select") expect(arg.options.map((o) => o.value)).toContain(arg.default);
    }
  }
});

test("unknown argument", () => {
  // @ts-expect-error -- intentionally invalid argument
  expect(() => runText("to-base64", "x", { nope: 1 })).toThrow('Unknown argument "nope"');
});
