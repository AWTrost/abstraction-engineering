// Test binding: fake_binding.js <fixture_dir> <capability> <release> prints the fixture file.
// For `tickets` it reads a JSON key list on stdin and prints only the matching tickets, in file order.
// For `change_diffs` it reads a JSON id list on stdin and prints only the matching diffs.
import { readFileSync } from "node:fs";
import { join } from "node:path";

const [fixtureDir, capability] = process.argv.slice(2);
let data = JSON.parse(readFileSync(join(fixtureDir, `${capability}.json`), "utf8"));
if (capability === "tickets") {
  const keys = new Set(JSON.parse(readFileSync(0, "utf8")));
  data = data.filter((t) => keys.has(t.key));
} else if (capability === "change_diffs") {
  const ids = new Set(JSON.parse(readFileSync(0, "utf8")));
  data = data.filter((d) => ids.has(d.id));
}
console.log(JSON.stringify(data));
