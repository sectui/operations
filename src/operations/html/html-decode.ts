import { defineOperation } from "../../operation.ts";
import { NAMED_ENTITIES } from "./entities.ts";

const ENTITY = /&(?:#(\d+)|#x([0-9a-f]+)|([a-z][a-z0-9]*));/gi;

function fromCodePoint(code: number): string {
  // NUL, surrogates and out of range values are replaced, as browsers do.
  if (code === 0 || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) return "�";
  return String.fromCodePoint(code);
}

export const htmlDecode = defineOperation({
  id: "html-decode",
  name: "HTML Decode",
  description:
    'Decodes HTML entities: numeric (&#233; &#xE9;) and named HTML 4 ones (&eacute; &amp; ...). Unknown entities are left as is. e.g. "&lt;b&gt;" becomes "<b>".',
  category: "Encoding",
  output: "binary",
  aliases: ["html unescape", "html entities"],
  inverse: "html-encode",
  infoUrl: "https://wikipedia.org/wiki/Character_encodings_in_HTML",
  args: {},
  examples: [
    { input: "&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&lt;/a&gt;", output: '<a href="x">Tom & Jerry</a>' },
    { input: "caf&eacute; &#8364; &#x263A; &unknown;", output: "café € ☺ &unknown;" },
  ],
  run(input) {
    const text = new TextDecoder().decode(input).replace(ENTITY, (entity, dec?: string, hex?: string, name?: string) => {
      if (dec) return fromCodePoint(Number(dec));
      if (hex) return fromCodePoint(parseInt(hex, 16));
      const code = NAMED_ENTITIES.get(name!);
      return code === undefined ? entity : String.fromCodePoint(code);
    });
    return new TextEncoder().encode(text);
  },
});
