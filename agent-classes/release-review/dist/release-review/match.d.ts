import type { Binding } from "../runtime/classdef.ts";
import type { Schema } from "../runtime/validate.ts";
import type { Change, MatchResult, Ticket } from "./types.ts";
export declare const CAP = 4000;
export interface MatchInputs {
    ticket: Ticket;
    changes: Change[];
}
/** Returns [inputs, truncated]: the function's input with long text fields cut to CAP. */
export declare function payload(ticket: Ticket, changes: Change[]): [MatchInputs, boolean];
/** Returns [result, cost_usd]. Never throws: a failure is {verdict: "unclear", reason: "binding failed: ..."}. */
export declare function call(binding: Binding, prompt: string, schema: Schema, inputs: MatchInputs, { timeoutMs }?: {
    timeoutMs?: number;
}): [MatchResult, number];
