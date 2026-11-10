import type { Binding, ClassDef } from "../runtime/classdef.ts";
import { CASES_PATH } from "./paths.ts";
import type { Case } from "./types.ts";
export { CASES_PATH };
export declare const PASS = 0.8;
export interface Score {
    binding: Binding;
    n: number;
    correct: number;
    score: number;
    cost_usd: number;
    misses: string[];
    hard_misses: string[];
}
export declare function score(cases: Case[], binding: Binding, cls: ClassDef, opts?: {
    timeoutMs?: number;
}): Score;
/** A run passes at the bar with no hard miss. */
export declare const passes: (r: Pick<Score, "score" | "hard_misses">) => boolean;
export declare const mainExit: (r: Pick<Score, "score" | "hard_misses">) => number;
