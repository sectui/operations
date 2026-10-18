import { checkArg } from "./args.ts";
import { OperationError } from "./errors.ts";
import type { ArgDefs, ArgValues, Operation } from "./operation.ts";
import { fromBase32, toBase32 } from "./operations/base/base32.ts";
import { fromBase58, toBase58 } from "./operations/base/base58.ts";
import { fromBase62, toBase62 } from "./operations/base/base62.ts";
import { fromBase64, toBase64 } from "./operations/base/base64.ts";
import { fromBase64url, toBase64url } from "./operations/base/base64url.ts";
import { hexToRgb } from "./operations/color/hex-to-rgb.ts";
import { jsonFormat } from "./operations/data/json-format.ts";
import { jsonToYaml, yamlToJson } from "./operations/data/yaml.ts";
import { extractEmails, extractIps, extractUrls } from "./operations/extract/extract.ts";
import { bcrypt } from "./operations/hash/bcrypt.ts";
import { md5, sha1, sha224, sha256, sha384, sha3_224, sha3_256, sha3_384, sha3_512, sha512 } from "./operations/hash/hashes.ts";
import { fromHex } from "./operations/hex/from-hex.ts";
import { toHex } from "./operations/hex/to-hex.ts";
import { htmlDecode } from "./operations/html/html-decode.ts";
import { htmlEncode } from "./operations/html/html-encode.ts";
import {
  toCamelCase,
  toKebabCase,
  toLowerCase,
  toPascalCase,
  toSlug,
  toSnakeCase,
  toTitleCase,
  toUpperCase,
} from "./operations/text/case.ts";
import { countChars, countLines, countWords } from "./operations/text/count.ts";
import { addLineNumbers, reverseLines, shuffleLines, sortLines, uniqueLines } from "./operations/text/line-operations.ts";
import { escapeQuotes, removeNewlines, removeWhitespace, reverseText } from "./operations/text/text-operations.ts";
import { urlDecode } from "./operations/url/url-decode.ts";
import { urlEncode } from "./operations/url/url-encode.ts";

/** Every new operation must be registered here. */
export const operations = [
  // Encoding
  toBase64,
  fromBase64,
  toBase64url,
  fromBase64url,
  toBase32,
  fromBase32,
  toBase58,
  fromBase58,
  toBase62,
  fromBase62,
  toHex,
  fromHex,
  urlEncode,
  urlDecode,
  htmlEncode,
  htmlDecode,
  // Hashing
  md5,
  sha1,
  sha224,
  sha256,
  sha384,
  sha512,
  sha3_224,
  sha3_256,
  sha3_384,
  sha3_512,
  bcrypt,
  // Data format
  jsonFormat,
  jsonToYaml,
  yamlToJson,
  hexToRgb,
  // Text
  toLowerCase,
  toUpperCase,
  toTitleCase,
  toCamelCase,
  toPascalCase,
  toSnakeCase,
  toKebabCase,
  toSlug,
  sortLines,
  shuffleLines,
  uniqueLines,
  reverseLines,
  addLineNumbers,
  reverseText,
  removeNewlines,
  removeWhitespace,
  escapeQuotes,
  countChars,
  countLines,
  countWords,
  // Extractors
  extractIps,
  extractEmails,
  extractUrls,
] as const;

type AnyOperation = (typeof operations)[number];
export type OperationId = AnyOperation["id"];
export type ArgsOf<Id extends OperationId> = ArgValues<Extract<AnyOperation, { id: Id }>["args"]>;

// Compile-time check: a typo in an `inverse` shows up here with the unknown id.
type UnknownInverse = Exclude<NonNullable<AnyOperation["inverse"]>, OperationId>;
const inversesExist: [UnknownInverse] extends [never] ? true : UnknownInverse = true;
void inversesExist;

const byId = new Map<string, Operation>(operations.map((op) => [op.id, op as unknown as Operation]));

export function isOperationId(id: string): id is OperationId {
  return byId.has(id);
}

export function getOperation(id: OperationId): Operation {
  return byId.get(id)!;
}

function resolveArgs(op: Operation, args: Record<string, unknown>): ArgValues<ArgDefs> {
  for (const key of Object.keys(args)) {
    if (!Object.hasOwn(op.args, key)) {
      const expected = Object.keys(op.args).join(", ") || "none";
      throw new OperationError(`Unknown argument "${key}" (expected: ${expected})`);
    }
  }
  const resolved: Record<string, unknown> = {};
  for (const [key, def] of Object.entries(op.args)) {
    const value = args[key] ?? def.default;
    try {
      checkArg(def, key, value);
    } catch (error) {
      throw new OperationError((error as Error).message);
    }
    resolved[key] = value;
  }
  return resolved as ArgValues<ArgDefs>;
}

/** Throws an `OperationError` tagged with the operation id when the input or arguments are invalid. */
export function run<Id extends OperationId>(id: Id, input: Uint8Array | string, args: Partial<ArgsOf<Id>> = {}): Uint8Array {
  const op = getOperation(id);
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  try {
    return op.run(bytes, resolveArgs(op, args));
  } catch (error) {
    const wrapped = error instanceof OperationError ? error : new OperationError((error as Error).message, { cause: error });
    wrapped.operation = id;
    throw wrapped;
  }
}

export function runText<Id extends OperationId>(id: Id, input: Uint8Array | string, args: Partial<ArgsOf<Id>> = {}): string {
  return new TextDecoder().decode(run(id, input, args));
}
