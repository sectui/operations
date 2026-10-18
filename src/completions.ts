import { cliFlag } from "./cli-flags.ts";
import type { Operation } from "./operation.ts";
import { operations } from "./registry.ts";

export const SHELLS = ["bash", "zsh", "fish"] as const;
export type Shell = (typeof SHELLS)[number];

const COMMANDS = [
  ["list", "List available operations"],
  ["help", "Show help"],
  ["render", "Replace operation{...} blocks in text"],
  ["completions", "Print a shell completion script"],
] as const;

const GLOBAL_FLAGS = [
  ["--raw", "Write raw bytes even to a terminal"],
  ["--help", "Show help"],
] as const;

const ops = operations as readonly Operation[];

/** Wraps a string in single quotes for any POSIX-like shell. */
const sq = (s: string) => `'${s.replaceAll("'", `'\\''`)}'`;

interface Flag {
  flag: string;
  description: string;
  values?: string[];
}

function flagsOf(op: Operation): Flag[] {
  return Object.entries(op.args).map(([key, def]) => ({
    flag: cliFlag(key, def),
    description: def.name,
    values: def.type === "select" ? def.options.map((o) => o.value) : def.type === "boolean" ? undefined : [],
  }));
}

function bash(): string {
  const ids = ops.map((op) => op.id).join(" ");
  const cases = ops.map((op) => {
    const flags = flagsOf(op);
    const valueCases = flags
      .filter((f) => f.values)
      .map((f) => `        ${f.flag}) COMPREPLY=($(compgen -W ${sq(f.values!.join(" "))} -- "$cur")); return ;;`);
    const all = [...flags.map((f) => f.flag), ...GLOBAL_FLAGS.map(([f]) => f)].join(" ");
    return [
      `    ${op.id})`,
      ...(valueCases.length ? ['      case "$prev" in', ...valueCases, "      esac"] : []),
      `      [[ $cur == -* ]] && COMPREPLY=($(compgen -W ${sq(all)} -- "$cur"))`,
      "      ;;",
    ].join("\n");
  });
  return `# bash completion for ops
_ops() {
  local cur="\${COMP_WORDS[COMP_CWORD]}" prev="\${COMP_WORDS[COMP_CWORD-1]}"
  if (( COMP_CWORD == 1 )); then
    COMPREPLY=($(compgen -W ${sq(`${COMMANDS.map(([c]) => c).join(" ")} ${ids}`)} -- "$cur"))
    return
  fi
  case "\${COMP_WORDS[1]}" in
    help) (( COMP_CWORD == 2 )) && COMPREPLY=($(compgen -W ${sq(ids)} -- "$cur")) ;;
    completions) (( COMP_CWORD == 2 )) && COMPREPLY=($(compgen -W ${sq(SHELLS.join(" "))} -- "$cur")) ;;
    render) [[ $cur == -* ]] && COMPREPLY=($(compgen -W ${sq(GLOBAL_FLAGS.map(([f]) => f).join(" "))} -- "$cur")) ;;
${cases.join("\n")}
  esac
}
complete -F _ops ops
`;
}

function zsh(): string {
  // Escapes characters that are special in _describe entries and _arguments specs.
  const esc = (s: string) => s.replace(/([:[\]\\])/g, "\\$1");
  const describe = (items: (readonly [string, string])[]) => items.map(([n, d]) => sq(`${esc(n)}:${esc(d)}`)).join(" ");
  const globals = GLOBAL_FLAGS.map(([f, d]) => sq(`${f}[${esc(d)}]`)).join(" ");
  const cases = ops.map((op) => {
    const specs = flagsOf(op).map((f) => {
      const action = f.values === undefined ? "" : f.values.length ? `:value:(${f.values.join(" ")})` : ":value:";
      return sq(`${f.flag}[${esc(f.description)}]${action}`);
    });
    return `    ${op.id}) _arguments ${[...specs, globals, sq("*:input:")].join(" ")} ;;`;
  });
  return `#compdef ops
_ops() {
  if (( CURRENT == 2 )); then
    local -a commands=(${describe([...COMMANDS, ...ops.map((op) => [op.id, op.name] as const)])})
    _describe command commands
    return
  fi
  local cmd=$words[2]
  shift words
  (( CURRENT-- ))
  case $cmd in
    help) (( CURRENT == 2 )) && { local -a ids=(${describe(ops.map((op) => [op.id, op.name] as const))}); _describe operation ids } ;;
    completions) (( CURRENT == 2 )) && _values shell ${SHELLS.join(" ")} ;;
    render) _arguments ${globals} ${sq("*:text:")} ;;
${cases.join("\n")}
  esac
}
if [[ $funcstack[1] == _ops ]]; then _ops "$@"; else compdef _ops ops; fi
`;
}

function fish(): string {
  const lines = ["# fish completion for ops", "complete -c ops -f"];
  for (const [command, description] of COMMANDS) {
    lines.push(`complete -c ops -n __fish_use_subcommand -a ${command} -d ${sq(description)}`);
  }
  for (const op of ops) lines.push(`complete -c ops -n __fish_use_subcommand -a ${op.id} -d ${sq(op.name)}`);
  const ids = sq(ops.map((op) => op.id).join(" "));
  lines.push(`complete -c ops -n '__fish_seen_subcommand_from help' -a ${ids}`);
  lines.push(`complete -c ops -n '__fish_seen_subcommand_from completions' -a ${sq(SHELLS.join(" "))}`);
  const withGlobals = ["render", ...ops.map((op) => op.id)].join(" ");
  for (const [flag, description] of GLOBAL_FLAGS) {
    lines.push(`complete -c ops -n ${sq(`__fish_seen_subcommand_from ${withGlobals}`)} -l ${flag.slice(2)} -d ${sq(description)}`);
  }
  for (const op of ops) {
    for (const f of flagsOf(op)) {
      const values = f.values === undefined ? "" : f.values.length ? ` -x -a ${sq(f.values.join(" "))}` : " -x";
      lines.push(`complete -c ops -n ${sq(`__fish_seen_subcommand_from ${op.id}`)} -l ${f.flag.slice(2)}${values} -d ${sq(f.description)}`);
    }
  }
  return `${lines.join("\n")}\n`;
}

export function completions(shell: Shell): string {
  return { bash, zsh, fish }[shell]();
}
