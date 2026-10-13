// Requires an owner-supplied full current snapshot. Never reconstruct missing rules.
const fs = require("fs"),
  assert = require("node:assert/strict");
const input = process.argv[2],
  output = process.argv[3];
if (!input || !output)
  throw Error(
    "Usage: node scripts/prepare-ghost-host-rules.cjs CURRENT_FULL_RULES OUTPUT",
  );
const before = JSON.parse(fs.readFileSync(input, "utf8")),
  after = JSON.parse(JSON.stringify(before)),
  f = after.rules?.games?.factor;
if (
  !f?.onlineSparkV1?.profiles?.$account ||
  !f.rooms?.$code?.meta ||
  !f.mathTowerV2
)
  throw Error("CURRENT_FULL_PRODUCTION_RULES_REQUIRED");
if (f.ghostV1 || f.eventHosts || f.eventHostRooms)
  throw Error(
    "EXISTING_FEATURE_RULES: review explicit diff instead of replacing",
  );
const next = require("../firebase/online-spark-rules.cjs").onlineSparkV1;
for (const [path, value] of [
  [["profiles", "$account", ".validate"], next.profiles.$account[".validate"]],
  [
    ["profiles", "$account", "badges", "$badge", ".validate"],
    next.profiles.$account.badges.$badge[".validate"],
  ],
  [["slots", "$difficulty", ".write"], next.slots.$difficulty[".write"]],
  [["slots", "$difficulty", "fallback"], next.slots.$difficulty.fallback],
]) {
  let n = f.onlineSparkV1;
  for (const k of path.slice(0, -1)) n = n[k];
  n[path.at(-1)] = value;
}
Object.assign(f, require("../firebase/ghost-rules.cjs"));
require("../firebase/event-host-rules.cjs").patch(after);
for (const game of Object.keys(before.rules.games).filter(
  (g) => g !== "factor",
))
  assert.deepEqual(after.rules.games[game], before.rules.games[game]);
for (const key of Object.keys(before.rules.games.factor).filter(
  (k) => !["rooms", "onlineSparkV1"].includes(k),
))
  assert.deepEqual(f[key], before.rules.games.factor[key]);
fs.writeFileSync(output, JSON.stringify(after, null, 2) + "\n");
console.log(
  "Candidate created; protected account/auth/tower/other-game rules unchanged. No production deploy.",
);
