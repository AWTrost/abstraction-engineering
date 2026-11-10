// Turn the report data into the Markdown and JSON files.
import { mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { KIND_ORDER } from "./gaps.js";

export const NOT_CHECKED = ["The testing steps: whether QA ran or passed.", "Whether the release is deployed."];

const cell = (s) => String(s ?? "").replaceAll("|", "\\|").replaceAll("\n", " ");

export function renderMd(data) {
  const L = [`# Release review: ${data.release}`, "",
    `- Class: ${data.class}`, `- Setup: ${data.setup}`,
    `- Fuzzy function binding: ${data.function_binding}`,
    `- Generated: ${data.generated}`, `- Model cost: $${data.cost_usd.toFixed(4)}`,
    "", `Draft: needs sign-off by ${data.signoff}.`, "", "## Counts", ""];
  const c = data.counts;
  L.push(`- Planned: ${c.planned}`, `- Shipped: ${c.shipped}`);
  for (const k of KIND_ORDER) L.push(`- ${k}: ${c[k] ?? 0}`);
  L.push(`- Earlier work (not a gap): ${c.earlier_work}`, "", "## Gaps", "");
  if (!data.gaps.length) L.push("No gaps.", "");
  for (const kind of KIND_ORDER) {
    const rows = data.gaps.filter((g) => g.kind === kind);
    if (!rows.length) continue;
    L.push(`### ${kind}`, "", "| Key | Summary | Detail | Link |", "|---|---|---|---|");
    for (const g of rows) L.push(`| ${cell(g.key || g.change_id)} | ${cell(g.summary)} | ${cell(g.detail)} | ${cell(g.url)} |`);
    L.push("");
  }
  L.push("## Match verdicts", "");
  if (!data.verdicts.length) L.push("No planned and shipped tickets.", "");
  for (const v of data.verdicts) L.push(`- ${v.key}: ${v.verdict}${v.truncated ? " (text cut)" : ""}: ${cell(v.reason)}`);
  L.push("", "## Earlier work", "");
  if (!data.earlier_work.length) L.push("None.");
  for (const e of data.earlier_work) L.push(`- ${e.key}: fix versions ${e.fix_versions.join(", ")}`);
  L.push("", "## Not checked", "", ...NOT_CHECKED.map((n) => `- ${n}`), "");
  return L.join("\n");
}

export const expandHome = (p) => p.replace(/^~(?=$|\/)/, homedir());

/** Writes both files or neither. Returns [mdPath, jsonPath]. deps lets a test make render or rename fail. */
export function write(reportDir, release, data, { render = renderMd, rename = renameSync } = {}) {
  const dir = expandHome(reportDir);
  mkdirSync(dir, { recursive: true });
  // Render both first, then swap in, so a failure leaves no half report.
  const files = [[`release-review-${release}.md`, render(data)],
    [`release-review-${release}.json`, JSON.stringify(data, null, 2)]];
  const tmps = [];
  try {
    for (const [name, text] of files) {
      const tmp = join(dir, `.${name}.${randomBytes(6).toString("hex")}.tmp`);
      tmps.push([tmp, join(dir, name)]);
      writeFileSync(tmp, text, { flag: "wx" });
    }
    for (const [tmp, dest] of tmps) rename(tmp, dest);
  } finally {
    for (const [tmp] of tmps) rmSync(tmp, { force: true });
  }
  return tmps.map(([, dest]) => dest);
}
