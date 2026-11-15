// Ver.6.0 A5: ミッション皆勤(mis7) = 7日連続でデイリーミッションをすべて達成。
// Ver.6.32: the daily missions were removed, so nothing counts mission days any more (misRunStep / claimMission are gone) and the
// tests of the acquisition went with them. What is left to check here is that an account that already holds the title keeps it.
const test = require("node:test"), assert = require("node:assert/strict");
const { world, acct, ids, html } = require("./a-batch-harness.cjs");
const mk = (init, o) => world(init, o);
const has = (w, st) => ids(w.api, st).includes("mis7");

test("the mission counters are gone from the page", () => {
  for (const name of ["function misRunStep", "function claimMission", "function missionEvent", "function missionsFor", "function applyMis", "MIS_POOL", "fxf_guest_mis_v1"]) assert.equal(html.includes(name), false, name);
});
test("holders keep the title: a saved 7-day run, the old total with or without the freeze record", () => {
  const w = mk(null);
  assert.equal(has(w, { misRun: { best: 7, n: 2, last: "2026-10-07" } }), true, "a saved 7-day run");
  assert.equal(has(w, { misRun: { best: 6 } }), false);
  assert.equal(has(w, { misDays: 7 }), true, "no tk: legacy");
  assert.equal(has(w, { misDays: 7, tk: { v: 1, at: 1, ids: { mis7: 1 } } }), true, "tk");
  assert.equal(has(w, { misDays: 7, tk: { v: 1, at: 1 } }), false, "with tk the live legacy counter no longer grants");
});
test("an old holder's first write still freezes the title and keeps the equipped slot; saved mission counters are left as they are", async () => {
  const h = mk({ misDays: 8, games: 3, nick: "mis7", misRun: { best: 3, n: 1, last: "2026-10-01" } });
  await h.api.statsTx(acct, (s) => { s.games = (s.games || 0) + 1; });
  assert.equal(h.db.value.tk.ids.mis7, 1);
  assert.equal(h.db.value.nick, "mis7");
  assert.equal(h.db.value.misDays, 8);
  assert.deepEqual({ ...h.db.value.misRun }, { best: 3, n: 1, last: "2026-10-01" });
  assert.equal(has(h, h.db.value), true);
});
test("catalog text matches", () => {
  const cat = JSON.parse(require("node:fs").readFileSync("src/title-catalog-next.json", "utf8"));
  const t = (Array.isArray(cat) ? cat : cat.titles).find((x) => x.id === "mis7");
  assert.match(t.condition, /7日連続でデイリーミッションをすべて達成/);
  assert.match(html, /id: 'mis7'[^\n]*7日連続で/);
});
