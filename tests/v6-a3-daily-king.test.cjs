// Ver.6.0 A3: the catalog text, the legacy display rule and the client agree on 天下統一 (daily_king).
const test = require("node:test"), assert = require("node:assert/strict"), fs = require("node:fs"), vm = require("node:vm");
const D = require("../src/daily-model.cjs"), catalog = require("../src/title-catalog-next.json");
const html = fs.readFileSync("index.html", "utf8");
const scope = { window: {} };
vm.createContext(scope);
vm.runInContext(html.slice(html.indexOf("const BADGES = ["), html.indexOf("const badgesOf")) + "\nthis.B = BADGES; this.badgesOf = (st) => BADGES.filter((b) => st && b.test(st)).map((b) => b.id);", scope);
const ids = (st) => scope.badgesOf(st);

test("the official condition is 'same JST day, all three divisions', and the id/name/stars are unchanged", () => {
  const t = catalog.titles.find((x) => x.id === "daily_king");
  assert.deepEqual([t.number, t.name, t.stars, t.condition], [4, "天下統一", 5, "同じ日にデイリー全3部門優勝"]);
});
test("the day is the existing official JST day (epoch of time+9h), finalized after midnight + grace; no new reference", () => {
  assert.equal(D.SHIFT, 9 * 3600e3);
  const t = Date.UTC(2026, 9, 14, 14, 59, 59, 999);
  assert.equal(D.epoch(t + 1), D.epoch(t) + 1);
  assert.equal(D.date(D.epoch(t)), "2026-10-14");
  assert.equal(D.finalizable(D.epoch(t), (D.epoch(t) + 1) * D.DAY - D.SHIFT), false);
});
test("display rule unchanged: a stored daily_king is held forever; bare division flags never make it", () => {
  assert.equal(ids({ dailyTitles: { daily_king: true } }).includes("daily_king"), true, "an existing holder is kept");
  assert.equal(ids({ dailyTitles: { daily_king: { day: 5 } } }).includes("daily_king"), true);
  const flags = { daily_easy_king: { day: 1 }, daily_normal_king: { day: 2 }, daily_hard_king: { day: 3 } };
  assert.equal(ids({ dailyTitles: flags }).includes("daily_king"), false, "three flags alone are not the composite");
  for (const id of ["daily_easy_king", "daily_normal_king", "daily_hard_king"]) assert.equal(ids({ dailyTitles: { [id]: { day: 1 } } }).includes(id), true, "each division title still works on its own");
  assert.equal(scope.B.filter((b) => b.id === "daily_king").length, 1);
});
test("the client no longer builds the composite from the three flags and uses the same-day proof", () => {
  const src = fs.readFileSync("src/daily-client.cjs", "utf8");
  assert.equal(/every\(id=>had\[id\]\)&&!had\.daily_king\)\{await ref/.test(src), false, "the cumulative grant is gone");
  assert.equal(src.includes("D.kingDay(day,fin,key)"), true);
  const model = fs.readFileSync("src/daily-model.cjs", "utf8");
  assert.equal(/next\.daily_king/.test(model), false);
  assert.deepEqual(D.titles({ x: 1 }, "hard"), { x: 1, daily_hard_king: true });
});
