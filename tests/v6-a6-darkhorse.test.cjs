// Ver.6.0 A6: ダークホース — 新規付与の停止と既得の保護。
const test = require("node:test"), assert = require("node:assert/strict"), fs = require("node:fs");
const { Keep, html, clone, world, acct, ids } = require("./a-batch-harness.cjs");
const has = (w, st) => ids(w.api, st).includes("darkhorse");
const info = (add, o = {}) => ({ outcome: "w", mode: "B", dr: 8, exp: 30, perfects: 0, vs: [], add, max: {}, min: {}, or: {}, tourWin: true, ...o });

test("nothing in the 6.0 client writes the darkHorse counter any more", () => {
  assert.equal(/add\.darkHorse|darkHorse\s*[:=]/.test(html.replace(/\(st\.darkHorse \|\| 0\)|\(s\.darkHorse \|\| 0\)/g, "")), false);
});
test("a tournament winner who was the lowest-rated entrant is not granted (entrants are not the class)", async () => {
  const w = world({ games: 8, rating: 1200 });
  const r = await w.api.recordMatch(acct, info({}, { outcome: "w" }));
  assert.equal(w.db.value.darkHorse, undefined);
  assert.equal(has(w, w.db.value), false);
  assert.equal(r.badges.some((b) => b.id === "darkhorse"), false);
  assert.equal(w.db.value.tourWins, 1, "the tournament win itself is still recorded");
});
test("an old holder keeps it with tk, without tk, and after the first 6.0 write; equipment and counters untouched", async () => {
  const w = world({ darkHorse: 1, games: 9, nick: "darkhorse" });
  assert.equal(has(w, { darkHorse: 1 }), true, "no tk: legacy counter");
  assert.equal(has(w, { darkHorse: 1, tk: { v: 1, at: 1, ids: { darkhorse: 1 } } }), true);
  assert.equal(has(w, { darkHorse: 1, tk: { v: 1, at: 1 } }), false, "with tk, a later 5.25 write is not counted");
  await w.api.recordMatch(acct, info({}, { outcome: "l", tourWin: false }));
  assert.equal(w.db.value.tk.ids.darkhorse, 1);
  assert.equal(w.db.value.darkHorse, 1);
  assert.equal(w.db.value.nick, "darkhorse");
  assert.equal(has(w, w.db.value), true);
});
test("freeze failure keeps the held title", async () => {
  for (const keep of [null, {}, { ensureKeep() { throw new Error("x"); }, isFrozen: () => false, keptIds: () => [] }]) {
    const w = world({ darkHorse: 1, games: 2 }, { keep });
    await w.api.recordMatch(acct, info({}, { outcome: "l", tourWin: false }));
    assert.equal(has(w, w.db.value), true);
  }
});
test("catalog text and the reserved roster note", () => {
  const cat = JSON.parse(fs.readFileSync("src/title-catalog-next.json", "utf8"));
  const t = (Array.isArray(cat) ? cat : cat.titles).find((x) => x.id === "darkhorse");
  assert.equal(t.name, "ダークホース"); assert.equal(t.stars, 5);
  assert.match(html, /id: 'darkhorse'[^\n]*大会開始時にクラス内レーティング11位以下で優勝/);
  assert.equal(Keep.LEGACY_TESTS.darkhorse({ darkHorse: 1 }), true);
  assert.equal(typeof Keep.DARKHORSE_ROSTER_NOTE, "string");
});
