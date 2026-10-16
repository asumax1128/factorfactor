// Actual app controls and Web Audio nodes in Chromium; no production network.
const assert = require("node:assert/strict");
const { chromium, context, sleep } = require("./browser-harness.cjs");
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  });
  try {
    const t = await context(b, {
        account: { guest: true, name: "Audio test" },
      }),
      p = t.page;
    await t.ctx.addInitScript(() => {
      window.__oscCount = 0;
      const proto = AudioContext.prototype,
        create = proto.createOscillator;
      proto.createOscillator = function (...args) {
        window.__oscCount++;
        return create.apply(this, args);
      };
    });
    await p.evaluate(() => {
      window.__oscCount = 0;
      const c = Tone.getContext().rawContext;
      const f = c.createOscillator.bind(c);
      c.createOscillator = function () {
        window.__oscCount++;
        return f();
      };
    });
    await p.locator(".action-card.solo").click(); // new home: solo mode is entered from its card, then スタート
    await p.getByRole("button", { name: "スタート", exact: true }).click();
    await p.getByRole("button", { name: "音を消す", exact: true }).click();
    await sleep(150);
    const before = await p.evaluate(() => window.__oscCount);
    await p.evaluate(() => uiSnd("ok"));
    await sleep(50);
    assert.equal(
      await p.evaluate(() => window.__oscCount),
      before,
      "battle mute must also suppress menu/button oscillators",
    );
    await p.reload();
    await p.locator(".action-card.solo").click(); // new home: solo mode is entered from its card, then スタート
    await p.getByRole("button", { name: "スタート", exact: true }).click();
    await p.getByRole("button", { name: "音を出す", exact: true }).waitFor();
    assert.equal(
      await p.getByRole("button", { name: "音を出す", exact: true }).count(),
      1,
      "mute must survive reload",
    );
    assert.equal(
      await p.evaluate(() => Tone.getDestination().mute),
      true,
      "Tone master muted",
    );
    console.log("PASS full mute suppresses UI and Tone audio across reload");
    await p.evaluate(() => {
      const c = Tone.getContext().rawContext;
      window.__meter = c.createAnalyser();
      __meter.fftSize = 1024;
      GameAudio.output(c).connect(__meter);
      setUiMute(false);
      GameAudio.setMuted(false);
      uiSnd("swirl");
    });
    const rms = () =>
      p.evaluate(() => {
        const a = new Float32Array(__meter.fftSize);
        __meter.getFloatTimeDomainData(a);
        return Math.sqrt(a.reduce((s, v) => s + v * v, 0) / a.length);
      });
    await sleep(80);
    assert(
      (await rms()) > 0.0001,
      "unmuted UI signal must actually reach the analyser",
    );
    await p.evaluate(() => GameAudio.setMuted(true));
    await sleep(80);
    assert(
      (await rms()) < 0.000001,
      "already playing UI signal must be silent",
    );
    const count = await p.evaluate(() => window.__oscCount);
    assert.equal(typeof count, "number");
    await p.evaluate(() => GameAudio.setMuted(false));
    await sleep(50);
    assert.equal(
      await p.evaluate(() => window.__oscCount),
      count,
      "unmuting must not instantiate duplicate voices",
    );
    await p.evaluate(() => setUiMute(true));
    assert.equal(
      await p.evaluate(() => Tone.getDestination().mute),
      false,
      "menu-only OFF must not mute game BGM",
    );
    const quiet = await p.evaluate(() => window.__oscCount);
    await p.evaluate(() => uiSnd("ok"));
    assert.equal(await p.evaluate(() => window.__oscCount), quiet);
    await p.evaluate(() => {
      GameAudio.setMuted(true);
      setUiMute(false);
    });
    console.log(
      "PASS real Web Audio RMS, active-sound mute, independent menu mute and no duplicate restart",
    );
    for (const mode of ["cpu", "weekly", "daily"]) {
      await p.reload();
      if (mode === "cpu") {
        await p
          .getByRole("button", { name: "オンライン対戦・CPU練習", exact: true })
          .click();
        await p
          .getByRole("button", { name: "CPUと練習スタート", exact: true })
          .click();
        await p.locator("[data-btile]").first().waitFor();
      }
      if (mode === "weekly") {
        await p.getByRole("button", { name: /今週のボス/ }).click();
        await p.getByRole("button", { name: /出撃する/ }).click();
        await p.locator("[data-btile]").first().waitFor();
      }
      if (mode === "daily") {
        await p.getByRole("button", { name: /デイリーミッション/ }).click();
        await sleep(300);
      }
      assert.equal(await p.evaluate(() => GameAudio.isMuted()), true);
      assert.equal(await p.evaluate(() => Tone.getDestination().mute), true);
    }
    assert.deepEqual(t.errors, []);
    console.log(
      "PASS OFF preserved across CPU, weekly raid and daily mode transitions",
    );
    await t.ctx.close();
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
