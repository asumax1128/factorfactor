// Candidate only. Requires current Console export, never deploys.
const fs = require("node:fs"),
  path = require("node:path");
const [input, out] = process.argv.slice(2);
if (!input || !out)
  throw Error("Current Console JSON and private output directory required");
const r = JSON.parse(fs.readFileSync(input, "utf8")),
  n = JSON.parse(JSON.stringify(r));
if (
  !n.rules?.games?.factor?.qm?.slot ||
  !n.rules.games.factor.rooms?.$code?.meta
)
  throw Error("UNEXPECTED_CURRENT_RULES");
if (n.rules.games.factor.onlineRatedV2)
  throw Error("NEW_BRANCH_ALREADY_EXISTS_REVIEW_REQUIRED");
for (const node of [n.rules, n.rules.games, n.rules.games.factor])
  for (const permission of [".read", ".write"]) {
    if (
      node[permission] !== undefined &&
      node[permission] !== false &&
      node[permission] !== "false"
    )
      throw Error("BROAD_ANCESTOR_PERMISSION_REQUIRES_REVIEW");
  }
Object.assign(
  n.rules.games.factor,
  require("../firebase/online-rated.rules.fragment.json"),
);
// Legacy queues cannot create/join new games during approved migration/cutover.
// Existing numbered rooms and in-progress games remain permitted.
const flag =
  "root.child('games/factor/onlineRatedV2/config/stopLegacyQuickMatch').val() !== true";
const slot = n.rules.games.factor.qm.slot;
slot[".write"] =
  "(" +
  slot[".write"] +
  ") && (" +
  flag +
  " || (!newData.exists() && data.child('host').val() === auth.uid))";
const meta = n.rules.games.factor.rooms.$code.meta;
meta[".write"] =
  "(" +
  meta[".write"] +
  ") && (newData.child('qm').val() !== true || " +
  flag +
  ")";
const player = n.rules.games.factor.rooms.$code.players.$uid;
player[".write"] =
  "(" +
  player[".write"] +
  ") && (!newData.exists() || data.exists() || root.child('games/factor/rooms/' + $code + '/meta/qm').val() !== true || " +
  flag +
  ")";
fs.mkdirSync(out, { recursive: true, mode: 0o700 });
fs.writeFileSync(
  path.join(out, "online-rated-candidate.rules.json"),
  JSON.stringify(n, null, 2),
  { mode: 0o600 },
);
console.log(
  "Candidate generated. Added server-only branch and legacy quick-match stop gate. No deployment.",
);
