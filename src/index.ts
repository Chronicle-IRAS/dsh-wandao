import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';
import { defineTool, ToolArgsError, type ToolRunContext } from '@deepseek-ai/dsh-tools';
import type { JobId, JobOutcome } from '@deepseek-ai/dsh-jobs';
import { WandaoRunner, type ExportResult } from './runner.js';
import { ProviderRuntime, type RuntimeConfig, type ActionResult, type ActionOptions } from './runtime.js';
import { registerUi } from './ui-api.js';
import type { UiTask } from './ui-contract.js';
import { randomUUID } from 'node:crypto';

declare module '@deepseek-ai/dsh-jobs/view' {
  interface JobKindMap { wandao: 'wandao' }
}

export const name = 'wandao';
export const inject = ['tools', 'jobs'];
export interface Config extends RuntimeConfig {}
export const Config: Schema<Config> = Schema.object({
  python: Schema.string().default('python'),
  dataDir: Schema.string(),
  browser: Schema.string(),
  vaultRoots: Schema.array(Schema.string()).required(),
  outputRoot: Schema.string().required(),
  timeoutMs: Schema.number().min(100).max(86400000).default(300000),
  maxOutputBytes: Schema.number().min(1024).max(67108864).default(8388608),
  maxScanNodes: Schema.number().min(1).max(10000).default(200),
});

function checkAbort(signal: AbortSignal) {
  if (signal.aborted) throw Object.assign(new Error('Wandao task cancelled'), { name: 'AbortError' });
}

export function apply(ctx: Context, config: Config) {
  const runner = new WandaoRunner(config);
  const runtime = new ProviderRuntime(config);
  interface TaskEntry { result?: ExportResult | ActionResult; controller: AbortController; done: Promise<JobOutcome>; confirm?: () => void }
  const tasks = new Map<JobId, TaskEntry>();
  interface UiEntry { view: UiTask; controller: AbortController; done: Promise<unknown>; confirm?: () => void }
  const uiTasks = new Map<string, UiEntry>();
  const foreground = new Set<{ controller: AbortController; done: Promise<unknown> }>();
  let disposed = false;
  let activeJob = false;
  ctx.effect(() => ctx.jobs.attachController('wandao'));
  ctx.jobs.events.subscribe({ owners: 'scope' }, (event) => {
    if (event.type === 'removed') tasks.delete(event.job.id);
  });
  ctx.effect(() => async () => {
    disposed = true;
    const running = [...tasks.values(), ...uiTasks.values(), ...foreground];
    running.forEach((task) => task.controller.abort());
    await Promise.allSettled(running.map((task) => task.done));
    tasks.clear();
    uiTasks.clear();
  });

  function taskId(id: string, exec: ToolRunContext): JobId {
    const entry = [...tasks.keys()].find((candidate) => candidate === id);
    if (!entry) throw new ToolArgsError(['Unknown Wandao jobId']);
    ctx.jobs.get(entry, exec.agent?.session.id); // The registry enforces session ownership.
    return entry;
  }

  function startTask(exec: ToolRunContext, label: string, run: (options: ActionOptions) => Promise<ExportResult | ActionResult>) {
    checkAbort(exec.signal);
    if (disposed) throw new Error('Wandao plugin has unloaded');
    if (activeJob) throw new Error('A Wandao task is already running; wait or cancel it first');
    activeJob = true;
    try {
      const jobId = ctx.jobs.start({ kind: 'wandao', label, owner: exec.agent?.session.id,
        run(job) {
          const controller = new AbortController();
          const entry: TaskEntry = {
            controller, done: Promise.resolve({ status: 'failed' }),
          };
          entry.done = run({ signal: controller.signal,
            onProgress: ({ current, total }) => job.updateProgress(`${current}/${total}`),
            onInput: (confirm) => { entry.confirm = confirm; job.updateProgress('等待浏览器登录确认'); },
          }).then((result): JobOutcome => {
            entry.result = result;
            return { status: result.outcome === 'completed' ? 'completed' : result.outcome === 'stopped' ? 'killed' : 'failed', detail: result.outcome, result: JSON.stringify(result) };
          }, (error): JobOutcome => ({ status: controller.signal.aborted ? 'killed' : 'failed', detail: error instanceof Error ? error.message : 'Wandao action failed' }))
            .finally(() => { activeJob = false; entry.confirm = undefined; });
          tasks.set(job.id, entry);
          return { cancel: () => controller.abort(), done: entry.done };
        },
      });
      return { kind: 'background', jobId };
    } catch (error) { activeJob = false; throw error; }
  }

  ctx.tools.register(defineTool({
    name: 'wandao_providers', description: 'List all providers shipped inside this plugin, their actions and OS support. No local Wandao installation is needed. supported reflects the upstream platform declaration, not live-account verification; use wandao_describe for setup requirements.',
    parameters: {},
    output: {
      schema: { type: 'object', additionalProperties: false, properties: {
        providers: { type: 'array', required: true, items: { type: 'object', additionalProperties: false, properties: {
          id: { type: 'string', required: true }, title: { type: 'string', required: true }, loginRequired: { type: 'boolean', required: true },
          supported: { type: 'boolean', required: true }, platforms: { type: 'array', items: { type: 'string' }, required: true }, actions: { type: 'array', items: { type: 'string' }, required: true },
        } } },
      } },
      render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }],
    },
    async execute(_args, exec) {
      checkAbort(exec.signal);
      return runtime.providers({ signal: exec.signal });
    },
  }));

  ctx.tools.register(defineTool({
    name: 'wandao_scan', description: 'Read an allowed local Obsidian vault directory without exporting or returning document bodies. A truncated directory lists only the first configured maxScanNodes nodes; exporting the whole vault is still supported.',
    parameters: { vault: { type: 'string', required: true, description: 'Absolute local vault directory inside configured vaultRoots.' } },
    output: {
      schema: { type: 'object', additionalProperties: false, properties: {
        providerId: { type: 'string', required: true }, totalDocs: { type: 'number', required: true }, truncated: { type: 'boolean', required: true },
        nodes: { type: 'array', required: true, items: { type: 'object', additionalProperties: false, properties: {
          nodeId: { type: 'string', required: true }, exportId: { type: 'string', required: true }, title: { type: 'string', required: true },
          parentNodeId: { type: 'string', required: true }, selectable: { type: 'boolean', required: true },
        } } },
      } },
      render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }],
    },
    async execute(args, exec) {
      checkAbort(exec.signal);
      if (disposed) throw new Error('Wandao plugin has unloaded');
      const controller = new AbortController();
      const done = runner.scan(args.vault, { signal: AbortSignal.any([exec.signal, controller.signal]) });
      const entry = { controller, done };
      foreground.add(entry);
      try { return await done; } finally { foreground.delete(entry); }
    },
  }));

  ctx.tools.register(defineTool({
    name: 'wandao_export', description: 'Start a background Obsidian export to an allowed local output directory. Copies Markdown and referenced resources, preserving folders. Existing destination files may be replaced; incremental skips up-to-date files. Use a new destination when preserving an earlier archive. Returns jobId; collect with wandao_task_status and stop with wandao_task_cancel. Omit docIds to export all; an empty selection is invalid.',
    parameters: {
      vault: { type: 'string', required: true }, destination: { type: 'string', required: true },
      docIds: { type: 'array', items: { type: 'string' }, description: 'Exact relative Markdown exportIds from wandao_scan.' },
      incremental: { type: 'boolean' },
    },
    output: {
      schema: { type: 'object', additionalProperties: false, properties: { kind: { type: 'string', required: true }, jobId: { type: 'string', required: true } } },
      render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }],
    },
    async execute(args, exec) {
      return startTask(exec, 'Obsidian archive export', (options) => runner.export(args, options));
    },
  }));

  ctx.tools.register(defineTool({
    name: 'wandao_task_status', description: 'Read a Wandao job status and its bounded export summary. Call again after a running job finishes; partial export is reported as a failed job with result.outcome=partial.',
    parameters: { jobId: { type: 'string', required: true } },
    output: {
      schema: { type: 'object', additionalProperties: false, properties: {
        jobId: { type: 'string', required: true }, status: { type: 'string', required: true },
        progress: { type: 'string', required: true }, detail: { type: 'string', required: true }, result: { type: 'json' },
      } },
      render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }],
    },
    async execute(args, exec) {
      checkAbort(exec.signal);
      const id = taskId(args.jobId, exec);
      const job = ctx.jobs.get(id, exec.agent?.session.id);
      const result = tasks.get(id)?.result;
      return { jobId: id, status: job.status, progress: job.progress ?? '', detail: job.detail ?? '', ...(result ? { result: { ...result } } : {}) };
    },
  }));

  ctx.tools.register(defineTool({
    name: 'wandao_task_cancel', description: 'Request cancellation of a Wandao background job. Files already exported are retained. Poll wandao_task_status until terminal; Obsidian incremental export can skip completed files in a later invocation.',
    parameters: { jobId: { type: 'string', required: true } },
    output: {
      schema: { type: 'object', additionalProperties: false, properties: { jobId: { type: 'string', required: true }, cancellation: { type: 'string', required: true } } },
      render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }],
    },
    async execute(args, exec) {
      checkAbort(exec.signal);
      const id = taskId(args.jobId, exec);
      return { jobId: id, cancellation: ctx.jobs.kill(id, exec.agent?.session.id) };
    },
  }));

  ctx.tools.register(defineTool({
    name: 'wandao_describe', description: 'Read bundled provider fields, action IDs and usage guide. Fields marked private must be configured by the human in the plugin data directory, never sent as tool arguments.',
    parameters: { providerId: { type: 'string', required: true } },
    output: { schema: { type: 'json' }, render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }] },
    async execute(args, exec) { checkAbort(exec.signal); return JSON.parse(JSON.stringify(await runtime.describe(args.providerId, { signal: exec.signal }))); },
  }));

  ctx.tools.register(defineTool({
    name: 'wandao_action', description: 'Run an action from the bundled Wandao provider catalogue in a background job: browser login, directory scan, planning, export or import. Use wandao_describe first. fields accepts only declared non-private field names and types. Imports/dangerous actions require confirmWrite=true after human confirmation. Credentials stay in per-plugin private settings. Use resume=true only when the described provider declares checkpoint support. Use wandao_task_status to collect results.',
    parameters: {
      providerId: { type: 'string', required: true }, actionId: { type: 'string', required: true },
      fields: { type: 'object', additionalProperties: true }, docIds: { type: 'array', items: { type: 'string' } }, confirmWrite: { type: 'boolean' }, resume: { type: 'boolean' },
    },
    output: { schema: { type: 'object', additionalProperties: false, properties: { kind: { type: 'string', required: true }, jobId: { type: 'string', required: true } } }, render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }] },
    async execute(args, exec) { return startTask(exec, `Wandao ${args.providerId} / ${args.actionId}`, (options) => runtime.execute(args, options)); },
  }));

  ctx.tools.register(defineTool({
    name: 'wandao_login_done', description: 'After the human finishes login in the browser opened by a Wandao login job, send its Enter confirmation. Never enter credentials through this tool.',
    parameters: { jobId: { type: 'string', required: true } },
    output: { schema: { type: 'object', additionalProperties: false, properties: { confirmed: { type: 'boolean', required: true } } }, render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }] },
    async execute(args, exec) {
      checkAbort(exec.signal); const id = taskId(args.jobId, exec); const entry = tasks.get(id)!;
      if (ctx.jobs.get(id, exec.agent?.session.id).status !== 'running' || !entry.confirm) throw new ToolArgsError(['Login confirmation is not available for this job']);
      entry.confirm(); entry.confirm = undefined; return { confirmed: true };
    },
  }));

  function uiEntry(id: string): UiEntry {
    const entry = uiTasks.get(id);
    if (!entry) throw new Error('未知页面任务');
    return entry;
  }
  function uiTask(id: string): UiTask {
    const entry = uiEntry(id);
    return { ...entry.view, canConfirmLogin: entry.view.status === 'running' && Boolean(entry.confirm) };
  }
  registerUi(ctx, config, runtime, {
    start: (request, signal, label) => {
      signal.throwIfAborted();
      if (disposed) throw new Error('Wandao plugin has unloaded');
      if (activeJob) throw new Error('已有迁移任务正在执行，请等待或停止它');
      activeJob = true;
      // UI jobs have no Agent owner. Keep them out of the shared registry,
      // whose unowned jobs are deliberately visible to every Agent session.
      const jobId = `ui-${randomUUID()}`;
      const entry: UiEntry = {
        view: { jobId, label, startedAt: Date.now(), status: 'running', progress: '', detail: '', canConfirmLogin: false },
        controller: new AbortController(), done: Promise.resolve(),
      };
      uiTasks.set(jobId, entry);
      entry.done = runtime.execute(request, {
        signal: entry.controller.signal,
        onProgress: ({ current, total }) => { entry.view.progress = `${current}/${total}`; },
        onInput: (confirm) => { entry.confirm = confirm; entry.view.progress = '等待浏览器登录确认'; },
      }).then((result) => {
        entry.view.result = result;
        entry.view.status = entry.controller.signal.aborted || result.outcome === 'stopped' ? 'killed' : result.outcome === 'completed' ? 'completed' : 'failed';
        entry.view.detail = result.outcome;
      }, (error) => {
        entry.view.status = entry.controller.signal.aborted ? 'killed' : 'failed';
        entry.view.detail = error instanceof Error ? error.message : '迁移失败';
      }).finally(() => { activeJob = false; entry.confirm = undefined; });
      for (const [id, old] of uiTasks) {
        if (uiTasks.size <= 50) break;
        if (old.view.status !== 'running') uiTasks.delete(id);
      }
      return { jobId };
    },
    tasks: () => [...uiTasks.keys()].reverse().map(uiTask),
    task: uiTask,
    cancel: (id) => {
      const entry = uiEntry(id);
      if (entry.view.status !== 'running') return { cancellation: 'not-running' };
      entry.controller.abort(); return { cancellation: 'requested' };
    },
    loginDone: (id) => {
      const entry = uiEntry(id);
      if (entry.view.status !== 'running' || !entry.confirm) throw new Error('当前任务没有待确认的登录');
      entry.confirm(); entry.confirm = undefined; return { confirmed: true };
    },
  });
}
