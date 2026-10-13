const { test } = require("node:test"),
  assert = require("node:assert/strict");
const C = require("../server/online-rated/core.cjs"),
  E = require("../server/online-rated/engine.cjs");
const now = Date.UTC(2026, 9, 13);
function base() {
  const s = C.migrate(
    null,
    {
      aa: { name: "A", stats: { rating: 1800, maxRating: 1900, w: 20, l: 8 } },
      ab: { name: "B", stats: { rating: 1620 } },
      ac: { name: "C", stats: {} },
    },
    "approved-easy-carry",
    now,
  );
  s.enabled = true;
  s.migrationReady = true;
  return s;
}
const actor = (k) => ({ key: "a" + k, uid: "u" + k });
let counter = 0;
function go(s, k, cmd, t = now) {
  return C.transition(s, actor(k), { protocol: 2, ...cmd }, t, {
    id: "m" + ++counter,
    seed: "secret" + counter,
    mode: "B",
  });
}
function match(s, d = "easy") {
  let x = go(s, "a", { type: "enqueue", difficulty: d });
  return go(x.state, "b", { type: "enqueue", difficulty: d });
}
test("legacy rating → EASY exactly, NORMAL 1500, counts zero, backup and old titles; migration idempotent", () => {
  const s = base();
  assert.equal(s.players.aa.easy.rating, 1800);
  assert.equal(s.players.ab.easy.rating, 1620);
  assert.equal(s.players.aa.normal.rating, 1500);
  assert.equal(s.players.ac.easy.rating, 1500);
  assert.equal(s.players.aa.easy.games, 0);
  assert.equal(s.players.aa.legacy.stats.w, 20);
  assert(s.players.aa.legacy.earnedBadges.includes("rmaster"));
  assert.equal(s.players.aa.badges.easy_adept, true);
  assert.deepEqual(
    C.migrate(
      s,
      { aa: { name: "A", stats: { rating: 1500 } } },
      "approved-easy-carry",
      now,
    ),
    s,
  );
});
test("invalid old values stop migration without changing original", () => {
  const s = base();
  assert.throws(
    () =>
      C.migrate(
        s,
        { ad: { name: "D", stats: { rating: "1800" } } },
        "bad",
        now,
      ),
    /INVALID_LEGACY/,
  );
  assert.equal(s.players.ad, undefined);
});
test("EASY/NORMAL queues separate, old protocol/self match rejected, cancel is scoped", () => {
  let a = go(base(), "a", { type: "enqueue", difficulty: "easy" }),
    b = go(a.state, "b", { type: "enqueue", difficulty: "normal" });
  assert.equal(Object.keys(b.state.matches).length, 0);
  const c = go(b.state, "c", { type: "enqueue", difficulty: "easy" });
  assert.equal(c.state.matches[c.matchId].difficulty, "easy");
  assert.equal(Object.keys(c.state.queue).length, 1);
  assert.throws(
    () =>
      C.transition(
        c.state,
        actor("a"),
        { protocol: 1, type: "enqueue", difficulty: "easy" },
        now,
        {},
      ),
    /UPDATE_REQUIRED/,
  );
  assert.equal(
    go(a.state, "a", { type: "enqueue", difficulty: "easy" }).ticket,
    a.ticket,
  );
  assert(
    go(b.state, "a", { type: "cancel", ticket: b.ticket }).state.queue[
      b.ticket
    ],
  );
});
test("A/B vote only, no difficulty mutation, timeout and departure before start", () => {
  let x = match(base()),
    id = x.matchId;
  x = go(x.state, "a", {
    type: "vote",
    matchId: id,
    mode: "A",
    difficulty: "normal",
  });
  x = go(x.state, "b", { type: "vote", matchId: id, mode: "A" });
  assert.equal(x.state.matches[id].mode, "A");
  assert.equal(x.state.matches[id].difficulty, "easy");
  assert.throws(
    () => go(x.state, "a", { type: "leave", matchId: "not-a-match" }),
    /NOT_PARTICIPANT/,
  );
  let y = match(base());
  y = go(y.state, "a", { type: "leave", matchId: y.matchId });
  assert.equal(y.state.matches[y.matchId].phase, "cancelled");
  assert.equal(y.state.players.aa.easy.games, 0);
});
test("server recomputes factor answers; valid A game completes and updates EASY only exactly once", () => {
  let x = match(base()),
    id = x.matchId;
  for (const k of ["a", "b"])
    x = go(x.state, k, { type: "vote", matchId: id, mode: "A" });
  let t = x.state.matches[id].game.startAt;
  for (let seq = 1; seq <= 15; seq++) {
    const g = x.state.matches[id].game,
      v = E.view(g, "ua"),
      rt = E.runtime(g);
    let pair;
    for (let i = 0; i < v.tiles.length; i++)
      for (let j = i + 1; j < v.tiles.length; j++)
        if (
          rt.api.polyEqual(
            rt.api.multiply(v.tiles[i].factor, v.tiles[j].factor),
            v.poly,
          )
        )
          pair = [v.tiles[i].id, v.tiles[j].id];
    for (const k of ["a", "b"])
      x = go(x.state, k, { type: "heartbeat", matchId: id }, t);
    x = go(
      x.state,
      "a",
      {
        type: "answer",
        matchId: id,
        question: v.question,
        tiles: pair,
        seq,
        winner: "ub",
        dr: 99999,
      },
      t + 500,
    );
    t += 1600;
  }
  const s = x.state;
  assert.equal(s.matches[id].phase, "settled");
  assert.equal(s.players.aa.easy.games, 1);
  assert(s.players.aa.easy.rating > 1800);
  assert.equal(s.players.aa.normal.rating, 1500);
  assert.equal(s.players.aa.normal.games, 0);
  assert.equal(s.players.ab.easy.games, 1);
  const again = go(s, "a", { type: "answer", matchId: id, seq: 15 }, t).state;
  assert.deepEqual(again.players, s.players);
  assert.deepEqual(again.settlements, s.settlements);
});
test("NORMAL result does not touch EASY; forged tile IDs and sequence gaps reject", () => {
  let x = match(base(), "normal"),
    id = x.matchId;
  for (const k of ["a", "b"])
    x = go(x.state, k, { type: "vote", matchId: id, mode: "B" });
  const t = x.state.matches[id].game.startAt + 1000;
  assert.throws(
    () =>
      go(
        x.state,
        "a",
        {
          type: "answer",
          matchId: id,
          question: "1:0",
          tiles: ["fake", "bad"],
          seq: 1,
        },
        t,
      ),
    /INVALID_TILES/,
  );
  assert.throws(
    () => go(x.state, "a", { type: "answer", matchId: id, seq: 3 }, t),
    /SEQUENCE_GAP/,
  );
  x = go(x.state, "a", { type: "leave", matchId: id }, t);
  assert.equal(x.state.players.aa.easy.rating, 1800);
  assert.equal(x.state.players.aa.easy.games, 0);
  assert(x.state.players.ab.normal.rating > 1500);
  assert.equal(x.state.players.aa.normal.games, 1);
});
test("EASY 1501 and NORMAL three matches; titles independent and retained", () => {
  const s = base();
  s.players.aa.easy.games = 3;
  s.players.aa.easy.w = 2;
  assert.equal(C.rankings(s, "easy", now).length, 2);
  assert.equal(C.rankings(s, "normal", now).length, 0);
  assert.deepEqual(C.badges(1820, 1500), {
    easy_adept: true,
    easy_master: true,
  });
  assert(C.badges(1500, 1500, C.badges(1820, 1820)).dual_master);
});
test("server B engine full game, pending attack, correct answers, duplicate submission and outcome", () => {
  let x = match(base()),
    id = x.matchId;
  for (const k of ["a", "b"])
    x = go(x.state, k, { type: "vote", matchId: id, mode: "B" });
  let t = x.state.matches[id].game.startAt;
  for (let seq = 1; seq <= 15; seq++) {
    for (const k of ["a", "b"])
      x = go(x.state, k, { type: "heartbeat", matchId: id }, t);
    const g = x.state.matches[id].game,
      v = E.view(g, "ua"),
      rt = E.runtime(g);
    let pair;
    for (let i = 0; i < v.tiles.length; i++)
      for (let j = i + 1; j < v.tiles.length; j++)
        if (
          rt.api.polyEqual(
            rt.api.multiply(v.tiles[i].factor, v.tiles[j].factor),
            v.poly,
          )
        )
          pair = [v.tiles[i].id, v.tiles[j].id];
    const command = {
      type: "answer",
      matchId: id,
      question: v.question,
      tiles: pair,
      seq,
    };
    x = go(x.state, "a", command, t + 500);
    const one = C.copy(x.state);
    x = go(x.state, "a", command, t + 500);
    assert.deepEqual(x.state.players, one.players);
    t += 1000;
  }
  assert.equal(x.state.matches[id].phase, "settled");
  assert.equal(x.state.matches[id].game.result.winner, "ua");
  assert.equal(x.state.players.aa.easy.games, 1);
  assert.equal(x.state.players.aa.normal.rating, 1500);
});
test("vote timeout/mode split uses server choice, expired wait and prestart cancellation have no rating", () => {
  let x = match(base()),
    id = x.matchId;
  x = go(x.state, "a", { type: "vote", matchId: id, mode: "A" }, now + 1);
  for (const k of ["a", "b"])
    x = go(x.state, k, { type: "heartbeat", matchId: id }, now + 5000);
  x = go(x.state, "b", { type: "heartbeat", matchId: id }, now + 10001);
  assert.equal(x.state.matches[id].phase, "play");
  assert.equal(x.state.matches[id].mode, "B");
  assert.equal(x.state.matches[id].difficulty, "easy");
  const y = go(base(), "a", { type: "enqueue", difficulty: "easy" });
  const z = go(
    y.state,
    "b",
    { type: "enqueue", difficulty: "easy" },
    now + 26000,
  );
  assert.equal(z.matchId, undefined);
  assert.equal(z.state.players.aa.easy.games, 0);
});

test("EASY boundary, legacy zero-match carry and normalized ratings; NORMAL unchanged", () => {
  const s = base();
  s.players.aa.easy.rating = 1501;
  s.players.ab.easy.rating = 1500.9;
  s.players.ac.easy.rating = 1500;
  assert.deepEqual(
    C.rankings(s, "easy", now).map((r) => r.key),
    ["aa"],
  );
  s.players.ab.easy.rating = 1800;
  s.players.ac.normal.games = 3;
  assert.deepEqual(
    C.rankings(s, "easy", now).map((r) => r.key),
    ["ab", "aa"],
  );
  assert.equal(C.rankings(s, "normal", now)[0].key, "ac");
  assert.equal(s.players.ab.easy.games, 0);
  assert.equal(s.players.ab.normal.rating, 1500);
  const before = JSON.stringify(s);
  C.rankings(s, "easy", now);
  assert.equal(JSON.stringify(s), before);
});
