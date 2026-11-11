// Shared by the test files. Not a test file itself, so node --test does not run it twice.
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const FIX = fileURLToPath(new URL("fixtures", import.meta.url));
export const NODE = process.execPath;
export const tmp = () => mkdtempSync(join(tmpdir(), "rr-"));

export const GOOD = {
  name: "demo",
  class: "release-review@0.3.0",
  fix_version: "{release}",
  bindings: {
    planned_tickets: { cmd: ["x"] },
    tickets: { cmd: ["x"] },
    release_changes: { cmd: ["x"] },
    change_diffs: { cmd: ["x"] },
    change_matches_ticket: { model: "sonnet" },
  },
  status_map: { Ready: "todo" },
  expected_states: ["todo"],
  report_dir: "out",
  signoff: "someone",
};

export function writeSetup(data) {
  const p = join(tmp(), "setup.json");
  writeFileSync(p, JSON.stringify(data));
  return p;
}

export function fakeSetup(fixture = "demo") {
  const bindings = {};
  for (const cap of ["planned_tickets", "tickets", "release_changes", "change_diffs"]) {
    bindings[cap] = { cmd: [NODE, join(FIX, "fake_binding.js"), join(FIX, fixture), cap, "{release}"] };
  }
  return { bindings };
}

