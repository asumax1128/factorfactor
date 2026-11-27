// Ver.6.44 class tournament: any logged-in account can open one, and the host may choose to play.
// Mock RTDB (rules are checked separately in tests/tour-open-host-emulator.cjs). The opponent is a scripted player.
//  1. A general (non-teacher) account opens a tournament from the lobby: no delegation, no eventHostRooms write.
//  2. "自分も参加する": the host is in the entry list and the count, and plays its own match as a participant:
//     A (BattleGame) and tournament B2 (RoomB2App) opened from the real UI, old B (unversioned, BattleGame) from a
//     seeded running tournament. After the match the host returns to the bracket, decides the champion and the
//     champion record (tourWins) is saved once, like a participant's.
//  3. "運営だけ" (default): the host is not in the entry list, never enters a match, the bracket works as before.
const assert = require("node:assert/strict");
const { chromium, context, drag, sleep } = require("./browser-harness.cjs");
const exe = process.env.CHROMIUM_PATH || "/usr/bin/chromium";
const HOST = "host-uid";
const base = () => ({ games: { factor: { accounts: { gen: { name: "Gen", stats: { exp: 100, rating: 1500 } }, a2: { name: "Two", stats: { exp: 100 } } } } } });
async function openAsGeneral(b, tree) {
  const t = await context(b, { tree, account: { key: "gen", name: "Gen" }, uid: HOST }), p = t.page;
  await p.locator(".action-card.online").click();
  await p.getByRole("button", { name: /クラス大会を開く/ }).click();
  await p.getByText("クラス大会（トーナメント）", { exact: false }).first().waitFor();
  const code = Object.keys(tree.games.factor.rooms)[0];
  return { t, p, code };
}
const set = (p, path, v) => p.evaluate(({ path, v }) => window.__fbApply({ kind: "set", path, v }), { path, v });
const started = async (tree, code) => { for (let i = 0; i < 100 && tree.games.factor.rooms[code].state?.phase !== "tour"; i++) await sleep(50); return tree.games.factor.rooms[code].state; };
const addTwo = (p, code) => set(p, `games/factor/rooms/${code}/players/p2`, { name: "Two", acct: "a2", nick: "", joinedAt: Date.now() });
async function finishAsChampion(t, p, tree, code) {
  await p.getByRole("button", { name: /大会の表にもどる/ }).click();
  await p.getByRole("button", { name: "優勝者を決定！", exact: true }).click();
  await p.getByText(/優勝 .*Gen|🏆 Gen/).first().waitFor({ timeout: 15000 });
  for (let i = 0; i < 60 && !(tree.games.factor.accounts.gen.stats.tourWins >= 1); i++) await sleep(100);
  assert.equal(tree.games.factor.accounts.gen.stats.tourWins, 1, "the host's champion record is saved once");
  assert.equal(tree.games.factor.rooms[code].state.champion, HOST);
}
(async () => {
  const b = await chromium.launch({ executablePath: exe });
  try {
    // ---------- 3. default "運営だけ": unchanged behaviour ----------
    {
      const tree = base(), { t, p, code } = await openAsGeneral(b, tree);
      const meta = tree.games.factor.rooms[code].meta;
      assert.equal(meta.tour, true); assert.equal(meta.acct, "gen"); assert.equal(meta.delegatedAccount, undefined, "no delegation for a tournament");
      assert.equal(tree.games.factor.eventHostRooms, undefined, "no event-host room registration for a tournament");
      assert.equal(await p.locator("[data-host-plays]").getAttribute("data-host-plays"), "off", "default is 運営だけ");
      // (as before Ver.6.44 the host's presence record may exist; what matters is that the lobby list / count / start ignore it)
      await p.getByText("エントリー（0人）", { exact: true }).waitFor();
      // switching on adds the host to the entry, switching back to 運営だけ removes it again
      await p.getByRole("button", { name: "自分も参加する", exact: true }).click();
      for (let i = 0; i < 40 && !tree.games.factor.rooms[code].players?.[HOST]; i++) await sleep(50);
      assert(tree.games.factor.rooms[code].players[HOST], "on: the host is entered");
      await p.getByText("エントリー（1人）", { exact: true }).waitFor();
      await p.getByRole("button", { name: "運営だけ", exact: true }).click();
      for (let i = 0; i < 40 && tree.games.factor.rooms[code].players?.[HOST]; i++) await sleep(50);
      assert.equal(tree.games.factor.rooms[code].players?.[HOST], undefined, "off again: the host leaves the entry");
      await addTwo(p, code); await set(p, `games/factor/rooms/${code}/players/p3`, { name: "Three", acct: "", nick: "", joinedAt: Date.now() });
      await p.getByRole("button", { name: "大会スタート！（2人）", exact: true }).click();
      await p.getByRole("button", { name: /大会を閉じる/ }).waitFor();
      const st = await started(tree, code);
      assert.deepEqual(Object.keys(st.names).sort(), ["p2", "p3"], "the host is not entered");
      assert.equal(await p.locator("[data-btile]").count(), 0, "the host never enters a match");
      assert.deepEqual(t.errors, []); await t.ctx.close();
      console.log("PASS general account opens a tournament (no delegation / no eventHostRooms); default 運営だけ: host not entered, never in a match");
    }
    // ---------- 2a. A: the host plays and wins the final ----------
    {
      const tree = base(), { t, p, code } = await openAsGeneral(b, tree);
      await p.getByRole("button", { name: "自分も参加する", exact: true }).click();
      for (let i = 0; i < 40 && !tree.games.factor.rooms[code].players?.[HOST]; i++) await sleep(50);
      assert.equal(tree.games.factor.rooms[code].players[HOST].acct, "gen", "the playing host is in the entry");
      await p.getByRole("button", { name: "A：早い者勝ち", exact: false }).first().click();
      await addTwo(p, code);
      await p.getByRole("button", { name: "大会スタート！（2人）", exact: true }).click();
      const st = await started(tree, code);
      assert.deepEqual(Object.keys(st.names).sort(), [HOST, "p2"].sort(), "the host is entered and counted");
      await p.locator("[data-btile]").first().waitFor({ timeout: 20000 });
      // the host plays its own match as a participant
      for (let i = 0; i < 150 && !(await p.getByRole("button", { name: /大会の表にもどる/ }).count()); i++) {
        if (await p.locator("[data-btile]").count() && await p.evaluate(() => !!document.querySelector("[data-poly]"))) { try { await drag(p); } catch (e) { await sleep(200); } } else await sleep(300);
      }
      const gid = st.rounds[0][0].gid, res = tree.games.factor.rooms[code].result[gid];
      assert.equal(res.winner, HOST, "the host won its own A match");
      await finishAsChampion(t, p, tree, code);
      assert.deepEqual(t.errors, []); await t.ctx.close();
      console.log("PASS A: playing host is entered, plays its own match (BattleGame), returns to the bracket, decides the champion, tourWins once");
    }
    // ---------- 2b. tournament B2: the host plays (coordinator keeps running), the opponent leaves ----------
    {
      const tree = base(), { t, p, code } = await openAsGeneral(b, tree);
      await p.getByRole("button", { name: "自分も参加する", exact: true }).click();
      await set(p, `games/factor/rooms/${code}/state/duration`, 60);
      await addTwo(p, code);
      await p.getByRole("button", { name: "大会スタート！（2人）", exact: true }).click();
      const st = await started(tree, code); assert.equal(st.tournamentVersion, 2);
      const gid = st.rounds[0][0].gid;
      await p.locator("[data-btile]").first().waitFor({ timeout: 25000 });
      await p.waitForFunction(() => document.querySelector("[data-online-ready]")?.dataset.onlineReady === "true", null, { timeout: 20000 });
      await drag(p);
      for (let i = 0; i < 60 && !(tree.games.factor.rooms[code].b2?.[gid]?.game?.states?.[HOST]?.c >= 1); i++) await sleep(100);
      assert(tree.games.factor.rooms[code].b2[gid].game.states[HOST].c >= 1, "the host's answer was processed by its own coordinator while playing");
      // the opponent leaves (a real B2 input) → the host wins
      await set(p, `games/factor/rooms/${code}/b2/${gid}/inputs/p2/leave`, { type: "leave", at: Date.now() });
      await p.getByRole("button", { name: /大会の表にもどる/ }).waitFor({ timeout: 25000 });
      assert.equal(tree.games.factor.rooms[code].b2[gid].game.result.winner, HOST);
      await finishAsChampion(t, p, tree, code);
      assert.deepEqual(t.errors, []); await t.ctx.close();
      console.log("PASS tournament B2: playing host plays its own match (RoomB2App), the coordinator keeps running, returns to the bracket, champion, tourWins once");
    }
    // ---------- 2c. old B (unversioned, running tournament): the host plays ----------
    {
      const code = "6303", m = { a: HOST, b: "p2", gid: "oldb-final", seed: "oldb", startAt: Date.now() + 1500 };
      const tree = base(); tree.games.factor.rooms = { [code]: { meta: { host: HOST, acct: "gen", tour: true, createdAt: Date.now() },
        players: { [HOST]: { name: "Gen", acct: "gen" }, p2: { name: "Two", acct: "a2" } },
        state: { phase: "tour", tour: true, mode: "B", diff: "easy", hostPlays: true, round: 0, rounds: [[m]], names: { [HOST]: "Gen", p2: "Two" }, accts: { [HOST]: "gen", p2: "a2" }, nicks: {} } } };
      const t = await context(b, { tree, account: { key: "gen", name: "Gen" }, uid: HOST }), p = t.page;
      await p.locator(".action-card.online").click();
      await p.getByPlaceholder("部屋コード4桁").fill(code);
      await p.getByRole("button", { name: "参加", exact: true }).click();
      await p.locator("[data-btile]").first().waitFor({ timeout: 25000 });
      await sleep(4000);
      await drag(p);
      // the opponent is knocked out → the host is the last survivor
      await set(p, `games/factor/rooms/${code}/ko/${m.gid}/p2`, { at: Date.now() });
      await p.getByRole("button", { name: /大会の表にもどる/ }).waitFor({ timeout: 25000 });
      assert.equal(tree.games.factor.rooms[code].result[m.gid].winner, HOST);
      await finishAsChampion(t, p, tree, code);
      assert.deepEqual(t.errors, []); await t.ctx.close();
      console.log("PASS old B: playing host plays its own match (BattleGame), returns to the bracket, champion, tourWins once");
    }
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
