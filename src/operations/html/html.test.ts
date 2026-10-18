import { test } from "node:test";
import { expect } from "../../test/expect.ts";
import { runText } from "../../registry.ts";

test("html-encode", () => {
  expect(runText("html-encode", `<'&">`)).toBe("&lt;&#39;&amp;&quot;&gt;");
  expect(runText("html-encode", "é😀", { encodeNonAscii: true })).toBe("&#233;&#128512;");
});

test("html-decode", () => {
  expect(runText("html-decode", "&nbsp;&yuml;&hellip;&apos;")).toBe(" ÿ…'");
  expect(runText("html-decode", "&#X41;&#x1F600;")).toBe("A😀");
  // Invalid code points become U+FFFD; decoding happens once.
  expect(runText("html-decode", "&#0;&#x110000;&#xD800;")).toBe("���");
  expect(runText("html-decode", "&amp;lt; & &; &nope;")).toBe("&lt; & &; &nope;");
});

test("round trip", () => {
  const text = `<p class="x">Tom & 'Jérôme' 😀</p>`;
  for (const encodeNonAscii of [false, true]) {
    expect(runText("html-decode", runText("html-encode", text, { encodeNonAscii }))).toBe(text);
  }
});
