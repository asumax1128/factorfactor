// Ver.6.0 A2: tour10 (殿堂入り) = class tournament wins >= 5. Uses the REAL BADGES / recordMatch from index.html.
const test = require("node:test"), assert = require("node:assert/strict"), fs = require("node:fs"), vm = require("node:vm");
const Keep = require("../src/title-keep-next.cjs"), Labels = require("../src/title-labels-next.cjs"), Compat = require("../src/title-compat-next.cjs"), catalog = require("../src/title-catalog-next.json");
const html = fs.readFileSync("index.html", "utf8");
const cut = (a, b) => { const i = html.indexOf(a), j = html.indexOf(b, i); assert(i >= 0 && j > i, a); return html.slice(i, j); };
const clone = (x) => JSON.parse(JSON.stringify(x));
const code = cut("const BADGES = [", "function AchievementAuditPanel") + "\n" + cut("async function statsTx(acct, fn)", "const wkOf = s =>") + "\n" + cut("async function recordMatch(acct, info)", "/* ---------- 効果音");
function world(initial) {
  const store = { value: clone(initial) };
  const sandbox = {
    window: { TitleKeepNext: Keep }, console, titleLabelOf: (id) => Labels.resolve(id, null), isReal: (a) => !!(a && a.key), DBX: null, RATING_INIT: 1500, SEASON0: "2026-10", seasonKey: () => "2026-10", seasonReset: (r) => r,
    FX: { band() {}, confetti() {} }, fxSound() {}, setTimeout: (f) => f(),
    FB: { db: { ref: () => ({ transaction: async (cb) => { const out = cb(clone(store.value)); if (out === undefined) return { committed: false }; store.value = clone(out); return { committed: true }; } }) } },
  };
  vm.createContext(sandbox);
  vm.runInContext(code + "\nthis.api = { BADGES, badgesOf, recordMatch };", sandbox);
  return { api: sandbox.api, store };
}
const ids = (api, st) => api.badgesOf(st).map((b) => b.id);
const acct = { key: "aw" };
const finalWin = { outcome: "w", mode: "B", dr: 8, exp: 30, perfects: 0, vs: [], add: {}, max: {}, min: {}, or: {}, tourWin: true };

test("the catalog and the live condition agree: tour10 = 5 class-tournament wins, same id, name and stars", () => {
  const t = catalog.titles.find((x) => x.id === "tour10");
  assert.deepEqual([t.number, t.name, t.stars, t.condition], [68, "殿堂入り", 5, "クラス大会で通算5回優勝"]);
  const { api } = world({});
  const b = api.BADGES.find((x) => x.id === "tour10");
  assert.equal(b.desc, "クラス大会で5回優勝");
  assert.equal(api.BADGES.filter((x) => x.id === "tour10").length, 1);
  for (const [w, held] of [[0, false], [3, false], [4, false], [5, true], [6, true], [9, true], [10, true], [30, true]]) assert.equal(ids(api, { tourWins: w }).includes("tour10"), held, `tourWins=${w}`);
});
test("the neighbouring tournament titles are unchanged (1 and 3 wins)", () => {
  const { api } = world({});
  assert.deepEqual([0, 1, 2, 3, 4].map((w) => [ids(api, { tourWins: w }).includes("tour1"), ids(api, { tourWins: w }).includes("tour3")]), [[false, false], [true, false], [true, false], [true, true], [true, true]]);
});
test("players with 5-9 wins now hold it; players with 10 or more keep it (nobody loses anything)", () => {
  const { api } = world({});
  for (const w of [5, 7, 9, 10, 25]) assert.equal(ids(api, { tourWins: w, nick: "tour10" }).includes("tour10"), true);
  for (const w of [0, 4]) assert.equal(ids(api, { tourWins: w }).includes("tour10"), false);
  const before = ids(api, { tourWins: 12 });
  assert.equal(before.includes("tour10"), true, "a holder under the old rule (10+) is still a holder");
});
test("tour10 is a 5-star title and counts toward the hidden title's 15: 14 -> 15 at the 5th win", () => {
  assert.equal(catalog.titles.find((t) => t.id === "tour10").stars, 5);
  const { api } = world({});
  const others = catalog.titles.filter((t) => t.stars === 5 && !["tour1", "tour3", "tour10"].includes(t.id)).slice(0, 12).map((t) => t.id);
  const earned = (w) => [...new Set([...others, ...ids(api, { tourWins: w })])];
  const at4 = Compat.read({ legacyEarned: earned(4) }), at5 = Compat.read({ legacyEarned: earned(5) });
  assert.equal(at4.fiveStarCount, 14); assert.equal(at4.hiddenEligible, false);
  assert.equal(at5.fiveStarCount, 15); assert.equal(at5.hiddenEligible, true);
  assert.equal(at5.hiddenOwned, false, "only eligibility: awarding the hidden title is a later step");
});
test("the 5th class-tournament win reveals the title once, under its official name; the 4th and the 6th do not", async () => {
  const w = world({ games: 20, tourWins: 3, w: 10 });
  const r4 = await w.api.recordMatch(acct, finalWin);
  assert.equal(w.store.value.tourWins, 4);
  assert.equal(r4.badges.some((b) => b.id === "tour10"), false, "4 wins: not yet");
  const r5 = await w.api.recordMatch(acct, finalWin);
  assert.equal(w.store.value.tourWins, 5);
  const got = r5.badges.find((b) => b.id === "tour10");
  assert.ok(got, "the 5th win reveals it");
  assert.equal(got.label, "殿堂入り"); assert.equal(got.icon, "🏛️");
  const r6 = await w.api.recordMatch(acct, finalWin);
  assert.equal(r6.badges.some((b) => b.id === "tour10"), false, "never revealed twice");
});
test("equipment and every other stat are untouched by the change", async () => {
  const start = { games: 20, tourWins: 4, w: 10, nick: "tour3", skin: { tile: "wood" }, vs: { ax: { w: 1 } } };
  const w = world(start);
  await w.api.recordMatch(acct, finalWin);
  assert.equal(w.store.value.nick, "tour3"); assert.deepEqual(w.store.value.skin, { tile: "wood" }); assert.deepEqual(w.store.value.vs.ax, { w: 1 });
});
