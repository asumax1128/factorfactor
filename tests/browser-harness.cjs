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
    writes.push(op);
    const parts = op.path.split("/");
    let node = tree;
    for (const k of parts.slice(0, -1)) node = node[k] || (node[k] = {});
    if (op.kind === "set") node[parts.at(-1)] = op.v;
    else node[parts.at(-1)] = { ...node[parts.at(-1)], ...op.v };
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
      const f = path.resolve(root, "." + u.pathname);
      if (
        f.startsWith(root + path.sep) &&
        fs.existsSync(f) &&
        fs.statSync(f).isFile()
      )
        return route.fulfill({ path: f });
      if (u.pathname === "/")
        return route.fulfill({ path: path.join(root, "index.html") });
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
        body: fs.readFileSync(path.join(__dirname, "firebase-mock.js")),
      });
    if (/firebase-(auth|database)-compat/.test(u.href))
      return route.fulfill({ contentType: "application/javascript", body: "" });
    if (u.hostname === "script.google.com")
      return route.fulfill({
        json: { allRecords: [], easy: [], normal: [], hard: [] },
      });
    return route.abort();
  });
  const page = await ctx.newPage();
  peers.push(page);
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(url);
  return { ctx, page, writes, errors, tree, requests };
}
async function story(page) {
  for (let n = 0; n < 300; n++) {
    const dialog = page.locator("[data-math-dialog]");
    if (!(await dialog.count())) return;
    await dialog.click();
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
}
module.exports = { chromium, context, story, drag, sleep, root };
