// New profile: equip / unequip / switch earned titles in place (mock Firebase). Reuses the existing saves:
//  - stats/nick (old modal's pickNick, now the shared equipNick) and onlineSparkV1 profile.title (rated equipTitle).
const assert = require("node:assert/strict");
const fs = require("fs");
const { chromium, context, sleep } = require("./browser-harness.cjs");
const SHOT = process.env.TE_SHOTS || "";
const stats = () => ({ rating: 1500, maxRating: 1500, games: 20, w: 12, l: 6, d: 2, exp: 900, nick: "tour1", tourWins: 1, maxStreak: 4, skin: { tile: "wood" }, perfects: 5 });
const mkTree = () => ({
  games: {
    factor: {
      accounts: { ateacher: { name: "Teacher", stats: stats() } },
      onlineSparkV1: {
        config: { enabled: true, protocol: "spark-v1" },
        profiles: {
          ateacher: {
            name: "Teacher",
            easy: { rating: 1700, maxRating: 1830, games: 20, w: 12, l: 6, d: 2 },
            normal: { rating: 1600, maxRating: 1729.99, games: 5, w: 3, l: 2, d: 0 },
            badges: { easy_adept: true },
            title: "easy_adept",
          },
        },
      },
    },
  },
});
const item = (p, id) => p.locator(`[data-title-id="${id}"]`);
const eq = (p, id) => p.locator(`[data-title-equip="${id}"]`);
async function open(p, w, h) {
  if (w) await p.setViewportSize({ width: w, height: h });
  await p.locator(".account-main").click();
  await p.locator("[data-next-profile]").waitFor();
  await p.getByRole("tab", { name: "称号・装備" }).click();
  await p.locator("[data-title-inventory]").waitFor();
  await p.waitForFunction(() => /取得済み/.test(document.querySelector('[data-title-id="easy_master"] small')?.textContent || ""));
}
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium" });
  try {
    // ---- states, switching, unequip, locked titles (390 phone, then PC) ----
    for (const [w, h] of [[390, 844], [1440, 900]]) {
      const tree = mkTree();
      const t = await context(b, { tree }), p = t.page;
      await open(p, w, h);
      // earned legacy title currently equipped: marked, with an unequip button
      assert.equal(await eq(p, "tour1").getAttribute("data-equip-state"), "on");
      assert.match(await eq(p, "tour1").innerText(), /装備中/);
      assert(await eq(p, "tour1").getByRole("button", { name: /はずす/ }).isEnabled());
      // header reflects both slots
      assert.match(await p.locator(".next-equipped").innerText(), /装備中称号：/);
      // a locked title cannot be equipped and says why
      const locked = eq(p, "normal_master");
      assert.equal(await locked.getAttribute("data-equip-state"), "disabled");
      assert(await locked.getByRole("button", { name: /装備する/ }).isDisabled());
      assert.match(await locked.innerText(), /未取得のため装備できません/);
      // earned by the new system but with no existing equip process: disabled, and the reason is NOT "not earned"
      assert.equal(await eq(p, "easy_master").getAttribute("data-equip-state"), "disabled");
      assert.match(await eq(p, "easy_master").innerText(), /現在の装備機能に対応していません/);
      assert.doesNotMatch(await eq(p, "easy_master").innerText(), /未取得のため/);
      assert(await eq(p, "easy_master").getByRole("button", { name: /装備する/ }).isDisabled());
      // rated-equipped (profile.title) is marked and cannot be cleared
      assert.equal(await eq(p, "easy_adept").getAttribute("data-equip-state"), "on");
      assert.equal(await eq(p, "easy_adept").getByRole("button").count(), 0, "rated title has no clear button (the existing command cannot clear)");
      assert.match(await eq(p, "easy_adept").innerText(), /解除はできません/);
      // 44px targets
      const boxes = await p.locator(".next-title-equip-btn:not([disabled])").evaluateAll((es) => es.map((e) => { const r = e.getBoundingClientRect(); return { h: r.height, w: r.width, x: r.x, r: r.right }; }));
      assert(boxes.length >= 1 && boxes.every((x) => x.h >= 44 && x.x >= 0 && x.r <= w + 1), "equip buttons >=44px and inside the viewport");
      assert(await p.evaluate((w) => document.documentElement.scrollWidth <= w + 1, w), "no horizontal scroll");
      // unequip the nick: saved to the existing location, shown only after success
      await eq(p, "tour1").getByRole("button", { name: /はずす/ }).click();
      await eq(p, "tour1").locator('[data-equip-status="saved"]').waitFor();
      assert.equal(tree.games.factor.accounts.ateacher.stats.nick, undefined, "stats/nick cleared exactly like the old modal (set null)");
      assert.equal(await eq(p, "tour1").getAttribute("data-equip-state"), "off");
      // equip it again (switch back) -> same location/format
      await eq(p, "tour1").getByRole("button", { name: /装備する/ }).click();
      await eq(p, "tour1").locator('[data-equip-status="saved"]').waitFor();
      assert.equal(tree.games.factor.accounts.ateacher.stats.nick, "tour1");
      // the profile header reflects it immediately
      assert.match(await p.locator(".next-equipped").innerText(), /装備中称号：/);
      // equip a second earned legacy title -> switches (only one nick at a time)
      const other = p.locator('[data-equip-state="off"] .next-title-equip-btn:not([disabled])').first();
      const otherId = await other.evaluate((e) => e.closest("[data-title-equip]").getAttribute("data-title-equip"));
      const route = await eq(p, otherId).evaluate((e) => e.dataset.titleEquip);
      if (otherId !== "tour1") {
        await other.click();
        await eq(p, otherId).locator('[data-equip-status="saved"]').waitFor();
        assert.equal(await eq(p, otherId).getAttribute("data-equip-state"), "on");
        const nick = tree.games.factor.accounts.ateacher.stats.nick, prof = tree.games.factor.onlineSparkV1.profiles.ateacher.title;
        assert(nick === otherId || prof === otherId, "saved to one of the two existing locations");
      }
      // reload: the saved equip is shown again
      const equippedNow = tree.games.factor.accounts.ateacher.stats.nick;
      await p.reload();
      await open(p);
      if (equippedNow) assert.equal(await eq(p, equippedNow).getAttribute("data-equip-state"), "on", "equipped title survives a reload");
      if (SHOT) { await p.getByRole("button", { name: "取得済み", exact: true }).click(); await p.locator("[data-title-inventory]").scrollIntoViewIfNeeded(); await p.locator("[data-title-inventory] h3").scrollIntoViewIfNeeded(); await p.screenshot({ path: `${SHOT}/equip-${w}x${h}.png` }); }
      assert.deepEqual(t.errors, []);
      await t.ctx.close();
    }
    // ---- rated title route: switch profile.title through the existing equipTitle command ----
    {
      const tree = mkTree();
      tree.games.factor.onlineSparkV1.profiles.ateacher.badges = { easy_adept: true, easy_master: true };
      const t = await context(b, { tree }), p = t.page;
      await open(p, 390, 844);
      assert.equal(await eq(p, "easy_master").getAttribute("data-equip-state"), "off");
      await eq(p, "easy_master").getByRole("button", { name: /装備する/ }).click();
      await eq(p, "easy_master").locator('[data-equip-status="saved"]').waitFor({ timeout: 15000 });
      assert.equal(tree.games.factor.onlineSparkV1.profiles.ateacher.title, "easy_master", "profile.title saved by the existing equipTitle command");
      assert.equal(await eq(p, "easy_master").getAttribute("data-equip-state"), "on");
      assert.equal(await eq(p, "easy_adept").getAttribute("data-equip-state"), "off", "previous ranking title is no longer marked");
      assert.equal(tree.games.factor.accounts.ateacher.stats.nick, "tour1", "the nick slot is untouched by a ranking-title change");
      assert.equal(await eq(p, "easy_adept").getByRole("button", { name: /装備する/ }).isEnabled(), true, "can switch back");
      await p.reload();
      await open(p);
      assert.equal(await eq(p, "easy_master").getAttribute("data-equip-state"), "on", "ranking title survives a reload");
      await t.ctx.close();
    }
    // ---- rated title: a failed save never looks equipped ----
    {
      let failing = true;
      const tree = mkTree();
      tree.games.factor.onlineSparkV1.profiles.ateacher.badges = { easy_adept: true, easy_master: true };
      const t = await context(b, { tree, onOperation: async (op) => { if (failing && /onlineSparkV1\/profiles\/ateacher/.test(op.path)) throw new Error("mock network failure"); } }), p = t.page;
      await open(p, 390, 844);
      await eq(p, "easy_master").getByRole("button", { name: /装備する/ }).click();
      await eq(p, "easy_master").locator('[data-equip-status="failed"]').waitFor({ timeout: 20000 });
      assert.equal(await eq(p, "easy_master").getAttribute("data-equip-state"), "off", "failed ranking-title save is not shown as equipped");
      assert.equal(tree.games.factor.onlineSparkV1.profiles.ateacher.title, "easy_adept");
      failing = false;
      await eq(p, "easy_master").getByRole("button", { name: /装備する/ }).click();
      await eq(p, "easy_master").locator('[data-equip-status="saved"]').waitFor({ timeout: 20000 });
      await t.ctx.close();
    }
    // ---- save failure: nothing looks equipped, error + retry ----
    {
      let failing = true;
      const tree = mkTree();
      const t = await context(b, { tree, onOperation: async (op) => { if (failing && /stats\/nick/.test(op.path)) throw new Error("mock permission denied"); } }), p = t.page;
      await open(p, 390, 844);
      await eq(p, "tour1").getByRole("button", { name: /はずす/ }).click();
      await eq(p, "tour1").locator('[data-equip-status="failed"]').waitFor();
      assert.match(await eq(p, "tour1").innerText(), /保存できませんでした/);
      if (SHOT) { await eq(p, "tour1").scrollIntoViewIfNeeded(); await p.screenshot({ path: `${SHOT}/equip-failed-390.png` }); }
      assert.equal(await eq(p, "tour1").getAttribute("data-equip-state"), "on", "a failed unequip does not look successful: still equipped");
      assert.equal(tree.games.factor.accounts.ateacher.stats.nick, "tour1", "stored value untouched");
      failing = false;
      await eq(p, "tour1").getByRole("button", { name: /はずす/ }).click();
      await eq(p, "tour1").locator('[data-equip-status="saved"]').waitFor();
      assert.equal(await eq(p, "tour1").getAttribute("data-equip-state"), "off");
      if (SHOT) { await eq(p, "tour1").scrollIntoViewIfNeeded(); await p.screenshot({ path: `${SHOT}/equip-retry-390.png` }); }
      await t.ctx.close();
    }
    // ---- slow network: saving is shown, buttons are locked, success only when it really finishes ----
    {
      let delay = 7500;
      const tree = mkTree();
      const t = await context(b, { tree, onOperation: async (op) => { if (delay && /stats\/nick/.test(op.path)) await sleep(delay); } }), p = t.page;
      await open(p, 390, 844);
      await eq(p, "tour1").getByRole("button", { name: /はずす/ }).click();
      await eq(p, "tour1").locator('[data-equip-status="saving"]').waitFor();
      assert.equal(await eq(p, "tour1").getAttribute("data-equip-state"), "on", "not shown as changed while saving");
      assert(await p.locator(".next-title-equip-btn").evaluateAll((es) => es.every((e) => e.disabled)), "all equip buttons are locked while saving (no out-of-order saves)");
      await p.getByText(/通信が遅れています/).waitFor({ timeout: 9000 });
      await eq(p, "tour1").locator('[data-equip-status="saved"]').waitFor({ timeout: 9000 });
      assert.equal(await eq(p, "tour1").getAttribute("data-equip-state"), "off");
      await t.ctx.close();
    }
    // ---- guest: nothing is equippable ----
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
    console.log("PASS title equip in the new profile: equip/unequip/switch, locked titles, rated title, failure+retry, slow network, reload, guest, 390/1440");
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
