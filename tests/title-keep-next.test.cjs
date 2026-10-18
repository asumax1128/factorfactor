// Ver.6.0 A1: stats.tk (already-held legacy titles) and stats.tv2.base. Pure logic + RTDB-style transaction behaviour.
const test = require("node:test"), assert = require("node:assert/strict"), fs = require("node:fs"), vm = require("node:vm");
const Keep = require("../src/title-keep-next.cjs");
const clone = (x) => JSON.parse(JSON.stringify(x));

// ---- the frozen legacy conditions equal the live BADGES conditions (exact source and behaviour) ----
const html = fs.readFileSync("index.html", "utf8");
const badgesSrc = html.slice(html.indexOf("const BADGES = ["), html.indexOf("const badgesOf"));
const scope = { window: {} };
vm.createContext(scope);
vm.runInContext(badgesSrc + "\nthis.B = BADGES.map(b => ({ id: b.id, src: String(b.test), test: b.test }));", scope);
const live = new Map(scope.B.map((b) => [b.id, b]));
const CHANGED = ["handi", "mis7"]; // live conditions switched to the official ones on purpose (steps A4+); the frozen copies stay the 5.25 ones
const norm = (f) => String(f).replace(/\s+/g, "").replace(/^\(st\)=>/, "st=>");

test("the 8 frozen legacy conditions are exactly the current BADGES conditions", () => {
  assert.deepEqual([...Keep.KEEP_IDS].sort(), ["cancel2000", "cancel500", "darkhorse", "handi", "mis7", "streak10", "streak30", "streak50"]);
  // A4 (owner-approved): the LIVE handi condition changed on purpose (self ★★★ win); the frozen copy stays the 5.25 one.
  // Without a keep module and without tk the live handi falls back to the legacy counter, so the value checks below still hold.
  for (const id of Keep.KEEP_IDS.filter((x) => !CHANGED.includes(x))) assert.equal(norm(Keep.LEGACY_TESTS[id]), norm(live.get(id).src), id + " source");
  assert.equal(norm(Keep.LEGACY_TESTS.handi), "st=>(st.handiWins||0)>=1"); assert.equal(norm(Keep.LEGACY_TESTS.mis7), "st=>(st.misDays||0)>=7");
  const values = [undefined, null, 0, 1, 2, 6, 7, 9, 10, 11, 29, 30, 31, 49, 50, 51, 499, 500, 501, 1999, 2000, 2001, -1, "7", NaN];
  const fields = ["handiWins", "maxStreak", "misDays", "cancelTotal", "darkHorse"];
  for (const f of fields) for (const v of values) {
    const st = v === undefined ? {} : { [f]: v };
    for (const id of Keep.KEEP_IDS) assert.equal(Keep.LEGACY_TESTS[id](st), !!live.get(id).test(st), `${id} ${f}=${String(v)}`);
  }
  assert.equal(Object.isFrozen(Keep.LEGACY_TESTS), true, "frozen: cannot be edited at runtime");
});

// ---- ensureKeep ----
test("holders are frozen into tk, non-holders are not, totals are recorded as the base", () => {
  const s = { maxStreak: 12, handiWins: 1, misDays: 6, cancelTotal: 499, darkHorse: 0, games: 40, A: { w: 20 }, B: { w: 15 }, exp: 99 };
  const before = clone(s);
  const r = Keep.ensureKeep(s, 111);
  assert.deepEqual(r, { tk: true, tv2: true });
  assert.deepEqual(s.tk, { v: 1, at: 111, ids: { handi: 1, streak10: 1 } });
  assert.deepEqual(s.tv2, { v: 1, since: 111, base: { games: 40, Aw: 20, Bw: 15 } });
  for (const k of Object.keys(before)) assert.deepEqual(s[k], before[k], "old stats untouched: " + k);
});
test("a player with no history gets an empty tk (ids omitted) and zero base; nobody is treated as holding anything", () => {
  for (const s of [{}, { w: 1 }, { games: "x", A: 5 }]) {
    Keep.ensureKeep(s, 5);
    assert.deepEqual(s.tk, { v: 1, at: 5 });
    assert.deepEqual(s.tv2.base, { games: s.games === "x" ? 0 : 0, Aw: 0, Bw: 0 });
    for (const id of Keep.KEEP_IDS) assert.equal(Keep.held(s, id), false);
  }
});
test("a valid tk / tv2 is never overwritten, even when the counters moved on", () => {
  const s = { maxStreak: 12, games: 40 };
  Keep.ensureKeep(s, 1);
  const frozen = clone({ tk: s.tk, tv2: s.tv2 });
  s.maxStreak = 60; s.cancelTotal = 5000; s.games = 99;
  assert.deepEqual(Keep.ensureKeep(s, 2), { tk: false, tv2: false });
  assert.deepEqual({ tk: s.tk, tv2: s.tv2 }, frozen);
  assert.deepEqual(Keep.keptIds(s), ["streak10"]);
});
test("unusable tk is ignored and rebuilt from the legacy counters (no title is ever lost)", () => {
  const bad = [null, 1, "x", [], {}, { v: 2 }, { v: "1" }, { v: 1, ids: 5 }, { v: 1, ids: [] }, { v: 1, ids: { zzz: 1 } }, { v: 1, ids: { handi: 0 } }, { v: 1, ids: { handi: "yes" } }];
  for (const tk of bad) {
    const s = { handiWins: 2, maxStreak: 31, tk: clone(tk) };
    if (tk === undefined) delete s.tk;
    assert.equal(Keep.validKeep(tk), false, JSON.stringify(tk));
    for (const id of Keep.KEEP_IDS) assert.equal(Keep.held(s, id), Keep.LEGACY_TESTS[id](s), "held falls back to legacy: " + id);
    assert.equal(Keep.ensureKeep(s, 9).tk, true);
    assert.deepEqual(s.tk, { v: 1, at: 9, ids: { handi: 1, streak10: 1, streak30: 1 } });
  }
  for (const tk of [{ v: 1 }, { v: 1, at: 3, ids: { handi: 1 } }, { v: 1, ids: { handi: true } }]) assert.equal(Keep.validKeep(tk), true);
});
test("an unusable tv2 is repaired without dropping fields later steps add", () => {
  const s = { games: 7, A: { w: 3 }, B: { w: 2 }, tv2: { v: 1, streak: { cur: 4 } } };
  Keep.ensureKeep(s, 8);
  assert.deepEqual(s.tv2, { v: 1, since: 8, base: { games: 7, Aw: 3, Bw: 2 }, streak: { cur: 4 } });
  const t = { games: 7, tv2: "broken" };
  Keep.ensureKeep(t, 8);
  assert.equal(Keep.validTv2(t.tv2), true);
  assert.doesNotThrow(() => Keep.ensureKeep(null, 1));
  assert.doesNotThrow(() => Keep.ensureKeep(undefined, 1));
});
test("held() equals the legacy result in A1, and a frozen title survives a counter that later drops", () => {
  const s = { maxStreak: 30, cancelTotal: 2000, misDays: 3 };
  Keep.ensureKeep(s, 1);
  for (const id of Keep.KEEP_IDS) assert.equal(Keep.held(s, id), Keep.LEGACY_TESTS[id](s));
  s.maxStreak = 0; s.cancelTotal = 0; // reset / bug / tampering: frozen titles stay
  assert.deepEqual(["streak10", "streak30", "cancel500", "cancel2000"].filter((id) => Keep.held(s, id)), ["streak10", "streak30", "cancel500", "cancel2000"]);
  assert.equal(Keep.held(s, "mis7"), false);
  assert.equal(Keep.held(s, "first"), false, "ids outside the 8 are never reported");
});

// ---- RTDB-style optimistic transaction: retries on conflict, may start from a stale/null cache, may abort ----
class MockRef {
  constructor(value) { this.value = value; this.version = 0; this.commits = []; }
  async transaction(fn, { staleFirst = false, pause = async () => {} } = {}) {
    let input = staleFirst ? null : this.value, base = staleFirst ? -1 : this.version;
    for (let i = 0; i < 25; i++) {
      const out = fn(input === null || input === undefined ? input : clone(input));
      if (out === undefined) return { committed: false };
      await pause(i);
      if (this.version === base) { this.value = clone(out); this.version++; this.commits.push(clone(out)); return { committed: true, value: this.value }; }
      input = this.value; base = this.version;
    }
    throw new Error("maxretry");
  }
}
const keepTx = (mutate = () => {}) => (s) => { s = s || {}; Keep.ensureKeep(s, 1000); mutate(s); return s; };

test("two devices race: tk is frozen exactly once, from the data that was actually committed", async () => {
  const ref = new MockRef({ maxStreak: 11, games: 12, nick: "streak10" });
  const tick = async () => { await new Promise((r) => setImmediate(r)); };
  const [a, b] = await Promise.all([ref.transaction(keepTx(), { pause: tick }), ref.transaction(keepTx((s) => { s.exp = 5; }), { pause: tick })]);
  assert.equal(a.committed && b.committed, true);
  const freezes = ref.commits.filter((c, i) => c.tk && !(i > 0 && JSON.stringify(ref.commits[i - 1].tk) === JSON.stringify(c.tk)));
  assert.equal(freezes.length, 1, "the freeze is committed once");
  assert.deepEqual(ref.value.tk.ids, { streak10: 1 });
  assert.equal(ref.value.nick, "streak10"); assert.equal(ref.value.exp, 5);
});
test("a 5.25-style writer racing the freeze: whatever it committed first is counted as already held", async () => {
  const ref = new MockRef({ maxStreak: 9, games: 9 });
  const tick = async () => { await new Promise((r) => setImmediate(r)); };
  const legacy = ref.transaction((s) => { s = s || {}; s.maxStreak = 10; s.games = 10; return s; }, { pause: tick });
  const six = ref.transaction(keepTx(), { pause: tick });
  await Promise.all([legacy, six]);
  assert.equal(ref.value.maxStreak, 10);
  assert.equal(Keep.held(ref.value, "streak10"), true, "held either way");
  const c = ref.commits.find((x) => x.tk);
  assert.equal(!!(c.tk.ids || {}).streak10, c.maxStreak >= 10, "tk matches the data of the commit that created it");
  assert.equal(c.tv2.base.games, c.games, "base matches the same data");
});
test("a stale first attempt (null cache) never commits an empty tk over real history", async () => {
  const ref = new MockRef({ handiWins: 3, maxStreak: 51, games: 80, A: { w: 40 }, B: { w: 30 } });
  await ref.transaction(keepTx(), { staleFirst: true });
  assert.equal(ref.commits.length, 1);
  assert.deepEqual(ref.value.tk.ids, { handi: 1, streak10: 1, streak30: 1, streak50: 1 });
  assert.deepEqual(ref.value.tv2.base, { games: 80, Aw: 40, Bw: 30 });
});
test("aborted / failed transactions change nothing, and every legacy holder is still held", async () => {
  const start = { handiWins: 1, maxStreak: 10, cancelTotal: 500 };
  const ref = new MockRef(clone(start));
  const r = await ref.transaction((s) => { Keep.ensureKeep(s, 1); return undefined; });
  assert.equal(r.committed, false);
  await assert.rejects(ref.transaction((s) => { Keep.ensureKeep(s, 1); throw new Error("network"); }), /network/);
  assert.deepEqual(ref.value, start);
  assert.equal(ref.commits.length, 0);
  for (const id of ["handi", "streak10", "cancel500"]) assert.equal(Keep.held(ref.value, id), true);
});
test("a second transaction after the freeze does not rewrite it (no extra Firebase write for the freeze)", async () => {
  const ref = new MockRef({ maxStreak: 10 });
  await ref.transaction(keepTx());
  const tk = clone(ref.value.tk), tv2 = clone(ref.value.tv2);
  await ref.transaction(keepTx((s) => { s.exp = 1; }));
  assert.deepEqual(ref.value.tk, tk); assert.deepEqual(ref.value.tv2, tv2);
  const empty = new MockRef(null);
  await empty.transaction(keepTx()); // ids omitted for a non-holder: still counts as frozen
  const first = clone(empty.value.tk);
  await empty.transaction(keepTx());
  assert.deepEqual(empty.value.tk, first);
});
test("Ver.5.25-style stats (no tk / tv2, unknown extras) load and keep every existing field", () => {
  const s = { exp: 10, rating: 1500.4, games: 3, w: 2, A: { w: 2 }, vs: { ax: { w: 1, last: "w" } }, nick: "", skin: { tile: "x" }, weirdFutureKey: [1, 2] };
  const before = clone(s);
  Keep.ensureKeep(s, 1);
  const { tk, tv2, ...rest } = s;
  assert.deepEqual(rest, before);
  assert.equal(Keep.validKeep(tk) && Keep.validTv2(tv2), true);
});
