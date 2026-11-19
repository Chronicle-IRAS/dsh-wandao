import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { Context } from '@deepseek-ai/cordis';
import Tools from '@deepseek-ai/dsh-tools';
import SystemPrompt from '@deepseek-ai/dsh-system-prompt';
import LocalJobs from '@deepseek-ai/dsh-jobs-local';
import type { ToolRunContext } from '@deepseek-ai/dsh-tools';
import { ToolExecutionPipeline } from '@deepseek-ai/dsh-tools/pipeline';
import * as plugin from '../src/index.ts';

async function setup(t: test.TestContext) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'wandao-dsh-host-'));
  const vault = path.join(root, 'vault');
  const outputRoot = path.join(root, 'output');
  await mkdir(vault); await mkdir(outputRoot);
  await writeFile(path.join(vault, 'hello.md'), '# DSH export\n');
  const ctx = new Context();
  await ctx.plugin(SystemPrompt).await();
  await ctx.plugin(Tools).await();
  await ctx.plugin(LocalJobs).await();
  const fiber = ctx.plugin(plugin, {
    python: process.env.WANDAO_TEST_PYTHON || 'python', vaultRoots: [vault], outputRoot,
    dataDir: path.join(root, 'state'),
  });
  t.after(async () => { await ctx.fiber.dispose(); await rm(root, { recursive: true, force: true }); });
  await fiber.await();
  async function call(name: string, args: unknown, signal = new AbortController().signal) {
    const tool = ctx.tools.get(name);
    assert.ok(tool, `tool ${name} was not registered`);
    return tool.execute(args, { name, signal } as ToolRunContext) as Promise<any>;
  }
  return { ctx, fiber, root, vault, outputRoot, call };
}

test('assembled plugin exposes capabilities and scans through a real tool definition', async (t) => {
  const { ctx, call, vault } = await setup(t);
  assert.deepEqual(ctx.tools.schemas().map((s) => s.name).sort(), ['wandao_action', 'wandao_describe', 'wandao_export', 'wandao_login_done', 'wandao_providers', 'wandao_scan', 'wandao_task_cancel', 'wandao_task_status']);
  const providers = await call('wandao_providers', {});
  assert.equal(providers.providers.find((p: any) => p.id === 'obsidian-export').loginRequired, false);
  const result = await call('wandao_scan', { vault });
  assert.equal(result.totalDocs, 1);
});

test('a DSH background job exports files and status stays readable after completion', async (t) => {
  const { ctx, call, vault, outputRoot } = await setup(t);
  const destination = path.join(outputRoot, 'archive');
  const task = await call('wandao_export', { vault, destination });
  assert.equal(task.kind, 'background');
  await ctx.jobs.wait(task.jobId, 10000);
  const status = await call('wandao_task_status', { jobId: task.jobId });
  assert.equal(status.status, 'completed');
  assert.equal(status.result.outcome, 'completed');
  assert.equal((await call('wandao_task_status', { jobId: task.jobId })).result.exportedDocs, 1);
  assert.deepEqual((await readFile(path.join(destination, 'hello.md'), 'utf8')).split(/\r?\n/), ['# DSH export', '']);
});

test('cancelling a registered job settles it as killed and does not report success', async (t) => {
  const { ctx, call, vault, outputRoot } = await setup(t);
  const task = await call('wandao_export', { vault, destination: path.join(outputRoot, 'cancel') });
  await call('wandao_task_cancel', { jobId: task.jobId });
  await ctx.jobs.wait(task.jobId, 10000);
  const result = await call('wandao_task_status', { jobId: task.jobId });
  assert.equal(result.status, 'killed');
});

test('tool validation rejects missing args, unknown jobs and pre-aborted exports', async (t) => {
  const { ctx, call, vault, outputRoot } = await setup(t);
  await assert.rejects(call('wandao_export', { vault }));
  await assert.rejects(call('wandao_task_status', { jobId: 'not-a-wandao-job' }));
  const abort = new AbortController(); abort.abort();
  await assert.rejects(call('wandao_export', { vault, destination: path.join(outputRoot, 'cancel') }, abort.signal), { name: 'AbortError' });
  assert.equal(ctx.jobs.list().length, 0);
});

test('plugin disposal withdraws tools and awaits its running jobs', async (t) => {
  const { ctx, fiber, call, vault, outputRoot } = await setup(t);
  const task = await call('wandao_export', { vault, destination: path.join(outputRoot, 'dispose') });
  await fiber.dispose();
  assert.equal(ctx.tools.get('wandao_export'), undefined);
  assert.equal(ctx.jobs.get(task.jobId).status, 'killed');
});

test('partial export retains its real outcome in the DSH terminal summary', async (t) => {
  const { ctx, call, vault, outputRoot } = await setup(t);
  await writeFile(path.join(vault, 'hello.md'), '![missing](lost.png)');
  const task = await call('wandao_export', { vault, destination: path.join(outputRoot, 'partial') });
  await ctx.jobs.wait(task.jobId, 10000);
  const status = await call('wandao_task_status', { jobId: task.jobId });
  assert.equal(status.status, 'failed');
  assert.equal(status.result.outcome, 'partial');
  assert.equal(status.result.resourceFailureCount, 1);
});

test('DSH execution pipeline accepts and renders export result schemas', async (t) => {
  const { ctx, vault, outputRoot } = await setup(t);
  const pipeline = new ToolExecutionPipeline(ctx);
  async function invoke(name: string, args: unknown) {
    const prepared = await pipeline.prepare({ callId: `test-${name}` as any, name, arguments: args, signal: new AbortController().signal });
    const outcome = prepared.kind === 'dispatch' ? await pipeline.dispatch(prepared.exec) : prepared;
    const result = await pipeline.complete(prepared.exec, outcome);
    assert.equal(result.isError, false, JSON.stringify(result));
    return result.isError ? null : result.value as any;
  }
  const directory = await invoke('wandao_scan', { vault });
  assert.equal(directory.totalDocs, 1);
  const task = await invoke('wandao_export', { vault, destination: path.join(outputRoot, 'pipeline') });
  await ctx.jobs.wait(task.jobId, 10000);
  const status = await invoke('wandao_task_status', { jobId: task.jobId });
  assert.equal(status.result.exportedDocs, 1);
  const generic = await invoke('wandao_action', { providerId: 'obsidian-export', actionId: 'scan', fields: { vault } });
  await ctx.jobs.wait(generic.jobId, 10000);
  const genericStatus = await invoke('wandao_task_status', { jobId: generic.jobId });
  assert.equal(genericStatus.result.outcome, 'completed');
  assert.match(genericStatus.result.preview, /hello.md/);
  ctx.jobs.remove(task.jobId);
  await assert.rejects(ctx.tools.get('wandao_task_status')!.execute({ jobId: task.jobId }, { signal: new AbortController().signal } as ToolRunContext), /Unknown Wandao jobId/);
});
