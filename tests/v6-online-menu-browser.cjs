// Ver.6.0 UI unification: ghost menu, random-match select / wait / vote.
// Presentation only: every command still goes through the unchanged transport (cancel, vote, leave, randomGhost).
const assert = require("node:assert/strict");
const fs = require("fs");
const { chromium, context, sleep } = require("./browser-harness.cjs");
const SHOT = process.env.OM_SHOTS || "";
const VIEWPORTS = [
  [375, 844],
  [390, 844],
  [1440, 900],
  [683, 325],
];
const tree = () => ({
  games: {
    factor: {
      accounts: {
        ateacher: {
          name: "Teacher",
          stats: { rating: 1649.6, exp: 100 },
          prof: { lv: { L1: { n: 30, ok: 25, ms: 100000 } } },
        },
      },
      onlineSparkV1: { config: { enabled: true, protocol: "spark-v1" } },
    },
  },
});
// A page is "dark navy" when the screen background is not the old paper/white colour.
async function layout(p, vw, vh, name) {
  const info = await p.evaluate(() => {
    const main = document.querySelector("main.or-app");
    const bg = getComputedStyle(main).backgroundColor;
    const buttons = [...main.querySelectorAll("button")]
      .filter((b) => b.offsetParent)
      .map((b) => {
        const r = b.getBoundingClientRect();
        return { t: b.textContent.trim(), h: r.height, w: r.width, x: r.x, right: r.right, dis: b.disabled };
      });
    return {
      bg,
      scrollW: document.documentElement.scrollWidth,
      buttons,
      mainCount: document.querySelectorAll("main.or-app").length,
    };
  });
  assert.equal(info.bg, "rgb(16, 23, 32)", `${name}: dark navy background at ${vw}x${vh}`);
  assert(info.scrollW <= vw + 1, `${name}: no horizontal scroll at ${vw}x${vh} (${info.scrollW})`);
  for (const b of info.buttons) {
    assert(b.h >= 44, `${name}: tap target >=44px: ${b.t} (${b.h}) at ${vw}x${vh}`);
    assert(b.x >= 0 && b.right <= vw + 1, `${name}: button inside viewport: ${b.t} at ${vw}x${vh}`);
  }
  if (SHOT) await p.screenshot({ path: `${SHOT}/${name}-${vw}x${vh}.png`, fullPage: true });
  return info;
}
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium" });
  // Records every transport command (unchanged transport; read-only wrapper) so the direct ghost start can be checked.
  const ui = fs.readFileSync("online-rated-ui.js", "utf8") + '\n(()=>{const f=window.OnlineRatedFactory;window.OnlineRatedFactory=H=>{const create=H.createTransport;H.createTransport=acct=>{const c=create(acct);return {...c,request:async cmd=>{(window.__cmds=window.__cmds||[]).push(cmd);return c.request(cmd)}}};return f(H);}})();';
  try {
    for (const [vw, vh] of VIEWPORTS) {
      // ---- ghost tiles (Ver.6.13): the lobby shows イージー / ノーマル / ハイパー directly; a tile sends the existing
      // randomGhost command right after the normal status load (no intermediate menu). With no ghost records the
      // existing guidance is shown and the in-app menu stays available. ----
      for (const [tile, difficulty, kind, empty] of [
        ["easy", "easy", "ghost", "対戦可能なゴーストの学習記録がありません"],
        ["normal", "normal", "ghost", "対戦可能なゴーストの学習記録がありません"],
        ["hyper-easy", "easy", "hyper", "HYPER GHOST 乱入！"], // own easy record is in the TOP10 → a real match starts
      ]) {
        const t = await context(b, { tree: tree(), assetOverrides: { "/online-rated-ui.js": ui } }),
          p = t.page;
        await p.setViewportSize({ width: vw, height: vh });
        await p.locator(".action-card.online").click();
        await p.locator("[data-ghost-tiles]").waitFor();
        assert.equal(await p.getByRole("button", { name: /^ゴースト対戦$/ }).count(), 0, "no intermediate ゴースト対戦 button");
        await p.waitForFunction(() => !document.querySelector("[data-ghost-start=easy]").disabled);
        const tiles = await p.locator("[data-ghost-tiles] button").evaluateAll((es) => es.map((e) => { const r = e.getBoundingClientRect(); return { t: e.textContent.trim(), h: r.height, x: r.x, right: r.right }; }));
        for (const x of tiles) { assert(x.h >= 44, `ghost tile tap target >=44px: ${x.t} at ${vw}x${vh}`); assert(x.x >= 0 && x.right <= vw + 1, `ghost tile inside viewport: ${x.t}`); }
        await p.locator(`[data-ghost-start=${tile}]`).click();
        await p.getByText(empty, { exact: true }).waitFor();
        const cmds = await p.evaluate(() => window.__cmds.map((c) => ({ type: c.type, difficulty: c.difficulty, kind: c.kind })));
        assert.deepEqual(cmds.slice(0, 2).map((c) => c.type), ["status", "randomGhost"], `status load first, then one direct start (${tile})`);
        assert.equal(cmds.filter((c) => c.type === "randomGhost").length, 1, `exactly one start (${tile})`);
        assert.deepEqual(cmds[1], { type: "randomGhost", difficulty, kind }, `same command as the ghost menu (${tile})`);
        if (kind === "ghost") await layout(p, vw, vh, "ghost-" + tile);
        assert.deepEqual(t.errors, []);
        await t.ctx.close();
      }
      // ---- random match: select -> wait -> cancel -> wait -> vote ----
      {
        const t = await context(b, { tree: tree(), assetOverrides: { "/online-rated-ui.js": ui } }),
          p = t.page;
        await p.setViewportSize({ width: vw, height: vh });
        await p.locator(".action-card.online").click();
        await p.getByRole("button", { name: "すぐ遊ぶ（ランダム対戦）", exact: true }).click();
        await p.getByRole("button", { name: "イージーで相手を探す", exact: true }).waitFor();
        await layout(p, vw, vh, "select");
        await p.getByRole("button", { name: "イージーで相手を探す", exact: true }).click();
        await p.locator("[data-om=wait]").waitFor();
        await sleep(1200);
        const cancel = p.getByRole("button", { name: "検索をキャンセル", exact: true });
        assert(await cancel.isEnabled(), "cancel reachable and enabled while searching");
        await cancel.scrollIntoViewIfNeeded();
        assert.match(await p.locator("[data-om=wait]").innerText(), /イージー/);
        assert(parseFloat(await p.getByLabel("検索経過時間").innerText()) >= 1);
        const back = p.getByRole("button", { name: "オンラインへ戻る", exact: true });
        assert(await back.isDisabled(), "header back is disabled while searching");
        assert.match(await p.locator("#om-back-reason").innerText(), /検索をキャンセル/);
        await layout(p, vw, vh, "wait");
        await cancel.click();
        await p.getByRole("button", { name: "イージーで相手を探す", exact: true }).waitFor();
        assert(await p.getByRole("button", { name: "オンラインへ戻る", exact: true }).isEnabled(), "back works again after cancel");
        assert.equal(await p.locator("[role=alert]").count(), 0, "cancel produced no error");
        // search again and let the mock ghost intrude -> vote screen
        await p.getByRole("button", { name: "イージーで相手を探す", exact: true }).click();
        await p.locator("[data-om=vote]").waitFor({ timeout: 20000 });
        await p.getByRole("button", { name: "A：早い者勝ち", exact: true }).waitFor();
        const vote = await p.locator("[data-om=vote]").innerText();
        assert.match(vote, /あなた：未投票/);
        assert.match(vote, /残り\d+秒/);
        assert.equal(await p.locator("[data-selected=true]").count(), 0, "nothing marked before voting");
        const aBtn = p.getByRole("button", { name: "A：早い者勝ち", exact: true });
        assert.equal(await aBtn.getAttribute("aria-pressed"), "false");
        await layout(p, vw, vh, "vote");
        const leave = p.getByRole("button", { name: "開始前に退出", exact: true });
        await leave.scrollIntoViewIfNeeded();
        assert(await leave.isEnabled());
        assert(await p.getByRole("button", { name: "オンラインへ戻る", exact: true }).isDisabled(), "header back locked during vote");
        assert.match(await p.locator("#om-back-reason").innerText(), /開始前に退出/);
        assert.deepEqual(t.errors, []);
        await t.ctx.close();
      }
    }
    console.log("PASS v6 online menu: lobby ghost tiles start directly (status → one randomGhost; hyper starts a real match), search select/wait/cancel, vote, dark navy, 44px targets, 4 viewports");
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
