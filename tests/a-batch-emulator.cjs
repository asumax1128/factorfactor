// Emulator-only (demo project): the REAL statsTx / recordMatch / BADGES from index.html against a real RTDB with the
// current candidate rules. Covers the stats writes added in Ver.6.0 step 9 (A4 handiSelf, A5 misRun, ...).
const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict'), firebase = require('firebase/compat/app');
require('firebase/compat/auth'); require('firebase/compat/database');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing'), { set, ref } = require('firebase/database');
const Streak = require('../src/streak-next.cjs'), Queue = require('../src/streak-queue-next.cjs');
const Keep = require('../src/title-keep-next.cjs'), Labels = require('../src/title-labels-next.cjs');
const html = fs.readFileSync('index.html', 'utf8');
const cut = (a, b) => { const i = html.indexOf(a), j = html.indexOf(b, i); assert(i >= 0 && j > i, a); return html.slice(i, j); };
(async () => {
  assert.equal(process.env.GCLOUD_PROJECT, 'demo-factorfactor-tower');
  const rules = JSON.parse(fs.readFileSync('firebase/v525.candidate.rules.json'));
  const env = await initializeTestEnvironment({ projectId: process.env.GCLOUD_PROJECT, database: { host: '127.0.0.1', port: 9000, rules: JSON.stringify(rules) } });
  const app = firebase.initializeApp({ projectId: process.env.GCLOUD_PROJECT, apiKey: 'fixture', databaseURL: 'https://demo-factorfactor-tower.firebaseio.com' }, 'abatch');
  try {
    app.auth().useEmulator('http://127.0.0.1:9099', { disableWarnings: true }); app.database().useEmulator('127.0.0.1', 9000);
    const { user } = await app.auth().signInAnonymously(); const db = app.database();
    const sandbox = { window: { TitleKeepNext: Keep, StreakNext: Streak }, titleLabelOf: (id) => Labels.resolve(id, null), isReal: () => true, DBX: null, RATING_INIT: 1500, SEASON0: '2026-10', seasonKey: () => '2026-10', seasonReset: (r) => r, FX: { band() {}, confetti() {} }, fxSound() {}, setTimeout: (f) => f(), console: { warn() {} }, prevWeek: () => '', FB: { db } };
    vm.createContext(sandbox);
    vm.runInContext(cut('const BADGES = [', 'function AchievementAuditPanel') + '\n' + cut('async function statsTx(acct, fn)', 'const wkOf = s =>') + '\n' + cut('async function recordMatch(acct, info)', '/* ---------- 効果音') + '\n' + cut('const prevDate = d =>', 'async function claimMission(acct, row, rows)') + '\nthis.api = { badgesOf, statsTx, recordMatch, misRunStep };', sandbox);
    const api = sandbox.api, path = (k) => `games/factor/accounts/${k}/stats`;
    const accts = { m1: {}, m2: { misDays: 9, games: 4, nick: 'mis7' }, h1: { games: 3 }, h2: { handiWins: 1, games: 8, nick: 'handi' }, s1: { games: 2 }, s2: { maxStreak: 31, games: 40, nick: 'streak30' }, s3: { games: 2 }, c1: { games: 3, cancelFull: 499 }, c2: { games: 9, cancelTotal: 2600, nick: 'cancel2000' }, n1: { games: 95, A: { w: 10 }, B: { w: 4 }, maxRating: 1500 } };
    await env.withSecurityRulesDisabled((c) => set(ref(c.database(), 'games/factor'), {
      logins: Object.fromEntries(Object.keys(accts).map((k) => [k, { [user.uid]: 'x' }])),
      accounts: Object.fromEntries(Object.entries(accts).map(([k, s]) => [k, { name: k, stats: { games: 1, ...s } }])),
    }));
    const get = async (k) => (await db.ref(path(k)).get()).val();
    const has = (st, id) => [...api.badgesOf(st).map((b) => b.id)].includes(id);
    // A5: seven consecutive days -> mis7; a gap restarts; the old holder keeps it
    for (const d of ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06']) await api.statsTx({ key: 'm1' }, (s) => { s.misDays = (s.misDays || 0) + 1; api.misRunStep(s, d); });
    assert.equal(has(await get('m1'), 'mis7'), false);
    const r7 = await api.statsTx({ key: 'm1' }, (s) => { s.misDays = (s.misDays || 0) + 1; api.misRunStep(s, '2026-10-07'); });
    assert.equal(r7.got.some((b) => b.id === 'mis7'), true);
    let v = await get('m1'); assert.equal(v.misRun.best, 7); assert.equal(v.tk.v, 1);
    await Promise.all([1, 2].map(() => api.statsTx({ key: 'm1' }, (s) => { api.misRunStep(s, '2026-10-08'); })));
    v = await get('m1'); assert.equal(v.misRun.n, 8, 'the same day twice from two devices counts once');
    console.log('PASS A5 (real RTDB): 7 consecutive days acquire mis7; the same day twice counts once');
    await api.statsTx({ key: 'm2' }, (s) => { s.misDays = (s.misDays || 0) + 1; api.misRunStep(s, '2026-10-01'); });
    v = await get('m2'); assert.equal(has(v, 'mis7'), true); assert.equal(v.tk.ids.mis7, 1); assert.equal(v.nick, 'mis7');
    console.log('PASS A5 (real RTDB): an old holder keeps mis7 and the equipped title');
    // A4: self ★★★ win grants; handiWins never moves; a holder is untouched
    const info = (add, o = {}) => ({ outcome: 'w', mode: 'B', dr: 8, exp: 30, perfects: 0, vs: [], add, max: {}, min: {}, or: {}, ...o });
    const rr = await api.recordMatch({ key: 'h1' }, info({ handiSelf: 1 }));
    v = await get('h1'); assert.equal(v.handiSelf, 1); assert.equal(v.handiWins, undefined); assert.equal(has(v, 'handi'), true);
    assert.equal(rr.badges.some((b) => b.id === 'handi'), true);
    await api.recordMatch({ key: 'h2' }, info({}, { outcome: 'l' }));
    v = await get('h2'); assert.equal(v.handiWins, 1); assert.equal(v.tk.ids.handi, 1); assert.equal(v.nick, 'handi'); assert.equal(has(v, 'handi'), true);
    console.log('PASS A4 (real RTDB): handiSelf grants; the old holder keeps handi, handiWins and equipment');
    // A7: official streak through real transactions
    const T0 = 1_800_000_000_000, room = (n, o) => info({}, { outcome: o, sk: { id: 'r-R-' + n, t: T0 + n * 60000, o, s: 'r' } });
    let last;
    for (let i = 0; i < 10; i++) { last = await api.recordMatch({ key: 's1' }, room(i, 'w')); if (i < 9) assert.equal(last.badges.some((b) => b.id === 'streak10'), false); }
    assert.equal(last.badges.some((b) => b.id === 'streak10'), true);
    v = await get('s1'); assert.equal(v.sk.best, 10); assert.equal(has(v, 'streak10'), true);
    await Promise.all([0, 1].map(() => api.recordMatch({ key: 's1' }, room(10, 'w'))));
    v = await get('s1'); assert.equal(v.sk.n, 11, 'the same match from two devices counts once');
    console.log('PASS A7 (real RTDB): 10 wins grant streak10 once; one match from two devices counts once');
    await api.recordMatch({ key: 's2' }, room(1, 'l'));
    v = await get('s2'); assert.equal(has(v, 'streak10') && has(v, 'streak30'), true); assert.deepEqual(Object.keys(v.tk.ids).sort(), ['streak10', 'streak30']); assert.equal(v.nick, 'streak30');
    console.log('PASS A7 (real RTDB): an old streak holder keeps the titles and the equipped title');
    // Spark hand-over: two devices flush the same queued result; a 5.25-style writer races; the room result 2 s earlier with another outcome restarts
    const mem = () => { const m = new Map(); return { getItem: (k) => m.has(k) ? m.get(k) : null, setItem: (k, x) => m.set(k, String(x)), removeItem: (k) => m.delete(k) }; };
    const shared = mem(); shared.setItem('fxf_sk_queue_v1:s3', JSON.stringify([{ id: 's-m1', t: T0 + 100000, o: 'w', s: 's' }]));
    const qa = Queue.create({ db, key: 's3', storage: shared }), qb = Queue.create({ db, key: 's3', storage: shared });
    await Promise.all([qa.flush(), qb.flush(), db.ref(path('s3')).transaction((s) => { if (!s) return s; s.maxStreak = 40; return s; })]);
    v = await get('s3'); assert.equal(Object.keys(v.sk.l).length, 1); assert.equal(v.sk.n, 1); assert.equal(v.maxStreak, 40); assert.equal(qa.pending() + qb.pending(), 0);
    await api.recordMatch({ key: 's3' }, room(0, 'l')); // t = T0 (not within 5 s of the Spark result)
    qa.enqueue({ id: 's-m2', t: T0 + 100000 + 3000, o: 'l', s: 's' }); await qa.flush();
    v = await get('s3'); assert.equal(v.sk.n, 0);
    console.log('PASS A7 (real RTDB): Spark queue flushes once across devices; a 5.25-style writer does not disturb it; unordered results restart');
    // A8: complete-cancellation count
    const rc = await api.recordMatch({ key: 'c1' }, info({ cancelFull: 1, cancelTotal: 3 }));
    v = await get('c1'); assert.equal(v.cancelFull, 500); assert.equal(rc.badges.some((b) => b.id === 'cancel500'), true); assert.equal(has(v, 'cancel2000'), false);
    await api.recordMatch({ key: 'c2' }, info({ cancelFull: 1, cancelTotal: 2 }, { outcome: 'l' }));
    v = await get('c2'); assert.equal(has(v, 'cancel2000') && has(v, 'cancel500'), true); assert.equal(v.cancelTotal, 2602); assert.equal(v.nick, 'cancel2000'); assert.deepEqual(Object.keys(v.tk.ids).sort(), ['cancel2000', 'cancel500']);
    console.log('PASS A8 (real RTDB): 500 complete cancellations grant cancel500; the old amount holder keeps both titles and the equipped title');
    // A9: Spark results through the real queue and real transactions
    const mem2 = () => { const m = new Map(); return { getItem: (k) => m.has(k) ? m.get(k) : null, setItem: (k, x) => m.set(k, String(x)), removeItem: (k) => m.delete(k) }; };
    const st9 = mem2(), q9 = Queue.create({ db, key: 'n1', storage: st9 });
    q9.enqueue({ kind: 'ratings', id: 'rt-n1', e: 1590, n: 1500 });
    for (let i = 0; i < 6; i++) q9.enqueue({ id: 's-g' + i, t: T0 + 500000 + i * 70000, o: 'w', s: 's', m: 'B', re: 1600 + i });
    await q9.flush();
    v = await get('n1');
    assert.equal(v.sg, 6); assert.equal(v.sw.B, 6); assert.equal(v.sx.e, 1605);
    assert.equal(has(v, 'games100'), true, '95 room + 6 Spark games'); assert.equal(has(v, 'dual'), true, 'A 10 + B 4 room + 6 Spark B wins');
    assert.equal(has(v, 'master1600'), true); assert.equal(has(v, 'master1700'), false);
    const q9b = Queue.create({ db, key: 'n1', storage: st9 });
    for (let i = 0; i < 6; i++) q9b.enqueue({ id: 's-g' + i, t: T0 + 500000 + i * 70000, o: 'w', s: 's', m: 'B' });
    await q9b.flush(); v = await get('n1'); assert.equal(v.sg, 6); assert.equal(v.sw.B, 6);
    console.log('PASS A9 (real RTDB): Spark games / wins by method / rating mirror land once and unlock games100, dual and the rating titles; resends add nothing');
  } finally { await env.cleanup(); await app.delete(); }
})().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
