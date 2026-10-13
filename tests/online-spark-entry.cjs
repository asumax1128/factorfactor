const assert = require("node:assert/strict");
const fs = require("node:fs");
const { chromium, context } = require("./browser-harness.cjs");
const configPath = "games/factor/onlineSparkV1/config";
const mock = fs.readFileSync("tests/firebase-mock.js", "utf8").replace(
  "on(ev, fn, cancel) {",
  `on(ev, fn, cancel) {
  if (path === '${configPath}' && window.__denyConfig) {
    setTimeout(() => cancel && cancel(Object.assign(Error('PERMISSION_DENIED'), {code:'PERMISSION_DENIED'})), 0); return fn;
  }
  if (path === '${configPath}' && window.__holdConfig) {
    window.__releaseConfig = () => fn(snap(path));
    return fn;
  }
`,
);
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  });
  try {
    const t = await context(b, {
      firebaseSource: "window.__holdConfig = true;\n" + mock,
      tree: {
        games: {
          factor: {
            accounts: {
              ateacher: { name: "Teacher", stats: { rating: 1800 } },
            },
            onlineSparkV1: { config: { enabled: true, protocol: "spark-v1" } },
          },
        },
      },
    });
    const p = t.page;
    await p
      .getByRole("button", { name: "オンライン対戦・CPU練習", exact: true })
      .click();
    const quick = p.getByRole("button", {
      name: "すぐ遊ぶ（ランダム対戦）",
      exact: true,
    });
    await quick.waitFor();
    // A pending config must never be interpreted as disabled and enter legacy qm.
    await quick.evaluate((el) => el.click());
    await p.waitForTimeout(400);
    assert.equal(
      t.writes.filter((x) => /games\/factor\/(qm|rooms)\//.test(x.path)).length,
      0,
      "pending config incorrectly entered legacy matchmaking",
    );
    await p.evaluate(() => window.__releaseConfig());
    await p.waitForTimeout(100);
    await quick.click();
    await p
      .getByRole("button", { name: "イージーで相手を探す", exact: true })
      .waitFor();
    await p
      .getByRole("button", { name: "ノーマルで相手を探す", exact: true })
      .waitFor();
    assert.deepEqual(t.errors, []);
    console.log(
      "PASS delayed enabled config opens difficulty choice, never legacy queue",
    );
    await t.ctx.close();
    async function open(config, opts = {}) {
      const u = await context(b, {
        firebaseSource: (opts.prefix || "") + mock,
        blockedAssets: opts.blocked || [],
        tree: {
          games: {
            factor: {
              accounts: {
                ateacher: { name: "Teacher", stats: { rating: 1800 } },
              },
              onlineSparkV1: { config },
            },
          },
        },
      });
      await u.page
        .getByRole("button", { name: "オンライン対戦・CPU練習", exact: true })
        .click();
      await u.page
        .getByRole("button", { name: "すぐ遊ぶ（ランダム対戦）", exact: true })
        .waitFor();
      return u;
    }
    function noLegacy(u) {
      assert.equal(
        u.writes.filter((x) => /games\/factor\/(qm|rooms)\//.test(x.path))
          .length,
        0,
      );
    }
    const denied = await open(
      { enabled: true, protocol: "spark-v1" },
      { prefix: "window.__denyConfig=true;" },
    );
    await denied.page
      .getByRole("alert")
      .filter({ hasText: "読み取り権限" })
      .waitFor();
    noLegacy(denied);
    await denied.page.evaluate(() => (window.__denyConfig = false));
    await denied.page
      .getByRole("button", { name: "設定を再試行", exact: true })
      .click();
    await denied.page
      .getByRole("button", { name: "すぐ遊ぶ（ランダム対戦）", exact: true })
      .click();
    await denied.page
      .getByRole("button", { name: "ノーマルで相手を探す", exact: true })
      .waitFor();
    assert.deepEqual(denied.errors, []);
    console.log(
      "PASS permission error is visible; retry recovers without legacy matchmaking",
    );
    await denied.ctx.close();
    const timeout = await open(
      { enabled: true, protocol: "spark-v1" },
      {
        prefix:
          "window.__holdConfig=true; const nativeTimer=window.setTimeout; window.setTimeout=(fn,ms,...args)=>nativeTimer(fn,ms===10000?30:ms,...args);",
      },
    );
    await timeout.page
      .getByRole("alert")
      .filter({ hasText: "通信を確認" })
      .waitFor();
    noLegacy(timeout);
    await timeout.page.evaluate(() => (window.__holdConfig = false));
    await timeout.page
      .getByRole("button", { name: "設定を再試行", exact: true })
      .click();
    await timeout.page
      .getByRole("button", { name: "すぐ遊ぶ（ランダム対戦）", exact: true })
      .click();
    await timeout.page
      .getByRole("button", { name: "ノーマルで相手を探す", exact: true })
      .waitFor();
    assert.deepEqual(timeout.errors, []);
    await timeout.ctx.close();
    console.log("PASS config timeout blocks legacy and retry recovers");
    for (const config of [
      { enabled: "true", protocol: "spark-v1" },
      { enabled: true, protocol: "other-v1" },
    ]) {
      const u = await open(config);
      await u.page.getByRole("alert").filter({ hasText: "protocol" }).waitFor();
      await u.page
        .getByRole("button", { name: "すぐ遊ぶ（ランダム対戦）", exact: true })
        .evaluate((el) => el.click());
      noLegacy(u);
      assert.deepEqual(u.errors, []);
      await u.ctx.close();
    }
    console.log(
      "PASS non-boolean enabled and wrong protocol cannot fall back to legacy",
    );
    const missing = await open(
      { enabled: true, protocol: "spark-v1" },
      { blocked: ["/online-spark.js"] },
    );
    await missing.page
      .getByRole("alert")
      .filter({ hasText: "画面を読み込めません" })
      .waitFor();
    noLegacy(missing);
    assert.deepEqual(missing.errors, []);
    await missing.ctx.close();
    console.log(
      "PASS missing bundle produces actionable error, not old matchmaking",
    );
    const legacy = await open({ enabled: false, protocol: "spark-v1" });
    await legacy.page
      .getByRole("button", { name: "すぐ遊ぶ（ランダム対戦）", exact: true })
      .click();
    await legacy.page.waitForTimeout(400);
    assert.ok(
      legacy.writes.some((x) => /games\/factor\/(qm|rooms)\//.test(x.path)),
    );
    await legacy.ctx.close();
    console.log("PASS explicit false retains legacy matchmaking");
    const publicPage = await context(b, {
      siteRoot: require("node:path").resolve("dist"),
      tree: {
        games: {
          factor: {
            accounts: {
              ateacher: { name: "Teacher", stats: { rating: 1800 } },
            },
            onlineSparkV1: { config: { enabled: true, protocol: "spark-v1" } },
          },
        },
      },
    });
    await publicPage.page
      .getByRole("button", { name: "オンライン対戦・CPU練習", exact: true })
      .click();
    await publicPage.page
      .getByRole("button", { name: "すぐ遊ぶ（ランダム対戦）", exact: true })
      .click();
    await publicPage.page
      .getByRole("button", { name: "イージーで相手を探す", exact: true })
      .waitFor();
    await publicPage.page
      .getByRole("button", { name: "ノーマルで相手を探す", exact: true })
      .waitFor();
    await publicPage.page
      .getByRole("button", { name: "イージーで相手を探す", exact: true })
      .waitFor();
    await publicPage.page
      .getByRole("button", { name: "ノーマルで相手を探す", exact: true })
      .waitFor();
    for (const file of ["online-spark.js", "online-rated-ui.js"]) {
      const entry = JSON.parse(
        fs.readFileSync("dist/release-manifest.json"),
      ).files.find((x) => x.path === file);
      assert.ok(
        publicPage.requests.some((url) =>
          url.includes(file + "?v=" + entry.sha256.slice(0, 16)),
        ),
      );
    }
    noLegacy(publicPage);
    assert.deepEqual(publicPage.errors, []);
    await publicPage.page.screenshot({
      path:
        process.env.ONLINE_ENTRY_SCREENSHOT ||
        "/tmp/factor-spark-entry-fixed.png",
    });
    await publicPage.ctx.close();
    console.log(
      "PASS exact Pages payload/hash URLs render EASY/NORMAL without JS errors",
    );
    const cpu = await open({ enabled: false, protocol: "spark-v1" });
    await cpu.page
      .getByRole("button", { name: "CPUと練習スタート", exact: true })
      .click();
    await cpu.page.locator("[data-btile]").first().waitFor();
    await cpu.page.evaluate(() =>
      window.__fbApply({
        kind: "update",
        path: "games/factor/onlineSparkV1/config",
        v: { enabled: true, protocol: "spark-v1" },
      }),
    );
    cpu.page.once("dialog", (dialog) => dialog.accept());
    await cpu.page.getByRole("button", { name: /退出/ }).first().click();
    await cpu.page
      .getByRole("button", { name: "すぐ遊ぶ（ランダム対戦）", exact: true })
      .click();
    await cpu.page
      .getByRole("button", { name: "イージーで相手を探す", exact: true })
      .waitFor();
    assert.deepEqual(cpu.errors, []);
    await cpu.ctx.close();
    console.log(
      "PASS real Firebase config stays enabled after CPU practice/local DB switch",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
