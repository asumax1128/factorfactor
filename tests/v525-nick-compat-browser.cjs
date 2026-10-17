// Production Ver.5.25 (main, pinned) must treat stats.nick === "" exactly like "no equipped title": no errors, nothing shown.
const assert = require("node:assert/strict"), cp = require("node:child_process"), fs = require("node:fs"), os = require("node:os"), path = require("node:path");
const { chromium, context, sleep } = require("./browser-harness.cjs");
const PINNED = "558488543e104460a35a8902c22e682c5c46f766"; // main @ Ver.5.25
(async () => {
  let dir;
  try {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "fxf525-"));
    const tar = cp.execFileSync("git", ["archive", PINNED], { maxBuffer: 200e6 });
    cp.execFileSync("tar", ["-x", "-C", dir], { input: tar });
  } catch (e) {
    console.log("SKIP v5.25 compatibility: the pinned main commit is not available in this checkout (" + String(e.message).split("\n")[0] + ")");
    return;
  }
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir, "version.json"), "utf8")).minor, 25);
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium" });
  try {
    const seen = {};
    for (const nick of ["", undefined, "first"]) {
      const stats = { rating: 1600, exp: 900, games: 20, w: 12, l: 6, d: 2, ...(nick === undefined ? {} : { nick }) };
      const tree = { games: { factor: { accounts: { ateacher: { name: "Teacher", stats } }, onlineSparkV1: { config: { enabled: true, protocol: "spark-v1" }, profiles: { ateacher: { name: "Teacher", easy: { rating: 1700, maxRating: 1830, games: 20, w: 12, l: 6, d: 2, season: "2026-10", seasonMax: 1700 }, normal: { rating: 1600, maxRating: 1600, games: 5, w: 3, l: 2, d: 0, season: "2026-10", seasonMax: 1600 }, badges: { easy_adept: true }, title: "easy_adept", migrationId: "spark-legacy-to-easy-v1", initialRating: 1700, initializedAt: 1 } } } } } };
      const t = await context(b, { tree, siteRoot: dir }), p = t.page;
      await p.setViewportSize({ width: 390, height: 844 });
      await p.getByText("Teacher").first().waitFor();
      await sleep(1500);
      // the old profile window (成績) renders with the marker too
      await p.getByRole("button", { name: "成績", exact: true }).click();
      await p.getByText(/オンライン対戦の成績/).first().waitFor({ timeout: 8000 });
      const text = (await p.locator("body").innerText()).replace(/\s+/g, " ");
      assert.deepEqual(t.errors, [], `no page errors with nick=${JSON.stringify(nick)}`);
      seen[JSON.stringify(nick)] = text.includes("〈");
      assert.equal(tree.games.factor.accounts.ateacher.stats.nick, nick, "the old client never rewrites the field");
      await t.ctx.close();
    }
    assert.equal(seen['""'], false, "an empty string shows no title on the old client");
    assert.equal(seen["undefined"], false);
    assert.equal(seen['"first"'], true, "control: a real nick is shown");
    console.log("PASS Ver.5.25 treats nick \"\" like no title: no errors, nothing shown, field untouched");
  } finally {
    await b.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
})().catch((e) => { console.error(e); process.exit(1); });
