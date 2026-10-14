// Actual Firebase SDK + exact published rules. Injected ACK delay is labelled,
// not a claim about production/iPhone latency or billable wire traffic.
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  { performance } = require("node:perf_hooks");
const firebase = require("firebase/compat/app");
require("firebase/compat/auth");
require("firebase/compat/database");
const { initializeTestEnvironment } = require("@firebase/rules-unit-testing");
const { ref, set, get } = require("firebase/database");
let Spark = require("../src/online-spark-client.cjs");
if (process.env.LATENCY_BASELINE_CLIENT) {
  const Module = require("node:module");
  const baseline = new Module(
    require.resolve("../src/online-spark-client.cjs"),
    module,
  );
  baseline.filename = require.resolve("../src/online-spark-client.cjs");
  baseline.paths = module.paths;
  baseline._compile(
    fs.readFileSync(process.env.LATENCY_BASELINE_CLIENT, "utf8"),
    baseline.filename,
  );
  Spark = baseline.exports;
}
const E = require("../server/online-rated/engine.cjs");
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  assert.equal(process.env.GCLOUD_PROJECT, "demo-factorfactor-tower");
  const env = await initializeTestEnvironment({
    projectId: process.env.GCLOUD_PROJECT,
    database: {
      host: "127.0.0.1",
      port: 9000,
      rules: fs.readFileSync(
        "firebase/ghost-host.candidate.rules.json",
        "utf8",
      ),
    },
  });
  const apps = [];
  let clock = Date.now(),
    metrics = {
      gets: 0,
      transactions: 0,
      listeners: 0,
      events: 0,
      applicationBytes: 0,
    },
    lag = 0;
  const users = [];
  try {
    for (const key of ["aa", "ab"]) {
      const app = firebase.initializeApp(
        {
          projectId: process.env.GCLOUD_PROJECT,
          apiKey: "fixture",
          databaseURL: "https://demo-factorfactor-tower.firebaseio.com",
        },
        "latency-" + key,
      );
      apps.push(app);
      app
        .auth()
        .useEmulator("http://127.0.0.1:9099", { disableWarnings: true });
      app.database().useEmulator("127.0.0.1", 9000);
      const { user } = await app.auth().signInAnonymously();
      users.push({ key, uid: user.uid, db: app.database() });
    }
    await env.withSecurityRulesDisabled((ctx) =>
      set(ref(ctx.database()), {
        games: {
          factor: {
            accounts: {
              aa: { name: "A", stats: { rating: 1600, exp: 100 } },
              ab: {
                name: "B",
                stats: { rating: 1600, streak: 3 },
                prof: { lv: { L1: { n: 30, ok: 30, ms: 300000 } } },
              },
            },
            logins: Object.fromEntries(
              users.map((u) => [u.key, { [u.uid]: "fixture" }]),
            ),
            onlineSparkV1: { config: { enabled: true, protocol: "spark-v1" } },
          },
        },
      }),
    );
    const measured = (db) => ({
      ref: (path) => {
        const r = db.ref(path),
          wrappers = new Map();
        return new Proxy(r, {
          get: (o, k) => {
            if (k === "get")
              return async () => {
                metrics.gets++;
                await delay(lag);
                const s = await o.get();
                metrics.applicationBytes += Buffer.byteLength(
                  JSON.stringify(s.val()),
                );
                return s;
              };
            if (k === "transaction")
              return async (fn) => {
                metrics.transactions++;
                const t = performance.now(),
                  v = await o.transaction(fn, undefined, false);
                await delay(lag);
                metrics.lastWriteMs = performance.now() - t;
                metrics.applicationBytes += Buffer.byteLength(
                  JSON.stringify(v.snapshot.val()),
                );
                return v;
              };
            if (k === "on")
              return (ev, fn, cancel) => {
                metrics.listeners++;
                const wrapped = (s) => {
                  metrics.events++;
                  fn(s);
                };
                wrappers.set(fn, wrapped);
                return o.on(ev, wrapped, cancel);
              };
            if (k === "off")
              return (ev, fn) => {
                o.off(ev, wrappers.get(fn) || fn);
                wrappers.delete(fn);
              };
            return typeof o[k] === "function" ? o[k].bind(o) : o[k];
          },
        });
      },
    });
    const [a, b] = users;
    const store = new Map(),
      storage = {
        getItem: (k) => store.get(k),
        setItem: (k, v) => store.set(k, v),
        removeItem: (k) => store.delete(k),
      };
    let learningCalls = 0;
    const make = (u) =>
      Spark.create({
        db: measured(u.db),
        uid: u.uid,
        account: { key: u.key, name: u.key === "aa" ? "A" : "B" },
        now: () => clock,
        storage,
        learning: async () => { learningCalls++; },
      });
    b.client = make(b);
    await b.client.request({ type: "status" });
    a.client = make(a);
    await a.client.request({ type: "status" });
    let s = await a.client.request({
      type: "directGhost",
      target: "ab",
      origin: "profile",
      difficulty: "easy",
    });
    s = await a.client.request({
      type: "vote",
      matchId: s.match.id,
      mode: "A",
    });
    await a.client.flush?.();
    const id = s.match.id;
    clock = s.match.gameStartAt + 100;
    metrics = {
      gets: 0,
      transactions: 0,
      listeners: 0,
      events: 0,
      applicationBytes: 0,
    };
    lag = 400;
    const timings = [];
    // An actual offline SDK queues checkpoint writes; local answers must still progress.
    if (!process.env.LATENCY_BASELINE_CLIENT) a.db.goOffline();
    for (let n = 0; n < 15; n++) {
      if (n === 8 && !process.env.LATENCY_BASELINE_CLIENT) {
        a.db.goOnline();
      }
      const g = s.match.game;
      clock = Math.max(clock, Math.max(g.startAt, g.readyAt || 0)) + 100;
      let pair;
      const api = E.runtime({
        id: "verify",
        mode: "A",
        difficulty: "easy",
        ids: ["x", "y"],
        seed: "verify",
        time: clock,
      }).api;
      for (let i = 0; i < g.tiles.length; i++)
        for (let j = i + 1; j < g.tiles.length; j++)
          if (
            api.polyEqual(
              api.multiply(g.tiles[i].factor, g.tiles[j].factor),
              g.poly,
            )
          )
            pair = [g.tiles[i].id, g.tiles[j].id];
      const cmd = {
        type: "answer",
        matchId: id,
        question: g.question,
        tiles: pair,
        seq: n + 1,
      };
      const start = performance.now();
      s = await a.client.request(cmd);
      timings.push(performance.now() - start);
      // A duplicated release must never score twice, even while writes are outstanding.
      if (n === 2) {
        const duplicate = await a.client.request(cmd);
        assert.equal(duplicate.match.game.acceptedSeq, 3);
        assert.equal(duplicate.match.game.question, s.match.game.question);
      }
    }
    assert.equal(s.match.phase, "settled");
    assert.equal(s.match.outcome, "win");
    assert.equal(s.ratings.easy.rating, 1600);
    assert.equal(s.ratings.easy.games, 0);
    const receipt = await a.client.request({ type: "status", matchId: id });
    assert.equal(receipt.match.receipt.result.winner, a.uid);
    const stats = (
      await a.db.ref("games/factor/accounts/aa/stats").get()
    ).val();
    assert.equal(stats.exp, 108);
    assert.equal(Object.keys(stats.ghostAwards).length, 1);
    const remote = (
      await a.db.ref(`games/factor/ghostV1/users/aa/matches/${id}`).get()
    ).val();
    assert.equal(remote.phase, "settled");
    assert.equal(remote.game.seq[a.uid], 15);
    console.log(
      JSON.stringify({
        environment: process.env.LATENCY_BASELINE_CLIENT
          ? "Ver5.16 SDK/Auth/RTDB Emulator; injected 400ms get/ACK delay; online"
          : "Ver5.17 SDK/Auth/RTDB Emulator; injected 400ms get/ACK delay; offline first eight answers",
        first14LocalResponsesMs: timings.slice(0, 14),
        finalDurableSettlementMs: timings.at(-1),
        ...metrics,
      }),
    );
    // Reload recovery from the durable receipt, with no extra reward.
    a.client.close();
    a.client = make(a);
    const recovered = await a.client.request({ type: "status" });
    assert.equal(recovered.match.phase, "settled");
    assert.equal(
      (await a.db.ref("games/factor/accounts/aa/stats/exp").get()).val(),
      108,
    );
    console.log(
      process.env.LATENCY_BASELINE_CLIENT
        ? "PASS baseline 15 SDK answers and duplicate/reward checks"
        : "PASS 15 real SDK answers, duplicate sequence, actual offline/reconnect, final durable receipt, reload/XP/rating idempotence under unchanged exact rules",
    );
    if (!process.env.LATENCY_BASELINE_CLIENT) {
      lag = 0;
      await a.client.request({ type: "ackReceipt", matchId: id });
      clock = Date.now();
      let pending = await a.client.request({
        type: "directGhost",
        target: "ab",
        origin: "profile",
        difficulty: "easy",
      });
      pending = await a.client.request({
        type: "vote",
        matchId: pending.match.id,
        mode: "A",
      });
      await a.client.flush();
      const recoveryId = pending.match.id;
      a.db.goOffline();
      clock = pending.match.gameStartAt + 100;
      const rg = pending.match.game,
        rapi = E.runtime(
          E.begin("verify", "easy", "A", ["x", "y"], "verify", clock),
        ).api;
      let rp;
      for (let i = 0; i < rg.tiles.length; i++)
        for (let j = i + 1; j < rg.tiles.length; j++)
          if (
            rapi.polyEqual(
              rapi.multiply(rg.tiles[i].factor, rg.tiles[j].factor),
              rg.poly,
            )
          )
            rp = [rg.tiles[i].id, rg.tiles[j].id];
      pending = await a.client.request({
        type: "answer",
        matchId: recoveryId,
        question: rg.question,
        tiles: rp,
        seq: 1,
      });
      a.client.close();
      a.db.goOnline();
      a.client = make(a);
      const resumed = await a.client.request({ type: "status" });
      assert.equal(resumed.match.id, recoveryId);
      assert.equal(resumed.match.game.acceptedSeq, 1);
      assert.equal(resumed.match.game.question, pending.match.game.question);
      await a.client.flush();
      const durable = (
        await a.db
          .ref(`games/factor/ghostV1/users/aa/matches/${recoveryId}`)
          .get()
      ).val();
      assert.equal(durable.game.seq[a.uid], 1);
      const loss = await a.client.request({
        type: "leave",
        matchId: recoveryId,
      });
      assert.equal(loss.match.phase, "settled");
      await a.client.request({ type: "ackReceipt", matchId: recoveryId });
      assert.equal(
        (await a.db.ref("games/factor/accounts/aa/stats/exp").get()).val(),
        108,
      );
      console.log(
        "PASS actual SDK pending-answer reload restores the same question/sequence from the same-tab draft, saves after reconnect and awards no extra XP",
      );
      for (const [difficulty, mode] of [
        ["easy", "A"],
        ["normal", "A"],
        ["easy", "B"],
        ["normal", "B"],
      ]) {
        clock = Date.now(); // Slot leases are checked against the emulator server clock.
        await a.client.request({ type: "enqueue", difficulty });
        let other = await b.client.request({ type: "enqueue", difficulty });
        const mid = other.match.id;
        assert.equal(
          (await a.client.request({ type: "status" })).match.id,
          mid,
        );
        await a.client.request({ type: "vote", matchId: mid, mode });
        other = await b.client.request({ type: "vote", matchId: mid, mode });
        let mine = await a.client.request({ type: "status", matchId: mid });
        assert.equal(mine.match.gameStartAt, other.match.gameStartAt);
        clock = mine.match.gameStartAt + 100;
        let count = 0;
        while (count < 15 && mine.match.phase !== "settled") {
          clock =
            Math.max(
              clock,
              Math.max(mine.match.game.startAt, mine.match.game.readyAt || 0),
            ) + 100;
          await b.client.request({ type: "heartbeat", matchId: mid });
          mine = await a.client.request({ type: "heartbeat", matchId: mid });
          if (mine.match.phase === "settled") break;
          const g = mine.match.game;
          let pair;
          const api = E.runtime(
            E.begin("verify", "easy", "A", ["x", "y"], "verify", clock),
          ).api;
          for (let i = 0; i < g.tiles.length; i++)
            for (let j = i + 1; j < g.tiles.length; j++)
              if (
                api.polyEqual(
                  api.multiply(g.tiles[i].factor, g.tiles[j].factor),
                  g.poly,
                )
              )
                pair = [g.tiles[i].id, g.tiles[j].id];
          const cmd = {
            type: "answer",
            matchId: mid,
            question: g.question,
            tiles: pair,
            seq: g.acceptedSeq + 1,
          };
          mine = await a.client.request(cmd);
          count++;
          const replay = await a.client.request(cmd);
          assert.deepEqual(
            replay.match.game?.live,
            mine.match.game?.live,
            "replay cannot change score",
          );
          if (mine.match.phase !== "settled") {
            clock = Math.max(clock, mine.match.game.readyAt || 0) + 500;
            mine = await a.client.request({ type: "heartbeat", matchId: mid });
          }
        }
        if (mode === "A") assert.equal(count, 15);
        else assert(count > 0);
        if (mine.match.phase !== "settled")
          mine = await a.client.request({ type: "leave", matchId: mid });
        other = await b.client.request({ type: "status", matchId: mid });
        assert.deepEqual(mine.match.receipt, other.match.receipt);
        if (mode === "A") {
          assert.deepEqual(mine.match.aResult, other.match.aResult);
          assert(mine.match.aResult.consistent);
          assert.equal(mine.match.aResult.events.length, count);
          assert.equal(new Set(mine.match.aResult.events.map(e=>e.id)).size,count);
        }
        assert.notEqual(mine.match.outcome, other.match.outcome);
        for (const u of [a, b])
          await u.client.request({ type: "ackReceipt", matchId: mid });
        console.log(
          `PASS actual SDK two-client ${difficulty}/${mode}: ${count} consecutive answers, common start, duplicate rejection and identical final receipt`,
        );
      }
      await assert.rejects(a.client.request({type:'directGhost',target:'aa',difficulty:'easy',origin:'profile'}),/20問/);
      await a.db.ref('games/factor/accounts/aa/prof').set({lv:{L1:{n:30,ok:30,ms:300000}}});
      for (const mode of ['A','B']) {
        clock=Date.now();
        const paths=['games/factor/accounts/aa','games/factor/onlineSparkV1/profiles/aa','games/factor/ghostV1/users/aa/events','games/factor/ghostV1/inbox/aa'];
        const before=await Promise.all(paths.map(async p=>(await a.db.ref(p).get()).val())), calls=learningCalls;
        let self=await a.client.request({type:'directGhost',target:'aa',difficulty:mode==='A'?'easy':'normal',origin:'profile'});
        const mid=self.match.id;
        assert(self.match.selfPractice);
        self=await a.client.request({type:'vote',matchId:mid,mode});clock=self.match.gameStartAt+100;
        if(mode==='A') {
          let count=0;
          while(self.match.phase!=='settled' && count<15) {
            const g=self.match.game;clock=Math.max(clock,g.startAt,g.readyAt||0)+100;
            const api=E.runtime(E.begin('pick','easy','A',['x','y'],'pick',clock)).api;
            let pair;for(let i=0;i<g.tiles.length;i++)for(let j=i+1;j<g.tiles.length;j++)if(api.polyEqual(api.multiply(g.tiles[i].factor,g.tiles[j].factor),g.poly))pair=[g.tiles[i].id,g.tiles[j].id];
            self=await a.client.request({type:'answer',matchId:mid,question:g.question,tiles:pair,seq:g.acceptedSeq+1});count++;
          }
          assert.equal(self.match.outcome,'win');assert.equal(self.match.aResult.events.length,15);
        } else self=await a.client.request({type:'leave',matchId:mid});
        assert.equal(self.match.exp,0);assert.equal(self.match.receipt.players.aa.delta,0);
        await a.client.request({type:'status',matchId:mid});await a.client.request({type:'ackReceipt',matchId:mid});
        assert.deepEqual(await Promise.all(paths.map(async p=>(await a.db.ref(p).get()).val())),before);
        assert.equal(learningCalls,calls);
        console.log('PASS actual SDK self ghost '+mode+': missing-record rejection, zero rating/XP/titles/inbox/learning changes across retry and acknowledgment');
      }
    }
  } finally {
    for (const u of users) u.client?.close();
    for (const app of apps) await app.delete();
    await env.cleanup();
  }
})()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => setTimeout(() => process.exit(process.exitCode || 0), 100));
