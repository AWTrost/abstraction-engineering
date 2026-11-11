// release-review's own shapes. The contract in class.json is the source of truth; these follow it,
// and the tests check real binding output against the contract, not against these types.
import type { Binding, CmdBinding, Setup } from "../runtime/classdef.ts";

export type State = "todo" | "in_progress" | "awaiting_qa" | "in_qa" | "done";

export interface Ticket {
  key: string;
  summary: string | null;
  description: string | null;
  status: string;
  fix_versions: string[];
  url: string | null;
}

export interface Change {
  id: string;
  kind: "mr" | "commit";
  title: string | null;
  description: string | null;
  url: string | null;
  ticket_keys: string[];
}

/** A change with its code diff: what change_matches_ticket judges. */
export interface JudgedChange extends Change { diff: string }
export interface ChangeDiff { id: string; diff: string }

export type GapKind = "empty_release" | "shipped_not_planned" | "planned_not_shipped" | "change_without_ticket"
  | "unknown_ticket" | "unexpected_status" | "unmapped_status";

export interface Gap {
  kind: GapKind;
  key: string | null;
  change_id: string | null;
  detail: string;
  /** Filled in by the review from the ticket or change; null until then. */
  summary: string | null;
  url: string | null;
}

/** A gap as the rules find it, before the review adds the ticket's or change's summary and link. */
export type FoundGap = Omit<Gap, "summary" | "url">;

export type Verdict = "matches" | "partial" | "unrelated" | "unclear";
export interface MatchResult { verdict: Verdict; reason: string }

export interface Pair { key: string; ticket: Ticket; change_ids: string[] }
export interface EarlierWork { key: string; fix_versions: string[] }

export interface Case {
  id: string;
  ticket: Ticket;
  changes: JudgedChange[];
  expected: Verdict;
}

export interface RRSetup extends Setup {
  fix_version: string;
  bindings: { planned_tickets: CmdBinding; tickets: CmdBinding; release_changes: CmdBinding; change_diffs: CmdBinding;
    change_matches_ticket: Binding };
  status_map: Record<string, State>;
  expected_states: State[];
  report_dir: string;
  signoff: string;
  conformance_cases?: string;
}

export interface Report {
  release: string;
  class: string;
  setup: string;
  function_binding: string;
  generated: string;
  cost_usd: number;
  counts: Record<string, number>;
  gaps: Gap[];
  verdicts: { key: string; verdict: Verdict; reason: string; truncated: boolean }[];
  earlier_work: EarlierWork[];
  signoff: string;
}
