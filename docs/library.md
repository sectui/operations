# Library

```sh
npm install @sectui/operations
```

The package targets [Node.js](https://nodejs.org) 26 or later: it relies on the `Uint8Array` base64 and hex methods. It ships compiled JavaScript with type declarations. Bundlers can use the TypeScript sources instead through the `source` export condition (esbuild: `--conditions=source`). All operations are synchronous.

## Running an operation

```ts
import { run, runText } from "@sectui/operations";

run("from-base64", "3q2+7w=="); // Uint8Array [0xde, 0xad, 0xbe, 0xef]
runText("to-base64", "hello"); // "aGVsbG8="
runText("to-hex", "hello", { delimiter: "colon", uppercase: true }); // "68:65:6C:6C:6F"
```

- `run(id, input, args?)` returns a `Uint8Array`.
- `runText(id, input, args?)` decodes the result as UTF-8.
- `input` is a `Uint8Array` or a string (UTF-8 encoded).
- `args` is optional; omitted arguments use their default value.

Ids and arguments are typed: `run("to-bas64", ...)` or `{ delimiter: "foo" }` fail to compile. Arguments are also checked at runtime, for callers without types. See [operations.md](operations.md) for every operation and its arguments.

Chaining is plain function composition:

```ts
runText("url-encode", run("to-base64", "hello"));
```

## Errors

Invalid input or arguments throw an `OperationError`, whose `operation` is the id of the failing operation:

```ts
import { OperationError, run } from "@sectui/operations";

try {
  run("from-base64", "a!", { strict: true });
} catch (error) {
  if (error instanceof OperationError) {
    error.operation; // "from-base64"
    error.message; // 'Invalid Base64: unexpected character "!" at offset 1'
  }
}
```

Operations should throw `OperationError` with a readable message; any other error they throw is wrapped in one, with the original as `cause`.

## Discovering operations

```ts
import { getOperation, isOperationId, operations } from "@sectui/operations";

for (const op of operations) {
  console.log(op.id, op.name, op.category, Object.keys(op.args));
}

const id = "to-base64";
if (isOperationId(id)) getOperation(id).description;
```

Each `Operation` exposes:

| Field                 | Description                                                                 |
| --------------------- | --------------------------------------------------------------------------- |
| `id`                  | Stable kebab-case id, used by `run`, the CLI and templates                  |
| `name`, `description` | Human-readable name and description                                         |
| `category`            | Group, e.g. `Encoding`                                                      |
| `output`              | `text`, or `binary` when the result may contain arbitrary bytes             |
| `aliases`             | Extra search terms                                                          |
| `inverse`             | Id of the operation that undoes this one                                    |
| `infoUrl`             | Link to a reference page                                                    |
| `args`                | Argument definitions, keyed by id, in display order                         |
| `examples`            | At least one `{ input, args?, output }`, shown in the docs and the CLI help |
| `run(input, args)`    | The implementation: bytes in, bytes out, all args required                  |

An argument definition has a `type` (`boolean`, `string`, `number` or `select`), a display `name`, an optional `description` and a `default`. `select` arguments list their `options` (`{ value, label }`), `number` arguments may set `min` and `max`.

## Displaying results

Decoded data can contain terminal escape sequences or arbitrary bytes. Before printing a result to a terminal or a UI, check it:

```ts
import { hexdump, isPrintable, run } from "@sectui/operations";

const result = run("from-base64", input);
console.log(isPrintable(result) ? new TextDecoder().decode(result) : hexdump(result));
```

- `isPrintable(bytes)` is true for valid UTF-8 text without control characters (except tab and line breaks) or bidi overrides.
- `hexdump(bytes)` returns a dump in the `hexdump -C` format.

## Adding an operation

1. Create `src/operations/<group>/<id>.ts`:

   ```ts
   import { defineOperation } from "../../operation";

   export const reverse = defineOperation({
     id: "reverse",
     name: "Reverse",
     description: "Reverses the order of the bytes.",
     category: "Utils",
     output: "binary",
     args: {},
     examples: [{ input: "abc", output: "cba" }],
     run: (input) => input.toReversed(),
   });
   ```

2. Register it in the `operations` array of `src/registry.ts`.
3. Add tests next to it for edge cases, then run `npm run docs` to regenerate [operations.md](operations.md).

`defineOperation` keeps the literal types of the id, arguments and inverse, so `run` and `examples` are fully typed and an `inverse` pointing to an unknown operation fails to compile. Every example is checked by the test suite.
