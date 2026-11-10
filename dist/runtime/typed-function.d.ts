import type { Binding } from "./classdef.ts";
import { type Schema } from "./validate.ts";
export declare const TIMEOUT_MS = 120000;
export declare function modelArgv(model: string, schema: Schema): string[];
/** Returns [structured_output, cost_usd] from claude's JSON stdout; throws on an error result. */
export declare function parseModelOutput(stdout: string): [Record<string, unknown>, number];
export interface CallOptions<R> {
    /** The result to return when the call fails, given a one-line reason that starts "binding failed:". */
    fallback: (reason: string) => R;
    timeoutMs?: number;
}
/** Returns [result, cost_usd]. Never throws: a failure returns fallback(reason) at no cost. */
export declare function callFunction<R>(binding: Binding, prompt: string, schema: Schema, inputs: unknown, { fallback, timeoutMs }: CallOptions<R>): [R, number];
