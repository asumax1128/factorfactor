// Ver.6.43 tournament spectator result against the Firebase emulator with the candidate production rules.
// The spectator result only READS paths the watch views already read (rooms/{code}/result|claims|live|ko/{gid} and
// rooms/{code}/b2/{gid}). This checks that the teacher (host) and a non-player viewer can read every one of them under
// the unchanged rules, that the data read back is enough to rebuild what the screen shows (A: every question and its
// solver; B2: both players' history and the exact served questions), and that a spectator cannot write a result.
const fs = require("node:fs"), assert = require("node:assert/strict"), firebase = require("firebase/compat/app");
require("firebase/compat/auth"); require("firebase/compat/database");
const { initializeTestEnvironment } = require("@firebase/rules-unit-testing"), { set, ref } = require("firebase/database");
const E = require("../server/online-rated/engine.cjs");
(async () => {
  assert.equal(process.env.GCLOUD_PROJECT, "demo-factorfactor-tower");
  const rules = fs.readFileSync("firebase/v525.candidate.rules.json", "utf8");
  const env = await initializeTestEnvironment({ projectId: process.env.GCLOUD_PROJECT, database: { host: "127.0.0.1", port: 9000, rules } });
  const apps = [];
  try {
    for (const key of ["teacher", "p1", "p2", "viewer"]) {
      const app = firebase.initializeApp({ projectId: process.env.GCLOUD_PROJECT, apiKey: "fixture", databaseURL: "https://demo-factorfactor-tower.firebaseio.com" }, "tw-" + key);
      app.auth().useEmulator("http://127.0.0.1:9099", { disableWarnings: true }); app.database().useEmulator("127.0.0.1", 9000);
      const { user } = await app.auth().signInAnonymously(); apps.push({ key, app, db: app.database(), uid: user.uid });
    }
    const [h, a, b, v] = apps, names = { [a.uid]: "One", [b.uid]: "Two" }, start = Date.now() - 60000;
    // A (legacy tournament) — finished, with all claims
    const claims = {}; let at = start; for (let q = 0; q < 15; q++) { at += 2000; claims[q] = { uid: q === 3 ? b.uid : q === 4 ? "_none" : a.uid, at, j: "Great" }; }
    // old B (legacy tournament) — finished by KO
    const live = { [a.uid]: { hp: 41.5, c: 8, score: 120, combo: 2 }, [b.uid]: { hp: 0, c: 3, score: 40, combo: 0 } };
    // B2 tournament — a real finished engine game
    let game = E.begin("b2fin", "easy", "B", [a.uid, b.uid], "tw-seed", start, { rules: "b2", duration: 60 });
    const answer = (g, u, ok, ms) => { const w = E.view(g, u), api = E.runtime(g).api; let pair; for (let i = 0; i < w.tiles.length; i++) for (let j = i + 1; j < w.tiles.length; j++) if (api.polyEqual(api.multiply(w.tiles[i].factor, w.tiles[j].factor), w.poly) === ok) pair = [w.tiles[i].id, w.tiles[j].id]; return E.step(g, u, { type: "answer", question: w.question, tiles: pair }, Math.max(g.time, w.startAt, w.readyAt) + ms); };
    game.states[a.uid].oj = 2;
    game = answer(game, a.uid, true, 1200); game = E.step(game, a.uid, { type: "heartbeat" }, game.states[a.uid].nextAt); game = answer(game, a.uid, true, 1800);
    game = answer(game, b.uid, false, 2500);
    game = E.step(game, a.uid, { type: "heartbeat" }, start + 60000);
    assert(game.result, "B2 game finished");
    const meta = (code) => ({ host: h.uid, acct: "teacher", tour: true, createdAt: Date.now() }), players = { [a.uid]: { name: "One" }, [b.uid]: { name: "Two" } };
    const roomsTree = {
      5201: { meta: meta(), players, state: { phase: "tour", tour: true, mode: "A", diff: "easy", round: 0, rounds: [[{ a: a.uid, b: b.uid, gid: "ga", seed: "sa", startAt: start }]], names },
        claims: { ga: claims }, result: { ga: { winner: a.uid, reason: "points", rank: { [a.uid]: 1, [b.uid]: 2 }, at } } },
      5202: { meta: meta(), players, state: { phase: "tour", tour: true, mode: "B", diff: "easy", round: 0, rounds: [[{ a: a.uid, b: b.uid, gid: "gb", seed: "sb", startAt: start }]], names },
        live: { gb: live }, ko: { gb: { [b.uid]: { at } } }, result: { gb: { winner: a.uid, reason: "ko", rank: { [a.uid]: 1, [b.uid]: 2 }, at } } },
      5203: { meta: meta(), players, state: { phase: "tour", tour: true, tournamentVersion: 2, tournamentId: "tw", mode: "B", diff: "easy", round: 0, rounds: [[{ a: a.uid, b: b.uid, gid: "b2fin", seed: "tw-seed", startAt: start }]], names, accts: {} },
        b2: { b2fin: { game: JSON.parse(JSON.stringify(game)) } } },
    };
    await env.withSecurityRulesDisabled((ctx) => set(ref(ctx.database(), "games/factor"), { teachers: { teacher: true }, rooms: roomsTree }));
    const read = async (who, path) => (await who.db.ref("games/factor/" + path).once("value")).val();
    for (const who of [h, v]) {
      // A: result + claims (TourSplit) → every question and its solver
      const resA = await read(who, "rooms/5201/result/ga"), cl = await read(who, "rooms/5201/claims/ga");
      assert.equal(resA.winner, a.uid); assert.equal(Object.keys(cl).length, 15, who.key + " reads every claim");
      const api = E.runtime(game).api, bankA = api.makeBank("sa", api.DIFFICULTY_CONFIG.easy.tileCount);
      for (let q = 0; q < 15; q++) assert(api.problemForA(bankA, q).poly, "question " + (q + 1) + " rebuilt from the seed");
      // old B: result + live + ko → summary
      const resB = await read(who, "rooms/5202/result/gb"), lv = await read(who, "rooms/5202/live/gb"), ko = await read(who, "rooms/5202/ko/gb");
      assert.equal(resB.reason, "ko"); assert.equal(lv[a.uid].c, 8); assert.equal(lv[b.uid].c, 3); assert(ko[b.uid]);
      // B2: b2/{gid} (TournamentB2Watch) → both histories and the served questions
      const g = (await read(who, "rooms/5203/b2/b2fin")).game;
      assert(g.result, who.key + " sees the confirmed B2 result");
      const bank = api.makeBank(g.seed, api.DIFFICULTY_CONFIG[g.difficulty].tileCount), served = E.runtime(game).bank;
      for (const u of g.ids) {
        const hist = Array.isArray(g.states[u].hist) ? g.states[u].hist : Object.values(g.states[u].hist || {});
        assert.equal(hist.length, game.states[u].hist.length, u + ": every answered question is in the stored history");
        for (const x of hist) assert.equal(JSON.stringify(bank.get(x.lv, x.k).poly), JSON.stringify(served.get(x.lv, x.k).poly), "same question as the engine served");
      }
      assert(Object.values(g.states[a.uid].hist).some((x) => x.ok && x.bonus > 0), "the ojama bonus is in the stored history");
    }
    // a spectator never needs to write: and cannot change a result
    let refused = false; try { await v.db.ref("games/factor/rooms/5201/result/ga").set({ winner: v.uid }); } catch (e) { refused = true; }
    assert(refused, "a viewer cannot write a result (unchanged rules)");
    console.log("PASS tournament spectator result (emulator, unchanged candidate rules): teacher and a non-player viewer read A result+claims, old B result+live+ko, B2 game; the data rebuilds every A question, both B2 histories with the exact served questions and the ojama bonus; a viewer cannot write a result");
  } finally {
    await Promise.all(apps.map((x) => x.app.delete().catch(() => {}))); await env.cleanup();
  }
})().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => setTimeout(() => process.exit(process.exitCode || 0), 100)); // the SDK keeps sockets open (same as tournament-b2-emulator)
