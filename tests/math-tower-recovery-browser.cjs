const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  R = require("../math-tower-core");
const {
  continueTower,
  chromium,
  context,
  story,
  drag,
  sleep,
} = require("./browser-harness.cjs");
const content = require("../math-tower/chapter1.json");
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  });
  try {
    const progress = {
      ...R.startAdventure(R.fresh(), "normal", 100),
      revision: 1,
      seen: { 1: true },
      notes: { 1: true },
      newInfo: { floor1: true },
      read: { prologue: true, "1-chapter": true, "1-pre": true },
    };
    const path = "games/factor/mathTowerV2/trialProgress/ateacher";
    let fail = false,
      holdOnce = false,
      releaseHold,
      notifyHold;
    const holdStarted = new Promise((resolve) => {
      notifyHold = resolve;
    });
    const tree = {
      games: {
        factor: {
          teachers: { ateacher: true },
          logins: { ateacher: { "teacher-uid": "fake" } },
          mathTowerV2: {
            access: { ateacher: { enabled: true, role: "teacher" } },
            content: { ateacher: { chapter1: content } },
            trialProgress: { ateacher: progress },
          },
        },
      },
    };
    const t = await context(b, {
        tree,
        onOperation: async (op) => {
          if (op.path !== path) return;
          if (holdOnce) {
            holdOnce = false;
            await new Promise((resolve) => {
              releaseHold = resolve;
              notifyHold();
            });
          }
          await sleep(180);
          if (fail) {
            fail = false;
            throw Error("NETWORK_ERROR: 通信に失敗しました");
          }
        },
      }),
      p = t.page;
    const saves = () => t.writes.filter((x) => x.path === path);
    await p.getByRole("button", { name: "数学の塔", exact: false }).click();
    await p.getByRole("button", { name: /数理の書/ }).click();
    await p.getByRole("button", { name: "とじる", exact: true }).click();
    assert.equal(
      await p.getByRole("button", { name: "とじる", exact: true }).isDisabled(),
      true,
    );
    await p.locator("[data-math-screen=home]").waitFor();
    assert.equal(saves().length, 1);
    await p.getByRole("button", { name: /数理の書/ }).click();
    await p.getByRole("button", { name: "とじる", exact: true }).click();
    await p.locator("[data-math-screen=home]").waitFor();
    assert.equal(saves().length, 1, "unchanged book closes do not save again");
    console.log("PASS delayed book close, busy guard and unchanged-book no-op");
    await continueTower(p);
    await p.getByRole("button", { name: "試練を開始", exact: true }).click();
    await p.locator("[data-math-dialog]").waitFor();
    await p
      .getByRole("button", { name: "既読をスキップ", exact: true })
      .click();
    await p
      .getByRole("button", { name: "既読をスキップ", exact: true })
      .evaluate((e) => {
        e.click();
        e.click();
      });
    await p.locator("[data-btile]").first().waitFor();
    for (let i = 0; i < 6; i++) await drag(p);
    await p
      .getByRole("button", { name: "物語の続きを見る", exact: true })
      .waitFor();
    assert.equal(
      Object.keys(tree.games.factor.mathTowerV2.trialProgress.ateacher.history)
        .length,
      1,
    );
    await p
      .getByRole("button", { name: "物語の続きを見る", exact: true })
      .click();
    await story(p);
    await p.locator("[data-math-screen=afterFloor]").waitFor();
    await p.getByRole("button", { name: "数学の塔メニューへ戻る", exact: true }).click();
    await p.locator("[data-math-screen=home]").waitFor();
    console.log(
      "PASS rapid story skip, battle completion and immediate story transition; one result",
    );
    fail = true;
    holdOnce = true;
    await p.clock.install();
    await p.getByRole("button", { name: /数理の書/ }).click();
    await p.getByRole("button", { name: "とじる", exact: true }).click();
    await Promise.race([
      holdStarted,
      sleep(2000).then(() => {
        throw Error("held save did not start");
      }),
    ]);
    await sleep(40);
    await p.clock.fastForward(10001);
    await p.getByText(/保存の応答を待っています/).waitFor();
    assert.equal(
      await p
        .getByRole("button", { name: "最新の記録を読み込む", exact: true })
        .isDisabled(),
      true,
    );
    assert.equal(
      await p
        .getByRole("button", { name: "タイトルへ戻る", exact: true })
        .isEnabled(),
      true,
    );
    releaseHold();
    await p.getByText(/NETWORK_ERROR/).waitFor();
    await p.locator(".mt-recovery").waitFor();
    assert((await p.locator(".mt-recovery").innerText()).includes("未保存"));
    const revision =
      tree.games.factor.mathTowerV2.trialProgress.ateacher.revision;
    await p.getByRole("button", { name: "とじる", exact: true }).click();
    await p.locator("[data-math-screen=home]").waitFor();
    assert.equal(
      tree.games.factor.mathTowerV2.trialProgress.ateacher.revision,
      revision + 1,
    );
    assert.equal(await p.locator(".mt-recovery").count(), 0);
    console.log(
      "PASS network failure is shown, not acknowledged, and explicit retry succeeds",
    );
    const latest = JSON.parse(
      JSON.stringify(tree.games.factor.mathTowerV2.trialProgress.ateacher),
    );
    latest.revision++;
    latest.read["remote-marker"] = true;
    tree.games.factor.mathTowerV2.trialProgress.ateacher = latest;
    await p.evaluate(
      ({ path, latest }) => window.__fbApply({ kind: "set", path, v: latest }),
      { path, latest },
    );
    const count = saves().length;
    await continueTower(p);
    await p.getByRole("button", { name: "試練を開始", exact: true }).click();
    await p.locator(".mt-recovery").waitFor();
    assert.equal(saves().length, count);
    await p
      .getByRole("button", { name: "最新の記録を読み込む", exact: true })
      .click();
    await p.locator("[data-math-screen=home]").waitFor();
    await continueTower(p);
    await p.getByRole("button", { name: "試練を開始", exact: true }).click();
    await p.locator("[data-math-dialog]").waitFor();
    assert.equal(
      tree.games.factor.mathTowerV2.trialProgress.ateacher.read[
        "remote-marker"
      ],
      true,
    );
    assert.equal(
      tree.games.factor.mathTowerV2.trialProgress.ateacher.revision,
      latest.revision + 1,
    );
    await story(p);
    await p.locator("[data-btile]").first().waitFor();
    const currentSaves = saves().length;
    await p.evaluate(() => {
      Object.defineProperty(document, "hidden", {
        configurable: true,
        get: () => true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await p.getByRole("button", { name: "再開", exact: true }).waitFor();
    await p.evaluate(() => {
      Object.defineProperty(document, "hidden", {
        configurable: true,
        get: () => false,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await p.getByRole("button", { name: "再開", exact: true }).click();
    assert.equal(
      saves().length,
      currentSaves,
      "tab visibility must not create duplicate saves",
    );
    console.log(
      "PASS simulated tab return pauses and resumes without duplicate save",
    );
    assert.deepEqual(t.errors, []);
    assert.equal(
      t.writes.filter((x) =>
        /accounts\/.*\/(?:stats|prof)|tower\/best/.test(x.path),
      ).length,
      0,
    );
    console.log(
      "PASS true conflict does not overwrite remote data; latest-record recovery resumes progression",
    );
    await t.ctx.close();
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
