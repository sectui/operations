# @sectui/operations

Data transformation operations (encoding, decoding, hashing, extraction) inspired by [CyberChef](https://github.com/gchq/CyberChef), written in TypeScript for [Node.js](https://nodejs.org) 26 or later. Part of the **sectui** family of security tools for the terminal.

## Install

With npm (Node.js 26 or later):

```sh
npx @sectui/operations to-base64 hello            # run without installing
npm install -g @sectui/operations                 # then: ops to-base64 hello
```

With Nix, from the [sectui NUR](https://github.com/sectui/nur):

```sh
nix run github:sectui/nur#operations -- to-base64 hello
```

```nix
# flake: inputs.nur-sectui.url = "github:sectui/nur";
environment.systemPackages = [ nur-sectui.packages.${system}.operations ];

# or through NUR
environment.systemPackages = [ pkgs.nur.repos.sectui.operations ];
```

Each [GitHub release](https://github.com/sectui/operations/releases) also has the CLI as a single file, `node ops-<version>.mjs`.

## Documentation

- [Operations](docs/operations.md): every supported operation and its arguments
- [Library](docs/library.md): using `@sectui/operations` from TypeScript
- [CLI](docs/cli.md): the `ops` command
- [Templates](docs/template.md): the `operation{...}` text syntax

## Quick start

```sh
ops to-base64 hello                                  # aGVsbG8=
cat token.txt | ops from-base64 | ops url-encode --encode-all
ops render "hello my name is to-base64{hadi}"        # hello my name is aGFkaQ==
```

```ts
import { runText } from "@sectui/operations";
import { render } from "@sectui/operations/template";

runText("to-base64", "hello"); // "aGVsbG8="
render("hello my name is to-base64{hadi}"); // "hello my name is aGFkaQ=="
```
