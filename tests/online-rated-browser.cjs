const assert = require("node:assert/strict"),
  C = require("../server/online-rated/core.cjs");
const {
  createService,
  PRIVATE,
} = require("../server/online-rated/service.cjs");
const { chromium, context, sleep, drag } = require("./browser-harness.cjs");
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  });
  const ts = Date.now(),
    endpoint =
      "https://asia-southeast1-asumath-games.cloudfunctions.net/onlineRated";
  let state = C.migrate(
    null,
    {
      aa: { name: "A", stats: { rating: 1800 } },
      ab: { name: "B", stats: { rating: 1620 } },
    },
    "test",
    ts,
  );
  state.enabled = true;
  state.migrationReady = true;
  const db = {
    ref: (path) => ({
      on() {},
      off() {},
      async get() {
        return {
          val: () => (path === PRIVATE ? state : { name: "Fixture" }),
          exists: () => /^games\/factor\/logins\/(aa\/ua|ab\/ub)$/.test(path),
        };
      },
      async transaction(fn) {
        assert.equal(path, PRIVATE);
        const next = fn(state);
        if (next === undefined) return { committed: false };
        state = next;
        return { committed: true, snapshot: { val: () => C.copy(state) } };
      },
    }),
  };
  const service = createService({
    db,
    verifyToken: async (token) => {
      if (!["ua", "ub"].includes(token)) throw Error("AUTH_REQUIRED");
      return { uid: token };
    },
  });
  const tree = {
    games: {
      factor: {
        onlineRatedV2: { config: { enabled: true, protocol: 2, endpoint } },
        accounts: { aa: { name: "A" }, ab: { name: "B" } },
      },
    },
  };
  const peers = [];
  let staleOnce = true;
  try {
    const aa = await context(browser, {
        tree,
        uid: "ua",
        account: { key: "aa", name: "A" },
        peers,
      }),
      bb = await context(browser, {
        tree,
        uid: "ub",
        account: { key: "ab", name: "B" },
        peers,
      });
    for (const [t, uid] of [
      [aa, "ua"],
      [bb, "ub"],
    ]) {
      await t.ctx.route(endpoint, async (route) => {
        const body = route.request().postDataJSON();
        if (uid === "ua" && body.command.type === "answer" && staleOnce) {
          staleOnce = false;
          return route.fulfill({
            status: 400,
            json: { error: "STALE_QUESTION" },
          });
        }
        try {
          const result = await service(uid, body);
          await route.fulfill({ json: result });
        } catch (e) {
          await route.fulfill({ status: 400, json: { error: e.message } });
        }
      });
      await t.page.evaluate((uid) => {
        const original = firebase.auth;
        firebase.auth = (...args) => ({
          ...original(...args),
          currentUser: { getIdToken: async () => uid },
        });
      }, uid);
      await t.page
        .getByRole("button", { name: "オンライン対戦・CPU練習", exact: true })
        .click();
      await t.page
        .getByRole("button", { name: "すぐ遊ぶ（ランダム対戦）", exact: true })
        .click();
      await t.page
        .getByRole("button", { name: "EASYで相手を探す", exact: true })
        .waitFor();
    }
    await aa.page.getByText("EASY：1800", { exact: false }).waitFor();
    await aa.page.getByText("NORMAL：1500", { exact: false }).waitFor();
    await aa.page
      .getByRole("button", { name: "EASYで相手を探す", exact: true })
      .click();
    await bb.page
      .getByRole("button", { name: "NORMALで相手を探す", exact: true })
      .click();
    assert.equal(Object.keys(state.matches).length, 0);
    await bb.page
      .getByRole("button", { name: "検索をキャンセル", exact: true })
      .click();
    await bb.page
      .getByRole("button", { name: "EASYで相手を探す", exact: true })
      .click();
    for (const t of [aa, bb]) {
      await t.page
        .getByRole("button", { name: "A：早い者勝ち", exact: true })
        .waitFor();
      assert.equal(
        await t.page
          .getByRole("button", { name: "NORMALを選ぶ", exact: true })
          .count(),
        0,
      );
      await t.page
        .getByRole("button", { name: "A：早い者勝ち", exact: true })
        .click();
    }
    for (const t of [aa, bb]) {
      await t.page.locator(".or-battle").waitFor();
      assert.equal(await t.page.locator(".or-battle [data-btile]").count(), 6);
    }
    assert.equal(Object.values(state.matches)[0].difficulty, "easy");
    await sleep(4300);
    await drag(aa.page);
    assert.equal(staleOnce, false);
    await aa.page.waitForFunction(
      () => !document.querySelector('.or-app [role="alert"]'),
    );
    await sleep(300);
    await drag(aa.page);
    assert.equal(Object.values(state.matches)[0].game.claims.length, 1);
    console.log(
      "PASS real card drag, stale-question recovery resets accepted sequence, next answer accepted once",
    );
    await aa.page.getByRole("button", { name: "EASY", exact: true }).click();
    await aa.page.getByRole("button", { name: "NORMAL", exact: true }).click();
    for (const t of [aa, bb]) {
      assert.deepEqual(t.errors, []);
      await t.ctx.close();
    }
    console.log(
      "PASS real game entry → difficulty selection, legacy 1800/1500 display, separate queues, scoped cancel, A/B-only vote and six cards",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
