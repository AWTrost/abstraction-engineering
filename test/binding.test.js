import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { BindingError, PinError, SetupError, callCapability, checkPin, loadClass, loadSetup } from "../lib/binding.js";

import { GOOD, NODE, fakeSetup, writeSetup } from "./helpers.js";

const CLS = loadClass();

function throwsWith(fn, cls, ...parts) {
  let err;
  assert.throws(fn, (e) => { err = e; return e instanceof cls; });
  for (const p of parts) assert.ok(err.message.includes(p), `${JSON.stringify(err.message)} should include ${p}`);
  return err;
}

describe("binding", () => {
  test("testPinMatches", () => checkPin({ class: "release-review@0.2.0" }, CLS));

  test("testPinMismatchNamesBoth", () => {
    throwsWith(() => checkPin({ class: "release-review@0.0.9" }, CLS), PinError, "0.0.9", "0.2.0");
  });

  test("testLoadSetupOk", () => assert.deepEqual(loadSetup(writeSetup(GOOD), CLS), GOOD));

  test("testSetupMissingKey", () => {
    const { status_map: _, ...bad } = GOOD;
    throwsWith(() => loadSetup(writeSetup(bad), CLS), SetupError, "status_map");
  });

  test("testSetupMissingBinding", () => {
    throwsWith(() => loadSetup(writeSetup({ ...GOOD, bindings: { tickets: { cmd: ["x"] } } }), CLS), SetupError, "planned_tickets");
  });

  test("testPinCheckedBeforeKeys", () => {
    assert.throws(() => loadSetup(writeSetup({ class: "release-review@0.0.9" }), CLS), PinError);
  });

  test("testStatusMapValueMustBeAClassState", () => {
    throwsWith(() => loadSetup(writeSetup({ ...GOOD, status_map: { X: "shipped" } }), CLS), SetupError, "status_map", "shipped");
  });

  test("testExpectedStateMustBeAClassState", () => {
    throwsWith(() => loadSetup(writeSetup({ ...GOOD, expected_states: ["shipped"] }), CLS), SetupError, "shipped");
  });

  test("testSchemaShape", () => {
    const s = CLS.functions.change_matches_ticket.output;
    assert.deepEqual(s.properties.verdict.enum, ["matches", "partial", "unrelated", "unclear"]);
    assert.deepEqual([...s.required].sort(), ["reason", "verdict"]);
  });

  // New in 0.2.0: the setup schema refuses what Python ignored.
  test("an undeclared binding is refused", () => {
    const bad = { ...GOOD, bindings: { ...GOOD.bindings, close_release: { cmd: ["x"] } } };
    throwsWith(() => loadSetup(writeSetup(bad), CLS), SetupError, "close_release");
  });

  test("the fuzzy binding is cmd or model, not both and not neither", () => {
    for (const fb of [{ cmd: ["x"], model: "m" }, {}, { model: 3 }]) {
      const bad = { ...GOOD, bindings: { ...GOOD.bindings, change_matches_ticket: fb } };
      throwsWith(() => loadSetup(writeSetup(bad), CLS), SetupError, "change_matches_ticket");
    }
    const ok = { ...GOOD, bindings: { ...GOOD.bindings, change_matches_ticket: { cmd: ["x"] } } };
    assert.deepEqual(loadSetup(writeSetup(ok), CLS), ok);
  });

  test("the class states and the setup schema's enums agree", () => {
    assert.deepEqual(CLS.setup.properties.status_map.additionalProperties.enum, CLS.states);
    assert.deepEqual(CLS.setup.properties.expected_states.items.enum, CLS.states);
  });
});

const cmdSetup = (cap, argv) => ({ bindings: { [cap]: { cmd: argv } } });
const printJson = (cap, items) => cmdSetup(cap, [NODE, "-e", `console.log(${JSON.stringify(JSON.stringify(items))})`]);

function badShape(cap, items) {
  const e = throwsWith(() => callCapability(printJson(cap, items), CLS, cap, "r"), BindingError);
  assert.equal(e.capability, cap);
}

describe("callCapability", () => {
  test("testReleasePlaceholderFilled", () => {
    const s = cmdSetup("planned_tickets", [NODE, "-e", "console.log(process.argv[1] === 'r-1' ? '[]' : 'bad')", "{release}"]);
    assert.deepEqual(callCapability(s, CLS, "planned_tickets", "r-1"), []);
  });

  test("testPlannedTicketsFromFixture", () => {
    const got = callCapability(fakeSetup(), CLS, "planned_tickets", "demo-1.0");
    assert.deepEqual(got.map((t) => t.key), ["DEMO-1", "DEMO-2", "DEMO-3", "DEMO-4"]);
    assert.equal(got[1].description.length, 5000);
  });

  test("testReleaseChangesFromFixture", () => {
    const got = callCapability(fakeSetup(), CLS, "release_changes", "demo-1.0");
    assert.deepEqual(got.map((c) => c.id), ["!1", "c2", "!4", "!5", "!6", "c7", "!8", "c9", "!10"]);
  });

  test("testTicketsGetsKeysOnStdin", () => {
    const got = callCapability(fakeSetup(), CLS, "tickets", "demo-1.0", ["DEMO-1", "DEMO-7"]);
    assert.deepEqual(got.map((t) => t.key), ["DEMO-1"]);
  });

  test("testEmptyFixture", () => {
    assert.deepEqual(callCapability(fakeSetup("empty"), CLS, "release_changes", "x"), []);
  });

  test("testNonzeroExitNamesCapability", () => {
    const e = throwsWith(() => callCapability(cmdSetup("planned_tickets", [NODE, "-e", "process.exit(3)"]), CLS, "planned_tickets", "r"), BindingError, "exit 3");
    assert.equal(e.capability, "planned_tickets");
  });

  test("testBadJsonNamesCapability", () => {
    const e = throwsWith(() => callCapability(cmdSetup("release_changes", [NODE, "-e", "console.log('not json')"]), CLS, "release_changes", "r"), BindingError);
    assert.equal(e.capability, "release_changes");
  });

  test("testShapeChecked", () => {
    assert.throws(() => callCapability(printJson("planned_tickets", [{ summary: "x" }]), CLS, "planned_tickets", "r"), BindingError);
  });

  test("testChangeKindChecked", () => {
    const c = { id: "1", kind: "svn", title: "", description: "", url: "", ticket_keys: [] };
    assert.throws(() => callCapability(printJson("release_changes", [c]), CLS, "release_changes", "r"), BindingError);
  });

  test("testNotAList", () => {
    assert.throws(() => callCapability(printJson("planned_tickets", {}), CLS, "planned_tickets", "r"), BindingError);
  });

  test("testTicketKeysMustBeAList", () => {
    badShape("release_changes", [{ id: "1", kind: "mr", title: "", description: "", url: "", ticket_keys: "DEMO-1" }]);
  });

  test("testFixVersionsMustBeAList", () => {
    badShape("planned_tickets", [{ key: "DEMO-1", summary: "", description: "", status: "x", fix_versions: "x", url: "" }]);
  });

  test("testNonStringKeyIsABindingError", () => {
    badShape("planned_tickets", [{ key: 1, summary: "", description: "", status: "x", fix_versions: [], url: "" }]);
  });

  test("testTimeoutNamesCapability", () => {
    const s = cmdSetup("planned_tickets", [NODE, "-e", "setTimeout(() => {}, 5000)"]);
    const e = throwsWith(() => callCapability(s, CLS, "planned_tickets", "r", undefined, { timeoutMs: 200 }), BindingError, "timed out");
    assert.equal(e.capability, "planned_tickets");
  });

  // New in 0.2.0: text fields are string or null, and extra keys still pass.
  test("a null description and extra keys pass, a numeric summary does not", () => {
    const t = { key: "D-1", summary: "s", description: null, status: "x", fix_versions: [], url: null, extra: 1 };
    assert.deepEqual(callCapability(printJson("planned_tickets", [t]), CLS, "planned_tickets", "r"), [t]);
    badShape("planned_tickets", [{ ...t, summary: 3 }]);
  });

  test("a multi-line stderr becomes one line", () => {
    const s = cmdSetup("planned_tickets", [NODE, "-e", "console.error('a\\nb'); process.exit(1)"]);
    const e = throwsWith(() => callCapability(s, CLS, "planned_tickets", "r"), BindingError, "exit 1: a b");
    assert.ok(!e.message.includes("\n"));
  });
});
