// The review flow: read the three capabilities, find the gaps, ask the fuzzy function about each pair.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { CLASS_DIR, callCapability } from "./binding.js";
import * as fuzzy from "./fuzzy.js";
import { KIND_ORDER, findGaps, namedKeys } from "./gaps.js";

/** A local time with no zone, as Python's isoformat(timespec="seconds") prints it. */
function localIso() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 19);
}

export function run(setup, cls, release) {
  const planned = callCapability(setup, cls, "planned_tickets", release);
  const changes = callCapability(setup, cls, "release_changes", release);
  const keys = namedKeys(changes);
  // A live tickets binding would build an invalid query from an empty list.
  const named = keys.length ? callCapability(setup, cls, "tickets", release, keys) : [];
  const res = findGaps(planned, named, changes, setup, release);

  const byId = new Map(changes.map((c) => [c.id, c]));
  const tickets = new Map([...named, ...planned].map((t) => [t.key.toUpperCase(), t]));
  for (const g of res.gaps) {
    const src = tickets.get(g.key) ?? byId.get(g.change_id) ?? {};
    g.summary = src.summary || src.title || null;
    g.url = src.url ?? null;
  }

  const fn = cls.functions.change_matches_ticket;
  const prompt = readFileSync(join(CLASS_DIR, fn.prompt), "utf8");
  const fb = setup.bindings.change_matches_ticket;
  const verdicts = [];
  let cost = 0;
  for (const p of res.pairs) {
    const [inputs, cut] = fuzzy.payload(p.ticket, p.change_ids.map((i) => byId.get(i)));
    const [r, c] = fuzzy.call(fb, prompt, fn.output, inputs);
    cost += c;
    verdicts.push({ key: p.key, verdict: r.verdict, reason: r.reason, truncated: cut });
  }
  verdicts.sort((a, b) => (a.verdict === "matches") - (b.verdict === "matches") || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));

  const counts = { planned: planned.length, shipped: keys.length };
  for (const k of KIND_ORDER) counts[k] = res.gaps.filter((g) => g.kind === k).length;
  counts.earlier_work = res.earlier_work.length;
  return { release, class: `${cls.name}@${cls.version}`, setup: setup.name,
    function_binding: "model" in fb ? `model:${fb.model}` : "cmd",
    generated: localIso(), cost_usd: cost, counts, gaps: res.gaps, verdicts,
    earlier_work: res.earlier_work, signoff: setup.signoff };
}
