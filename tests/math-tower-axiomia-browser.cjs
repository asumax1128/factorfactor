// AXIOMIA part 1 (prologue + layer 1) played end to end in the browser against the published content file
// (math-tower/axiomia-part1.json): every scripted line appears in order with its speaker, the battles are the unchanged
// battles, progress is saved per layer (progressVersion 3), old chapter-one data is kept and not counted as read.
const { openTower } = require("./tower-nav-helper.cjs");
const fs = require("node:fs"),
  assert = require("node:assert/strict");
const R = require("../math-tower-core");
const { newTower, chromium, context, drag, sleep, dismissCutin } = require("./browser-harness.cjs");
const part = JSON.parse(fs.readFileSync(require.resolve("../math-tower/axiomia-part1.json"), "utf8"));
const view = R.view(part, 1);
const path = "games/factor/mathTowerV2/trialProgress/ateacher";
const seed = (progress) => ({
  games: {
    factor: {
      teachers: { ateacher: { name: "Teacher" } },
      logins: { ateacher: { "teacher-uid": "1234" } },
      mathTowerV2: { access: { ateacher: { enabled: true, role: "teacher" } }, ...(progress ? { trialProgress: { ateacher: progress } } : {}) },
    },
  },
});
const progressOf = (t) => t.tree.games.factor.mathTowerV2.trialProgress.ateacher;
const lineOf = (x) => (Array.isArray(x) ? { who: x[0], text: x[1], ...(x[2] || {}) } : x);
const label = (l) => (l.who === "hero" ? "Teacher" : l.who === "narr" ? "" : l.name || view.characters[l.who].trueName);
const expected = (ids) =>
  ids.flatMap((id) => {
    const ev = view.events.find((e) => e.id === id);
    assert(ev, "event exists: " + id);
    return ev.lines.map(lineOf).map((l) => ({ ev: id, speaker: label(l), text: l.text.replaceAll("{playerName}", "Teacher") }));
  });
// Click through every dialogue box and record what was shown (event, speaker, text).
async function readStory(page) {
  const shown = [];
  for (let n = 0; n < 900; n++) {
    const s = await page.evaluate(() => {
      const d = document.querySelector("[data-math-dialog]");
      if (!d) return null;
      const r = {
        ev: document.querySelector("[data-math-story]").dataset.mathStory,
        speaker: d.querySelector("strong").textContent,
        text: d.querySelector("p").textContent,
        bg: document.querySelector("[data-math-story]").dataset.storyBg,
      };
      d.click();
      return r;
    });
    if (!s) {
      await sleep(40);
      if (!(await page.locator("[data-math-dialog]").count())) return shown;
      continue;
    }
    shown.push(s);
    await sleep(22);
  }
  throw Error("story did not end");
}
const compare = (shown, ids, what) => {
  const want = expected(ids);
  assert.equal(shown.length, want.length, `${what}: number of lines ${shown.length} vs ${want.length}`);
  want.forEach((w, i) => {
    assert.equal(shown[i].ev, w.ev, `${what} #${i} event`);
    assert.equal(shown[i].speaker, w.speaker, `${what} #${i} speaker (${w.text.slice(0, 20)})`);
    assert.equal(shown[i].text, w.text, `${what} #${i} text`);
  });
};
const clickByName = (page, name) => page.getByRole("button", { name, exact: true }).click();
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium" });
  try {
    // ---- a full run: prologue, five locations, clear / fragment / gate, then the end of what exists
    {
      const t = await context(browser, { tree: seed(), axiomia: true }),
        page = t.page;
      await openTower(page);
      assert.match(await page.locator("main h1").first().innerText(), /AXIOMIA/);
      assert.match(await page.locator(".mt-panel").first().innerText(), /第1層「ゼロの消えた街」/);
      await newTower(page, "easy");
      const prologueIds = view.flow.prologue;
      assert.deepEqual(prologueIds, ["AX1-L00-S1", "AX1-L00-S2", "AX1-L00-S3", "AX1-L00-S4", "AX1-L00-S5"]);
      for (let floor = 1; floor <= 5; floor++) {
        if (floor > 1) {
          await clickByName(page, "次の地点へ進む");
          await page.locator("[data-math-screen=prepare]").waitFor();
          assert.equal(progressOf(t).adventures.easy.floor, floor);
          assert.equal(progressOf(t).adventures.easy.layer, 1);
        }
        assert.match(await page.locator(".mt-panel").innerText(), new RegExp(`${floor}地点の準備`));
        await clickByName(page, "試練を開始");
        await page.locator("[data-math-dialog]").waitFor();
        const shown = await readStory(page);
        compare(shown, [...(floor === 1 ? prologueIds : []), ...view.flow.pre(floor)], `pre ${floor}`);
        if (floor === 1) {
          // no portrait of the hero, backgrounds are real ids, placeholders are flagged
          assert(shown.every((x) => part.backgrounds[x.bg]), "every story line has a known background");
        }
        await page.locator("[data-btile]").first().waitFor();
        await dismissCutin(page);
        if (floor === 5) {
          assert.match(await page.locator(".mt-enemy h2").innerText(), /ヌル/);
        }
        if (floor === 2) assert.equal((await page.locator(".mt-enemy h2").innerText()).trim(), "？？？", "the name is not revealed yet");
        // The battle is the unchanged battle: normal enemies fall to 6 correct pairs (all-correct run), the boss to 11.
        let n = 0;
        for (; n < 40; n++) {
          if (await page.locator('[data-math-screen="result"]').count()) break;
          await drag(page);
        }
        await page.locator('[data-math-screen="result"]').waitFor();
        assert.equal(n, floor === 5 ? 11 : 6, `answers needed on floor ${floor}`);
        await clickByName(page, "物語の続きを見る");
        const post = await readStory(page);
        compare(post, view.flow.post(floor), `post ${floor}`);
        if (floor < 5) await page.locator("[data-math-after-floor]").waitFor();
      }
      await page.locator("[data-math-layer-end=last]").waitFor();
      assert.match(await page.locator("[data-math-layer-end]").innerText(), /第1層クリア[\s\S]*第一の断片「数の起点」[\s\S]*続きは制作中/);
      const p = progressOf(t);
      assert.equal(p.progressVersion, 3);
      assert.equal(p.schemaVersion, 1);
      assert.equal(p.adventures.easy.phase, "cleared");
      assert.equal(p.adventures.easy.layer, 1);
      assert.equal(p.adventures.normal, undefined, "other difficulties are untouched");
      assert.equal(p.adventures.hard, undefined);
      for (const f of [1, 2, 3, 4, 5]) {
        assert.equal(p.clearedFloors["L1-" + f], true);
        assert.equal(p.kills["L1-" + f], 1);
        assert.equal(p.seen["L1-" + f], true);
        assert(p.difficulties.easy.records["L1-" + f]);
      }
      assert.equal(p.clearedFloors[1], undefined, "old chapter-one keys are not used by the new layer");
      assert.equal(p.difficulties.easy.best, 0);
      assert.equal(p.difficulties.easy.layerBest[1], 5);
      assert.equal(p.fragments[1], true);
      assert.equal(p.fragment, false);
      assert.equal(p.reveal.zero_slime, true);
      assert.deepEqual([1, 2, 3, 4].map((f) => !!p.notes["L1-" + f]), [true, true, true, true]);
      for (const ev of view.events) assert.equal(p.read[ev.id], true, "read: " + ev.id);
      assert.equal(Object.keys(p.history).length, 5);
      assert(Object.values(p.history).every((h) => h.layer === 1 && h.rulesVersion === part.policy.id));
      // 数理の書 shows the new layer
      await clickByName(page, "ホームへ");
      await page.getByRole("button", { name: /^数理の書/ }).click();
      await page.locator("[data-math-book]").waitFor();
      assert.match(await page.locator("[data-math-book]").innerText(), /数を表す仕組み[\s\S]*絶対値と原点[\s\S]*第一の断片「数の起点」/);
      await clickByName(page, "図鑑");
      const dex = await page.locator("[data-math-book]").innerText();
      for (const s of ["第1層 1地点 カウント・ラビット", "第1層 2地点 ゼロ・スライム", "第1層 3地点 プラスとマイナス", "第1層 4地点 アブソリュート・ウルフ", "第1層 5地点 ヌル"])
        assert(dex.includes(s), "dex: " + s);
      await clickByName(page, "冒険日誌");
      assert.match(await page.locator("[data-math-book]").innerText(), /第1層[\s\S]*イージー：5\/5地点 層クリア/);
      await clickByName(page, "とじる");
      // reload: continue shows the cleared layer; the prologue can be read again
      await page.reload();
      await openTower(page);
      await page.getByRole("button", { name: "続きから", exact: true }).click();
      assert.match(await page.locator("[data-adventure=easy]").innerText(), /第1層クリア/);
      await clickByName(page, "戻る");
      await clickByName(page, "プロローグを読み返す");
      const again = await readStory(page);
      compare(again, prologueIds, "prologue again");
      assert.deepEqual(t.errors, []);
      await t.ctx.close();
      console.log("PASS AXIOMIA part 1: prologue (5 scenes) + layer 1 (5 locations, clear, fragment, gate) played in order; battles unchanged; saved per layer");
    }
    // ---- screens fit phone widths (story, card, dialogue) and nothing scrolls sideways
    for (const width of [375, 390, 430]) {
      const t = await context(browser, { tree: seed(), axiomia: true }),
        page = t.page;
      await page.setViewportSize({ width, height: 800 });
      await openTower(page);
      await newTower(page, "normal");
      await clickByName(page, "試練を開始");
      await page.locator("[data-math-dialog]").waitFor();
      const cards = new Set();
      for (let n = 0; n < 60; n++) {
        const m = await page.evaluate(() => {
          const d = document.querySelector("[data-math-dialog]");
          if (!d) return null;
          const r = d.getBoundingClientRect(),
            c = document.querySelector("[data-math-card]"),
            cr = c && c.getBoundingClientRect();
          const out = { dialogInside: r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight + 1, noSideScroll: document.documentElement.scrollWidth <= innerWidth, card: !!c, cardInside: !c || (cr.left >= 0 && cr.right <= innerWidth && cr.top >= 0 && cr.bottom <= innerHeight) };
          d.click();
          return out;
        });
        if (!m) break;
        assert(m.dialogInside && m.noSideScroll && m.cardInside, "layout " + width + " " + JSON.stringify(m));
        if (m.card) cards.add(n);
        await sleep(22);
      }
      assert(cards.size >= 2, "scene cards were shown");
      assert.deepEqual(t.errors, []);
      await t.ctx.close();
    }
    console.log("PASS AXIOMIA story layout at 375/390/430: dialogue and cards inside the screen, no sideways scroll");
    // ---- a player who finished the old chapter one keeps every old record and still starts the new story unread
    {
      const old = {
        schemaVersion: 1,
        progressVersion: 2,
        purpose: "trial",
        revision: 9,
        startedAt: 5,
        read: { prologue: true, "1-pre": true, "5-epilogue": true },
        reveal: { zero_slime: true },
        seen: { 1: true, 2: true, 3: true, 4: true, 5: true },
        kills: { 1: 2, 2: 1, 3: 1, 4: 1, 5: 1 },
        notes: { 1: true, 2: true, 3: true, 4: true, 5: true },
        newInfo: {},
        clearedFloors: { 1: true, 2: true, 3: true, 4: true, 5: true },
        history: { oldrun: { difficulty: "normal", floor: 5, rank: "S", accuracy: 1, mode: "adventure", at: 7 } },
        fragment: true,
        reward: true,
        adventures: { normal: { difficulty: "normal", floor: 5, hp: 64, phase: "cleared", startedAt: 5 } },
        difficulties: {
          easy: { best: 0, hp: 100, records: {} },
          normal: { best: 5, hp: 64, records: { 5: { rank: "S", accuracy: 1, averageMs: 1, bestCombo: 3, hp: 64, firstClearAt: 7 } } },
          hard: { best: 0, hp: 100, records: {} },
        },
        unknownFutureField: { keep: "me" },
      };
      const t = await context(browser, { tree: seed(JSON.parse(JSON.stringify(old))), axiomia: true }),
        page = t.page;
      await openTower(page);
      await page.getByRole("button", { name: "続きから", exact: true }).click();
      assert.equal((await page.locator("[data-adventure=normal]").innerText()).trim(), "データなし", "the old chapter's adventure is not offered as part of the new story");
      await clickByName(page, "戻る");
      await page.getByRole("button", { name: /^数理の書/ }).click();
      assert.match(await page.locator("[data-math-book]").innerText(), /冒険を進めると記録が増えます/, "old clears are not shown as new-layer notes");
      await clickByName(page, "冒険日誌");
      assert.match(await page.locator("[data-math-book]").innerText(), /第5階 ・ 本編 ・ S/, "the old record is still listed");
      await clickByName(page, "とじる");
      await page.getByRole("button", { name: "移行前の記録・復旧", exact: true }).waitFor();
      await newTower(page, "normal");
      await clickByName(page, "試練を開始");
      const shown = await readStory(page);
      compare(shown, [...view.flow.prologue, ...view.flow.pre(1)], "old player starts unread");
      const p = progressOf(t);
      // saved (starting writes the new format); every old field is intact and the exact old record is kept
      assert.equal(p.progressVersion, 3);
      // Realtime Database does not store empty objects, so the record read back has none of them.
      const dropEmpty = (x) =>
        x && typeof x === "object"
          ? Object.fromEntries(Object.entries(x).map(([k, v]) => [k, dropEmpty(v)]).filter(([, v]) => !(v && typeof v === "object" && !Object.keys(v).length)))
          : x;
      assert.deepEqual(p.migrationBackup2, dropEmpty(old), "exact pre-migration record kept");
      assert.equal(p.unknownFutureField.keep, "me");
      for (const k of ["1", "2", "3", "4", "5"]) assert.equal(p.clearedFloors[k], true);
      assert.equal(p.read.prologue, true);
      assert.equal(p.read["AX1-L00-S1"], true, "new scenes are read now that they were shown");
      assert.equal(p.fragment, true);
      assert.equal(p.reward, true);
      assert.deepEqual(p.legacyAdventures.normal, old.adventures.normal);
      assert.equal(p.adventures.normal.layer, 1);
      assert.equal(p.adventures.normal.floor, 1);
      assert.equal(p.difficulties.normal.best, 5);
      assert.deepEqual(p.history.oldrun, old.history.oldrun);
      assert.equal(p.revision >= 10, true);
      assert.deepEqual(t.errors, []);
      await t.ctx.close();
      console.log("PASS old chapter-one record kept (exact backup, legacy adventure set aside) and the new story starts unread");
    }
    // ---- a record written by a newer app is never overwritten
    {
      const future = { schemaVersion: 1, progressVersion: 4, revision: 3, purpose: "trial", difficulties: {}, marker: "newer" };
      const t = await context(browser, { tree: seed(JSON.parse(JSON.stringify(future))), axiomia: true }),
        page = t.page;
      await page.locator(".action-card.solo").click();
      await page.locator("[data-solo-hub]").waitFor();
      await page.locator("[data-solo-mode=axiomia]").click();
      await page.getByText(/新しい版/).first().waitFor();
      await sleep(300);
      assert.deepEqual(progressOf(t), future);
      assert.equal(t.writes.filter((w) => w.path.includes("mathTowerV2/trialProgress")).length, 0);
      await t.ctx.close();
      console.log("PASS a newer record format is shown as needing an update and never written");
    }
    // ---- students and guests: no entry, and the scenario file is not even requested
    for (const who of ["student", "guest", "wrong-uid"]) {
      const tree = seed();
      let account = { key: "ateacher", name: "Teacher" },
        uid = "teacher-uid";
      if (who === "student") delete tree.games.factor.teachers.ateacher;
      if (who === "guest") account = { guest: true, name: "Guest" };
      if (who === "wrong-uid") uid = "other";
      const t = await context(browser, { tree, account, uid, axiomia: true });
      await sleep(600);
      await t.page.locator(".action-card.solo").click();
      await t.page.locator("[data-solo-hub]").waitFor();
      assert.match(await t.page.locator("[data-solo-mode=axiomia]").innerText(), /準備中/);
      await t.page.locator("[data-solo-mode=axiomia]").click();
      await t.page.waitForFunction(() => document.querySelector("[data-axiomia-gate]")?.dataset.axiomiaGate === "locked");
      assert.equal(await t.page.locator("[data-math-dialog]").count(), 0);
      await t.page.goto("http://localhost/#math-tower");
      await t.page.getByText(/試遊権限|先生アカウント/).first().waitFor();
      assert.equal(await t.page.locator("[data-math-dialog]").count(), 0);
      assert(!t.requests.some((u) => /axiomia-part1\.json/.test(u)), who + ": the scenario is not requested without access");
      assert.deepEqual(t.errors, []);
      await t.ctx.close();
    }
    console.log("PASS students, guests and a wrong login cannot enter AXIOMIA and never load the scenario");
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
