const assert = require("node:assert/strict");
const { chromium, context } = require("./browser-harness.cjs");
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  });
  try {
    for (const width of [320, 390, 430, 1366]) {
      const tree = {
        games: {
          factor: {
            accounts: {
              ateacher: {
                name: "Teacher",
                stats: { rating: 1649.6, exp: 100 },
                prof: { lv: { L1: { n: 10, ok: 8, ms: 32000, bestMs: 1200 } } },
              },
              atarget: {
                name: "Target",
                stats: {
                  rating: 1800,
                  streak: 3,
                  ghostTitles: { hyper_slayer: true },
                },
                prof: { lv: { L1: { n: 20, ok: 18, ms: 90000 } } },
              },
              anone: { name: "NoData", stats: { rating: 1540 } },
            },
            onlineSparkV1: { config: { enabled: true, protocol: "spark-v1" } },
            ghostV1: {
              users: {
                ateacher: {
                  events: {
                    g: {
                      id: "g",
                      opponent: "Target",
                      type: "hyper",
                      difficulty: "easy",
                      mode: "B",
                      outcome: "w",
                      exp: 8,
                      delta: 6,
                      at: Date.now(),
                    },
                  },
                },
              },
              inbox: {
                ateacher: {
                  x: {
                    id: "x",
                    by: "Target",
                    type: "ghost",
                    difficulty: "normal",
                    mode: "A",
                    outcome: "w",
                    at: Date.now(),
                  },
                },
              },
            },
            eventHosts: {
              ateacher: { enabled: true, tournament: true, raid: false },
            },
          },
        },
      };
      const t = await context(b, { tree }),
        p = t.page;
      await p.setViewportSize({ width, height: 844 });
      await p.getByRole("button", { name: /学びの部屋/ }).click();
      await p.getByText("最高速 1.20秒", { exact: true }).waitFor();
      assert.equal(await p.getByText("最高速 ―", { exact: true }).count(), 8);
      await p.reload();
      await p.getByRole("button", { name: "成績", exact: true }).click();
      await p.getByText("ゴースト対戦履歴", { exact: true }).waitFor();
      assert.match(await p.locator("body").innerText(), /ハイパーゴースト/);
      await p.getByRole("button", { name: "自分の分身", exact: true }).click();
      await p
        .getByRole("button", { name: "分身の新しい結果・勝利EXPを受け取る" })
        .click();
      await p.getByText(/新しい分身の結果を受け取りました/).waitFor();
      await p.getByText(/確認済みの分身通算：1戦/).waitFor();
      await p
        .getByRole("button", { name: "分身の新しい結果・勝利EXPを受け取る" })
        .click();
      assert.equal(tree.games.factor.accounts.ateacher.stats.exp, 105);
      await p.reload();
      await p
        .getByRole("button", { name: "オンライン対戦・CPU練習", exact: true })
        .click();
      await p
        .getByRole("button", { name: "クラス大会を開催", exact: true })
        .waitFor();
      assert.equal(
        await p
          .getByRole("button", { name: "クラス協力レイドを開催", exact: true })
          .count(),
        0,
      );
      assert.equal(
        await p.getByRole("button", { name: /先生用ダッシュボード/ }).count(),
        0,
      );
      await p
        .getByRole("button", { name: "オンラインレーティング", exact: true })
        .click();
      await p.locator(".or-ranking").waitFor();
      await p.getByRole("button", { name: "Target", exact: true }).click();
      await p
        .getByRole("button", { name: "イージーでゴースト対戦", exact: true })
        .click();
      await p.getByText("GHOST 乱入！", { exact: true }).waitFor();
      await p.getByRole('heading',{name:'指名ゴースト対戦',exact:true}).waitFor();
      assert.equal(await p.getByRole('button',{name:/で相手を探す/}).count(),0);
      await p
        .getByRole("button", { name: "B：レース＋攻撃", exact: true })
        .click();
      await p.locator("[data-btile]").first().waitFor();
      assert.equal(
        await p.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      assert.deepEqual(t.errors, []);
      await p.screenshot({ path: `/tmp/ghost-ui-${width}.png` });
      await t.ctx.close();
      console.log(
        "PASS fastest, private histories/reward once, student scope UI, player ghost selection, iPhone-width",
        width,
      );
    }
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
