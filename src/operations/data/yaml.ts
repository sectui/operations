import YAML from "yaml";
import { OperationError } from "../../errors.ts";
import { defineOperation } from "../../operation.ts";
import { mapText } from "../text/lines.ts";
import { INDENT_STRINGS, JSON_INDENTS, parseJson } from "./json.ts";

export const jsonToYaml = defineOperation({
  id: "json-to-yaml",
  name: "JSON to YAML",
  description: 'Converts JSON to YAML. Strings that some YAML parsers would read as another type, such as "yes", are quoted.',
  category: "Data format",
  output: "binary",
  aliases: ["yaml"],
  inverse: "yaml-to-json",
  infoUrl: "https://yaml.org",
  args: {},
  examples: [
    { input: '{"name":"ops","tags":["a","b"],"count":1}', output: "name: ops\ntags:\n  - a\n  - b\ncount: 1\n" },
    { input: '{"enabled":"yes"}', output: 'enabled: "yes"\n' },
  ],
  run: (input) =>
    mapText(input, (text) => {
      parseJson(text);
      // JSON is valid YAML: parsing it as such keeps large integers exact.
      // YAML 1.1 rules quote strings like "yes" or "off" that older parsers would read as booleans.
      return YAML.stringify(YAML.parse(text, { intAsBigInt: true }), { version: "1.1" });
    }),
});

export const yamlToJson = defineOperation({
  id: "yaml-to-json",
  name: "YAML to JSON",
  description: "Converts a YAML document to JSON.",
  category: "Data format",
  output: "binary",
  aliases: ["yml", "yaml"],
  inverse: "json-to-yaml",
  infoUrl: "https://yaml.org",
  args: {
    indent: { type: "select", name: "Indentation", options: JSON_INDENTS, default: "2" },
  },
  examples: [
    { input: "name: ops\ntags: [a, b]\nn: 1\n", args: { indent: "minify" }, output: '{"name":"ops","tags":["a","b"],"n":1}' },
    { input: "a:\n  - true\n  - ~\n", output: '{\n  "a": [\n    true,\n    null\n  ]\n}' },
  ],
  run: (input, { indent }) =>
    mapText(input, (text) => {
      let value: unknown;
      try {
        value = YAML.parse(text);
      } catch (error) {
        throw new OperationError(`Invalid YAML: ${(error as Error).message}`);
      }
      return JSON.stringify(value ?? null, null, INDENT_STRINGS[indent]);
    }),
});
