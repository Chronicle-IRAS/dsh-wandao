import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import test from 'node:test';
import { ProviderRuntime } from '../src/runtime.ts';

async function setup(t: test.TestContext) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'dsh-bundled-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const vault = path.join(root, 'vault'); const outputRoot = path.join(root, 'output'); const dataDir = path.join(root, 'state');
  await mkdir(vault); await mkdir(outputRoot); await mkdir(dataDir);
  await writeFile(path.join(vault, 'note.md'), '# independent package\n');
  return { root, vault, outputRoot, dataDir, runtime: new ProviderRuntime({ python: process.env.WANDAO_TEST_PYTHON || 'python', vaultRoots: [vault], outputRoot, dataDir }) };
}

test('bundled catalogue includes network exports, imports and host platform constraints', async (t) => {
  const { runtime } = await setup(t);
  const { providers } = await runtime.providers();
  for (const id of ['obsidian-export', 'feishu-export', 'yuque', 'yuque-import', 'ima-export', 'google-docs-import', 'google-docs-export']) assert.ok(providers.find((p) => p.id === id), id);
  assert.equal(providers.find((p) => p.id === 'onenote')!.supported, process.platform === 'win32');
  assert.ok(providers.find((p) => p.id === 'feishu-export')!.actions.includes('login'));
});

test('describing a provider includes its actual fields, guide and actions', async (t) => {
  const { runtime } = await setup(t);
  const result = await runtime.describe('feishu-export');
  assert.ok((result.fields as any[]).find((f) => f.name === 'wiki_url'));
  assert.match(String(result.guide), /飞书|Wiki/);
  await assert.rejects(runtime.describe('../../escape'));
});

test('generic manifest execution exports Obsidian without an external checkout parameter', async (t) => {
  const { vault, outputRoot, runtime } = await setup(t);
  const destination = path.join(outputRoot, 'archive');
  const result = await runtime.execute({ providerId: 'obsidian-export', actionId: 'export', fields: { vault, output: destination, auto_output_folder: false } });
  assert.equal(result.outcome, 'completed');
  assert.match(await readFile(path.join(destination, 'note.md'), 'utf8'), /independent package/);
});

test('generic actions reject unknown fields, remote writes without confirmation and path escapes', async (t) => {
  const { vault, root, runtime } = await setup(t);
  await assert.rejects(runtime.execute({ providerId: 'yuque-import', actionId: 'import', fields: {} }), /confirmation/);
  await assert.rejects(runtime.execute({ providerId: 'obsidian-export', actionId: 'scan', fields: { vault, script: 'bad.py' } }), /Unknown field/);
  await assert.rejects(runtime.execute({ providerId: 'obsidian-export', actionId: 'scan', fields: { vault: root } }), /allowed source/);
  await assert.rejects(runtime.execute({ providerId: 'obsidian-export', actionId: 'export', fields: { vault, output: root } }), /outputRoot/);
  await assert.rejects(runtime.execute({ providerId: 'obsidian-export', actionId: 'export', fields: { vault, output: vault } }), /outputRoot|overlap/);
});

test('API credentials come from plugin-private settings and are absent from results', async (t) => {
  const { runtime, dataDir } = await setup(t);
  await mkdir(path.join(dataDir, 'ima'));
  await writeFile(path.join(dataDir, 'ima', 'settings.json'), JSON.stringify({ client_id: 'local-client-123', api_key: 'private-api-key-456' }), { mode: 0o600 });
  const result = await runtime.execute({ providerId: 'ima-export', actionId: 'saveConfig' });
  assert.equal(result.outcome, 'completed');
  assert.doesNotMatch(JSON.stringify(result), /private-api-key-456|local-client-123/);
  const saved = JSON.parse(await readFile(path.join(dataDir, 'ima', 'ima_config.json'), 'utf8'));
  assert.equal(saved.api_key, 'private-api-key-456');
  await assert.rejects(runtime.execute({ providerId: 'ima-export', actionId: 'saveConfig', fields: { api_key: 'do-not-echo' } }), /private settings/);
});

test('import planning executes the bundled Google backend without authorizing remote writes', async (t) => {
  const { runtime, vault } = await setup(t);
  const result = await runtime.execute({ providerId: 'google-docs-import', actionId: 'plan', fields: { source_dir: vault } });
  assert.equal(result.outcome, 'completed');
  assert.match(result.preview, /note.md|total|count/);
});

test('a rate-limited backend report remains paused instead of reporting successful completion', async (t) => {
  const { runtime } = await setup(t);
  const description = await runtime.describe('zsxq-group');
  // Supply a platform report at the subprocess boundary without calling its API.
  t.mock.method(runtime as any, 'call', async (request: { op: string }) => ({
    data: request.op === 'describe' ? description : {
      outcome: 'paused', rateLimitedPaused: true, totalDocs: 10, successCount: 2, failureCount: 0,
    },
    exitCode: 0,
  }));
  const result = await runtime.execute({ providerId: 'zsxq-group', actionId: 'export' });
  assert.equal(result.outcome, 'paused');
});

test('large real scans keep a valid JSON preview containing selectable document records', async (t) => {
  const { runtime, vault } = await setup(t);
  await Promise.all(Array.from({ length: 120 }, (_, i) => writeFile(path.join(vault, `document-${i}-${'long-title-'.repeat(8)}.md`), '# test')));
  const result = await runtime.execute({ providerId: 'obsidian-export', actionId: 'scan', fields: { vault } });
  const data = JSON.parse(result.preview);
  assert.ok(data.nodes.length > 0);
  assert.ok(result.preview.length <= 12000);
  assert.equal(result.truncated, true);
});
