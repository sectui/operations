# CLI

`ops` applies operations from the terminal.

## Usage

```
ops <operation> [options] [input]   Apply an operation (input from stdin if omitted)
ops render [text]                   Replace operation{...} blocks in text
ops list                            List available operations
ops help [operation]                Show help
ops completions <bash|zsh|fish>     Print a shell completion script
ops --version
```

Global options, accepted by operations and `render`:

- `--raw`: write binary output to the terminal as is (see [Terminal safety](#terminal-safety)).
- `--help`, `-h`: show help.

```sh
ops to-base64 hello                                  # aGVsbG8=
echo -n aGVsbG8= | ops from-base64                   # hello
ops to-base64url hello                               # aGVsbG8
ops to-hex --delimiter colon --uppercase hello       # 68:65:6C:6C:6F
cat token.txt | ops from-base64 | ops url-encode --encode-all
```

## Input and output

- Input comes from the positional arguments (joined with spaces), or from stdin when there are none.
- Arguments are text: pass binary data through stdin.
- Everything after `--` is input, even if it looks like an option: `ops to-base64 -- --help` encodes `--help`.
- Output bytes are written to stdout unchanged, so binary results can be piped or redirected:

  ```sh
  ops from-base64 < image.b64 > image.png
  ```

- When stdout is a terminal, a trailing newline is added for readability. It is never added when piping.

## Terminal safety

Decoded data may contain escape sequences that a terminal would interpret (changing the title or the clipboard, faking output, ...). When stdout is a terminal and the output is not plain text (invalid UTF-8, control characters, bidi overrides), `ops` prints a hexdump instead and a notice on stderr:

```
$ ops from-base64 G1szMW0=
ops: output contains binary data or control characters, shown as a hexdump (use --raw to print it as is)
00000000  1b 5b 33 31 6d                                    |.[31m|
00000005
```

Use `--raw` to print the bytes anyway. Pipes and redirections are never affected.

## Options

Each operation's options are generated from its arguments ([operations.md](operations.md) lists them with their CLI flag):

- camelCase argument ids become kebab-case flags: `encodeAll` -> `--encode-all`.
- Booleans that default to `false` are enabled with `--flag`; those that default to `true` are disabled with `--no-flag` (e.g. `--no-padding`).
- `select` values are checked against the allowed options.

`ops help <operation>` or `ops <operation> --help` prints the description, options and examples of an operation.

## Templates

`ops render` applies the [template syntax](template.md) to its argument or to stdin:

```sh
ops render "hello my name is to-base64{hadi}"   # hello my name is aGFkaQ==
ops render 'to-hex(delimiter=colon){hi}'        # 68:69
ops render < message.txt
```

## Shell completion

`ops completions <shell>` prints a completion script for operations, their options and option values:

```sh
# bash: add to ~/.bashrc
source <(ops completions bash)

# zsh: add to ~/.zshrc (after compinit), or save it as _ops in a directory of your $fpath
source <(ops completions zsh)

# fish
ops completions fish > ~/.config/fish/completions/ops.fish
```

## Exit codes

| Code | Meaning                                                                      |
| ---- | ---------------------------------------------------------------------------- |
| `0`  | Success                                                                      |
| `1`  | The operation failed (e.g. invalid Base64 in strict mode, unclosed template) |
| `2`  | Usage error: unknown operation or option, invalid value, missing input       |

Errors are printed to stderr, prefixed with `ops:` and the failing operation, e.g. `ops: from-base64: Invalid Base64: unexpected character "!" at offset 1`.

When the output is piped into a command that stops reading early (like `head`), `ops` exits quietly with code `0`.
