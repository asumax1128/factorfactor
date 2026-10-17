// Ver.6.0 UI unification: human-vs-human vote states on the random-match vote screen.
// The mock Firebase keeps data in the page; the rival's actions are injected with window.__fbApply.
// Transport, vote aggregation and deadline logic are the real, unchanged production code.
const assert = require("node:assert/strict");
const fs = require("fs");
const { chromium, context, sleep } = require("./browser-harness.cjs");
const SELF = "teacher-uid",
  RIVAL = "rival-uid",
  MID = "m-human",
  BASE = "games/factor/onlineSparkV1";
const C = require("../server/online-rated/core.cjs");
// a real migrated profile (same shape the page would create) so the transport accepts it
const player = (name, stats) =>
  C.migrate(null, { ax: { name, stats } }, "spark-legacy-to-easy-v1", Date.now()).players.ax;
const mine = player("Teacher", { rating: 1600, exp: 100 }),
  rival = player("Rival", { rating: 1550, exp: 50 });
const tree = () => ({
  games: {
    factor: {
      accounts: { ateacher: { name: "Teacher", stats: { rating: 1600, exp: 100 }, prof: { lv: { L1: { n: 30, ok: 25, ms: 100000 } } } } },
      onlineSparkV1: { config: { enabled: true, protocol: "spark-v1" } },
    },
  },
});
const matchSeed = (voteEnd = Date.now() + 120000) => ({
  id: MID,
  difficulty: "easy",
  phase: "vote",
  voteEnd,
  seed: "seedseedseed",
  members: [
    { uid: SELF, key: "ateacher" },
    { uid: RIVAL, key: "arival" },
  ],
  votes: {},
  lastSeen: { [SELF]: Date.now(), [RIVAL]: Date.now() },
  origin: "human",
  rng: 12345,
  revision: 1,
  snapshots: {
    ateacher: { name: "Teacher", easy: mine.easy, normal: mine.normal, badges: mine.badges },
    arival: { name: "Rival", easy: rival.easy, normal: rival.normal, badges: rival.badges },
  },
});
const apply = (p, op) => p.evaluate((o) => window.__fbApply(o), op);
const set = (p, path, v) => apply(p, { kind: "set", path: `${BASE}/${path}`, v });
// keep the rival "present" (core cancels a vote when the other player was unseen for >8s)
const keepAlive = (p) => {
  const id = setInterval(() => set(p, `matches/${MID}/lastSeen/${RIVAL}`, Date.now()).catch(() => {}), 700);
  return () => clearInterval(id);
};
async function open(b, ui, { voteEnd, onOperation } = {}) {
  const t = await context(b, { tree: tree(), onOperation, assetOverrides: { "/online-rated-ui.js": ui } }),
    p = t.page;
  await p.setViewportSize({ width: 390, height: 844 });
  await p.locator(".action-card.online").click();
  await p.getByRole("button", { name: "すぐ遊ぶ（ランダム対戦）", exact: true }).waitFor();
  await set(p, `matches/${MID}`, matchSeed(voteEnd));
  await set(p, "profiles/ateacher", {
    name: "Teacher",
    easy: mine.easy,
    normal: mine.normal,
    badges: mine.badges,
    migrationId: "spark-legacy-to-easy-v1",
    initialRating: mine.easy.rating,
    initializedAt: Date.now(),
    activeMatch: MID,
  });
  await p.getByRole("button", { name: "すぐ遊ぶ（ランダム対戦）", exact: true }).click();
  await p.locator("[data-om=vote]").waitFor();
  return t;
}
const status = (p) => p.locator(".om-status").innerText();
const aBtn = (p) => p.getByRole("button", { name: "A：早い者勝ち", exact: true });
const bBtn = (p) => p.getByRole("button", { name: "B：レース＋攻撃", exact: true });
// the match really started (not cancelled): battle UI is up and no error is shown
const started = async (p) => {
  await p.locator(".or-countdown,[data-online-ready]").first().waitFor({ timeout: 10000 });
  assert.equal(await p.getByRole("alert").count(), 0, "no error when the match starts");
};
const left = (p) => p.locator("[data-om=vote]").count();
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium" });
  const ui = fs.readFileSync("online-rated-ui.js", "utf8");
  try {
    // 1) nobody voted yet, then the rival votes first: "me: not voted / rival: waiting" -> "rival: voted"
    {
      const t = await open(b, ui),
        p = t.page,
        stop = keepAlive(p);
      let s = await status(p);
      assert.match(s, /あなた：未投票/);
      assert.match(s, /相手：投票待ち/);
      assert.match(s, /残り\d+秒/);
      assert.equal(await aBtn(p).getAttribute("aria-pressed"), "false");
      assert.equal(await p.locator("[data-selected=true]").count(), 0);
      await set(p, `matches/${MID}/votes/${RIVAL}`, "A");
      await p.getByText("相手：投票済み", { exact: true }).waitFor({ timeout: 8000 });
      s = await status(p);
      assert.match(s, /あなた：未投票/, "my state is unchanged by the rival's vote");
      assert(await aBtn(p).isEnabled() && (await bBtn(p).isEnabled()), "both options stay votable");
      assert.equal(await p.locator("[data-selected=true]").count(), 0, "the rival's vote is never shown as mine");
      // 2) I vote the same mode -> both voted -> the match starts as that mode (vote screen gone)
      await aBtn(p).click();
      await p.locator("[data-om=vote]").waitFor({ state: "detached", timeout: 8000 });
      await started(p);
      stop();
      assert.deepEqual(t.errors, []);
      await t.ctx.close();
    }
    // 3) I vote first and the rival has not: my vote is marked by outline + text + aria-pressed, rival waiting
    {
      const t = await open(b, ui),
        p = t.page,
        stop = keepAlive(p);
      await bBtn(p).click();
      await p.getByText("あなた：Bに投票済み", { exact: true }).waitFor({ timeout: 8000 });
      const s = await status(p);
      assert.match(s, /相手：投票待ち/);
      assert.equal(await bBtn(p).getAttribute("aria-pressed"), "true");
      assert.equal(await aBtn(p).getAttribute("aria-pressed"), "false");
      assert.equal(await p.locator("[data-selected=true]").count(), 1);
      assert.match(await p.locator("[data-selected=true]").innerText(), /B：レース＋攻撃[\s\S]*投票済み/);
      assert.equal(await left(p), 1, "still waiting on the rival: no premature start");
      assert.equal(await p.locator("[role=alert]").count(), 0);
      // rival votes the other mode -> both voted, mode decided by the unchanged tie rule, match starts
      await set(p, `matches/${MID}/votes/${RIVAL}`, "A");
      await p.locator("[data-om=vote]").waitFor({ state: "detached", timeout: 8000 });
      await started(p);
      stop();
      assert.deepEqual(t.errors, []);
      await t.ctx.close();
    }
    // 4) communication trouble while voting: the write fails, the alert + retry appear, nothing is marked, retry succeeds
    {
      let failing = false,
        failed = 0;
      const t = await open(b, ui, {
          onOperation: async (op) => {
            if (failing && String(op.path).includes(`matches/${MID}`)) {
              failed++;
              throw new Error("mock network failure");
            }
          },
        }),
        p = t.page,
        stop = keepAlive(p);
      failing = true;
      await aBtn(p).click();
      await p.getByRole("alert").waitFor({ timeout: 20000 });
      assert(failed > 0);
      assert.equal(await p.locator("[data-selected=true]").count(), 0, "a failed vote is not shown as voted");
      assert.match(await status(p), /あなた：未投票/);
      assert.equal(await left(p), 1, "the vote screen stays so the player can retry");
      failing = false;
      await p.getByRole("button", { name: "再試行・最新結果を確認", exact: true }).click();
      await p.getByText("あなた：Aに投票済み", { exact: true }).waitFor({ timeout: 8000 });
      assert.equal(await p.getByRole("alert").count(), 0, "alert clears after the retry succeeds");
      stop();
      await t.ctx.close();
    }
    // 5) deadline: the countdown reaches 0 and the match starts by the unchanged deadline rule (random mode)
    {
      const t = await open(b, ui, { voteEnd: Date.now() + 3500 }),
        p = t.page,
        stop = keepAlive(p);
      let sawLow = false;
      for (let i = 0; i < 30 && (await left(p)); i++) {
        const txt = await status(p).catch(() => "");
        if (/残り[0-2]秒/.test(txt)) sawLow = true;
        await sleep(250);
      }
      assert(sawLow, "timer counted down to 0-2s before the deadline");
      assert.equal(await left(p), 0, "vote screen is replaced by the match once the deadline passes");
      await started(p);
      stop();
      assert.deepEqual(t.errors, []);
      await t.ctx.close();
    }
    // 6) the rival disappears (unseen > 8s): existing rule cancels before start and the UI explains it
    {
      const t = await open(b, ui),
        p = t.page;
      await set(p, `matches/${MID}/lastSeen/${RIVAL}`, Date.now() - 20000);
      await p.getByRole("alert").getByText("対戦開始前に相手が退出しました").waitFor({ timeout: 10000 });
      await p.getByRole("button", { name: "イージーで相手を探す", exact: true }).waitFor();
      assert.equal(await left(p), 0);
      await t.ctx.close();
    }
    console.log("PASS v6 vote states: rival-first, me-first, both voted, write failure + retry, deadline, rival left");
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
