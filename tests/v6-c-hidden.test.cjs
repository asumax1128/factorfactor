// Ver.6.0 step 9 C: the hidden title rule (pure): 15 DISTINCT earned five-star catalog titles; itself never counted.
const test = require("node:test"), assert = require("node:assert/strict"), fs = require("node:fs");
const Compat = require("../src/title-compat-next.cjs"), Equip = require("../src/title-equip-next.cjs");
const cat = JSON.parse(fs.readFileSync("src/title-catalog-next.json", "utf8"));
const five = cat.titles.filter((t) => t.stars === 5).map((t) => t.id), normal = cat.titles.filter((t) => t.stars !== 5).map((t) => t.id);
test("catalog facts: 26 five-star titles, hidden needs 15, invisible before it is earned", () => {
  assert.equal(five.length, 26); assert.equal(cat.hidden.requiredDistinctFiveStar, 15); assert.equal(cat.hidden.visibleBeforeEarned, false);
});
test("14 -> not owned; 15 -> owned; the reader without deriveHidden never implies an award", () => {
  assert.equal(Compat.read({ legacyEarned: five.slice(0, 14), deriveHidden: true }).hiddenOwned, false);
  const r = Compat.read({ legacyEarned: five.slice(0, 15), deriveHidden: true });
  assert.equal(r.hiddenOwned, true); assert.equal(r.earned.factor_factor.source, "derived-five-star"); assert.equal(r.fiveStarCount, 15);
  assert.equal(Compat.read({ legacyEarned: five.slice(0, 15) }).hiddenOwned, false);
});
test("duplicates (legacy + stored flag), 4-star-or-lower titles and unknown ids are not counted", () => {
  const ids = [...five.slice(0, 7), ...five.slice(0, 7), ...normal.slice(0, 30), "retired_x", "nope"];
  const flags = [Object.fromEntries(five.slice(0, 7).map((id) => [id, { earned: true, at: 5 }]))];
  const r = Compat.read({ legacyEarned: ids, flags, deriveHidden: true });
  assert.equal(r.fiveStarCount, 7); assert.equal(r.hiddenOwned, false);
  assert.equal(Compat.read({ legacyEarned: [...five.slice(0, 14), ...five.slice(0, 14), ...normal], deriveHidden: true }).hiddenOwned, false);
});
test("the hidden title itself is not part of the 15; a stored record owns it regardless of the count", () => {
  assert.equal(Compat.read({ legacyEarned: [...five.slice(0, 14), "factor_factor"], deriveHidden: true }).hiddenOwned, true, "stored/legacy record");
  const r = Compat.read({ legacyEarned: five.slice(0, 14), flags: [{ factor_factor: { earned: true, at: 99 } }], deriveHidden: true });
  assert.equal(r.fiveStarCount, 14); assert.equal(r.hiddenOwned, true); assert.equal(r.earned.factor_factor.at, 99, "the stored date is kept");
  const d = Compat.read({ legacyEarned: [...five.slice(0, 15), "factor_factor"], deriveHidden: true });
  assert.equal(d.fiveStarCount, 15);
});
test("an owned hidden title can be equipped through the existing single slot; an unowned one cannot", () => {
  const owned = new Set(Object.keys(Compat.read({ legacyEarned: five.slice(0, 15), deriveHidden: true }).earned));
  assert.equal(Equip.route("factor_factor", { earned: owned }), "nick");
  assert.notEqual(Equip.route("factor_factor", { earned: new Set(five.slice(0, 14)) }), "nick");
});
test("protected five-star titles count: a held streak50 / handi through tk is a five-star title in the count", () => {
  const { world, ids } = require("./a-batch-harness.cjs"), w = world(null);
  const held = ids(w.api, { maxStreak: 55, handiWins: 1, tk: { v: 1, at: 1, ids: { streak30: 1, streak50: 1, handi: 1 } } });
  for (const id of ["streak30", "streak50", "handi"]) assert(held.includes(id), id);
  assert.equal(Compat.read({ legacyEarned: held }).fiveStarCount, 3);
});
test("five-star count with suspended titles: held rmaster / master1900 / darkhorse count; new ones from old counters do not", () => {
  const { world, ids } = require("./a-batch-harness.cjs"), w = world(null);
  const held = ids(w.api, { maxRating: 1950, darkHorse: 1, tk: { v: 1, at: 1, ids: { rmaster: 1, master1900: 1, darkhorse: 1 } } });
  for (const id of ["rmaster", "master1900", "darkhorse"]) assert(held.includes(id), id);
  assert.equal(Compat.read({ legacyEarned: held }).fiveStarCount, 3);
  const fresh = ids(w.api, { maxRating: 1950, darkHorse: 5, A: { w: 90 }, B: { w: 90 }, tk: { v: 1, at: 1 } });
  for (const id of ["rmaster", "master1900", "darkhorse", "dual", "dual50"]) assert(!fresh.includes(id), id + " is not newly acquired");
});
