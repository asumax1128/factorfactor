// Ver.6.0 A9: total-games, A/B-wins and rating titles use proven Spark results as well; nothing already held can be lost.
const test = require("node:test"), assert = require("node:assert/strict"), fs = require("node:fs");
const { Keep, html, clone, world, acct, ids } = require("./a-batch-harness.cjs");
const SS = require("../src/spark-stats-next.cjs"), Queue = require("../src/streak-queue-next.cjs");
const T0 = 1_800_000_000_000;
const sp = (id, dt, o, extra = {}) => ({ id: "s-" + id, t: T0 + dt * 1000, o, s: "s", ...extra });
const has = (st, id) => ids(world(null).api, st).includes(id);

test("a Spark match is counted once: games, wins by method, giant-250 and the rating mirror; repeats add nothing", () => {
  const s = {};
  assert.equal(SS.apply(s, sp("a", 0, "w", { m: "A", g: 1, re: 1612, rn: 1500 })).recorded, true);
  assert.equal(s.sg, 1); assert.deepEqual({ ...s.sw }, { A: 1 }); assert.equal(s.giant250Wins, 1); assert.deepEqual({ ...s.sx }, { e: 1612, n: 1500 });
  assert.equal(SS.apply(s, sp("a", 0, "w", { m: "A", g: 1 })).status, "duplicate");
  assert.equal(s.sg, 1); assert.equal(s.sw.A, 1); assert.equal(s.giant250Wins, 1);
  SS.apply(s, sp("b", 60, "l", { m: "B", re: 1580 }));
  assert.equal(s.sg, 2); assert.deepEqual({ ...s.sw }, { A: 1 }); assert.equal(s.sx.e, 1612, "the mirrored rating is only ever raised");
  SS.apply(s, sp("c", 120, "d")); SS.apply(s, sp("d", 180, "w", { m: "C" }));
  assert.deepEqual({ ...s.sw }, { A: 1 }, "only methods A and B are counted");
});
test("a result too old to place is not counted (it cannot be proven new); invalid entries never write", () => {
  const s = {}; for (let i = 0; i < 70; i++) SS.apply(s, sp("m" + i, 1000 + i * 60, "w", { m: "B" }));
  const n = s.sg; assert.equal(SS.apply(s, sp("old", 0, "w", { m: "A" })).recorded, false);
  assert.equal(s.sg, n); assert.equal((s.sw || {}).A || 0, 0);
  const t = {}; for (const bad of [null, {}, { kind: "ratings" }, { kind: "ratings", id: "x" }, sp("z", 1, "x")]) assert.equal(SS.apply(t, bad).status, "invalid");
  assert.deepEqual(t, {});
  assert.equal(SS.apply({}, { kind: "ratings", id: "r", e: 1700 }).status, "applied");
});
test("total games = room games + Spark games + ghost games: 100 and 300", () => {
  assert.equal(has({ games: 99 }, "games100"), false);
  assert.equal(has({ games: 60, sg: 30, gg: 10 }, "games100"), true);
  assert.equal(has({ games: 250, sg: 40, gg: 9 }, "games300"), false);
  assert.equal(has({ games: 250, sg: 40, gg: 10 }, "games300"), true);
  assert.equal(has({ games: 300 }, "games300"), true, "an old holder keeps it (room games alone still count)");
  assert.equal(has({ games: 100, sg: "x", gg: null }, "games100"), true, "garbage in the new fields never removes a held title");
});
test("dual: method A and method B each need 10 wins, room wins and Spark wins add up", () => {
  assert.equal(has({ A: { w: 10 }, B: { w: 9 } }, "dual"), false);
  assert.equal(has({ A: { w: 10 }, B: { w: 4 }, sw: { B: 6 } }, "dual"), true);
  assert.equal(has({ A: { w: 3 }, B: { w: 3 }, sw: { A: 20 } }, "dual"), false, "wins of one method do not cover the other");
  assert.equal(has({ A: { w: 12 }, B: { w: 11 } }, "dual"), true, "old holder keeps it");
});
test("rating titles use the larger of the old rating and the Spark easy rating; normal is not used", () => {
  for (const [id, n] of [["rgold", 1580], ["master1600", 1600], ["master1700", 1700], ["rmaster", 1820], ["master1900", 1900]]) {
    assert.equal(has({ maxRating: n - 1 }, id), false, id);
    assert.equal(has({ maxRating: n }, id), true, id + " old rating");
    assert.equal(has({ maxRating: 1500, sx: { e: n } }, id), true, id + " Spark easy");
    assert.equal(has({ maxRating: 1500, sx: { e: 1400, n: n + 100 } }, id), false, id + " normal is undecided and not used");
  }
});
test("through the queue: ratings snapshot + match entries land in stats once; the same entries again change nothing", async () => {
  const store = { m: new Map(), getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }, setItem(k, v) { this.m.set(k, String(v)); }, removeItem(k) { this.m.delete(k); } };
  const db = { v: { games: 2 }, ref: () => ({ transaction: async (cb) => { const out = cb(clone(db.v)); db.v = clone(out); return { committed: true }; } }) };
  const q = Queue.create({ db, key: "aw", storage: store });
  q.enqueue({ kind: "ratings", id: "rt-aw", e: 1650, n: 1500 }); q.enqueue({ kind: "ratings", id: "rt-aw", e: 1700, n: 1500 });
  assert.equal(q.pending(), 1, "a newer snapshot replaces the waiting one");
  q.enqueue(sp("m1", 0, "w", { m: "B", re: 1710 })); await q.flush();
  assert.equal(db.v.sx.e, 1710); assert.equal(db.v.sg, 1); assert.equal(db.v.sw.B, 1);
  q.enqueue(sp("m1", 0, "w", { m: "B" })); await q.flush();
  assert.equal(db.v.sg, 1); assert.equal(db.v.sw.B, 1);
  assert.equal(has(db.v, "master1700"), true);
});
test("wiring: the Spark client queues mode / gap / ratings, mirrors ratings once per login and counts ghost matches under their receipt", () => {
  const src = fs.readFileSync("src/online-spark-client.cjs", "utf8");
  assert.match(src, /their\.before - mine\.before >= 250/);
  assert.match(src, /skQueue\.enqueue\(\{ kind: "ratings", id: `rt-\$\{key\}`/);
  assert.match(src, /s\.ghostAwards\[m\.id\] = \{ exp, at: m\.receipt\.at \};\n      if \(m\.opponent\.type !== "bot"\) s\.gg = \(s\.gg \|\| 0\) \+ 1;/);
  assert.match(src, /if \(s\.ghostAwards\[m\.id\]\) return s;\n      s\.ghostAwards\[m\.id\]/);
});
test("old holders: with tk nothing is removed because every new condition is a superset of the old one", () => {
  const old = { games: 320, A: { w: 15 }, B: { w: 14 }, maxRating: 1905, tk: { v: 1, at: 1 } };
  for (const id of ["games100", "games300", "dual", "rgold", "master1600", "master1700", "rmaster", "master1900"]) assert.equal(has(old, id), true, id);
  assert.match(html, /id: 'games100'[^\n]*\(st\.games \|\| 0\) \+ \(\+st\.sg \|\| 0\) \+ \(\+st\.gg \|\| 0\) >= 100/);
  const cat = JSON.parse(fs.readFileSync("src/title-catalog-next.json", "utf8")), list = Array.isArray(cat) ? cat : cat.titles;
  assert.equal(list.find((x) => x.id === "games300").condition, "通算300戦");
});
