const assert = require("node:assert/strict"),
  fs = require("fs");
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
              ateacher: { name: "Teacher", stats: { rating: 1649.6 } },
              alegacy: { name: "Legacy", stats: { rating: 1800 } },
              anew: { name: "New", stats: { rating: 1950 } },
            },
            onlineSparkV1: {
              config: { enabled: true, protocol: "spark-v1" },
              profiles: {
                anew: {
                  name: "New",
                  easy: {
                    rating: 1490,
                    games: 5,
                    w: 3,
                    l: 2,
                    d: 0,
                    season: "2026-10",
                    maxRating: 1950,
                    seasonMax: 1950,
                  },
                  normal: {
                    rating: 1600,
                    games: 3,
                    w: 3,
                    l: 0,
                    d: 0,
                    season: "2026-10",
                    maxRating: 1600,
                    seasonMax: 1600,
                  },
                  migrationId: "spark-legacy-to-easy-v1",
                  initialRating: 1950,
                  initializedAt: Date.now(),
                },
              },
            },
          },
        },
      };
      const t = await context(b, { tree });
      const p = t.page;
      await p.setViewportSize({ width, height: width === 1366 ? 768 : 844 });
      await p
        .getByRole("button", { name: "オンライン対戦・CPU練習", exact: true })
        .click();
      await p
        .getByRole("button", { name: "すぐ遊ぶ（ランダム対戦）", exact: true })
        .click();
      await p
        .getByRole("button", { name: "イージーで相手を探す", exact: true })
        .waitFor();
      assert.equal(
        await p.getByRole("heading", { name: "すぐ遊ぶ", exact: true }).count(),
        1,
      );
      assert.equal(
        await p.getByText("自分のレーティング", { exact: true }).count(),
        0,
      );
      assert.equal(await p.locator(".or-ranking,.or-tabs,.or-self").count(), 0);
      assert.equal(
        await p
          .getByRole("button", { name: "旧総合レーティングの記録" })
          .count(),
        0,
      );
      const boxes = await p.locator("section > button").evaluateAll((es) =>
        es.map((e) => {
          let r = e.getBoundingClientRect();
          return { x: r.x, y: r.y, w: r.width, h: r.height };
        }),
      );
      assert.equal(boxes.length, 2);
      assert.ok(boxes[1].y >= boxes[0].y + boxes[0].h);
      assert.ok(
        boxes.every((r) => r.h >= 44 && r.x >= 0 && r.x + r.w <= width),
      );
      await p
        .getByRole("button", { name: "オンラインへ戻る", exact: true })
        .click();
      await p
        .getByRole("button", { name: "オンラインレーティング", exact: true })
        .click();
      await p
        .getByRole("heading", { name: "オンラインレーティング", exact: true })
        .waitFor();
      await p.waitForFunction(
        () => document.querySelector(".or-rating")?.textContent === "1,649.6",
      );
      assert.equal(
        await p.getByRole("button", { name: /相手を探す/ }).count(),
        0,
      );
      assert.ok((await p.locator(".or-rule").innerText()).includes("1501以上"));
      let rows = await p.locator(".or-ranking").innerText();
      assert.ok(rows.includes("Legacy"));
      assert.ok(!rows.includes("New"));
      assert.ok(rows.includes("Teacher"));
      await p.getByRole("button", { name: "ノーマル", exact: true }).click();
      assert.equal(await p.locator(".or-rating").innerText(), "1,500");
      assert.match(await p.locator(".or-rule").innerText(), /3戦以上/);
      assert.match(await p.locator(".or-ranking").innerText(), /New/);
      assert.deepEqual(tree.games.factor.accounts.alegacy, {
        name: "Legacy",
        stats: { rating: 1800 },
      });
      assert.ok(!tree.games.factor.onlineSparkV1.profiles.alegacy);
      assert.equal(
        await p.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      assert.deepEqual(t.errors, []);
      await p.screenshot({ path: `/tmp/online-rating-${width}.png` });
      await t.ctx.close();
      console.log(
        "PASS split routes, rating-only/no-match, read-only legacy projection and viewport",
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
