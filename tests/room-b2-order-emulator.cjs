// Emulator-only (demo project), REAL Firebase SDK: a late receipt must not corrupt season / time-ordered records (Ver.6.3).
const { start, info, jst, DAY, assert } = require('./room-b2-emulator-lib.cjs');
(async () => {
  const now = Date.now(), thisMonth = jst(now).slice(0, 7), prevMonth = jst(now - 40 * DAY).slice(0, 7);
  assert.notEqual(thisMonth, prevMonth);
  const keys = ['s1', 's2', 's3', 's4', 'l1', 'l2', 'l3', 'l4', 'v1', 'v2', 'v3'];
  const env = await start(keys, (k) => (k === 'v1' ? { stats: { games: 3, exp: 100, last: Date.now() - 3600e3, vs: { X: { last: 'l', l: 3 } } } } : k === 'v2' || k === 'v3' ? { stats: { games: 1, exp: 100 } } : k[0] === 'l' ? { stats: { games: 3, exp: 100, ...(k === 'l1' ? { streak: 2, maxStreak: 2, last: Date.now() - 3600e3 } : k === 'l2' ? { streak: 2, maxStreak: 2, last: Date.now() - 3600e3 } : k === 'l3' ? { streak: 5, maxStreak: 9, last: Date.now() - 3600e3 } : { streak: 0, maxStreak: 0 }) } } : { stats: { games: 3, exp: 100, rating: k === 's4' ? 1597 : 1600, maxRating: k === 's4' ? 1597 : 1700, seasonMax: k === 's4' ? 1597 : 1650, season: thisMonth, seasonHist: { '2026-09': { max: 1655, last: 1620 } } } }));
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
    // ---- legacy win streak (stats.streak / maxStreak): the actual match order decides, not the receipt order
    {
      // l1: 2 wins, then (true order) a loss at T-5min and a win at T-1s; the WIN is received first, the older LOSS late
      let r = await sb.api.recordMatch({ key: 'l1' }, info('L1w', 'w', now - 1000)); assert.equal((await env.read('l1', 'stats')).streak, 3);
      sb.B2_RCPT.at.L1l = now - 300e3; await sb.api.recordMatch({ key: 'l1' }, info('L1l', 'l', now));
      let st = await env.read('l1', 'stats'); assert.equal(st.streak, 1, 'true order 2 wins -> loss -> win = 1 (the older loss is neither ignored nor applied last)'); assert.equal(st.maxStreak, 3, 'the best is kept');
      // l2: the same two matches received in the true order give the same result
      await sb.api.recordMatch({ key: 'l2' }, info('L2l', 'l', now - 300e3)); await sb.api.recordMatch({ key: 'l2' }, info('L2w', 'w', now - 1000));
      st = await env.read('l2', 'stats'); assert.equal(st.streak, 1); assert.equal(st.maxStreak, 2);
      // l3: migration of existing data: streak 5 / best 9 are kept and continue
      await sb.api.recordMatch({ key: 'l3' }, info('L3a', 'w', now - 1000)); st = await env.read('l3', 'stats');
      assert.equal(st.streak, 6); assert.equal(st.maxStreak, 9, 'the existing best is kept'); assert.equal(st.sl.n0, 5, 'the existing streak is the ledger baseline');
      // l4: 35 matches stored as a ledger (real RTDB + rules): 32 kept, the folded part is in n0, the current run and best are right
      const ref = { streak: 0, maxStreak: 0 }; let t = now - 100000;
      for (let i = 0; i < 35; i++) { const o = i % 9 === 8 ? 'l' : 'w'; if (o === 'w') { ref.streak++; ref.maxStreak = Math.max(ref.maxStreak, ref.streak); } else ref.streak = 0; t += 1000; await sb.api.recordMatch({ key: 'l4' }, info('L4_' + i, o, t)); }
      st = await env.read('l4', 'stats'); assert.equal(Object.keys(st.sl.l).length, 32); assert.equal(st.streak, ref.streak); assert.equal(st.maxStreak, ref.maxStreak);
      // a result older than the folded part: a win is not added, a loss restarts safely; the best stays
      sb.B2_RCPT.at.L4old = now - 99000; const bs = st.streak; await sb.api.recordMatch({ key: 'l4' }, info('L4old', 'w', now));
      st = await env.read('l4', 'stats'); assert.equal(st.streak, bs); assert.equal(st.maxStreak, ref.maxStreak);
      console.log('PASS legacy streak: arrival order does not matter; migration keeps existing data; 32-entry ledger and unplaceable results are safe');
    }
    // ---- revenge: judged in match order, with per-opponent history (vs[X].vl)
    {
      const vs = (o) => [{ key: 'X', o }];
      // v1 (legacy data: last result vs X = loss at an unknown earlier time): a win that was played BEFORE that loss and is received late is NOT a revenge
      sb.B2_RCPT.at.V1early = now - 7200e3; await sb.api.recordMatch({ key: 'v1' }, info('V1early', 'w', now, { vs: vs('w') }));
      let st = await env.read('v1', 'stats'); assert(!st.revenges, 'no false revenge from the unplaced early win'); assert.equal(st.vs.X.last, 'l'); assert.equal(st.vs.X.w, 1, 'the win is still counted in the opponent record');
      await sb.api.recordMatch({ key: 'v1' }, info('V1next', 'w', now - 500, { vs: vs('w') })); st = await env.read('v1', 'stats'); assert.equal(st.revenges, 1, 'the next real win after the loss is a revenge'); assert.equal(st.vs.X.last, 'w');
      // v2 (new opponent): the WIN is received first, the earlier LOSS late: true order loss -> win = one revenge
      await sb.api.recordMatch({ key: 'v2' }, info('V2w', 'w', now - 1000, { vs: vs('w') })); st = await env.read('v2', 'stats'); assert(!st.revenges);
      sb.B2_RCPT.at.V2l = now - 5000; await sb.api.recordMatch({ key: 'v2' }, info('V2l', 'l', now, { vs: vs('l') })); st = await env.read('v2', 'stats');
      assert.equal(st.revenges, 1, 'receipt order does not hide the revenge'); assert.equal(st.vs.X.last, 'w'); assert.equal(Object.keys(st.vs.X.vl.l).length, 2);
      // v3: 8 results vs one opponent keep a 6-entry history; the revenge count equals the match-order count
      let t = now - 80000, prev, expect = 0; for (let i = 0; i < 8; i++) { const o = i % 2 ? 'w' : 'l'; if (prev === 'l' && o === 'w') expect++; prev = o; t += 1000; await sb.api.recordMatch({ key: 'v3' }, info('V3_' + i, o, t, { vs: vs(o) })); }
      st = await env.read('v3', 'stats'); assert.equal(st.revenges, expect); assert.equal(Object.keys(st.vs.X.vl.l).length, 6);
      console.log('PASS revenge: order-independent, legacy last is a baseline (not time 0), 6-entry history');
    }
  } finally { await env.close(); }
})().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
