import { OperationError } from "../../errors.ts";
import { defineOperation } from "../../operation.ts";
import { mapLines, mapText } from "../text/lines.ts";

const FORMATS = [
  { value: "css", label: "CSS: rgb(255, 136, 0) or rgba(255, 136, 0, 0.5)" },
  { value: "values", label: "Values: 255, 136, 0" },
] as const;

function toRgb(color: string, format: (typeof FORMATS)[number]["value"]): string {
  const hex = color.trim().replace(/^#/, "");
  if (!/^(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(hex)) {
    throw new OperationError(`Invalid hex color "${color.trim()}": expected #rgb, #rgba, #rrggbb or #rrggbbaa`);
  }
  const full = hex.length <= 4 ? [...hex].map((c) => c + c).join("") : hex;
  const [r, g, b, a] = full.match(/../g)!.map((pair) => parseInt(pair, 16));
  const values = [r, g, b];
  // Alpha as a fraction, rounded to what 8 bits can tell apart.
  if (a !== undefined) values.push(Math.round((a / 255) * 1000) / 1000);
  if (format === "values") return values.join(", ");
  return `${a === undefined ? "rgb" : "rgba"}(${values.join(", ")})`;
}

export const hexToRgb = defineOperation({
  id: "hex-to-rgb",
  name: "Hex to RGB",
  description: 'Converts hex colors (one per line) to RGB. e.g. "#ff8800" becomes "rgb(255, 136, 0)".',
  category: "Data format",
  output: "binary",
  aliases: ["color", "colour", "css color"],
  infoUrl: "https://developer.mozilla.org/docs/Web/CSS/hex-color",
  args: {
    format: { type: "select", name: "Format", options: FORMATS, default: "css" },
  },
  examples: [
    { input: "#ff8800", output: "rgb(255, 136, 0)" },
    { input: "#f80\n#FF880080", output: "rgb(255, 136, 0)\nrgba(255, 136, 0, 0.502)" },
    { input: "ff8800", args: { format: "values" }, output: "255, 136, 0" },
  ],
  run: (input, { format }) =>
    mapText(input, (text) => mapLines(text, (lines) => lines.map((line) => (line.trim() ? toRgb(line, format) : line)))),
});
