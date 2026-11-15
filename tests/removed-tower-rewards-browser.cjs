// Ver.6.26: the old-tower titles (tw10..tw100) and skins (塔の頂 / 天空の塔) were removed from the game.
// An account that still has them equipped and still carries old tower progress must keep working everywhere:
// home, profile (overview / titles), wardrobe, the solo board, another player's view of this account.
// Nothing saved is rewritten or deleted by opening those screens (stats.tower, stats.nick, stats.skin stay as they are).
// Ver.6.29: the removed equipped title is treated as "not equipped" on every screen (own and other players').
const assert = require("node:assert/strict"), fs = require("node:fs");
const { chromium, context, openSoloMode, openProfile, goHome } = require("./browser-harness.cjs");
const exe = process.env.CHROMIUM_PATH || "/usr/bin/chromium";
const src = fs.readFileSync("index.html", "utf8");
// Two kinds of account: one with the removed old-tower rewards, one with the removed daily rewards (Ver.6.33: the four daily winner
// titles, ミッション皆勤 and the tile skin 皆勤スタンプ were removed with the daily mode).
const CASES = [
  { label: "removed tower title + skins + old progress", stats: () => ({ exp: 900, games: 4, w: 2, l: 2, rating: 1550, tower: { best: 100, endN: 3 }, nick: "tw50", skin: { tile: "towert", bg: "summit", fx: "std" } }), goneSkins: ["towert", "summit"] },
  { label: "removed daily title + 皆勤スタンプ selected + old mission counters", stats: () => ({ exp: 900, games: 4, w: 2, l: 2, rating: 1550, misDays: 9, misRun: { best: 7, n: 2, last: "2026-11-01" }, dailyRewards: { 20261101: { a: 20 } }, nick: "daily_king", skin: { tile: "mission", bg: "sky", fx: "std" } }), goneSkins: ["mission"], extra: { dailyV2: { titles: { ateacher: { daily_king: true, daily_easy_king: { day: 1 } } } } } },
  // Ver.6.36: the bounty titles bounty1 / bounty10 and the background 賞金稼ぎの荒野 (hunter) were removed with the bounty system.
  { label: "removed bounty title + 賞金稼ぎの荒野 selected + old bounty counters", stats: () => ({ exp: 900, games: 4, w: 2, l: 2, rating: 1550, bountyWins: 11, bountyExp: 420, streak: 2, maxStreak: 7, nick: "bounty10", skin: { tile: "std", bg: "hunter", fx: "std" } }), goneSkins: ["hunter"] },
  { label: "ミッション皆勤 equipped + 皆勤スタンプ selected", stats: () => ({ exp: 900, games: 4, w: 2, l: 2, rating: 1550, misDays: 7, nick: "mis7", skin: { tile: "mission", bg: "starry", fx: "std" } }), goneSkins: ["mission"] },
];
(async () => {
  for (const gone of ["id: 'tw10'", "id: 'tw30'", "id: 'tw50'", "id: 'tw70'", "id: 'tw100'", "id: 'towert'", "id: 'summit'", "need.tower", "label: '数理の塔'", "塔の頂", "天空の塔",
    "daily_easy_king", "daily_normal_king", "daily_hard_king", "daily_king", "id: 'mis7'", "ミッション皆勤", "id: 'mission'", "皆勤スタンプ", "need.mis", "useDailyTitles", "dailyTitles", "dailyV2",
    "id: 'bounty1'", "id: 'bounty10'", "id: 'hunter'", "賞金稼ぎの荒野", "need.bounty", "label: 'お尋ね者'", "懸賞金50以上"])
    assert(!src.includes(gone), "definition removed: " + gone);
  console.log("PASS old-tower and daily title, skin and label definitions are absent from index.html (and nothing reads dailyV2)");
  const b = await chromium.launch({ executablePath: exe });
  try {
    for (const C of CASES) for (const width of [390, 1440]) {
      const st = C.stats(), saved = JSON.stringify(st), start = C.stats();
      const tree = { games: { factor: { accounts: { ateacher: { name: "Teacher", stats: st }, aother: { name: "Other", stats: { exp: 50, games: 1, w: 1, nick: "tw100", skin: { tile: "towert" } } } }, ...(C.extra || {}) } } };
      const savedExtra = JSON.stringify(C.extra || {});
      const t = await context(b, { tree, pc: width > 900 }), p = t.page; if (width < 900) await p.setViewportSize({ width, height: 844 });
      await p.evaluate((skin) => localStorage.setItem("fxf_skin_v1", JSON.stringify(skin)), start.skin);
      await p.reload();
      // home: opens, shows no title name for the removed id
      await p.locator("[data-next-home] .home-content").waitFor();
      assert.match(await p.locator(".account-main").innerText(), /装備中の称号なし/, "home shows no equipped title name");
      // profile: overview and the title list open
      await openProfile(p);
      const prof = p.locator("[data-next-profile]");
      assert(!/塔の|数理の書の継承者|終わりなき探究者|暁の覇者|蒼穹の覇者|深淵の覇王|天下統一|任務完遂|ミッション皆勤|キング|ハンター|賞金/.test(await prof.innerText()), "no removed title name in the profile");
      assert.match(await p.locator(".next-equipped").first().innerText(), /装備中称号：\s*未設定/, "profile: the removed title counts as not equipped");
      await prof.getByRole("tab", { name: /称号/ }).click();
      await p.locator("[data-title-id]").first().waitFor();
      assert(await p.locator("[data-title-id]").count() >= 93, "title list shown");
      assert.equal(await p.locator("[data-equip-current]").count(), 0, "a removed title is treated as not equipped (Ver.6.29)");
      assert.equal(await p.getByText("表示できない称号").count(), 0);
      // wardrobe: opens, the removed skins are not offered, a remaining one can be picked
      await goHome(p);
      await p.locator('button[aria-label="設定"]:visible').first().click();
      await p.locator("dialog.home-menu").getByRole("button", { name: "きせかえ", exact: true }).click();
      await p.locator("[data-skin-item]").first().waitFor();
      const tiles = await p.locator("[data-skin-item]").evaluateAll((es) => es.map((e) => e.dataset.skinItem));
      assert(tiles.length >= 10 && !C.goneSkins.some((x) => tiles.includes(x)), "removed skins not offered: " + tiles.join());
      assert.equal(await p.getByText("皆勤スタンプ").count(), 0);
      assert.equal(await p.locator('[data-skin-item][aria-pressed="true"]').count(), C.goneSkins.includes(start.skin.tile) ? 0 : 1, "nothing shown as selected for a removed tile; a tile that still exists stays selected");
      await p.getByRole("button", { name: "背景", exact: true }).click();
      const bgs = await p.locator("[data-skin-item]").evaluateAll((es) => es.map((e) => e.dataset.skinItem));
      assert(bgs.length >= 5 && !C.goneSkins.some((x) => bgs.includes(x)), "removed background not offered");
      assert.equal(await p.locator('[data-skin-item][aria-pressed="true"]').count(), C.goneSkins.includes(start.skin.bg) ? 0 : 1, "a background that still exists stays selected");
      await p.getByRole("button", { name: "とじる", exact: true }).click();
      assert.equal(JSON.stringify(tree.games.factor.accounts.ateacher.stats), saved, "opening home / profile / titles / wardrobe rewrote nothing");
      // solo board: the removed tile skin falls back to the standard tile and the game is playable
      await openSoloMode(p, "play");
      await p.getByRole("button", { name: "スタート", exact: true }).click();
      await p.locator("[data-tile-id]").first().waitFor();
      const look = await p.locator("[data-tile-id]").first().evaluate((e) => ({ bg: getComputedStyle(e).backgroundColor, w: e.getBoundingClientRect().width }));
      assert.equal(look.bg, "rgb(244, 247, 255)", "standard tile colour used for the removed skin");
      assert(look.w > 40);
      { const now = tree.games.factor.accounts.ateacher.stats;
        for (const k of ["tower", "misDays", "misRun", "dailyRewards", "tk", "bountyWins", "bountyExp", "streak", "maxStreak"]) assert.deepEqual(now[k], start[k], "old progress / counters kept: " + k);
        assert.equal(now.nick, start.nick, "equipped id not rewritten");
        assert.deepEqual(now.skin, start.skin, "saved skin not rewritten");
        assert.equal(JSON.stringify(Object.fromEntries(Object.keys(C.extra || {}).map((k) => [k, tree.games.factor[k]]))), savedExtra, "saved daily records untouched");
        assert.equal(t.writes.filter((x) => /dailyV2|\/mis(\/|$)/.test(x.path)).length, 0, "nothing written under dailyV2 or mis"); }
      assert.deepEqual(t.errors, []); await t.ctx.close();
      console.log(`PASS ${width}px: account with ${C.label}: home, profile, title list, wardrobe and solo board work; saved data untouched`);
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
        ReactDOM.createRoot(el).render(h("div", null, [view("removed", "tw100"), view("unknown", "daily_king"), view("none", undefined), view("normal", "tour1"), row("removed", "tw100"), row("unknown", "mis7"), row("normal", "tour1")]));
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
