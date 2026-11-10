// The typed fuzzy function change_matches_ticket: one judgement, run by a model or a command binding.
// Any failure comes back as verdict "unclear", so the caller never has to handle an exception.
import { spawnSync } from "node:child_process";
import { validate } from "./validate.js";

export const CAP = 4000; // characters per text field
export const TIMEOUT_MS = 120_000;

/** Returns [inputs, truncated]: the function's input with long text fields cut to CAP. */
export function payload(ticket, changes) {
  let cut = false;
  const clip = (d, fields) => {
    const out = { ...d };
    for (const f of fields) {
      if (typeof out[f] === "string" && out[f].length > CAP) {
        out[f] = out[f].slice(0, CAP);
        cut = true;
      }
    }
    return out;
  };
  const inputs = { ticket: clip(ticket, ["summary", "description"]), changes: changes.map((c) => clip(c, ["title", "description"])) };
  return [inputs, cut];
}

// The setup is stripped for cost (about 140 times cheaper, measured) and so no house context reaches the judgement.
export function modelArgv(model, schema) {
  return ["claude", "-p", "--model", model, "--tools", "", "--setting-sources", "",
    "--strict-mcp-config", "--no-session-persistence", "--output-format", "json",
    "--json-schema", JSON.stringify(schema)];
}

/** Returns [structured_output, cost_usd] from claude's JSON stdout; throws on an error result. */
export function parseModelOutput(stdout) {
  const obj = JSON.parse(stdout);
  if (obj.is_error) throw new Error(`claude reported an error: ${String(obj.result).slice(0, 200)}`);
  const so = obj.structured_output;
  if (so === null || typeof so !== "object" || Array.isArray(so)) throw new Error("claude returned no structured_output");
  return [so, Number(obj.total_cost_usd) || 0];
}

/** Returns [result, cost_usd]. Never throws: a failure is {verdict: "unclear", reason: "binding failed: ..."}. */
export function call(binding, prompt, schema, inputs, { timeoutMs = TIMEOUT_MS } = {}) {
  let why;
  const fromModel = "model" in binding;
  try {
    const argv = fromModel ? [...modelArgv(binding.model, schema), prompt] : [...binding.cmd];
    const p = spawnSync(argv[0], argv.slice(1), { input: JSON.stringify(inputs), encoding: "utf8", timeout: timeoutMs, maxBuffer: 64 * 1024 * 1024 });
    if (p.error?.code === "ETIMEDOUT") throw new Error(`timed out after ${timeoutMs / 1000}s`);
    if (p.error) throw p.error;
    if (p.status !== 0) throw new Error(`exit ${p.status ?? p.signal}: ${p.stderr.trim().slice(0, 200)}`);
    const [result, cost] = fromModel ? parseModelOutput(p.stdout) : [JSON.parse(p.stdout), 0];
    if (validate(schema, result) !== null) throw new Error(`result does not match the schema: ${JSON.stringify(result).slice(0, 200)}`);
    return [result, cost];
  } catch (e) {
    why = (String(e?.message ?? e).split("\n")[0]) || "";
  }
  // The stripped call does not load settings.json, so its env (a provider's variables) is not there.
  const hint = fromModel ? " (provider variables in settings.json env are not loaded; set them in the shell)" : "";
  return [{ verdict: "unclear", reason: `binding failed: ${why}${hint}` }, 0];
}
