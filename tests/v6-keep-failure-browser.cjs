// Ver.6.0 A1b: the login freeze must never cost a player a title, the equipped title or a record, whether it works,
// fails, or the keep module is missing. Real page, mock Firebase.
const assert = require("node:assert/strict");
const { chromium, context, sleep } = require("./browser-harness.cjs");
const holderStats = () => ({ rating: 1700, exp: 900, games: 40, w: 25, l: 12, d: 3, A: { w: 12, l: 4, d: 1 }, B: { w: 13, l: 8, d: 2 }, maxStreak: 31, handiWins: 1, nick: "streak10", vs: { ax: { w: 3, l: 1 } } });
const treeOf = (stats) => ({ games: { factor: { accounts: { ateacher: { name: "Teacher", stats } } } } });
const diag = (p) => p.evaluate(() => JSON.parse(JSON.stringify(window.FXF_KEEP_DIAG ? window.FXF_KEEP_DIAG.counts : null)));
async function profileShowsHeldTitle(p) {
  await p.evaluate(() => localStorage.setItem("fxf_title_presentation_v1:ateacher", "seen")).catch(() => {});
  await p.locator(".account-main").click();
  await p.locator("[data-next-profile]").waitFor();
  await p.getByRole("tab", { name: "称号・装備" }).click();
  await p.locator("[data-title-inventory]").waitFor();
  await p.waitForFunction(() => /取得済み/.test(document.querySelector('[data-title-id="streak10"] small')?.textContent || ""), null, { timeout: 15000 });
}
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium" });
  try {
    // 1. the freeze works (older tests see it only as keepRecords): the page and the held titles are unchanged
    {
      const initial = holderStats(), tree = treeOf(JSON.parse(JSON.stringify(initial)));
      const t = await context(b, { tree });
      await sleep(2500);
      assert.equal(t.keepRecords.length >= 1, true, "the login freeze really ran in the default test mode");
      assert.deepEqual(tree.games.factor.accounts.ateacher.stats, initial, "every legacy field, incl. the equipped title, unchanged");
      await profileShowsHeldTitle(t.page);
      assert.equal(await t.page.locator('[data-title-id="streak10"]').count(), 1);
      assert.deepEqual(t.errors, []);
      assert.deepEqual(await diag(t.page), {});
      await t.ctx.close();
      console.log("PASS freeze active: legacy stats and equipment unchanged, held title still shown, no diagnostics");
    }
    // 2. the freeze write fails: nothing changes, the held title is still shown, the failure is recorded
    {
      const initial = holderStats(), tree = treeOf(JSON.parse(JSON.stringify(initial)));
      const t = await context(b, { tree, keepLogin: "real", onOperation: async (op) => { if (/\/stats(\/|$)/.test(op.path)) throw new Error("simulated write failure"); } });
      await sleep(3000);
      assert.deepEqual(tree.games.factor.accounts.ateacher.stats, initial, "nothing was written");
      const d = await diag(t.page);
      assert.equal(d["freeze-failed"] >= 1, true, JSON.stringify(d));
      await profileShowsHeldTitle(t.page);
      assert.equal(await t.page.evaluate(() => window.FXF_KEEP_DIAG.last.code), "Error", "only a safe code is kept, never the message");
      await t.ctx.close();
      console.log("PASS freeze write refused: stats untouched, held title and equipment still shown, failure recorded");
    }
    // 3. the keep module is missing (stale or blocked bundle): the old screens keep working, nothing is written
    {
      const initial = holderStats(), tree = treeOf(JSON.parse(JSON.stringify(initial)));
      const t = await context(b, { tree, keepLogin: "real", blockedAssets: ["/next-home-ui.js"] });
      await t.page.getByText("Teacher").first().waitFor({ timeout: 15000 });
      await sleep(2000);
      assert.deepEqual(tree.games.factor.accounts.ateacher.stats, initial, "no protection record, no change");
      const d = await diag(t.page);
      assert.equal(d["missing-module"] >= 1, true, JSON.stringify(d));
      assert.deepEqual(t.errors.filter((e) => !/next-home-ui|NextHome|ERR_FAILED/i.test(String(e))), [], "no unexpected page errors");
      await t.ctx.close();
      console.log("PASS keep module missing: old screens work, stats untouched, missing-module recorded");
    }
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
