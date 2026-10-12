// Supplemental LOCAL audit of supplied rule exports. Never a production request.
const fs = require("node:fs"),
  assert = require("node:assert/strict");
const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} = require("@firebase/rules-unit-testing");
const { ref, get, set } = require("firebase/database");
const input = process.env.MATH_TOWER_RULES;
if (!input) throw Error("MATH_TOWER_RULES required");
(async () => {
  const env = await initializeTestEnvironment({
    projectId: "demo-factorfactor-tower",
    database: {
      host: "127.0.0.1",
      port: 9000,
      rules: fs.readFileSync(input, "utf8"),
    },
  });
  try {
    await env.withSecurityRulesDisabled((ctx) =>
      set(ref(ctx.database()), {
        games: {
          factor: {
            pins: { astudent: "1234" },
            logins: { astudent: { student: "1234" } },
            accounts: { astudent: { name: "Student" } },
            mathTowerV2: {
              content: { astudent: { chapter1: { fixture: true } } },
            },
          },
        },
      }),
    );
    const db = env.authenticatedContext("student").database();
    await assertSucceeds(get(ref(db, "games/factor/accounts/astudent")));
    await assertSucceeds(
      set(ref(db, "games/factor/accounts/astudent/stats"), { exp: 1 }),
    );
    await assertSucceeds(
      set(ref(db, "games/factor/rooms/1234/meta"), {
        host: "student",
        createdAt: Date.now(),
        tour: false,
        raid: false,
      }),
    );
    console.log(
      "PASS reference integration: existing account read/stats write/ordinary room create",
    );
    await assertFails(
      get(ref(db, "games/factor/mathTowerV2/content/astudent/chapter1")),
    );
    await assertFails(
      set(ref(db, "games/factor/mathTowerV2/access/astudent"), {
        enabled: true,
        role: "teacher",
      }),
    );
    console.log("PASS reference integration: no self-grant of tower access");
    // Reference legacy rules compare two nullable values. Do not call this a live defect.
    await assertSucceeds(
      set(ref(db, "games/factor/teachers/astudent"), { name: "Student" }),
    );
    console.log(
      "REPRODUCED reference-only risk: absent teacherPass and teacherKeys allow legacy teacher self-grant",
    );
    await assertFails(
      get(ref(db, "games/factor/mathTowerV2/content/astudent/chapter1")),
    );
    await env.withSecurityRulesDisabled(async (ctx) => {
      await set(ref(ctx.database(), "games/factor/teachers/astudent"), null);
      await set(
        ref(ctx.database(), "games/factor/teacherPass"),
        "test-fixture-not-a-production-secret",
      );
    });
    await assertFails(
      set(ref(db, "games/factor/teachers/astudent"), { name: "Student" }),
    );
    console.log(
      "PASS reference-only risk condition: configured teacherPass prevents null equality bypass",
    );
    const unsafe = JSON.parse(fs.readFileSync(input, "utf8"));
    unsafe.rules.games.factor[".read"] = "auth != null";
    unsafe.rules.games.factor[".write"] = "auth != null";
    const unsafeEnv = await initializeTestEnvironment({
      projectId: "demo-factorfactor-tower",
      database: {
        host: "127.0.0.1",
        port: 9000,
        rules: JSON.stringify(unsafe),
      },
    });
    try {
      const unlinked = unsafeEnv.authenticatedContext("unlinked").database();
      await assertSucceeds(
        get(
          ref(unlinked, "games/factor/mathTowerV2/content/astudent/chapter1"),
        ),
      );
      await assertSucceeds(
        set(ref(unlinked, "games/factor/mathTowerV2/access/astudent"), {
          enabled: true,
          role: "teacher",
        }),
      );
      console.log(
        "REPRODUCED deliberately unsafe LOCAL ancestor grant: lower-level false cannot block read/self-grant",
      );
    } finally {
      await unsafeEnv.cleanup();
    }
  } finally {
    await env.cleanup();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
