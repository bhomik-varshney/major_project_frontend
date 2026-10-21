import { build } from "esbuild";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const result = await build({
  entryPoints: [resolve(root, "src/mcp-apps/application.ts")],
  bundle: true,
  format: "esm",
  target: "es2022",
  platform: "browser",
  minify: true,
  write: false,
  legalComments: "none",
});
const code = result.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
const output = resolve(root, "../major_project_backend/app/mcp/ui/application.html");
await mkdir(dirname(output), { recursive: true });
await writeFile(
  output,
  `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Application review</title></head><body><div id="app">Connecting to your workspace…</div><script type="module">${code}</script></body></html>\n`,
);
console.log("Built self-contained application MCP resource");
