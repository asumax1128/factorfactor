// Ver.6.0 random-match result: unified WIN!/DRAW/LOSE, kept rating/EXP/origin texts, data-driven comparison/highlights,
// shared title reveal (no replay), and the unchanged ackReceipt exit.
const assert = require('node:assert/strict'), fs = require('node:fs');
const { chromium, context, pair, sleep } = require('./browser-harness.cjs');
const ui = fs.readFileSync('online-rated-ui.js', 'utf8') + `
(()=>{const f=window.OnlineRatedFactory;window.OnlineRatedFactory=H=>{window.__H=H;window.__cmds=[];const c=H.createTransport;H.createTransport=a=>{const t=c(a);return{close:()=>t.close(),request:async q=>{window.__cmds.push(q.type);if(q.type==='ackReceipt'&&window.__failAck){window.__cmds.push('ack-failed');throw Error('ACK_FAILED')}const s=await t.request(q);window.__s=s;return s}}};return f(H)}})();`;
const base = { id: 'm1', origin: 'quick', difficulty: 'easy', opponent: { type: 'bot', name: 'Bot' }, exp: 8, selfUid: 'u1', receipt: { players: { ateacher: { before: 1665.6, after: 1670.1, delta: 4.5 } } } };
const A = { mode: 'A', members: [{ uid: 'u1', name: 'Teacher' }, { uid: 'u2', name: 'Rival' }],
  aResult: { consistent: true, ids: ['u1', 'u2'], scores: { u1: 30, u2: 20 }, best: { u1: 3, u2: 2 }, events: [
    { id: 1, question: 1, winner: 'u2', pts: 10, ms: 1500, totals: { u1: 0, u2: 10 } },
    { id: 2, question: 2, winner: 'u1', pts: 10, ms: 900, totals: { u1: 10, u2: 10 } },
    { id: 3, question: 3, winner: 'u1', pts: 10, ms: 1100, totals: { u1: 20, u2: 10 } },
    { id: 4, question: 4, winner: 'u2', pts: 10, ms: 1200, totals: { u1: 20, u2: 20 } },
    { id: 5, question: 5, winner: 'u1', pts: 10, ms: 800, totals: { u1: 30, u2: 20 } }] } };
async function render(p, m, extra = {}) {
  await p.evaluate(({ m, extra }) => {
    document.getElementById('rr')?.remove();
    const el = document.createElement('div'); el.id = 'rr'; el.style.cssText = 'position:fixed;inset:0;z-index:99999;overflow:auto;background:#101720;padding:12px'; document.body.appendChild(el);
    window.__exits = 0;
    ReactDOM.createRoot(el).render(React.createElement(window.OnlineRatedFactory(window.__H).Result, { H: window.__H, acct: { key: 'ateacher' }, state: { badges: extra.badges || {} }, titles: extra.titles || {}, badgesBefore: extra.before || {}, busy: !!extra.busy, onExit() { window.__exits++; }, m }));
  }, { m, extra });
  await p.locator('#rr [data-result-kind]').waitFor();
}
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium' });
  try {
    const tree = { games: { factor: { accounts: { ateacher: { name: 'Teacher', stats: { rating: 1600, exp: 100 } } }, onlineSparkV1: { config: { enabled: true, protocol: 'spark-v1' } } } } };
    const t = await context(b, { tree, assetOverrides: { '/online-rated-ui.js': ui } }), p = t.page;
    await p.waitForFunction(() => !!window.__H);
    // 1. words, rating/EXP/origin texts kept
    for (const [outcome, word] of [['win', 'WIN!'], ['draw', 'DRAW'], ['lose', 'LOSE']]) {
      await render(p, { ...base, outcome });
      assert.equal(await p.locator('#rr .nbr-word').innerText(), word);
      assert.equal(await p.locator('#rr [data-result-kind]').getAttribute('data-result-kind'), outcome);
      assert.equal(await p.locator('#rr .or-delta').innerText(), 'レート +5');
      await p.locator('#rr').getByText('1666 → 1670', { exact: true }).waitFor();
      assert.match(await p.locator('#rr .or-exp').innerText(), /獲得EXP\s*\+8/);
      assert.match(await p.locator('#rr').innerText(), /イージーのみ更新（変動は人間戦の1\/3）/);
      assert.equal(await p.locator('#rr .or-victory-rays').count(), outcome === 'win' ? 1 : 0);
      assert.equal(await p.locator('#rr [data-new-title]').count(), 0);
      assert.equal(await p.locator('#rr .nbr-cmp').count(), 0, 'no comparison without recorded per-player data');
    }
    await render(p, { ...base, outcome: 'win', origin: 'profile', opponent: { name: 'X' } });
    assert.match(await p.locator('#rr').innerText(), /指名戦：公式レート・対戦数は変更しません/);
    await p.getByRole('button', { name: '一覧へ戻る', exact: true }).waitFor();
    await render(p, { ...base, outcome: 'win', selfPractice: true, opponent: { name: 'Me' } });
    assert.match(await p.locator('#rr').innerText(), /自分のゴーストとの練習：レート・勝敗・EXP・称号・学習記録は更新しません/);
    // 2. comparison + highlights only from existing records
    await render(p, { ...base, ...A, outcome: 'win' });
    await p.locator('#rr .nbr-cmp').waitFor();
    const rows = await p.locator('#rr .nbr-cmp [data-row]').evaluateAll((es) => es.map((e) => e.dataset.row));
    assert(rows.includes('score') && rows.includes('won') && rows.includes('combo'), rows.join());
    assert(!rows.includes('perfect'), 'Perfect needs per-claim judgement: not recorded, so not shown');
    assert.match(await p.locator('#rr .nbr-score').innerText(), /30\s*VS\s*20/);
    assert((await p.locator('#rr .nbr-card').count()) >= 1, 'highlights derived from the confirmed events');
    assert.match(await p.locator('#rr .nbr-hl').innerText(), /リード交代|最速|連続|最大得点/);
    assert.match(await p.locator('#rr').innerText(), /記録がない項目は表示していません/);
    assert(await p.locator('#rr [data-a-result]').count() === 1, 'A score trace kept');
    // 3. new title: shared reveal, once per match
    const titles = { hyper_slayer: '超影の征服者' };
    await render(p, { ...base, outcome: 'win' }, { badges: { hyper_slayer: true }, titles });
    await p.locator('#rr [data-new-title] .rs-title-card[data-revealed=true]').waitFor({ timeout: 4000 });
    assert.match(await p.locator('#rr [data-new-title]').innerText(), /超影の征服者/);
    await render(p, { ...base, outcome: 'win' }, { badges: { hyper_slayer: true }, titles });          // same match shown again
    assert.equal(await p.locator('#rr [data-new-title] .rs-title-back').count(), 0, 'already revealed: no flip-back animation replay');
    assert.equal(await p.locator('#rr [data-new-title] [data-revealed=true]').count(), 1, 'cards show immediately');
    await render(p, { ...base, outcome: 'win' }, { badges: { hyper_slayer: true }, titles, before: { hyper_slayer: true } });
    assert.equal(await p.locator('#rr [data-new-title]').count(), 0, 'a title already owned is never presented as new');
    // 4. buttons: busy blocks, normal click calls the callback once
    await render(p, { ...base, outcome: 'win' }, { busy: true });
    assert.equal(await p.getByRole('button', { name: 'オンラインメニューへ戻る', exact: true }).isDisabled(), true);
    assert.equal(await p.evaluate(() => getComputedStyle(document.querySelector('#rr .rs-actions')).pointerEvents), 'none');
    await render(p, { ...base, outcome: 'win' });
    await p.getByRole('button', { name: 'オンラインメニューへ戻る', exact: true }).click();
    assert.equal(await p.evaluate(() => window.__exits), 1);
    assert.equal(await p.getByRole('button', { name: /再戦|もう一戦/ }).count(), 0, 'no rematch button is invented');
    // 5. narrow / short viewports: nothing overflows, exit button reachable
    for (const [w, h] of [[375, 844], [683, 325]]) {
      await p.setViewportSize({ width: w, height: h });
      await render(p, { ...base, ...A, outcome: 'lose' });
      assert(!await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), 'overflow ' + w);
      const box = await p.getByRole('button', { name: 'オンラインメニューへ戻る', exact: true }).boundingBox();
      assert(box && box.y >= 0 && box.y + box.height <= h + 1, `exit reachable ${w}x${h}: ${JSON.stringify(box)}`);
    }
    assert.deepEqual(t.errors, []);
    await t.ctx.close();
    console.log('PASS random-match result: WIN!/DRAW/LOSE, rating/EXP/origin kept, data-driven comparison, title reveal once, buttons, viewports');
    // 6. real flow: ackReceipt is sent once per click; a failure keeps the result on screen, a retry succeeds and leaves
    {
      const tr = { games: { factor: { accounts: { ateacher: { name: 'Teacher', stats: { rating: 1600, exp: 100 }, prof: { lv: { L1: { n: 30, ok: 20, ms: 360000 } } } } }, onlineSparkV1: { config: { enabled: true, protocol: 'spark-v1' } } } } };
      const r = await context(b, { tree: tr, assetOverrides: { '/online-rated-ui.js': ui } }), q = r.page;
      await q.locator('.action-card.solo').click(); await q.getByRole('button', { name: '成績', exact: true }).click(); await q.getByRole('button', { name: /称号の装備・詳細記録/ }).click();
      await q.getByRole('button', { name: 'イージーで自分のゴースト対戦', exact: true }).waitFor();
      await q.waitForFunction(() => [...document.querySelectorAll('button')].some((x) => x.textContent === 'イージーで自分のゴースト対戦' && !x.disabled));
      await q.getByRole('button', { name: 'イージーで自分のゴースト対戦', exact: true }).click();
      await q.getByRole('button', { name: 'B：レース＋攻撃', exact: true }).click(); await q.locator('.or-countdown').waitFor();
      await q.getByLabel('対戦開始', { exact: true }).waitFor(); await q.waitForFunction(() => document.querySelector('[data-online-ready]')?.dataset.onlineReady === 'true');
      q.once('dialog', (d) => d.accept()); await sleep(300);
      await q.getByRole('button', { name: '✕ 退出', exact: true }).click();
      await q.locator('.or-result').waitFor();
      const startCmds = await q.evaluate(() => window.__cmds.filter((c) => c === 'ackReceipt').length);
      await q.evaluate(() => { window.__failAck = true; });
      const exit = q.locator('.or-result .rs-actions .rs-btn');
      await exit.click();
      await q.waitForFunction(() => window.__cmds.includes('ack-failed'));
      assert.equal(await q.locator('.or-result').count(), 1, 'a failed receipt keeps the result visible (current behaviour)');
      assert.equal(await q.evaluate(() => window.__cmds.filter((c) => c === 'ackReceipt').length), startCmds + 1, 'one ack attempt per click');
      await q.evaluate(() => { window.__failAck = false; });
      await q.locator('.or-result .rs-actions .rs-btn').click();
      await q.locator('.or-result').waitFor({ state: 'detached' });
      assert.equal(await q.evaluate(() => window.__cmds.filter((c) => c === 'ackReceipt').length), startCmds + 2, 'retry = exactly one more ack, which succeeded');
      await r.ctx.close();
      console.log('PASS random-match result: ackReceipt once per click, failure stays on the result, retry leaves');
    }
  } finally {
    await b.close();
  }
})().catch((e) => { console.error(e); process.exitCode = 1; });
