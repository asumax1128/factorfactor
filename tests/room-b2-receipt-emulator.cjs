// Emulator-only (demo project): the late-receipt path of the room B2 safe leave against a real RTDB with the current candidate rules.
// Uses the REAL recordMatch from index.html (idempotent roomSeen, ledger ordered by match time) and the real rules for who may read/write what.
const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict'), firebase = require('firebase/compat/app');
require('firebase/compat/auth'); require('firebase/compat/database');
const { initializeTestEnvironment, assertFails } = require('@firebase/rules-unit-testing'), { set, ref } = require('firebase/database');
const Streak = require('../src/streak-next.cjs'), Keep = require('../src/title-keep-next.cjs'), Labels = require('../src/title-labels-next.cjs');
const html = fs.readFileSync('index.html', 'utf8');
const cut = (a, b) => { const i = html.indexOf(a), j = html.indexOf(b, i); assert(i >= 0 && j > i, a); return html.slice(i, j); };
const jst = (t) => new Date(t + 9 * 3600e3).toISOString().slice(0, 10), DAY = 86400000;
(async () => {
  assert.equal(process.env.GCLOUD_PROJECT, 'demo-factorfactor-tower');
  const env = await initializeTestEnvironment({ projectId: process.env.GCLOUD_PROJECT, database: { host: '127.0.0.1', port: 9000, rules: fs.readFileSync('firebase/v525.candidate.rules.json', 'utf8') } });
  const mkApp = async (name) => { const app = firebase.initializeApp({ projectId: process.env.GCLOUD_PROJECT, apiKey: 'fixture', databaseURL: 'https://demo-factorfactor-tower.firebaseio.com' }, name); app.auth().useEmulator('http://127.0.0.1:9099', { disableWarnings: true }); app.database().useEmulator('127.0.0.1', 9000); const { user } = await app.auth().signInAnonymously(); return { app, db: app.database(), uid: user.uid }; };
  const host = await mkApp('rr-host'), guest = await mkApp('rr-guest');
  try {
    const code = '4601', gid = 'G1', now = Date.now(), matchAt = now - 2 * DAY, tomorrow = jst(now + DAY);
    await env.withSecurityRulesDisabled((c) => set(ref(c.database(), 'games/factor'), {
      logins: { ah: { [host.uid]: 'x' }, ag: { [guest.uid]: 'x' } },
      accounts: { ah: { name: 'Host', stats: { games: 1 } }, ag: { name: 'Guest', stats: { games: 1, lastDay: tomorrow, dayStreak: 4, maxDayStreak: 4, sk: { v: 1, n: 1, best: 1, n0: 0, l: { 'r-NEW': { t: now - 1000, o: 'w', s: 'r' } } } } } },
      rooms: { [code]: { meta: { host: host.uid, createdAt: now }, players: { [host.uid]: { name: 'Host', joinedAt: 1 }, [guest.uid]: { name: 'Guest', joinedAt: 2 } }, state: { phase: 'play', rules: 'b2', gid },
        b2: { [gid]: { clock: now, revision: 3, accounts: { [host.uid]: 'ah', [guest.uid]: 'ag' }, game: { id: gid, ids: [host.uid, guest.uid], startAt: matchAt - 90000, time: matchAt, result: { winner: host.uid } } } } } },
    }));
    // rules: a participant who left (presence removed) can still read the match node, but can never write it; nobody writes another account's stats
    await guest.db.ref(`games/factor/rooms/${code}/players/${guest.uid}`).remove();
    const node = (await guest.db.ref(`games/factor/rooms/${code}/b2/${gid}`).get()).val(); assert.equal(node.game.result.winner, host.uid); assert.equal(node.accounts[guest.uid], 'ag');
    await assertFails(guest.db.ref(`games/factor/rooms/${code}/b2/${gid}/game/result`).set({ winner: guest.uid }));
    await assertFails(guest.db.ref('games/factor/accounts/ah/stats/games').set(99));
    console.log('PASS rules: a participant who left can read the settled match, cannot write it, and cannot write another account');
    const mk = (db, flaky) => {
      const sandbox = { window: { TitleKeepNext: Keep, StreakNext: Streak }, titleLabelOf: (id) => Labels.resolve(id, null), isReal: () => true, DBX: null, RATING_INIT: 1500, jstDate: jst, fbNow: () => Date.now(), SEASON0: '2026-10', seasonKey: () => '2026-10', seasonReset: (r) => r, FX: { band() {}, confetti() {} }, fxSound() {}, setTimeout: (f) => f(), console: { warn() {} }, prevWeek: () => '', B2_RCPT: { at: { [gid]: matchAt }, failed: {} }, FB: { db: flaky ? { ref: () => ({ transaction: async () => { throw new Error('NETWORK'); } }) } : db } };
      vm.createContext(sandbox);
      vm.runInContext(cut('const BADGES = [', 'function AchievementAuditPanel') + '\n' + cut('async function statsTx(acct, fn)', 'const wkOf = s =>') + '\n' + cut('async function recordMatch(acct, info)', '/* ---------- 効果音') + '\n' + cut('const prevDate = d =>', 'async function claimMission(acct, row, rows)') + '\nthis.api = { recordMatch };', sandbox);
      return sandbox;
    };
    const info = () => ({ id: gid, outcome: 'w', mode: 'B', dr: 5, exp: 30, perfects: 0, vs: [], add: {}, max: {}, min: {}, or: {}, sk: { id: `r-${code}-${gid}`, t: Date.now(), o: 'w', s: 'r' } });
    const stats = async () => (await guest.db.ref('games/factor/accounts/ag/stats').get()).val();
    const bad = mk(guest.db, true); const failed = await bad.api.recordMatch({ key: 'ag' }, info());
    assert.equal(failed.failed, true); assert.equal(bad.B2_RCPT.failed[gid], true); assert.equal((await stats()).games, 1, 'a failed save changed nothing');
    // two devices / a retry deliver the same settled match at the same time: counted exactly once
    const good = mk(guest.db), good2 = mk(guest.db);
    const rs = await Promise.all([good.api.recordMatch({ key: 'ag' }, info()), good2.api.recordMatch({ key: 'ag' }, info()), good.api.recordMatch({ key: 'ag' }, info())]);
    assert(rs.every((r) => !r.failed)); const st = await stats();
    assert.equal(st.games, 2, 'exactly one match was added'); assert(st.roomSeen[gid]); assert.equal(st.exp, 30, 'EXP added once');
    assert.equal(st.sk.l[`r-${code}-${gid}`].t, matchAt, 'ledger uses the real match time'); assert.equal(st.sk.l['r-NEW'].t, now - 1000);
    assert.equal(st.sk.n, Streak.replay(0, Streak.ordered(st.sk.l)).n, 'run equals a replay in match-time order'); assert.equal(st.sk.best, 1, 'a late arrival never raises best');
    assert.equal(st.lastDay, tomorrow, 'the newer day record is not rewound'); assert.equal(st.dayStreak, 4);
    console.log('PASS recordMatch (real RTDB): a failed save is flagged and changes nothing; concurrent/retried receipts count once; match time and day records stay ordered');
  } finally { await env.cleanup(); await host.app.delete(); await guest.app.delete(); }
})().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
