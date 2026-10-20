// Emulator-only (demo project), REAL Firebase SDK: the match log (stats.ml) with the real recordMatch / openMatch from index.html and the real Spark apply.
// Ver.6.3: the four Codex findings (late draw / receipt order / 60 s grace / loss older than the ledger) end to end, plus concurrency, a 6.2 tab, failure and cap.
const { start, info, sleep, assert, MatchLog: ML } = require('./room-b2-emulator-lib.cjs'), SS = require('../src/spark-stats-next.cjs'), Keep = require('../src/title-keep-next.cjs');
(async () => {
  const now = Date.now(), startAt = now + 60000;
  const keys = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10', 'c11'];
  const seed = (k) => (k === 'c3' ? { stats: { games: 12, w: 8, l: 4, streak: 5, maxStreak: 7, revenges: 2, sk: { v: 1, n: 5, best: 9, n0: 0, l: {} } } }
    : k === 'c6' ? { stats: { games: 4, streak: 2, maxStreak: 2 } } : { stats: { games: 0 } });
  const env = await start(keys, seed);
  try {
    const sb = env.bind(env.owner.db), A = sb.api;
    const acct = (k) => ({ key: k }), vsOf = (o, who = 'x') => [{ key: who, o }];
    const gidOf = (c, n) => `${c}${n}`, rid = (g) => 'r-C-' + g;
    const open = (c, g, opp = ['x']) => A.openMatch(acct(c), { id: rid(g), kind: 'r', opponents: opp, startAt });
    const rec = (c, g, o, who = 'x', extra = {}) => A.recordMatch(acct(c), info(g, o, now, { vs: vsOf(o, who), ...extra }));
    const st = (c) => env.read(c, 'stats');

    // ---- Codex #1: a late DRAW between a loss and a win (old logic: revenge 1)
    {
      for (const [g] of [['L'], ['D'], ['W']]) assert.equal(await open('c1', 'c1' + g), true, 'the open is confirmed by the server');
      await rec('c1', 'c1L', 'l'); await rec('c1', 'c1W', 'w');
      let s = await st('c1'); assert(!s.revenges, 'the unknown match in between: no revenge yet'); assert.equal(s.vs.x.w, 1);
      await rec('c1', 'c1D', 'd'); s = await st('c1');
      assert(!s.revenges, 'the late draw sits between: never a revenge'); assert.equal(s.games, 3); assert.equal(s.vs.x.d, 1);
      // idempotent: a retry of the same receipt changes nothing
      await rec('c1', 'c1D', 'd'); assert.equal((await st('c1')).games, 3);
      console.log('PASS Codex#1: a late draw never makes a revenge (real SDK); retries count once');
    }
    // ---- Codex #2: receipt-order inversion: W W [L late] W W (true max 2)
    {
      const seq = [['1', 'w'], ['2', 'w'], ['3', 'l'], ['4', 'w'], ['5', 'w']];
      for (const [n] of seq) await open('c2', gidOf('c2', n));
      for (const [n, o] of seq.filter(([n]) => n !== '3')) await rec('c2', gidOf('c2', n), o);
      let s = await st('c2'); assert.equal(s.maxStreak || 0, 2, 'an unresolved match in the middle separates the run'); assert.equal(s.sk.best, 2);
      await rec('c2', 'c23', 'l'); s = await st('c2');
      assert.equal(s.maxStreak, 2); assert.equal(s.sk.best, 2); assert.equal(s.streak, 2); assert.equal(s.ml.ev.lg, 2);
      console.log('PASS Codex#2: arrival order neither gives a false max streak nor misses one (legacy and official)');
    }
    // ---- Codex #3/#4: existing data, a late unplaced loss, a result with no open (prompt) and one that is too late
    {
      const before = await st('c3');
      await A.recordMatch(acct('c3'), (() => { sb.B2_RCPT.at.late1 = now - 86400e3; return info('late1', 'l', now - 86400e3, { vs: vsOf('l', 'z') }); })());
      let s = await st('c3');
      assert.equal(s.streak, 5, 'a late result with no place does not erase the existing streak'); assert.equal(s.maxStreak, 7); assert.equal(s.revenges, 2); assert.equal(s.sk.best, 9);
      await rec('c3', 'p1', 'w', 'z'); s = await st('c3');
      assert.equal(s.streak, 6, 'a prompt result with no open still moves the profile streak (no regression for old-style rooms)'); assert.equal(s.maxStreak, 7, 'but it is never evidence');
      assert.equal(s.ml.ev.lg, 0); assert.equal(before.exp === undefined, true);
      // a new opened match: progress continues from the pre-migration streak, evidence counts only the new run
      await open('c3', 'c3n'); await rec('c3', 'c3n', 'w', 'q'); s = await st('c3');
      assert.equal(s.streak, 7); assert.equal(s.ml.ev.lg, 1); assert.equal(s.maxStreak, 7);
      console.log('PASS Codex#3/#4: no time grace, an unplaced loss changes nothing, old records are held, the old streak is not evidence');
    }
    // ---- official streak with Spark and B2 mixed (queued Spark results, B2 result late)
    {
      const sparkOpen = (c, m) => env.owner.db.ref(`games/factor/accounts/${c}/stats`).transaction((s) => { s = s || {}; Keep.ensureKeep(s, { '.sv': 'timestamp' }); ML.open(s, { id: 's-' + m, kind: 's', startAt, now: Date.now() }); return s; });
      const sparkApply = (c, m, o) => env.owner.db.ref(`games/factor/accounts/${c}/stats`).transaction((s) => { s = s || {}; Keep.ensureKeep(s, { '.sv': 'timestamp' }); SS.apply(s, { id: 's-' + m, t: now, o, s: 's' }, { late: false }); return s; });
      await open('c4', 'c4a'); await sparkOpen('c4', 'M2'); await open('c4', 'c4c');
      await sparkApply('c4', 'M2', 'w'); await rec('c4', 'c4c', 'w');
      let s = await st('c4'); assert.equal(s.sk.best, 2, 'the first B2 match is still unknown: only the 2 after it are proven');
      await rec('c4', 'c4a', 'w'); s = await st('c4'); assert.equal(s.sk.best, 3); assert.equal(s.sg, 1);
      // a queued Spark result replayed (same id): counted once
      await sparkApply('c4', 'M2', 'w'); s = await st('c4'); assert.equal(s.sg, 1); assert.equal(s.sk.best, 3);
      // a Spark result with no open that arrives late is never evidence
      await sparkApply('c4', 'M9', 'w'); s = await st('c4'); assert.equal(s.sk.best, 3, 'late result with no open does not raise best');
      console.log('PASS Spark + B2 mixed: official best is proven runs only; Spark queue replay counts once');
    }
    // ---- open save failure: not confirmed -> false; the match is still recorded (as unproven) and gives no evidence
    {
      const bad = env.bind(env.owner.db, { wrap: (p, r) => (/\/stats$/.test(p) ? { transaction: () => Promise.reject(new Error('offline')) } : r) });
      assert.equal(await bad.api.openMatch(acct('c5'), { id: rid('c5a'), kind: 'r', opponents: ['x'], startAt }), false, 'a failed save is reported');
      assert(!(await st('c5')).ml, 'nothing was written');
      await rec('c5', 'c5a', 'w'); const s = await st('c5');
      assert.equal(s.streak, 1); assert.equal(s.ml.ev.lg, 0); assert(!s.maxStreak);
      // a late open (after the start time) is a known match but not evidence
      await A.openMatch(acct('c5'), { id: rid('c5b'), kind: 'r', opponents: ['x'], startAt: now - 1000 }); await rec('c5', 'c5b', 'w');
      assert.equal((await st('c5')).ml.ev.lg, 0);
      console.log('PASS open save failure: reported, nothing written, the match is recorded but is not evidence');
    }
    // ---- a 6.2 tab wrote the counters behind the log's back
    {
      await open('c6', 'c6a'); await rec('c6', 'c6a', 'w');
      await env.owner.db.ref('games/factor/accounts/c6/stats').transaction((s) => { if (!s) return s; s.games += 1; s.streak += 1; s.maxStreak = Math.max(s.maxStreak, s.streak); s.w = (s.w || 0) + 1; return s; });   // the old client's recordMatch
      let s = await st('c6'); const held = s.maxStreak;
      await open('c6', 'c6b'); await rec('c6', 'c6b', 'w'); s = await st('c6');
      assert(Object.values(s.ml.e).some((v) => /\|rx\|/.test(v)), 'a gap was recorded'); assert(s.maxStreak >= held, 'the old client\'s value is held'); assert.equal(s.ml.ev.lg, 1, 'the run restarted after the gap');
      console.log('PASS 6.2 tab: counters changed behind the log become a gap; held values stay; evidence restarts');
    }
    // ---- two real clients start matches at the same time: server-serialised order, nothing lost
    {
      const c2 = await env.open(), db2 = c2.db, sb2 = env.bind(db2);
      await env.env.withSecurityRulesDisabled((cx) => require('firebase/database').set(require('firebase/database').ref(cx.database(), `games/factor/logins/c7/${c2.uid}`), 'x'));   // the same account on a second device
      await Promise.all(Array.from({ length: 12 }, (_, i) => (i % 2 ? A : sb2.api).openMatch(acct('c7'), { id: rid('c7m' + i), kind: 'r', opponents: ['x'], startAt })));
      const s = await st('c7'), es = ML.entries(s.ml);
      assert.equal(es.length, 12); assert.equal(new Set(es.map((e) => e.n)).size, 12, 'every start has its own server-ordered number');
      assert.equal(s.ml.n, 12); assert(es.every((e) => e.r === 'o' && !e.f), 'all opens are proven');
      console.log('PASS two clients: 12 simultaneous opens, unique numbers, nothing lost');
    }
    // ---- ghost-room style result (no official id): profile streak moves, official best does not
    {
      await A.recordMatch(acct('c8'), { id: undefined, outcome: 'w', mode: 'B', dr: 0, exp: 10, perfects: 0, vs: vsOf('w', 'gh'), add: {}, max: {}, min: {}, or: {} });
      const s = await st('c8'); assert.equal(s.streak, 1); assert(!s.sk || !s.sk.best); assert.equal(s.exp, 10); assert.equal(s.games, 1);
      console.log('PASS ghost-style result: counters, EXP and the profile streak behave as before; no official evidence');
    }
    // ---- cap: 70 matches, one never resolved
    {
      await open('c9', 'c9z'); for (let i = 0; i < 70; i++) { await open('c9', 'c9' + i); await rec('c9', 'c9' + i, 'w'); }
      const s = await st('c9'), size = JSON.stringify(s.ml).length;
      assert(Object.keys(s.ml.e).length <= ML.CAP, 'entries are capped'); assert(s.ml.f.ob.some((x) => x.startsWith(rid('c9z').slice(0, 14))), 'the unresolved open was kept (orphan), not dropped');
      assert(size <= 4200, 'size ' + size); assert.equal(ML.unresolved(s.ml), 1);
      await rec('c9', 'c9z', 'l'); assert.equal(ML.unresolved((await st('c9')).ml), 0);
      console.log('PASS cap: 64 entries, the unresolved open survives as an orphan and can still be resolved; ml bytes', size);
    }
    // ---- storage contention: opens, results and unrelated stats writers (EXP) at the same time from two real clients on one account
    {
      const c2 = await env.open(); await env.env.withSecurityRulesDisabled((cx) => require('firebase/database').set(require('firebase/database').ref(cx.database(), `games/factor/logins/c11/${c2.uid}`), 'x'));
      const sb2 = env.bind(c2.db), exp = (db) => db.ref('games/factor/accounts/c11/stats').transaction((v) => (v ? { ...v, exp: (v.exp || 0) + 1 } : v));
      await Promise.all(Array.from({ length: 10 }, (_, i) => Promise.all([(i % 2 ? sb2.api : A).openMatch(acct('c11'), { id: rid('c11m' + i), kind: 'r', opponents: ['x'], startAt }), exp(i % 2 ? c2.db : env.owner.db)])));
      await Promise.all(Array.from({ length: 10 }, (_, i) => Promise.all([(i % 2 ? A : sb2.api).recordMatch(acct('c11'), info('c11m' + i, 'w', now, { vs: vsOf('w'), exp: 30 })), exp(i % 2 ? env.owner.db : c2.db)])));
      const s = await st('c11');
      assert.equal(s.games, 10); assert.equal(s.exp, 10 + 300 + 10, 'every EXP write survived'); assert.equal(ML.unresolved(s.ml), 0); assert.equal(Object.keys(s.ml.e).length, 10);
      assert.equal(s.ml.ev.lg, 10, 'ten proven wins in a row'); assert.equal(s.maxStreak, 10); assert.equal(s.sk.best, 10); assert(!Object.values(s.ml.e).some((v) => /\|rx\|/.test(v)), 'no false gap from our own concurrent writers');
      console.log('PASS contention: concurrent opens, results and EXP writes from two clients lose nothing, no false gap, evidence exact');
    }
    // ---- no side effects: EXP, rating, bounty counters of an ordinary match are the same as before
    {
      await open('c10', 'c10a'); const r = await rec('c10', 'c10a', 'w', 'x', { exp: 30, dr: 5 }); const s = await st('c10');
      assert.equal(s.exp, 30); assert.equal(s.rating, 1505); assert.equal(s.games, 1); assert.equal(s.w, 1); assert.equal(r.exp.after, 30); assert.equal(s.streak, 1);
      console.log('PASS ordinary match: EXP, rating and counters unchanged by the log');
    }
  } finally { await env.close(); }
  process.exit(0);   // the extra SDK client keeps the event loop alive
})().catch((e) => { console.error(e); process.exit(1); });
