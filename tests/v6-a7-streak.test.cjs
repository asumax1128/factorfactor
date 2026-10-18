// Ver.6.0 A7: streak10/30/50 through the REAL BADGES / recordMatch, plus the Spark hand-over queue.
const test = require("node:test"), assert = require("node:assert/strict"), fs = require("node:fs");
const { Keep, html, clone, world, acct, ids } = require("./a-batch-harness.cjs");
const Streak = require("../src/streak-next.cjs"), Queue = require("../src/streak-queue-next.cjs");
const T0 = 1_800_000_000_000;
const room = (n, o, extra = {}) => ({ outcome: o, mode: "B", dr: 5, exp: 30, perfects: 0, vs: [], add: {}, max: {}, min: {}, or: {}, sk: { id: "r-ROOM-" + n, t: T0 + n * 60000, o, s: "r" }, ...extra });
function mk(init, o = {}) { const w = world(init, o); w.sandbox.window.StreakNext = Streak; return w; }
const has = (w, id) => ids(w.api, w.db.value).includes(id);

test("10 room wins in a row grant streak10 on the 10th win, announced once; the legacy counters still move", async () => {
  const w = mk({ games: 1 });
  for (let i = 0; i < 9; i++) { const r = await w.api.recordMatch(acct, room(i, "w")); assert.equal(r.badges.some((b) => b.id === "streak10"), false); }
  assert.equal(has(w, "streak10"), false);
  const r = await w.api.recordMatch(acct, room(9, "w"));
  assert.equal(r.badges.some((b) => b.id === "streak10"), true);
  assert.equal(r.badges.find((b) => b.id === "streak10").label, "破竹の剣");
  assert.equal(w.db.value.sk.best, 10);
  assert.equal(w.db.value.maxStreak, 10, "legacy maxStreak unchanged in meaning");
  const r2 = await w.api.recordMatch(acct, room(10, "w"));
  assert.equal(r2.badges.some((b) => b.id === "streak10"), false);
});
test("a draw ends the official run (the legacy counter does not)", async () => {
  const w = mk({ games: 1 });
  for (let i = 0; i < 6; i++) await w.api.recordMatch(acct, room(i, "w"));
  await w.api.recordMatch(acct, room(6, "d"));
  assert.equal(w.db.value.sk.n, 0); assert.equal(w.db.value.streak, 6, "legacy streak is not reset by a draw (unchanged)");
  for (let i = 7; i < 16; i++) await w.api.recordMatch(acct, room(i, "w"));
  assert.equal(has(w, "streak10"), false, "6 + draw + 9 is not 10 in a row");
});
test("ghost matches and entries without a ledger record do not count", async () => {
  const w = mk({ games: 1 });
  for (let i = 0; i < 12; i++) await w.api.recordMatch(acct, room(i, "w", { sk: undefined }));
  assert.equal(w.db.value.sk, undefined);
  assert.equal(has(w, "streak10"), false);
  assert.match(html, /\.\.\.\(state\.ghostKey \? \{\} : \{ sk: \{ id: `r-\$\{code\}-\$\{gid\}`, t: fbNow\(\), o: outcome, s: 'r' \} \}\)/);
});
test("the same room result reported twice counts once (b2 roomSeen and the ledger)", async () => {
  const w = mk({ games: 1 });
  await w.api.recordMatch(acct, room(1, "w")); await w.api.recordMatch(acct, room(1, "w"));
  assert.equal(w.db.value.sk.n, 1); assert.equal(Object.keys(w.db.value.sk.l).length, 1);
  const g = world({ games: 1 }); g.sandbox.window.StreakNext = Streak;
  await g.api.recordMatch(acct, room(2, "w", { id: "g2" })); await g.api.recordMatch(acct, room(2, "w", { id: "g2" }));
  assert.equal(g.db.value.sk.n, 1); assert.equal(g.db.value.games, 2);
});
test("old holders keep streak10/30/50 with tk, without tk and after the first write; new rule needs the official run", async () => {
  const w = mk({ maxStreak: 52, games: 90, nick: "streak50" });
  for (const id of ["streak10", "streak30", "streak50"]) assert.equal(ids(w.api, { maxStreak: 52 }).includes(id), true, id + " legacy (no tk)");
  await w.api.recordMatch(acct, room(1, "l", {}));
  assert.deepEqual(Object.keys(w.db.value.tk.ids).sort(), ["streak10", "streak30", "streak50"]);
  for (const id of ["streak10", "streak30", "streak50"]) assert.equal(has(w, id), true);
  assert.equal(w.db.value.nick, "streak50"); assert.equal(w.db.value.maxStreak, 52);
  const m = mk(null);
  assert.equal(ids(m.api, { maxStreak: 52, tk: { v: 1, at: 1 } }).includes("streak10"), false, "with tk a later legacy streak does not grant");
  assert.equal(ids(m.api, { sk: { v: 1, n: 0, best: 30, n0: 0, l: {} }, tk: { v: 1, at: 1 } }).includes("streak30"), true);
});
test("freeze failure keeps held titles and never stops the match record", async () => {
  for (const keep of [null, {}, { ensureKeep() { throw new Error("x"); }, isFrozen: () => false, keptIds: () => [] }]) {
    const w = mk({ maxStreak: 12, games: 5 }, { keep });
    await w.api.recordMatch(acct, room(1, "w"));
    assert.equal(has(w, "streak10"), true); assert.equal(w.db.value.games, 6);
  }
});
test("a missing StreakNext module never breaks the match record", async () => {
  const w = world({ games: 1 });
  await w.api.recordMatch(acct, room(1, "w"));
  assert.equal(w.db.value.sk, undefined); assert.equal(w.db.value.games, 2);
});
test("official run, other titles and equipment: nothing else changes", async () => {
  const start = { games: 12, w: 7, maxStreak: 3, streak: 1, exp: 90, nick: "streak10", vs: { a: { w: 1 } } };
  const w = mk(clone(start));
  await w.api.recordMatch(acct, room(1, "w"));
  assert.equal(w.db.value.nick, "streak10"); assert.equal(w.db.value.vs.a.w, 1);
  assert.equal(w.db.value.maxStreak, 3, "legacy maxStreak keeps its own meaning (5.25 counting)");
});

// ---- Spark hand-over queue ----
class Store { constructor() { this.m = new Map(); } getItem(k) { return this.m.has(k) ? this.m.get(k) : null; } setItem(k, v) { this.m.set(k, String(v)); } removeItem(k) { this.m.delete(k); } }
function fakeDb(initial, { failTimes = 0, uncommitted = 0 } = {}) {
  const st = { value: initial, fail: failTimes, unc: uncommitted, calls: 0 };
  return { st, ref: () => ({ transaction: async (cb) => {
    st.calls++;
    if (st.fail > 0) { st.fail--; throw new Error("network"); }
    if (st.unc > 0) { st.unc--; return { committed: false }; }
    const out = cb(st.value === null ? null : clone(st.value)); st.value = clone(out); return { committed: true };
  } }) };
}
const sp = (id, dt, o) => ({ id: "s-" + id, t: T0 + dt * 1000, o, s: "s" });
test("queue: a result is written, removed after the commit, and counted once", async () => {
  const store = new Store(), db = fakeDb({ games: 1 }), q = Queue.create({ db, key: "aw", storage: store });
  assert.equal(q.enqueue(sp("m1", 0, "w")), true); assert.equal(q.pending(), 1);
  await q.flush();
  assert.equal(q.pending(), 0); assert.equal(db.st.value.sk.n, 1); assert.ok(db.st.value.tk);
  q.enqueue(sp("m1", 0, "w")); await q.flush();
  assert.equal(db.st.value.sk.n, 1, "re-sent id is ignored by the ledger");
});
test("queue: a failed or uncommitted write is kept and retried; nothing is lost or doubled", async () => {
  const store = new Store(), db = fakeDb({ games: 1 }, { failTimes: 1, uncommitted: 1 }), q = Queue.create({ db, key: "aw", storage: store });
  q.enqueue(sp("a", 0, "w")); q.enqueue(sp("b", 60, "w"));
  assert.equal((await q.flush()).left, 2); assert.equal(q.pending(), 2);
  assert.equal((await q.flush()).left, 2); assert.equal(q.pending(), 2);
  assert.equal((await q.flush()).left, 0);
  assert.equal(db.st.value.sk.n, 2);
  const again = Queue.create({ db, key: "aw", storage: store }); await again.flush();
  assert.equal(db.st.value.sk.n, 2);
});
test("queue: survives a reload (localStorage), drops garbage, never writes when storage is unusable", async () => {
  const store = new Store(); store.setItem("fxf_sk_queue_v1:aw", "not json");
  const db = fakeDb({ games: 1 }), q = Queue.create({ db, key: "aw", storage: store });
  assert.equal(q.pending(), 0); assert.equal(q.enqueue({ id: "x" }), false);
  const q0 = Queue.create({ db, key: "aw", storage: null }); q0.enqueue(sp("z", 0, "w")); await q0.flush(); assert.equal(db.st.calls, 0);
  const a = Queue.create({ db, key: "aw", storage: store }); a.enqueue(sp("p", 0, "w"));
  const b = Queue.create({ db, key: "aw", storage: store }); assert.equal(b.pending(), 1);
  await Promise.all([a.flush(), b.flush()]);
  assert.equal(db.st.value.sk.n, 1);
});
test("room + Spark within 5 s with different outcomes restarts the run (through the real recordMatch and the queue)", async () => {
  const w = mk({ games: 1 });
  for (let i = 0; i < 5; i++) await w.api.recordMatch(acct, room(i, "w"));
  const store = new Store(), q = Queue.create({ db: { ref: () => ({ transaction: async (cb) => { const out = cb(clone(w.db.value)); w.db.value = clone(out); return { committed: true }; } }) }, key: "aw", storage: store });
  q.enqueue({ id: "s-x", t: T0 + 4 * 60000 + 2000, o: "l", s: "s" }); await q.flush();
  assert.equal(w.db.value.sk.n, 0); assert.equal(w.db.value.sk.best, 5);
});
test("catalog names match", () => {
  const cat = JSON.parse(fs.readFileSync("src/title-catalog-next.json", "utf8")), list = Array.isArray(cat) ? cat : cat.titles;
  for (const [id, name, cond] of [["streak10", "破竹の剣", "10連勝"], ["streak30", "常勝不敗", "30連勝"], ["streak50", "天下無双", "50連勝"]]) {
    const t = list.find((x) => x.id === id); assert.equal(t.name, name); assert.equal(t.condition, cond);
  }
  for (const id of ["streak10", "streak30", "streak50"]) assert.equal(Keep.LEGACY_TESTS[id]({ maxStreak: 99 }), true);
});
test("Spark client wiring: only a freshly processed, non-ghost settled match is queued; flush on start and after apply", () => {
  const src = fs.readFileSync("src/online-spark-client.cjs", "utf8");
  assert.match(src, /const countsForStreak = !m\.opponent \|\| \(m\.opponent\.type === "bot" && m\.opponent\.key !== key\);\n    if \(fresh && countsForStreak\)/);
  assert.match(src, /skEnqueue\(\{\n\s+id: `s-\$\{m\.id\}`, t: m\.receipt\.at, o, s: "s",/);
  assert.match(src, /skFlush\(\)\.catch\(\(\) => \{\}\);\n    if \(ensured && ownProfile\)/);
  assert.match(src, /queueStorage = typeof localStorage/);
  assert.equal(fs.readFileSync("src/next-home-ui.jsx", "utf8").includes("window.StreakNext=require('./streak-next.cjs')"), true);
});
