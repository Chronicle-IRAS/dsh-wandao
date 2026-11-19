import type { Context } from "@deepseek-ai/cordis";
import type { ProviderRuntime, RuntimeConfig, ActionRequest } from "./runtime.js";
import type { UiTask } from "./ui-contract.js";
interface UiJobs {
    start(request: ActionRequest, signal: AbortSignal, label: string): {
        jobId: string;
    };
    tasks(): UiTask[];
    task(id: string): UiTask;
    cancel(id: string): unknown;
    loginDone(id: string): unknown;
}
type Reply = {
    ok: true;
    value: unknown;
} | {
    ok: false;
    error: {
        code: string;
        message: string;
        details: object;
    };
};
export type UiHandler = (endpoint: string, payload: unknown, signal: AbortSignal, peer: {
    principal: {
        kind: string;
    };
}) => Promise<Reply>;
export declare function registerUi(ctx: Context, config: RuntimeConfig, runtime: ProviderRuntime, jobs: UiJobs): void;
export {};
