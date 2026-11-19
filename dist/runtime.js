import { bundledRuntimeRoot, runJsonProcess } from './runner.js';
import { homedir } from 'node:os';
import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import { writeFileSync, rmSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
export class ProviderRuntime {
    config;
    active = false;
    constructor(config) { this.config = config; }
    async call(request, options = {}) {
        const dataDir = this.config.dataDir || path.join(homedir(), '.dsh-wandao');
        if (!path.isAbsolute(dataDir))
            throw new Error('dataDir must be an absolute path');
        await mkdir(dataDir, { recursive: true, mode: 0o700 });
        const stopFile = path.join(dataDir, `stop-${randomUUID()}`);
        try {
            const { data, exitCode } = await runJsonProcess(this.config.python, [path.join(bundledRuntimeRoot, 'bridge.py')], {
                cwd: dataDir, timeoutMs: this.config.timeoutMs ?? 300000, maxOutputBytes: this.config.maxOutputBytes ?? 8388608,
                input: JSON.stringify({ ...request, config: { dataDir, outputRoot: this.config.outputRoot, vaultRoots: this.config.vaultRoots, browser: this.config.browser } }) + '\n',
                keepStdin: request.op === 'execute', ...options,
                env: { PYTHONPATH: bundledRuntimeRoot, PYTHONNOUSERSITE: '1', WANDAO_STOP_FILE: stopFile },
                onStop: () => writeFileSync(stopFile, 'stop', { mode: 0o600 }), cooperativeStopMs: request.op === 'execute' ? 2000 : 0,
            });
            if (data.bridgeError)
                throw new Error(String(data.bridgeError));
            return { data, exitCode };
        }
        finally {
            rmSync(stopFile, { force: true });
        }
    }
    async providers(options = {}) {
        const { data, exitCode } = await this.call({ op: 'providers' }, options);
        if (exitCode || !Array.isArray(data.providers))
            throw new Error('Cannot load bundled provider catalogue');
        return { providers: data.providers };
    }
    async describe(id, options = {}) {
        return (await this.call({ op: 'describe', providerId: id }, options)).data;
    }
    async saveCredentials(providerId, fields, options = {}) {
        const { data, exitCode } = await this.call({ op: 'saveSettings', providerId, fields }, options);
        if (exitCode || data.saved !== true)
            throw new Error('无法保存账号设置');
        return { saved: true };
    }
    async execute(request, options = {}) {
        if (this.active)
            throw new Error('A Wandao platform action is already running');
        this.active = true;
        try {
            const catalogue = await this.describe(request.providerId, options);
            const action = catalogue.actions.find((a) => a.id === request.actionId);
            const { data, exitCode } = await this.call({ ...request, op: 'execute' }, { ...options, onInput: action?.kind === 'login' ? options.onInput : undefined });
            const failed = exitCode !== 0 || data.success === false || Boolean(data.error) || Number(data.failureCount ?? 0) > 0 ||
                ['resourceFailureCount', 'imageFailureCount', 'attachmentFailureCount'].some((key) => Number(data[key] ?? 0) > 0) ||
                ['failed', 'partial'].includes(data.outcome) ||
                [data.failures, data.resourceFailures, data.imageFailures, data.attachmentFailures].some((v) => Array.isArray(v) && v.length > 0);
            const outcome = data.stopped || data.outcome === 'stopped' ? 'stopped' :
                data.rateLimitedPaused || data.outcome === 'paused' ? 'paused' :
                    failed ? (data.outcome === 'partial' || Number(data.exportedDocs ?? data.successCount ?? data.importedDocs ?? 0) > 0 ? 'partial' : 'failed') : 'completed';
            // Account/config mutations can return credentials: expose no raw payload for
            // login/custom actions. For read-only views project only bounded metadata.
            const privateKey = /password|secret|cookie|api.?key|client.?id|app.?id|username|authorization|(?:access|refresh|auth|session)[_-]?token|^token$|^config$|^credentials$/i;
            let itemLimit = this.config.maxScanNodes ?? 200;
            const sanitize = (value, depth = 0) => {
                if (depth > 5)
                    return '[depth limit]';
                if (Array.isArray(value))
                    return value.slice(0, itemLimit).map((v) => sanitize(v, depth + 1));
                if (value && typeof value === 'object')
                    return Object.fromEntries(Object.entries(value).slice(0, 100).filter(([key]) => !privateKey.test(key)).map(([key, v]) => [key, sanitize(v, depth + 1)]));
                if (typeof value === 'string')
                    return value.length > 1000 ? value.slice(0, 1000) + '…' : value;
                return value;
            };
            const projected = ['scan', 'plan', 'check'].includes(action?.kind) ? data : {
                totalDocs: data.totalDocs ?? data.total ?? 0, successCount: data.successCount ?? data.exportedDocs ?? data.importedDocs ?? 0,
                failureCount: data.failureCount ?? (Array.isArray(data.failures) ? data.failures.length : 0),
                output: typeof data.output === 'string' ? data.output : '', reportFile: typeof data.reportFile === 'string' ? data.reportFile : '',
            };
            let preview = JSON.stringify(sanitize(projected));
            while (preview.length > 12000 && itemLimit > 1) {
                itemLimit = Math.max(1, Math.floor(itemLimit / 2));
                preview = JSON.stringify(sanitize(projected));
            }
            if (preview.length > 12000)
                preview = JSON.stringify({ message: 'Result exceeds the preview limit; see the local report.', reportFile: String(data.reportFile ?? '').slice(0, 1000) });
            return { providerId: request.providerId, actionId: request.actionId, outcome, preview, truncated: JSON.stringify(data).length > preview.length };
        }
        finally {
            this.active = false;
        }
    }
}
