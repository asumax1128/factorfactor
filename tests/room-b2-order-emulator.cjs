// Emulator-only (demo project), REAL Firebase SDK: a late receipt must not corrupt season / time-ordered records (Ver.6.3).
const { start, info, jst, DAY, assert } = require('./room-b2-emulator-lib.cjs');
(async () => {
  const now = Date.now(), thisMonth = jst(now).slice(0, 7), prevMonth = jst(now - 40 * DAY).slice(0, 7);
  assert.notEqual(thisMonth, prevMonth);
  const keys = ['s1', 's2', 's3', 's4'];
  const env = await start(keys, (k) => ({ stats: { games: 3, exp: 100, rating: k === 's4' ? 1597 : 1600, maxRating: k === 's4' ? 1597 : 1700, seasonMax: k === 's4' ? 1597 : 1650, season: thisMonth, seasonHist: { '2026-09': { max: 1655, last: 1620 } } } }));
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
  } finally { await env.close(); }
})().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
