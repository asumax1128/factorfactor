// Ver.6.17 progress format 3 (AXIOMIA part 1 with layers): migration, per-layer progress, difficulty independence,
// unchanged battles, and old clients never overwriting a newer record.
const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  cp = require("node:child_process"),
  vm = require("node:vm"),
  R = require("../math-tower-core"),
  policy = require("../math-tower-policy.json"),
  part = require("../math-tower/axiomia-part1.json");
const V = R.view(part, 1);
const win = (f, d, hp = 90) => ({ ...R.begin(f, d, hp, V.policy), won: true, correct: 8, damage: 9 });

test("the layered view keeps the approved battle policy and 5 locations with the boss on 5", () => {
  assert.deepEqual(part.policy, policy);
  assert.equal(V.policy.floorCount, 5);
  assert.equal(V.policy.bossFloor, 5);
  assert.equal(V.policy.keyPrefix, "L1-");
  assert.equal(V.policy.layer, 1);
  assert.equal(V.policy.nextLayer, undefined, "no layer 2 yet");
  assert.equal(V.legacy, false);
  const old = R.view(require("../math-tower/chapter1.json"));
  assert.equal(old.legacy, true);
  assert.equal(old.policy.keyPrefix, undefined);
  assert.deepEqual(old.flow.post(5), ["5-post", "5-epilogue"]);
  assert.deepEqual(old.flow.pre(1), ["1-pre"]);
});

test("normal enemies still fall after 6 correct pairs (7-8 units), bosses after 11 - the layered policy changes no battle rule", () => {
  const run = (f, d, p) => {
    let s = R.begin(f, d, 100, p),
      n = 0;
    while (!s.won && n < 50) {
      s = R.answer(s, true, 100, p, () => 0);
      n++;
    }
    return n;
  };
  for (const f of [1, 2, 3, 4]) assert.equal(run(f, "easy", V.policy), 6);
  assert.equal(run(5, "normal", V.policy), 11);
  assert.equal(run(1, "hard", V.policy), 8, "hard still needs a Lv8+ answer");
  // identical to the old chapter's numbers
  for (const d of ["easy", "normal", "hard"]) assert.equal(run(1, d, V.policy), run(1, d, policy));
});

test("layer progress is stored under L<layer>-<floor>; old chapter keys and best are never touched", () => {
  let q = R.startAdventure(R.fresh(), "normal", 100, 1);
  assert.equal(q.adventures.normal.layer, 1);
  q = R.complete(q, win(1, "normal"), V.policy, "a", 200);
  assert.deepEqual(Object.keys(q.clearedFloors), ["L1-1"]);
  assert.equal(q.kills["L1-1"], 1);
  assert.equal(q.notes["L1-1"], true);
  assert.equal(q.newInfo["floorL1-1"], true);
  assert(q.difficulties.normal.records["L1-1"]);
  assert.equal(q.difficulties.normal.best, 0);
  assert.equal(q.difficulties.normal.layerBest[1], 1);
  assert.equal(q.history.a.layer, 1);
  assert.equal(q.fragments[1], undefined);
  q = R.finishStory(q, "normal", V.policy);
  assert.equal(q.adventures.normal.floor, 2);
  assert.equal(q.adventures.normal.phase, "ready");
  // the boss gives the layer's fragment, not the old chapter's fragment/reward; no layer 2 -> cleared
  q = R.complete(q, win(5, "normal"), V.policy, "boss", 300);
  assert.equal(q.fragments[1], true);
  assert.equal(q.fragment, false);
  assert.equal(q.reward, false);
  q = R.finishStory(q, "normal", V.policy);
  assert.equal(q.adventures.normal.phase, "cleared");
  assert.equal(q.adventures.normal.layer, 1);
  assert.deepEqual(R.complete(q, win(5, "normal"), V.policy, "boss", 301), q, "idempotent per run id");
});

test("when another layer exists the same adventure goes on there (data only: no layer 2 content is shipped)", () => {
  const two = { ...V.policy, nextLayer: 2 };
  let q = R.startAdventure(R.fresh(), "hard", 1, 1);
  q.adventures.hard = { ...q.adventures.hard, floor: 5, phase: "post", hp: 77 };
  q = R.finishStory(q, "hard", two);
  assert.deepEqual([q.adventures.hard.layer, q.adventures.hard.floor, q.adventures.hard.phase, q.adventures.hard.hp], [2, 1, "ready", 77]);
  const p2 = { ...R.view(part, 1).policy, layer: 2, keyPrefix: "L2-" };
  q = R.complete(q, win(1, "hard"), p2, "l2", 5);
  assert.equal(q.clearedFloors["L2-1"], true);
  assert.equal(q.clearedFloors["L1-1"], undefined, "layers do not share keys");
});

test("difficulties stay independent inside a layer", () => {
  let q = R.startAdventure(R.fresh(), "easy", 1, 1);
  q = R.startAdventure(q, "hard", 2, 1);
  q = R.complete(q, win(1, "hard"), V.policy, "h1", 3);
  assert.equal(q.adventures.easy.phase, "ready");
  assert.equal(q.adventures.easy.floor, 1);
  assert.equal(q.adventures.hard.phase, "post");
  assert.equal(q.difficulties.easy.layerBest[1], undefined);
  assert.equal(q.difficulties.hard.layerBest[1], 1);
  // replay records a result but moves no adventure
  const before = R.copy(q.adventures);
  q = R.complete(q, win(2, "easy", 70), V.policy, "rp", 4, "replay");
  assert.deepEqual(q.adventures, before);
  assert(q.difficulties.easy.records["L1-2"]);
});

const v2 = () => ({
  schemaVersion: 1,
  progressVersion: 2,
  purpose: "trial",
  revision: 12,
  startedAt: 5,
  read: { prologue: true, "5-epilogue": true },
  reveal: { zero_slime: true },
  seen: { 1: true, 5: true },
  kills: { 1: 2, 5: 1 },
  notes: { 1: true, 5: true },
  newInfo: {},
  clearedFloors: { 1: true, 2: true, 3: true, 4: true, 5: true },
  history: { x: { difficulty: "normal", floor: 5, rank: "S", mode: "adventure", at: 9 } },
  fragment: true,
  reward: true,
  adventures: { normal: { difficulty: "normal", floor: 5, hp: 64, phase: "cleared", startedAt: 5 }, hard: { difficulty: "hard", floor: 3, hp: 30, phase: "ready", startedAt: 6 } },
  difficulties: { easy: { best: 0, hp: 100, records: {} }, normal: { best: 5, hp: 64, records: { 5: { rank: "S" } } }, hard: { best: 2, hp: 30, records: {} } },
  unknown: { keep: { deep: [1, 2, 3] } },
});

test("v2 -> v3: nothing is lost, the exact input is kept, new story ids are unread, the old adventures stay as they were", () => {
  const old = v2(),
    q = R.migrate(old);
  assert.equal(q.progressVersion, 3);
  assert.deepEqual(q.migrationBackup2, v2(), "exact input including unknown fields");
  assert.deepEqual(q.migration, { from: 2, to: 3 });
  assert.equal(q.revision, 12);
  assert.deepEqual(q.unknown, v2().unknown);
  for (const k of ["read", "reveal", "seen", "kills", "notes", "clearedFloors", "history", "adventures", "fragment", "reward"]) assert.deepEqual(q[k], v2()[k], k);
  assert.deepEqual(q.difficulties.normal.records, v2().difficulties.normal.records);
  assert.equal(q.difficulties.hard.best, 2);
  // the new scenes are unread (their ids are different), the old read flags remain
  assert.equal(q.read["AX1-L00-S1"], undefined);
  assert.equal(q.read.prologue, true);
  // no layer progress is invented
  assert.deepEqual(q.fragments, {});
  assert.deepEqual(old, v2(), "the input object is not modified");
  assert.deepEqual(R.migrate(q), q, "idempotent");
});

test("a layered adventure set-aside keeps the old chapter's adventure in legacyAdventures and the backup", () => {
  let q = R.migrate(v2());
  q = R.startAdventure(q, "normal", 77, 1);
  assert.deepEqual(q.legacyAdventures.normal, v2().adventures.normal);
  assert.deepEqual(q.adventures.hard, v2().adventures.hard, "other difficulties are untouched");
  assert.equal(q.adventures.normal.layer, 1);
  assert.equal(q.adventures.normal.floor, 1);
  assert.equal(q.adventures.normal.hp, 100);
  assert.deepEqual(q.migrationBackup2, v2());
  // starting the layered adventure again does not overwrite the set-aside old one with a layered one
  q = R.startAdventure(q, "normal", 78, 1);
  assert.deepEqual(q.legacyAdventures.normal, v2().adventures.normal);
});

test("v1 -> v3 keeps both backups; unknown future versions are refused untouched", () => {
  const v1 = { schemaVersion: 1, revision: 4, difficulties: { normal: { best: 2, hp: 80, records: { 1: { rank: "A" } } } }, weird: 1 };
  const q = R.migrate(v1);
  assert.deepEqual(q.migrationBackup, v1);
  assert.deepEqual(q.migrationBackup2, v1);
  assert.equal(q.progressVersion, 3);
  assert.equal(q.clearedFloors[2], true);
  assert.deepEqual(R.migrate(q), q);
  const future = { schemaVersion: 1, progressVersion: 4, revision: 3 };
  assert.throws(() => R.migrate(future), /新しい版/);
  assert.throws(() => R.migrate({ schemaVersion: 2, progressVersion: 3 }), /新しい版/);
  assert.deepEqual(future, { schemaVersion: 1, progressVersion: 4, revision: 3 });
});

test("Realtime Database drops empty objects: a stored v3 record reads back and migrates to itself", () => {
  let q = R.startAdventure(R.fresh(), "easy", 1, 1);
  q = R.complete(q, win(1, "easy"), V.policy, "a", 2);
  const strip = (x) => (x && typeof x === "object" ? Object.fromEntries(Object.entries(x).map(([k, v]) => [k, strip(v)]).filter(([, v]) => !(v && typeof v === "object" && !Object.keys(v).length))) : x);
  const stored = strip(q);
  assert.deepEqual(R.migrate(stored), R.migrate(R.migrate(stored)));
  assert.equal(R.migrate(stored).clearedFloors["L1-1"], true);
  assert.deepEqual(R.migrate(stored).fragments, {});
});

test("the format before this release (progressVersion 2 code, as published in 6.16) refuses a format 3 record instead of overwriting it", () => {
  const src = cp.execFileSync("git", ["show", "bbfa009:math-tower-core.js"], { encoding: "utf8" });
  const sandbox = { globalThis: {}, module: { exports: {} } };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(src, sandbox);
  const Old = sandbox.module.exports;
  assert.equal(typeof Old.migrate, "function");
  const stored = R.complete(R.startAdventure(R.fresh(), "easy", 1, 1), win(1, "easy"), V.policy, "a", 2);
  assert.throws(() => Old.migrate(stored), /新しい版/);
  assert.equal(Old.migrate(v2()).progressVersion, 2, "and it still reads its own format");
});
