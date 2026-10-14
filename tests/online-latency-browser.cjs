const assert = require("node:assert/strict"),
  fs = require("node:fs");
const { chromium, context, pair, sleep } = require("./browser-harness.cjs");
const ui =
  (process.env.PLAYABILITY_UI_FILE
    ? fs.readFileSync(process.env.PLAYABILITY_UI_FILE, "utf8")
    : fs.readFileSync("online-rated-ui.js", "utf8")) +
  `\n(function(){const factory=window.OnlineRatedFactory;window.OnlineRatedFactory=H=>{window.__onlineHelpers=H;const merge=H.CombatFX.merge;H.CombatFX.merge=(...args)=>{window.__mergeCalls=(window.__mergeCalls||0)+1;return merge(...args);};const create=H.createTransport;H.createTransport=acct=>{const client=create(acct);window.__onlineClient=client;return {close:()=>client.close(),request:async cmd=>{window.__lastCommand=cmd;if(cmd.type==='heartbeat'){if(window.__failHeartbeat){window.__failHeartbeat=false;throw Error('通信断テスト');}window.__polling=true;await new Promise(r=>setTimeout(r,650));}if(cmd.type==='answer'){window.__sendAt=performance.now();await new Promise(r=>setTimeout(r,650));}try{const v=await client.request(cmd);window.__onlineState=v;return v;}finally{window.__polling=false;}}};};return factory(H);};})();`;
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
    assetOverrides: {
      "/online-rated-ui.js": ui,
      ...(process.env.PLAYABILITY_SPARK_FILE
        ? {
            "/online-spark.js": fs.readFileSync(
              process.env.PLAYABILITY_SPARK_FILE,
              "utf8",
            ),
          }
        : {}),
    },
  });
  await t.page
    .getByRole("button", { name: "オンライン対戦・CPU練習", exact: true })
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

(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    const t = await open(b, "easy", "profile", "ghost"),
      p = t.page;
    await p.getByText("GHOST 乱入！", { exact: true }).waitFor();
    await sleep(2300);
    await p.evaluate(() => {
      window.__countdownValues = [];
      new MutationObserver(() => {
        const value = document.querySelector(".or-countdown")?.textContent;
        if (value && window.__countdownValues.at(-1) !== value)
          window.__countdownValues.push(value);
      }).observe(document.body, {
        subtree: true,
        childList: true,
        characterData: true,
      });
    });
    await p.getByRole("button", { name: "A：早い者勝ち", exact: true }).click();
    await p.locator(".or-countdown").waitFor();
    const first = await p.locator(".or-countdown").textContent();
    await p.waitForFunction(
      () =>
        document.querySelector(".or-battle")?.dataset.onlineReady === "true",
    );
    await p.evaluate(() => {
      window.OnlineSpark.performance?.setEnabled(true);
      window.__feedbackAt = null;
      new MutationObserver(() => {
        if (
          !window.__feedbackAt &&
          document.querySelector(".or-timing")?.textContent
        )
          window.__feedbackAt = performance.now();
      }).observe(document.querySelector(".or-feedback"), {
        childList: true,
        subtree: true,
        characterData: true,
      });
      document.addEventListener(
        "pointerup",
        () => (window.__releaseAt = performance.now()),
        { capture: true },
      );
    });
    const before = t.writes.length;
    await touchPair(p);
    await p.waitForFunction(() => window.__feedbackAt);
    await sleep(500);
    console.log(
      JSON.stringify({
        firstCountdown: first,
        countdownValues: await p.evaluate(() => window.__countdownValues),
        latency: await p.evaluate(() => ({
          releaseToFeedbackMs: window.__feedbackAt - window.__releaseAt,
          events: window.OnlineSpark.performance?.events,
        })),
        writes: t.writes.slice(before).map((x) => ({
          kind: x.kind,
          bytes: Buffer.byteLength(JSON.stringify(x.v)),
        })),
      }),
    );
    const seen = await p.evaluate(() => window.__countdownValues);
    if (!process.env.PLAYABILITY_UI_FILE) {
      assert.deepEqual(seen, ["READY", "3", "2", "1", "GO!"]);
      const ms = await p.evaluate(
        () => window.__feedbackAt - window.__releaseAt,
      );
      assert(
        ms < 100,
        `local feedback must not wait for injected 650ms network delay: ${ms}`,
      );
    }
    await t.ctx.close();
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
