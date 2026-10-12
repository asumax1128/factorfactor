// Browser interaction with synthetic data only; no production account/PIN/network.
const assert = require("node:assert/strict");
const { chromium, context } = require("./browser-harness.cjs");
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  });
  try {
    const name = "Existing",
      key =
        "a" +
        Array.from(name)
          .map((c) => c.codePointAt(0).toString(36))
          .join("_");
    const stats = {
      games: 4,
      w: 2,
      l: 2,
      rating: 1550,
      exp: 200,
      season: "2026-10",
    };
    const tree = {
      games: {
        factor: {
          accounts: {
            [key]: { name, stats: JSON.parse(JSON.stringify(stats)) },
          },
          pins: { [key]: "1234" },
        },
      },
    };
    const t = await context(browser, {
        account: null,
        tree,
        uid: "existing-uid",
      }),
      p = t.page;
    await p.getByPlaceholder("名前（10文字まで）").fill(name);
    await p.getByPlaceholder("合言葉（4桁の数字）").fill("1234");
    await p.getByRole("button", { name: "ログイン", exact: true }).click();
    await p.getByRole("button", { name: "スタート", exact: true }).waitFor();
    assert.equal(
      await p.evaluate(
        () => JSON.parse(localStorage.getItem("fxf_battle_account_v1")).key,
      ),
      key,
    );
    await p.reload();
    await p.getByRole("button", { name: "スタート", exact: true }).waitFor();
    assert.equal(
      await p.getByRole("button", { name: "数学の塔", exact: false }).count(),
      0,
    );
    assert.deepEqual(tree.games.factor.accounts[key].stats, stats);
    console.log(
      "PASS existing account login/reload, existing stats unchanged, no tower grant entry",
    );
    await p.getByRole("button", { name: "ランキング", exact: true }).click();
    await p.getByRole("heading", { name: "ランキング", exact: true }).waitFor();
    assert((await p.locator(".v7-modal-win").innerText()).includes("みんな"));
    assert.deepEqual(t.errors, []);
    console.log("PASS ranking window and mocked ranking fetch");
    await t.ctx.close();
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
