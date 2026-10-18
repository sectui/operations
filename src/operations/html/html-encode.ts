import { defineOperation } from "../../operation.ts";

const SPECIAL: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export const htmlEncode = defineOperation({
  id: "html-encode",
  name: "HTML Encode",
  description: 'Escapes & < > " and \' as HTML entities. e.g. "<b>" becomes "&lt;b&gt;".',
  category: "Encoding",
  output: "binary",
  aliases: ["html escape", "html entities"],
  inverse: "html-decode",
  infoUrl: "https://wikipedia.org/wiki/Character_encodings_in_HTML",
  args: {
    encodeNonAscii: {
      type: "boolean",
      name: "Encode non-ASCII characters",
      description: "Also write characters outside ASCII as numeric entities, e.g. é as &#233;.",
      default: false,
    },
  },
  examples: [
    { input: '<a href="x">Tom & Jerry</a>', output: "&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&lt;/a&gt;" },
    { input: "café €", args: { encodeNonAscii: true }, output: "caf&#233; &#8364;" },
  ],
  run(input, { encodeNonAscii }) {
    const pattern = encodeNonAscii ? /[&<>"']|[^\x00-\x7f]/gu : /[&<>"']/g;
    const text = new TextDecoder().decode(input).replace(pattern, (ch) => SPECIAL[ch] ?? `&#${ch.codePointAt(0)};`);
    return new TextEncoder().encode(text);
  },
});
