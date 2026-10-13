const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const [input, out] = process.argv.slice(2);
if (!input || !out)
  throw Error("Current Console export and private output directory required");
const before = JSON.parse(fs.readFileSync(input, "utf8")),
  after = JSON.parse(JSON.stringify(before));
if (!before.rules?.games?.factor) throw Error("UNEXPECTED_CURRENT_RULES");
for (const node of [
  before.rules,
  before.rules.games,
  before.rules.games.factor,
])
  for (const p of [".read", ".write"])
    if (node[p] !== undefined && node[p] !== false && node[p] !== "false")
      throw Error("BROAD_ANCESTOR_PERMISSION_REQUIRES_REVIEW");
if (before.rules.games.factor.onlineSparkV1)
  throw Error("EXISTING_SPARK_BRANCH_REQUIRES_REVIEW");
Object.assign(
  after.rules.games.factor,
  require("../firebase/online-spark-rules.cjs"),
);
const unchanged = JSON.parse(JSON.stringify(after));
delete unchanged.rules.games.factor.onlineSparkV1;
assert.deepEqual(unchanged, before);
fs.mkdirSync(out, { recursive: true, mode: 0o700 });
fs.writeFileSync(
  path.join(out, "spark-candidate.rules.json"),
  JSON.stringify(after, null, 2),
  { mode: 0o600 },
);
console.log(
  "Only onlineSparkV1 added; every existing rule preserved; no deployment.",
);
