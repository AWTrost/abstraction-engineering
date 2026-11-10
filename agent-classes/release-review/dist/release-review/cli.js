// The command line: run, check-setup, conformance, install-skill. main() returns the exit code.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { callCapability } from "../runtime/capability.js";
import { loadSetup, SetupError } from "../runtime/classdef.js";
import { need, runCli, UsageError } from "../runtime/cli.js";
import { installSkill } from "../runtime/skill.js";
import { validate } from "../runtime/validate.js";
import { CASES_PATH, passes, score } from "./conformance.js";
import { namedKeys } from "./gaps.js";
import { CLASS_DIR, loadClass } from "./paths.js";
import { write } from "./report.js";
import { run } from "./review.js";
const USAGE = `usage: release-review run --setup <path> --release <id>
       release-review check-setup --setup <path> --release <id>
       release-review conformance (--model <name> | --setup <path>)
       release-review install-skill [--project <dir>] [--copy]`;
const str = (v, k) => v[k];
function releaseId(id) {
    // The id becomes part of a filename, so it must not be able to leave report_dir.
    if (!/^[A-Za-z0-9_.+-]+$/.test(id ?? "") || id.includes(".."))
        throw new UsageError(`bad release id: ${id}`);
    return id;
}
/** The team's own cases, resolved from the setup file's folder so the two move together. */
export function loadTeamCases(setup, setupPath, cls) {
    const path = resolve(dirname(setupPath), setup.conformance_cases);
    let cases;
    try {
        cases = JSON.parse(readFileSync(path, "utf8"));
    }
    catch (e) {
        throw new SetupError(`conformance_cases: cannot read ${path}: ${e.message}`);
    }
    const err = validate({ type: "array", items: { $ref: "#/$defs/Case" } }, cases, cls);
    if (err)
        throw new SetupError(`conformance_cases: ${err}`);
    if (!cases.length)
        throw new SetupError("conformance_cases: the file has no cases");
    return cases;
}
function cmdRun(v, d) {
    need(v, USAGE, "setup", "release");
    const cls = loadClass();
    const release = releaseId(str(v, "release"));
    const setup = loadSetup(str(v, "setup"), cls);
    const data = run(setup, cls, release);
    let paths;
    try {
        paths = write(setup.report_dir, release, data, d);
    }
    catch (e) {
        if (!e.code)
            throw e; // not a file-system error: a bug, so let it show
        d.err(`release-review: cannot write report: ${e.message}`);
        return 2;
    }
    paths.forEach((p) => d.out(p));
    return 0;
}
function cmdCheckSetup(v, d) {
    need(v, USAGE, "setup", "release");
    const cls = loadClass();
    const release = releaseId(str(v, "release"));
    const setup = loadSetup(str(v, "setup"), cls);
    const vars = { release };
    d.out(`ok setup: fits ${cls.name}@${cls.version}`);
    const planned = callCapability(setup, cls, "planned_tickets", vars);
    d.out(`ok planned_tickets: ${planned.length} tickets`);
    const changes = callCapability(setup, cls, "release_changes", vars);
    d.out(`ok release_changes: ${changes.length} changes`);
    const keys = namedKeys(changes);
    if (keys.length) {
        const found = callCapability(setup, cls, "tickets", vars, keys);
        d.out(`ok tickets: ${found.length} of ${keys.length} keys found`);
    }
    else {
        d.out("skipped tickets: no change names a ticket");
    }
    if (setup.conformance_cases !== undefined) {
        d.out(`ok conformance_cases: ${loadTeamCases(setup, str(v, "setup"), cls).length} cases`);
    }
    d.out("not called change_matches_ticket: it may spend money; run conformance to score it");
    return 0;
}
function cmdConformance(v, d) {
    if ((v.model === undefined) === (v.setup === undefined))
        throw new UsageError(`give one of --model or --setup\n${USAGE}`);
    const cls = loadClass();
    const setup = v.setup === undefined ? null : loadSetup(str(v, "setup"), cls);
    const binding = setup ? setup.bindings.change_matches_ticket : { model: str(v, "model") };
    const team = setup?.conformance_cases !== undefined ? loadTeamCases(setup, str(v, "setup"), cls) : null;
    const result = {
        class_cases: score(JSON.parse(readFileSync(CASES_PATH, "utf8")), binding, cls, d.fuzzy),
    };
    // Scored apart, never pooled: the team's cases are held out, the class's are not.
    if (team)
        result.team_cases = score(team, binding, cls, d.fuzzy);
    d.out(JSON.stringify(result, null, 2));
    return Object.values(result).every(passes) ? 0 : 1;
}
function cmdInstallSkill(v, d) {
    return installSkill({ classDir: CLASS_DIR, name: "release-review", project: v.project ?? d.cwd, copy: Boolean(v.copy), out: d.out });
}
export function main(argv, deps = {}) {
    return runCli({
        prog: "release-review",
        usage: USAGE,
        options: { setup: { type: "string" }, release: { type: "string" }, model: { type: "string" },
            project: { type: "string" }, copy: { type: "boolean" } },
        commands: { run: cmdRun, "check-setup": cmdCheckSetup, conformance: cmdConformance, "install-skill": cmdInstallSkill },
    }, argv, deps);
}
