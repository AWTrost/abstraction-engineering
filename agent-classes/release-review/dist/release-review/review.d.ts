import { type ClassDef } from "../runtime/classdef.ts";
import type { Report, RRSetup } from "./types.ts";
/** The diffs of the given changes, by id. A missing id stops the run: a verdict without its diff is a guess. */
export declare function changeDiffs(setup: RRSetup, cls: ClassDef, vars: Record<string, string>, ids: string[]): Map<string, string>;
export declare function run(setup: RRSetup, cls: ClassDef, release: string): Report;
