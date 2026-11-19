export declare const bundledRuntimeRoot: string;
export interface RunnerConfig {
    python: string;
    vaultRoots: string[];
    outputRoot: string;
    timeoutMs?: number;
    maxOutputBytes?: number;
    maxScanNodes?: number;
}
export interface ExportRequest {
    vault: string;
    destination: string;
    docIds?: string[];
    incremental?: boolean;
}
export interface Progress {
    current: number;
    total: number;
}
export interface RunOptions {
    signal?: AbortSignal;
    onProgress?: (progress: Progress) => void;
}
export interface ScanNode {
    nodeId: string;
    exportId: string;
    title: string;
    parentNodeId: string;
    selectable: boolean;
}
export interface ScanResult {
    providerId: string;
    totalDocs: number;
    nodes: ScanNode[];
    truncated: boolean;
}
export interface ExportResult {
    providerId: string;
    outcome: 'completed' | 'partial' | 'failed';
    output: string;
    totalDocs: number;
    exportedDocs: number;
    skippedDocs: number;
    failureCount: number;
    resourceFailureCount: number;
}
export declare class WandaoRunner {
    readonly config: RunnerConfig;
    private readonly activeOutputs;
    constructor(config: RunnerConfig);
    private vault;
    private run;
    scan(input: string, options?: RunOptions): Promise<ScanResult>;
    export(request: ExportRequest, options?: RunOptions): Promise<ExportResult>;
}
export declare function runJsonProcess(command: string, args: string[], options: {
    cwd: string;
    signal?: AbortSignal;
    timeoutMs: number;
    maxOutputBytes: number;
    onProgress?: (progress: Progress) => void;
    input?: string;
    keepStdin?: boolean;
    onInput?: (confirm: () => void) => void;
    env?: NodeJS.ProcessEnv;
    onStop?: () => void;
    cooperativeStopMs?: number;
}): Promise<{
    data: Record<string, any>;
    exitCode: number;
}>;
