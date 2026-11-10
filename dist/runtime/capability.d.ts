import type { ClassDef, Setup } from "./classdef.ts";
export declare const TIMEOUT_MS = 300000;
export declare class BindingError extends Error {
    capability: string;
    constructor(capability: string, message: string);
}
/** Fills each `{name}` in an argv entry from vars, such as `{release}` from the run's release id. */
export declare function fillArgs(argv: string[], vars: Record<string, string>): string[];
/** Runs a capability's command and returns its validated JSON output. stdin, when given, is sent as JSON. */
export declare function callCapability<T = unknown>(setup: Pick<Setup, "bindings">, cls: ClassDef, name: string, vars: Record<string, string>, stdin?: unknown, { timeoutMs }?: {
    timeoutMs?: number;
}): T;
