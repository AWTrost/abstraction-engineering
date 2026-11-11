// The command line: run, check-setup, conformance, install-skill. main() returns the exit code.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { callCapability } from "../runtime/capability.ts";
import { type ClassDef, loadSetup, SetupError } from "../runtime/classdef.ts";
import { type Io, need, runCli, UsageError, type Values } from "../runtime/cli.ts";
import { installSkill } from "../runtime/skill.ts";
import { validate } from "../runtime/validate.ts";
import { CASES_PATH, passes, score } from "./conformance.ts";
import { namedKeys } from "./gaps.ts";
import { CLASS_DIR, loadClass } from "./paths.ts";
import { type WriteDeps, write } from "./report.ts";
import { changeDiffs, run } from "./review.ts";
import type { Case, Change, RRSetup, Ticket } from "./types.ts";

const USAGE = `usage: release-review run --setup <path> --release <id>
       release-review check-setup --setup <path> --release <id>
       release-review conformance (--model <name> | --setup <path>)
       release-review install-skill [--project <dir>] [--copy]`;

/** Test hooks on top of the runtime's output: make rendering or the file swap fail, or shorten model timeouts. */
interface Deps extends Io, WriteDeps {
  fuzzy?: { timeoutMs?: number };
}

const str = (v: Values, k: string): string => v[k] as string;

function releaseId(id: string | undefined): string {
  // The id becomes part of a filename, so it must not be able to leave report_dir.
  if (!/^[A-Za-z0-9_.+-]+$/.test(id ?? "") || id!.includes("..")) throw new UsageError(`bad release id: ${id}`);
  return id!;
}

/** The team's own cases, resolved from the setup file's folder so the two move together. */
export function loadTeamCases(setup: RRSetup, setupPath: string, cls: ClassDef): Case[] {
  const path = resolve(dirname(setupPath), setup.conformance_cases!);
  let cases: unknown;
  try {
    cases = JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    throw new SetupError(`conformance_cases: cannot read ${path}: ${(e as Error).message}`);
  }
  const err = validate({ type: "array", items: { $ref: "#/$defs/Case" } }, cases, cls);
  if (err) throw new SetupError(`conformance_cases: ${err}`);
  if (!(cases as Case[]).length) throw new SetupError("conformance_cases: the file has no cases");
  return cases as Case[];
}

function cmdRun(v: Values, d: Deps): number {
  need(v, USAGE, "setup", "release");
  const cls = loadClass();
  const release = releaseId(str(v, "release"));
  const setup = loadSetup<RRSetup>(str(v, "setup"), cls);
  const data = run(setup, cls, release);
  let paths;
  try {
    paths = write(setup.report_dir, release, data, d);
  } catch (e) {
    if (!(e as NodeJS.ErrnoException).code) throw e; // not a file-system error: a bug, so let it show
    d.err(`release-review: cannot write report: ${(e as Error).message}`);
    return 2;
  }
  paths.forEach((p) => d.out(p));
  return 0;
}

function cmdCheckSetup(v: Values, d: Deps): number {
  need(v, USAGE, "setup", "release");
  const cls = loadClass();
  const release = releaseId(str(v, "release"));
  const setup = loadSetup<RRSetup>(str(v, "setup"), cls);
  const vars = { release };
  d.out(`ok setup: fits ${cls.name}@${cls.version}`);
  const planned = callCapability<Ticket[]>(setup, cls, "planned_tickets", vars);
  d.out(`ok planned_tickets: ${planned.length} tickets`);
  const changes = callCapability<Change[]>(setup, cls, "release_changes", vars);
  d.out(`ok release_changes: ${changes.length} changes`);
  const keys = namedKeys(changes);
  if (keys.length) {
    const found = callCapability<Ticket[]>(setup, cls, "tickets", vars, keys);
    d.out(`ok tickets: ${found.length} of ${keys.length} keys found`);
  } else {
    d.out("skipped tickets: no change names a ticket");
  }
  // A few ids are enough to prove the binding answers in shape; the run asks for all it needs.
  const sample = changes.slice(0, 3).map((c) => c.id);
  if (sample.length) {
    changeDiffs(setup, cls, vars, sample);
    d.out(`ok change_diffs: ${sample.length} of ${sample.length} diffs found`);
  } else {
    d.out("skipped change_diffs: the release has no changes");
  }
  if (setup.conformance_cases !== undefined) {
    d.out(`ok conformance_cases: ${loadTeamCases(setup, str(v, "setup"), cls).length} cases`);
  }
  d.out("not called change_matches_ticket: it may spend money; run conformance to score it");
  return 0;
}

function cmdConformance(v: Values, d: Deps): number {
  if ((v.model === undefined) === (v.setup === undefined)) throw new UsageError(`give one of --model or --setup\n${USAGE}`);
  const cls = loadClass();
  const setup = v.setup === undefined ? null : loadSetup<RRSetup>(str(v, "setup"), cls);
  const binding = setup ? setup.bindings.change_matches_ticket : { model: str(v, "model") };
  const team = setup?.conformance_cases !== undefined ? loadTeamCases(setup!, str(v, "setup"), cls) : null;
  const result: Record<string, ReturnType<typeof score>> = {
    class_cases: score(JSON.parse(readFileSync(CASES_PATH, "utf8")), binding, cls, d.fuzzy),
  };
  // Scored apart, never pooled: the team's cases are held out, the class's are not.
  if (team) result.team_cases = score(team, binding, cls, d.fuzzy);
  d.out(JSON.stringify(result, null, 2));
  return Object.values(result).every(passes) ? 0 : 1;
}

function cmdInstallSkill(v: Values, d: Deps): number {
  return installSkill({ classDir: CLASS_DIR, name: "release-review", project: (v.project as string | undefined) ?? d.cwd, copy: Boolean(v.copy), out: d.out });
}

export function main(argv: string[], deps: Partial<Deps> = {}): number {
  return runCli<Deps>({
    prog: "release-review",
    usage: USAGE,
    options: { setup: { type: "string" }, release: { type: "string" }, model: { type: "string" },
      project: { type: "string" }, copy: { type: "boolean" } },
    commands: { run: cmdRun, "check-setup": cmdCheckSetup, conformance: cmdConformance, "install-skill": cmdInstallSkill },
  }, argv, deps);
}
