// Ver.6.0 retired titles (nosp, wklast, tw10/30/50/70/100): new acquisition stops, held records and equipment stay.
// Runs the REAL helpers cut out of index.html (no copy), so the test fails if the game code changes.
const test = require("node:test"), assert = require("node:assert/strict"), fs = require("node:fs"), vm = require("node:vm");
const Labels = require("../src/title-labels-next.cjs"), catalog = require("../src/title-catalog-next.json");
const html = fs.readFileSync("index.html", "utf8");
const js = html.slice(html.indexOf("const BADGES = ["), html.indexOf("function AchievementAuditPanel"));
const scope = { window: {}, titleLabelOf: (id) => Labels.resolve(id, scope.nickOf(id)) };
vm.createContext(scope);
vm.runInContext("const nickOf = id => BADGES.find(b => b.id === id) || null;\nthis.nickOf = nickOf;\n" + js + "\nthis.api={BADGES,badgesOf,announceableBadges,holdRetiredCounters,isRetiredTitle,RETIRED_TITLES};", scope);
const api = scope.api, clone = (x) => JSON.parse(JSON.stringify(x));
// What the game does inside the stats transaction: apply the writer, then hold the retired counters.
const tx = (stats, writer) => { const before = clone(stats), s = clone(stats); writer(s); api.holdRetiredCounters(before, s); return { before, after: s }; };
const nospWin = (s) => { s.noSpWins = (s.noSpWins || 0) + 1; };
const lastHit = (s) => { s.wk = s.wk || {}; s.wk.lastHit = (s.wk.lastHit || 0) + 1; s.wk.kills = (s.wk.kills || 0) + 1; };

test("the retired list is exactly the owner's seven, none in the 101 catalog", () => {
  assert.deepEqual([...api.RETIRED_TITLES].sort(), ["nosp", "tw10", "tw100", "tw30", "tw50", "tw70", "wklast"]);
  for (const id of api.RETIRED_TITLES) { assert.equal(Labels.of(id), null); assert.equal(api.BADGES.filter((b) => b.id === id).length, 1, "legacy definition kept"); }
});
test("a player who has NOT earned nosp / wklast cannot earn them any more", () => {
  for (const base of [{}, { games: 5 }, { noSpWins: 0 }, { wk: { weeks: 2 } }, { wk: { lastHit: 0 } }]) {
    const a = tx(base, nospWin).after, b = tx(base, lastHit).after;
    assert(!api.badgesOf(a).some((x) => x.id === "nosp"), JSON.stringify(base));
    assert(!api.badgesOf(b).some((x) => x.id === "wklast"), JSON.stringify(base));
    assert.equal(api.announceableBadges(base, a).length, 0);
    assert(!api.announceableBadges(base, b).some((x) => x.id === "wklast"));
  }
});
test("other counters written by the same update are untouched (stat counters keep running)", () => {
  const { after } = tx({ wk: { weeks: 1 }, games: 3 }, (s) => { lastHit(s); s.games += 1; s.exp = 40; });
  assert.equal(after.wk.kills, 1); assert.equal(after.wk.weeks, 1); assert.equal(after.games, 4); assert.equal(after.exp, 40);
  assert.equal(after.wk.lastHit, undefined, "no lastHit key is created");
  assert.equal(tx({}, nospWin).after.noSpWins, undefined);
});
test("a player who already holds nosp / wklast keeps them, keeps counting, and gets no new reveal", () => {
  const held = { noSpWins: 2, wk: { lastHit: 1, kills: 4 }, nick: "nosp" };
  const a = tx(held, nospWin), b = tx(held, lastHit);
  assert.equal(a.after.noSpWins, 3); assert.equal(b.after.wk.lastHit, 2); assert.equal(a.after.nick, "nosp");
  for (const r of [a, b]) { const ids = api.badgesOf(r.after).map((x) => x.id); assert(ids.includes("nosp") && ids.includes("wklast")); }
  assert.equal(api.announceableBadges(a.before, a.after).length, 0, "already held: no reveal");
  assert.deepEqual(clone(api.badgesOf(held).map((x) => x.id).filter(api.isRetiredTitle)).sort(), ["nosp", "wklast"], "held ids are recomputed identically");
});
test("a held record is never lowered or removed, whatever the update", () => {
  const held = { noSpWins: 1, wk: { lastHit: 1 } }, before = clone(held);
  const out = clone(held); api.holdRetiredCounters(before, out);
  assert.deepEqual(out, held);
});
test("tower counters are real progress and are not rewritten; tower titles are never announced", () => {
  const { before, after } = tx({}, (s) => { s.tower = { best: 12 }; });
  assert.equal(after.tower.best, 12);
  assert(api.badgesOf(after).some((x) => x.id === "tw10"));
  assert(!api.announceableBadges(before, after).some((x) => x.id === "tw10"));
});
test("reveals use the official catalog name; icon and description stay as before", () => {
  const cases = [["revenge", { revenges: 1 }], ["calm", { calmWins: 1 }], ["flawless", { flawlessWins: 1 }], ["bounty1", { bountyWins: 1 }]];
  let checked = 0;
  for (const [id, st] of cases) {
    const t = catalog.titles.find((x) => x.id === id), legacy = api.BADGES.find((x) => x.id === id);
    if (!t) continue;
    const [got] = api.announceableBadges({}, st).filter((x) => x.id === id);
    assert.equal(got.label, t.name); assert.equal(got.icon, legacy.icon); assert.equal(got.desc, legacy.desc); checked++;
  }
  assert(checked >= 3);
  // every catalog title that also exists as a legacy badge resolves to its catalog name
  for (const b of api.BADGES) { const t = catalog.titles.find((x) => x.id === b.id); if (t) assert.equal(scope.titleLabelOf(b.id).label, t.name); }
});
