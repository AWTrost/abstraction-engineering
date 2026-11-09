import assert from "node:assert/strict";
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, readlinkSync, realpathSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, test } from "node:test";
import { CLASS_DIR, loadClass } from "../lib/binding.js";
import { main } from "../lib/cli.js";
import { validate } from "../lib/validate.js";
import { FIX, NODE, tmp } from "./helpers.js";

const FAIL = [NODE, "-e", "process.exit(1)"];

function makeSetup({ fixture = "demo", ticketsCmd, plannedCmd, cls = "release-review@0.2.0", extra = {} } = {}) {
  const d = tmp();
  const cmd = (cap) => ({ cmd: [NODE, join(FIX, "fake_binding.js"), join(FIX, fixture), cap, "{release}"] });
  const b = Object.fromEntries(["planned_tickets", "tickets", "release_changes"].map((c) => [c, cmd(c)]));
  if (ticketsCmd) b.tickets = { cmd: ticketsCmd };
  if (plannedCmd) b.planned_tickets = { cmd: plannedCmd };
  b.change_matches_ticket = { cmd: [NODE, join(FIX, "fake_match.js")] };
  const setup = { name: "demo", class: cls, fix_version: "{release}", bindings: b,
    status_map: { "Ready for QA Release": "awaiting_qa", "In QA": "in_qa", Ready: "todo", Closed: "done" },
    expected_states: ["awaiting_qa", "in_qa"], report_dir: join(d, "out"), signoff: "someone", ...extra };
  writeFileSync(join(d, "setup.json"), JSON.stringify(setup));
  return [join(d, "setup.json"), join(d, "out"), d];
}

function cli(argv, deps = {}) {
  const out = [];
  const err = [];
  const rc = main(argv, { out: (s) => out.push(s), err: (s) => err.push(s), ...deps });
  return { rc, out: out.join("\n"), err: err.join("\n"), errLines: err.join("\n").split("\n").filter(Boolean).length };
}

const runDemo = (opts, deps) => {
  const [s, out] = makeSetup(opts);
  return { ...cli(["run", "--setup", s, "--release", "demo-1.0"], deps), dir: out };
};
const reportJson = (dir) => JSON.parse(readFileSync(join(dir, "release-review-demo-1.0.json"), "utf8"));
const reportMd = (dir) => readFileSync(join(dir, "release-review-demo-1.0.md"), "utf8");

describe("cli run", () => {
  test("testEndToEndDemo", () => {
    const r = runDemo();
    assert.equal(r.rc, 0);
    const data = reportJson(r.dir);
    assert.equal(data.counts.planned, 4);
    assert.equal(data.counts.shipped, 6);
    assert.equal(data.verdicts[0].key, "DEMO-4");
  });

  test("testSignoffLine", () => {
    assert.ok(reportMd(runDemo().dir).includes("Draft: needs sign-off by someone."));
  });

  test("testReportMarksTruncated", () => {
    const { dir } = runDemo();
    assert.deepEqual(reportJson(dir).verdicts.filter((v) => v.truncated).map((v) => v.key), ["DEMO-2"]);
    assert.ok(reportMd(dir).includes("DEMO-2: matches (text cut)"));
  });

  test("testEmptyReleaseFirst", () => {
    const { dir } = runDemo({ fixture: "empty", ticketsCmd: FAIL });
    assert.ok(reportMd(dir).split("## Gaps\n\n")[1].startsWith("### empty_release"));
  });

  test("testEmptyReleaseSkipsTickets", () => {
    assert.equal(runDemo({ fixture: "empty", ticketsCmd: FAIL }).rc, 0);
  });

  test("testBindingFailureWritesNoReport", () => {
    const r = runDemo({ plannedCmd: FAIL });
    assert.equal(r.rc, 2);
    assert.equal(r.errLines, 1);
    assert.ok(!existsSync(r.dir));
  });

  test("testPinRefused", () => {
    const r = runDemo({ cls: "release-review@0.1.0" });
    assert.equal(r.rc, 2);
    assert.equal(r.errLines, 1);
    assert.ok(!existsSync(r.dir));
  });

  test("testBadReleaseId", () => {
    for (const bad of ["../x", "a/b", ".."]) {
      const [s, out] = makeSetup();
      const r = cli(["run", "--setup", s, "--release", bad]);
      assert.equal(r.rc, 2);
      assert.equal(r.errLines, 1);
      assert.ok(r.err.includes("bad release id"));
      assert.ok(!existsSync(out));
    }
    const [s] = makeSetup();
    assert.equal(cli(["run", "--setup", s, "--release", "demo-release-10-22-2026"]).rc, 0);
  });

  test("testRenderFailureLeavesNoFiles", () => {
    const [s, out] = makeSetup();
    assert.throws(() => cli(["run", "--setup", s, "--release", "demo-1.0"], { render: () => { throw new Error("boom"); } }), /boom/);
    assert.deepEqual(readdirSync(out), []);
  });

  test("testWriteOserrorReturns2", () => {
    const [s, out] = makeSetup();
    const disk = () => { throw Object.assign(new Error("disk"), { code: "EIO" }); };
    const r = cli(["run", "--setup", s, "--release", "demo-1.0"], { rename: disk });
    assert.equal(r.rc, 2);
    assert.equal(r.errLines, 1);
    assert.deepEqual(readdirSync(out), []);
  });

  test("every gap in the report fits the Gap schema", () => {
    const cls = loadClass();
    assert.equal(validate({ type: "array", items: { $ref: "#/$defs/Gap" } }, reportJson(runDemo().dir).gaps, cls), null);
  });

  test("a usage error exits 2", () => {
    assert.equal(cli(["run", "--setup", "x"]).rc, 2);
    assert.equal(cli(["frobnicate"]).rc, 2);
    assert.equal(cli(["run", "--nope"]).rc, 2);
  });
});

describe("cli check-setup", () => {
  test("a good setup passes and names each capability", () => {
    const [s] = makeSetup();
    const r = cli(["check-setup", "--setup", s, "--release", "demo-1.0"]);
    assert.equal(r.rc, 0, r.err);
    for (const cap of ["planned_tickets", "release_changes", "tickets"]) assert.match(r.out, new RegExp(`ok ${cap}`));
    assert.match(r.out, /not called change_matches_ticket/);
  });

  test("a binding with the wrong shape fails and names it", () => {
    const [s] = makeSetup({ plannedCmd: [NODE, "-e", "console.log('[{\"key\": 1}]')"] });
    const r = cli(["check-setup", "--setup", s, "--release", "demo-1.0"]);
    assert.equal(r.rc, 2);
    assert.match(r.err, /planned_tickets/);
  });

  test("bad team cases are refused", () => {
    const [s, , d] = makeSetup({ extra: { conformance_cases: "cases.json" } });
    writeFileSync(join(d, "cases.json"), JSON.stringify([{ id: "t1", ticket: {}, changes: [], expected: "matches" }]));
    const r = cli(["check-setup", "--setup", s, "--release", "demo-1.0"]);
    assert.equal(r.rc, 2);
    assert.match(r.err, /conformance_cases/);
  });
});

describe("cli conformance", () => {
  const oracle = (cases) => ({ cmd: [NODE, join(FIX, "oracle_match.js"), ...(cases ? [cases] : [])] });

  test("the setup's own binding is scored on the class cases", () => {
    const [s, , d] = makeSetup();
    const setup = JSON.parse(readFileSync(s, "utf8"));
    setup.bindings.change_matches_ticket = oracle();
    writeFileSync(join(d, "setup.json"), JSON.stringify(setup));
    const r = cli(["conformance", "--setup", s]);
    assert.equal(r.rc, 0, r.out);
    assert.equal(JSON.parse(r.out).class_cases.score, 1);
    assert.ok(!("team_cases" in JSON.parse(r.out)));
  });

  test("team cases are scored apart, and a hard miss there fails the run", () => {
    const [s, , d] = makeSetup({ extra: { conformance_cases: "cases.json" } });
    const classCases = JSON.parse(readFileSync(join(CLASS_DIR, "conformance", "match_cases.json"), "utf8"));
    // One team case, an unrelated one relabelled "matches" in the oracle's own file: the binding calls it matches.
    const team = [{ ...classCases.find((c) => c.expected === "unrelated"), id: "t1" }];
    writeFileSync(join(d, "cases.json"), JSON.stringify(team));
    writeFileSync(join(d, "oracle-cases.json"), JSON.stringify([...classCases.filter((c) => c.ticket.key !== team[0].ticket.key), { ...team[0], expected: "matches" }]));
    const setup = JSON.parse(readFileSync(s, "utf8"));
    setup.bindings.change_matches_ticket = oracle(join(d, "oracle-cases.json"));
    writeFileSync(join(d, "setup.json"), JSON.stringify(setup));
    const r = cli(["conformance", "--setup", s]);
    const res = JSON.parse(r.out);
    assert.deepEqual(res.team_cases.hard_misses, ["t1"]);
    assert.equal(res.team_cases.n, 1);
    assert.equal(res.class_cases.n, 16);
    assert.equal(r.rc, 1);
  });

  test("--model and --setup together are refused", () => {
    const [s] = makeSetup();
    assert.equal(cli(["conformance", "--model", "haiku", "--setup", s]).rc, 2);
    assert.equal(cli(["conformance"]).rc, 2);
  });
});

describe("cli install-skill", () => {
  test("links the skill with a relative path, and a re-run replaces the link", () => {
    const project = tmp();
    for (let i = 0; i < 2; i++) assert.equal(cli(["install-skill", "--project", project]).rc, 0);
    const link = join(project, ".claude", "skills", "release-review");
    assert.ok(lstatSync(link).isSymbolicLink());
    assert.ok(!readlinkSync(link).startsWith("/"));
    assert.equal(realpathSync(link), realpathSync(join(CLASS_DIR, "skill")));
    assert.ok(existsSync(join(link, "SKILL.md")));
  });

  test("--copy copies, says to re-run, and a re-run replaces the copy", () => {
    const project = tmp();
    let r;
    for (let i = 0; i < 2; i++) r = cli(["install-skill", "--project", project, "--copy"]);
    assert.equal(r.rc, 0);
    assert.match(r.out, /run install-skill again after every upgrade/);
    const dir = join(project, ".claude", "skills", "release-review");
    assert.ok(!lstatSync(dir).isSymbolicLink());
    assert.ok(existsSync(join(dir, "SKILL.md")));
  });

  test("refuses to replace a folder it did not make", () => {
    const project = tmp();
    mkdirSync(join(project, ".claude", "skills", "release-review"), { recursive: true });
    const r = cli(["install-skill", "--project", project]);
    assert.equal(r.rc, 2);
    assert.match(r.err, /not made by install-skill/);
  });
});
