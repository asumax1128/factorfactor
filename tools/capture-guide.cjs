// Captures the real game for the 「あそびかた」 visual guide and writes ui-next/guide/*.webp + guide-shots.json.
// Uses the test harness (local files + Firebase mock) and the read-only solo pair helper; no game code is changed.
// Run after a UI change:  CHROMIUM_PATH=… node tools/capture-guide.cjs
// Official artwork is never modified; the guide uses resized copies (art-*.webp).
//
// Ver.6.15 notes
//  - Math font: the game styles formulas with KaTeX_Main / KaTeX_Math, which index.html gets from the cdnjs katex.min.css. The test
//    harness blocks that request, so earlier captures showed a system serif. realMathFonts serves the same two faces from fonts/katex,
//    and every capture waits for them and asserts they are loaded (the script fails instead of writing wrong-looking images).
//  - Compact images: the game is captured in a shorter browser window (390×SHORT_H). The tiles are shorter there, but the formula
//    and tile type sizes are unchanged (they follow the 390px width), so nothing is scaled down. Images are then cropped to the part
//    that matters; marks are computed from the cropped region, so they stay aligned.
const fs = require("node:fs"), path = require("node:path");
const H = require("../tests/browser-harness.cjs");
const { soloPair } = require("../tests/solo-test-helper.cjs");
const OUT = path.join(__dirname, "..", "ui-next", "guide");
const W = 390, VH = 844, SHORT_H = 600, SCALE = 2, Q = 0.7;
const weekKey = (t = Date.now()) => { const d = new Date(t + 9 * 3600e3); const wd = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - wd); return d.toISOString().slice(0, 10); };
const ACCOUNT = { key: "aplayer", name: "プレイヤー" };
const tree = () => ({ games: { factor: {
  accounts: { aplayer: { name: "プレイヤー", stats: { exp: 2400, rating: 1650, perfects: 64 }, prof: { lv: { L1: { n: 30, ok: 25, ms: 100000 } } } } },
  raidw: { [weekKey()]: { meta: { boss: "dragon", rage: 0 }, dmg: { a: { d: 12000 } } } },
  onlineSparkV1: { config: { enabled: true, protocol: "spark-v1" }, profiles: { aplayer: { name: "プレイヤー", easy: { rating: 1665.6 }, normal: { rating: 1580 } } } },
} } });
const shots = { meta: { fonts: "KaTeX_Main, KaTeX_Math (fonts/katex)", captureHeight: SHORT_H } };
let converter;
// PNG buffer → WebP file (encoded by Chromium's canvas, so no extra dependency).
async function webp(png, name, maxWidth) {
  const data = await converter.evaluate(async ({ b64, maxWidth, q }) => {
    const img = new Image(); img.src = "data:image/png;base64," + b64; await img.decode();
    const k = maxWidth && img.naturalWidth > maxWidth ? maxWidth / img.naturalWidth : 1;
    const c = document.createElement("canvas"); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    return { url: c.toDataURL("image/webp", q), w: c.width, h: c.height };
  }, { b64: png.toString("base64"), maxWidth, q: Q });
  const file = name + ".webp";
  fs.writeFileSync(path.join(OUT, file), Buffer.from(data.url.split(",")[1], "base64"));
  return { file, w: data.w, h: data.h };
}
// Boxes of elements in CSS px, converted to % of the clip so captions stay aligned after a re-capture.
async function boxes(page, selectors, clip) {
  const out = [];
  for (const [label, sel] of selectors) {
    const b = await page.locator(sel).first().boundingBox();
    if (!b) throw Error("no element for mark " + label + " " + sel);
    if (b.y < clip.y - 1 || b.y + b.height > clip.y + clip.height + 1) throw Error("mark outside the cropped image: " + label);
    out.push({ label, x: +((b.x - clip.x) / clip.width * 100).toFixed(2), y: +((b.y - clip.y) / clip.height * 100).toFixed(2), w: +(b.width / clip.width * 100).toFixed(2), h: +(b.height / clip.height * 100).toFixed(2) });
  }
  return out;
}
// Fonts of the formulas must be the real ones before anything is captured.
async function fontsReady(page) {
  const r = await page.evaluate(async () => {
    await document.fonts.load("16px KaTeX_Main", "0123456789()+-"); await document.fonts.load("italic 16px KaTeX_Math", "x");
    await document.fonts.ready;
    return { main: document.fonts.check("16px KaTeX_Main"), math: document.fonts.check("italic 16px KaTeX_Math"), loaded: [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family) };
  });
  if (!r.main || !r.math || !r.loaded.includes("KaTeX_Main") || !r.loaded.includes("KaTeX_Math")) throw Error("math fonts not loaded: " + JSON.stringify(r));
}
async function shoot(page, name, { clip = { x: 0, y: 0, width: W, height: VH }, marks = [], alt }) {
  const m = marks.length ? await boxes(page, marks, clip) : [];
  await fontsReady(page);
  const png = await page.screenshot({ clip });
  shots[name] = { ...(await webp(png, name)), alt, marks: m };
  console.log("shot", name, shots[name].w + "x" + shots[name].h);
}
async function art(src, name, alt) {
  const png = await converter.evaluate(async (dataUrl) => { const img = new Image(); img.src = dataUrl; await img.decode(); const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight; c.getContext("2d").drawImage(img, 0, 0); return c.toDataURL("image/png").split(",")[1]; },
    "data:image/" + (src.endsWith(".webp") ? "webp" : "png") + ";base64," + fs.readFileSync(path.join(__dirname, "..", src)).toString("base64"));
  shots[name] = { ...(await webp(Buffer.from(png, "base64"), name, 540)), alt, marks: [], source: src };
  console.log("art", name, shots[name].w + "x" + shots[name].h);
}
const box = async (page, sel) => page.locator(sel).first().boundingBox();
const center = (b) => ({ x: b.x + b.width / 2, y: b.y + b.height / 2 });
const span = (top, bottom) => ({ x: 0, y: Math.max(0, Math.floor(top)), width: W, height: Math.ceil(bottom - Math.max(0, Math.floor(top))) });
async function fresh(b, { height = VH, ...extra } = {}) {
  const t = await H.context(b, { tree: tree(), account: ACCOUNT, scale: SCALE, realMathFonts: true, ...extra });
  await t.page.setViewportSize({ width: W, height });
  await t.page.locator("[data-next-home]").waitFor();
  return t;
}
// Area between the app header and the bottom tab bar (both are fixed chrome, not part of the content).
async function contentArea(page) {
  return page.evaluate(() => {
    const vis = (sel) => [...document.querySelectorAll(sel)].find((e) => e.offsetParent && e.getBoundingClientRect().height > 0);
    const h = vis(".mobile-top"), n = vis(".bottom-nav");
    return { top: h ? Math.ceil(h.getBoundingClientRect().bottom) : 0, bottom: n ? Math.floor(n.getBoundingClientRect().top) : innerHeight };
  });
}
// Tiles grouped by row: [{ ids:[…], top, bottom }]
async function tileRows(page) {
  return page.evaluate(() => {
    const rows = new Map();
    for (const e of document.querySelectorAll("[data-tile-id]")) { const r = e.getBoundingClientRect(), k = Math.round(r.top); if (!rows.has(k)) rows.set(k, { ids: [], top: r.top, bottom: r.bottom }); rows.get(k).ids.push(e.dataset.tileId); }
    return [...rows.values()].sort((a, b) => a.top - b.top);
  });
}
const rowOf = (rows, id) => rows.findIndex((r) => r.ids.includes(id));
// Starts an easy solo game in the short window and retries until both correct tiles are in the top row, so the drag and the merge
// can be shown in a one-row crop (target card + top row).
async function easyBoard(b) {
  for (let tries = 0; tries < 40; tries++) {
    const t = await fresh(b, { height: SHORT_H }), p = t.page;
    await H.openSoloMode(p, "play");
    await p.locator("button:visible").filter({ hasText: /^イージー/ }).first().click();
    await p.getByRole("button", { name: "スタート", exact: true }).click();
    await p.locator("[data-tile-id]").first().waitFor(); await p.waitForTimeout(400);
    const pair = await soloPair(p, true); if (!pair || pair.error) throw Error("pair " + JSON.stringify(pair));
    const rows = await tileRows(p);
    if (rowOf(rows, pair[0]) === 0 && rowOf(rows, pair[1]) === 0) return { t, p, pair, rows };
    await t.ctx.close();
  }
  throw Error("no board with both correct tiles in the top row");
}
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  for (const f of fs.readdirSync(OUT)) if (f.endsWith(".webp")) fs.unlinkSync(path.join(OUT, f));
  const b = await H.chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium" });
  converter = await (await b.newContext()).newPage();
  try {
    // STEP 3: difficulty screen (full-height window is fine: it is short).
    {
      const t = await fresh(b), p = t.page; await H.openSoloMode(p, "play");
      const e = await box(p, "button:has-text('イージー')"), st = await box(p, "button:has-text('スタート')");
      await shoot(p, "s3-difficulty", { clip: span(e.y - 64, st.y + st.height + 16), alt: "難易度の選択画面", marks: [["難易度", "button:has-text('イージー')"], ["スタート", "button:has-text('スタート')"]] });
      await t.ctx.close();
    }
    // STEP 1 / 2: easy board (6 tiles), drag, correct merge, Perfect, miss.
    {
      const { t, p, pair, rows } = await easyBoard(b);
      const target = await box(p, ".v7-target"), r0 = rows[rowOf(rows, pair[0])], bottomRow = rows[rows.length - 1];
      shots.meta.tiles = await p.locator("[data-tile-id]").count();
      shots.meta.easyTiles = shots.meta.tiles;
      await shoot(p, "s1-board", { clip: span(target.y - 8, bottomRow.bottom + 8), alt: "イージーの問題画面（上が式、下が6枚の因数タイル）", marks: [["式", ".v7-target"], ["タイル1", `[data-tile-id="${pair[0]}"]`], ["タイル2", `[data-tile-id="${pair[1]}"]`]] });
      const rowClip = span(target.y - 8, r0.bottom + 3);
      const a = center(await box(p, `[data-tile-id="${pair[0]}"]`)), c = center(await box(p, `[data-tile-id="${pair[1]}"]`));
      await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.move((a.x + c.x) / 2, (a.y + c.y) / 2, { steps: 4 }); await p.waitForTimeout(120);
      await shoot(p, "s1-drag", { clip: rowClip, alt: "1枚を押さえたままドラッグしている画面（金色の枠と線）", marks: [["押さえる", `[data-tile-id="${pair[0]}"]`], ["ここで離す", `[data-tile-id="${pair[1]}"]`]] });
      await p.mouse.move(c.x, c.y, { steps: 2 }); await p.mouse.up(); await p.waitForTimeout(90);
      await shoot(p, "s1-correct", { clip: rowClip, alt: "正解した2枚が水色に光る画面" });
      // Perfect: answer the following question immediately (the screenshots above take longer than 2 seconds).
      let judge = null;
      for (let i = 0; i < 4 && judge !== "Perfect"; i++) {
        await p.waitForTimeout(1100);
        const q = await soloPair(p, true); if (!q || q.error) throw Error("pair " + JSON.stringify(q));
        const qa = center(await box(p, `[data-tile-id="${q[0]}"]`)), qc = center(await box(p, `[data-tile-id="${q[1]}"]`));
        await p.mouse.move(qa.x, qa.y); await p.mouse.down(); await p.mouse.move(qc.x, qc.y, { steps: 2 }); await p.mouse.up();
        await p.locator("[data-timing-judge]:visible").first().waitFor({ timeout: 3000 });
        judge = await p.locator("[data-timing-judge]:visible").first().getAttribute("data-timing-judge");
      }
      if (judge !== "Perfect") throw Error("expected a Perfect capture, got " + judge);
      const tg = await box(p, ".v7-target");
      await shoot(p, "s2-perfect", { clip: span(0, tg.y + tg.height + 12), alt: "Perfectの演出（HP＋25%）", marks: [["判定", "[data-timing-judge]:visible"], ["HP", ".v7-hpb"]] });
      // Miss: two tiles of one row that are not the correct pair.
      await p.waitForTimeout(1000);
      const cur = await soloPair(p, true), rws = await tileRows(p);
      // two top-row tiles that are not the correct pair (keeps the crop to HP bar + target + one row)
      const top3 = rws[0].ids, combos = [[0, 1], [0, 2], [1, 2]].map(([i, j]) => [top3[i], top3[j]]);
      const pick = combos.find((c) => !(cur.includes(c[0]) && cur.includes(c[1])));
      const row = rws[0];
      const hp = await box(p, ".v7-hpb"), tg2 = await box(p, ".v7-target");
      const wa = center(await box(p, `[data-tile-id="${pick[0]}"]`)), wb = center(await box(p, `[data-tile-id="${pick[1]}"]`));
      await p.mouse.move(wa.x, wa.y); await p.mouse.down(); await p.mouse.move(wb.x, wb.y, { steps: 3 }); await p.mouse.up(); await p.waitForTimeout(160);
      void tg2;
      await shoot(p, "s1-miss", { clip: span(hp.y - 8, row.bottom + 3), alt: "不正解の画面（2枚が赤くなりBad）" });
      await t.ctx.close();
    }
    // STEP 5: battle boards (CPU practice, same board as online play): header, scores / HP and the first tile row.
    for (const mode of ["A", "B"]) {
      const t = await fresh(b, { height: SHORT_H }), p = t.page; await H.openSoloMode(p, "cpu");
      await p.getByRole("group", { name: "方式", exact: true }).getByRole("button", { name: mode === "A" ? "A方式" : "新B方式", exact: true }).click();
      await p.getByRole("button", { name: "CPUと練習スタート", exact: true }).click(); await p.locator("[data-btile]").first().waitFor();
      await p.waitForTimeout(mode === "B" ? 7000 : 1500);
      const first = await p.locator("[data-btile]").evaluateAll((es) => { const tops = es.map((e) => e.getBoundingClientRect()); const t0 = Math.min(...tops.map((r) => r.top)); return Math.max(...tops.filter((r) => Math.abs(r.top - t0) < 2).map((r) => r.bottom)); });
      await shoot(p, "s5-battle-" + mode.toLowerCase(), { clip: span(0, first + 8), alt: mode === "A" ? "A方式の対戦画面（CPU練習の例）" : "新B方式の対戦画面（CPU練習の例）" });
      await t.ctx.close();
    }
    // STEP 6: ghost tiles in the online lobby and a real hyper ghost start (own easy record is in the TOP10).
    {
      const ui = fs.readFileSync(path.join(__dirname, "..", "online-rated-ui.js"), "utf8");
      const t = await fresh(b, { assetOverrides: { "/online-rated-ui.js": ui } }), p = t.page;
      await H.openOnlineLobby(p); await p.waitForFunction(() => !document.querySelector("[data-ghost-start=easy]").disabled);
      await p.locator("[data-ghost-tiles]").evaluate((e) => { e.closest("section, .next-panel")?.scrollIntoView({ block: "start" }); window.scrollBy(0, -12); });
      await p.waitForTimeout(300);
      const g = await box(p, "[data-ghost-tiles]");
      await shoot(p, "s6-ghost-tiles", { clip: { x: 0, y: Math.max(0, Math.floor(g.y) - 56), width: W, height: Math.ceil(g.height) + 80 }, alt: "オンライン画面のゴースト対戦（3種類）", marks: [["イージー", "[data-ghost-start=easy]"], ["ノーマル", "[data-ghost-start=normal]"], ["ハイパー", "[data-ghost-hyper]"]] });
      await p.locator("[data-ghost-start=hyper-easy]").click(); await p.locator("[data-om=vote]").waitFor({ timeout: 20000 }); await p.waitForTimeout(500);
      const bb = await box(p, "button:has-text('B：レース＋攻撃')"), card = await box(p, "[data-om=vote]");
      await shoot(p, "s6-ghost-start", { clip: span(card.y - 12, bb.y + bb.height + 14), alt: "ゴースト対戦の開始画面（方式を選ぶ）" });
      await t.ctx.close();
    }
    // STEP 7: weekly boss sortie screen (boss card → 出撃する).
    {
      const t = await fresh(b), p = t.page; await H.openSoloMode(p, "boss"); await p.getByText("1回の出撃は60秒", { exact: false }).waitFor(); await p.waitForTimeout(800);
      const end = await box(p, "button:has-text('出撃する')"), name = await box(p, "text=因数ドラゴン >> nth=0");
      await shoot(p, "s7-weekly", { clip: span(name.y - 14, end.y + end.height + 14), alt: "今週のボスの出撃画面" });
      await t.ctx.close();
    }
    // STEP 8: ranking hub and the top of the profile.
    {
      const t = await fresh(b), p = t.page;
      await H.openRankingHub(p); await p.waitForTimeout(400);
      { const a = await contentArea(p), last = await p.locator(".ranking-entry").last().boundingBox();
        await shoot(p, "s8-ranking", { clip: span(a.top + 4, last.y + last.height + 14), alt: "ランキング（ソロ・デイリー・レーティング）" }); }
      await H.openProfileTab(p); await p.waitForTimeout(900);
      { const a = await contentArea(p); await shoot(p, "s8-profile", { clip: span(a.top + 4, Math.min(a.bottom, a.top + 4 + 470)), alt: "プロフィール（レベル・EXP・レーティング）" }); }
      await t.ctx.close();
    }
    // Official artwork, resized copies only.
    await art("ui-next/solo/solo.png", "art-solo", "通常プレイ");
    await art("ui-next/solo/cpu.png", "art-cpu", "CPU練習");
    await art("img/monsters/dragon.webp", "art-boss", "今週のボスの例（因数ドラゴン）");
    fs.writeFileSync(path.join(OUT, "guide-shots.json"), JSON.stringify({ version: 2, scale: SCALE, width: W, shots }, null, 1) + "\n");
    const total = fs.readdirSync(OUT).filter((f) => f.endsWith(".webp")).reduce((n, f) => n + fs.statSync(path.join(OUT, f)).size, 0);
    console.log("guide images:", Object.keys(shots).length - 1, "total", Math.round(total / 1024) + "KB");
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
