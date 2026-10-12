const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  vm = require("node:vm"),
  fs = require("node:fs");
const R = require("../math-tower-core");
function fixture() {
  let value = null;
  const window = { MathTowerRules: R };
  vm.runInNewContext(
    fs.readFileSync(require.resolve("../math-tower-store.js"), "utf8"),
    { window },
  );
  const db = {
    ref: (path) => ({
      get: async () => ({
        val: () =>
          path.includes("/access/")
            ? { enabled: true, role: "teacher" }
            : path.includes("/content/")
              ? { chapter: 1, version: 1 }
              : value,
      }),
      transaction: async (fn) => {
        const n = fn(value);
        if (n === undefined) return { committed: false };
        value = n;
        return { committed: true };
      },
    }),
  };
  return { window, Store: window.MathTowerStore, db, read: () => value };
}
test("trial saves do not write any official path and stale revisions cannot overwrite another device", async () => {
  const t = fixture(),
    acct = { key: "atest" };
  const a = await t.Store.load(t.db, "uid-a", acct),
    b = await t.Store.load(t.db, "uid-b", acct);
  a.progress.difficulties.easy.best = 2;
  const saved = await t.Store.save(t.db, "uid-a", acct, a.progress);
  assert.equal(saved.revision, 1);
  b.progress.difficulties.easy.best = 1;
  await assert.rejects(
    () => t.Store.save(t.db, "uid-b", acct, b.progress),
    /別の端末/,
  );
  assert.equal(t.read().difficulties.easy.best, 2);
});
test("missing auth and guest fail closed; sparse Firebase objects are normalised", async () => {
  const t = fixture();
  await assert.rejects(() => t.Store.load(t.db, null, { key: "atest" }));
  await assert.rejects(() =>
    t.Store.load(t.db, "uid", { guest: true, key: "atest" }),
  );
  const x = await t.Store.load(t.db, "uid", { key: "atest" });
  assert.deepEqual(Object.keys(x.progress.read), []);
  assert.equal(x.progress.difficulties.hard.hp, 100);
});

test("public materials are fetched only after grant verification and rechecked before trial load", async () => {
  const t = fixture(),
    calls = [];
  t.window.MathTowerContentUrl = "math-tower/chapter1.json";
  t.window.fetch = async (url) => {
    calls.push(url);
    return { ok: true, json: async () => ({ chapter: 1, version: 1 }) };
  };
  await t.Store.load(t.db, "uid", { key: "atest" });
  assert.equal(calls.length, 1);
  t.db.ref = () => ({
    get: async () => ({ val: () => ({ enabled: false, role: "teacher" }) }),
  });
  await assert.rejects(
    () => t.Store.load(t.db, "uid", { key: "atest" }),
    /試遊権限/,
  );
  assert.equal(calls.length, 1, "no material fetch for denied account");
});
test("revoked grant during download and failed network writes fail without overwriting trial records", async () => {
  const t = fixture();
  t.window.MathTowerContentUrl = "math-tower/chapter1.json";
  t.window.fetch = async () => {
    t.db.ref = () => ({ get: async () => ({ val: () => null }) });
    return { ok: true, json: async () => ({ chapter: 1, version: 1 }) };
  };
  await assert.rejects(
    () => t.Store.load(t.db, "uid", { key: "atest" }),
    /試遊権限/,
  );
  const u = fixture(),
    x = await u.Store.load(u.db, "uid", { key: "atest" }),
    original = u.db.ref;
  u.db.ref = (p) =>
    p.includes("/trialProgress/")
      ? {
          transaction: async () => {
            throw Error("NETWORK_ERROR");
          },
        }
      : original(p);
  await assert.rejects(
    () => u.Store.save(u.db, "uid", { key: "atest" }, x.progress),
    /NETWORK_ERROR/,
  );
  assert.equal(u.read(), null);
});
