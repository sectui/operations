export type Category =
  | "Encoding"
  | "Encryption"
  | "Hashing"
  | "Compression"
  | "Data format"
  | "Utils";

interface BaseArg<T> {
  name: string;
  description?: string;
  default: T;
}

export type ArgDef =
  | ({ type: "boolean" } & BaseArg<boolean>)
  | ({ type: "string" } & BaseArg<string>)
  | ({ type: "number"; min?: number; max?: number } & BaseArg<number>)
  | ({
      type: "select";
      options: readonly { value: string; label: string }[];
    } & BaseArg<string>);

export type ArgDefs = Record<string, ArgDef>;

/** A select arg resolves to the union of its option values. */
export type ArgValue<D extends ArgDef> = D extends {
  type: "select";
  options: readonly { value: infer V }[];
}
  ? V
  : D extends { type: "boolean" }
    ? boolean
    : D extends { type: "number" }
      ? number
      : string;

export type ArgValues<A extends ArgDefs> = {
  [K in keyof A]: ArgValue<A[K]>;
};

export interface Operation<
  Id extends string = string,
  A extends ArgDefs = ArgDefs,
> {
  /** Stable kebab-case id, used in templates and recipes. */
  id: Id;
  name: string;
  description: string;
  category: Category;
  /** Extra search terms. */
  aliases?: readonly string[];
  /** Id of the operation that undoes this one. */
  inverse?: string;
  infoUrl?: string;
  /** Keyed by arg id, in display order. */
  args: A;
  run(input: Uint8Array, args: ArgValues<A>): Uint8Array;
}

/** Identity function that preserves the literal types of the id and args. */
export function defineOperation<
  const Id extends string,
  const A extends ArgDefs,
>(op: Operation<Id, A>): Operation<Id, A> {
  return op;
}
