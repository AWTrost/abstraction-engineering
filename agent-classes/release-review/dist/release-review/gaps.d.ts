import type { Change, EarlierWork, FoundGap, GapKind, Pair, RRSetup, Ticket } from "./types.ts";
export declare const KIND_ORDER: GapKind[];
export declare function namedKeys(changes: Pick<Change, "ticket_keys">[]): string[];
export interface GapResult {
    pairs: Pair[];
    gaps: FoundGap[];
    earlier_work: EarlierWork[];
}
export declare function findGaps(planned: Ticket[], named: Ticket[], changes: Change[], setup: Pick<RRSetup, "fix_version" | "status_map" | "expected_states">, release: string): GapResult;
