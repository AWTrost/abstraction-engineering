import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, test } from "node:test";
import { findGaps, namedKeys } from "../src/release-review/gaps.ts";
import type { Change } from "../src/release-review/types.ts";
import { FIX } from "./helpers.ts";

const SETUP: Parameters<typeof findGaps>[3] = {
  fix_version: "{release}",
  status_map: { "Ready for QA Release": "awaiting_qa", "In QA": "in_qa", Ready: "todo", Closed: "done" },
  expected_states: ["awaiting_qa", "in_qa"],
};

function run(name) {
  const load = (f) => JSON.parse(readFileSync(join(FIX, name, f), "utf8"));
  const [planned, tickets, changes] = [load("planned_tickets.json"), load("tickets.json"), load("release_changes.json")];
  const keys = new Set(namedKeys(changes));
  return findGaps(planned, tickets.filter((t) => keys.has(t.key)), changes, SETUP, "demo-1.0");
}

const ticket = (key, status, fixVersions) => ({ key, summary: "", description: "", status, fix_versions: fixVersions, url: "" });
// The tests pass only the fields the code under test reads.
const mr = (o): Change => ({ kind: "mr", ...o });
const kindKey = (r) => r.gaps.map((g) => [g.kind, g.key]);

describe("gaps", () => {
  let r;
  beforeEach(() => { r = run("demo"); });

  test("testNamedKeysUpperUniqueOrdered", () => {
    assert.deepEqual(namedKeys([{ ticket_keys: ["a-1", "B-2"] }, { ticket_keys: ["A-1", "c-3"] }]), ["A-1", "B-2", "C-3"]);
  });

  test("testKeysNormalisedAndGrouped", () => {
    assert.deepEqual(r.pairs.find((p) => p.key === "DEMO-1").change_ids, ["!1", "!10"]);
  });

  test("testEachKindPlanted", () => {
    const got = new Set(r.gaps.map((g) => `${g.kind} ${g.key}`));
    assert.deepEqual(got, new Set(["shipped_not_planned DEMO-6", "planned_not_shipped DEMO-3", "change_without_ticket null",
      "unknown_ticket DEMO-7", "unexpected_status DEMO-2", "unmapped_status DEMO-4"]));
  });

  test("testGapOrderAndShape", () => {
    assert.deepEqual(r.gaps.map((g) => g.kind), ["shipped_not_planned", "planned_not_shipped", "change_without_ticket",
      "unknown_ticket", "unexpected_status", "unmapped_status"]);
    const mr = r.gaps.find((g) => g.kind === "change_without_ticket");
    assert.deepEqual([mr.change_id, mr.key], ["!8", null]);
    assert.equal(r.gaps.find((g) => g.key === "DEMO-6").change_id, "!6");
    assert.ok(r.gaps.every((g) => Object.keys(g).sort().join() === "change_id,detail,key,kind"));
  });

  test("testEarlierWorkNotAGap", () => {
    assert.deepEqual(r.earlier_work.map((e) => e.key), ["DEMO-5"]);
    assert.deepEqual(r.earlier_work[0].fix_versions, ["demo-0.9"]);
    assert.ok(!r.gaps.some((g) => g.key === "DEMO-5"));
  });

  test("testDoneWithoutFixVersionIsShippedNotPlanned", () => {
    const res = findGaps([], [ticket("X-1", "Closed", [])], [mr({ id: "!1", ticket_keys: ["X-1"] })], SETUP, "r");
    assert.deepEqual(kindKey(res), [["shipped_not_planned", "X-1"]]);
    assert.deepEqual(res.earlier_work, []);
  });

  test("testOtherFixVersionNotDoneIsShippedNotPlanned", () => {
    const res = findGaps([], [ticket("X-1", "In QA", ["old"])], [mr({ id: "!1", ticket_keys: ["X-1"] })], SETUP, "r");
    assert.deepEqual(res.gaps.map((g) => g.kind), ["shipped_not_planned"]);
    assert.deepEqual(res.earlier_work, []);
  });

  test("testFixVersionTemplateFilled", () => {
    const res = findGaps([], [ticket("X-1", "In QA", ["fv-r"])], [mr({ id: "!1", ticket_keys: ["X-1"] })],
      { ...SETUP, fix_version: "fv-{release}" }, "r");
    assert.deepEqual(res.pairs.map((p) => p.key), ["X-1"]);
    assert.deepEqual(res.gaps, []);
  });

  test("testPairsSortedByKey", () => {
    const ch = [mr({ id: "!1", ticket_keys: ["B-1"] }), mr({ id: "!2", ticket_keys: ["A-1"] })];
    const res = findGaps([ticket("B-1", "In QA", ["r"]), ticket("A-1", "In QA", ["r"])], [], ch, SETUP, "r");
    assert.deepEqual(res.pairs.map((p) => p.key), ["A-1", "B-1"]);
  });

  test("testShippedOnlyUnmappedGetsBoth", () => {
    const res = findGaps([], [ticket("X-1", "Blocked", [])], [mr({ id: "!1", ticket_keys: ["X-1"] })], SETUP, "r");
    assert.deepEqual(kindKey(res), [["shipped_not_planned", "X-1"], ["unmapped_status", "X-1"]]);
  });

  test("testCommitWithoutKeyIgnored", () => {
    assert.ok(!r.gaps.some((g) => g.change_id === "c9"));
  });

  test("testUnmappedStatus", () => {
    assert.deepEqual(r.gaps.filter((g) => g.key === "DEMO-4").map((g) => g.kind), ["unmapped_status"]);
  });

  test("testEmptyRelease", () => {
    const res = run("empty");
    assert.equal(res.gaps[0].kind, "empty_release");
    assert.deepEqual(kindKey(res).slice(1),
      [1, 2, 3, 4].map((i) => ["planned_not_shipped", `DEMO-${i}`]).concat([["unmapped_status", "DEMO-4"]]));
    assert.deepEqual(res.pairs, []);
  });

  test("testPairsArePlannedAndShipped", () => {
    assert.deepEqual(r.pairs.map((p) => p.key).sort(), ["DEMO-1", "DEMO-2", "DEMO-4"]);
    assert.equal(r.pairs[0].ticket.key, "DEMO-1");
  });

  // New: a status named like an Object property is still unmapped.
  test("a status named constructor is unmapped, not found on the prototype", () => {
    const res = findGaps([], [ticket("X-1", "constructor", [])], [mr({ id: "!1", ticket_keys: ["X-1"] })], SETUP, "r");
    assert.deepEqual(kindKey(res), [["shipped_not_planned", "X-1"], ["unmapped_status", "X-1"]]);
  });
});
