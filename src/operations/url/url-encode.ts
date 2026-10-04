import { defineOperation } from "../../operation";

// RFC 3986 unreserved characters.
const UNRESERVED = /[A-Za-z0-9\-_.~]/;
// Characters also left untouched by `encodeURI`.
const URI_SAFE = /[A-Za-z0-9\-_.~!*'();/?:@&=+$,#]/;

export const urlEncode = defineOperation({
  id: "url-encode",
  name: "URL Encode",
  description:
    "Encodes bytes as %XX sequences (percent-encoding). e.g. \"a b\" becomes \"a%20b\".",
  category: "Encoding",
  aliases: ["percent encode", "urlencode"],
  inverse: "url-decode",
  infoUrl: "https://wikipedia.org/wiki/Percent-encoding",
  args: {
    encodeAll: {
      type: "boolean",
      name: "Encode all special chars",
      description: "Also encode reserved characters such as / ? & = (like encodeURIComponent).",
      default: false,
    },
  },
  run(input, { encodeAll }) {
    const keep = encodeAll ? UNRESERVED : URI_SAFE;
    let out = "";
    for (const byte of input) {
      const ch = String.fromCharCode(byte);
      out += byte < 0x80 && keep.test(ch) ? ch : "%" + byte.toString(16).toUpperCase().padStart(2, "0");
    }
    return new TextEncoder().encode(out);
  },
});
