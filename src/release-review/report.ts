// Turn the report data into the Markdown and JSON files.
import { writeAll } from "../runtime/files.ts";
import { KIND_ORDER } from "./gaps.ts";
import type { Report } from "./types.ts";

export const NOT_CHECKED = ["The testing steps: whether QA ran or passed.", "Whether the release is deployed."];

const cell = (s: unknown): string => String(s ?? "").replaceAll("|", "\\|").replaceAll("\n", " ");

export function renderMd(data: Report): string {
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

export interface WriteDeps {
  render?: (data: Report) => string;
  rename?: (from: string, to: string) => void;
}

/** Writes both files or neither. Returns [mdPath, jsonPath]. deps lets a test make render or rename fail. */
export function write(reportDir: string, release: string, data: Report, { render = renderMd, rename }: WriteDeps = {}): string[] {
  // Render both first, so a render failure writes nothing.
  const files: [string, string][] = [[`release-review-${release}.md`, render(data)],
    [`release-review-${release}.json`, JSON.stringify(data, null, 2)]];
  return writeAll(reportDir, files, rename ? { rename } : {});
}
