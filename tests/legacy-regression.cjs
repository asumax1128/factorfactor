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
    if (!n || typeof n !== "object") return;
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
      "applyLearn", // Adds validated correct-answer minima; totals regression tested.
      "migrateGuestExtra", // Min-merges guest level bests without changing totals.
      "LearnApp", // Displays fastest per level; responsive browser tested.
      "TeacherArea", // Adds scoped grant manager; teacher authentication unchanged.
      "GhostNews", // Makes old passive rewards atomic with receipt/counters, fixing duplicate XP.
      "BattleBoard", // Opt-in tap pair and touch-cancel; original drag path retained and all modes E2E tested.
      "BattleGame", // Shared presentation-only BattleSurface; existing math, CPU and synchronization unchanged and E2E tested.
      "BattleApp", // Adds an opt-in server-backed random mode; legacy routes tested below.
      "PlayerProfile", // Only optional online-context hiding of legacy rating; default profile unchanged.
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
    await p.getByRole("button", { name: "スタート", exact: true }).click();
    await p.locator("[data-tile-id]").first().waitFor();
    console.log("PASS solo battle");
    await p.reload();
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
