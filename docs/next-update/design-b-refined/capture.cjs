const { chromium } = require('playwright');
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../../..');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium' });
  const results = [];
  try {
    for (const screen of ['home', 'online']) for (const device of [{ name: 'pc', width: 1440, height: 1080, touch: false }, { name: 'mobile', width: 390, height: 844, touch: true }]) {
      const ctx = await browser.newContext({ viewport: { width: device.width, height: device.height }, hasTouch: device.touch });
      let external = 0; const errors = [], requests = [];
      await ctx.route('**/*', route => {
        const u = new URL(route.request().url());
        if (u.hostname !== 'localhost') { external++; return route.abort(); }
        const file = path.resolve(root, '.' + decodeURI(u.pathname));
        requests.push(u.pathname);
        if (!file.startsWith(root + '/') || !fs.existsSync(file)) return route.abort();
        return route.fulfill({ path: file });
      });
      const p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message));
      try {
        await p.goto(`http://localhost/docs/next-update/design-b-refined/${screen}.html`);
        await p.evaluate(() => document.fonts.ready);
        await p.locator('[data-brand-image]:visible').evaluate(e => e.decode());
        for (const [f, w, text] of [['BHeading', 900, 'オンライン対戦'], ['BBody', 500, 'ランキング'], ['BNumber', 700, '1666']]) assert(await p.evaluate(([f, w, s]) => document.fonts.check(`${w} 20px ${f}`, s), [f, w, text]));
        assert.equal(await p.locator('[data-brand-image]:visible').evaluate(e => e.naturalWidth), 688);
        const background = await p.locator('[data-brand-image]:visible').evaluate(e => getComputedStyle(e).backgroundColor);
        assert.equal(background, 'rgba(0, 0, 0, 0)', 'no white logo plate');
        assert.equal(await p.locator('.nav-item.selected:visible').count(), 1, 'one selected navigation entry per form factor');
        if (screen === 'home') {
          await p.locator('.boss-art img').evaluate(e => e.decode());
          const bounds = await p.locator('.boss-art img').boundingBox();
          assert(bounds.height >= 240 && bounds.width >= 260, 'prominent boss image');
        }
        assert(!await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), 'horizontal overflow at screenshot width');
        // Expand only screenshot height to present the whole scrolling page with its nav at the bottom.
        // All interaction/overflow checks still use the declared device viewport.
        if (device.touch) { const height = await p.evaluate(() => document.documentElement.scrollHeight); await p.setViewportSize({ width: device.width, height: Math.max(device.height, height) }); }
        await p.screenshot({ path: path.join(__dirname, `${screen}-${device.name}.png`), fullPage: true });
        await p.setViewportSize({ width: device.width, height: device.height });
        if (device.touch) {
          assert(await p.locator('.sidebar').isHidden());
          await p.getByRole('button', { name: 'メニューを開く', exact: true }).click();
          await p.getByRole('dialog', { name: 'メインメニュー', exact: true }).waitFor();
          await p.keyboard.press('Escape');
          assert(await p.locator('#menu-sheet').isHidden());
          await p.waitForFunction(() => document.getElementById('open-menu').getAttribute('aria-expanded') === 'false');
        } else {
          const target = p.locator('.sidebar .nav-item:not(.selected)').first();
          const before = await target.evaluate(e => getComputedStyle(e).backgroundColor);
          await target.hover(); await p.waitForTimeout(180);
          assert.notEqual(await target.evaluate(e => getComputedStyle(e).backgroundColor), before, 'sidebar hover feedback');
        }
        const widthChecks = [];
        for (const width of [320, 768, 900, 1024, 1366]) {
          await p.setViewportSize({ width, height: 900 });
          assert(!await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), `${screen} overflow ${width}`);
          widthChecks.push(width);
        }
        assert.equal(external, 0); assert.deepEqual(errors, []);
        results.push({ screen, device: device.name, viewport: [device.width, device.height], fontsLoaded: true, logoBackground: background, widthChecks, externalRequests: external, errors, localRequests: requests.length });
      } finally { await ctx.close(); }
    }
    fs.writeFileSync(path.join(__dirname, 'checks.json'), JSON.stringify(results, null, 2) + '\n');
    console.log('PASS 4 refined B views: fonts, transparent temporary logo, prominent boss, sidebar hover/mobile sheet, 320..1440 responsive, no external requests');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
