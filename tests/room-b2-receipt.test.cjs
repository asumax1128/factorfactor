// Ver.6.2 hotfix: a late receipt (safe leave -> result confirmed later) through the REAL recordMatch.
const test = require("node:test"), assert = require("node:assert/strict");
const { html, clone, world, acct } = require("./a-batch-harness.cjs");
const Streak = require("../src/streak-next.cjs");
const T0 = 1_800_000_000_000, DAY = 86400000, jst = (t) => new Date(t + 9 * 3600e3).toISOString().slice(0, 10);
const room = (gid, o, t, extra = {}) => ({ id: gid, outcome: o, mode: "B", dr: 5, exp: 30, perfects: 0, vs: [], add: {}, max: {}, min: {}, or: {}, sk: { id: "r-ROOM-" + gid, t, o, s: "r" }, ...extra });
const mk = (init, now) => { const w = world(init, { globals: { B2_RCPT: { at: {}, failed: {} } } }); w.sandbox.window.StreakNext = Streak; w.sandbox.fbNow = () => now; return w; };

test("a late receipt uses the real match time for the streak ledger and never rewinds the day record", async () => {
  const now = T0 + 3 * DAY, matchAt = T0 + 1 * DAY, newerDay = jst(now);
  const w = mk({ games: 4, lastDay: newerDay, dayStreak: 7, maxDayStreak: 7, sk: { v: 1, n: 1, best: 1, n0: 0, l: { "r-NEW": { t: now - 1000, o: "w", s: "r" } } } }, now);
  w.sandbox.B2_RCPT.at.G1 = matchAt;
  const r = await w.api.recordMatch(acct, room("G1", "w", now));          // the caller still passes the receipt time; the receipt screen's time wins
  assert.equal(r.failed, undefined);
  assert.equal(w.db.value.sk.l["r-ROOM-G1"].t, matchAt, "ledger entry carries the match time");
  assert.equal(w.db.value.lastDay, newerDay, "the newer day is kept"); assert.equal(w.db.value.dayStreak, 7);
  assert.equal(w.db.value.sk.n, Streak.replay(0, Streak.ordered(w.db.value.sk.l)).n); assert.equal(w.db.value.sk.best, 1, "a late arrival never raises best");
  assert.equal(w.db.value.games, 5); await w.api.recordMatch(acct, room("G1", "w", now));
  assert.equal(w.db.value.games, 5, "reported again: counted once (roomSeen)");
});
test("without a receipt time (the normal flow) nothing changes: today's date and the current time are used", async () => {
  const now = T0 + 3 * DAY, w = mk({ games: 1, lastDay: jst(now - DAY), dayStreak: 2 }, now);
  await w.api.recordMatch(acct, room("G2", "w", now));
  assert.equal(w.db.value.lastDay, jst(now)); assert.equal(w.db.value.dayStreak, 3); assert.equal(w.db.value.sk.l["r-ROOM-G2"].t, now);
});
test("a failed save is flagged to the caller (and recorded for the receipt screen), a committed one is not", async () => {
  const now = T0, w = mk({ games: 1 }, now); w.sandbox.FB.db.ref = () => ({ transaction: async () => { throw new Error("NETWORK"); } });
  const r = await w.api.recordMatch(acct, room("G3", "w", now)); assert.equal(r.failed, true); assert.equal(w.sandbox.B2_RCPT.failed.G3, true);
  const w2 = mk({ games: 1 }, now); w2.sandbox.FB.db.ref = () => ({ transaction: async () => ({ committed: false }) });
  assert.equal((await w2.api.recordMatch(acct, room("G4", "w", now))).failed, true);
});
test("the receipt screen only trusts the match node: account, ids, match id and a sane match time", () => {
  assert.match(html, /v\.accounts\[FB\.uid\] !== acct\.key/); assert.match(html, /g\.id === e\.gid && gi\.includes\(FB\.uid\)/); assert.match(html, /g\.time >= \(g\.startAt \|\| 0\) && g\.time <= fbNow\(\) \+ 60000/);
  assert.match(html, /FB\.conn === false\) return;/, "no receipt query while offline");
});
