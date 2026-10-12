// User-supplied Console rules; all execution is on loopback with synthetic data.
const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const { initializeTestEnvironment } = require("@firebase/rules-unit-testing");
const { ref, get, set, update } = require("firebase/database");
const R = require("../math-tower-core.js");
const directory = process.env.MATH_TOWER_AUDIT_DIR;
if (!directory)
  throw Error("MATH_TOWER_AUDIT_DIR must point to offline candidates");
const files = {
  current: "current.canonical.json",
  tower: "tower-only.rules.json",
  teacher: "teacher-only.rules.json",
  combined: "combined.rules.json",
};
const PASSPHRASE = "synthetic-teacher-pass-for-emulator-only";
function fixture() {
  return {
    games: {
      factor: {
        pins: { aowner: "1111", aother: "2222", alegacy: "3333" },
        logins: {
          aowner: { owner: "1111" },
          aother: { other: "2222" },
          alegacy: { legacy: "3333" },
        },
        accounts: {
          aowner: { name: "Owner" },
          aother: { name: "Other" },
          alegacy: { name: "Legacy" },
        },
        teachers: { alegacy: { name: "Legacy", at: 1 } },
        mathTowerV2: {
          access: {
            aowner: { enabled: true, role: "teacher" },
            alegacy: { enabled: true, role: "teacher" },
          },
          content: {
            aowner: { chapter1: { fixture: true } },
            alegacy: { chapter1: { fixture: true } },
          },
        },
      },
    },
  };
}
async function attempt(fn) {
  try {
    await fn();
    return true;
  } catch (e) {
    if (!/permission[ _]denied/i.test(String(e.code) + String(e.message)))
      throw e;
    return false;
  }
}
const results = { boundary: [], regression: [], revocation: [] };
let assertions = 0;
async function expect(fn, allowed, label) {
  const actual = await attempt(fn);
  assert.equal(actual, allowed, label);
  assertions++;
  return actual;
}
async function open(kind) {
  return initializeTestEnvironment({
    projectId: "demo-factorfactor-tower",
    database: {
      host: "127.0.0.1",
      port: 9000,
      rules: fs.readFileSync(path.join(directory, files[kind]), "utf8"),
    },
  });
}
async function seed(env, data) {
  await env.withSecurityRulesDisabled((ctx) => set(ref(ctx.database()), data));
}
const boundaryCases = [
  {
    name: "teacher: both pass/key missing",
    node: "teachers",
    want: [true, false],
  },
  {
    name: "teacher: pass missing/key present",
    node: "teachers",
    key: PASSPHRASE,
    want: [false, false],
  },
  {
    name: "teacher: pass present/key missing",
    node: "teachers",
    pass: PASSPHRASE,
    want: [false, false],
  },
  {
    name: "teacher: wrong key",
    node: "teachers",
    pass: PASSPHRASE,
    key: "wrong",
    want: [false, false],
  },
  {
    name: "teacher: correct cached key",
    node: "teachers",
    pass: PASSPHRASE,
    key: PASSPHRASE,
    want: [true, true],
  },
  {
    name: "teacher: numeric pass/key",
    node: "teachers",
    pass: 42,
    key: 42,
    want: [true, false],
  },
  {
    name: "teacher: boolean pass/key",
    node: "teachers",
    pass: true,
    key: true,
    want: [true, false],
  },
  {
    name: "teacher: empty pass/key",
    node: "teachers",
    pass: "",
    key: "",
    want: [true, false],
  },
  {
    name: "key: missing pass/string",
    node: "teacherKeys",
    value: PASSPHRASE,
    want: [false, false],
  },
  {
    name: "key: missing pass/null deletion",
    node: "teacherKeys",
    value: null,
    want: [true, false],
  },
  {
    name: "key: delete existing key when pass missing",
    node: "teacherKeys",
    key: PASSPHRASE,
    value: null,
    want: [true, false],
  },
  {
    name: "key: delete existing key when pass configured",
    node: "teacherKeys",
    pass: PASSPHRASE,
    key: PASSPHRASE,
    value: null,
    want: [false, false],
  },
  {
    name: "key: valid nonempty string",
    node: "teacherKeys",
    pass: PASSPHRASE,
    value: PASSPHRASE,
    want: [true, true],
  },
  {
    name: "key: wrong string",
    node: "teacherKeys",
    pass: PASSPHRASE,
    value: "wrong",
    want: [false, false],
  },
  {
    name: "key: numeric equality",
    node: "teacherKeys",
    pass: 42,
    value: 42,
    want: [true, false],
  },
  {
    name: "key: boolean equality",
    node: "teacherKeys",
    pass: true,
    value: true,
    want: [true, false],
  },
  {
    name: "key: empty equality",
    node: "teacherKeys",
    pass: "",
    value: "",
    want: [true, false],
  },
  {
    name: "key: array against string pass",
    node: "teacherKeys",
    pass: PASSPHRASE,
    value: [PASSPHRASE],
    want: [false, false],
  },
  {
    name: "key: object against string pass",
    node: "teacherKeys",
    pass: PASSPHRASE,
    value: { pass: PASSPHRASE },
    want: [false, false],
  },
  {
    name: "key: other UID writing owner's key",
    node: "teacherKeys",
    pass: PASSPHRASE,
    value: PASSPHRASE,
    uid: "other",
    want: [false, false],
  },
  {
    name: "teacher: other UID writing owner's marker",
    node: "teachers",
    pass: PASSPHRASE,
    key: PASSPHRASE,
    uid: "other",
    want: [false, false],
  },
  {
    name: "key: unauthenticated",
    node: "teacherKeys",
    pass: PASSPHRASE,
    value: PASSPHRASE,
    uid: null,
    want: [false, false],
  },
  {
    name: "teacher: unauthenticated",
    node: "teachers",
    pass: PASSPHRASE,
    key: PASSPHRASE,
    uid: null,
    want: [false, false],
  },
];
async function boundaries(kind, index) {
  const env = await open(kind);
  try {
    for (const c of boundaryCases) {
      const data = fixture(),
        f = data.games.factor;
      if (c.pass !== undefined) f.teacherPass = c.pass;
      if (c.key !== undefined) f.teacherKeys = { aowner: c.key };
      await seed(env, data);
      const db =
        c.uid === null
          ? env.unauthenticatedContext().database()
          : env.authenticatedContext(c.uid || "owner").database();
      const value = c.node === "teachers" ? { name: "Owner", at: 1 } : c.value;
      const actual = await expect(
        () => set(ref(db, "games/factor/" + c.node + "/aowner"), value),
        c.want[index],
        kind + ": " + c.name,
      );
      results.boundary.push({ kind, name: c.name, allowed: actual });
    }
    // Existing marker survives even when a cached key is missing or stale.
    await seed(env, fixture());
    const legacy = env.authenticatedContext("legacy").database();
    await expect(
      () => get(ref(legacy, "games/factor/teachers/alegacy")),
      true,
      kind + ": existing teacher read",
    );
    await expect(
      () =>
        set(ref(legacy, "games/factor/rooms/3456/meta"), {
          host: "legacy",
          acct: "alegacy",
          createdAt: Date.now(),
          tour: true,
          raid: false,
        }),
      true,
      kind + ": existing teacher tournament",
    );
    await expect(
      () => get(ref(legacy, "games/factor/teacherKeys/alegacy")),
      false,
      kind + ": keys remain unreadable",
    );
  } finally {
    await env.cleanup();
  }
}
const regressionCases = [
  ["account read", "get", "accounts/aowner", null, "owner", true],
  [
    "solo stats save",
    "set",
    "accounts/aowner/stats",
    { exp: 10 },
    "owner",
    true,
  ],
  [
    "learning profile",
    "set",
    "accounts/aowner/prof",
    { lv: { L1: { n: 1, ok: 1 } } },
    "owner",
    true,
  ],
  [
    "wrong-account stats",
    "set",
    "accounts/aowner/stats",
    { exp: 10 },
    "other",
    false,
  ],
  ["guest stats", "set", "accounts/aowner/stats", { exp: 10 }, null, false],
  [
    "ordinary online room",
    "set",
    "rooms/1234/meta",
    { host: "owner", createdAt: 1, tour: false, raid: false },
    "owner",
    true,
  ],
  [
    "online player join",
    "set",
    "rooms/1111/players/owner",
    { name: "Owner" },
    "owner",
    true,
  ],
  [
    "online state",
    "set",
    "rooms/1111/state",
    { phase: "play", mode: "B" },
    "owner",
    true,
  ],
  [
    "online live",
    "set",
    "rooms/1111/live/g1/owner",
    { hp: 100 },
    "owner",
    true,
  ],
  [
    "online result",
    "set",
    "rooms/1111/result/g1",
    { winner: "owner" },
    "owner",
    true,
  ],
  [
    "teacher tournament",
    "set",
    "rooms/1234/meta",
    { host: "legacy", acct: "alegacy", createdAt: 1, tour: true, raid: false },
    "legacy",
    true,
  ],
  [
    "teacher class raid",
    "set",
    "rooms/1234/meta",
    { host: "legacy", acct: "alegacy", createdAt: 1, tour: false, raid: true },
    "legacy",
    true,
  ],
  [
    "student tournament",
    "set",
    "rooms/1234/meta",
    { host: "owner", acct: "aowner", createdAt: 1, tour: true, raid: false },
    "owner",
    false,
  ],
  [
    "daily record",
    "set",
    "daily/2026-10-12/aowner",
    { t: 1, name: "Owner" },
    "owner",
    true,
  ],
  ["weekly damage", "set", "raidw/week/dmg/aowner", { d: 1 }, "owner", true],
  ["weekly support", "set", "raidw/week/sup/aowner", { p: 1 }, "owner", true],
  [
    "weekly boss metadata",
    "set",
    "raidw/week/meta",
    { boss: "fixture", rage: 1, rule: "fixture" },
    "owner",
    true,
  ],
  [
    "weekly kill",
    "set",
    "raidw/week/kill",
    { by: "aowner", name: "Owner", at: 1 },
    "owner",
    true,
  ],
  [
    "weekly history",
    "set",
    "raidwHist/week",
    { t: 1, boss: "fixture" },
    "owner",
    true,
  ],
  [
    "old tower record",
    "set",
    "tower/best/aowner",
    { f: 3, name: "Owner" },
    "owner",
    true,
  ],
  [
    "old tower wrong account",
    "set",
    "tower/best/aowner",
    { f: 3, name: "Owner" },
    "other",
    false,
  ],
  [
    "teacher dashboard presence",
    "set",
    "presence/owner",
    { name: "Owner", act: "menu" },
    "owner",
    true,
  ],
  [
    "random match slot",
    "set",
    "qm/slot",
    { host: "owner", code: "1234" },
    "owner",
    true,
  ],
  [
    "ghost result",
    "set",
    "ghostlog/aowner/m1",
    { by: "Owner", o: "w", at: 1 },
    "owner",
    true,
  ],
];
async function regressions(kind) {
  const env = await open(kind);
  try {
    for (const [name, op, p, value, uid, want] of regressionCases) {
      const data = fixture();
      data.games.factor.rooms = {
        1111: {
          meta: { host: "owner", createdAt: 1, tour: false, raid: false },
        },
      };
      await seed(env, data);
      const db = uid
        ? env.authenticatedContext(uid).database()
        : env.unauthenticatedContext().database();
      const actual = await expect(
        () =>
          op === "get"
            ? get(ref(db, "games/factor/" + p))
            : set(ref(db, "games/factor/" + p), value),
        want,
        kind + ": " + name,
      );
      results.regression.push({ kind, name, allowed: actual });
    }
  } finally {
    await env.cleanup();
  }
}
async function revocation() {
  const env = await open("combined");
  try {
    const data = fixture();
    data.games.factor.teacherPass = PASSPHRASE;
    data.games.factor.teacherKeys = { aowner: PASSPHRASE };
    data.games.factor.teachers.aowner = { name: "Owner", at: 1 };
    await seed(env, data);
    const db = env.authenticatedContext("owner").database(),
      base = "games/factor/";
    await expect(
      () => get(ref(db, base + "mathTowerV2/content/aowner/chapter1")),
      true,
      "combined: initial tower access",
    );
    await expect(
      () =>
        set(ref(db, base + "mathTowerV2/access/aowner"), {
          enabled: true,
          role: "teacher",
        }),
      false,
      "combined: no client self-grant",
    );
    await env.withSecurityRulesDisabled((ctx) =>
      set(ref(ctx.database(), base + "teachers/aowner"), null),
    );
    await expect(
      () => get(ref(db, base + "mathTowerV2/content/aowner/chapter1")),
      false,
      "combined: marker revocation blocks read",
    );
    await expect(
      () =>
        set(ref(db, base + "mathTowerV2/trialProgress/aowner"), {
          ...R.fresh(),
          revision: 1,
        }),
      false,
      "combined: marker revocation blocks write",
    );
    // Legitimate cached master key can recreate the legacy role. Durable tower
    // revocation therefore disables its admin-managed grant as well.
    await expect(
      () => set(ref(db, base + "teachers/aowner"), { name: "Owner", at: 2 }),
      true,
      "combined: cached key registration is compatible",
    );
    await expect(
      () => get(ref(db, base + "mathTowerV2/content/aowner/chapter1")),
      true,
      "combined: restored role reopens an enabled grant",
    );
    await env.withSecurityRulesDisabled((ctx) =>
      set(
        ref(ctx.database(), base + "mathTowerV2/access/aowner/enabled"),
        false,
      ),
    );
    await expect(
      () => get(ref(db, base + "mathTowerV2/content/aowner/chapter1")),
      false,
      "combined: disabled grant blocks read after role restoration",
    );
    await expect(
      () =>
        set(ref(db, base + "mathTowerV2/trialProgress/aowner"), {
          ...R.fresh(),
          revision: 1,
        }),
      false,
      "combined: disabled grant blocks write",
    );
    await expect(
      () =>
        update(ref(db, base + "mathTowerV2/access/aowner"), { enabled: true }),
      false,
      "combined: cannot reenable grant",
    );
    results.revocation.push({
      roleDeletionBlocksImmediately: true,
      cachedKeyCanRestoreLegacyRole: true,
      disabledGrantBlocksRestoredRole: true,
    });
  } finally {
    await env.cleanup();
  }
}
(async () => {
  await boundaries("current", 0);
  await boundaries("combined", 1);
  for (const kind of ["current", "tower", "teacher", "combined"])
    await regressions(kind);
  await revocation();
  fs.writeFileSync(
    path.join(directory, "test-results.json"),
    JSON.stringify({ assertions, ...results }, null, 2) + "\n",
    { mode: 0o600 },
  );
  console.log(
    assertions + " production-export audit assertions passed; loopback only.",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
