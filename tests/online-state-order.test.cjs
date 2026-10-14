const assert = require("node:assert/strict"),
  { test } = require("node:test"),
  { older } = require("../src/online-state-order.cjs");
test("duplicate/reordered old views cannot reverse a question, accepted action or receipt", () => {
  const states = Array.from({ length: 15 }, (_, i) => ({
    id: "fixture-match",
    phase: "play",
    revision: i + 1,
    serverTime: 1000 + i * 800,
    game: { question: String(i), acceptedSeq: i },
  }));
  for (const old of states)
    for (const next of states)
      assert.equal(older(old, next), next.revision < old.revision);
  const end = { ...states.at(-1), phase: "settled", revision: 16 };
  for (const v of states) assert.equal(older(end, v), true);
  assert.equal(older(end, null), false);
  assert.equal(older(end, { id: "fresh", phase: "vote" }), false);
  assert.equal(older(states[4], { ...states[4], phase: "vote" }), true);
  assert.equal(
    older({ ...states[4], revision: 0 }, { ...states[2], revision: 0 }),
    true,
    "old-client time/sequence also guard order",
  );
});
test("opt-in instrumentation unregisters the actual wrapped callback", () => {
  const p = require("../src/online-performance.cjs");
  p.setEnabled(true);
  const active = new Set();
  const db = p.instrument({
    ref: () => ({
      on: (_, fn) => active.add(fn),
      off: (_, fn) => active.delete(fn),
    }),
  });
  const r = db.ref("fixture"),
    fn = () => {};
  r.on("value", fn);
  assert.equal(active.size, 1);
  r.off("value", fn);
  assert.equal(active.size, 0);
  p.setEnabled(false);
});

test("a transaction rerun failure aborts and rejects normally, without a dangling listener", async () => {
  const { tx } = require("../src/online-spark-client.cjs");
  let detached = 0;
  const r = {
    on: (_, fn) => queueMicrotask(fn),
    off: () => detached++,
    transaction: async (fn) => {
      fn({ revision: 1 });
      await Promise.resolve();
      assert.equal(
        fn({ revision: 2 }),
        undefined,
        "SDK rerun must receive an abort instead of a thrown exception",
      );
      return { committed: false };
    },
  };
  await assert.rejects(
    tx(r, (x) => {
      if (x.revision !== 1) throw Error("GHOST_CONFLICT_RESYNC");
      return { ...x, revision: 3 };
    }),
    /GHOST_CONFLICT_RESYNC/,
  );
  assert.equal(detached, 1);
});
