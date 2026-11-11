import type { Binding } from "../runtime/classdef.ts";
import type { Schema } from "../runtime/validate.ts";
import type { JudgedChange, MatchResult, Ticket } from "./types.ts";
export declare const CAP = 4000;
export declare const DIFF_CAP = 20000;
export interface MatchInputs {
    ticket: Ticket;
    changes: JudgedChange[];
}
/** Returns [inputs, truncated]: the function's input with long text fields cut to CAP and diffs to DIFF_CAP. */
export declare function payload(ticket: Ticket, changes: JudgedChange[]): [MatchInputs, boolean];
/** Returns [result, cost_usd]. Never throws: a failure is {verdict: "unclear", reason: "binding failed: ..."}. */
export declare function call(binding: Binding, prompt: string, schema: Schema, inputs: MatchInputs, { timeoutMs }?: {
    timeoutMs?: number;
}): [MatchResult, number];
