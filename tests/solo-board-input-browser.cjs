// Solo board input (FactorHunt's own board, [data-tile-id]). Game rules are not touched: these checks are about the drag only.
//  1. Ver.6.21: a drag the browser/OS interrupts (pointercancel / touchcancel) is dropped without judging, and the board
//     stays usable; the end of one drag is judged once even when both pointerup and touchend arrive.
const assert = require("node:assert/strict");
const { chromium, context, openSoloMode } = require("./browser-harness.cjs");
const { soloPair } = require("./solo-test-helper.cjs");
const exe = process.env.CHROMIUM_PATH || "/usr/bin/chromium";
const tree = () => ({ games: { factor: { accounts: { ateacher: { name: "Teacher", stats: { exp: 100, rating: 1600 } } } } } });
async function begin(b, label = "イージー") {
  const t = await context(b, { tree: tree() }), p = t.page;
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
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
