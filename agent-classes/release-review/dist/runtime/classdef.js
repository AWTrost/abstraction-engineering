// Load a class's contract (class.json) and a team's setup file, and check the setup's version pin.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { validate } from "./validate.js";
export class PinError extends Error {
}
export class SetupError extends Error {
}
export function loadClass(classDir) {
    return JSON.parse(readFileSync(join(classDir, "class.json"), "utf8"));
}
export function checkPin(setup, cls) {
    const want = `${cls.name}@${cls.version}`;
    if (setup.class !== want) {
        throw new PinError(`setup is pinned to ${JSON.stringify(setup.class ?? null)} but this class is ${JSON.stringify(want)}`);
    }
}
/** Reads and checks a setup file: the pin first, so another version's setup gets the pin error, then the contract's setup schema. */
export function loadSetup(path, cls) {
    let setup;
    try {
        setup = JSON.parse(readFileSync(path, "utf8"));
    }
    catch (e) {
        throw new SetupError(`cannot read setup ${path}: ${e.message}`);
    }
    if (setup === null || typeof setup !== "object" || Array.isArray(setup))
        throw new SetupError("setup must be a JSON object");
    checkPin(setup, cls);
    const err = validate(cls.setup, setup, cls);
    if (err)
        throw new SetupError(`setup: ${err}`);
    return setup;
}
/** The text of a typed function's prompt file. */
export function loadPrompt(classDir, fn) {
    return readFileSync(join(classDir, fn.prompt), "utf8");
}
