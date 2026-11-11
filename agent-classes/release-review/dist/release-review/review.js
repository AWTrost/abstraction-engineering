// The review flow: read the three capabilities, find the gaps, ask the typed function about each pair.
import { BindingError, callCapability } from "../runtime/capability.js";
import { loadPrompt } from "../runtime/classdef.js";
import { KIND_ORDER, findGaps, namedKeys } from "./gaps.js";
import * as match from "./match.js";
import { CLASS_DIR } from "./paths.js";
/** A local time with no zone, to the second (YYYY-MM-DDTHH:MM:SS). */
function localIso() {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 19);
}
/** The diffs of the given changes, by id. A missing id stops the run: a verdict without its diff is a guess. */
export function changeDiffs(setup, cls, vars, ids) {
    if (!ids.length)
        return new Map();
    const got = new Map(callCapability(setup, cls, "change_diffs", vars, ids).map((d) => [d.id, d.diff]));
    const missing = ids.filter((i) => !got.has(i));
    if (missing.length)
        throw new BindingError("change_diffs", `no diff for ${missing.slice(0, 5).join(", ")}${missing.length > 5 ? ` and ${missing.length - 5} more` : ""}`);
    return got;
}
export function run(setup, cls, release) {
    const vars = { release };
    const planned = callCapability(setup, cls, "planned_tickets", vars);
    const changes = callCapability(setup, cls, "release_changes", vars);
    const keys = namedKeys(changes);
    // A live tickets binding would build an invalid query from an empty list.
    const named = keys.length ? callCapability(setup, cls, "tickets", vars, keys) : [];
    const res = findGaps(planned, named, changes, setup, release);
    const byId = new Map(changes.map((c) => [c.id, c]));
    const tickets = new Map([...named, ...planned].map((t) => [t.key.toUpperCase(), t]));
    const gaps = res.gaps.map((g) => {
        const src = (g.key !== null ? tickets.get(g.key) : undefined) ?? (g.change_id !== null ? byId.get(g.change_id) : undefined) ?? {};
        return { ...g, summary: src.summary || src.title || null, url: src.url ?? null };
    });
    const fn = cls.functions.change_matches_ticket;
    const prompt = loadPrompt(CLASS_DIR, fn);
    const fb = setup.bindings.change_matches_ticket;
    const verdicts = [];
    let cost = 0;
    const diffs = changeDiffs(setup, cls, vars, [...new Set(res.pairs.flatMap((p) => p.change_ids))]);
    for (const p of res.pairs) {
        const judged = p.change_ids.map((i) => ({ ...byId.get(i), diff: diffs.get(i) }));
        const [inputs, cut] = match.payload(p.ticket, judged);
        const [r, c] = match.call(fb, prompt, fn.output, inputs);
        cost += c;
        verdicts.push({ key: p.key, verdict: r.verdict, reason: r.reason, truncated: cut });
    }
    verdicts.sort((a, b) => Number(a.verdict === "matches") - Number(b.verdict === "matches") || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
    const counts = { planned: planned.length, shipped: keys.length };
    for (const k of KIND_ORDER)
        counts[k] = gaps.filter((g) => g.kind === k).length;
    counts.earlier_work = res.earlier_work.length;
    return { release, class: `${cls.name}@${cls.version}`, setup: setup.name,
        function_binding: "model" in fb ? `model:${fb.model}` : "cmd",
        generated: localIso(), cost_usd: cost, counts, gaps, verdicts,
        earlier_work: res.earlier_work, signoff: setup.signoff };
}
