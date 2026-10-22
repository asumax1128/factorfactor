const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  cp = require("node:child_process");
const { chromium, context, sleep } = require("./browser-harness.cjs");
const Babel = require("@babel/standalone");
// Ver.6.12: the AST audit pins the protected logic (math generation/judging, battle and online
// judging/scoring/rating, save/auth/rewards, ranking) EXACTLY against the last audited release.
// Presentation components are not pinned here; they are covered by the browser E2E below and the
// UI suites. A protected function may change only by deliberately moving PIN_BASE to a reviewed
// release commit (the previous test, against 56981bd + an allow-list, passed on PIN_BASE).
const PIN_BASE = "5f599f49c6aed811ea85805e01d92647988e9e41"; // Ver.6.11
const PROTECTED = {
  math: "gcd randInt randSign randNonZero factorKey toCoeffs multiply polyEqual formatLinear formatQuadraticFactor formatFactorTile formatPoly coprime genL1 genL2 genL3 genL4 genL5 genL6 genL7 genL8 genL9 getLevelWeights pickLevelForQuestion flipSign shiftConst foreignFactor genDummies buildBoard getJudgment buildReverseQuestion patternOf pairOf dailyProblems drillProblems hashSeed mulberry32 withSeed makeBank answerOf problemForA towerModProb towerSimProb",
  battle: "addOjama attackFor scoreA createBEngine bTarget BattleBoard GameA GameB BattleGame",
  online: "rankOf ratingDelta matchOutcome openMatch recordMatch b2PendRaw b2PendWrite b2PendLoad b2PendAdd b2PendDrop b2Confirm swissStandings swissPair flushOnlineLearn fetchRatings pickGhost makeBotProfile CpuBots",
  weekly: "weekKey weeklyInfo raidSchedule raidCalc chestRoll ensureWeekMeta settleWeek RaidPlay useBossGim",
  save: "levelOf addExp migrateGuest migrateGuestExtra applyLearn flushLearn applyMis missionEvent claimMission misRunStep missionsFor statsTx claimLogin keepFreezeOnLogin holdRetiredCounters acctKey acctLogin loadLS saveLS unlockTeacher completeDailySolo fbStart makeLocalDb AccountGate GhostNews",
  ranking: "compareEntries dedupeByName withRanks aggregateTotalRanking fetchNetRanking submitNetScore loadRankingFromStorage saveRankingToStorage",
};
const appSource = (html) =>
  html.match(/<script type="text\/plain" id="app-source">([\s\S]*?)<\/script>/)[1];
function functions(jsx) {
  const ast = Babel.transform(jsx, { presets: ["react"], ast: true, code: false }).ast;
  const drop = ["loc", "start", "end", "leadingComments", "trailingComments", "innerComments", "extra"];
  return Object.fromEntries(
    ast.program.body
      .filter((n) => n.type === "FunctionDeclaration")
      .map((n) => [n.id.name, JSON.stringify(n, (k, v) => (drop.includes(k) ? undefined : v))]),
  );
}
const baseJsx = appSource(cp.execFileSync("git", ["show", PIN_BASE + ":index.html"], { encoding: "utf8", maxBuffer: 20e6 }));
const nowJsx = appSource(fs.readFileSync("index.html", "utf8"));
const before = functions(baseJsx), after = functions(nowJsx);
const names = Object.values(PROTECTED).flatMap((s) => s.split(/\s+/));
assert.equal(new Set(names).size, names.length, "protected list has duplicates");
// Self-test: a one-token change inside a protected function is detected.
{
  const mutated = functions(nowJsx.replace(/function getJudgment\(([^)]*)\)\s*\{/, (m) => m + " void 0;"));
  assert.notEqual(mutated.getJudgment, after.getJudgment, "self-test: the audit must detect a changed protected function");
}
for (const name of names) {
  assert.ok(before[name], "Protected function missing from the pin baseline: " + name);
  assert.ok(after[name], "Protected function removed: " + name);
  assert.equal(after[name], before[name], "Protected function changed: " + name + " (review it, then move PIN_BASE deliberately)");
}
console.log("PASS " + names.length + " protected functions unchanged (AST, exact) against Ver.6.11 " + PIN_BASE.slice(0, 7) + ": math/judging, battle/online scoring, save/auth/rewards, ranking");
(async () => {
  let b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  });
  try {
    const t = await context(b, { account: { guest: true, name: "Guest" } }),
      p = t.page;
    await p.locator(".action-card.solo").click(); await p.locator('[data-solo-mode=play]').click();
    await p.getByRole("button", { name: "スタート", exact: true }).click();
    await p.locator("[data-tile-id]").first().waitFor();
    console.log("PASS solo battle");
    await p.reload();
    // Ver.6.13: the old メニュー sheet is gone; the learning room is the solo screen's 学びの部屋 card.
    await p.locator(".action-card.solo").click();
    await p.locator("[data-solo-mode=learn]").click();
    await p.getByText("レベル別の正答率と平均時間", { exact: true }).waitFor();
    console.log("PASS learning room");
    await p.reload();
    await p.locator('.action-card.solo').click(); await p.locator('[data-solo-mode=cpu]').click();
    await p
      .getByRole("button", { name: "CPUと練習スタート", exact: true })
      .click();
    await p.locator("[data-btile]").first().waitFor();
    console.log("PASS CPU battle");
    await p.reload();
    await p.getByRole("button", { name: /今週のボス/ }).click();
    await p.getByRole("button", { name: /出撃する/ }).click();
    await p.locator("[data-btile]").first().waitFor();
    console.log("PASS weekly raid");
    await p.reload();
    await p.getByRole("button", { name: /デイリーミッション/ }).click();
    await sleep(500);
    assert.ok((await p.locator("body").innerText()).includes("デイリー"));
    console.log("PASS daily");
    assert.deepEqual(t.errors, []);
    await t.ctx.close();
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
