// Explicit public-file staging. No Firebase deployment and no secret-bearing directories.
const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict"),
  crypto = require("node:crypto");
const root = path.resolve(__dirname, ".."),
  out = path.join(root, "dist");
if (fs.existsSync(out)) fs.rmSync(out, { recursive: true });
fs.mkdirSync(out);
const materialHash = crypto
  .createHash("sha256")
  .update(fs.readFileSync(path.join(root, "math-tower/chapter1.json")))
  .digest("hex")
  .slice(0, 16);
fs.writeFileSync(
  path.join(root, "math-tower-release.js"),
  '/* Public game material, expressly approved on 2026-10-13. */\nwindow.MathTowerContentUrl = "math-tower/chapter1.json?v=' +
    materialHash +
    '";\n',
);
const allowed = [
  "index.html",
  "next-home-ui.js",
  "next-results-ui.js",
  "game-version.js",
  "game-audio.js",
  "online-spark.js",
  "online-rated-ui.js",
  "daily-ui.js",
  "room-b2-ui.js",
  "achievements-audit.js",
  "online-rated.css",
  "fonts/katex/KaTeX_Main-Regular.woff2",
  "fonts/katex/KaTeX_Math-Italic.woff2",
  "fonts/katex/LICENSE-MIT.txt",
  "fonts/katex/LICENSE-FONTS.txt",
  "manifest.webmanifest",
  "suri-data.js",
  "math-tower-core.js",
  "math-tower-store.js",
  "math-tower-ui.js",
  "math-tower-release.js",
  "math-tower.css",
  "math-tower/chapter1.json",
];
for (const name of allowed) {
  const target = path.join(out, name);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(path.join(root, name), target);
}
fs.cpSync(path.join(root, "ui-next"), path.join(out, "ui-next"), { recursive: true });
fs.cpSync(path.join(root, "img"), path.join(out, "img"), { recursive: true });
fs.writeFileSync(path.join(out, ".nojekyll"), "");
// New HTML must not combine new UI with a cached previous store/audio module.
let html = fs.readFileSync(path.join(out, "index.html"), "utf8");
for (const file of [
  "next-home-ui.js",
  "next-results-ui.js",
  "game-version.js",
  "game-audio.js",
  "online-spark.js",
  "online-rated-ui.js",
  "daily-ui.js",
  "room-b2-ui.js",
  "achievements-audit.js",
  "online-rated.css",
  "fonts/katex/KaTeX_Main-Regular.woff2",
  "fonts/katex/KaTeX_Math-Italic.woff2",
  "fonts/katex/LICENSE-MIT.txt",
  "fonts/katex/LICENSE-FONTS.txt",
  "math-tower-core.js",
  "math-tower-store.js",
  "math-tower-ui.js",
  "math-tower-release.js",
  "math-tower.css",
]) {
  const hash = crypto
    .createHash("sha256")
    .update(fs.readFileSync(path.join(out, file)))
    .digest("hex")
    .slice(0, 16);
  html = html
    .replaceAll('src="' + file + '"', 'src="' + file + "?v=" + hash + '"')
    .replaceAll('href="' + file + '"', 'href="' + file + "?v=" + hash + '"');
}
fs.writeFileSync(path.join(out, "index.html"), html);

const c = JSON.parse(
  fs.readFileSync(path.join(out, "math-tower/chapter1.json")),
);
assert.equal(c.chapter, 1);
assert.equal(c.version, 1);
assert.deepEqual(
  c.policy,
  require("../math-tower-policy.json"),
  "Approved policy must be unchanged",
);
assert.deepEqual(Object.keys(c.floors).sort(), ["1", "2", "3", "4", "5"]);
const files = [];
function walk(dir) {
  for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, d.name);
    assert(!d.isSymbolicLink(), "No symlinks");
    if (d.isDirectory()) walk(f);
    else {
      const b = fs.readFileSync(f);
      if (/\.(html|js|json|css)$/.test(f)) {
        const s = b.toString("utf8");
        for (const re of [
          /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
          /"type"\s*:\s*"service_account"/,
          /gh[pousr]_[A-Za-z0-9]{30,}/,
          /github_pat_[A-Za-z0-9_]{30,}/,
          /"teacherPass"\s*:\s*"[^"\s]+"/,
          /"teacherKeys"\s*:\s*\{/,
          /"trialProgress"\s*:\s*\{/,
          /window\.__privateChapter/,
          /mockuid/,
        ])
          assert(
            !re.test(s),
            "Forbidden secret/data/mock marker in " + path.relative(out, f),
          );
      }
      files.push({
        path: path.relative(out, f),
        sha256: crypto.createHash("sha256").update(b).digest("hex"),
      });
    }
  }
}
walk(out);
fs.writeFileSync(
  path.join(out, "release-manifest.json"),
  JSON.stringify(
    {
      mode: "real-firebase-teacher-grant-trial",
      gameVersion:
        JSON.parse(fs.readFileSync(path.join(root, "version.json"))).major +
        "." +
        JSON.parse(fs.readFileSync(path.join(root, "version.json"))).minor,
      sourceCommit: require("node:child_process")
        .execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" })
        .trim(),
      files,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  "Public artifact staged and screened: " +
    files.length +
    " files. No credentials/records/config directories.",
);
