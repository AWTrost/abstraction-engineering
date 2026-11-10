// Write a run's output files all or nothing.
import { randomBytes } from "node:crypto";
import { mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export const expandHome = (p: string): string => p.replace(/^~(?=$|\/)/, homedir());

/**
 * Writes every [name, text] file into dir, or none of them. Returns the written paths in order.
 * The texts are already rendered, so a render failure never reaches here; rename lets a test make the swap fail.
 */
export function writeAll(dir: string, files: [string, string][], { rename = renameSync }: { rename?: (from: string, to: string) => void } = {}): string[] {
  const out = expandHome(dir);
  mkdirSync(out, { recursive: true });
  const tmps: [string, string][] = [];
  try {
    for (const [name, text] of files) {
      const tmp = join(out, `.${name}.${randomBytes(6).toString("hex")}.tmp`);
      tmps.push([tmp, join(out, name)]);
      writeFileSync(tmp, text, { flag: "wx" });
    }
    for (const [tmp, dest] of tmps) rename(tmp, dest);
  } finally {
    for (const [tmp] of tmps) rmSync(tmp, { force: true });
  }
  return tmps.map(([, dest]) => dest);
}
