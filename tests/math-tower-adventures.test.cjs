const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  R = require("../math-tower-core"),
  policy = require("../math-tower-policy.json");
const win = (f, d, hp = 83) => ({
  ...R.begin(f, d, hp, policy),
  won: true,
  correct: 8,
  damage: 9,
});
test("legacy migration retains all records, backup and independent difficulty checkpoints, idempotently", () => {
  const old = {
    schemaVersion: 1,
    purpose: "trial",
    revision: 7,
    startedAt: 123,
    difficulties: {
      easy: { best: 2, hp: 71, records: { 1: { rank: "S" } } },
      normal: { best: 1, hp: 92, records: {} },
      hard: { best: 0, hp: 100, records: {} },
    },
    read: { prologue: true },
    notes: { 1: true },
    history: { x: { difficulty: "normal", floor: 1 } },
    pendingStory: { floor: 1, difficulty: "normal" },
    unknown: { keep: 1 },
  };
  const q = R.migrate(old);
  assert.deepEqual(q.migrationBackup, old);
  assert.equal(q.revision, 7);
  assert.equal(q.adventures.easy.floor, 3);
  assert.equal(q.adventures.normal.phase, "post");
  assert.equal(q.adventures.hard, undefined);
  assert.equal(q.unknown.keep, 1);
  assert.deepEqual(R.migrate(q), q);
  assert.deepEqual(old.pendingStory, { floor: 1, difficulty: "normal" });
});
test("legacy one difficulty and provided per-difficulty adventure are not guessed or discarded", () => {
  const q = R.migrate({
    revision: 2,
    difficulties: {
      hard: {
        best: 1,
        hp: 86,
        records: {},
        adventure: { difficulty: "hard", floor: 2, hp: 86, phase: "battle" },
      },
    },
  });
  assert.equal(q.adventures.hard.floor, 2);
  assert.equal(q.adventures.easy, undefined);
  assert.equal(q.adventures.normal, undefined);
  const empty = R.migrate({
    startedAt: 123,
    difficulties: {
      easy: { best: 0, hp: 100 },
      normal: { best: 0, hp: 100 },
      hard: { best: 0, hp: 100 },
    },
  });
  assert.deepEqual(empty.adventures, {});
  assert.equal(empty.migrationBackup.startedAt, 123);
});
test("new adventure replaces only selected active progress, preserving history and permanent best", () => {
  let q = R.startAdventure(R.fresh(), "hard", 100);
  q = R.complete(q, win(1, "hard"), policy, "old", 100);
  q = R.finishStory(q, "hard");
  q = R.startAdventure(q, "easy", 200);
  const before = R.copy(q);
  q = R.startAdventure(q, "hard", 300);
  assert.deepEqual(q.adventures.easy, before.adventures.easy);
  assert.equal(q.adventures.hard.floor, 1);
  assert.equal(q.adventures.hard.hp, 100);
  assert.deepEqual(q.history, before.history);
  assert.deepEqual(
    q.difficulties.hard.records,
    before.difficulties.hard.records,
  );
  assert.deepEqual(q.clearedFloors, before.clearedFloors);
});
test("replay adds difficulty records but never touches any campaign HP/floor/checkpoint", () => {
  let q = R.startAdventure(R.fresh(), "normal", 100);
  q = R.complete(q, win(1, "normal"), policy, "a", 100);
  q = R.finishStory(q, "normal");
  q = R.startAdventure(q, "hard", 200);
  const before = R.copy(q);
  const n = R.complete(q, win(1, "easy", 68), policy, "replay", 300, "replay");
  assert.deepEqual(n.adventures, before.adventures);
  for (const d of Object.keys(R.CAPS))
    assert.equal(n.difficulties[d].hp, before.difficulties[d].hp);
  assert.equal(n.difficulties.easy.records[1].rank, "S");
  assert.equal(n.history.replay.mode, "replay");
  assert.deepEqual(
    R.complete(n, win(1, "easy"), policy, "replay", 301, "replay"),
    n,
  );
});
test("post-story, boss clear and defeat are independent resumable checkpoints", () => {
  let q = R.startAdventure(R.fresh(), "normal", 100);
  q = R.startAdventure(q, "easy", 100);
  q = R.complete(q, win(5, "normal", 60), policy, "boss", 100);
  assert.equal(q.adventures.normal.phase, "post");
  assert.equal(q.adventures.normal.hp, 100);
  q = R.finishStory(q, "normal");
  assert.equal(q.adventures.normal.phase, "cleared");
  assert.equal(q.adventures.easy.floor, 1);
  q = R.complete(
    q,
    { ...R.begin(1, "easy", 5, policy), hp: 0 },
    policy,
    "loss",
    100,
  );
  assert.equal(q.adventures.easy.phase, "defeated");
  assert.equal(q.adventures.normal.phase, "cleared");
});
test("explicit legacy adventure restore keeps post-migration permanent and other-difficulty data", () => {
  let q = R.migrate({
    schemaVersion: 1,
    revision: 8,
    difficulties: { normal: { best: 1, hp: 83, records: {} } },
  });
  q = R.startAdventure(q, "normal", 400);
  q = R.startAdventure(q, "hard", 500);
  q = R.complete(q, win(1, "hard"), policy, "new", 600);
  const before = R.copy(q);
  q = R.restoreAdventure(q, "normal");
  assert.equal(q.adventures.normal.floor, 2);
  assert.equal(q.adventures.normal.hp, 83);
  assert.deepEqual(q.adventures.hard, before.adventures.hard);
  assert.deepEqual(q.history, before.history);
  assert.deepEqual(q.difficulties, before.difficulties);
  assert.equal(q.revision, 8);
  assert.deepEqual(q.migrationBackup, before.migrationBackup);
});
test("a future save format is never silently downgraded or overwritten", () => {
  assert.throws(
    () => R.migrate({ schemaVersion: 1, progressVersion: 4, revision: 12 }),
    /新しい版/,
  );
  // Ver.6.17: progressVersion 3 is the current format.
  assert.equal(R.migrate({ schemaVersion: 1, progressVersion: 3, revision: 12 }).revision, 12);
});
test("approved battle and math-level rules remain structurally identical to production 9597af4", () => {
  const cp = require("node:child_process"),
    fs = require("node:fs"),
    Babel = require("@babel/standalone");
  const pick = (source) => {
    const ast = Babel.transform(source, { ast: true, code: false }).ast,
      result = {};
    const walk = (n) => {
      if (!n || typeof n !== "object") return;
      if (
        n.type === "FunctionDeclaration" &&
        [
          "validatePolicy",
          "begin",
          "nextLevel",
          "answer",
          "timeout",
          "result",
        ].includes(n.id.name)
      )
        result[n.id.name] = JSON.stringify(n, (k, v) =>
          [
            "loc",
            "start",
            "end",
            "extra",
            "leadingComments",
            "trailingComments",
            "innerComments",
          ].includes(k)
            ? undefined
            : v,
        );
      for (const v of Object.values(n))
        if (Array.isArray(v)) v.forEach(walk);
        else if (v && typeof v === "object") walk(v);
    };
    walk(ast);
    return result;
  };
  const before = cp.execFileSync(
    "git",
    ["show", "9597af4:math-tower-core.js"],
    { encoding: "utf8" },
  );
  // Ver.6.12: the floor count / boss floor come from the scenario. With the chapter-one values
  // (5 floors, boss on floor 5) the rules must be the approved ones: substitute 5 for the two
  // helpers and drop ONLY the exact optional floor-validation block, then compare everything else.
  const floorCheck = `    if (
      p.floorCount !== undefined &&
      (!Number.isInteger(p.floorCount) ||
        p.floorCount < 1 ||
        !Number.isInteger(p.bossFloor) ||
        p.bossFloor < 1 ||
        p.bossFloor > p.floorCount)
    )
      throw Error("Invalid floors");
`;
  const now = fs.readFileSync(require.resolve("../math-tower-core.js"), "utf8");
  assert.equal(now.split(floorCheck).length, 2, "floor validation block changed");
  const chapterOne = now
    .replace(floorCheck, "")
    .replace(/\b(?:lastFloor|bossFloor)\(p\)/g, "5");
  assert.equal(R.lastFloor(undefined), 5);
  assert.equal(R.bossFloor({}), 5);
  assert.deepEqual(pick(chapterOne), pick(before));
});
test("Firebase sparse numeric arrays keep actual ranks and remove only empty record slots", () => {
  const old = {
    schemaVersion: 1,
    revision: 9,
    difficulties: {
      normal: {
        best: 1,
        hp: 83,
        records: [null, { rank: "S", accuracy: 1, firstClearAt: 42 }],
      },
    },
  };
  const q = R.migrate(old);
  assert.deepEqual(q.difficulties.normal.records, {
    1: old.difficulties.normal.records[1],
  });
  assert.deepEqual(q.migrationBackup, old);
  assert.equal(q.clearedFloors[0], undefined);
  assert.equal(q.clearedFloors[1], true);
  assert.deepEqual(R.migrate(q), q);
});
test("Ver.6.12 floor layout comes from the scenario; chapter one stays 5 floors with the boss on 5", () => {
  const ch1 = require("../math-tower/chapter1.json"),
    L1 = R.layout(ch1);
  assert.equal(L1.floorCount, 5);
  assert.equal(L1.bossFloor, 5);
  assert.throws(() => R.begin(6, "easy", 100, L1), /Invalid battle/);
  // A hypothetical longer chapter (data only; no chapter two content exists).
  const floors = Object.fromEntries([1, 2, 3, 4, 5, 6, 7].map((f) => [f, "m" + f]));
  const L7 = R.layout({ ...ch1, floors });
  assert.equal(L7.floorCount, 7);
  assert.equal(L7.bossFloor, 7);
  assert.equal(R.begin(7, "easy", 100, L7).floor, 7);
  assert.throws(() => R.begin(8, "easy", 100, L7), /Invalid battle/);
  assert.equal(R.answer(R.begin(5, "easy", 100, L7), false, 0, L7).hp, 100 - L7.miss);
  assert.equal(R.answer(R.begin(7, "easy", 100, L7), false, 0, L7).hp, 100 - L7.miss * 2);
  assert.equal(R.answer(R.begin(5, "easy", 100, L1), false, 0, L1).hp, 100 - L1.miss * 2);
  const mid = R.layout({ ...ch1, floors, policy: { ...ch1.policy, bossFloor: 4 } });
  assert.equal(mid.bossFloor, 4);
  assert.throws(() => R.layout({ ...ch1, floors: { 1: "a", 3: "b" } }), /Invalid floors/);
  assert.throws(() => R.layout({ ...ch1, policy: { ...ch1.policy, bossFloor: 9 } }), /Invalid floors/);
  const p = { adventures: { easy: { difficulty: "easy", floor: 5, hp: 50, phase: "post" } } };
  assert.equal(R.finishStory(p, "easy", L1).adventures.easy.phase, "cleared");
  assert.equal(R.finishStory(p, "easy").adventures.easy.phase, "cleared");
  const q = R.finishStory(p, "easy", L7).adventures.easy;
  assert.deepEqual([q.phase, q.floor], ["ready", 6]);
});
