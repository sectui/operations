import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { expect } from "./test/expect.ts";

const CLI = `${import.meta.dirname}/cli.ts`;

function ops(args: string[], stdin?: string | Uint8Array) {
  const proc = spawnSync(process.execPath, [CLI, ...args], {
    input: stdin,
    stdio: [stdin === undefined ? "ignore" : "pipe", "pipe", "pipe"],
  });
  return { stdout: proc.stdout, text: proc.stdout.toString(), stderr: proc.stderr.toString(), code: proc.status };
}

const which = (command: string) => spawnSync("sh", ["-c", `command -v ${command}`]).status === 0;

test("input from argument or stdin", () => {
  expect(ops(["to-base64", "hello"]).text).toBe("aGVsbG8=");
  expect(ops(["from-base64"], "aGVsbG8=").text).toBe("hello");
});

test("options are generated from operation args", () => {
  expect(ops(["to-hex", "--delimiter", "colon", "--uppercase", "hi?"]).text).toBe("68:69:3F");
  expect(ops(["to-base64", "--no-padding", "??>"]).text).toBe("Pz8+");
  expect(ops(["url-encode", "--encode-all", "a=b"]).text).toBe("a%3Db");
});

test("binary output is written untouched", () => {
  expect(new Uint8Array(ops(["from-base64"], "3q2+7w==").stdout)).toEqual(new Uint8Array([0xde, 0xad, 0xbe, 0xef]));
});

test("render", () => {
  expect(ops(["render", "hi to-base64{hadi}"]).text).toBe("hi aGFkaQ==");
  expect(new Uint8Array(ops(["render", "from-base64{3q2+7w==}"]).stdout)).toEqual(new Uint8Array([0xde, 0xad, 0xbe, 0xef]));
  expect(ops(["render", "--help"]).text).toStartWith("ops render");
});

test("arguments after -- are input, not flags", () => {
  expect(ops(["to-base64", "--", "--help"]).text).toBe("LS1oZWxw");
  expect(ops(["render", "--", "--raw"]).text).toBe("--raw");
});

test("help shows options and examples", () => {
  const { text } = ops(["help", "to-base64"]);
  expect(text).toContain("--no-padding");
  expect(text).toContain("ops to-base64 hello");
  expect(ops(["to-base64", "--help"]).text).toBe(text);
});

test("completions", () => {
  for (const shell of ["bash", "zsh", "fish"]) expect(ops(["completions", shell]).text).toContain("to-base64");
  expect(ops(["completions", "powershell"]).code).toBe(2);
});

test("completion scripts are valid shell", () => {
  for (const shell of ["bash", "zsh"]) {
    if (!which(shell)) continue;
    const check = spawnSync(shell, ["-n"], { input: ops(["completions", shell]).text });
    expect(check.stderr.toString()).toBe("");
    expect(check.status).toBe(0);
  }
});

// `script` gives the CLI a real terminal as stdout.
test("binary output to a terminal is shown as a hexdump", { skip: !which("script") }, () => {
  const inTerminal = (command: string) => spawnSync("script", ["-qec", command, "/dev/null"]).stdout.toString();
  const cli = `${process.execPath} ${CLI}`;
  expect(inTerminal(`${cli} from-base64 G1szMW0=`)).toContain("00000000  1b 5b 33 31 6d");
  expect(inTerminal(`${cli} from-base64 --raw G1szMW0=`)).toContain("\x1b[31m");
  expect(inTerminal(`${cli} to-base64 hi`)).toBe("aGk=\r\n");
});

test("usage errors exit with code 2", () => {
  for (const args of [["nope"], ["to-base64", "--bad", "x"], ["to-hex", "--delimiter", "foo", "x"]]) {
    const result = ops(args);
    expect(result.code).toBe(2);
    expect(result.stderr).toStartWith("ops: ");
  }
});

test("operation errors exit with code 1 and name the operation", () => {
  const result = ops(["from-base64", "--strict", "a!"]);
  expect(result.code).toBe(1);
  expect(result.stderr).toBe('ops: from-base64: Invalid Base64: unexpected character "!" at offset 1\n');
});
