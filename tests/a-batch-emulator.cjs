// Emulator-only (demo project): the REAL statsTx / recordMatch / BADGES from index.html against a real RTDB with the
// current candidate rules. Covers the stats writes added in Ver.6.0 step 9 (A4 handiSelf, A5 misRun, ...).
const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict'), firebase = require('firebase/compat/app');
require('firebase/compat/auth'); require('firebase/compat/database');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing'), { set, ref } = require('firebase/database');
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
    const sandbox = { window: { TitleKeepNext: Keep }, titleLabelOf: (id) => Labels.resolve(id, null), isReal: () => true, DBX: null, RATING_INIT: 1500, SEASON0: '2026-10', seasonKey: () => '2026-10', seasonReset: (r) => r, FX: { band() {}, confetti() {} }, fxSound() {}, setTimeout: (f) => f(), console: { warn() {} }, prevWeek: () => '', FB: { db } };
    vm.createContext(sandbox);
    vm.runInContext(cut('const BADGES = [', 'function AchievementAuditPanel') + '\n' + cut('async function statsTx(acct, fn)', 'const wkOf = s =>') + '\n' + cut('async function recordMatch(acct, info)', '/* ---------- 効果音') + '\n' + cut('const prevDate = d =>', 'async function claimMission(acct, row, rows)') + '\nthis.api = { badgesOf, statsTx, recordMatch, misRunStep };', sandbox);
    const api = sandbox.api, path = (k) => `games/factor/accounts/${k}/stats`;
    const accts = { m1: {}, m2: { misDays: 9, games: 4, nick: 'mis7' }, h1: { games: 3 }, h2: { handiWins: 1, games: 8, nick: 'handi' } };
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
  } finally { await env.cleanup(); await app.delete(); }
})().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
