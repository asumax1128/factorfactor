// Ver.6.0 A1b: freezeOnLogin. Writes only after a successful, non-empty read; every failure writes nothing.
const test = require("node:test"), assert = require("node:assert/strict");
const Keep = require("../src/title-keep-next.cjs");
const clone = (x) => JSON.parse(JSON.stringify(x));
const PATH = "games/factor/accounts/ax/stats";

// A tiny RTDB stand-in: get(), and an optimistic transaction that may start from a stale/empty cache, conflict, fail or hang.
function makeDb(initial, o = {}) {
  const st = { value: initial, version: 0, txCalls: 0, commits: 0 };
  const ref = (path) => {
    assert.equal(path, PATH);
    return {
      async get() { if (o.getError) throw Object.assign(new Error("Client is offline: /games/factor/accounts/aSECRET/stats"), { code: "unavailable" }); return { val: () => (st.value === undefined ? null : clone(st.value)) }; },
      async transaction(fn) {
        st.txCalls++;
        if (o.txError) throw Object.assign(new Error("denied at /games/factor/accounts/aSECRET"), { code: "PERMISSION_DENIED" });
        if (o.txHang) return new Promise(() => {});
        let input = o.staleFirst ? null : st.value, base = o.staleFirst ? -1 : st.version;
        for (let i = 0; i < 25; i++) {
          const out = fn(input === null || input === undefined ? input : clone(input));
          if (out === undefined) return { committed: false, snapshot: { val: () => clone(st.value) } };
          if (o.beforeCommit && i === 0) await o.beforeCommit(st);
          if (st.version === base) { st.value = out === null ? undefined : clone(out); st.version++; st.commits++; return { committed: true, snapshot: { val: () => (st.value === undefined ? null : clone(st.value)) } }; }
          input = st.value; base = st.version;
        }
        throw new Error("maxretry");
      },
    };
  };
  return { db: { ref }, st };
}
const run = (db, extra = {}) => Keep.freezeOnLogin({ db, key: "ax", stamp: 777, ...extra });
const holder = () => ({ maxStreak: 31, handiWins: 1, games: 50, A: { w: 20 }, B: { w: 18 }, exp: 5, nick: "streak10", vs: { b: { w: 1 } } });

test("first login after Ver.6.0: tk/tv2 are frozen from the real stats, nothing else changes", async () => {
  const { db, st } = makeDb(holder());
  const before = clone(st.value);
  assert.deepEqual(await run(db), { status: "frozen" });
  assert.equal(st.commits, 1);
  assert.deepEqual(st.value.tk, { v: 1, at: 777, ids: { dual: 1, handi: 1, streak10: 1, streak30: 1 } });
  assert.deepEqual(st.value.tv2.base, { games: 50, Aw: 20, Bw: 18 });
  const { tk, tv2, ...rest } = st.value;
  assert.deepEqual(rest, before, "old stats, nick (equipment) and every counter untouched");
});
test("a valid tk and tv2 mean no transaction at all", async () => {
  const s = holder(); Keep.ensureKeep(s, 1);
  const { db, st } = makeDb(s);
  assert.deepEqual(await run(db), { status: "present" });
  assert.equal(st.txCalls, 0);
});
test("absent / null / empty stats never write (the first stats transaction freezes them later)", async () => {
  for (const v of [undefined, null, {}]) {
    const { db, st } = makeDb(v);
    assert.deepEqual(await run(db), { status: "empty" });
    assert.equal(st.txCalls, 0); assert.equal(st.commits, 0);
  }
});
test("a failed read writes nothing and reports a safe code only", async () => {
  const { db, st } = makeDb(holder(), { getError: true });
  const r = await run(db);
  assert.deepEqual(r, { status: "read-failed", code: "unavailable" });
  assert.equal(st.txCalls, 0);
  const odd = await Keep.freezeOnLogin({ db: { ref: () => ({ get: async () => { throw new Error("secret /games/factor/accounts/aSECRET/stats"); } }) }, key: "ax", stamp: 1 });
  assert.deepEqual(odd, { status: "read-failed", code: "Error" }, "an error NAME is fine; a message or path is never returned");
  assert.equal(Keep.codeOf({ code: "a b/c" }), "unknown");
  assert.equal(Keep.codeOf(null), "unknown");
});
test("a transaction that starts from an empty cache is never committed as an empty freeze; the real data is used on retry", async () => {
  const { db, st } = makeDb(holder(), { staleFirst: true });
  assert.deepEqual(await run(db), { status: "frozen" });
  assert.equal(st.commits, 1);
  assert.deepEqual(st.value.tk.ids, { dual: 1, handi: 1, streak10: 1, streak30: 1 });
});
test("a transaction failure writes nothing, reports a code, and the holder is still held (next login retries)", async () => {
  const { db, st } = makeDb(holder(), { txError: true });
  const before = clone(st.value);
  assert.deepEqual(await run(db), { status: "failed", code: "PERMISSION_DENIED" });
  assert.deepEqual(st.value, before);
  for (const id of ["handi", "streak10", "streak30"]) assert.equal(Keep.held(st.value, id), true);
  const retry = makeDb(before);
  assert.deepEqual(await run(retry.db), { status: "frozen" }, "the next login freezes it");
});
test("a transaction that never answers (offline) times out without writing and without blocking", async () => {
  const { db, st } = makeDb(holder(), { txHang: true });
  const r = await run(db, { timeoutMs: 20 });
  assert.deepEqual(r, { status: "failed", code: "timeout" });
  assert.equal(st.commits, 0);
});
test("two devices logging in together freeze once; a Ver.5.25 writer racing in between is counted as already held", async () => {
  const a = makeDb(holder(), { beforeCommit: async (s) => { s.value.maxStreak = 10 + s.value.maxStreak; s.version++; } });
  const r1 = await run(a.db);
  assert.equal(r1.status, "frozen");
  assert.equal(a.st.value.maxStreak, 41);
  assert.deepEqual(a.st.value.tk.ids, { dual: 1, handi: 1, streak10: 1, streak30: 1 }, "built from the data that was committed");
  assert.deepEqual(await run(a.db), { status: "present" }, "the second device does nothing");
  assert.equal(a.st.commits, 1);
});
test("an unusable tk is rebuilt from the legacy counters; a missing tv2 is added; nothing is lost", async () => {
  const s = holder(); s.tk = { v: 1, ids: { handi: 0 } };
  const { db, st } = makeDb(s);
  assert.deepEqual(await run(db), { status: "frozen" });
  assert.deepEqual(st.value.tk.ids, { dual: 1, handi: 1, streak10: 1, streak30: 1 });
  const t = holder(); Keep.ensureKeep(t, 1); delete t.tv2;
  const m = makeDb(t);
  assert.deepEqual(await run(m.db), { status: "frozen" });
  assert.equal(Keep.validTv2(m.st.value.tv2), true);
});
test("bad arguments never reach the database", async () => {
  assert.deepEqual(await Keep.freezeOnLogin({ db: null, key: "ax", stamp: 1 }), { status: "failed", code: "bad-args" });
  assert.deepEqual(await Keep.freezeOnLogin({ db: makeDb({}).db, key: "", stamp: 1 }), { status: "failed", code: "bad-args" });
});
