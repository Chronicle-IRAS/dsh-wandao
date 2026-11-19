import { spawn } from 'node:child_process';
import { lstat, readdir, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { StringDecoder } from 'node:string_decoder';
import { fileURLToPath } from 'node:url';
export const bundledRuntimeRoot = fileURLToPath(new URL('../runtime/', import.meta.url));
function inside(root, candidate) {
    const relative = path.relative(root, candidate);
    return relative === '' || (!path.isAbsolute(relative) && relative !== '..' && !relative.startsWith(`..${path.sep}`));
}
// Resolve existing ancestors too, so missing output directories cannot hide a symlink escape.
async function canonical(input) {
    if (!path.isAbsolute(input))
        throw new Error('Use an absolute path');
    try {
        return await realpath(input);
    }
    catch (error) {
        if (error.code !== 'ENOENT')
            throw error;
        const parent = path.dirname(input);
        if (parent === input)
            throw error;
        // A dangling link must not masquerade as a missing directory.
        const entry = await lstat(input).catch((e) => { if (e.code !== 'ENOENT')
            throw e; return null; });
        if (entry?.isSymbolicLink())
            throw new Error('Output contains a symbolic link');
        return path.join(await canonical(parent), path.basename(input));
    }
}
async function rejectOutputLinks(directory) {
    const entries = await readdir(directory, { withFileTypes: true }).catch((error) => {
        if (error.code === 'ENOENT')
            return [];
        throw error;
    });
    for (const entry of entries) {
        if (entry.isSymbolicLink())
            throw new Error('Output contains a symbolic link');
        if (entry.isDirectory())
            await rejectOutputLinks(path.join(directory, entry.name));
        else if (entry.isFile() && (await lstat(path.join(directory, entry.name))).nlink > 1)
            throw new Error('Output contains a hard link');
    }
}
function count(value) { return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0; }
export class WandaoRunner {
    config;
    activeOutputs = new Set();
    constructor(config) { this.config = config; }
    async vault(input) {
        const vault = await realpath(input);
        if (!path.isAbsolute(input) || !(await stat(vault)).isDirectory())
            throw new Error('Vault must be an absolute directory');
        const roots = await Promise.all(this.config.vaultRoots.map(canonical));
        if (!roots.some((root) => inside(root, vault)))
            throw new Error('Vault is outside configured vaultRoots');
        return vault;
    }
    async run(args, options) {
        const root = await realpath(bundledRuntimeRoot);
        const script = await realpath(path.join(root, 'plugins/obsidian/backend/export_obsidian.py'));
        if (!inside(root, script))
            throw new Error('Obsidian script escapes bundled runtime');
        return runJsonProcess(this.config.python, [script, ...args], {
            cwd: root, timeoutMs: this.config.timeoutMs ?? 300000,
            maxOutputBytes: this.config.maxOutputBytes ?? 8 * 1024 * 1024, ...options,
        });
    }
    async scan(input, options = {}) {
        const vault = await this.vault(input);
        const { data, exitCode } = await this.run(['--vault', vault, '--scan-toc'], options);
        if (exitCode || data.error || !Array.isArray(data.nodes))
            throw new Error('Obsidian scan did not return a valid directory result');
        const limit = this.config.maxScanNodes ?? 200;
        const nodes = data.nodes.slice(0, limit).map((node) => ({
            nodeId: String(node.nodeId ?? ''), exportId: String(node.exportId ?? ''),
            title: String(node.title ?? ''), parentNodeId: String(node.parentNodeId ?? ''), selectable: node.selectable === true,
        }));
        return { providerId: 'obsidian-export', totalDocs: count(data.totalDocs), nodes, truncated: data.nodes.length > limit };
    }
    async export(request, options = {}) {
        const vault = await this.vault(request.vault);
        const output = await canonical(request.destination);
        const outputRoot = await canonical(this.config.outputRoot);
        if (!inside(outputRoot, output))
            throw new Error('Destination is outside configured outputRoot');
        if (inside(vault, output) || inside(output, vault))
            throw new Error('Vault and output must not overlap');
        await rejectOutputLinks(output);
        const args = ['--vault', vault, '--output', output, '--flat-output', '--export', '--progress-every', '1'];
        if (request.docIds !== undefined) {
            if (!request.docIds.length)
                throw new Error('Document selection must not be empty');
            for (const id of request.docIds) {
                if (!id || id.includes('\0') || /^[\\/]|^[A-Za-z]:/.test(id) || id.split(/[\\/]/).includes('..') || !id.toLowerCase().endsWith('.md'))
                    throw new Error('Invalid document selection');
                const source = await realpath(path.join(vault, id));
                if (!inside(vault, source) || !(await stat(source)).isFile())
                    throw new Error('Invalid document selection');
                args.push('--doc-id', id);
            }
        }
        if (request.incremental)
            args.push('--incremental');
        if ([...this.activeOutputs].some((active) => inside(active, output) || inside(output, active)))
            throw new Error('Wandao is already exporting to an overlapping destination');
        this.activeOutputs.add(output);
        try {
            const { data, exitCode } = await this.run(args, options);
            if (data.error || typeof data.totalDocs !== 'number' || typeof data.exportedDocs !== 'number')
                throw new Error('Obsidian export did not return a valid result');
            const failureCount = Math.max(count(data.failureCount), Array.isArray(data.failures) ? data.failures.length : 0);
            const resourceFailureCount = Array.isArray(data.resourceFailures) ? data.resourceFailures.length : 0;
            const exportedDocs = count(data.exportedDocs);
            const skippedDocs = count(data.skippedDocs);
            const failed = exitCode !== 0 || failureCount > 0 || resourceFailureCount > 0;
            return {
                providerId: 'obsidian-export', output, totalDocs: count(data.totalDocs), exportedDocs, skippedDocs,
                failureCount, resourceFailureCount,
                outcome: failed ? (exportedDocs + skippedDocs > 0 ? 'partial' : 'failed') : 'completed',
            };
        }
        finally {
            this.activeOutputs.delete(output);
        }
    }
}
export async function runJsonProcess(command, args, options) {
    const abortError = () => Object.assign(new Error('Wandao task cancelled'), { name: 'AbortError' });
    if (options.signal?.aborted)
        throw abortError();
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            cwd: options.cwd, shell: false, windowsHide: true, detached: process.platform !== 'win32', stdio: ['pipe', 'pipe', 'pipe'],
            env: { ...process.env, ...options.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8', PYTHONUNBUFFERED: '1', PYTHONDONTWRITEBYTECODE: '1' },
        });
        const decoder = new StringDecoder('utf8');
        let stdout = '';
        let pendingLine = '';
        let bytes = 0;
        let failure;
        let killTimer;
        let forceTimer;
        const terminate = (force = false) => {
            if (!child.pid)
                return;
            if (process.platform === 'win32') {
                const killer = spawn('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
                killer.once('error', () => child.kill('SIGKILL'));
            }
            else {
                try {
                    process.kill(-child.pid, force ? 'SIGKILL' : 'SIGTERM');
                }
                catch {
                    child.kill(force ? 'SIGKILL' : 'SIGTERM');
                }
            }
        };
        const stop = (error) => {
            if (failure)
                return;
            failure = error;
            try {
                options.onStop?.();
            }
            catch { /* Fall through to process termination. */ }
            const grace = options.cooperativeStopMs ?? 0;
            if (grace === 0)
                terminate();
            killTimer = setTimeout(() => {
                terminate();
                forceTimer = setTimeout(() => terminate(true), 1000);
                forceTimer.unref();
            }, grace || 1000);
            killTimer.unref();
        };
        const abort = () => stop(abortError());
        options.signal?.addEventListener('abort', abort, { once: true });
        const timer = setTimeout(() => stop(new Error('Wandao task timed out')), options.timeoutMs);
        const clean = () => {
            clearTimeout(timer);
            if (killTimer)
                clearTimeout(killTimer);
            if (forceTimer)
                clearTimeout(forceTimer);
            options.signal?.removeEventListener('abort', abort);
        };
        const account = (chunk) => {
            bytes += chunk.length;
            if (bytes > options.maxOutputBytes)
                stop(new Error('Wandao process output limit exceeded'));
            return !failure;
        };
        child.stdout.on('data', (chunk) => {
            if (!account(chunk))
                return;
            const text = decoder.write(chunk);
            stdout += text;
            pendingLine += text;
            const lines = pendingLine.split(/\r?\n/);
            pendingLine = lines.pop() ?? '';
            for (const line of lines) {
                const match = /^progress (\d+)\/(\d+)/.exec(line);
                if (match) {
                    try {
                        options.onProgress?.({ current: Number(match[1]), total: Number(match[2]) });
                    }
                    catch {
                        stop(new Error('Progress consumer failed'));
                    }
                }
                if (line.startsWith('@@WANDAO_LOG@@')) {
                    try {
                        const event = JSON.parse(line.slice('@@WANDAO_LOG@@'.length));
                        if (typeof event.progress?.current === 'number' && typeof event.progress?.total === 'number')
                            options.onProgress?.(event.progress);
                    }
                    catch { /* Non-protocol lines are never forwarded. */ }
                }
            }
        });
        // Do not forward raw stderr: a future backend might include private content.
        child.stderr.on('data', account);
        child.once('error', (error) => { clean(); reject(failure ?? new Error(`Cannot start Python process (${error.code ?? 'unknown'})`)); });
        child.once('close', (code) => {
            clean();
            if (failure) {
                reject(failure);
                return;
            }
            stdout += decoder.end();
            const lines = stdout.trim().split(/\r?\n/);
            for (let i = lines.length - 1; i >= 0; i--) {
                if (!lines[i].startsWith('{'))
                    continue;
                try {
                    const data = JSON.parse(lines.slice(i).join('\n'));
                    if (data && typeof data === 'object' && !Array.isArray(data)) {
                        resolve({ data, exitCode: code ?? 1 });
                        return;
                    }
                }
                catch { /* Continue past ordinary log lines. */ }
            }
            reject(new Error(`Wandao process returned no valid JSON result (exit ${code ?? 'signal'})`));
        });
        child.stdin.on('error', (error) => {
            if (error.code !== 'EPIPE' && error.code !== 'ERR_STREAM_DESTROYED')
                stop(new Error('Cannot write process input'));
        });
        if (options.input)
            child.stdin.write(options.input);
        if (options.keepStdin)
            options.onInput?.(() => { if (!child.stdin.destroyed)
                child.stdin.write('\n'); });
        else
            child.stdin.end();
        // Handle an abort between the preflight and listener registration.
        if (options.signal?.aborted)
            abort();
    });
}
