import { type ClassDef } from "../runtime/classdef.ts";
import { type Io } from "../runtime/cli.ts";
import { type WriteDeps } from "./report.ts";
import type { Case, RRSetup } from "./types.ts";
/** Test hooks on top of the runtime's output: make rendering or the file swap fail, or shorten model timeouts. */
interface Deps extends Io, WriteDeps {
    fuzzy?: {
        timeoutMs?: number;
    };
}
/** The team's own cases, resolved from the setup file's folder so the two move together. */
export declare function loadTeamCases(setup: RRSetup, setupPath: string, cls: ClassDef): Case[];
export declare function main(argv: string[], deps?: Partial<Deps>): number;
export {};
