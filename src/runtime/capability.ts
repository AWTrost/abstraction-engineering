// Call a capability: run the command the setup binds to it and check its JSON output against the contract.
import { spawnSync } from "node:child_process";
import type { ClassDef, CmdBinding, Setup } from "./classdef.ts";
import { validate } from "./validate.ts";

export const TIMEOUT_MS = 300_000; // the design's capability timeout
const MAX_BUFFER = 256 * 1024 * 1024; // spawnSync's default of 1 MB is too small for a big release

export class BindingError extends Error {
  capability: string;
  constructor(capability: string, message: string) {
    super(`${capability}: ${message}`);
    this.capability = capability;
  }
}

/** Fills each `{name}` in an argv entry from vars, such as `{release}` from the run's release id. */
export function fillArgs(argv: string[], vars: Record<string, string>): string[] {
  return argv.map((a) => Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, v), a));
}

/** Runs a capability's command and returns its validated JSON output. stdin, when given, is sent as JSON. */
export function callCapability<T = unknown>(setup: Pick<Setup, "bindings">, cls: ClassDef, name: string,
  vars: Record<string, string>, stdin?: unknown, { timeoutMs = TIMEOUT_MS }: { timeoutMs?: number } = {}): T {
  const argv = fillArgs((setup.bindings[name] as CmdBinding).cmd, vars);
  const r = spawnSync(argv[0], argv.slice(1), {
    input: stdin === undefined ? "" : JSON.stringify(stdin),
    encoding: "utf8", timeout: timeoutMs, maxBuffer: MAX_BUFFER,
  });
  const code = (r.error as NodeJS.ErrnoException | undefined)?.code;
  if (code === "ETIMEDOUT") throw new BindingError(name, `timed out after ${timeoutMs / 1000} seconds`);
  if (r.error) throw new BindingError(name, `cannot run command: ${r.error.message}`);
  if (r.status !== 0) throw new BindingError(name, `exit ${r.status ?? r.signal}: ${r.stderr.trim().replace(/\s*\n\s*/g, " ").slice(0, 500)}`);
  let out: unknown;
  try {
    out = JSON.parse(r.stdout);
  } catch (e) {
    throw new BindingError(name, `output is not JSON: ${(e as Error).message}`);
  }
  const err = validate(cls.capabilities[name].output, out, cls);
  if (err) throw new BindingError(name, err);
  return out as T;
}
