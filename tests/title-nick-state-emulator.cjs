// Emulator-only (demo project), real RTDB semantics + the current candidate rules:
// the three equip states of stats/nick  ( id = equipped / "" = explicitly unequipped / absent = legacy ranking title shown ).
const fs = require('node:fs'), assert = require('node:assert/strict'), firebase = require('firebase/compat/app');
require('firebase/compat/auth'); require('firebase/compat/database');
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing'), { set, ref } = require('firebase/database');
const T = require('../src/title-client-next.cjs');
(async () => {
  assert.equal(process.env.GCLOUD_PROJECT, 'demo-factorfactor-tower');
  const rules = JSON.parse(fs.readFileSync('firebase/v525.candidate.rules.json'));
  rules.rules.games.factor.titleNextV1 = JSON.parse(fs.readFileSync('firebase/title-client.fragment.rules.json'));
  const env = await initializeTestEnvironment({ projectId: process.env.GCLOUD_PROJECT, database: { host: '127.0.0.1', port: 9000, rules: JSON.stringify(rules) } }), apps = [];
  try {
    for (const n of ['owner', 'stranger']) {
      const app = firebase.initializeApp({ projectId: process.env.GCLOUD_PROJECT, apiKey: 'fixture', databaseURL: 'https://demo-factorfactor-tower.firebaseio.com' }, 'nk-' + n);
      app.auth().useEmulator('http://127.0.0.1:9099', { disableWarnings: true }); app.database().useEmulator('127.0.0.1', 9000);
      const { user } = await app.auth().signInAnonymously(); apps.push({ n, app, db: app.database(), uid: user.uid });
    }
    const [o, s] = apps, nick = (db) => db.ref('games/factor/accounts/ap/stats/nick');
    await env.withSecurityRulesDisabled((c) => set(ref(c.database(), 'games/factor'), {
      logins: { ap: { [o.uid]: 'x' } },
      accounts: { ap: { name: 'AP', stats: { nick: 'first', w: 3, exp: 10, maxRating: 1500, games: 5 } } },
      dailyV2: { titles: { ap: { daily_easy_king: { day: '20261001' } } } },
      onlineSparkV1: { profiles: { ap: { easy: { maxRating: 1500 }, normal: { maxRating: 1500 }, title: 'easy_adept' } } },
    }));
    // 1. "" is storable by the owner under the current rules and reads back as an existing empty string (not absent)
    await assertSucceeds(nick(o.db).set(''));
    let v = await nick(o.db).get();
    assert.equal(v.exists(), true); assert.strictEqual(v.val(), ''); assert.equal(typeof v.val(), 'string');
    assert.strictEqual((await o.db.ref('games/factor/accounts/ap/stats').get()).val().nick, '', 'inside the whole stats object too');
    console.log('PASS "" is accepted by the current rules and read back as an existing empty string');
    // 2. other writes to stats keep it (all existing writers are read-modify-write transactions of the whole stats object)
    const r = await o.db.ref('games/factor/accounts/ap/stats').transaction((st) => { st = st || {}; st.exp = (st.exp || 0) + 5; return st; });
    assert.equal(r.committed, true); assert.strictEqual(r.snapshot.val().nick, ''); assert.equal(r.snapshot.val().exp, 15);
    console.log('PASS a stats transaction (exp etc.) preserves the explicit-unequip marker');
    // 3. existing rule still applies: a daily king needs its dailyV2 proof, "" and ordinary ids are not blocked
    await assertSucceeds(nick(o.db).set('daily_easy_king'));
    await assertFails(nick(o.db).set('daily_hard_king'));
    await assertSucceeds(nick(o.db).set('easy_master'));
    await assertSucceeds(nick(o.db).set(''));
    console.log('PASS the existing daily-king proof rule is unchanged; "" and other ids are allowed');
    // 4. absent is a different state again, and an unrelated writer cannot change it
    await assertFails(nick(s.db).set('first'));
    await assertSucceeds(nick(o.db).set(null));
    v = await nick(o.db).get(); assert.equal(v.exists(), false); assert.strictEqual(v.val(), null);
    assert.equal((await o.db.ref('games/factor/onlineSparkV1/profiles/ap/title').get()).val(), 'easy_adept', 'profile.title is never touched by nick writes');
    console.log('PASS absent differs from "", strangers cannot write, profile.title is independent');
    // 5. the one-time cutover snapshot never records the new marker as a legacy equip
    await assertSucceeds(nick(o.db).set(''));
    const rr = await T.sync({ db: o.db, account: { key: 'ap', name: 'AP' }, computeBadgeIds: () => ['first'] });
    assert.equal(rr.frozen, true);
    const snap = (await o.db.ref('games/factor/titleNextV1/snapshots/ap').get()).val();
    assert.equal(snap.equipped, undefined, 'snapshots.equipped is not written for the cleared marker');
    assert.deepEqual(Object.keys(snap.earned).sort(), ['first']);
    const after = (await nick(o.db).get()).val(); assert.strictEqual(after, '', 'sync never touches stats/nick');
    console.log('PASS snapshot freeze ignores the "" marker and does not touch stats/nick');
  } finally { await Promise.all(apps.map((a) => a.app.delete())); await env.cleanup(); }
})().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => setTimeout(() => process.exit(process.exitCode || 0), 100));
