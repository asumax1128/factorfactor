const fs = require("node:fs"),
  assert = require("node:assert/strict");
const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require("@firebase/rules-unit-testing");
const { set, ref, get, remove } = require("firebase/database");
const cp = require("node:child_process"),
  os = require("node:os"),
  path = require("node:path");
(async () => {
  const baseline = JSON.parse(
    fs.readFileSync(process.env.RTDB_RULES_BASELINE_FILE, "utf8"),
  );
  const before = JSON.stringify(baseline.rules.games.factor.accounts);
  Object.assign(
    baseline.rules.games.factor,
    require("../firebase/online-rated.rules.fragment.json"),
  );
  assert.equal(JSON.stringify(baseline.rules.games.factor.accounts), before);
  let env = await initializeTestEnvironment({
    projectId: "demo-factorfactor-tower",
    database: {
      host: "127.0.0.1",
      port: 9000,
      rules: JSON.stringify(baseline),
    },
  });
  try {
    const seed = {
      games: {
        factor: {
          logins: { aowner: { owner: "1111" } },
          onlineRatedV2: {
            privateState: {
              players: {
                aowner: { easy: { rating: 1800 }, normal: { rating: 1500 } },
              },
            },
          },
        },
      },
    };
    await env.withSecurityRulesDisabled((ctx) =>
      set(ref(ctx.database()), seed),
    );
    for (const uid of ["owner", "other"])
      for (const branch of [
        "privateState/players/aowner/easy/rating",
        "privateState/players/aowner/normal/rating",
        "privateState/settlements/fake",
        "config",
      ])
        await assertFails(
          set(
            ref(
              env.authenticatedContext(uid).database(),
              "games/factor/onlineRatedV2/" + branch,
            ),
            9999,
          ),
        );
    await assertFails(
      set(
        ref(
          env.unauthenticatedContext().database(),
          "games/factor/onlineRatedV2/privateState",
        ),
        {},
      ),
    );
    console.log(
      "PASS 9 real emulator writes rejected, including linked owner and arbitrary result; legacy accounts rules unchanged",
    );
    const out = fs.mkdtempSync(path.join(os.tmpdir(), "rated-rules-"));
    cp.execFileSync(process.execPath, [
      "scripts/prepare-rated-rules.cjs",
      process.env.RTDB_RULES_BASELINE_FILE,
      out,
    ]);
    const candidate = JSON.parse(
      fs.readFileSync(
        path.join(out, "online-rated-candidate.rules.json"),
        "utf8",
      ),
    );
    for (const [k, v] of Object.entries(baseline.rules.games.factor))
      if (!["qm", "rooms", "onlineRatedV2"].includes(k))
        assert.deepEqual(candidate.rules.games.factor[k], v);
    await env.cleanup();
    env = await initializeTestEnvironment({
      projectId: "demo-factorfactor-tower",
      database: {
        host: "127.0.0.1",
        port: 9000,
        rules: JSON.stringify(candidate),
      },
    });
    await env.withSecurityRulesDisabled(async (ctx) => {
      const d = ctx.database();
      await set(ref(d, "games/factor/onlineRatedV2/config"), {
        stopLegacyQuickMatch: true,
      });
      for (const [code, qm] of [
        ["1111", true],
        ["2222", false],
      ]) {
        await set(ref(d, `games/factor/rooms/${code}/meta`), {
          host: "owner",
          createdAt: Date.now(),
          qm,
        });
        await set(ref(d, `games/factor/rooms/${code}/players/owner`), {
          name: "Owner",
        });
      }
      await set(ref(d, "games/factor/qm/slot"), {
        host: "owner",
        code: "1111",
      });
    });
    const owner = env.authenticatedContext("owner").database(),
      other = env.authenticatedContext("other").database();
    await assertSucceeds(get(ref(owner, "games/factor/onlineRatedV2/config")));
    await assertFails(
      get(ref(owner, "games/factor/onlineRatedV2/privateState")),
    );
    await assertFails(
      set(ref(other, "games/factor/qm/slot"), { host: "other", code: "3333" }),
    );
    await assertSucceeds(remove(ref(owner, "games/factor/qm/slot")));
    await assertFails(
      set(ref(owner, "games/factor/qm/slot"), { host: "owner", code: "3333" }),
    );
    await assertFails(
      set(ref(owner, "games/factor/rooms/3333/meta"), {
        host: "owner",
        createdAt: Date.now(),
        qm: true,
      }),
    );
    await assertFails(
      set(ref(other, "games/factor/rooms/1111/players/other"), {
        name: "Other",
      }),
    );
    await assertSucceeds(
      set(ref(owner, "games/factor/rooms/1111/players/owner"), {
        name: "Owner",
      }),
    );
    await assertSucceeds(
      set(ref(other, "games/factor/rooms/2222/players/other"), {
        name: "Other",
      }),
    );
    await assertSucceeds(
      set(ref(owner, "games/factor/rooms/4444/meta"), {
        host: "owner",
        createdAt: Date.now(),
        qm: false,
      }),
    );
    await assertSucceeds(
      set(ref(owner, "games/factor/rooms/1111/live/game/owner"), { hp: 90 }),
    );
    await env.withSecurityRulesDisabled((ctx) =>
      set(
        ref(
          ctx.database(),
          "games/factor/onlineRatedV2/config/stopLegacyQuickMatch",
        ),
        false,
      ),
    );
    await assertSucceeds(
      set(ref(owner, "games/factor/qm/slot"), { host: "owner", code: "3333" }),
    );
    await assertSucceeds(
      set(ref(owner, "games/factor/rooms/3333/meta"), {
        host: "owner",
        createdAt: Date.now(),
        qm: true,
      }),
    );
    await assertSucceeds(
      set(ref(other, "games/factor/rooms/1111/players/other"), {
        name: "Other",
      }),
    );
    console.log(
      "PASS 14 cutover-gate emulator checks: stop new legacy matching, retain numbered rooms/current games, restore gate; other branches identical",
    );
  } finally {
    await env.cleanup();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
