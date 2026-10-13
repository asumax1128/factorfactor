const fs = require("fs"),
  assert = require("node:assert/strict");
const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require("@firebase/rules-unit-testing");
const { ref, set, get, update } = require("firebase/database");
const Host = require("../src/event-host-client.cjs");
const original = JSON.parse(
    fs.readFileSync("firebase/online-spark.candidate.rules.json", "utf8"),
  ),
  rules = require("../firebase/event-host-rules.cjs").patch(
    JSON.parse(JSON.stringify(original)),
  );
for (const game of Object.keys(original.rules.games).filter(
  (g) => g !== "factor",
))
  assert.deepEqual(rules.rules.games[game], original.rules.games[game]);
for (const field of [
  "pins",
  "logins",
  "accounts",
  "teachers",
  "teacherPass",
  "teacherKeys",
  "mathTowerV2",
  "onlineSparkV1",
])
  assert.deepEqual(
    rules.rules.games.factor[field],
    original.rules.games.factor[field],
  );
(async () => {
  if (process.env.GCLOUD_PROJECT !== "demo-factorfactor-tower")
    throw Error("DEMO_ONLY");
  const env = await initializeTestEnvironment({
    projectId: "demo-factorfactor-tower",
    database: { host: "127.0.0.1", port: 9000, rules: JSON.stringify(rules) },
  });
  const db = (u) => env.authenticatedContext(u).database(),
    a = db("teacherA"),
    b = db("teacherB"),
    s = db("student"),
    other = db("other");
  const state = {
      phase: "tour",
      tour: true,
      gid: "ongoing",
      round: 1,
      names: { p: "P" },
      rounds: [{ matches: [{ winner: "p" }] }],
    },
    meta = {
      host: "student",
      acct: "as",
      createdAt: Date.now(),
      tour: true,
      raid: false,
      delegatedAccount: "as",
    };
  const compat = (d) => ({
    ref: (p) => ({
      get: async () => get(ref(d, p)),
      set: (v) => set(ref(d, p), v),
      update: (v) => update(ref(d, p), v),
    }),
  });
  try {
    await env.withSecurityRulesDisabled((ctx) =>
      set(ref(ctx.database()), {
        games: {
          factor: {
            accounts: {
              aa: { name: "TeacherA" },
              ab: { name: "TeacherB" },
              as: { name: "Student" },
              ao: { name: "Other" },
            },
            teachers: { aa: { name: "TeacherA" }, ab: { name: "TeacherB" } },
            logins: {
              aa: { teacherA: "fixture" },
              ab: { teacherB: "fixture" },
              as: { student: "fixture" },
              ao: { other: "fixture" },
            },
          },
        },
      }),
    );
    await Host.grant({
      db: compat(a),
      teacher: { key: "aa" },
      target: "as",
      tournament: true,
      raid: false,
    });
    await assertFails(
      set(ref(s, "games/factor/eventHosts/as"), {
        enabled: true,
        tournament: true,
        raid: true,
        teacher: "aa",
        updatedAt: Date.now(),
      }),
    );
    await assertSucceeds(set(ref(s, "games/factor/rooms/1234/meta"), meta));
    await assertFails(
      set(ref(s, "games/factor/rooms/5678/meta"), {
        ...meta,
        raid: true,
        tour: false,
      }),
    );
    await assertFails(
      set(ref(s, "games/factor/rooms/5678/meta"), { ...meta, raid: true }),
    );
    await assertFails(set(ref(s, "games/factor/rooms/1234/state"), state)); // registry first
    await assertSucceeds(
      set(ref(s, "games/factor/eventHostRooms/as/1234"), { at: Date.now() }),
    );
    await assertSucceeds(set(ref(s, "games/factor/rooms/1234/state"), state));
    await assertFails(
      set(ref(s, "games/factor/rooms/1234/meta"), {
        host: "student",
        acct: "as",
        createdAt: meta.createdAt,
        tour: false,
        raid: false,
      }),
    );
    await assertFails(set(ref(s, "games/factor/teacherKeys/as"), "guess"));
    await assertFails(
      set(ref(s, "games/factor/teachers/as"), { name: "Student" }),
    );
    await assertFails(
      set(ref(s, "games/factor/mathTowerV2/access/as"), {
        enabled: true,
        role: "teacher",
      }),
    );
    const codes = await Host.revoke({
      db: compat(b),
      teacher: { key: "ab" },
      uid: "teacherB",
      target: "as",
    });
    assert.deepEqual(codes, ["1234"]);
    assert.deepEqual(
      (await get(ref(b, "games/factor/rooms/1234/state"))).val(),
      state,
    );
    assert.equal(
      (await get(ref(b, "games/factor/rooms/1234/meta/host"))).val(),
      "teacherB",
    );
    await assertFails(
      set(ref(s, "games/factor/rooms/1234/state"), { phase: "closed" }),
    );
    await assertFails(
      set(ref(other, "games/factor/rooms/1234/state"), { phase: "closed" }),
    );
    await assertSucceeds(
      update(ref(b, "games/factor/rooms/1234/state"), { round: 2 }),
    );
    assert.deepEqual(
      await Host.revoke({
        db: compat(b),
        teacher: { key: "ab" },
        uid: "teacherB",
        target: "as",
      }),
      [],
    );
    await assertFails(set(ref(s, "games/factor/rooms/5678/meta"), meta));
    console.log(
      "PASS scoped teacher grants; tournament-only student denied raid/both, PIN/teacher/tower escalation; atomic any-teacher takeover with state intact; revoked/foreign control denied; retry safe",
    );
  } finally {
    await env.cleanup();
  }
})()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => setTimeout(() => process.exit(process.exitCode || 0), 100));
