import { execFileSync } from 'node:child_process';
import { mkdtemp, copyFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import path from 'node:path';

const packageRoot = fileURLToPath(new URL('../', import.meta.url));
const npm = process.env.npm_execpath;
if (!npm) throw new Error('Run through npm run test:package');
const packed = JSON.parse(execFileSync(process.execPath, [npm, 'pack', '--json', '--ignore-scripts'], { cwd: packageRoot, encoding: 'utf8' }))[0];
const directory = await mkdtemp(path.join(tmpdir(), 'dsh-wandao-installed-'));
try {
  // These two packages are host services used by the assembly smoke test.
  execFileSync(process.execPath, [npm, 'install', '--prefix', directory, '--ignore-scripts', '--no-audit', '--no-fund', path.join(packageRoot, packed.filename), '@deepseek-ai/dsh-jobs-local@0.2.2-rc.1', '@deepseek-ai/dsh-system-prompt@0.2.2-rc.1'], { stdio: 'inherit' });
  await copyFile(path.join(packageRoot, 'scripts/installed-smoke.mjs'), path.join(directory, 'smoke.mjs'));
  execFileSync(process.execPath, [path.join(directory, 'smoke.mjs')], {
    cwd: directory, stdio: 'inherit', env: { ...process.env, WANDAO_ROOT: '/nonexistent-checkout', PYTHONPATH: '' },
  });
} finally {
  if (!directory.startsWith(path.join(tmpdir(), 'dsh-wandao-installed-'))) throw new Error('Unexpected temporary target');
  await rm(directory, { recursive: true, force: true });
}
