// Read-only audit of production code + local demo emulator with synthetic data.
// Expected legacy weaknesses are documented, not accepted for the new protocol.
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm");
const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} = require("@firebase/rules-unit-testing");
const { ref, set, get, update } = require("firebase/database");
const html = fs.readFileSync("index.html", "utf8");
const fn = html.slice(
  html.indexOf("async function recordMatch(acct, info)"),
  html.indexOf("/* ---------- 効果音（ソロと同じ音源を使う）"),
);
assert(fn.startsWith("async function recordMatch"));
async function codeAudit() {
  let stats = { rating: 1500, games: 0, season: "2026-10" };
  const scope = vm.createContext({
    DBX: null,
    RATING_INIT: 1500,
    seasonKey: () => "2026-10",
    SEASON0: "2026-10",
    seasonReset: (r) => r,
    badgesOf: () => [],
    announceableBadges: () => [],
    holdRetiredCounters: (_before, s) => s,
    keepStats: () => {},
    FB: {
      db: {
        ref: (path) => ({
          transaction: async (cb) => {
            assert.equal(path, "games/factor/accounts/asynthetic/stats");
            stats = cb(JSON.parse(JSON.stringify(stats)));
            return { committed: true };
          },
        }),
      },
    },
  });
  vm.runInContext(fn, scope);
  const info = { outcome: "w", mode: "A", dr: 16, exp: 30 };
  await scope.recordMatch({ key: "asynthetic" }, info);
  await scope.recordMatch({ key: "asynthetic" }, info);
  assert.equal(stats.games, 2);
  assert.equal(stats.rating, 1532);
  assert.equal(stats.easy, undefined);
  assert.equal(stats.normal, undefined);
  console.log(
    "OBSERVED legacy recordMatch called twice counts twice; difficulty not persisted",
  );
}
async function rulesAudit() {
  if (!process.env.RTDB_RULES_BASELINE_FILE)
    throw Error("Console rules export required");
  const rules = JSON.parse(
    fs.readFileSync(process.env.RTDB_RULES_BASELINE_FILE, "utf8"),
  );
  const base = "games/factor";
  let env = await initializeTestEnvironment({
    projectId: "demo-factorfactor-tower",
    database: { host: "127.0.0.1", port: 9000, rules: JSON.stringify(rules) },
  });
  try {
    await env.withSecurityRulesDisabled((ctx) =>
      set(ref(ctx.database()), {
        games: {
          factor: {
            pins: { asynthetic: "1111" },
            logins: { asynthetic: { owner: "1111" } },
            accounts: {
              asynthetic: {
                name: "Synthetic",
                stats: { games: 3, rating: 1500 },
              },
            },
            rooms: {
              1234: {
                meta: { host: "host", createdAt: Date.now() },
                players: {
                  owner: { name: "Synthetic", acct: "asynthetic" },
                  host: { name: "Host" },
                },
              },
            },
          },
        },
      }),
    );
    let owner = env.authenticatedContext("owner").database();
    const outsider = env.authenticatedContext("outsider").database();
    await assertFails(
      update(ref(outsider, `${base}/accounts/asynthetic/stats`), {
        rating: 9000,
      }),
    );
    await assertSucceeds(
      update(ref(owner, `${base}/accounts/asynthetic/stats`), {
        rating: 9000,
        games: 999,
      }),
    );
    await assertSucceeds(
      set(ref(owner, `${base}/accounts/asynthetic/stats/ratingsV2/easy`), {
        rating: 9000,
      }),
    );
    await assertSucceeds(
      set(ref(owner, `${base}/rooms/1234/result/forged`), {
        winner: "owner",
        rank: { owner: 1, host: 2 },
        at: Date.now(),
      }),
    );
    await assertFails(
      set(ref(owner, `${base}/rooms/1234/result/forged`), { winner: "host" }),
    );
    await assertSucceeds(
      set(
        ref(
          env.authenticatedContext("host").database(),
          `${base}/rooms/1234/result/forged`,
        ),
        { winner: "host" },
      ),
    );
    console.log(
      "OBSERVED owner may self-edit rating; participant may create unverified result; host may overwrite it",
    );
    // A child write:false cannot revoke a parent's permission in RTDB.
    rules.rules.games.factor.accounts.$k.stats.ratingsV2 = { ".write": false };
    await env.cleanup();
    env = await initializeTestEnvironment({
      projectId: "demo-factorfactor-tower",
      database: { host: "127.0.0.1", port: 9000, rules: JSON.stringify(rules) },
    });
    owner = env.authenticatedContext("owner").database();
    await assertSucceeds(
      set(ref(owner, `${base}/accounts/asynthetic/stats/ratingsV2/easy`), {
        rating: 9999,
      }),
    );
    assert.equal(
      (
        await get(
          ref(owner, `${base}/accounts/asynthetic/stats/ratingsV2/easy/rating`),
        )
      ).val(),
      9999,
    );
    await assertFails(
      set(ref(owner, `${base}/onlineRatedV2/ratings/easy/players/asynthetic`), {
        rating: 9999,
      }),
    );
    console.log(
      "PASS candidate deny under writable stats is ineffective; independent server-only branch denies self-grant",
    );
  } finally {
    await env.cleanup();
  }
}
(async () => {
  await codeAudit();
  await rulesAudit();
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
