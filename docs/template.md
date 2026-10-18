# Templates

Templates apply operations inside free text: every `operation{...}` block is replaced by the result of the operation on its content.

```
hello my name is to-base64{hadi}
-> hello my name is aGFkaQ==
```

## Syntax

- `id{content}` applies the operation `id` (see [operations.md](operations.md)) to `content`.
- Blocks can be nested and are evaluated from the inside out:

  ```
  url-encode{to-base64{hadi} ok}   ->   aGFkaQ==%20ok
  ```

- Only known operation ids are interpreted, and only at the start of a word. Everything else is left untouched:

  ```
  {x}  foo{x}  {"a": 1}  xto-base64{a}   ->   unchanged
  ```

- `\{`, `\}` and `\\` produce a literal `{`, `}` and `\`:

  ```
  to-base64{a\}b}   ->   YX1i        (encodes "a}b")
  to-base64\{a}     ->   to-base64{a}
  ```

- A block without its closing `}` is an error.
- If an operation fails (e.g. invalid Base64 in strict mode), rendering stops with an error naming the operation and the position of its block.

## Arguments

Pass arguments between parentheses, before the content:

```
to-hex(delimiter=colon, uppercase){hadi}
url-encode(encode-all){a=b&c}
url-decode(plus-as-space=false){a+b}
```

- Names are the kebab-case argument names, the same as the CLI flags without `--` (listed in [operations.md](operations.md)).
- A boolean written alone is `true`: `url-encode(encode-all){...}`.
- Omitted arguments use their default value. Spaces around names, `=` and `,` are ignored.
- Values are validated like in the CLI: unknown or duplicate argument, invalid choice or number is an error.

### Quoting values

A bare value may only contain letters, digits and `- _ . + / =`. Anything else must be quoted, with `"` or `'`:

| Written          | Value      |
| ---------------- | ---------- |
| `key=abc123`     | `abc123`   |
| `key="a,b) c{}"` | `a,b) c{}` |
| `key='say "hi"'` | `say "hi"` |
| `key="a\"b\\c"`  | `a"b\c`    |
| `key=a,b`        | error      |

Inside quotes everything is literal, except `\"` (or `\'` in single quotes) and `\\`. When in doubt, quote: the value is always read as written.

A parenthesis that is not followed by `{` is plain text, so `call to-base64(hello) now` is left untouched.

## Library

```ts
import { parse, render, renderBytes, TemplateError } from "@sectui/operations/template";

render("hi to-base64{hadi}"); // "hi aGFkaQ=="
render("to-base64(padding=false){hadi}"); // "aGFkaQ"
renderBytes("from-base64{3q2+7w==}"); // Uint8Array [0xde, 0xad, 0xbe, 0xef]
```

- `render(source)` returns a string (the result decoded as UTF-8).
- `renderBytes(source)` returns the raw bytes, for templates producing binary data.
- `parse(source)` returns the syntax tree without evaluating it: a list of `{ type: "text", value }` and `{ type: "op", id, args, children, start }` nodes, where `args` holds the parsed and validated arguments.
- Errors are thrown as `TemplateError`, with the `line` and `column` (1-based) of the faulty block or argument, and its `position` (offset in the source). The message ends with the location: `Missing closing brace (line 2, column 3)`.

## CLI

```sh
ops render "hi to-base64{hadi}"
ops render 'to-hex(delimiter=colon){hi}'
ops render < message.txt
```

See [cli.md](cli.md#templates).
