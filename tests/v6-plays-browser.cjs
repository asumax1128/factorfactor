const nav = require("./browser-harness.cjs"); // shared navigation (goHome / openSoloMode …)
// Ver.6.0 release adjustment: a completed solo play counts once for the total-games titles; quitting does not.
const assert = require('node:assert/strict'), { chromium, context } = require('./browser-harness.cjs'), { soloDrag } = require('./solo-test-helper.cjs');
const exe = process.env.CHROMIUM_PATH || '/usr/bin/chromium';
const begin = async (p) => { await nav.openSoloMode(p, 'play'); await p.getByRole('button', { name: /^イージー/ }).first().click(); await p.getByRole('button', { name: 'スタート', exact: true }).click(); await p.locator('[data-tile-id]').first().waitFor(); };
(async () => {
  const b = await chromium.launch({ executablePath: exe });
  try {
    { const tree = { games: { factor: { accounts: { ateacher: { name: 'Teacher', stats: { exp: 100, rating: 1600, games: 40 } } } } } };
      const t = await context(b, { tree }), p = t.page; await begin(p);
      for (let i = 0; i < 15; i++) { await soloDrag(p, true); await p.waitForTimeout(650); }
      await p.locator('[data-battle-summary]').waitFor({ timeout: 20000 }); await p.waitForTimeout(800);
      const st = tree.games.factor.accounts.ateacher.stats;
      assert.equal(st.soloPlays, 1, 'one completed solo play = one'); assert.equal(st.games, 40, 'the old room-game total is untouched');
      assert.deepEqual(t.errors, []); await t.ctx.close(); console.log('PASS a completed solo play is counted once (room games untouched)'); }
    { const tree = { games: { factor: { accounts: { ateacher: { name: 'Teacher', stats: { exp: 100, rating: 1600, games: 40 } } } } } };
      const t = await context(b, { tree }), p = t.page; await begin(p);
      for (let i = 0; i < 2; i++) { await soloDrag(p, true); await p.waitForTimeout(650); }
      await p.getByRole('button', { name: /やめる/ }).first().click(); await p.waitForTimeout(1200);
      assert.equal(tree.games.factor.accounts.ateacher.stats.soloPlays, undefined, 'quitting is not a completed play');
      assert.deepEqual(t.errors, []); await t.ctx.close(); console.log('PASS quitting a solo play is not counted'); }
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
