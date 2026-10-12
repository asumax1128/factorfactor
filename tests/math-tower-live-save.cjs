// Real SDK + RTDB emulator: caches and transaction retries are not mocked.
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm");
const { initializeTestEnvironment } = require("@firebase/rules-unit-testing");
const F = require("firebase/database"),
  R = require("../math-tower-core");
function compat(db, hooks = {}) {
  return {
    ref: (path) => {
      const r = F.ref(db, path),
        subs = new Map();
      return {
        get: () => F.get(r),
        transaction: async (fn, unused, applyLocally) => {
          if (hooks.beforeTransaction) await hooks.beforeTransaction();
          return F.runTransaction(r, fn, {
            applyLocally: applyLocally !== false,
          });
        },
        on: (event, fn, cancel) => {
          subs.set(fn, F.onValue(r, fn, cancel));
        },
        off: (event, fn) => {
          subs.get(fn)?.();
          subs.delete(fn);
        },
      };
    },
  };
}
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
  const window = { MathTowerRules: R };
  vm.runInNewContext(
    fs.readFileSync(require.resolve("../math-tower-store.js"), "utf8"),
    { window },
  );
  const S = window.MathTowerStore,
    acct = { key: "ateacher" };
  try {
    await env.withSecurityRulesDisabled(async (c) =>
      F.set(F.ref(c.database()), {
        games: {
          factor: {
            teachers: { ateacher: true },
            logins: { ateacher: { u1: "fake", u2: "fake" } },
            mathTowerV2: {
              access: { ateacher: { enabled: true, role: "teacher" } },
              content: { ateacher: { chapter1: { chapter: 1, version: 1 } } },
              trialProgress: { ateacher: { ...R.fresh(), revision: 1 } },
            },
          },
        },
      }),
    );
    const a = compat(env.authenticatedContext("u1").database()),
      b = compat(env.authenticatedContext("u2").database());
    let one = await S.load(a, "u1", acct);
    for (let i = 0; i < 5; i++) {
      one.progress = await S.save(a, "u1", acct, one.progress);
      assert.equal(one.progress.revision, i + 2);
    }
    console.log(
      "PASS actual SDK cold-cache and five sequential saves on one client",
    );
    const stale = await S.load(b, "u2", acct);
    one.progress = await S.save(a, "u1", acct, one.progress);
    await assert.rejects(
      () => S.save(b, "u2", acct, stale.progress),
      /記録|端末/,
    );
    const recovered = await S.load(b, "u2", acct);
    assert.equal(recovered.progress.revision, one.progress.revision);
    const saved = await S.save(b, "u2", acct, recovered.progress);
    assert.equal(saved.revision, one.progress.revision + 1);
    console.log(
      "PASS actual two-client conflict, no stale overwrite, reload and resumed save",
    );
    const old = await S.load(a, "u1", acct),
      other = await S.load(b, "u2", acct);
    let concurrent;
    const raced = compat(env.authenticatedContext("u1").database(), {
      beforeTransaction: async () => {
        concurrent = await S.save(b, "u2", acct, other.progress);
      },
    });
    await assert.rejects(
      () => S.save(raced, "u1", acct, old.progress),
      (e) => e.code === "TOWER_CONFLICT",
    );
    const cloud = await S.load(a, "u1", acct);
    assert.equal(cloud.progress.revision, concurrent.revision);
    console.log(
      "PASS update between pre-read and transaction does not overwrite the newer server record",
    );
  } finally {
    await env.cleanup();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
