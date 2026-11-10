import { type Schema } from "./validate.ts";
export interface Capability {
    description?: string;
    stdin?: Schema;
    output: Schema;
}
export interface TypedFunction {
    description?: string;
    /** Path of the prompt file, relative to the class folder. */
    prompt: string;
    input: Schema;
    output: Schema;
}
/** A class contract: what class.json holds. $ref in any schema resolves against this object. */
export interface ClassDef {
    name: string;
    version: string;
    states?: string[];
    $defs?: Record<string, Schema>;
    capabilities: Record<string, Capability>;
    functions: Record<string, TypedFunction>;
    setup: Schema;
}
export type CmdBinding = {
    cmd: string[];
};
export type ModelBinding = {
    model: string;
};
export type Binding = CmdBinding | ModelBinding;
/** What every setup has. A class's own setup type adds its keys; the contract's setup schema checks them. */
export interface Setup {
    name: string;
    class: string;
    bindings: Record<string, Binding>;
}
export declare class PinError extends Error {
}
export declare class SetupError extends Error {
}
export declare function loadClass(classDir: string): ClassDef;
export declare function checkPin(setup: {
    class?: unknown;
}, cls: ClassDef): void;
/** Reads and checks a setup file: the pin first, so another version's setup gets the pin error, then the contract's setup schema. */
export declare function loadSetup<S extends Setup>(path: string, cls: ClassDef): S;
/** The text of a typed function's prompt file. */
export declare function loadPrompt(classDir: string, fn: TypedFunction): string;
