// Ver.6.0 A9 + release adjustment: total games (every official mode except CPU practice), Spark wins / losses, JST play days;
// deferred titles (dual, dual50, the five rating titles) keep their holders and are no longer newly acquired.
const test = require("node:test"), assert = require("node:assert/strict"), fs = require("node:fs");
const { Keep, html, clone, world, acct, ids } = require("./a-batch-harness.cjs");
const SS = require("../src/spark-stats-next.cjs"), Queue = require("../src/streak-queue-next.cjs");
const T0 = Date.UTC(2026, 9, 26, 3, 0, 0); // 2026-10-26 12:00 JST
const sp = (id, dt, o, extra = {}) => ({ id: "s-" + id, t: T0 + dt * 1000, o, s: "s", ...extra });
const has = (st, id) => ids(world(null).api, st).includes(id);

test("a Spark match is counted once: games, wins, losses, wins by method, online, giant-250; repeats add nothing", () => {
  const s = {};
  assert.equal(SS.apply(s, sp("a", 0, "w", { m: "A", g: 1, h: 1 })).recorded, true);
  assert.equal(s.sg, 1); assert.equal(s.sWins, 1); assert.equal(s.sLoss, undefined); assert.deepEqual({ ...s.sw }, { A: 1 }); assert.equal(s.og, 1); assert.equal(s.giant250Wins, 1);
  assert.equal(SS.apply(s, sp("a", 0, "w", { m: "A", g: 1, h: 1 })).status, "duplicate");
  assert.equal(s.sg, 1); assert.equal(s.sWins, 1); assert.equal(s.og, 1);
  SS.apply(s, sp("b", 60, "l", { m: "B" })); SS.apply(s, sp("c", 120, "d")); SS.apply(s, sp("d", 180, "w", { m: "C" }));
  assert.equal(s.sg, 4); assert.equal(s.sWins, 2); assert.equal(s.sLoss, 1); assert.deepEqual({ ...s.sw }, { A: 1 }, "only methods A and B are counted by method");
});
test("a result too old for the streak ledger is still counted once in the totals (never counted as a streak); repeats and invalid entries change nothing", () => {
  const s = {}; for (let i = 0; i < 70; i++) SS.apply(s, sp("m" + i, 100000 + i * 60, "w", { m: "B" }));
  const n = s.sg, w = s.sWins, best = s.sk.best; assert.equal(SS.apply(s, { id: "s-old", t: 1000, o: "w", s: "s", m: "A", f: 1 }, { late: true }).recorded, false, "the ledger cannot place it");
  assert.equal(s.sg, n + 1, "but the verified result is counted"); assert.equal(s.sWins, w + 1); assert.equal(s.sk.best, best, "and it is never a streak");
  assert.equal(SS.apply(s, { id: "s-old", t: 1000, o: "w", s: "s", m: "A", f: 1 }, { late: true }).status, "duplicate"); assert.equal(s.sg, n + 1, "a replay does not count again");
  const t = {}; for (const bad of [null, {}, { kind: "ratings", id: "x", e: 1 }, sp("z", 1, "x")]) assert.equal(SS.apply(t, bad).status, "invalid");
  assert.deepEqual(t, {});
});
test("F1: the same receipt received again after 64+ other results is not counted twice (the totals do not rely on an unbounded id list)", () => {
  const s = {}; const first = sp("m0", 100000, "w", { m: "B", f: 1 });
  assert.equal(SS.apply(s, first).counted, true);
  for (let i = 1; i <= 70; i++) SS.apply(s, sp("m" + i, 100000 + i * 60, "w", { m: "B", f: 1 }));
  assert.equal(s.sg, 71); assert.equal(s.ml.e["s-m0"], undefined, "forgotten by the match log");
  assert.equal(s.sk.l["s-m0"], undefined, "and by the streak ledger");
  const again = SS.apply(s, { ...first, f: undefined });             // rebuilt from the receipt: the profile side was not saved just now
  assert.deepEqual({ status: again.status, recorded: again.recorded, counted: again.counted }, { status: "unverifiable", recorded: false, counted: false });
  assert.equal(s.sg, 71); assert.equal(s.sWins, 71);
  const r = SS.apply(s, sp("m71", 100000 + 71 * 60, "l", { m: "B" })); assert.equal(r.counted, true, "a NEW result is still counted while the ledger can prove it is new");
  assert.equal(SS.apply(s, sp("m71", 100000 + 71 * 60, "l", { m: "B" })).status, "duplicate");
});
test("return values are consistent: counted vs recorded (unplaced results are counted but not recorded)", () => {
  const s = {}; for (let i = 0; i < 70; i++) SS.apply(s, sp("m" + i, 100000 + i * 60, "w"));
  const r = SS.apply(s, { id: "s-old", t: 1000, o: "w", s: "s", f: 1 }); assert.deepEqual({ status: r.status, recorded: r.recorded, counted: r.counted }, { status: "unplaced", recorded: false, counted: true });
});
test("first win and 50 losses include the official Spark wins and losses (and still the old room records)", () => {
  assert.equal(has({}, "first"), false); assert.equal(has({ w: 1 }, "first"), true); assert.equal(has({ sWins: 1 }, "first"), true);
  assert.equal(has({ l: 49 }, "lose50"), false); assert.equal(has({ l: 30, sLoss: 20 }, "lose50"), true); assert.equal(has({ l: 50 }, "lose50"), true);
  assert.equal(has({ sWins: "x", w: 1 }, "first"), true, "garbage never removes a held title");
});
test("total games: room games + Spark + ghost + solo + completed weekly sorties; CPU practice is not part of any counter", () => {
  assert.equal(has({ games: 99 }, "games100"), false);
  assert.equal(has({ games: 40, sg: 20, gg: 10, soloPlays: 20, wk: { runs: 10 } }, "games100"), true);
  assert.equal(has({ games: 40, sg: 20, gg: 10, soloPlays: 20, wk: { runs: 9 } }, "games100"), false);
  assert.equal(has({ games: 250, sg: 20, gg: 10, soloPlays: 10, wk: { runs: 9 } }, "games300"), false);
  assert.equal(has({ games: 250, sg: 20, gg: 10, soloPlays: 10, wk: { runs: 10 } }, "games300"), true);
  assert.equal(has({ games: 300 }, "games300"), true, "an old holder keeps it (room games still count)");
  assert.equal(has({ games: 100, sg: "x", gg: null, soloPlays: {}, wk: { runs: "y" } }, "games100"), true, "garbage in the new fields never removes a held title");
});
test("every counted mode writes exactly once per completed play (source audit)", () => {
  assert.match(html, /if \(nextScreen === 'gameover'\) statsTx\(acct, s => \{ s\.soloPlays = \(s\.soloPlays \|\| 0\) \+ 1; \}\);/);
  assert.match(html, /if\(submit\)\{statsTx\(acct,s=>\{s\.soloPlays=\(s\.soloPlays\|\|0\)\+1;\}\);/);
  assert.equal((html.match(/s\.soloPlays = \(s\.soloPlays \|\| 0\) \+ 1/g) || []).length, 1, "quitting ('menu') is not a completed play");
  assert.match(html, /if \(a2Completed\) W\.runs = \(W\.runs \|\| 0\) \+ 1;/);
  const src = fs.readFileSync("src/online-spark-client.cjs", "utf8");
  assert.match(src, /s\.ghostAwards\[m\.id\] = \{ exp, at: m\.receipt\.at \};\n      if \(m\.opponent\.type !== "bot"\) s\.gg = \(s\.gg \|\| 0\) \+ 1;/);
  assert.match(src, /if \(s\.ghostAwards\[m\.id\]\) return s;\n      s\.ghostAwards\[m\.id\]/);
  assert.match(src, /const countsForStreak = !m\.opponent \|\| \(m\.opponent\.type === "bot" && m\.opponent\.key !== key\);/);
});
const DEFERRED = ["dual", "dual50", "rgold", "master1600", "master1700", "rmaster", "master1900"];
test("deferred titles: held through tk (or the old condition while tk is missing), never newly acquired from the old counters", () => {
  const strong = { A: { w: 80 }, B: { w: 80 }, maxRating: 1950 };
  for (const id of DEFERRED) assert.equal(has({ ...strong, tk: { v: 1, at: 1 } }, id), false, id + ": a strong player with tk and no held record gets nothing new");
  assert.equal(has({ A: { w: 10 }, B: { w: 10 }, tk: { v: 1, at: 1, ids: { dual: 1 } } }, "dual"), true);
  for (const [id, n] of [["rgold", 1580], ["master1600", 1600], ["master1700", 1700], ["rmaster", 1820], ["master1900", 1900]]) {
    assert.equal(has({ maxRating: n, tk: { v: 1, at: 1, ids: { [id]: 1 } } }, id), true, id + " held");
    assert.equal(has({ maxRating: n - 1 }, id), false); assert.equal(has({ maxRating: n }, id), true, id + " old holder without tk");
    assert.equal(has({ maxRating: 1500, sx: { e: n } }, id), false, id + ": the Spark easy rating no longer grants");
  }
  assert.equal(has({ A: { w: 500 }, B: { w: 500 }, sw: { A: 500, B: 500 } }, "dual50"), false, "二刀皆伝 is never newly acquired");
  assert.equal(world(null).api.BADGES.some((b) => b.id === "tour_streak2"), false, "王者防衛 is not implemented / not acquirable");
});
test("deferred titles on the real write path: the first 6.0 write freezes the holders; later play adds nothing; equipment is kept", async () => {
  const holder = world({ games: 40, A: { w: 12 }, B: { w: 11 }, maxRating: 1660, nick: "master1600" });
  await holder.api.recordMatch(acct, { outcome: "w", mode: "B", dr: 8, exp: 30, perfects: 0, vs: [], add: {}, max: {}, min: {}, or: {} });
  assert.deepEqual(["dual", "rgold", "master1600"].filter((id) => holder.db.value.tk.ids[id]), ["dual", "rgold", "master1600"]);
  for (const id of ["dual", "rgold", "master1600"]) assert(ids(holder.api, holder.db.value).includes(id), id);
  assert.equal(holder.db.value.nick, "master1600"); assert.equal(holder.db.value.maxRating, 1660);
  const rising = world({ games: 40, A: { w: 3 }, B: { w: 3 }, maxRating: 1500 });
  await rising.api.recordMatch(acct, { outcome: "w", mode: "B", dr: 8, exp: 30, perfects: 0, vs: [], add: {}, max: {}, min: {}, or: {} });
  rising.db.value.A.w = 40; rising.db.value.B.w = 40; rising.db.value.maxRating = 1950; // grows afterwards
  for (const id of DEFERRED) assert.equal(ids(rising.api, rising.db.value).includes(id), false, id);
  for (const keep of [null, {}]) { const f = world({ A: { w: 12 }, B: { w: 12 }, maxRating: 1700 }, { keep }); for (const id of ["dual", "master1700"]) assert(ids(f.api, f.db.value).includes(id), id + " (no protection module: old condition)"); }
});
test("play days are counted in JST: Spark and room, the old 'Y-M-D' record is the same day, a late arrival never rewinds", () => {
  const s = { lastDay: "2026-10-25", dayStreak: 6, maxDayStreak: 6 };               // an old device-date record (not zero-padded for months < 10)
  SS.apply(s, { id: "s-a", t: Date.UTC(2026, 9, 26, 14, 59, 0), o: "w", s: "s" });    // 2026-10-26 23:59 JST
  assert.deepEqual([s.lastDay, s.dayStreak, s.maxDayStreak], ["2026-10-26", 7, 7]);
  SS.apply(s, { id: "s-b", t: Date.UTC(2026, 9, 26, 15, 1, 0), o: "w", s: "s" });     // 2026-10-27 00:01 JST: the next JST day
  assert.deepEqual([s.lastDay, s.dayStreak], ["2026-10-27", 8]);
  SS.apply(s, { id: "s-c", t: Date.UTC(2026, 9, 26, 5, 0, 0), o: "w", s: "s" });      // a late result of an earlier day
  assert.deepEqual([s.lastDay, s.dayStreak, s.maxDayStreak], ["2026-10-27", 8, 8]);
  const gap = { lastDay: "2026-10-20", dayStreak: 9, maxDayStreak: 9 }; SS.apply(gap, { id: "s-d", t: T0, o: "l", s: "s" });
  assert.deepEqual([gap.dayStreak, gap.maxDayStreak], [1, 9], "a gap restarts the run; the best is kept");
  assert.equal(SS.canon("2026-3-5"), "2026-03-05");
  assert.equal(has({ maxDayStreak: 7 }, "daily7"), true); assert.equal(has({ maxDayStreak: 6 }, "daily7"), false);
});
test("the room record counts JST days too (the old 'Y-M-D' string is not a different day)", async () => {
  const mk = (t, last) => { const w = world({ games: 3, lastDay: last, dayStreak: 4, maxDayStreak: 4 }); w.sandbox.fbNow = () => t; return w; };
  const info = { outcome: "w", mode: "B", dr: 1, exp: 1, perfects: 0, vs: [], add: {}, max: {}, min: {}, or: {} };
  const a = mk(Date.UTC(2026, 9, 26, 14, 59, 0), "2026-10-25"); await a.api.recordMatch(acct, info);
  assert.deepEqual([a.db.value.lastDay, a.db.value.dayStreak, a.db.value.maxDayStreak], ["2026-10-26", 5, 5]);
  const b = mk(Date.UTC(2026, 9, 26, 15, 1, 0), "2026-10-26"); await b.api.recordMatch(acct, info);
  assert.deepEqual([b.db.value.lastDay, b.db.value.dayStreak], ["2026-10-27", 5], "JST midnight starts a new day");
  const c = mk(Date.UTC(2026, 9, 26, 15, 1, 0), "2026-10-26"); c.db.value.lastDay = "2026-10-27"; await c.api.recordMatch(acct, info);
  assert.equal(c.db.value.dayStreak, 4, "the same JST day twice counts once");
});
test("through the queue: Spark entries land once; the same entries again change nothing", async () => {
  const store = { m: new Map(), getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }, setItem(k, v) { this.m.set(k, String(v)); }, removeItem(k) { this.m.delete(k); } };
  const db = { v: { games: 2 }, ref: () => ({ transaction: async (cb) => { const out = cb(clone(db.v)); db.v = clone(out); return { committed: true }; } }) };
  const q = Queue.create({ db, key: "aw", storage: store });
  q.enqueue(sp("m1", 0, "w", { m: "B", h: 1 })); q.enqueue(sp("m2", 60, "l", { m: "A", h: 1 })); await q.flush();
  assert.equal(db.v.sg, 2); assert.equal(db.v.sWins, 1); assert.equal(db.v.sLoss, 1); assert.equal(db.v.sw.B, 1); assert.equal(db.v.og, 2);
  q.enqueue(sp("m1", 0, "w", { m: "B" })); await q.flush();
  assert.equal(db.v.sg, 2); assert.equal(db.v.sWins, 1);
});
test("old holders: nothing is removed by any of these changes", () => {
  const old = { games: 320, w: 5, l: 60, A: { w: 15 }, B: { w: 14 }, maxRating: 1905, maxDayStreak: 30, tk: { v: 1, at: 1, ids: { dual: 1, rgold: 1, master1600: 1, master1700: 1, rmaster: 1, master1900: 1 } } };
  for (const id of ["games100", "games300", "first", "lose50", "daily7", "daily30", ...DEFERRED.filter((x) => x !== "dual50")]) assert.equal(has(old, id), true, id);
  const cat = JSON.parse(fs.readFileSync("src/title-catalog-next.json", "utf8")), list = Array.isArray(cat) ? cat : cat.titles;
  assert.equal(list.find((x) => x.id === "games300").condition, "通算300戦");
  assert.equal(Keep.KEEP_IDS.includes("dual"), true);
});
