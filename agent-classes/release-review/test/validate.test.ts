import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, test } from "node:test";
import { loadClass } from "../src/release-review/paths.ts";
import { KEYWORDS, keywordsIn, validate } from "../src/runtime/validate.ts";
import { FIX } from "./helpers.ts";

const CLS = loadClass();
const ok = (s, v, root?) => assert.equal(validate(s, v, root), null);
const bad = (s, v, part, root?) => {
  const err = validate(s, v, root);
  assert.ok(err && err.includes(part), `${err} should include ${part}`);
};

describe("validate", () => {
  test("type, with one name or a list", () => {
    ok({ type: "string" }, "a");
    bad({ type: "string" }, 1, "expected string");
    ok({ type: ["string", "null"] }, null);
    bad({ type: ["string", "null"] }, [], "expected string or null");
    ok({ type: "number" }, 1);
    bad({ type: "object" }, [], "expected object");
  });

  test("required and properties, with the path in the message", () => {
    const s = { type: "object", required: ["a"], properties: { a: { type: "object", properties: { b: { type: "string" } } } } };
    ok(s, { a: { b: "x" } });
    bad(s, {}, "missing required key a");
    bad(s, { a: { b: 1 } }, "a.b: expected string");
  });

  test("additionalProperties false and as a schema", () => {
    ok({ type: "object", properties: { a: {} }, additionalProperties: false }, { a: 1 });
    bad({ type: "object", properties: { a: {} }, additionalProperties: false }, { a: 1, z: 2 }, "unexpected key z");
    ok({ type: "object", additionalProperties: { enum: ["x"] } }, { k: "x" });
    bad({ type: "object", additionalProperties: { enum: ["x"] } }, { k: "y" }, "k: \"y\" is not one of");
  });

  test("items, enum, oneOf and $ref", () => {
    bad({ type: "array", items: { type: "string" } }, ["a", 2], "[1]: expected string");
    ok({ enum: ["a"] }, "a");
    bad({ enum: ["a"] }, "b", "is not one of");
    const one = { oneOf: [{ type: "string" }, { type: "number" }] };
    ok(one, 1);
    bad(one, null, "matched 0");
    bad({ oneOf: [{ type: "number" }, { type: "integer" }] }, 1, "matched 2");
    const root = { $defs: { S: { type: "string" } } };
    ok({ $ref: "#/$defs/S" }, "x", root);
    bad({ $ref: "#/$defs/S" }, 1, "expected string", root);
    assert.throws(() => validate({ $ref: "#/$defs/Nope" }, 1, root), /unresolved/);
  });

  test("class.json uses only the keywords the validator supports", () => {
    const used = keywordsIn([...Object.values(CLS.$defs), ...Object.values(CLS.capabilities).flatMap((c) => [c.stdin, c.output]),
      CLS.functions.change_matches_ticket.input, CLS.functions.change_matches_ticket.output, CLS.setup].filter(Boolean));
    const unsupported = [...used].filter((k) => !KEYWORDS.has(k));
    assert.deepEqual(unsupported, []);
    assert.ok(used.has("oneOf") && used.has("$ref")); // the walk reaches nested schemas
  });

  test("the keyword walk catches an unsupported keyword", () => {
    assert.ok(keywordsIn({ properties: { a: { minLength: 1 } } }).has("minLength"));
  });

  test("every fixture fits its capability's output schema", () => {
    for (const dir of ["demo", "empty"]) {
      for (const f of readdirSync(join(FIX, dir))) {
        const cap = f.replace(/\.json$/, "");
        const data = JSON.parse(readFileSync(join(FIX, dir, f), "utf8"));
        assert.equal(validate(CLS.capabilities[cap].output, data, CLS), null, `${dir}/${f}`);
      }
    }
  });
});

test("setup.example.json fits the setup schema", () => {
  const example = JSON.parse(readFileSync(join(FIX, "..", "..", "setup.example.json"), "utf8"));
  assert.equal(validate(CLS.setup, example, CLS), null);
});
