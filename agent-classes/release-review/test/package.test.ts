// The package as a team gets it: packed, installed into a fresh project, run through npx.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { CLASS_DIR } from "../src/release-review/paths.ts";
import { FIX, NODE, tmp } from "./helpers.ts";

const npm = (args, cwd) => execFileSync("npm", args, { cwd, encoding: "utf8", env: { ...process.env, npm_config_audit: "false", npm_config_fund: "false" } });

test("an installed tarball links its skill and writes a report", { timeout: 120_000 }, () => {
  const packDir = tmp();
  const [{ filename, files }] = JSON.parse(npm(["pack", "--json", "--pack-destination", packDir], CLASS_DIR));
  const shipped = files.map((f) => f.path);
  assert.ok(shipped.includes("skill/SKILL.md") && shipped.includes("conformance/match_cases.json"));
  assert.ok(!shipped.some((p) => p.startsWith("test/")), "tests are not shipped");

  const project = tmp();
  writeFileSync(join(project, "package.json"), JSON.stringify({ name: "p", private: true }));
  npm(["install", "--offline", join(packDir, filename)], project);
  const npx = (...args) => execFileSync("npx", ["--no", "release-review", ...args], { cwd: project, encoding: "utf8" });

  npx("install-skill");
  const link = join(project, ".claude", "skills", "release-review");
  assert.ok(lstatSync(link).isSymbolicLink());
  assert.ok(existsSync(join(link, "SKILL.md")));

  const cmd = (cap) => ({ cmd: [NODE, join(FIX, "fake_binding.js"), join(FIX, "demo"), cap, "{release}"] });
  const setup = { name: "demo", class: "release-review@0.2.0", fix_version: "{release}",
    bindings: { planned_tickets: cmd("planned_tickets"), tickets: cmd("tickets"), release_changes: cmd("release_changes"),
      change_matches_ticket: { cmd: [NODE, join(FIX, "fake_match.js")] } },
    status_map: { "In QA": "in_qa", Ready: "todo", Closed: "done" }, expected_states: ["in_qa"],
    report_dir: "out", signoff: "someone" };
  writeFileSync(join(project, "setup.json"), JSON.stringify(setup));
  const [md, js] = npx("run", "--setup", "setup.json", "--release", "demo-1.0").trim().split("\n");
  // A relative report_dir resolves from the current directory, here the project.
  assert.ok(md.endsWith("release-review-demo-1.0.md") && existsSync(join(project, md)));
  assert.equal(JSON.parse(readFileSync(join(project, js), "utf8")).class, "release-review@0.2.0");
});
