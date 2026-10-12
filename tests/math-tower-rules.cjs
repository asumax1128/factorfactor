// Requires the official RTDB emulator. Never connects to a real Firebase project.
const fs = require("node:fs"),
  assert = require("node:assert/strict");
const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} = require("@firebase/rules-unit-testing");
const { ref, get, set } = require("firebase/database");
const R = require("../math-tower-core");
(async () => {
  const env = await initializeTestEnvironment({
    projectId: "demo-factorfactor-tower",
    database: {
      host: "127.0.0.1",
      port: 9000,
      rules: fs.readFileSync(
        require.resolve("../firebase/math-tower.emulator.rules.json"),
        "utf8",
      ),
    },
  });
  let checks = 0;
  try {
    await env.withSecurityRulesDisabled(async (ctx) =>
      set(ref(ctx.database()), {
        games: {
          factor: {
            teachers: { ateacher: { name: "Teacher" } },
            logins: {
              ateacher: { teacher1: "1234", teacher2: "1234" },
              astudent: { student: "4321" },
            },
            pins: { ateacher: "1234", astudent: "4321" },
            mathTowerV2: {
              access: {
                ateacher: { enabled: true, role: "teacher" },
                astudent: { enabled: true, role: "teacher" },
              },
              content: {
                ateacher: { chapter1: { chapter: 1, fixture: true } },
              },
            },
          },
        },
      }),
    );
    const privatePath = "games/factor/mathTowerV2";
    for (const uid of ["student", "unlinked", null]) {
      const db = uid
        ? env.authenticatedContext(uid).database()
        : env.unauthenticatedContext().database();
      await assertFails(
        get(ref(db, privatePath + "/content/ateacher/chapter1")),
      );
      await assertFails(
        set(ref(db, privatePath + "/trialProgress/ateacher"), {
          ...R.fresh(),
          revision: 1,
        }),
      );
      checks += 2;
    }
    for (const uid of ["teacher1", "teacher2"]) {
      const db = env.authenticatedContext(uid).database();
      await assertSucceeds(
        get(ref(db, privatePath + "/content/ateacher/chapter1")),
      );
      checks++;
    }
    const db = env.authenticatedContext("teacher1").database();
    await assertSucceeds(
      set(ref(db, privatePath + "/trialProgress/ateacher"), {
        ...R.fresh(),
        revision: 1,
      }),
    );
    checks++;
    const second = env.authenticatedContext("teacher2").database();
    assert.equal(
      (
        await assertSucceeds(
          get(ref(second, privatePath + "/trialProgress/ateacher")),
        )
      ).val().revision,
      1,
    );
    checks++;
    for (const v of [
      { ...R.fresh(), revision: 1 },
      { ...R.fresh(), revision: 2, purpose: "official" },
      {
        ...R.fresh(),
        revision: 2,
        difficulties: { easy: { best: 6, hp: 100 } },
      },
    ]) {
      await assertFails(
        set(ref(db, privatePath + "/trialProgress/ateacher"), v),
      );
      checks++;
    }
    await assertFails(
      set(ref(db, privatePath + "/access/ateacher"), {
        enabled: true,
        role: "teacher",
      }),
    );
    await assertFails(
      set(ref(db, privatePath + "/content/ateacher/chapter1"), {}),
    );
    await assertFails(get(ref(db, privatePath + "/content")));
    checks += 3;
    await env.withSecurityRulesDisabled((ctx) =>
      set(ref(ctx.database(), "games/factor/teachers/ateacher"), null),
    );
    await assertFails(get(ref(db, privatePath + "/content/ateacher/chapter1")));
    checks++;
    console.log(checks + " emulator authorization checks passed");
  } finally {
    await env.cleanup();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
