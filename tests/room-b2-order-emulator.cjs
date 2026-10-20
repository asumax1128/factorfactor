// Emulator-only (demo project), REAL Firebase SDK: a late receipt must not corrupt season / unknown-time / day records (Ver.6.3). Streak and revenge: tests/match-log-emulator.cjs.
const { start, info, jst, DAY, assert } = require('./room-b2-emulator-lib.cjs'), SS = require('../src/spark-stats-next.cjs');
(async () => {
  const now = Date.now(), thisMonth = jst(now).slice(0, 7), prevMonth = jst(now - 40 * DAY).slice(0, 7);
  assert.notEqual(thisMonth, prevMonth);
  const keys = ['s1', 's2', 's3', 's4', 'd1', 'd2'];
  const env = await start(keys, (k) => (k === 'd1' ? { stats: { games: 3, exp: 100 } } : k === 'd2' ? { stats: { games: 3, exp: 100, lastDay: jst(Date.now() - DAY), dayStreak: 4, maxDayStreak: 9 } } : k === 'v1' ? { stats: { games: 3, exp: 100, last: Date.now() - 3600e3, vs: { X: { last: 'l', l: 3 } } } } : k === 'v2' || k === 'v3' ? { stats: { games: 1, exp: 100 } } : k[0] === 'l' ? { stats: { games: 3, exp: 100, ...(k === 'l1' ? { streak: 2, maxStreak: 2, last: Date.now() - 3600e3 } : k === 'l2' ? { streak: 2, maxStreak: 2, last: Date.now() - 3600e3 } : k === 'l3' ? { streak: 5, maxStreak: 9, last: Date.now() - 3600e3 } : { streak: 0, maxStreak: 0 }) } } : { stats: { games: 3, exp: 100, rating: k === 's4' ? 1597 : 1600, maxRating: k === 's4' ? 1597 : 1700, seasonMax: k === 's4' ? 1597 : 1650, season: thisMonth, seasonHist: { '2026-09': { max: 1655, last: 1620 } } } }));
  try {
    const sb = env.bind(env.owner.db), ids = (st) => sb.api.badgesOf(st).map((b) => b.id);
    const keep = (st) => ({ rating: st.rating, seasonMax: st.seasonMax, maxRating: st.maxRating, season: st.season, seasonHist: st.seasonHist });
    // ---- the match belongs to the previous season, received this season
    {
      const before = await env.read('s1', 'stats'); sb.B2_RCPT.at.G1 = now - 40 * DAY;
      const r = await sb.api.recordMatch({ key: 's1' }, info('G1', 'w', now));
      const st = await env.read('s1', 'stats');
      assert.deepEqual(keep(st), keep(before), 'rating, season max, max rating, season and history are untouched'); assert.equal(r.dr, 0);
      assert.equal(st.games, 4); assert.equal(st.w, 1); assert.equal(st.exp, 130); assert(st.roomSeen.G1, 'counters, EXP and the idempotent mark are recorded');
      assert.equal(sb.B2_RCPT.note.G1, 'season'); assert.equal(st.sk.l['r-C-G1'].t, now - 40 * DAY, 'the official ledger keeps the real match time');
      console.log('PASS season: a previous-season match changes counters/EXP only; rating and history stay');
    }
    // ---- the same season: the rating moves as always
    {
      sb.B2_RCPT.at.G2 = now - 3600e3; const r = await sb.api.recordMatch({ key: 's2' }, info('G2', 'w', now));
      const st = await env.read('s2', 'stats'); assert.equal(st.rating, 1605); assert.equal(st.seasonMax, 1650); assert.equal(r.dr, 5); assert.equal(sb.B2_RCPT.note.G2, '');
      console.log('PASS season: a same-season late match updates the rating normally');
    }
    // ---- unknown time: counters only
    {
      const before = await env.read('s3', 'stats'); sb.B2_RCPT.at.G3 = null;
      const r = await sb.api.recordMatch({ key: 's3' }, info('G3', 'w', now, { add: { flash3: 1 } }));
      const st = await env.read('s3', 'stats');
      assert.deepEqual(keep(st), keep(before)); assert.equal(r.dr, 0); assert.equal(st.games, 4); assert.equal(st.exp, 130); assert.equal(st.flash3, 1, 'time-independent title counters are kept');
      assert(!st.sk, 'no official streak ledger entry'); assert(!st.lastDay && !st.dayStreak, 'no day record'); assert(!st.last, 'the last-match time is not moved to the receipt time');
      assert.equal(sb.B2_RCPT.note.G3, 'time');
      console.log('PASS unknown time: only time-independent counters are applied');
    }
    // ---- rating-dependent title: an old-season win must not lift the rating over a threshold (1600 title)
    {
      sb.B2_RCPT.at.G4 = now - 40 * DAY; await sb.api.recordMatch({ key: 's4' }, info('G4', 'w', now, { dr: 20 }));
      let st = await env.read('s4', 'stats'); assert(st.maxRating < 1600 && !ids(st).includes('master1600'), 'the threshold is not reached by an old-season receipt'); assert.equal(st.rating, 1597);
      sb.B2_RCPT.at.G5 = now - 3600e3; await sb.api.recordMatch({ key: 's4' }, info('G5', 'w', now, { dr: 20 }));
      st = await env.read('s4', 'stats'); assert(st.rating >= 1600 && st.maxRating >= 1600, 'a current-season win does (the title itself is on hold until November by the existing release adjustment)');
      console.log('PASS rating-dependent titles are judged only from current-season rating changes');
    }
    // ---- consecutive play days: late previous-day receipt, Spark play days in the same history, dayStreak vs maxDayStreak
    {
      const spark = (key, t, id) => env.owner.db.ref(`games/factor/accounts/${key}/stats`).transaction((x) => { x = x || {}; SS.apply(x, { id, t, o: 'w', s: 's' }); return x; });
      const day = (k) => jst(now - k * DAY);
      // d1: Spark plays two days ago, B2 plays today (yesterday missed), then the B2 match of YESTERDAY is received late
      await spark('d1', now - 2 * DAY, 's-d1'); let st = await env.read('d1', 'stats'); assert.deepEqual([st.lastDay, st.dayStreak], [day(2), 1]);
      await sb.api.recordMatch({ key: 'd1' }, info('D1today', 'w', now)); st = await env.read('d1', 'stats'); assert.deepEqual([st.lastDay, st.dayStreak, st.maxDayStreak], [day(0), 1, 1], 'yesterday is missing: the run restarts');
      sb.B2_RCPT.at.D1y = now - DAY - 3600e3; await sb.api.recordMatch({ key: 'd1' }, info('D1y', 'w', now));
      st = await env.read('d1', 'stats'); assert.deepEqual([st.lastDay, st.dayStreak, st.maxDayStreak], [day(0), 3, 3], 'the late previous day joins the Spark day and today: three consecutive days');
      assert(st.dl.d[day(2)] && st.dl.d[day(1)] && st.dl.d[day(0)], 'the Spark day and the B2 days share one history');
      // d2: legacy data (4-day run ending yesterday, best 9). Today (normal) -> 5; a late match 6 days ago does not touch the current run; the day just before the run extends it; the best is kept
      await sb.api.recordMatch({ key: 'd2' }, info('D2today', 'w', now)); st = await env.read('d2', 'stats'); assert.deepEqual([st.dayStreak, st.maxDayStreak], [5, 9]);
      sb.B2_RCPT.at.D2far = now - 6 * DAY; await sb.api.recordMatch({ key: 'd2' }, info('D2far', 'w', now)); st = await env.read('d2', 'stats'); assert.deepEqual([st.dayStreak, st.maxDayStreak], [5, 9], 'an unrelated old day does not change the current run');
      sb.B2_RCPT.at.D2edge = now - 5 * DAY; await sb.api.recordMatch({ key: 'd2' }, info('D2edge', 'w', now)); st = await env.read('d2', 'stats');
      assert.deepEqual([st.dayStreak, st.maxDayStreak], [7, 9], 'day -5 joins the restored run and the far day: current run 7, the best (9) is kept, not lowered');
      console.log('PASS days: late previous day fills the gap, Spark and B2 share the history, dayStreak and maxDayStreak are distinct and never lowered');
    }
  } finally { await env.close(); }
})().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
