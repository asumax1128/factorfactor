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
  const ui = fs.readFileSync("online-rated-ui.js", "utf8");
  try {
    for (const [vw, vh] of VIEWPORTS) {
      // ---- ghost menu ----
      {
        const t = await context(b, { tree: tree(), assetOverrides: { "/online-rated-ui.js": ui } }),
          p = t.page;
        await p.setViewportSize({ width: vw, height: vh });
        await p.locator(".action-card.online").click();
        await p.getByRole("button", { name: /^ゴースト対戦/ }).click();
        await p.getByRole("heading", { name: "ゴースト対戦を選ぶ" }).waitFor();
        await p.getByRole("button", { name: "イージーゴースト", exact: true }).waitFor();
        await layout(p, vw, vh, "ghost-menu");
        await p.getByRole("button", { name: "ハイパーゴースト", exact: true }).click();
        await p.getByRole("button", { name: "イージーハイパーゴースト", exact: true }).waitFor();
        await p.getByRole("button", { name: "ゴーストメニューへ戻る", exact: true }).waitFor();
        await layout(p, vw, vh, "ghost-hyper");
        await p.getByRole("button", { name: "ゴーストメニューへ戻る", exact: true }).click();
        await p.getByRole("button", { name: "ノーマルゴースト", exact: true }).waitFor();
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
    console.log("PASS v6 online menu: ghost menu, search select/wait/cancel, vote, dark navy, 44px targets, 4 viewports");
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
