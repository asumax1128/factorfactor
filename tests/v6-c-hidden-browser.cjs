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
      // Ver.6.13: create the room, then the host chooses A in the room lobby (the mode tiles were removed).
      await p.getByRole('button', { name: '部屋を作る（ホスト）', exact: true }).click();
      await p.getByRole('button', { name: '部屋を出る', exact: true }).waitFor();
      const code = Object.keys(t.tree.games.factor.rooms)[0];
      await p.locator('button').filter({ hasText: /^A：/ }).click();
      await p.waitForFunction(() => [...document.querySelectorAll('button[aria-pressed=true]')].some((e) => e.textContent.startsWith('A：')));
      for (let i = 0; i < 50 && t.tree.games.factor.rooms[code].state.mode !== 'A'; i++) await p.waitForTimeout(100);
      assert.equal(t.tree.games.factor.rooms[code].state.mode, 'A', 'host choice saved');
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
    // 4. Ver.6.23: the legacy menu/lobby is no longer shown when the new home bundle is unavailable (that fallback was removed).
    //    The page shows a load error with a reload button instead, so the legacy random-match (qm) entry cannot be reached
    //    from there at all: nothing is written, whatever the switch says. (Before Ver.6.23 this case drove the legacy lobby.)
    for (const enabled of [false, true]) {
      const t = await context(b, { blockedAssets: ['/next-home-ui.js'], tree: { games: { factor: { accounts, ...cfg(enabled) } } } }), p = t.page;
      await p.locator('[data-home-load-error]').waitFor();
      await p.getByRole('alert').getByText('ホーム画面を読み込めませんでした。通信を確認して、もう一度読み込んでください。', { exact: true }).waitFor();
      assert.equal(await p.getByRole('button', { name: 'オンライン対戦（ロビー）', exact: true }).count(), 0, 'no legacy lobby entry');
      assert.equal(await p.getByRole('button', { name: 'すぐ遊ぶ（ランダム対戦）', exact: true }).count(), 0, 'no legacy random match button');
      await p.waitForTimeout(500);
      assert.equal(t.writes.filter((x) => /games\/factor\/(qm|rooms)\//.test(x.path)).length, 0, 'legacy qm must not start');
      assert.deepEqual(t.errors, []);
      await t.ctx.close();
    }
    console.log('PASS new home bundle unavailable: load error shown, no legacy lobby, no qm/rooms writes (switch OFF and ON)');
  } finally {
    await b.close();
  }
})().catch((e) => { console.error(e); process.exitCode = 1; });
