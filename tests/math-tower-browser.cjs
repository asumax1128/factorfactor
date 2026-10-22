const { openTower } = require("./tower-nav-helper.cjs");
const fs = require("node:fs"),
  assert = require("node:assert/strict");
const {
  newTower,
  continueTower,
  chromium,
  context,
  story,
  drag,
  sleep,
} = require("./browser-harness.cjs");
const content = JSON.parse(
  fs.readFileSync(
    process.env.MATH_TOWER_CONTENT ||
      require.resolve("../math-tower/chapter1.json"),
  ),
);
const seed = () => ({
  games: {
    factor: {
      teachers: { ateacher: { name: "Teacher" } },
      logins: { ateacher: { "teacher-uid": "1234" } },
      mathTowerV2: {
        access: { ateacher: { enabled: true, role: "teacher" } },
        content: { ateacher: { chapter1: content } },
      },
    },
  },
});
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  });
  let checks = 0;
  try {
    for (const who of process.env.TOWER_EDGES_ONLY
      ? []
      : ["student", "guest", "wrong-uid"]) {
      const tree = seed();
      let account = { key: "ateacher", name: "Teacher" },
        uid = "teacher-uid";
      if (who === "student") delete tree.games.factor.teachers.ateacher;
      if (who === "guest") account = { guest: true, name: "Guest" };
      if (who === "wrong-uid") uid = "other";
      const t = await context(browser, { tree, account, uid });
      await sleep(700);
      // Ver.6.9: the only entry is the AXIOMIA card; denied users see "準備中" and the gate never starts the tower
      await t.page.locator(".action-card.solo").click(); await t.page.locator('[data-solo-hub]').waitFor();
      await t.page.locator('[data-solo-mode=axiomia]').waitFor();
      assert.match(await t.page.locator('[data-solo-mode=axiomia]').innerText(), /準備中/);
      assert.equal(await t.page.getByRole("button", { name: "数学の塔", exact: false }).count(), 0);
      await t.page.locator('[data-solo-mode=axiomia]').click();
      await t.page.locator('[data-axiomia-gate]').waitFor();
      await t.page.waitForFunction(() => document.querySelector('[data-axiomia-gate]')?.dataset.axiomiaGate === 'locked');
      assert.match(await t.page.locator('[data-axiomia-gate] p').innerText(), /準備中/);
      assert.equal(await t.page.locator("[data-math-dialog]").count(), 0);
      await t.page.goto("http://localhost/#math-tower");
      await t.page
        .getByText(/試遊権限|先生アカウント/)
        .first()
        .waitFor();
      assert.equal(await t.page.locator("[data-math-dialog]").count(), 0);
      assert.deepEqual(t.errors, []);
      await t.ctx.close();
      console.log("PASS access:", who);
      checks++;
    }
    for (const difficulty of process.env.TOWER_EDGES_ONLY
      ? []
      : ["easy", "normal", "hard"]) {
      const t = await context(browser, {
          tree: seed(),
          pc: difficulty === "normal",
        }),
        page = t.page;
      await openTower(page);
      await newTower(page, difficulty);
      for (let floor = 1; floor <= 5; floor++) {
        if (floor > 1) {
          await page
            .getByRole("button", { name: "次の階へ進む", exact: true })
            .evaluate((e) => {
              e.click();
              e.click();
            });
          await page.locator("[data-math-screen=prepare]").waitFor();
          const a =
            t.tree.games.factor.mathTowerV2.trialProgress.ateacher.adventures[
              difficulty
            ];
          assert.equal(a.floor, floor);
          assert.equal(a.difficulty, difficulty);
          assert.match(
            await page.locator(".mt-panel").innerText(),
            new RegExp("HP " + a.hp),
          );
        }
        await page
          .getByRole("button", { name: "試練を開始", exact: true })
          .click();
        await page.locator("[data-math-dialog]").waitFor();
        await story(page);
        await page.locator("[data-btile]").first().waitFor();
        assert.equal(await page.locator("[data-btile]").count(), 6);
        if (floor === 1) {
          const old = await page
            .locator("[data-poly]")
            .getAttribute("data-poly");
          const family = await page
            .locator(".mt-controls")
            .getAttribute("data-math-family");
          await page
            .getByRole("button", { name: "ポーズ", exact: true })
            .click();
          await page.getByRole("button", { name: "再開", exact: true }).click();
          assert.equal(
            await page.locator(".mt-controls").getAttribute("data-math-family"),
            family,
          );
          assert.notEqual(
            await page.locator("[data-poly]").getAttribute("data-poly"),
            old,
          );
          await drag(page, false);
          assert.ok(
            (await page.locator(".mt-controls").innerText()).includes("HP 95"),
          );
        }
        for (let i = 0; i < 35; i++) {
          if (await page.locator('[data-math-screen="result"]').count()) break;
          await drag(page);
        }
        await page.locator('[data-math-screen="result"]').waitFor();
        await page
          .getByRole("button", { name: "物語の続きを見る", exact: true })
          .click();
        await story(page);
        await page
          .locator(
            `[data-math-screen="${floor === 5 ? "chapterEnd" : "afterFloor"}"]`,
          )
          .waitFor();
        console.log("PASS", difficulty, "floor", floor);
        checks++;
      }
      const p = t.tree.games.factor.mathTowerV2.trialProgress.ateacher;
      assert.equal(p.difficulties[difficulty].best, 5);
      assert.equal(p.difficulties[difficulty].hp, 100);
      assert.equal(p.reward, true);
      assert.equal(p.reveal.zero_slime, true);
      assert.equal(p.history[Object.keys(p.history)[0]].verified, false);
      assert.equal(
        t.writes.filter((x) => /accounts\/.*\/stats|tower\/best/.test(x.path))
          .length,
        0,
      );
      await page.getByRole("button", { name: "ホームへ", exact: true }).click();
      await page.getByRole("button", { name: /数理の書/ }).click();
      const notes = page.locator("[data-math-book] article");
      assert.equal(
        await notes.count(),
        5,
        "four learning notes plus one fragment, without an empty duplicate",
      );
      for (const text of await notes.allTextContents()) assert.ok(text.trim());
      await page.getByRole("button", { name: "図鑑", exact: true }).click();
      await page
        .getByRole("button", { name: "画像を見る", exact: true })
        .first()
        .click();
      await page.getByRole("slider", { name: "画像の倍率" }).fill("2");
      await page.locator(".mt-zoom .mt-button").click();
      await page.locator("[data-math-book]>.mt-button").click();
      await page.reload();
      await openTower(page);
      await page.getByRole("button", { name: "続きから", exact: true }).click();
      assert.equal(
        await page.locator(`[data-adventure=${difficulty}]`).innerText(),
        "第1章クリア",
      );
      t.tree.games.factor.logins.ateacher["teacher-second"] = "1234";
      const other = await context(browser, {
        tree: t.tree,
        uid: "teacher-second",
        account: { key: "ateacher", name: "Teacher" },
      });
      await openTower(other.page);
      await other.page
        .getByRole("button", { name: "続きから", exact: true })
        .click();
      assert.equal(
        await other.page.locator(`[data-adventure=${difficulty}]`).innerText(),
        "第1章クリア",
      );
      await other.ctx.close();
      assert.deepEqual(t.errors, []);
      assert.equal(
        await page
          .locator("body")
          .evaluate((el) => el.scrollWidth > innerWidth),
        false,
      );
      await t.ctx.close();
      checks++;
      console.log("PASS saves/reload/book/no old-stat writes");
    }
    const t = await context(browser, { tree: seed() }),
      page = t.page;
    await openTower(page);
    await newTower(page);
    await page.getByRole("button", { name: "試練を開始", exact: true }).click();
    await page.locator("[data-math-dialog]").waitFor();
    await story(page);
    await page.locator("[data-btile]").first().waitFor();
    const old = await page.locator("[data-poly]").getAttribute("data-poly");
    await page.clock.install();
    await page.clock.runFor(46000);
    await sleep(150);
    assert.equal(
      await page.locator("[data-poly]").getAttribute("data-poly"),
      old,
    );
    assert.ok(
      (await page.locator(".mt-controls").innerText()).includes("HP 90"),
    );
    await page.clock.resume();
    for (let i = 0; i < 20; i++) {
      if (await page.locator('[data-math-screen="result"]').count()) break;
      await drag(page, false);
    }
    await page.getByRole("heading", { name: "敗北", exact: true }).waitFor();
    await page.getByRole("button", { name: "再挑戦", exact: true }).click();
    await page
      .getByRole("button", { name: "第1章を再開始", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "1階の準備", exact: true })
      .waitFor();
    assert.ok((await page.locator(".mt-panel").innerText()).includes("HP 100"));
    console.log("PASS timeout same problem, defeat and chapter restart");
    checks++;
    await page.evaluate(() =>
      window.__fbApply({
        kind: "set",
        path: "games/factor/teachers/ateacher",
        v: null,
      }),
    );
    await page.getByText(/試遊権限を確認できません/).waitFor();
    assert.equal(await page.locator("[data-math-dialog]").count(), 0);
    assert.deepEqual(t.errors, []);
    await t.ctx.close();
    console.log("PASS revocation clears protected content");
    checks++;
    console.log(checks + " browser checks passed");
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
