import assert from "node:assert/strict";
import { join } from "node:path";
import { describe, test } from "node:test";
import { modelArgv, parseModelOutput } from "../src/runtime/typed-function.ts";
import * as fuzzy from "../src/release-review/match.ts";
import { loadClass } from "../src/release-review/paths.ts";
import type { JudgedChange, Ticket } from "../src/release-review/types.ts";
import { FIX, NODE } from "./helpers.ts";

const SCHEMA = loadClass().functions.change_matches_ticket.output;
const FAKE = { cmd: [NODE, join(FIX, "fake_match.js")] };
// The tests pass only the fields the code under test reads.
const asTicket = (o): Ticket => o;
const asChange = (o): JudgedChange => o;
const inputs = (key = "DEMO-1") => ({ ticket: asTicket({ key, summary: "s", description: "d" }), changes: [asChange({ title: "t", description: "d", diff: "+x" })] });
const node = (code) => ({ cmd: [NODE, "-e", code] });

describe("fuzzy", () => {
  test("testModelArgvExact", () => {
    const argv = modelArgv("haiku", { type: "object" });
    assert.deepEqual(argv.slice(0, 12), ["claude", "-p", "--model", "haiku",
      "--tools", "", "--setting-sources", "", "--strict-mcp-config", "--no-session-persistence",
      "--output-format", "json"]);
    assert.deepEqual(argv.slice(12), ["--json-schema", '{"type":"object"}']);
  });

  test("testTruncatesAndFlags", () => {
    const long = asTicket({ key: "DEMO-2", summary: "s", description: "x".repeat(5000) });
    const change = asChange({ title: "t", description: "y".repeat(5000), diff: "z".repeat(25_000) });
    let [out, cut] = fuzzy.payload(long, [change]);
    assert.equal(out.ticket.description.length, fuzzy.CAP);
    assert.equal(out.changes[0].description.length, fuzzy.CAP);
    assert.equal(out.changes[0].diff.length, fuzzy.DIFF_CAP);
    assert.ok(cut);
    assert.equal(long.description.length, 5000); // input untouched
    [, cut] = fuzzy.payload(inputs().ticket, inputs().changes);
    assert.equal(cut, false);
  });

  test("testDiffReachesPayloadUncutUnderItsCap", () => {
    // A diff longer than the text cap but under its own is passed whole.
    const [out, cut] = fuzzy.payload(inputs().ticket, [asChange({ title: "t", description: "d", diff: "z".repeat(5000) })]);
    assert.equal(out.changes[0].diff.length, 5000);
    assert.equal(cut, false);
  });

  test("testCmdBindingResult", () => {
    assert.deepEqual(fuzzy.call(FAKE, "p", SCHEMA, inputs("DEMO-4")), [{ verdict: "partial", reason: "fake" }, 0]);
    assert.equal(fuzzy.call(FAKE, "p", SCHEMA, inputs())[0].verdict, "matches");
  });

  test("testFailureIsUnclear", () => {
    process.env.FAKE_MATCH_FAIL = "1";
    try {
      const [result, cost] = fuzzy.call(FAKE, "p", SCHEMA, inputs());
      assert.equal(result.verdict, "unclear");
      assert.ok(result.reason.startsWith("binding failed:"));
      assert.equal(cost, 0);
    } finally {
      delete process.env.FAKE_MATCH_FAIL;
    }
  });

  test("testReasonIsOneLine", () => {
    const [result] = fuzzy.call(node("console.error('first line\\nsecond line'); process.exit(1)"), "p", SCHEMA, inputs());
    assert.ok(!result.reason.includes("\n"));
    assert.ok(result.reason.includes("exit 1: first line"), result.reason);
  });

  test("testSchemaMissIsUnclear", () => {
    const [result] = fuzzy.call(node(`console.log('{"verdict": "maybe", "reason": "x"}')`), "p", SCHEMA, inputs());
    assert.equal(result.verdict, "unclear");
    assert.ok(result.reason.includes("binding failed:"));
  });

  test("testMissingKeyIsUnclear", () => {
    assert.equal(fuzzy.call(node(`console.log('{"verdict": "matches"}')`), "p", SCHEMA, inputs())[0].verdict, "unclear");
  });

  test("testTimeoutIsUnclear", () => {
    const [result] = fuzzy.call(node("setTimeout(() => {}, 5000)"), "p", SCHEMA, inputs(), { timeoutMs: 200 });
    assert.equal(result.verdict, "unclear");
    assert.ok(result.reason.includes("timed out"), result.reason);
  });

  test("testParseModelOutput", () => {
    const out = JSON.stringify({ is_error: false, result: "", total_cost_usd: 0.0012, structured_output: { verdict: "matches", reason: "ok" } });
    assert.deepEqual(parseModelOutput(out), [{ verdict: "matches", reason: "ok" }, 0.0012]);
  });

  test("testParseModelOutputError", () => {
    assert.throws(() => parseModelOutput(JSON.stringify({ is_error: true, result: "boom", total_cost_usd: 0.1 })));
    assert.throws(() => parseModelOutput("not json"));
  });

  test("a failed model binding names where provider variables must live", () => {
    const saved = process.env.PATH;
    process.env.PATH = ""; // no claude on the path, so the model call fails
    try {
      const [result] = fuzzy.call({ model: "haiku" }, "p", SCHEMA, inputs());
      assert.equal(result.verdict, "unclear");
      assert.match(result.reason, /set them in the shell/);
    } finally {
      process.env.PATH = saved;
    }
    assert.doesNotMatch(fuzzy.call(node("process.exit(1)"), "p", SCHEMA, inputs())[0].reason, /shell/);
  });

  // New in 0.2.0: the whole output schema is checked, so an extra key is a miss.
  test("an extra key in the result is unclear", () => {
    const [result] = fuzzy.call(node(`console.log('{"verdict": "matches", "reason": "x", "score": 1}')`), "p", SCHEMA, inputs());
    assert.equal(result.verdict, "unclear");
  });
});
