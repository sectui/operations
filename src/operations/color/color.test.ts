import { test } from "node:test";
import { expect } from "../../test/expect.ts";
import { run, runText } from "../../registry.ts";

test("hex-to-rgb", () => {
  expect(runText("hex-to-rgb", "  #000  ")).toBe("rgb(0, 0, 0)");
  expect(runText("hex-to-rgb", "#fff0")).toBe("rgba(255, 255, 255, 0)");
  expect(runText("hex-to-rgb", "#ff880080", { format: "values" })).toBe("255, 136, 0, 0.502");
  expect(runText("hex-to-rgb", "#fff\n\n#000\n")).toBe("rgb(255, 255, 255)\n\nrgb(0, 0, 0)\n");
});

test("hex-to-rgb rejects invalid colors", () => {
  expect(() => run("hex-to-rgb", "#12345")).toThrow('Invalid hex color "#12345"');
  expect(() => run("hex-to-rgb", "red")).toThrow("Invalid hex color");
});
