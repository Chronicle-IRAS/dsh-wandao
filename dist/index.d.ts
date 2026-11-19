import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';
import { type RuntimeConfig } from './runtime.js';
declare module '@deepseek-ai/dsh-jobs/view' {
    interface JobKindMap {
        wandao: 'wandao';
    }
}
export declare const name = "wandao";
export declare const inject: string[];
export interface Config extends RuntimeConfig {
}
export declare const Config: Schema<Config>;
export declare function apply(ctx: Context, config: Config): void;
