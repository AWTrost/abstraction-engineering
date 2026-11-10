// Fuzzy conformance: how many known ticket/change cases a binding judges correctly.
// Live runs spend money, so they happen on request only; the unit tests never call a model.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { CLASS_DIR } from "./binding.js";
import * as fuzzy from "./fuzzy.js";

export const PASS = 0.8; // placeholder bar until real scores show what is normal
export const CASES_PATH = join(CLASS_DIR, "conformance", "match_cases.json");

export function score(cases, binding, cls, opts = {}) {
  const fn = cls.functions.change_matches_ticket;
  const prompt = readFileSync(join(CLASS_DIR, fn.prompt), "utf8");
  const misses = [];
  const hardMisses = [];
  let cost = 0;
  for (const c of cases) {
    const [result, cCost] = fuzzy.call(binding, prompt, fn.output, fuzzy.payload(c.ticket, c.changes)[0], opts);
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
export const passes = (r) => r.score >= PASS && r.hard_misses.length === 0;
export const mainExit = (r) => (passes(r) ? 0 : 1);
