// The command-line frame a class's CLI runs in: argument parsing, help, and turning known errors into exit 2.
import { parseArgs, type ParseArgsConfig } from "node:util";
import { PinError, SetupError } from "./classdef.ts";
import { BindingError } from "./capability.ts";

export class UsageError extends Error {}

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
export function need(values: Values, usage: string, ...names: string[]): void {
  for (const n of names) if (values[n] === undefined) throw new UsageError(`--${n} is required\n${usage}`);
}

const KNOWN = [UsageError, PinError, SetupError, BindingError];

/** Runs one command and returns its exit code. A known error prints one line to err and returns 2; anything else is a bug and is thrown. */
export function runCli<D extends Io>(spec: CliSpec<D>, argv: string[], deps: Partial<D> = {}): number {
  const io = { out: (s: string) => process.stdout.write(`${s}\n`), err: (s: string) => process.stderr.write(`${s}\n`), cwd: process.cwd(), ...deps } as unknown as D;
  const [cmd, ...rest] = argv;
  try {
    const { values } = parseArgs({ args: rest, options: { ...spec.options, help: { type: "boolean" } }, strict: true });
    if (values.help || cmd === undefined || cmd === "--help") {
      io.out(spec.usage);
      return cmd === undefined ? 2 : 0;
    }
    const run = Object.hasOwn(spec.commands, cmd) ? spec.commands[cmd] : undefined;
    if (!run) throw new UsageError(`unknown command: ${cmd}\n${spec.usage}`);
    return run(values as Values, io);
  } catch (e) {
    const code = (e as NodeJS.ErrnoException)?.code;
    const known = KNOWN.some((k) => e instanceof k) || (typeof code === "string" && code.startsWith("ERR_PARSE_ARGS"));
    if (!known) throw e;
    io.err(`${spec.prog}: ${(e as Error).message}`);
    return 2;
  }
}
