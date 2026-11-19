import { createServer } from "node:http";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { Context } from "@deepseek-ai/cordis";
import { HostConnectionService } from "@deepseek-ai/dsh-client-connection";
import SystemPrompt from "@deepseek-ai/dsh-system-prompt";
import Tools from "@deepseek-ai/dsh-tools";
import LocalJobs from "@deepseek-ai/dsh-jobs-local";
import * as plugin from "../../src/index.ts";

const packageRoot = fileURLToPath(new URL("../../", import.meta.url));
const require = createRequire(import.meta.url);
const fixture = await mkdtemp(path.join(tmpdir(), "wandao-browser-"));
const vault = path.join(fixture, "vault");
const outputRoot = path.join(fixture, "exports");
await mkdir(vault);
await mkdir(outputRoot);
await writeFile(path.join(vault, "hello.md"), "# browser-driven export\n");
await writeFile(path.join(vault, "other.md"), "# keep outside selected export\n");
const code = await build({
  absWorkingDir: packageRoot,
  entryPoints: ["test/browser/harness.tsx"],
  bundle: true,
  write: false,
  platform: "browser",
  format: "esm",
  target: "es2022",
  jsx: "automatic",
});
const rendererPath =
  require.resolve("@deepseek-ai/dsh-client-ui-renderer/client");
const ctx = new Context();
const routes = new Map();
const token = randomUUID();
await ctx
  .plugin({
    name: "fixture-webserver",
    apply(owner) {
      owner.provide("webServer", {
        host: "127.0.0.1",
        protocol: "http:",
        register(route) {
          routes.set(route.path, route);
          return () => {
            routes.delete(route.path);
          };
        },
      });
    },
  })
  .await();
let connection;
// Match the real Host: Connection belongs to its own restricted plugin,
// not the unrestricted application root used by the first test fixture.
await ctx
  .plugin({
    name: "fixture-connection",
    inject: [],
    apply(owner) {
      connection = new HostConnectionService(owner, [], {
        isAuthenticated(request) {
          return String(request.headers.cookie).includes(
            `wandao-preview=${token}`,
          );
        },
        authenticateApi() {
          return undefined;
        },
      });
    },
  })
  .await();
await ctx.plugin(SystemPrompt).await();
await ctx.plugin(Tools).await();
await ctx.plugin(LocalJobs).await();
await ctx
  .plugin(plugin, {
    python: process.env.WANDAO_TEST_PYTHON || "python",
    vaultRoots: [vault],
    outputRoot,
    dataDir: path.join(fixture, "state"),
  })
  .await();
const html = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>万能导 · DSH 插件验证</title><style>
html,body,#root{height:100%;margin:0}body{font-family:system-ui,'Microsoft YaHei',sans-serif;background:#fff;color:#25262a;--dsw-alias-bg-base:#fff;--dsw-alias-bg-layer-1:#f5f6f8;--dsw-alias-label-primary:#25262a;--dsw-alias-label-secondary:#777b84;--dsw-alias-border-l4:#e5e7eb;--dsw-alias-brand-primary:#4c6aee;--dsh-frame-top-clearance:16px}.preview-shell{display:flex;height:100%}.preview-shell aside{box-sizing:border-box;display:flex;flex-direction:column;width:250px;padding:18px 12px;background:#f5f5f6;flex-shrink:0}.preview-brand{font-size:26px;font-weight:650;white-space:nowrap;margin:0 6px 26px}.preview-brand small{font-size:10px;border:1px solid currentColor;border-radius:2px;padding:1px 3px;vertical-align:middle}.preview-shell aside button{font-family:inherit;text-align:left;color:inherit;cursor:pointer}.preview-new{height:44px;border:1px solid #d7d9df;border-radius:12px;background:#fff;margin-bottom:20px;text-align:center!important;font-size:16px}.preview-shell nav{display:flex;flex-direction:column;gap:6px}.preview-shell nav button{display:flex;align-items:center;gap:9px;font-size:15px;padding:10px 12px;border:0;border-radius:8px;background:transparent}.preview-shell nav button:hover,.preview-shell nav button[aria-current=page]{background:#e5e6ea}.preview-main{flex:1;min-width:0;height:100%;overflow:hidden}.preview-home{padding:64px;color:#777}.preview-caption{margin-top:auto;font-size:11px;color:#888;padding:16px 8px}@media(prefers-color-scheme:dark){body{background:#202020;color:#ececef;--dsw-alias-bg-base:#202020;--dsw-alias-bg-layer-1:#2b2b2c;--dsw-alias-label-primary:#ececef;--dsw-alias-label-secondary:#999ba1;--dsw-alias-border-l4:#3c3d41;--dsw-alias-brand-primary:#637fea}.preview-shell aside{background:#191919}.preview-new{background:#3c3d41;border-color:#555}.preview-shell nav button:hover,.preview-shell nav button[aria-current=page]{background:#353638}}@media(max-width:767px){.preview-shell aside{width:56px;padding:16px 6px}.preview-brand,.preview-new,.preview-shell nav button:not([aria-current=page]),.preview-caption{display:none}.preview-shell nav button{padding:10px 6px;font-size:0}.preview-shell nav button span{display:none}.preview-shell nav button svg{width:20px;flex-shrink:0}.preview-shell nav{margin-top:25px}}
</style><div id="root"></div><script type="module" src="/harness.js"></script></html>`;
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (
      req.method === "GET" &&
      ["/", "/harness.js", "/client.js", "/renderer.js", "/fixtures"].includes(
        url.pathname,
      )
    ) {
      res.setHeader("cache-control", "no-store");
      if (url.pathname === "/") {
        res.setHeader("content-type", "text/html; charset=utf-8");
        res.setHeader(
          "set-cookie",
          `wandao-preview=${token}; HttpOnly; SameSite=Strict; Path=/`,
        );
        res.end(html);
        return;
      }
      if (!String(req.headers.cookie).includes(`wandao-preview=${token}`)) {
        res.writeHead(401).end();
        return;
      }
      if (url.pathname === "/fixtures") {
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ vault, outputRoot }));
        return;
      }
      res.setHeader("content-type", "application/javascript");
      res.end(
        url.pathname === "/harness.js"
          ? code.outputFiles[0].contents
          : await readFile(
              url.pathname === "/renderer.js"
                ? rendererPath
                : path.join(packageRoot, "dist/client.js"),
            ),
      );
      return;
    }
    if (url.pathname.startsWith("/api/")) {
      const admission = connection.admit({
        headers: req.headers,
        url: url.href,
        method: req.method,
      });
      if ("rejection" in admission) {
        res.writeHead(admission.rejection).end();
        return;
      }
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const response = await connection.createSharedFetchHandler("/api").fetch(
        new Request(url, {
          method: req.method,
          headers: { "content-type": "application/json" },
          body: Buffer.concat(chunks),
        }),
        admission.peer,
      );
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
      return;
    }
    // Simulate deployments where only /api reaches the backend; all other
    // POST paths hit a GET-only page server and receive the reported 405.
    if (req.method === "POST") {
      res.writeHead(405, { allow: "GET, HEAD" }).end();
      return;
    }
    const route = routes.get("/wandao");
    if (route && url.pathname.startsWith("/wandao/")) {
      const admission = connection.admit({
        headers: req.headers,
        url: url.href,
        method: req.method,
      });
      if ("rejection" in admission) {
        res.writeHead(admission.rejection).end();
        return;
      }
      await route.handler(req, res, admission.peer);
      return;
    }
    res.writeHead(404).end();
  } catch (error) {
    console.error(error);
    if (!res.headersSent) res.writeHead(500);
    res.end("Preview error");
  }
});
server.listen(Number(process.env.WANDAO_UI_PORT || 4793), "127.0.0.1", () =>
  console.log(`Wandao UI preview: http://127.0.0.1:${server.address().port}`),
);
async function close() {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
  await ctx.fiber.dispose();
  await rm(fixture, { recursive: true, force: true });
}
process.once("SIGINT", () => {
  void close();
});
process.once("SIGTERM", () => {
  void close();
});
