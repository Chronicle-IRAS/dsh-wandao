import { build } from "esbuild";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const result = await build({
  absWorkingDir: root,
  entryPoints: ["src/client/index.tsx"],
  bundle: true,
  write: false,
  format: "cjs",
  platform: "browser",
  target: "es2022",
  jsx: "automatic",
  external: ["react", "react/jsx-runtime"],
  loader: { ".css": "text" },
  minify: true,
});
await mkdir(new URL("../dist/", import.meta.url), { recursive: true });
await writeFile(
  new URL("../dist/client.js", import.meta.url),
  `window.__ModuleLoader__.load({id:"@chronicle-iras/dsh-wandao",factory:(require)=>{var module={exports:{}};var exports=module.exports;${result.outputFiles[0].text}\nreturn module.exports;}});\n`,
);
