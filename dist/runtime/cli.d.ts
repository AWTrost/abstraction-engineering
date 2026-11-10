import { type ParseArgsConfig } from "node:util";
export declare class UsageError extends Error {
}
/** Output and test hooks. A class adds its own keys (a renderer, a rename) for its tests. */
export interface Io {
    out: (line: string) => void;
    err: (line: string) => void;
    cwd: string;
}
export type Values = Record<string, string | boolean | undefined>;
export type Command<D extends Io> = (values: Values, io: D) => number;
export interface CliSpec<D extends Io> {
    /** The program name, which prefixes every error line. */
    prog: string;
    usage: string;
    options: NonNullable<ParseArgsConfig["options"]>;
    commands: Record<string, Command<D>>;
}
/** Throws a UsageError naming the first missing option. */
export declare function need(values: Values, usage: string, ...names: string[]): void;
/** Runs one command and returns its exit code. A known error prints one line to err and returns 2; anything else is a bug and is thrown. */
export declare function runCli<D extends Io>(spec: CliSpec<D>, argv: string[], deps?: Partial<D>): number;
