import { loadPrompt } from "../runtime/classdef.js";
import * as match from "./match.js";
import { CASES_PATH, CLASS_DIR } from "./paths.js";
export { CASES_PATH };
export const PASS = 0.8; // placeholder bar until real scores show what is normal
export function score(cases, binding, cls, opts = {}) {
    const fn = cls.functions.change_matches_ticket;
    const prompt = loadPrompt(CLASS_DIR, fn);
    const misses = [];
    const hardMisses = [];
    let cost = 0;
    for (const c of cases) {
        const [result, cCost] = match.call(binding, prompt, fn.output, match.payload(c.ticket, c.changes)[0], opts);
        cost += cCost;
        if (result.verdict !== c.expected) {
            misses.push(c.id);
            // Calling a gap "matches" hides it; the other errors only add noise.
            if ((c.expected === "partial" || c.expected === "unrelated") && result.verdict === "matches")
                hardMisses.push(c.id);
        }
    }
    const n = cases.length;
    return { binding, n, correct: n - misses.length, score: (n - misses.length) / n,
        cost_usd: Math.round(cost * 1e4) / 1e4, misses, hard_misses: hardMisses };
}
/** A run passes at the bar with no hard miss. */
export const passes = (r) => r.score >= PASS && r.hard_misses.length === 0;
export const mainExit = (r) => (passes(r) ? 0 : 1);
