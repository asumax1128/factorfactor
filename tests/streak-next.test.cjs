// Ver.6.0 A7: the official win-streak ledger (pure logic): order, duplicates, late results, restarts, trimming.
const test = require("node:test"), assert = require("node:assert/strict");
const S = require("../src/streak-next.cjs");
const T0 = 1_800_000_000_000;
const mk = () => ({});
const add = (s, id, dt, o, src = "r") => S.applyResult(s, { id, t: T0 + dt * 1000, o, s: src });
const run = (s, outcomes, start = 0, src = "r") => outcomes.forEach((o, i) => add(s, "m" + (start + i), (start + i) * 60, o, src));

test("10 wins in a row -> best 10 on the 10th; a loss or a draw ends the run", () => {
  const s = mk(); run(s, Array(9).fill("w"));
  assert.equal(s.sk.best, 9);
  add(s, "m9", 9 * 60, "w"); assert.equal(s.sk.best, 10); assert.equal(s.sk.n, 10);
  add(s, "m10", 600, "d"); assert.equal(s.sk.n, 0); assert.equal(s.sk.best, 10);
  run(s, ["w", "w"], 11); add(s, "L", 2000, "l"); assert.equal(s.sk.n, 0);
});
test("30 and 50 are reached through the trimmed ledger (n0 carries the run)", () => {
  const s = mk(); run(s, Array(49).fill("w"));
  assert.equal(s.sk.best, 49); assert.equal(Object.keys(s.sk.l).length, S.LEDGER_MAX > 49 ? 49 : S.LEDGER_MAX);
  add(s, "m49", 49 * 60, "w"); assert.equal(s.sk.best, 50);
  run(s, Array(40).fill("w"), 50); assert.equal(s.sk.n, 90); assert.equal(Object.keys(s.sk.l).length, S.LEDGER_MAX); assert.equal(s.sk.n0, 90 - S.LEDGER_MAX);
});
test("the same match id twice (retry, two devices, room + queue) counts once", () => {
  const s = mk(); run(s, ["w", "w", "w"]);
  assert.equal(add(s, "m1", 60, "w").status, "duplicate");
  assert.equal(s.sk.n, 3);
  assert.equal(add(s, "m1", 60, "l").status, "duplicate", "a different outcome for a known id is ignored too");
  assert.equal(s.sk.n, 3);
});
test("a late result is placed by time and the run is recomputed (not appended)", () => {
  const s = mk(); run(s, ["w", "w", "l", "w", "w"]); // n = 2
  assert.equal(s.sk.n, 2);
  add(s, "late", 150, "w"); // between m2(l)@120 and m3(w)@180 -> w w l w w w
  assert.equal(s.sk.n, 3);
  const t = mk(); run(t, ["w", "w", "w", "w"]);
  add(t, "lateLoss", 90, "l"); // between m1 and m2 -> w w l w w
  assert.equal(t.sk.n, 2);
});
test("room and Spark within 5 s with different outcomes: order is unknown -> the run restarts", () => {
  const s = mk(); run(s, ["w", "w", "w", "w", "w"]);
  const r = add(s, "sp1", 4 * 60 + 3, "l", "s"); // 3 s after the room win m4
  assert.equal(r.status, "restart"); assert.equal(s.sk.n, 0); assert.equal(s.sk.best, 5, "best never goes down");
  add(s, "next", 600, "w"); assert.equal(s.sk.n, 1);
});
test("room and Spark within 5 s with the SAME outcome keep counting; exactly 6 s apart is ordered", () => {
  const s = mk(); run(s, ["w", "w"]);
  assert.equal(add(s, "sp", 60 + 2, "w", "s").status, "applied"); assert.equal(s.sk.n, 3);
  const u = mk(); run(u, ["w", "w", "w"]);
  assert.equal(add(u, "sp", 2 * 60 + 6, "l", "s").status, "applied"); assert.equal(u.sk.n, 0); assert.equal(u.sk.best, 3);
  const v = mk(); run(v, ["w", "w"]);
  add(v, "same", 60 + 2, "l", "r"); // same source within 5 s: ordered by time, no restart
  assert.equal(v.sk.n, 0);
});
test("a result older than a full ledger cannot be placed: restart, not recorded; best unchanged", () => {
  const s = mk(); run(s, Array(70).fill("w"), 100);
  const before = s.sk.best;
  const r = S.applyResult(s, { id: "ancient", t: 1000, o: "w", s: "r" });
  assert.equal(r.status, "restart"); assert.equal(s.sk.n, 0); assert.equal(s.sk.best, before); assert.equal(s.sk.l.ancient, undefined);
});
test("invalid entries and a broken ledger never throw; a broken ledger restarts but keeps the readable best", () => {
  const s = mk();
  for (const bad of [null, {}, { id: "", t: 1, o: "w", s: "r" }, { id: "x", t: -1, o: "w", s: "r" }, { id: "x", t: 5, o: "x", s: "r" }, { id: "x", t: 5, o: "w", s: "z" }, { id: "x", t: NaN, o: "w", s: "r" }])
    assert.equal(S.applyResult(s, bad).status, "invalid");
  assert.equal(s.sk, undefined);
  const b = { sk: { v: 1, n: 9, best: 12, n0: 0, l: { a: "junk" } } };
  assert.equal(S.applyResult(b, { id: "z", t: T0, o: "w", s: "r" }).status, "applied");
  assert.equal(b.sk.n, 1); assert.equal(b.sk.best, 12);
  assert.equal(S.applyResult(null, { id: "z", t: T0, o: "w", s: "r" }).status, "invalid");
});
test("ids with RTDB-unsafe characters are stored under a safe key and still deduplicate", () => {
  const s = mk();
  S.applyResult(s, { id: "r-AB12.x/y#1", t: T0, o: "w", s: "r" });
  assert.deepEqual(Object.keys(s.sk.l), ["r-AB12_x_y_1"]);
  assert.equal(S.applyResult(s, { id: "r-AB12.x/y#1", t: T0, o: "w", s: "r" }).status, "duplicate");
});
test("applying the same results in a different arrival order gives the same run (order-independence by time)", () => {
  const items = [["a", 0, "w"], ["b", 60, "w"], ["c", 120, "l"], ["d", 180, "w"], ["e", 240, "w"], ["f", 300, "w"]];
  const x = mk(); items.forEach(([id, t, o]) => add(x, id, t, o));
  const y = mk(); [items[4], items[1], items[5], items[0], items[3], items[2]].forEach(([id, t, o]) => add(y, id, t, o));
  assert.equal(y.sk.n, x.sk.n); assert.equal(y.sk.best, x.sk.best);
});
