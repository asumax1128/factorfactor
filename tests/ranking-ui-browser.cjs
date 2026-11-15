// Ver.6.0 ranking lists (solo / daily / rating): unified rows, tabs, self highlight, states, back, narrow + short viewports.
const assert = require('node:assert/strict');
const { chromium, context, openRankingHub } = require('./browser-harness.cjs'); // Ver.6.13: ranking = 順位 tab
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
  await openRankingHub(p);
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
      assert.equal(await p.locator('.ranking-entry').count(), 2);
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
    // ---- daily: Ver.6.30 removed the daily ranking entry (past daily records are no longer shown). The saved boards are not touched. ----
    {
      const day = Number(new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10).replace(/-/g, ''));
      const boards = { [day]: { easy: { records: { f1: { name: 'Fixture1', score: 500 } } } } }, saved = JSON.stringify(boards);
      const t = await context(b, { tree: { games: { factor: { accounts: { ateacher: { name: 'Teacher', stats: { exp: 100 } } }, dailyV2: { boards } } } } }), p = t.page;
      await openRankingHub(p);
      assert.deepEqual(await p.locator('.ranking-entry strong').allInnerTexts(), ['ソロランキング', 'レーティングランキング']);
      assert.equal(await p.getByText(/デイリー/).count(), 0, 'no daily ranking entry');
      assert.equal(JSON.stringify(t.tree.games.factor.dailyV2.boards), saved, 'saved daily boards are left as they are');
      assert.equal(t.writes.filter((x) => /\/dailyV2\/(?:attempts|boards)\//.test(x.path)).length, 0);
      assert.deepEqual(t.errors, []);
      await t.ctx.close();
      console.log('PASS daily ranking: the entry is gone; saved daily boards untouched');
    }
    // ---- rating ----
    for (const [width, height] of [[375, 844], [1440, 900], [683, 325]]) {
      const season = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 7);
      const pr = (name, e, en, n, nn, extra = {}) => ({ name, ...extra, easy: { rating: e, maxRating: e, season, games: en, w: Math.floor(en / 2), l: en - Math.floor(en / 2) }, normal: { rating: n, maxRating: n, season, games: nn, w: Math.floor(nn / 2), l: nn - Math.floor(nn / 2) } });
      const accounts = { ateacher: { name: 'Teacher', stats: { rating: 1600, exp: 100 } }, ap2: { name: 'Rival', stats: {} }, ap3: { name: 'Third', stats: {} } };
      const profiles = { ateacher: pr('Teacher', 1665.6, 6, 1550, 4, { badges: { easy_adept: true } }), ap2: pr('Rival', 1750, 10, 1620, 8), ap3: pr('Third', 1580, 4, 1500, 1) };
      const tree = { games: { factor: { accounts, onlineSparkV1: { config: { enabled: true, protocol: 'spark-v1' }, profiles } } } };
      const t = await context(b, { tree }), p = t.page;
      await p.setViewportSize({ width, height });
      await openRankingHub(p);
      await p.locator('.ranking-entry').filter({ hasText: 'レーティングランキング' }).click();
      const view = p.locator('[data-ranking="rating"]');
      await view.locator('.rk-row').first().waitFor();
      assert.equal(await p.getByRole('button', { name: 'ランキング総合へ戻る', exact: true }).count(), 1, 'single back button');
      assert.equal(await p.getByRole('button', { name: 'オンラインへ戻る' }).count(), 0, 'no misleading online back button');
      assert.equal(await p.getByRole('button', { name: /消音|音を出す/ }).count(), 0, 'no sound button inside the list');
      const easy = await view.locator('.rk-row').evaluateAll((es) => es.map((e) => [Number(e.dataset.rank), e.querySelector('.rk-name').textContent, e.querySelector('.rk-val b').textContent, e.classList.contains('rk-self')]));
      assert.deepEqual(easy, [[1, 'Rival', '1750', false], [2, 'Teacher', '1666', true], [3, 'Third', '1580', false]]);
      assert.match(await view.locator('.rk-selfcard').innerText(), /1666/);
      assert.match(await view.locator('.rk-selfcard').innerText(), /自分の順位：2位/);
      assert.match(await view.innerText(), /掲載条件：イージーレーティング1501以上（対戦数不問）/);
      assert.equal(await view.getByRole('button', { name: 'イージー', exact: true }).getAttribute('aria-pressed'), 'true');
      await view.getByRole('button', { name: 'ノーマル', exact: true }).click();
      await view.getByText(/掲載条件：ノーマルの有効な人間対戦3戦以上/).waitFor();
      const normal = await view.locator('.rk-row').evaluateAll((es) => es.map((e) => [Number(e.dataset.rank), e.querySelector('.rk-name').textContent, e.querySelector('.rk-val b').textContent]));
      assert.deepEqual(normal, [[1, 'Rival', '1620'], [2, 'Teacher', '1550']], 'listing rule unchanged: Third has only 1 human game');
      assert.match(await view.locator('.rk-selfcard').innerText(), /1550/);
      // the player card still opens from a name; titles section is kept
      await view.getByRole('button', { name: 'Rival', exact: true }).click();
      await p.locator('.fixed.inset-0').getByText('Rival').first().waitFor();
      await p.locator('.fixed.inset-0').getByRole('button', { name: 'とじる', exact: true }).first().click();
      await p.getByRole('heading', { name: '獲得した称号' }).waitFor();
      for (const btn of await view.getByRole('button').all()) { const box = await btn.boundingBox(); if (box) assert(box.height >= 43.5, 'tap target >=44px ' + box.height); }
      assert(!await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), 'rating overflow ' + width);
      assert.equal(JSON.stringify(tree.games.factor.onlineSparkV1.profiles.ap2), JSON.stringify(pr('Rival', 1750, 10, 1620, 8)), 'ratings untouched');
      await p.getByRole('button', { name: 'ランキング総合へ戻る', exact: true }).click();
      await p.locator('.ranking-grid').waitFor();
      assert.equal(await p.locator('.ranking-entry').count(), 2);
      assert.deepEqual(t.errors, []);
      await t.ctx.close();
      console.log(`PASS rating ranking ${width}x${height}: easy/normal tabs, listing rule, self rank, player card, titles kept, one back button`);
    }
    {
      const t = await context(b, { tree: { games: { factor: { accounts: { ateacher: { name: 'Teacher', stats: {} } }, onlineSparkV1: { config: { enabled: true, protocol: 'spark-v1' }, profiles: { ateacher: { name: 'Teacher', easy: { rating: 1500, maxRating: 1500, games: 0 }, normal: { rating: 1500, maxRating: 1500, games: 0 } } } } } } } }), p = t.page;
      await openRankingHub(p);
      await p.locator('.ranking-entry').filter({ hasText: 'レーティングランキング' }).click();
      await p.locator('[data-ranking="rating"]').getByText('掲載条件を満たすプレイヤーはまだいません').waitFor();
      assert.match(await p.locator('[data-ranking="rating"] .rk-selfcard').innerText(), /自分の順位：未掲載/);
      await t.ctx.close();
      console.log('PASS rating ranking empty state keeps the self card');
    }
    {
      // the online lobby's own rating screen keeps its header and "back to online"
      const profiles = { ateacher: { name: 'Teacher', easy: { rating: 1600, maxRating: 1600, games: 1 }, normal: { rating: 1500, maxRating: 1500, games: 0 } } };
      const t = await context(b, { tree: { games: { factor: { accounts: { ateacher: { name: 'Teacher', stats: {} } }, onlineSparkV1: { config: { enabled: true, protocol: 'spark-v1' }, profiles } } } } }), p = t.page;
      await p.locator('.action-card.online').click();
      await p.getByRole('button', { name: 'オンラインレーティング', exact: true }).click();
      await p.getByRole('button', { name: 'オンラインへ戻る', exact: true }).waitFor();
      assert.equal(await p.locator('[data-ranking="rating"]').count(), 0, 'lobby screen is not the ranking list');
      await t.ctx.close();
      console.log('PASS online lobby rating screen unchanged');
    }
  } finally {
    await b.close();
  }
})().catch((e) => { console.error(e); process.exitCode = 1; });
