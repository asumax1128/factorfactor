const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("fs"),
  vm = require("vm");
const G = require("../src/ghost-model.cjs");
test("exact six intrusion bands and deterministic boundary samples", () => {
  const counts = {};
  for (let i = 0; i < 10000; i++) {
    const k = G.category((i + 0.5) / 10000);
    counts[k] = (counts[k] || 0) + 1;
  }
  assert.deepEqual(counts, {
    up2: 500,
    up1: 1500,
    same: 5500,
    down1: 1000,
    bot: 1000,
    hyper: 500,
  });
});
test("hyper shortens base 25%, preserves miss and special rates; sparse and abnormal levels bounded", () => {
  const p = {
    lv: {
      L1: { n: 20, ok: 16, ms: 160000 },
      L2: { n: 20, ok: 18, ms: 72000 },
      L9: { n: 4, ok: 3, ms: 1e9 },
    },
  };
  const a = G.profile(p, { spGames: 4, bGames: 10 }),
    b = G.profile(p, { spGames: 4, bGames: 10 }, true);
  assert.equal(b.t.L1, 7.5);
  assert.equal(b.t.L2, 3);
  assert.deepEqual(a.miss, b.miss);
  assert.equal(b.sp, 0.4);
  for (let i = 1; i <= 9; i++)
    assert.ok(b.t["L" + i] >= 0.75 && b.t["L" + i] <= 13.5);
});
test("missing rank falls back to real candidate with actual rank; no candidate is honestly labelled BOT", () => {
  const a = {
    name: "Real",
    prof: { lv: { L1: { n: 20, ok: 20, ms: 20000 } } },
    stats: { rating: 1500 },
  };
  const opts = {
    accounts: { ab: a },
    key: "aa",
    difficulty: "easy",
    rating: 1800,
    random: () => 0.01,
    bot: () => ({ name: "CPU", rt: 1500 }),
  };
  const p = G.select(opts);
  assert.equal(p.key, "ab");
  assert.equal(p.rankDifference, -4);
  assert.equal(p.type, "ghost");
  const b = G.select({ ...opts, accounts: {} });
  assert.equal(b.type, "bot");
  assert.equal(b.key, undefined);
});
test("ghost Elo uses one-third human change with identical early loss handling, directed remains unrated", () => {
  assert.equal(G.ratingAfter(1500, 1500, "win", 20), 1505.3);
  assert.equal(G.ratingAfter(1500, 1500, "lose", 20), 1494.7);
  assert.equal(G.ratingAfter(1500, 1500, "lose", 0), 1497.3);
  assert.equal(G.ratingAfter(1800, 1500, "lose", 0, false), 1800);
});
test("permanent ghost titles use actual opponent and origin; bots do not award rank titles", () => {
  const had = G.titles({ type: "hyper", rankDifference: 2 }, "win", "quick");
  assert.deepEqual(had, { hyper_slayer: true, ghost_up2: true });
  assert.deepEqual(
    G.titles({ type: "bot", rankDifference: 2 }, "win", "quick"),
    {},
  );
  assert.deepEqual(
    G.titles({ type: "ghost", rankDifference: 1 }, "win", "bounty"),
    {},
  );
  assert.deepEqual(
    G.titles({ type: "ghost", rankDifference: 0 }, "lose", "quick", had),
    had,
  );
});
const source = fs.readFileSync("index.html", "utf8");
const apply = vm.runInNewContext(
  "(" + source.match(/function applyLearn\(p, rec\) \{[\s\S]*?\n\}/)[0] + ")",
  { Date, Number, Math },
);
test("fastest updates on correct complete sane samples only without changing old n/ok/ms totals", () => {
  const x = apply({ lv: { L1: { n: 4, ok: 2, ms: 7000 } } }, [
    { lv: 1, ok: true, ms: 1234 },
    { lv: 1, ok: false, ms: 100 },
    { lv: 1, ok: true, ms: 90 },
    { lv: 1, ok: true, ms: 900, late: true },
    { lv: 1, ok: true, ms: 800, timeout: true },
    { lv: 1, ok: true, ms: 40000 },
  ]);
  assert.equal(x.lv.L1.bestMs, 1234);
  assert.equal(x.lv.L1.n, 10);
  assert.equal(x.lv.L1.ok, 7);
  assert.equal(x.lv.L1.ms, 50024);
  assert.equal(apply(x, [{ lv: 1, ok: true, ms: 1800 }]).lv.L1.bestMs, 1234);
  assert.equal(apply(x, [{ lv: 1, ok: true, ms: 1000 }]).lv.L1.bestMs, 1000);
  assert.equal(x.lv.L2, undefined);
});
const E = require("../server/online-rated/engine.cjs");
for (const mode of ["A", "B"])
  test(
    "real " +
      mode +
      " engine ghost finishes, retries are deterministic, and inputs are not duplicated",
    () => {
      const start = Date.UTC(2026, 9, 13);
      let m = {
        phase: "play",
        mode,
        game: E.begin("g", "easy", mode, ["u", "_ghost"], "test", start),
        opponent: {
          profile: G.profile(
            { lv: { L1: { n: 20, ok: 20, ms: 40000 } } },
            {},
            true,
          ),
        },
        rng: 123,
        usesSpecial: true,
      };
      const a = G.advance(m, start + 500),
        b = G.advance(m, start + 500);
      assert.deepEqual(a, b);
      assert(!a.game.result);
      for (
        let t = start + 1000;
        t < start + 300000 && !m.game.result;
        t += 1000
      )
        m = G.advance(m, t);
      assert(m.game.result, "CPU must finish actual battle");
      assert.equal(m.game.result.winner, "_ghost");
    },
  );
test("guest migration takes the minimum, keeps old totals and clears only successfully merged guest records", async () => {
  const fn = source.match(
    /async function migrateGuestExtra\(acct\) \{[\s\S]*?\n\}/,
  )[0];
  let data = {
      lv: {
        L1: { n: 4, ok: 2, ms: 6000, bestMs: 1600 },
        L2: { n: 2, ok: 2, ms: 3000, bestMs: 1000 },
      },
    },
    cleared = false;
  const context = {
    Number,
    Math,
    PROF_LS: "test",
    loadLS: () => ({
      lv: {
        L1: { n: 2, ok: 2, ms: 3000, bestMs: 1200 },
        L2: { n: 1, ok: 1, ms: 1800, bestMs: 1800 },
      },
    }),
    saveLS: () => {
      cleared = true;
    },
    FB: {
      db: {
        ref: () => ({
          transaction: async (f) => {
            data = f(data);
          },
        }),
      },
    },
  };
  await vm.runInNewContext("(" + fn + ")", context)({ key: "a" });
  assert.equal(data.lv.L1.bestMs, 1200);
  assert.equal(data.lv.L2.bestMs, 1000);
  assert.equal(data.lv.L1.n, 6);
  assert.equal(data.lv.L1.ms, 9000);
  assert(cleared);
});
test("legacy passive rewards use per-ID receipts and award XP atomically even after partial acknowledgments", () => {
  const callback = source
    .match(/transaction\(s => \{ earned=0;[\s\S]*?return s; \}\)/)[0]
    .slice("transaction(".length, -1);
  const rows = [
    { id: "one", at: 100, o: "w" },
    { id: "two", at: 200, o: "w" },
  ];
  function run(s, r) {
    return vm.runInNewContext(callback, {
      rows: r,
      now: Math.max(...r.map((x) => x.at)),
      GHOST_WIN_EXP: 5,
      earned: 0,
    })(s);
  }
  const s = run({ exp: 100 }, [rows[0]]);
  run(s, rows);
  run(s, rows);
  assert.equal(s.exp, 110);
  assert.equal(s.ghostW, 2);
  const old = run({ exp: 300, ghostSeen: 150, ghostW: 10 }, rows);
  assert.equal(old.exp, 305);
  assert.equal(old.ghostW, 11);
});
