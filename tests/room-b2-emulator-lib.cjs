// Shared helper for the room B2 late-receipt emulator tests: the REAL functions from index.html bound to a REAL SDK client.
const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict'), firebase = require('firebase/compat/app');
require('firebase/compat/auth'); require('firebase/compat/database');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing'), { set, ref } = require('firebase/database');
const Streak = require('../src/streak-next.cjs'), Keep = require('../src/title-keep-next.cjs'), Labels = require('../src/title-labels-next.cjs');
let Order = null; try { Order = require('../src/stats-order-next.cjs'); } catch (e) {}
const html = fs.readFileSync('index.html', 'utf8');
const cut = (a, b) => { const i = html.indexOf(a), j = html.indexOf(b, i); assert(i >= 0 && j > i, a); return html.slice(i, j); };
const fn = (head) => { const i = html.indexOf(head); assert(i >= 0, head); const j = html.indexOf('\n}\n', i); return html.slice(i, j + 3); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms)), DAY = 86400000, jst = (t) => new Date(t + 9 * 3600e3).toISOString().slice(0, 10);
async function start(accountKeys, seed) {
  assert.equal(process.env.GCLOUD_PROJECT, 'demo-factorfactor-tower');
  const env = await initializeTestEnvironment({ projectId: process.env.GCLOUD_PROJECT, database: { host: '127.0.0.1', port: 9000, rules: fs.readFileSync('firebase/v525.candidate.rules.json', 'utf8') } });
  let n = 0; const apps = [];
  const open = async () => { const app = firebase.initializeApp({ projectId: process.env.GCLOUD_PROJECT, apiKey: 'fixture', databaseURL: 'https://demo-factorfactor-tower.firebaseio.com' }, 'ord' + Math.random().toString(36).slice(2) + (n++)); app.auth().useEmulator('http://127.0.0.1:9099', { disableWarnings: true }); app.database().useEmulator('127.0.0.1', 9000); const { user } = await app.auth().signInAnonymously(); const a = { app, db: app.database(), uid: user.uid }; apps.push(a); return a; };
  const owner = await open(); // owns every account (login mapping) and reads the results
  await env.withSecurityRulesDisabled((c) => set(ref(c.database(), 'games/factor'), {
    logins: Object.fromEntries(accountKeys.map((k) => [k, { [owner.uid]: 'x' }])),
    accounts: Object.fromEntries(accountKeys.map((k) => [k, { name: k, ...(seed(k)) }])),
  }));
  const bind = (db, { wrap, order = true, now = () => Date.now(), globals = {} } = {}) => {
    const d = wrap ? { ref: (p) => wrap(p, db.ref(p)) } : db;
    const sandbox = { window: { TitleKeepNext: Keep, StreakNext: Streak, ...(order && Order ? { StatsOrderNext: Order } : {}) }, titleLabelOf: (id) => Labels.resolve(id, null), isReal: () => true, DBX: null, RATING_INIT: 1500,
      jstDate: (t = now()) => jst(t), fbNow: () => now(), SEASON0: '2026-10', seasonKey: (t = now()) => jst(t).slice(0, 7), seasonReset: (r) => (r <= 1500 ? 1500 : Math.round((1500 + (r - 1500) * 0.5) * 10) / 10),
      FX: { band() {}, confetti() {} }, fxSound() {}, setTimeout: (f, ms) => (ms ? setTimeout(f, ms) : f()), console: { warn() {} }, prevWeek: () => '',
      B2_RCPT: { at: {}, failed: {}, note: {} }, MISBUS: new Set(), MIS_LS: 'mis', loadLS: () => null, saveLS() {}, missionsFor: () => [], FB: { db: d }, ...globals };
    vm.createContext(sandbox);
    vm.runInContext(cut('const BADGES = [', 'function AchievementAuditPanel') + '\n' + cut('async function statsTx(acct, fn)', 'const wkOf = s =>') + '\n' + fn('async function b2Confirm') + '\n' + cut('async function recordMatch(acct, info)', '/* ---------- 効果音') + '\n' + cut('const prevDate = d =>', 'async function claimMission(acct, row, rows)') + '\n' + fn('function applyLearn') + '\n' + fn('function applyMis') + '\nconst misRef = acct => FB.db.ref(`games/factor/accounts/${acct.key}/mis`);\n' + fn('async function missionEvent') + '\n' + fn('async function flushOnlineLearn') + '\nthis.api = { recordMatch, flushOnlineLearn, b2Confirm, missionEvent, badgesOf };', sandbox);
    return sandbox;
  };
  const read = async (key, p) => (await owner.db.ref(`games/factor/accounts/${key}/${p}`).get()).val();
  return { env, open, owner, bind, read, close: async () => { await env.cleanup(); for (const a of apps) await a.app.delete().catch(() => {}); } };
}
const info = (gid, o = 'w', t = Date.now(), extra = {}) => ({ id: gid, outcome: o, mode: 'B', dr: 5, exp: 30, perfects: 0, vs: [], add: {}, max: {}, min: {}, or: {}, sk: { id: 'r-C-' + gid, t, o, s: 'r' }, ...extra });
module.exports = { start, info, sleep, DAY, jst, assert, Streak, Order };
