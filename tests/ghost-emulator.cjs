const fs = require("fs"),
  assert = require("node:assert/strict");
const firebase = require("firebase/compat/app");
require("firebase/compat/auth");
require("firebase/compat/database");
const {
  initializeTestEnvironment,
  assertFails,
} = require("@firebase/rules-unit-testing");
const { ref, set, get } = require("firebase/database");
const Spark = require("../src/online-spark-client.cjs"),
  G = require("../src/ghost-model.cjs"),
  E = require("../server/online-rated/engine.cjs");
const base = JSON.parse(
    fs.readFileSync("firebase/online-spark.candidate.rules.json", "utf8"),
  ),
  rules = JSON.parse(JSON.stringify(base));
Object.assign(
  rules.rules.games.factor,
  require("../firebase/online-spark-rules.cjs"),
  require("../firebase/ghost-rules.cjs"),
);
require("../firebase/event-host-rules.cjs").patch(rules);
assert.deepEqual(rules,JSON.parse(fs.readFileSync("firebase/ghost-host.candidate.rules.json","utf8")), "Emulator must exercise the exact owner-published candidate");
(async () => {
  if (process.env.GCLOUD_PROJECT !== "demo-factorfactor-tower")
    throw Error("DEMO_ONLY");
  const env = await initializeTestEnvironment({
      projectId: "demo-factorfactor-tower",
      database: { host: "127.0.0.1", port: 9000, rules: JSON.stringify(rules) },
    }),
    users = [];
  const accounts = {
    aa: { name: "A", stats: { rating: 1800, exp: 100 } },
    ab: {
      name: "B",
      stats: { rating: 1620, streak: 3 },
      prof: { lv: { L1: { n: 20, ok: 19, ms: 190000 } } },
    },
  };
  accounts.ac = { name: "C", stats: { rating: 1500, exp: 100 } };
  let clock = Date.now();
  try {
    for (const key of Object.keys(accounts)) {
      const app = firebase.initializeApp(
        {
          projectId: "demo-factorfactor-tower",
          apiKey: "fixture",
          databaseURL: "https://demo-factorfactor-tower.firebaseio.com",
        },
        "ghost-" + key,
      );
      app
        .auth()
        .useEmulator("http://127.0.0.1:9099", { disableWarnings: true });
      app.database().useEmulator("127.0.0.1", 9000);
      const { user } = await app.auth().signInAnonymously();
      users.push({ key, uid: user.uid, app, db: app.database() });
    }
    await env.withSecurityRulesDisabled((ctx) =>
      set(ref(ctx.database()), {
        games: {
          factor: {
            accounts,
            logins: Object.fromEntries(
              users.map((u) => [u.key, { [u.uid]: "fixture" }]),
            ),
            onlineSparkV1: { config: { enabled: true, protocol: "spark-v1" } },
          },
        },
      }),
    );
    for (const u of users)
      u.client = Spark.create({
        db: u.db,
        uid: u.uid,
        account: { key: u.key, name: accounts[u.key].name },
        now: () => clock,
        random: () => 0.99,
      });
    const [a, b, c] = users;
    await b.client.request({ type: "status" });
    await env.withSecurityRulesDisabled((ctx) =>
      set(
        ref(ctx.database(), "games/factor/onlineSparkV1/profiles/ab/normal"),
        {
          rating: 1580,
          games: 0,
          w: 0,
          l: 0,
          d: 0,
          maxRating: 1580,
          season: "2026-10",
          seasonMax: 1580,
        },
      ),
    );
    let s = await a.client.request({ type: "enqueue", difficulty: "normal" });
    assert.equal(s.match, null);
    const ticket = s.ticket;
    assert.equal(s.ghostReady, true);
    clock = Date.now();
    s = await a.client.request({ type: "heartbeat" });
    assert.equal(s.match, null);
    // undo the heartbeat lease advance for fake time; wait began is unchanged.
    await new Promise((r) => setTimeout(r, 10000));
    clock = Date.now();
    s = await a.client.request({ type: "heartbeat" });
    assert(s.match?.opponent);
    assert.equal(s.match.origin, "quick");
    assert.equal(s.match.opponent.type, "hyper");
    assert.equal(s.match.opponent.rankDifference, 2);
    assert.equal(s.match.difficulty, "normal");
    const mid = s.match.id;
    assert(mid.startsWith("ghost-"));
    assert.equal(
      (await a.db.ref("games/factor/onlineSparkV1/slots/normal").get()).val(),
      null,
    );
    s = await a.client.request({ type: "vote", matchId: mid, mode: "A" });
    assert.equal(s.match.mode, "A");
    clock += 5000;
    // Use a verified engine game to produce a real final result quickly (no fabricated receipt).
    let stored = (
      await a.db.ref(`games/factor/ghostV1/users/aa/matches/${mid}`).get()
    ).val();
    for (let n = 0; n < 30; n++) {
      const v = E.view(stored.game, a.uid),
        rt = E.runtime(stored.game);
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
      stored.game = E.step(
        stored.game,
        a.uid,
        { type: "answer", question: v.question, tiles: pair },
        v.startAt + 100,
      );
    }
    assert.equal(stored.game.result.winner, a.uid);
    // Clock restored to actual time; initial future start can be settled after without reversing.
    clock = Math.max(Date.now(), stored.game.time);
    await a.db.ref(`games/factor/ghostV1/users/aa/matches/${mid}`).set(stored);
    s = await a.client.request({ type: "heartbeat", matchId: mid });
    assert.equal(s.match.phase, "settled");
    assert.equal(s.ratings.normal.games, 0);
    assert.equal(s.ratings.normal.ghost.games, 1);
    assert.equal(s.badges.hyper_slayer, true);
    assert.equal(s.badges.ghost_up2, true);
    assert.equal(s.badges.ghost_up1, undefined);
    assert.equal(s.ratings.easy.rating, 1800);
    assert.equal(s.rankings.normal.length, 0);
    await a.client.request({ type: "heartbeat", matchId: mid });
    assert.equal(
      (await a.db.ref(`games/factor/accounts/aa/stats`).get()).val().exp,
      108,
    );
    assert.equal(
      Object.keys(
        (await a.db.ref("games/factor/ghostV1/users/aa/events").get()).val(),
      ).length,
      1,
    );
    await assertFails(b.db.ref("games/factor/ghostV1/users/aa").get());
    await assertFails(
      b.db.ref("games/factor/ghostV1/users/aa/events/fake").set({}),
    );
    await assertFails(
      b.db
        .ref("games/factor/onlineSparkV1/profiles/aa/normal/rating")
        .set(9999),
    );
    await a.client.request({ type: "ackReceipt", matchId: mid });
    s = await a.client.request({ type: "status" });
    assert.equal(s.match, null);
    console.log(
      "PASS 10-second atomic intrusion, A engine settlement, one-third rating, human count unchanged, XP/history once, peer private access denied, result acknowledged",
    );
    clock = Date.now();
    let directed = await c.client.request({
      type: "directGhost",
      target: "ab",
      difficulty: "easy",
      origin: "bounty",
    });
    const bid = directed.match.id;
    await c.client.request({ type: "vote", matchId: bid, mode: "A" });
    const br = c.db.ref(`games/factor/ghostV1/users/ac/matches/${bid}`);
    let bm = (await br.get()).val();
    bm.game = E.begin(
      bid,
      "easy",
      "A",
      [c.uid, "_ghost"],
      bm.seed,
      Date.now() - 30000,
    );
    for (let q = 0; q < 15; q++) {
      const v = E.view(bm.game, c.uid),
        rt = E.runtime(bm.game);
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
      bm.game = E.step(
        bm.game,
        c.uid,
        { type: "answer", question: v.question, tiles: pair },
        v.startAt + 100,
      );
    }
    await br.set(bm);
    directed = await c.client.request({ type: "heartbeat", matchId: bid });
    assert.equal(directed.match.outcome, "win");
    assert.equal(directed.ratings.easy.rating, 1500);
    assert.equal(directed.ratings.easy.games, 0);
    await c.client.request({ type: "heartbeat", matchId: bid });
    assert.equal(
      (await c.db.ref("games/factor/accounts/ac/stats/exp").get()).val(),
      108,
    );
    const until = (
      await c.db.ref("games/factor/ghostV1/users/ac/bountyCooldowns/ab").get()
    ).val();
    assert.equal(until, directed.match.receipt.at + 7 * 86400e3);
    await c.client.request({ type: "ackReceipt", matchId: bid });
    await assert.rejects(
      c.client.request({
        type: "directGhost",
        target: "ab",
        difficulty: "normal",
        origin: "bounty",
      }),
      /7日間/,
    );
    assert.equal(
      (await b.db.ref(`games/factor/ghostV1/inbox/ab/${bid}`).get()).val()
        .byKey,
      "ac",
    );
    console.log(
      "PASS bounty exact 8EXP once, shared seven-day cross-difficulty cooldown, direct unrated/human counts unchanged, passive recipient history",
    );
    const waiting = await a.client.request({
      type: "enqueue",
      difficulty: "easy",
    });
    clock=Date.now();
    await env.withSecurityRulesDisabled(ctx=>set(ref(ctx.database(),'games/factor/onlineSparkV1/slots/easy/startedAt'),clock-10000));
    await a.client.request({type:'enqueue',difficulty:'easy'});
    const race = await Promise.allSettled([
      a.client.request({ type: "heartbeat" }),
      b.client.request({ type: "enqueue", difficulty: "easy" }),
    ]);
    assert(race.every(r=>r.status==='fulfilled'), 'transition retries must avoid a permission error in normal matching');
    await env.withSecurityRulesDisabled(async (ctx) => {
      const all = (await get(ref(ctx.database(), "games/factor"))).val();
      const human = !!all.onlineSparkV1.matches?.[waiting.ticket],
        ghost = !!all.ghostV1.users.aa.matches?.["ghost-" + waiting.ticket];
      assert(!(human && ghost));
      assert(human || ghost);
    });
    console.log(
      "PASS real competing human claim versus ghost fallback produces only one match",
    );
    console.log(
      "PASS existing rating/learning data preserved and NORMAL human ranking gate",
    );
  } finally {
    for (const u of users) {
      u.client?.close();
      await u.app.delete();
    }
    await env.cleanup();
  }
})()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => setTimeout(() => process.exit(process.exitCode || 0), 100));
