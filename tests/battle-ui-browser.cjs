// Ver.6.41 battle screen UI. Presentation and input handling only: nothing here changes judging or scoring, and the
// checks below use the real game code (solo board, shared BattleBoard through the CPU practice).
//  1. Every formula on a battle screen is MathML (<math>): question panel and tiles, solo and versus. Powers are <msup>,
//     n/n is <mfrac>, a leading minus is not spaced like a binary operator. Screens outside the battle keep the old markup.
//  2. Connect-drag: the held tile follows the pointer in the same task as the move (no frame of delay), the origin shows a
//     placeholder, the tile that would be taken glows, an interrupted drag (pointercancel) puts everything back.
//  3. Shared board: releasing in the gap next to a tile counts for the nearer tile (same rule as the solo board).
//  4. One whole solo game is played by dragging only, to the result screen, with no page error.
//  5. 360px phone and PC: no horizontal scroll, tiles keep a large touch area.
const assert = require("node:assert/strict");
const { chromium, context, openSoloMode, pair, sleep } = require("./browser-harness.cjs");
const { soloPair, soloDrag, reverseState, reverseClick } = require("./solo-test-helper.cjs");
const exe = process.env.CHROMIUM_PATH || "/usr/bin/chromium";
const tree = () => ({ games: { factor: { accounts: { ateacher: { name: "Teacher", stats: { exp: 100, rating: 1600 } } } } } });
async function solo(b, label, w, h) {
  const t = await context(b, { tree: tree(), pc: w > 900 }), p = t.page;
  await p.setViewportSize({ width: w, height: h });
  await openSoloMode(p, "play");
  await p.getByRole("button", { name: new RegExp("^" + label) }).first().click();
  await p.getByRole("button", { name: "スタート", exact: true }).click();
  await p.locator("[data-tile-id]").first().waitFor();
  return { t, p };
}
async function cpu(b, mode, w, h) {
  const t = await context(b, { tree: tree(), pc: w > 900 }), p = t.page;
  await p.setViewportSize({ width: w, height: h });
  await p.locator(".action-card.solo").click(); await p.locator("[data-solo-mode=cpu]").click();
  await p.getByRole("group", { name: "方式", exact: true }).getByRole("button", { name: mode === "A" ? /^A/ : "新B方式" }).click();
  await p.getByRole("group", { name: "CPUの強さ", exact: true }).getByRole("button", { name: "よわい", exact: true }).click();
  await p.getByRole("button", { name: "CPUと練習スタート", exact: true }).click();
  await p.locator("[data-btile]").first().waitFor({ timeout: 30000 });
  await sleep(3800);
  if (mode !== "A") await p.waitForFunction(() => document.querySelector("[data-online-ready]")?.dataset.onlineReady === "true", null, { timeout: 20000 });
  return { t, p };
}
// what the battle surface renders its formulas with
const mathAudit = (p) => p.evaluate(() => {
  const s = document.querySelector(".game-lock.v7-battle");
  const tiles = [...s.querySelectorAll("[data-btile],[data-tile-id]")];
  return {
    tiles: tiles.length, tilesMath: tiles.filter((t) => t.querySelector("math")).length,
    target: !!s.querySelector(".v7-target math"),
    legacy: s.querySelectorAll(".fxm:not(.fxm-ml)").length,
    sw: document.documentElement.scrollWidth, iw: innerWidth,
    minTile: Math.min(...tiles.map((t) => Math.min(t.getBoundingClientRect().width, t.getBoundingClientRect().height))),
    overflow: tiles.filter((t) => { const f = t.querySelector(".fxm"); return f && f.getBoundingClientRect().width > t.clientWidth; }).length,
  };
});
const centre = async (p, sel) => { const r = await p.locator(sel).boundingBox(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height, l: r.x, t: r.y }; };
(async () => {
  const b = await chromium.launch({ executablePath: exe });
  try {
    // ---- 1. MathML markup (unit): powers, fractions, signs, parentheses ----
    {
      const t = await context(b, { tree: tree() }), p = t.page;
      const out = await p.evaluate(async () => {
        const host = document.createElement("div"); document.body.appendChild(host);
        const cases = ["x² + 4x - 32", "(2x² - 3x + 1)", "-8", "(x - 8)", "1/2", "(x + 3)²", "27x³ - 8"];
        const root = ReactDOM.createRoot(host);
        root.render(React.createElement("div", null, cases.map((c, i) => React.createElement("p", { key: i }, React.createElement(MathText, { text: c })))));
        await new Promise((r) => setTimeout(r, 100));
        const res = [...host.querySelectorAll("p")].map((e) => ({
          math: e.querySelectorAll("math").length, msup: e.querySelectorAll("msup").length, mfrac: e.querySelectorAll("mfrac").length,
          mi: [...e.querySelectorAll("mi")].map((x) => x.textContent).join(""), text: e.textContent,
          ops: [...e.querySelectorAll("mo")].map((x) => x.textContent + ":" + x.getAttribute("lspace")).join(" "),
          supBase: e.querySelector("msup") ? e.querySelector("msup").firstElementChild.tagName.toLowerCase() : "",
          ns: e.querySelector("math").namespaceURI,
        }));
        root.unmount(); host.remove(); return res;
      });
      assert(out.every((x) => x.math === 1 && x.ns === "http://www.w3.org/1998/Math/MathML"), "each formula is one <math> in the MathML namespace");
      assert.equal(out[0].msup, 1); assert.equal(out[0].mi, "xx"); assert.equal(out[0].ops, "+:0.2222em −:0.2222em", "binary operators are spaced");
      assert.equal(out[1].msup, 1, "quadratic factor has a power"); assert.equal(out[1].ops, "(:0em −:0.2222em +:0.2222em ):0em");
      assert.equal(out[2].ops, "−:0em", "a leading minus is a sign, not a binary operator"); assert.equal(out[2].text, "−8");
      assert.equal(out[3].ops, "(:0em −:0.2222em ):0em");
      assert.equal(out[4].mfrac, 1, "n/n is a fraction"); assert.equal(out[4].text, "12");
      assert.equal(out[5].msup, 1); assert.equal(out[5].supBase, "mrow", "a power after ) applies to the whole bracket");
      assert.equal(out[6].msup, 1); assert.equal(out[6].text, "27x3−8");
      assert.deepEqual(t.errors, []); await t.ctx.close();
      console.log("PASS MathML markup: msup / mfrac / mi / mo with explicit spacing, signs vs binary operators, bracket powers");
    }
    // ---- 1b + 5. every battle surface uses MathML only; 360px and PC keep the layout ----
    for (const [w, h] of [[360, 780], [1280, 800]]) {
      {
        const { t, p } = await solo(b, "ノーマル", w, h), a = await mathAudit(p);
        assert.equal(a.tilesMath, a.tiles, `solo ${w}: every tile formula is MathML`); assert(a.tiles >= 6);
        assert(a.target, `solo ${w}: the question is MathML`); assert.equal(a.legacy, 0, `solo ${w}: no old span formula on the battle screen`);
        assert(a.sw <= a.iw + 1, `solo ${w}: no horizontal scroll`); assert(a.minTile >= 72, `solo ${w}: tiles keep a large touch area (${a.minTile})`);
        assert.equal(a.overflow, 0, `solo ${w}: no formula is wider than its tile`);
        assert.deepEqual(t.errors, []); await t.ctx.close();
      }
      for (const mode of ["A", "B"]) {
        const { t, p } = await cpu(b, mode, w, h), a = await mathAudit(p);
        assert.equal(a.tilesMath, a.tiles, `cpu ${mode} ${w}: every tile formula is MathML`); assert(a.tiles >= 6);
        assert(a.target, `cpu ${mode} ${w}: the question is MathML`); assert.equal(a.legacy, 0, `cpu ${mode} ${w}: no old span formula`);
        assert(a.sw <= a.iw + 1, `cpu ${mode} ${w}: no horizontal scroll`); assert(a.minTile >= 72, `cpu ${mode} ${w}: tiles keep a large touch area (${a.minTile})`);
        assert.equal(a.overflow, 0, `cpu ${mode} ${w}: no formula is wider than its tile`);
        assert.deepEqual(t.errors, []); await t.ctx.close();
      }
    }
    console.log("PASS battle formulas are MathML only (solo, CPU A, CPU B) at 360px and 1280px; no horizontal scroll; large tiles; nothing overflows");
    // ---- screens outside the battle are untouched: the tutorial still uses the old markup ----
    {
      const t = await context(b, { tree: tree() }), p = t.page;
      const n = await p.evaluate(() => typeof MathTextLegacy === "function" && /fxm-sup/.test(String(MathTextLegacy)) && !/<math|"math"/.test(String(MathTextLegacy)));
      assert(n, "the old renderer is kept for the non-battle screens");
      await t.ctx.close();
    }
    // ---- 2. connect-drag on the solo board ----
    {
      const { t, p } = await solo(b, "イージー", 390, 844);
      const ids = await soloPair(p, true), a = await centre(p, `[data-tile-id="${ids[0]}"]`), c = await centre(p, `[data-tile-id="${ids[1]}"]`);
      await p.mouse.move(a.x, a.y); await p.mouse.down();
      // the tile follows in the same task as the pointer event: dispatch one move and read the position before any frame
      const follow = await p.evaluate(({ id, x, y }) => {
        const el = document.querySelector(`[data-tile-id="${id}"]`), r0 = el.getBoundingClientRect();
        window.dispatchEvent(new PointerEvent("pointermove", { clientX: x, clientY: y, bubbles: true, pointerId: 1 }));
        const r1 = el.getBoundingClientRect();
        return { dx: (r1.left + r1.width / 2) - (r0.left + r0.width / 2), dy: (r1.top + r1.height / 2) - (r0.top + r0.height / 2), held: el.hasAttribute("data-bb-held") };
      }, { id: ids[0], x: a.x + 40, y: a.y + 30 });
      assert(follow.held, "the grabbed tile is marked as held");
      assert(Math.abs(follow.dx - 40) < 6 && Math.abs(follow.dy - 30) < 6, `the held tile moved with the pointer without waiting for a frame (${follow.dx}, ${follow.dy})`);
      await p.mouse.move(c.x - c.w * 0.2, c.y - c.h * 0.2, { steps: 5 }); await sleep(120);
      const mid = await p.evaluate(({ from, to }) => {
        const el = document.querySelector(`[data-tile-id="${from}"]`), tg = document.querySelector(`[data-tile-id="${to}"]`), ph = document.querySelector(".bb-ph"), g = el.parentElement.getBoundingClientRect();
        const pr = ph && ph.getBoundingClientRect();
        return { ph: !!ph, phAtOrigin: pr ? Math.abs(pr.left - g.left - el.offsetLeft) < 2 && Math.abs(pr.top - g.top - el.offsetTop) < 2 && Math.abs(pr.width - el.offsetWidth) < 2 : false,
          glow: tg.hasAttribute("data-bb-target") && tg.hasAttribute("data-drop-target"), others: document.querySelectorAll("[data-bb-target]").length,
          z: getComputedStyle(el).zIndex, shadow: getComputedStyle(tg).boxShadow, cls: document.documentElement.classList.contains("bb-dragging") };
      }, { from: ids[0], to: ids[1] });
      assert(mid.ph && mid.phAtOrigin, "a placeholder marks the origin of the held tile");
      assert(mid.glow && mid.others === 1, "exactly the tile that would be taken glows");
      assert(/62, 224, 168/.test(mid.shadow), "the glow is drawn on the target tile");
      assert.equal(mid.z, "30", "the held tile is lifted above the board"); assert(mid.cls);
      // interrupted drag: nothing is judged, the tile goes back, no marker is left
      const q = await p.locator(".v7-target .v7-poly").innerText();
      await p.evaluate(() => window.dispatchEvent(new Event("pointercancel"))); await sleep(350);
      const after = await p.evaluate((id) => { const el = document.querySelector(`[data-tile-id="${id}"]`); return { held: document.querySelectorAll("[data-bb-held],[data-bb-target],[data-bb-back],.bb-fx").length, tr: el.style.translate, cls: document.documentElement.classList.contains("bb-dragging") }; }, ids[0]);
      assert.equal(after.held, 0, "pointercancel removes every drag marker"); assert.equal(after.tr, ""); assert(!after.cls);
      await p.mouse.up(); await sleep(150);
      assert.equal(await p.locator(".v7-target .v7-poly").innerText(), q, "the interrupted drag was not judged");
      const back = await centre(p, `[data-tile-id="${ids[0]}"]`);
      assert(Math.abs(back.x - a.x) < 2 && Math.abs(back.y - a.y) < 2, "the tile is back in its place");
      // a normal drag still answers
      await soloDrag(p, true); await sleep(700);
      assert.notEqual(await p.locator(".v7-target .v7-poly").innerText(), q, "a completed drag is judged as before");
      assert.equal(await p.evaluate(() => document.querySelectorAll("[data-bb-held],[data-bb-target],.bb-fx").length), 0, "nothing is left after a completed drag");
      assert.deepEqual(t.errors, []); await t.ctx.close();
      console.log("PASS solo connect-drag: follows the pointer at once, origin placeholder, target glow, pointercancel restores, a completed drag is judged");
    }
    // ---- 3. shared board (CPU B): held tile, glow, and a release in the gap counts for the nearer tile ----
    {
      const { t, p } = await cpu(b, "B", 390, 844);
      const ids = await pair(p, true), a = await centre(p, `[data-btile="${ids[0]}"]`), c = await centre(p, `[data-btile="${ids[1]}"]`);
      // a point in the gap just outside the partner tile, on the side away from the held tile when possible
      const gx = a.x < c.x - 1 ? c.l - 3 : a.x > c.x + 1 ? c.l + c.w + 3 : c.x, gy = Math.abs(a.x - c.x) <= 1 ? (a.y < c.y ? c.t - 3 : c.t + c.h + 3) : c.y;
      await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.move(gx, gy, { steps: 6 }); await sleep(120);
      const mid = await p.evaluate(({ from, to, gx, gy }) => {
        const el = document.querySelector(`[data-btile="${from}"]`), tg = document.querySelector(`[data-btile="${to}"]`);
        const r = tg.getBoundingClientRect(), inside = gx >= r.left && gx <= r.right && gy >= r.top && gy <= r.bottom;
        return { held: el.hasAttribute("data-bb-held"), glow: tg.hasAttribute("data-bb-target"), ph: !!document.querySelector(".bb-ph"), inside, line: getComputedStyle(el.parentElement.querySelector(":scope > svg")).visibility };
      }, { from: ids[0], to: ids[1], gx, gy });
      assert(mid.held && mid.ph, "shared board: held tile and origin placeholder"); assert(!mid.inside, "the release point is in the gap, not on the tile");
      assert(mid.glow, "shared board: the nearer tile glows while the pointer is in the gap"); assert.equal(mid.line, "hidden", "the old dashed line is replaced by the held tile");
      await p.mouse.up();
      await p.waitForFunction(() => /1問/.test(document.querySelector(".or-stat-grid")?.textContent || ""), null, { timeout: 8000 });
      assert.equal(await p.evaluate(() => document.querySelectorAll("[data-bb-held],[data-bb-target],.bb-fx").length), 0, "nothing is left after the drag");
      assert.equal(await p.locator(".or-b2-status .bu-gauge").count(), 1, "the special gauge has a bar");
      assert.match(await p.locator(".or-b2-status").innerText(), /必殺ゲージ \d+% ・ お邪魔 \d+枚 ・ カウンター/, "the status row keeps its wording");
      assert.deepEqual(t.errors, []); await t.ctx.close();
      console.log("PASS shared board: held tile / placeholder / glow, a release in the gap is taken by the nearer tile and judged correct");
    }
    // ---- 4. one whole solo game by dragging only ----
    {
      const { t, p } = await solo(b, "イージー", 360, 780);
      let n = 0, bonus = 0;
      for (let i = 0; i < 150 && !(await p.locator("[data-battle-summary]").count()); i++) {
        if (await reverseState(p)) { await reverseClick(p, true); bonus++; } else { await soloDrag(p, true); n++; }
        await sleep(620);
      }
      await p.locator("[data-battle-summary]").waitFor({ timeout: 20000 });
      assert(n >= 10, "the game was played by dragging (" + n + " drags)");
      const word = await p.evaluate(() => document.body.innerText);
      assert(!/GAME OVER/.test(word), "all questions were answered correctly to the end");
      assert.deepEqual(t.errors, []); await t.ctx.close();
      console.log(`PASS a whole solo game (EASY) played by dragging only: ${n} drags${bonus ? " + " + bonus + " bonus taps" : ""}, result screen reached, no page error`);
    }
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
