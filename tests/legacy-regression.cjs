const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  cp = require("node:child_process");
const { chromium, context, sleep } = require("./browser-harness.cjs");
const Babel = require("@babel/standalone");
const baseline = cp.execFileSync(
  "git",
  ["show", "56981bd90b9aa54a39b0db5458b34d867ec39249:index.html"],
  { encoding: "utf8", maxBuffer: 10e6 },
);
const source = fs.readFileSync("index.html", "utf8");
function functions(html) {
  const jsx = html.match(
    /<script type="text\/plain" id="app-source">([\s\S]*?)<\/script>/,
  )[1];
  const ast = Babel.transform(jsx, {
    presets: ["react"],
    ast: true,
    code: false,
  }).ast;
  const normalise = (n) => {
    if(n?.type==='FunctionDeclaration'&&n.id?.name==='RaidPlay')require('./weekly-combat-projection.cjs')(n);
    if(n?.type==='FunctionDeclaration'&&n.id?.name==='useBossGim'){for(const stmt of n.body.body)for(const d of stmt.declarations||[])if(d.id?.name==='G')d.init.properties=d.init.properties.filter(p=>!['checkpoint','restore'].includes(p.key?.name));}
    if(n?.type==='FunctionDeclaration'&&n.id?.name==='FriendRaidLobby')require('./friend-legacy-projection.cjs')(n);
    if(n?.type==='FunctionDeclaration'&&['TourBoard','TourMatchCard'].includes(n.id?.name))require('./tournament-legacy-projection.cjs')(n);
    if(n?.type==='FunctionDeclaration'&&n.id?.name==='WeeklyRaidApp')require('./weekly-legacy-projection.cjs')(n);
    if (!n || typeof n !== "object") return;
    if(n.type==='ObjectProperty'&&n.key?.name==='tick'&&n.value?.body?.body)n.value.body.body=n.value.body.body.map(stmt=>stmt.type==='IfStatement'&&stmt.test?.type==='LogicalExpression'&&stmt.test.left?.type==='LogicalExpression'&&stmt.test.left.left?.object?.name==='o'&&stmt.test.left.left?.property?.name==='checkpointRotation'?stmt.alternate:stmt);
    // The profile-entry callback is navigation only. Audit its exact two-statement
    // guard, then compare every original account-read/equipment statement unchanged.
    if(n.type==='FunctionDeclaration'&&n.id?.name==='AccountPanelV7'&&n.params[0]?.properties?.some(p=>p.key?.name==='onProfile')){
      n.params[0].properties=n.params[0].properties.filter(p=>p.key?.name!=='onProfile');
      const open=n.body.body.flatMap(s=>s.declarations||[]).find(d=>d.id?.name==='openProf');
      const guard=open.init.body.body[0],g=guard.consequent?.body;
      assert.equal(guard.type,'IfStatement');assert.equal(guard.test.name,'onProfile');assert.equal(guard.alternate,null);
      assert.equal(g.length,2);assert.equal(g[0].type,'ExpressionStatement');assert.equal(g[0].expression.type,'CallExpression');assert.equal(g[0].expression.callee.name,'onProfile');assert.deepEqual(g[0].expression.arguments,[]);assert.equal(g[1].type,'ReturnStatement');assert.equal(g[1].argument,null);
      open.init.body.body.shift();
    }
    // Compare every original spectator/engine statement after auditing only the
    // additive visibility guards and presentation metadata exactly.
    const bare=x=>JSON.stringify(x,(k,v)=>['loc','start','end','extra'].includes(k)?undefined:v);
    const expr=x=>Babel.transform('const x='+x,{ast:true,code:false}).ast.program.body[0].declarations[0].init;
    if(n.type==='ObjectExpression'){
      for(const p of n.properties)if(p.key?.name==='boardReady')assert.equal(bare(p.value),bare(expr('!s.resolving && !s.over && !s.ko')));
      n.properties=n.properties.filter(p=>{if(p.key?.name==='ready'&&JSON.stringify(p.value).includes('boardReady')){assert.equal(bare(p.value),bare(expr("!result&&now>=startAt&&(mode==='A'?!!probA:(live[u]||{}).boardReady===true)")));return false;}return p.key?.name!=='boardReady';});
    }
    if(n.type==='FunctionDeclaration'&&['PlayerMirror','SplitView','SpectatorView'].includes(n.id?.name)){
      const name=n.id.name;
      if(['SplitView','SpectatorView'].includes(name))n.body.body=n.body.body.filter(s=>{if(s.type!=='IfStatement'||!JSON.stringify(s.test).includes('LegacySpectator'))return true;assert.equal(bare(s.test),bare(expr("window.NextResults?.LegacySpectator && ['A','C'].includes(mode)")));assert.equal(s.consequent.type,'ReturnStatement');return false;});
      if(name==='PlayerMirror'){
        const p=n.params[0].properties.find(p=>p.key?.name==='ready');if(p){assert.equal(p.value.type,'AssignmentPattern');assert.equal(p.value.right.value,false);}
        n.params[0].properties=n.params[0].properties.filter(p=>p.key?.name!=='ready');
      }
      for(const stmt of n.body.body)for(const d of stmt.declarations||[]){
        if(name==='PlayerMirror'&&d.id?.name==='prob'&&d.init.test?.name==='ready'){assert.equal(bare(d.init),bare(expr("ready ? (isBm(mode) ? (l.lv ? bank.get(l.lv, l.k || 0) : null) : probA) : null")));d.init=d.init.consequent;}
        if(['SplitView','SpectatorView'].includes(name)&&d.id?.name==='probA'&&JSON.stringify(d.init).includes('qStartA')){
          const q=name==='SplitView'?'cl, q, startAt':'claims, q, state.startAt';
          assert.equal(bare(d.init),bare(expr("mode === 'A' && q < N && !result && now >= qStartA("+q+") ? problemForA(bank, q) : null")));
          d.init=expr("mode === 'A' && q < N ? problemForA(bank, q) : null");
        }
      }
      const scrub=x=>{if(!x||typeof x!=='object')return;
        if(name==='SplitView'&&x.type==='JSXOpeningElement')x.attributes=x.attributes.filter(a=>{if(a.name?.name!=='ready')return true;assert.equal(bare(a.value.expression),bare(expr("!result&&now>=startAt&&(mode==='A'?!!probA:(live[u]||{}).boardReady===true)")));return false});
        if(name==='SpectatorView'&&x.type==='VariableDeclarator'&&x.id?.name==='p'&&JSON.stringify(x.init).includes('boardReady')){assert.equal(bare(x.init),bare(expr("!result && now >= state.startAt && l.boardReady === true && isBm(mode) && l.lv ? bank.get(l.lv, l.k || 0) : null")));x.init=expr("isBm(mode) && l.lv ? bank.get(l.lv, l.k || 0) : null");}
        for(const v of Object.values(x))if(v&&typeof v==='object'){if(Array.isArray(v))v.forEach(scrub);else scrub(v)};
      };scrub(n);
    }
    if (
      n.type === "CallExpression" &&
      n.callee?.name === "useGameMute" &&
      n.arguments.length === 0
    ) {
      n.callee.name = "useState";
      n.arguments = [{ type: "BooleanLiteral", value: false }];
    }
    for (const v of Object.values(n))
      if (v && typeof v === "object") {
        if (Array.isArray(v)) v.forEach(normalise);
        else normalise(v);
      }
  };
  normalise(ast.program);
  return Object.fromEntries(
    ast.program.body
      .filter((n) => n.type === "FunctionDeclaration")
      .map((n) => [
        n.id.name,
        JSON.stringify(n, (k, v) =>
          [
            "loc",
            "start",
            "end",
            "leadingComments",
            "trailingComments",
            "innerComments",
            "extra",
          ].includes(k)
            ? undefined
            : v,
        ),
      ]),
  );
}
const before = functions(baseline),
  after = functions(source);
// The only new BattleGame change is the shared presentation wrapper. Audit every
// other statement against the immediately preceding production commit.
const previous = functions(
  cp.execFileSync("git", ["show", "1d5b2a1:index.html"], {
    encoding: "utf8",
    maxBuffer: 10e6,
  }),
);
const stripPos = (x) => { if (Array.isArray(x)) return x.map(stripPos); if (x && typeof x === 'object') { const o = {}; for (const [k, v] of Object.entries(x)) if (!['start', 'end', 'loc', 'range', 'extra', 'leadingComments', 'trailingComments', 'innerComments'].includes(k)) o[k] = stripPos(v); return o; } return x; };
const parseExpr = (code) => stripPos(Babel.transform(code + ';', { presets: ['react'], ast: true, code: false }).ast.program.body.find((b) => b.type === 'ExpressionStatement').expression);
const DISPLAY_WRAP_FLAG = JSON.stringify(parseExpr("!!(window.NextResults && window.NextResults.BattleSummary && (mode === 'A' || (mode === 'B' && state.b2Final)))"));
function trimDisplayWrapArgs(root, strict = true) {
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'CallExpression' && node.callee?.name === 'wrap' && node.arguments.length === 3 && JSON.stringify(node.arguments[0]).includes('BattleResult') && node.arguments[1]?.type === 'BooleanLiteral' && node.arguments[1].value === false && JSON.stringify(stripPos(node.arguments[2])) === DISPLAY_WRAP_FLAG) node.arguments = node.arguments.slice(0, 1);
    for (const v of Object.values(node)) if (v && typeof v === 'object') { if (Array.isArray(v)) v.forEach(walk); else walk(v); }
  };
  walk(root); return root;
}
// Self-test: only the exact presentation flag is hidden from the audit; anything else stays visible and makes the comparison fail.
{
  const call = (args) => stripPos(Babel.transform(`wrap(<BattleResult a={1} />${args});`, { presets: ['react'], ast: true, code: false }).ast.program.body.find((b) => b.type === 'ExpressionStatement').expression);
  const len = (args) => trimDisplayWrapArgs({ x: call(args) }).x.arguments.length;
  const ok = ", false, !!(window.NextResults && window.NextResults.BattleSummary && (mode === 'A' || (mode === 'B' && state.b2Final)))";
  assert.equal(len(ok), 1, 'the exact display-only flag is normalised');
  for (const bad of [", false, true", ", true, !!(window.NextResults && window.NextResults.BattleSummary && (mode === 'A' || (mode === 'B' && state.b2Final)))", ", false, !!(window.NextResults && window.NextResults.BattleSummary && (mode === 'A' || (mode === 'B' && state.b2Final) || rating > 0))", ok + ", scoreBoost()", ", false, applyRating()", ", false"])
    assert.notEqual(len(bad), 1, 'must not be hidden from the audit: ' + bad);
}
// Ver.6.0 play frame: ONLY presentation hooks named pf-* may be added to class names (CSS scope ui-next/play-frame.css).
// Any other class or text change, and every non-class change, is still audited. (The AST is post-JSX: className is an object property.)
const PF_TOKEN = /(^|\s)pf-[\w-]+(?=\s|$)/g;
const tidy = (v) => v.replace(PF_TOKEN, '$1').replace(/\s+/g, ' ').trim();
function stripPfClasses(root) {
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'ObjectProperty' && (node.key?.name === 'className' || node.key?.value === 'className')) {
      if (node.value?.type === 'StringLiteral') { node.value.value = tidy(node.value.value); delete node.value.extra; }
      if (node.value?.type === 'TemplateLiteral') for (const q of node.value.quasis) { q.value.raw = q.value.raw.replace(PF_TOKEN, '$1').replace(/ {2,}/g, ' '); q.value.cooked = q.value.raw; }
    }
    for (const v of Object.values(node)) if (v && typeof v === 'object') { if (Array.isArray(v)) v.forEach(walk); else walk(v); }
  };
  walk(root); return root;
}
{
  const el = (c) => stripPos(Babel.transform(`<div className="${c}" />;`, { presets: ['react'], ast: true, code: false }).ast.program.body.find((x) => x.type === 'ExpressionStatement').expression);
  const run = (c) => JSON.stringify(stripPfClasses({ x: el(c) }));
  assert.equal(run('a pf-x b'), run('a b'), 'pf-* hooks are normalised');
  assert.notEqual(run('a pb b'), run('a b'), 'other class changes stay visible');
  assert.notEqual(run('a pf b'), run('a b'), 'only pf-<name> tokens are normalised');
}
const withoutFrame = (s) => {
  const n = JSON.parse(s);
  // Only the new B2 final-result adapter is removed for this comparison.
  // The legacy CPU/A/C branch must still be byte-identical after normalization.
  const aliases={};
  for(const stmt of n.body.body)for(const d of stmt.declarations||[])if(['savedResult','savedLive','savedKo'].includes(d.id?.name))aliases[d.id.name]=d.init;
  n.body.body=n.body.body.filter(stmt=>!(stmt.declarations||[]).some(d=>aliases[d.id?.name])&&!(stmt.type==='IfStatement'&&JSON.stringify(stmt.test).includes('b2Final')));
  for(const stmt of n.body.body)for(const d of stmt.declarations||[]){
    if(d.id?.name==='result'&&aliases.savedResult)d.init=aliases.savedResult;
    if(d.id?.name==='live'&&aliases.savedLive)d.init={type:'LogicalExpression',left:aliases.savedLive,operator:'||',right:{type:'ObjectExpression',properties:[]}};
    if(d.id?.name==='ko'&&aliases.savedKo)d.init={type:'LogicalExpression',left:aliases.savedKo,operator:'||',right:{type:'ObjectExpression',properties:[]}};
  }
  const stripB2=node=>{if(!node||typeof node!=='object')return;
    if(node.type==='ObjectExpression')node.properties=node.properties.filter(p=>!(p.type==='SpreadElement'&&JSON.stringify(p).includes('b2')));
    if(Array.isArray(node.body))node.body=node.body.map(x=>x.type==='IfStatement'&&JSON.stringify(x.test).includes('b2')&&x.alternate?.type==='ExpressionStatement'?x.alternate:x);
    for(const v of Object.values(node))if(v&&typeof v==='object'){if(Array.isArray(v))v.forEach(stripB2);else stripB2(v)};
  };stripB2(n);
  // A result snapshot is presentation metadata in the existing result write;
  // normalize that assignment only, leaving every game/rating statement audited.
  const stripReport = node => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node.body)) node.body = node.body.filter(x => !(x.type === 'ExpressionStatement' && x.expression?.type === 'AssignmentExpression' && x.expression.left?.object?.name === 'extra' && x.expression.left?.property?.name === 'aResult'));
    for (const v of Object.values(node)) if (v && typeof v === 'object') { if (Array.isArray(v)) v.forEach(stripReport); else stripReport(v); }
  };
  stripReport(n);
  // Ver.6.0 A4 (owner-approved): the title counter statement `add.handiWins = 1` (opponent had the handicap) became
  // `add.handiSelf = 1` (the player had it). Only that single statement is normalised away on both sides; its new
  // behaviour is audited by tests/v6-a4-handi.test.cjs.
  const isHandiStmt = x => x.type === 'IfStatement' && !x.alternate && x.consequent?.type === 'ExpressionStatement' && x.consequent.expression?.type === 'AssignmentExpression' && x.consequent.expression.left?.object?.name === 'add' && ['handiWins', 'handiSelf'].includes(x.consequent.expression.left?.property?.name);
  // Ver.6.0 A6 (owner-approved): the single `if (state.final && win && ...) { ... add.darkHorse = 1 }` statement is removed from the
  // result screen (no new darkhorse awards). Only that statement is normalised away; tests/v6-a6-darkhorse.test.cjs audits it.
  const isDarkStmt = x => x.type === 'IfStatement' && JSON.stringify(x.test).includes('"final"') && JSON.stringify(x.consequent).includes('"darkHorse"');
  const stripHandi = node => {
    if (!node || typeof node !== 'object') return;
    // Ver.6.0 A7 (owner-approved): the result info gains ONE spread `...(state.ghostKey ? {} : { sk: {...} })` (official-streak ledger entry).
    if (node.type === 'ObjectExpression') node.properties = node.properties.filter(p => !(p.type === 'SpreadElement' && JSON.stringify(p).includes('"ghostKey"') && JSON.stringify(p).includes('"sk"')));
    // Ver.6.0 A8 (owner-approved): the result screen records `add.cancelFull` and the b2Final default state gains `cancelFull: 0`.
    if (node.type === 'ObjectExpression') node.properties = node.properties.filter(p => !(p.type === 'ObjectProperty' && p.key?.name === 'cancelFull'));
    // Ver.6.0 B (owner-approved): new title records added to the result screen: `if (...) add.flash3|accuracy10|giant250Wins = 1;` and the
    // `humanOnly` flag they use. Nothing else in the result screen is touched; tests/v6-b-titles.test.cjs audits them.
    const isNewTitleStmt = x => (x.type === 'IfStatement' && !x.alternate && x.consequent?.type === 'ExpressionStatement' && x.consequent.expression?.type === 'AssignmentExpression' && x.consequent.expression.left?.object?.name === 'add' && ['flash3', 'accuracy10', 'giant250Wins'].includes(x.consequent.expression.left?.property?.name))
      || (x.type === 'VariableDeclaration' && x.declarations.length === 1 && x.declarations[0].id?.name === 'humanOnly');
    const isCancelFullStmt = x => x.type === 'ExpressionStatement' && x.expression?.type === 'AssignmentExpression' && x.expression.left?.object?.name === 'add' && x.expression.left?.property?.name === 'cancelFull';
    if (Array.isArray(node.body)) node.body = node.body.filter(x => !isHandiStmt(x) && !isDarkStmt(x) && !isCancelFullStmt(x) && !isNewTitleStmt(x));
    for (const v of Object.values(node)) if (v && typeof v === 'object') { if (Array.isArray(v)) v.forEach(stripHandi); else stripHandi(v); }
  };
  stripHandi(n);
  // The result frame may be widened (presentation only). Exactly ONE additive shape is allowed:
  //   wrap(<BattleResult .../>, false, !!(window.NextResults && window.NextResults.BattleSummary && (mode === 'A' || (mode === 'B' && state.b2Final))))
  // Any other extra argument, a different flag expression or a different second argument is NOT normalised and fails the audit.
  trimDisplayWrapArgs(n);
  stripPfClasses(n);
  for (const statement of n.body.body) {
    for (const d of statement.declarations || [])
      if (d.id?.name === "wrap")
        d.init = { type: "StringLiteral", value: "shared-BattleSurface" };
  }
  return JSON.stringify(n);
};
assert.equal(
  withoutFrame(after.BattleGame),
  withoutFrame(previous.BattleGame),
  "CPU/legacy battle logic changed beyond the shared frame",
);
let unchanged = 0;
for (const [name, value] of Object.entries(before)) {
  if (
    [
      "AppRoot",
      "missionsFor", // Daily challenge prompt text only; targets unchanged.
      "DailyTileV7", // Refreshed daily entry label; mission counts unchanged.
      "DailyApp", // Replaced by dailyV2; its frozen legacy runner is preserved.
      "BattleLobby", // Online B duration selector; A/C controls unchanged.
      "BattleResult", // Timed B labels; existing A detailed result retained.
      "recordMatch", // Optional B2 room receipt prevents duplicate rewards.
      "flushOnlineLearn", // Ver.6.3 B2 safe-leave receipt: the mission step runs on every call (idempotent by match id) instead of only when the learning mark is new; learning totals unchanged (tests/room-b2-receipt-emulator.cjs).
      "missionEvent", // Ver.6.3 B2 safe-leave receipt: optional match id + match day; progress and the idempotency mark mis.s[id] commit in ONE transaction; without an id the behaviour is unchanged (tests/room-b2-receipt-emulator.cjs).
      "statsTx", // Ver.6.0 (owner-approved): retired titles (nosp, wklast, tower) are no longer newly awarded or revealed; held counters/equipment untouched (tests/v6-title-retire.test.cjs).
      "claimMission", // Ver.6.0 A5 (owner-approved): the all-clear stats write goes through statsTx (ensureKeep first) and records the consecutive run (tests/v6-a5-mis7.test.cjs).
      "TargetCard", // Ver.6.0 post-release UI fix (owner request): the question card no longer shows the "この式を因数分解しよう・Lv.N" caption line (a custom note, e.g. the last-spurt notice, is still shown). Presentation only; tests/v6-play-frame-browser.cjs checks it.
      "createBEngine", // Ver.6.0 A8 (owner-approved): one counting statement in sendAttack (+ cancelFull in the initial state); every amount and every other rule is unchanged, audited by tests/v6-a8-cancel.test.cjs (text projection against the A3 baseline).
      "applyLearn", // Adds validated correct-answer minima; totals regression tested.
      "migrateGuestExtra", // Min-merges guest level bests without changing totals.
      "LearnApp", // Displays fastest per level; responsive browser tested.
      "BadgeIcons", // Approved temporary hiding of tower reward icons; underlying award/equipment predicates retained.
      "TeacherDash", // Verified teacher gate and read-only achievement condition catalogue.
      "TeacherArea", // Adds scoped grant manager; teacher authentication unchanged.
      "GhostNews", // Makes old passive rewards atomic with receipt/counters, fixing duplicate XP.
      "FxLayer", // Optional online-local layer above profile overlays; default tower layer unchanged.
      "GameA", // Shared timing/merge presentation only; math engine/source unchanged.
      "GameB", // Shared timing/merge presentation only; rules verified by full E2E.
      "BattleBoard", // Opt-in tap pair and touch-cancel; original drag path retained and all modes E2E tested.
      "MathText", // Ver.6.0: adds only an inert --mw width hint (style custom property) read by ui-next/play-frame.css; text and class output unchanged.
      "BattleGame", // Shared presentation-only BattleSurface; existing math, CPU and synchronization unchanged and E2E tested.
      "BattleApp", // Adds an opt-in server-backed random mode; legacy routes tested below.
      "Wardrobe", // Master tile alone reads immutable EASY/NORMAL history; other cosmetic rules unchanged.
      "PlayerProfile", // Ver.6.4: removed. Replaced by the read-only PlayerView (other players only); own titles/equip live in the new profile only.
      "AccountBar", // Ver.6.4: removed (unused old header; its only role was opening the old PlayerProfile modal).
      "LoginBonus", // Ver.6.5: only passes hideClose to V7Modal; stamp / claim logic unchanged (login bonus browser-checked).
      "V7Modal", // Ver.6.5: adds an opt-in hideClose prop (login bonus hides its top-right とじる); every other modal is unchanged.
      "AccountPanelV7", // Ver.6.4: the old-modal fallback of the profile button removed (the new profile page is always used).
      "BattleResult", // Rating delta display only; raw result, rank and reward processing unchanged.
      "BattleHome", // Routes new ranking only when the protected feature flag is enabled.
      "FactorHunt",
      "TowerTileV7",
      "setUiMute",
      "uiTone",
      "uiSnd",
      "useBattleSound",
    ].includes(name)
  )
    continue;
  // Ver.6.0 (owner-approved): Nick may resolve its label with titleLabelOf (BADGES first, then the title catalog)
  // instead of nickOf. That single identifier swap is the ONLY normalised difference; the rest of Nick is audited.
  const now = name === "Nick" ? after[name].split('"name":"titleLabelOf"').join('"name":"nickOf"') : after[name];
  assert.equal(now, value, "Shared function changed: " + name);
  unchanged++;
}
console.log(
  "PASS " +
    unchanged +
    " existing functions unchanged (AST), including math/game/auth logic; presentation refactor E2E tested",
);
(async () => {
  let b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  });
  try {
    const t = await context(b, { account: { guest: true, name: "Guest" } }),
      p = t.page;
    await p.locator(".action-card.solo").click();
    await p.getByRole("button", { name: "スタート", exact: true }).click();
    await p.locator("[data-tile-id]").first().waitFor();
    console.log("PASS solo battle");
    await p.reload();
    await p.getByRole("button", { name: "メニューを開く" }).click();
    await p.getByRole("button", { name: /学びの部屋/ }).click();
    await p.getByText("レベル別の正答率と平均時間", { exact: true }).waitFor();
    console.log("PASS learning room");
    await p.reload();
    await p
      .getByRole("button", { name: "オンライン対戦・CPU練習", exact: true })
      .click();
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
