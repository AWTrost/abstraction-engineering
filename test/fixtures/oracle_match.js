// Test binding for change_matches_ticket: prints the expected verdict for the ticket key on stdin,
// read from a cases file (the class's own by default). A perfect model, to test the scoring.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const casesPath = process.argv[2] ?? fileURLToPath(new URL("../../conformance/match_cases.json", import.meta.url));
const data = JSON.parse(readFileSync(0, "utf8"));
const expected = Object.fromEntries(JSON.parse(readFileSync(casesPath, "utf8")).map((c) => [c.ticket.key, c.expected]));
console.log(JSON.stringify({ verdict: expected[data.ticket.key], reason: "oracle" }));
