// Offline planning only: no SDK, no production access, no write to a database.
const fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto"),
  C = require("../server/online-rated/core.cjs");
const [input, out] = process.argv.slice(2);
if (!input || !out)
  throw Error(
    "Usage: node scripts/plan-rated-migration.cjs OWNER_LOCAL_accounts.json /PRIVATE_OUTPUT_DIR",
  );
function realDestination(p) {
  const absolute = path.resolve(p);
  if (fs.existsSync(absolute)) return fs.realpathSync(absolute);
  return path.join(
    realDestination(path.dirname(absolute)),
    path.basename(absolute),
  );
}
const destination = realDestination(out),
  repository = fs.realpathSync(path.resolve(__dirname, ".."));
if (destination.startsWith(repository + path.sep) || destination === repository)
  throw Error("PRIVATE_OUTPUT_MUST_BE_OUTSIDE_REPOSITORY");
if (fs.existsSync(out) && fs.readdirSync(out).length)
  throw Error("OUTPUT_NOT_EMPTY_KEEP_EXISTING_BACKUP");
const bytes = fs.readFileSync(input),
  json = JSON.parse(bytes);
const accounts = json.games?.factor?.accounts || json.accounts || json;
const migrationId = "legacy-to-easy-v1",
  snapshotAt = Date.now();
const state = C.migrate(null, accounts, migrationId, snapshotAt);
state.enabled = false;
state.migrationReady = false;
fs.mkdirSync(out, { recursive: true, mode: 0o700 });
fs.chmodSync(out, 0o700);
fs.writeFileSync(out + "/legacy-accounts-backup.json", bytes, {
  mode: 0o600,
  flag: "wx",
});
const manifest = {
  migrationId,
  snapshotAt,
  count: Object.keys(accounts).length,
  sourceSha256: crypto.createHash("sha256").update(bytes).digest("hex"),
  values: Object.fromEntries(
    Object.entries(state.players).map(([k, p]) => [
      k,
      {
        before: p.legacy.stats.rating ?? 1500,
        easy: p.easy.rating,
        normal: p.normal.rating,
        easyGames: p.easy.games,
        normalGames: p.normal.games,
      },
    ]),
  ),
  activationAllowed: false,
  requires: [
    "fresh rules",
    "maintenance and in-flight match drain",
    "unchanged source digest before apply",
    "owner backup outside ephemeral environment",
    "billing confirmation",
    "server integration and rollback rehearsal",
  ],
};
const archive = Object.fromEntries(
  Object.entries(state.players).map(([key, p]) => [key, C.copy(p.legacy)]),
);
for (const p of Object.values(state.players)) delete p.legacy.stats;
fs.writeFileSync(
  out + "/candidate-legacy-archive.json",
  JSON.stringify(archive, null, 2),
  { mode: 0o600, flag: "wx" },
);
fs.writeFileSync(
  out + "/candidate-private-state.json",
  JSON.stringify(state, null, 2),
  { mode: 0o600, flag: "wx" },
);
fs.writeFileSync(out + "/manifest.json", JSON.stringify(manifest, null, 2), {
  mode: 0o600,
  flag: "wx",
});
console.log(
  "Offline plan created. Count:",
  manifest.count,
  "Activation remains blocked. No database access.",
);
