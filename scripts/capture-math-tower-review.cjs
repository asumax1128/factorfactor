// Offline screenshots for an authorised reviewer. All service requests are mocked.
const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const {
  chromium,
  context,
  drag,
  sleep,
  root,
} = require("../tests/browser-harness.cjs");
const [contentArg, outputArg] = process.argv.slice(2);
if (!contentArg || !outputArg)
  throw Error(
    "Usage: capture-math-tower-review.cjs PRIVATE_CONTENT OUTPUT_OUTSIDE_CHECKOUT",
  );
const output = path.resolve(outputArg);
fs.mkdirSync(output, { recursive: true });
const realOutput = fs.realpathSync(output);
if (realOutput === root || realOutput.startsWith(root + path.sep))
  throw Error("Private screenshots must stay outside public checkout");
const content = JSON.parse(fs.readFileSync(contentArg));
const seed = () => ({
  games: {
    factor: {
      teachers: { ateacher: { name: "Reviewer" } },
      logins: { ateacher: { "teacher-uid": "fixture" } },
      mathTowerV2: {
        access: { ateacher: { enabled: true, role: "teacher" } },
        content: { ateacher: { chapter1: content } },
      },
    },
  },
});
(async () => {
  const browser = await chromium.launch({
      executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    }),
    shots = [];
  try {
    for (const pc of [false, true]) {
      const label = pc ? "pc" : "phone",
        t = await context(browser, { tree: seed(), pc }),
        p = t.page;
      const capture = async (name) => {
        const file = label + "-" + name + ".png";
        await p.screenshot({ path: path.join(output, file), fullPage: false });
        shots.push({
          file,
          viewport: pc ? "1366x768" : "390x844",
          scene: name,
        });
      };
      await p.getByRole("button", { name: "数学の塔", exact: false }).waitFor();
      await capture("teacher-menu");
      await p.getByRole("button", { name: "数学の塔", exact: false }).click();
      await p.getByRole("button", { name: "NORMAL", exact: true }).click();
      await capture("tower-home");
      const advanceStory = async () => {
        const taken = new Set();
        for (let i = 0; i < 400; i++) {
          const story = p.locator("[data-math-story]");
          if (!(await story.count())) return;
          const id = await story.getAttribute("data-math-story");
          if (!taken.has(id)) {
            await capture("story-" + id);
            taken.add(id);
          }
          if (
            id === "3-pre" &&
            (await p.locator(".mt-stage img").count()) === 2 &&
            !taken.has("pair")
          ) {
            await capture("two-speakers");
            taken.add("pair");
          }
          await p.locator("[data-math-dialog]").click();
          await sleep(25);
        }
        throw Error("Story did not complete");
      };
      for (let f = 1; f <= 5; f++) {
        await p
          .getByRole("button", { name: "冒険を続ける", exact: true })
          .click();
        await capture("floor" + f + "-prepare");
        await p
          .getByRole("button", { name: "試練を開始", exact: true })
          .click();
        await p.locator("[data-math-dialog]").waitFor();
        await advanceStory();
        await p.locator("[data-btile]").first().waitFor();
        await sleep(150);
        await capture("floor" + f + "-battle");
        if (f === 1) {
          await p.getByRole("button", { name: "ポーズ", exact: true }).click();
          await capture("pause");
          await p.getByRole("button", { name: "再開", exact: true }).click();
        }
        for (let i = 0; i < 40; i++) {
          if (await p.locator('[data-math-screen="result"]').count()) break;
          await drag(p);
        }
        await p.locator('[data-math-screen="result"]').waitFor();
        await capture("floor" + f + "-result");
        await p
          .getByRole("button", { name: "物語の続きを見る", exact: true })
          .click();
        await advanceStory();
        await p
          .locator(
            '[data-math-screen="' + (f === 5 ? "chapterEnd" : "home") + '"]',
          )
          .waitFor();
      }
      await capture("chapter-end");
      await p.getByRole("button", { name: "ホームへ", exact: true }).click();
      await p.getByRole("button", { name: /数理の書/ }).click();
      await capture("learning-records");
      await p.getByRole("button", { name: "図鑑", exact: true }).click();
      await capture("bestiary");
      assert.deepEqual(t.errors, []);
      await t.ctx.close();
    }
    fs.writeFileSync(
      path.join(output, "screenshots.json"),
      JSON.stringify(shots, null, 2) + "\n",
    );
    console.log(
      "Captured " +
        shots.length +
        " private screenshots; no deployment or production traffic.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
