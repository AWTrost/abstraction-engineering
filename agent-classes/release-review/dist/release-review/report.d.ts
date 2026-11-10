import type { Report } from "./types.ts";
export declare const NOT_CHECKED: string[];
export declare function renderMd(data: Report): string;
export interface WriteDeps {
    render?: (data: Report) => string;
    rename?: (from: string, to: string) => void;
}
/** Writes both files or neither. Returns [mdPath, jsonPath]. deps lets a test make render or rename fail. */
export declare function write(reportDir: string, release: string, data: Report, { render, rename }?: WriteDeps): string[];
