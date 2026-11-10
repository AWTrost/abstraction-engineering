// Load the class definition and a setup file, check the setup's version pin, and call a capability.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { validate } from "./validate.js";

export const CLASS_DIR = dirname(dirname(fileURLToPath(import.meta.url)));
export const TIMEOUT_MS = 300_000; // the design's capability timeout
const MAX_BUFFER = 256 * 1024 * 1024; // spawnSync's default of 1 MB is too small for a big release

export class PinError extends Error {}
export class SetupError extends Error {}
export class BindingError extends Error {
  constructor(capability, message) {
    super(`${capability}: ${message}`);
    this.capability = capability;
  }
}

export function loadClass() {
  return JSON.parse(readFileSync(join(CLASS_DIR, "class.json"), "utf8"));
}

export function checkPin(setup, cls) {
  const want = `${cls.name}@${cls.version}`;
  if (setup.class !== want) {
    throw new PinError(`setup is pinned to ${JSON.stringify(setup.class ?? null)} but this class is ${JSON.stringify(want)}`);
  }
}

export function loadSetup(path, cls) {
  let setup;
  try {
    setup = JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    throw new SetupError(`cannot read setup ${path}: ${e.message}`);
  }
  if (setup === null || typeof setup !== "object" || Array.isArray(setup)) throw new SetupError("setup must be a JSON object");
  checkPin(setup, cls); // first, so another version's setup gets the pin error
  const err = validate(cls.setup, setup, cls);
  if (err) throw new SetupError(`setup: ${err}`);
  return setup;
}

/** Run a capability's command and return its validated JSON output. stdin, when given, is sent as JSON. */
export function callCapability(setup, cls, name, release, stdin, { timeoutMs = TIMEOUT_MS } = {}) {
  const argv = setup.bindings[name].cmd.map((a) => a.replaceAll("{release}", release));
  const r = spawnSync(argv[0], argv.slice(1), {
    input: stdin === undefined ? "" : JSON.stringify(stdin),
    encoding: "utf8", timeout: timeoutMs, maxBuffer: MAX_BUFFER,
  });
  if (r.error?.code === "ETIMEDOUT") throw new BindingError(name, `timed out after ${timeoutMs / 1000} seconds`);
  if (r.error) throw new BindingError(name, `cannot run command: ${r.error.message}`);
  if (r.status !== 0) throw new BindingError(name, `exit ${r.status ?? r.signal}: ${r.stderr.trim().replace(/\s*\n\s*/g, " ").slice(0, 500)}`);
  let out;
  try {
    out = JSON.parse(r.stdout);
  } catch (e) {
    throw new BindingError(name, `output is not JSON: ${e.message}`);
  }
  const err = validate(cls.capabilities[name].output, out, cls);
  if (err) throw new BindingError(name, err);
  return out;
}
