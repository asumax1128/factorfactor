const assert = require("node:assert/strict");
const { chromium, context, sleep } = require("./browser-harness.cjs");
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  });
  try {
    for (const width of [320, 390, 430, 1366]) {
      const tree = {
        games: {
          factor: {
            accounts: {
              ateacher: { name: "Teacher", stats: { rating: 1600, exp: 100 } },
              atarget: {
                name: "Target A",
                stats: { games: 5, w: 4, l: 1, streak: 4, rating: 1700 },
                prof: { lv: { L1: { n: 30, ok: 25, ms: 300000 } } },
              },
              aother: {
                name: "Target B",
                stats: { games: 4, w: 3, l: 1, streak: 3, rating: 1650 },
                prof: { lv: { L1: { n: 30, ok: 25, ms: 300000 } } },
              },
            },
            onlineSparkV1: { config: { enabled: true, protocol: "spark-v1" } },
          },
        },
      };
      const t = await context(browser, { tree }),
        p = t.page;
      await p.setViewportSize({ width, height: 844 });
      await p
        .getByRole("button", { name: "オンライン対戦（ロビー）", exact: true })
        .click();
      const bounty = p.getByRole("button", { name: /賞金首リスト/ });
      await bounty.waitFor();
      const before = await p.evaluate(() => ({
        html: document.documentElement.style.overflow,
        body: document.body.style.overflow,
        overscroll: document.body.style.overscrollBehavior,
      }));
      await bounty.click();
      await p
        .locator(".v7-modal-head h3")
        .filter({ hasText: "賞金首リスト" })
        .waitFor();
      assert.equal(await p.locator(".v7-modal").count(), 1);
      await p.getByRole("button", { name: "とじる", exact: true }).click();
      assert.equal(await p.locator(".v7-modal").count(), 0);
      const restored = () =>
        p.evaluate(() => ({
          html: document.documentElement.style.overflow,
          body: document.body.style.overflow,
          overscroll: document.body.style.overscrollBehavior,
        }));
      assert.deepEqual(await restored(), before);
      for (const name of ["Target A", "Target B"]) {
        await bounty.scrollIntoViewIfNeeded();
        const originalY = await p.evaluate(() => scrollY);
        await bounty.click();
        const row = p.locator(".v7-modal").getByText(name, { exact: true });
        // Repeated events in the same turn must replace one selection, never stack.
        if (name === "Target A") await row.tap();
        else
          await row.evaluate((e) => {
            e.click();
            e.click();
          });
        await p
          .getByText("賞金首のゴースト：勝利8 EXP・7日間休息", { exact: true })
          .waitFor();
        assert.equal(
          await p.locator(".v7-modal").count(),
          0,
          "list must unmount on selection",
        );
        assert.equal(
          await p.getByRole("button", { name: "とじる", exact: true }).count(),
          1,
          "exactly one profile",
        );
        await p.getByText(name, { exact: true }).waitFor();
        const close = p.getByRole("button", { name: "とじる", exact: true });
        assert(
          await close.evaluate((e) => {
            const r = e.getBoundingClientRect();
            return e.contains(
              document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2),
            );
          }),
          "no overlay may intercept the profile button",
        );
        const panel = close.locator("xpath=../..");
        await panel.evaluate((e) =>
          Promise.all(e.getAnimations().map((a) => a.finished)),
        );
        const y = await p.evaluate(() => scrollY);
        const box = await panel.boundingBox();
        const cdp = await p.context().newCDPSession(p);
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchStart",
          touchPoints: [
            { x: box.x + box.width / 2, y: box.y + box.height - 70 },
          ],
        });
        await sleep(80);
        for (let step = 1; step <= 6; step++) {
          await cdp.send("Input.dispatchTouchEvent", {
            type: "touchMove",
            touchPoints: [
              {
                x: box.x + box.width / 2,
                y: box.y + box.height - 70 - ((box.height - 150) * step) / 6,
              },
            ],
          });
          await sleep(35);
        }
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchEnd",
          touchPoints: [],
        });
        await cdp.detach();
        await sleep(150);
        assert(
          (await panel.evaluate((e) => e.scrollTop)) > 0,
          "profile must actually scroll with touch: " +
            JSON.stringify({
              width,
              name,
              box,
              metrics: await panel.evaluate((e) => ({
                scrollHeight: e.scrollHeight,
                clientHeight: e.clientHeight,
                scrollTop: e.scrollTop,
                touch: getComputedStyle(e).touchAction,
                tag: e.className,
              })),
            }),
        );
        assert.equal(
          await p.evaluate(() => scrollY),
          y,
          "background must not scroll",
        );
        await panel.evaluate((e) => (e.scrollTop = 0));
        await close.click();
        await p
          .getByRole("button", {
            name: "すぐ遊ぶ（ランダム対戦）",
            exact: true,
          })
          .waitFor();
        assert.equal(await p.locator(".v7-modal").count(), 0);
        assert.equal(
          await p.getByRole("button", { name: "とじる", exact: true }).count(),
          0,
        );
        assert.deepEqual(await restored(), before);
        assert.equal(
          await p.evaluate(() => scrollY),
          originalY,
          "closing restores the original background position",
        );
      }
      await p
        .getByRole("button", { name: "みんなの成績", exact: true })
        .click();
      await p
        .locator(".v7-modal")
        .getByText("Target A", { exact: true })
        .click();
      await p
        .getByText("学習記録から作ったゴースト（公式レートは変わりません）", {
          exact: true,
        })
        .waitFor();
      assert.equal(await p.locator(".v7-modal").count(), 0);
      await p.getByRole("button", { name: "とじる", exact: true }).click();
      assert.deepEqual(await restored(), before);
      await bounty.click();
      await p
        .locator(".v7-modal")
        .getByText("Target A", { exact: true })
        .click();
      await p
        .getByRole("button", { name: "イージーでゴースト対戦", exact: true })
        .click();
      await p.getByText("GHOST 乱入！", { exact: true }).waitFor();
      assert.equal(await p.locator(".v7-modal").count(), 0);
      const user = tree.games.factor.ghostV1.users.ateacher;
      assert.equal(
        user.matches[user.activeMatch].origin,
        "bounty",
        "closing list must not turn bounty match into profile match",
      );
      assert.equal(user.matches[user.activeMatch].members[0].key, "ateacher");
      assert.equal(user.matches[user.activeMatch].opponent.key, "atarget");
      await p
        .getByRole("button", { name: "開始前に退出", exact: true })
        .click();
      await p.getByRole("button", { name: "一覧へ戻る", exact: true }).click();
      await p
        .getByRole("button", { name: "すぐ遊ぶ（ランダム対戦）", exact: true })
        .waitFor();
      assert.deepEqual(await restored(), before);
      assert.equal(tree.games.factor.accounts.ateacher.stats.exp, 100);
      assert(!tree.games.factor.ghostV1.users.ateacher.bountyCooldowns);
      assert.deepEqual(t.errors, []);
      await t.ctx.close();
      console.log(
        `PASS bounty → one foreground profile, double tap, touch scroll/close/restore, second player, all-results and bounty ghost origin; width ${width}`,
      );
    }
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
