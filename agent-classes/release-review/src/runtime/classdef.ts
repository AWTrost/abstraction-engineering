// Load a class's contract (class.json) and a team's setup file, and check the setup's version pin.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { type Schema, validate } from "./validate.ts";

export interface Capability {
  description?: string;
  stdin?: Schema;
  output: Schema;
}

export interface TypedFunction {
  description?: string;
  /** Path of the prompt file, relative to the class folder. */
  prompt: string;
  input: Schema;
  output: Schema;
}

/** A class contract: what class.json holds. $ref in any schema resolves against this object. */
export interface ClassDef {
  name: string;
  version: string;
  states?: string[];
  $defs?: Record<string, Schema>;
  capabilities: Record<string, Capability>;
  functions: Record<string, TypedFunction>;
  setup: Schema;
}

export type CmdBinding = { cmd: string[] };
export type ModelBinding = { model: string };
export type Binding = CmdBinding | ModelBinding;

/** What every setup has. A class's own setup type adds its keys; the contract's setup schema checks them. */
export interface Setup {
  name: string;
  class: string;
  bindings: Record<string, Binding>;
}

export class PinError extends Error {}
export class SetupError extends Error {}

export function loadClass(classDir: string): ClassDef {
  return JSON.parse(readFileSync(join(classDir, "class.json"), "utf8")) as ClassDef;
}

export function checkPin(setup: { class?: unknown }, cls: ClassDef): void {
  const want = `${cls.name}@${cls.version}`;
  if (setup.class !== want) {
    throw new PinError(`setup is pinned to ${JSON.stringify(setup.class ?? null)} but this class is ${JSON.stringify(want)}`);
  }
}

/** Reads and checks a setup file: the pin first, so another version's setup gets the pin error, then the contract's setup schema. */
export function loadSetup<S extends Setup>(path: string, cls: ClassDef): S {
  let setup: unknown;
  try {
    setup = JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    throw new SetupError(`cannot read setup ${path}: ${(e as Error).message}`);
  }
  if (setup === null || typeof setup !== "object" || Array.isArray(setup)) throw new SetupError("setup must be a JSON object");
  checkPin(setup as { class?: unknown }, cls);
  const err = validate(cls.setup, setup, cls);
  if (err) throw new SetupError(`setup: ${err}`);
  return setup as S;
}

/** The text of a typed function's prompt file. */
export function loadPrompt(classDir: string, fn: TypedFunction): string {
  return readFileSync(join(classDir, fn.prompt), "utf8");
}
