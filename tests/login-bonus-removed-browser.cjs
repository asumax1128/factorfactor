// Ver.6.38 (login bonus removal 1/2): the login bonus modal and its claim (claimLogin) are removed. Login, new registration and
// the passphrase check are unchanged (acctLogin and the AccountGate logic stay pinned in tests/legacy-regression.cjs).
// Every case runs WITHOUT the test-only flag that used to hide the modal (fxf_no_lb), on the page before the removal (as a
// self-check: there the modal does appear and stats.login is written) and on the current page (nothing appears, nothing written).
const assert = require("node:assert/strict"), cp = require("node:child_process"), fs = require("node:fs");
const { chromium, context, sleep } = require("./browser-harness.cjs");
// The published version right before this change (Ver.6.37). Fixed on purpose: the comparison must not move with main.
const OLD_COMMIT = process.env.LOGIN_BASE || "1debf7a2441dc364d0eea57cc5d34fc32655b282";
const keyOf = (name) => "a" + Array.from(name).map((c) => c.codePointAt(0).toString(36)).join("_");
async function open(b, old, opt) {
  const t = await context(b, { account: null, ...opt, ...(old ? { assetOverrides: old } : {}) });
  await t.ctx.addInitScript(() => localStorage.removeItem("fxf_no_lb"));   // show the modal if the page has one
  await t.page.reload(); await t.page.locator("[data-login-gate]").waitFor();
  return t;
}
// after login: wait for the home, give a bonus modal time to appear (it used to open 0.5 s after the home)
async function home(t) {
  await t.page.locator(".action-card.solo").waitFor();
  await sleep(1500);
  return { modal: await t.page.getByText("ログインボーナス", { exact: true }).count(), loginWrites: t.writes.filter((x) => /\/stats\/login(\/|$)|\/stats$/.test(x.path) && JSON.stringify(x.v ?? x.value ?? "").includes('"login"') || /\/stats\/login/.test(x.path)).length, guestLb: await t.page.evaluate(() => localStorage.getItem("fxf_login_v1")) };
}
async function run(b, html) {
  const out = {};
  // 1. existing account, right passphrase
  {
    const name = "Existing", key = keyOf(name);
    const stats = { games: 4, w: 2, l: 2, rating: 1550, exp: 200, login: { last: "2026-01-01", n: 12, c: 5, cards: 1 } };
    const tree = { games: { factor: { accounts: { [key]: { name, stats: JSON.parse(JSON.stringify(stats)) } }, pins: { [key]: "1234" } } } };
    const t = await open(b, html, { tree, uid: "existing-uid" }), p = t.page;
    await p.getByPlaceholder("名前（10文字まで）").fill(name); await p.getByPlaceholder("合言葉（4桁の数字）").fill("1234");
    await p.getByRole("button", { name: "ログイン", exact: true }).click();
    const h = await home(t);
    if (h.modal) { await p.getByRole("button", { name: "スタンプを押す", exact: true }).click(); await sleep(800); }
    out.existing = { ...h, key: await p.evaluate(() => JSON.parse(localStorage.getItem("fxf_battle_account_v1")).key), login: t.tree.games.factor.accounts[key].stats.login, exp: t.tree.games.factor.accounts[key].stats.exp, errors: t.errors };
    await t.ctx.close();
  }
  // 2. new registration
  {
    const t = await open(b, html, { tree: { games: { factor: { accounts: {} } } } }), p = t.page;
    await p.getByPlaceholder("名前（10文字まで）").fill("しんき"); await p.getByPlaceholder("合言葉（4桁の数字）").fill("4321");
    await p.getByRole("button", { name: "新しく登録", exact: true }).click();
    const h = await home(t);
    const acct = await p.evaluate(() => JSON.parse(localStorage.getItem("fxf_battle_account_v1")));
    out.created = { ...h, name: acct.name, record: t.tree.games.factor.accounts[acct.key]?.name, login: t.tree.games.factor.accounts[acct.key]?.stats?.login, errors: t.errors };
    await t.ctx.close();
  }
  // 3. a name that is not registered (the same check the login-ui test uses): refused with the message, nobody logged in
  {
    const t = await open(b, html, { tree: { games: { factor: { accounts: {} } } } }), p = t.page;
    await p.getByPlaceholder("名前（10文字まで）").fill("みとうろく"); await p.getByPlaceholder("合言葉（4桁の数字）").fill("1111");
    await p.getByRole("button", { name: "ログイン", exact: true }).click(); await p.getByRole("alert").waitFor();
    out.wrong = { alert: await p.getByRole("alert").innerText(), stored: await p.evaluate(() => localStorage.getItem("fxf_battle_account_v1")), errors: t.errors };
    await t.ctx.close();
  }
  return out;
}
(async () => {
  const src = fs.readFileSync("index.html", "utf8");
  for (const name of ["function claimLogin", "function LoginBonus", "LB_REWARDS", "fxf_login_v1", "title=\"ログインボーナス\"", "スタンプを押す"]) assert(!src.includes(name), "removed from the page: " + name);
  assert(!fs.readFileSync("src/next-home-ui.jsx", "utf8").includes("LoginBonus"), "the home no longer shows it");
  // the previous page = its index.html and its home bundle (the bundle is what put the modal on the home)
  const show = (f) => cp.execFileSync("git", ["show", OLD_COMMIT + ":" + f], { encoding: "utf8", maxBuffer: 30e6 });
  const oldHtml = { "/": show("index.html"), "/next-home-ui.js": show("next-home-ui.js") };
  assert(oldHtml["/"].includes("async function claimLogin") && oldHtml["/next-home-ui.js"].includes("LoginBonus"), "the previous page still has the login bonus");
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium" });
  try {
    const before = await run(b, oldHtml), after = await run(b, null);
    // self-check on the previous page: without the test flag the modal appears and the claim writes stats.login
    assert.equal(before.existing.modal, 1, "self-check: the old page shows the login bonus");
    assert.notDeepEqual(before.existing.login, { last: "2026-01-01", n: 12, c: 5, cards: 1 }, "self-check: the old claim writes stats.login");
    // current page: the same three flows behave the same, without the bonus
    for (const [k, r] of Object.entries(after)) assert.deepEqual(r.errors, [], "no page error: " + k);
    assert.equal(after.existing.key, before.existing.key, "the existing account logs in to the same account");
    assert.equal(after.existing.modal, 0, "no login bonus after login");
    assert.deepEqual(after.existing.login, { last: "2026-01-01", n: 12, c: 5, cards: 1 }, "stats.login is not written (the saved record stays)");
    assert.equal(after.existing.loginWrites, 0, "no write to stats.login");
    assert.equal(after.existing.exp, 200, "no login-bonus EXP");
    assert.deepEqual([after.created.name, after.created.record, after.created.modal, after.created.login, after.created.loginWrites], [before.created.name, before.created.record, 0, undefined, 0], "new registration: the same account is created; no bonus, no stats.login");
    assert.equal(after.created.guestLb, null, "nothing stored for the bonus on the device");
    assert.equal(after.wrong.alert, before.wrong.alert, "the same message for a refused login");
    assert.equal(after.wrong.stored, null, "nobody is logged in after a refused login");
    console.log("PASS login / new registration / refused login work as before; no login bonus modal, no stats.login write, no bonus EXP (old page self-check: the modal did appear)");
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
