// Emulator-only (demo project), real RTDB + the current candidate rules: Ver.6.0 A4 writes stats.handiSelf next to the
// frozen tk, a Ver.5.25-style writer still writes handiWins, and nothing held is lost either way.
const fs = require('node:fs'), assert = require('node:assert/strict'), firebase = require('firebase/compat/app');
require('firebase/compat/auth'); require('firebase/compat/database');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing'), { set, ref } = require('firebase/database');
const Keep = require('../src/title-keep-next.cjs');
(async () => {
  assert.equal(process.env.GCLOUD_PROJECT, 'demo-factorfactor-tower');
  const rules = JSON.parse(fs.readFileSync('firebase/v525.candidate.rules.json'));
  const env = await initializeTestEnvironment({ projectId: process.env.GCLOUD_PROJECT, database: { host: '127.0.0.1', port: 9000, rules: JSON.stringify(rules) } });
  const app = firebase.initializeApp({ projectId: process.env.GCLOUD_PROJECT, apiKey: 'fixture', databaseURL: 'https://demo-factorfactor-tower.firebaseio.com' }, 'handi');
  try {
    app.auth().useEmulator('http://127.0.0.1:9099', { disableWarnings: true }); app.database().useEmulator('127.0.0.1', 9000);
    const { user } = await app.auth().signInAnonymously(); const db = app.database();
    const path = (k) => `games/factor/accounts/${k}/stats`;
    await env.withSecurityRulesDisabled((c) => set(ref(c.database(), 'games/factor'), {
      logins: { hold: { [user.uid]: 'x' }, fresh: { [user.uid]: 'x' } },
      accounts: {
        hold: { name: 'H', stats: { handiWins: 1, games: 9, exp: 5, nick: 'handi' } },
        fresh: { name: 'F', stats: { games: 2, exp: 1 } },
      },
    }));
    const stamp = { '.sv': 'timestamp' };
    // 6.0 result write: freeze first, then the new counter
    for (const k of ['hold', 'fresh']) {
      const r = await db.ref(path(k)).transaction((s) => { s = s || {}; Keep.ensureKeep(s, stamp); s.games = (s.games || 0) + 1; s.handiSelf = (s.handiSelf || 0) + 1; return s; });
      assert.ok(r.committed, k + ' committed under the current rules');
    }
    let h = (await db.ref(path('hold')).get()).val(), f = (await db.ref(path('fresh')).get()).val();
    assert.equal(h.handiSelf, 1); assert.equal(h.handiWins, 1); assert.equal(h.nick, 'handi'); assert.deepEqual(h.tk.ids, { handi: 1 });
    assert.equal(f.handiSelf, 1); assert.equal(f.handiWins, undefined); assert.equal(f.tk.ids, undefined);
    console.log('PASS 6.0 writes handiSelf beside the frozen tk; handiWins and the equipped title are untouched');
    // a Ver.5.25-style client keeps writing the old counter: accepted, and the frozen record is not rewritten
    const tkBefore = JSON.stringify(f.tk);
    await db.ref(path('fresh')).transaction((s) => { if (!s) return s; s.handiWins = (s.handiWins || 0) + 1; s.games += 1; return s; });
    f = (await db.ref(path('fresh')).get()).val();
    assert.equal(f.handiWins, 1); assert.equal(f.handiSelf, 1); assert.equal(JSON.stringify(f.tk), tkBefore);
    console.log('PASS a Ver.5.25-style writer still works; tk is not rewritten');
  } finally { await env.cleanup(); await app.delete(); }
})().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
