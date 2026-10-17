const test = require("node:test"), assert = require("node:assert/strict");
const Equip = require("../src/title-equip-next.cjs"), Labels = require("../src/title-labels-next.cjs"), catalog = require("../src/title-catalog-next.json");
test("all 100 catalog titles and the hidden title have a label; unknown ids do not", () => {
  assert.equal(Labels.equippableIds().length, 101);
  for (const t of catalog.titles) { const l = Labels.of(t.id); assert.equal(l.label, t.name); assert.equal(l.icon, Labels.COMMON_ICON); }
  assert.equal(Labels.of("factor_factor").label, "FACTOR×FACTOR");
  assert.equal(Labels.of("nosp"), null);
  assert.equal(Labels.of("tw10"), null);
});
test("only earned titles route to the single slot", () => {
  const earned = new Set(["first_win", "easy_adept", "factor_factor"]);
  assert.equal(Equip.route("easy_adept", { earned }), "nick");
  assert.equal(Equip.route("factor_factor", { earned }), "nick");
  assert.equal(Equip.route("normal_master", { earned }), null, "unearned is never equippable");
  assert.equal(Equip.route("tw10", { earned: new Set(["tw10"]) }), null, "ids outside the 101 are not offered");
});
test("reasons", () => {
  assert.match(Equip.reason("x", { real: false, earned: true, routeOf: "nick" }), /ゲスト/);
  assert.match(Equip.reason("x", { real: true, earned: false, routeOf: null }), /未取得/);
  assert.match(Equip.reason("x", { real: true, earned: true, routeOf: null }), /対応していません/);
  assert.equal(Equip.reason("x", { real: true, earned: true, routeOf: "nick" }), "");
});
test("save-time confirmation", () => {
  const memory = new Set(["a_title"]);
  const ok = (id, o) => Equip.confirm(id, { memory, ...o });
  assert.equal(ok("easy_adept", { fresh: new Set(["easy_adept"]), complete: true }), true, "fresh proof");
  assert.equal(ok("easy_adept", { fresh: new Set(), complete: true }), false, "complete fresh read without proof: refused even if the screen thought it earned");
  assert.equal(ok("easy_adept", { fresh: new Set(), complete: false, memory: new Set(["easy_adept"]) }), true, "a source was unreadable: fall back to what the UI proved");
  assert.equal(ok("easy_adept", { fresh: null, complete: false, memory: new Set() }), false, "no proof anywhere");
  assert.equal(ok("tw10", { fresh: new Set(["tw10"]), complete: true }), false, "ids outside the 101 are refused");
});
