// C0 controls except tab/LF/CR, DEL, C1 controls (e.g. U+009B is a CSI on some terminals),
// and bidi overrides that can make text display differently from its content.
const UNSAFE_CHARS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f‪-‮⁦-⁩]/;

/** True if the bytes are valid UTF-8 text without characters that can control a terminal. */
export function isPrintable(bytes: Uint8Array): boolean {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return false;
  }
  return !UNSAFE_CHARS.test(text);
}

/** Canonical hex+ASCII dump, like `hexdump -C`. */
export function hexdump(bytes: Uint8Array): string {
  const lines: string[] = [];
  for (let offset = 0; offset < bytes.length; offset += 16) {
    const row = bytes.subarray(offset, offset + 16);
    const hex = [...row].map((b) => b.toString(16).padStart(2, "0"));
    const left = hex.slice(0, 8).join(" ");
    const right = hex.slice(8).join(" ");
    const ascii = [...row].map((b) => (b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : ".")).join("");
    lines.push(`${offset.toString(16).padStart(8, "0")}  ${left.padEnd(23)}  ${right.padEnd(23)}  |${ascii}|`);
  }
  lines.push(bytes.length.toString(16).padStart(8, "0"));
  return lines.join("\n");
}
