// Ver.6.44 tournament hosting by any registered, login-linked account + a host who also plays. Firebase emulator with the
// regenerated candidate rules (firebase/v525.candidate.rules.json, from firebase/event-host-rules.cjs).
//  1. Room creation (rooms/$code/meta): a linked registered account may open a TOUR room (no teacher / grant needed);
//     it may NOT open a RAID room (or a room that is both); an unlinked or unregistered account may not open a tour room;
//     teachers and event hosts (delegation) still work as before; ordinary rooms are unchanged.
//  2. The new host's operations are not blocked by the delegatedAccount "authorized" clause: state / players / result /
//     claims / live / ko writes and the B2 coordinator (rooms/$code/b2) all succeed for a host without delegatedAccount.
//  3. The host also plays its own B2 match: the coordinator keeps running while the host's participant client answers,
//     the result is confirmed and the host's tournament record (tourWins) is saved exactly like a participant's.
const fs = require("node:fs"), assert = require("node:assert/strict"), firebase = require("firebase/compat/app");
require("firebase/compat/auth"); require("firebase/compat/database");
const { initializeTestEnvironment, assertFails, assertSucceeds } = require("@firebase/rules-unit-testing"), { set, ref, get } = require("firebase/database");
const T = require("../src/tournament-b2.cjs"), R = require("../src/room-b2-client.cjs"), E = require("../server/online-rated/engine.cjs");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms)), wait = async (fn) => { for (let i = 0; i < 150; i++) { const r = await fn(); if (r) return r; await sleep(100); } throw Error("condition did not settle"); };
(async () => {
  assert.equal(process.env.GCLOUD_PROJECT, "demo-factorfactor-tower");
  const env = await initializeTestEnvironment({ projectId: process.env.GCLOUD_PROJECT, database: { host: "127.0.0.1", port: 9000, rules: fs.readFileSync("firebase/v525.candidate.rules.json", "utf8") } });
  const apps = [], controllers = [], errors = [];
  try {
    for (const key of ["gen", "teacher", "helper", "unlinked", "ghost", "p1"]) {
      const app = firebase.initializeApp({ projectId: process.env.GCLOUD_PROJECT, apiKey: "fixture", databaseURL: "https://demo-factorfactor-tower.firebaseio.com" }, "oh-" + key);
      app.auth().useEmulator("http://127.0.0.1:9099", { disableWarnings: true }); app.database().useEmulator("127.0.0.1", 9000);
      const { user } = await app.auth().signInAnonymously(); apps.push({ key, app, db: app.database(), uid: user.uid });
    }
    const [gen, teacher, helper, unlinked, ghost, p1] = apps;
    const initial = { exp: 100, rating: 1500, games: 3 };
    await env.withSecurityRulesDisabled((ctx) => set(ref(ctx.database(), "games/factor"), {
      teachers: { teacher: true },
      eventHosts: { helper: { enabled: true, tournament: true, raid: true, teacher: "teacher", updatedAt: 1 } },
      // "ghost" is linked to a login but has no registered account; "unlinked" has an account but no link to this login
      logins: { gen: { [gen.uid]: "x" }, teacher: { [teacher.uid]: "x" }, helper: { [helper.uid]: "x" }, ghost: { [ghost.uid]: "x" }, p1: { [p1.uid]: "x" } },
      accounts: { gen: { name: "Gen", stats: initial }, teacher: { name: "Teacher", stats: {} }, helper: { name: "Helper", stats: {} }, unlinked: { name: "Unlinked", stats: {} }, p1: { name: "P1", stats: initial } },
    }));
    const meta = (who, extra) => ({ host: who.uid, createdAt: firebase.database.ServerValue.TIMESTAMP, tour: false, raid: false, acct: who.key, ...extra });
    const room = (who, code) => who.db.ref(`games/factor/rooms/${code}/meta`);
    // ---- 1. creation ----
    await assertSucceeds(room(gen, "6101").set(meta(gen, { tour: true })));
    await assertFails(room(gen, "6102").set(meta(gen, { raid: true })));
    await assertFails(room(gen, "6103").set(meta(gen, { tour: true, raid: true })));
    await assertFails(room(gen, "6104").set(meta(gen, { raid: true, delegatedAccount: "gen" })));
    await assertFails(room(unlinked, "6105").set(meta(unlinked, { tour: true })));
    await assertFails(room(ghost, "6106").set(meta(ghost, { tour: true })));
    await assertFails(room(gen, "6107").set(meta(gen, { tour: true, acct: "p1" })), "cannot open a tour room in another (unlinked) account's name");
    await assertSucceeds(room(teacher, "6108").set(meta(teacher, { tour: true })));
    await assertSucceeds(room(teacher, "6109").set(meta(teacher, { raid: true })));
    await assertSucceeds(room(helper, "6110").set(meta(helper, { raid: true, delegatedAccount: "helper" })));
    await assertSucceeds(room(helper, "6111").set(meta(helper, { tour: true, delegatedAccount: "helper" })));
    await assertSucceeds(room(helper, "6112").set(meta(helper, { tour: true })), "an event host can also open a tour room without delegation now");
    await assertFails(room(gen, "6115").set(meta(gen, { tour: true, delegatedAccount: "gen" })), "the open branch never carries a delegation (no grant → refused)");
    await assertSucceeds(room(unlinked, "6113").set(meta(unlinked, {})), "ordinary room: unchanged");
    await assertSucceeds(room(ghost, "6114").set({ host: ghost.uid, createdAt: firebase.database.ServerValue.TIMESTAMP, tour: false, raid: false, acct: "" }), "ordinary guest room: unchanged");
    console.log("PASS rules: linked registered account opens a tour room; raid / tour+raid / unlinked / unregistered / other account's name refused; teacher and event host unchanged; ordinary rooms unchanged");
    // ---- 2. the new host's operations (no delegatedAccount on meta) ----
    const code = "6101", R0 = (p) => gen.db.ref(`games/factor/rooms/${code}/${p}`);
    await assertSucceeds(R0("state").set({ phase: "lobby", tour: true, mode: "B", diff: "easy", hostPlays: true }));
    await assertSucceeds(R0(`players/${gen.uid}`).set({ name: "Gen", acct: "gen", nick: "", joinedAt: firebase.database.ServerValue.TIMESTAMP }));
    await assertSucceeds(p1.db.ref(`games/factor/rooms/${code}/players/${p1.uid}`).set({ name: "P1", acct: "p1", nick: "", joinedAt: firebase.database.ServerValue.TIMESTAMP }));
    for (const p of ["claims", "live", "result", "ko"]) await assertSucceeds(R0(`${p}/probe`).set({ at: 1 })), await assertSucceeds(R0(`${p}/probe`).remove());
    // ---- 3. B2 tournament where the host plays the final ----
    const final = { a: gen.uid, b: p1.uid, gid: "final", seed: "openseed", startAt: Date.now() + 300 };
    const state = { phase: "tour", tour: true, tournamentVersion: 2, tournamentId: "open-cup", mode: "B", diff: "easy", duration: 60, hostPlays: true, round: 0, rounds: [[final]], names: { [gen.uid]: "Gen", [p1.uid]: "P1" }, accts: { [gen.uid]: "gen", [p1.uid]: "p1" }, nicks: {} };
    await assertSucceeds(R0("state").set(state));
    const opts = { db: gen.db, code, state, uid: gen.uid, onError: (e) => errors.push(e) }, co = T.coordinate(opts); controllers.push(co); await co.ready;
    const views = {};
    for (const u of [gen, p1]) { const c = R.create({ db: u.db, code, state: T.matchState(state, final), uid: u.uid, isHost: false, onView: (r) => { views[u.key] = r; }, onError: (e) => errors.push(e) }); controllers.push(c); u.client = c; }
    await wait(() => views.gen && views.p1 && Date.now() > views.gen.game.startAt + 50);
    const pair = (g, uid) => { const api = E.runtime(g).api, view = E.view(g, uid); for (const x of view.tiles) for (const y of view.tiles) if (x.id !== y.id && api.polyEqual(api.multiply(x.factor, y.factor), view.poly)) return { type: "answer", seq: 1, question: view.question, tiles: [x.id, y.id] }; throw Error("no pair"); };
    await gen.client.request(pair(views.gen.game, gen.uid)); // the host answers as a participant while its coordinator runs
    await wait(() => views.gen?.game.states[gen.uid].c === 1);
    assert.equal((await gen.db.ref(`games/factor/rooms/${code}/b2/final/game/states/${gen.uid}/c`).get()).val(), 1, "the coordinator processed the host's own answer");
    await T.adjudicate({ db: gen.db, code, gid: "final", winner: gen.uid });
    await wait(async () => (await gen.db.ref(`games/factor/rooms/${code}/result/final`).get()).val());
    await wait(() => views.gen.game.result && views.p1.game.result);
    assert.deepEqual(views.gen.game.result, views.p1.game.result, "the host and the other player see the same result");
    await T.advance({ ...opts, patch: { champion: gen.uid } });
    assert.equal((await gen.db.ref(`games/factor/rooms/${code}/state/champion`).get()).val(), gen.uid);
    // the champion record is the participant's record (same TournamentB2.record the board uses for any champion)
    const game = (await gen.db.ref(`games/factor/rooms/${code}/b2/final/game`).get()).val(), stats = gen.db.ref("games/factor/accounts/gen/stats");
    for (let i = 0; i < 2; i++) await stats.transaction((s) => T.record(s, { tournamentId: "open-cup", game, uid: gen.uid, champion: true, at: firebase.database.ServerValue.TIMESTAMP }));
    const saved = (await stats.get()).val();
    assert.equal(saved.tourWins, 1, "tourWins once"); assert.equal(saved.rating, initial.rating); assert.equal(saved.games, initial.games);
    assert.deepEqual(errors, []);
    console.log("PASS new host operations (no delegatedAccount): state/players/claims/live/result/ko writes and the B2 coordinator work; the host plays its own final (coordinator keeps running), same result for both, champion record once");
  } finally {
    controllers.forEach((c) => c.close()); await Promise.all(apps.map((x) => x.app.delete().catch(() => {}))); await env.cleanup();
  }
})().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => setTimeout(() => process.exit(process.exitCode || 0), 100));
