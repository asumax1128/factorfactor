const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const { chromium } = require("playwright");
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
    siteRoot = root,
  } = {},
) {
  const ctx = await browser.newContext({
    viewport: pc ? { width: 1366, height: 768 } : { width: 390, height: 844 },
    hasTouch: !pc,
  });
  const writes = [],
    errors = [],
    requests = [];
  await ctx.exposeBinding("__fbGet", () => tree);
  await ctx.exposeBinding("__fbOp", async (_, op) => {
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
    if (u.hostname === "localhost") {
      if (blockedAssets.includes(u.pathname)) return route.abort();
      if (assetOverrides?.[u.pathname])
        return route.fulfill({
          contentType: u.pathname.endsWith(".css")
            ? "text/css"
            : "application/javascript",
          body: assetOverrides[u.pathname],
        });
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
  return { ctx, page, writes, errors, tree, requests };
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
    .getByRole("button", { name: d.toUpperCase() + "を選ぶ", exact: true })
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
    name: d.toUpperCase() + "を選ぶ",
    exact: true,
  });
  if (await btn.isDisabled()) {
    await page.getByRole("button", { name: "戻る", exact: true }).click();
    await newTower(page, d);
  } else await btn.click();
}
module.exports = {
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
