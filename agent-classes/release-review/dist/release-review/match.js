import { callFunction } from "../runtime/typed-function.js";
export const CAP = 4000; // characters per text field
export const DIFF_CAP = 20_000; // characters per diff: a diff is far longer than a description
/** Returns [inputs, truncated]: the function's input with long text fields cut to CAP and diffs to DIFF_CAP. */
export function payload(ticket, changes) {
    let cut = false;
    const clip = (d, fields, cap = CAP) => {
        const out = { ...d };
        for (const f of fields) {
            const v = out[f];
            if (typeof v === "string" && v.length > cap) {
                out[f] = v.slice(0, cap);
                cut = true;
            }
        }
        return out;
    };
    const inputs = { ticket: clip(ticket, ["summary", "description"]),
        changes: changes.map((c) => clip(clip(c, ["title", "description"]), ["diff"], DIFF_CAP)) };
    return [inputs, cut];
}
/** Returns [result, cost_usd]. Never throws: a failure is {verdict: "unclear", reason: "binding failed: ..."}. */
export function call(binding, prompt, schema, inputs, { timeoutMs } = {}) {
    return callFunction(binding, prompt, schema, inputs, {
        fallback: (reason) => ({ verdict: "unclear", reason }), timeoutMs,
    });
}
