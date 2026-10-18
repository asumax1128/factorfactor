// Ver.6.0 A4: 逆境無双(handi) = 自分が★★★ハンデを背負って勝利。REAL BADGES / recordMatch / the real counter line from index.html.
const test = require("node:test"), assert = require("node:assert/strict"), fs = require("node:fs"), vm = require("node:vm");
const Keep = require("../src/title-keep-next.cjs"), Labels = require("../src/title-labels-next.cjs");
const html = fs.readFileSync("index.html", "utf8");
const cut = (a, b) => { const i = html.indexOf(a), j = html.indexOf(b, i); assert(i >= 0 && j > i, a); return html.slice(i, j); };
const clone = (x) => JSON.parse(JSON.stringify(x));
const badges = cut("const BADGES = [", "function AchievementAuditPanel");
const record = cut("async function recordMatch(acct, info)", "/* ---------- 効果音");

// the exact statement that decides the counter (single occurrence in the result screen)
const lines = html.split("\n").filter((l) => /add\.handiSelf\s*=/.test(l));
assert.equal(lines.length, 1);
assert.equal(html.split("add.handiWins").length - 1, 0, "6.0 must not write handiWins any more");
const counterLine = lines[0].trim();
const decide = (win, hc, me) => { const add = {}; vm.runInNewContext(counterLine, { win, hc, me, add }); return add; };

function world(initial, { keep = Keep } = {}) {
  const db = { value: initial, writes: 0 };
  const sandbox = {
    window: keep ? { TitleKeepNext: keep } : {},
    titleLabelOf: (id) => Labels.resolve(id, null),
    isReal: () => true, DBX: null, RATING_INIT: 1500, jstDate: (t = Date.now()) => new Date(t + 9 * 3600e3).toISOString().slice(0, 10), fbNow: () => Date.now(), SEASON0: "2026-10", seasonKey: () => "2026-10", seasonReset: (r) => r,
    FX: { band() {}, confetti() {} }, fxSound() {}, setTimeout: (f) => f(), console: { warn() {} },
    FB: { db: { ref: () => ({ transaction: async (cb) => {
      const out = cb(db.value === null ? null : clone(db.value));
      if (out === undefined) return { committed: false };
      db.value = clone(out); db.writes++; return { committed: true };
    } }) } },
  };
  vm.createContext(sandbox);
  vm.runInContext(badges + "\n" + record + "\nthis.api = { BADGES, badgesOf, recordMatch };", sandbox);
  return { db, sandbox, api: sandbox.api };
}
const acct = { key: "aw" };
const info = (add, extra = {}) => ({ outcome: "w", mode: "B", dr: 8, exp: 30, perfects: 0, vs: [], add, max: {}, min: {}, or: {}, ...extra });
const has = (api, st) => api.badgesOf(st).some((b) => b.id === "handi");

test("1 self ★★★ win -> counted; new acquisition is revealed with the official name", async () => {
  assert.deepEqual(decide(true, { aw: 3 }, "aw"), { handiSelf: 1 });
  const w = world({ games: 3, B: { w: 1 } });
  const r = await w.api.recordMatch(acct, info(decide(true, { aw: 3 }, "aw")));
  assert.equal(w.db.value.handiSelf, 1);
  assert.equal(has(w.api, w.db.value), true);
  assert.deepEqual([...r.badges.map((b) => b.id).filter((id) => id !== "first")], ["handi"]);
  assert.equal(r.badges.find((b) => b.id === "handi").label, "逆境無双");
});
test("2 only the opponent has ★★★ -> not counted, no title", async () => {
  assert.deepEqual(decide(true, { bb: 3 }, "aw"), {});
  const w = world({ games: 3 });
  await w.api.recordMatch(acct, info(decide(true, { bb: 3 }, "aw")));
  assert.equal(w.db.value.handiSelf, undefined);
  assert.equal(has(w.api, w.db.value), false);
});
test("3/4 loss or draw with own ★★★ -> not counted; lower handicap -> not counted", () => {
  assert.deepEqual(decide(false, { aw: 3 }, "aw"), {});
  assert.deepEqual(decide(false, { aw: 3 }, "aw"), {});
  assert.deepEqual(decide(true, { aw: 2 }, "aw"), {});
  assert.deepEqual(decide(true, {}, "aw"), {});
});
test("5 holder with tk keeps the title (tk.ids.handi), handiWins untouched", async () => {
  const w = world({ handiWins: 1, games: 40, A: { w: 20 }, B: { w: 15 }, nick: "handi" });
  await w.api.recordMatch(acct, info(decide(false, {}, "aw"), { outcome: "l" }));
  assert.equal(w.db.value.tk.ids.handi, 1);
  assert.equal(w.db.value.handiWins, 1);
  assert.equal(w.db.value.nick, "handi");
  assert.equal(has(w.api, w.db.value), true);
});
test("6 holder without tk keeps the title through the legacy counter", () => {
  const w = world(null);
  assert.equal(has(w.api, { handiWins: 1 }), true);
  assert.equal(has(w.api, { handiWins: 0 }), false);
  assert.equal(has(w.api, {}), false);
});
test("with a valid tk the live handiWins no longer grants (only tk or handiSelf)", () => {
  const w = world(null);
  assert.equal(has(w.api, { handiWins: 1, tk: { v: 1, at: 1 } }), false);
  assert.equal(has(w.api, { handiWins: 1, tk: { v: 1, at: 1, ids: { handi: 1 } } }), true);
  assert.equal(has(w.api, { tk: { v: 1, at: 1 }, handiSelf: 1 }), true);
  // a broken tk is ignored and never takes a held title away
  assert.equal(has(w.api, { handiWins: 1, tk: { v: 9 } }), true);
});
test("7 freeze failure (module missing / throws): held title kept, diagnosis recorded, game continues", async () => {
  for (const keep of [null, {}, { ensureKeep() { throw Object.assign(new Error("x"), { name: "Boom" }); }, isFrozen: () => false, keptIds: () => [] }]) {
    const w = world({ handiWins: 1, games: 5 }, { keep });
    const r = await w.api.recordMatch(acct, info(decide(true, { aw: 3 }, "aw")));
    assert.equal(w.db.value.handiWins, 1);
    assert.equal(w.db.value.handiSelf, 1);
    assert.equal(has(w.api, w.db.value), true);
    assert.equal(w.db.value.games, 6);
    assert(Array.isArray(r.badges));
    assert(w.sandbox.window.FXF_KEEP_DIAG.counts["missing-module"] || w.sandbox.window.FXF_KEEP_DIAG.counts.exception);
  }
});
test("8 the same room (b2 id) processed twice counts once", async () => {
  const w = world({ games: 3 });
  const i = info(decide(true, { aw: 3 }, "aw"), { id: "g1" });
  await w.api.recordMatch(acct, i); await w.api.recordMatch(acct, i);
  assert.equal(w.db.value.handiSelf, 1);
  assert.equal(w.db.value.games, 4);
});
test("9 handiWins never increases from 6.0 (opponent-only and self cases)", async () => {
  const w = world({ handiWins: 2, games: 9 });
  await w.api.recordMatch(acct, info(decide(true, { bb: 3 }, "aw")));
  await w.api.recordMatch(acct, info(decide(true, { aw: 3 }, "aw")));
  assert.equal(w.db.value.handiWins, 2);
  const w0 = world({ games: 1 });
  await w0.api.recordMatch(acct, info(decide(true, { aw: 3 }, "aw")));
  assert.equal(w0.db.value.handiWins, undefined);
});
test("10 other titles, old stats and the equipped title are unchanged by a handi acquisition", async () => {
  const start = { games: 10, w: 6, B: { w: 4 }, maxStreak: 3, streak: 0, exp: 100, nick: "streak10", vs: { x: { w: 1, last: "w" } } };
  const w = world(clone(start));
  await w.api.recordMatch(acct, info(decide(true, { aw: 3 }, "aw")));
  const v = w.db.value;
  assert.equal(v.nick, "streak10");
  assert.equal(v.handiWins, undefined);
  assert.equal(v.maxStreak, 3);
  assert.equal(v.exp, 130);
  const ids = (st) => w.api.badgesOf(st).map((b) => b.id);
  assert.deepEqual([...ids(v).filter((id) => !ids(start).includes(id))], ["handi"]);
  assert(ids(start).every((id) => ids(v).includes(id)));
});
test("11 Ver.5.25 compatibility: data written by 6.0 stays readable and 5.25-written handiWins is held until frozen", () => {
  // 5.25 test (legacy expression) on 6.0 data: handiWins/tk are unchanged, extra fields are ignored
  const legacy = (st) => (st.handiWins || 0) >= 1;
  assert.equal(legacy({ handiWins: 1, tk: { v: 1, at: 1, ids: { handi: 1 } }, handiSelf: 1 }), true);
  // a 5.25 client writing handiWins for an account with no tk yet is treated as held (legacy), exactly like 5.25
  const w = world(null);
  assert.equal(has(w.api, { handiWins: 1 }), true);
  // known limitation (recorded): once tk exists, a later 5.25 write of handiWins is not counted by 6.0
  assert.equal(has(w.api, { handiWins: 1, tk: { v: 1, at: 1 } }), false);
});
test("catalog text and BADGES description match; frozen legacy test is unchanged", () => {
  const cat = JSON.parse(fs.readFileSync("src/title-catalog-next.json", "utf8"));
  const list = Array.isArray(cat) ? cat : cat.titles;
  const t = list.find((x) => x.id === "handi");
  assert.equal(t.name, "逆境無双");
  assert.match(t.condition, /ハンデを背負って勝利/);
  assert.match(badges, /id: 'handi'[^\n]*desc: 'ハンデ★★★を背負って勝つ'/);
  assert.equal(Keep.LEGACY_TESTS.handi({ handiWins: 1 }), true);
  assert.equal(Keep.LEGACY_TESTS.handi({ handiSelf: 5 }), false);
});
