export declare const expandHome: (p: string) => string;
/**
 * Writes every [name, text] file into dir, or none of them. Returns the written paths in order.
 * The texts are already rendered, so a render failure never reaches here; rename lets a test make the swap fail.
 */
export declare function writeAll(dir: string, files: [string, string][], { rename }?: {
    rename?: (from: string, to: string) => void;
}): string[];
