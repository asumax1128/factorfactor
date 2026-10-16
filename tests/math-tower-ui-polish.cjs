const { openTower } = require("./tower-nav-helper.cjs");
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  cp = require("node:child_process"),
  R = require("../math-tower-core");
const {
  chromium,
  context,
  story,
  newTower,
  drag,
  sleep,
} = require("./browser-harness.cjs");
const content = require("../math-tower/chapter1.json");
const seed = (progress = R.fresh(), c = content) => ({
  games: {
    factor: {
      teachers: { ateacher: true },
      logins: { ateacher: { "teacher-uid": "fake" } },
      mathTowerV2: {
        access: { ateacher: { enabled: true, role: "teacher" } },
        content: { ateacher: { chapter1: c } },
        trialProgress: { ateacher: progress },
      },
    },
  },
});
const open = (p) => openTower(p);
const BASE = "c426284";
async function battle(browser, options = {}) {
  const t = await context(browser, {
      tree: seed(),
      captureTower: true,
      ...options,
    }),
    p = t.page;
  await open(p);
  await newTower(p);
  await p.getByRole("button", { name: "試練を開始", exact: true }).click();
  await p.locator("[data-math-dialog]").waitFor();
  await story(p);
  await p.locator("[data-btile]").first().waitFor();
  return t;
}
async function fixtures(p) {
  await p.evaluate(() => {
    (
      document.querySelector(".mt-target-wrap") ||
      document.querySelector(".mt-controls > .v7-target")
    ).remove();
    document.querySelector(".mt-board").style.order = 2;
    document.querySelector(".mt-board").replaceChildren();
    window.__fixtureTiles = [
      { type: "const", k: -6 },
      { type: "const", k: 9 },
      { type: "const", k: 6 },
      { type: "const", k: 7 },
      { type: "linear", a: 9, b: 5 },
      { type: "linear", a: 9, b: -5 },
    ].map((factor, i) => ({ id: "fixture" + i, factor }));
    const container = document.createElement("div");
    document.body.append(container);
    window.__targetFixture = ReactDOM.createRoot(container);
  });
}
async function equation(p, poly, lv) {
  await p.evaluate(
    ({ poly, lv }) => {
      const H = window.__towerHelpers,
        C = window.__towerComponents;
      window.__targetFixture.render(
        React.createElement(
          React.Fragment,
          null,
          ReactDOM.createPortal(
            React.createElement(C.Target || H.TargetCard, {
              TargetCard: H.TargetCard,
              poly,
              level: lv,
              qLabel: "0正解",
              gaugeMs: 45000,
              v7: true,
            }),
            document.querySelector(".mt-controls"),
          ),
          ReactDOM.createPortal(
            React.createElement(H.BattleBoard, {
              tiles: window.__fixtureTiles,
              onMatch: () => {},
              disabled: true,
              v7: true,
            }),
            document.querySelector(".mt-board"),
          ),
        ),
      );
    },
    { poly, lv },
  );
  await p.waitForFunction(
    (poly) =>
      document.querySelector("[data-poly]")?.getAttribute("data-poly") ===
      JSON.stringify(poly),
    poly,
  );
  await p.evaluate(() => document.fonts.ready);
  await sleep(80);
}
async function geometry(p) {
  return p.locator(".mt-controls .v7-poly").evaluate((box) => {
    const text = box.querySelector(".fxm"),
      rects = [text.getBoundingClientRect()],
      walker = document.createTreeWalker(text, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const r = document.createRange();
      r.selectNodeContents(walker.currentNode);
      rects.push(...r.getClientRects());
    }
    const m = {
        left: Math.min(...rects.map((r) => r.left)),
        right: Math.max(...rects.map((r) => r.right)),
        top: Math.min(...rects.map((r) => r.top)),
        bottom: Math.max(...rects.map((r) => r.bottom)),
      },
      r = box.getBoundingClientRect();
    return {
      box: {
        left: r.left,
        right: r.right,
        top: r.top,
        bottom: r.bottom,
        height: r.height,
      },
      math: m,
      font: getComputedStyle(text).fontFamily,
      size: getComputedStyle(text).fontSize,
      overflow: getComputedStyle(box).overflow,
      cardHeight: document.querySelector("[data-btile]").getBoundingClientRect()
        .height,
      clippedBottom: Math.max(0, m.bottom - r.bottom),
      clippedTop: Math.max(0, r.top - m.top),
      clippedWidth: Math.max(0, r.left - m.left, m.right - r.right),
    };
  });
}
(async () => {
  const b = await chromium.launch({
      executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    }),
    shots = process.env.TOWER_UI_SCREENSHOTS;
  if (shots) fs.mkdirSync(shots, { recursive: true });
  try {
    const poly = { x4: 0, x3: 0, x2: 0, x1: 54, x0: -30 };
    const before = await battle(b, {
      assetOverrides: {
        "/math-tower.css": cp.execFileSync(
          "git",
          ["show", BASE + ":math-tower.css"],
          { encoding: "utf8" },
        ),
        "/math-tower-ui.js": cp.execFileSync(
          "git",
          ["show", BASE + ":math-tower-ui.js"],
          { encoding: "utf8" },
        ),
      },
    });
    await before.page.setViewportSize({ width: 390, height: 700 });
    await before.page.addStyleTag({
      content:
        "@font-face{font-family:KaTeX_Main;src:url('/fonts/katex/KaTeX_Main-Regular.woff2')}@font-face{font-family:KaTeX_Math;src:url('/fonts/katex/KaTeX_Math-Italic.woff2');font-style:italic}",
    });
    await fixtures(before.page);
    await equation(before.page, poly, 1);
    const old = await geometry(before.page);
    assert(old.clippedBottom > 5, JSON.stringify(old));
    if (shots)
      await before.page.screenshot({
        path: shots + "/formula-before-390x700.png",
      });
    await before.ctx.close();
    console.log(
      "PASS baseline reproduction: formula bottom clipped by",
      old.clippedBottom.toFixed(2),
      "px",
    );
    const t = await battle(b),
      p = t.page;
    await fixtures(p);
    const sample = await p.evaluate(() =>
      Array.from(
        { length: 9 },
        (_, i) => __towerHelpers.buildBoard(i + 1, new Set(), 6).poly,
      ),
    );
    sample[0] = poly;
    const comparisons = [];
    for (const [width, height] of [
      [320, 568],
      [375, 667],
      [390, 700],
      [390, 844],
      [430, 932],
      [1366, 768],
    ]) {
      await p.setViewportSize({ width, height });
      for (let i = 0; i < sample.length; i++) {
        await equation(p, sample[i], i + 1);
        const g = await geometry(p);
        assert(
          g.clippedBottom < 1 && g.clippedTop < 1 && g.clippedWidth < 1,
          JSON.stringify({ width, height, lv: i + 1, g }),
        );
      }
      const long = { x4: 12345, x3: -23456, x2: 34567, x1: -45678, x0: 56789 };
      await equation(p, long, 9);
      const g = await geometry(p);
      assert(
        g.clippedWidth < 1 && g.clippedBottom < 1 && g.clippedTop < 1,
        JSON.stringify(g),
      );
      await equation(p, poly, 1);
      comparisons.push({ width, height, ...(await geometry(p)) });
      if (shots)
        await p.screenshot({
          path: shots + `/formula-after-${width}x${height}.png`,
        });
      console.log("PASS Lv1-Lv9 and long formula glyph bounds", width, height);
    }
    // Repeated visual viewport height changes model address-bar expansion/collapse.
    for (const height of [600, 760, 650, 844]) {
      await p.setViewportSize({ width: 390, height });
      await sleep(100);
      const g = await geometry(p);
      assert(
        g.clippedBottom < 1 && g.clippedTop < 1 && g.clippedWidth < 1,
        JSON.stringify(g),
      );
    }
    assert.deepEqual(t.errors, []);
    await t.ctx.close();
    if (shots)
      fs.writeFileSync(
        shots + "/formula-comparison.json",
        JSON.stringify({ before: old, after: comparisons }, null, 2),
      );
    console.log(
      "PASS height changes after font load preserve full glyphs and measured coordinates",
    );
    const fallback = await battle(b, {
      blockedAssets: [
        "/fonts/katex/KaTeX_Main-Regular.woff2",
        "/fonts/katex/KaTeX_Math-Italic.woff2",
      ],
    });
    await fixtures(fallback.page);
    await fallback.page.setViewportSize({ width: 320, height: 568 });
    await equation(fallback.page, poly, 1);
    const fg = await geometry(fallback.page);
    assert(
      fg.clippedBottom < 1 && fg.clippedTop < 1 && fg.clippedWidth < 1,
      JSON.stringify(fg),
    );
    assert.deepEqual(fallback.errors, []);
    await fallback.ctx.close();
    console.log(
      "PASS font failure falls back without missing glyphs or clipping",
    );
    // Story uses exactly the host math renderer on paper and in the dialogue.
    const st = await context(b, { tree: seed(), captureTower: true }),
      sp = st.page;
    await open(sp);
    await newTower(sp);
    await sp.getByRole("button", { name: "試練を開始", exact: true }).click();
    await sp.locator("[data-math-dialog]").waitFor();
    for (let i = 0; i < 4; i++) await sp.locator("[data-math-dialog]").click();
    await sp.evaluate(() => document.fonts.ready);
    await sleep(700);
    assert.equal(
      await sp.locator(".mt-paper-math .fxm-v").first().innerText(),
      "x",
    );
    assert.equal(
      await sp.locator(".mt-dialog .fxm-v").first().innerText(),
      "x",
    );
    assert.equal(await sp.locator(".mt-paper-math sup").innerText(), "2");
    assert.equal(await sp.locator(".mt-dialog sup").innerText(), "2");
    const fonts = await sp.evaluate(() =>
      [".mt-paper-math .fxm", ".mt-dialog .fxm"].map(
        (s) => getComputedStyle(document.querySelector(s)).fontFamily,
      ),
    );
    assert.equal(fonts[0], fonts[1]);
    assert(fonts[0].includes("TowerMathMain"));
    assert.equal(
      await sp
        .locator(".mt-paper-math .fxm-v")
        .first()
        .evaluate((e) => getComputedStyle(e).fontStyle),
      "italic",
    );
    if (shots) await sp.screenshot({ path: shots + "/notebook-textbook.png" });
    assert.deepEqual(st.errors, []);
    await st.ctx.close();
    console.log(
      "PASS licensed loaded math fonts, italic variables and matching notebook/dialogue superscripts",
    );
    const q = R.fresh();
    q.seen = { 1: true, 2: true };
    q.kills = { 1: 2 };
    const bt = await context(b, { tree: seed(q) }),
      bp = bt.page;
    await open(bp);
    await bp.getByRole("button", { name: /数理の書/ }).click();
    await bp.getByRole("button", { name: "図鑑", exact: true }).click();
    await bp.getByRole("button", { name: "画像を見る", exact: true }).waitFor();
    assert.equal(
      await bp.getByRole("button", { name: "画像を見る", exact: true }).count(),
      1,
    );
    assert.equal(await bp.locator("[data-math-book] article").count(), 2);
    assert.match(await bp.locator("[data-math-book]").innerText(), /討伐 2回/);
    await bp.getByRole("button", { name: "画像を見る", exact: true }).click();
    const src = await bp.locator(".mt-zoom img").getAttribute("src");
    assert.equal(src, content.characters[content.floors[1]].image);
    await bp.waitForFunction(
      () => document.querySelector(".mt-zoom img").naturalWidth > 0,
    );
    await bp
      .getByRole("button", { name: "✕ 画像を閉じる", exact: true })
      .click();
    assert.equal(await bp.locator(".mt-zoom").count(), 0);
    if (shots) await bp.screenshot({ path: shots + "/bestiary-compact.png" });
    assert.deepEqual(bt.errors, []);
    await bt.ctx.close();
    const missing = JSON.parse(JSON.stringify(content));
    delete missing.characters[missing.floors[1]].image;
    const mt = await context(b, {
      tree: seed(q, missing),
      towerContent: missing,
    });
    await open(mt.page);
    await mt.page.getByRole("button", { name: /数理の書/ }).click();
    await mt.page.getByRole("button", { name: "図鑑", exact: true }).click();
    assert.equal(
      await mt.page
        .getByRole("button", { name: "画像を見る", exact: true })
        .count(),
      0,
    );
    assert.deepEqual(mt.errors, []);
    await mt.ctx.close();
    const bad = JSON.parse(JSON.stringify(content));
    bad.characters[bad.floors[1]].image =
      "data:image/png;base64,bm90LWFuLWltYWdl";
    const badctx = await context(b, { tree: seed(q, bad), towerContent: bad });
    await open(badctx.page);
    await badctx.page.getByRole("button", { name: /数理の書/ }).click();
    await badctx.page
      .getByRole("button", { name: "図鑑", exact: true })
      .click();
    await badctx.page
      .getByText("画像は現在表示できません。", { exact: true })
      .waitFor();
    assert.equal(
      await badctx.page
        .getByRole("button", { name: "画像を見る", exact: true })
        .count(),
      0,
    );
    assert.deepEqual(badctx.errors, []);
    await badctx.ctx.close();
    console.log(
      "PASS compact image viewer, correct decoded asset, spoiler guard and missing-image guard",
    );
    const vt = await battle(b),
      vp = vt.page;
    await vp.evaluate(() => GameAudio.setMuted(true));
    for (let i = 0; i < 10; i++) {
      if (await vp.locator("[data-math-screen=result]").count()) break;
      await drag(vp);
    }
    await vp.locator("[data-victory-rank=S]").waitFor();
    assert.equal(
      await vp.evaluate(
        () => GameAudio.isMuted() && Tone.getDestination().mute,
      ),
      true,
    );
    const path = "games/factor/mathTowerV2/trialProgress/ateacher",
      count = () => vt.writes.filter((x) => x.path === path).length,
      writes = count();
    await vp
      .getByRole("button", { name: "演出をスキップ", exact: true })
      .click();
    await sleep(700);
    assert.equal(count(), writes);
    assert.equal(
      Object.keys(
        vt.tree.games.factor.mathTowerV2.trialProgress.ateacher.history,
      ).length,
      1,
    );
    if (shots) await vp.screenshot({ path: shots + "/victory-S.png" });
    for (const rank of ["S", "A", "B", "C"]) {
      const ranks = await vp.evaluate((rank) => {
        const container = document.createElement("div");
        container.className = "mt-app mt-result-app";
        container.style.cssText = "position:fixed;inset:0;z-index:200";
        document.body.append(container);
        window.__victoryPreview = {
          root: ReactDOM.createRoot(container),
          container,
        };
        __victoryPreview.root.render(
          React.createElement(__towerComponents.Victory, {
            outcome: {
              rank,
              accuracy: 0.85,
              misses: 1,
              timeouts: 1,
              bestCombo: 6,
              hp: 80,
              enemyRemaining: 0,
            },
            onNext: () => (window.__nextCount = (window.__nextCount || 0) + 1),
            background: null,
          }),
        );
        return rank;
      }, rank);
      for (const [width, height] of [
        [320, 568],
        [390, 700],
        [430, 932],
      ]) {
        await vp.setViewportSize({ width, height });
        const actual = await vp
          .locator("[data-math-screen=result] .mt-victory-next")
          .boundingBox();
        assert(
          actual.y >= 0 && actual.y + actual.height <= height,
          JSON.stringify({ rank, width, height, actual }),
        );
        const next = vp.locator("body > .mt-result-app .mt-victory-next");
        await next.waitFor();
        const rect = await next.boundingBox();
        assert(
          rect.y >= 0 && rect.y + rect.height <= height,
          JSON.stringify({ rank, width, height, rect }),
        );
      }
      assert.equal(
        await vp.locator("body > .mt-result-app .mt-victory-stars i").count(),
        rank === "S" ? 24 : rank === "A" ? 16 : 8,
      );
      await vp.locator("body > .mt-result-app .mt-victory-next").click();
      await vp.evaluate(() => {
        __victoryPreview.root.unmount();
        __victoryPreview.container.remove();
      });
    }
    assert.equal(count(), writes);
    assert.equal(await vp.evaluate(() => window.__nextCount), 4);
    await vp
      .getByRole("button", { name: "物語の続きを見る", exact: true })
      .click();
    await vp.locator("[data-math-dialog]").waitFor();
    assert.deepEqual(vt.errors, []);
    await vt.ctx.close();
    console.log(
      "PASS rank decorations, always-operable next/skip, mobile result layout and exactly one result save",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
