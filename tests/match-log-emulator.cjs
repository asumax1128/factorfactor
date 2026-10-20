// Emulator-only (demo project), REAL Firebase SDK: the match log (stats.ml) with the real recordMatch / openMatch from index.html and the real Spark apply.
// Ver.6.3: the Codex findings end to end (late draw, receipt order, start order vs open commit order, 65+ late Spark result, open proof), plus concurrency,
// a 6.2 tab, failure and cap. A test clock (clk) stands in for fbNow(): matches start at S(n) and results are recorded long after.
const { start, info, sleep, assert, MatchLog: ML } = require('./room-b2-emulator-lib.cjs'), SS = require('../src/spark-stats-next.cjs'), Keep = require('../src/title-keep-next.cjs');
(async () => {
  const T0 = Date.now(), clk = { t: T0 }, S = (n) => T0 + 60000 + n * 90000, DONE = T0 + 5e7;
  const keys = Array.from({ length: 16 }, (_, i) => 'c' + (i + 1));
  const seed = (k) => (k === 'c3' ? { stats: { games: 12, w: 8, l: 4, streak: 5, maxStreak: 7, revenges: 2, sk: { v: 1, n: 5, best: 9, n0: 0, l: {} } } }
    : k === 'c6' ? { stats: { games: 4, streak: 2, maxStreak: 2 } } : { stats: { games: 0 } });
  const env = await start(keys, seed);
  try {
    const sb = env.bind(env.owner.db, { now: () => clk.t }), A = sb.api;
    const acct = (k) => ({ key: k }), vsOf = (o, who = 'x') => [{ key: who, o }];
    const rid = (g) => 'r-C-' + g;
    const open = async (c, g, n, opp = ['x'], api = A) => { clk.t = S(n) - 5000; return api.openMatch(acct(c), { id: rid(g), kind: 'r', opponents: opp, startAt: S(n) }); };
    const rec = (c, g, o, who = 'x', extra = {}) => { clk.t = DONE; return A.recordMatch(acct(c), info(g, o, DONE, { vs: vsOf(o, who), ...extra })); };
    const st = (c) => env.read(c, 'stats');
    const flagOf = (s, g) => (/^[^|]*\|[rgs][owldx]([uLq]?)\|/.exec(s.ml.e[rid(g)]) || [])[1];

    // ---- audit#2: L, D, W start in that order; the opens commit L, W, D (two devices). Old logic: revenge from L -> W
    {
      for (const [g, n] of [['c1L', 1], ['c1W', 3], ['c1D', 2]]) { const r = await open('c1', g, n); assert.equal(r.saved, true); assert.equal(r.status, 'opened'); }
      await rec('c1', 'c1L', 'l'); await rec('c1', 'c1W', 'w');
      let s = await st('c1'); assert(!s.revenges, 'the draw is unknown yet'); assert.equal(s.vs.x.w, 1);
      await rec('c1', 'c1D', 'd'); s = await st('c1');
      assert(!s.revenges && !s.ml.ev.rv, 'sorted by the real start (L, D, W): the draw separates them, whatever the commit order'); assert.equal(s.games, 3);
      assert.equal(flagOf(s, 'c1W'), '', 'proven open'); await rec('c1', 'c1D', 'd'); assert.equal((await st('c1')).games, 3, 'a retry counts once');
      console.log('PASS audit#2: opens committed out of start order never make a revenge (real SDK); retries count once');
    }
    // ---- receipt order inversion: W W [L] W W (true max 2), opens committed out of order
    {
      const seq = [['1', 'w'], ['2', 'w'], ['3', 'l'], ['4', 'w'], ['5', 'w']];
      for (const n of [3, 1, 5, 2, 4]) await open('c2', 'c2' + n, n);
      for (const [n, o] of seq.filter(([n]) => n !== '3')) await rec('c2', 'c2' + n, o);
      let s = await st('c2'); assert.equal(s.maxStreak || 0, 2, 'an unresolved match in the middle separates the run'); assert.equal(s.sk.best, 2);
      await rec('c2', 'c23', 'l'); s = await st('c2');
      assert.equal(s.maxStreak, 2); assert.equal(s.sk.best, 2); assert.equal(s.streak, 2); assert.equal(s.ml.ev.lg, 2);
      console.log('PASS receipt order: no false max streak, no missed one (legacy and official)');
    }
    // ---- existing data, a late unplaced loss, a prompt result with no open
    {
      await A.recordMatch(acct('c3'), (() => { sb.B2_RCPT.at.late1 = T0 - 86400e3; clk.t = DONE; return info('late1', 'l', T0 - 86400e3, { vs: vsOf('l', 'z') }); })());
      let s = await st('c3');
      assert.equal(s.streak, 5, 'a late result with no place does not erase the existing streak'); assert.equal(s.maxStreak, 7); assert.equal(s.revenges, 2); assert.equal(s.sk.best, 9);
      await rec('c3', 'p1', 'w', 'z'); s = await st('c3');
      assert.equal(s.streak, 6, 'a prompt result with no open moves the profile streak'); assert.equal(s.maxStreak, 7, 'but it is never evidence'); assert.equal(s.ml.ev.lg, 0);
      await open('c3', 'c3n', 1, ['q']); await rec('c3', 'c3n', 'w', 'q'); s = await st('c3');
      assert.equal(s.streak, 7); assert.equal(s.ml.ev.lg, 1); assert.equal(s.maxStreak, 7);
      console.log('PASS existing data: no time grace, an unplaced loss changes nothing, old records are held, the old streak is not evidence');
    }
    // ---- official streak with Spark and B2 mixed (Spark opens are proven the same way)
    {
      const sparkOpen = async (c, m, n) => { clk.t = S(n) - 5000; const sa = env.bind(env.owner.db, { now: () => clk.t }).api; void sa;
        await env.owner.db.ref(`games/factor/accounts/${c}/stats`).transaction((s) => { s = s || {}; Keep.ensureKeep(s, { '.sv': 'timestamp' }); ML.open(s, { id: 's-' + m, kind: 's', startAt: S(n), now: clk.t }); return s; });
        await env.owner.db.ref(`games/factor/accounts/${c}/stats`).transaction((s) => { if (!s) return s; ML.prove(s, { id: 's-' + m, now: clk.t + 1000 }); return s; }); };
      const sparkApply = (c, m, o, late = false) => env.owner.db.ref(`games/factor/accounts/${c}/stats`).transaction((s) => { s = s || {}; Keep.ensureKeep(s, { '.sv': 'timestamp' }); SS.apply(s, { id: 's-' + m, t: S(2), o, s: 's' }, { late, now: DONE }); return s; });
      await open('c4', 'c4a', 1); await sparkOpen('c4', 'M2', 2); await open('c4', 'c4c', 3);
      await sparkApply('c4', 'M2', 'w'); await rec('c4', 'c4c', 'w');
      let s = await st('c4'); assert.equal(s.sk.best, 2, 'the first B2 match is still unknown: only the 2 after it are proven');
      await rec('c4', 'c4a', 'w'); s = await st('c4'); assert.equal(s.sk.best, 3); assert.equal(s.sg, 1);
      await sparkApply('c4', 'M2', 'w'); s = await st('c4'); assert.equal(s.sg, 1); assert.equal(s.sk.best, 3, 'a queued Spark result replayed counts once');
      await sparkApply('c4', 'M9', 'w', true); s = await st('c4'); assert.equal(s.sk.best, 3, 'a late result with no open does not raise best'); assert.equal(s.sg, 2, 'but it is counted in the totals');
      console.log('PASS Spark + B2 mixed: official best is proven runs only; Spark queue replay counts once');
    }
    // ---- open save failure / late commit / full: the caller is told which, and only a proven open is evidence
    {
      const bad = env.bind(env.owner.db, { now: () => clk.t, wrap: (p, r) => (/\/stats$/.test(p) ? { transaction: () => Promise.reject(new Error('offline')) } : r) });
      clk.t = S(1) - 5000;
      const r1 = await bad.api.openMatch(acct('c5'), { id: rid('c5a'), kind: 'r', opponents: ['x'], startAt: S(1) });
      assert.equal(r1.saved, false); assert.equal(r1.status, 'failed'); assert(!(await st('c5')).ml, 'nothing was written');
      await rec('c5', 'c5a', 'w'); let s = await st('c5');
      assert.equal(s.streak, 1); assert.equal(s.ml.ev.lg, 0); assert(!s.maxStreak, 'a match whose start was never saved is never evidence');
      // committed AFTER the match began (the updater ran earlier, the commit was pending offline): saved, but not evidence
      const c2 = await env.open(); await env.env.withSecurityRulesDisabled((cx) => require('firebase/database').set(require('firebase/database').ref(cx.database(), 'games/factor/logins/c5/' + c2.uid), 'x'));
      const sb2 = env.bind(c2.db, { now: () => clk.t }); clk.t = S(2) - 5000;
      c2.db.goOffline();
      const pending = sb2.api.openMatch(acct('c5'), { id: rid('c5b'), kind: 'r', opponents: ['x'], startAt: S(2) });
      await sleep(600); clk.t = S(2) + 20000; c2.db.goOnline();                       // the commit reaches the server only after the start
      const r2 = await pending; assert.equal(r2.saved, true); assert(['opened', 'opened-late'].includes(r2.status), 'the updater re-runs on reconnect and sees it is late, or the proof demotes it: ' + r2.status);
      await rec('c5', 'c5b', 'w'); s = await st('c5'); assert.equal(flagOf(s, 'c5b'), 'u', 'confirmed after the start: demoted, not proof'); assert.equal(s.ml.ev.lg, 0);
      // an updater re-run (a concurrent writer) does not duplicate or lose the open
      await Promise.all([open('c5', 'c5c', 3), open('c5', 'c5c', 3, ['x'], sb2.api)]); s = await st('c5');
      assert.equal(Object.keys(s.ml.e).filter((k) => k === rid('c5c')).length, 1);
      console.log('PASS open proof: failure is reported, a commit after the start is saved but not evidence, a re-run keeps one open');
    }
    {   // full: more than OPEN_MAX unresolved opens -> reported as full (nothing written), play is not blocked, the result is still counted
      for (let i = 0; i < ML.OPEN_MAX; i++) await open('c13', 'c13o' + i, i + 1);
      const r = await open('c13', 'c13z', 99); assert.equal(r.saved, true); assert.equal(r.status, 'full');
      let s = await st('c13'); assert(!s.ml.e[rid('c13z')]); await rec('c13', 'c13z', 'w'); s = await st('c13');
      assert.equal(s.games, 1, 'counted'); assert.equal(flagOf(s, 'c13z'), 'u'); assert.equal(s.ml.ev.lg, 0);
      console.log('PASS open full: reported as full, the match is counted, never evidence');
    }
    // ---- 65+ late Spark result: counted in the totals, never a streak, never twice
    {
      const apply = (c, id, t, o, ctx) => env.owner.db.ref(`games/factor/accounts/${c}/stats`).transaction((s) => { s = s || {}; Keep.ensureKeep(s, { '.sv': 'timestamp' }); SS.apply(s, { id, t, o, s: 's' }, ctx); return s; });
      for (let i = 0; i < 70; i++) await apply('c14', 's-new' + i, T0 + 1e6 + i * 70000, 'w', { now: DONE });
      let s = await st('c14'); const n0 = s.sg; assert.equal(n0, 70); const best = s.sk.best;
      await apply('c14', 's-old', T0 - 1e6, 'w', { late: true, now: DONE }); s = await st('c14');
      assert.equal(s.sg, n0 + 1, 'the verified result is counted although the ledger cannot place it'); assert.equal(s.sWins, 71); assert.equal(s.sk.best, best, 'never a streak');
      assert.match(s.ml.e['s-old'], /\|sw[uL]\|/, 'recorded in the match log (idempotency marker)');
      await apply('c14', 's-old', T0 - 1e6, 'w', { late: true, now: DONE }); s = await st('c14'); assert.equal(s.sg, n0 + 1, 'a replay is not counted again');
      console.log('PASS 65+ late Spark result: counted once in the totals, never a streak, replay safe');
    }
    // ---- a 6.2 tab wrote the counters behind the log's back
    {
      await open('c6', 'c6a', 1); await rec('c6', 'c6a', 'w');
      await env.owner.db.ref('games/factor/accounts/c6/stats').transaction((s) => { if (!s) return s; s.games += 1; s.streak += 1; s.maxStreak = Math.max(s.maxStreak, s.streak); s.w = (s.w || 0) + 1; return s; });
      let s = await st('c6'); const held = s.maxStreak;
      await open('c6', 'c6b', 2); await rec('c6', 'c6b', 'w'); s = await st('c6');
      assert(Object.values(s.ml.e).some((v) => /\|rx\|/.test(v)), 'a gap was recorded'); assert(s.maxStreak >= held, 'the old client\'s value is held'); assert.equal(s.ml.ev.lg, 1, 'the run restarted after the gap');
      console.log('PASS 6.2 tab: counters changed behind the log become a gap; held values stay; evidence restarts');
    }
    // ---- two real clients start matches at the same time: server-serialised commits, nothing lost
    {
      const c2 = await env.open(), sb2 = env.bind(c2.db, { now: () => clk.t });
      await env.env.withSecurityRulesDisabled((cx) => require('firebase/database').set(require('firebase/database').ref(cx.database(), `games/factor/logins/c7/${c2.uid}`), 'x'));
      clk.t = S(0);
      await Promise.all(Array.from({ length: 12 }, (_, i) => (i % 2 ? A : sb2.api).openMatch(acct('c7'), { id: rid('c7m' + i), kind: 'r', opponents: ['x'], startAt: S(i + 30) })));
      const s = await st('c7'), es = ML.entries(s.ml);
      assert.equal(es.length, 12); assert.equal(new Set(es.map((e) => e.n)).size, 12, 'every start has its own commit number'); assert.equal(s.ml.n, 12);
      assert(es.every((e) => e.r === 'o' && e.f === ''), 'all opens are proven');
      console.log('PASS two clients: 12 simultaneous opens, unique numbers, nothing lost');
    }
    // ---- ghost-room style result (no match id): old behaviour
    {
      clk.t = DONE; await A.recordMatch(acct('c8'), { id: undefined, outcome: 'w', mode: 'B', dr: 0, exp: 10, perfects: 0, vs: vsOf('w', 'gh'), add: {}, max: {}, min: {}, or: {} });
      const s = await st('c8'); assert.equal(s.streak, 1); assert(!s.sk || !s.sk.best); assert.equal(s.exp, 10); assert.equal(s.games, 1);
      console.log('PASS ghost-style result: counters, EXP and the profile streak behave as before');
    }
    // ---- cap: 70 matches, one never resolved
    {
      await open('c9', 'c9z', 0); for (let i = 1; i <= 70; i++) { await open('c9', 'c9' + i, i); await rec('c9', 'c9' + i, 'w'); }
      const s = await st('c9'), size = JSON.stringify(s.ml).length;
      assert(Object.keys(s.ml.e).length <= ML.CAP, 'entries are capped'); assert(s.ml.f.ob.some((x) => x.startsWith(rid('c9z').slice(0, 14))), 'the unresolved open was kept (orphan), not dropped');
      assert(size <= 4500, 'size ' + size); assert.equal(ML.unresolved(s.ml), 1);
      await rec('c9', 'c9z', 'l'); assert.equal(ML.unresolved((await st('c9')).ml), 0);
      console.log('PASS cap: 64 entries, the unresolved open survives as an orphan and can still be resolved; ml bytes', size);
    }
    // ---- storage contention: opens, results and unrelated stats writers (EXP) from two real clients on one account
    {
      const c2 = await env.open(); await env.env.withSecurityRulesDisabled((cx) => require('firebase/database').set(require('firebase/database').ref(cx.database(), `games/factor/logins/c11/${c2.uid}`), 'x'));
      const sb2 = env.bind(c2.db, { now: () => clk.t }), exp = (db) => db.ref('games/factor/accounts/c11/stats').transaction((v) => (v ? { ...v, exp: (v.exp || 0) + 1 } : v));
      clk.t = S(0);
      await Promise.all(Array.from({ length: 10 }, (_, i) => Promise.all([(i % 2 ? sb2.api : A).openMatch(acct('c11'), { id: rid('c11m' + i), kind: 'r', opponents: ['x'], startAt: S(i + 1) }), exp(i % 2 ? c2.db : env.owner.db)])));
      clk.t = DONE;
      await Promise.all(Array.from({ length: 10 }, (_, i) => Promise.all([(i % 2 ? A : sb2.api).recordMatch(acct('c11'), info('c11m' + i, 'w', DONE, { vs: vsOf('w'), exp: 30 })), exp(i % 2 ? env.owner.db : c2.db)])));
      const s = await st('c11');
      assert.equal(s.games, 10); assert.equal(s.exp, 10 + 300 + 10, 'every EXP write survived'); assert.equal(ML.unresolved(s.ml), 0); assert.equal(Object.keys(s.ml.e).length, 10);
      assert.equal(s.ml.ev.lg, 10, 'ten proven wins in a row'); assert.equal(s.maxStreak, 10); assert.equal(s.sk.best, 10); assert(!Object.values(s.ml.e).some((v) => /\|rx\|/.test(v)), 'no false gap from our own concurrent writers');
      console.log('PASS contention: concurrent opens, results and EXP writes from two clients lose nothing, no false gap, evidence exact');
    }
    // ---- no side effects: EXP, rating of an ordinary match
    {
      await open('c10', 'c10a', 1); const r = await rec('c10', 'c10a', 'w', 'x', { exp: 30, dr: 5 }); const s = await st('c10');
      assert.equal(s.exp, 30); assert.equal(s.rating, 1505); assert.equal(s.games, 1); assert.equal(s.w, 1); assert.equal(r.exp.after, 30); assert.equal(s.streak, 1);
      console.log('PASS ordinary match: EXP, rating and counters unchanged by the log');
    }
  } finally { await env.close(); }
  process.exit(0);   // the extra SDK clients keep the event loop alive
})().catch((e) => { console.error(e); process.exit(1); });
