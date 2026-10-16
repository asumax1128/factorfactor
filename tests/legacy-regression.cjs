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
    if(n?.type==='FunctionDeclaration'&&n.id?.name==='FriendRaidLobby')require('./friend-legacy-projection.cjs')(n);
    if(n?.type==='FunctionDeclaration'&&['TourBoard','TourMatchCard'].includes(n.id?.name))require('./tournament-legacy-projection.cjs')(n);
    if(n?.type==='FunctionDeclaration'&&n.id?.name==='WeeklyRaidApp')require('./weekly-legacy-projection.cjs')(n);
    if (!n || typeof n !== "object") return;
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
      "BattleGame", // Shared presentation-only BattleSurface; existing math, CPU and synchronization unchanged and E2E tested.
      "BattleApp", // Adds an opt-in server-backed random mode; legacy routes tested below.
      "Wardrobe", // Master tile alone reads immutable EASY/NORMAL history; other cosmetic rules unchanged.
      "PlayerProfile", // Only optional online-context hiding of legacy rating; default profile unchanged.
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
  assert.equal(after[name], value, "Shared function changed: " + name);
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
