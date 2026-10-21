// Ver.6.0: C方式 is hidden/blocked for new starts (records and spectating stay). Random match obeys the OFF switch even through the legacy lobby.
const assert = require('node:assert/strict');
const { chromium, context } = require('./browser-harness.cjs');
const cfg = (enabled) => ({ onlineSparkV1: { config: { enabled, protocol: 'spark-v1' } } });
const accounts = { ateacher: { name: 'Teacher', stats: { rating: 1700 } } };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium' });
  try {
    // 1. A device that saved a C practice config must not start C; it starts B instead.
    {
      const t = await context(b, { tree: { games: { factor: { accounts, ...cfg(true) } } } }), p = t.page;
      await p.evaluate(() => localStorage.setItem('fxf_cpu_cfg_v1', JSON.stringify({ mode: 'C', diff: 'easy', lv: 'normal', n: 1 })));
      await p.reload();
      await p.locator('.action-card.solo').click(); await p.locator('[data-solo-mode=cpu]').click();
      const choice = p.getByRole('group', { name: '方式', exact: true });
      assert.equal(await choice.getByRole('button', { name: /^C / }).count(), 0);
      await p.getByRole('button', { name: 'CPUと練習スタート', exact: true }).click();
      await p.locator('[data-btile]').first().waitFor();
      const body = await p.locator('body').innerText();
      assert(!/味方CPU|赤チーム/.test(body), 'not a C (team) battle');
      assert.deepEqual(t.errors, []);
      await t.ctx.close();
      console.log('PASS saved C practice config falls back to B, no C choice');
    }
    // 2. Joining a waiting C room made by an older client is refused with a visible explanation; no player entry is written.
    {
      const now = Date.now();
      const rooms = { 4321: { meta: { host: 'someone-else', createdAt: now }, state: { phase: 'lobby', mode: 'C', diff: 'easy' }, players: { someone: { name: 'Old', joinedAt: now } } } };
      const t = await context(b, { tree: { games: { factor: { accounts, rooms, ...cfg(true) } } } }), p = t.page;
      await p.locator('.action-card.online').click();
      await p.getByPlaceholder('部屋コード4桁').fill('4321');
      await p.getByRole('button', { name: '参加', exact: true }).click();
      await p.getByRole('alert').getByText(/C方式（2対2）はVer\.6\.0では利用できません/).waitFor();
      assert.equal(t.writes.filter((x) => /rooms\/4321\/players\//.test(x.path)).length, 0, 'must not join');
      assert.deepEqual(t.errors, []);
      await t.ctx.close();
      console.log('PASS old C room join refused with guidance');
    }
    // 3. startMatch refuses C before touching existing records of the room.
    //    Negative control: with the shared flag turned on the very same click does reach the record-clearing step.
    for (const flagOn of [false, true]) {
      const t = await context(b, { tree: { games: { factor: { accounts, ...cfg(true) } } } }), p = t.page;
      await p.locator('.action-card.online').click();
      await p.locator('.next-mode-links').getByRole('button', { name: /^A方式/ }).click();
      await p.getByRole('button', { name: '部屋を出る', exact: true }).waitFor();
      const code = Object.keys(t.tree.games.factor.rooms)[0];
      await p.evaluate((c) => window.__fbApply({ kind: 'set', path: 'games/factor/rooms/' + c + '/players/cpu1', v: { name: 'CPU1', cpu: 'normal', joinedAt: Date.now() + 5 } }), code);
      const start = p.getByRole('button', { name: /対戦スタート/ });
      await start.waitFor();
      await p.evaluate((on) => { window.FXF_FEATURES.cMode = on; }, flagOn);
      const before = t.writes.length;
      // flip the room to C right before pressing the (still A-looking) start button
      await start.evaluate((el, c) => { window.__fbApply({ kind: 'update', path: 'games/factor/rooms/' + c + '/state', v: { mode: 'C' } }); el.click(); }, code);
      await p.waitForTimeout(700);
      const after = t.writes.slice(before).filter((x) => x.path.startsWith('games/factor/rooms/' + code + '/'));
      if (flagOn) assert(after.some((x) => /\/(claims|result|live)$/.test(x.path)), 'control: handler really ran');
      else assert.deepEqual(after, [], 'nothing is cleared or started: ' + JSON.stringify(after.map((x) => x.path)));
      await t.ctx.close();
    }
    console.log('PASS startMatch refuses C before clearing room records (flag-on control proves the click reaches it)');
    // 4. Random match switch OFF through the legacy lobby (new home bundle unavailable): disabled, explained, nothing written.
    for (const enabled of [false, true]) {
      const t = await context(b, { blockedAssets: ['/next-home-ui.js'], tree: { games: { factor: { accounts, ...cfg(enabled) } } } }), p = t.page;
      await p.getByRole('button', { name: 'オンライン対戦（ロビー）', exact: true }).click();
      const quick = p.getByRole('button', { name: 'すぐ遊ぶ（ランダム対戦）', exact: true });
      await quick.waitFor();
      if (!enabled) {
        await p.getByText('レーティング対戦は現在利用できません。ルーム対戦・CPU練習を利用できます。').first().waitFor();
        assert.equal(await quick.isDisabled(), true);
        await quick.evaluate((el) => el.click());
        await p.waitForTimeout(500);
        assert.equal(t.writes.filter((x) => /games\/factor\/(qm|rooms)\//.test(x.path)).length, 0, 'legacy qm must not start');
        console.log('PASS legacy lobby with switch OFF: disabled, explained, no qm/rooms writes');
      } else {
        await p.waitForFunction(() => [...document.querySelectorAll('button')].some((x) => x.textContent.includes('すぐ遊ぶ（ランダム対戦）') && !x.disabled));
        await quick.click();
        await p.getByRole('button', { name: 'イージーで相手を探す', exact: true }).waitFor();
        assert.equal(t.writes.filter((x) => /games\/factor\/qm\//.test(x.path)).length, 0);
        console.log('PASS legacy lobby with switch ON: rated random match opens normally');
      }
      assert.deepEqual(t.errors, []);
      await t.ctx.close();
    }
  } finally {
    await b.close();
  }
})().catch((e) => { console.error(e); process.exitCode = 1; });
