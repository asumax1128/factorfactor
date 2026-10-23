// Ver.6.16 UI only: hyper-ghost difficulty buttons centred and equal, profile 「ゴースト対戦」 dialog buttons padded,
// ghost history readable on the dark profile (no white-on-white) and folded under 「詳細な成績を見る」 (closed at first).
const assert = require("node:assert/strict");
const { chromium, context, openOnlineLobby, openProfile } = require("./browser-harness.cjs");
const lum = (c) => { const m = c.match(/[\d.]+/g).map(Number); return (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) / 255; };
const tree = () => ({ games: { factor: {
  accounts: { ateacher: { name: "Teacher", stats: { rating: 1649.6, exp: 100 }, prof: { lv: { L1: { n: 30, ok: 28, ms: 90000, bestMs: 1200 } } } },
    atarget: { name: "Target", stats: { rating: 1800 }, prof: { lv: { L1: { n: 20, ok: 18, ms: 90000 } } } } },
  onlineSparkV1: { config: { enabled: true, protocol: "spark-v1" } },
  ghostV1: { users: { ateacher: { events: { g: { id: "g", opponent: "Target", type: "hyper", difficulty: "easy", mode: "B", outcome: "w", exp: 8, delta: 6, at: Date.now() } } } } } } } });
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium" });
  try {
    for (const width of [375, 390, 430]) {
      // 1. hyper ghost buttons
      {
        const t = await context(b, { tree: tree() }), p = t.page; await p.setViewportSize({ width, height: 844 });
        await openOnlineLobby(p);
        const r = await p.locator("[data-ghost-hyper] .next-ghost-diff button").evaluateAll((es) => es.map((e) => { const b = e.getBoundingClientRect(), cs = getComputedStyle(e); const rg = document.createRange(); rg.selectNodeContents(e); const tr = rg.getBoundingClientRect(); return { t: e.textContent, w: Math.round(b.width), h: Math.round(b.height), pl: cs.paddingLeft, pr: cs.paddingRight, pt: cs.paddingTop, pb: cs.paddingBottom, dx: Math.abs((tr.left + tr.right) / 2 - (b.left + b.right) / 2), dy: Math.abs((tr.top + tr.bottom) / 2 - (b.top + b.bottom) / 2), ta: cs.textAlign, bg: cs.backgroundColor, right: b.right }; }));
        assert.deepEqual(r.map((x) => x.t), ["イージー", "ノーマル"]);
        assert(Math.abs(r[0].w - r[1].w) <= 1 && r[0].h === r[1].h, "equal size " + JSON.stringify(r));
        for (const x of r) { assert(x.dx <= 1.5 && x.dy <= 1.5, "text centred " + JSON.stringify(x)); assert.equal(x.ta, "center"); assert(x.right <= width); }
        assert(r[0].pl === r[1].pl && r[0].pt === r[1].pt && r[0].pb === r[1].pb && r[0].pr === r[1].pr, "same padding");
        assert(!await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), "no horizontal scroll (lobby) " + width);
        assert.deepEqual(t.errors, []); await t.ctx.close();
      }
      // 2 + 3. profile
      {
        const t = await context(b, { tree: tree() }), p = t.page; await p.setViewportSize({ width, height: 844 });
        await openProfile(p);
        await p.locator("[data-open-ghost]").click(); await p.locator("[data-ghost-panel]").waitFor();
        await p.waitForFunction(() => [...document.querySelectorAll("[data-ghost-panel] .flex-col>button")].every((e) => e.textContent) );
        await p.waitForFunction(() => !document.querySelector("[data-ghost-panel] .flex-col>button").disabled);
        await p.waitForTimeout(500); // the dialog opening animation
        const bt = await p.locator("[data-ghost-panel] .flex-col>button").evaluateAll((es) => es.map((e) => { const b = e.getBoundingClientRect(), cs = getComputedStyle(e); const rg = document.createRange(); rg.selectNodeContents(e); const tr = rg.getBoundingClientRect(); return { t: e.textContent, w: Math.round(b.width), h: Math.round(b.height), pl: parseFloat(cs.paddingLeft), pr: parseFloat(cs.paddingRight), gapL: tr.left - b.left, gapR: b.right - tr.right, dx: Math.abs((tr.left + tr.right) / 2 - (b.left + b.right) / 2), bg: cs.backgroundColor, right: b.right }; }));
        assert.deepEqual(bt.map((x) => x.t), ["イージーで自分のゴーストと対戦", "ノーマルで自分のゴーストと対戦", "ハイパーゴーストと対戦"]);
        for (const x of bt) { assert(x.pl >= 16 && x.pr >= 16, "side padding >= 16px " + JSON.stringify(x)); assert(x.gapL >= 15.5 && x.gapR >= 15.5, "text away from the frame " + JSON.stringify(x)); assert(x.dx <= 1.5, "centred"); assert(x.h >= 48, "height " + JSON.stringify(x)); assert(x.right <= width); }
        assert.equal(new Set(bt.map((x) => x.w)).size, 1, "same width");
        assert.match(bt[2].bg, /123, 97, 255/, "hyper ghost keeps its purple");
        assert(!await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), "no horizontal scroll (dialog) " + width);
        await p.getByRole("button", { name: "とじる" }).click(); await p.locator("[data-ghost-panel]").waitFor({ state: "detached" });
        // records tab: ghost history folded
        await p.getByRole("tab", { name: "対戦記録", exact: true }).click();
        const tg = p.locator("[data-detail-toggle]"); await tg.waitFor();
        assert.equal(await tg.getAttribute("aria-expanded"), "false"); assert.equal(await tg.innerText(), "詳細な成績を見る");
        assert.equal(await p.locator("[data-detail-body]").count(), 0, "closed at first"); assert.equal(await p.getByText("ゴースト対戦履歴", { exact: true }).count(), 0);
        assert((await tg.boundingBox()).height >= 48, "tap target");
        const before = JSON.stringify(t.tree.games.factor.accounts);
        await tg.click(); await p.locator("[data-detail-body]").waitFor(); assert.equal(await tg.getAttribute("aria-expanded"), "true");
        await p.getByText(/ハイパーゴースト/).first().waitFor();
        const body = p.locator("[data-detail-body] .gh-history");
        const txt = await body.innerText(); assert.match(txt, /ゴースト対戦履歴/); assert.match(txt, /自分の挑戦/); assert.match(txt, /自分の分身/); assert.match(txt, /保存された履歴：1戦・1勝 0敗/); assert.match(txt, /Target ・ 勝利/); assert.match(txt, /獲得EXP 8・レート変動/);
        const col = await body.evaluate((e) => { const cs = getComputedStyle(e), s = e.querySelector("strong"), pp = e.querySelector("p"); return { bg: cs.backgroundColor, h3: getComputedStyle(e.querySelector("h3")).color, strong: getComputedStyle(s).color, p: getComputedStyle(pp).color }; });
        assert(lum(col.bg) < 0.2, "dark background " + col.bg); for (const k of ["h3", "strong", "p"]) assert(lum(col[k]) > 0.7, "light text " + k + " " + col[k]);
        assert(!await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), "no horizontal scroll (records) " + width);
        await tg.click(); assert.equal(await tg.getAttribute("aria-expanded"), "false"); assert.equal(await p.locator("[data-detail-body]").count(), 0, "closes again");
        assert.equal(JSON.stringify(t.tree.games.factor.accounts), before, "opening / closing changes no data");
        assert.deepEqual(t.errors, []); await t.ctx.close();
      }
    }
    console.log("PASS hyper-ghost buttons centred/equal; profile ghost dialog padded; ghost history dark + folded (closed at first, toggles, content kept) at 375/390/430");
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
