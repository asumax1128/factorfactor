// Ver.6.0 online A / B2 play frame (header, versus strip, timer, targets). Presentation only:
// the board, question card, drag logic, scoring and transport are untouched and are re-checked here.
const assert = require("node:assert/strict");
const fs = require("fs");
const { chromium, context, sleep, pair } = require("./browser-harness.cjs");
const SHOT = process.env.PF_SHOTS || "";
const VIEWPORTS = [
  [375, 844],
  [390, 844],
  [1440, 900],
  [683, 325],
];
// ---- static guards on the new stylesheet ----
const css = fs.readFileSync("ui-next/play-frame.css", "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
assert(!/touch-action/.test(css), "play-frame.css must not change touch-action");
assert(!/!important/.test(css), "play-frame.css must not use !important");
for (const block of css.matchAll(/(^|\})\s*([^{}@]+)\{([^{}]*)\}/g)) {
  const sel = block[2].trim(), body = block[3];
  if (/^\.pf-surface\s*$/.test(sel) || /^\.pf-surface\s*,/.test(sel))
    assert(!/background/.test(body.replace(/--pf-[\w-]+:[^;]+;?/g, "")), "the surface background (きせかえ) must not be overridden");
  assert(!/\.(v7-target|v7-poly)\b/.test(sel) && !/\[data-btile\]/.test(sel) && !/\.katex/.test(sel), "question card, tiles and formulas are not styled: " + sel);
  assert(sel.split(",").every((x) => x.trim().startsWith(".pf-surface")), "every selector is scoped to .pf-surface: " + sel);
}
const tree = (skin) => ({
  games: {
    factor: {
      accounts: { ateacher: { name: "Teacher", stats: { rating: 1600, exp: skin ? 100000 : 100, ...(skin ? { skin } : {}) }, prof: { lv: { L1: { n: 30, ok: 25, ms: 100000 } } } } },
      onlineSparkV1: { config: { enabled: true, protocol: "spark-v1" } },
    },
  },
});
const ui = fs.readFileSync("online-rated-ui.js", "utf8");
async function ready(p) {
  await p.locator("[data-btile]").first().waitFor({ timeout: 30000 });
}
async function startRated(b, mode, w, h) {
  const t = await context(b, { tree: tree(), assetOverrides: { "/online-rated-ui.js": ui } }), p = t.page;
  await p.setViewportSize({ width: w, height: h });
  await p.locator(".action-card.online").click();
  await p.getByRole("button", { name: "すぐ遊ぶ（ランダム対戦）", exact: true }).click();
  await p.getByRole("button", { name: "イージーで相手を探す", exact: true }).click();
  await p.locator("[data-om=vote]").waitFor({ timeout: 20000 });
  await p.getByRole("button", { name: mode === "A" ? "A：早い者勝ち" : "B：レース＋攻撃", exact: true }).click();
  await p.waitForFunction(() => document.querySelector("[data-online-ready]")?.dataset.onlineReady === "true", null, { timeout: 20000 });
  return t;
}
async function startCpu(b, mode, count, w, h, skin) {
  const t = await context(b, { tree: tree(skin), assetOverrides: { "/online-rated-ui.js": ui } }), p = t.page;
  await p.setViewportSize({ width: w, height: h });
  await p.locator(".action-card.online").click();
  await p.getByRole("group", { name: "方式", exact: true }).getByRole("button", { name: mode === "A" ? /^A/ : "新B方式" }).click();
  await p.getByRole("group", { name: "CPUの強さ", exact: true }).getByRole("button", { name: "よわい", exact: true }).click(); // a slow CPU cannot advance the question while a drag is held
  if (count > 1) await p.getByRole("group", { name: "CPUの人数", exact: true }).getByRole("button", { name: `${count}人`, exact: true }).click();
  await p.getByRole("button", { name: "CPUと練習スタート", exact: true }).click();
  await ready(p);
  await sleep(3600); // countdown
  if (mode !== "A") await p.waitForFunction(() => document.querySelector("[data-online-ready]")?.dataset.onlineReady === "true", null, { timeout: 20000 });
  return t;
}
async function layout(p, name, w, h, o) {
  await p.locator(".v7-poly").first().waitFor({ timeout: 20000 });
  await p.locator("[data-btile]").nth(5).waitFor({ timeout: 20000 });
  const info = await p.evaluate(() => {
    const rect = (e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, r: r.right, b: r.bottom }; };
    const exit = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "✕ 退出");
    const surface = document.querySelector(".game-lock");
    const tiles = [...document.querySelectorAll("[data-btile]")].map(rect);
    const opp = document.querySelector("[data-online-opponent] b") || document.querySelector("[data-opp] span.truncate");
    const time = document.querySelector(".pf-time");
    const selfName = document.querySelector(".pf-name");
    const poly = document.querySelector(".v7-target");
    const tile = document.querySelector("[data-btile]");
    const katex = document.querySelector(".v7-target .v7-poly *"), tileIn = document.querySelector("[data-btile] *");
    return {
      cls: surface.className, bgImage: getComputedStyle(surface).backgroundImage, inlineBg: surface.style.background, touch: getComputedStyle(surface).touchAction,
      sw: document.documentElement.scrollWidth,
      exit: exit && rect(exit), tiles,
      opp: opp && { ...rect(opp), fs: parseFloat(getComputedStyle(opp).fontSize), text: opp.textContent },
      time: time && { ...rect(time), fs: parseFloat(getComputedStyle(time).fontSize), text: time.textContent, vis: getComputedStyle(time).visibility },
      selfName: selfName && { text: selfName.textContent, ell: getComputedStyle(selfName).textOverflow },
      targetBg: poly && getComputedStyle(poly).backgroundColor, tileBg: tile && getComputedStyle(tile).backgroundColor,
      katexFont: katex && getComputedStyle(katex).fontFamily, tileFont: tileIn && getComputedStyle(tileIn).fontFamily, polyFont: getComputedStyle(document.querySelector(".v7-poly")).fontFamily,
      anchors: { opp: !!document.querySelector("[data-online-opponent],[data-opp]"), fx: !!document.querySelector("[data-fxtarget]"), ready: !!document.querySelector("[data-online-ready]"), self: !!document.querySelector("[data-online-self]") },
    };
  });
  assert(info.cls.includes("pf-surface"), `${name}: framed surface`);
  assert(info.sw <= w + 1, `${name}: no horizontal scroll at ${w}x${h} (${info.sw})`);
  assert(info.exit && info.exit.h >= 44 && info.exit.w >= 44, `${name}: exit >=44px at ${w}x${h}`);
  assert(info.exit.x >= 0 && info.exit.x < w / 2 && info.exit.y >= 0 && info.exit.y < 90, `${name}: exit is at the top-left at ${w}x${h}`);
  assert(info.tiles.length >= 6, `${name}: tiles rendered`);
  const tall = h >= 600;
  for (const t of info.tiles) {
    assert(t.h >= (tall ? 60 : 30), `${name}: tile height ${t.h} at ${w}x${h}`);
    assert(t.x >= 0 && t.r <= w + 1, `${name}: tile inside the width at ${w}x${h}`);
    if (tall) assert(t.y >= 0 && t.b <= h, `${name}: tile inside the viewport at ${w}x${h}`);
  }
  assert(info.bgImage !== "none" && info.inlineBg, `${name}: the きせかえ background is still applied`);
  assert(info.touch === "none" || info.touch === "pan-y", `${name}: touch-action unchanged (${info.touch})`);
  if (info.opp) {
    assert(info.opp.w >= 40 && info.opp.h <= info.opp.fs * 2.2, `${name}: opponent name is not folded vertically (${info.opp.w}x${info.opp.h}) at ${w}x${h}`);
  }
  if (o.timer) {
    assert(info.time && info.time.vis === "visible" && /^\d+\.\d$/.test(info.time.text), `${name}: timer shows seconds (${info.time && info.time.text})`);
    assert(info.time.fs >= 20 && info.time.x >= 0 && info.time.r <= w + 1 && info.time.y >= 0, `${name}: timer is big and on screen at ${w}x${h}`);
    assert(info.selfName && info.selfName.text.length > 0 && info.selfName.ell === "ellipsis", `${name}: my name is shown, truncated with ellipsis`);
  }
  assert.equal(info.targetBg, "rgb(255, 253, 247)", `${name}: question card keeps the light background`);
  assert(/KaTeX_Main/.test(info.katexFont || "") && /KaTeX_Main/.test(info.tileFont || ""), `${name}: formula font unchanged (KaTeX)`);
  assert.equal(info.polyFont, '"Zen Maru Gothic", sans-serif', `${name}: question font unchanged`);
  assert(info.anchors.opp && info.anchors.fx, `${name}: effect anchors kept`);
  if (o.b2) assert(info.anchors.self, `${name}: self HP anchor kept`);
  if (o.ready) assert(info.anchors.ready, `${name}: data-online-ready kept`);
  if (SHOT) await p.screenshot({ path: `${SHOT}/${name}-${w}x${h}.png` });
}
// the board must survive time/heartbeat re-renders while a drag is held, and a correct pair must count exactly once
async function dragSurvives(p, name, b2) {
  await p.locator("[data-poly]").waitFor({ timeout: 20000 });
  await p.locator("[data-btile]").nth(5).waitFor({ timeout: 20000 });
  const ids = await pair(p);
  assert(ids, `${name}: a correct pair exists`);
  await p.evaluate((i) => { for (const id of i) document.querySelector(`[data-btile="${id}"]`).__pfMark = 1; document.querySelector(".v7-target").__pfMark = 1; }, ids);
  const a = await p.locator(`[data-btile="${ids[0]}"]`).boundingBox(), c = await p.locator(`[data-btile="${ids[1]}"]`).boundingBox();
  await p.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await p.mouse.down();
  await p.mouse.move(a.x + a.width / 2 + 6, a.y + a.height / 2 + 6, { steps: 2 });
  await sleep(900); // several 100ms ticks / heartbeats while holding
  const held = await p.evaluate((i) => ({ same: i.every((id) => document.querySelector(`[data-btile="${id}"]`)?.__pfMark === 1), line: !!document.querySelector(".game-lock svg line") }), ids);
  assert(held.same, `${name}: tile nodes were not recreated while dragging`);
  assert(held.line, `${name}: drag line is still drawn after re-renders`);
  await p.mouse.move(c.x + c.width / 2, c.y + c.height / 2, { steps: 4 });
  await p.mouse.up();
  if (b2) {
    await p.getByText("1問", { exact: true }).first().waitFor({ timeout: 8000 });
    await sleep(900);
    assert.equal(await p.getByText("1問", { exact: true }).count() > 0, true, `${name}: solved stays at 1 (no duplicate judgement)`);
    assert.equal(await p.getByText("2問", { exact: true }).count(), 0, `${name}: not counted twice`);
  } else {
    await p.waitForFunction((i) => !document.querySelector(`[data-btile="${i[0]}"]`)?.__pfMark, ids, { timeout: 8000 });
  }
}
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium" });
  try {
    for (const [w, h] of VIEWPORTS) {
      for (const mode of ["A", "B"]) {
        const t = await startRated(b, mode, w, h), p = t.page;
        await layout(p, `rated-${mode === "A" ? "A" : "B2"}`, w, h, { timer: true, b2: mode === "B", ready: true });
        assert.deepEqual(t.errors, []);
        await t.ctx.close();
      }
      {
        const t = await startCpu(b, "A", 1, w, h), p = t.page;
        await layout(p, "cpu-A", w, h, { timer: false });
        assert.match(await p.locator(".pf-name").first().innerText(), /Teacher/);
        assert.deepEqual(t.errors, []);
        await t.ctx.close();
      }
      {
        const t = await startCpu(b, "B", 1, w, h), p = t.page;
        await layout(p, "cpu-B2", w, h, { timer: true, b2: true, ready: true });
        assert.equal(await p.locator(".pf-target").count(), 0, "1v1 shows no target selector");
        assert.deepEqual(t.errors, []);
        await t.ctx.close();
      }
      {
        const t = await startCpu(b, "B", 3, w, h), p = t.page;
        await layout(p, "cpu-B2-4p", w, h, { timer: true, b2: true, ready: true });
        const info = await p.evaluate(() => [...document.querySelectorAll(".pf-target")].map((e) => { const r = e.getBoundingClientRect(); return { h: r.height, x: r.x, r: r.right, y: r.y, b: r.bottom, pressed: e.getAttribute("aria-pressed"), border: getComputedStyle(e).borderTopColor, dis: e.disabled, name: e.getAttribute("aria-label") || e.textContent }; }));
        assert.equal(info.length, 3, "three targets for a 4-player room");
        assert(info.every((x) => x.h >= 44 && x.x >= 0 && x.r <= w + 1), "targets >=44px and inside the width");
        if (h >= 600) assert(info.every((x) => x.y >= 0 && x.b <= h), "targets visible without scrolling");
        assert.equal(info.filter((x) => x.pressed === "true").length, 1, "exactly one target is selected");
        const sel = info.find((x) => x.pressed === "true"), other = info.find((x) => x.pressed === "false");
        assert.notEqual(sel.border, other.border, "selected target is visibly different (border)");
        await p.locator(".pf-target").nth(2).scrollIntoViewIfNeeded();
        await p.locator(".pf-target").nth(2).click();
        assert.equal(await p.locator('.pf-target[aria-pressed="true"]').count(), 1);
        assert.equal(await p.locator(".pf-target").nth(2).getAttribute("aria-pressed"), "true", "selection moves to the clicked target");
        assert.equal(await p.getByRole("group", { name: "攻撃の標的" }).count(), 1);
        if (SHOT) await p.screenshot({ path: `${SHOT}/targets-${w}x${h}.png` });
        assert.deepEqual(t.errors, []);
        await t.ctx.close();
      }
    }
    // drag survival, once per mode on the phone size (the board is the same node tree on every size)
    {
      const t = await startCpu(b, "B", 1, 390, 844), p = t.page;
      await dragSurvives(p, "cpu-B2", true);
      assert.deepEqual(t.errors, []);
      await t.ctx.close();
    }
    {
      const t = await startCpu(b, "A", 1, 390, 844), p = t.page;
      await dragSurvives(p, "cpu-A", false);
      assert.deepEqual(t.errors, []);
      await t.ctx.close();
    }
    {
      const t = await startRated(b, "B", 390, 844), p = t.page;
      await dragSurvives(p, "rated-B2", true);
      await t.ctx.close();
    }
    // きせかえ background: an equipped (non-default) background must reach the frame untouched
    {
      const t = await startCpu(b, "B", 1, 390, 844, { bg: "sunset" }), p = t.page;
      const bg = await p.evaluate(() => getComputedStyle(document.querySelector(".game-lock")).backgroundImage);
      assert(/255, 192, 154/.test(bg), "the equipped sunset background is shown on the framed surface: " + bg);
      await t.ctx.close();
    }
    console.log("PASS v6 play frame: rated A/B2, CPU A, CPU B2, 4-player targets at 4 viewports; drag/board survive re-renders; background, fonts, anchors kept");
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
