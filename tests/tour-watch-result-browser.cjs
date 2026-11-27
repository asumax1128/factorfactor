// Ver.6.43 tournament spectator result. The teacher (host) watches a tournament match; when the match result is confirmed
// the watch view switches to a read-only result screen by itself, and "🏆 大会の表にもどる" returns to the bracket.
// A / old B (TourSplit → SplitView) and tournament B2 (TournamentB2Watch → NextResults.Spectator). Display only:
// nothing is written while the result screen is shown. The participant result, records and result writes are untouched.
const assert = require("node:assert/strict");
const { chromium, context } = require("./browser-harness.cjs");
const E = require("../server/online-rated/engine.cjs");
const exe = process.env.CHROMIUM_PATH || "/usr/bin/chromium";
const names = { p1: "One", p2: "Two", p3: "Three", p4: "Four" };
const room = (code, state) => ({ games: { factor: { teachers: { ateacher: true }, accounts: { ateacher: { name: "Teacher", stats: {} } },
  rooms: { [code]: { meta: { host: "teacher-uid", acct: "ateacher", tour: true, createdAt: Date.now() }, state, players: { p1: { name: "One" }, p2: { name: "Two" }, p3: { name: "Three" }, p4: { name: "Four" } } } } } } });
async function join(b, code, tree, width) {
  const t = await context(b, { tree, pc: width > 900 }), p = t.page;
  await p.setViewportSize({ width, height: width > 900 ? 900 : 844 });
  await p.locator(".action-card.online").click();
  await p.getByPlaceholder("部屋コード4桁").fill(code);
  await p.getByRole("button", { name: "参加", exact: true }).click();
  return { t, p };
}
const set = (p, path, v) => p.evaluate(({ path, v }) => window.__fbApply({ kind: "set", path, v }), { path, v });
const roomWrites = (t, code) => t.writes.filter((w) => w.path.includes(`/rooms/${code}/`)).length;
async function common(p, { round, winner, draw }) {
  const r = p.locator("[data-tour-watch-result]");
  await r.waitFor({ timeout: 15000 });
  assert.match(await r.locator("[data-tw-round]").innerText(), new RegExp(round));
  assert.equal(await r.locator("[data-tw-winner]").innerText(), draw ? "引き分け" : `👑 ${winner} の勝利`);
  assert.equal(await r.locator("[data-tw-player]").count(), 2, "both players with their final place");
  const text = await r.innerText();
  for (const bad of ["EXP", "経験値", "称号ゲット", "レート", "のせいせき", "もう一戦", "ロビー", "応援"]) assert(!text.includes(bad), "no personal item on the spectator result: " + bad);
  assert.equal(await p.getByRole("button", { name: "🏆 大会の表にもどる", exact: true }).count(), 1);
  assert(!(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)), "no horizontal scroll");
  return text;
}
(async () => {
  const b = await chromium.launch({ executablePath: exe });
  try {
    for (const width of [390, 1366]) {
      // ---------- A (legacy tournament): semifinal watched by the teacher, result switches by itself ----------
      {
        const code = "5101", m1 = { a: "p1", b: "p2", gid: "a-semi-1", seed: "tour-a-1", startAt: Date.now() - 60000 }, m2 = { a: "p3", b: "p4", gid: "a-semi-2", seed: "tour-a-2", startAt: Date.now() - 60000 };
        const state = { phase: "tour", tour: true, mode: "A", diff: "easy", round: 0, rounds: [[m1, m2]], names };
        const tree = room(code, state), { t, p } = await join(b, code, tree, width);
        await p.getByRole("button", { name: /One\s*VS\s*Two/ }).click();
        await p.locator("[data-tour-watch-result]").waitFor({ state: "detached", timeout: 3000 }).catch(() => {});
        assert.equal(await p.locator("[data-tour-watch-result]").count(), 0, "still the live view before the result");
        // 15 questions (EASY): One takes 1-6 and 9-15 (a 7-combo at the end), Two takes 7, question 8 nobody
        const claims = {}; let at = m1.startAt;
        for (let q = 0; q < 15; q++) { at += 2500; claims[q] = { uid: q === 6 ? "p2" : q === 7 ? "_none" : "p1", at, j: "Great" }; }
        await set(p, `games/factor/rooms/${code}/claims/${m1.gid}`, claims);
        const before = roomWrites(t, code);
        await set(p, `games/factor/rooms/${code}/result/${m1.gid}`, { winner: "p1", reason: "points", rank: { p1: 1, p2: 2 }, at: at + 10 });
        const text = await common(p, { round: "準決勝", winner: "One" });
        assert.match(text, /得点で勝負/);
        assert.equal(await p.locator('[data-tw-summary] [data-row="score"]').count(), 1, "scores of both players");
        assert.match(await p.locator('[data-tw-summary] [data-row="won"]').innerText(), /13問[\s\S]*1問/, "questions taken: One 13, Two 1");
        // the review: every question, solver name and combo, no own-view wording
        await p.locator("[data-tw-review] .rs-review-toggle").click();
        const rows = p.locator("[data-tw-review] .rs-review-row");
        assert.equal(await rows.count(), 15, "all 15 questions");
        assert.match(await rows.nth(0).innerText(), /Oneが正解/);
        assert.match(await rows.nth(5).innerText(), /Oneが正解（6コンボ）/, "combo shown (same count as the score rule)");
        assert.match(await rows.nth(6).innerText(), /Twoが正解/);
        assert.match(await rows.nth(7).innerText(), /だれも解けず/);
        assert.match(await rows.nth(14).innerText(), /Oneが正解（7コンボ） ・ 2倍/);
        const all = await p.locator("[data-tw-review]").innerText();
        for (const bad of ["正解！", "自分", "あなた", "お手つき"]) assert(!all.includes(bad), "spectator wording only: " + bad);
        assert.equal(await p.locator("[data-tw-review] math").count() + await p.locator("[data-tw-review] .fxm").count() > 0, true, "the formulas are rendered");
        assert.equal(roomWrites(t, code), before, "nothing is written while the spectator result is shown");
        await p.getByRole("button", { name: "🏆 大会の表にもどる", exact: true }).click();
        await p.locator("[data-tour-watch-result]").waitFor({ state: "detached" });
        await p.getByText("準決勝", { exact: false }).first().waitFor();
        assert.equal(await p.locator("[data-tour-watch-result]").count(), 0, "an unwatched match stays on the bracket");
        // a drawn match: "引き分け" and who advances (the same matchOutcome rule as the bracket)
        await p.getByRole("button", { name: /Three\s*VS\s*Four/ }).click();
        const c2 = {}; let at2 = m2.startAt; for (let q = 0; q < 15; q++) { at2 += 2500; c2[q] = { uid: q % 2 ? "p4" : "p3", at: at2 }; }
        await set(p, `games/factor/rooms/${code}/claims/${m2.gid}`, c2);
        await set(p, `games/factor/rooms/${code}/result/${m2.gid}`, { winner: "", draw: true, reason: "points", rank: { p3: 1, p4: 1 }, at: at2 + 10 });
        const dtext = await common(p, { round: "準決勝", draw: true });
        assert.match(dtext, /引き分け → 抽選で (Three|Four) が勝ち上がり/);
        assert.equal(await p.locator('[data-tw-player][data-rank="1"]').count(), 2, "both players are 1st on a draw");
        await p.getByRole("button", { name: "🏆 大会の表にもどる", exact: true }).click();
        await p.locator("[data-tour-watch-result]").waitFor({ state: "detached" });
        assert.deepEqual(t.errors, []); await t.ctx.close();
        console.log(`PASS A tournament spectator ${width}px: live → result (round, winner, scores, all-question review with combos) → bracket, no write`);
      }
      // ---------- old B (legacy tournament): summary only, round advance returns to the bracket ----------
      {
        const code = "5102", m1 = { a: "p1", b: "p2", gid: "b-semi-1", seed: "tour-b-1", startAt: Date.now() - 60000 }, m2 = { a: "p3", b: "p4", gid: "b-semi-2", seed: "tour-b-2", startAt: Date.now() - 60000 };
        const state = { phase: "tour", tour: true, mode: "B", diff: "easy", round: 0, rounds: [[m1, m2]], names };
        const tree = room(code, state); tree.games.factor.rooms[code].live = { [m1.gid]: { p1: { hp: 62.4, c: 9, score: 140, combo: 3 }, p2: { hp: 0, c: 4, score: 55, combo: 0 } } };
        const { t, p } = await join(b, code, tree, width);
        await p.getByRole("button", { name: /One\s*VS\s*Two/ }).click();
        await p.getByText("📺", { exact: false }).first().waitFor();
        const before = roomWrites(t, code);
        await set(p, `games/factor/rooms/${code}/ko/${m1.gid}/p2`, { at: Date.now() });
        await set(p, `games/factor/rooms/${code}/result/${m1.gid}`, { winner: "p1", reason: "ko", rank: { p1: 1, p2: 2 }, at: Date.now() });
        const text = await common(p, { round: "準決勝", winner: "One" });
        assert.match(text, /Twoの体力が0になった/);
        assert.match(await p.locator('[data-tw-summary] [data-row="correct"]').innerText(), /9問[\s\S]*4問/);
        assert.match(await p.locator('[data-tw-summary] [data-row="hp"]').innerText(), /62%[\s\S]*0%/);
        assert.equal(await p.locator('[data-tw-summary] [data-row="combo"]').count(), 0, "max combo is not recorded for old B: not shown");
        assert.equal(await p.locator("[data-tw-review]").count(), 0, "no per-question review for old B (no history on the server)");
        assert.match(text, /問題ごとのふり返りはありません/);
        assert.equal(roomWrites(t, code), before, "nothing is written while the spectator result is shown");
        // the teacher advances the tournament: the watched match leaves the table → back to the bracket
        const m3 = { a: "p1", b: "p3", gid: "b-final", seed: "tour-b-3", startAt: Date.now() + 600000 };
        await set(p, `games/factor/rooms/${code}/state`, { ...state, round: 1, rounds: [[{ ...m1, done: true, w: "p1" }, { ...m2, done: true, w: "p3" }], [m3]] });
        await p.locator("[data-tour-watch-result]").waitFor({ state: "detached" });
        assert.deepEqual(t.errors, []); await t.ctx.close();
        console.log(`PASS old B tournament spectator ${width}px: summary (correct / HP / reason, no fabricated combo or review), next round returns to the bracket, no write`);
      }
      // ---------- tournament B2: automatic final watch → result with both players' reviews → bracket ----------
      {
        const code = "5103", gid = "b2-final", seed = "tour-b2", start = Date.now() - 5000;
        let game = E.begin(gid, "easy", "B", ["p1", "p2"], seed, start, { rules: "b2", duration: 60 });
        const answer = (g, u, ok, ms) => { const v = E.view(g, u), api = E.runtime(g).api; let pair; for (let i = 0; i < v.tiles.length; i++) for (let j = i + 1; j < v.tiles.length; j++) if (api.polyEqual(api.multiply(v.tiles[i].factor, v.tiles[j].factor), v.poly) === ok) pair = [v.tiles[i].id, v.tiles[j].id]; return E.step(g, u, { type: "answer", question: v.question, tiles: pair }, Math.max(g.time, v.startAt, v.readyAt) + ms); };
        const next = (g, u) => E.step(g, u, { type: "heartbeat" }, Math.max(g.time, g.states[u].nextAt || 0));
        game.states.p1.oj = 3; // p1 plays its 2nd question with ojama on the board → a real ojama bonus
        game = answer(game, "p1", true, 1500); game = next(game, "p1"); game = answer(game, "p1", true, 2200); game = next(game, "p1"); game = answer(game, "p1", false, 3000);
        game = answer(game, "p2", true, 4000); game = next(game, "p2"); game = answer(game, "p2", false, 1000);
        const live = structuredClone(game);
        const finished = E.step(structuredClone(game), "p1", { type: "heartbeat" }, start + 60000);
        assert(finished.result, "the B2 game is finished");
        const m = { a: "p1", b: "p2", gid, seed, startAt: start };
        const state = { phase: "tour", tour: true, tournamentVersion: 2, tournamentId: "tw-cup", mode: "B", diff: "easy", round: 0, rounds: [[m]], names: { p1: "One", p2: "Two" }, accts: { p1: "a1", p2: "a2" } };
        const tree = room(code, state); tree.games.factor.rooms[code].b2 = { [gid]: { game: live } };
        const { t, p } = await join(b, code, tree, width);
        await p.locator("[data-next-spectator]").waitFor({ timeout: 15000 }); // the final is watched automatically (autoFinal)
        assert.equal(await p.locator("[data-tour-watch-result]").count(), 0);
        await set(p, `games/factor/rooms/${code}/b2/${gid}/game`, finished);
        const before = roomWrites(t, code);
        const text = await common(p, { round: "決勝", winner: finished.result.winner ? { p1: "One", p2: "Two" }[finished.result.winner] : "", draw: !finished.result.winner });
        const S = finished.states, bonus = (u) => S[u].hist.reduce((n, h) => n + (h.ok ? h.bonus || 0 : 0), 0);
        assert(bonus("p1") > 0, "the fixture really has an ojama bonus");
        assert.match(await p.locator('[data-tw-summary] [data-row="correct"]').innerText(), new RegExp(`${S.p1.c}問[\\s\\S]*${S.p2.c}問`));
        assert.match(await p.locator('[data-tw-summary] [data-row="combo"]').innerText(), new RegExp(`${S.p1.best}[\\s\\S]*${S.p2.best}`));
        assert.match(await p.locator('[data-tw-summary] [data-row="ojbonus"]').innerText(), new RegExp(`${bonus("p1")}点[\\s\\S]*${bonus("p2")}点`));
        assert.equal(await p.locator("[data-tw-review]").count(), 2, "a review for each player");
        for (const u of ["p1", "p2"]) {
          const card = p.locator(`[data-tw-review="${u}"]`);
          await card.locator(".rs-review-toggle").click();
          const rows = card.locator(".rs-review-row"), h = S[u].hist;
          assert.equal(await rows.count(), h.length, u + ": every answered question");
          for (let i = 0; i < h.length; i++) {
            const txt = await rows.nth(i).innerText();
            assert.match(txt, h[i].ok ? new RegExp(`正解 ${(h[i].ms / 1000).toFixed(1)}秒`) : h[i].timeout ? /時間切れ/ : new RegExp(`ミス（${(h[i].ms / 1000).toFixed(1)}秒）`));
            // the question shown is the one that was served (same bank as the engine)
            const served = E.runtime(finished).bank.get(h[i].lv, h[i].k);
            const page = await p.evaluate(({ seed, lv, k }) => { const b = makeBank(seed, DIFFICULTY_CONFIG.easy.tileCount).get(lv, k); return { poly: b.poly, text: formatPoly(b.poly) }; }, { seed, lv: h[i].lv, k: h[i].k });
            assert.equal(JSON.stringify(page.poly), JSON.stringify(served.poly), "the page rebuilds exactly the question the engine served");
            const shown = await rows.nth(i).locator(".rs-review-body").evaluate((e) => e.textContent.replace(/\s/g, ""));
            assert(shown.startsWith(page.text.replace(/\s/g, "").replace(/-/g, "−")) || shown.startsWith(page.text.replace(/\s/g, "")), `question text ${shown} / ${page.text}`);
          }
        }
        assert.equal(roomWrites(t, code), before, "nothing is written while the spectator result is shown");
        await p.getByRole("button", { name: "🏆 大会の表にもどる", exact: true }).click();
        await p.locator("[data-tour-watch-result]").waitFor({ state: "detached" });
        await p.waitForTimeout(2600);
        assert.equal(await p.locator("[data-tour-watch-result],[data-next-spectator]").count(), 0, "the automatic final watch does not reopen after closing");
        assert.deepEqual(t.errors, []); await t.ctx.close();
        console.log(`PASS tournament B2 spectator ${width}px: automatic final watch → result (correct / max combo / ojama bonus, both players' reviews with time) → bracket, no reopen, no write`);
      }
    }
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
