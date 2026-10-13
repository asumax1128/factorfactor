const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  crypto = require("node:crypto"),
  cp = require("node:child_process");
const { chromium, context, continueTower } = require("./browser-harness.cjs"),
  R = require("../math-tower-core");
const content = require("../math-tower/chapter1.json"),
  asset = content.backgrounds.f03.image;
assert.equal(
  crypto.createHash("sha256").update(fs.readFileSync(asset)).digest("hex"),
  "d81d75734c057c802bcd80e85e5d6f3a65dff8a0716aced5bbbb63d00514f77c",
);
const original = JSON.parse(
  cp.execFileSync("git", ["show", "9fa9ac3:math-tower/chapter1.json"], {
    maxBuffer: 32 * 1024 * 1024,
  }),
);
const comparison = JSON.parse(JSON.stringify(content));
comparison.backgrounds.f03 = original.backgrounds.f03;
assert.deepEqual(comparison, original);
function tree() {
  const p = R.startAdventure(R.fresh(), "normal", 1);
  p.adventures.normal.floor = 3;
  p.adventures.normal.hp = 73;
  return {
    games: {
      factor: {
        teachers: { ateacher: true },
        logins: { ateacher: { "teacher-uid": "fixture" } },
        mathTowerV2: {
          access: { ateacher: { enabled: true, role: "teacher" } },
          trialProgress: { ateacher: p },
        },
      },
    },
  };
}
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  });
  try {
    for (const [width, height] of [
      [320, 568],
      [375, 667],
      [390, 844],
      [430, 932],
      [1366, 768],
    ]) {
      const t = await context(b, { tree: tree(), pc: width > 900 }),
        p = t.page;
      await p.setViewportSize({ width, height });
      await p.getByRole("button", { name: /数学の塔/ }).click();
      await continueTower(p);
      await p.getByRole("button", { name: "試練を開始", exact: true }).click();
      await p.locator('[data-math-story="3-pre"]').waitFor();
      const details = await p.evaluate(async (asset) => {
        const im = new Image();
        im.src = asset;
        await im.decode();
        const story = document.querySelector(".mt-story"),
          s = getComputedStyle(story);
        const canvas = document.createElement("canvas");
        canvas.width = im.width;
        canvas.height = im.height;
        const c = canvas.getContext("2d");
        c.drawImage(im, 0, 0);
        const pixels = c.getImageData(0, 0, im.width, im.height).data;
        let left = 0,
          right = 0,
          nl = 0,
          nr = 0;
        for (let y = 0; y < im.height; y += 8)
          for (let x = 0; x < im.width; x += 8) {
            const k = (y * im.width + x) * 4;
            if (x < im.width / 2) {
              left += pixels[k] - pixels[k + 2];
              nl++;
            } else {
              right += pixels[k] - pixels[k + 2];
              nr++;
            }
          }
        return {
          width: im.width,
          height: im.height,
          left: left / nl,
          right: right / nr,
          position: s.backgroundPosition,
          size: s.backgroundSize,
          image: s.backgroundImage,
          transform: s.transform,
        };
      }, asset);
      assert.deepEqual([details.width, details.height], [1672, 941]);
      assert(details.left < 0 && details.right > 0);
      assert(details.position.split(",").every(p=>p.trim()==="50% 50%"));
      assert(details.size.split(",").every(p=>p.trim()==="cover"));
      assert.equal(details.transform, "none");
      assert(details.image.includes(asset));
      const minus = p.locator("[data-math-character=minus]"),
        plus = p.locator("[data-math-character=plus]");
      await minus.evaluate((e) => e.decode());
      await plus.evaluate((e) => e.decode());
      assert.equal(await p.locator("[data-math-character]").count(), 2);
      assert.equal(
        await p.locator("[data-math-character=twin_fox]").count(),
        0,
      );
      const a = await minus.boundingBox(),
        z = await plus.boundingBox(),
        d = await p.locator(".mt-dialog").boundingBox();
      assert(a.x < z.x);
      for (const box of [a, z]) {
        assert(box.x >= 0 && box.x + box.width <= width + 1);
        assert(box.y + box.height <= d.y + 1);
      }
      const shots = process.env.TOWER_FLOOR3_SCREENSHOTS;
      if (shots) {
        fs.mkdirSync(shots, { recursive: true });
        await p.screenshot({ path: `${shots}/floor3-${width}x${height}.png` });
      }
      await p.setViewportSize({ width, height: height - 70 });
      await p.waitForTimeout(100);
      const changed = await p
        .locator(".mt-story")
        .evaluate((e) => getComputedStyle(e).backgroundPosition);
      assert(changed.split(",").every(p=>p.trim()==="50% 50%"));
      assert.deepEqual(t.errors, []);
      await t.ctx.close();
      console.log(
        "PASS exact official PNG, blue-left/red-right, fixed single portraits and cover crop",
        width,
        height,
      );
    }
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
