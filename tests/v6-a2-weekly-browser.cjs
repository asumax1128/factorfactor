// Ver.6.0 A2 on the real weekly-boss screen (legacy production path, mock Firebase):
// a run that is played to the time limit counts as a sortie even with 0 damage / 0 support points;
// a run abandoned with the quit button does not; one week is counted once; existing records are kept.
const assert = require("node:assert/strict");
const { chromium, context, sleep } = require("./browser-harness.cjs");
const STATS = (tree) => tree.games.factor.accounts.ateacher.stats;
const base = () => ({ rating: 1500, exp: 100, games: 3, w: 1, nick: "tour1", skin: { tile: "wood" } });
async function run(b, tree, { role = "atk", quit = false } = {}) {
  const e0 = STATS(tree).exp;
  const t = await context(b, { tree });
  const p = t.page;
  p.on("dialog", (d) => d.accept());
  await p.setViewportSize({ width: 390, height: 844 });
  await p.getByRole("button", { name: /今週のボス/ }).first().click();
  if (role === "sup") await p.getByText("📣 サポーター").first().click();
  await p.getByRole("button", { name: /出撃する/ }).click();
  await p.locator("[data-btile]").first().waitFor();
  if (quit) {
    await p.getByRole("button", { name: /ぬける/ }).first().click();
  } else {
    await p.clock.install();
    await p.clock.fastForward(100000);
  }
  for (let i = 0; i < 80 && !(STATS(tree).exp > e0); i++) await sleep(100);
  await sleep(300);
  const errors = t.errors.slice();
  await t.ctx.close();
  return errors;
}
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium" });
  try {
    const mk = (stats) => ({ games: { factor: { accounts: { ateacher: { name: "Teacher", stats } } } } });
    // 1. attacker, 0 damage, played to the time limit: the week counts
    {
      const tree = mk(base());
      assert.deepEqual(await run(b, tree), []);
      const wk = STATS(tree).wk;
      assert.equal(wk.weeks, 1); assert.equal(wk.streak, 1); assert.equal(wk.maxStreak, 1); assert.equal(typeof wk.last, "string");
      assert.equal(wk.best, undefined, "no damage: no best");
      assert.equal(wk.supRuns, undefined);
      assert.equal(STATS(tree).nick, "tour1"); assert.deepEqual(STATS(tree).skin, { tile: "wood" });
      console.log("PASS 0-damage run played to the time limit counts as the week's participation");
    }
    // 2. supporter, 0 support points, played to the time limit: the sortie counts, the support total is unchanged
    {
      const tree = mk(base());
      await run(b, tree, { role: "sup" });
      const wk = STATS(tree).wk;
      assert.equal(wk.supRuns, 1); assert.equal(wk.sup, undefined, "support points total unchanged"); assert.equal(wk.weeks, 1);
      console.log("PASS supporter with 0 points counts as a sortie; the support total is untouched");
    }
    // 3. quit with the quit button at 0 damage: nothing counts
    {
      const tree = mk(base());
      await run(b, tree, { role: "sup", quit: true });
      const wk = STATS(tree).wk || {};
      assert.equal(wk.weeks, undefined); assert.equal(wk.supRuns, undefined); assert.equal(wk.maxStreak, undefined);
      console.log("PASS abandoning with the quit button counts neither the week nor the supporter sortie");
    }
    // 4. a second run in the same week: the week and the streak are not counted twice, the sortie count is
    {
      const tree = mk(base());
      await run(b, tree, { role: "sup" });
      const once = JSON.parse(JSON.stringify(STATS(tree).wk));
      await run(b, tree, { role: "sup" });
      const wk = STATS(tree).wk;
      assert.equal(wk.weeks, once.weeks); assert.equal(wk.streak, once.streak); assert.equal(wk.maxStreak, once.maxStreak); assert.equal(wk.last, once.last);
      assert.equal(wk.supRuns, 2);
      console.log("PASS two runs in one week: the week/streak are counted once, each completed sortie once");
    }
    // 5. existing records are kept (a longer streak from before is never lowered)
    {
      const s = base(); s.wk = { weeks: 7, streak: 4, maxStreak: 9, last: "2000-01-03", best: 700, kills: 2, sup: 120, supRuns: 3, boss: { dragon: 1 }, done: {} };
      const tree = mk(s);
      await run(b, tree, { role: "sup" });
      const wk = STATS(tree).wk;
      assert.equal(wk.weeks, 8); assert.equal(wk.streak, 1, "the old week is not last week: a new streak starts"); assert.equal(wk.maxStreak, 9, "the best streak is kept");
      assert.equal(wk.best, 700); assert.equal(wk.kills, 2); assert.equal(wk.sup, 120); assert.equal(wk.supRuns, 4); assert.deepEqual(wk.boss, { dragon: 1 });
      console.log("PASS existing weekly records are kept and only extended");
    }
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
