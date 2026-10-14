const fs = require("node:fs"),
  cp = require("node:child_process"),
  assert = require("node:assert/strict");
const git = (...args) =>
  cp.execFileSync("git", args, {
    encoding: "utf8",
    maxBuffer: 10e6,
    stdio: ["ignore", "pipe", "pipe"],
  });
const base =
  process.env.RELEASE_BASE === 'origin/main' ? 'origin/main' : /^[0-9a-f]{40}$/.test(process.env.RELEASE_BASE || "") &&
  !/^0+$/.test(process.env.RELEASE_BASE)
    ? process.env.RELEASE_BASE
    : "HEAD^";
const next = JSON.parse(fs.readFileSync("version.json", "utf8"));
let prev;
try {
  prev = JSON.parse(git("show", base + ":version.json"));
} catch {
  const old = git("show", base + ":index.html").match(
    /className="v7-ver">ver\.(\d+)\.(\d+)/,
  );
  if (!old) throw Error("Previous formal version requires review");
  prev = { major: +old[1], minor: +old[2] };
}
const changed = git("diff", "--name-only", base, "HEAD").trim().split("\n");
const game = changed.some(
  (p) =>
    !/^(reports|docs|tests|firebase)\//.test(p) &&
    /^([^/]+\.(?:html|js|webmanifest)|.*\.(?:css|png|webp|jpg|woff2)|(?:game-|math-tower-|online-).*\.js|math-tower\/.*\.json)$/.test(
      p,
    ),
);
if (next.major !== prev.major)
  assert.equal(
    process.env.APPROVED_MAJOR_VERSION,
    String(next.major),
    "Major release requires explicit owner approval",
  );
if (game)
  assert(
    next.major > prev.major ||
      (next.major === prev.major && next.minor === prev.minor + 1),
    "Public game changes must advance minor once",
  );
else
  assert(
    next.major > prev.major ||
      (next.major === prev.major && next.minor >= prev.minor),
    "Version must never move backward",
  );
console.log(
  `Release version ${prev.major}.${prev.minor} → ${next.major}.${next.minor}`,
);
