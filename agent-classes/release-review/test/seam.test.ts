// The runtime is the part every class will share, so it must never depend on release-review.
// When a second or third class arrives, src/runtime moves out as it is.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

const RUNTIME = fileURLToPath(new URL("../src/runtime", import.meta.url));

/** Every module a source file imports, from static and dynamic imports and re-exports. */
export function importsOf(source: string): string[] {
  const found: string[] = [];
  for (const m of source.matchAll(/(?:\bfrom|\bimport)\s*\(?\s*["']([^"']+)["']/g)) found.push(m[1]);
  return found;
}

/** Imports that leave the runtime folder: anything but node: built-ins and ./ siblings. */
export const outside = (source: string): string[] => importsOf(source).filter((s) => !s.startsWith("node:") && !s.startsWith("./"));

describe("seam", () => {
  test("the check catches every way out of the runtime", () => {
    const bad = `import { a } from "../release-review/gaps.ts";\nexport { b } from "../x.ts";\nconst c = await import("pkg");`;
    assert.deepEqual(outside(bad), ["../release-review/gaps.ts", "../x.ts", "pkg"]);
    assert.deepEqual(outside(`import { readFileSync } from "node:fs";\nimport type { Schema } from "./validate.ts";`), []);
  });

  test("runtime code imports only node built-ins and other runtime files", () => {
    const files = readdirSync(RUNTIME).filter((f) => f.endsWith(".ts"));
    assert.ok(files.length >= 5, `expected the runtime files, found ${files}`);
    for (const f of files) assert.deepEqual(outside(readFileSync(join(RUNTIME, f), "utf8")), [], `${f} reaches outside src/runtime`);
  });
});
