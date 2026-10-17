const test = require("node:test"), assert = require("node:assert/strict");
const D = require("../src/title-display-next.cjs");
const valid = (id) => ["first", "easy_adept", "factor_factor", "tw10"].includes(id);
const r = (nick, title) => D.resolve({ nick, title }, { valid });
test("an equipped id wins over the legacy ranking title", () => {
  assert.deepEqual(r("first", "easy_adept"), { state: "nick", id: "first" });
  assert.equal(D.shownId(r("first", "easy_adept")), "first");
});
test('"" is an explicit unequip: no title, the ranking title does not come back', () => {
  assert.deepEqual(r("", "easy_adept"), { state: "cleared", id: null });
  assert.equal(D.shownId(r("", "easy_adept")), null);
});
test("an absent nick shows the legacy ranking title for compatibility", () => {
  assert.deepEqual(r(undefined, "easy_adept"), { state: "compat", id: "easy_adept" });
  assert.deepEqual(r(null, "easy_adept"), { state: "compat", id: "easy_adept" });
  assert.equal(D.shownId(r(undefined, "easy_adept")), "easy_adept");
  assert.deepEqual(r(undefined, undefined), { state: "none", id: null });
  assert.deepEqual(r(undefined, "unknown_id"), { state: "none", id: null }, "an unknown ranking title is never guessed");
});
test("an unknown non-empty nick shows nothing and is not replaced by the ranking title", () => {
  assert.deepEqual(r("gone_forever", "easy_adept"), { state: "unresolved", id: null });
  assert.equal(D.shownId(r("gone_forever", "easy_adept")), null);
  assert.deepEqual(r(7, "easy_adept"), { state: "unresolved", id: null });
});
test("legacy-only ids that are still known stay shown", () => {
  assert.deepEqual(r("tw10", null), { state: "nick", id: "tw10" });
});
