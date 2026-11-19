import type { Context } from "@deepseek-ai/cordis";
import type {
  ProviderRuntime,
  RuntimeConfig,
  ActionRequest,
} from "./runtime.js";
import type { UiTask, ProviderDescription } from "./ui-contract.js";

interface UiJobs {
  start(
    request: ActionRequest,
    signal: AbortSignal,
    label: string,
  ): { jobId: string };
  tasks(): UiTask[];
  task(id: string): UiTask;
  cancel(id: string): unknown;
  loginDone(id: string): unknown;
}
type Reply =
  | { ok: true; value: unknown }
  | { ok: false; error: { code: string; message: string; details: object } };
export type UiHandler = (
  endpoint: string,
  payload: unknown,
  signal: AbortSignal,
  peer: { principal: { kind: string } },
) => Promise<Reply>;

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("请求参数必须是对象");
  return value as Record<string, unknown>;
}
function text(value: unknown): string {
  if (
    typeof value !== "string" ||
    !value ||
    value.length > 4096 ||
    value.includes("\0")
  )
    throw new Error("缺少有效参数");
  return value;
}

export function registerUi(
  ctx: Context,
  config: RuntimeConfig,
  runtime: ProviderRuntime,
  jobs: UiJobs,
): void {
  ctx.inject(["connection", "webServer"], (scope) => {
    const handler: UiHandler = async (endpoint, payload, signal, peer) => {
      const failure = (code: string, message: string): Reply => ({
        ok: false,
        error: { code, message, details: {} },
      });
      if (peer.principal.kind !== "owner")
        return failure("wandao/forbidden", "只有宿主所有者可以操作万能导");
      try {
        signal.throwIfAborted();
        const input = record(payload);
        let value: unknown;
        switch (endpoint) {
          case "catalogue":
            value = {
              ...(await runtime.providers({ signal })),
              vaultRoots: config.vaultRoots,
              outputRoot: config.outputRoot,
            };
            break;
          case "describe":
            value = await runtime.describe(text(input.providerId), { signal });
            break;
          case "saveCredentials":
            value = await runtime.saveCredentials(
              text(input.providerId),
              record(input.fields),
              { signal },
            );
            break;
          case "start": {
            const providerId = text(input.providerId);
            const actionId = text(input.actionId);
            const description = (await runtime.describe(providerId, {
              signal,
            })) as unknown as ProviderDescription;
            const action = description.actions.find((a) => a.id === actionId);
            if (!action) throw new Error("未知动作");
            if (
              (action.kind === "import" || action.confirm || action.danger) &&
              input.confirmWrite !== true
            )
              throw new Error("请先确认远端写入");
            if (input.resume !== undefined && typeof input.resume !== "boolean")
              throw new Error("断点续跑必须为布尔值");
            if (
              input.docIds !== undefined &&
              (!Array.isArray(input.docIds) ||
                !input.docIds.length ||
                !input.docIds.every((id) => typeof id === "string" && id))
            )
              throw new Error("文档选择不能为空");
            const fields =
              input.fields === undefined ? {} : record(input.fields);
            if (
              Object.values(fields).some(
                (v) => !["string", "number", "boolean"].includes(typeof v),
              )
            )
              throw new Error("字段值必须是文本、数字或开关");
            value = jobs.start(
              {
                providerId,
                actionId,
                fields,
                ...(input.docIds === undefined
                  ? {}
                  : { docIds: input.docIds as string[] }),
                confirmWrite: input.confirmWrite === true,
                resume: input.resume === true,
              },
              signal,
              `${description.title || providerId} · ${action.label || actionId}`,
            );
            break;
          }
          case "tasks":
            value = { tasks: jobs.tasks() };
            break;
          case "task":
            value = jobs.task(text(input.jobId));
            break;
          case "cancel":
            value = jobs.cancel(text(input.jobId));
            break;
          case "loginDone":
            value = jobs.loginDone(text(input.jobId));
            break;
          default:
            return failure("wandao/not-found", "未知操作");
        }
        return { ok: true, value };
      } catch (error) {
        return failure(
          "wandao/request-failed",
          error instanceof Error ? error.message : "操作失败",
        );
      }
    };
    // Use exact shared-API routes only. The legacy rpc.handle() route reads
    // webServer from Connection's provider context and fails in real DSH.
    const connection = (
      scope as unknown as {
        connection: {
          fetch: {
            register(route: {
              path: string;
              methods: string[];
              requestBody: string;
              fetch(request: Request): Promise<Response>;
            }): () => unknown;
          };
        };
      }
    ).connection;
    // Use the shared API carrier: proxies and non-HTTP DSH transports may
    // forward only /api and treat arbitrary paths as GET-only page resources.
    // Connection admits only owner peers to these exact Fetch routes.
    for (const endpoint of [
      "catalogue",
      "describe",
      "start",
      "tasks",
      "task",
      "cancel",
      "loginDone",
      "saveCredentials",
    ]) {
      scope.effect(
        () =>
          connection.fetch.register({
            path: `/api/wandao/${endpoint}`,
            methods: ["POST"],
            requestBody: "buffered",
            async fetch(request) {
              let message: any;
              try {
                const body = await request.text();
                if (body.length > 1048576)
                  return new Response("Request too large", { status: 413 });
                message = JSON.parse(body);
              } catch {
                return new Response("Invalid JSON request", { status: 400 });
              }
              if (
                !message ||
                message.type !== "client-request" ||
                typeof message.rpcId !== "string" ||
                !message.rpcId ||
                message.method !== `wandao/${endpoint}`
              )
                return new Response("Invalid RPC envelope", { status: 400 });
              const result = await handler(
                endpoint,
                message.payload,
                request.signal,
                { principal: { kind: "owner" } },
              );
              return Response.json(
                { type: "server-response", rpcId: message.rpcId, result },
                { headers: { "cache-control": "no-store" } },
              );
            },
          }) as () => void,
      );
    }
    scope.logger.info("Wandao 页面接口已就绪 (/api/wandao/*)");
  });
}
