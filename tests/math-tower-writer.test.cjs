const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  vm = require("node:vm"),
  fs = require("node:fs");
const R = require("../math-tower-core");
function make(writeOverride) {
  const window = { MathTowerRules: R };
  vm.runInNewContext(
    fs.readFileSync(require.resolve("../math-tower-store.js"), "utf8"),
    { window },
  );
  let local = R.fresh(),
    remote = R.copy(local),
    active = 0,
    max = 0,
    writes = 0;
  const busy = [];
  const writer = window.MathTowerStore.createWriter({
    read: () => local,
    commit: (p) => {
      local = p;
    },
    busy: (v) => busy.push(v),
    write: async (p) => {
      active++;
      max = Math.max(max, active);
      writes++;
      try {
        await new Promise((r) => setTimeout(r, 15));
        if (writeOverride) await writeOverride(p);
        if (p.revision !== remote.revision)
          throw Object.assign(Error("conflict"), { code: "TOWER_CONFLICT" });
        remote = { ...p, revision: p.revision + 1 };
        return R.copy(remote);
      } finally {
        active--;
      }
    },
  });
  writer.reset(local);
  return {
    writer,
    busy,
    local: () => local,
    remote: () => remote,
    max: () => max,
    writes: () => writes,
    replace: (p) => {
      local = p;
      remote = R.copy(p);
    },
  };
}
test("delayed rapid events are serialized, rebased and revision is committed before the next save", async () => {
  const t = make();
  const jobs = [1, 2, 3].map((i) =>
    t.writer.enqueue((p) => {
      p.read["event" + i] = true;
      return p;
    }),
  );
  await Promise.all(jobs);
  assert.equal(t.max(), 1);
  assert.equal(t.local().revision, 3);
  assert.deepEqual(Object.keys(t.remote().read), [
    "event1",
    "event2",
    "event3",
  ]);
  assert.deepEqual(t.busy, [true, true, true, true, true, false]);
  await t.writer.enqueue((p) => p);
  assert.equal(t.writes(), 3, "unchanged book close must not write");
});
test("a failed save is not acknowledged and queued later changes cannot overwrite it", async () => {
  let fail = true;
  const t = make(async () => {
    if (fail) throw Error("NETWORK_ERROR");
  });
  const jobs = [
    t.writer.enqueue((p) => ({ ...p, reward: true })),
    t.writer.enqueue((p) => ({ ...p, fragment: true })),
  ];
  const results = await Promise.allSettled(jobs);
  assert(results.every((x) => x.status === "rejected"));
  assert.equal(t.local().revision, 0);
  assert.equal(t.remote().reward, false);
  assert.equal(t.writes(), 1);
  fail = false;
  await t.writer.enqueue((p) => ({ ...p, reward: true }), true);
  assert.equal(t.local().revision, 1);
  assert.equal(t.remote().reward, true);
});
test("true conflict cannot be retried with stale data; explicit reset to freshly loaded data recovers", async () => {
  let fail = true;
  const t = make(async () => {
    if (fail) throw Object.assign(Error("changed"), { code: "TOWER_CONFLICT" });
  });
  await assert.rejects(
    () => t.writer.enqueue((p) => ({ ...p, reward: true })),
    (e) => e.code === "TOWER_CONFLICT",
  );
  await assert.rejects(
    () => t.writer.enqueue((p) => ({ ...p, fragment: true }), true),
    (e) => e.code === "TOWER_CONFLICT",
  );
  assert.equal(t.writes(), 1);
  const latest = { ...R.fresh(), revision: 5 };
  t.replace(latest);
  t.writer.reset(latest);
  assert.equal(t.writer.isBusy(), false);
  fail = false;
  await t.writer.enqueue((p) => ({ ...p, fragment: true }));
  assert.equal(t.local().revision, 6);
  assert.equal(t.remote().fragment, true);
});
