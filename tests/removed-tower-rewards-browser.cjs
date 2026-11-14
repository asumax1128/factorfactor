// Ver.6.26: the old-tower titles (tw10..tw100) and skins (塔の頂 / 天空の塔) were removed from the game.
// An account that still has them equipped and still carries old tower progress must keep working everywhere:
// home, profile (overview / titles), wardrobe, the solo board, another player's view of this account.
// Nothing saved is rewritten or deleted by opening those screens (stats.tower, stats.nick, stats.skin stay as they are).
const assert = require("node:assert/strict"), fs = require("node:fs");
const { chromium, context, openSoloMode, openProfile, goHome } = require("./browser-harness.cjs");
const exe = process.env.CHROMIUM_PATH || "/usr/bin/chromium";
const src = fs.readFileSync("index.html", "utf8");
const stats = () => ({ exp: 900, games: 4, w: 2, l: 2, rating: 1550, tower: { best: 100, endN: 3 }, nick: "tw50", skin: { tile: "towert", bg: "summit", fx: "std" } });
(async () => {
  for (const gone of ["id: 'tw10'", "id: 'tw30'", "id: 'tw50'", "id: 'tw70'", "id: 'tw100'", "id: 'towert'", "id: 'summit'", "need.tower", "label: '数理の塔'", "塔の頂", "天空の塔"])
    assert(!src.includes(gone), "definition removed: " + gone);
  console.log("PASS old-tower title, skin and label definitions are absent from index.html");
  const b = await chromium.launch({ executablePath: exe });
  try {
    for (const width of [390, 1440]) {
      const st = stats(), saved = JSON.stringify(st);
      const tree = { games: { factor: { accounts: { ateacher: { name: "Teacher", stats: st }, aother: { name: "Other", stats: { exp: 50, games: 1, w: 1, nick: "tw100", skin: { tile: "towert" } } } } } } };
      const t = await context(b, { tree, pc: width > 900 }), p = t.page; if (width < 900) await p.setViewportSize({ width, height: 844 });
      await p.evaluate(() => localStorage.setItem("fxf_skin_v1", JSON.stringify({ tile: "towert", bg: "summit", fx: "std" })));
      await p.reload();
      // home: opens, shows no title name for the removed id
      await p.locator("[data-next-home] .home-content").waitFor();
      assert.match(await p.locator(".account-main").innerText(), /装備中の称号なし/, "home shows no equipped title name");
      // profile: overview and the title list open
      await openProfile(p);
      const prof = p.locator("[data-next-profile]");
      assert(!/塔の|数理の書の継承者|終わりなき探究者/.test(await prof.innerText()), "no old-tower title name in the profile");
      await prof.getByRole("tab", { name: /称号/ }).click();
      await p.locator("[data-title-id]").first().waitFor();
      assert(await p.locator("[data-title-id]").count() >= 100, "title list shown");
      assert.match(await p.locator("[data-equip-current]").innerText(), /現在の装備：〈表示できない称号〉/);
      // wardrobe: opens, the removed skins are not offered, a remaining one can be picked
      await goHome(p);
      await p.locator('button[aria-label="設定"]:visible').first().click();
      await p.locator("dialog.home-menu").getByRole("button", { name: "きせかえ", exact: true }).click();
      await p.locator("[data-skin-item]").first().waitFor();
      const tiles = await p.locator("[data-skin-item]").evaluateAll((es) => es.map((e) => e.dataset.skinItem));
      assert(tiles.length >= 10 && !tiles.includes("towert") && !tiles.includes("summit"), "removed skins not offered: " + tiles.join());
      assert.equal(await p.locator('[data-skin-item][aria-pressed="true"]').count(), 0, "nothing shown as selected for the removed tile");
      await p.getByRole("button", { name: "背景", exact: true }).click();
      const bgs = await p.locator("[data-skin-item]").evaluateAll((es) => es.map((e) => e.dataset.skinItem));
      assert(bgs.length >= 5 && !bgs.includes("summit"), "removed background not offered");
      await p.getByRole("button", { name: "とじる", exact: true }).click();
      assert.equal(JSON.stringify(tree.games.factor.accounts.ateacher.stats), saved, "opening home / profile / titles / wardrobe rewrote nothing");
      // solo board: the removed tile skin falls back to the standard tile and the game is playable
      await openSoloMode(p, "play");
      await p.getByRole("button", { name: "スタート", exact: true }).click();
      await p.locator("[data-tile-id]").first().waitFor();
      const look = await p.locator("[data-tile-id]").first().evaluate((e) => ({ bg: getComputedStyle(e).backgroundColor, w: e.getBoundingClientRect().width }));
      assert.equal(look.bg, "rgb(244, 247, 255)", "standard tile colour used for the removed skin");
      assert(look.w > 40);
      assert.deepEqual(tree.games.factor.accounts.ateacher.stats.tower, { best: 100, endN: 3 }, "old tower progress data kept");
      assert.equal(tree.games.factor.accounts.ateacher.stats.nick, "tw50", "equipped id not rewritten");
      assert.deepEqual(tree.games.factor.accounts.ateacher.stats.skin, { tile: "towert", bg: "summit", fx: "std" }, "saved skin not rewritten");
      assert.deepEqual(t.errors, []); await t.ctx.close();
      console.log(`PASS ${width}px: account with removed tower title + skins + old progress: home, profile, title list, wardrobe and solo board work; saved data untouched`);
    }
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
