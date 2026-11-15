// Ver.6.32 (daily missions removed): saving the learning record is exactly as before, for every mode that saves one:
// solo, CPU practice, weekly boss / class raid, drill, online battle (rooms and the B2 receipt path).
// The functions of the last version before the removal (Ver.6.31, commit 454c332) and the ones in the page now are run on the
// same inputs against the same in-memory database; the saved learning record (prof) must be identical, and the only difference in
// what is written is that nothing goes under `mis` any more.
const test = require("node:test"), assert = require("node:assert/strict"), fs = require("node:fs"), vm = require("node:vm"), cp = require("node:child_process");
const OLD_COMMIT = "454c3321572ad1a5b51339c8cbe8dab1b80f750d";
const now = fs.readFileSync("index.html", "utf8");
let old = null;
try { old = cp.execFileSync("git", ["show", OLD_COMMIT + ":index.html"], { encoding: "utf8", maxBuffer: 30e6, stdio: ["ignore", "pipe", "ignore"] }); } catch (e) {}
const fn = (html, head) => { const i = html.indexOf(head); assert(i >= 0, head); const j = html.indexOf("\n}\n", i); return html.slice(i, j + 3); };
const clone = (x) => JSON.parse(JSON.stringify(x));
function world(html, real) {
  const data = {}, writes = [], ls = {}, missions = [];
  const ref = (path) => ({ transaction: async (f) => { writes.push(path); const v = f(data[path] === undefined ? null : clone(data[path])); if (v !== undefined) data[path] = clone(v); return { committed: v !== undefined, snapshot: { val: () => data[path] } }; } });
  const sandbox = { FB: { db: real ? { ref } : null }, isReal: (a) => real && !!(a && a.key), loadLS: (k, d) => (k in ls ? clone(ls[k]) : d), saveLS: (k, v) => { ls[k] = clone(v); }, PROF_LS: "fxf_guest_prof_v1",
    Date: { now: () => 1700000000000 }, jstDate: () => "2026-11-15", B2_RCPT: { at: {}, failed: {} }, missionEvent: async (...a) => { missions.push(a); return true; } };
  vm.createContext(sandbox);
  vm.runInContext(fn(html, "function applyLearn(p, rec)") + "\n" + fn(html, "async function flushLearn(acct, rec, extra)") + "\n" + fn(html, "async function flushOnlineLearn(acct,matchId,rows,extra)") + "\nthis.api = { flushLearn, flushOnlineLearn };", sandbox);
  return { api: sandbox.api, data, writes, ls, missions };
}
const rows = [
  { lv: 1, pid: "p1a", ok: true, ms: 850, j: "Perfect" }, { lv: 3, pid: "p3c", ok: true, ms: 2400, j: "Great" }, { lv: 3, pid: "p3c", ok: false, ms: 5100 },
  { lv: 6, pid: "p6b", ok: true, ms: 40, j: "Perfect" }, { lv: 9, pid: "p9a", ok: true, ms: 19000, j: "Good", late: true }, null, { lv: 2, ok: true, ms: 1300, timeout: true }, { ok: true, ms: 900 },
];
const online = rows.filter(Boolean);   // the online battle hands over complete rows only
// the calls each mode makes (the call sites are compared with the old page below)
const MODES = {
  "solo (通常プレイ)": (api, a) => api.flushLearn(a, rows, { solo: 1, clear: 1, combo: 12 }),
  "drill (学びの部屋のドリル)": (api, a) => api.flushLearn(a, rows.filter((h) => h && !h.late), { drill: 1 }),
  "weekly boss / class raid": (api, a) => api.flushLearn(a, rows, { raid: 1 }),
  "CPU practice": (api, a) => api.flushLearn(a, rows, { combo: 7 }),
  "online battle (room)": (api, a) => api.flushLearn(a, rows, { battle: 1, win: 1, combo: 9 }),
  "online battle (B2 receipt)": (api, a) => api.flushOnlineLearn(a, "room:G1", online, { battle: 1, win: 0, combo: 4 }),
  "online battle (B2 receipt, sent twice)": async (api, a) => { await api.flushOnlineLearn(a, "room:G1", online, { battle: 1, win: 1, combo: 4 }); await api.flushOnlineLearn(a, "room:G1", online, { battle: 1, win: 1, combo: 4 }); },
  "online battle (rated / ghost: no extra)": (api, a) => api.flushOnlineLearn(a, "spark:M1", online),
  "nothing answered": (api, a) => api.flushLearn(a, [], { solo: 1, clear: 0, combo: 0 }),
};
for (const [mode, run] of Object.entries(MODES)) for (const real of [true, false]) {
  test(`${mode} / ${real ? "registered account" : "guest"}: the saved learning record is identical to Ver.6.31`, { skip: !old && "the Ver.6.31 commit is not in this checkout" }, async () => {
    const acct = real ? { key: "akid", name: "Kid" } : { guest: true, name: "Guest" };
    const before = world(old, real), after = world(now, real);
    const seed = { lv: { L1: { n: 4, ok: 3, ms: 3000, bestMs: 700 } }, pt: { p1a: { n: 4, ok: 3 } }, at: 5 };
    for (const w of [before, after]) { if (real) w.data["games/factor/accounts/akid/prof"] = clone(seed); else w.ls.fxf_guest_prof_v1 = clone(seed); }
    await run(before.api, acct); await run(after.api, acct);
    assert.deepEqual(after.data, before.data, "database contents");
    assert.deepEqual(after.ls, before.ls, "this device's saved learning record (guest)");
    assert.deepEqual(after.writes, before.writes, "the same writes, in the same order");
    assert(after.writes.every((p) => /\/prof$/.test(p)), "only the learning record is written");
    assert.equal(after.missions.length, 0, "the new page makes no mission call");
    if (mode !== "nothing answered") {
      if (!/no extra/.test(mode)) assert(before.missions.length >= 1, "self-check: the old page did make the mission call here");
      const prof = real ? after.data["games/factor/accounts/akid/prof"] : after.ls.fxf_guest_prof_v1;
      assert(prof.lv.L3.n >= 2 && prof.pt.p3c.ok >= 1, "self-check: the learning record really changed");
    }
  });
}
test("the places that save a learning record are the same as in Ver.6.31 (no call added, removed or changed)", { skip: !old && "the Ver.6.31 commit is not in this checkout" }, () => {
  const calls = (html) => html.split("\n").filter((l) => /flush(Online)?Learn\(/.test(l) && !/^async function flush/.test(l)).map((l) => (l.match(/(?:await )?flush(?:Online)?Learn\([^;]*;/g) || []).join(" "));
  assert.deepEqual(calls(now), calls(old));
  assert.equal(calls(now).filter(Boolean).length, 7, "solo, drill, class raid, weekly boss, room battle (+ CPU practice), flushOnlineLearn's guest fallback, rated online: " + JSON.stringify(calls(now)));
});
test("flushOnlineLearn still refuses to report success when the learning record could not be saved", async () => {
  const html = now;   // a transaction that does not commit
  const sb = { FB: { db: { ref: () => ({ transaction: async () => ({ committed: false }) }) } }, isReal: () => true, loadLS: () => null, saveLS() {}, PROF_LS: "x", Date, jstDate: () => "2026-11-15" };
  vm.createContext(sb); vm.runInContext(fn(html, "function applyLearn(p, rec)") + "\n" + fn(html, "async function flushLearn(acct, rec, extra)") + "\n" + fn(html, "async function flushOnlineLearn(acct,matchId,rows,extra)") + "\nthis.api = { flushOnlineLearn };", sb);
  await assert.rejects(sb.api.flushOnlineLearn({ key: "akid" }, "room:G2", rows, { battle: 1 }), /学習記録を保存できませんでした/);
});
