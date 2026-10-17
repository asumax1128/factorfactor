const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  cp = require("node:child_process");
const { chromium, context, sleep } = require("./browser-harness.cjs");
const MENU_FONT = 'BBody, "Yu Gothic", sans-serif';
// Ver.6.0: the random-match screens now share the approved BHeading token with the new lobby.
const RATED_MENU_FONT = 'BHeading, "Yu Gothic", sans-serif';
const RATED_FONT = '"Zen Maru Gothic", "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
const html = fs.readFileSync("index.html", "utf8");
const before = cp.execFileSync("git", ["show", "42032d2:index.html"], {
  encoding: "utf8",
  maxBuffer: 10e6,
});
const old = cp.execFileSync("git", ["show", "42011a6:index.html"], {
  encoding: "utf8",
  maxBuffer: 10e6,
});
const importer = (s) => s.match(/function FontImport\(\) \{[\s\S]*?\n\}/)[0];
assert.equal(importer(html), importer(old), "Reuse exact old web font loader");
for (const re of [
  /function MathText\([\s\S]*?\n\}/,
  /  \.fxm \{[^}]+\}/,
  /  \.fxm-v \{[^}]+\}/,
  /  \.fxm sup \{[^}]+\}/,
]) {
  assert.equal(
    html.match(re)?.[0],
    before.match(re)?.[0],
    "Math renderer/style unchanged",
  );
}
const ui =
  fs.readFileSync("online-rated-ui.js", "utf8") +
  `\n(()=>{const f=OnlineRatedFactory;window.OnlineRatedFactory=H=>{window.__fontH=H;return f(H);};})();`;
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  });
  try {
    for (const width of [320, 390, 430, 1366]) {
      const t = await context(b, {
          assetOverrides: { "/online-rated-ui.js": ui },
          tree: {
            games: {
              factor: {
                accounts: {
                  ateacher: { name: "Teacher", stats: { rating: 1800 } },
                },
                onlineSparkV1: {
                  config: { enabled: true, protocol: "spark-v1" },
                },
              },
            },
          },
        }),
        p = t.page;
      await p.setViewportSize({ width, height: width === 1366 ? 768 : 844 });
      await p
        .getByRole("button", { name: "オンライン対戦・CPU練習", exact: true })
        .click();
      const oldButton = await p
        .getByRole("button", { name: "すぐ遊ぶ（ランダム対戦）", exact: true })
        .evaluate((e) => ({
          family: getComputedStyle(e).fontFamily,
          weight: getComputedStyle(e).fontWeight,
        }));
      await p
        .getByRole("button", { name: "すぐ遊ぶ（ランダム対戦）", exact: true })
        .click();
      await p
        .getByRole("button", { name: "イージーで相手を探す", exact: true })
        .waitFor();
      assert(
        await p
          .locator(".or-app style")
          .evaluateAll((es) =>
            es.some((e) =>
              e.textContent.includes("Zen+Maru+Gothic:wght@500;700;900"),
            ),
          ),
        "Font import survives legacy menu unmount",
      );
      for (const el of [
        p.getByRole("heading", { name: "すぐ遊ぶ", exact: true }),
        p.getByRole("button", { name: "イージーで相手を探す", exact: true }),
        p.getByRole("button", { name: "ノーマルで相手を探す", exact: true }),
      ]) {
        const v = await el.evaluate((e) => ({
          family: getComputedStyle(e).fontFamily,
          weight: getComputedStyle(e).fontWeight,
          w: e.clientWidth,
          scroll: e.scrollWidth,
        }));
        assert.equal(v.family, RATED_MENU_FONT, "random-match menu uses the Ver.6.0 BHeading token");
        assert.equal(v.weight, "900");
        assert(v.scroll <= v.w + 1, "UI text fits its button");
      }
      assert.equal(oldButton.family, MENU_FONT, "new-home lobby menu button uses the approved BBody token");
      assert.notEqual(oldButton.family, RATED_FONT, "menu and rated screens intentionally differ");
      assert.equal(oldButton.weight, "900");
      assert(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        "No horizontal overflow",
      );
      await p.evaluate(() => {
        const H = window.__fontH;
        const el = document.createElement("div");
        el.id = "font-math-audit";
        document.body.append(el);
        ReactDOM.createRoot(el).render(
          React.createElement(
            React.Fragment,
            null,
            ...["v7-menu", "or-app or-menu"].map((className, i) =>
              React.createElement(
                "div",
                {
                  className,
                  key: i,
                  style: { width: 300, padding: 0, minHeight: 0 },
                },
                React.createElement(H.TargetCard, {
                  poly: { x4: 0, x3: 0, x2: 1, x1: 5, x0: 6 },
                  level: 3,
                  qLabel: "問1/15",
                  gaugeKey: "audit",
                  gaugeMs: 20000,
                  v7: true,
                }),
              ),
            ),
          ),
        );
      });
      await p.locator("#font-math-audit .fxm").first().waitFor();
      const math = await p
        .locator("#font-math-audit .fxm")
        .evaluateAll((es) =>
          es.map((e) => ({
            family: getComputedStyle(e).fontFamily,
            weight: getComputedStyle(e).fontWeight,
            style: getComputedStyle(e).fontStyle,
            size: getComputedStyle(e).fontSize,
            width: e.getBoundingClientRect().width,
            height: e.getBoundingClientRect().height,
            children: [...e.querySelectorAll("*")].map((n) => ({
              family: getComputedStyle(n).fontFamily,
              weight: getComputedStyle(n).fontWeight,
              style: getComputedStyle(n).fontStyle,
              size: getComputedStyle(n).fontSize,
            })),
          })),
        );
      assert.equal(math.length, 2);
      assert.deepEqual(math[0], math[1]);
      assert(math[1].family.includes("KaTeX_Main"));
      assert.equal(math[1].weight, "400");
      assert(math[1].children.some((c) => c.family.includes("KaTeX_Math")));
      await p.locator("#font-math-audit").evaluate((e) => e.remove());
      await p
        .getByRole("button", { name: "イージーで相手を探す", exact: true })
        .click();
      await p
        .getByRole("button", { name: "検索をキャンセル", exact: true })
        .waitFor();
      assert(
        await p
          .getByRole("button", { name: "検索をキャンセル", exact: true })
          .isEnabled(),
      );
      await p
        .getByRole("button", { name: "検索をキャンセル", exact: true })
        .click();
      await p
        .getByRole("button", { name: "オンラインへ戻る", exact: true })
        .click();
      await p
        .getByRole("button", { name: "オンラインレーティング", exact: true })
        .click();
      await p
        .getByRole("heading", { name: "オンラインレーティング", exact: true })
        .waitFor();
      assert.equal(
        await p
          .getByRole("heading", { name: "オンラインレーティング", exact: true })
          .evaluate((e) => getComputedStyle(e).fontWeight),
        "900",
      );
      assert.equal(t.errors.length, 0);
      await t.ctx.close();
      console.log(
        "PASS old Japanese font loader/weights, menu/search/ratings wrap and unchanged rendered math at width " +
          width,
      );
    }
    console.log(
      "NOTE external Google Fonts is blocked by the deterministic harness; real glyph download and physical Safari are separate verification.",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
