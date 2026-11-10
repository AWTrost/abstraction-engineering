// A JSON Schema checker for the keywords class contracts use, and only those. A test fails if a schema
// uses any other keyword, so an unsupported one can never be silently skipped.

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

export const KEYWORDS = new Set(["type", "properties", "required", "additionalProperties", "items", "enum",
  "oneOf", "$ref", "description"]);

const show = (v: unknown): string => (JSON.stringify(v) ?? String(v)).slice(0, 100);

function typeOf(v: unknown): string {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  if (Number.isInteger(v)) return "integer";
  return typeof v;
}

function isType(v: unknown, t: string): boolean {
  const got = typeOf(v);
  return got === t || (t === "number" && got === "integer");
}

function resolve(ref: string, root: object): Schema {
  if (!ref.startsWith("#/")) throw new Error(`unsupported $ref ${ref}`);
  let node: unknown = root;
  for (const part of ref.slice(2).split("/")) node = (node as Record<string, unknown> | undefined)?.[part];
  if (node === undefined) throw new Error(`unresolved $ref ${ref}`);
  return node as Schema;
}

/** Returns null when value fits schema, else a one-line "<path>: <problem>". root is where $ref resolves. */
export function validate(schema: Schema, value: unknown, root: object = schema, path = ""): string | null {
  const at = path || "(top)";
  if (schema.$ref) return validate(resolve(schema.$ref, root), value, root, path);
  if (schema.type) {
    const types = ([] as string[]).concat(schema.type);
    if (!types.some((t) => isType(value, t))) return `${at}: expected ${types.join(" or ")}, got ${show(value)}`;
  }
  if (schema.enum && !schema.enum.includes(value)) return `${at}: ${show(value)} is not one of ${show(schema.enum)}`;
  if (schema.oneOf) {
    const fits = schema.oneOf.filter((s) => validate(s, value, root, path) === null).length;
    if (fits !== 1) return `${at}: must match exactly one allowed shape, matched ${fits}: ${show(value)}`;
  }
  if (typeOf(value) === "object") {
    const obj = value as Record<string, unknown>;
    for (const k of schema.required ?? []) {
      if (!Object.hasOwn(obj, k)) return `${at}: missing required key ${k}`;
    }
    const props = schema.properties ?? {};
    for (const [k, v] of Object.entries(obj)) {
      const sub = path ? `${path}.${k}` : k;
      if (Object.hasOwn(props, k)) {
        const err = validate(props[k], v, root, sub);
        if (err) return err;
      } else if (schema.additionalProperties === false) {
        return `${at}: unexpected key ${k}`;
      } else if (typeof schema.additionalProperties === "object") {
        const err = validate(schema.additionalProperties, v, root, sub);
        if (err) return err;
      }
    }
  }
  if (Array.isArray(value) && schema.items) {
    for (let i = 0; i < value.length; i++) {
      const err = validate(schema.items, value[i], root, `${path}[${i}]`);
      if (err) return err;
    }
  }
  return null;
}

/** Every keyword used anywhere in a schema tree, for the test that keeps the set closed. */
export function keywordsIn(schema: unknown, out: Set<string> = new Set()): Set<string> {
  if (Array.isArray(schema)) schema.forEach((s) => keywordsIn(s, out));
  else if (schema && typeof schema === "object") {
    for (const [k, v] of Object.entries(schema)) {
      out.add(k);
      if (k === "properties" || k === "$defs") Object.values(v as object).forEach((s) => keywordsIn(s, out));
      else if (k === "items" || k === "additionalProperties" || k === "oneOf") keywordsIn(v, out);
    }
  }
  return out;
}
