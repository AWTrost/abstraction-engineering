import { callFunction } from "../runtime/typed-function.js";
export const CAP = 4000; // characters per text field
/** Returns [inputs, truncated]: the function's input with long text fields cut to CAP. */
export function payload(ticket, changes) {
    let cut = false;
    const clip = (d, fields) => {
        const out = { ...d };
        for (const f of fields) {
            const v = out[f];
            if (typeof v === "string" && v.length > CAP) {
                out[f] = v.slice(0, CAP);
                cut = true;
            }
        }
        return out;
    };
    const inputs = { ticket: clip(ticket, ["summary", "description"]), changes: changes.map((c) => clip(c, ["title", "description"])) };
    return [inputs, cut];
}
/** Returns [result, cost_usd]. Never throws: a failure is {verdict: "unclear", reason: "binding failed: ..."}. */
export function call(binding, prompt, schema, inputs, { timeoutMs } = {}) {
    return callFunction(binding, prompt, schema, inputs, {
        fallback: (reason) => ({ verdict: "unclear", reason }), timeoutMs,
    });
}
