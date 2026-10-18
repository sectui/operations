import { defineOperation } from "../../operation.ts";
import { mapText } from "../text/lines.ts";
import { formatJson, INDENT_STRINGS, JSON_INDENTS } from "./json.ts";

export const jsonFormat = defineOperation({
  id: "json-format",
  name: "JSON format",
  description: "Pretty-prints or minifies JSON. Numbers are kept digit for digit, and keys in their original order.",
  category: "Data format",
  output: "binary",
  aliases: ["json beautify", "json prettify", "json minify", "jq"],
  infoUrl: "https://www.json.org",
  args: {
    indent: {
      type: "select",
      name: "Indentation",
      options: JSON_INDENTS,
      default: "2",
    },
  },
  examples: [
    {
      input: '{"a":1,"b":[true,null],"c":{}}',
      output: '{\n  "a": 1,\n  "b": [\n    true,\n    null\n  ],\n  "c": {}\n}',
    },
    {
      input: '{ "id": 12345678901234567890,\n  "tags": [ "x" ] }',
      args: { indent: "minify" },
      output: '{"id":12345678901234567890,"tags":["x"]}',
    },
  ],
  run: (input, { indent }) => mapText(input, (text) => formatJson(text, INDENT_STRINGS[indent])),
});
