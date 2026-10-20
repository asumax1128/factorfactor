// Property tests for src/stats-order-next.cjs (Ver.6.3): order-independent legacy streak.
const test = require('node:test'), assert = require('node:assert/strict');
const O = require('../src/stats-order-next.cjs');
const rnd = (seed) => { let x = seed >>> 0; return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296); };
// the previous (incremental, in-order) rule of recordMatch
const old = (s, o) => { if (o === 'w') { s.streak = (s.streak || 0) + 1; s.maxStreak = Math.max(s.maxStreak || 0, s.streak); } else if (o === 'l') s.streak = 0; };
const pick = (r) => ['w', 'w', 'l', 'd'][Math.floor(r() * 4)];
test('in-order sequences give exactly the previous result at every step (migration, draws, > 32 entries)', () => {
  for (let seed = 1; seed <= 60; seed++) {
    const r = rnd(seed), init = { streak: Math.floor(r() * 12), maxStreak: 0, last: 1_000_000 }; init.maxStreak = init.streak + Math.floor(r() * 5);
    const a = { ...init }, b = { ...init }; let t = 1_000_000 + 1000;
    for (let i = 0; i < 100; i++) { const o = pick(r); t += 1000 + Math.floor(r() * 5000); old(a, o); const res = O.legacyStreak(b, { id: 'm' + i, t, o }, { last: init.last }); assert.equal(res.status, 'applied');
      assert.equal(b.streak, a.streak, `seed ${seed} step ${i}`); assert.equal(b.maxStreak, a.maxStreak, `seed ${seed} step ${i}`); }
    assert(Object.keys(b.sl.l).length <= O.LEGACY_MAX);
  }
});
test('arrival order does not change the streak: any permutation equals the time-ordered result; best never exceeds the true best', () => {
  for (let seed = 1; seed <= 80; seed++) {
    const r = rnd(seed * 7), n = 3 + Math.floor(r() * 8), init = { streak: Math.floor(r() * 6), maxStreak: 9, last: 500 };
    const ent = Array.from({ length: n }, (_, i) => ({ id: 'e' + i, t: 1000 + i * 100, o: pick(r) }));
    const truth = { ...init }; let trueMax = init.maxStreak, run = init.streak; ent.forEach((e) => { old(truth, e.o); });
    // arrival order: shuffled, but all entries are newer than the baseline
    const order = [...ent].sort(() => r() - 0.5), got = { ...init };
    order.forEach((e) => assert.equal(O.legacyStreak(got, e, { last: init.last }).status, 'applied'));
    assert.equal(got.streak, truth.streak, `seed ${seed}`); assert(got.maxStreak >= init.maxStreak && got.maxStreak <= Math.max(truth.maxStreak, init.maxStreak), `max bounded seed ${seed}`);
  }
});
test('the old "skip the older loss" mistake is gone: a win received first, then the earlier loss', () => {
  const s = { streak: 2, maxStreak: 2, last: 500 };
  O.legacyStreak(s, { id: 'win', t: 3000, o: 'w' }, { last: 500 }); assert.equal(s.streak, 3);
  O.legacyStreak(s, { id: 'loss', t: 2000, o: 'l' }, { last: 500 });
  assert.equal(s.streak, 1, 'true order: 2 wins -> loss -> win = 1 (not 3 = loss ignored, not 0 = loss applied last)'); assert.equal(s.maxStreak, 3, 'the best is never lowered');
});
test('32-entry boundary: n0, the cut-off, the current run and the best stay correct; older results are not placed', () => {
  const s = { streak: 4, maxStreak: 6, last: 500 }, r = rnd(5); const seq = [];
  for (let i = 0; i < 40; i++) { const e = { id: 'x' + i, t: 1000 + i * 100, o: i % 7 === 6 ? 'l' : 'w' }; seq.push(e); O.legacyStreak(s, e, { last: 500 }); }
  assert.equal(Object.keys(s.sl.l).length, 32); const ref = { streak: 4, maxStreak: 6 }; seq.forEach((e) => old(ref, e.o));
  assert.equal(s.streak, ref.streak); assert.equal(s.maxStreak, ref.maxStreak);
  const oldest = O.ordered(s.sl.l)[0]; assert.equal(s.sl.bt, 1000 + 7 * 100 + 1, 'the cut-off follows the folded entries');
  // inside the window: placed and replayed
  const before = s.streak; assert.equal(O.legacyStreak(s, { id: 'mid', t: oldest.t + 50, o: 'w' }, { last: 500 }).status, 'applied');
  // older than the cut-off: a win is not added, a loss restarts the safe way; the best is untouched
  const maxBefore = s.maxStreak, snap = JSON.stringify(s.sl.l);
  assert.equal(O.legacyStreak(s, { id: 'oldwin', t: 1000, o: 'w' }, { last: 500 }).status, 'unplaced-win'); assert.equal(JSON.stringify(s.sl.l), snap); assert.equal(s.maxStreak, maxBefore);
  assert.equal(O.legacyStreak(s, { id: 'oldloss', t: 1000, o: 'l' }, { last: 500 }).status, 'unplaced-loss'); assert.equal(s.sl.n0, 0); assert.equal(s.maxStreak, maxBefore);
  let k = 0; for (const e of O.ordered(s.sl.l)) k = O.step(k, e.o); assert.equal(s.streak, k, 'the current run is the replay of the remaining ledger');
});
test('migration: existing data is kept; matches older than the last recorded one cannot be placed; duplicates and bad input are ignored', () => {
  const s = { streak: 5, maxStreak: 9, last: 100000 };
  assert.equal(O.legacyStreak(s, { id: 'a', t: 120000, o: 'w' }, { last: 100000 }).status, 'applied'); assert.equal(s.streak, 6); assert.equal(s.sl.n0, 5);
  assert.equal(O.legacyStreak(s, { id: 'a', t: 120000, o: 'w' }, { last: 100000 }).status, 'duplicate'); assert.equal(s.streak, 6);
  assert.equal(O.legacyStreak(s, { id: 'b', t: 90000, o: 'w' }, { last: 100000 }).status, 'applied', 'within the 60 s clock tolerance of the baseline it is placed');
  assert.equal(O.legacyStreak(s, { id: 'c', t: 10, o: 'w' }, { last: 100000 }).status, 'unplaced-win'); assert.equal(s.streak, 7);
  assert.equal(O.legacyStreak(s, { id: 'd' }, {}).status, 'invalid'); assert.equal(s.maxStreak, 9, 'the best of a long legacy run is kept');
  const fresh = {}; O.legacyStreak(fresh, { id: 'z', t: 5, o: 'w' }, {}); assert.equal(fresh.streak, 1); assert.equal(fresh.maxStreak, 1);
});

// ---- revenge ---------------------------------------------------------------------------------------------------------------------
const oldRev = (s, key, o) => { const r = s.vs[key] = s.vs[key] || {}; if (o === 'w' && r.last === 'l') s.revenges = (s.revenges || 0) + 1; r[o] = (r[o] || 0) + 1; r.last = o; };
const trueRev = (init, seq) => { let n = 0, prev = init; for (const o of seq) { if (prev === 'l' && o === 'w') n++; prev = o; } return n; };
const perms = (a) => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p])));
test('revenge: in-order results give exactly the previous count (legacy last as the starting point, > 6 entries)', () => {
  for (let seed = 1; seed <= 60; seed++) {
    const r = rnd(seed * 3), last = ['w', 'l', 'd'][Math.floor(r() * 3)], a = { vs: { X: { last, w: 1 } }, revenges: 0 }, b = { vs: { X: { last, w: 1 } }, revenges: 0 }; let t = 2_000_000;
    for (let i = 0; i < 40; i++) { const o = pick(r); t += 1000; oldRev(a, 'X', o); const res = O.revenge(b, 'X', { id: 'r' + i, t, o }, { last: 1_000_000 }); assert.equal(res.status, 'applied'); assert.equal(b.revenges, a.revenges, `seed ${seed} step ${i}`); assert.equal(b.vs.X.last, a.vs.X.last); assert(Object.keys(b.vs.X.vl.l).length <= O.REVENGE_MAX); }
  }
});
test('revenge: every arrival order of up to 6 results gives the time-ordered count (exact without draws; a ratchet that never decreases with draws)', () => {
  for (const outcomes of [['l', 'w', 'l', 'w', 'w'], ['l', 'l', 'w', 'd', 'w', 'l'], ['w', 'l', 'w', 'l', 'w', 'l'], ['d', 'l', 'w']]) {
    const ent = outcomes.map((o, i) => ({ id: 'q' + i, t: 5000 + i * 100, o }));
    for (const init of [undefined, 'l', 'w']) {
      const expected = trueRev(init, outcomes);
      for (const order of perms(ent)) {
        const s = { vs: { X: init ? { last: init, w: 1 } : {} }, revenges: 2 }; let prev = 2;
        order.forEach((e) => { O.revenge(s, 'X', e, { last: 1000 }, !init); assert(s.revenges >= prev, 'never decreases'); prev = s.revenges; });
        const got = s.revenges - 2, tag = `${outcomes.join('')} init ${init} order ${order.map((e) => e.id)}`;
        // exact whenever no draw can separate an already counted loss->win pair; with draws the counter is a ratchet (an earned count is never taken back): never below the true count
        if (!outcomes.includes('d')) assert.equal(got, expected, tag); else assert(got >= expected && got <= expected + outcomes.filter((o) => o === 'd').length, tag);
        assert.equal(s.vs.X.last, outcomes[outcomes.length - 1]);
      }
    }
  }
});
test('revenge: the old "last at time 0" mistake is gone; results older than the baseline are not judged', () => {
  const s = { vs: { X: { last: 'l', l: 3 } }, revenges: 0 };
  assert.equal(O.revenge(s, 'X', { id: 'early', t: 900, o: 'w' }, { last: 100000 }).status, 'unplaced'); assert.equal(s.revenges, 0, 'a win that happened BEFORE the recorded last loss is not a revenge'); assert.equal(s.vs.X.last, 'l');
  assert.equal(O.revenge(s, 'X', { id: 'next', t: 150000, o: 'w' }, { last: 100000 }).status, 'applied'); assert.equal(s.revenges, 1);
  assert.equal(O.revenge(s, 'X', { id: 'next', t: 150000, o: 'w' }, { last: 100000 }).status, 'duplicate'); assert.equal(s.revenges, 1);
  const fresh = { vs: {}, revenges: 0 }; O.revenge(fresh, 'Y', { id: 'f2', t: 200, o: 'w' }, { last: 100000 }, true); O.revenge(fresh, 'Y', { id: 'f1', t: 100, o: 'l' }, { last: 100000 }, true);
  assert.equal(fresh.revenges, 1, 'a brand-new opponent: both results can be placed whatever their order');
});
test('revenge: the 6-entry window rolls its baseline, so results inside the window keep exact neighbours', () => {
  const s = { vs: { X: {} }, revenges: 0 }; const seq = 'lwlwlwlwlwlw'.split(''); const ent = seq.map((o, i) => ({ id: 'k' + i, t: 10000 + i * 100, o }));
  ent.forEach((e) => O.revenge(s, 'X', e, {}, true)); assert.equal(s.revenges, trueRev(undefined, seq));
  assert.equal(Object.keys(s.vs.X.vl.l).length, 6); const base = s.vs.X.vl;
  // a late result between the baseline and the oldest kept entry: exact neighbours (baseline + oldest)
  const oldest = O.ordered(base.l)[0], rv = s.revenges; const res = O.revenge(s, 'X', { id: 'late', t: oldest.t - 10, o: 'l' }, {}, true);
  assert.equal(res.status, 'applied'); assert(s.revenges >= rv);
  // older than the baseline: not placed, nothing changes
  const snap = JSON.stringify(s); assert.equal(O.revenge(s, 'X', { id: 'ancient', t: 1, o: 'w' }, {}, true).status, 'unplaced'); assert.equal(JSON.stringify(s.vs), JSON.stringify(JSON.parse(snap).vs));
});

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
