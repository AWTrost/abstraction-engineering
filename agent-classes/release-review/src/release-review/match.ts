// The typed function change_matches_ticket: does a ticket's changes do what it asked?
// A failed call is the verdict "unclear", so a run never stops on one ticket.
import type { Binding } from "../runtime/classdef.ts";
import { callFunction } from "../runtime/typed-function.ts";
import type { Schema } from "../runtime/validate.ts";
import type { JudgedChange, MatchResult, Ticket } from "./types.ts";

export const CAP = 4000; // characters per text field
export const DIFF_CAP = 20_000; // characters per diff: a diff is far longer than a description

export interface MatchInputs { ticket: Ticket; changes: JudgedChange[] }

/** Returns [inputs, truncated]: the function's input with long text fields cut to CAP and diffs to DIFF_CAP. */
export function payload(ticket: Ticket, changes: JudgedChange[]): [MatchInputs, boolean] {
  let cut = false;
  const clip = <T extends object>(d: T, fields: string[], cap = CAP): T => {
    const out = { ...d } as Record<string, unknown>;
    for (const f of fields) {
      const v = out[f];
      if (typeof v === "string" && v.length > cap) {
        out[f] = v.slice(0, cap);
        cut = true;
      }
    }
    return out as unknown as T;
  };
  const inputs = { ticket: clip(ticket, ["summary", "description"]),
    changes: changes.map((c) => clip(clip(c, ["title", "description"]), ["diff"], DIFF_CAP)) };
  return [inputs, cut];
}

/** Returns [result, cost_usd]. Never throws: a failure is {verdict: "unclear", reason: "binding failed: ..."}. */
export function call(binding: Binding, prompt: string, schema: Schema, inputs: MatchInputs,
  { timeoutMs }: { timeoutMs?: number } = {}): [MatchResult, number] {
  return callFunction<MatchResult>(binding, prompt, schema, inputs, {
    fallback: (reason) => ({ verdict: "unclear", reason }), timeoutMs,
  });
}
