// Install a class's agent skill into a project: a relative link into node_modules, or a marked copy.
import { cpSync, existsSync, lstatSync, mkdirSync, realpathSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { UsageError } from "./cli.ts";

export interface InstallSkillOptions {
  /** The class folder, which holds skill/. */
  classDir: string;
  /** The skill's folder name under .claude/skills. */
  name: string;
  project: string;
  copy?: boolean;
  out: (line: string) => void;
}

export function installSkill({ classDir, name, project, copy = false, out }: InstallSkillOptions): number {
  const mark = `.copied-by-${name}`;
  const skills = join(resolve(project), ".claude", "skills");
  const target = join(skills, name);
  const src = join(classDir, "skill");
  mkdirSync(skills, { recursive: true });
  let st = null;
  try {
    st = lstatSync(target);
  } catch { /* not there yet */ }
  if (st?.isSymbolicLink()) unlinkSync(target);
  else if (st && existsSync(join(target, mark))) rmSync(target, { recursive: true });
  else if (st) throw new UsageError(`${target} exists and was not made by install-skill; move it first`);
  if (!copy) {
    try {
      // From the real paths: a symlinked parent (macOS /var, a linked checkout) would leave the link one level off.
      const rel = relative(realpathSync(skills), realpathSync(src));
      symlinkSync(rel, target, "dir");
      out(`linked ${target} -> ${rel}`);
      return 0;
    } catch (e) {
      out(`cannot link (${(e as NodeJS.ErrnoException).code ?? (e as Error).message}), copying instead`);
    }
  }
  cpSync(src, target, { recursive: true });
  writeFileSync(join(target, mark), "");
  out(`copied the skill to ${target}. A copy does not follow the package: run install-skill again after every upgrade.`);
  return 0;
}
