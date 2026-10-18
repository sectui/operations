import { defineOperation } from "../../operation.ts";
import { mapText } from "../text/lines.ts";

const OCTET = "(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)";
// Not part of a longer dotted sequence such as a version number (1.2.3.4.5).
const IPV4 = new RegExp(`(?<![\\d.])${OCTET}(?:\\.${OCTET}){3}(?!\\.?\\d)`, "g");
// Candidates, checked by isIPv6: runs of hex digits, colons and dots with at least two colons.
const IPV6_CANDIDATE = /(?<![\w:.])[0-9a-f]*:[0-9a-f.:]*:[0-9a-f.]*(?![\w:])/gi;
const IPV4_EXACT = new RegExp(`^${OCTET}(?:\\.${OCTET}){3}$`);

export function isIPv6(text: string): boolean {
  const halves = text.split("::");
  if (halves.length > 2) return false;
  let groups = 0;
  for (const [h, half] of halves.entries()) {
    if (half === "") continue;
    const parts = half.split(":");
    for (const [i, part] of parts.entries()) {
      // An embedded IPv4 address (::ffff:1.2.3.4) counts as two groups and must come last.
      if (h === halves.length - 1 && i === parts.length - 1 && IPV4_EXACT.test(part)) groups += 2;
      else if (/^[0-9a-f]{1,4}$/i.test(part)) groups++;
      else return false;
    }
  }
  return halves.length === 2 ? groups < 8 : groups === 8;
}

interface Match {
  index: number;
  value: string;
}

function* matches(text: string, pattern: RegExp): Generator<Match> {
  for (const m of text.matchAll(pattern)) yield { index: m.index, value: m[0] };
}

const listArgs = {
  unique: { type: "boolean", name: "Unique", description: "Only list each value once.", default: false },
  sort: { type: "boolean", name: "Sort", default: false },
} as const;

function list(found: Iterable<Match>, { unique, sort }: { unique: boolean; sort: boolean }): string {
  let values = [...found].sort((a, b) => a.index - b.index).map((m) => m.value);
  if (unique) values = [...new Set(values)];
  if (sort) values.sort();
  return values.join("\n");
}

const IP_VERSIONS = [
  { value: "both", label: "IPv4 and IPv6" },
  { value: "ipv4", label: "IPv4 only" },
  { value: "ipv6", label: "IPv6 only" },
] as const;

export const extractIps = defineOperation({
  id: "extract-ips",
  name: "Extract IP addresses",
  description: "Lists the IPv4 and IPv6 addresses found in the text, one per line.",
  category: "Extractors",
  output: "binary",
  aliases: ["ipv4", "ipv6", "find ip", "grep ip"],
  args: {
    version: { type: "select", name: "Version", options: IP_VERSIONS, default: "both" },
    ...listArgs,
  },
  examples: [
    { input: "from 10.0.0.1 to 2001:db8::1, not 1.2.3.4.5 or 256.1.1.1", output: "10.0.0.1\n2001:db8::1" },
    { input: "::1 ::ffff:192.168.1.1 8.8.8.8", args: { version: "ipv4" }, output: "8.8.8.8" },
  ],
  run(input, { version, unique, sort }) {
    return mapText(input, (text) => {
      const v6 = [...matches(text, IPV6_CANDIDATE)]
        // Drop the final dot of a sentence.
        .map((m) => ({ index: m.index, value: m.value.replace(/\.$/, "") }))
        .filter((m) => isIPv6(m.value));
      // IPv4 addresses embedded in an IPv6 one are not listed on their own.
      const v4 = [...matches(text, IPV4)].filter((m) => !v6.some((v) => m.index >= v.index && m.index < v.index + v.value.length));
      const found = version === "ipv4" ? v4 : version === "ipv6" ? v6 : [...v4, ...v6];
      return list(found, { unique, sort });
    });
  },
});

const EMAIL =
  /[\p{L}\p{N}!#$%&'*+/=?^_`{|}~-]+(?:\.[\p{L}\p{N}!#$%&'*+/=?^_`{|}~-]+)*@(?:[\p{L}\p{N}](?:[\p{L}\p{N}-]*[\p{L}\p{N}])?\.)+\p{L}[\p{L}\p{N}-]*[\p{L}\p{N}]/gu;

export const extractEmails = defineOperation({
  id: "extract-emails",
  name: "Extract email addresses",
  description: "Lists the email addresses found in the text, one per line.",
  category: "Extractors",
  output: "binary",
  aliases: ["find email", "grep email"],
  args: listArgs,
  examples: [
    { input: "Contact: <john.doe@example.com>, jane+tag@mail.example.org.", output: "john.doe@example.com\njane+tag@mail.example.org" },
    { input: "b@x.io a@x.io b@x.io", args: { unique: true, sort: true }, output: "a@x.io\nb@x.io" },
  ],
  run: (input, args) => mapText(input, (text) => list(matches(text, EMAIL), args)),
});

// A scheme followed by "://", up to whitespace, quotes or angle brackets.
const URL_PATTERN = /\b[a-z][a-z0-9+.-]*:\/\/[^\s<>"'`]+/gi;

/** Removes punctuation that more likely ends the sentence than the URL, and unbalanced closing brackets. */
function trimUrl(url: string): string {
  for (;;) {
    const last = url.at(-1)!;
    if (/[.,;:!?*]/.test(last)) url = url.slice(0, -1);
    else if (last === ")" && url.split("(").length < url.split(")").length) url = url.slice(0, -1);
    else if (last === "]" && url.split("[").length < url.split("]").length) url = url.slice(0, -1);
    else return url;
  }
}

export const extractUrls = defineOperation({
  id: "extract-urls",
  name: "Extract URLs",
  description: "Lists the URLs (anything like scheme://...) found in the text, one per line.",
  category: "Extractors",
  output: "binary",
  aliases: ["find url", "grep url", "links"],
  args: listArgs,
  examples: [
    {
      input: "See https://example.com/a?b=1, (or http://wiki.org/A_(b)) and ftp://x.org/file.",
      output: "https://example.com/a?b=1\nhttp://wiki.org/A_(b)\nftp://x.org/file",
    },
  ],
  run: (input, args) =>
    mapText(input, (text) => {
      const urls = [...matches(text, URL_PATTERN)].map((m) => ({ index: m.index, value: trimUrl(m.value) }));
      return list(urls, args);
    }),
});
