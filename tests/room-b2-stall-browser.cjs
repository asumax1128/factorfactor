// Ver.6.2 hotfix: a 4-digit room B2 participant can leave safely when the shared state stops being processed.
const assert = require('node:assert/strict'), { chromium, context, drag } = require('./browser-harness.cjs'), E = require('../server/online-rated/engine.cjs'), C = require('../src/room-b2-client.cjs'), K = require('../src/streak-next.cjs');
const ONLY = process.env.ONLY, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
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
  assert.equal(C.health({ online: true, serverAge: 300, localAge: 300, lagMs: 25000 }, cfg), 'stopped', 'the clock moves but the game is not processed');
  assert.equal(C.health({ online: true, serverAge: 300, localAge: 300, lagMs: 900 }, cfg), 'ok', 'one slow tick is normal');
  assert.equal(C.decide({ ok: true, result: { winner: 'a' } }), 'result', 'a confirmed result wins over leaving');
  assert.equal(C.decide({ ok: true, result: null }), 'unconfirmed');
  assert.equal(C.decide({ ok: false, error: 'READ_TIMEOUT' }), 'unreadable', 'a failed read is not "no result"');
  assert.equal(C.decide(undefined), 'unreadable');
  // processing(): healthy idle match (nobody answers) vs. clock-only
  const live = { clock: 50000, game: { startAt: 10000, time: 49500, seq: { g: 0 } }, inputs: {}, handled: {} };
  assert(C.processing(live, 'g') <= 1000, 'a healthy idle match has ~one tick of lag');
  assert.equal(C.processing({ ...live, clock: 8000, game: { ...live.game, time: 10000 } }, 'g'), 0, 'countdown is not judged');
  assert.equal(C.processing({ ...live, game: { ...live.game, result: { winner: 'a' } } }, 'g'), 0, 'a finished game is not judged');
  assert(C.processing({ ...live, game: { ...live.game, time: 20000 } }, 'g') >= 30000, 'game.time stuck while the clock runs');
  const pend = { ...live, inputs: { g: { a1: { type: 'answer', seq: 1, at: 30000 } } } };
  assert(C.processing(pend, 'g') >= 20000, 'my next-expected answer left unhandled while the host keeps writing');
  assert(C.processing({ ...pend, handled: { g: { a1: true } } }, 'g') <= 1000, 'handled inputs do not count');
  assert(C.processing({ ...live, inputs: { g: { a5: { type: 'answer', seq: 5, at: 1 } } } }, 'g') <= 1000, 'a sequence gap is deferred by design, not a stall');
  console.log('PASS decisions: health matrix, processing lag (idle/countdown/finished/stuck/unhandled/gap)');
}
// ---- real transport (RoomB2.create) with a controllable db: stale read vs live listener ----
(async () => {
  const mk = () => { const h = { on: null, pendingGets: [], gets: 0 }; const ref = { on: (e, cb) => { h.on = cb; }, off() {}, get: () => { h.gets++; return new Promise((res, rej) => h.pendingGets.push({ res, rej })); }, child: () => ref }; return { h, db: { ref: () => ref } }; };
  const snap = (v) => ({ val: () => v }), game = (rev, result) => ({ game: { id: 'G', ids: ['host', 'guest'], startAt: 1, time: rev, seq: {}, ...(result ? { result } : {}) }, revision: rev, clock: rev });
  { // listener delivers the result while an older get() is still in flight
    const { h, db } = mk(), views = []; const t = C.create({ db, code: '1111', state: { gid: 'G' }, uid: 'guest', isHost: false, onView: (r) => views.push(r), onError() {} });
    h.on(snap(game(5))); const p = t.refresh(); h.on(snap(game(8, { winner: 'host' }))); h.pendingGets[0].res(snap(game(6)));
    const r = await p; assert.equal(r.ok, true); assert.deepEqual(r.result, { winner: 'host' }, 'the result received first wins over the late older read');
    assert.equal(views.at(-1).revision, 8); assert(views.every((v, i) => !i || v.revision >= views[i - 1].revision), 'revision never goes backwards: ' + views.map((v) => v.revision));
    assert.equal(views.at(-1).game.result.winner, 'host'); t.close();
  }
  { // an older read is ignored; a late older listener event is ignored; a confirmed result is never reverted by a higher-revision snapshot without it
    const { h, db } = mk(), views = []; const t = C.create({ db, code: '1111', state: { gid: 'G' }, uid: 'guest', isHost: false, onView: (r) => views.push(r.revision), onError() {} });
    h.on(snap(game(7))); const p = t.refresh(); h.pendingGets[0].res(snap(game(3))); const r = await p;
    assert.equal(r.ok, true); assert.equal(r.result, null); assert.deepEqual(views, [7]); h.on(snap(game(2))); assert.deepEqual(views, [7]);
    h.on(snap(game(9, { winner: 'guest' }))); h.on(snap(game(12))); assert.deepEqual(views, [7, 9], 'a result is never un-confirmed'); t.close();
  }
  { // result already received: leaving does not even need a read, and a failing read cannot hide it
    const { h, db } = mk(); const t = C.create({ db, code: '1111', state: { gid: 'G' }, uid: 'guest', isHost: false, onView() {}, onError() {} });
    h.on(snap(game(4, { winner: 'host' }))); const r = await t.refresh(); assert.equal(r.ok, true); assert.equal(h.gets, 0); assert.equal(r.source, 'received'); t.close();
  }
  { // failures and timeouts are "unreadable", never "no result"
    const { h, db } = mk(); C.config.readMs = 80; const t = C.create({ db, code: '1111', state: { gid: 'G' }, uid: 'guest', isHost: false, onView() {}, onError() {} });
    h.on(snap(game(4))); const r = await t.refresh(); assert.equal(r.ok, false); assert.equal(C.decide(r), 'unreadable'); C.config.readMs = 4000; t.close();
  }
  for (const mode of ['reject', 'timeout', 'empty']) { // the result arrives through the listener while the read is in flight; the read then fails / times out / is empty
    const { h, db } = mk(), views = []; C.config.readMs = 60; const t = C.create({ db, code: '1111', state: { gid: 'G' }, uid: 'guest', isHost: false, onView: (r) => views.push(r), onError() {} });
    h.on(snap(game(5))); const p = t.refresh(); h.on(snap(game(8, { winner: 'host' })));
    if (mode === 'reject') h.pendingGets[0].rej(Error('network')); else if (mode === 'empty') h.pendingGets[0].res(snap(null));
    const r = await p; assert.equal(r.ok, true, mode); assert.equal(C.decide(r), 'result', 'a received result wins over a failed/empty/timed-out read: ' + mode); assert.equal(t.received().winner, 'host'); C.config.readMs = 4000; t.close();
  }
  console.log('PASS real transport: stale get() never overwrites a newer/confirmed state; received result needs no read; failures are unreadable');
})().then(main).catch((e) => { console.error(e); process.exitCode = 1; });
async function setup(b, { width = 390, height = 844, duration, stats, holdStats } = {}) {
  const tree = { games: { factor: { accounts: Object.assign(structuredClone(accounts), stats ? { ag: { name: 'Guest', stats } } : {}), onlineSparkV1: { config: { enabled: true, protocol: 'spark-v1' } } } } }, peers = [];
  // the host stops processing: its writes hang (a backgrounded/suspended phone); `clockOnly` keeps clock/revision moving but freezes the game
  const gate = { frozen: false, waiters: [], clockOnly: false, game: null }, ggate = { frozen: false, waiters: [], fail: null, stats: !!holdStats, sw: [] };
  const hold = (gt) => async () => { if (gt.frozen) await new Promise((r) => gt.waiters.push(r)); };
  const h = await context(b, { tree, peers, uid: 'host', account: { key: 'ah', name: 'Host' }, onOperation: async (op) => { if (gate.clockOnly && op.v && op.v.game && /\/b2\/[^/]+$/.test(op.path)) op.v = { ...op.v, game: gate.game }; await hold(gate)(); } });
  const g = await context(b, { tree, peers, uid: 'guest', account: { key: 'ag', name: 'Guest' }, onOperation: async (op) => { if (ggate.fail && ggate.fail.test(op.path)) throw new Error('NETWORK'); if (ggate.stats && /accounts\/ag\/stats/.test(op.path)) await new Promise((r) => ggate.sw.push(r)); await hold(ggate)(); } });
  for (const t of [h, g]) { await t.page.setViewportSize({ width, height }); await t.page.getByRole('button', { name: 'オンライン対戦（ロビー）', exact: true }).click(); }
  await g.page.evaluate(() => { const c = RoomB2.create; RoomB2.create = (o) => { const t = c({ ...o, onView: (r) => { window.__raw = r; o.onView(r); } }); window.__b2 = t; window.__onView = o.onView; return t; }; RoomB2.config.warnMs = 1500; RoomB2.config.leaveMs = 3000; });
  await h.page.getByRole('button', { name: '部屋を作る（ホスト）', exact: true }).click();
  await h.page.waitForFunction(() => /^[0-9]{4}$/.test(document.querySelector('.tracking-widest')?.textContent.trim() || ''));
  const code = (await h.page.locator('.tracking-widest').innerText()).trim();
  await g.page.getByPlaceholder('部屋コード4桁').fill(code); await g.page.getByRole('button', { name: '参加', exact: true }).click();
  await g.page.getByText('部屋コード', { exact: true }).waitFor();
  if (duration) await h.page.getByRole('button', { name: `${duration}秒`, exact: true }).click();
  await h.page.getByRole('button', { name: /対戦スタート/ }).click();
  for (const t of [h, g]) await t.page.locator('[data-btile]').first().waitFor({ timeout: 15000 });
  const freeze = async () => { gate.frozen = true; }, resume = async () => { gate.frozen = false; gate.waiters.splice(0).forEach((r) => r()); };
  const b2 = () => Object.values(tree.games.factor.rooms[code].b2)[0], close = async () => { await h.ctx.close(); await g.ctx.close(); };
  return { h, g, tree, code, gate, ggate, freeze, resume, b2, close };
}
const panel = (p) => p.locator('[data-b2-stall]');
const inputsOf = (s, u) => Object.keys(s.b2().inputs?.[u] || {});
const homeSel = '.v7-bhome-wrap, [data-next-home]';
const openOnline = (p) => p.getByRole('button', { name: 'オンライン対戦（ロビー）', exact: true }).click();
const pendLen = (p) => p.evaluate(() => JSON.parse(localStorage.getItem('fxf_b2_pending_v1') || '[]').length);
const banner = (p) => p.locator('[data-b2-recover]');
const statsOf = (s) => s.tree.games.factor.accounts.ag.stats || {};
// stalls the match, leaves safely, and returns a function that settles the match (as the returning host would) for the guest page
async function stopLeave(s) {
  await s.freeze(); await s.g.page.locator('[data-b2-stall="stopped"]').waitFor({ timeout: 12000 });
  const gid = s.b2().game.id; await s.g.page.getByRole('button', { name: '結果未確認のままホームへ戻る' }).click(); await s.g.page.locator(homeSel).first().waitFor({ timeout: 8000 });
  let fin = await s.g.page.evaluate(() => window.__raw.game); fin = E.step(fin, 'host', { type: 'heartbeat' }, fin.endAt + 1); assert(fin.result, 'finished fixture');
  const settle = async (extra = {}) => { const node = s.b2(); node.game = fin; node.revision = (node.revision || 0) + 1; Object.assign(node, extra); await s.g.page.evaluate((o) => window.__fbApply(o), { kind: 'set', path: `games/factor/rooms/${s.code}/b2/${gid}`, v: JSON.parse(JSON.stringify(node)) }); };
  return { gid, fin, settle };
}
async function main() {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium' });
  try {
    if (!ONLY || ONLY === 'S1') { // S1: no false positives, offline-only, stop, recheck, recovery, no double send, tiny screen
      const s = await setup(b, { width: 320, height: 568 });
      for (let i = 0; i < 6; i++) { await sleep(800); const lag = await s.g.page.evaluate(() => RoomB2.processing(window.__raw, 'guest')); assert(lag < 2500, 'a healthy idle match is processed every tick, lag=' + lag); }
      assert.equal(await panel(s.g.page).count(), 0, 'an idle but live room never shows the notice');
      assert.equal(await panel(s.h.page).count(), 0, 'the host never gets the notice');
      await s.g.page.evaluate(() => { FB.conn = false; }); await panel(s.g.page).waitFor();
      assert.equal(await panel(s.g.page).getAttribute('data-b2-stall'), 'offline'); assert.match(await panel(s.g.page).innerText(), /通信を確認中/);
      await s.g.page.evaluate(() => { FB.conn = true; }); await panel(s.g.page).waitFor({ state: 'detached' });
      await s.freeze(); await sleep(500); const before = inputsOf(s, 'guest').length;
      await s.g.page.evaluate(() => { FB.conn = false; }); await sleep(1500);
      assert.equal(await panel(s.g.page).getAttribute('data-b2-stall'), 'offline', 'offline + stalled host still reads as our own connection problem');
      await s.g.page.evaluate(() => { FB.conn = true; });
      assert.notEqual(await panel(s.g.page).getAttribute('data-b2-stall').catch(() => null), 'stopped', 'a reconnect restarts the count');
      await s.g.page.locator('[data-b2-stall="stopped"]').waitFor({ timeout: 9000 });
      const txt = await panel(s.g.page).innerText();
      assert.match(txt, /試合の同期が停止しています/); assert.match(txt, /最後に確認した時点では、結果は未確定です/); assert(!/切断|引き分け|無効|反映されない|確定していません/.test(txt), 'no conclusion about the host or the result: ' + txt);
      const boxes = await s.g.page.evaluate(() => [...document.querySelectorAll('[data-b2-stall] button')].map((e) => { const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, h: r.height }; }));
      assert.equal(boxes.length, 2); for (const x of boxes) assert(x.h >= 44 && x.l >= 0 && x.r <= 320 && x.b <= 568, 'tap target fits a 320px phone ' + JSON.stringify(x));
      assert(!await s.g.page.evaluate(() => document.documentElement.scrollWidth > innerWidth), 'no horizontal scroll');
      await drag(s.g.page).catch(() => {}); await sleep(400);
      assert.equal(inputsOf(s, 'guest').length, before, 'answers are not accepted while stopped');
      const w0 = s.g.writes.length; await s.g.page.getByRole('button', { name: '再接続を確認' }).click();
      await s.g.page.getByText('まだ同期が戻っていません').waitFor(); assert.equal(await panel(s.g.page).getAttribute('data-b2-stall'), 'stopped');
      assert.equal(s.g.writes.length, w0, 'checking the connection writes nothing');
      await s.resume(); await panel(s.g.page).waitFor({ state: 'detached', timeout: 8000 });
      const answers = () => inputsOf(s, 'guest').filter((k) => /^a\d+$/.test(k)), n0 = answers().length;
      for (let i = 0; i < 4 && answers().length === n0; i++) { await sleep(900); await drag(s.g.page).catch(() => {}); await sleep(900); }
      await sleep(1200); assert.equal(answers().length, n0 + 1, 'recovery sends the next answer once, not a replay: ' + answers());
      assert.deepEqual(s.g.errors, []); assert.deepEqual(s.h.errors, []); await s.close();
      console.log('PASS room B2 stall: no false positive (idle/offline/reconnect), stop notice, blocked answers, recheck, recovery, single answer, 320px');
    }
    if (!ONLY || ONLY === 'S1b') { // S1b: the clock keeps moving (host alive) but the game is not processed
      const s = await setup(b); await sleep(1500);
      s.gate.game = structuredClone(s.b2().game); s.gate.clockOnly = true;
      const r0 = s.b2().revision; await sleep(1500); assert(s.b2().revision > r0, 'fixture: clock/revision still advance');
      await s.g.page.locator('[data-b2-stall="stopped"]').waitFor({ timeout: 12000 });
      assert.match(await panel(s.g.page).innerText(), /試合の同期が停止しています/);
      s.gate.clockOnly = false; await panel(s.g.page).waitFor({ state: 'detached', timeout: 9000 });
      assert.deepEqual(s.g.errors, []); await s.close(); console.log('PASS clock-only: a moving clock with a frozen game is detected, and recovery clears it');
    }
    if (!ONLY || ONLY === 'S2') { // S2: offline for good: back to the home screen with no write, no read and nothing queued
      const s = await setup(b); await sleep(1200);
      await s.g.page.evaluate(() => { FB.conn = false; window.__b2.refresh = async () => { window.__readCalled = true; return { ok: false }; }; });
      s.ggate.frozen = true;                                           // every write of this device would hang, like a dead connection
      await panel(s.g.page).waitFor(); assert.equal(await s.g.page.getByRole('button', { name: '結果未確認のままホームへ戻る' }).count(), 0, 'not offered for a short blip');
      await s.g.page.locator('[data-b2-stall]').getByRole('button', { name: '結果未確認のままホームへ戻る' }).waitFor({ timeout: 8000 });
      assert.equal(await s.g.page.getByRole('button', { name: '再接続を確認' }).count(), 0, 'no recheck while offline');
      await s.g.page.evaluate(() => { window.__reads = []; const r = FB.db.ref.bind(FB.db); FB.db.ref = (p) => { const x = r(p); if (/\/b2\//.test(p)) { const g = x.get.bind(x); x.get = () => { window.__reads.push('conn=' + FB.conn + ' ' + p + ' @' + (new Error().stack.split('\n')[2] || '')); return g(); }; } return x; }; });
      const w0 = s.g.writes.length; await s.g.page.getByRole('button', { name: '結果未確認のままホームへ戻る' }).click();
      await s.g.page.locator(homeSel).first().waitFor({ timeout: 4000 });
      assert.match(await s.g.page.locator('body').innerText(), /通信できないため、試合結果を確認できませんでした/);
      assert.equal(await s.g.page.evaluate(() => !!window.__readCalled), false, 'no read is attempted while offline');
      assert.equal(s.g.writes.slice(w0).filter((o) => !/presence\//.test(o.path)).length, 0, 'nothing is written (nothing is queued for the reconnect)');
      assert.equal(await s.g.page.evaluate(() => JSON.parse(localStorage.getItem('fxf_b2_pending_v1') || '[]').length), 1, 'the unreceived match is remembered for a later receipt');
      assert.equal(await s.g.page.evaluate(() => window.__reads.length), 0, 'no receipt query is made right after an offline leave'); await sleep(11000);
      assert.equal(await s.g.page.evaluate(() => window.__reads.length), 0, 'and none while the connection stays down: ' + JSON.stringify(await s.g.page.evaluate(() => window.__reads)));
      s.ggate.frozen = false; s.ggate.waiters.splice(0).forEach((r) => r()); await sleep(300);
      const a2 = JSON.parse(JSON.stringify(s.tree.games.factor.rooms[s.code])); assert(a2.players.guest, 'the room entry is untouched by the offline leave (the server-side onDisconnect cleans presence)'); assert.deepEqual(Object.keys(a2.b2[Object.keys(a2.b2)[0]].inputs?.guest || {}), inputsOf(s, 'guest'));
      assert(!inputsOf(s, 'guest').includes('leave'), 'no forfeit input was queued');
      await s.g.page.evaluate(() => { FB.conn = true; }); await sleep(11500);
      assert((await s.g.page.evaluate(() => window.__reads.length)) >= 1, 'the query resumes after the connection is back');
      assert.deepEqual(s.g.errors, []); await s.close(); console.log('PASS offline leave: home reached without recovery, no read/write, no queued forfeit, receipt remembered, no polling while offline, resumes after reconnect');
    }
    if (!ONLY || ONLY === 'S3') { // S3: stopped but online -> safe leave (real read says nothing is confirmed), double tap, shared state untouched, receipt remembered
      const s = await setup(b); await s.freeze(); await s.g.page.locator('[data-b2-stall="stopped"]').waitFor({ timeout: 12000 });
      const snap = JSON.stringify(s.tree.games.factor.rooms[s.code]), statsBefore = JSON.stringify(s.tree.games.factor.accounts), w0 = s.g.writes.length;
      const btn = s.g.page.getByRole('button', { name: '結果未確認のままホームへ戻る' }); await btn.dblclick(); await btn.click({ timeout: 500 }).catch(() => {});
      await s.g.page.locator(homeSel).first().waitFor({ timeout: 8000 });
      const t = await s.g.page.locator('body').innerText(); assert.match(t, /最後に確認した時点では、試合結果は未確定です/); assert(!/引き分け|無効試合|反映されない/.test(t));
      const ops = s.g.writes.slice(w0).filter((o) => !/^games\/factor\/presence\//.test(o.path));
      assert(ops.every((o) => o.kind === 'set' && o.path === `games/factor/rooms/${s.code}/players/guest` && o.v === null) && ops.length === 1, 'only the own presence is removed, once: ' + JSON.stringify(ops));
      const after = JSON.parse(JSON.stringify(s.tree.games.factor.rooms[s.code]));
      assert.equal(JSON.stringify(after.b2), JSON.stringify(JSON.parse(snap).b2), 'the shared match state and result are unchanged');
      assert.equal(after.state.phase, 'play', 'the room is not closed'); assert.equal(JSON.stringify(s.tree.games.factor.accounts), statsBefore, 'no rating/EXP/title/stat write');
      const w1 = s.g.writes.length; await s.g.page.reload(); await sleep(800); assert.equal(s.g.writes.slice(w1).filter((o) => /\/b2\//.test(o.path)).length, 0, 'a reload does not touch the match');
      await s.close(); console.log('PASS safe leave: home reached, one presence removal, match/result/stats/room untouched, double tap and reload safe');
    }
    if (!ONLY || ONLY === 'S4') { // S4: unreadable result is reported as unreadable, never as "no result"
      const s = await setup(b); await s.freeze(); await s.g.page.locator('[data-b2-stall="stopped"]').waitFor({ timeout: 12000 });
      await s.g.page.evaluate(() => { window.__b2.refresh = async () => ({ ok: false, error: 'READ_TIMEOUT' }); });
      await s.g.page.getByRole('button', { name: '結果未確認のままホームへ戻る' }).click();
      await s.g.page.locator(homeSel).first().waitFor({ timeout: 8000 });
      const t = await s.g.page.locator('body').innerText(); assert.match(t, /試合結果を確認できませんでした/); assert(!/引き分け|無効試合|反映されない|確定していません/.test(t)); await s.close();
      console.log('PASS read failure: shown as "could not confirm", not as a draw / no result');
    }
    if (!ONLY || ONLY === 'S5') { // S5: a result confirmed just before leaving takes the normal result path (no leave)
      const s = await setup(b); await s.freeze(); await s.g.page.locator('[data-b2-stall="stopped"]').waitFor({ timeout: 12000 });
      const fin = await s.g.page.evaluate(() => window.__raw.game); let g = structuredClone(fin);
      g = E.step(g, 'host', { type: 'heartbeat' }, g.endAt + 1); assert(g.result, 'finished fixture');
      await s.g.page.evaluate((game) => { window.__b2.refresh = async () => { window.__onView({ ...window.__raw, game }); return { ok: true, result: game.result }; }; }, g);
      const w0 = s.g.writes.length; await s.g.page.getByRole('button', { name: '結果未確認のままホームへ戻る' }).click(); await sleep(1200);
      assert.equal(await s.g.page.locator('[data-b2-stall]').count(), 0, 'the stall notice is gone once the result is shown');
      assert(!await s.g.page.locator(homeSel).count(), 'not sent home: the normal result screen has priority');
      assert.equal(s.g.writes.slice(w0).filter((o) => o.path.endsWith('/players/guest') && o.v === null).length, 0, 'presence is not removed');
      await s.close(); console.log('PASS result first: a confirmed result is handled by the normal result flow, no early leave');
    }
    if (!ONLY || ONLY === 'S5b') { // S5b: the result arrives through the live listener while the read fails -> never leave
      const s = await setup(b); await s.freeze(); await s.g.page.locator('[data-b2-stall="stopped"]').waitFor({ timeout: 12000 });
      let fin = await s.g.page.evaluate(() => window.__raw.game); fin = E.step(fin, 'host', { type: 'heartbeat' }, fin.endAt + 1); assert(fin.result);
      const gid = s.b2().game.id, node = JSON.parse(JSON.stringify(s.b2())); node.game = fin; node.revision += 5;
      await s.g.page.evaluate(({ code, gid, node }) => { window.__b2.refresh = async () => { await window.__fbApply({ kind: 'set', path: `games/factor/rooms/${code}/b2/${gid}`, v: node }); return { ok: false, error: 'READ_TIMEOUT' }; }; }, { code: s.code, gid, node });
      const w0 = s.g.writes.length; await s.g.page.getByRole('button', { name: '結果未確認のままホームへ戻る' }).click(); await sleep(1500);
      assert(!await s.g.page.locator(homeSel).count(), 'the confirmed result received during the failing read keeps the player on the result screen');
      assert.equal(s.g.writes.slice(w0).filter((o) => o.path.endsWith('/players/guest') && o.v === null).length, 0, 'presence is not removed');
      await s.close(); console.log('PASS race: confirmed result + failing read -> no early leave');
    }
    if (!ONLY || ONLY === 'S6') { // S6: after a safe leave the host comes back and the result is confirmed: received once, idempotent, never for another match/person
      const s = await setup(b), { gid, fin, settle } = await stopLeave(s);
      const entry = await s.g.page.evaluate(() => JSON.parse(localStorage.getItem('fxf_b2_pending_v1'))[0]);
      assert.equal(entry.gid, gid); assert.equal(entry.uid, 'guest'); assert.equal(entry.acct, 'ag'); assert.equal(entry.code, s.code);
      assert.match(await s.g.page.locator('body').innerText(), /戦績はまだ記録されていません/); assert.match(await s.g.page.locator('body').innerText(), /24時間以内・最大5件/);
      assert.equal(await s.g.page.locator('[data-battle-summary]').count(), 0, 'nothing is shown while the result is unconfirmed');
      await settle(); await s.g.page.locator('[data-battle-summary]').first().waitFor({ timeout: 20000 });
      await banner(s.g.page).and(s.g.page.locator('[data-b2-recover="saved"]')).waitFor({ timeout: 10000 });
      assert.equal(statsOf(s).games, 1, 'the result is recorded once'); assert(statsOf(s).roomSeen?.[gid], 'recorded under the match id'); assert(s.tree.games.factor.accounts.ag.prof?.onlineLearnSeen?.['room:' + gid], 'learning record saved under the match id');
      assert.equal(await pendLen(s.g.page), 0, 'the receipt is removed only after every save was confirmed');
      const snapStats = JSON.stringify(statsOf(s)), snapProf = JSON.stringify(s.tree.games.factor.accounts.ag.prof);
      await s.g.page.reload(); await openOnline(s.g.page); await sleep(2500);
      assert.equal(await s.g.page.locator('[data-battle-summary]').count(), 0, 'a saved receipt is not shown again'); assert.equal(JSON.stringify(statsOf(s)), snapStats); assert.equal(JSON.stringify(s.tree.games.factor.accounts.ag.prof), snapProf);
      // tampered / foreign entries are never received
      for (const [label, patch] of [['another account', { acct: 'ah' }], ['another device uid', { uid: 'someone' }], ['another match (players differ)', { state: { ...entry.state, players: ['host', 'other'] } }], ['another match (unknown gid)', { gid: 'NOPE' }]]) {
        const w = s.g.writes.length; await s.g.page.evaluate((e) => localStorage.setItem('fxf_b2_pending_v1', JSON.stringify([e])), { ...entry, ...patch });
        await s.g.page.reload(); await openOnline(s.g.page); await sleep(2500);
        assert.equal(await s.g.page.locator('[data-battle-summary]').count(), 0, 'not received: ' + label); assert.equal(JSON.stringify(statsOf(s)), snapStats, 'stats unchanged: ' + label);
        assert.equal(s.g.writes.slice(w).filter((o) => /\/stats/.test(o.path)).length, 0, 'no stats write: ' + label);
      }
      assert.deepEqual(s.g.errors, []); await s.close(); console.log('PASS receipt: a later-confirmed result is received once after all saves are confirmed; foreign/other-match entries are ignored');
    }
    if (!ONLY || ONLY === 'S7') { // S7: save failures keep the receipt; retries and partial saves never double count; closing while saving is recoverable
      { // all saves fail, then succeed
        const s = await setup(b), { gid, settle } = await stopLeave(s); s.ggate.fail = /accounts\/ag\/(stats|prof)/; await settle();
        await s.g.page.locator('[data-b2-recover="failed"]').waitFor({ timeout: 40000 });
        assert.equal(await pendLen(s.g.page), 1, 'a failed save keeps the receipt'); assert.equal(statsOf(s).games, undefined); assert.equal(statsOf(s).roomSeen, undefined);
        await s.g.page.getByRole('button', { name: '再試行' }).click(); await s.g.page.locator('[data-b2-recover="failed"]').waitFor({ timeout: 10000 }); assert.equal(await pendLen(s.g.page), 1, 'a failed retry keeps it too');
        s.ggate.fail = null; await s.g.page.getByRole('button', { name: '再試行' }).click(); await s.g.page.locator('[data-b2-recover="saved"]').waitFor({ timeout: 15000 });
        assert.equal(statsOf(s).games, 1); assert(statsOf(s).roomSeen[gid]); assert.equal(await pendLen(s.g.page), 0);
        assert.deepEqual(s.g.errors.filter((e) => !/NETWORK/.test(String(e))), []); await s.close();
      }
      { // partial: the stats save succeeds, the learning record fails -> receipt kept; the retry completes without double counting
        const s = await setup(b), { gid, settle } = await stopLeave(s); s.ggate.fail = /accounts\/ag\/prof/; await settle();
        await s.g.page.locator('[data-b2-recover="failed"]').waitFor({ timeout: 40000 });
        assert.equal(statsOf(s).games, 1, 'the stats part was saved'); assert.equal(await pendLen(s.g.page), 1, 'but the receipt stays until every part is confirmed');
        const exp1 = statsOf(s).exp; s.ggate.fail = null; await s.g.page.getByRole('button', { name: '再試行' }).click(); await s.g.page.locator('[data-b2-recover="saved"]').waitFor({ timeout: 15000 });
        assert.equal(statsOf(s).games, 1, 'no double count on the retry'); assert.equal(statsOf(s).exp, exp1, 'EXP is not added twice'); assert(s.tree.games.factor.accounts.ag.prof?.onlineLearnSeen?.['room:' + gid], 'the missing part was completed');
        assert.equal(await pendLen(s.g.page), 0); await s.close();
      }
      { // the page is closed while saving (writes hang) -> receipt kept; next visit completes it exactly once
        const s = await setup(b), { gid, settle } = await stopLeave(s); s.ggate.frozen = true; await settle();
        await s.g.page.locator('[data-b2-recover="saving"]').waitFor({ timeout: 20000 }); assert.equal(await pendLen(s.g.page), 1);
        await s.g.page.reload(); s.ggate.frozen = false; s.ggate.waiters.splice(0).forEach((r) => r());   // the closed page's pending writes may still land: that must not double count either
        await openOnline(s.g.page); await s.g.page.locator('[data-b2-recover="saved"]').waitFor({ timeout: 25000 });
        assert.equal(statsOf(s).games, 1, 'exactly once after a close during saving'); assert(statsOf(s).roomSeen[gid]); assert.equal(await pendLen(s.g.page), 0); await s.close();
      }
      console.log('PASS save failures: receipt kept on failure/partial/close-while-saving; retries and reloads never double count');
    }
    if (!ONLY || ONLY === 'S8') { // S8: a late receipt keeps the real match time and never rewinds day/streak records
      const tomorrow = new Date(Date.now() + 9 * 3600e3 + 86400e3).toISOString().slice(0, 10), later = Date.now() + 3600e3;
      const s = await setup(b, { stats: { exp: 100, rating: 1500, lastDay: tomorrow, dayStreak: 5, maxDayStreak: 5, sk: { v: 1, n: 1, best: 1, n0: 0, l: { 'r-x-newer': { t: later, o: 'w', s: 'r' } } } } });
      const { gid, fin, settle } = await stopLeave(s); fin.time = fin.startAt + 2000;   // the fixture settles the match in the past (as a host that came back would have, well before the receipt)
      await settle(); await s.g.page.locator('[data-b2-recover="saved"]').waitFor({ timeout: 25000 });
      const st = statsOf(s), mine = st.sk.l[`r-${s.code}-${gid}`];
      assert.equal(mine.t, fin.time, 'the streak ledger uses the real match time, not the receipt time'); assert(mine.t < Date.now() - 1, 'earlier than the receipt'); assert.equal(st.sk.l['r-x-newer'].t, later, 'the newer match entry is untouched');
      assert.equal(st.sk.n, K.replay(0, K.ordered(st.sk.l)).n, 'the run equals a replay in match-time order'); assert.equal(st.sk.best, 1, 'a late arrival never raises the best by itself');
      assert.equal(st.lastDay, tomorrow, 'the day record is not rewound'); assert.equal(st.dayStreak, 5, 'the consecutive-day count is not changed by an older match');
      await s.close(); console.log('PASS late receipt: real match time in the ledger, ordered replay, day/streak records not rewound');
    }
    if (!ONLY || ONLY === 'S10') { // S10 (Ver.6.3): the match start is saved in the match log (server-confirmed) before the first answer; until then no answer is sent
      const s = await setup(b, { holdStats: true });
      await s.g.page.locator('[data-b2-record]').waitFor({ timeout: 8000 }); assert.match(await s.g.page.locator('[data-b2-record]').innerText(), /記録を準備/);
      await drag(s.g.page).catch(() => {}); await sleep(1500);
      assert.equal(inputsOf(s, 'guest').filter((k) => /^a\d+$/.test(k)).length, 0, 'no answer is sent while the start is not confirmed');
      assert(!(statsOf(s).ml), 'nothing is saved yet');
      s.ggate.stats = false; s.ggate.sw.splice(0).forEach((r) => r());
      await s.g.page.locator('[data-b2-record]').waitFor({ state: 'detached', timeout: 8000 });
      const ml = () => statsOf(s).ml; for (let i = 0; i < 20 && !ml(); i++) await sleep(300);
      assert(ml() && Object.keys(ml().e).length === 1 && /^1\|rou\|/.test(Object.values(ml().e)[0]), 'the open entry was saved, but it was held past the match start: saved as unproven (u), never evidence: ' + JSON.stringify(ml()));
      const answers = () => inputsOf(s, 'guest').filter((k) => /^a\d+$/.test(k));
      for (let i = 0; i < 5 && !answers().length; i++) { await sleep(900); await drag(s.g.page).catch(() => {}); await sleep(900); }
      assert(answers().length >= 1, 'answers work once the start is confirmed'); assert.deepEqual(s.g.errors, []); await s.close();
      console.log('PASS match log: no first answer until the start is confirmed by the server; the open entry is saved once');
    }
    if (!ONLY || ONLY === 'S10b') { // S10b (Ver.6.3): a normal start is saved AND proven (confirmed before the match began) for both players
      const s = await setup(b);
      const mls = () => ['ah', 'ag'].map((k) => s.tree.games.factor.accounts[k]?.stats?.ml);
      for (let i = 0; i < 60 && !mls().every((m) => m && Object.values(m.e).some((v) => /^1\|ro\|/.test(v))); i++) await sleep(250);
      for (const ml of mls()) { assert(ml, 'both players saved the start'); assert(Object.values(ml.e).some((v) => /^1\|ro\|/.test(v)), 'saved and proven (no q, no u): ' + JSON.stringify(ml)); }
      assert.equal(await s.g.page.locator('[data-b2-record]').count(), 0); assert.deepEqual(s.g.errors, []); await s.close();
      console.log('PASS match log: a normal B2 start is saved and proven for both players');
    }
    if (!ONLY || ONLY === 'S9') { // S9: the match node says another account played this seat -> nothing is recorded
      const s = await setup(b), { gid, settle } = await stopLeave(s); const w = s.g.writes.length, snap = JSON.stringify(s.tree.games.factor.accounts);
      await settle({ accounts: { host: 'ah', guest: 'ax' } }); await sleep(12500);
      assert.equal(await s.g.page.locator('[data-battle-summary]').count(), 0, 'not received'); assert.equal(await pendLen(s.g.page), 0, 'the mismatching entry is dropped');
      assert.equal(JSON.stringify(s.tree.games.factor.accounts), snap); assert.equal(s.g.writes.slice(w).filter((o) => /accounts\//.test(o.path)).length, 0, 'no stats/prof write');
      assert.match(await s.g.page.locator('body').innerText(), /別のアカウントの記録/); await s.close(); console.log('PASS account check: the match node account must equal the current account');
    }
  } finally { await b.close(); }
}
