// Legacy in-flight B v1/manual-special regression. New timed B2 is covered by v524 tests.
const assert = require("node:assert/strict"),
  fs = require("node:fs");
const { chromium, context, pair, sleep } = require("./browser-harness.cjs");
const ui =
  (process.env.PLAYABILITY_UI_FILE
    ? fs.readFileSync(process.env.PLAYABILITY_UI_FILE, "utf8")
    : fs.readFileSync("online-rated-ui.js", "utf8")) +
  `\n(function(){const factory=window.OnlineRatedFactory;window.OnlineRatedFactory=H=>{window.__onlineHelpers=H;const merge=H.CombatFX.merge;H.CombatFX.merge=(...args)=>{window.__mergeCalls=(window.__mergeCalls||0)+1;return merge(...args);};const create=H.createTransport;H.createTransport=acct=>{const client=create(acct);window.__onlineClient=client;return {close:()=>client.close(),request:async cmd=>{window.__lastCommand=cmd;if(cmd.type==='heartbeat'){if(window.__failHeartbeat){window.__failHeartbeat=false;throw Error('通信断テスト');}window.__polling=true;await new Promise(r=>setTimeout(r,650));}try{const v=await client.request(cmd);window.__onlineState=v;return v;}finally{window.__polling=false;}}};};return factory(H);};})();`;
async function open(
  browser,
  difficulty = "easy",
  origin = "quick",
  kind = "ghost",
) {
  const tree = {
    games: {
      factor: {
        accounts: {
          ateacher: { name: "Teacher", stats: { rating: 1649.6, exp: 100 } },
          atarget: {
            name: "Target",
            stats: { rating: 1761.9, streak: 3 },
            prof: { lv: { L1: { n: 30, ok: 25, ms: 300000 } } },
          },
        },
        onlineSparkV1: { config: { enabled: true, protocol: "spark-v1" } },
      },
    },
  };
  const t = await context(browser, {
    tree,
    assetOverrides: { "/online-rated-ui.js": ui,"/online-spark.js": fs.readFileSync("online-spark.js","utf8")+"\n(()=>{const c=window.OnlineSpark.create;window.OnlineSpark.create=o=>c({...o,modernB:false});})();" },
  });
  await t.page
    .getByRole("button", { name: "オンライン対戦（ロビー）", exact: true })
    .click();
  await t.page.evaluate((kind) => {
    const H = window.__onlineHelpers;
    const old = H.createTransport;
    H.createTransport = (acct) => {
      const saved = Math.random;
      Math.random = () => ({ ghost: 0.5, hyper: 0.98, bot: 0.92 })[kind];
      const out = old(acct);
      Math.random = saved;
      return out;
    };
  }, kind);
  if (origin !== "quick") {
    await t.page
      .getByRole("button", { name: "オンラインレーティング", exact: true })
      .click();
    await t.page.getByRole("button", { name: "Target", exact: true }).click();
    await t.page
      .getByRole("button", {
        name:
          { easy: "イージー", normal: "ノーマル" }[difficulty] +
          "でゴースト対戦",
        exact: true,
      })
      .click();
    return t;
  }
  await t.page
    .getByRole("button", { name: "すぐ遊ぶ（ランダム対戦）", exact: true })
    .click();
  await t.page
    .getByRole("button", {
      name:
        { easy: "イージー", normal: "ノーマル" }[difficulty] + "で相手を探す",
      exact: true,
    })
    .click();
  return t;
}
async function touchPair(page, long = false, correct = true) {
  const ids = await pair(page, correct);
  assert(ids, "a correct factor pair must exist");
  const a = await page.locator(`[data-btile="${ids[0]}"]`).boundingBox(),
    b = await page.locator(`[data-btile="${ids[1]}"]`).boundingBox();
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: a.x + a.width / 2, y: a.y + a.height / 2 }],
  });
  await sleep(long ? 1200 : 60); // Preserve the finger across polling, or use a quick swipe.
  assert.equal(
    await page.locator(".or-battle svg line").count(),
    1,
    "shared CPU drag feedback must be visible",
  );
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: b.x + b.width / 2, y: b.y + b.height / 2 }],
  });
  await sleep(30);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await cdp.detach();
}
async function play(browser, difficulty, mode, kind, origin = "quick") {
  const t = await open(browser, difficulty, origin, kind),
    p = t.page;
  await p
    .getByText(
      kind === "hyper"
        ? "HYPER GHOST 乱入！"
        : kind === "bot"
          ? "BOT 乱入！"
          : "GHOST 乱入！",
      { exact: true },
    )
    .waitFor({ timeout: 20000 });
  await p.waitForFunction(() => window.__polling === true);
  assert(
    await p
      .getByRole("button", {
        name: mode === "A" ? "A：早い者勝ち" : "B：レース＋攻撃",
        exact: true,
      })
      .isEnabled(),
    "vote must remain enabled during polling",
  );
  await p
    .getByRole("button", {
      name: mode === "A" ? "A：早い者勝ち" : "B：レース＋攻撃",
      exact: true,
    })
    .click();
  await p.locator("[data-btile]").first().waitFor();
  await p.waitForFunction(() => {
    const m = window.__onlineState?.match;
    return (
      m?.game &&
      Date.now() + window.__onlineHelpers.FB.off >=
        Math.max(m.game.startAt, m.game.readyAt || 0) &&
      !document.querySelector(".or-countdown") &&
      (!document
        .querySelector(".or-battle")
        ?.hasAttribute("data-online-ready") ||
        document.querySelector(".or-battle").dataset.onlineReady === "true")
    );
  });
  const box = await p.locator("[data-btile]").first().boundingBox();
  if (!process.env.PLAYABILITY_UI_FILE)
    assert(
      box.height >= 100,
      "factor tiles should fill the CPU practice play area",
    );
  for (const [width, height] of [
    [320, 568],
    [390, 700],
    [430, 844],
    [1366, 768],
  ]) {
    await p.setViewportSize({ width, height });
    const bounds = await p.locator("[data-btile]").evaluateAll((nodes) =>
      nodes.map((n) => {
        const b = n.getBoundingClientRect();
        return { bottom: b.bottom, top: b.top, height: b.height };
      }),
    );
    if (!bounds.every((b) => b.height >= 60))
      await p.screenshot({ path: "/tmp/v514-small-debug.png" });
    assert(
      bounds.every((b) => b.top >= 0 && b.bottom <= height && b.height >= 60),
      "all actual tiles must fit without scrolling: " +
        JSON.stringify({ width, height, bounds }),
    );
    assert(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      "no horizontal overflow",
    );
  }
  await p.setViewportSize({ width: 390, height: 844 });
  await p.waitForFunction(
    () => document.querySelector(".or-battle")?.dataset.onlineReady === "true",
  );
  await p.screenshot({
    path: `/tmp/online-v513-play-${difficulty}-${mode}-${kind}-${origin}.png`,
  });
  const initialQuestion = await p.evaluate(
    () => window.__onlineState.match.game.question,
  );
  // A contact ending on the same card, separate taps, or empty space is not an answer.
  const seqBeforeTaps = await p.evaluate(
    () => window.__onlineState.match.game.acceptedSeq,
  );
  const tapIds = await pair(p);
  const tapBoxes = await Promise.all(
    tapIds.map((id) => p.locator(`[data-btile="${id}"]`).boundingBox()),
  );
  const clear = async () => {
    await p.waitForFunction(
      () =>
        [...document.querySelectorAll("[data-btile]")].every(
          (e) => e.style.transform === "none",
        ) && !document.querySelector(".or-battle svg line"),
    );
    assert.equal(
      await p.evaluate(() => window.__onlineState.match.game.acceptedSeq),
      seqBeforeTaps,
      "tap/invalid release must not submit an answer",
    );
    assert.equal(
      await p.evaluate(() => window.__onlineState.match.game.question),
      initialQuestion,
    );
  };
  await p.touchscreen.tap(
    tapBoxes[0].x + tapBoxes[0].width / 2,
    tapBoxes[0].y + tapBoxes[0].height / 2,
  );
  await clear();
  await p.touchscreen.tap(
    tapBoxes[1].x + tapBoxes[1].width / 2,
    tapBoxes[1].y + tapBoxes[1].height / 2,
  );
  await clear();
  const invalid = await p.context().newCDPSession(p);
  await invalid.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      {
        x: tapBoxes[0].x + tapBoxes[0].width / 2,
        y: tapBoxes[0].y + tapBoxes[0].height / 2,
      },
    ],
  });
  await sleep(60);
  await invalid.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: 2, y: 2 }],
  });
  await sleep(30);
  await invalid.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await invalid.detach();
  await clear();
  console.log(
    `PASS single/separate taps and outside release clear without answering: ${difficulty}/${mode}/${kind}/${origin}`,
  );
  const mergeBefore = await p.evaluate(() => window.__mergeCalls || 0);
  const initial = await p.evaluate(
    () => window.__onlineState.match.game.acceptedSeq,
  );
  await touchPair(p, true);
  await p.waitForFunction(
    (n) => window.__onlineState.match.game?.acceptedSeq > n,
    initial,
    { timeout: 10000 },
  );
  const snapshot = await p.evaluate(() => window.__onlineState.match);
  assert(
    mode === "A"
      ? snapshot.game.live[snapshot.selfUid] > 0
      : snapshot.game.live[snapshot.selfUid].c > 0,
    "touch drag across poll must actually solve a problem",
  );
  if (mode === "B" && origin === "quick") {
    await p.evaluate(() => {
      window.__failHeartbeat = true;
    });
    await p.getByText("通信断テスト", { exact: true }).waitFor();
    await p
      .getByRole("button", { name: "再試行・最新結果を確認", exact: true })
      .click();
    await p.waitForFunction(() => !document.querySelector('[role="alert"]'));
  }
  assert(
    (await p.evaluate(() => window.__mergeCalls || 0)) > mergeBefore,
    "accepted touch answer must trigger the actual shared merge effect",
  );
  const firstQuestion = initialQuestion;
  await p.waitForFunction(
    (q) => window.__onlineState.match.game?.question !== q,
    firstQuestion,
    { timeout: 10000 },
  );
  let usedSpecial = false;
  for (let n = 0; n < 45; n++) {
    const state = await p.evaluate(() => window.__onlineState);
    if (state.match.phase === "settled") break;
    await p.waitForFunction(() => {
      const m = window.__onlineState.match;
      return (
        m.phase === "settled" ||
        (m.game &&
          !m.game.resolving &&
          Date.now() + window.__onlineHelpers.FB.off >=
            Math.max(m.game.startAt, m.game.readyAt || 0) &&
          !document.querySelector(".or-countdown"))
      );
    });
    const before = await p.evaluate(() => window.__onlineState.match);
    if (before.phase === "settled") break;
    await p.waitForFunction(() => {
      const g = window.__onlineState.match.game;
      const el = document.querySelector("[data-poly]");
      return (
        document.querySelector(".or-battle")?.dataset.onlineReady === "true" &&
        el?.dataset.poly === JSON.stringify(g.poly)
      );
    });
    if (
      mode === "B" &&
      !usedSpecial &&
      (await p.locator('[data-sp="heal"]').isEnabled())
    ) {
      await p.locator('[data-sp="heal"]').click();
      await p.waitForFunction(
        (n) => window.__onlineState.match.game?.acceptedSeq > n,
        before.game.acceptedSeq,
      );
      const after = await p.evaluate(() => window.__onlineState.match);
      assert.equal(
        after.game.live[after.selfUid].sp,
        0,
        "special must consume the full meter exactly once",
      );
      usedSpecial = true;
      continue;
    }
    if (mode === "B" && n === 0) {
      await touchPair(p, false, false);
      await p.waitForFunction(
        (n) => window.__onlineState.match.game?.acceptedSeq > n,
        before.game.acceptedSeq,
      );
      const wrong = await p.evaluate(() => window.__onlineState.match);
      assert.equal(
        wrong.game.live[wrong.selfUid].c,
        before.game.live[before.selfUid].c,
        "wrong answer must not count as solved",
      );
      assert.equal(
        wrong.game.question,
        before.game.question,
        "wrong answer must retain question",
      );
      continue;
    }
    await touchPair(p);
    await p.waitForFunction(
      (n) =>
        window.__onlineState.match.phase === "settled" ||
        window.__onlineState.match.game?.acceptedSeq > n,
      before.game.acceptedSeq,
      { timeout: 10000 },
    );
    try {
      await p.waitForFunction(
        (q) =>
          window.__onlineState.match.phase === "settled" ||
          window.__onlineState.match.game?.question !== q,
        before.game.question,
        { timeout: 10000 },
      );
    } catch (e) {
      console.log(
        "failed progress",
        await p.evaluate(() => ({
          state: window.__onlineState,
          command: window.__lastCommand,
          alert: document.querySelector("[role=alert]")?.textContent,
        })),
      );
      throw e;
    }
  }
  await p.getByRole("heading", { name: /勝利|敗北|引き分け/ }).waitFor();
  const result = await p.evaluate(() => window.__onlineState);
  assert.equal(result.match.phase, "settled");
  assert.equal(
    result.ratings[difficulty].games,
    0,
    "ghost games must not count as human matches",
  );
  assert.equal(
    result.ratings[difficulty === "easy" ? "normal" : "easy"].rating,
    difficulty === "easy" ? 1500 : 1649.6,
  );
  if (origin !== "quick")
    assert.equal(result.match.receipt.players.ateacher.delta, 0);
  else assert(Math.abs(result.match.receipt.players.ateacher.delta) <= 10.7);
  const saved = t.tree.games.factor.accounts.ateacher.stats.exp;
  await p.evaluate(async () => {
    const id = window.__onlineState.match.id;
    await window.__onlineClient.request({ type: "status", matchId: id });
    await window.__onlineClient.request({ type: "status", matchId: id });
  });
  assert.equal(
    t.tree.games.factor.accounts.ateacher.stats.exp,
    saved,
    "replayed result must not award XP twice",
  );
  if (origin === "quick") {
    await p
      .getByRole("button", {
        name:
          kind === "hyper" ? "オンラインへ戻る" : "オンラインメニューへ戻る",
        exact: true,
      })
      .click();
    await p
      .getByRole("button", { name: "すぐ遊ぶ（ランダム対戦）", exact: true })
      .click();
    await p
      .getByRole("button", { name: "イージーで相手を探す", exact: true })
      .waitFor();
    assert.equal(
      await p.locator("[data-result-kind]").count(),
      0,
      "fresh quick entry must not replay the previous result",
    );
    assert.equal(await p.locator(".or-search-icon").count(), 0);
  }
  assert.deepEqual(t.errors, []);
  await p.screenshot({
    path: `/tmp/online-v513-${difficulty}-${mode}-${kind}-${origin}.png`,
  });
  await t.ctx.close();
  console.log(
    `PASS touch solve→next questions→real engine result: ${difficulty}/${mode}/${kind}/${origin}; ratings and XP once`,
  );
}
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  });
  try {
    if (
      !process.env.PLAYABILITY_DRAG_ONLY &&
      !process.env.PLAYABILITY_NORMAL_ONLY
    ) {
      const t = await open(b),
        p = t.page;
      await p.waitForFunction(() => window.__polling === true);
      assert(
        await p
          .getByRole("button", { name: "検索をキャンセル", exact: true })
          .isEnabled(),
        "background heartbeat must not disable cancel",
      );
      await p
        .getByRole("button", { name: "検索をキャンセル", exact: true })
        .click();
      await p
        .getByRole("button", { name: "イージーで相手を探す", exact: true })
        .waitFor();
      await sleep(11000);
      assert.equal(
        await p.getByText("GHOST 乱入！", { exact: true }).count(),
        0,
      );
      assert.equal(
        t.tree.games.factor.onlineSparkV1.profiles.ateacher.easy.games,
        0,
      );
      await t.ctx.close();
      console.log(
        "PASS delayed heartbeat: cancel remains available, no intrusion/loss",
      );
    }
    if (
      !process.env.PLAYABILITY_DRAG_ONLY &&
      !process.env.PLAYABILITY_NORMAL_ONLY
    ) {
      const edge = await open(b),
        ep = edge.page;
      await ep.waitForFunction(
        () =>
          window.__onlineState?.ticket &&
          window.__polling &&
          Date.now() - window.__onlineState.searchStarted >= 5000,
        {},
        { timeout: 20000 },
      );
      await ep
        .getByRole("button", { name: "検索をキャンセル", exact: true })
        .click();
      await ep
        .getByRole("button", { name: "イージーで相手を探す", exact: true })
        .waitFor();
      assert.equal(
        edge.tree.games.factor.onlineSparkV1.profiles.ateacher.easy.rating,
        1649.6,
      );
      assert.equal(
        edge.tree.games.factor.onlineSparkV1.profiles.ateacher.easy.games,
        0,
      );
      assert.equal(
        Object.keys(
          edge.tree.games.factor.ghostV1?.users?.ateacher?.events || {},
        ).length,
        0,
      );
      await edge.ctx.close();
      console.log(
        "PASS cancel at the 5-second intrusion boundary cannot start a second game or cause a loss",
      );
      const pre = await open(b, "easy", "profile"),
        pp = pre.page;
      await pp.getByText("GHOST 乱入！", { exact: true }).waitFor();
      await pp
        .getByRole("button", { name: "A：早い者勝ち", exact: true })
        .click();
      await pp.locator(".or-countdown").waitFor();
      await pp.getByRole("button", { name: "✕ 退出", exact: true }).click();
      await pp
        .getByRole("button", { name: "指名対戦を再試行", exact: true })
        .waitFor();
      assert.equal(
        pre.tree.games.factor.onlineSparkV1.profiles.ateacher.easy.rating,
        1649.6,
      );
      assert.equal(
        Object.keys(pre.tree.games.factor.ghostV1.users.ateacher.events || {})
          .length,
        0,
      );
      await pre.ctx.close();
      console.log(
        "PASS countdown exit button cancels without a defeat confirmation or rating loss",
      );
      const t = await open(b, "easy", "profile"),
        p = t.page;
      await p.getByText("GHOST 乱入！", { exact: true }).waitFor();
      await p.evaluate(() => {
        window.__onlineHelpers.BattleSurface = undefined;
      });
      await p
        .getByRole("button", { name: "B：レース＋攻撃", exact: true })
        .click();
      await p.getByText(/対戦画面を読み込めませんでした/).waitFor();
      await p
        .getByRole("button", {
          name: "初期化失敗の対戦を安全に中断",
          exact: true,
        })
        .click();
      await p
        .getByRole("button", { name: "指名対戦を再試行", exact: true })
        .waitFor();
      assert.equal(
        t.tree.games.factor.onlineSparkV1.profiles.ateacher.easy.rating,
        1649.6,
      );
      assert.equal(t.tree.games.factor.accounts.ateacher.stats.exp, 100);
      assert.equal(
        Object.keys(t.tree.games.factor.ghostV1.users.ateacher.events || {})
          .length,
        0,
      );
      await t.ctx.close();
      console.log(
        "PASS render initialization failure safely cancels without defeat, rating or XP",
      );
    }
    if (process.env.PLAYABILITY_SAFETY_ONLY) return;
    for (const args of process.env.PLAYABILITY_NORMAL_ONLY
      ? [["normal", "B", "ghost", "profile"]]
      : process.env.PLAYABILITY_DRAG_ONLY
        ? [["easy", "B", "ghost"]]
        : [
            ["easy", "A", "ghost"],
            ["easy", "B", "hyper"],
            ["normal", "A", "bot"],
            ["normal", "B", "ghost"],
            ["easy", "A", "ghost", "profile"],
            ["normal", "B", "ghost", "profile"],
          ])
      await play(b, ...args);
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
