const { spawnSync } = require("node:child_process");
const path = require("node:path");
const targets = {
  tower: "math-tower-rules.cjs",
  save: "math-tower-live-save.cjs",
  "production-audit": "math-tower-production-audit.cjs",
};
const target = targets[process.argv[2] || "tower"];
if (!target) throw Error("Unknown loopback test target");
// The test hardcodes loopback:9000 and a demo project; it has no production route.
// Node's Firebase WebSocket client ignores NO_PROXY. Exclude the HTTP proxy only
// for this loopback-only child. Keep HTTPS proxy, CA trust and auth bindings.
const result = spawnSync(
  process.execPath,
  [path.join(__dirname, "../tests/", target)],
  {
    stdio: "inherit",
    env: { ...process.env, HTTP_PROXY: "", http_proxy: "" },
  },
);
if (result.error) throw result.error;
process.exit(result.status === null ? 1 : result.status);
