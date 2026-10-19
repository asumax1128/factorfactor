// Ver.6.0 post-release UI fixes: home version label + sound toggle, battle card without caption/timer, lobby wording (stage 1) and the dark room waiting screen (stage 4).
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
    { // stage 4: 4-digit room waiting screen on the dark theme (host / participant), permissions and settings unchanged
      const rt = { games: { factor: { accounts: { ah: { name: 'Host', stats: { exp: 100, rating: 1500 } }, ag: { name: 'Guest', stats: { exp: 100, rating: 1500 } } }, onlineSparkV1: { config: { enabled: true, protocol: 'spark-v1' } } } } };
      for (const width of [320, 375, 390]) {
        const peers = [], h = await context(b, { tree: rt, peers, uid: 'host', account: { key: 'ah', name: 'Host' } }), g = await context(b, { tree: rt, peers, uid: 'guest', account: { key: 'ag', name: 'Guest' } });
        for (const t of [h, g]) { await t.page.setViewportSize({ width, height: 844 }); await t.page.getByRole('button', { name: 'オンライン対戦・CPU練習', exact: true }).click(); }
        await h.page.getByRole('button', { name: '部屋を作る（ホスト）', exact: true }).click();
        await h.page.waitForFunction(() => /^[0-9]{4}$/.test(document.querySelector('.tracking-widest')?.textContent.trim() || ''));
        const code = (await h.page.locator('.tracking-widest').innerText()).trim();
        await g.page.getByPlaceholder('部屋コード4桁').fill(code); await g.page.getByRole('button', { name: '参加', exact: true }).click();
        await g.page.getByText('部屋コード', { exact: true }).waitFor(); await h.page.getByText('2/4').waitFor();
        const probe = (p) => p.evaluate(() => {
          const lum = (c) => { const m = c.match(/[\d.]+/g).map(Number); return (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) / 255; };
          const menu = document.querySelector('.v7-menu'), light = [...menu.querySelectorAll('*')].filter((e) => e.offsetParent && e.getAttribute('aria-pressed') !== 'true' && e.getBoundingClientRect().width > 20 && (() => { const c = getComputedStyle(e).backgroundColor; const m = c.match(/[\d.]+/g).map(Number); return (m.length < 4 || m[3] > 0.4) && lum(c) > 0.6; })()).map((e) => e.className || e.tagName);
          const sel = [...menu.querySelectorAll('button[aria-pressed="true"]')].map((e) => ({ ring: getComputedStyle(e).boxShadow !== 'none', t: e.textContent }));
          const wide = [...menu.querySelectorAll('*')].filter((e) => e.getBoundingClientRect().right > innerWidth + 1).length;
          return { bg: lum(getComputedStyle(menu).backgroundColor), light, sel, wide, doc: document.documentElement.scrollWidth, vw: innerWidth };
        });
        for (const [who, t] of [['host', h], ['guest', g]]) {
          const r = await probe(t.page);
          assert(r.bg < 0.2, `dark page ${who} ${width}`); assert.deepEqual(r.light, [], `no light card or button ${who} ${width}`);
          assert(r.sel.length >= 3 && r.sel.every((x) => x.ring), `selected choices are ringed ${who} ${width}`);
          assert(r.doc <= r.vw + 1 && r.wide === 0, `no horizontal overflow ${who} ${width}`);
        }
        // permissions: only the host can change the rules or start; both see code, list and the leave button
        const hostSeg = h.page.getByRole('button', { name: /^A：/ }), guestSeg = g.page.getByRole('button', { name: /^A：/ });
        assert(await guestSeg.isDisabled() && !(await hostSeg.isDisabled()));
        assert.equal(await g.page.getByRole('button', { name: /対戦スタート/ }).count(), 0); assert.equal(await h.page.getByRole('button', { name: /対戦スタート/ }).count(), 1);
        await hostSeg.click(); await h.page.getByRole('button', { name: /^A：/ }).and(h.page.locator('[aria-pressed="true"]')).waitFor();
        await g.page.getByRole('button', { name: /^A：/ }).and(g.page.locator('[aria-pressed="true"]')).waitFor();
        assert.match(await g.page.locator('.v7-panel').nth(2).innerText(), /早い者勝ち|同じ問題/);
        await h.page.getByRole('button', { name: '★', exact: true }).first().click(); await h.page.locator('button.rl-on', { hasText: '★' }).first().waitFor();
        await g.page.getByRole('button', { name: '部屋を出る', exact: true }).click(); await g.page.locator('.tracking-widest').waitFor({ state: 'detached' });
        assert.deepEqual(h.errors, []); assert.deepEqual(g.errors, []); await h.ctx.close(); await g.ctx.close();
      }
      console.log('PASS room waiting screen: dark theme for host and participant (A and B), selected choices ringed, permissions kept, no overflow at 320/375/390, leave works');
    }
    { // fix 7 (option c): the 「称号の装備・詳細記録」 button stays; its window is dark and keeps every entry (ghost battle, rating history, seasons, achievements)
      const season = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 7), stats = { rating: 1650, maxRating: 1800, games: 20, w: 12, l: 6, d: 2, exp: 900, nick: 'tour1', maxStreak: 4, skin: { tile: 'wood' } };
      const pt = { games: { factor: { accounts: { ateacher: { name: 'Teacher', stats } }, onlineSparkV1: { profiles: { ateacher: { name: 'Teacher', easy: { rating: 1665, maxRating: 1810, season, games: 20, w: 12, l: 6, d: 2 } } } } } } };
      for (const width of [320, 390, 1440]) {
        const t = await context(b, { tree: pt }), p = t.page; await p.setViewportSize({ width, height: width > 900 ? 1000 : 844 });
        await p.locator('.account-main').click(); await p.locator('[data-next-profile]').waitFor();
        await p.getByRole('button', { name: '称号の装備・詳細記録', exact: true }).click();
        const win = p.locator('.pp-dark > div'); await win.waitFor();
        const r = await p.evaluate(() => {
          const root = document.querySelector('.pp-dark'), w = root.firstElementChild, lum = (c) => { const m = c.match(/[\d.]+/g).map(Number); return (m.length < 4 || m[3] > 0.4) ? (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) / 255 : -1; };
          const light = [...w.querySelectorAll('*')].filter((e) => e.getBoundingClientRect().width > 20 && lum(getComputedStyle(e).backgroundColor) > 0.6 && !/linear-gradient/.test(getComputedStyle(e).backgroundImage)).map((e) => e.textContent.trim().slice(0, 20) + '|' + getComputedStyle(e).backgroundColor);
          return { win: lum(getComputedStyle(w).backgroundColor), light, text: w.innerText, doc: document.documentElement.scrollWidth, vw: innerWidth, wide: w.scrollWidth > w.clientWidth + 1 };
        });
        assert(r.win < 0.25, `dark window ${width}`); assert.deepEqual(r.light.filter((x) => !/^(〈|🏆)/.test(x)), [], `no light panel ${width}`);
        assert(r.doc <= r.vw + 1 && !r.wide, `no horizontal overflow ${width}`);
        for (const need of ['オンライン対戦の成績', 'イージーで自分のゴースト対戦', 'ノーマルで自分のゴースト対戦', 'ゴースト対戦履歴', '自分の挑戦', '自分の分身', '最高レート', '相手ごとの成績']) assert(r.text.includes(need), `kept: ${need} ${width}`);
        await p.getByRole('button', { name: 'とじる', exact: true }).click(); await win.waitFor({ state: 'detached' });
        assert.deepEqual(t.errors, []); await t.ctx.close();
      }
      console.log('PASS profile detail window: button kept, dark theme, ghost battle / ghost history / rating / season entries kept, no overflow at 320/390/1440');
    }
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
