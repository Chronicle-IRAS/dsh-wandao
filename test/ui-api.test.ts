import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { Context } from "@deepseek-ai/cordis";
import Tools from "@deepseek-ai/dsh-tools";
import SystemPrompt from "@deepseek-ai/dsh-system-prompt";
import LocalJobs from "@deepseek-ai/dsh-jobs-local";
import * as plugin from "../src/index.ts";
import { HostConnectionService } from "@deepseek-ai/dsh-client-connection";

async function setup(t: test.TestContext) {
  const root = await mkdtemp(path.join(os.tmpdir(), "wandao-page-"));
  const vault = path.join(root, "vault");
  const outputRoot = path.join(root, "output");
  await mkdir(vault);
  await mkdir(outputRoot);
  await writeFile(path.join(vault, "hello.md"), "# page export\n");
  const ctx = new Context();
  ctx.provide("webServer", {} as any);
  const connection = new HostConnectionService(ctx, [], {} as any);
  const fetchRoutes = (connection as any).fetchRoutes as Map<string, any>;
  const guest = connection.createPeer({ principal: { kind: "guest" } as any });
  await ctx.plugin(SystemPrompt).await();
  await ctx.plugin(Tools).await();
  await ctx.plugin(LocalJobs).await();
  await ctx
    .plugin(plugin, {
      python: process.env.WANDAO_TEST_PYTHON || "python",
      vaultRoots: [vault],
      outputRoot,
      dataDir: path.join(root, "state"),
    })
    .await();
  t.after(async () => {
    await ctx.fiber.dispose();
    await rm(root, { recursive: true, force: true });
  });
  const call = async (endpoint: string, payload = {}, kind = "owner") => {
    const response = await connection
      .createSharedFetchHandler("/api")
      .fetch(
        new Request(`http://localhost/api/wandao/${endpoint}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            type: "client-request",
            rpcId: "ui-test",
            method: `wandao/${endpoint}`,
            payload,
          }),
        }),
        kind === "owner" ? connection.browserPeer : guest,
      );
    if (response.status === 403)
      return { ok: false, error: { code: "wandao/forbidden" } };
    assert.equal(response.status, 200);
    return (await response.json()).result;
  };
  return { ctx, root, vault, outputRoot, call, fetchRoutes };
}

test("page endpoints are registered under the shared API prefix with validated RPC envelopes", async (t) => {
  const { fetchRoutes } = await setup(t);
  const route = fetchRoutes.get("/api/wandao/catalogue");
  assert.ok(
    route,
    "page API must be reachable through the standard /api transport",
  );
  assert.deepEqual([...route.methods], ["POST"]);
  const response = await route.fetch(
    new Request("http://localhost/api/wandao/catalogue", {
      method: "POST",
      body: JSON.stringify({
        type: "client-request",
        rpcId: "test-rpc",
        method: "wandao/catalogue",
        payload: {},
      }),
    }),
  );
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.rpcId, "test-rpc");
  assert.equal(body.result.ok, true);
  const invalid = await route.fetch(
    new Request("http://localhost/api/wandao/catalogue", {
      method: "POST",
      body: JSON.stringify({
        type: "client-request",
        rpcId: "test-rpc",
        method: "wandao/start",
        payload: {},
      }),
    }),
  );
  assert.equal(invalid.status, 400);
});

test("UI channel denies non-owner callers before listing platforms or starting work", async (t) => {
  const { ctx, call } = await setup(t);
  for (const endpoint of ["catalogue", "start", "saveCredentials"]) {
    const denied = await call(endpoint, {}, "guest");
    assert.equal(denied.ok, false);
    assert.equal(denied.error.code, "wandao/forbidden");
  }
  assert.equal(ctx.jobs.list().length, 0);
});

test("UI exports through its isolated registry and cannot inspect an agent task", async (t) => {
  const { ctx, call, vault, outputRoot } = await setup(t);
  const catalogue = await call("catalogue");
  assert.ok(
    catalogue.value.providers.some((p: any) => p.id === "obsidian-export"),
  );
  const started = await call("start", {
    providerId: "obsidian-export",
    actionId: "export",
    fields: {
      vault,
      output: path.join(outputRoot, "archive"),
      auto_output_folder: false,
    },
  });
  assert.equal(started.ok, true, JSON.stringify(started));
  assert.ok(
    !ctx.jobs
      .list("another-session" as any)
      .some((job) => job.id === started.value.jobId),
    "UI task leaked into the shared agent job registry",
  );
  for (let i = 0; i < 100; i++) {
    const current = await call("task", { jobId: started.value.jobId });
    if (current.value.status !== "running") break;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  const status = await call("task", { jobId: started.value.jobId });
  assert.equal(status.value.status, "completed");
  assert.match(
    await readFile(path.join(outputRoot, "archive", "hello.md"), "utf8"),
    /page export/,
  );
  const agent = (await ctx.tools
    .get("wandao_export")!
    .execute({ vault, destination: path.join(outputRoot, "agent") }, {
      signal: new AbortController().signal,
    } as any)) as any;
  const denied = await call("task", { jobId: agent.jobId });
  assert.equal(denied.ok, false);
  const own = await call("tasks");
  assert.deepEqual(
    own.value.tasks.map((task: any) => task.jobId),
    [started.value.jobId],
  );
});

test("a page task can be cancelled and stays inaccessible to generic agent job controls", async (t) => {
  const { ctx, call, vault, outputRoot } = await setup(t);
  const task = await call("start", {
    providerId: "obsidian-export",
    actionId: "export",
    fields: { vault, output: path.join(outputRoot, "cancel") },
  });
  assert.equal(task.ok, true);
  assert.throws(() => ctx.jobs.get(task.value.jobId, "other-session" as any));
  assert.equal((await call("cancel", { jobId: task.value.jobId })).ok, true);
  for (let i = 0; i < 150; i++) {
    const current = await call("task", { jobId: task.value.jobId });
    if (current.value.status !== "running") {
      assert.equal(current.value.status, "killed");
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  assert.fail("cancelled UI task did not settle");
});

test("private credentials are saved without being returned and imports remain confirmation-gated", async (t) => {
  const { root, call } = await setup(t);
  const description = await call("describe", { providerId: "ima-export" });
  assert.ok(
    description.value.fields.find(
      (f: any) => f.name === "api_key" && f.private,
    ),
  );
  const saved = await call("saveCredentials", {
    providerId: "ima-export",
    fields: { client_id: "local-client", api_key: "local-secret" },
  });
  assert.equal(saved.ok, true, JSON.stringify(saved));
  assert.doesNotMatch(JSON.stringify(saved), /local-secret|local-client/);
  assert.equal(
    JSON.parse(
      await readFile(path.join(root, "state", "ima", "settings.json"), "utf8"),
    ).api_key,
    "local-secret",
  );
  const invalid = await call("saveCredentials", {
    providerId: "ima-export",
    fields: { output: "arbitrary" },
  });
  assert.equal(invalid.ok, false);
  const denied = await call("start", {
    providerId: "yuque-import",
    actionId: "import",
    fields: {},
  });
  assert.equal(denied.ok, false);
  const metadata = await call("describe", { providerId: "obsidian-export" });
  assert.equal(
    metadata.value.fields.find((f: any) => f.name === "auto_output_folder")
      .default,
    true,
  );
  assert.equal(metadata.value.toc.exportIdKey, "exportId");
  const yinxiang = await call("describe", { providerId: "yinxiang" });
  assert.ok(
    yinxiang.value.fields.some(
      (field: any) => field.name === "password" && field.private,
    ),
  );
  assert.equal(
    (
      await call("saveCredentials", {
        providerId: "yinxiang",
        fields: { password: "local-password" },
      })
    ).ok,
    true,
  );
});
