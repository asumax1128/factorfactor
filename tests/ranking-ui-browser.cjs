// Ver.6.0 ranking lists (solo / daily / rating): unified rows, tabs, self highlight, states, back, narrow + short viewports.
const assert = require('node:assert/strict');
const { chromium, context } = require('./browser-harness.cjs');
const rec = (name, difficulty, score, caught) => ({ name, difficulty, score, caught });
const records = [
  ...Array.from({ length: 24 }, (_, i) => rec('E' + String(i + 1).padStart(2, '0'), 'easy', 3000 - i * 50, 30 - (i % 7))),
  rec('Teacher', 'easy', 2000, 20), rec('Tie1', 'easy', 1800, 18), rec('Tie2', 'easy', 1800, 18),
  rec('N1', 'normal', 900, 12), rec('Teacher', 'normal', 700, 9), rec('N3', 'normal', 500, 7), rec('N4', 'normal', 500, 7),
  rec('H1', 'hard', 400, 5)
];
const gas = (body, status = 200, delay = 0) => async (route) => {
  if (delay) await new Promise((r) => setTimeout(r, delay));
  await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
};
async function openSolo(t, p) {
  await p.locator('.support-link').filter({ hasText: 'ランキング' }).click();
  await p.locator('.ranking-entry').filter({ hasText: 'ソロランキング' }).click();
  await p.locator('[data-ranking="solo"]').waitFor();
}
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium' });
  try {
    for (const [width, height] of [[375, 844], [390, 844], [1440, 900], [683, 325]]) {
      const tree = { games: { factor: { accounts: { ateacher: { name: 'Teacher', stats: { rating: 1600, exp: 100 } } } } } };
      const t = await context(b, { tree }), p = t.page;
      await p.setViewportSize({ width, height });
      await t.ctx.route('https://script.google.com/**', gas({ ok: true, allRecords: records }));
      await p.reload();
      await p.locator('[data-next-home]').waitFor();
      // ---- solo ----
      await openSolo(t, p);
      const solo = p.locator('[data-ranking="solo"]');
      assert.equal(await p.locator('.ranking-view').count(), 1);
      assert.equal(await p.getByRole('button', { name: 'ランキング総合へ戻る', exact: true }).count(), 1, 'one back button (no duplicate pill)');
      assert.equal(await solo.getByRole('button', { name: 'ランキング総合へ' }).count(), 0);
      const diffSeg = solo.getByRole('group', { name: '難易度', exact: true });
      await diffSeg.getByRole('button', { name: 'イージー', exact: true }).click();
      await solo.locator('.rk-row').first().waitFor();
      assert.equal(await solo.locator('.rk-row').count(), 20, 'TOP20 cap kept');
      const rows = await solo.locator('.rk-row').evaluateAll((es) => es.map((e) => [Number(e.dataset.rank), e.querySelector('.rk-name').textContent, e.querySelector('.rk-val b').textContent]));
      assert.deepEqual(rows[0], [1, 'E01', '3000']);
      assert.deepEqual(rows[19].slice(1), ['E20', String(3000 - 19 * 50)]);
      await diffSeg.getByRole('button', { name: 'ノーマル', exact: true }).click();
      const normal = await solo.locator('.rk-row').evaluateAll((es) => es.map((e) => [Number(e.dataset.rank), e.querySelector('.rk-name').textContent, e.classList.contains('rk-self')]));
      assert.deepEqual(normal.map((r) => [r[0], r[2]]), [[1, false], [2, true], [3, false], [3, false]], 'own row highlighted; same score and same caught share a rank');
      assert.deepEqual(normal.map((r) => r[1]).slice(0, 2), ['N1', 'Teacher']);
      assert.deepEqual(normal.slice(2).map((r) => r[1]).sort(), ['N3', 'N4']);
      assert.equal(await diffSeg.getByRole('button', { name: 'ノーマル', exact: true }).getAttribute('aria-pressed'), 'true');
      // ties share a rank (same score and same caught) exactly as the old list did
      await diffSeg.getByRole('button', { name: 'イージー', exact: true }).click();
      const easyAll = await solo.locator('.rk-row').evaluateAll((es) => es.map((e) => [Number(e.dataset.rank), e.querySelector('.rk-name').textContent]));
      assert.equal(easyAll.length, 20);
      await solo.getByRole('button', { name: 'みんなの総得点', exact: true }).click();
      await solo.locator('.rk-row').first().waitFor();
      assert.match(await solo.locator('.rk-row').first().innerText(), /回プレイ・平均.*点・計.*組/);
      await solo.getByRole('button', { name: 'この端末 TOP3', exact: true }).click();
      await solo.getByText('まだ記録がありません。最初の1位を目指そう！').waitFor();
      for (const btn of await solo.getByRole('button').all()) {
        const box = await btn.boundingBox();
        if (box) assert(box.height >= 43.5, 'tap target >=44px: ' + box.height);
      }
      assert(!await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), 'no horizontal overflow ' + width);
      await p.getByRole('button', { name: 'ランキング総合へ戻る', exact: true }).click();
      await p.locator('.ranking-grid').waitFor();
      assert.equal(await p.locator('.ranking-entry').count(), 3);
      assert.deepEqual(t.errors, []);
      await t.ctx.close();
      console.log(`PASS solo ranking ${width}x${height}: difficulty tabs, TOP20, self row, total/local tabs, one back button, 44px targets`);
    }
    // solo states: loading -> error with retry -> ok
    {
      const t = await context(b, { tree: { games: { factor: { accounts: { ateacher: { name: 'Teacher', stats: {} } } } } } }), p = t.page;
      let fail = true;
      await t.ctx.route('https://script.google.com/**', async (route) => { if (fail) return route.fulfill({ status: 500, body: 'x' }); return gas({ ok: true, allRecords: [] })(route); });
      await p.reload(); await p.locator('[data-next-home]').waitFor();
      await openSolo(t, p);
      const solo = p.locator('[data-ranking="solo"]');
      await solo.getByRole('alert').getByText(/読み込みに失敗しました/).waitFor();
      fail = false;
      await solo.getByRole('button', { name: '↻ 更新', exact: true }).last().click();
      await solo.getByText('まだ記録がありません。全国1位を目指そう！').waitFor();
      await t.ctx.close();
      console.log('PASS solo ranking states: error with retry, then empty');
    }
    // ---- daily ----
    for (const [width, height] of [[375, 844], [1440, 900], [683, 325]]) {
      const season = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 7);
      const day = Math.floor((Date.now() + 9 * 3600000) / 86400000);
      const r = (key, name, score, cleared, elapsed, correct, sortKey) => ({ key, name, score, cleared, elapsed, correct, sortKey, day });
      const tree = { games: { factor: { accounts: { ateacher: { name: 'Teacher', stats: { rating: 1600 } } }, dailyV2: { ready: true, boards: {
        [day]: { easy: { records: { f1: r('f1', 'Fixture1', 500, true, 45000, 15, 'a'), ateacher: r('ateacher', 'Teacher', 450, false, 0, 12, 'b'), f3: r('f3', 'Fixture3', 300, true, 61000, 15, 'c') } } },
        [day - 1]: { easy: { records: { y1: r('y1', 'Yesterday1', 480, true, 50000, 15, 'a') } } }
      } } } } };
      const t = await context(b, { tree }), p = t.page;
      await p.setViewportSize({ width, height });
      await p.locator('.support-link').filter({ hasText: 'ランキング' }).click();
      await p.locator('.ranking-entry').filter({ hasText: 'デイリーランキング' }).click();
      const view = p.locator('[data-ranking="daily"]');
      await view.locator('.rk-row').first().waitFor();
      assert.equal(await p.getByRole('button', { name: 'ランキング総合へ戻る', exact: true }).count(), 1, 'single back button');
      assert.equal(await view.getByRole('button', { name: 'ランキング総合へ' }).count(), 0);
      const today = await view.locator('.rk-row').evaluateAll((es) => es.map((e) => [Number(e.dataset.rank), e.querySelector('.rk-name').textContent, e.querySelector('.rk-val b').textContent, e.classList.contains('rk-self'), e.querySelector('small').textContent]));
      assert.deepEqual(today.map((x) => x.slice(0, 4)), [[1, 'Fixture1', '500', false], [2, 'Teacher', '450', true], [3, 'Fixture3', '300', false]]);
      assert.match(today[0][4], /クリアタイム 45\.00秒・15問正解/);
      assert.match(today[1][4], /未クリア・12問正解/);
      assert.equal(await view.getByRole('button', { name: '今日', exact: true }).getAttribute('aria-pressed'), 'true');
      assert.equal(await view.getByRole('button', { name: 'イージー', exact: true }).getAttribute('aria-pressed'), 'true');
      assert.equal(await view.locator('.rk-top').count(), 3);
      await view.getByRole('button', { name: '昨日', exact: true }).click();
      await view.getByText(/Yesterday1/).waitFor();
      assert.match(await view.locator('.rk-row').first().innerText(), /🏆 優勝/);
      assert.equal(await view.getByRole('button', { name: '昨日', exact: true }).getAttribute('aria-pressed'), 'true');
      await view.getByRole('button', { name: '今日', exact: true }).click();
      await view.getByRole('button', { name: 'ノーマル', exact: true }).click();
      await view.getByText('まだ記録がありません', { exact: true }).waitFor();
      await view.getByText('ノーマル TOP10', { exact: true }).waitFor();
      assert.match(await view.innerText(), /得点→クリア→タイム／正解数→確定時刻の順/);
      for (const btn of await view.getByRole('button').all()) { const box = await btn.boundingBox(); if (box) assert(box.height >= 43.5, 'tap target >=44px ' + box.height); }
      assert(!await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), 'daily overflow ' + width);
      assert.equal(t.writes.filter((x) => /\/dailyV2\/(?:attempts|boards)\//.test(x.path)).length, 0, 'viewing starts no challenge and changes no board (the server clock stamp is existing behaviour)');
      await p.getByRole('button', { name: 'ランキング総合へ戻る', exact: true }).click();
      await p.locator('.ranking-grid').waitFor();
      assert.deepEqual(t.errors, []);
      await t.ctx.close();
      console.log(`PASS daily ranking ${width}x${height}: today/yesterday + difficulty tabs, rows/self/winner, empty, one back button, 44px targets`);
    }
    {
      const g = await context(b, { account: { guest: true, name: 'Guest' } }), p = g.page;
      await p.locator('.support-link').filter({ hasText: 'ランキング' }).click();
      await p.locator('.ranking-entry').filter({ hasText: 'デイリーランキング' }).click();
      await p.locator('[data-ranking="daily"]').getByText(/登録アカウントでログインしてください/).waitFor();
      await g.ctx.close();
      console.log('PASS daily ranking: guest sees the login notice');
    }
  } finally {
    await b.close();
  }
})().catch((e) => { console.error(e); process.exitCode = 1; });
