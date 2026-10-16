const { openTower } = require("./tower-nav-helper.cjs");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const R = require("../math-tower-core");
const {
  chromium,
  context,
  continueTower,
  story,
  sleep,
} = require("./browser-harness.cjs");
const content = require("../math-tower/chapter1.json");
const path = "games/factor/mathTowerV2/trialProgress/ateacher";
function seed(floor, phase = "post", difficulty = "normal") {
  const progress = R.startAdventure(R.fresh(), difficulty, 1);
  progress.adventures[difficulty] = {
    ...progress.adventures[difficulty],
    floor,
    phase,
    hp: 73,
  };
  progress.adventures.hard = {
    difficulty: "hard",
    floor: 4,
    phase: "ready",
    hp: 61,
    startedAt: 2,
  };
  progress.revision = 3;
  return {
    games: {
      factor: {
        teachers: { ateacher: true },
        logins: { ateacher: { "teacher-uid": "fake" } },
        mathTowerV2: {
          access: { ateacher: { enabled: true, role: "teacher" } },
          trialProgress: { ateacher: progress },
        },
      },
    },
  };
}
const progressOf = (t) =>
  t.tree.games.factor.mathTowerV2.trialProgress.ateacher;
async function open(t) {
  await openTower(t.page);
  await continueTower(t.page);
}
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  });
  try {
    for (let f = 1; f <= 5; f++) {
      const t = await context(b, { tree: seed(f) }),
        p = t.page;
      await open(t);
      await p.locator("[data-math-dialog]").waitFor();
      await story(p);
      await p
        .locator(`[data-math-screen=${f === 5 ? "chapterEnd" : "afterFloor"}]`)
        .waitFor();
      assert.equal(progressOf(t).adventures.normal.floor, Math.min(5, f + 1));
      assert.equal(progressOf(t).adventures.normal.hp, 73);
      assert.equal(progressOf(t).adventures.hard.hp, 61);
      if (f === 5) {
        assert.equal(
          await p
            .getByRole("button", { name: "次の階へ進む", exact: true })
            .count(),
          0,
        );
        assert.equal(progressOf(t).adventures.normal.phase, "cleared");
      } else {
        const rev = progressOf(t).revision;
        await p
          .getByRole("button", { name: "次の階へ進む", exact: true })
          .evaluate((e) => {
            e.click();
            e.click();
          });
        await p.locator("[data-math-screen=prepare]").waitFor();
        assert.match(
          await p.locator(".mt-panel").innerText(),
          new RegExp(`${f + 1}階の準備`),
        );
        assert.match(
          await p.locator(".mt-panel").innerText(),
          /HP 73 ・ ノーマル/,
        );
        assert.equal(
          progressOf(t).revision,
          rev,
          "navigation does not resave/advance",
        );
        await p.reload();
        await open(t);
        await p.locator("[data-math-screen=prepare]").waitFor();
        assert.equal(progressOf(t).adventures.normal.floor, f + 1);
      }
      assert.deepEqual(t.errors, []);
      await t.ctx.close();
      console.log(
        "PASS saved post-story → next action/next floor/reload/double tap",
        f,
      );
    }
    // Full, unchanged third-floor script includes the old twin_fox speaker line.
    const t = await context(b, { tree: seed(3, "ready") }),
      p = t.page;
    await open(t);
    await p.getByRole("button", { name: "試練を開始", exact: true }).click();
    await p.locator('[data-math-story="3-pre"]').waitFor();
    const positions = {};
    for (
      let i = 0;
      i < content.events.find((e) => e.id === "3-pre").lines.length;
      i++
    ) {
      const original = content.events.find((e) => e.id === "3-pre").lines[i];
      const who = original[0] === "twin_fox" ? "plus" : original[0];
      const imgs = p.locator("[data-math-character]");
      assert.deepEqual(
        await imgs.evaluateAll((es) => es.map((e) => e.dataset.mathCharacter)),
        ["minus", "plus"],
      );
      for (const id of ["plus", "minus"]) {
        const img = p.locator(`[data-math-character=${id}]`);
        await img.evaluate((e) => e.decode());
        assert.equal(
          await img.getAttribute("src"),
          content.characters[id].image,
        );
        assert.equal(
          await img.getAttribute("data-speaking"),
          String(who === id),
        );
        const box = await img.boundingBox();
        if (!positions[id]) positions[id] = box;
        else
          for (const key of ["x", "y", "width", "height"])
            assert(Math.abs(box[key] - positions[id][key]) < 1);
      }
      if (original[0] === "twin_fox")
        assert.equal(
          await p.locator(".mt-dialog strong").innerText(),
          "プラス",
        );
      if (i === 29 && process.env.TOWER_FLOW_SCREENSHOTS) {
        fs.mkdirSync(process.env.TOWER_FLOW_SCREENSHOTS, { recursive: true });
        await p.screenshot({
          path: process.env.TOWER_FLOW_SCREENSHOTS + "/floor3-dialogue.png",
        });
      }
      await p.locator("[data-math-dialog]").click();
    }
    await p.locator("[data-btile]").first().waitFor();
    assert.equal(
      await p.locator(".mt-enemy img").getAttribute("src"),
      content.characters.twin_fox.image,
    );
    assert.deepEqual(t.errors, []);
    await t.ctx.close();
    console.log(
      "PASS all 31 dialogue lines: fixed single portraits, speaker highlight and battle unit intact",
    );
    // A failed post-story write must not expose navigation or claim success.
    let fail = true;
    const delayed = await context(b, {
      tree: seed(1),
      onOperation: async (op) => {
        if (op.path !== path) return;
        await sleep(180);
        if (fail) {
          fail = false;
          throw Error("NETWORK_ERROR");
        }
      },
    });
    await open(delayed);
    await delayed.page.locator("[data-math-dialog]").waitFor();
    for (const _ of content.events.find((e) => e.id === "1-post").lines) {
      await delayed.page.locator("[data-math-dialog]").click();
      await sleep(25);
    }
    await delayed.page
      .getByRole("alert")
      .getByRole("button", { name: "保存を再試行", exact: true })
      .waitFor();
    assert.equal(progressOf(delayed).adventures.normal.floor, 1);
    assert.equal(
      await delayed.page.locator("[data-math-after-floor]").count(),
      0,
    );
    await delayed.page
      .getByRole("alert")
      .getByRole("button", { name: "保存を再試行", exact: true })
      .evaluate((e) => {
        e.click();
        e.click();
      });
    await delayed.page.locator("[data-math-screen=afterFloor]").waitFor();
    assert.equal(progressOf(delayed).adventures.normal.floor, 2);
    const revision = progressOf(delayed).revision;
    await delayed.page
      .getByRole("button", { name: "数学の塔メニューへ戻る", exact: true })
      .evaluate((e) => {
        e.click();
        e.click();
      });
    await delayed.page.locator("[data-math-screen=home]").waitFor();
    assert.equal(progressOf(delayed).revision, revision);
    await continueTower(delayed.page);
    await delayed.page.locator("[data-math-screen=prepare]").waitFor();
    assert.equal(progressOf(delayed).adventures.normal.floor, 2);
    assert.deepEqual(delayed.errors, []);
    await delayed.ctx.close();
    console.log(
      "PASS failed/delayed story save, explicit retry, menu save and resume",
    );
    const conflict = await context(b, { tree: seed(1) }),
      cp = conflict.page;
    await open(conflict);
    await cp.locator("[data-math-dialog]").waitFor();
    const postLines = content.events.find((e) => e.id === "1-post").lines;
    for (let i = 0; i < postLines.length - 1; i++) {
      await cp.locator("[data-math-dialog]").click();
    }
    const latest = R.copy(progressOf(conflict));
    latest.revision++;
    latest.adventures.normal = {
      ...latest.adventures.normal,
      floor: 4,
      phase: "ready",
      hp: 62,
    };
    conflict.tree.games.factor.mathTowerV2.trialProgress.ateacher = latest;
    await cp.evaluate(
      ({ path, latest }) => window.__fbApply({ kind: "set", path, v: latest }),
      { path, latest },
    );
    await cp.locator("[data-math-dialog]").click();
    await cp.locator(".mt-recovery").waitFor();
    assert.equal(await cp.locator("[data-math-after-floor]").count(), 0);
    assert.deepEqual(progressOf(conflict), latest);
    await cp
      .getByRole("button", { name: "最新の記録を読み込む", exact: true })
      .click();
    await cp.locator("[data-math-screen=home]").waitFor();
    await continueTower(cp);
    await cp.locator("[data-math-screen=prepare]").waitFor();
    assert.match(await cp.locator(".mt-panel").innerText(), /4階の準備/);
    assert.deepEqual(progressOf(conflict), latest);
    assert.deepEqual(conflict.errors, []);
    await conflict.ctx.close();
    console.log(
      "PASS true conflict at post-story boundary: no overwrite/navigation, latest-save recovery",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
