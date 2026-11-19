import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm, symlink, link } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { WandaoRunner, runJsonProcess } from '../src/runner.ts';

const wandaoRoot = fileURLToPath(new URL('../../../', import.meta.url));
const python = process.env.WANDAO_TEST_PYTHON || 'python';

async function fixture(t: test.TestContext) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'wandao-dsh-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const vault = path.join(root, '笔记 vault');
  const outputRoot = path.join(root, 'exports');
  await mkdir(path.join(vault, 'notes'), { recursive: true });
  await mkdir(path.join(vault, 'assets'));
  await mkdir(outputRoot);
  await writeFile(path.join(vault, 'notes', 'hello.md'), '# Hello\n\n![image](../assets/picture.png)\n');
  await writeFile(path.join(vault, 'assets', 'picture.png'), Buffer.from([137,80,78,71]));
  await writeFile(path.join(vault, 'second.md'), 'second');
  const runner = new WandaoRunner({ python, vaultRoots: [vault], outputRoot });
  return { root, vault, outputRoot, runner };
}

test('scan returns real document IDs without reading document bodies into the result', async (t) => {
  const { vault, runner } = await fixture(t);
  const result = await runner.scan(vault);
  assert.equal(result.totalDocs, 2);
  assert.deepEqual(result.nodes.filter((n: any) => n.selectable).map((n: any) => n.exportId).sort(), ['notes/hello.md', 'second.md']);
  assert.equal(JSON.stringify(result).includes('# Hello'), false);
});

test('selected export copies Markdown and referenced resources and leaves the vault untouched', async (t) => {
  const { vault, runner, outputRoot } = await fixture(t);
  const destination = path.join(outputRoot, 'selected');
  const updates: any[] = [];
  const result = await runner.export({ vault, destination, docIds: ['notes/hello.md'] }, { onProgress: (p) => updates.push(p) });
  assert.equal(result.outcome, 'completed');
  assert.equal(result.exportedDocs, 1);
  assert.equal(result.output, destination);
  assert.match(await readFile(path.join(destination, 'notes/hello.md'), 'utf8'), /_resources\/assets\/picture.png/);
  assert.deepEqual(await readFile(path.join(destination, '_resources/assets/picture.png')), Buffer.from([137,80,78,71]));
  assert.equal(await readFile(path.join(vault, 'notes/hello.md'), 'utf8'), '# Hello\n\n![image](../assets/picture.png)\n');
  await assert.rejects(readFile(path.join(destination, 'second.md')));
  assert.deepEqual(updates.at(-1), { current: 1, total: 1 });
});

test('incremental exports skip existing up-to-date documents', async (t) => {
  const { vault, runner, outputRoot } = await fixture(t);
  const request = { vault, destination: path.join(outputRoot, 'all'), incremental: true };
  await runner.export(request);
  const result = await runner.export(request);
  assert.equal(result.skippedDocs, 2);
  assert.equal(result.exportedDocs, 0);
});

test('missing resources produce a partial outcome rather than complete success', async (t) => {
  const { vault, runner, outputRoot } = await fixture(t);
  await writeFile(path.join(vault, 'second.md'), '![missing](missing.png)');
  const result = await runner.export({ vault, destination: path.join(outputRoot, 'partial') });
  assert.equal(result.outcome, 'partial');
  assert.equal(result.resourceFailureCount, 1);
});

test('scan results are bounded and truthfully report omitted nodes', async (t) => {
  const { vault, runner } = await fixture(t);
  const bounded = new WandaoRunner({ ...runner.config, maxScanNodes: 1 });
  const result = await bounded.scan(vault);
  assert.equal(result.nodes.length, 1);
  assert.equal(result.totalDocs, 2);
  assert.equal(result.truncated, true);
});

test('rejects sources outside configured roots and destinations outside outputRoot before writing', async (t) => {
  const { root, vault, runner } = await fixture(t);
  await assert.rejects(runner.scan(root), /vaultRoots/);
  await assert.rejects(runner.export({ vault, destination: path.join(root, 'outside') }), /outputRoot/);
});

test('rejects overlapping vault and output trees in both directions', async (t) => {
  const { root, vault, runner } = await fixture(t);
  const overlapping = new WandaoRunner({ ...runner.config, outputRoot: root });
  await assert.rejects(overlapping.export({ vault, destination: vault }), /overlap/);
  await assert.rejects(overlapping.export({ vault, destination: path.join(vault, 'child') }), /overlap/);
  await assert.rejects(overlapping.export({ vault, destination: root }), /overlap/);
});

test('rejects empty selection, traversal and non-Markdown selection instead of exporting everything', async (t) => {
  const { vault, outputRoot, runner } = await fixture(t);
  for (const docIds of [[], ['../outside.md'], ['assets/picture.png'], ['/absolute.md']]) {
    await assert.rejects(runner.export({ vault, destination: path.join(outputRoot, 'bad'), docIds }), /selection/);
  }
});

test('rejects an output subtree symlink that could overwrite vault files', async (t) => {
  const { vault, outputRoot, runner } = await fixture(t);
  const destination = path.join(outputRoot, 'linked');
  await mkdir(destination);
  try { await symlink(path.join(vault, 'notes'), path.join(destination, 'notes'), process.platform === 'win32' ? 'junction' : 'dir'); }
  catch (error: any) { if (error.code === 'EPERM') { t.skip('OS does not allow symlinks'); return; } throw error; }
  await assert.rejects(runner.export({ vault, destination }), /symbolic link/);
});

test('rejects existing output hard links that could modify the source document', async (t) => {
  const { vault, outputRoot, runner } = await fixture(t);
  const destination = path.join(outputRoot, 'hardlinks');
  await mkdir(destination);
  await link(path.join(vault, 'second.md'), path.join(destination, 'second.md'));
  await assert.rejects(runner.export({ vault, destination }), /hard link/);
  assert.equal(await readFile(path.join(vault, 'second.md'), 'utf8'), 'second');
});

test('process protocol handles UTF-8, log lines and trailing JSON', async () => {
  const result = await runJsonProcess(process.execPath, ['-e', 'console.log("progress 1/2"); console.log(JSON.stringify({title:"中文",successCount:1}))'], { cwd: wandaoRoot, timeoutMs: 5000, maxOutputBytes: 1024 });
  assert.equal(result.data.title, '中文');
});

test('invalid JSON and nonzero exits without a result fail with bounded diagnostics', async () => {
  for (const code of ['console.log("not json")', 'process.exit(7)']) {
    await assert.rejects(runJsonProcess(process.execPath, ['-e', code], { cwd: wandaoRoot, timeoutMs: 5000, maxOutputBytes: 1024 }), /JSON|result/);
  }
});

test('output overflow and deadline terminate the subprocess', async () => {
  await assert.rejects(runJsonProcess(process.execPath, ['-e', 'console.log("x".repeat(10000));setInterval(()=>{},1000)'], { cwd: wandaoRoot, timeoutMs: 5000, maxOutputBytes: 1024 }), /output limit/);
  await assert.rejects(runJsonProcess(process.execPath, ['-e', 'setInterval(()=>{},1000)'], { cwd: wandaoRoot, timeoutMs: 50, maxOutputBytes: 1024 }), /timed out/);
});

test('cancellation rejects with AbortError after the child exits and pre-aborted calls spawn nothing', async () => {
  const controller = new AbortController();
  const pending = runJsonProcess(process.execPath, ['-e', 'setInterval(()=>{},1000)'], { cwd: wandaoRoot, signal: controller.signal, timeoutMs: 5000, maxOutputBytes: 1024 });
  controller.abort();
  await assert.rejects(pending, { name: 'AbortError' });
  await assert.rejects(runJsonProcess('executable-that-does-not-exist', [], { cwd: wandaoRoot, signal: controller.signal, timeoutMs: 5000, maxOutputBytes: 1024 }), { name: 'AbortError' });
});

test('simultaneous exports cannot write overlapping destination trees', async (t) => {
  const { vault, outputRoot, runner } = await fixture(t);
  const destination = path.join(outputRoot, 'concurrent');
  const outcomes = await Promise.allSettled([
    runner.export({ vault, destination }),
    runner.export({ vault, destination: path.join(destination, 'nested') }),
  ]);
  assert.equal(outcomes.filter((r) => r.status === 'fulfilled').length, 1);
  const failed = outcomes.find((r) => r.status === 'rejected') as PromiseRejectedResult;
  assert.match(failed.reason.message, /already exporting/);
});

test('stdin transports a private request and a later login confirmation without exposing either in argv', async () => {
  const code = 'let input="";process.stdin.on("data",c=>{input+=c;if(input.split("\\n").length>=3){const header=JSON.parse(input.split("\\n")[0]);console.log(JSON.stringify({confirmed:true,received:header.secret.length,argv:process.argv.slice(1)}));process.exit(0)}})';
  const result = await runJsonProcess(process.execPath, ['-e', code], {
    cwd: wandaoRoot, timeoutMs: 5000, maxOutputBytes: 2048,
    input: JSON.stringify({ secret: 'private-example' }) + '\n', keepStdin: true,
    onInput: (confirm) => confirm(),
  });
  assert.equal(result.data.confirmed, true);
  assert.equal(result.data.received, 15);
  assert.deepEqual(result.data.argv, []);
});
