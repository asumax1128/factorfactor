const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  os = require("node:os"),
  path = require("node:path"),
  cp = require("node:child_process");
const script = path.resolve("scripts/check-release-version.cjs");
for (const [label, next, game, approved, success] of [
  ["minor 5.9 to 5.10", { major: 5, minor: 10 }, true, "", true],
  ["same minor rejected", { major: 5, minor: 9 }, true, "", false],
  ["major without approval rejected", { major: 6, minor: 0 }, true, "", false],
  ["approved major", { major: 6, minor: 0 }, true, "6", true],
  ["documentation only does not bump", { major: 5, minor: 9 }, false, "", true],
  ["backward version rejected", { major: 5, minor: 8 }, false, "", false],
])
  test(label, () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "factor-version-"));
    const git = (...args) =>
      cp.execFileSync("git", args, { cwd: dir, stdio: "pipe" });
    try {
      git("init");
      git("config", "user.name", "Version Test");
      git("config", "user.email", "test@example.invalid");
      fs.writeFileSync(
        path.join(dir, "version.json"),
        JSON.stringify({ major: 5, minor: 9 }),
      );
      fs.writeFileSync(path.join(dir, "index.html"), "old game");
      git("add", ".");
      git("commit", "-m", "baseline");
      fs.writeFileSync(path.join(dir, "version.json"), JSON.stringify(next));
      fs.writeFileSync(
        path.join(dir, game ? "index.html" : "notes.md"),
        "new contents",
      );
      git("add", ".");
      git("commit", "-m", "release");
      const run = cp.spawnSync(process.execPath, [script], {
        cwd: dir,
        encoding: "utf8",
        env: {
          ...process.env,
          RELEASE_BASE: "",
          APPROVED_MAJOR_VERSION: approved,
        },
      });
      assert.equal(run.status === 0, success, run.stdout + run.stderr);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
