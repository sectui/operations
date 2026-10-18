import { test } from "node:test";
import { expect } from "../../test/expect.ts";
import { runText } from "../../registry.ts";

test("extract-ips", () => {
  const text =
    "fe80::1 2001:0db8:85a3:0000:0000:8a2e:0370:7334. time 12:30:45 mac 00:11:22:33:44:55 " +
    "::ffff:1.2.3.4 1:2:3:4:5:6:7:8:9 1.2.3 999.1.1.1";
  expect(runText("extract-ips", text)).toBe("fe80::1\n2001:0db8:85a3:0000:0000:8a2e:0370:7334\n::ffff:1.2.3.4");
  expect(runText("extract-ips", text, { version: "ipv4" })).toBe("");
  expect(runText("extract-ips", "8.8.8.8 1.1.1.1 8.8.8.8", { unique: true, sort: true })).toBe("1.1.1.1\n8.8.8.8");
});

test("extract-urls trims surrounding punctuation", () => {
  const text = '<a href="https://x.com/p">x</a> [link](https://md.org/x) https://a.b/c?d=e#f!';
  expect(runText("extract-urls", text)).toBe("https://x.com/p\nhttps://md.org/x\nhttps://a.b/c?d=e#f");
});

test("extract-emails", () => {
  expect(runText("extract-emails", "mailto:Bob@Exämple.fr; x@y; a.b@c.co.uk.")).toBe("Bob@Exämple.fr\na.b@c.co.uk");
});
