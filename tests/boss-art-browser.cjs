// Ver.6.27: suri-data.js was reduced to `images` and `characters` (the old 数理の塔 story data is gone).
// The boss pictures must come out exactly as before: 15 bosses + 2 revived forms, in every place that shows a boss
// (home, solo hub card, the boss picture component used by 今週のボス / クラス協力レイド / フレンドレイド / ボス図鑑).
const assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path");
const { chromium, context, openSoloHub, goHome } = require("./browser-harness.cjs");
const exe = process.env.CHROMIUM_PATH || "/usr/bin/chromium";
// The picture table as it was before the file was reduced (Ver.6.26 suri-data.js `images`), written out here on purpose.
const BEFORE = { dragon: "img/monsters/dragon.webp", kraken: "img/monsters/kraken.webp", golem: "img/monsters/golem.webp", maou: "img/monsters/maou.webp", slime: "img/monsters/slime.webp", robot: "img/monsters/robot.webp", abs: "img/monsters/abs.webp", balance: "img/monsters/balance.webp", mod: "img/monsters/mod.webp", wave: "img/monsters/wave.webp", chimera: "img/monsters/chimera.webp", prime: "img/monsters/prime.webp", sim: "img/monsters/sim.webp", mirror: "img/monsters/mirror.webp", king: "img/monsters/king.webp", maou2: "img/monsters/maou2.webp", king2: "img/monsters/king2.webp" };
const BOSS_IDS = ["dragon", "kraken", "golem", "maou", "slime", "robot", "abs", "balance", "mod", "wave", "chimera", "prime", "sim", "mirror", "king"];
(async () => {
  // ---- the data file itself ----
  const sandbox = { window: {} };
  require("node:vm").runInNewContext(fs.readFileSync("suri-data.js", "utf8"), sandbox);
  const data = sandbox.window.SURI_DATA;
  assert.deepEqual(Object.keys(data).sort(), ["characters", "images", "version"], "only images and characters (and the version) remain");
  assert.deepEqual(JSON.parse(JSON.stringify(data.images)), BEFORE, "the 17 pictures are registered exactly as before");
  for (const f of Object.values(BEFORE)) assert(fs.statSync(f).size > 10000, "picture file exists: " + f);
  assert.deepEqual(Object.keys(data.characters).sort(), ["abs_wolf", "count_rabbit", "minus", "nul", "plus", "twin_fox", "voice", "zero_slime"], "characters kept");
  assert(fs.statSync("suri-data.js").size < 6000, "the file is small now");
  for (const gone of ["chapters", "events", "fragments", "monsters", "notes", "floors", "backgrounds"]) assert(!(gone in data), "old tower data removed: " + gone);
  const html = fs.readFileSync("index.html", "utf8");
  const bossBlock = html.slice(html.indexOf("const BOSSES = ["), html.indexOf("const TEACHER_BOSS"));
  assert.deepEqual([...bossBlock.matchAll(/\bid: '([a-z0-9]+)'/g)].map((m) => m[1]), BOSS_IDS, "the game's boss list is these 15");
  console.log("PASS suri-data.js: only images + characters; 17 pictures registered as before and present on disk; boss list = 15");

  const exposed = html.replace("const root = ReactDOM.createRoot(rootEl);", "window.__bossArt={MonsterPic,BOSSES,bossForm,suriImg};\nconst root = ReactDOM.createRoot(rootEl);");
  assert(exposed.includes("window.__bossArt"), "test hook inserted");
  const b = await chromium.launch({ executablePath: exe });
  try {
    // ---- the shared picture component (今週のボス / レイド / 図鑑 use it): every boss, normal and revived, normal and silhouette ----
    {
      const t = await context(b, { tree: { games: { factor: { accounts: { ateacher: { name: "Teacher" } } } } }, assetOverrides: { "/": exposed } }), p = t.page;
      await p.waitForFunction(() => !!window.__bossArt);
      const out = await p.evaluate(async (ids) => {
        const { MonsterPic, BOSSES, bossForm, suriImg } = window.__bossArt;
        const el = document.createElement("div"); document.body.appendChild(el);
        const rows = [];
        for (const b of BOSSES) rows.push([b.id, b.id, false], [b.id + "/silhouette", b.id, true]);
        rows.push(["maou2", "maou2", false], ["king2", "king2", false]);
        ReactDOM.createRoot(el).render(React.createElement("div", null, rows.map(([k, id, sil]) => React.createElement("span", { key: k, "data-art": k }, React.createElement(MonsterPic, { id, icon: "?", size: 64, sil })))));
        await new Promise((r) => setTimeout(r, 50));
        const res = {};
        for (const s of el.querySelectorAll("[data-art]")) { const img = s.querySelector("img"); if (img) await img.decode().catch(() => {}); res[s.dataset.art] = img ? [img.getAttribute("src"), img.naturalWidth > 0, getComputedStyle(img).filter] : null; }
        return { res, ids: BOSSES.map((x) => x.id), forms: { maou: bossForm({ id: "maou", name: "m", img: null }, true).img, king: bossForm({ id: "king", name: "k" }, true), kingPlain: bossForm({ id: "king", name: "k" }, false).name, dragon: bossForm({ id: "dragon", name: "d", img: "x" }, true).img }, img: Object.fromEntries(ids.map((i) => [i, suriImg(i)])) };
      }, Object.keys(BEFORE));
      assert.deepEqual(out.ids, BOSS_IDS);
      assert.deepEqual(out.img, BEFORE, "suriImg gives the same 17 paths in the page");
      for (const id of BOSS_IDS) {
        assert.deepEqual(out.res[id] && out.res[id].slice(0, 2), [BEFORE[id], true], "picture shown and decoded: " + id);
        assert.deepEqual(out.res[id + "/silhouette"] && out.res[id + "/silhouette"].slice(0, 2), [BEFORE[id], true], "silhouette uses the same picture: " + id);
        assert.notEqual(out.res[id + "/silhouette"][2], "none", "silhouette filter applied: " + id);
      }
      for (const id of ["maou2", "king2"]) assert.deepEqual(out.res[id] && out.res[id].slice(0, 2), [BEFORE[id], true], "revived form picture shown and decoded: " + id);
      assert.equal(out.forms.maou, BEFORE.maou2, "revived 魔王 uses maou2");
      assert.equal(out.forms.king.img, BEFORE.king2, "revived 因数の王 uses king2"); assert.equal(out.forms.king.name, "真・因数の王"); assert.equal(out.forms.kingPlain, "k");
      assert.equal(out.forms.dragon, "x", "a boss without a revived picture keeps its own");
      assert.deepEqual(t.errors, []); await t.ctx.close();
      console.log("PASS boss picture component: 15 bosses (picture + silhouette) and 2 revived forms shown and decoded; revived forms resolve as before");
    }
    // ---- real screens: home stage and solo hub card for each of the 15 weekly bosses ----
    {
      const d = new Date(Date.now() + 9 * 3600000); d.setUTCDate(d.getUTCDate() - (d.getUTCDay() + 6) % 7); const week = d.toISOString().slice(0, 10);
      for (const id of BOSS_IDS) {
        const tree = { games: { factor: { accounts: { ateacher: { name: "Teacher" } }, raidw: { [week]: { meta: { boss: id, rage: 0 }, dmg: { fixture: { d: 100 } } } } } } };
        const t = await context(b, { tree }), p = t.page;
        const art = p.locator(".boss-art img"); await art.waitFor(); await art.evaluate((e) => e.decode());
        assert.deepEqual(await art.evaluate((e) => [e.getAttribute("src"), e.naturalWidth > 0]), [BEFORE[id], true], "home boss picture: " + id);
        await openSoloHub(p);
        const card = p.locator("[data-solo-mode=boss] .solo-art img"); await card.waitFor(); await card.evaluate((e) => e.decode());
        assert.deepEqual(await card.evaluate((e) => [e.getAttribute("src"), e.naturalWidth > 0]), [BEFORE[id], true], "solo hub boss card picture: " + id);
        assert.deepEqual(t.errors, []); await t.ctx.close();
      }
      console.log("PASS real screens: home boss stage and solo hub boss card show the right picture for each of the 15 bosses");
    }
    // ---- 今週のボス screen: the boss picture and the 図鑑 entries are pictures, not emoji ----
    {
      const d = new Date(Date.now() + 9 * 3600000); d.setUTCDate(d.getUTCDate() - (d.getUTCDay() + 6) % 7); const week = d.toISOString().slice(0, 10);
      const tree = { games: { factor: { accounts: { ateacher: { name: "Teacher", stats: { wk: { boss: Object.fromEntries(BOSS_IDS.map((i) => [i, 1])) } } } }, raidw: { [week]: { meta: { boss: "kraken", rage: 0 }, dmg: { fixture: { d: 100 } } } } } } };
      const t = await context(b, { tree }), p = t.page;
      await p.locator(".boss-details .small-button").click();
      await p.locator("[data-weekly-menu]").waitFor();
      await p.waitForFunction((src) => [...document.querySelectorAll("[data-weekly-menu] img")].some((e) => e.getAttribute("src") === src && e.naturalWidth > 0), BEFORE.kraken, { timeout: 15000 });
      const srcs = await p.locator("[data-weekly-menu] img").evaluateAll((es) => es.map((e) => e.getAttribute("src")));
      const shown = new Set(srcs);
      const missing = BOSS_IDS.filter((i) => !shown.has(BEFORE[i]));
      assert.deepEqual(missing, [], "今週のボス screen (boss + 図鑑) shows a picture for every boss");
      assert.deepEqual(t.errors, []); await t.ctx.close();
      console.log("PASS 今週のボス screen: this week's boss and all 15 図鑑 entries are pictures");
    }
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
