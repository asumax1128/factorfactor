const assert = require("node:assert/strict"),
  fs = require("node:fs");
const firebase = require("firebase/compat/app");
require("firebase/compat/auth");
require("firebase/compat/database");
const {
  initializeTestEnvironment,
  assertFails,
} = require("@firebase/rules-unit-testing");
const { set, ref, get } = require("firebase/database");
const Spark = require("../src/online-spark-client.cjs");
const memStore = () => { const m = new Map(), o = { failSet: false, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { if (o.failSet) throw Error('storage'); m.set(k, String(v)); }, removeItem: (k) => m.delete(k) }; return o; };
const original = JSON.parse(
  fs.readFileSync(process.env.RTDB_RULES_BASELINE_FILE, "utf8"),
);
const rules = JSON.parse(JSON.stringify(original));
Object.assign(
  rules.rules.games.factor,
  require("../firebase/online-spark-rules.cjs"),
);
const restored = JSON.parse(JSON.stringify(rules));
delete restored.rules.games.factor.onlineSparkV1;
assert.deepEqual(restored, original);
(async () => {
  if (process.env.GCLOUD_PROJECT !== "demo-factorfactor-tower")
    throw Error("DEMO_ONLY");
  const env = await initializeTestEnvironment({
    projectId: "demo-factorfactor-tower",
    database: { host: "127.0.0.1", port: 9000, rules: JSON.stringify(rules) },
  });
  const users = [],
    accounts = {
      aa: { name: "A", stats: { rating: 1800, w: 15, maxRating: 1850 } },
      ab: { name: "B", stats: { rating: 1620 } },
      ac: { name: "C", stats: {} },
      ad: { name: "D", stats: { rating: 1500 } },
    };
  try {
    for (const key of Object.keys(accounts)) {
      const app = firebase.initializeApp(
        {
          projectId: "demo-factorfactor-tower",
          apiKey: "emulator-only",
          databaseURL: "https://demo-factorfactor-tower.firebaseio.com",
        },
        key,
      );
      app
        .auth()
        .useEmulator("http://127.0.0.1:9099", { disableWarnings: true });
      app.database().useEmulator("127.0.0.1", 9000);
      const { user } = await app.auth().signInAnonymously();
      users.push({ key, uid: user.uid, app, db: app.database() });
    }
    const logins = Object.fromEntries(
      users.map((u) => [u.key, { [u.uid]: "fixture-only" }]),
    );
    await env.withSecurityRulesDisabled((ctx) =>
      set(ref(ctx.database()), {
        games: {
          factor: {
            accounts,
            logins,
            onlineSparkV1: { config: { enabled: true, protocol: "spark-v1" } },
          },
        },
      }),
    );
    for (const u of users)
      u.client = Spark.create({
        db: u.key === "ad" ? (u.gate = { block: false }, { ref: (p) => (u.gate.block && /accounts\/ad\/stats$/.test(p) ? { transaction: () => Promise.reject(new Error("offline")) } : u.db.ref(p)) }) : u.db,
        uid: u.uid,
        account: { key: u.key, name: accounts[u.key].name },
        queueStorage: (u.store = memStore()),   // Ver.6.3: the official-streak hand-over is durable only with a storage; the browser has localStorage
      });
    const [a, b, c, d] = users;
    for (const u of users) {
      const s = await u.client.request({ type: "status" });
      assert.equal(s.ratings.easy.rating, accounts[u.key].stats.rating ?? 1500);
      assert.equal(s.ratings.normal.rating, 1500);
      assert.equal(s.ratings.easy.games, 0);
    }
    await env.withSecurityRulesDisabled((ctx) =>
      set(ref(ctx.database(), "games/factor/accounts/aunvisited"), {
        name: "Unvisited",
        stats: { rating: 1850 },
      }),
    );
    const ratingsOnly = await a.client.request({ type: "ratings" });
    assert.ok(
      ratingsOnly.rankings.easy.some(
        (r) => r.key === "aunvisited" && r.rating === 1850 && r.games === 0,
      ),
    );
    assert.equal(ratingsOnly.rankings.normal.length, 0);
    await env.withSecurityRulesDisabled(async (ctx) =>
      assert.equal(
        (
          await get(
            ref(
              ctx.database(),
              "games/factor/onlineSparkV1/profiles/aunvisited",
            ),
          )
        ).val(),
        null,
      ),
    );
    assert.equal(ratingsOnly.match, null);
    console.log(
      "PASS native rules: EASY zero-game carry/read-only old accounts, NORMAL three-game gate",
    );
    console.log(
      "PASS real Auth + atomic own migration: legacy 1800/1620 → EASY, NORMAL1500, new1500/1500, zero new games",
    );
    await assertFails(
      a.db.ref("games/factor/onlineSparkV1/profiles/ab/easy/rating").set(9999),
    );
    await assertFails(a.db.ref("games/factor/onlineSparkV1/backups/ab").get());
    await assertFails(
      a.db.ref("games/factor/onlineSparkV1/config/enabled").set(false),
    );
    await assertFails(
      a.db.ref("games/factor/onlineSparkV1/backups/aa").remove(),
    );
    await assertFails(
      a.db.ref("games/factor/onlineSparkV1/profiles/aa").remove(),
    );
    await assertFails(
      a.db
        .ref("games/factor/onlineSparkV1/profiles/aa/initialRating")
        .set(1500),
    );
    console.log(
      "PASS peer writes/backup reads, config writes, migration reset and backup/profile deletion rejected",
    );
    const ea = await a.client.request({ type: "enqueue", difficulty: "easy" }),
      nb = await b.client.request({ type: "enqueue", difficulty: "normal" });
    assert(ea.ticket && nb.ticket);
    assert.equal(ea.match, null);
    assert.equal(nb.match, null);
    const ec = await c.client.request({ type: "enqueue", difficulty: "easy" }),
      nd = await d.client.request({ type: "enqueue", difficulty: "normal" });
    assert.equal(ec.match.difficulty, "easy");
    assert.equal(nd.match.difficulty, "normal");
    const ma = (await a.client.request({ type: "heartbeat" })).match,
      mb = (await b.client.request({ type: "heartbeat" })).match;
    assert.equal(ma.id, ec.match.id);
    assert.equal(mb.id, nd.match.id);
    assert.notEqual(ma.id, mb.id);
    await assertFails(
      b.db
        .ref(`games/factor/onlineSparkV1/matches/${ma.id}/phase`)
        .set("settled"),
    );
    await assertFails(
      a.db
        .ref(`games/factor/onlineSparkV1/matches/${ma.id}/difficulty`)
        .set("normal"),
    );
    await Promise.all(
      [a, c].map((u) =>
        u.client.request({ type: "vote", matchId: ma.id, mode: "B" }),
      ),
    );
    await Promise.all(
      [b, d].map((u) =>
        u.client.request({ type: "vote", matchId: mb.id, mode: "A" }),
      ),
    );
    await new Promise((r) => setTimeout(r, 4000));
    const va = await a.client.request({ type: "heartbeat", matchId: ma.id });
    assert.equal(va.match.mode, "B");
    const view = va.match.game,
      game = (
        await a.db.ref(`games/factor/onlineSparkV1/matches/${ma.id}/game`).get()
      ).val();
    const math = require("../server/online-rated/engine.cjs").runtime(game).api;
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
    const answer = {
      type: "answer",
      matchId: ma.id,
      seq: 1,
      question: view.question,
      tiles,
    };
    {   // Ver.6.3: while the start cannot be saved in the match log (server not confirming), no answer is sent for a counted match
      const blocked = { ref: (p) => (/accounts\/aa\/stats$/.test(p) ? { transaction: () => Promise.reject(new Error("offline")) } : a.db.ref(p)) };
      const cb = Spark.create({ db: blocked, uid: a.uid, account: { key: a.key, name: "A" }, queueStorage: memStore() });
      await assert.rejects(() => cb.request({ ...answer, seq: 7 }), /試合の記録を準備しています/);
      const g0 = (await a.db.ref(`games/factor/onlineSparkV1/matches/${ma.id}/game`).get()).val();
      assert.equal(g0.states[a.uid].c, 0, "the blocked client sent nothing");
      cb.close();
    }
    await a.client.request(answer);
    await a.client.request(answer);
    const after = (
      await a.db.ref(`games/factor/onlineSparkV1/matches/${ma.id}/game`).get()
    ).val();
    assert.equal(after.states[a.uid].c, 1);
    await a.client.request({ type: "leave", matchId: ma.id });
    await c.client.request({ type: "heartbeat", matchId: ma.id });
    await b.client.request({ type: "leave", matchId: mb.id });
    d.store.failSet = true; d.gate.block = true;   // Ver.6.3: the process dies between the profile save and the stats commit, and the storage refused the queue write
    await d.client.request({ type: "heartbeat", matchId: mb.id });
    d.store.failSet = false; d.gate.block = false;   // (the memory part of the dead client's queue is gone with it)
    {
      const sid = require("../src/match-log-next.cjs").safeId("s-" + mb.id);
      const before = (await d.db.ref("games/factor/accounts/ad/stats").get()).val() || {};
      assert(!before.sg, "the interrupted client did not reach the stats (the queue write was lost)");
      const dp = (await d.db.ref("games/factor/onlineSparkV1/profiles/ad").get()).val();
      assert(dp.processed[mb.id], "the profile side already saved the result (processed)");
      d.client.close();
      d.client = Spark.create({ db: d.db, uid: d.uid, account: { key: d.key, name: accounts[d.key].name }, queueStorage: (d.store = memStore()) });
      await d.client.request({ type: "status" });   // sees the settled, unacknowledged match again: the stats hand-over is rebuilt from the verified receipt
      let st;
      for (let i = 0; i < 60; i++) { st = (await d.db.ref("games/factor/accounts/ad/stats").get()).val(); if (st?.sg === 1 && st.ml?.e?.[sid] && !/^[^|]*\|so/.test(st.ml.e[sid])) break; await new Promise((r) => setTimeout(r, 250)); }
      assert.equal(st.sg, 1, "counted exactly once after the interruption: " + JSON.stringify({ sg: st.sg, ml: st.ml }));
      await d.client.request({ type: "status" }); await new Promise((r) => setTimeout(r, 500));
      assert.equal(((await d.db.ref("games/factor/accounts/ad/stats").get()).val()).sg, 1, "a repeated sight does not count again");
      console.log("PASS Spark: a stop between the profile save and the stats queue write is rebuilt from the receipt, counted once");
    }
    await Promise.all(
      [a, c].map((u) =>
        u.client.request({ type: "heartbeat", matchId: ma.id }),
      ),
    );
    const ap = (
        await a.db.ref("games/factor/onlineSparkV1/profiles/aa").get()
      ).val(),
      bp = (
        await b.db.ref("games/factor/onlineSparkV1/profiles/ab").get()
      ).val();
    assert.equal(ap.easy.games, 1);
    assert.equal(ap.normal.games, 0);
    assert.equal(ap.normal.rating, 1500);
    assert.equal(bp.normal.games, 1);
    assert.equal(bp.easy.games, 0);
    assert.equal(bp.easy.rating, 1620);
    assert.equal(Object.keys(ap.processed).length, 1);
    assert.equal(
      (await a.db.ref("games/factor/accounts").get()).val().aa.stats.rating,
      1800,
    );
    const backup = (
      await a.db.ref("games/factor/onlineSparkV1/backups/aa").get()
    ).val();
    assert.deepEqual(backup.stats, accounts.aa.stats);
    a.client.close();
    a.client = Spark.create({
      db: a.db,
      uid: a.uid,
      account: { key: a.key, name: "A" },
      queueStorage: a.store,
    });
    const resumed = await a.client.request({ type: "status" });
    assert.equal(resumed.match.id, ma.id);
    assert.equal(resumed.ratings.easy.games, 1);
    await a.client.request({ type: "ackReceipt", matchId: ma.id });
    assert.equal((await a.client.request({ type: "status" })).match, null);
    {   // Ver.6.3: the START of the counted match was saved in the match log (server-confirmed, before the first answer) and the result filled the same entry
      const ML = require("../src/match-log-next.cjs"), id = ML.safeId("s-" + ma.id);
      let st;
      for (let i = 0; i < 24; i++) { st = (await a.db.ref("games/factor/accounts/aa/stats").get()).val(); if (st?.ml?.e?.[id] && !/^[^|]*\|so/.test(st.ml.e[id])) break; await new Promise((r) => setTimeout(r, 250)); }
      assert(st?.ml?.e?.[id] && /^[0-9a-z]+\|s[wld][uL]?\|/.test(st.ml.e[id]), "the Spark start is an open entry that its result filled (proven when the start was saved before the countdown ended): " + JSON.stringify({ ml: st?.ml, sk: st?.sk, sg: st?.sg }));
      assert.equal(Object.keys(st.ml.e).filter((k) => k === id).length, 1);
    }
    const again = await a.client.request({
      type: "enqueue",
      difficulty: "normal",
    });
    assert(again.ticket);
    await a.client.request({ type: "cancel", ticket: again.ticket });
    assert.equal((await a.client.request({ type: "status" })).ticket, null);
    await assertFails(
      a.db
        .ref("games/factor/onlineSparkV1/profiles/aa/title")
        .set("dual_master"),
    );
    await a.client.request({ type: "equipTitle", title: "easy_adept" });
    console.log(
      "PASS four real clients: isolated E/N matching, A/B only, actual answer once, own-only ratings, retries/relogin/ack/cancel, legacy records and backup retained",
    );
    for (const [u, mid] of [
      [b, mb.id],
      [c, ma.id],
      [d, mb.id],
    ])
      await u.client.request({ type: "ackReceipt", matchId: mid });
    const { chromium, context, sleep } = require("./browser-harness.cjs");
    async function noTapAnswers(p) {
      const ids = await require("./browser-harness.cjs").pair(p);
      for (const id of ids) {
        const b = await p.locator(`[data-btile="${id}"]`).boundingBox();
        await p.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
        await p.waitForFunction(
          () =>
            [...document.querySelectorAll("[data-btile]")].every(
              (e) => e.style.transform === "none",
            ) && !document.querySelector(".or-battle svg line"),
        );
      }
    }
    async function touchSwipe(p) {
      const ids = await require("./browser-harness.cjs").pair(p);
      const x = await p.locator(`[data-btile="${ids[0]}"]`).boundingBox(),
        y = await p.locator(`[data-btile="${ids[1]}"]`).boundingBox();
      const t = await p.context().newCDPSession(p);
      await t.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x: x.x + x.width / 2, y: x.y + x.height / 2 }],
      });
      await sleep(60);
      await t.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: y.x + y.width / 2, y: y.y + y.height / 2 }],
      });
      await sleep(30);
      await t.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      await t.detach();
    }
    const browser = await chromium.launch({
      executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    });
    try {
      const peers = [],
        screens = [];
      for (const u of [a, b]) {
        const t = await context(browser, {
          uid: u.uid,
          account: { key: u.key, name: accounts[u.key].name },
          tree: {
            games: {
              factor: {
                accounts,
                onlineSparkV1: {
                  config: { enabled: true, protocol: "spark-v1" },
                },
              },
            },
          },
          peers,
        });
        screens.push(t);
        await t.ctx.exposeBinding("__sparkRequest", async (_, cmd) => {
          try {
            u.last = await u.client.request(cmd);
            return u.last;
          } catch (e) {
            return { error: e.message };
          }
        });
        await t.page.evaluate(() => {
          window.OnlineSpark.create = () => ({
            request: async (cmd) => {
              const v = await window.__sparkRequest(cmd);
              if (v.error) throw Error(v.error);
              return v;
            },
            close() {},
          });
        });
        await t.page
          .getByRole("button", { name: "オンライン対戦（ロビー）", exact: true })
          .click();
        await t.page
          .getByRole("button", {
            name: "すぐ遊ぶ（ランダム対戦）",
            exact: true,
          })
          .click();
        await t.page
          .getByRole("button", { name: "イージーで相手を探す", exact: true })
          .waitFor();
      }
      const [aa, bb] = screens;
      // Rating details intentionally live on the separate ratings screen.
      await aa.page
        .getByRole("button", { name: "イージーで相手を探す", exact: true })
        .click();
      await bb.page
        .getByRole("button", { name: "ノーマルで相手を探す", exact: true })
        .click();
      for (const t of screens)
        await t.page
          .getByRole("button", { name: "検索をキャンセル", exact: true })
          .waitFor();
      assert.equal(a.last.match, null);
      assert.equal(b.last.match, null);
      await bb.page
        .getByRole("button", { name: "検索をキャンセル", exact: true })
        .click();
      await bb.page
        .getByRole("button", { name: "イージーで相手を探す", exact: true })
        .click();
      for (const t of screens) {
        await t.page
          .getByRole("button", { name: "A：早い者勝ち", exact: true })
          .waitFor();
        assert.equal(
          await t.page
            .getByRole("button", { name: "ノーマルを選ぶ", exact: true })
            .count(),
          0,
        );
        await t.page
          .getByRole("button", { name: "A：早い者勝ち", exact: true })
          .click();
      }
      for (const t of screens) await t.page.locator(".or-battle").waitFor();
      await sleep(4300);
      await noTapAnswers(aa.page);
      assert.equal(
        (
          await a.db
            .ref(`games/factor/onlineSparkV1/matches/${a.last.match.id}/game`)
            .get()
        ).val().claims?.length || 0,
        0,
        "human A separate taps are not answers",
      );
      await touchSwipe(aa.page);
      await aa.page.waitForFunction(
        () =>
          Number(
            document.querySelector(".or-stat-grid .v7-st b")?.textContent,
          ) > 0,
      );
      const resultGame = (
        await a.db
          .ref(`games/factor/onlineSparkV1/matches/${a.last.match.id}/game`)
          .get()
      ).val();
      assert.equal(resultGame.claims.length, 1);
      for (const t of screens) {
        assert.deepEqual(t.errors, []);
        assert(!t.requests.some((url) => url.includes("cloudfunctions.net")));
        await t.ctx.close();
      }
      console.log(
        "PASS iPhone-size UI → two real SDK clients → E/N isolation, cancel/research, A/B vote, real card drag; no Functions request",
      );
      const uiMatch = a.last.match.id;
      await a.client.request({ type: "leave", matchId: uiMatch });
      await b.client.request({ type: "heartbeat", matchId: uiMatch });
      for (const u of [a, b])
        await u.client.request({ type: "ackReceipt", matchId: uiMatch });
      for (let round = 0; round < 2; round++) {
        await a.client.request({ type: "enqueue", difficulty: "easy" });
        const paired = await b.client.request({
            type: "enqueue",
            difficulty: "easy",
          }),
          mid = paired.match.id;
        await a.client.request({ type: "heartbeat" });
        await Promise.all(
          [a, b].map((u) =>
            u.client.request({
              type: "vote",
              matchId: mid,
              mode: round === 0 ? "B" : "A",
            }),
          ),
        );
        if (round === 0) {
          // Exercise the B presenter with real Auth/RTDB, rather than only calling answer directly.
          const humanScreens = [];
          for (const u of [a, b]) {
            const t = await context(browser, {
              uid: u.uid,
              account: { key: u.key, name: accounts[u.key].name },
              tree: {
                games: {
                  factor: {
                    accounts,
                    onlineSparkV1: {
                      config: { enabled: true, protocol: "spark-v1" },
                    },
                  },
                },
              },
            });
            await t.ctx.exposeBinding("__sparkRequest", async (_, cmd) => {
              if (cmd.type === "heartbeat")
                await new Promise((r) => setTimeout(r, 650));
              u.last = await u.client.request(cmd);
              return u.last;
            });
            await t.page.evaluate(() => {
              window.OnlineSpark.create = () => ({
                request: (cmd) => window.__sparkRequest(cmd),
                close() {},
              });
            });
            await t.page
              .getByRole("button", {
                name: "オンライン対戦（ロビー）",
                exact: true,
              })
              .click();
            await t.page
              .getByRole("button", {
                name: "すぐ遊ぶ（ランダム対戦）",
                exact: true,
              })
              .click();
            await t.page.locator('[data-online-mode="B"]').waitFor();
            humanScreens.push(t);
          }
          const p = humanScreens[0].page;
          await p.waitForFunction(
            () =>
              document.querySelector(".or-battle")?.dataset.onlineReady ===
              "true",
          );
          await noTapAnswers(p);
          assert.equal(
            (
              await a.db
                .ref(`games/factor/onlineSparkV1/matches/${mid}/game`)
                .get()
            ).val().states[a.uid].c,
            0,
            "human B separate taps are not answers",
          );
          const ids = await require("./browser-harness.cjs").pair(p),
            x = await p.locator(`[data-btile="${ids[0]}"]`).boundingBox(),
            y = await p.locator(`[data-btile="${ids[1]}"]`).boundingBox();
          const touch = await p.context().newCDPSession(p);
          await touch.send("Input.dispatchTouchEvent", {
            type: "touchStart",
            touchPoints: [{ x: x.x + x.width / 2, y: x.y + x.height / 2 }],
          });
          await new Promise((r) => setTimeout(r, 1200));
          await touch.send("Input.dispatchTouchEvent", {
            type: "touchMove",
            touchPoints: [{ x: y.x + y.width / 2, y: y.y + y.height / 2 }],
          });
          await touch.send("Input.dispatchTouchEvent", {
            type: "touchEnd",
            touchPoints: [],
          });
          await touch.detach();
          // Timed B2 has no fixed 15-question denominator. Wait for its
          // rendered solved count, then verify the actual SDK-confirmed answer.
          await p.waitForFunction(() =>
            document.querySelectorAll(".or-stat-grid .v7-st b")[1]?.textContent === "1問",
          );
          const real = (
            await a.db
              .ref(`games/factor/onlineSparkV1/matches/${mid}/game`)
              .get()
          ).val();
          assert.equal(real.rules, "b2");
          assert.equal(real.states[a.uid].c, 1);
          assert(real.states[a.uid].score > 0);
          assert.equal(real.seq[a.uid], 1);
          for (const t of humanScreens) {
            assert.deepEqual(t.errors, []);
            await t.ctx.close();
          }
          console.log(
            "PASS human B: touch drag across delayed heartbeat solves actual synchronized Firebase problem",
          );
        }
        await new Promise((r) => setTimeout(r, 3900));
        await a.client.request({ type: "leave", matchId: mid });
        await b.client.request({ type: "heartbeat", matchId: mid });
        for (const u of [a, b])
          await u.client.request({ type: "ackReceipt", matchId: mid });
      }
      const ranking = await a.client.request({ type: "ratings" });
      assert(
        ranking.rankings.easy.some((r) => r.key === "aa") &&
          ranking.rankings.easy.some((r) => r.key === "ab"),
      );
      assert.equal(ranking.rankings.normal.length, 0);
      assert.equal(ranking.ranks.normal, null);
      const beforeCountdown = await a.client.request({ type: "ratings" });
      await a.client.request({ type: "enqueue", difficulty: "normal" });
      const countdownPair = await b.client.request({
        type: "enqueue",
        difficulty: "normal",
      });
      const countdownId = countdownPair.match.id;
      await a.client.request({ type: "vote", matchId: countdownId, mode: "B" });
      await b.client.request({ type: "vote", matchId: countdownId, mode: "B" });
      const countdownLeft = await a.client.request({
        type: "leave",
        matchId: countdownId,
      });
      assert.equal(
        (
          await a.db
            .ref(`games/factor/onlineSparkV1/matches/${countdownId}/phase`)
            .get()
        ).val(),
        "cancelled",
      );
      assert.deepEqual(
        countdownLeft.ratings.normal,
        beforeCountdown.ratings.normal,
      );
      await b.client.request({ type: "heartbeat", matchId: countdownId });
      console.log(
        "PASS human countdown exit cancels without loss or rating change",
      );
      console.log(
        "PASS actual three-match ranking eligibility: EASY ranked, NORMAL remains independent/unlisted",
      );
    } finally {
      await browser.close();
    }
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
