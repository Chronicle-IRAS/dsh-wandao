import type { ActionRequest, ActionResult, ProviderInfo } from "./runtime.js";
export type { ActionRequest, ActionResult, ProviderInfo };
export interface ProviderField {
    name: string;
    label?: string;
    type?: string;
    private: boolean;
    required?: boolean;
    actions?: string[];
    default?: string | number | boolean;
    min?: number;
    max?: number;
    options?: Array<string | {
        value: string;
        label?: string;
    }>;
}
export interface ProviderAction {
    id: string;
    kind: string;
    label?: string;
    confirm?: string;
    danger?: boolean;
    includeSelection?: boolean;
    updates?: Array<{
        field: string;
        path: string;
        type: string;
        valueKey?: string;
        labelKey?: string;
    }>;
}
export interface ProviderDescription {
    title?: string;
    providerId: string;
    pluginId: string;
    description: string;
    guide: string;
    fields: ProviderField[];
    actions: ProviderAction[];
    checkpoint: {
        supported?: boolean;
    };
    toc?: {
        adapter?: string;
        itemsPath?: string;
        idKey?: string;
        exportIdKey?: string;
        titleKey?: string;
        selectableKey?: string;
    };
}
export interface UiTask {
    jobId: string;
    label: string;
    startedAt: number;
    status: string;
    progress: string;
    detail: string;
    canConfirmLogin: boolean;
    result?: ActionResult;
}
export interface Catalogue {
    providers: ProviderInfo[];
    vaultRoots: string[];
    outputRoot: string;
}
export interface UiApi {
    catalogue(signal?: AbortSignal): Promise<Catalogue>;
    describe(providerId: string, signal?: AbortSignal): Promise<ProviderDescription>;
    start(request: ActionRequest): Promise<{
        jobId: string;
    }>;
    tasks(signal?: AbortSignal): Promise<{
        tasks: UiTask[];
    }>;
    cancel(jobId: string): Promise<unknown>;
    loginDone(jobId: string): Promise<unknown>;
    saveCredentials(providerId: string, fields: Record<string, string>): Promise<unknown>;
}
