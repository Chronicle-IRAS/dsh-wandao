import { copyFile, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = path.join(root, 'runtime');
const upstream = JSON.parse(await readFile(path.join(root, 'UPSTREAM.json'), 'utf8'));
await copyFile(path.join(root, 'python/bridge.py'), path.join(runtime, 'bridge.py'));

const tracked = execFileSync('git', ['ls-files', '-z', '--', 'runtime/'], { cwd: root, encoding: 'utf8' })
  .split('\0')
  .filter(Boolean)
  .map((file) => file.slice('runtime/'.length))
  .filter((file) => !['bridge.py', 'SOURCE.json'].includes(file));
if (!tracked.includes('plugins/obsidian/plugin.json')) {
  throw new Error('The vendored Wandao runtime must be tracked in the source repository.');
}

const files = {};
for (const file of [...tracked, 'bridge.py'].sort()) {
  files[file] = createHash('sha256').update(await readFile(path.join(runtime, file))).digest('hex');
}
await writeFile(path.join(runtime, 'SOURCE.json'), JSON.stringify({ ...upstream, files }, null, 2) + '\n');
console.log(`Bundled Wandao ${upstream.wandaoVersion}: ${Object.keys(files).length} runtime files`);
