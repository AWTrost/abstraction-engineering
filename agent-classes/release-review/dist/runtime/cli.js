// The command-line frame a class's CLI runs in: argument parsing, help, and turning known errors into exit 2.
import { parseArgs } from "node:util";
import { PinError, SetupError } from "./classdef.js";
import { BindingError } from "./capability.js";
export class UsageError extends Error {
}
/** Throws a UsageError naming the first missing option. */
export function need(values, usage, ...names) {
    for (const n of names)
        if (values[n] === undefined)
            throw new UsageError(`--${n} is required\n${usage}`);
}
const KNOWN = [UsageError, PinError, SetupError, BindingError];
/** Runs one command and returns its exit code. A known error prints one line to err and returns 2; anything else is a bug and is thrown. */
export function runCli(spec, argv, deps = {}) {
    const io = { out: (s) => process.stdout.write(`${s}\n`), err: (s) => process.stderr.write(`${s}\n`), cwd: process.cwd(), ...deps };
    const [cmd, ...rest] = argv;
    try {
        const { values } = parseArgs({ args: rest, options: { ...spec.options, help: { type: "boolean" } }, strict: true });
        if (values.help || cmd === undefined || cmd === "--help") {
            io.out(spec.usage);
            return cmd === undefined ? 2 : 0;
        }
        const run = Object.hasOwn(spec.commands, cmd) ? spec.commands[cmd] : undefined;
        if (!run)
            throw new UsageError(`unknown command: ${cmd}\n${spec.usage}`);
        return run(values, io);
    }
    catch (e) {
        const code = e?.code;
        const known = KNOWN.some((k) => e instanceof k) || (typeof code === "string" && code.startsWith("ERR_PARSE_ARGS"));
        if (!known)
            throw e;
        io.err(`${spec.prog}: ${e.message}`);
        return 2;
    }
}
