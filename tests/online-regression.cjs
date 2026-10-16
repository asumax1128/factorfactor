// Existing online/teacher routes, with every external request intercepted.
const assert = require("node:assert/strict");
const { chromium, context, drag, sleep } = require("./browser-harness.cjs");
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  });
  try {
    const peers = [],
      tree = {
        games: {
          factor: {
            teachers: { ah: { name: "Host" } },
            accounts: { ah: { name: "Host" }, ag: { name: "Guest" } },
          },
        },
      };
    const h = await context(b, {
        tree,
        peers,
        uid: "host",
        account: { key: "ah", name: "Host" },
      }),
      g = await context(b, {
        tree,
        peers,
        uid: "guest",
        account: { key: "ag", name: "Guest" },
      });
    for (const t of [h, g])
      await t.page
        .getByRole("button", { name: "オンライン対戦・CPU練習", exact: true })
        .click();
    await h.page
      .getByRole("button", { name: "部屋を作る（ホスト）", exact: true })
      .click();
    await h.page.getByText("部屋コード", { exact: true }).waitFor();
    await h.page.waitForFunction(() =>
      /^[0-9]{4}$/.test(
        document.querySelector(".tracking-widest")?.textContent.trim() || "",
      ),
    );
    const code = (await h.page.locator(".tracking-widest").innerText()).trim();
    await g.page.getByPlaceholder("部屋コード4桁").fill(code);
    await g.page.getByRole("button", { name: "参加", exact: true }).click();
    await g.page.getByText("部屋コード", { exact: true }).waitFor();
    await h.page.getByRole("button", { name: /対戦スタート/ }).click();
    await h.page.getByText("READY",{exact:true}).waitFor();
    for (const t of [h,g]) { assert.equal(await t.page.locator("[data-btile],[data-poly]").count(),0,"online room countdown must contain no problem/tile DOM"); }
    await h.page.locator("[data-btile]").first().waitFor();
    await g.page.locator("[data-btile]").first().waitFor();
    for (let i = 0; i < 4; i++) {
      // the next problem's board is mounted only after the resolving phase: wait for it, not a fixed delay
      for (const t of [h, g]) await t.page.locator("[data-poly]").waitFor();
      await drag(h.page);
      for (const t of [h, g]) await t.page.locator("[data-poly]").waitFor();
      await drag(g.page);
    }
    const modern=Object.values(tree.games.factor.rooms[code].b2)[0].game;assert.equal(modern.rules,'b2');assert(modern.states.host.c>0&&modern.states.guest.c>0);assert.equal(modern.duration,90);
    console.log("PASS two-player online battle and shared live updates");
    await h.page.reload();
    await h.page
      .getByRole("button", { name: "オンライン対戦・CPU練習", exact: true })
      .click();
    await h.page.getByRole("button", { name: /クラス大会を開く/ }).click();
    await h.page.locator(".tracking-widest").waitFor();
    assert.ok((await h.page.locator("body").innerText()).includes("大会"));
    console.log("PASS teacher tournament lobby");
    await h.page.reload();
    await h.page
      .getByRole("button", { name: "オンライン対戦・CPU練習", exact: true })
      .click();
    await h.page
      .getByRole("button", { name: /クラス協力レイドを開く/ })
      .click();
    await h.page.locator(".tracking-widest").waitFor();
    assert.ok((await h.page.locator("body").innerText()).includes("レイド"));
    console.log("PASS teacher class raid lobby");
    assert.deepEqual(h.errors, []);
    assert.deepEqual(g.errors, []);
    await h.ctx.close();
    await g.ctx.close();
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
