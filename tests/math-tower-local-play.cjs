// Real HTTP local package test, without Playwright's Firebase/network routes.
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path");
const { spawn } = require("node:child_process");
const { chromium, story, drag, sleep } = require("./browser-harness.cjs");
const pcSmoke = process.argv.includes("--pc-smoke");
const output =
  process.env.MATH_TOWER_LOCAL_PLAY || "/workspace/tower-local-play";
const python = spawn("python", [
  "-u",
  "-c",
  `import importlib.util,json
s=importlib.util.spec_from_file_location('local_server',${JSON.stringify(path.join(output, "start.py"))})
m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
v=m.create_server('127.0.0.1',0)
print(json.dumps({'port':v.server_port,'code':v.code}),flush=True)
v.serve_forever()`,
]);
(async () => {
  const config = await new Promise((resolve, reject) => {
    let s = "";
    python.stdout.on("data", (d) => {
      s += d;
      if (s.includes("\n")) resolve(JSON.parse(s.split("\n")[0]));
    });
    python.on("error", reject);
    python.on("exit", (c) => reject(Error("Python exited " + c)));
  });
  const url = "http://127.0.0.1:" + config.port;
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  });
  try {
    const ctx = await browser.newContext({
      viewport: pcSmoke
        ? { width: 1366, height: 768 }
        : { width: 390, height: 844 },
      hasTouch: !pcSmoke,
    });
    const page = await ctx.newPage(),
      requests = [],
      errors = [];
    page.on("request", (r) => requests.push(r.url()));
    page.on("pageerror", (e) => errors.push(e.message));
    for (const f of ["/private-content.js", "/math-tower-ui.js"])
      assert.equal((await ctx.request.get(url + f)).status(), 401);
    assert.equal(
      (
        await ctx.request.post(url + "/login", { form: { code: "wrong" } })
      ).status(),
      401,
    );
    await page.goto(url);
    await page.locator("[name=code]").fill(config.code);
    await page.getByRole("button", { name: "入室", exact: true }).click();
    await page
      .getByRole("button", { name: "NORMAL", exact: true })
      .waitFor({ timeout: 10000 })
      .catch(async (e) => {
        console.log(
          "BOOT:",
          (await page.locator("body").innerText()).slice(0, 1600),
          errors,
        );
        throw e;
      });
    assert.equal(
      (await ctx.request.get(url + "/private-content.js")).status(),
      200,
    );
    assert.equal((await ctx.request.get(url + "/..%2Fstart.py")).status(), 403);
    assert.equal(
      (
        await ctx.request.post(url + "/login", {
          headers: { Origin: "https://untrusted.example" },
          form: { code: config.code },
        })
      ).status(),
      403,
    );
    console.log(
      "PASS local HTTP login; all assets gated; traversal and foreign-origin login denied; mock game boot",
    );
    for (let floor = 1; floor <= 5; floor++) {
      await page
        .getByRole("button", { name: "冒険を続ける", exact: true })
        .click();
      if (floor === 1)
        assert(
          (await page.locator(".mt-instructions").innerText()).includes("6枚"),
        );
      if (floor === 5)
        assert(
          (await page.locator(".mt-instructions").innerText()).includes("2倍"),
        );
      await page
        .getByRole("button", { name: "試練を開始", exact: true })
        .click();
      await page.locator("[data-math-dialog]").waitFor();
      await story(page);
      await page.locator("[data-btile]").first().waitFor();
      assert.equal(await page.locator("[data-btile]").count(), 6);
      if (pcSmoke) {
        await drag(page, true);
        assert(
          (await page.locator(".mt-controls").innerText()).includes("1正解"),
        );
        assert.equal(errors.length, 0, errors.join(", "));
        assert(requests.every((u) => u.startsWith(url)));
        await page.screenshot({ path: path.join(output, "pc-battle.png") });
        console.log(
          "PASS PC 1366x768 game boot, six tiles and mouse answer, no external HTTP or page errors",
        );
        await ctx.close();
        return;
      }

      const sizes = await page.locator("[data-btile]").evaluateAll((es) =>
        es.map((e) => ({
          w: e.getBoundingClientRect().width,
          h: e.getBoundingClientRect().height,
        })),
      );
      assert(sizes.every((s) => s.w >= 44 && s.h >= 64));
      if (floor === 1) {
        const bottom = await page
          .locator("[data-btile]")
          .last()
          .evaluate((e) => e.getBoundingClientRect().bottom);
        assert(
          bottom <= 844,
          "Six tiles must be visible at 390x844, bottom=" + bottom,
        );
        await page.screenshot({ path: path.join(output, "phone-battle.png") });
      }
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      if (floor === 1) {
        await page.getByRole("button", { name: "ポーズ", exact: true }).click();
        await page.getByRole("button", { name: "再開", exact: true }).click();
        await drag(page, false);
        assert(
          (await page.locator(".mt-controls").innerText()).includes("HP 95"),
        );
        const oldPoly = await page
          .locator("[data-poly]")
          .getAttribute("data-poly");
        const a = await page.locator("[data-btile]").nth(0).boundingBox(),
          b = await page.locator("[data-btile]").nth(1).boundingBox();
        const cdp = await ctx.newCDPSession(page);
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchStart",
          touchPoints: [{ x: a.x + a.width / 2, y: a.y + a.height / 2 }],
        });
        await sleep(60);
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ x: b.x + b.width / 2, y: b.y + b.height / 2 }],
        });
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchEnd",
          touchPoints: [],
        });
        await sleep(250);
        assert.notEqual(
          await page.locator("[data-poly]").getAttribute("data-poly"),
          oldPoly,
        );
        console.log("PASS native Chromium touch drag");
      }
      for (
        let n = 0;
        n < 24 && (await page.locator("[data-btile]").count());
        n++
      )
        await drag(page, true);
      await page
        .getByRole("button", { name: "物語の続きを見る", exact: true })
        .waitFor();
      await page
        .getByRole("button", { name: "物語の続きを見る", exact: true })
        .click();
      await story(page);
      await page
        .locator(
          '[data-math-screen="' + (floor === 5 ? "chapterEnd" : "home") + '"]',
        )
        .waitFor();
      console.log("PASS real local package NORMAL floor " + floor);
    }
    const before = await page.evaluate(() => localStorage.getItem("progress"));
    assert(before);
    await page.reload();
    await page.getByRole("button", { name: "NORMAL", exact: true }).waitFor();
    assert.equal(
      await page.evaluate(() => localStorage.getItem("progress")),
      before,
    );
    assert((await page.locator("body").innerText()).includes("5/5階"));
    assert.equal(errors.length, 0, errors.join("\n"));
    assert(
      requests.every((u) => u.startsWith(url)),
      "Outbound request from offline package",
    );
    console.log(
      "PASS localStorage reload; six touch targets; no horizontal overflow; no external HTTP requests; no page errors",
    );
    await page.getByRole("button", { name: "HARD", exact: true }).click();
    await page
      .getByRole("button", { name: "冒険を続ける", exact: true })
      .click();
    await page.getByRole("button", { name: "試練を開始", exact: true }).click();
    await page.locator("[data-math-dialog]").waitFor();
    await story(page);
    for (let n = 0; n < 6; n++) await drag(page, true);
    assert(
      (await page.locator(".mt-instructions").innerText()).includes("敵HPは0"),
    );
    assert(
      (await page.locator(".mt-instructions").innerText()).includes("Lv8"),
    );
    await drag(page, true);
    await drag(page, true);
    await page.getByRole("heading", { name: /勝利！/ }).waitFor();
    console.log("PASS HARD HP0 guard explanation and Lv8 victory");
    await ctx.close();
  } finally {
    await browser.close();
    python.kill();
  }
})().catch((e) => {
  python.kill();
  console.error(e);
  process.exitCode = 1;
});
