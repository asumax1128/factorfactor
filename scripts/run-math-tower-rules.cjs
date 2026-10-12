const { spawnSync } = require("node:child_process");
const path = require("node:path");
// The test hardcodes loopback:9000 and a demo project; it has no production route.
// Node's Firebase WebSocket client ignores NO_PROXY. Exclude the HTTP proxy only
// for this loopback-only child. Keep HTTPS proxy, CA trust and auth bindings.
const result = spawnSync(
  process.execPath,
  [path.join(__dirname, "../tests/math-tower-rules.cjs")],
  {
    stdio: "inherit",
    env: { ...process.env, HTTP_PROXY: "", http_proxy: "" },
  },
);
if (result.error) throw result.error;
process.exit(result.status === null ? 1 : result.status);
