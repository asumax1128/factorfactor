// Ver.6.0 A1: the REAL statsTx / recordMatch from index.html create tk/tv2 before any counter changes, never change
// which titles are earned or revealed, and fall back silently when the keep module is unavailable.
const test = require("node:test"), assert = require("node:assert/strict"), fs = require("node:fs"), vm = require("node:vm");
const Keep = require("../src/title-keep-next.cjs"), Labels = require("../src/title-labels-next.cjs");
const html = fs.readFileSync("index.html", "utf8");
const cut = (a, b) => { const i = html.indexOf(a), j = html.indexOf(b, i); assert(i >= 0 && j > i, a); return html.slice(i, j); };
const clone = (x) => JSON.parse(JSON.stringify(x));
const badges = cut("const BADGES = [", "function AchievementAuditPanel");
const stats = cut("async function statsTx(acct, fn)", "const wkOf = s =>");
const record = cut("async function recordMatch(acct, info)", "/* ---------- 効果音");

function world(initial, { withKeep = true, keep = Keep } = {}) {
  const db = { value: initial, writes: 0 };
  const shown = [];
  const sandbox = {
    window: withKeep ? { TitleKeepNext: keep } : {},
    nickOf: null,
    titleLabelOf: (id) => Labels.resolve(id, null),
    isReal: () => true, DBX: null, RATING_INIT: 1500, SEASON0: "2026-10", seasonKey: () => "2026-10", seasonReset: (r) => r,
    FX: { band: (...a) => shown.push(a), confetti() {} }, fxSound() {}, setTimeout: (f) => f(),
    FB: { db: { ref: (path) => { assert.equal(path, "games/factor/accounts/aw/stats"); return { transaction: async (cb) => {
      const out = cb(db.value === null ? null : clone(db.value));
      if (out === undefined) return { committed: false };
      db.value = clone(out); db.writes++; return { committed: true };
    } }; } } },
  };
  vm.createContext(sandbox);
  vm.runInContext(badges + "\n" + stats + "\n" + record + "\nthis.api = { badgesOf, statsTx, recordMatch, announceableBadges };", sandbox);
  return { db, shown, api: sandbox.api };
}
const acct = { key: "aw" };
const winInfo = (extra = {}) => ({ outcome: "w", mode: "B", dr: 8, exp: 30, perfects: 0, vs: [], add: {}, max: {}, min: {}, or: {}, ...extra });

test("statsTx: a new account gets tk and tv2 in the same write; the caller's change is kept", async () => {
  const w = world(null);
  const r = await w.api.statsTx(acct, (s) => { s.exp = 20; return "ok"; });
  assert.equal(r.out, "ok");
  assert.equal(w.db.writes, 1);
  assert.equal(w.db.value.exp, 20);
  assert.deepEqual(w.db.value.tk, { v: 1, at: { ".sv": "timestamp" } });
  assert.deepEqual(w.db.value.tv2.base, { games: 0, Aw: 0, Bw: 0 });
});
test("statsTx: an existing holder is frozen with the legacy totals as the base; old stats are untouched", async () => {
  const start = { maxStreak: 12, handiWins: 1, games: 40, A: { w: 20 }, B: { w: 15 }, exp: 99, nick: "handi" };
  const w = world(clone(start));
  await w.api.statsTx(acct, (s) => { s.exp += 1; });
  const { tk, tv2, exp, ...rest } = w.db.value;
  assert.deepEqual(tk.ids, { handi: 1, streak10: 1 });
  assert.deepEqual(tv2.base, { games: 40, Aw: 20, Bw: 15 });
  assert.equal(exp, 100);
  const { exp: e0, ...rest0 } = start;
  assert.deepEqual(rest, rest0);
});
test("statsTx: a valid tk is not rewritten by later transactions", async () => {
  const w = world({ maxStreak: 10 });
  await w.api.statsTx(acct, () => {});
  const frozen = clone({ tk: w.db.value.tk, tv2: w.db.value.tv2 });
  w.db.value.maxStreak = 50;
  await w.api.statsTx(acct, (s) => { s.exp = 1; });
  assert.deepEqual({ tk: w.db.value.tk, tv2: w.db.value.tv2 }, frozen);
});
test("recordMatch: the freeze happens BEFORE the counters change, and the legacy title/reveal behaviour is unchanged", async () => {
  const w = world({ games: 9, streak: 9, maxStreak: 9, w: 9 });
  const r = await w.api.recordMatch(acct, winInfo());
  assert.equal(w.db.value.maxStreak, 10, "the legacy counter still advances");
  assert.equal(Keep.keptIds(w.db.value).includes("streak10"), false, "frozen before this win: streak10 is not 'already held'");
  // A7 (owner-approved) switched streak10 to the official ledger: the legacy counter alone no longer grants it once tk exists
  // (the title is earned through stats.sk; see tests/v6-a7-streak.test.cjs). Nothing the player already held is affected.
  assert.equal(w.api.badgesOf(w.db.value).some((b) => b.id === "streak10"), false, "A7: with tk, the legacy counter alone does not grant streak10");
  assert.equal(r.badges.some((b) => b.id === "streak10"), false, "and it is not revealed from the legacy counter");
  assert.equal(w.db.value.games, 10); assert.equal(w.db.value.tv2.base.games, 9);
});
test("recordMatch: an existing holder keeps the title and is not re-announced", async () => {
  const w = world({ games: 30, streak: 11, maxStreak: 11, w: 30 });
  const r = await w.api.recordMatch(acct, winInfo());
  assert.deepEqual(w.db.value.tk.ids, { streak10: 1 });
  assert.equal(r.badges.some((b) => b.id === "streak10"), false);
  assert.equal(w.api.badgesOf(w.db.value).some((b) => b.id === "streak10"), true);
});
test("without the keep module, statsTx / recordMatch behave exactly as before (no tk, nothing thrown)", async () => {
  const w = world({ games: 1 }, { withKeep: false });
  await w.api.statsTx(acct, (s) => { s.exp = 3; });
  await w.api.recordMatch(acct, winInfo());
  assert.equal("tk" in w.db.value, false); assert.equal("tv2" in w.db.value, false);
  assert.equal(w.db.value.exp >= 3, true);
});
test("a throwing keep module is swallowed and the transaction still completes", async () => {
  const w = world({ games: 1, maxStreak: 10 }, { keep: { ensureKeep() { throw new Error("boom"); } } });
  const r = await w.api.statsTx(acct, (s) => { s.exp = 7; return "done"; });
  assert.equal(r.out, "done");
  assert.equal(w.db.value.exp, 7);
  assert.equal("tk" in w.db.value, false);
  assert.equal(w.api.badgesOf(w.db.value).some((b) => b.id === "streak10"), true, "legacy condition still decides");
  await w.api.recordMatch(acct, winInfo());
  assert.equal(w.db.value.games, 2);
});
test("the freeze helper is wired only into the two stats transactions that run before counters change", () => {
  assert.equal((html.match(/keepStats\(s\)/g) || []).length, 2);
  assert.match(stats, /keepStats\(s\);\s*out = fn\(s\)/);
  assert.match(record, /s = s \|\| \{\};\s*keepStats\(s\);/);
});
