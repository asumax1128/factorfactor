// Ver.6.0 step 9 C: FACTOR×FACTOR is owned at 15 DISTINCT earned five-star titles, hidden before, one reveal, never revoked.
const assert = require('node:assert/strict'), { chromium, context } = require('./browser-harness.cjs');
// 17 five-star titles earned from stats alone: streak30 streak50 handi master1900 rmaster giant250 flash3 perfect1000 combo30 miracle alllv tour1 tour3 tour10 darkhorse wkace5 wkone2
const full = () => ({ exp: 100, games: 10, sk: { v: 1, n: 0, best: 50, n0: 0 }, handiSelf: 1, maxRating: 1900, giant250Wins: 1, flash3: 1, perfects: 1000, maxCombo: 30, miracleWins: 1, lvP: 1022, tourWins: 10, darkHorse: 1, wk: { ace: 5, best: 1200 }, nick: 'tour1' });
const without = (...keys) => { const s = full(); for (const k of keys) delete s[k]; return s; };
const open = async (b, stats) => {
  const tree = { games: { factor: { accounts: { ateacher: { name: 'Teacher', stats: structuredClone(stats) } } } } };
  const t = await context(b, { tree }); const p = t.page;
  await p.emulateMedia({ reducedMotion: 'reduce' });
  await p.locator('.account-main').click(); await p.getByRole('tab', { name: '称号・装備', exact: true }).click();
  await p.locator('[data-title-inventory]').waitFor();
  return { t, p, tree, stats: () => tree.games.factor.accounts.ateacher.stats };
};
const dialog = (p) => p.getByRole('dialog', { name: '称号獲得演出', exact: true });
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium' });
  try {
    // 17 -> owned: reveal once, saved once, nothing else changed
    { const s = await open(b, full()); await dialog(s.p).waitFor();
      await dialog(s.p).getByRole('button', { name: '閉じる', exact: true }).click();
      for (let i = 0; i < 40 && !s.stats().ff; i++) await s.p.waitForTimeout(50);
      assert.equal(s.stats().ff.v, 1); assert.equal(typeof s.stats().ff.at, 'number');
      const { ff, ...rest } = s.stats(); const { ...orig } = full(); assert.deepEqual(rest, orig, 'every other stat and the equipped title are untouched');
      await s.p.reload(); await s.p.locator('.account-main').click(); await s.p.getByRole('tab', { name: '称号・装備', exact: true }).click(); await s.p.locator('[data-title-inventory]').waitFor(); await s.p.waitForTimeout(300);
      assert.equal(await dialog(s.p).count(), 0, 'the reveal is shown once on this device');
      assert.deepEqual(s.t.errors, []); await s.t.ctx.close(); console.log('PASS 17 distinct five-star titles: FACTOR×FACTOR owned, one reveal, saved as stats.ff, other records untouched'); }
    // exactly 15 -> owned; 14 -> not owned, not saved, not shown
    { const s = await open(b, without('giant250Wins', 'flash3')); await dialog(s.p).waitFor(); assert(await s.p.locator('body').innerText().then((x) => /FACTOR×FACTOR/.test(x))); await s.t.ctx.close(); console.log('PASS exactly 15 is enough'); }
    { const s = await open(b, without('giant250Wins', 'flash3', 'miracleWins')); await s.p.waitForTimeout(500);
      assert.equal(await dialog(s.p).count(), 0); assert.equal(s.stats().ff, undefined);
      assert.equal(/FACTOR×FACTOR/.test(await s.p.locator('body').innerText()), false, 'name and condition stay hidden before it is earned');
      assert.deepEqual(s.t.errors, []); await s.t.ctx.close(); console.log('PASS 14 is not enough: nothing shown, nothing saved, nothing revealed'); }
    // never revoked: a stored record keeps it owned even when the live evidence drops below 15
    { const st = without('giant250Wins', 'flash3', 'miracleWins'); st.ff = { v: 1, at: 1760000000000 };
      const s = await open(b, st); await dialog(s.p).waitFor(); assert.equal(s.stats().ff.at, 1760000000000, 'the stored record is not rewritten');
      await s.t.ctx.close(); console.log('PASS a stored hidden title is never revoked'); }
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
