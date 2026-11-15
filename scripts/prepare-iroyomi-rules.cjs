const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const [input, out] = process.argv.slice(2);
if (!input || !out)
  throw Error("Current Console export and private output directory required");
const before = JSON.parse(fs.readFileSync(input, "utf8")),
  after = JSON.parse(JSON.stringify(before));
if (!before.rules?.games?.factor) throw Error("UNEXPECTED_CURRENT_RULES");
for (const node of [before.rules, before.rules.games])
  for (const p of [".read", ".write"])
    if (node[p] !== undefined && node[p] !== false && node[p] !== "false")
      throw Error("BROAD_ANCESTOR_PERMISSION_REQUIRES_REVIEW");
if (before.rules.games.iroyomi)
  throw Error("EXISTING_IROYOMI_BRANCH_REQUIRES_REVIEW");
after.rules.games.iroyomi = require("../firebase/iroyomi-rules.cjs");
const unchanged = JSON.parse(JSON.stringify(after));
delete unchanged.rules.games.iroyomi;
assert.deepEqual(unchanged, before);
fs.mkdirSync(out, { recursive: true, mode: 0o700 });
fs.writeFileSync(
  path.join(out, "iroyomi-candidate.rules.json"),
  JSON.stringify(after, null, 2),
  { mode: 0o600 },
);
console.log(
  "Only games/iroyomi added; every existing rule preserved; no deployment.",
);
