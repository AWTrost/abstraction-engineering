// Test binding for change_matches_ticket: reads {ticket, changes} on stdin.
// DEMO-4 gets "partial", every other ticket "matches". FAKE_MATCH_FAIL=1 makes it exit 1.
import { readFileSync } from "node:fs";

const data = JSON.parse(readFileSync(0, "utf8"));
if (process.env.FAKE_MATCH_FAIL === "1") process.exit(1);
console.log(JSON.stringify({ verdict: data.ticket.key === "DEMO-4" ? "partial" : "matches", reason: "fake" }));
