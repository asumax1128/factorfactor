// Emulator-only (demo project), real RTDB transactions + the current candidate rules:
// stats.tk / stats.tv2 are frozen once, from committed data, with a server timestamp, while other writers race.
const fs = require('node:fs'), assert = require('node:assert/strict'), firebase = require('firebase/compat/app');
require('firebase/compat/auth'); require('firebase/compat/database');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing'), { set, ref } = require('firebase/database');
const Keep = require('../src/title-keep-next.cjs');
(async () => {
  assert.equal(process.env.GCLOUD_PROJECT, 'demo-factorfactor-tower');
  const rules = JSON.parse(fs.readFileSync('firebase/v525.candidate.rules.json'));
  const env = await initializeTestEnvironment({ projectId: process.env.GCLOUD_PROJECT, database: { host: '127.0.0.1', port: 9000, rules: JSON.stringify(rules) } }), apps = [];
  try {
    for (const n of ['dev1', 'dev2', 'old525']) {
      const app = firebase.initializeApp({ projectId: process.env.GCLOUD_PROJECT, apiKey: 'fixture', databaseURL: 'https://demo-factorfactor-tower.firebaseio.com' }, 'tk-' + n);
      app.auth().useEmulator('http://127.0.0.1:9099', { disableWarnings: true }); app.database().useEmulator('127.0.0.1', 9000);
      const { user } = await app.auth().signInAnonymously(); apps.push({ n, db: app.database(), uid: user.uid, app });
    }
    const [d1, d2, old] = apps, path = (k) => `games/factor/accounts/${k}/stats`;
    const logins = Object.fromEntries(['ah', 'an'].map((k) => [k, Object.fromEntries(apps.map((a) => [a.uid, 'x']))]));
    await env.withSecurityRulesDisabled((c) => set(ref(c.database(), 'games/factor'), {
      logins,
      accounts: {
        ah: { name: 'AH', stats: { maxStreak: 12, handiWins: 1, games: 40, A: { w: 20 }, B: { w: 15 }, exp: 5, nick: 'streak10', vs: { ax: { w: 1, last: 'w' } } } },
        an: { name: 'AN', stats: { games: 3, w: 1, exp: 1 } },
      },
    }));
    const stamp = { '.sv': 'timestamp' };
    const freeze = (mutate = () => {}) => (s) => { s = s || {}; Keep.ensureKeep(s, stamp); mutate(s); return s; };
    // 1. two devices and a 5.25-style writer hit the same stats at once
    const results = await Promise.all([
      d1.db.ref(path('ah')).transaction(freeze()),
      d2.db.ref(path('ah')).transaction(freeze((s) => { s.exp = (s.exp || 0) + 1; })),
      old.db.ref(path('ah')).transaction((s) => { s = s || {}; s.maxStreak = 13; s.games = (s.games || 0) + 1; return s; }),
    ]);
    assert.ok(results.every((r) => r.committed));
    let v = (await d1.db.ref(path('ah')).get()).val();
    assert.equal(v.tk.v, 1); assert.equal(typeof v.tk.at, 'number', 'server timestamp was resolved'); assert.ok(v.tk.at > 1e12);
    assert.deepEqual(v.tk.ids, { handi: 1, streak10: 1 });
    assert.equal(v.tv2.v, 1); assert.equal(typeof v.tv2.since, 'number');
    assert.equal(v.tv2.base.games === 40 || v.tv2.base.games === 41, true, 'base is the legacy total of the data that was committed');
    assert.equal(v.nick, 'streak10'); assert.equal(v.vs.ax.last, 'w'); assert.equal(v.exp >= 6, true);
    console.log('PASS concurrent devices + a Ver.5.25-style writer: tk/tv2 frozen once with a server timestamp; nothing else lost');
    // 2. a later transaction (either device) leaves the frozen record untouched
    const frozen = JSON.stringify({ tk: v.tk, tv2: v.tv2 });
    await d2.db.ref(path('ah')).transaction(freeze((s) => { s.maxStreak = 60; }));
    v = (await d1.db.ref(path('ah')).get()).val();
    assert.equal(JSON.stringify({ tk: v.tk, tv2: v.tv2 }), frozen);
    assert.deepEqual(Keep.keptIds(v), ['handi', 'streak10']);
    assert.equal(Keep.held(v, 'streak30'), true, 'A1 keeps the legacy-live condition; tk only adds protection');
    console.log('PASS a valid tk is never rewritten, even when the counters move on');
    // 3. non-holder: empty ids are dropped by RTDB and the record still counts as frozen
    await d1.db.ref(path('an')).transaction(freeze());
    v = (await d1.db.ref(path('an')).get()).val();
    assert.deepEqual(Object.keys(v.tk).sort(), ['at', 'v']); assert.equal(Keep.validKeep(v.tk), true);
    const at = v.tk.at;
    await d2.db.ref(path('an')).transaction(freeze((s) => { s.exp = (s.exp || 0) + 1; }));
    v = (await d1.db.ref(path('an')).get()).val();
    assert.equal(v.tk.at, at, 'no rewrite on the next transaction'); assert.equal(v.w, 1); assert.equal(v.games, 3);
    console.log('PASS a non-holder is frozen as empty and not rewritten');
    // 4. a corrupted tk written by anyone is ignored and rebuilt from the legacy counters
    await d1.db.ref(path('ah') + '/tk').set({ v: 1, ids: { handi: 0 } });
    await d1.db.ref(path('ah')).transaction(freeze());
    v = (await d1.db.ref(path('ah')).get()).val();
    assert.deepEqual(v.tk.ids, { handi: 1, streak10: 1, streak30: 1, streak50: 1 });
    console.log('PASS an unusable tk is rebuilt from the legacy counters, never emptied');
    // 5. A1b freezeOnLogin against the real database
    await env.withSecurityRulesDisabled((c) => set(ref(c.database(), 'games/factor/accounts'), {
      al1: { name: 'L1', stats: { maxStreak: 33, handiWins: 1, games: 12, A: { w: 5 }, B: { w: 4 }, nick: 'streak10', exp: 3 } },
      al2: { name: 'L2', stats: { games: 2, w: 1 } },
      al3: { name: 'L3' },
      al4: { name: 'L4', stats: { maxStreak: 10, games: 10 } },
    }));
    await env.withSecurityRulesDisabled((c) => set(ref(c.database(), 'games/factor/logins'), Object.fromEntries(['al1', 'al2', 'al3', 'al4', 'ah', 'an'].map((k) => [k, Object.fromEntries(apps.map((a) => [a.uid, 'x']))]))));
    const st = (k) => `games/factor/accounts/${k}/stats`;
    const login = (a, k) => Keep.freezeOnLogin({ db: a.db, key: k, stamp });
    const [r1, r2] = await Promise.all([login(d1, 'al1'), login(d2, 'al1')]);
    assert.ok(['frozen', 'present'].includes(r1.status) && ['frozen', 'present'].includes(r2.status), JSON.stringify([r1, r2]));
    v = (await d1.db.ref(st('al1')).get()).val();
    assert.deepEqual(v.tk.ids, { handi: 1, streak10: 1, streak30: 1 }); assert.equal(typeof v.tk.at, 'number'); assert.deepEqual(v.tv2.base, { games: 12, Aw: 5, Bw: 4 });
    assert.equal(v.nick, 'streak10'); assert.equal(v.exp, 3);
    const at1 = v.tk.at;
    assert.deepEqual(await login(d1, 'al1'), { status: 'present' });
    assert.equal((await d2.db.ref(st('al1')).get()).val().tk.at, at1, 'a later login rewrites nothing');
    console.log('PASS login freeze on two devices at once: frozen once, equipment and stats intact, then no rewrite');
    assert.deepEqual(await login(d1, 'al2'), { status: 'frozen' });
    v = (await d1.db.ref(st('al2')).get()).val(); assert.deepEqual(Object.keys(v.tk).sort(), ['at', 'v']); assert.equal(v.w, 1);
    assert.deepEqual(await login(d1, 'al2'), { status: 'present' });
    console.log('PASS a player without a legacy title is frozen as empty, once');
    assert.deepEqual(await login(d1, 'al3'), { status: 'empty' });
    assert.equal((await d1.db.ref('games/factor/accounts/al3/stats').get()).exists(), false, 'no stats are created for an account that has none');
    console.log('PASS an account without stats is not written');
    // 5.25 style writer racing the login freeze
    const [fr, ol] = await Promise.all([login(d1, 'al4'), old.db.ref(st('al4')).transaction((s) => { s = s || {}; s.maxStreak = 50; s.games = (s.games || 0) + 1; return s; })]);
    assert.equal(ol.committed, true); assert.equal(fr.status, 'frozen');
    v = (await d1.db.ref(st('al4')).get()).val();
    assert.equal(Keep.held(v, 'streak10'), true); assert.equal(v.maxStreak, 50);
    assert.equal(Keep.validKeep(v.tk) && Keep.validTv2(v.tv2), true);
    console.log('PASS a Ver.5.25-style writer racing the login freeze: nothing lost, record valid');
    // a device that is not logged in to the account cannot write: reported as failed, nothing written
    await env.withSecurityRulesDisabled((c) => set(ref(c.database(), 'games/factor/accounts/al5'), { name: 'L5', stats: { maxStreak: 12 } }));
    const denied = await login(d1, 'al5');
    assert.equal(denied.status, 'failed'); assert.match(denied.code, /^[A-Za-z0-9_.:-]{1,40}$/);
    assert.equal(Object.keys((await d1.db.ref(st('al5')).get()).val()).sort().join(), 'maxStreak');
    console.log('PASS without account login rights the write is refused: reported, nothing written');
  } finally { await env.cleanup(); await Promise.all(apps.map((a) => a.app.delete())); }
})().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
