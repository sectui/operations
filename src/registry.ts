import type { ArgDefs, ArgValues, Operation } from "./operation";
import { fromBase64 } from "./operations/base64/from-base64";
import { toBase64 } from "./operations/base64/to-base64";
import { urlDecode } from "./operations/url/url-decode";
import { urlEncode } from "./operations/url/url-encode";

/** Every new operation must be registered here. */
export const operations = [toBase64, fromBase64, urlEncode, urlDecode] as const;

type AnyOperation = (typeof operations)[number];
export type OperationId = AnyOperation["id"];
export type ArgsOf<Id extends OperationId> = ArgValues<
  Extract<AnyOperation, { id: Id }>["args"]
>;

const byId = new Map<string, Operation>(
  operations.map((op) => [op.id, op as unknown as Operation]),
);

export function isOperationId(id: string): id is OperationId {
  return byId.has(id);
}

export function getOperation(id: OperationId): Operation {
  return byId.get(id)!;
}

function resolveArgs(
  op: Operation,
  args: Record<string, unknown>,
): ArgValues<ArgDefs> {
  for (const key of Object.keys(args)) {
    if (!Object.hasOwn(op.args, key)) {
      const expected = Object.keys(op.args).join(", ") || "none";
      throw new Error(
        `Unknown argument "${key}" for "${op.id}" (expected: ${expected})`,
      );
    }
  }
  return Object.fromEntries(
    Object.entries(op.args).map(([key, def]) => [
      key,
      args[key] ?? def.default,
    ]),
  ) as ArgValues<ArgDefs>;
}

export function run<Id extends OperationId>(
  id: Id,
  input: Uint8Array | string,
  args: Partial<ArgsOf<Id>> = {},
): Uint8Array {
  const op = getOperation(id);
  const bytes =
    typeof input === "string" ? new TextEncoder().encode(input) : input;
  return op.run(bytes, resolveArgs(op, args));
}

export function runText<Id extends OperationId>(
  id: Id,
  input: Uint8Array | string,
  args: Partial<ArgsOf<Id>> = {},
): string {
  return new TextDecoder().decode(run(id, input, args));
}
