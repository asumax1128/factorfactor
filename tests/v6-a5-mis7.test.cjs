// Ver.6.0 A5: ミッション皆勤(mis7) = 7日連続でデイリーミッションをすべて達成。
const test = require("node:test"), assert = require("node:assert/strict");
const { cut, clone, world, acct, ids, html } = require("./a-batch-harness.cjs");
const extra = [cut("const prevDate = d =>", "async function claimMission(acct, row, rows)")];
const mk = (init, o) => world(init, { extra, ...o });
const day = async (w, date) => w.api.statsTx(acct, (s) => { s.misDays = (s.misDays || 0) + 1; w.sandbox.misRunStep(s, date); });
const expose = (w) => { require("node:vm").runInContext("this.misRunStep = misRunStep;", w.sandbox); return w; };
const has = (w, st) => ids(w.api, st).includes("mis7");

test("7 consecutive complete days -> acquired on the 7th, announced once", async () => {
  const w = expose(mk({ games: 1 }));
  const dates = ["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04", "2026-10-05", "2026-10-06", "2026-10-07"];
  for (const d of dates.slice(0, 6)) { const r = await day(w, d); assert.equal(r.got.some((b) => b.id === "mis7"), false); }
  assert.equal(has(w, w.db.value), false);
  const r = await day(w, dates[6]);
  assert.equal(r.got.some((b) => b.id === "mis7"), true);
  assert.equal(w.db.value.misRun.best, 7);
  const again = await day(w, "2026-10-08");
  assert.equal(again.got.some((b) => b.id === "mis7"), false);
});
test("a missed day restarts the run; 7 total days that are not consecutive do not grant", async () => {
  const w = expose(mk({ games: 1 }));
  for (const d of ["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08"]) await day(w, d);
  assert.equal(w.db.value.misDays, 7);
  assert.equal(w.db.value.misRun.n, 4);
  assert.equal(has(w, w.db.value), false, "7 days in total (old rule) no longer grants");
});
test("the same day twice and an older (clock-rewound) date are not counted", async () => {
  const w = expose(mk({ games: 1 }));
  await day(w, "2026-10-01"); await day(w, "2026-10-01"); await day(w, "2026-09-30");
  assert.deepEqual({ ...w.db.value.misRun }, { last: "2026-10-01", n: 1, best: 1 });
});
test("month and year boundaries stay consecutive", async () => {
  const w = expose(mk({ games: 1 }));
  for (const d of ["2026-12-29", "2026-12-30", "2026-12-31", "2027-01-01", "2027-01-02", "2027-01-03", "2027-01-04"]) await day(w, d);
  assert.equal(w.db.value.misRun.n, 7);
  assert.equal(has(w, w.db.value), true);
  const x = expose(mk({ games: 1 }));
  for (const d of ["2028-02-27", "2028-02-28", "2028-02-29", "2028-03-01"]) await day(x, d);
  assert.equal(x.db.value.misRun.n, 4);
});
test("old holder (misDays>=7): kept with tk, kept without tk, and the first 6.0 write freezes it", async () => {
  const w = expose(mk(null));
  assert.equal(has(w, { misDays: 7 }), true, "no tk: legacy");
  assert.equal(has(w, { misDays: 7, tk: { v: 1, at: 1, ids: { mis7: 1 } } }), true, "tk");
  assert.equal(has(w, { misDays: 7, tk: { v: 1, at: 1 } }), false, "with tk the live legacy counter no longer grants");
  const h = expose(mk({ misDays: 8, games: 3, nick: "mis7" }));
  await day(h, "2026-10-01");
  assert.equal(h.db.value.tk.ids.mis7, 1);
  assert.equal(h.db.value.nick, "mis7");
  assert.equal(h.db.value.misDays, 9);
  assert.equal(has(h, h.db.value), true);
});
test("freeze failure: the held title is kept (module missing or throwing), the counters still update", async () => {
  for (const keep of [null, {}, { ensureKeep() { throw new Error("x"); }, isFrozen: () => false, keptIds: () => [] }]) {
    const w = expose(mk({ misDays: 7 }, { keep }));
    await day(w, "2026-10-01");
    assert.equal(has(w, w.db.value), true);
    assert.equal(w.db.value.misRun.best, 1);
  }
});
test("claimMission is wired to statsTx (so ensureKeep runs first) and uses the mission date", () => {
  const src = cut("async function claimMission(acct, row, rows)", "function MissionList");
  assert.match(src, /statsTx\(acct, st => \{ st\.misDays = \(st\.misDays \|\| 0\) \+ 1; misRunStep\(st, date\); \}\)/);
  assert.match(src, /const date = jstDate\(\);/);
  assert.equal(/ref\(`games\/factor\/accounts\/\$\{acct\.key\}\/stats`\)\.transaction/.test(src), false);
});
test("other titles, old stats and equipment are unchanged by a mission day", async () => {
  const start = { games: 12, w: 7, maxStreak: 4, exp: 90, nick: "streak10", handiWins: 1, vs: { a: { w: 1 } } };
  const w = expose(mk(clone(start)));
  await day(w, "2026-10-01");
  const { tk, tv2, misRun, misDays, ...rest } = w.db.value;
  assert.deepEqual(rest, start);
});
test("catalog text matches", () => {
  const cat = JSON.parse(require("node:fs").readFileSync("src/title-catalog-next.json", "utf8"));
  const t = (Array.isArray(cat) ? cat : cat.titles).find((x) => x.id === "mis7");
  assert.match(t.condition, /7日連続でデイリーミッションをすべて達成/);
  assert.match(html, /id: 'mis7'[^\n]*7日連続で/);
});
