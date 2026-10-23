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
  save: "levelOf addExp migrateGuest migrateGuestExtra applyLearn flushLearn applyMis missionEvent claimMission misRunStep missionsFor statsTx claimLogin keepFreezeOnLogin holdRetiredCounters acctKey acctLogin loadLS saveLS unlockTeacher completeDailySolo fbStart makeLocalDb GhostNews",
  ranking: "compareEntries dedupeByName withRanks aggregateTotalRanking fetchNetRanking submitNetScore loadRankingFromStorage saveRankingToStorage",
};
// Ver.6.15: the login screen is restyled. Its LOGIC stays pinned exactly: everything in the function except the returned markup
// (state, doLogin → acctLogin / migrateGuest) plus every behaviour attribute inside the markup (onClick, onChange, disabled, value,
// type, inputMode, maxLength, placeholder), so a changed handler, call or limit still fails. Colours, classes and layout are free.
const LOGIC_ONLY = ["AccountGate"], BEHAVIOUR_ATTRS = ["onClick", "onChange", "disabled", "value", "type", "inputMode", "maxLength", "placeholder"];
function logicOnly(jsx) {
  const ast = Babel.transform(jsx, { presets: ["react"], ast: true, code: false }).ast;
  const drop = ["loc", "start", "end", "leadingComments", "trailingComments", "innerComments", "extra"], j = (n) => JSON.stringify(n, (k, v) => (drop.includes(k) ? undefined : v));
  const out = {};
  for (const n of ast.program.body.filter((x) => x.type === "FunctionDeclaration" && LOGIC_ONLY.includes(x.id.name))) {
    // (The parsed tree is the React-transformed one: markup attributes are the props objects of the _jsx(...) calls.)
    const body = n.body.body, ret = body[body.length - 1];
    assert.equal(ret.type, "ReturnStatement", n.id.name + " ends with its markup");
    const attrs = [], keyOf = (p) => (p.key && (p.key.name || p.key.value)) || "";
    const walk = (x) => { if (!x || typeof x !== "object") return; if (x.type === "ObjectProperty" && BEHAVIOUR_ATTRS.includes(keyOf(x))) attrs.push([keyOf(x), j(x.value)]); for (const v of Object.values(x)) if (Array.isArray(v)) v.forEach(walk); else walk(v); };
    walk(ret.argument);
    // inputStyle (the old light colours of the inputs) is presentation, not logic.
    const logic = body.slice(0, -1).filter((st) => !(st.type === "VariableDeclaration" && st.declarations.every((d) => d.id.name === "inputStyle")));
    assert(attrs.length >= 8, "behaviour attributes found in the markup: " + attrs.length);
    out[n.id.name] = JSON.stringify({ params: j(n.params), logic: logic.map(j), attrs: attrs.sort((a, b) => (a.join() < b.join() ? -1 : 1)) });
  }
  return out;
}
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
{
  const b0 = logicOnly(baseJsx), a0 = logicOnly(nowJsx);
  for (const name of LOGIC_ONLY) { assert.ok(b0[name] && a0[name], name + " found"); assert.equal(a0[name], b0[name], "Login logic changed: " + name + " (state / handlers / limits must stay as audited)"); }
  // Self-test: changing a handler call or a limit inside the login markup is detected; changing only a class is not.
  const swap = (from, to) => logicOnly(nowJsx.replace(from, to)).AccountGate;
  assert.notEqual(swap("doLogin(false); }}>ログイン", "doLogin(true); }}>ログイン"), a0.AccountGate, "self-test: handler change detected");
  assert.notEqual(swap("slice(0, 4))} placeholder=\"合言葉", "slice(0, 5))} placeholder=\"合言葉"), a0.AccountGate, "self-test: input limit change detected");
  assert.notEqual(swap("const r = await acctLogin(nm, pin, create);", "const r = await acctLogin(nm, pin, false);"), a0.AccountGate, "self-test: logic change detected");
  assert.equal(swap('className="lg-card"', 'className="lg-card x"'), a0.AccountGate, "self-test: styling-only change is allowed");
  console.log("PASS login logic (AccountGate state, handlers, limits) unchanged against Ver.6.11; markup/styling free");
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
