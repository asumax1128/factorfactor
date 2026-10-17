const assert = require("node:assert/strict");
const { chromium, context, sleep } = require("./browser-harness.cjs");
const fs = require("fs");
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  });
  try {
    const tree = {
      games: {
        factor: {
          accounts: {
            ateacher: {
              name: "Teacher",
              stats: { rating: 1649.6, exp: 100, ghostW: 2 },
              prof: { lv: { L1: { n: 25, ok: 25, ms: 25000 } } },
            },
          },
          onlineSparkV1: { config: { enabled: true, protocol: "spark-v1" } },
        },
      },
    };
    const ui =
      fs.readFileSync("online-rated-ui.js", "utf8") +
      `\n(function(){const original=window.OnlineRatedFactory;window.OnlineRatedFactory=H=>{window.__combatHelpers=H;return original(H);};})();`;
    const t = await context(browser, {
        tree,
        captureTower: true,
        assetOverrides: { "/online-rated-ui.js": ui },
      }),
      p = t.page;
    await p.locator(".action-card.solo").click();
    await p.getByRole("button", { name: "成績", exact: true }).click();
    await p.getByRole("button", { name: /称号の装備・詳細記録/ }).click();
    const order = await p.locator(".fixed.inset-0").innerText();
    assert(
      order.indexOf("ゴースト対戦履歴") > order.indexOf("称号（"),
      "history must follow all old profile sections",
    );
    await p.reload();
    await p.locator(".action-card.online").click();
    await p
      .getByRole("button", { name: "すぐ遊ぶ（ランダム対戦）", exact: true })
      .click();
    await p
      .getByRole("button", { name: "イージーで相手を探す", exact: true })
      .waitFor();
    const styles = await p.locator(".or-difficulty").evaluateAll((es) =>
      es.map((e) => ({
        color: getComputedStyle(e).borderLeftColor,
        bg: getComputedStyle(e).backgroundColor,
      })),
    );
    assert.deepEqual(
      styles.map((x) => x.color),
      ["rgb(82, 183, 136)", "rgb(232, 163, 61)"],
    );
    await p
      .getByRole("button", { name: "ノーマルで相手を探す", exact: true })
      .click();
    await p.locator(".or-search-icon").waitFor();
    await sleep(1600);
    const elapsed = await p.getByLabel("検索経過時間").innerText();
    assert(parseFloat(elapsed) >= 1);
    assert(
      await p
        .getByRole("button", { name: "検索をキャンセル", exact: true })
        .isEnabled(),
    );
    await p
      .getByRole("button", { name: "検索をキャンセル", exact: true })
      .click();
    await p
      .getByRole("button", { name: "ノーマルで相手を探す", exact: true })
      .waitFor();
    const colors = {
      Perfect: "#FFD54A",
      Excellent: "#8BE38F",
      Great: "#6BD4E8",
      Good: "#8FB8FF",
      OK: "#C9C9C9",
      Bad: "#FF5C5C",
    };
    for (const [label, color] of Object.entries(colors)) {
      await p.evaluate(
        ({ label, color }) => {
          const H = window.__combatHelpers;
          window.__judgeRoot?.unmount();
          let el = document.getElementById("judge-audit");
          if (!el) {
            el = document.createElement("div");
            el.id = "judge-audit";
            el.style.cssText =
              "position:relative;background:#111e43;height:70px";
            document.body.appendChild(el);
          }
          window.__judgeRoot = ReactDOM.createRoot(el);
          window.__judgeRoot.render(
            React.createElement(H.TimingJudgment, {
              judge: { label, color },
              at: "ph",
            }),
          );
        },
        { label, color },
      );
      await p.locator(`[data-timing-judge="${label}"]`).waitFor();
      const actual = await p
        .locator(`[data-timing-judge="${label}"]`)
        .evaluate((el) => ({
          color: el.style.color,
          glow: getComputedStyle(el).textShadow,
          stroke: getComputedStyle(el).webkitTextStrokeWidth,
        }));
      const rgb = await p.evaluate((color) => {
        const e = document.createElement("div");
        e.style.color = color;
        return e.style.color;
      }, color);
      assert.equal(actual.color, rgb);
      assert(actual.glow.includes(rgb));
      assert.equal(actual.stroke, "2px");
    }
    const grade = await p.evaluate(() => {
      const H = window.__combatHelpers;
      return {
        late: H.getJudgment(16000),
        shown: H.timingVisual(H.getJudgment(16000)),
      };
    });
    assert.equal(grade.late.label, "Fair");
    assert.equal(grade.late.recover, 2);
    assert.equal(grade.shown.label, "OK");
    assert.equal(grade.shown.color, colors.OK);
    await p.evaluate(() => {
      window.__judgeRoot.unmount();
      document.getElementById("judge-audit").remove();
      const H = window.__combatHelpers;
      const nodes = [0, 1].map((x) => {
        const n = document.createElement("div");
        n.dataset.fxAudit = "1";
        n.style.cssText = `position:fixed;left:${50 + x * 160}px;top:400px;width:80px;height:100px;background:white`;
        n.textContent = x ? "(x + 3)" : "2";
        document.body.appendChild(n);
        return n;
      });
      const target = document.createElement("div");
      target.dataset.fxtarget = "1";
      target.style.cssText =
        "position:fixed;left:100px;top:280px;width:150px;height:50px";
      document.body.appendChild(target);
      H.CombatFX.merge(H.CombatFX.capture(nodes, target), "#FFD54A");
    });
    assert.equal(await p.locator("[data-combat-card]").count(), 2);
    await sleep(700);
    assert.equal(await p.locator("[data-combat-card]").count(), 0);
    assert.equal(await p.locator("[data-fx-audit]").count(), 2);
    await p.emulateMedia({ reducedMotion: "reduce" });
    await p.evaluate(() => {
      const H = window.__combatHelpers;
      H.CombatFX.merge(
        H.CombatFX.capture([...document.querySelectorAll("[data-fx-audit]")]),
        "#FFD54A",
      );
    });
    assert.equal(await p.locator("[data-combat-card]").count(), 0);
    for (const outcome of ["win", "lose"]) {
      await p.evaluate((outcome) => {
        const H = window.__combatHelpers;
        window.__resultRoot?.unmount();
        let el = document.getElementById("result-audit");
        if (!el) {
          el = document.createElement("div");
          el.id = "result-audit";
          el.className = "or-app or-menu";
          document.body.appendChild(el);
        }
        const R = window.OnlineRatedFactory(H).Result;
        window.__resultRoot = ReactDOM.createRoot(el);
        window.__resultRoot.render(
          React.createElement(R, {
            H,
            m: {
              id: "fixture-" + outcome,
              outcome,
              difficulty: "easy",
              origin: "quick",
              opponent: { type: "hyper" },
              exp: outcome === "win" ? 8 : 0,
              receipt: {
                players: {
                  ateacher: {
                    before: 1500,
                    after: outcome === "win" ? 1505 : 1495,
                    delta: outcome === "win" ? 5 : -5,
                  },
                },
              },
            },
            state: { badges: outcome === "win" ? { hyper_slayer: true } : {} },
            acct: { key: "ateacher" },
            titles: { hyper_slayer: "超影の征服者" },
            badgesBefore: {},
            busy: false,
            onExit() {},
          }),
        );
      }, outcome);
      await p
        .locator(`#result-audit [data-result-kind="${outcome}"]`)
        .waitFor();
      assert.equal(
        await p.locator("#result-audit .or-victory-rays").count(),
        outcome === "win" ? 1 : 0,
      );
      assert.equal(
        await p.locator("#result-audit [data-new-title]").count(),
        outcome === "win" ? 1 : 0,
      );
      assert.match(
        await p.locator("#result-audit").innerText(),
        outcome === "win" ? /WIN!/ : /LOSE/,
      );
    }
    assert.deepEqual(t.errors, []);
    await t.ctx.close();
    console.log(
      "PASS Japanese difficulty colors, animated elapsed/cancel, history order, six exact neon judgments, unchanged Fair recovery, clone merge cleanup and reduced motion",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
