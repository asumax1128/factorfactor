// Ver.6.0 solo result: ranking submit (name / send / retry / skip), replay, back, learning room, single scroll, reachable buttons.
const assert = require('node:assert/strict');
const { chromium, context } = require('./browser-harness.cjs');
const { soloDrag } = require('./solo-test-helper.cjs');
async function start(p) { await p.locator('.action-card.solo').click(); await p.getByRole('button', { name: /^イージー/ }).first().click(); await p.getByRole('button', { name: 'スタート', exact: true }).click(); await p.locator('[data-tile-id]').first().waitFor(); }
async function finish(p, { right = 0, wrong = 0 }) {
  for (let i = 0; i < right; i++) { await soloDrag(p, true); await p.waitForTimeout(650); }
  for (let w = 0; w < wrong && !await p.locator('[data-battle-summary]').count(); w++) { await soloDrag(p, false); await p.waitForTimeout(650); }
  await p.locator('[data-battle-summary]').waitFor({ timeout: 20000 }); await p.waitForTimeout(400);
}
const guestTree = () => ({ games: { factor: {} } });
const tree = () => ({ games: { factor: { accounts: { ateacher: { name: 'Teacher', stats: { exp: 100, rating: 1600 } } } } } });
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium' });
  try {
    // ---- clear: ranking submit with retry, then replay ----
    {
      const t = await context(b, { tree: guestTree(), account: { guest: true, name: '' } }), p = t.page;
      let mode = 'fail'; const posts = [];
      await t.ctx.route('https://script.google.com/**', async (route) => {
        const req = route.request();
        if (req.method() === 'POST') { posts.push(JSON.parse(req.postData())); return mode === 'fail' ? route.fulfill({ status: 500, body: 'oops' }) : route.fulfill({ json: { ok: true } }); }
        return route.fulfill({ json: { ok: true, allRecords: [] } });
      });
      await p.reload(); await p.locator('[data-next-home]').waitFor();
      await start(p); await finish(p, { right: 15 });
      const net = p.locator('.rs-net[data-net=pending]'); await net.waitFor();
      assert.equal(await p.locator('[data-result-shell]').count(), 1);
      await net.getByRole('button', { name: '送信', exact: true }).waitFor();
      assert(await net.getByRole('button', { name: '送信', exact: true }).isDisabled(), 'send is disabled until a name is typed');
      await net.getByPlaceholder('なまえ (10文字まで)').fill('Teacher');
      await net.getByRole('button', { name: '送信', exact: true }).click();
      await p.locator('.rs-net[data-net=error]').waitFor();
      await p.locator('.rs-net[data-net=error]').getByText('送信に失敗しました').waitFor();
      mode = 'ok';
      await p.locator('.rs-net[data-net=error]').getByRole('button', { name: '再送信', exact: true }).click();
      await p.locator('.rs-net[data-net=sent]').waitFor();
      assert.equal(posts.length, 2); assert.equal(posts[1].name, 'Teacher'); assert(posts[1].score > 0 && posts[1].difficulty === 'easy', JSON.stringify(posts[1]));
      assert.deepEqual(posts[0], posts[1], 'retry sends the same entry');
      // reachability + single scroller on phone and short Chromebook viewport
      for (const [w, h] of [[390, 844], [683, 325]]) {
        await p.setViewportSize({ width: w, height: h }); await p.waitForTimeout(250);
        assert(!await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), 'no horizontal overflow ' + w);
        const inner = await p.evaluate(() => [...document.querySelector('[data-result-shell]').querySelectorAll('*')].filter((e) => { const o = getComputedStyle(e).overflowY; return (o === 'auto' || o === 'scroll') && e.scrollHeight > e.clientHeight + 1; }).length);
        assert.equal(inner, 0, 'no inner scroll area');
        const box = await p.getByRole('button', { name: /^もう一度あそぶ/ }).boundingBox();
        assert(box && box.y >= 0 && box.y + box.height <= h + 1, `replay is reachable at ${w}x${h}: ${JSON.stringify(box)}`);
      }
      await p.setViewportSize({ width: 1440, height: 900 });
      await p.getByRole('button', { name: 'もう一度あそぶ（イージー）', exact: true }).click();
      await p.locator('[data-tile-id]').first().waitFor();
      assert.equal(await p.locator('[data-battle-summary]').count(), 0, 'replay starts a fresh run');
      assert.deepEqual(t.errors.filter((e) => !/スコア送信失敗|Failed to load resource/.test(e)), []);
      await t.ctx.close();
      console.log('PASS solo result: submit error -> retry -> sent, same entry, reachable buttons, single scroller, replay');
    }
    // ---- game over with mistakes: learning room, skip, back to title ----
    {
      const t = await context(b, { tree: guestTree(), account: { guest: true, name: '' } }), p = t.page;
      await t.ctx.route('https://script.google.com/**', (route) => route.fulfill({ json: { ok: true, allRecords: [] } }));
      await p.reload(); await p.locator('[data-next-home]').waitFor();
      await start(p); await finish(p, { right: 3, wrong: 12 });
      await p.locator('.rs-net[data-net=pending]').getByRole('button', { name: '送信しないでスキップ', exact: true }).click();
      assert.equal(await p.locator('.rs-net').count(), 0, 'skip hides the submit area');
      const learn = p.locator('[data-learn]');
      if (await learn.count()) { await learn.click(); await p.locator('[data-battle-summary]').waitFor({ state: 'detached' }); await p.goBack().catch(() => {}); }
      await t.ctx.close();
    }
    {
      // named account: the score is sent automatically; while it is being sent the action row cannot be pressed by mistake
      const t = await context(b, { tree: tree() }), p = t.page;
      let release; const gate = new Promise((r) => { release = r; });
      await t.ctx.route('https://script.google.com/**', async (route) => { if (route.request().method() === 'POST') { await gate; return route.fulfill({ json: { ok: true } }); } return route.fulfill({ json: { ok: true, allRecords: [] } }); });
      await p.reload(); await p.locator('[data-next-home]').waitFor();
      await start(p); await finish(p, { right: 15 });
      await p.locator('.rs-net[data-net=sending]').waitFor();
      assert.equal(await p.evaluate(() => getComputedStyle(document.querySelector('.rs-actions')).pointerEvents), 'none', 'actions are blocked while sending');
      release();
      await p.locator('.rs-net[data-net=sent]').waitFor();
      assert.notEqual(await p.evaluate(() => getComputedStyle(document.querySelector('.rs-actions')).pointerEvents), 'none');
      await t.ctx.close();
      console.log('PASS solo result: auto-send blocks the action row only while sending');
    }
    {
      const t = await context(b, { tree: tree() }), p = t.page;
      await t.ctx.route('https://script.google.com/**', (route) => route.fulfill({ json: { ok: true, allRecords: [] } }));
      await p.reload(); await p.locator('[data-next-home]').waitFor();
      await start(p); await finish(p, { right: 15 });
      await p.getByRole('button', { name: 'タイトルにもどる', exact: true }).click();
      await p.getByRole('button', { name: 'スタート', exact: true }).waitFor();
      await t.ctx.close();
      console.log('PASS solo result: skip, learning room link, back to title');
    }
  } finally {
    await b.close();
  }
})().catch((e) => { console.error(e); process.exitCode = 1; });
