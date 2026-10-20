// Emulator-only (demo project), REAL Firebase SDK: the late-receipt save acknowledgement (Ver.6.3 stage 1).
// The REAL recordMatch / flushOnlineLearn / missionEvent / b2Confirm from index.html run against the RTDB emulator.
// A receipt is complete only when server-confirmed no-op transactions show the idempotency marks (never the local cache).
const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict'), firebase = require('firebase/compat/app');
require('firebase/compat/auth'); require('firebase/compat/database');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing'), { set, ref } = require('firebase/database');
const Streak = require('../src/streak-next.cjs'), Keep = require('../src/title-keep-next.cjs'), Labels = require('../src/title-labels-next.cjs');
const html = fs.readFileSync('index.html', 'utf8');
const cut = (a, b) => { const i = html.indexOf(a), j = html.indexOf(b, i); assert(i >= 0 && j > i, a); return html.slice(i, j); };
const fn = (head) => { const i = html.indexOf(head); assert(i >= 0, head); const j = html.indexOf('\n}\n', i); return html.slice(i, j + 3); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms)), DAY = 86400000, jst = (t) => new Date(t + 9 * 3600e3).toISOString().slice(0, 10);
const pending = (p, ms = 700) => Promise.race([p.then(() => false, () => false), sleep(ms).then(() => true)]);   // true = still unresolved
(async () => {
  assert.equal(process.env.GCLOUD_PROJECT, 'demo-factorfactor-tower');
  const env = await initializeTestEnvironment({ projectId: process.env.GCLOUD_PROJECT, database: { host: '127.0.0.1', port: 9000, rules: fs.readFileSync('firebase/v525.candidate.rules.json', 'utf8') } });
  let n = 0;
  const mkApp = async () => { const app = firebase.initializeApp({ projectId: process.env.GCLOUD_PROJECT, apiKey: 'fixture', databaseURL: 'https://demo-factorfactor-tower.firebaseio.com' }, 'ack' + (n++)); app.auth().useEmulator('http://127.0.0.1:9099', { disableWarnings: true }); app.database().useEmulator('127.0.0.1', 9000); const { user } = await app.auth().signInAnonymously(); return { app, db: app.database(), uid: user.uid }; };
  const apps = [];
  const open = async () => { const a = await mkApp(); apps.push(a); return a; };
  const seedUsers = [await open(), await open(), await open(), await open(), await open(), await open(), await open()];
  try {
    const now = Date.now();
    const accountKeys = ['t1', 't2', 't3', 't4', 't5', 't6', 't7'];
    await env.withSecurityRulesDisabled((c) => set(ref(c.database(), 'games/factor'), {
      logins: Object.fromEntries(accountKeys.map((k, i) => [k, { [seedUsers[i].uid]: 'x', [seedUsers[(i + 1) % 7].uid]: 'x' }])),
      accounts: Object.fromEntries(accountKeys.map((k) => [k, { name: k, stats: { games: 1, exp: 100 }, prof: { lv: {} } }])),
    }));
    // the real functions, bound to a client's db
    const bind = (db, wrap) => {
      const real = db, d = wrap ? { ref: (p) => wrap(p, real.ref(p)) } : real;
      const sandbox = { window: { TitleKeepNext: Keep, StreakNext: Streak }, titleLabelOf: (id) => Labels.resolve(id, null), isReal: () => true, DBX: null, RATING_INIT: 1500, jstDate: (t = Date.now()) => jst(t), fbNow: () => Date.now(), SEASON0: '2026-10', seasonKey: () => jst(Date.now()).slice(0, 7), seasonReset: (r) => r, FX: { band() {}, confetti() {} }, fxSound() {}, setTimeout: (f, ms) => (ms ? setTimeout(f, ms) : f()), console: { warn() {} }, prevWeek: () => '',
        B2_RCPT: { at: {}, failed: {} }, MISBUS: new Set(), MIS_LS: 'mis', loadLS: () => null, saveLS() {}, missionsFor: () => [], FB: { db: d } };
      vm.createContext(sandbox);
      vm.runInContext(cut('const BADGES = [', 'function AchievementAuditPanel') + '\n' + cut('async function statsTx(acct, fn)', 'const wkOf = s =>') + '\n' + fn('async function b2Confirm') + '\n' + cut('async function recordMatch(acct, info)', '/* ---------- 効果音') + '\n' + cut('const prevDate = d =>', 'async function claimMission(acct, row, rows)') + '\n' + fn('function applyLearn') + '\n' + fn('function applyMis') + '\nconst misRef = acct => FB.db.ref(`games/factor/accounts/${acct.key}/mis`);\n' + fn('async function missionEvent') + '\n' + fn('async function flushOnlineLearn') + '\nthis.api = { recordMatch, flushOnlineLearn, b2Confirm, missionEvent };', sandbox);
      return sandbox;
    };
    const info = (gid) => ({ id: gid, outcome: 'w', mode: 'B', dr: 5, exp: 30, perfects: 0, vs: [], add: {}, max: {}, min: {}, or: {}, sk: { id: 'r-C-' + gid, t: Date.now(), o: 'w', s: 'r' } });
    const rows = [{ lv: 1, ok: true, ms: 900, j: 'Perfect', pid: 'p1' }, { lv: 2, ok: false, ms: 1200, pid: 'p2' }];
    // one receipt attempt = what the receipt screen's BattleGame does (record + learning/mission) ...
    const attempt = (sb, key, gid) => Promise.all([sb.api.recordMatch({ key }, info(gid)), sb.api.flushOnlineLearn({ key }, 'room:' + gid, rows, { battle: 1, win: 1, combo: 1 })]);
    const attemptS = (sb, key, gid) => Promise.allSettled([sb.api.recordMatch({ key }, info(gid)), sb.api.flushOnlineLearn({ key }, 'room:' + gid, rows, { battle: 1, win: 1, combo: 1 })]);
    const read = async (a, key, p) => (await a.db.ref(`games/factor/accounts/${key}/${p}`).get()).val();
    const day = jst(now);
    // the receipt screen re-confirms every second for up to 15 s (the mission step is queued only after the learning save commits)
    const loop = async (sb, key, gid, d) => { let r; for (let i = 0; i < 40; i++) { r = await sb.api.b2Confirm({ key }, gid, d); if (r.ok) return r; await sleep(300); } return r; };
    // ---- T1: an un-acknowledged local change is readable through get(); it is NOT a server save and must not complete the receipt
    {
      const a = seedUsers[0], b = seedUsers[3], key = 't1', gid = 'T1'; const sb = bind(a.db);
      const keep = a.db.ref(`games/factor/accounts/${key}/stats`); keep.on('value', () => {}); await sleep(400);
      a.db.goOffline();
      const work = attempt(sb, key, gid), confirm = sleep(300).then(() => sb.api.b2Confirm({ key }, gid, day)); await sleep(500);
      const local = (await a.db.ref(`games/factor/accounts/${key}/stats`).get()).val();
      assert(local && local.roomSeen && local.roomSeen[gid], 'precondition: the optimistic mark is visible to the local get()');
      const server = await read(b, key, 'stats'); assert(!server.roomSeen, 'an independent client sees no mark: nothing is saved on the server');
      assert.equal(await pending(confirm, 600), true, 'the confirmation does not complete while offline, although get() shows the mark');
      a.db.goOnline(); await work; const first = await confirm; const ok = first.ok ? first : await loop(sb, key, gid, day); assert.equal(ok.ok, true, JSON.stringify(ok));
      const s2 = await read(b, key, 'stats'); assert(s2.roomSeen[gid]); assert.equal(s2.games, 2); assert.equal((await read(b, key, 'mis')).s['room:' + gid], 1);
      keep.off(); console.log('PASS T1: un-ACKed local changes are visible to get() but the confirmation waits for the server');
    }
    // ---- T2: the browser is killed before the ACK; nothing is on the server; the next receipt completes it exactly once
    {
      const a = seedUsers[1], b = seedUsers[4], key = 't2', gid = 'T2'; const sb = bind(a.db);
      a.db.goOffline(); attempt(sb, key, gid).catch(() => {}); await sleep(400); await a.app.delete(); apps.splice(apps.indexOf(a), 1); await sleep(300);
      let s = await read(b, key, 'stats'); assert(!s.roomSeen && s.games === 1, 'after the kill the server has nothing');
      const c = await open(), sc = bind(c.db);
      await env.withSecurityRulesDisabled((cx) => set(ref(cx.database(), `games/factor/logins/${key}/${c.uid}`), 'x'));
      await attempt(sc, key, gid); const ok = await loop(sc, key, gid, day); assert.equal(ok.ok, true);
      s = await read(b, key, 'stats'); assert.equal(s.games, 2); assert.equal(s.exp, 130, 'counted once');
      console.log('PASS T2: a kill before the ACK leaves nothing; the retry completes once');
    }
    // ---- T3: stats ok, learning fails -> confirmation fails (prof); the retry adds only the missing part
    {
      const a = seedUsers[2], key = 't3', gid = 'T3';
      const bad = bind(a.db, (p, r) => /\/prof$/.test(p) ? { transaction: async () => { throw new Error('NETWORK'); } } : r);
      const good = bind(a.db); await attemptS(bad, key, gid); const miss = await good.api.b2Confirm({ key }, gid, day); assert.deepEqual([miss.ok, miss.why], [false, 'prof']);
      let s = await read(a, key, 'stats'); assert.equal(s.games, 2, 'the stats part was saved'); const exp1 = s.exp;
      await attempt(good, key, gid); const ok = await loop(good, key, gid, day); assert.equal(ok.ok, true);
      s = await read(a, key, 'stats'); assert.equal(s.games, 2, 'no double count'); assert.equal(s.exp, exp1); const p = await read(a, key, 'prof'); assert(p.onlineLearnSeen['room:' + gid]); assert.equal(p.lv.L1.n, 1, 'learning applied once');
      console.log('PASS T3: partial failure (learning) then retry: only the missing part is saved');
    }
    // ---- T4: learning committed, the mission fails -> the retry applies the mission once; progress and the mark are one record
    {
      const a = seedUsers[3], key = 't4', gid = 'T4';
      const bad = bind(a.db, (p, r) => /\/mis$/.test(p) ? { transaction: async () => { throw new Error('NETWORK'); } } : r);
      const good = bind(a.db); await attempt(bad, key, gid); const miss = await good.api.b2Confirm({ key }, gid, day); assert.deepEqual([miss.ok, miss.why], [false, 'mis']);
      assert((await read(a, key, 'prof')).onlineLearnSeen['room:' + gid], 'the learning mark exists, the mission was lost: the old design could not recover here');
      await attempt(good, key, gid); await attempt(good, key, gid);
      const ok = await loop(good, key, gid, day); assert.equal(ok.ok, true, JSON.stringify(ok));
      const m = await read(a, key, 'mis'); assert.equal(m.s['room:' + gid], 1); assert.equal(m.p.battle, 1, 'progress added once even after repeated retries'); assert.equal(m.d, day);
      console.log('PASS T4: mission failure after the learning save: retried once; progress + mark in one record');
    }
    // ---- T5: two independent SDK clients receive the same match at the same time
    {
      const a = seedUsers[4], b = seedUsers[5], key = 't5', gid = 'T5'; const sa = bind(a.db), sb = bind(b.db);
      await Promise.all([attempt(sa, key, gid), attempt(sb, key, gid), attempt(sa, key, gid)]);
      const [ca, cb] = await Promise.all([loop(sa, key, gid, day), loop(sb, key, gid, day)]); assert(ca.ok && cb.ok);
      const s = await read(a, key, 'stats'), p = await read(a, key, 'prof'), m = await read(a, key, 'mis');
      assert.equal(s.games, 2); assert.equal(s.exp, 130); assert.equal(p.lv.L1.n, 1); assert.equal(m.p.battle, 1);
      console.log('PASS T5: two independent clients: stats, EXP, learning and mission counted once');
    }
    // ---- T6: a match from another day / unknown time never adds to today's mission; the confirmation treats it as not applicable
    {
      const a = seedUsers[6], key = 't6'; const sb = bind(a.db);
      for (const [gid, at] of [['T6old', now - 2 * DAY], ['T6unk', null]]) {
        sb.B2_RCPT.at[gid] = at; await attempt(sb, key, gid);
        const ok = await loop(sb, key, gid, at == null ? null : jst(at)); assert.equal(ok.ok, true, gid);
      }
      const m = await read(a, key, 'mis'); assert(!m || !m.s, 'no mission progress or mark was written for them');
      console.log('PASS T6: other-day / unknown-time matches are not added to today\'s mission');
    }
  } finally { await env.cleanup(); for (const a of apps) await a.app.delete().catch(() => {}); }
})().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
