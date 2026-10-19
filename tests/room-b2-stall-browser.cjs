// Ver.6.2 hotfix: a 4-digit room B2 participant can leave safely when the shared state stops being processed.
const assert = require('node:assert/strict'), { chromium, context, drag } = require('./browser-harness.cjs'), E = require('../server/online-rated/engine.cjs'), C = require('../src/room-b2-client.cjs');
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
  console.log('PASS real transport: stale get() never overwrites a newer/confirmed state; received result needs no read; failures are unreadable');
})().then(main).catch((e) => { console.error(e); process.exitCode = 1; });
async function setup(b, { width = 390, height = 844, duration } = {}) {
  const tree = { games: { factor: { accounts: structuredClone(accounts), onlineSparkV1: { config: { enabled: true, protocol: 'spark-v1' } } } } }, peers = [];
  // the host stops processing: its writes hang (a backgrounded/suspended phone); `clockOnly` keeps clock/revision moving but freezes the game
  const gate = { frozen: false, waiters: [], clockOnly: false, game: null }, ggate = { frozen: false, waiters: [] };
  const hold = (gt) => async () => { if (gt.frozen) await new Promise((r) => gt.waiters.push(r)); };
  const h = await context(b, { tree, peers, uid: 'host', account: { key: 'ah', name: 'Host' }, onOperation: async (op) => { if (gate.clockOnly && op.v && op.v.game && /\/b2\/[^/]+$/.test(op.path)) op.v = { ...op.v, game: gate.game }; await hold(gate)(); } });
  const g = await context(b, { tree, peers, uid: 'guest', account: { key: 'ag', name: 'Guest' }, onOperation: hold(ggate) });
  for (const t of [h, g]) { await t.page.setViewportSize({ width, height }); await t.page.getByRole('button', { name: 'オンライン対戦・CPU練習', exact: true }).click(); }
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
      const w0 = s.g.writes.length; await s.g.page.getByRole('button', { name: '結果未確認のままホームへ戻る' }).click();
      await s.g.page.locator(homeSel).first().waitFor({ timeout: 4000 });
      assert.match(await s.g.page.locator('body').innerText(), /通信できないため、試合結果を確認できませんでした/);
      assert.equal(await s.g.page.evaluate(() => !!window.__readCalled), false, 'no read is attempted while offline');
      assert.equal(s.g.writes.slice(w0).filter((o) => !/presence\//.test(o.path)).length, 0, 'nothing is written (nothing is queued for the reconnect)');
      assert.equal(await s.g.page.evaluate(() => JSON.parse(localStorage.getItem('fxf_b2_pending_v1') || '[]').length), 1, 'the unreceived match is remembered for a later receipt');
      s.ggate.frozen = false; s.ggate.waiters.splice(0).forEach((r) => r()); await s.g.page.evaluate(() => { FB.conn = true; }); await sleep(800);
      const a2 = JSON.parse(JSON.stringify(s.tree.games.factor.rooms[s.code])); assert(a2.players.guest, 'the room entry is untouched by the offline leave (the server-side onDisconnect cleans presence)'); assert.deepEqual(Object.keys(a2.b2[Object.keys(a2.b2)[0]].inputs?.guest || {}), inputsOf(s, 'guest'));
      assert(!inputsOf(s, 'guest').includes('leave'), 'no forfeit input was queued');
      assert.deepEqual(s.g.errors, []); await s.close(); console.log('PASS offline leave: home reached without recovery, no read/write, no queued forfeit, receipt remembered');
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
    if (!ONLY || ONLY === 'S6') { // S6: after a safe leave the host comes back and the result is confirmed: received once, idempotent, never for another match/person
      const s = await setup(b); await s.freeze(); await s.g.page.locator('[data-b2-stall="stopped"]').waitFor({ timeout: 12000 });
      const gid = s.b2().game.id; await s.g.page.getByRole('button', { name: '結果未確認のままホームへ戻る' }).click(); await s.g.page.locator(homeSel).first().waitFor({ timeout: 8000 });
      const entry = await s.g.page.evaluate(() => JSON.parse(localStorage.getItem('fxf_b2_pending_v1'))[0]);
      assert.equal(entry.gid, gid); assert.equal(entry.uid, 'guest'); assert.equal(entry.acct, 'ag'); assert.equal(entry.code, s.code);
      assert.equal(await s.g.page.locator('[data-battle-summary]').count(), 0, 'nothing is shown while the result is unconfirmed');
      let fin = await s.g.page.evaluate(() => window.__raw.game); fin = E.step(fin, 'host', { type: 'heartbeat' }, fin.endAt + 1); assert(fin.result);
      const node = s.b2(); node.game = fin; node.revision = (node.revision || 0) + 1;         // the host came back and settled the match
      await s.g.page.evaluate((o) => window.__fbApply(o), { kind: 'set', path: `games/factor/rooms/${s.code}/b2/${gid}`, v: JSON.parse(JSON.stringify(node)) });
      // (the host stays frozen so its late writes cannot stomp the injected settlement; the guest reads the tree directly)
      await s.g.page.locator('[data-battle-summary]').first().waitFor({ timeout: 20000 });
      await sleep(1500); const acct = () => s.tree.games.factor.accounts.ag.stats || {};
      assert.equal(acct().games, 1, 'the result is recorded once'); assert(acct().roomSeen?.[gid], 'recorded under the match id');
      const snapStats = JSON.stringify(acct());
      await s.g.page.reload(); await s.g.page.getByRole('button', { name: 'オンライン対戦・CPU練習', exact: true }).click();
      await s.g.page.locator('[data-battle-summary]').first().waitFor({ timeout: 20000 }); await sleep(1500);
      assert.equal(JSON.stringify(acct()), snapStats, 'receiving again (reload before leaving the result) changes nothing: no double stats/EXP/titles');
      await s.g.page.getByRole('button', { name: /ロビー|部屋を出る|設定にもどる|戻る|もどる/ }).first().click(); await s.g.page.locator(homeSel).first().waitFor({ timeout: 8000 });
      assert.equal(await s.g.page.evaluate(() => JSON.parse(localStorage.getItem('fxf_b2_pending_v1') || '[]').length), 0, 'the receipt is removed once the result was seen');
      // tampered / foreign entries are never received
      for (const [label, patch] of [['another account', { acct: 'ah' }], ['another device uid', { uid: 'someone' }], ['another match (players differ)', { state: { ...entry.state, players: ['host', 'other'] } }], ['another match (unknown gid)', { gid: 'NOPE' }]]) {
        const w = s.g.writes.length; await s.g.page.evaluate((e) => localStorage.setItem('fxf_b2_pending_v1', JSON.stringify([e])), { ...entry, ...patch });
        await s.g.page.reload(); await s.g.page.getByRole('button', { name: 'オンライン対戦・CPU練習', exact: true }).click(); await sleep(2500);
        assert.equal(await s.g.page.locator('[data-battle-summary]').count(), 0, 'not received: ' + label); assert.equal(JSON.stringify(acct()), snapStats, 'stats unchanged: ' + label);
        assert.equal(s.g.writes.slice(w).filter((o) => /\/stats/.test(o.path)).length, 0, 'no stats write: ' + label);
      }
      assert.deepEqual(s.g.errors, []); await s.close(); console.log('PASS receipt: a later-confirmed result is received once via the existing idempotent record; foreign/other-match entries are ignored');
    }
  } finally { await b.close(); }
}
