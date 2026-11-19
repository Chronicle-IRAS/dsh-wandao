// This file is copied beside a fresh package installation before execution.
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { Context } from '@deepseek-ai/cordis';
import Tools from '@deepseek-ai/dsh-tools';
import SystemPrompt from '@deepseek-ai/dsh-system-prompt';
import LocalJobs from '@deepseek-ai/dsh-jobs-local';
import * as plugin from '@chronicle-iras/dsh-wandao';

const root = process.cwd();
let browserModule;
vm.runInNewContext(await readFile(fileURLToPath(import.meta.resolve('@chronicle-iras/dsh-wandao/client')), 'utf8'), { window: { __ModuleLoader__: { load: (module) => { browserModule = module; } } } });
assert.equal(browserModule.id, '@chronicle-iras/dsh-wandao');
assert.equal(typeof browserModule.factory, 'function');
const vault = path.join(root, 'vault'); const outputRoot = path.join(root, 'output');
await mkdir(vault); await mkdir(outputRoot);
await writeFile(path.join(vault, 'hello.md'), '# isolated installed export\n');
const ctx = new Context();
try {
  await ctx.plugin(SystemPrompt).await(); await ctx.plugin(Tools).await(); await ctx.plugin(LocalJobs).await();
  await ctx.plugin(plugin, { python: process.env.WANDAO_TEST_PYTHON || 'python', vaultRoots: [vault], outputRoot, dataDir: path.join(root, 'data') }).await();
  const call = (name, args) => ctx.tools.get(name).execute(args, { signal: new AbortController().signal });
  const catalogue = await call('wandao_providers', {});
  assert.ok(catalogue.providers.some((p) => p.id === 'feishu-export'));
  assert.ok(catalogue.providers.some((p) => p.id === 'yuque-import'));
  const task = await call('wandao_action', { providerId: 'obsidian-export', actionId: 'export', fields: { vault, output: path.join(outputRoot, 'archive'), auto_output_folder: false } });
  await ctx.jobs.wait(task.jobId, 10000);
  const result = await call('wandao_task_status', { jobId: task.jobId });
  assert.equal(result.result.outcome, 'completed', JSON.stringify(result));
  assert.match(await readFile(path.join(outputRoot, 'archive', 'hello.md'), 'utf8'), /isolated installed export/);
  console.log(`Standalone tarball: ${catalogue.providers.length} bundled providers; export passed without a Wandao checkout`);
} finally { await ctx.fiber.dispose(); }
