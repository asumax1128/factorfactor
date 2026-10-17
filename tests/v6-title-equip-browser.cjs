// New profile: one equip slot (stats/nick) for all 100 catalog titles + the hidden title (mock Firebase).
// Reuses the existing save (equipNick, shared with the old modal). Never writes profile.title or snapshots.equipped.
const assert = require("node:assert/strict");
const { chromium, context, sleep } = require("./browser-harness.cjs");
const SHOT = process.env.TE_SHOTS || "";
const catalog = require("../src/title-catalog-next.json");
const NOT_IN_BADGES = ["online_first", "wins100_ab", "dual50", "giant250", "easy_adept", "easy_master", "flash3", "accuracy10", "tour_streak2", "wksup500", "wk_runs20", "lb_cards7"];
const stats = (nick = "tour1") => ({ rating: 1500, maxRating: 1500, games: 20, w: 12, l: 6, d: 2, exp: 900, ...(nick ? { nick } : {}), tourWins: 1, maxStreak: 4, skin: { tile: "wood" }, perfects: 5 });
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
const eq = (p, id) => p.locator(`[data-title-equip="${id}"]`);
const name = (id) => (catalog.titles.find((t) => t.id === id) || catalog.hidden).name;
async function open(p, w, h) {
  if (w) await p.setViewportSize({ width: w, height: h });
  await p.evaluate(() => localStorage.setItem("fxf_title_presentation_v1:ateacher", "seen")).catch(() => {});
  await p.locator(".account-main").click();
  await p.locator("[data-next-profile]").waitFor();
  await p.getByRole("tab", { name: "称号・装備" }).click();
  await p.locator("[data-title-inventory]").waitFor();
  await p.waitForFunction(() => /取得済み/.test(document.querySelector('[data-title-id="easy_master"] small')?.textContent || ""));
}
async function equip(p, tree, id, { clear = false } = {}) {
  const btn = eq(p, id).getByRole("button", { name: clear ? /はずす/ : /装備する/ });
  await btn.scrollIntoViewIfNeeded();
  await btn.click();
  await eq(p, id).locator('[data-equip-status="saved"]').waitFor({ timeout: 15000 });
  assert.equal(tree.games.factor.accounts.ateacher.stats.nick, clear ? undefined : id, `${id}: saved to stats/nick`);
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
      assert.match(await p.locator("[data-equip-current]").innerText(), /現在の装備：〈/);
      // the ranking title is shown separately and is NOT the equip slot
      assert.match(await p.locator("[data-rating-title]").innerText(), /ランキング称号（従来の設定）：\s*初級の覇者/);
      assert.equal(await eq(p, "easy_adept").getAttribute("data-equip-state"), "off", "a ranking title is not 'equipped' in the single slot");
      assert.match(await eq(p, "easy_adept").innerText(), /ランキング称号として設定中/);
      await equip(p, tree, "tour1", { clear: true });
      await equip(p, tree, "tour1");
      // daily kings: earned (dailyV2/titles) and equippable (the reported bug)
      for (const id of ["daily_easy_king", "daily_normal_king", "daily_hard_king", "daily_king"]) {
        assert.equal(await eq(p, id).getAttribute("data-equip-state"), "off", `${id} shows as equippable`);
        assert.doesNotMatch(await eq(p, id).innerText(), /未取得|対応していません/, `${id} has no false 'unsupported' message`);
        await equip(p, tree, id);
        assert.match(await p.locator(".next-equipped").first().innerText(), new RegExp(name(id)));
      }
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
        assert.equal(await eq(p, id).getAttribute("data-equip-state"), "disabled");
        assert(await eq(p, id).getByRole("button", { name: /装備する/ }).isDisabled());
        assert.match(await eq(p, id).innerText(), /未取得のため装備できません/);
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
    // legacy-only ids (not in the 100): kept, displayed, never initialised, and clearable
    {
      const tree = mkTree({ nick: "tw10" });
      const t = await context(b, { tree }), p = t.page;
      await open(p, 390, 844);
      assert.equal(tree.games.factor.accounts.ateacher.stats.nick, "tw10", "opening the profile does not touch an equipped legacy-only title");
      assert.match(await p.locator("[data-equip-current]").innerText(), /現在の装備：〈.+〉（従来の称号）/);
      assert.match(await p.locator(".next-equipped").first().innerText(), /装備中称号：\s*塔の挑戦者/);
      await p.locator("[data-equip-current]").getByRole("button", { name: /はずす/ }).click();
      await p.locator('.next-title-equip-current [data-equip-status="saved"]').waitFor();
      assert.equal(tree.games.factor.accounts.ateacher.stats.nick, undefined);
      await t.ctx.close();
    }
    // other device changes the slot: this screen follows it
    {
      const tree = mkTree();
      const t = await context(b, { tree }), p = t.page;
      await open(p, 390, 844);
      await p.evaluate(() => window.__fbApply({ kind: "set", path: "games/factor/accounts/ateacher/stats/nick", v: "daily_king" }));
      await p.waitForFunction(() => document.querySelector('[data-title-equip="daily_king"]')?.dataset.equipState === "on", null, { timeout: 8000 });
      assert.equal(await eq(p, "tour1").getAttribute("data-equip-state"), "off");
      await p.evaluate(() => window.__fbApply({ kind: "set", path: "games/factor/accounts/ateacher/stats/nick", v: null }));
      await p.waitForFunction(() => document.querySelector("[data-equip-current]") === null, null, { timeout: 8000 });
      await t.ctx.close();
    }
    // save failure: the equipped state does not change, a retry works
    {
      let failing = true;
      const tree = mkTree();
      const t = await context(b, { tree, onOperation: async (op) => { if (failing && /stats\/nick/.test(op.path)) throw new Error("mock permission denied"); } }), p = t.page;
      await open(p, 390, 844);
      await eq(p, "daily_king").getByRole("button", { name: /装備する/ }).scrollIntoViewIfNeeded();
      await eq(p, "daily_king").getByRole("button", { name: /装備する/ }).click();
      await eq(p, "daily_king").locator('[data-equip-status="failed"]').waitFor();
      assert.match(await eq(p, "daily_king").innerText(), /保存できませんでした/);
      assert.equal(await eq(p, "daily_king").getAttribute("data-equip-state"), "off", "a failed equip never looks equipped");
      assert.equal(await eq(p, "tour1").getAttribute("data-equip-state"), "on", "the previous equip stays shown");
      assert.equal(tree.games.factor.accounts.ateacher.stats.nick, "tour1");
      failing = false;
      await eq(p, "daily_king").getByRole("button", { name: /装備する/ }).click();
      await eq(p, "daily_king").locator('[data-equip-status="saved"]').waitFor();
      assert.equal(tree.games.factor.accounts.ateacher.stats.nick, "daily_king");
      if (SHOT) { await eq(p, "daily_king").scrollIntoViewIfNeeded(); await p.screenshot({ path: `${SHOT}/equip-retry-390.png` }); }
      await t.ctx.close();
    }
    // slow network: saving is shown and buttons locked; reflected only on success
    {
      const tree = mkTree();
      const t = await context(b, { tree, onOperation: async (op) => { if (/stats\/nick/.test(op.path)) await sleep(7500); } }), p = t.page;
      await open(p, 390, 844);
      await eq(p, "daily_king").getByRole("button", { name: /装備する/ }).scrollIntoViewIfNeeded();
      await eq(p, "daily_king").getByRole("button", { name: /装備する/ }).click();
      await eq(p, "daily_king").locator('[data-equip-status="saving"]').waitFor();
      assert.equal(await eq(p, "daily_king").getAttribute("data-equip-state"), "off", "not shown as equipped while saving");
      assert(await p.locator(".next-title-equip-btn").evaluateAll((es) => es.every((e) => e.disabled)), "every equip button is locked while saving");
      await p.getByText(/通信が遅れています/).waitFor({ timeout: 9000 });
      await eq(p, "daily_king").locator('[data-equip-status="saved"]').waitFor({ timeout: 12000 });
      assert.equal(await eq(p, "daily_king").getAttribute("data-equip-state"), "on");
      await t.ctx.close();
    }
    // old modal still works against the same slot, with a catalog-only title equipped
    {
      const tree = mkTree({ nick: "easy_master" });
      const t = await context(b, { tree }), p = t.page;
      await open(p, 390, 844);
      await p.getByRole("button", { name: /称号の装備・詳細記録/ }).click();
      const mod = p.locator("[data-achievement]").first();
      await mod.waitFor();
      assert(await p.locator("[data-achievement]").count() > 10, "old modal lists the legacy achievements without crashing");
      await p.locator("[data-achievement]", { hasText: "はじめの一歩" }).first().click();
      await sleep(400);
      assert.equal(tree.games.factor.accounts.ateacher.stats.nick, "first", "the old modal still writes the same slot");
      await t.ctx.close();
    }
    // guest: nothing equippable
    {
      const t = await context(b, { account: { guest: true, name: "Guest" } }), p = t.page;
      await p.setViewportSize({ width: 390, height: 844 });
      await p.locator(".account-main").click();
      await p.locator("[data-next-profile]").waitFor();
      await p.getByRole("tab", { name: "称号・装備" }).click();
      await p.locator("[data-title-inventory]").waitFor();
      assert.equal(await p.locator(".next-title-equip-btn:not([disabled])").count(), 0, "guests cannot equip");
      await t.ctx.close();
    }
    console.log("PASS title equip (single slot): daily kings, 12 no-BADGES titles, hidden, locked, legacy-only, multi-device, failure/slow, old modal, guest, reload");
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
