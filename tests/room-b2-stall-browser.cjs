// Ver.6.2 hotfix: a 4-digit room B2 participant can leave safely when the shared state stops being processed.
const assert = require('node:assert/strict'), { chromium, context, drag } = require('./browser-harness.cjs'), E = require('../server/online-rated/engine.cjs'), C = require('../src/room-b2-client.cjs');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const accounts = { ah: { name: 'Host', stats: { exp: 100, rating: 1500 } }, ag: { name: 'Guest', stats: { exp: 100, rating: 1500 } } };
// ---- pure decisions (no browser) ----
{
  const cfg = { warnMs: 10000, leaveMs: 20000 };
  assert.equal(C.health({ online: true, serverAge: 500, localAge: 500 }, cfg), 'ok');
  assert.equal(C.health({ online: true, serverAge: 12000, localAge: 12000 }, cfg), 'warn');
  assert.equal(C.health({ online: true, serverAge: 21000, localAge: 21000 }, cfg), 'stopped');
  assert.equal(C.health({ online: false, serverAge: 90000, localAge: 90000 }, cfg), 'offline', 'our own offline state is never reported as a stalled room');
  assert.equal(C.health({ online: true, serverAge: 90000, localAge: 200 }, cfg), 'ok', 'a fresh reconnect/resume restarts the count');
  assert.equal(C.health({ online: true, serverAge: 300, localAge: 90000 }, cfg), 'ok', 'a fresh server clock means the state is moving');
  assert.equal(C.decide({ ok: true, result: { winner: 'a' } }), 'result', 'a confirmed result wins over leaving');
  assert.equal(C.decide({ ok: true, result: null }), 'unconfirmed');
  assert.equal(C.decide({ ok: false, error: 'READ_TIMEOUT' }), 'unreadable', 'a failed read is not "no result"');
  assert.equal(C.decide(undefined), 'unreadable');
  console.log('PASS decisions: health matrix and result/unconfirmed/unreadable');
}
async function setup(b, { width = 390, height = 844, duration } = {}) {
  const tree = { games: { factor: { accounts: structuredClone(accounts), onlineSparkV1: { config: { enabled: true, protocol: 'spark-v1' } } } } }, peers = [];
  const gate = { frozen: false, waiters: [] }, h = await context(b, { tree, peers, uid: 'host', account: { key: 'ah', name: 'Host' }, onOperation: async () => { if (gate.frozen) await new Promise((r) => gate.waiters.push(r)); } }), g = await context(b, { tree, peers, uid: 'guest', account: { key: 'ag', name: 'Guest' } });
  for (const t of [h, g]) { await t.page.setViewportSize({ width, height }); await t.page.getByRole('button', { name: 'オンライン対戦・CPU練習', exact: true }).click(); }
  // expose the guest transport + view callback for the injected-result case
  await g.page.evaluate(() => { const c = RoomB2.create; RoomB2.create = (o) => { const t = c({ ...o, onView: (r) => { window.__raw = r; o.onView(r); } }); window.__b2 = t; window.__onView = o.onView; return t; }; RoomB2.config.warnMs = 1500; RoomB2.config.leaveMs = 3000; });
  await h.page.getByRole('button', { name: '部屋を作る（ホスト）', exact: true }).click();
  await h.page.waitForFunction(() => /^[0-9]{4}$/.test(document.querySelector('.tracking-widest')?.textContent.trim() || ''));
  const code = (await h.page.locator('.tracking-widest').innerText()).trim();
  await g.page.getByPlaceholder('部屋コード4桁').fill(code); await g.page.getByRole('button', { name: '参加', exact: true }).click();
  await g.page.getByText('部屋コード', { exact: true }).waitFor();
  if (duration) await h.page.getByRole('button', { name: `${duration}秒`, exact: true }).click();
  await h.page.getByRole('button', { name: /対戦スタート/ }).click();
  for (const t of [h, g]) await t.page.locator('[data-btile]').first().waitFor({ timeout: 15000 });
  // the host stops processing: its writes hang (a backgrounded/suspended phone); resume lets the late writes land
  const freeze = async () => { gate.frozen = true; }, resume = async () => { gate.frozen = false; gate.waiters.splice(0).forEach((r) => r()); };
  const b2 = () => Object.values(tree.games.factor.rooms[code].b2)[0], close = async () => { await h.ctx.close(); await g.ctx.close(); };
  return { h, g, tree, code, freeze, resume, b2, close };
}
const panel = (p) => p.locator('[data-b2-stall]');
const inputsOf = (s, u) => Object.keys(s.b2().inputs?.[u] || {});
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium' });
  try {
    { // S1: no false positives, offline-only, stop, recheck, recovery, no double send, tiny screen
      const s = await setup(b, { width: 320, height: 568 });
      await sleep(4500);
      assert.equal(await panel(s.g.page).count(), 0, 'an idle but live room never shows the notice');
      assert.equal(await panel(s.h.page).count(), 0, 'the host never gets the notice');
      await s.g.page.evaluate(() => { FB.conn = false; }); await panel(s.g.page).waitFor();
      assert.equal(await panel(s.g.page).getAttribute('data-b2-stall'), 'offline'); assert.match(await panel(s.g.page).innerText(), /通信を確認中/);
      await sleep(3600);
      assert.equal(await panel(s.g.page).getAttribute('data-b2-stall'), 'offline', 'own offline is not read as a stalled room, however long it lasts');
      assert.equal(await s.g.page.getByRole('button', { name: '結果未確定のままホームへ戻る' }).count(), 0);
      await s.g.page.evaluate(() => { FB.conn = true; }); await panel(s.g.page).waitFor({ state: 'detached' });
      // host stops (frozen like a backgrounded phone): offline + stalled still reads "checking connection", then stops after the grace
      await s.freeze(); await sleep(500); const before = inputsOf(s, 'guest').length;
      await s.g.page.evaluate(() => { FB.conn = false; }); await sleep(3600);
      assert.equal(await panel(s.g.page).getAttribute('data-b2-stall'), 'offline');
      await s.g.page.evaluate(() => { FB.conn = true; });
      assert.notEqual(await panel(s.g.page).getAttribute('data-b2-stall').catch(() => null), 'stopped', 'a reconnect restarts the count');
      await s.g.page.locator('[data-b2-stall="stopped"]').waitFor({ timeout: 9000 });
      const txt = await panel(s.g.page).innerText();
      assert.match(txt, /試合の同期が停止しています/); assert.match(txt, /結果は確定していません/); assert(!/切断|引き分け|無効|反映されない/.test(txt), 'no conclusion about the host or the result: ' + txt);
      const boxes = await s.g.page.evaluate(() => [...document.querySelectorAll('[data-b2-stall] button')].map((e) => { const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, h: r.height, label: e.textContent }; }));
      assert.equal(boxes.length, 2); for (const x of boxes) assert(x.h >= 44 && x.l >= 0 && x.r <= 320 && x.b <= 568, 'tap target fits a 320px phone ' + JSON.stringify(x));
      assert(!await s.g.page.evaluate(() => document.documentElement.scrollWidth > innerWidth), 'no horizontal scroll');
      await drag(s.g.page).catch(() => {}); await sleep(400);
      assert.equal(inputsOf(s, 'guest').length, before, 'answers are not accepted while stopped');
      const w0 = s.g.writes.length; await s.g.page.getByRole('button', { name: '再接続を確認' }).click();
      await s.g.page.getByText('まだ同期が戻っていません').waitFor(); assert.equal(await panel(s.g.page).getAttribute('data-b2-stall'), 'stopped');
      assert.equal(s.g.writes.length, w0, 'checking the connection writes nothing');
      await s.resume(); await panel(s.g.page).waitFor({ state: 'detached', timeout: 8000 });
      const n0 = inputsOf(s, 'guest').length; await drag(s.g.page); await sleep(1200);
      const mine = inputsOf(s, 'guest').filter((k) => /^a\d+$/.test(k)); assert.equal(mine.length, n0 + 1, 'recovery sends the next answer once, not a replay: ' + mine);
      assert.deepEqual(s.g.errors, []); assert.deepEqual(s.h.errors, []); await s.close();
      console.log('PASS room B2 stall: no false positive (idle/offline/reconnect), stop notice, blocked answers, recheck, recovery, single answer, 320px');
    }
    { // S2: safe leave when nothing is confirmed (real read) + rapid taps + shared state untouched
      const s = await setup(b); await s.freeze(); await s.g.page.locator('[data-b2-stall="stopped"]').waitFor({ timeout: 12000 });
      const snap = JSON.stringify(s.tree.games.factor.rooms[s.code]), statsBefore = JSON.stringify(s.tree.games.factor.accounts), w0 = s.g.writes.length;
      const btn = s.g.page.getByRole('button', { name: '結果未確定のままホームへ戻る' }); await btn.dblclick(); await btn.click({ timeout: 500 }).catch(() => {});
      await s.g.page.locator('.v7-bhome-wrap, [data-next-home]').first().waitFor({ timeout: 8000 });
      assert.match(await s.g.page.locator('body').innerText(), /結果は確定していません/);
      const ops = s.g.writes.slice(w0).filter((o) => !/^games\/factor\/presence\//.test(o.path)); // the lobby presence heartbeat is the app's normal screen-change write
      assert(ops.every((o) => o.kind === 'set' && o.path === `games/factor/rooms/${s.code}/players/guest` && o.v === null) && ops.length === 1, 'only the own presence is removed, once: ' + JSON.stringify(ops));
      const after = JSON.parse(JSON.stringify(s.tree.games.factor.rooms[s.code]));
      assert.equal(JSON.stringify(after.b2), JSON.stringify(JSON.parse(snap).b2), 'the shared match state and result are unchanged');
      assert.equal(after.state.phase, 'play', 'the room is not closed'); assert.equal(JSON.stringify(s.tree.games.factor.accounts), statsBefore, 'no rating/EXP/title/stat write');
      const w1 = s.g.writes.length; await s.g.page.reload(); await sleep(800); assert.equal(s.g.writes.slice(w1).filter((o) => /\/b2\//.test(o.path)).length, 0, 'a reload does not touch the match');
      await s.close(); console.log('PASS safe leave: home reached, one presence removal, match/result/stats/room untouched, double tap and reload safe');
    }
    { // S3: unreadable result is reported as unreadable, never as "no result"
      const s = await setup(b); await s.freeze(); await s.g.page.locator('[data-b2-stall="stopped"]').waitFor({ timeout: 12000 });
      await s.g.page.evaluate(() => { window.__b2.refresh = async () => ({ ok: false, error: 'READ_TIMEOUT' }); });
      await s.g.page.getByRole('button', { name: '結果未確定のままホームへ戻る' }).click();
      await s.g.page.locator('.v7-bhome-wrap, [data-next-home]').first().waitFor({ timeout: 8000 });
      const t = await s.g.page.locator('body').innerText(); assert.match(t, /読み取れませんでした/); assert(!/引き分け|無効試合|反映されない/.test(t)); await s.close();
      console.log('PASS read failure: shown as unreadable, not as a draw / no result');
    }
    { // S4: a result confirmed just before leaving takes the normal result path (no leave)
      const s = await setup(b); await s.freeze(); await s.g.page.locator('[data-b2-stall="stopped"]').waitFor({ timeout: 12000 });
      const fin = await s.g.page.evaluate(() => window.__raw.game), api = E; let g = structuredClone(fin);
      g = E.step(g, 'host', { type: 'heartbeat' }, g.endAt + 1); assert(g.result, 'finished fixture');
      await s.g.page.evaluate((game) => { window.__b2.refresh = async () => { window.__onView({ ...window.__raw, game }); return { ok: true, result: game.result }; }; }, g);
      const w0 = s.g.writes.length; await s.g.page.getByRole('button', { name: '結果未確定のままホームへ戻る' }).click(); await sleep(1200);
      assert.equal(await s.g.page.locator('[data-b2-stall]').count(), 0, 'the stall notice is gone once the result is shown');
      assert(!await s.g.page.locator('.v7-bhome-wrap, [data-next-home]').count(), 'not sent home: the normal result screen has priority');
      assert.equal(s.g.writes.slice(w0).filter((o) => o.path.endsWith('/players/guest') && o.v === null).length, 0, 'presence is not removed');
      await s.close(); console.log('PASS result first: a confirmed result is handled by the normal result flow, no early leave');
    }
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
