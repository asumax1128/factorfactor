const { test } = require("node:test"),
  assert = require("node:assert/strict");
const R = require("../math-tower-core"),
  p = require("../math-tower-policy.json");
test("all difficulties start at Lv1; wrong answers retain level; six-board is supplied by host", () => {
  for (const d of Object.keys(R.CAPS)) {
    let s = R.begin(1, d, 100, p);
    assert.equal(s.lv, 1);
    s = R.answer(s, true, 100, p);
    assert.equal(s.lv, 2);
    s = R.answer(s, false, 100, p);
    assert.equal(s.lv, 2);
    assert.equal(s.hp, 95);
  }
});
test("hard normal enemy cannot finish before a high-level correct answer", () => {
  let s = R.begin(1, "hard", 100, p);
  for (let i = 0; i < 7; i++) s = R.answer(s, true, 100, p);
  assert.equal(s.won, false);
  assert.equal(s.lv, 8);
  s = R.answer(s, true, 100, p);
  assert.equal(s.won, true);
});
test("combo multiplier and boss phase-compatible fields; boss wrong-answer counter", () => {
  let s = R.begin(5, "normal", 100, p);
  for (let i = 0; i < 4; i++) s = R.answer(s, true, 100, p);
  assert.equal(s.damage, 5.1);
  s = R.answer(s, false, 100, p);
  assert.equal(s.hp, 90);
  assert.equal(s.combo, 0);
});
test("timeout costs approved HP but retains problem level; terminal state cannot answer", () => {
  let s = R.begin(1, "easy", 10, p);
  s = R.timeout(s, p);
  assert.equal(s.hp, 0);
  assert.equal(s.lv, 1);
  assert.deepEqual(R.answer(s, true, 100, p), s);
});
test("chapter HP carries, no mob heal, boss heals, rewards are idempotent and trial-only", () => {
  let q = R.fresh();
  for (let f = 1; f <= 5; f++) {
    let s = R.begin(f, "easy", f === 1 ? 95 : q.difficulties.easy.hp, p);
    while (!s.won) s = R.answer(s, true, 100, p, () => 0);
    q = R.complete(q, s, p, "run" + f, 1000);
    assert.equal(q.difficulties.easy.hp, f === 5 ? 100 : 95);
    const again = R.complete(q, s, p, "run" + f, 1001);
    assert.deepEqual(again, q);
  }
  assert.equal(q.reward, true);
  assert.equal(q.history.run5.verified, false);
  assert.equal(q.pendingStory.floor, 5);
  assert.equal(q.difficulties.normal.best, 0);
});
test("invalid floors/difficulties/config reject; grades are accuracy-first", () => {
  assert.throws(() => R.begin(6, "easy", 100, p));
  assert.throws(() => R.begin(1, "bad", 100, p));
  assert.throws(() => R.validatePolicy({ ...p, ranks: [0.5, 0.8, 0.7] }));
  const s = { ...R.begin(1, "easy", 100, p), won: true, correct: 6, misses: 1 };
  assert.equal(R.result(s, p).rank, "A");
});
