import { readFileSync } from "node:fs";
import { build } from "esbuild";

const { version, description } = JSON.parse(readFileSync("package.json", "utf8")) as { version: string; description: string };

await build({
  entryPoints: ["src/cli.ts"],
  outfile: "dist/ops.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node26",
  conditions: ["source"],
  // There is no package.json next to the bundle: inline what the CLI reads from it.
  define: { BUNDLED_PACKAGE: JSON.stringify({ version, description }) },
  // yaml is CommonJS and calls require().
  banner: {
    js: "import { createRequire as __bannerCreateRequire } from 'node:module'; const require = __bannerCreateRequire(import.meta.url);",
  },
});
