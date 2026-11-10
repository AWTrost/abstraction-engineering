// Where this class's own files are. The same two levels up from src/release-review/ and dist/release-review/.
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadClass as loadClassAt } from "../runtime/classdef.js";
export const CLASS_DIR = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
export const CASES_PATH = join(CLASS_DIR, "conformance", "match_cases.json");
export const loadClass = () => loadClassAt(CLASS_DIR);
