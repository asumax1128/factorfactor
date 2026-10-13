const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  os = require("node:os"),
  path = require("node:path"),
  cp = require("node:child_process"),
  crypto = require("node:crypto");
test("offline migration retains exact backup, compact state, ratings and zero new counts; unsafe inputs stop", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rated-plan-")),
    input = path.join(dir, "accounts.json"),
    out = path.join(dir, "out");
  const accounts = {
    aa: {
      name: "A",
      stats: { rating: 1800, w: 15, title: "legacy", maxRating: 1850 },
    },
    ab: { name: "B", stats: { rating: 1620 } },
    ac: { name: "C", stats: {} },
  };
  const source = JSON.stringify(accounts);
  fs.writeFileSync(input, source);
  cp.execFileSync(process.execPath, [
    "scripts/plan-rated-migration.cjs",
    input,
    out,
  ]);
  const read = (n) => JSON.parse(fs.readFileSync(path.join(out, n), "utf8")),
    manifest = read("manifest.json"),
    state = read("candidate-private-state.json"),
    archive = read("candidate-legacy-archive.json");
  assert.equal(
    fs.readFileSync(path.join(out, "legacy-accounts-backup.json"), "utf8"),
    source,
  );
  assert.equal(
    manifest.sourceSha256,
    crypto.createHash("sha256").update(source).digest("hex"),
  );
  assert.equal(manifest.count, 3);
  assert.equal(manifest.activationAllowed, false);
  assert.equal(state.enabled, false);
  assert.equal(state.migrationReady, false);
  for (const [key, a] of Object.entries(accounts)) {
    assert.equal(state.players[key].easy.rating, a.stats.rating ?? 1500);
    assert.equal(state.players[key].normal.rating, 1500);
    assert.equal(state.players[key].easy.games, 0);
    assert.equal(state.players[key].normal.games, 0);
    assert.equal(state.players[key].legacy.stats, undefined);
    assert.deepEqual(archive[key].stats, a.stats);
  }
  assert.equal(
    fs.statSync(path.join(out, "manifest.json")).mode & 0o777,
    0o600,
  );
  const repoOut = path.resolve(__dirname, "..", "migration-unsafe");
  assert.notEqual(
    cp.spawnSync(process.execPath, [
      "scripts/plan-rated-migration.cjs",
      input,
      repoOut,
    ]).status,
    0,
  );
  assert.equal(fs.existsSync(repoOut), false);
  const symlink = path.join(dir, "repo-link");
  fs.symlinkSync(path.resolve(__dirname, ".."), symlink, "dir");
  assert.notEqual(
    cp.spawnSync(process.execPath, [
      "scripts/plan-rated-migration.cjs",
      input,
      path.join(symlink, "migration-unsafe"),
    ]).status,
    0,
  );
  assert.equal(fs.existsSync(repoOut), false);
  assert.notEqual(
    cp.spawnSync(process.execPath, [
      "scripts/plan-rated-migration.cjs",
      input,
      out,
    ]).status,
    0,
  );
  assert.equal(
    fs.readFileSync(path.join(out, "legacy-accounts-backup.json"), "utf8"),
    source,
  );
  fs.writeFileSync(
    input,
    JSON.stringify({ aa: { name: "A", stats: { rating: "1800" } } }),
  );
  const invalid = path.join(dir, "invalid");
  assert.notEqual(
    cp.spawnSync(process.execPath, [
      "scripts/plan-rated-migration.cjs",
      input,
      invalid,
    ]).status,
    0,
  );
  assert.equal(fs.existsSync(invalid), false);
});
