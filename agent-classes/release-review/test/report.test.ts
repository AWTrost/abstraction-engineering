import assert from "node:assert/strict";
import { basename, join } from "node:path";
import { describe, test } from "node:test";
import { renderMd, write } from "../src/release-review/report.ts";
import type { Report } from "../src/release-review/types.ts";
import { tmp } from "./helpers.ts";

const DATA: Report = {
  release: "r1", class: "release-review@0.3.0", setup: "demo", function_binding: "cmd",
  generated: "2026-01-01T00:00:00", cost_usd: 0, signoff: "someone",
  counts: { planned: 1, shipped: 1, earlier_work: 1 },
  gaps: [{ kind: "unmapped_status", key: "D-1", change_id: null, detail: "x|y", summary: "s", url: "u" }],
  verdicts: [{ key: "D-1", verdict: "partial", reason: "r", truncated: true }],
  earlier_work: [{ key: "D-2", fix_versions: ["r0"] }],
};

describe("report", () => {
  test("testSectionsInOrder", () => {
    const md = renderMd(DATA);
    const pos = ["## Counts", "## Gaps", "## Match verdicts", "## Earlier work", "## Not checked"].map((h) => md.indexOf(h));
    assert.ok(pos.every((p) => p >= 0));
    assert.deepEqual(pos, [...pos].sort((a, b) => a - b));
    assert.ok(md.indexOf("Draft: needs sign-off by someone.") < pos[0]);
  });

  test("testMarksTruncatedAndEscapesPipe", () => {
    const md = renderMd(DATA);
    assert.ok(md.includes("D-1: partial (text cut)"));
    assert.ok(md.includes("x\\|y"));
  });

  test("testVerdictReasonIsCellEscaped", () => {
    const md = renderMd({ ...DATA, verdicts: [{ key: "D-1", verdict: "unclear", reason: "a\nb", truncated: false }] });
    assert.ok(md.includes("D-1: unclear: a b"));
  });

  test("testWriteNamesAndCreatesDir", () => {
    const [md, js] = write(join(tmp(), "new"), "r1", DATA);
    assert.deepEqual([basename(md), basename(js)], ["release-review-r1.md", "release-review-r1.json"]);
  });
});
