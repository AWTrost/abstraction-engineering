export interface InstallSkillOptions {
    /** The class folder, which holds skill/. */
    classDir: string;
    /** The skill's folder name under .claude/skills. */
    name: string;
    project: string;
    copy?: boolean;
    out: (line: string) => void;
}
export declare function installSkill({ classDir, name, project, copy, out }: InstallSkillOptions): number;
