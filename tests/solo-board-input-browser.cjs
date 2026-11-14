// Solo board input (FactorHunt's own board, [data-tile-id]). Game rules are not touched: these checks are about the drag only.
//  1. Ver.6.21: a drag the browser/OS interrupts (pointercancel / touchcancel) is dropped without judging, and the board
//     stays usable; the end of one drag is judged once even when both pointerup and touchend arrive.
//  2. Ver.6.22: releasing in the gap next to a tile counts for the NEARER tile (never the neighbour), the tile that would be
//     taken is highlighted while dragging, and outside the board / next to the held tile nothing is taken.
const assert = require("node:assert/strict");
const { chromium, context, openSoloMode } = require("./browser-harness.cjs");
const { soloPair } = require("./solo-test-helper.cjs");
const exe = process.env.CHROMIUM_PATH || "/usr/bin/chromium";
const tree = () => ({ games: { factor: { accounts: { ateacher: { name: "Teacher", stats: { exp: 100, rating: 1600 } } } } } });
async function begin(b, label = "イージー", width = 390) {
  const t = await context(b, { tree: tree(), pc: width > 900 }), p = t.page;
  if (width < 900) await p.setViewportSize({ width, height: 844 });
  await openSoloMode(p, "play");
  await p.getByRole("button", { name: new RegExp("^" + label) }).first().click();
  await p.getByRole("button", { name: "スタート", exact: true }).click();
  await p.locator("[data-tile-id]").first().waitFor();
  return { t, p };
}
const centre = async (p, id) => { const r = await p.locator(`[data-tile-id="${id}"]`).boundingBox(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; };
const dragLine = (p) => p.locator("[data-tile-id]").first().evaluate((e) => !!e.parentElement.querySelector("svg line"));
const target = (p) => p.locator(".v7-target .v7-poly").innerText();
const ids = (p) => p.locator("[data-tile-id]").evaluateAll((es) => es.map((e) => e.dataset.tileId).join());
const misses = (p) => p.evaluate(() => Object.fromEntries([...document.querySelectorAll(".nbr-tile")].map((e) => [e.querySelector("small").textContent, e.querySelector("b").textContent]))["ミス"]);
module.exports = { begin, centre, dragLine, target, ids, misses, exe };
if (require.main === module) (async () => {
  const b = await chromium.launch({ executablePath: exe });
  try {
    // ---- interrupted drag: nothing is judged, the line and the selection go away, the next drag works ----
    for (const type of ["pointercancel", "touchcancel"]) {
      const { t, p } = await begin(b);
      const pair = await soloPair(p, true), a = await centre(p, pair[0]), c = await centre(p, pair[1]);
      const before = { q: await target(p), board: await ids(p) };
      await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.move((a.x + c.x) / 2, (a.y + c.y) / 2, { steps: 3 });
      await p.waitForTimeout(80);
      assert.equal(await dragLine(p), true, "drag line shown while dragging");
      await p.evaluate((ty) => window.dispatchEvent(new Event(ty)), type);
      await p.waitForTimeout(80);
      assert.equal(await dragLine(p), false, type + ": drag line removed");
      // the pointer is still down and released over the correct partner: an interrupted drag must not be judged late
      await p.mouse.move(c.x, c.y, { steps: 2 }); await p.mouse.up(); await p.waitForTimeout(600);
      assert.deepEqual({ q: await target(p), board: await ids(p) }, before, type + ": same question and tiles (nothing judged)");
      assert.equal(await p.locator(".combat-judge").count(), 0, type + ": no judgement shown");
      // a fresh drag answers normally
      await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.move(c.x, c.y, { steps: 4 }); await p.mouse.up();
      await p.waitForFunction((old) => [...document.querySelectorAll("[data-tile-id]")].map((e) => e.dataset.tileId).join() !== old, before.board, { timeout: 5000 });
      assert.deepEqual(t.errors, []); await t.ctx.close();
      console.log("PASS solo board: " + type + " drops the drag without judging; the next drag answers");
    }
    // ---- one drag end = one judgement, even when pointerup AND touchend both arrive (as on a touch screen) ----
    {
      const { t, p } = await begin(b);
      let wrong = 0;
      while (!await p.locator("[data-battle-summary]").count()) {
        const pair = await soloPair(p, false); if (pair.error) throw Error(JSON.stringify(pair));
        const a = await centre(p, pair[0]), c = await centre(p, pair[1]);
        await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.move(c.x, c.y, { steps: 3 });
        if (await p.locator("[data-battle-summary]").count()) break; // HP ran out while aiming
        await p.evaluate(({ x, y }) => {
          const touchEnd = new Event("touchend"); touchEnd.changedTouches = [{ clientX: x, clientY: y }];
          window.dispatchEvent(new PointerEvent("pointerup", { clientX: x, clientY: y }));
          window.dispatchEvent(touchEnd);
        }, c);
        wrong++;
        await p.mouse.up(); await p.waitForTimeout(650);
      }
      await p.locator("[data-battle-summary]").waitFor(); await p.waitForTimeout(300);
      assert(wrong >= 3, "several wrong drags were made: " + wrong);
      assert.equal(await misses(p), String(wrong), "each drag end is judged exactly once");
      assert.deepEqual(t.errors, []); await t.ctx.close();
      console.log("PASS solo board: pointerup + touchend for the same drag are judged once (" + wrong + " drags, " + wrong + " misses)");
    }
    // ---- Ver.6.22 nearest-tile snap: exhaustive geometry check of the decision function on the real board ----
    for (const [label, width] of [["イージー", 390], ["ノーマル", 390], ["ノーマル", 1440]]) {
      const { t, p } = await begin(b, label, width);
      const r = await p.evaluate(() => {
        const grid = document.querySelector("[data-tile-id]").parentElement, g = grid.getBoundingClientRect(), cs = getComputedStyle(grid);
        const gap = { x: parseFloat(cs.columnGap), y: parseFloat(cs.rowGap) };
        const tiles = [...grid.querySelectorAll("[data-tile-id]")].map((e) => { const q = e.getBoundingClientRect(); return { id: e.dataset.tileId, l: q.left, t: q.top, r: q.right, b: q.bottom }; });
        const edge = (q, x, y) => Math.hypot(Math.max(q.l - x, 0, x - q.r), Math.max(q.t - y, 0, y - q.b));
        const out = { gap, n: tiles.length, points: 0, onTile: 0, inGap: 0, snapped: 0, none: 0, bad: [] };
        const held = "__none__"; // no tile held: every tile may be a target
        for (let y = g.top - 6; y <= g.bottom + 6; y += 1) for (let x = g.left - 6; x <= g.right + 6; x += 1) {
          out.points++;
          const got = soloDropTarget(grid, x, y, held), d = tiles.map((q) => edge(q, x, y)), min = Math.min(...d), inside = x >= g.left && x <= g.right && y >= g.top && y <= g.bottom;
          const nearest = tiles.filter((q, i) => d[i] === min).map((q) => q.id);
          if (min === 0) out.onTile++; else if (inside) out.inGap++;
          if (got) { out.snapped += min > 0 ? 1 : 0;
            const i = tiles.findIndex((q) => q.id === got);
            // the tile taken is (one of) the nearest, and the point is within half a gap of it on each axis
            const q = tiles[i], within = x >= q.l - gap.x / 2 - 0.01 && x <= q.r + gap.x / 2 + 0.01 && y >= q.t - gap.y / 2 - 0.01 && y <= q.b + gap.y / 2 + 0.01;
            if (!inside || !nearest.includes(got) || !within) out.bad.push({ x, y, got, nearest, min, d: d[i], inside, within });
          } else { out.none++; if (min === 0 && inside) out.bad.push({ x, y, got, nearest, why: "on a tile but not taken" }); }
        }
        return out;
      });
      assert(r.n === (label === "イージー" ? 6 : 9), "tiles " + r.n);
      assert(r.gap.x >= 6 && r.gap.y >= 6, "real gaps measured " + JSON.stringify(r.gap));
      assert(r.inGap > 500 && r.snapped > 500, "gap points were exercised and snapped: " + JSON.stringify(r));
      assert.deepEqual(r.bad.slice(0, 5), [], label + " " + width + ": a point was given to a tile that is not the nearest / beyond half a gap / outside the board");
      assert.deepEqual(t.errors, []); await t.ctx.close();
      console.log(`PASS nearest-tile snap ${label} ${width}px: ${r.points} points (${r.inGap} in gaps, gap ${r.gap.x}x${r.gap.y}px) → always the nearest tile within half a gap, never a neighbour, nothing outside the board`);
    }
    // ---- the real drag uses it: highlight while dragging, gap release answers, held-tile side and outside do nothing ----
    {
      const { t, p } = await begin(b);
      const geo = (id) => p.locator(`[data-tile-id="${id}"]`).evaluate((e) => { const g = e.parentElement.getBoundingClientRect(), cs = getComputedStyle(e.parentElement); const q = e.getBoundingClientRect(); return { l: q.left, t: q.top, w: q.width, h: q.height, gx: parseFloat(cs.columnGap), gy: parseFloat(cs.rowGap), grid: { l: g.left, t: g.top, r: g.right, b: g.bottom } }; });
      const drop = () => p.evaluate(() => (document.querySelector("[data-drop-target]") || { dataset: {} }).dataset.tileId || null);
      const hold = async (id) => { const c = await centre(p, id); await p.mouse.move(c.x, c.y); await p.mouse.down(); };
      const to = async (x, y) => { await p.mouse.move(x, y, { steps: 3 }); await p.waitForTimeout(90); };
      const snapshot = async () => ({ q: await target(p), board: await ids(p) });
      // (a) outside the board: nothing highlighted, nothing judged
      let pair = await soloPair(p, true), A = await geo(pair[0]), B = await geo(pair[1]), before = await snapshot();
      await hold(pair[0]); await to(B.l + B.w / 2, B.grid.b + 30); assert.equal(await drop(), null, "outside the board: no target"); await p.mouse.up(); await p.waitForTimeout(550);
      assert.deepEqual(await snapshot(), before, "release outside the board: nothing judged");
      // (b) in the gap on the held tile's own side: no target, nothing judged
      await hold(pair[0]); await to(A.l + A.w / 2, A.t + A.h + A.gy / 2 - 1.5 > A.grid.b ? A.t - A.gy / 2 + 1.5 : A.t + A.h + A.gy / 2 - 1.5);
      assert.equal(await drop(), null, "gap beside the held tile: no target"); await p.mouse.up(); await p.waitForTimeout(550);
      assert.deepEqual(await snapshot(), before, "release beside the held tile: nothing judged");
      // (c) on the partner: highlighted; (d) in the gap just beside the partner (1.5px past its edge): still highlighted and answers correctly
      const side = B.l + B.w + B.gx / 2 < B.grid.r ? 1 : -1, gx = side > 0 ? B.l + B.w + 1.5 : B.l - 1.5, gy = B.t + B.h / 2;
      await hold(pair[0]); await to(B.l + B.w / 2, B.t + B.h / 2); assert.equal(await drop(), pair[1], "over the partner: highlighted");
      await to(gx, gy);
      assert.equal(await p.evaluate(([x, y]) => !!(document.elementFromPoint(x, y).closest("[data-tile-id]")), [gx, gy]), false, "the release point is really in the gap, not on a tile");
      assert.equal(await drop(), pair[1], "gap beside the partner: partner highlighted");
      assert.equal(await p.locator("[data-drop-target]").count(), 1, "exactly one tile highlighted");
      await p.mouse.up();
      await p.waitForFunction((old) => [...document.querySelectorAll("[data-tile-id]")].map((e) => e.dataset.tileId).join() !== old, before.board, { timeout: 5000 });
      // (the correct-answer effect flies copies of the two tiles to the target outside the board; only the board itself is checked)
      assert.equal(await p.locator("[data-tile-id]").first().evaluate((e) => e.parentElement.querySelectorAll(":scope > [data-drop-target]").length), 0, "no board tile stays highlighted after the answer");
      // (e) past the middle of the gap the neighbour is the target, not the partner (so a wrong neighbour is never taken for the partner)
      await p.waitForTimeout(1000); // let the correct-answer effect (flying copies of the tiles) finish
      pair = await soloPair(p, true); B = await geo(pair[1]);
      const s2 = B.l + B.w + B.gx / 2 < B.grid.r ? 1 : -1, far = s2 > 0 ? B.l + B.w + B.gx / 2 + 1.5 : B.l - B.gx / 2 - 1.5;
      await hold(pair[0]); await to(far, B.t + B.h / 2);
      const neighbour = await drop(); assert(neighbour !== pair[1], "past the middle of the gap the partner is no longer the target (got " + neighbour + ")");
      await p.evaluate(() => window.dispatchEvent(new Event("pointercancel"))); await p.mouse.up();
      assert.deepEqual(t.errors, []); await t.ctx.close();
      console.log("PASS solo drag: target highlighted while dragging; gap release answers for the nearer tile; held-tile side / outside the board do nothing");
    }
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
