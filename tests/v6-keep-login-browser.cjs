// Ver.6.0 A1b in the real page (mock Firebase): the freeze right after login, and what must NOT be written.
const assert = require("node:assert/strict");
const { chromium, context, sleep } = require("./browser-harness.cjs");
const STATS = "games/factor/accounts/ateacher/stats";
const isStatsWrite = (op) => op.path === STATS || op.path.startsWith(STATS + "/");
const holder = () => ({ rating: 1600, exp: 900, games: 40, w: 25, l: 12, d: 3, A: { w: 12, l: 4, d: 1 }, B: { w: 13, l: 8, d: 2 }, maxStreak: 31, handiWins: 1, nick: "streak10", vs: { ax: { w: 3, l: 1 } } });
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium" });
  const open = async (opts) => { const t = await context(b, { keepLogin: true, ...opts }); await t.page.setViewportSize({ width: 390, height: 844 }); await sleep(2500); return t; };
  try {
    // 1. existing player, no protection record yet: frozen once, nothing else changes
    {
      const stats = holder(), before = JSON.parse(JSON.stringify(stats));
      const tree = { games: { factor: { accounts: { ateacher: { name: "Teacher", stats } } } } };
      const t = await open({ tree });
      assert.deepEqual(await t.page.evaluate(() => [typeof window.TitleKeepNext.ensureKeep, typeof window.TitleKeepNext.freezeOnLogin, typeof window.FXF_KEEP_DIAG.note]), ["function", "function", "function"], "the bundle publishes the keep module and the diagnostics exist");
      const s = tree.games.factor.accounts.ateacher.stats;
      assert.equal(s.tk.v, 1); assert.deepEqual(s.tk.ids, { handi: 1, streak10: 1, streak30: 1 });
      assert.deepEqual(s.tv2.base, { games: 40, Aw: 12, Bw: 13 });
      const { tk, tv2, ...rest } = s; assert.deepEqual(rest, before, "old stats and the equipped title are untouched");
      assert.equal(t.writes.filter(isStatsWrite).length, 1, "exactly one stats write");
      assert.deepEqual(await t.page.evaluate(() => Object.keys(window.FXF_KEEP_DIAG.counts)), [], "no diagnostics on the happy path");
      assert.deepEqual(t.errors, []);
      await t.ctx.close();
      console.log("PASS login freezes tk/tv2 once; old stats and equipment untouched; no diagnostics");
    }
    // 2. already protected: no stats write at all
    {
      const stats = holder(); stats.tk = { v: 1, at: 5, ids: { handi: 1 } }; stats.tv2 = { v: 1, since: 5, base: { games: 1, Aw: 1, Bw: 1 } };
      const tree = { games: { factor: { accounts: { ateacher: { name: "Teacher", stats } } } } };
      const t = await open({ tree });
      assert.equal(t.writes.filter(isStatsWrite).length, 0);
      assert.deepEqual(tree.games.factor.accounts.ateacher.stats.tk, { v: 1, at: 5, ids: { handi: 1 } }, "a valid tk is never rewritten");
      await t.ctx.close();
      console.log("PASS a valid tk means no write");
    }
    // 3. guest and an account without stats: no stats write
    {
      const t = await open({ tree: { games: { factor: { accounts: {} } } }, account: { guest: true, name: "Guest" } });
      assert.equal(t.writes.filter(isStatsWrite).length, 0);
      await t.ctx.close();
      const t2 = await open({ tree: { games: { factor: { accounts: { ateacher: { name: "Teacher" } } } } } });
      assert.equal(t2.writes.filter(isStatsWrite).length, 0, "no stats yet: the first stats transaction freezes later");
      assert.deepEqual(t2.errors, []);
      await t2.ctx.close();
      console.log("PASS guests and empty stats are not written");
    }
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
