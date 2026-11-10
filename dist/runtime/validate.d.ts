/** The JSON Schema subset this runtime understands. */
export interface Schema {
    type?: string | string[];
    properties?: Record<string, Schema>;
    required?: string[];
    additionalProperties?: boolean | Schema;
    items?: Schema;
    enum?: unknown[];
    oneOf?: Schema[];
    $ref?: string;
    description?: string;
    $defs?: Record<string, Schema>;
}
export declare const KEYWORDS: Set<string>;
/** Returns null when value fits schema, else a one-line "<path>: <problem>". root is where $ref resolves. */
export declare function validate(schema: Schema, value: unknown, root?: object, path?: string): string | null;
/** Every keyword used anywhere in a schema tree, for the test that keeps the set closed. */
export declare function keywordsIn(schema: unknown, out?: Set<string>): Set<string>;
