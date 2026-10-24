const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const { chromium: playwrightChromium } = require("playwright");
// Failure evidence (CI only): with PW_ARTIFACT_DIR set, browser.close() first saves a screenshot and the visible
// text of every page still open. A failing test closes its browser in `finally` while the failing page is still
// open, so this captures the failure state; passing tests have usually closed their contexts already.
// Mock data only (no credentials). Without PW_ARTIFACT_DIR nothing changes.
const ARTIFACT_DIR = process.env.PW_ARTIFACT_DIR;
let artifactCount = 0;
async function saveEvidence(browser) {
  if (!ARTIFACT_DIR) return;
  const test = path.basename(process.argv[1] || "test").replace(/\.c?js$/, "");
  for (const ctx of browser.contexts())
    for (const page of ctx.pages()) {
      const base = path.join(ARTIFACT_DIR, `${test}-${++artifactCount}`);
      try {
        fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
        await page.screenshot({ path: base + ".png", timeout: 5000 });
        const text = await page.locator("body").innerText({ timeout: 3000 });
        fs.writeFileSync(base + ".txt", page.url() + "\n\n" + text.slice(0, 6000));
      } catch (e) {}
    }
}
const chromium = Object.create(playwrightChromium);
chromium.launch = async (options) => {
  const browser = await playwrightChromium.launch(options);
  const close = browser.close.bind(browser);
  browser.close = async (...args) => {
    await saveEvidence(browser);
    return close(...args);
  };
  return browser;
};
const root = path.resolve(__dirname, ".."),
  sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function context(
  browser,
  {
    tree = {},
    account = { key: "ateacher", name: "Teacher" },
    uid = "teacher-uid",
    pc = false,
    url = "http://localhost/",
    peers = [],
    onOperation = null,
    towerContent = null,
    captureTower = false,
    assetOverrides = null,
    blockedAssets = [],
    firebaseSource = null,
    emulatorNetwork = false,
    siteRoot = process.env.PW_SITE_ROOT ? path.resolve(process.env.PW_SITE_ROOT) : root,
    keepLogin = "observe",
    axiomia = false, // Ver.6.17: the tower tests of the old chapter-one story keep running on chapter1.json; AXIOMIA part 1 tests pass true
    scale = undefined, // optional deviceScaleFactor (tools/capture-guide.cjs); tests leave it unset
    realMathFonts = false, // opt-in (tools/capture-guide.cjs): serve KaTeX_Main/KaTeX_Math like the CDN stylesheet does on a real device
  } = {},
) {
  const ctx = await browser.newContext({
    viewport: pc ? { width: 1366, height: 768 } : { width: 390, height: 844 },
    hasTouch: !pc,
    ...(scale ? { deviceScaleFactor: scale } : {}),
  });
  const writes = [],
    errors = [],
    requests = [];
  await ctx.exposeBinding("__fbGet", () => tree);
  // Ver.6.0 A1b: the login-time freeze adds tk/tv2 to stats. Older tests assert that nothing ELSE in stats changes and count
  // stats writes, so in the default "observe" mode the page still runs the freeze, but the protection record is kept out of
  // the tree and the write log the legacy assertions look at (it is collected in `keepRecords`). Any other change the freeze
  // made would still be visible. "real" mode (tests/v6-keep-login-browser.cjs) stores and logs everything.
  const keepRecords = [],
    STATS_RE = /^games\/factor\/accounts\/[^/]+\/stats$/;
  const getAt = (path) => path.split("/").reduce((n, k) => (n == null ? n : n[k]), tree);
  const sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  await ctx.exposeBinding("__fbOp", async (_, op) => {
    if (keepLogin === "observe") {
      if (op.kind === "set" && /\/stats\/(tk|tv2)$/.test(op.path)) { keepRecords.push({ path: op.path, v: op.v }); return; }
      if (op.kind === "set" && STATS_RE.test(op.path) && op.v && typeof op.v === "object" && ("tk" in op.v || "tv2" in op.v)) {
        const { tk, tv2, ...rest } = op.v;
        keepRecords.push({ path: op.path, tk, tv2 });
        if (sameJson(rest, getAt(op.path))) return; // only the protection record was added
        op = { ...op, v: rest };
      }
    }
    if (onOperation) await onOperation(op, tree);
    writes.push(op);
    const put = (path, value) => {
      const parts = path.split("/");
      let node = tree;
      for (const k of parts.slice(0, -1)) node = node[k] || (node[k] = {});
      if (value === null) delete node[parts.at(-1)];
      else node[parts.at(-1)] = value;
    };
    if (op.kind === "set") put(op.path, op.v);
    else for (const [k, v] of Object.entries(op.v)) put(op.path + "/" + k, v);
    for (const p of peers)
      await p
        .evaluate((o) => window.__fbApply && window.__fbApply(o), op)
        .catch(() => {});
  });
  await ctx.addInitScript(
    ({ account, uid }) => {
      sessionStorage.setItem("mockuid", uid);
      if (account)
        localStorage.setItem("fxf_battle_account_v1", JSON.stringify(account));
      localStorage.setItem("fxf_no_lb", "1");
    },
    { account, uid },
  );
  await ctx.route("**/*", async (route) => {
    const u = new URL(route.request().url());
    requests.push(u.href);
    if(emulatorNetwork&&u.hostname==='127.0.0.1'&&['9000','9099','4173'].includes(u.port))return route.continue();
    if (u.hostname === "localhost") {
      if (blockedAssets.includes(u.pathname)) return route.abort();
      if (assetOverrides?.[u.pathname])
        return route.fulfill({
          contentType: (u.pathname === "/" || u.pathname.endsWith(".html")) ? "text/html" : u.pathname.endsWith(".css")
            ? "text/css"
            : "application/javascript",
          body: assetOverrides[u.pathname],
        });
      if (!axiomia && u.pathname === "/math-tower-release.js")
        return route.fulfill({ contentType: "application/javascript", body: 'window.MathTowerContentUrl = "math-tower/chapter1.json";' });
      if (towerContent && u.pathname === "/math-tower/chapter1.json")
        return route.fulfill({ json: towerContent });
      const f = path.resolve(siteRoot, "." + u.pathname);
      if (
        f.startsWith(siteRoot + path.sep) &&
        fs.existsSync(f) &&
        fs.statSync(f).isFile()
      )
        return route.fulfill({ path: f });
      if (u.pathname === "/")
        return route.fulfill({ path: path.join(siteRoot, "index.html") });
      return route.abort();
    }
    const libs = [
      [/unpkg\.com\/react@/, "react/umd/react.production.min.js"],
      [/unpkg\.com\/react-dom@/, "react-dom/umd/react-dom.production.min.js"],
      [/unpkg\.com\/@babel/, "@babel/standalone/babel.min.js"],
      [/unpkg\.com\/tone/, "tone/build/Tone.js"],
      [/cdn.tailwindcss.com/, "@tailwindcss/browser/dist/index.global.js"],
    ];
    // index.html loads katex.min.css from cdnjs, which declares the KaTeX_Main / KaTeX_Math faces the formulas use. Tests abort
    // that request (no network), so formulas fall back to a system serif. With realMathFonts the same two faces are served from
    // the repository's own copies (fonts/katex, identical KaTeX 0.16.9 files), so captured formulas look like the real game.
    if (realMathFonts && /cdnjs\.cloudflare\.com\/ajax\/libs\/KaTeX\/[^/]+\/katex\.min\.css/.test(u.href))
      return route.fulfill({
        contentType: "text/css",
        body:
          '@font-face{font-family:KaTeX_Main;font-style:normal;font-weight:400;src:url(http://localhost/fonts/katex/KaTeX_Main-Regular.woff2) format("woff2")}' +
          '@font-face{font-family:KaTeX_Math;font-style:italic;font-weight:400;src:url(http://localhost/fonts/katex/KaTeX_Math-Italic.woff2) format("woff2")}',
      });
    for (const [re, file] of libs)
      if (re.test(u.href))
        return route.fulfill({
          contentType: "application/javascript",
          body: fs.readFileSync(path.join(root, "node_modules", file)),
        });
    if (/firebase-app-compat/.test(u.href))
      return route.fulfill({
        contentType: "application/javascript",
        body:
          firebaseSource ||
          fs.readFileSync(path.join(__dirname, "firebase-mock.js")),
      });
    if (/firebase-(auth|database)-compat/.test(u.href))
      return route.fulfill({ contentType: "application/javascript", body: "" });
    if (u.hostname === "script.google.com")
      return route.fulfill({
        json: { allRecords: [], easy: [], normal: [], hard: [] },
      });
    return route.abort();
  });
  if (captureTower)
    await ctx.addInitScript(() => {
      let factory;
      Object.defineProperty(window, "MathTowerFactory", {
        configurable: true,
        get: () => factory,
        set: (fn) => {
          factory = (H) => {
            window.__towerHelpers = H;
            const components = fn(H);
            window.__towerComponents = components;
            return components;
          };
        },
      });
    });
  const page = await ctx.newPage();

  peers.push(page);
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(url);
  return { ctx, page, writes, errors, tree, requests, keepRecords };
}
async function story(page, confirm = true) {
  for (let n = 0; n < 300; n++) {
    const clicked = await page.evaluate(() => {
      const dialog = document.querySelector("[data-math-dialog]");
      if (!dialog) return false;
      dialog.click();
      return true;
    });
    if (!clicked) {
      if (confirm) await dismissCutin(page);
      return;
    }
    await sleep(25);
  }
  throw Error("Story did not finish");
}
async function pair(page, correct = true) {
  return page.evaluate((ok) => {
    const tiles = [...document.querySelectorAll("[data-btile]")],
      poly = JSON.parse(document.querySelector("[data-poly]").dataset.poly);
    const co = (f) =>
      f.type === "linear"
        ? [f.a, f.b]
        : f.type === "quadratic"
          ? [f.A, f.B, f.C]
          : [f.k];
    for (let i = 0; i < tiles.length; i++)
      for (let j = i + 1; j < tiles.length; j++) {
        const a = co(JSON.parse(tiles[i].dataset.f)),
          b = co(JSON.parse(tiles[j].dataset.f)),
          out = { x4: 0, x3: 0, x2: 0, x1: 0, x0: 0 };
        a.forEach((v, k) =>
          b.forEach(
            (w, l) => (out["x" + (a.length + b.length - 2 - k - l)] += v * w),
          ),
        );
        if (Object.keys(out).every((k) => out[k] === poly[k]) === ok)
          return [tiles[i].dataset.btile, tiles[j].dataset.btile];
      }
  }, correct);
}
async function drag(page, correct = true) {
  const ids = await pair(page, correct);
  assert.ok(ids);
  const a = await page.locator(`[data-btile="${ids[0]}"]`).boundingBox(),
    b = await page.locator(`[data-btile="${ids[1]}"]`).boundingBox();
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 4 });
  await page.mouse.up();
  await sleep(210);
  if (await page.locator(".mt-battle").count()) {
    await page.waitForFunction(
      () =>
        !document.querySelector("[data-math-attack]") &&
        !document.querySelector(".mt-impact"),
    );
    await dismissCutin(page);
  }
  await page.waitForFunction(
    () => !document.querySelector('[data-math-screen="savingResult"]'),
  );
  await sleep(40);
}
async function dismissCutin(page) {
  if (await page.locator("[data-math-cutin]").count())
    await page
      .getByRole("button", { name: "確認して再開", exact: true })
      .click();
}
async function newTower(page, d = "normal") {
  await page.getByRole("button", { name: "はじめから", exact: true }).click();
  await page
    .getByRole("button", { name: new RegExp("^(" + ({easy:'イージー',normal:'ノーマル',hard:'ハード'})[d] + "|" + d.toUpperCase() + ")を選ぶ$"), exact: true })
    .click();
  if (await page.locator("[data-math-screen=replaceConfirm]").count())
    await page
      .getByRole("button", { name: "置き換えて開始", exact: true })
      .click();
  await page.locator("[data-math-screen=prepare]").waitFor();
}
async function continueTower(page, d = "normal") {
  await page.getByRole("button", { name: "続きから", exact: true }).click();
  const btn = page.getByRole("button", {
    name: ({easy:'イージー',normal:'ノーマル',hard:'ハード'})[d] + "を選ぶ",
    exact: true,
  });
  if (await btn.isDisabled()) {
    await page.getByRole("button", { name: "戻る", exact: true }).click();
    await newTower(page, d);
  } else await btn.click();
}
// Shared navigation for the new UI (Ver.6.10). Each helper waits for the destination marker, so tests do not
// depend on how the screens are laid out. Update these first when a route moves.
async function goHome(page) {
  // The logo button exists twice (sidebar / phone header) and both can be briefly visible while the
  // stylesheet re-attaches; a DOM click on either goes home.
  await page.locator('button[aria-label="ホームへ"]').first().evaluate((e) => e.click());
  await page.locator("[data-next-home] .home-content").waitFor();
}
async function openSoloHub(page) {
  await page.locator(".action-card.solo").click();
  await page.locator("[data-solo-hub]").waitFor();
}
async function openSoloMode(page, mode) {
  await openSoloHub(page);
  await page.locator(`[data-solo-mode=${mode}]`).click();
}
async function openOnlineLobby(page) {
  await page.locator(".action-card.online").click();
  await page.locator("[data-next-lobby]").waitFor();
}
async function openProfile(page) {
  await page.locator(".account-main").click();
  await page.locator("[data-next-profile]").waitFor();
}
// Ver.6.13: the main navigation (phone bottom tabs / PC sidebar) is ホーム・対戦・ソロ・順位・プロフィール.
// Only one of the two navs is visible at a time; click the visible item with the given label.
function mainNavItem(page, label) {
  return page.locator(".bottom-nav .nav-item:visible, .sidebar nav .nav-item:visible").filter({ hasText: label instanceof RegExp ? label : new RegExp("^" + label + "$") });
}
async function openRankingHub(page) {
  await mainNavItem(page, /^(順位|ランキング)$/).click();
  await page.locator(".ranking-grid").waitFor();
}
async function openProfileTab(page) {
  await mainNavItem(page, "プロフィール").click();
  await page.locator("[data-next-profile]").waitFor();
}
module.exports = {
  goHome,
  openSoloHub,
  openSoloMode,
  openOnlineLobby,
  openProfile,
  mainNavItem,
  openRankingHub,
  openProfileTab,
  pair,
  newTower,
  continueTower,
  dismissCutin,
  chromium,
  context,
  story,
  drag,
  sleep,
  root,
};
