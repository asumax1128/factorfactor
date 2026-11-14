// Ver.6.23 (removal of unreachable code): the main routes still work exactly as before, and the two places that used to fall
// back to removed legacy screens now say that loading failed.
//   home → solo → 通常プレイ → スタート → a correct answer; online lobby; ranking hub → solo ranking; daily (normal and failed read).
const assert = require("node:assert/strict"), fs = require("node:fs");
const { chromium, context, openSoloMode, openOnlineLobby, goHome } = require("./browser-harness.cjs");
const { soloDrag } = require("./solo-test-helper.cjs");
const exe = process.env.CHROMIUM_PATH || "/usr/bin/chromium";
const tree = () => ({ games: { factor: { accounts: { ateacher: { name: "Teacher", stats: { exp: 100, rating: 1600 } } }, onlineSparkV1: { config: { enabled: true, protocol: "spark-v1" } } } } });
// test-only mock: the daily settings read can be made to fail (as a lost connection would)
const failingMock = fs.readFileSync("tests/firebase-mock.js", "utf8").replace("      get() {\n        return authorized(path)", "      get() {\n        if (window.__dailyFail && path === 'games/factor/dailyV2/ready') return Promise.reject(Error('Network Error'));\n        return authorized(path)");
assert(failingMock.includes("__dailyFail"), "mock hook inserted");
const src = fs.readFileSync("index.html", "utf8");
(async () => {
  // the removed pieces are really gone from the page source
  for (const name of ["AccountPanelV7", "DailyTileV7", "WeeklyTileV7", "GhostNews", "LegacyDailyApp", "TOWER_BOSSES", "TOWER_MOBS", "KING_PARTS", "PAST_PERIOD_CHAMPIONS", "従来のメニューを表示します"])
    assert(!src.includes(name), "removed: " + name);
  console.log("PASS removed code is absent from index.html");
  const b = await chromium.launch({ executablePath: exe });
  try {
    for (const width of [390, 1440]) {
      const t = await context(b, { tree: tree(), pc: width > 900 }), p = t.page; if (width < 900) await p.setViewportSize({ width, height: 844 });
      // home → solo hub → 通常プレイ → スタート → play
      await openSoloMode(p, "play");
      assert.deepEqual(await p.locator(".v7-diff button").evaluateAll((es) => es.map((e) => e.firstChild.textContent)), ["イージー", "ノーマル", "ハード"]);
      await p.locator("[data-solo-back]").waitFor();
      assert.equal(await p.locator(".v7-tiles4").count(), 0, "no old-home tiles");
      await p.getByRole("button", { name: "スタート", exact: true }).click();
      await p.locator("[data-tile-id]").first().waitFor();
      const before = await p.locator("[data-tile-id]").evaluateAll((es) => es.map((e) => e.dataset.tileId).join());
      await soloDrag(p, true);
      await p.waitForFunction((old) => [...document.querySelectorAll("[data-tile-id]")].map((e) => e.dataset.tileId).join() !== old, before, { timeout: 5000 });
      assert.deepEqual(t.errors, []); await t.ctx.close();
      // online lobby
      const t2 = await context(b, { tree: tree(), pc: width > 900 }), q = t2.page; if (width < 900) await q.setViewportSize({ width, height: 844 });
      await openOnlineLobby(q);
      await q.getByRole("button", { name: "すぐ遊ぶ（ランダム対戦）", exact: true }).waitFor();
      await q.locator("[data-room-create]").waitFor(); await q.locator("[data-ghost-tiles]").waitFor();
      // ranking hub → solo ranking → back to the hub
      await goHome(q);
      await q.locator(width > 900 ? ".sidebar .nav-item" : ".bottom-nav .nav-item").filter({ hasText: width > 900 ? "ランキング" : "順位" }).click();
      await q.locator(".ranking-grid .ranking-entry").first().waitFor();
      assert.equal(await q.locator(".ranking-grid .ranking-entry").count(), 3);
      await q.locator(".ranking-entry", { hasText: "ソロランキング" }).click();
      await q.locator(".next-solo-ranking").waitFor();
      await q.getByRole("button", { name: "ランキング総合へ戻る", exact: true }).click();
      await q.locator(".ranking-grid").waitFor();
      assert.deepEqual(t2.errors, []); await t2.ctx.close();
      console.log(`PASS ${width}px: home → solo → play (correct answer accepted), online lobby, ranking hub → solo ranking → hub`);
    }
    // daily: settings readable → the current daily opens; read fails → load error (no legacy 10-question daily), retry works
    {
      const t = await context(b, { tree: tree(), firebaseSource: failingMock }), p = t.page;
      await p.evaluate(() => { window.__dailyFail = true; });
      await p.locator("[data-home-tile=daily]").click();
      await p.locator("[data-daily-load-error]").waitFor();
      await p.getByRole("alert").getByText("デイリーの読み込みに失敗しました。通信を確認して、もう一度お試しください。", { exact: true }).waitFor();
      assert.equal(await p.getByText("まちがえると +5秒").count(), 0, "the old 10-question daily is not shown");
      assert.equal(t.writes.filter((x) => /games\/factor\/daily\//.test(x.path)).length, 0, "nothing written to the old daily");
      await p.evaluate(() => { window.__dailyFail = false; });
      await p.getByRole("button", { name: "もう一度読み込む", exact: true }).click();
      await p.locator("[data-daily-load-error]").waitFor({ state: "detached" });
      await p.getByText("デイリー", { exact: false }).first().waitFor();
      // and 戻る leaves the error screen
      await goHome(p); await p.evaluate(() => { window.__dailyFail = true; });
      await p.locator("[data-home-tile=daily]").click(); await p.locator("[data-daily-load-error]").waitFor();
      await p.getByRole("button", { name: "戻る", exact: true }).click();
      await p.locator("[data-next-home] .home-content").waitFor();
      assert.deepEqual(t.errors, []); await t.ctx.close();
      console.log("PASS daily: a failed settings read shows the load error (old daily gone); retry opens the daily; 戻る returns home");
    }
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
