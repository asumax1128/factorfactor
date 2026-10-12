// Create a PRIVATE local play package outside the public checkout. Never deploys.
const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const root = path.resolve(__dirname, "..");
const [input, outputArg] = process.argv.slice(2);
if (!input || !outputArg)
  throw Error(
    "Usage: build-math-tower-local-play.cjs PRIVATE_CONTENT OUTPUT_OUTSIDE_CHECKOUT",
  );
fs.mkdirSync(outputArg, { recursive: true });
const output = fs.realpathSync(outputArg);
assert(
  output !== root && !output.startsWith(root + path.sep),
  "Private package must remain outside checkout",
);
const site = path.join(output, "site");
fs.mkdirSync(site, { recursive: true });
const content = JSON.parse(fs.readFileSync(input, "utf8"));
fs.writeFileSync(
  path.join(site, "private-content.js"),
  "window.__privateChapter=" +
    JSON.stringify(content).replace(/</g, "\\u003c") +
    ";",
);
const copy = (from, to) => fs.copyFileSync(from, path.join(site, to));
for (const f of [
  "game-audio.js",
  "math-tower-core.js",
  "math-tower-store.js",
  "math-tower-ui.js",
  "math-tower.css",
])
  copy(path.join(root, f), f);
copy(
  path.join(root, "tools/math-tower-local-play/bootstrap.js"),
  "bootstrap.js",
);
copy(path.join(root, "tests/firebase-mock.js"), "firebase-mock.js");
const libs = [
  ["react/umd/react.production.min.js", "react.js"],
  ["react-dom/umd/react-dom.production.min.js", "react-dom.js"],
  ["@babel/standalone/babel.min.js", "babel.js"],
  ["tone/build/Tone.js", "tone.js"],
  ["@tailwindcss/browser/dist/index.global.js", "tailwind.js"],
];
for (const [from, to] of libs) copy(path.join(root, "node_modules", from), to);
let h = fs.readFileSync(path.join(root, "index.html"), "utf8");
const replacements = [
  [/https:\/\/unpkg.com\/react@[^"']+/g, "react.js"],
  [/https:\/\/unpkg.com\/react-dom@[^"']+/g, "react-dom.js"],
  [/https:\/\/unpkg.com\/@babel[^"']+/g, "babel.js"],
  [/https:\/\/unpkg.com\/tone[^"']+/g, "tone.js"],
  [/https:\/\/cdn.tailwindcss.com/g, "tailwind.js"],
];
for (const [re, v] of replacements) h = h.replace(re, v);
h = h.replace(
  /<script src="https:\/\/www.gstatic.com\/firebasejs\/[^"']+"><\/script>/g,
  "",
);
h = h.replace(/<script src="game-audio.js"><\/script>/g, "");
h = h.replace(/<script src="math-tower-release.js"><\/script>/g, "");
h = h.replace(/<script src="suri-data[^"']*"><\/script>/g, "");
h = h.replace(/<link[^>]+(?:manifest|katex)[^>]*>/g, "");
h = h.replace(
  /const FB_CONFIG = \{[\s\S]*?\};/,
  'const FB_CONFIG = {projectId:"demo-local-mock"};',
);
h = h.replace(
  /<script src="math-tower-core.js">/,
  '<script src="private-content.js"></script><script src="bootstrap.js"></script><script src="game-audio.js"></script><script src="firebase-mock.js"></script><script src="math-tower-core.js">',
);
h = h.replace(
  "<head>",
  "<head><meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'none'; media-src 'self' blob:; worker-src 'none'; object-src 'none'; base-uri 'none'; form-action 'self'\">",
);
h = h.replace(
  "root.render(<AppRoot />);",
  'root.render(<MathTowerApp acct={{key:"ateacher",name:"開発者（モック先生）"}} onExit={() => location.reload()} />);',
);
h = h.replace(
  "<body>",
  '<body><aside style="background:#fff1cc;color:#253451;text-align:center;font:13px sans-serif;padding:6px">ローカル試遊・モック先生 ／ 保存はこのブラウザのみ ／ 本番通信なし</aside>',
);
assert(!/<script[^>]+src="https?:/.test(h), "Offline scripts must be local");
assert(!h.includes("firebase-app-compat"), "Real Firebase SDK must not ship");
const licenses = path.join(output, "licenses");
fs.mkdirSync(licenses, { recursive: true });
for (const name of [
  "react",
  "react-dom",
  "@babel/standalone",
  "tone",
  "@tailwindcss/browser",
]) {
  const dir = path.join(root, "node_modules", name);
  const file = fs.readdirSync(dir).find((f) => /^licen[cs]e/i.test(f));
  if (file)
    fs.copyFileSync(
      path.join(dir, file),
      path.join(licenses, name.replaceAll("/", "-") + "-LICENSE.txt"),
    );
}
fs.writeFileSync(path.join(site, "index.html"), h);
fs.copyFileSync(
  path.join(root, "tools/math-tower-local-play/start.py"),
  path.join(output, "start.py"),
);
fs.copyFileSync(
  path.join(root, "docs/math-tower/local-play.md"),
  path.join(output, "README.md"),
);
fs.writeFileSync(
  path.join(output, "start-windows.bat"),
  fs
    .readFileSync(
      path.join(root, "tools/math-tower-local-play/start-windows.bat"),
      "utf8",
    )
    .replace(/\r?\n/g, "\r\n"),
);
console.log("Private local package prepared (not published).");
