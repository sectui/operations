# @sectui/operations

Data transformation operations (encoding, decoding, …) inspired by [CyberChef](https://github.com/gchq/CyberChef), written in TypeScript for [Bun](https://bun.com). Part of the **sectui** family of security tools for the terminal.

> Early stage: the API may change at any time.

## Operations

| Id            | Name        | Arguments                                       |
| ------------- | ----------- | ----------------------------------------------- |
| `to-base64`   | To Base64   | `alphabet` (`base64` \| `base64url`), `padding` |
| `from-base64` | From Base64 | `alphabet` (`base64` \| `base64url`), `strict`  |
| `url-encode`  | URL Encode  | `encodeAll`                                     |
| `url-decode`  | URL Decode  | `plusAsSpace`                                   |

## Usage

```ts
import { operations, run, runText } from "@sectui/operations";

runText("to-base64", "hello"); // "aGVsbG8="
runText("to-base64", "hello", { alphabet: "base64url" });
run("from-base64", "3q2+7w=="); // Uint8Array [0xde, 0xad, 0xbe, 0xef]

for (const op of operations) console.log(op.id, op.name, op.args);
```

Operations take and return bytes (`Uint8Array`); strings are UTF-8 encoded. Omitted arguments use their default value.

### Templates

Replace `operation{...}` blocks inside any text:

```ts
import { render } from "@sectui/operations/template";

render("hello my name is to-base64{hadi}"); // "hello my name is aGFkaQ=="
render("url-encode{to-base64{hadi} ok}"); // "aGFkaQ==%20ok"
```

Only known operation ids are interpreted, so `{x}` or JSON stay untouched. Use `\{`, `\}` and `\\` for literal characters.

## Development

```sh
bun install
bun test
bun run typecheck
```

Each operation lives in `src/operations/<group>/<id>.ts` and must be registered in `src/registry.ts`.
