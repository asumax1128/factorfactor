// Ver.6.0 A1b: diagnostics + login freeze wrapper, using the REAL code from index.html.
const test = require("node:test"), assert = require("node:assert/strict"), fs = require("node:fs"), vm = require("node:vm");
const Keep = require("../src/title-keep-next.cjs"), Labels = require("../src/title-labels-next.cjs");
const html = fs.readFileSync("index.html", "utf8");
const cut = (a, b) => { const i = html.indexOf(a), j = html.indexOf(b, i); assert(i >= 0 && j > i, a); return html.slice(i, j); };
const clone = (x) => JSON.parse(JSON.stringify(x));
const code = cut("const BADGES = [", "function AchievementAuditPanel") + "\n" + cut("async function statsTx(acct, fn)", "const wkOf = s =>") + "\n" + cut("async function recordMatch(acct, info)", "/* ---------- 効果音");

function world({ initial = { games: 1 }, keep = Keep, db = true } = {}) {
  const store = { value: clone(initial), writes: 0 }, warns = [];
  const sandbox = {
    window: keep === null ? {} : { TitleKeepNext: keep },
    console: { warn: (...a) => warns.push(a.join(" ")) },
    titleLabelOf: (id) => Labels.resolve(id, null), isReal: (a) => !!(a && a.key), DBX: null, RATING_INIT: 1500, SEASON0: "2026-10", seasonKey: () => "2026-10", seasonReset: (r) => r,
    FX: { band() {}, confetti() {} }, fxSound() {}, setTimeout: (f) => f(),
    FB: { db: db ? { ref: () => ({ transaction: async (cb) => { const out = cb(clone(store.value)); if (out === undefined) return { committed: false }; store.value = clone(out); store.writes++; return { committed: true }; } }) } : null },
  };
  vm.createContext(sandbox);
  vm.runInContext(code + "\nthis.api = { KEEP_DIAG, keepStats, keepCheck, keepFreezeSeen, keepFreezeOnLogin, statsTx, recordMatch };", sandbox);
  return { api: sandbox.api, store, warns, sandbox };
}
const acct = { key: "aw" };
const winInfo = { outcome: "w", mode: "B", dr: 8, exp: 30, perfects: 0, vs: [], add: {}, max: {}, min: {}, or: {} };

test("diagnostics keep counts and the last cause only; warn once per kind; never throw", () => {
  const { api, warns } = world();
  const D = api.KEEP_DIAG;
  D.note("exception", "TypeError"); D.note("exception", "TypeError"); D.note("freeze-failed", "timeout");
  assert.deepEqual(JSON.parse(JSON.stringify(D.counts)), { exception: 2, "freeze-failed": 1 });
  assert.deepEqual(JSON.parse(JSON.stringify(D.last)), { kind: "freeze-failed", code: "timeout", n: 1 });
  assert.equal(warns.length, 2, "one warning per kind");
  assert.ok(warns.every((w) => w.startsWith("[title-keep]")));
  D.note("read-failed", "denied at /games/factor/accounts/aSECRET/stats");
  assert.equal(D.last.code, "unknown", "a path or message is never recorded");
  D.note("exception", { toString() { throw new Error("x"); } });
  D.note("x"); D.note(undefined, undefined);
  assert.equal(JSON.stringify([...warns, D.last]).includes("aSECRET"), false);
  const bad = world(); bad.sandbox.console.warn = () => { throw new Error("console broken"); };
  assert.doesNotThrow(() => bad.api.KEEP_DIAG.note("exception", "Error"));
});
test("a missing or throwing module is detected, and the transactions still complete exactly as before", async () => {
  const miss = world({ keep: null });
  const r = await miss.api.statsTx(acct, (s) => { s.exp = 7; return "ok"; });
  assert.equal(r.out, "ok"); assert.equal(miss.store.value.exp, 7); assert.equal("tk" in miss.store.value, false);
  await miss.api.recordMatch(acct, winInfo);
  assert.equal(miss.store.value.games, 2);
  assert.equal(miss.api.KEEP_DIAG.counts["missing-module"] >= 2, true);
  assert.equal(miss.api.KEEP_DIAG.counts["not-created"] >= 2, true, "tk absent after the commit is detected too");
  const boom = world({ keep: { ensureKeep() { throw new TypeError("boom"); } } });
  await boom.api.statsTx(acct, (s) => { s.exp = 3; });
  assert.equal(boom.store.value.exp, 3);
  assert.equal(boom.api.KEEP_DIAG.last.kind === "not-created" || boom.api.KEEP_DIAG.counts.exception >= 1, true);
  assert.equal(boom.api.KEEP_DIAG.counts.exception, 1);
});
test("with the module working nothing is reported", async () => {
  const w = world();
  await w.api.statsTx(acct, (s) => { s.exp = 1; });
  await w.api.recordMatch(acct, winInfo);
  assert.deepEqual(JSON.parse(JSON.stringify(w.api.KEEP_DIAG.counts)), {});
  assert.equal(w.warns.length, 0);
  assert.equal(w.store.value.tk.v, 1);
});
test("keepCheck: only a committed stats object without tk is reported", () => {
  const { api } = world();
  api.keepCheck(null); api.keepCheck(undefined); api.keepCheck({ tk: { v: 1 } });
  assert.deepEqual(JSON.parse(JSON.stringify(api.KEEP_DIAG.counts)), {});
  api.keepCheck({ exp: 1 });
  assert.equal(api.KEEP_DIAG.counts["not-created"], 1);
});

// ---- login wrapper ----
const fakeKeep = (results) => { const calls = []; return { calls, mod: { ...Keep, freezeOnLogin: async (a) => { calls.push(a); const r = results.shift() || { status: "present" }; if (r instanceof Error) throw r; return r; } } }; };
test("login freeze runs once per login, not for guests or without a database, and again after a logout", async () => {
  const f = fakeKeep([{ status: "frozen" }, { status: "present" }]);
  const w = world({ keep: f.mod });
  assert.equal(await w.api.keepFreezeOnLogin({ guest: true, name: "G" }), null);
  assert.equal(await w.api.keepFreezeOnLogin(null), null);
  assert.equal(await w.api.keepFreezeOnLogin(acct), "frozen");
  assert.equal(await w.api.keepFreezeOnLogin(acct), null, "same login: no duplicate");
  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0].key, "aw"); assert.deepEqual(JSON.parse(JSON.stringify(f.calls[0].stamp)), { ".sv": "timestamp" });
  w.api.keepFreezeSeen.clear(); // logout
  assert.equal(await w.api.keepFreezeOnLogin(acct), "present");
  assert.equal(f.calls.length, 2);
  const nodb = world({ keep: fakeKeep([]).mod, db: false });
  assert.equal(await nodb.api.keepFreezeOnLogin(acct), null);
});
test("login freeze failures are recorded (safe code only), never thrown, and never block", async () => {
  const f = fakeKeep([{ status: "read-failed", code: "unavailable" }, { status: "failed", code: "timeout" }, new TypeError("x"), { status: "empty" }]);
  const w = world({ keep: f.mod });
  for (const k of ["a1", "a2", "a3", "a4"]) await w.api.keepFreezeOnLogin({ key: k });
  assert.deepEqual(JSON.parse(JSON.stringify(w.api.KEEP_DIAG.counts)), { "read-failed": 1, "freeze-failed": 1, exception: 1 });
  const none = world({ keep: null });
  assert.equal(await none.api.keepFreezeOnLogin(acct), null);
  assert.equal(none.api.KEEP_DIAG.counts["missing-module"], 1);
  const old = world({ keep: { ensureKeep: Keep.ensureKeep } }); // a module version without the login function
  assert.equal(await old.api.keepFreezeOnLogin(acct), null);
  assert.equal(old.api.KEEP_DIAG.counts["missing-module"], 1);
});
test("there is no switch in the page that can turn the login freeze off", async () => {
  assert.equal(html.includes("fxf_no_keep_login"), false);
  const f = fakeKeep([{ status: "frozen" }]);
  const w = world({ keep: f.mod });
  w.sandbox.localStorage = { getItem: () => "1" }; // whatever a user stores, the freeze still runs
  assert.equal(await w.api.keepFreezeOnLogin(acct), "frozen");
  assert.equal(f.calls.length, 1);
});
test("the freeze is wired: AppRoot runs it once its account is real and the database is ready; logout clears the guard", () => {
  const root = cut("function AppRoot()", "const rootEl = document.getElementById('root')");
  assert.match(root, /isReal\(acct\)\) \{ keepFreezeSeen\.clear\(\); return; \}/);
  assert.match(root, /if \(!FB\.db \|\| !FB\.uid\) \{ t = setTimeout\(run, 500\); return; \} keepFreezeOnLogin\(acct\);/);
  assert.match(root, /\[acct && acct\.key\]\);/);
  assert.ok(root.indexOf("keepFreezeOnLogin(acct)") < root.indexOf("if (!acct) return"), "a hook placed before the early return");
});
