// The command line: run, check-setup, conformance, install-skill. main() returns the exit code.
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { parseArgs } from "node:util";
import { BindingError, CLASS_DIR, PinError, SetupError, callCapability, loadClass, loadSetup } from "./binding.js";
import { CASES_PATH, passes, score } from "./conformance.js";
import { namedKeys } from "./gaps.js";
import { write } from "./report.js";
import { run } from "./review.js";
import { validate } from "./validate.js";

const USAGE = `usage: release-review run --setup <path> --release <id>
       release-review check-setup --setup <path> --release <id>
       release-review conformance (--model <name> | --setup <path>)
       release-review install-skill [--project <dir>] [--copy]`;

const OPTIONS = {
  setup: { type: "string" }, release: { type: "string" }, model: { type: "string" },
  project: { type: "string" }, copy: { type: "boolean" }, help: { type: "boolean" },
};
const COPY_MARK = ".copied-by-release-review";

class UsageError extends Error {}

function releaseId(id) {
  // The id becomes part of a filename, so it must not be able to leave report_dir.
  if (!/^[A-Za-z0-9_.+-]+$/.test(id ?? "") || id.includes("..")) throw new UsageError(`bad release id: ${id}`);
  return id;
}

function need(values, ...names) {
  for (const n of names) if (values[n] === undefined) throw new UsageError(`--${n} is required\n${USAGE}`);
}

/** The team's own cases, resolved from the setup file's folder so the two move together. */
export function loadTeamCases(setup, setupPath, cls) {
  const path = resolve(dirname(setupPath), setup.conformance_cases);
  let cases;
  try {
    cases = JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    throw new SetupError(`conformance_cases: cannot read ${path}: ${e.message}`);
  }
  const err = validate({ type: "array", items: { $ref: "#/$defs/Case" } }, cases, cls);
  if (err) throw new SetupError(`conformance_cases: ${err}`);
  if (!cases.length) throw new SetupError("conformance_cases: the file has no cases");
  return cases;
}

function cmdRun(v, cls, d) {
  need(v, "setup", "release");
  const release = releaseId(v.release);
  const setup = loadSetup(v.setup, cls);
  const data = run(setup, cls, release);
  let paths;
  try {
    paths = write(setup.report_dir, release, data, d);
  } catch (e) {
    if (!e.code) throw e; // not a file-system error: a bug, so let it show
    d.err(`release-review: cannot write report: ${e.message}`);
    return 2;
  }
  paths.forEach((p) => d.out(p));
  return 0;
}

function cmdCheckSetup(v, cls, d) {
  need(v, "setup", "release");
  const release = releaseId(v.release);
  const setup = loadSetup(v.setup, cls);
  d.out(`ok setup: fits ${cls.name}@${cls.version}`);
  const planned = callCapability(setup, cls, "planned_tickets", release);
  d.out(`ok planned_tickets: ${planned.length} tickets`);
  const changes = callCapability(setup, cls, "release_changes", release);
  d.out(`ok release_changes: ${changes.length} changes`);
  const keys = namedKeys(changes);
  if (keys.length) {
    const found = callCapability(setup, cls, "tickets", release, keys);
    d.out(`ok tickets: ${found.length} of ${keys.length} keys found`);
  } else {
    d.out("skipped tickets: no change names a ticket");
  }
  if (setup.conformance_cases !== undefined) {
    d.out(`ok conformance_cases: ${loadTeamCases(setup, v.setup, cls).length} cases`);
  }
  d.out("not called change_matches_ticket: it may spend money; run conformance to score it");
  return 0;
}

function cmdConformance(v, cls, d) {
  if ((v.model === undefined) === (v.setup === undefined)) throw new UsageError(`give one of --model or --setup\n${USAGE}`);
  const setup = v.setup === undefined ? null : loadSetup(v.setup, cls);
  const binding = setup ? setup.bindings.change_matches_ticket : { model: v.model };
  const team = setup?.conformance_cases !== undefined ? loadTeamCases(setup, v.setup, cls) : null;
  const result = { class_cases: score(JSON.parse(readFileSync(CASES_PATH, "utf8")), binding, cls, d.fuzzy) };
  // Scored apart, never pooled: the team's cases are held out, the class's are not.
  if (team) result.team_cases = score(team, binding, cls, d.fuzzy);
  d.out(JSON.stringify(result, null, 2));
  return Object.values(result).every(passes) ? 0 : 1;
}

function cmdInstallSkill(v, d) {
  const skills = join(resolve(v.project ?? d.cwd), ".claude", "skills");
  const target = join(skills, "release-review");
  const src = join(CLASS_DIR, "skill");
  mkdirSync(skills, { recursive: true });
  let st = null;
  try {
    st = lstatSync(target);
  } catch { /* not there yet */ }
  if (st?.isSymbolicLink()) unlinkSync(target);
  else if (st && existsSync(join(target, COPY_MARK))) rmSync(target, { recursive: true });
  else if (st) throw new UsageError(`${target} exists and was not made by install-skill; move it first`);
  if (!v.copy) {
    try {
      // From the real paths: a symlinked parent (macOS /var, a linked checkout) would leave the link one level off.
      const rel = relative(realpathSync(skills), realpathSync(src));
      symlinkSync(rel, target, "dir");
      d.out(`linked ${target} -> ${rel}`);
      return 0;
    } catch (e) {
      d.out(`cannot link (${e.code ?? e.message}), copying instead`);
    }
  }
  cpSync(src, target, { recursive: true });
  writeFileSync(join(target, COPY_MARK), "");
  d.out(`copied the skill to ${target}. A copy does not follow the package: run install-skill again after every upgrade.`);
  return 0;
}

export function main(argv, deps = {}) {
  const d = { out: (s) => process.stdout.write(`${s}\n`), err: (s) => process.stderr.write(`${s}\n`), cwd: process.cwd(), ...deps };
  const [cmd, ...rest] = argv;
  try {
    const { values: v } = parseArgs({ args: rest, options: OPTIONS, strict: true });
    if (v.help || cmd === undefined || cmd === "--help") {
      d.out(USAGE);
      return cmd === undefined ? 2 : 0;
    }
    const cls = loadClass();
    if (cmd === "run") return cmdRun(v, cls, d);
    if (cmd === "check-setup") return cmdCheckSetup(v, cls, d);
    if (cmd === "conformance") return cmdConformance(v, cls, d);
    if (cmd === "install-skill") return cmdInstallSkill(v, d);
    throw new UsageError(`unknown command: ${cmd}\n${USAGE}`);
  } catch (e) {
    const known = e instanceof UsageError || e instanceof PinError || e instanceof SetupError || e instanceof BindingError
      || e.code?.startsWith?.("ERR_PARSE_ARGS");
    if (!known) throw e;
    d.err(`release-review: ${e.message}`);
    return 2;
  }
}
