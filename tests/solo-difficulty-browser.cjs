// Ver.6.15: the solo difficulty tiles are centred (name and the "15問・ミス-20%" line), equal in height, fit at phone widths,
// and still select as before (aria-pressed, same values from the game's definitions).
const assert = require("node:assert/strict"), fs = require("node:fs");
const { chromium, context, openSoloMode } = require("./browser-harness.cjs");
const src = fs.readFileSync("index.html", "utf8");
const diff = Object.fromEntries([...src.match(/const DIFFICULTY_CONFIG = \{([\s\S]*?)\n\};/)[1].matchAll(/(\w+): \{ label: '([^']+)', clearCount: (\d+)/g)].map((m) => [m[1], { label: m[2], clear: +m[3] }]));
const miss = Object.fromEntries([...src.match(/const DIFFICULTY_MISS_PENALTY = \{([^}]*)\}/)[1].matchAll(/(\w+): (\d+)/g)].map((m) => [m[1], +m[2]]));
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium" });
  try {
    for (const width of [375, 390, 430, 1440]) {
      const t = await context(b, { pc: width > 900 }), p = t.page; if (width < 900) await p.setViewportSize({ width, height: 844 });
      await openSoloMode(p, "play");
      const tiles = p.locator(".v7-diff button"); await tiles.first().waitFor();
      const info = await tiles.evaluateAll((es) => es.map((e) => { const r = e.getBoundingClientRect(), s = e.querySelector("small"), sr = s.getBoundingClientRect(), cs = getComputedStyle(e), tn = document.createRange(); tn.selectNodeContents(e.firstChild); const nr = tn.getBoundingClientRect();
        return { name: e.firstChild.textContent, small: s.textContent, h: Math.round(r.height), w: r.width, textAlign: cs.textAlign, align: cs.alignItems, sTextAlign: getComputedStyle(s).textAlign, nameCenter: (nr.left + nr.right) / 2 - (r.left + r.right) / 2, smallCenter: (sr.left + sr.right) / 2 - (r.left + r.right) / 2, fits: s.scrollWidth <= s.clientWidth + 1 && sr.left >= r.left && sr.right <= r.right, pressed: e.getAttribute("aria-pressed") }; }));
      assert.deepEqual(info.map((x) => x.name), Object.values(diff).map((d) => d.label));
      assert.equal(new Set(info.map((x) => x.h)).size, 1, "same height " + JSON.stringify(info.map((x) => x.h)));
      Object.entries(diff).forEach(([id, d], i) => { const x = info[i]; assert.equal(x.small, `${d.clear}問・ミス-${miss[id]}%`); assert.equal(x.textAlign, "center"); assert.equal(x.sTextAlign, "center"); assert(Math.abs(x.nameCenter) <= 1.5, "name centred " + x.nameCenter); assert(Math.abs(x.smallCenter) <= 1.5, "note centred " + x.smallCenter); assert(x.fits, "text fits " + x.name + " " + width); });
      assert.equal(info.filter((x) => x.pressed === "true").length, 1, "one selected tile");
      await tiles.nth(1).click(); assert.equal(await tiles.nth(1).getAttribute("aria-pressed"), "true"); assert.equal(await tiles.nth(0).getAttribute("aria-pressed"), "false");
      assert(!await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), "no horizontal scroll " + width);
      assert.deepEqual(t.errors, []); await t.ctx.close();
    }
    console.log("PASS solo difficulty tiles: centred name and note, equal height, text fits, selection unchanged at 375/390/430/1440");
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
