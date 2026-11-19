import { type RunOptions, type RunnerConfig } from './runner.js';
export interface ActionRequest {
    providerId: string;
    actionId: string;
    fields?: Record<string, unknown>;
    docIds?: string[];
    confirmWrite?: boolean;
    resume?: boolean;
}
export interface ActionOptions extends RunOptions {
    onInput?: (confirm: () => void) => void;
}
export interface ProviderInfo {
    id: string;
    title: string;
    loginRequired: boolean;
    supported: boolean;
    platforms: string[];
    actions: string[];
}
export interface ActionResult {
    providerId: string;
    actionId: string;
    outcome: string;
    preview: string;
    truncated: boolean;
}
export interface RuntimeConfig extends RunnerConfig {
    dataDir?: string;
    browser?: string;
}
export declare class ProviderRuntime {
    private readonly config;
    private active;
    constructor(config: RuntimeConfig);
    private call;
    providers(options?: RunOptions): Promise<{
        providers: ProviderInfo[];
    }>;
    describe(id: string, options?: RunOptions): Promise<Record<string, unknown>>;
    saveCredentials(providerId: string, fields: Record<string, unknown>, options?: RunOptions): Promise<{
        saved: boolean;
    }>;
    execute(request: ActionRequest, options?: ActionOptions): Promise<ActionResult>;
}
