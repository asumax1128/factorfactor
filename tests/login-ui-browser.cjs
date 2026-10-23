// Ver.6.15 login screen: dark navy UI (presentation only). The behaviour stays the same: login, new registration, guest play and the
// carry-over of guest records (migrateGuest) are exercised here against the Firebase mock.
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { chromium, context, sleep } = require("./browser-harness.cjs");
async function layout(p, width) {
  return p.evaluate(() => {
    const gate = document.querySelector("[data-login-gate]"), lum = (c) => { const m = c.match(/[\d.]+/g).map(Number); return (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) / 255; };
    const inputs = [...gate.querySelectorAll("input")].map((e) => ({ fs: parseFloat(getComputedStyle(e).fontSize), h: e.getBoundingClientRect().height, color: lum(getComputedStyle(e).color), bg: lum(getComputedStyle(e).backgroundColor) }));
    const buttons = [...gate.querySelectorAll("button")].map((e) => { const r = e.getBoundingClientRect(); return { t: e.textContent.trim().slice(0, 12), h: r.height, x: r.x, right: r.right, over: e.scrollWidth > e.clientWidth + 1 }; });
    const logo = gate.querySelector("img.lg-logo");
    return { bg: lum(getComputedStyle(gate).backgroundColor), inputs, buttons, logo: logo && [logo.getAttribute("src"), logo.naturalWidth], sw: document.documentElement.scrollWidth, iw: innerWidth };
  });
}
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium" });
  try {
    for (const width of [375, 390, 430]) {
      const t = await context(b, { account: null }), p = t.page; await p.setViewportSize({ width, height: 800 });
      await p.locator("[data-login-gate]").waitFor(); await p.getByPlaceholder("名前（10文字まで）").waitFor();
      const l = await layout(p, width);
      assert(l.bg < 0.15, "dark navy background " + l.bg);
      assert.equal(l.logo[0], "ui-next/logo-login.webp"); assert(l.logo[1] > 0, "official logo copy loaded");
      for (const i of l.inputs) { assert(i.fs >= 16, "input font-size >= 16px (no iOS zoom) " + i.fs); assert(i.h >= 44); assert(i.color > 0.8 && i.bg < 0.15, "readable input colours"); }
      assert.equal(l.inputs.length, 2);
      assert.deepEqual(l.buttons.map((x) => x.t), ["ログイン", "新しく登録", "ゲストで遊ぶ（記録はこの", "接続チェック"]);
      for (const x of l.buttons) { assert(x.h >= 44, "tap target " + x.t + " " + x.h); assert(x.x >= 0 && x.right <= width, "button inside viewport " + x.t); assert(!x.over, "button text fits " + x.t); }
      assert(l.sw <= l.iw, "no horizontal scroll " + width);
      assert.equal(await p.getByRole("button", { name: "接続チェック" }).count(), 1);
      // the 接続チェック dialog is dark as well
      await p.getByRole("button", { name: "接続チェック" }).click(); await p.locator(".cc-dark").waitFor();
      assert((await p.evaluate(() => { const m = getComputedStyle(document.querySelector(".cc-dark")).backgroundColor.match(/[\d.]+/g).map(Number); return (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) / 255; })) < 0.2);
      await p.getByRole("button", { name: "とじる" }).click();
      assert.deepEqual(t.errors, []); await t.ctx.close();
    }
    console.log("PASS login screen: dark navy, official logo, 16px inputs, 44px+ buttons, readable colours, 接続チェック, no sideways scroll at 375/390/430");
    // keyboard-sized window: every control stays reachable by scrolling
    {
      const t = await context(b, { account: null }), p = t.page; await p.setViewportSize({ width: 390, height: 330 });
      await p.locator("[data-login-gate]").waitFor(); await p.getByPlaceholder("合言葉（4桁の数字）").focus();
      for (const name of ["ログイン", "新しく登録"]) { const btn = p.getByRole("button", { name, exact: true }); await btn.scrollIntoViewIfNeeded(); const r = await btn.boundingBox(); assert(r && r.y >= 0 && r.y + r.height <= 330, name + " reachable with the keyboard up"); }
      const g = p.getByRole("button", { name: /^ゲストで遊ぶ/ }); await g.scrollIntoViewIfNeeded(); const r = await g.boundingBox(); assert(r.y >= 0 && r.y + r.height <= 330, "guest button reachable");
      assert.deepEqual(t.errors, []); await t.ctx.close();
      console.log("PASS login screen with a keyboard-sized window: all buttons reachable");
    }
    // guest play: same call as before (saves the name locally, no account writes)
    {
      const t = await context(b, { account: null }), p = t.page;
      await p.getByPlaceholder("名前（10文字まで）").fill("ゲストさん");
      await p.getByRole("button", { name: /^ゲストで遊ぶ/ }).click(); await p.locator(".action-card.solo").waitFor();
      assert.equal(await p.evaluate(() => JSON.parse(localStorage.getItem("fxf_battle_name_v1"))), "ゲストさん");
      assert.deepEqual(await p.evaluate(() => JSON.parse(localStorage.getItem("fxf_battle_account_v1"))), { guest: true, name: "ゲストさん" }, "guest session only (no account key)");
      assert.deepEqual(t.writes.filter((w) => /accounts|logins/.test(w.path)), [], "guest play writes no account data");
      assert.deepEqual(t.errors, []); await t.ctx.close();
      console.log("PASS guest play unchanged");
    }
    // login of an existing account + carry-over of the guest record (migrateGuest): exp is added, every other stat is untouched
    {
      const name = "Existing", key = "a" + Array.from(name).map((c) => c.codePointAt(0).toString(36)).join("_");
      const stats = { games: 4, w: 2, l: 2, rating: 1550, exp: 200, season: "2026-10" };
      const tree = { games: { factor: { accounts: { [key]: { name, stats: JSON.parse(JSON.stringify(stats)) } }, pins: { [key]: "1234" } } } };
      const t = await context(b, { account: null, tree, uid: "existing-uid" }), p = t.page;
      await p.evaluate(() => localStorage.setItem("fxf_guest_stats_v1", JSON.stringify({ exp: 50 })));
      await p.reload(); await p.locator("[data-login-gate]").waitFor();
      await p.getByPlaceholder("名前（10文字まで）").fill(name); await p.getByPlaceholder("合言葉（4桁の数字）").fill("1234");
      await p.getByRole("button", { name: "ログイン", exact: true }).click(); await p.locator(".action-card.solo").waitFor();
      assert.equal(await p.evaluate(() => JSON.parse(localStorage.getItem("fxf_battle_account_v1")).key), key, "logged in as the existing account");
      for (let i = 0; i < 40 && t.tree.games.factor.accounts[key].stats.exp !== 250; i++) await sleep(100);
      const after = t.tree.games.factor.accounts[key].stats, { exp, ...rest } = after, { exp: _e, ...before } = stats;
      assert.equal(exp, 250, "guest exp 50 carried over onto 200");
      for (const k of Object.keys(before)) assert.equal(rest[k], before[k], "stat untouched: " + k);
      assert.deepEqual(await p.evaluate(() => JSON.parse(localStorage.getItem("fxf_guest_stats_v1") || "{}")), {}, "guest record cleared after the carry-over");
      assert.deepEqual(t.errors, []); await t.ctx.close();
      console.log("PASS existing account login and guest-record carry-over unchanged");
    }
    // new registration creates the account through the unchanged acctLogin(create) path
    {
      const t = await context(b, { account: null, tree: { games: { factor: { accounts: {} } } } }), p = t.page;
      await p.getByPlaceholder("名前（10文字まで）").fill("しんき"); await p.getByPlaceholder("合言葉（4桁の数字）").fill("4321");
      await p.getByRole("button", { name: "新しく登録", exact: true }).click(); await p.locator(".action-card.solo").waitFor();
      const acct = await p.evaluate(() => JSON.parse(localStorage.getItem("fxf_battle_account_v1")));
      assert.equal(acct.name, "しんき"); assert(acct.key, "account key stored");
      assert.equal(t.tree.games.factor.accounts[acct.key].name, "しんき", "account record created");
      assert.deepEqual(t.errors, []); await t.ctx.close();
      console.log("PASS new registration unchanged");
    }
    // wrong passphrase shows the existing message in the new error style, and nothing is logged in
    {
      const t = await context(b, { account: null, tree: { games: { factor: { accounts: {} } } } }), p = t.page;
      await p.getByPlaceholder("名前（10文字まで）").fill("みとうろく"); await p.getByPlaceholder("合言葉（4桁の数字）").fill("1111");
      await p.getByRole("button", { name: "ログイン", exact: true }).click(); await p.getByRole("alert").waitFor();
      assert.match(await p.getByRole("alert").innerText(), /見つかりません|登録|合言葉|名前/);
      assert.equal(await p.evaluate(() => localStorage.getItem("fxf_battle_account_v1")), null);
      assert.deepEqual(t.errors, []); await t.ctx.close();
      console.log("PASS login failure message shown, nobody logged in");
    }
    await sleep(0);
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
