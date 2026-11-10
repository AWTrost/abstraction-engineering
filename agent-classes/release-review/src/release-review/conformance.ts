// Conformance for change_matches_ticket: how many known ticket/change cases a binding judges correctly.
// Live runs spend money, so they happen on request only; the unit tests never call a model.
import type { Binding, ClassDef } from "../runtime/classdef.ts";
import { loadPrompt } from "../runtime/classdef.ts";
import * as match from "./match.ts";
import { CASES_PATH, CLASS_DIR } from "./paths.ts";
import type { Case } from "./types.ts";

export { CASES_PATH };
export const PASS = 0.8; // placeholder bar until real scores show what is normal

export interface Score {
  binding: Binding;
  n: number;
  correct: number;
  score: number;
  cost_usd: number;
  misses: string[];
  hard_misses: string[];
}

export function score(cases: Case[], binding: Binding, cls: ClassDef, opts: { timeoutMs?: number } = {}): Score {
  const fn = cls.functions.change_matches_ticket;
  const prompt = loadPrompt(CLASS_DIR, fn);
  const misses: string[] = [];
  const hardMisses: string[] = [];
  let cost = 0;
  for (const c of cases) {
    const [result, cCost] = match.call(binding, prompt, fn.output, match.payload(c.ticket, c.changes)[0], opts);
    cost += cCost;
    if (result.verdict !== c.expected) {
      misses.push(c.id);
      // Calling a gap "matches" hides it; the other errors only add noise.
      if ((c.expected === "partial" || c.expected === "unrelated") && result.verdict === "matches") hardMisses.push(c.id);
    }
  }
  const n = cases.length;
  return { binding, n, correct: n - misses.length, score: (n - misses.length) / n,
    cost_usd: Math.round(cost * 1e4) / 1e4, misses, hard_misses: hardMisses };
}

/** A run passes at the bar with no hard miss. */
export const passes = (r: Pick<Score, "score" | "hard_misses">): boolean => r.score >= PASS && r.hard_misses.length === 0;
export const mainExit = (r: Pick<Score, "score" | "hard_misses">): number => (passes(r) ? 0 : 1);
