const test = require("node:test"),
  assert = require("node:assert/strict"),
  E = require("../server/online-rated/engine.cjs");
function pair(g, u, ok = true) {
  const v = E.view(g, u),
    api = E.runtime(g).api;
  for (let i = 0; i < v.tiles.length; i++)
    for (let j = i + 1; j < v.tiles.length; j++)
      if (
        api.polyEqual(
          api.multiply(v.tiles[i].factor, v.tiles[j].factor),
          v.poly,
        ) === ok
      )
        return {
          type: "answer",
          question: v.question,
          tiles: [v.tiles[i].id, v.tiles[j].id],
        };
  throw Error("No factor pair");
}
test("Actual incoming/hit effects, no attack from passive decay or wrong answer; view does not replay events", () => {
  let g = E.begin("events", "easy", "B", ["self", "enemy"], 711, 0);
  g = E.step(g, "self", pair(g, "self", false), 100);
  assert(!g.visualEvents?.some((e) => e.type === "hit"));
  for (let n = 0; n < 4; n++) {
    g = E.step(g, "enemy", { type: "heartbeat" }, g.time + 500);
    g = E.step(g, "enemy", pair(g, "enemy"), g.time + 100);
  }
  g = E.step(g, "self", { type: "heartbeat" }, g.time + 10000);
  assert(g.visualEvents.some((e) => e.uid === "self" && e.type === "incoming"));
  assert(
    g.visualEvents.some(
      (e) => e.uid === "self" && e.type === "hit" && e.payload.dmg > 0,
    ),
  );
  const seq = g.visualSequence;
  for (let n = 0; n < 5; n++) E.view(g, "self");
  assert.equal(g.visualSequence, seq);
});
test("Actual shield and heal specials provide corresponding presentation events", () => {
  let g = E.begin("special", "easy", "B", ["self", "enemy"], 913, 0);
  for (let n = 0; n < 3; n++) {
    g = E.step(g, "self", { type: "heartbeat" }, g.time + 500);
    g = E.step(g, "self", pair(g, "self"), g.time + 100);
  }
  g = E.step(g, "self", { type: "special", kind: "shield" }, g.time + 1);
  assert(
    g.visualEvents.some(
      (e) => e.uid === "self" && e.type === "special" && e.payload === "shield",
    ),
  );
  assert(E.view(g, "self").live.self.shield);
  for (let n = 0; n < 8; n++) {
    g = E.step(g, "enemy", { type: "heartbeat" }, g.time + 500);
    g = E.step(g, "enemy", pair(g, "enemy"), g.time + 100);
  }
  assert(g.visualEvents.some((e) => e.uid === "self" && e.type === "blocked"));
  for (let n = 0; n < 4; n++) {
    g = E.step(g, "self", { type: "heartbeat" }, g.time + 500);
    g = E.step(g, "self", pair(g, "self"), g.time + 100);
  }
  g = E.step(g, "self", { type: "special", kind: "heal" }, g.time + 1);
  assert(
    g.visualEvents.some(
      (e) => e.uid === "self" && e.type === "special" && e.payload === "heal",
    ),
  );
});
