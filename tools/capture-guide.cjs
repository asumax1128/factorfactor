// Ver.6.14: captures the real game for the 「あそびかた」 visual guide and writes ui-next/guide/*.webp + guide-shots.json.
// Uses the test harness (local files + Firebase mock) and the read-only solo pair helper; no game code is changed.
// Run after a UI change:  CHROMIUM_PATH=… node tools/capture-guide.cjs
// Official artwork is never modified; the guide uses resized copies (art-*.webp).
const fs = require("node:fs"), path = require("node:path");
const H = require("../tests/browser-harness.cjs");
const { soloPair } = require("../tests/solo-test-helper.cjs");
const OUT = path.join(__dirname, "..", "ui-next", "guide");
const W = 390, VH = 844, SCALE = 2, Q = 0.7;
const weekKey = (t = Date.now()) => { const d = new Date(t + 9 * 3600e3); const wd = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - wd); return d.toISOString().slice(0, 10); };
const ACCOUNT = { key: "aplayer", name: "プレイヤー" };
const tree = () => ({ games: { factor: {
  accounts: { aplayer: { name: "プレイヤー", stats: { exp: 2400, rating: 1650, perfects: 64 }, prof: { lv: { L1: { n: 30, ok: 25, ms: 100000 } } } } },
  raidw: { [weekKey()]: { meta: { boss: "dragon", rage: 0 }, dmg: { a: { d: 12000 } } } },
  onlineSparkV1: { config: { enabled: true, protocol: "spark-v1" }, profiles: { aplayer: { name: "プレイヤー", easy: { rating: 1665.6 }, normal: { rating: 1580 } } } },
} } });
const shots = {};
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
    out.push({ label, x: +((b.x - clip.x) / clip.width * 100).toFixed(2), y: +((b.y - clip.y) / clip.height * 100).toFixed(2), w: +(b.width / clip.width * 100).toFixed(2), h: +(b.height / clip.height * 100).toFixed(2) });
  }
  return out;
}
async function shoot(page, name, { clip = { x: 0, y: 0, width: W, height: VH }, marks = [], alt }) {
  const m = marks.length ? await boxes(page, marks, clip) : [];
  const png = await page.screenshot({ clip });
  shots[name] = { ...(await webp(png, name)), alt, marks: m };
  console.log("shot", name, shots[name].w + "x" + shots[name].h);
}
async function art(src, name, alt) {
  const png = await converter.evaluate(async (dataUrl) => { const img = new Image(); img.src = dataUrl; await img.decode(); const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight; c.getContext("2d").drawImage(img, 0, 0); return c.toDataURL("image/png").split(",")[1]; },
    "data:image/" + (src.endsWith(".webp") ? "webp" : "png") + ";base64," + fs.readFileSync(path.join(__dirname, "..", src)).toString("base64"));
  shots[name] = { ...(await webp(Buffer.from(png, "base64"), name, 360 * SCALE / 2 * 1.5)), alt, marks: [], source: src };
  console.log("art", name, shots[name].w + "x" + shots[name].h);
}
const box = async (page, sel) => page.locator(sel).first().boundingBox();
const center = (b) => ({ x: b.x + b.width / 2, y: b.y + b.height / 2 });
async function fresh(b, extra = {}) {
  const t = await H.context(b, { tree: tree(), account: ACCOUNT, scale: SCALE, ...extra });
  await t.page.setViewportSize({ width: W, height: VH });
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
const span = (top, bottom) => ({ x: 0, y: Math.max(0, Math.floor(top)), width: W, height: Math.ceil(bottom - Math.max(0, Math.floor(top))) });
// The solo board region: from the target card to the bottom of the tile grid.
async function boardClip(page) {
  const top = await box(page, ".v7-target"), tiles = await page.locator("[data-tile-id]").evaluateAll((es) => es.map((e) => e.getBoundingClientRect().bottom));
  const y = Math.max(0, Math.floor(top.y) - 8), bottom = Math.ceil(Math.max(...tiles)) + 10;
  return { x: 0, y, width: W, height: Math.min(VH, bottom) - y };
}
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  for (const f of fs.readdirSync(OUT)) if (f.endsWith(".webp")) fs.unlinkSync(path.join(OUT, f));
  const b = await H.chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium" });
  converter = await (await b.newContext()).newPage();
  try {
    // STEP 1 / 2: easy solo board, drag, correct merge, Perfect, miss.
    {
      const t = await fresh(b), p = t.page;
      await H.openSoloMode(p, "play");
      { const e = await box(p, "button:has-text('イージー')"), st = await box(p, "button:has-text('スタート')");
        await shoot(p, "s3-difficulty", { clip: span(e.y - 64, st.y + st.height + 16), alt: "難易度の選択画面", marks: [["難易度", "button:has-text('イージー')"], ["スタート", "button:has-text('スタート')"]] }); }
      await p.locator("button:visible").filter({ hasText: /^イージー/ }).first().click();
      await p.getByRole("button", { name: "スタート", exact: true }).click();
      await p.locator("[data-tile-id]").first().waitFor(); await p.waitForTimeout(400);
      const pair = await soloPair(p, true); if (!pair || pair.error) throw Error("pair " + JSON.stringify(pair));
      const clip = await boardClip(p);
      shots.meta = { tiles: await p.locator("[data-tile-id]").count() };
      await shoot(p, "s1-board", { clip, alt: "イージーの問題画面（上が式、下が6枚の因数タイル）", marks: [["式", ".v7-target"], ["タイル1", `[data-tile-id="${pair[0]}"]`], ["タイル2", `[data-tile-id="${pair[1]}"]`]] });
      const a = center(await box(p, `[data-tile-id="${pair[0]}"]`)), c = center(await box(p, `[data-tile-id="${pair[1]}"]`));
      await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.move((a.x + c.x) / 2, (a.y + c.y) / 2, { steps: 4 }); await p.waitForTimeout(120);
      await shoot(p, "s1-drag", { clip, alt: "1枚を押さえたままドラッグしている画面（金色の枠と線）", marks: [["押さえる", `[data-tile-id="${pair[0]}"]`], ["ここで離す", `[data-tile-id="${pair[1]}"]`]] });
      await p.mouse.move(c.x, c.y, { steps: 2 }); await p.mouse.up(); await p.waitForTimeout(90);
      await shoot(p, "s1-correct", { clip, alt: "正解した2枚が水色に光る画面" });
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
      await shoot(p, "s2-perfect", { clip: { x: 0, y: 0, width: W, height: Math.ceil((await box(p, ".v7-target")).y + (await box(p, ".v7-target")).height) + 12 }, alt: "Perfectの演出（HP＋25%）", marks: [["判定", "[data-timing-judge]:visible"], ["HP", ".v7-hpb"]] });
      await p.waitForTimeout(1000);
      const wrong = await soloPair(p, false); const wa = center(await box(p, `[data-tile-id="${wrong[0]}"]`)), wb = center(await box(p, `[data-tile-id="${wrong[1]}"]`));
      await p.mouse.move(wa.x, wa.y); await p.mouse.down(); await p.mouse.move(wb.x, wb.y, { steps: 3 }); await p.mouse.up(); await p.waitForTimeout(160);
      await shoot(p, "s1-miss", { clip: { x: 0, y: 0, width: W, height: (await boardClip(p)).y + (await boardClip(p)).height }, alt: "不正解の画面（2枚が赤くなりBad）" });
      await t.ctx.close();
    }
    // STEP 5: battle boards (CPU practice, same board as online play).
    for (const mode of ["A", "B"]) {
      const t = await fresh(b), p = t.page; await H.openSoloMode(p, "cpu");
      await p.getByRole("group", { name: "方式", exact: true }).getByRole("button", { name: mode === "A" ? "A方式" : "新B方式", exact: true }).click();
      await p.getByRole("button", { name: "CPUと練習スタート", exact: true }).click(); await p.locator("[data-btile]").first().waitFor();
      await p.waitForTimeout(mode === "B" ? 7000 : 1500);
      await shoot(p, "s5-battle-" + mode.toLowerCase(), { alt: mode === "A" ? "A方式の対戦画面（CPU練習の例）" : "新B方式の対戦画面（CPU練習の例）" });
      await t.ctx.close();
    }
    // STEP 6: ghost tiles in the online lobby and a real hyper ghost start (own easy record is in the TOP10).
    {
      const ui = fs.readFileSync(path.join(__dirname, "..", "online-rated-ui.js"), "utf8");
      const t = await fresh(b, { assetOverrides: { "/online-rated-ui.js": ui } }), p = t.page;
      await H.openOnlineLobby(p); await p.waitForFunction(() => !document.querySelector("[data-ghost-start=easy]").disabled);
      const panel = await p.locator("[data-ghost-tiles]").evaluate((e) => { e.closest("section, .next-panel")?.scrollIntoView({ block: "start" }); window.scrollBy(0, -12); return true; });
      await p.waitForTimeout(300);
      const g = await box(p, "[data-ghost-tiles]");
      await shoot(p, "s6-ghost-tiles", { clip: { x: 0, y: Math.max(0, Math.floor(g.y) - 56), width: W, height: Math.ceil(g.height) + 80 }, alt: "オンライン画面のゴースト対戦（3種類）", marks: [["イージー", "[data-ghost-start=easy]"], ["ノーマル", "[data-ghost-start=normal]"], ["ハイパー", "[data-ghost-hyper]"]] });
      await p.locator("[data-ghost-start=hyper-easy]").click(); await p.locator("[data-om=vote]").waitFor({ timeout: 20000 }); await p.waitForTimeout(500);
      await shoot(p, "s6-ghost-start", { clip: { x: 0, y: 0, width: W, height: 640 }, alt: "ゴースト対戦の開始画面（方式を選ぶ）" });
      void panel; await t.ctx.close();
    }
    // STEP 7: weekly boss sortie screen.
    {
      const t = await fresh(b), p = t.page; await H.openSoloMode(p, "boss"); await p.getByText("1回の出撃は60秒", { exact: false }).waitFor(); await p.waitForTimeout(800);
      const end = await box(p, "button:has-text('出撃する')"), head = await box(p, "text=今週のボス >> nth=0");
      await shoot(p, "s7-weekly", { clip: span(head.y - 12, Math.min((await contentArea(p)).bottom, end.y + end.height + 44)), alt: "今週のボスの出撃画面" });
      await t.ctx.close();
    }
    // STEP 8: profile and ranking hub.
    {
      const t = await fresh(b), p = t.page;
      await H.openRankingHub(p); await p.waitForTimeout(400);
      { const a = await contentArea(p), last = await p.locator(".ranking-entry").last().boundingBox();
        await shoot(p, "s8-ranking", { clip: span(a.top + 4, last.y + last.height + 14), alt: "ランキング（ソロ・デイリー・レーティング）" }); }
      await H.openProfileTab(p); await p.waitForTimeout(900);
      { const a = await contentArea(p); await shoot(p, "s8-profile", { clip: span(a.top + 4, a.bottom), alt: "プロフィール（レベル・EXP・レーティング）" }); }
      await t.ctx.close();
    }
    // Official artwork, resized copies only.
    await art("ui-next/solo/solo.png", "art-solo", "通常プレイ");
    await art("ui-next/solo/cpu.png", "art-cpu", "CPU練習");
    await art("img/monsters/dragon.webp", "art-boss", "今週のボスの例（因数ドラゴン）");
    fs.writeFileSync(path.join(OUT, "guide-shots.json"), JSON.stringify({ version: 1, scale: SCALE, width: W, shots }, null, 1) + "\n");
    const total = fs.readdirSync(OUT).filter((f) => f.endsWith(".webp")).reduce((n, f) => n + fs.statSync(path.join(OUT, f)).size, 0);
    console.log("guide images:", Object.keys(shots).length - 1, "total", Math.round(total / 1024) + "KB");
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
