// Client-judged titles through the real profile screen (mock Firebase, no rules): freeze, award, reload, no stats/nick writes.
const assert = require('node:assert/strict'), fs = require('node:fs');
const { chromium, context } = require('./browser-harness.cjs');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium' });
  try {
    const stats = { rating: 1500, maxRating: 1500, games: 20, w: 12, l: 6, d: 2, exp: 900, nick: 'tour1', tourWins: 1, maxStreak: 4, skin: { tile: 'wood' } };
    const profiles = { ateacher: { name: 'Teacher', easy: { rating: 1700, maxRating: 1830, games: 20, w: 12, l: 6, d: 2 }, normal: { rating: 1600, maxRating: 1729.99, games: 5, w: 3, l: 2, d: 0 } } };
    const tree = { games: { factor: { accounts: { ateacher: { name: 'Teacher', stats: structuredClone(stats) } }, onlineSparkV1: { profiles } } } };
    const t = await context(b, { tree }), p = t.page;
    const open = async () => {
      await p.locator('.account-main').click();
      await p.locator('[data-next-profile]').waitFor();
      await p.getByRole('tab', { name: '称号・装備' }).click();
      await p.locator('[data-title-inventory]').waitFor();
    };
    const state = async (id) => p.locator(`[data-title-id="${id}"] small`).innerText();
    await open();
    // easy peak 1830 proves 初級の覇者(easy_adept) and 初級の覇王(easy_master); normal 1729.99 proves nothing (no rounding up)
    await p.waitForFunction(() => /取得済み/.test(document.querySelector('[data-title-id="easy_master"] small')?.textContent || ''));
    assert.match(await state('easy_adept'), /取得済み/);
    assert.match(await state('normal_adept'), /未取得/, 'raw 1729.99 must not round up to 1730');
    assert.match(await state('normal_master'), /未取得/);
    assert.match(await state('dual_master'), /未取得/);
    assert.match(await state('tour1'), /取得済み/, 'legacy title is still shown');
    const writes = t.writes.map((x) => x.path);
    assert(writes.some((x) => x === 'games/factor/titleNextV1/snapshots/ateacher'), 'legacy state frozen once');
    assert(writes.includes('games/factor/titleNextV1/awards/ateacher/easy_master'));
    assert(!writes.some((x) => /accounts\/ateacher\/stats/.test(x) || /onlineSparkV1\/profiles/.test(x)), 'legacy stats / nick / Spark profile untouched');
    const snap = t.tree.games.factor.titleNextV1.snapshots.ateacher;
    assert(snap.earned.tour1, 'legacy tour1 frozen');
    assert.equal(snap.equipped, 'tour1');
    // reload = re-login: same titles, no duplicate award writes, still equipped
    const before = t.writes.length;
    await p.reload();
    await open();
    await p.waitForFunction(() => /取得済み/.test(document.querySelector('[data-title-id="easy_master"] small')?.textContent || ''));
    assert.match(await state('easy_adept'), /取得済み/);
    assert.equal(t.writes.slice(before).filter((x) => /titleNextV1/.test(x.path)).length, 0, 'nothing is written twice');
    assert.deepEqual(t.tree.games.factor.accounts.ateacher.stats, stats);
    // the stored peak rises later: the new title is added, nothing else changes
    await p.evaluate(() => window.__fbApply({ kind: 'set', path: 'games/factor/onlineSparkV1/profiles/ateacher/normal/maxRating', v: 1821 }));
    await p.waitForFunction(() => /取得済み/.test(document.querySelector('[data-title-id="normal_master"] small')?.textContent || ''), null, { timeout: 15000 });
    assert.match(await state('dual_master'), /取得済み/);
    assert.equal(await p.locator('[data-title-save-failed]').count(), 0, 'no warning when saving works');
    assert.deepEqual(t.errors, []);
    await t.ctx.close();
    // guests never write
    const g = await context(b, { account: { guest: true, name: 'Guest' } });
    await g.page.locator('.account-main').click();
    await g.page.locator('[data-next-profile]').waitFor();
    assert.equal(g.writes.filter((x) => /titleNextV1/.test(x.path)).length, 0);
    await g.ctx.close();
    // save failure is announced on the title tab; a normal run shows nothing
    const mock = fs.readFileSync(require('node:path').join(__dirname, 'firebase-mock.js'), 'utf8');
    const deny = mock + `
;(()=>{const d=window.firebase.database;const wrap=(db,p)=>{const r=db.ref(p);const bad=/titleNextV1\\/(snapshots|awards)/.test(p)&&window.__denyTitles;const rej=()=>Promise.reject(Error('PERMISSION_DENIED'));return bad?{...r,get:rej,set:rej,child:k=>wrap(db,p+'/'+k)}:{...r,child:k=>wrap(db,p+'/'+k)}};
window.firebase.database=Object.assign(()=>{const db=d();return{...db,ref:p=>wrap(db,p)}},d)})();`;
    const f = await context(b, { firebaseSource: 'window.__denyTitles=true;\n' + deny, tree: structuredClone(tree) });
    await f.page.locator('.account-main').click();
    await f.page.locator('[data-next-profile]').waitFor();
    await f.page.getByRole('tab', { name: '称号・装備' }).click();
    await f.page.locator('[data-title-save-failed]').getByText('新称号の保存を確認できませんでした。通信状態をご確認ください。').waitFor();
    assert.match(await f.page.locator('[data-title-id="tour1"] small').innerText(), /取得済み/, 'existing titles are unaffected by the failure');
    assert.equal(f.writes.filter((x) => /titleNextV1/.test(x.path)).length, 0);
    await f.ctx.close();
    console.log('PASS save failure shows the notice; existing titles stay'); 
    console.log('PASS client-judged rate titles: freeze, award, reload, rising peak, no rounding, guest/stats untouched');
  } finally {
    await b.close();
  }
})().catch((e) => { console.error(e); process.exitCode = 1; });
