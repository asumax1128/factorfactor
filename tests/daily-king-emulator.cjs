// Emulator-only (demo project), real RTDB + the current candidate rules, the real client code (src/daily-client.cjs):
// 天下統一 (daily_king) is granted only for ONE JST day with all three divisions; separate days never add up.
const fs = require('node:fs'), assert = require('node:assert/strict'), firebase = require('firebase/compat/app');
require('firebase/compat/auth'); require('firebase/compat/database');
const { initializeTestEnvironment, assertSucceeds } = require('@firebase/rules-unit-testing'), { set, ref } = require('firebase/database');
const Daily = require('../src/daily-client.cjs'), D = Daily.model;
(async () => {
  assert.equal(process.env.GCLOUD_PROJECT, 'demo-factorfactor-tower');
  const rules = JSON.parse(fs.readFileSync('firebase/v525.candidate.rules.json'));
  const env = await initializeTestEnvironment({ projectId: process.env.GCLOUD_PROJECT, database: { host: '127.0.0.1', port: 9000, rules: JSON.stringify(rules) } });
  const app = firebase.initializeApp({ projectId: process.env.GCLOUD_PROJECT, apiKey: 'fixture', databaseURL: 'https://demo-factorfactor-tower.firebaseio.com' }, 'dk');
  try {
    app.auth().useEmulator('http://127.0.0.1:9099', { disableWarnings: true }); app.database().useEmulator('127.0.0.1', 9000);
    const { user } = await app.auth().signInAnonymously(), db = app.database(), uid = user.uid;
    const DIVS = ['easy', 'normal', 'hard'], B = D.epoch(Date.now()) - 40;
    const accounts = ['kgsame', 'kgdiff', 'kgtwo', 'kgnoday', 'kgbadday', 'kgretro', 'kgscan', 'kgcum', 'kgflags', 'kghold', 'kgdup', 'kgpre', 'other'];
    const fin = (key, day, extra = {}) => ({ score: 100, cleared: true, elapsed: 50000, correct: 9, confirmedAt: 1000, id: 'x', key, day, name: 'N', slot: 0, sortKey: 's', ...extra });
    const tree = { logins: Object.fromEntries(accounts.map((k) => [k, { [uid]: 'x' }])), accounts: Object.fromEntries(accounts.map((k) => [k, { name: k, stats: { exp: 7, nick: '' } }])), dailyV2: { finals: {}, playedDays: {}, awardCursor: {}, titles: {} } };
    const win = (day, winners) => { for (const d of DIVS) (tree.dailyV2.finals[day] ||= {})[d] = fin(winners[d], day); };
    const played = (k, ...days) => { for (const d of days) (tree.dailyV2.playedDays[k] ||= {})[d] = true; };
    const loser = 'other';
    // 0. same day, all three divisions, but BEFORE the release day (test records made before the public start)
    win(B + 30, { easy: 'kgpre', normal: 'kgpre', hard: 'kgpre' }); played('kgpre', B + 30);
    // 1. same day, all three divisions
    win(B + 1, { easy: 'kgsame', normal: 'kgsame', hard: 'kgsame' }); played('kgsame', B + 1);
    // 2. three divisions won on three different days (the old cumulative bug)
    win(B + 2, { easy: 'kgdiff', normal: loser, hard: loser }); win(B + 3, { easy: loser, normal: 'kgdiff', hard: loser }); win(B + 4, { easy: loser, normal: loser, hard: 'kgdiff' }); played('kgdiff', B + 2, B + 3, B + 4);
    // 3. only two divisions on one day
    win(B + 5, { easy: 'kgtwo', normal: 'kgtwo', hard: loser }); played('kgtwo', B + 5);
    // 4. the final carries no day / a different day
    win(B + 6, { easy: 'kgnoday', normal: 'kgnoday', hard: 'kgnoday' }); for (const d of DIVS) delete tree.dailyV2.finals[B + 6][d].day; played('kgnoday', B + 6);
    win(B + 7, { easy: 'kgbadday', normal: 'kgbadday', hard: 'kgbadday' }); tree.dailyV2.finals[B + 7].hard.day = B + 8; played('kgbadday', B + 7);
    // 5. retro by the day stored in all three division records (days already behind the cursor)
    win(B + 9, { easy: 'kgretro', normal: 'kgretro', hard: 'kgretro' }); played('kgretro', B + 9);
    tree.dailyV2.titles.kgretro = Object.fromEntries(Object.values(D.awardIds).map((id) => [id, { day: B + 9 }])); tree.dailyV2.awardCursor.kgretro = B + 9;
    // 6. retro by scanning played days: the stored first-win days differ, but one finalized day is a real triple
    win(B + 10, { easy: 'kgscan', normal: loser, hard: loser }); win(B + 11, { easy: loser, normal: 'kgscan', hard: loser }); win(B + 12, { easy: loser, normal: loser, hard: 'kgscan' }); win(B + 13, { easy: 'kgscan', normal: 'kgscan', hard: 'kgscan' });
    played('kgscan', B + 10, B + 11, B + 12, B + 13); tree.dailyV2.awardCursor.kgscan = B + 13;
    tree.dailyV2.titles.kgscan = { daily_easy_king: { day: B + 10 }, daily_normal_king: { day: B + 11 }, daily_hard_king: { day: B + 12 } };
    // 7. an unprovable past: three divisions on three days, all behind the cursor
    win(B + 14, { easy: 'kgcum', normal: loser, hard: loser }); win(B + 15, { easy: loser, normal: 'kgcum', hard: loser }); win(B + 16, { easy: loser, normal: loser, hard: 'kgcum' });
    played('kgcum', B + 14, B + 15, B + 16); tree.dailyV2.awardCursor.kgcum = B + 16;
    tree.dailyV2.titles.kgcum = { daily_easy_king: { day: B + 14 }, daily_normal_king: { day: B + 15 }, daily_hard_king: { day: B + 16 } };
    // 8. flags only: three bare division flags, no day and no finals at all
    tree.dailyV2.titles.kgflags = { daily_easy_king: true, daily_normal_king: true, daily_hard_king: true }; played('kgflags', B + 17); tree.dailyV2.awardCursor.kgflags = B + 17;
    // 9. an existing holder with no proof at all keeps the title
    tree.dailyV2.titles.kghold = { daily_king: true }; played('kghold', B + 18); tree.dailyV2.awardCursor.kghold = B + 18;
    // 10. duplicate processing
    win(B + 19, { easy: 'kgdup', normal: 'kgdup', hard: 'kgdup' }); played('kgdup', B + 19);
    await env.withSecurityRulesDisabled((c) => set(ref(c.database(), 'games/factor'), tree));
    const store = (m) => ({ getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => void m.set(k, String(v)), removeItem: (k) => void m.delete(k) });
    // the test days are in the past (before 2026-10-24 JST), so the release threshold is moved to the first test day for every scenario
    // except the dedicated pre-release checks, which use the real default
    const clientFor = (k, m = new Map(), kingFromDay = B) => ({ c: Daily.create({ db, uid, account: { key: k, name: k }, storage: store(m), kingFromDay }), m });
    const titles = async (k) => (await db.ref(`games/factor/dailyV2/titles/${k}`).get()).val() || {};
    const snapshotOthers = async () => { let out; await env.withSecurityRulesDisabled(async (c) => { out = JSON.stringify((await require('firebase/database').get(ref(c.database(), 'games/factor'))).val()); }); return out; };
    const before = JSON.parse(await snapshotOthers());

    // same day -> granted
    await clientFor('kgsame').c.awards();
    let t = await titles('kgsame'); assert.equal(t.daily_king, true); for (const id of Object.values(D.awardIds)) assert.equal(t[id].day, B + 1);
    console.log('PASS the same day, all three divisions: 天下統一 is granted');
    // different days -> not granted (the three division titles still are)
    await clientFor('kgdiff').c.awards(); await clientFor('kgdiff').c.awards();
    t = await titles('kgdiff'); assert.equal(t.daily_king, undefined); for (const id of Object.values(D.awardIds)) assert.ok(t[id]);
    console.log('PASS three divisions on three different days: the division titles are kept, 天下統一 is NOT granted');
    await clientFor('kgtwo').c.awards(); t = await titles('kgtwo'); assert.equal(t.daily_king, undefined); assert.ok(t.daily_easy_king && t.daily_normal_king && !t.daily_hard_king);
    console.log('PASS two divisions on one day: not granted');
    for (const k of ['kgnoday', 'kgbadday']) { await clientFor(k).c.awards(); assert.equal((await titles(k)).daily_king, undefined, k); }
    console.log('PASS a final with no day, or a different day: nothing is granted (no guessing)');
    // NO retroactive grant: days behind the cursor are never looked at, and the stored same-day title records alone grant nothing
    await clientFor('kgretro').c.awards(); assert.equal((await titles('kgretro')).daily_king, undefined);
    console.log('PASS no retro: a same-day triple behind the cursor (stored in the three title records) is NOT granted any more');
    const scan = clientFor('kgscan'); await scan.c.awards(); assert.equal((await titles('kgscan')).daily_king, undefined);
    const cum = clientFor('kgcum'); await cum.c.awards(); assert.equal((await titles('kgcum')).daily_king, undefined);
    assert.equal(cum.m.size, 0, 'no scan marker: the retroactive scan is gone'); await cum.c.awards(); assert.equal((await titles('kgcum')).daily_king, undefined);
    console.log('PASS no retro: nothing is scanned or remembered; unprovable and provable pasts alike are not granted');
    // release day threshold: with the real default (2026-10-24 JST) a same-day triple on a pre-release day grants nothing
    const pre = Daily.create({ db, uid, account: { key: 'kgpre', name: 'kgpre' }, storage: store(new Map()) });
    await pre.awards(); t = await titles('kgpre'); assert.equal(t.daily_king, undefined); for (const id of Object.values(D.awardIds)) assert.ok(t[id], 'the three division titles themselves are unaffected');
    await clientFor('kgpre', new Map(), D.epoch(Date.now()) - 40 + 31).c.awards(); assert.equal((await titles('kgpre')).daily_king, undefined, 'a threshold after the day also blocks it');
    console.log('PASS before the release day (default threshold 2026-10-24 JST) a same-day triple grants nothing; the division titles are unaffected');
    await clientFor('kgflags').c.awards(); t = await titles('kgflags'); assert.equal(t.daily_king, undefined);
    console.log('PASS three bare division flags without a proven day: not granted');
    await clientFor('kghold').c.awards(); assert.equal((await titles('kghold')).daily_king, true);
    console.log('PASS an existing 天下統一 is kept');
    const dup = clientFor('kgdup'); await Promise.all([dup.c.awards(), dup.c.awards(), clientFor('kgdup').c.awards()]); await dup.c.awards();
    t = await titles('kgdup'); assert.equal(t.daily_king, true); assert.equal(t.daily_easy_king.day, B + 19);
    console.log('PASS repeated and concurrent processing: granted once, nothing else changes');
    // nothing else moved
    const after = JSON.parse(await snapshotOthers());
    for (const k of accounts) assert.deepEqual(after.accounts[k], before.accounts[k], 'stats/nick untouched: ' + k);
    assert.deepEqual(after.dailyV2.finals, before.dailyV2.finals, 'finals untouched'); assert.deepEqual(after.dailyV2.playedDays, before.dailyV2.playedDays);
    assert.equal(after.dailyV2.titles.other, undefined, 'other accounts untouched');
    console.log('PASS finals, played days, stats and equipment are untouched');
    // documented residual risk: the CURRENT rules still accept a cumulative daily_king written by a Ver.5.25 client
    await env.withSecurityRulesDisabled((c) => set(ref(c.database(), 'games/factor/dailyV2/titles/kgcum'), { daily_easy_king: { day: B + 14 }, daily_normal_king: { day: B + 15 }, daily_hard_king: { day: B + 16 } }));
    await assertSucceeds(db.ref('games/factor/dailyV2/titles/kgcum/daily_king').set(true));
    console.log('NOTE residual risk (needs the production rules step): the current rules still accept a cumulative daily_king written by a Ver.5.25 client');
  } finally { await env.cleanup(); await app.delete(); }
})().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
