// Ver.6.0 post-release UI fixes (stage 1): home version label + sound toggle, battle card without caption/timer, lobby wording.
const assert = require('node:assert/strict'), { chromium, context } = require('./browser-harness.cjs');
const tree = () => ({ games: { factor: { accounts: { ateacher: { name: 'Teacher', stats: { exp: 900, rating: 1650 } } }, onlineSparkV1: { config: { enabled: true, protocol: 'spark-v1' } } } } });
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium' });
  try {
    for (const width of [320, 375, 390, 1440]) {
      const t = await context(b, { tree: tree() }), p = t.page;
      await p.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
      await p.locator('[data-next-home]').waitFor();
      const ver = p.locator('[data-home-version]:visible');
      const expected = await p.evaluate(() => 'Ver.' + window.FactorVersion.number);
      assert.match(expected, /^Ver\.\d+\.\d+$/);
      assert.equal((await ver.first().innerText()).trim(), expected, 'the version is read from game-version.js');
      const boxes = await p.evaluate(() => {
        const r = (e) => { const x = e.getBoundingClientRect(); return { l: x.left, r: x.right, t: x.top, b: x.bottom }; };
        const v = [...document.querySelectorAll('[data-home-version]')].find((e) => e.offsetParent), logo = document.querySelector('.next-home .brand-slot img, .next-home .mobile-brand img'), tools = document.querySelector('.next-home .header-tools');
        const visibleLogo = [...document.querySelectorAll('.next-home .brand-slot img, .next-home .mobile-brand img')].find((e) => e.offsetParent);
        return { v: r(v), logo: r(visibleLogo), tools: tools && tools.offsetParent ? r(tools) : null, doc: document.documentElement.scrollWidth, vw: innerWidth };
      });
      assert(boxes.v.l >= boxes.logo.l - 1 && boxes.v.r <= boxes.vw, `version stays on screen at ${width}`);
      const overlap = (a, c) => a.l < c.r && a.r > c.l && a.t < c.b && a.b > c.t;
      assert(!overlap(boxes.v, boxes.logo), `version does not cover the logo at ${width}`);
      if (boxes.tools) assert(!overlap(boxes.v, boxes.tools), `version does not overlap the header buttons at ${width}`);
      assert(boxes.doc <= boxes.vw + 1, `no horizontal scroll at ${width}`);
      if (width < 1000) {
        const btn = p.locator('[data-sound-toggle]');
        const state = () => btn.getAttribute('data-sound-toggle');
        const saved = () => p.evaluate(() => localStorage.getItem('fxf_game_mute_v1'));
        const first = await state();
        await btn.click(); await p.waitForTimeout(150);
        assert.notEqual(await state(), first, 'the first click switches the state');
        assert.equal(await saved(), first === 'on' ? '1' : '0', 'saved in the existing preference key');
        assert.equal(await btn.getAttribute('aria-label'), first === 'on' ? '音声をオン' : '音声をオフ');
        assert.equal(await btn.getAttribute('aria-pressed'), first === 'on' ? 'false' : 'true');
        await btn.click(); await p.waitForTimeout(150);
        assert.equal(await state(), first, 'the second click switches back');
        assert.equal(await saved(), first === 'on' ? '0' : '1');
      }
      assert.deepEqual(t.errors, []); await t.ctx.close();
    }
    console.log('PASS home: version label next to the logo (4 widths, no overlap/scroll), sound button toggles state, icon and saved preference');
    { // lobby wording
      const t = await context(b, { tree: tree() }), p = t.page;
      await p.locator('.action-card.online').click();
      const btnB = p.locator('.next-mode-links button', { hasText: '新B方式' });
      await btnB.waitFor();
      const small = await btnB.locator('small').evaluate((e) => ({ text: e.textContent, html: e.innerHTML, ws: getComputedStyle(e).whiteSpace, h: e.getBoundingClientRect().height, lh: parseFloat(getComputedStyle(e).lineHeight) || 14 }));
      assert.equal(small.text, '時間制\n得点と妨害'); assert.equal(small.ws, 'pre-line'); assert(small.h >= small.lh * 1.8, 'two visible lines');
      const choice = p.getByRole('group', { name: '方式', exact: true });
      assert.equal(await choice.getByRole('button', { name: 'A方式', exact: true }).count(), 1);
      assert.equal(await choice.getByRole('button', { name: 'A 早い者勝ち', exact: true }).count(), 0);
      await choice.getByRole('button', { name: '新B方式', exact: true }).click();
      assert.equal(await p.getByText('時間制の新B方式。CPUの強さ・誤答率は従来と同じ設定です。').count(), 0, 'the explanation is removed');
      await choice.getByRole('button', { name: 'A方式', exact: true }).click();
      assert.deepEqual(t.errors, []); await t.ctx.close();
      console.log('PASS lobby: 新B方式 shows 時間制 / 得点と妨害 on two lines; CPU practice says A方式 and has no explanation line');
    }
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
