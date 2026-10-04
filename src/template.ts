import { isOperationId, run, type OperationId } from "./registry";

// Syntax: `op{content}`, nestable (`url-encode{to-base64{x}}`).
// Only known operation ids are interpreted: `{x}` and `foo{x}` stay plain text.
// `\{`, `\}` and `\\` produce the literal character.

export type TemplateNode =
  | { type: "text"; value: string }
  | { type: "op"; id: OperationId; children: TemplateNode[]; start: number };

export class TemplateError extends Error {
  constructor(
    message: string,
    readonly position: number,
  ) {
    super(`${message} (position ${position})`);
  }
}

const OP_START = /([a-z0-9]+(?:-[a-z0-9]+)*)\{/y;
const IDENT_CHAR = /[a-z0-9-]/;

export function parse(source: string): TemplateNode[] {
  let i = 0;

  function parseNodes(open: { start: number } | null): TemplateNode[] {
    const nodes: TemplateNode[] = [];
    let text = "";
    const flush = () => {
      if (text) nodes.push({ type: "text", value: text });
      text = "";
    };

    while (i < source.length) {
      const ch = source[i]!;

      if (ch === "\\" && i + 1 < source.length && "{}\\".includes(source[i + 1]!)) {
        text += source[i + 1];
        i += 2;
        continue;
      }

      if (ch === "}" && open) {
        i++;
        flush();
        return nodes;
      }

      if (i === 0 || !IDENT_CHAR.test(source[i - 1]!)) {
        OP_START.lastIndex = i;
        const match = OP_START.exec(source);
        if (match && isOperationId(match[1]!)) {
          flush();
          const start = i;
          i = OP_START.lastIndex;
          nodes.push({ type: "op", id: match[1], children: parseNodes({ start }), start });
          continue;
        }
      }

      text += ch;
      i++;
    }

    if (open) throw new TemplateError("Missing closing brace", open.start);
    flush();
    return nodes;
  }

  return parseNodes(null);
}

function evaluate(nodes: TemplateNode[]): Uint8Array {
  const parts = nodes.map((node) =>
    node.type === "text" ? new TextEncoder().encode(node.value) : run(node.id, evaluate(node.children)),
  );
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

export function renderBytes(source: string): Uint8Array {
  return evaluate(parse(source));
}

export function render(source: string): string {
  return new TextDecoder().decode(renderBytes(source));
}
