import type { ProviderAction, ProviderDescription } from "../ui-contract.js";
export type Values = Record<string, string | number | boolean>;
export type Options = Record<string, Array<{
    value: string;
    label: string;
}>>;
export declare function fieldsForAction(description: ProviderDescription, actionId: string): import("../ui-contract.js").ProviderField[];
export declare function initialValues(description: ProviderDescription, outputRoot: string): Values;
export declare function valuesForAction(description: ProviderDescription, actionId: string, values: Values): Values;
export declare function scanRows(description: ProviderDescription, data: unknown): Array<{
    id: string;
    title: string;
}>;
export declare function updatedOptions(action: ProviderAction, data: unknown): Options;
export declare function parsePreview(preview?: string): unknown;
export declare const terminal: (status: string) => boolean;
