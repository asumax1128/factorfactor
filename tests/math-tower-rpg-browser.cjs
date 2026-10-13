const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  R = require("../math-tower-core");
const {
  chromium,
  context,
  story,
  drag,
  sleep,
  newTower,
  continueTower,
  dismissCutin,
  pair,
} = require("./browser-harness.cjs");
const content = require("../math-tower/chapter1.json");
const seed = (progress) => ({
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
});
const open = async (p) =>
  p.getByRole("button", { name: "数学の塔", exact: false }).click();
async function rawDrag(p, ids) {
  const a = await p.locator(`[data-btile="${ids[0]}"]`).boundingBox(),
    b = await p.locator(`[data-btile="${ids[1]}"]`).boundingBox();
  await p.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await p.mouse.down();
  await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 4 });
  await p.mouse.up();
}
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  });
  const snapshots = process.env.TOWER_SCREENSHOTS;
  if (snapshots) fs.mkdirSync(snapshots, { recursive: true });
  try {
    for (const [width, height] of process.env.TOWER_RPG_TARGET
      ? []
      : [
          [320, 568],
          [375, 667],
          [390, 844],
          [430, 932],
          [1366, 768],
        ]) {
      const t = await context(browser, {
          tree: seed(R.fresh()),
          pc: width > 900,
        }),
        p = t.page;
      await p.setViewportSize({ width, height });
      await open(p);
      await newTower(p);
      await p.getByRole("button", { name: "試練を開始", exact: true }).click();
      await p.locator("[data-math-dialog]").waitFor();
      const paper = await p.locator(".mt-notebook").boundingBox();
      assert(paper && paper.width > 200);
      for (let i = 0; i < 4; i++) await p.locator("[data-math-dialog]").click();
      assert(
        (await p.locator(".mt-notebook").innerText())
          .replace(/\s/g, "")
          .includes("x2+5x+6"),
      );
      if (snapshots && width === 390) {
        await sleep(750);
      }
      if (snapshots && width === 390)
        await p.screenshot({ path: snapshots + "/prologue-phone.png" });
      await story(p);
      await p.locator("[data-btile]").first().waitFor();
      const geometry = await p.locator("[data-btile]").evaluateAll((es) =>
        es.map((e) => {
          const r = e.getBoundingClientRect();
          return {
            x: r.x,
            y: r.y,
            w: r.width,
            h: r.height,
            right: r.right,
            bottom: r.bottom,
          };
        }),
      );
      assert.equal(geometry.length, 6);
      assert(
        geometry.every(
          (x) => x.h >= (width === 320 ? 85 : width === 375 ? 110 : 150),
        ),
        JSON.stringify({ width, height, geometry }),
      );
      assert(
        geometry.every(
          (x) => x.x >= 0 && x.right <= width && x.bottom <= height,
        ),
        JSON.stringify({ width, height, geometry }),
      );
      assert.equal(geometry[0].y, geometry[2].y);
      assert(geometry[3].y > geometry[0].y);
      assert.equal(
        await p.locator("body").evaluate((e) => e.scrollWidth > innerWidth),
        false,
      );
      assert.equal(
        await p
          .getByText("1枚を押したまま、もう1枚へ線を引いて離そう", {
            exact: true,
          })
          .count(),
        0,
      );
      if (snapshots)
        await p.screenshot({
          path: snapshots + `/battle-${width}x${height}.png`,
        });
      await drag(p, false);
      assert.equal(await p.locator("[data-math-attack]").count(), 0);
      assert((await p.locator(".mt-controls").innerText()).includes("HP 95"));
      assert.deepEqual(t.errors, []);
      await t.ctx.close();
      console.log(
        "PASS responsive notebook and six large, visible tiles",
        width,
        height,
      );
    }
    for (const pc of process.env.TOWER_RPG_TARGET ? [] : [false, true]) {
      const dialogueContent = JSON.parse(JSON.stringify(content)),
        enemy = content.floors[2];
      dialogueContent.events.find((x) => x.id === "2-pre").lines = [
        [enemy, "短い会話。"],
        [enemy, "長い会話でも立ち絵と背景の位置は一定です。".repeat(40)],
      ];
      let progress = R.startAdventure(R.fresh(), "normal", 10);
      progress.adventures.normal.floor = 2;
      const tree = seed(progress);
      tree.games.factor.mathTowerV2.content.ateacher.chapter1 = dialogueContent;
      const t = await context(browser, {
          tree,
          pc,
          towerContent: dialogueContent,
        }),
        p = t.page;
      await open(p);
      await continueTower(p);
      await p.getByRole("button", { name: "試練を開始", exact: true }).click();
      await p.locator("[data-math-dialog]").waitFor();
      await p.waitForFunction(() =>
        [...document.querySelectorAll(".mt-stage img")].every(
          (x) => x.complete && x.naturalWidth > 0,
        ),
      );
      const character = await p.locator(".mt-stage img").boundingBox(),
        dialogue = await p.locator(".mt-dialog").boundingBox();
      await p.locator("[data-math-dialog]").click();
      assert.deepEqual(
        await p.locator(".mt-stage img").boundingBox(),
        character,
      );
      assert.deepEqual(await p.locator(".mt-dialog").boundingBox(), dialogue);
      assert(
        await p
          .locator(".mt-dialog p")
          .evaluate((e) => e.scrollHeight > e.clientHeight),
      );
      if (snapshots)
        await p.screenshot({
          path: snapshots + "/dialogue-" + (pc ? "pc" : "phone") + ".png",
        });
      assert.deepEqual(t.errors, []);
      await t.ctx.close();
      console.log(
        "PASS fixed dialogue/character geometry and scrollable long prose",
        pc ? "PC" : "phone",
      );
    }
    // Preserve legacy records and provide all three independently resumable adventures.
    const old = {
      schemaVersion: 1,
      purpose: "trial",
      revision: 3,
      difficulties: {
        easy: { best: 0, hp: 100, records: {} },
        normal: { best: 1, hp: 88, records: { 1: { rank: "S", accuracy: 1 } } },
        hard: { best: 1, hp: 82, records: { 1: { rank: "A", accuracy: 0.9 } } },
      },
      read: { prologue: true, "1-chapter": true, "1-pre": true },
      notes: { 1: true },
      history: { legacy: { difficulty: "normal", floor: 1, at: 10 } },
      kills: { 1: 1 },
      newInfo: {},
    };
    const tree = seed(old),
      t = await context(browser, { tree }),
      p = t.page;
    p.on("pageerror", (e) => console.error("RPG page error:", e.message));
    await open(p);
    await p.getByRole("button", { name: "続きから", exact: true }).click();
    assert.match(
      await p.locator("[data-adventure=hard]").innerText(),
      /第2階.*HP 82/,
    );
    assert.equal(
      await p.locator("[data-adventure=easy]").innerText(),
      "データなし",
    );
    await p.getByRole("button", { name: "戻る", exact: true }).click();
    await newTower(p, "easy");
    await p.getByRole("button", { name: "戻る", exact: true }).click();
    let q = tree.games.factor.mathTowerV2.trialProgress.ateacher;
    assert.equal(q.adventures.hard.floor, 2);
    assert.equal(q.adventures.hard.hp, 82);
    assert.equal(q.migrationBackup.revision, old.revision);
    assert.deepEqual(q.migrationBackup.history, old.history);
    assert.deepEqual(q.migrationBackup.read, old.read);
    assert.equal(q.migrationBackup.difficulties.hard.hp, 82);
    await p.reload();
    await open(p);
    await p.getByRole("button", { name: "続きから", exact: true }).click();
    assert.match(await p.locator("[data-adventure=easy]").innerText(), /第1階/);
    assert.match(
      await p.locator("[data-adventure=normal]").innerText(),
      /第2階/,
    );
    assert.match(await p.locator("[data-adventure=hard]").innerText(), /第2階/);
    await p.getByRole("button", { name: "戻る", exact: true }).click();
    const before = R.copy(q.adventures);
    await p
      .getByRole("button", { name: "クリアした階を選ぶ", exact: true })
      .click();
    assert(
      await p
        .getByRole("button", { name: "2階 未解放", exact: true })
        .isDisabled(),
    );
    await p.getByRole("button", { name: "1階", exact: true }).click();
    await p.getByRole("button", { name: "HARDを選ぶ", exact: true }).click();
    await p.getByRole("button", { name: "試練を開始", exact: true }).click();
    await p.locator("[data-math-dialog]").waitFor();
    await story(p);
    // HARD explanation stops time and input before the battle can proceed.
    // story helper confirms initial cutin; trigger a boss later to test explicit confirmation.
    for (let i = 0; i < 15; i++) {
      if (await p.locator("[data-math-screen=result]").count()) break;
      await drag(p);
    }
    await p.locator("[data-math-screen=result]").waitFor();
    q = tree.games.factor.mathTowerV2.trialProgress.ateacher;
    assert.deepEqual(q.adventures, before);
    assert.equal(q.difficulties.hard.hp, 82);
    assert.equal(q.history.legacy.at, 10);
    assert.equal(
      Object.values(q.history).filter((x) => x.mode === "replay").length,
      1,
    );
    await p
      .getByRole("button", { name: "物語の続きを見る", exact: true })
      .click();
    await story(p);
    await p.locator("[data-math-screen=afterFloor]").waitFor();
    assert.equal(
      await p
        .getByRole("button", { name: "次の階へ進む", exact: true })
        .count(),
      0,
    );
    await p
      .getByRole("button", { name: "クリアした階を選ぶ", exact: true })
      .click();
    await p.locator("[data-math-screen=floorSelect]").waitFor();
    assert.deepEqual(
      tree.games.factor.mathTowerV2.trialProgress.ateacher.adventures,
      before,
    );
    await p.getByRole("button", { name: "戻る", exact: true }).click();
    await p.locator("[data-math-screen=home]").waitFor();
    await p.getByRole("button", { name: "はじめから", exact: true }).click();
    await p.getByRole("button", { name: "EASYを選ぶ", exact: true }).click();
    await p.locator("[data-math-screen=replaceConfirm]").waitFor();
    await p.getByRole("button", { name: "キャンセル", exact: true }).click();
    assert.deepEqual(q.adventures, before);
    await p.getByRole("button", { name: "EASYを選ぶ", exact: true }).click();
    await p
      .getByRole("button", { name: "置き換えて開始", exact: true })
      .click();
    assert.deepEqual(
      tree.games.factor.mathTowerV2.trialProgress.ateacher.adventures.hard,
      before.hard,
    );
    await p.getByRole("button", { name: "戻る", exact: true }).click();
    await p
      .getByRole("button", { name: "移行前の記録・復旧", exact: true })
      .click();
    await p
      .getByRole("button", { name: "HARDの移行前の冒険を復元", exact: true })
      .click();
    await p.getByRole("button", { name: "確認して復元", exact: true }).click();
    await p.locator("[data-math-screen=home]").waitFor();
    assert.equal(
      tree.games.factor.mathTowerV2.trialProgress.ateacher.adventures.hard.hp,
      82,
    );
    await p.getByRole("button", { name: /数理の書/ }).click();
    await p.getByRole("button", { name: "冒険日誌", exact: true }).click();
    assert.match(
      await p.locator("[data-math-book]").innerText(),
      /HARD 第1階：最高S/,
    );
    assert.match(
      await p.locator("[data-math-book]").innerText(),
      /HARD 第1階 ・ 再挑戦 ・ S/,
    );
    await p.getByRole("button", { name: "とじる", exact: true }).click();
    await p.locator("[data-math-screen=home]").waitFor();
    const beforeReplayLoss = R.copy(
      tree.games.factor.mathTowerV2.trialProgress.ateacher.adventures,
    );
    await p
      .getByRole("button", { name: "クリアした階を選ぶ", exact: true })
      .click();
    await p.getByRole("button", { name: "1階", exact: true }).click();
    await p.getByRole("button", { name: "EASYを選ぶ", exact: true }).click();
    await p.getByRole("button", { name: "試練を開始", exact: true }).click();
    await p.locator("[data-math-dialog]").waitFor();
    await story(p);
    for (let i = 0; i < 20; i++) await drag(p, false);
    await p.getByRole("heading", { name: "敗北", exact: true }).waitFor();
    await p.getByRole("button", { name: "再挑戦", exact: true }).click();
    await p
      .getByRole("button", { name: "この階を再挑戦", exact: true })
      .click();
    await p.locator("[data-math-screen=prepare]").waitFor();
    assert.match(await p.locator(".mt-panel").innerText(), /HP 100/);
    assert.deepEqual(
      tree.games.factor.mathTowerV2.trialProgress.ateacher.adventures,
      beforeReplayLoss,
    );
    assert(
      t.writes.every(
        (x) => !/accounts\/.*\/(?:stats|prof)|tower\/best/.test(x.path),
      ),
    );
    assert.deepEqual(t.errors, []);
    await t.ctx.close();
    console.log(
      "PASS legacy migration, reload, three resumable difficulties, isolated replay, replacement confirmation and restore",
    );
    // Boss cutin and animation lifecycle, using actual DOM positions and input.
    let boss = R.startAdventure(R.fresh(), "normal", 100);
    boss.adventures.normal.floor = 5;
    boss.read["5-pre"] = true;
    const bt = await context(browser, { tree: seed(boss) }),
      bp = bt.page;
    await open(bp);
    await continueTower(bp);
    await bp.getByRole("button", { name: "試練を開始", exact: true }).click();
    await bp.locator("[data-math-dialog]").waitFor();
    await bp
      .getByRole("button", { name: "既読をスキップ", exact: true })
      .click();
    await bp.locator("[data-math-cutin=nul]").waitFor();
    assert.match(await bp.locator("[data-math-cutin]").innerText(), /2倍/);
    await bp.clock.install();
    await bp.clock.runFor(55000);
    assert.match(
      await bp.locator(".mt-battle-toolbar").innerText(),
      /残り 45秒/,
    );
    assert.equal(
      (await bp.locator(".mt-controls").getAttribute("data-math-family")) !==
        null,
      true,
    );
    const first = await pair(bp);
    await rawDrag(bp, first);
    assert.equal(await bp.locator("[data-math-attack]").count(), 0);
    await dismissCutin(bp);
    await bp.clock.resume();
    await bp.evaluate(() => {
      window.__phases = [];
      new MutationObserver(() => {
        const el = document.querySelector("[data-math-attack]");
        if (el && !window.__phases.includes(el.dataset.phase))
          window.__phases.push(el.dataset.phase);
      }).observe(document.body, {
        subtree: true,
        attributes: true,
        attributeFilter: ["data-phase"],
      });
    });
    const ids = await pair(bp);
    const hpBefore = await bp.locator(".mt-enemy").innerText();
    await rawDrag(bp, ids);
    await sleep(90);
    assert.equal(await bp.locator("[data-math-attack]").count(), 1);
    assert.equal(await bp.locator(".mt-enemy").innerText(), hpBefore);
    await rawDrag(bp, ids);
    await bp.getByRole("button", { name: "ポーズ", exact: true }).click();
    await sleep(850);
    assert.equal(await bp.locator("[data-math-attack]").count(), 1);
    await bp.getByRole("button", { name: "再開", exact: true }).click();
    await bp.setViewportSize({ width: 430, height: 844 });
    await bp.waitForFunction(
      () =>
        !document.querySelector("[data-math-attack]") &&
        !document.querySelector(".mt-impact"),
    );
    assert.match(await bp.locator("[data-poly]").innerText(), /1正解/);
    assert((await bp.locator(".mt-enemy").innerText()).includes("93.3%"));
    const phases = await bp.evaluate(() => window.__phases);
    assert(
      phases.includes("merge") &&
        phases.includes("formula") &&
        phases.includes("energy") &&
        phases.includes("flight"),
      JSON.stringify(phases),
    );
    assert.equal(await bp.locator("[data-math-cutin]").count(), 0);
    const writesBeforeExit = bt.writes.filter((x) =>
      x.path.includes("/trialProgress/"),
    ).length;
    await rawDrag(bp, await pair(bp));
    await bp.locator("[data-math-attack]").waitFor();
    await bp.clock.fastForward(46000);
    assert.match(await bp.locator(".mt-battle-toolbar").innerText(), /HP 100/);
    await bp.getByRole("button", { name: "タイトルへ", exact: true }).click();
    await sleep(850);
    assert.equal(await bp.locator("[data-math-attack]").count(), 0);
    assert.equal(
      bt.writes.filter((x) => x.path.includes("/trialProgress/")).length,
      writesBeforeExit,
    );
    assert.deepEqual(bt.errors, []);
    await bt.ctx.close();
    console.log(
      "PASS stopped boss cutin, disabled cards, actual-coordinate magic phases, deferred HP, duplicate input guard, pause and resize during attack",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
