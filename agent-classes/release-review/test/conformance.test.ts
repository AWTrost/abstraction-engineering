import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, test } from "node:test";
import { loadClass } from "../src/release-review/paths.ts";
import * as conformance from "../src/release-review/conformance.ts";
import { FIX, NODE } from "./helpers.ts";

const CLS = loadClass();
const CASES = JSON.parse(readFileSync(conformance.CASES_PATH, "utf8"));
const ORACLE = join(FIX, "oracle_match.js");

describe("conformance", () => {
  test("testCaseCountsPerVerdict", () => {
    const counts = {};
    for (const c of CASES) counts[c.expected] = (counts[c.expected] ?? 0) + 1;
    assert.deepEqual(counts, { matches: 6, partial: 3, unrelated: 4, unclear: 3 });
  });

  test("testScoreWithOracleCmd", () => {
    const r = conformance.score(CASES, { cmd: [NODE, ORACLE] }, CLS);
    assert.deepEqual([r.n, r.correct, r.score, r.misses, r.hard_misses], [16, 16, 1, [], []]);
  });

  test("testScoreCountsMisses", () => {
    const r = conformance.score(CASES, { cmd: [NODE, "-e", `console.log('{"verdict": "matches", "reason": "x"}')`] }, CLS);
    assert.deepEqual([r.correct, r.score], [6, 0.375]);
    assert.deepEqual(r.misses, CASES.filter((c) => c.expected !== "matches").map((c) => c.id));
    assert.equal(r.misses.length, 10);
    assert.deepEqual(r.hard_misses, CASES.filter((c) => ["partial", "unrelated"].includes(c.expected)).map((c) => c.id));
    assert.equal(r.hard_misses.length, 7);
    assert.equal(conformance.mainExit(r), 1);
  });

  test("testOneHardMissFailsDespiteAPassingScore", () => {
    const hard = CASES.find((c) => c.expected === "unrelated");
    const code = `
      const { spawnSync } = require("node:child_process");
      const d = require("node:fs").readFileSync(0, "utf8");
      if (JSON.parse(d).ticket.key === ${JSON.stringify(hard.ticket.key)}) console.log('{"verdict": "matches", "reason": "x"}');
      else process.stdout.write(spawnSync(process.execPath, [${JSON.stringify(ORACLE)}], { input: d, encoding: "utf8" }).stdout);`;
    const r = conformance.score(CASES, { cmd: [NODE, "-e", code] }, CLS);
    assert.deepEqual([r.correct, r.score, r.misses, r.hard_misses], [15, 15 / 16, [hard.id], [hard.id]]);
    assert.ok(r.score >= conformance.PASS);
    assert.equal(conformance.mainExit(r), 1);
  });

  test("testCleanRunExitsZero", () => {
    assert.equal(conformance.mainExit({ score: 0.8, hard_misses: [] }), 0);
  });

  test("the class cases fit the Case schema", async () => {
    const { validate } = await import("../src/runtime/validate.ts");
    assert.equal(validate({ type: "array", items: { $ref: "#/$defs/Case" } }, CASES, CLS), null);
  });
});
