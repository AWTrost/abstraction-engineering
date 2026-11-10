// Join and gap rules for release-review. Pure functions, no I/O.
import type { Change, EarlierWork, FoundGap, GapKind, Pair, RRSetup, State, Ticket } from "./types.ts";

export const KIND_ORDER: GapKind[] = ["empty_release", "shipped_not_planned", "planned_not_shipped", "change_without_ticket",
  "unknown_ticket", "unexpected_status", "unmapped_status"];

const upperUnique = (keys: string[] | undefined): string[] => [...new Set((keys ?? []).map((k) => k.toUpperCase()))];
const cmp = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0); // code-point order, not locale order

export function namedKeys(changes: Pick<Change, "ticket_keys">[]): string[] {
  return upperUnique(changes.flatMap((c) => c.ticket_keys ?? []));
}

export interface GapResult { pairs: Pair[]; gaps: FoundGap[]; earlier_work: EarlierWork[] }

export function findGaps(planned: Ticket[], named: Ticket[], changes: Change[],
  setup: Pick<RRSetup, "fix_version" | "status_map" | "expected_states">, release: string): GapResult {
  const fix = setup.fix_version.replaceAll("{release}", release);
  const statusMap = setup.status_map;
  const expected = setup.expected_states;
  // Own keys only, so a status such as "constructor" is not found on the prototype.
  const stateOf = (status: string): State | undefined => (Object.hasOwn(statusMap, status) ? statusMap[status] : undefined);

  const tickets = new Map<string, Ticket>();
  for (const t of [...named, ...planned]) tickets.set(t.key.toUpperCase(), t);
  const plannedKeys = new Set(planned.map((t) => t.key.toUpperCase()));

  const byKey = new Map<string, string[]>(); // key -> change ids, in the order changes appear
  for (const c of changes) {
    for (const k of upperUnique(c.ticket_keys)) {
      if (!byKey.has(k)) byKey.set(k, []);
      byKey.get(k)!.push(c.id);
    }
  }

  const out: FoundGap[] = [];
  const pairs: Pair[] = [];
  const earlier: EarlierWork[] = [];
  const gap = (kind: GapKind, key: string | null, changeId: string | null, detail: string) =>
    out.push({ kind, key, change_id: changeId, detail });
  const q = (v: unknown) => JSON.stringify(v);

  if (changes.length === 0) {
    gap("empty_release", null, null, "release_changes returned no changes; the binding may have resolved the wrong release");
  }
  for (const c of changes) {
    if (c.kind === "mr" && !(c.ticket_keys ?? []).length) gap("change_without_ticket", null, c.id, `MR ${c.id} names no ticket`);
  }

  for (const [key, ids] of byKey) {
    const t = tickets.get(key);
    if (t === undefined) {
      gap("unknown_ticket", key, ids[0], "the ticket lookup did not return this key");
      continue;
    }
    const fvs = t.fix_versions ?? [];
    const state = stateOf(t.status);
    if (plannedKeys.has(key) || fvs.includes(fix)) {
      pairs.push({ key, ticket: t, change_ids: ids });
      if (state !== undefined && !expected.includes(state)) {
        gap("unexpected_status", key, ids[0], `status ${q(t.status)} maps to ${state}, expected one of ${q(expected)}`);
      }
    } else if (state === "done" && fvs.length) {
      earlier.push({ key, fix_versions: fvs });
    } else {
      gap("shipped_not_planned", key, ids[0], `fix versions ${q(fvs)}, not ${q(fix)}`);
    }
  }

  for (const key of plannedKeys) {
    if (!byKey.has(key)) gap("planned_not_shipped", key, null, `carries ${q(fix)} but no change names it`);
  }

  for (const [key, t] of tickets) {
    if (stateOf(t.status) === undefined) {
      gap("unmapped_status", key, byKey.get(key)?.[0] ?? null, `status ${q(t.status)} is not in status_map`);
    }
  }

  out.sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind)
    || Number(a.key !== null) - Number(b.key !== null) || cmp(a.key ?? "", b.key ?? ""));
  pairs.sort((a, b) => cmp(a.key, b.key));
  earlier.sort((a, b) => cmp(a.key, b.key));
  return { pairs, gaps: out, earlier_work: earlier };
}
