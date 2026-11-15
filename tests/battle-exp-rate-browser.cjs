// Ver.6.37 (bounty removal 4/4): BattleGame and fetchRatings lost their bounty lines (re-pinned; see tests/legacy-regression.cjs).
// This test plays the same real two-player room match (mode A, EASY, mock Firebase, the real BattleGame / recordMatch) on the page
// of the previous version and on the current page, and compares what the match saved for both players: EXP, rating, wins /
// losses / games, streaks and the per-opponent record. The guest is on a 5-win streak, which would have carried a bounty before
// the bounty system was removed: neither page adds anything for it, and nothing is written to bountyWins / bountyExp.
const assert = require("node:assert/strict"), cp = require("node:child_process"), fs = require("node:fs");
const { chromium, context, drag } = require("./browser-harness.cjs");
// The published version right before this change (Ver.6.36). Fixed on purpose: the comparison must not move with main.
const OLD_COMMIT = process.env.BATTLE_BASE || "0374d33882a31285b973a7227fdd319a48989cab";
const KEYS = ["exp", "rating", "maxRating", "games", "w", "l", "d", "streak", "maxStreak", "perfects", "bountyWins", "bountyExp", "A", "B", "vs"];
const pick = (st) => Object.fromEntries(KEYS.filter((k) => st && st[k] !== undefined).map((k) => [k, st[k]]));
async function play(b, html) {
  const peers = [], tree = { games: { factor: {
    teachers: { ah: { name: "Host" } },
    accounts: { ah: { name: "Host", stats: { exp: 500, rating: 1500, games: 4, w: 2, l: 2, streak: 0, maxStreak: 2 } }, ag: { name: "Guest", stats: { exp: 700, rating: 1560, games: 9, w: 7, l: 2, streak: 5, maxStreak: 5 } } },
  } } };
  const opt = (uid, key, name) => ({ tree, peers, uid, account: { key, name }, ...(html ? { assetOverrides: { "/": html } } : {}) });
  const h = await context(b, opt("host", "ah", "Host")), g = await context(b, opt("guest", "ag", "Guest"));
  try {
    for (const t of [h, g]) await t.page.getByRole("button", { name: "オンライン対戦（ロビー）", exact: true }).click();
    await h.page.getByRole("button", { name: "部屋を作る（ホスト）", exact: true }).click();
    await h.page.waitForFunction(() => /^[0-9]{4}$/.test(document.querySelector(".tracking-widest")?.textContent.trim() || ""));
    const code = (await h.page.locator(".tracking-widest").innerText()).trim();
    await g.page.getByPlaceholder("部屋コード4桁").fill(code);
    await g.page.getByRole("button", { name: "参加", exact: true }).click();
    await g.page.getByText("部屋コード", { exact: true }).waitFor();
    await h.page.getByRole("button", { name: /^A：早い者勝ち/ }).click();
    await h.page.waitForFunction((c) => true, code);
    await h.page.getByRole("button", { name: /対戦スタート/ }).click();
    await h.page.locator("[data-btile]").first().waitFor({ timeout: 30000 });
    // the host answers every question until the match is decided; the guest does nothing
    for (let i = 0; i < 40; i++) {
      if (tree.games.factor.accounts.ah.stats.games === 5) break;
      try { await h.page.locator("[data-poly]").waitFor({ timeout: 4000 }); await drag(h.page); } catch (e) { /* between questions or finished */ }
    }
    await h.page.waitForFunction(() => true);
    for (let i = 0; i < 60 && !(tree.games.factor.accounts.ah.stats.games === 5 && tree.games.factor.accounts.ag.stats.games === 10); i++) await h.page.waitForTimeout(250);
    assert.equal(tree.games.factor.accounts.ah.stats.games, 5, "the host's match was recorded");
    assert.equal(tree.games.factor.accounts.ag.stats.games, 10, "the guest's match was recorded");
    const out = { host: pick(tree.games.factor.accounts.ah.stats), guest: pick(tree.games.factor.accounts.ag.stats) };
    out.bountyWrites = [...h.writes, ...g.writes].filter((x) => /bounty/i.test(x.path) || JSON.stringify(x.v ?? x.value ?? "").includes("bounty")).length;
    out.errors = [...h.errors, ...g.errors];
    out.hostText = await h.page.locator("body").innerText();
    return out;
  } finally { await h.ctx.close(); await g.ctx.close(); }
}
(async () => {
  const oldHtml = cp.execFileSync("git", ["show", OLD_COMMIT + ":index.html"], { encoding: "utf8", maxBuffer: 30e6 });
  assert(/\bbountyGot\b/.test(oldHtml), "the previous page still has the bounty lines inside BattleGame");
  assert(!/\bbountyGot\b/.test(fs.readFileSync("index.html", "utf8")), "the current page has none");
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium" });
  try {
    const before = await play(b, oldHtml), after = await play(b, null);
    for (const r of [before, after]) {
      assert.deepEqual(r.errors, []);
      assert.equal(r.host.w, 3, "the host won"); assert.equal(r.guest.l, 3, "the guest lost");
      assert.equal(r.host.bountyWins, undefined); assert.equal(r.host.bountyExp, undefined);
      assert.equal(r.bountyWrites, 0, "nothing about bounties is written");
      assert.doesNotMatch(r.hostText, /懸賞金|賞金首/);
    }
    const strip = ({ hostText, errors, ...x }) => x;
    assert.deepEqual(strip(after), strip(before), "EXP, rating and the match result are exactly as before");
    const gain = after.host.exp - 500;
    assert(gain >= 30 && gain <= 40, "the host's EXP is the win base 30 plus at most 10 for Perfects, no bounty: " + gain);
    console.log(`PASS same room match on the previous and the current page: identical EXP (+${gain} / +${after.guest.exp - 700}), rating (${before.host.rating} / ${before.guest.rating}), results and streaks; no bounty bonus or record`);
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
