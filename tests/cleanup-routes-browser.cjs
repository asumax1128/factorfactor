// Ver.6.23 (removal of unreachable code): the main routes still work exactly as before, and the two places that used to fall
// back to removed legacy screens now say that loading failed.
//   home → solo → 通常プレイ → スタート → a correct answer; online lobby; ranking hub → solo ranking; no daily entry (Ver.6.30).
const assert = require("node:assert/strict"), fs = require("node:fs");
const { chromium, context, openSoloMode, openOnlineLobby, goHome } = require("./browser-harness.cjs");
const { soloDrag } = require("./solo-test-helper.cjs");
const exe = process.env.CHROMIUM_PATH || "/usr/bin/chromium";
const tree = () => ({ games: { factor: { accounts: { ateacher: { name: "Teacher", stats: { exp: 100, rating: 1600 } } }, onlineSparkV1: { config: { enabled: true, protocol: "spark-v1" } } } } });
const src = fs.readFileSync("index.html", "utf8");
(async () => {
  // the removed pieces are really gone from the page source
  for (const name of ["AccountPanelV7", "DailyTileV7", "WeeklyTileV7", "GhostNews", "LegacyDailyApp", "TOWER_BOSSES", "TOWER_MOBS", "KING_PARTS", "PAST_PERIOD_CHAMPIONS", "従来のメニューを表示します"])
    assert(!src.includes(name), "removed: " + name);
  console.log("PASS removed code is absent from index.html");
  // Ver.6.25: the math tower (AXIOMIA) files are gone from the repository, the build and the publish workflow;
  // the audio regression that shared the tower's CI shard still runs (in another shard).
  {
    const gone = ["math-tower-core.js", "math-tower-store.js", "math-tower-ui.js", "math-tower-release.js", "math-tower.css", "math-tower-policy.json", "math-tower", "img/axiomia", "img/math-tower-floor3-official-d81d75734c05.png", "ui-next/solo/axiomia.png", "ui-next/solo/axiomia.webp", "src/math-tower-ui.jsx", "tests/tower-nav-helper.cjs", "scripts/build-math-tower.cjs", "scripts/ci-emulator-checks.cjs"];
    for (const f of gone) assert(!fs.existsSync(f), "removed from the repository: " + f);
    assert.deepEqual(fs.readdirSync("tests").filter((f) => /^math-tower-/.test(f)), [], "no tower test files");
    const pkg = JSON.parse(fs.readFileSync("package.json", "utf8")).scripts, wf = fs.readFileSync(".github/workflows/math-tower-pages.yml", "utf8"), build = fs.readFileSync("scripts/build-pages.cjs", "utf8");
    assert.deepEqual(Object.keys(pkg).filter((k) => /tower|ci:rules/.test(k)), [], "no tower scripts in package.json");
    assert(!/math-tower|axiomia/i.test(build), "the page build does not stage tower files");
    assert(!/test:tower|shard: tower|test:ci:rules/.test(wf), "no tower shard / tower suites / tower rule audit in the publish workflow");
    const shards = [...wf.matchAll(/- shard: (\S+)\n(?:\s+emulator: true\n)?\s+scripts: (.*)/g)].map((m) => [m[1], m[2].trim().split(/\s+/)]);
    assert.deepEqual(shards.map((x) => x[0]), ["online-a", "online-b", "emulator-artifact"]);
    assert.equal(shards.filter((x) => x[1].includes("test:audio")).length, 1, "the audio regression still runs in exactly one shard");
    assert(pkg["test:audio"], "test:audio script exists");
    assert(/for shard in online-a online-b emulator-artifact; do/.test(wf) && /wc -l\)" = 3/.test(wf), "release requires exactly the three remaining shards");
    if (fs.existsSync("dist/release-manifest.json")) {
      const published = JSON.parse(fs.readFileSync("dist/release-manifest.json", "utf8")).files.map((f) => f.path);
      assert.deepEqual(published.filter((f) => /math-tower|axiomia/i.test(f)), [], "no tower / AXIOMIA file in the public artifact");
    }
    console.log("PASS tower files removed from repository, build and publish workflow; audio regression still scheduled");
  }
  const b = await chromium.launch({ executablePath: exe });
  try {
    for (const width of [390, 1440]) {
      const t = await context(b, { tree: tree(), pc: width > 900 }), p = t.page; if (width < 900) await p.setViewportSize({ width, height: 844 });
      // home → solo hub → 通常プレイ → スタート → play
      await openSoloMode(p, "play");
      assert.deepEqual(await p.locator(".v7-diff button").evaluateAll((es) => es.map((e) => e.firstChild.textContent)), ["イージー", "ノーマル", "ハード"]);
      await p.locator("[data-solo-back]").waitFor();
      assert.equal(await p.locator(".v7-tiles4").count(), 0, "no old-home tiles");
      await p.getByRole("button", { name: "スタート", exact: true }).click();
      await p.locator("[data-tile-id]").first().waitFor();
      const before = await p.locator("[data-tile-id]").evaluateAll((es) => es.map((e) => e.dataset.tileId).join());
      await soloDrag(p, true);
      await p.waitForFunction((old) => [...document.querySelectorAll("[data-tile-id]")].map((e) => e.dataset.tileId).join() !== old, before, { timeout: 5000 });
      assert.deepEqual(t.errors, []); await t.ctx.close();
      // online lobby
      const t2 = await context(b, { tree: tree(), pc: width > 900 }), q = t2.page; if (width < 900) await q.setViewportSize({ width, height: 844 });
      await openOnlineLobby(q);
      await q.getByRole("button", { name: "すぐ遊ぶ（ランダム対戦）", exact: true }).waitFor();
      await q.locator("[data-room-create]").waitFor(); await q.locator("[data-ghost-tiles]").waitFor();
      // ranking hub → solo ranking → back to the hub
      await goHome(q);
      await q.locator(width > 900 ? ".sidebar .nav-item" : ".bottom-nav .nav-item").filter({ hasText: width > 900 ? "ランキング" : "順位" }).click();
      await q.locator(".ranking-grid .ranking-entry").first().waitFor();
      assert.equal(await q.locator(".ranking-grid .ranking-entry").count(), 2);
      await q.locator(".ranking-entry", { hasText: "ソロランキング" }).click();
      await q.locator(".next-solo-ranking").waitFor();
      await q.getByRole("button", { name: "ランキング総合へ戻る", exact: true }).click();
      await q.locator(".ranking-grid").waitFor();
      assert.deepEqual(t2.errors, []); await t2.ctx.close();
      console.log(`PASS ${width}px: home → solo → play (correct answer accepted), online lobby, ranking hub → solo ranking → hub`);
    }
    // Ver.6.24: AXIOMIA (math tower) has no entry and is not loaded, even for a teacher who holds the trial grant.
    {
      const html = fs.readFileSync("index.html", "utf8");
      for (const name of ["math-tower.css", "math-tower-core.js", "math-tower-store.js", "math-tower-release.js", "math-tower-ui.js", "AxiomiaGate", "MathTowerFactory", "useTowerAccess", "#math-tower"])
        assert(!html.includes(name), "not referenced by the page: " + name);
      const grant = tree();
      Object.assign(grant.games.factor, { teachers: { ateacher: { name: "Teacher" } }, logins: { ateacher: { "teacher-uid": "1234" } }, mathTowerV2: { access: { ateacher: { enabled: true, role: "teacher" } } } });
      const requests = [];
      const t = await context(b, { tree: grant, uid: "teacher-uid" }), p = t.page;
      p.on("request", (r) => { if (/math-tower|axiomia/i.test(new URL(r.url()).pathname)) requests.push(r.url()); });
      await p.goto(p.url().split("#")[0] + "#math-tower"); await p.reload();
      await p.locator("[data-next-home] .home-content").waitFor();          // the old direct link opens the home, not the tower
      assert.equal(await p.evaluate(() => typeof window.MathTowerFactory + typeof window.MathTowerStore + typeof window.MathTowerRules), "undefinedundefinedundefined", "tower code not loaded");
      await p.locator(".action-card.solo").click(); await p.locator("[data-solo-hub]").waitFor();
      assert.deepEqual(await p.locator("[data-solo-mode]").evaluateAll((es) => es.map((e) => e.dataset.soloMode)), ["play", "cpu", "boss", "learn"], "four solo cards, no AXIOMIA");
      assert.equal(await p.getByText("AXIOMIA").count(), 0, "no AXIOMIA wording on the solo screen");
      await p.waitForTimeout(300);
      assert.deepEqual(requests, [], "no tower / AXIOMIA file requested");
      assert.equal(t.writes.filter((x) => /mathTowerV2/.test(x.path)).length, 0, "nothing written to mathTowerV2");
      assert.deepEqual(t.errors, []); await t.ctx.close();
      console.log("PASS AXIOMIA: no card, no direct link, no tower code or files loaded, no mathTowerV2 writes (teacher with the grant)");
    }
    // Ver.6.30: the daily entries are removed everywhere (home tile, solo card, ranking hub); あそびかた no longer mentions the daily.
    {
      const t = await context(b, { tree: tree() }), p = t.page;
      await p.locator("[data-next-home] .home-content").waitFor();
      assert.deepEqual(await p.locator("[data-home-tile]").evaluateAll((es) => es.map((e) => e.dataset.homeTile)), ["help"]);
      assert.equal(await p.getByText(/デイリー/).count(), 0, "home: no daily wording");
      await p.locator(".action-card.solo").click(); await p.locator("[data-solo-hub]").waitFor();
      assert.equal(await p.getByText(/デイリー/).count(), 0, "solo hub: no daily wording");
      assert.equal(await p.locator("[data-solo-mode=daily]").count(), 0);
      await goHome(p);
      await p.locator(".sidebar .nav-item, .bottom-nav .nav-item").filter({ hasText: /ランキング|順位/ }).locator("visible=true").first().click();
      await p.locator(".ranking-grid .ranking-entry").first().waitFor();
      assert.equal(await p.getByText(/デイリー/).count(), 0, "ranking hub: no daily wording");
      await goHome(p);
      await p.locator("[data-home-tile=help]").click(); await p.locator("[data-next-help]").waitFor();
      assert.equal(await p.locator("[data-next-help]").getByText(/デイリー/).count(), 0, "あそびかた: no daily wording");
      assert.deepEqual(t.errors, []); await t.ctx.close();
      console.log("PASS daily: no entry on the home, the solo hub or the ranking hub; あそびかた does not mention it");
    }
    // Ver.6.31: the daily challenge itself is removed: screen, client, bundle, files, routes. Saved daily data is left alone
    // (nothing is written under dailyV2; the saved boards and attempts in the fixture stay exactly as they were).
    {
      for (const name of ["DailyApp", "NewDailyApp", "DailyFactory", "DailyV2", "completeDailySolo", "dailyProblems", "DailyMissionsView", "daily-ui.js", "ranking-daily", "mode === 'daily'"])
        assert(!src.includes(name), "removed from the page: " + name);
      for (const f of ["daily-ui.js", "src/daily-ui.jsx", "src/daily-client.cjs", "ui-next/solo/dairymission.png", "ui-next/solo/dairymission.webp"]) assert(!fs.existsSync(f), "file removed: " + f);
      for (const f of ["server/daily-play.cjs", "tests/daily-play.test.cjs", "firebase/daily-v2-rules.cjs", "src/daily-model.cjs"]) assert(fs.existsSync(f), "file kept: " + f);
      assert(!/DailyV2|daily-client/.test(fs.readFileSync("online-spark.js", "utf8") + fs.readFileSync("scripts/build-online-spark.cjs", "utf8")), "the daily client is not in the online bundle");
      if (fs.existsSync("dist/release-manifest.json")) assert.deepEqual(JSON.parse(fs.readFileSync("dist/release-manifest.json", "utf8")).files.map((f) => f.path).filter((f) => /daily|dairy/i.test(f)), [], "no daily file in the public artifact");
      const day = Number(new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10).replace(/-/g, ""));
      const g = tree();
      g.games.factor.dailyV2 = { ready: true, boards: { [day - 1]: { easy: { leader: { key: "ateacher", score: 500 }, records: { ateacher: { key: "ateacher", name: "Teacher", score: 500 } } } } }, attempts: { ateacher: { [day]: { slots: { 0: { id: "x", difficulty: "easy" } } } } } };
      const saved = JSON.stringify(g.games.factor.dailyV2), requests = [];
      const t = await context(b, { tree: g }), p = t.page;
      p.on("request", (r) => { if (/daily/i.test(new URL(r.url()).pathname)) requests.push(r.url()); });
      await p.goto(p.url().split("#")[0] + "#daily"); await p.reload();
      await p.locator("[data-next-home] .home-content").waitFor();
      assert.equal(await p.evaluate(() => typeof window.DailyV2 + typeof window.DailyFactory), "undefinedundefined", "daily code not loaded");
      await p.locator(".action-card.solo").click(); await p.locator("[data-solo-hub]").waitFor();
      await goHome(p); await p.waitForTimeout(600);
      assert.deepEqual(requests, [], "no daily file requested");
      assert.equal(t.writes.filter((x) => /dailyV2/.test(x.path)).length, 0, "nothing written under dailyV2");
      assert.equal(JSON.stringify(t.tree.games.factor.dailyV2), saved, "saved daily data left exactly as it was");
      assert.deepEqual(t.errors, []); await t.ctx.close();
      console.log("PASS daily challenge removed: no screen/client/bundle/files/routes; nothing written under dailyV2; saved daily data untouched");
    }
    // Ver.6.32: the daily missions are removed: no mission code in the page, no mission wording, the teacher's class table has no
    // 「今日のﾐｯｼｮﾝ」 column, and the saved mission record of an account is neither shown nor rewritten.
    {
      for (const name of ["missionEvent", "missionsFor", "applyMis", "misRunStep", "claimMission", "useMissions", "MissionList", "DailyProgress", "MIS_POOL", "MIS_EXP", "fxf_guest_mis_v1", "今日のミッション", "ﾐｯｼｮﾝ", "ck('mis')"])
        assert(!src.includes(name), "removed from the page: " + name);
      const exposed = src.replace("const root = ReactDOM.createRoot(rootEl);", "window.__dash={TeacherDash};\nconst root = ReactDOM.createRoot(rootEl);");
      const today = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
      const g = tree();
      g.games.factor.teachers = { ateacher: true };
      g.games.factor.accounts.akid = { name: "Kid", stats: { exp: 300, games: 3, last: Date.now() }, prof: { at: Date.now(), lv: { L1: { n: 10, ok: 8, ms: 9000 } }, pt: { p1a: { n: 10, ok: 8 } } }, mis: { d: today, p: { ok: 30 }, c: { ch: 1, m1: 1, m2: 1, m3: 1, all: 1 } } };
      const saved = JSON.stringify(g.games.factor.accounts.akid);
      const t = await context(b, { tree: g, assetOverrides: { "/": exposed } }), p = t.page;
      await p.waitForFunction(() => !!window.__dash);
      await p.evaluate(() => { const el = document.createElement("div"); el.id = "dash-test"; document.body.appendChild(el); document.getElementById("root").style.display = "none"; ReactDOM.createRoot(el).render(React.createElement(window.__dash.TeacherDash, { acct: { key: "ateacher", name: "Teacher" }, onBack() {}, onWatch() {} })); });
      await p.locator("#dash-test").getByText("クラスの理解度", { exact: true }).click();
      await p.locator("#dash-test").getByText("全員", { exact: true }).click();
      const head = p.locator("#dash-test").getByText("いちばん苦手な型", { exact: true }).locator("..");
      await head.waitFor();
      assert.deepEqual(await head.locator("span").allInnerTexts(), ["名前", "Lv", "ランク", "正答率", "解いた数", "いちばん苦手な型"], "class table columns (no mission column)");
      const row = p.locator("#dash-test").getByText("Kid", { exact: true }).locator("..");
      await row.waitFor();
      assert.equal(await row.locator(":scope > span").count(), 6, "each row has the same six cells");
      assert.match(await row.innerText(), /80%/);
      assert.equal(await head.evaluate((e) => getComputedStyle(e).gridTemplateColumns.split(" ").length), 6);
      assert.equal(await row.evaluate((e) => getComputedStyle(e).gridTemplateColumns.split(" ").length), 6);
      assert.equal(await p.locator("#dash-test").getByText(/ﾐｯｼｮﾝ|ミッション|\/4/).count(), 0, "no mission wording or x/4 cell in the dashboard");
      assert.equal(JSON.stringify(t.tree.games.factor.accounts.akid), saved, "the student's saved data (including the old mission record) is untouched");
      assert.equal(t.writes.filter((x) => /\/mis(\/|$)/.test(x.path)).length, 0, "nothing written under mis");
      assert.deepEqual(t.errors, []); await t.ctx.close();
      console.log("PASS missions removed: no mission code or wording; the teacher's class table has six columns; saved mission records untouched");
    }
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
