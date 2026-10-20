// Property tests for src/stats-order-next.cjs (Ver.6.3): consecutive play days (shared by recordMatch and the Spark path).
// The legacy streak and the revenge count moved to the match log: see tests/match-log.test.cjs.
const test = require('node:test'), assert = require('node:assert/strict');
const O = require('../src/stats-order-next.cjs');
const rnd = (seed) => { let x = seed >>> 0; return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296); };

// ---- consecutive play days ----------------------------------------------------------------------------------------------------
const D0 = '2026-08-01', add = (d, n) => new Date(Date.parse(d + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10);
const oldDay = (s, day) => { const last = O.canon(s.lastDay); if (last && last >= day) return false; s.dayStreak = last && last === add(day, -1) ? (s.dayStreak || 0) + 1 : 1; s.lastDay = day; s.maxDayStreak = Math.max(s.maxDayStreak || 0, s.dayStreak); return true; };
test('days: in-order play (gaps, repeats, a legacy streak longer than 60 days) equals the previous rule at every step', () => {
  for (let seed = 1; seed <= 60; seed++) {
    const r = rnd(seed * 11), n = Math.floor(r() * 90), init = n ? { lastDay: D0, dayStreak: n, maxDayStreak: n + Math.floor(r() * 4) } : {}, a = { ...init }, b = { ...init }; let day = D0;
    for (let i = 0; i < 120; i++) { const g = r() < 0.15 ? 2 + Math.floor(r() * 3) : r() < 0.2 ? 0 : 1; day = add(day, g); oldDay(a, day); O.dayStep(b, day);
      assert.equal(b.lastDay, a.lastDay, `seed ${seed} step ${i}`); assert.equal(b.dayStreak, a.dayStreak, `seed ${seed} step ${i}`); assert.equal(b.maxDayStreak, a.maxDayStreak, `seed ${seed} step ${i}`); }
    assert(Object.keys(b.dl.d).length <= O.DAY_WINDOW);
  }
});
test('days: a late previous day fills the gap; dayStreak (run ending at the newest day) and maxDayStreak (best ever) are different things', () => {
  const s = {}; [-3, -2, 0].forEach((k) => O.dayStep(s, add(D0, k)));
  assert.deepEqual([s.dayStreak, s.maxDayStreak], [1, 2]);
  assert.equal(O.dayStep(s, add(D0, -1)), true); assert.deepEqual([s.lastDay, s.dayStreak, s.maxDayStreak], [D0, 4, 4], 'the missed day joins both runs');
  assert.equal(O.dayStep(s, add(D0, -1)), false, 'the same day twice counts once'); assert.equal(s.dayStreak, 4);
  // a late day that does not touch the newest run never lowers dayStreak and only raises the best when two old runs join
  const t = { lastDay: D0, dayStreak: 3, maxDayStreak: 5 }; O.dayStep(t, add(D0, -10)); assert.deepEqual([t.dayStreak, t.maxDayStreak], [3, 5]);
  const u = {}; [-20, -19, -17, -16, -15, 0].forEach((k) => O.dayStep(u, add(D0, k))); assert.deepEqual([u.dayStreak, u.maxDayStreak], [1, 3]);
  O.dayStep(u, add(D0, -18)); assert.deepEqual([u.dayStreak, u.maxDayStreak], [1, 6], 'joining two old runs raises the best, the current run is unchanged');
});
test('days: Spark and recordMatch share one history (any writer order gives the same days as the union)', () => {
  for (let seed = 1; seed <= 40; seed++) {
    const r = rnd(seed * 5), days = Array.from({ length: 30 }, () => add(D0, Math.floor(r() * 40))), s = {};
    days.forEach((d) => O.dayStep(s, d)); const set = [...new Set(days)].sort(); let run = 1, best = 1; for (let i = 1; i < set.length; i++) { run = add(set[i - 1], 1) === set[i] ? run + 1 : 1; best = Math.max(best, run); }
    assert.equal(s.lastDay, set[set.length - 1]); assert.equal(s.dayStreak, run); assert.equal(s.maxDayStreak, best, `seed ${seed}`);
  }
});
test('days: a 100-day streak survives the 60-day window; days older than the window are ignored; legacy data is restored without change', () => {
  const s = { lastDay: add(D0, 99), dayStreak: 100, maxDayStreak: 100 }; O.dayStep(s, add(D0, 100));
  assert.deepEqual([s.dayStreak, s.maxDayStreak], [101, 101]); assert.equal(Object.keys(s.dl.d).length, 60); assert.equal(s.dl.pre, 41);
  const before = JSON.stringify(s); assert.equal(O.dayStep(s, add(D0, 10)), false); assert.equal(JSON.stringify(s), before, 'older than the window: not placed');
  const legacy = { lastDay: '2026-10-25', dayStreak: 6, maxDayStreak: 6 }; O.dayStep(legacy, '2026-10-26'); assert.deepEqual([legacy.lastDay, legacy.dayStreak], ['2026-10-26', 7]);
});
test('days: the current streak is judged against today', () => {
  const s = { lastDay: D0, dayStreak: 5 };
  assert.equal(O.currentDayStreak(s, D0), 5); assert.equal(O.currentDayStreak(s, add(D0, 1)), 5); assert.equal(O.currentDayStreak(s, add(D0, 2)), 0); assert.equal(O.currentDayStreak({}, D0), 0);
});
