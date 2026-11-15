// New profile: one equip slot (stats/nick) for all catalog titles (95 since Ver.6.33) + the hidden title (mock Firebase).
// Reuses the existing save (equipNick, shared with the old modal). Never writes profile.title or snapshots.equipped.
const assert = require("node:assert/strict");
const { chromium, context, sleep, openRankingHub } = require("./browser-harness.cjs"); // Ver.6.13: ranking = 順位 tab
const SHOT = process.env.TE_SHOTS || "";
const catalog = require("../src/title-catalog-next.json");
const NOT_IN_BADGES = ["online_first", "wins100_ab", "dual50", "giant250", "easy_adept", "easy_master", "flash3", "accuracy10", "tour_streak2", "wksup500", "wk_runs20", "lb_cards7"];
const stats = (nick = "tour1") => ({ rating: 1500, maxRating: 1500, games: 20, w: 12, l: 6, d: 2, exp: 900, ...(nick === null ? {} : { nick }), tourWins: 1, maxStreak: 4, skin: { tile: "wood" }, perfects: 5 });
const mkTree = ({ nick = "tour1", hidden = true } = {}) => ({
  games: {
    factor: {
      accounts: { ateacher: { name: "Teacher", stats: stats(nick) } },
      dailyV2: { titles: { ateacher: { daily_easy_king: { day: "20261001" }, daily_normal_king: { day: "20261002" }, daily_hard_king: { day: "20261003" }, daily_king: true } } },
      titleNextV1: hidden ? { awards: { ateacher: { factor_factor: { earned: true, at: 1760000000000, source: "client-judged-v1" } } } } : undefined,
      onlineSparkV1: {
        config: { enabled: true, protocol: "spark-v1" },
        profiles: {
          ateacher: {
            name: "Teacher",
            easy: { rating: 1700, maxRating: 1830, games: 20, w: 12, l: 6, d: 2 },
            normal: { rating: 1600, maxRating: 1729.99, games: 5, w: 3, l: 2, d: 0 },
            badges: Object.fromEntries(NOT_IN_BADGES.map((id) => [id, true])),
            title: "easy_adept", // legacy ranking title: must never be touched
          },
        },
      },
    },
  },
});
// Ver.6.4: the equip control lives in the title detail (a dialog opened from the grid card). eq() opens the right detail on first use and closes any other.
const closeDlg = async (p) => { const d = p.locator("dialog[data-title-detail]"); if (await d.count()) { await d.getByRole("button", { name: "とじる", exact: true }).click(); await d.waitFor({ state: "detached" }); } };
const ensure = async (p, id) => {
  const d = p.locator(`dialog[data-title-detail="${id}"]`);
  if (await d.count()) return;
  await closeDlg(p);
  const c = p.locator(`[data-title-id="${id}"]`); await c.scrollIntoViewIfNeeded(); await c.click(); await d.waitFor();
};
const TERMINAL = new Set(["click", "getAttribute", "innerText", "isDisabled", "waitFor", "scrollIntoViewIfNeeded", "count", "textContent"]);
const eq = (p, id, ops = []) => new Proxy(function () {}, { get: (_, m) => (TERMINAL.has(m) ? async (...a) => { await ensure(p, id); let l = p.locator(`dialog[data-title-detail="${id}"] [data-title-equip="${id}"]`); for (const [mm, aa] of ops) l = l[mm](...aa); return l[m](...a); } : (...a) => eq(p, id, [...ops, [m, a]])) });
const name = (id) => (catalog.titles.find((t) => t.id === id) || catalog.hidden).name;
async function open(p, w, h) {
  if (w) await p.setViewportSize({ width: w, height: h });
  await p.evaluate(() => localStorage.setItem("fxf_title_presentation_v1:ateacher", "seen")).catch(() => {});
  await p.locator(".account-main").click();
  await p.locator("[data-next-profile]").waitFor();
  await p.getByRole("tab", { name: "称号・実績" }).click();
  await p.locator("[data-title-inventory]").waitFor();
  await p.waitForFunction(() => document.querySelector('[data-title-id="easy_master"]')?.dataset.state === "earned");
}
async function equip(p, tree, id, { clear = false } = {}) {
  const btn = eq(p, id).getByRole("button", { name: clear ? /はずす/ : /装備する/ });
  await btn.scrollIntoViewIfNeeded();
  await btn.click();
  await eq(p, id).locator('[data-equip-status="saved"]').waitFor({ timeout: 15000 });
  assert.strictEqual(tree.games.factor.accounts.ateacher.stats.nick, clear ? "" : id, `${id}: saved to stats/nick (unequip = explicit \"\")`);
}
const untouched = (tree, t0) => {
  const prof = tree.games.factor.onlineSparkV1.profiles.ateacher;
  assert.equal(prof.title, "easy_adept", "profile.title is never written or cleared");
  assert.deepEqual(prof.badges, t0.badges, "rated badges untouched");
  const snap = tree.games.factor.titleNextV1?.snapshots?.ateacher;
  if (snap) assert.equal(snap.equipped, t0.snapEquipped ?? snap.equipped, "snapshots.equipped never changes");
};
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium" });
  try {
    for (const [w, h] of [[390, 844], [1440, 900]]) {
      const tree = mkTree();
      const t = await context(b, { tree }), p = t.page;
      await open(p, w, h);
      const t0 = { badges: structuredClone(tree.games.factor.onlineSparkV1.profiles.ateacher.badges), snapEquipped: tree.games.factor.titleNextV1.snapshots?.ateacher?.equipped };
      // current equip: legacy tour1, unequip then equip back (existing nick behaviour)
      assert.equal(await eq(p, "tour1").getAttribute("data-equip-state"), "on");
      await closeDlg(p);
      assert.match(await p.locator("[data-equip-current]").innerText(), /現在の装備：〈/);
      // the legacy ranking title is NOT the equip slot while nick is set
      assert.equal(await eq(p, "easy_adept").getAttribute("data-equip-state"), "off");
      assert.equal(await p.locator("[data-rating-title-note]").count(), 0);
      await equip(p, tree, "tour1", { clear: true });
      await equip(p, tree, "tour1");
      // Ver.6.33: the four daily winner titles and mis7 were removed with the daily mode. Even with the old records saved
      // (dailyV2/titles in the fixture), they are not listed, not earned and cannot be equipped.
      for (const id of ["daily_easy_king", "daily_normal_king", "daily_hard_king", "daily_king", "mis7"]) assert.equal(await p.locator(`[data-title-id="${id}"]`).count(), 0, `${id} is not in the list`);
      assert.equal(await p.locator("[data-title-id]").count(), catalog.titles.length + 1, "95 titles + the earned hidden title");
      // the titles that have no BADGES entry (display + equip through the catalog labels)
      for (const id of NOT_IN_BADGES) {
        await equip(p, tree, id);
        assert.equal(await eq(p, id).getAttribute("data-equip-state"), "on");
        assert.match(await p.locator(".next-equipped").first().innerText(), new RegExp(name(id)), `${id}: header shows the catalog name`);
      }
      // hidden title
      await eq(p, "factor_factor").scrollIntoViewIfNeeded();
      await equip(p, tree, "factor_factor");
      assert.match(await p.locator(".next-equipped").first().innerText(), /FACTOR×FACTOR/);
      // unearned titles stay locked and explain why
      for (const id of ["normal_adept", "normal_master", "dual_master"]) {
        await closeDlg(p); await p.locator(`[data-title-id="${id}"]`).scrollIntoViewIfNeeded(); await p.locator(`[data-title-id="${id}"]`).click();
        const dlg = p.locator(`dialog[data-title-detail="${id}"]`); await dlg.waitFor();
        assert.equal(await dlg.locator("[data-title-equip]").count(), 0, `${id}: no equip control for an unearned title`);
        assert.match(await dlg.innerText(), /未取得のため装備できません/);
      }
      // buttons are 44px+ and fit
      const boxes = await p.locator(".next-title-equip-btn:not([disabled])").evaluateAll((es) => es.map((e) => { const r = e.getBoundingClientRect(); return { h: r.height, x: r.x, r: r.right }; }));
      assert(boxes.every((x) => x.h >= 44 && x.x >= 0 && x.r <= w + 1));
      assert(await p.evaluate((w) => document.documentElement.scrollWidth <= w + 1, w), "no horizontal scroll");
      untouched(tree, t0);
      // reload: the equipped hidden title is still there and the home header shows its name through Nick
      await p.reload();
      assert.equal(tree.games.factor.accounts.ateacher.stats.nick, "factor_factor");
      await p.locator(".account-main").waitFor();
      assert.match(await p.locator(".account-main").innerText(), /FACTOR×FACTOR/, "Nick renders a hidden title from the catalog");
      await open(p);
      assert.equal(await eq(p, "factor_factor").getAttribute("data-equip-state"), "on", "equipped state survives a reload");
      // switch from the hidden title to a legacy one: only one slot
      await equip(p, tree, "tour1");
      assert.equal(await eq(p, "factor_factor").getAttribute("data-equip-state"), "off");
      untouched(tree, t0);
      if (SHOT) { await p.getByRole("button", { name: "取得済み", exact: true }).click(); await p.locator("[data-title-inventory] h3").scrollIntoViewIfNeeded(); await p.screenshot({ path: `${SHOT}/equip-${w}x${h}.png` }); }
      assert.deepEqual(t.errors, []);
      await t.ctx.close();
    }
    // a catalog name also shows on the home header for a no-BADGES title (Nick through titleLabelOf)
    {
      const tree = mkTree({ nick: "easy_master" });
      const t = await context(b, { tree }), p = t.page;
      await p.setViewportSize({ width: 390, height: 844 });
      await p.locator(".account-main").waitFor();
      assert.match(await p.locator(".account-main").innerText(), /初級の覇王/, "Nick shows a catalog-only title");
      await t.ctx.close();
    }
    // legacy-only id that still exists (not in the 100): kept, displayed, never initialised, and clearable.
    {
      const id = "nosp", tree = mkTree({ nick: id });
      const t = await context(b, { tree }), p = t.page;
      await open(p, 390, 844);
      assert.equal(tree.games.factor.accounts.ateacher.stats.nick, id, "opening the profile does not touch the equipped id: " + id);
      await closeDlg(p);
      assert.match(await p.locator("[data-equip-current]").innerText(), /現在の装備：〈.+〉（従来の称号）/, id);
      assert.match(await p.locator(".next-equipped").first().innerText(), /装備中称号：\s*必殺技いらず/);
      assert(await p.locator("[data-title-id]").count() >= 95, "the title list is shown: " + id);
      await p.locator("[data-equip-current]").getByRole("button", { name: /はずす/ }).click();
      await p.locator('.next-title-equip-current [data-equip-status="saved"]').waitFor();
      assert.strictEqual(tree.games.factor.accounts.ateacher.stats.nick, "", "cleared as an explicit unequip: " + id);
      assert.deepEqual(t.errors, [], "no page error: " + id);
      await t.ctx.close();
    }
    // Ver.6.29: an equipped id whose title was removed from the game (old-tower titles, or any id with no definition) is treated
    // as "no title equipped" on every screen. Nothing is written by opening the screens; another title can be equipped as usual,
    // and that changes only stats/nick.
    for (const id of ["tw10", "tw50", "tw100", "daily_easy_king", "daily_normal_king", "daily_hard_king", "daily_king", "mis7", "some_title_removed_later"]) {
      const tree = mkTree({ nick: id });
      const t = await context(b, { tree }), p = t.page;
      await p.setViewportSize({ width: 390, height: 844 });
      await p.locator(".account-main").waitFor();
      assert.match(await p.locator(".account-main").innerText(), /装備中の称号なし/, "home: not equipped: " + id);
      await open(p, 390, 844);
      await closeDlg(p);
      assert.equal(tree.games.factor.accounts.ateacher.stats.nick, id, "opening home / profile / title list does not rewrite the slot: " + id);
      assert.deepEqual(t.writes.map((w) => w.path).filter((x) => /\/accounts\//.test(x)), [], "opening the screens writes nothing to the account: " + id);
      assert.equal(await p.locator("[data-equip-current]").count(), 0, "no current-equip row for a removed title: " + id);
      assert.equal(await p.getByText("表示できない称号").count(), 0, "the old wording is gone: " + id);
      assert.equal(await p.locator('[data-title-id][data-equipped="true"]').count(), 0, "no title marked as equipped: " + id);
      assert(await p.locator("[data-title-id]").count() >= 95, "the title list is shown: " + id);
      assert(!/塔の|数理の書|終わりなき/.test(await p.locator("body").innerText()), "no old-tower title name shown: " + id);
      await p.getByRole("tab", { name: "概要" }).click();
      assert.match(await p.locator(".next-equipped").first().innerText(), /装備中称号：\s*未設定/, "profile overview: 未設定: " + id);
      await p.getByRole("tab", { name: "称号・実績" }).click();
      await p.locator("[data-title-inventory]").waitFor();
      // another title can be equipped; only stats/nick changes
      const savedData = () => { const f = tree.games.factor, c = JSON.parse(JSON.stringify({ accounts: f.accounts, onlineSparkV1: f.onlineSparkV1, awards: f.titleNextV1 && f.titleNextV1.awards, dailyTitles: f.dailyV2.titles })); c.accounts.ateacher.stats.nick = null; return c; };
      const before = savedData();
      await equip(p, tree, "easy_master");
      await closeDlg(p);
      assert.equal(await p.locator('[data-title-id="easy_master"]').getAttribute("data-equipped"), "true");
      assert.match(await p.locator("[data-equip-current]").innerText(), /現在の装備：〈初級の覇王〉/);
      assert.deepEqual(t.writes.map((w) => w.path).filter((x) => /\/accounts\/|\/onlineSparkV1\/|\/titleNextV1\/awards\//.test(x)), ["games/factor/accounts/ateacher/stats/nick"], "the only saved-data write is the equip slot: " + id);
      const after = savedData();
      assert.deepEqual(after, before, "no saved data other than the equipped title changed: " + id);
      assert.deepEqual(t.errors, [], "no page error: " + id);
      await t.ctx.close();
    }
    // other device changes the slot: this screen follows it
    {
      const tree = mkTree();
      const t = await context(b, { tree }), p = t.page;
      await open(p, 390, 844);
      await p.evaluate(() => window.__fbApply({ kind: "set", path: "games/factor/accounts/ateacher/stats/nick", v: "giant250" }));
      await p.waitForFunction(() => document.querySelector('[data-title-id="giant250"]')?.dataset.equipped === "true", null, { timeout: 8000 });
      assert.equal(await eq(p, "tour1").getAttribute("data-equip-state"), "off");
      await p.evaluate(() => window.__fbApply({ kind: "set", path: "games/factor/accounts/ateacher/stats/nick", v: "" }));
      await closeDlg(p);
      await p.waitForFunction(() => document.querySelector("[data-equip-current]") === null, null, { timeout: 8000 });
      await t.ctx.close();
    }
    // save failure: the equipped state does not change, a retry works
    {
      let failing = true;
      const tree = mkTree();
      const t = await context(b, { tree, onOperation: async (op) => { if (failing && /stats\/nick/.test(op.path)) throw new Error("mock permission denied"); } }), p = t.page;
      await open(p, 390, 844);
      await eq(p, "giant250").getByRole("button", { name: /装備する/ }).scrollIntoViewIfNeeded();
      await eq(p, "giant250").getByRole("button", { name: /装備する/ }).click();
      await eq(p, "giant250").locator('[data-equip-status="failed"]').waitFor();
      assert.match(await eq(p, "giant250").innerText(), /保存できませんでした/);
      assert.equal(await eq(p, "giant250").getAttribute("data-equip-state"), "off", "a failed equip never looks equipped");
      assert.equal(await eq(p, "tour1").getAttribute("data-equip-state"), "on", "the previous equip stays shown");
      assert.equal(tree.games.factor.accounts.ateacher.stats.nick, "tour1");
      failing = false;
      await eq(p, "giant250").getByRole("button", { name: /装備する/ }).click();
      await eq(p, "giant250").locator('[data-equip-status="saved"]').waitFor();
      assert.equal(tree.games.factor.accounts.ateacher.stats.nick, "giant250");
      if (SHOT) { await eq(p, "giant250").scrollIntoViewIfNeeded(); await p.screenshot({ path: `${SHOT}/equip-retry-390.png` }); }
      await t.ctx.close();
    }
    // slow network: saving is shown and buttons locked; reflected only on success
    {
      const tree = mkTree();
      const t = await context(b, { tree, onOperation: async (op) => { if (/stats\/nick/.test(op.path)) await sleep(7500); } }), p = t.page;
      await open(p, 390, 844);
      await eq(p, "giant250").getByRole("button", { name: /装備する/ }).scrollIntoViewIfNeeded();
      await eq(p, "giant250").getByRole("button", { name: /装備する/ }).click();
      await eq(p, "giant250").locator('[data-equip-status="saving"]').waitFor();
      assert.equal(await eq(p, "giant250").getAttribute("data-equip-state"), "off", "not shown as equipped while saving");
      assert(await p.locator(".next-title-equip-btn").evaluateAll((es) => es.every((e) => e.disabled)), "every equip button is locked while saving");
      await p.getByText(/通信が遅れています/).waitFor({ timeout: 9000 });
      await eq(p, "giant250").locator('[data-equip-status="saved"]').waitFor({ timeout: 12000 });
      assert.equal(await eq(p, "giant250").getAttribute("data-equip-state"), "on");
      await t.ctx.close();
    }
    // Ver.6.4: the old modal's grid and pickNick are gone. A catalog-only title equipped earlier is still resolved and can be released from the new profile.
    {
      const tree = mkTree({ nick: "easy_master" });
      const t = await context(b, { tree }), p = t.page;
      await open(p, 390, 844);
      await closeDlg(p);
      assert.equal(await p.locator("[data-achievement]").count(), 0, "no old achievement grid anywhere");
      assert.match(await p.locator("[data-equip-current]").innerText(), /現在の装備：〈/);
      await p.locator("[data-equip-current]").getByRole("button", { name: /はずす/ }).click();
      await sleep(1200);
      assert.strictEqual(tree.games.factor.accounts.ateacher.stats.nick, "");
      await t.ctx.close();
    }
    // three states: absent -> legacy ranking title shown; "" -> cleared (the old title does not come back); id -> that title
    {
      const tree = mkTree({ nick: null });
      const t = await context(b, { tree }), p = t.page;
      await p.setViewportSize({ width: 390, height: 844 });
      await p.locator(".account-main").waitFor();
      assert.match(await p.locator(".account-main").innerText(), /初級の覇者/, "HOME shows the legacy ranking title while nick is absent");
      await open(p);
      assert.strictEqual(tree.games.factor.accounts.ateacher.stats.nick, undefined, "opening the profile does not write the field");
      assert.match(await p.locator(".next-equipped").first().innerText(), /初級の覇者（ランキング称号）/);
      assert.equal(await eq(p, "easy_adept").getAttribute("data-equip-state"), "on", "the displayed legacy title counts as equipped");
      assert.match(await eq(p, "easy_adept").innerText(), /従来のランキング称号を表示中/);
      await equip(p, tree, "easy_adept", { clear: true });
      assert.strictEqual(tree.games.factor.accounts.ateacher.stats.nick, "");
      assert.equal(tree.games.factor.onlineSparkV1.profiles.ateacher.title, "easy_adept", "profile.title is kept (never deleted or overwritten)");
      assert.match(await p.locator(".next-equipped").first().innerText(), /未設定/);
      await closeDlg(p);
      assert.equal(await p.locator("[data-equip-current]").count(), 0, "cleared: nothing is shown as equipped");
      await p.reload();
      await p.locator(".account-main").waitFor();
      assert.match(await p.locator(".account-main").innerText(), /装備中の称号なし/, "after a reload the cleared state holds and the old title does not come back");
      await open(p);
      assert.equal(await eq(p, "easy_adept").getAttribute("data-equip-state"), "off");
      await equip(p, tree, "giant250");
      assert.equal(tree.games.factor.onlineSparkV1.profiles.ateacher.title, "easy_adept");
      assert.equal(await t.writes.filter((x) => /onlineSparkV1/.test(x.path)).length, 0, "no write ever touched the Spark profile");
      await t.ctx.close();
    }
    // ranking rows follow the same rule as HOME / profile
    {
      const season = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 7);
      const pr = (name, e, extra = {}) => ({ name, ...extra, easy: { rating: e, maxRating: e, season, games: 10, w: 5, l: 5, d: 0 }, normal: { rating: 1500, maxRating: 1500, season, games: 0, w: 0, l: 0, d: 0 } });
      const badges = { easy_adept: true }, title = "easy_adept";
      const accounts = { ateacher: { name: "Teacher", stats: { rating: 1600, exp: 100 } }, pa: { name: "AAA", stats: { nick: "first" } }, pb: { name: "BBB", stats: { nick: "" } }, pc: { name: "CCC", stats: {} }, pd: { name: "DDD", stats: { nick: "easy_master" } } };
      const profiles = { ateacher: pr("Teacher", 1600), pa: pr("AAA", 1790, { title, badges }), pb: pr("BBB", 1780, { title, badges }), pc: pr("CCC", 1770, { title, badges }), pd: pr("DDD", 1760, { title, badges }) };
      const tree = { games: { factor: { accounts, onlineSparkV1: { config: { enabled: true, protocol: "spark-v1" }, profiles } } } };
      const t = await context(b, { tree }), p = t.page;
      await p.setViewportSize({ width: 390, height: 844 });
      await openRankingHub(p);
      await p.locator(".ranking-entry").filter({ hasText: "レーティングランキング" }).click();
      const view = p.locator('[data-ranking="rating"]');
      await view.locator(".rk-row").first().waitFor();
      const rows = Object.fromEntries(await view.locator(".rk-row").evaluateAll((es) => es.map((e) => [e.querySelector(".rk-name").textContent, e.innerText])));
      assert.match(rows.AAA, /始まりの剣/, "the catalog name is used for the legacy id 'first'"); assert.doesNotMatch(rows.AAA, /はじめの一歩|初級の覇者/, "nick wins over the ranking title");
      assert.doesNotMatch(rows.BBB, /イージーの達人|初級の覇者/, "an explicit unequip hides the old ranking title");
      assert.match(rows.CCC, /初級の覇者/, "absent nick: the legacy ranking title is shown by its official catalog name"); assert.doesNotMatch(rows.CCC, /イージーの達人/);
      assert.match(rows.DDD, /初級の覇王/, "a catalog-only title is shown by name"); assert.doesNotMatch(rows.DDD, /イージーマスター|イージーの達人/);
      await t.ctx.close();
    }
    // HOME follows the same rule for the three states
    for (const [nick, want] of [["first", /始まりの剣/], ["", /装備中の称号なし/], [null, /初級の覇者/]]) {
      const tree = mkTree({ nick });
      const t = await context(b, { tree }), p = t.page;
      await p.setViewportSize({ width: 390, height: 844 });
      await p.locator(".account-main").waitFor();
      assert.match(await p.locator(".account-main").innerText(), want, `HOME for nick=${JSON.stringify(nick)}`);
      await t.ctx.close();
    }
    // ranking-screen equip = two existing saves (1: stats/nick, 2: equipTitle -> profile.title). Every partial outcome is honest and recoverable.
    {
      const season = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 7);
      const setup = async (onOperation) => {
        const tree = mkTree();
        const prof = tree.games.factor.onlineSparkV1.profiles.ateacher;
        Object.assign(prof, { badges: { easy_adept: true, easy_master: true }, title: "easy_master" });
        prof.easy.rating = 1700; prof.easy.season = season; prof.easy.seasonMax = 1700; prof.normal.season = season; prof.normal.seasonMax = 1600;
        const t = await context(b, { tree, onOperation }), p = t.page;
        await p.setViewportSize({ width: 390, height: 844 });
        await openRankingHub(p);
        await p.locator(".ranking-entry").filter({ hasText: "レーティングランキング" }).click();
        await p.getByRole("button", { name: "初級の覇者を装備", exact: true }).waitFor();
        return { tree, t, p, state: () => ({ nick: tree.games.factor.accounts.ateacher.stats.nick, title: tree.games.factor.onlineSparkV1.profiles.ateacher.title }), status: () => p.locator("[data-rank-equip]") };
      };
      const BTN = (p) => p.getByRole("button", { name: "初級の覇者を装備", exact: true });
      // 0. success: both stores agree, official name on the button
      { const c = await setup(); await BTN(c.p).click(); await c.status().and(c.p.locator('[data-rank-equip="saved"]')).waitFor({ timeout: 15000 }); assert.deepEqual(c.state(), { nick: "easy_adept", title: "easy_adept" }); await c.t.ctx.close(); }
      // 1. the unified slot fails (profile.title would have succeeded): nothing is changed, step 2 is not even attempted, nothing says success
      { let fail = true; const c = await setup(async (op) => { if (fail && /stats\/nick/.test(op.path)) throw new Error("mock nick failure"); });
        await BTN(c.p).click(); await c.p.locator('[data-rank-equip="failed"]').waitFor({ timeout: 10000 });
        assert.deepEqual(c.state(), { nick: "tour1", title: "easy_master" }, "no store changed");
        assert.equal(c.t.writes.filter((x) => /onlineSparkV1/.test(x.path)).length, 0, "step 2 (profile.title) was never attempted after step 1 failed");
        assert.equal(await c.p.locator('[data-rank-equip="saved"]').count(), 0);
        fail = false; await BTN(c.p).click(); await c.p.locator('[data-rank-equip="saved"]').waitFor({ timeout: 15000 });
        assert.deepEqual(c.state(), { nick: "easy_adept", title: "easy_adept" }, "retry after recovery completes both");
        await c.t.ctx.close(); }
      // 2. the unified slot saved, profile.title failed: never reported as success, one retry button, safe to repeat
      { let fail = true; const c = await setup(async (op) => { if (fail && /onlineSparkV1\/profiles\/ateacher/.test(op.path)) throw new Error("mock title failure"); });
        await BTN(c.p).click(); await c.p.locator('[data-rank-equip="partial"]').waitFor({ timeout: 25000 });
        assert.deepEqual(c.state(), { nick: "easy_adept", title: "easy_master" }, "step 1 persisted, step 2 did not");
        assert.match(await c.p.locator('[data-rank-equip="partial"]').innerText(), /装備枠には保存しましたが.*失敗しました/);
        assert.equal(await c.p.locator('[data-rank-equip="saved"]').count(), 0, "no success message while step 2 is missing");
        assert.equal(await c.p.getByRole("alert").count(), 1, "one clear message (no second generic banner with a half-retry)");
        fail = false; await c.p.getByRole("button", { name: "再試行", exact: true }).click(); await c.p.locator('[data-rank-equip="saved"]').waitFor({ timeout: 15000 });
        assert.deepEqual(c.state(), { nick: "easy_adept", title: "easy_adept" }, "the retry converges (both writes are idempotent)");
        await c.t.ctx.close(); }
      // 3. both fail: nothing changes, nothing succeeds
      { const c = await setup(async (op) => { if (/stats\/nick|onlineSparkV1\/profiles\/ateacher/.test(op.path)) throw new Error("mock total failure"); });
        await BTN(c.p).click(); await c.p.locator('[data-rank-equip="failed"]').waitFor({ timeout: 10000 });
        assert.deepEqual(c.state(), { nick: "tour1", title: "easy_master" }); await c.t.ctx.close(); }
      // 4. slow network while another device changes the equipped title: the screen stays honest and the last write wins coherently
      { const c = await setup(async (op) => { if (/stats\/nick/.test(op.path)) await sleep(3000); });
        await BTN(c.p).click(); await c.p.locator('[data-rank-equip="saving"]').waitFor();
        assert(await BTN(c.p).isDisabled(), "buttons are locked while saving");
        await c.p.evaluate(() => window.__fbApply({ kind: "set", path: "games/factor/accounts/ateacher/stats/nick", v: "giant250" }));
        await c.p.locator('[data-rank-equip="saved"]').waitFor({ timeout: 20000 });
        const st = c.state(); assert.equal(st.title, "easy_adept"); assert.equal(st.nick, "easy_adept", "this device's save was the last write to the unified slot");
        await c.t.ctx.close(); }
      // 5. the screen is closed mid-save: no success is ever shown afterwards, the stores stay readable and a repeat fixes any half state
      { const c = await setup(async (op) => { if (/stats\/nick/.test(op.path)) await sleep(2500); });
        await BTN(c.p).click(); await c.p.locator('[data-rank-equip="saving"]').waitFor(); await c.p.reload();
        await sleep(3500);
        const st = c.state();
        assert(["tour1", "easy_adept"].includes(st.nick) && st.title === "easy_master", "step 2 never ran because the page was gone: " + JSON.stringify(st));
        await openRankingHub(c.p);
        await c.p.locator(".ranking-entry").filter({ hasText: "レーティングランキング" }).click();
        await BTN(c.p).waitFor();
        assert.equal(await c.p.locator("[data-rank-equip]").count(), 0, "a fresh screen shows no stale success");
        await BTN(c.p).click(); await c.p.locator('[data-rank-equip="saved"]').waitFor({ timeout: 15000 });
        assert.deepEqual(c.state(), { nick: "easy_adept", title: "easy_adept" }, "repeating the action repairs the half state");
        await c.t.ctx.close(); }
    }
    // guest: nothing equippable
    {
      const t = await context(b, { account: { guest: true, name: "Guest" } }), p = t.page;
      await p.setViewportSize({ width: 390, height: 844 });
      await p.locator(".account-main").click();
      await p.locator("[data-next-profile]").waitFor();
      await p.getByRole("tab", { name: "称号・実績" }).click();
      await p.locator("[data-title-inventory]").waitFor();
      assert.equal(await p.locator(".next-title-equip-btn:not([disabled])").count(), 0, "guests cannot equip");
      await t.ctx.close();
    }
    console.log("PASS title equip (single slot, 3 states): removed daily titles not listed and shown as not equipped, no-BADGES titles, hidden, locked, legacy-only, absent/cleared/id, ranking rows + HOME + ranking button agree, old modal, multi-device, failure/slow, guest, reload");
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
