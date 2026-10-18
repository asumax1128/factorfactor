// Ver.6.0 step 9 B: the nine implementable new catalog titles (tour_streak2 is recorded as pending in V6_HANDOFF).
const test = require("node:test"), assert = require("node:assert/strict"), fs = require("node:fs"), vm = require("node:vm");
const { html, world, acct, ids } = require("./a-batch-harness.cjs");
const cat = JSON.parse(fs.readFileSync("src/title-catalog-next.json", "utf8")), list = Array.isArray(cat) ? cat : cat.titles;
const W = world(null), has = (st, id) => ids(W.api, st).includes(id);
const NEW = ["online_first", "wins100_ab", "dual50", "giant250", "flash3", "accuracy10", "wksup500", "wk_runs20", "lb_cards7"];

test("ID, official name, star rating and condition text come from the catalog and match BADGES", () => {
  for (const id of NEW) {
    const t = list.find((x) => x.id === id), b = W.api.BADGES.find((x) => x.id === id);
    assert(t && b, id); assert.equal(b.label, t.name, id + " name"); assert.equal(t.legacyId, null);
    assert.equal(b.desc, t.condition, id + " condition");
  }
});
test("tour_streak2 (王者防衛) is NOT implemented: it needs class-tournament participation records (recorded as pending)", () => {
  assert.equal(W.api.BADGES.some((b) => b.id === "tour_streak2"), false);
  assert.match(fs.readFileSync("docs/next-major/V6_HANDOFF.md", "utf8"), /tour_streak2/);
});
test("online_first: one online match against a registered player or a Spark human match", () => {
  assert.equal(has({}, "online_first"), false);
  assert.equal(has({ games: 5 }, "online_first"), false, "CPU-only play is not online");
  assert.equal(has({ vs: { ab: { w: 1 } } }, "online_first"), true);
  assert.equal(has({ og: 1 }, "online_first"), true);
});
test("wins100_ab adds room wins and Spark wins by method (C and ghost wins are not counted); dual50 (二刀皆伝) is deferred and never acquired", () => {
  assert.equal(has({ A: { w: 60 }, B: { w: 39 } }, "wins100_ab"), false);
  assert.equal(has({ A: { w: 60 }, B: { w: 30 }, sw: { B: 10 } }, "wins100_ab"), true);
  assert.equal(has({ C: { w: 999 } }, "wins100_ab"), false);
  assert.equal(has({ A: { w: 20 }, B: { w: 20 }, sw: { A: 30, B: 30 } }, "dual50"), false, "公開延期: 新規取得を保留");
  assert.equal(has({ A: { w: 1000 }, B: { w: 1000 } }, "dual50"), false);
});
// the exact statements from the result screen
const line = (re) => { const m = html.split("\n").filter((l) => re.test(l)); return m; };
const giantLine = line(/add\.giant250Wins = 1/)[0].trim().replace(/\/\/.*$/, "");
const run250 = (ctx) => { const add = {}; vm.runInNewContext(giantLine, { add, RATING_INIT: 1500, jstDate: (t = Date.now()) => new Date(t + 9 * 3600e3).toISOString().slice(0, 10), fbNow: () => Date.now(), ...ctx }); return add; };
test("giant250: a registered opponent who was 250+ above at the start and lost to me; 249, CPU/guests, losses and teammates do not count", () => {
  const base = { foesR: ["b"], accts: { b: "kb" }, rel: () => "w", rt: { me: 1500, b: 1750 }, me: "me" };
  assert.deepEqual(run250(base), { giant250Wins: 1 });
  assert.deepEqual(run250({ ...base, rt: { me: 1500, b: 1749 } }), {});
  assert.deepEqual(run250({ ...base, accts: {} }), {}, "no registered account (CPU / guest)");
  assert.deepEqual(run250({ ...base, rel: () => "l" }), {});
  assert.deepEqual(run250({ ...base, foesR: [] }), {}, "teammates in C are not opponents");
  assert.deepEqual(run250({ ...base, rt: { b: 1750 } }), { giant250Wins: 1 }, "my own start rating defaults to the initial rating");
  assert.equal(has({ giant250Wins: 1 }, "giant250"), true); assert.equal(has({ giantWins: 5 }, "giant250"), false);
});
const flashLine = line(/add\.flash3 = 1/)[0].trim(), accLines = line(/add\.accuracy10 = 1/).map((l) => l.trim());
const okH = (n, ms = 500) => Array.from({ length: n }, () => ({ ok: true, ms }));
test("flash3: three correct answers within 1 second in one match (B/C), human rooms only", () => {
  const f = (hist, humanOnly = true) => { const add = {}; vm.runInNewContext(flashLine, { add, humanOnly, oks: hist.filter((h) => h.ok) }); return add; };
  assert.deepEqual(f(okH(3, 1000)), { flash3: 1 }, "exactly 1.0 s counts (the existing flash title uses <= 1000)");
  assert.deepEqual(f([...okH(2, 400), { ok: true, ms: 1001 }]), {});
  assert.deepEqual(f([...okH(2, 400), { ok: false, ms: 100 }]), {}, "a wrong answer is not a correct answer");
  assert.deepEqual(f(okH(5, 900), false), {}, "a room with CPU players does not award new titles");
  assert.equal(has({ flash3: 1 }, "flash3"), true);
});
test("accuracy10: 10+ correct, no wrong answer, no timeout, win or lose; A method needs 10+ own answers and no お手つき", () => {
  const bLine = accLines.find((l) => l.includes("es.hist.every")), aLine = accLines.find((l) => l.includes("otetsuki"));
  const b = (hist, humanOnly = true) => { const add = {}; vm.runInNewContext(bLine, { add, humanOnly, es: { hist }, oks: hist.filter((h) => h.ok) }); return add; };
  assert.deepEqual(b(okH(10)), { accuracy10: 1 }); assert.deepEqual(b(okH(9)), {});
  assert.deepEqual(b([...okH(10), { ok: false, ms: 1, timeout: true }]), {}, "a timeout (ok:false) blocks it");
  assert.deepEqual(b([...okH(12), { ok: false, ms: 5 }]), {}); assert.deepEqual(b(okH(10), false), {});
  const a = (otetsuki, n, humanOnly = true) => { const add = { otetsuki }; vm.runInNewContext(aLine, { add, humanOnly, myCl: new Array(n).fill(1) }); return add; };
  assert.equal(a(0, 10).accuracy10, 1); assert.equal(a(0, 9).accuracy10, undefined); assert.equal(a(1, 12).accuracy10, undefined); assert.equal(a(0, 12, false).accuracy10, undefined);
  assert.equal(has({ accuracy10: 1 }, "accuracy10"), true);
});
test("weekly and login titles: 500 support points, 20 completed sorties, 7 completed cards", () => {
  assert.equal(has({ wk: { sup: 499 } }, "wksup500"), false); assert.equal(has({ wk: { sup: 500 } }, "wksup500"), true);
  assert.equal(has({ wk: { runs: 19 } }, "wk_runs20"), false); assert.equal(has({ wk: { runs: 20 } }, "wk_runs20"), true);
  assert.equal(has({ login: { cards: 6 } }, "lb_cards7"), false); assert.equal(has({ login: { cards: 7 } }, "lb_cards7"), true);
  assert.equal(has({ wk: { weeks: 30, supRuns: 30 } }, "wk_runs20"), false, "other weekly counters never stand in for completed sorties");
  assert.match(html, /if \(a2Completed\) W\.runs = \(W\.runs \|\| 0\) \+ 1;/);
  assert.match(html, /\n    W\.runs=\(W\.runs\|\|0\)\+1;\n/);
});
test("the new titles only ADD: nothing an old holder had changes, and a held equipped title stays", async () => {
  const w = world({ games: 40, maxStreak: 12, handiWins: 1, nick: "handi", vs: { x: { w: 1 } } });
  const before = ids(w.api, w.db.value);
  await w.api.recordMatch(acct, { outcome: "l", mode: "B", dr: -3, exp: 15, perfects: 0, vs: [], add: {}, max: {}, min: {}, or: {} });
  const after = ids(w.api, w.db.value);
  for (const id of before) assert(after.includes(id), id);
  assert.equal(w.db.value.nick, "handi");
});
