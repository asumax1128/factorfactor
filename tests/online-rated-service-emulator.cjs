// Real emulator Auth tokens → HTTPS function → Admin SDK transaction. Demo only.
const assert = require("node:assert/strict");
const { initializeApp } = require("firebase/app");
const {
  getAuth,
  connectAuthEmulator,
  signInAnonymously,
} = require("firebase/auth");
const serverRequire = require("node:module").createRequire(
  require.resolve("../server/online-rated/package.json"),
);
const { initializeApp: adminApp } = serverRequire("firebase-admin/app");
const { getDatabase } = serverRequire("firebase-admin/database");
const C = require("../server/online-rated/core.cjs");
(async () => {
  if (
    process.env.GCLOUD_PROJECT !== "demo-factorfactor-tower" ||
    process.env.FIREBASE_DATABASE_EMULATOR_HOST !== "127.0.0.1:9000"
  )
    throw Error("DEMO_LOOPBACK_REQUIRED");
  const db = getDatabase(
    adminApp({
      projectId: "demo-factorfactor-tower",
      databaseURL: "https://demo-factorfactor-tower.firebaseio.com",
    }),
  );
  const users = [];
  for (const name of ["a", "b"]) {
    const app = initializeApp(
        { projectId: "demo-factorfactor-tower", apiKey: "emulator-only" },
        name,
      ),
      auth = getAuth(app);
    connectAuthEmulator(auth, "http://127.0.0.1:9099", {
      disableWarnings: true,
    });
    const { user } = await signInAnonymously(auth);
    users.push({
      uid: user.uid,
      key: "a" + name,
      token: await user.getIdToken(),
    });
  }
  const state = C.migrate(
    null,
    {
      aa: { name: "A", stats: { rating: 1800 } },
      ab: { name: "B", stats: { rating: 1620 } },
    },
    "test",
    Date.now(),
  );
  state.enabled = true;
  state.migrationReady = true;
  await db.ref("games/factor/onlineRatedV2/privateState").set(state);
  for (const u of users)
    await db
      .ref(`games/factor/logins/${u.key}/${u.uid}`)
      .set("synthetic-test-only");
  const url =
    "http://127.0.0.1:5001/demo-factorfactor-tower/asia-southeast1/onlineRated";
  async function request(u, command, key = u.key) {
    const r = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + u.token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        accountKey: key,
        command: { protocol: 2, ...command },
      }),
    });
    const v = await r.json();
    return { status: r.status, v };
  }
  let a = await request(users[0], { type: "status" });
  assert.equal(a.status, 200, JSON.stringify(a.v));
  assert.equal(a.v.ratings.easy.rating, 1800);
  assert.equal(a.v.ratings.normal.rating, 1500);
  assert.equal(
    (await request(users[0], { type: "status" }, users[1].key)).status,
    400,
  );
  assert.equal(
    (
      await request(users[0], {
        type: "enqueue",
        difficulty: "easy",
        protocol: 1,
      })
    ).status,
    400,
  );
  const [ea, nb] = await Promise.all([
    request(users[0], { type: "enqueue", difficulty: "easy" }),
    request(users[1], { type: "enqueue", difficulty: "normal" }),
  ]);
  assert(ea.v.ticket && nb.v.ticket);
  assert.equal(ea.v.match, null);
  assert.equal(nb.v.match, null);
  await request(users[1], { type: "cancel", ticket: nb.v.ticket });
  const b = await request(users[1], { type: "enqueue", difficulty: "easy" });
  assert.equal(b.v.match.phase, "vote");
  a = await request(users[0], { type: "heartbeat" });
  assert.equal(a.status, 200, JSON.stringify(a.v));
  assert.equal(a.v.match.id, b.v.match.id);
  const id = b.v.match.id;
  await Promise.all(
    users.map((u) => request(u, { type: "vote", matchId: id, mode: "B" })),
  );
  await new Promise((resolve) => setTimeout(resolve, 4000));
  const live = await request(users[0], { type: "heartbeat", matchId: id });
  assert.equal(live.status, 200, JSON.stringify(live.v));
  const game = (
    await db
      .ref(`games/factor/onlineRatedV2/privateState/matches/${id}/game`)
      .get()
  ).val();
  const math = require("../server/online-rated/engine.cjs").runtime(game).api;
  const view = live.v.match.game;
  let tiles;
  for (let i = 0; i < view.tiles.length; i++)
    for (let j = i + 1; j < view.tiles.length; j++)
      if (
        math.polyEqual(
          math.multiply(view.tiles[i].factor, view.tiles[j].factor),
          view.poly,
        )
      )
        tiles = [view.tiles[i].id, view.tiles[j].id];
  const command = {
    type: "answer",
    matchId: id,
    question: view.question,
    tiles,
    seq: 1,
  };
  const answered = await request(users[0], command);
  assert.equal(answered.status, 200, JSON.stringify(answered.v));
  assert.equal((await request(users[0], command)).status, 200);
  const afterAnswer = (
    await db
      .ref(`games/factor/onlineRatedV2/privateState/matches/${id}/game`)
      .get()
  ).val();
  assert.equal(afterAnswer.states[users[0].uid].c, 1);
  assert.equal(afterAnswer.states[users[0].uid].hist.length, 1);
  const result = await request(users[0], { type: "leave", matchId: id });
  assert.equal(result.v.match.phase, "settled");
  assert.equal(result.v.match.outcome, "lose");
  const again = await Promise.all([
    request(users[0], { type: "leave", matchId: id }),
    request(users[1], { type: "heartbeat", matchId: id }),
  ]);
  const final = (
    await db.ref("games/factor/onlineRatedV2/privateState").get()
  ).val();
  assert.equal(final.players.aa.easy.games, 1);
  assert.equal(final.players.ab.easy.games, 1);
  assert.equal(final.players.aa.normal.games, 0);
  assert.equal(Object.keys(final.settlements || {}).length, 0);
  assert.equal(
    Object.keys(
      (await db.ref("games/factor/onlineRatedV2/matchArchive").get()).val(),
    ).length,
    1,
  );
  assert(again.every((x) => x.status === 200));
  assert.equal(again[1].v.match.outcome, "win");
  assert.equal((await request(users[0], { type: "status" })).v.match.id, id);
  assert.equal(
    (await request(users[0], { type: "equipTitle", title: "dual_master" }))
      .status,
    400,
  );
  assert.equal(
    (await request(users[0], { type: "equipTitle", title: "easy_adept" }))
      .status,
    200,
  );
  assert.equal(
    (await request(users[0], { type: "ackReceipt", matchId: id })).status,
    200,
  );
  assert.equal((await request(users[0], { type: "status" })).v.match, null);
  assert.equal(
    (await request(users[0], { type: "leave", matchId: id, protocol: 1 }))
      .status,
    400,
  );
  console.log(
    "PASS real Auth/HTTPS/Admin transaction: spoofed account and old version rejected, separate queues, concurrent vote, atomic two-player result, retries once",
  );
  await db.goOffline();
})()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => setTimeout(() => process.exit(process.exitCode || 0), 100));
