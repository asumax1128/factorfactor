// Ver.6.26: the old-tower titles (tw10..tw100) and skins (塔の頂 / 天空の塔) were removed from the game.
// An account that still has them equipped and still carries old tower progress must keep working everywhere:
// home, profile (overview / titles), wardrobe, the solo board, another player's view of this account.
// Nothing saved is rewritten or deleted by opening those screens (stats.tower, stats.nick, stats.skin stay as they are).
// Ver.6.29: the removed equipped title is treated as "not equipped" on every screen (own and other players').
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
      assert.equal(await p.locator("[data-equip-current]").count(), 0, "a removed title is treated as not equipped (Ver.6.29)");
      assert.equal(await p.getByText("表示できない称号").count(), 0);
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
    // Ver.6.29: another player's view of an account that has a removed title equipped (the same components the rankings and the
    // player profile use): no title is shown, exactly like an account with nothing equipped; a normal title still shows.
    {
      const exposed = src.replace("const root = ReactDOM.createRoot(rootEl);", "window.__titleView={PlayerView,Nick};\nconst root = ReactDOM.createRoot(rootEl);");
      assert(exposed.includes("window.__titleView"), "test hook inserted");
      const tree = { games: { factor: { accounts: { ateacher: { name: "Teacher", stats: { exp: 10 } }, aother: { name: "Other", stats: { exp: 50, games: 1, w: 1, nick: "tw100" } } } } } };
      const saved = JSON.stringify(tree.games.factor.accounts.aother);
      const t = await context(b, { tree, assetOverrides: { "/": exposed } }), p = t.page;
      await p.waitForFunction(() => !!window.__titleView);
      const out = await p.evaluate(async () => {
        const { PlayerView, Nick } = window.__titleView, h = React.createElement;
        const el = document.createElement("div"); document.body.appendChild(el);
        const view = (k, nick) => h("div", { key: k, "data-view": k }, h(PlayerView, { name: "Other", st: { exp: 50, games: 1, w: 1, nick }, nameOf: (x) => x, me: false, acctKey: "aother", onClose() {} }));
        const row = (k, nick) => h("div", { key: k, "data-row": k }, nick ? h(Nick, { id: nick, size: 9, block: true }) : null);
        ReactDOM.createRoot(el).render(h("div", null, [view("removed", "tw100"), view("unknown", "some_title_removed_later"), view("none", undefined), view("normal", "tour1"), row("removed", "tw100"), row("unknown", "some_title_removed_later"), row("normal", "tour1")]));
        await new Promise((r) => setTimeout(r, 400));
        const titles = (sel) => [...el.querySelectorAll(sel)].map((e) => [e.dataset.view || e.dataset.row, (e.innerText.match(/〈[^〉]*〉/g) || []).join("")]);
        return { views: titles("[data-view]"), rows: titles("[data-row]"), text: el.innerText };
      });
      assert.deepEqual(out.views.slice(0, 3), [["removed", ""], ["unknown", ""], ["none", ""]], "player view: a removed title shows like no title");
      assert(out.views[3][1].length > 2, "player view: an existing title is still shown");
      assert.deepEqual(out.rows.slice(0, 2), [["removed", ""], ["unknown", ""]], "ranking row title: nothing for a removed title");
      assert(out.rows[2][1].length > 2, "ranking row title: an existing title is still shown");
      assert(!/表示できない称号|塔の|数理の書の継承者|終わりなき探究者/.test(out.text));
      assert.equal(JSON.stringify(tree.games.factor.accounts.aother), saved, "the other account is not rewritten");
      assert.deepEqual(t.errors, []); await t.ctx.close();
      console.log("PASS another player's view / ranking row: a removed equipped title is shown as no title; existing titles unchanged");
    }
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
