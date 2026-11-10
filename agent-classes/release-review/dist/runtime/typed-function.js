// Call a typed function: one judgement, filled by a model or by a command binding, checked against its output schema.
// It never throws: a failure becomes the class's own fallback result, so the caller never handles an exception.
import { spawnSync } from "node:child_process";
import { validate } from "./validate.js";
export const TIMEOUT_MS = 120_000;
// The setup is stripped for cost (about 140 times cheaper, measured) and so no house context reaches the judgement.
export function modelArgv(model, schema) {
    return ["claude", "-p", "--model", model, "--tools", "", "--setting-sources", "",
        "--strict-mcp-config", "--no-session-persistence", "--output-format", "json",
        "--json-schema", JSON.stringify(schema)];
}
/** Returns [structured_output, cost_usd] from claude's JSON stdout; throws on an error result. */
export function parseModelOutput(stdout) {
    const obj = JSON.parse(stdout);
    if (obj.is_error)
        throw new Error(`claude reported an error: ${String(obj.result).slice(0, 200)}`);
    const so = obj.structured_output;
    if (so === null || typeof so !== "object" || Array.isArray(so))
        throw new Error("claude returned no structured_output");
    return [so, Number(obj.total_cost_usd) || 0];
}
/** Returns [result, cost_usd]. Never throws: a failure returns fallback(reason) at no cost. */
export function callFunction(binding, prompt, schema, inputs, { fallback, timeoutMs = TIMEOUT_MS }) {
    let why;
    const fromModel = "model" in binding;
    try {
        const argv = fromModel ? [...modelArgv(binding.model, schema), prompt] : [...binding.cmd];
        const p = spawnSync(argv[0], argv.slice(1), { input: JSON.stringify(inputs), encoding: "utf8", timeout: timeoutMs, maxBuffer: 64 * 1024 * 1024 });
        if (p.error?.code === "ETIMEDOUT")
            throw new Error(`timed out after ${timeoutMs / 1000}s`);
        if (p.error)
            throw p.error;
        if (p.status !== 0)
            throw new Error(`exit ${p.status ?? p.signal}: ${p.stderr.trim().slice(0, 200)}`);
        const [result, cost] = fromModel ? parseModelOutput(p.stdout) : [JSON.parse(p.stdout), 0];
        if (validate(schema, result) !== null)
            throw new Error(`result does not match the schema: ${JSON.stringify(result).slice(0, 200)}`);
        return [result, cost];
    }
    catch (e) {
        why = (String(e?.message ?? e).split("\n")[0]) || "";
    }
    // The stripped call does not load settings.json, so its env (a provider's variables) is not there.
    const hint = fromModel ? " (provider variables in settings.json env are not loaded; set them in the shell)" : "";
    return [fallback(`binding failed: ${why}${hint}`), 0];
}
