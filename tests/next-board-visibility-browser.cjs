/* Offline-only regression: real React views, mocked Firebase, all external requests intercepted. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium, context } = require('./browser-harness.cjs');
const index = fs.readFileSync('index.html', 'utf8').replace('const OnlineComponents =',
  'window.__nextViews = { GameA, GameB, makeBank }; const OnlineComponents =');
const ui = fs.readFileSync('online-rated-ui.js', 'utf8') + `
{const original=window.OnlineRatedFactory;window.OnlineRatedFactory=H=>{window.__nextH=H;const c=original(H);window.__nextShared=c;return c;};}`;
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium' });
  try {
    for (const pc of [false, true]) {
      const t = await context(browser, { pc, assetOverrides: { '/': index, '/online-rated-ui.js': ui } });
      const p = t.page;
      try {
        await p.waitForFunction(() => window.__nextH && window.__nextViews);
        await p.evaluate(() => {
          document.getElementById('root').style.display = 'none';
          const el = document.createElement('div'); el.id = 'visibility-test'; document.body.appendChild(el);
          window.__viewRoot = ReactDOM.createRoot(el);
          window.__mountShared = ({ mode, rules, difficulty, time, startAt = 1000, readyAt = 1000, resolving = false, freezeUntil = 0, result = null }) => {
            const H = window.__nextH, bank = window.__nextViews.makeBank(123, difficulty === 'normal' ? 9 : 6), b = bank.get(1, 0);
            const g = { rules, question: '1:0', poly: b.poly, tiles: b.tiles, level: 1, startAt, readyAt, resolving, freezeUntil, result,
              timeoutMs: 20000, endAt: 91000, live: mode === 'A' ? { u: 0, v: 0 } : { u: { hp: 100, score: 0, c: 0, combo: 0 }, v: { hp: 100, score: 0, c: 0 } } };
            ReactDOM.flushSync(() => window.__viewRoot.render(React.createElement(window.__nextShared.BattleView, {
              H, m: { id: 'visibility-fixture', gameStartAt: 1000, selfUid: 'u', mode, difficulty, members: [{ uid: 'u', name: '本人' }, { uid: 'v', name: '相手' }] },
              g, time, disabled: false, muted: true, setMuted() {}, onMatch() { window.__unexpectedInput = true; }, onSpecial() {}, onLeave() {},
            })));
          };
        });
        const board = p.locator('#visibility-test [data-poly],#visibility-test [data-btile]');
        for (const difficulty of ['easy', 'normal']) for (const [mode, rules] of [['A', undefined], ['B', undefined], ['B', 'b2']]) {
          const base = { difficulty, mode, rules };
          for (const state of [{ time: 999 }, { time: 1100, startAt: 1400, readyAt: 1400 }, { time: 1100, readyAt: 1400 }, { time: 1500, resolving: true }, { time: 1500, result: { draw: true } }, ...(rules === 'b2' ? [{ time: 1500, freezeUntil: 4000 }] : [])]) {
            await p.evaluate(x => window.__mountShared(x), { ...base, ...state });
            assert.equal(await board.count(), 0, `hidden DOM: ${difficulty}/${mode}/${rules}/${JSON.stringify(state)}`);
            assert.equal(await p.locator('#visibility-test [data-online-ready]').getAttribute('data-online-ready'), 'false');
            await p.keyboard.press('Enter');
            assert(!await p.evaluate(() => window.__unexpectedInput), 'no hidden-board input');
          }
          await p.evaluate(x => window.__mountShared(x), { ...base, time: 1400, readyAt: 1400 });
          assert.equal(await board.count(), difficulty === 'easy' ? 7 : 10, 'board mounts exactly at input-ready boundary');
          assert.equal(await p.locator('#visibility-test [data-online-ready]').getAttribute('data-online-ready'), 'true');
        }
        await p.evaluate(() => {
          const V = window.__nextViews, at = Date.now();
          window.__legacyAt = at;
          window.__legacyProps = { code: 'test-visibility', state: { gid: 'fixture', mode: 'A', startAt: at - 10000 }, me: 'u', ids: ['u', 'v'], others: ['v'], names: { u: '本人', v: '相手' }, nicks: {}, diff: 'easy', N: 15,
            bank: V.makeBank(456, 6), live: {}, ko: {}, claims: [{ uid: 'v', at, j: 'Perfect', pts: 10 }], now: at + 500,
            sound: new Proxy({}, { get: () => () => {} }), header: () => null, players: {}, hc: {}, mine: { current: {} }, viewRef: { current: { live: {}, ko: {} } }, muted: true, onEnd() {}, onClear() {} };
          ReactDOM.flushSync(() => window.__viewRoot.render(React.createElement(V.GameA, window.__legacyProps)));
        });
        assert.equal(await board.count(), 0, '4-digit/CPU A transition must not mount next question');
        await p.evaluate(() => ReactDOM.flushSync(() => window.__viewRoot.render(React.createElement(window.__nextViews.GameA, { ...window.__legacyProps, now: window.__legacyAt + 1100 }))));
        assert.equal(await board.count(), 7, 'A authoritative 1100ms boundary reveals next board');
        for (const mode of ['B', 'C']) {
          await p.evaluate(mode => {
            window.__legacyProps.state.mode = mode;
            window.__legacyProps.state.tm = { u: 0, v: 1 };
            window.__legacyProps.mine = { current: {} };
            ReactDOM.flushSync(() => window.__viewRoot.render(React.createElement(window.__nextViews.GameB, { ...window.__legacyProps, key: mode })));
          }, mode);
          assert.equal(await board.count(), 7, `${mode} ready`);
          await p.evaluate(() => {
            const s = window.__legacyProps.mine.current.eng.s;
            s.resolving = true; s.nextAt = null;
            s.cur = { ...s.cur, ...window.__legacyProps.bank.get(2, 0), level: 2 };
            ReactDOM.flushSync(() => window.__viewRoot.render(React.createElement(window.__nextViews.GameB, { ...window.__legacyProps, key: window.__legacyProps.state.mode, now: Date.now() })));
          });
          assert.equal(await board.count(), 0, `${mode} resolving cannot expose a newly assigned board`);
        }
        assert.deepEqual(t.errors, []);
        console.log(`PASS ${pc ? 'PC' : 'touch phone'}: E/N shared A/B1/B2 countdown/future-ready/resolving/freeze/result DOM; room A 1100ms; B/C transition`);
      } finally { await t.ctx.close(); }
    }
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
