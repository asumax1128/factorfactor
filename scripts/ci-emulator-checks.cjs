// No production project IDs or deployment commands; strictly local demo emulator.
const fs = require("node:fs"),
  path = require("node:path"),
  cp = require("node:child_process");
const baseline = process.env.RTDB_RULES_BASELINE_FILE;
if (!baseline || !fs.existsSync(baseline))
  throw Error(
    "Authoritative rules export required; deployment remains blocked",
  );
const audit = path.join(process.env.RUNNER_TEMP || "/tmp", "tower-rules-audit");
const run = (args, extra = {}) => {
  const r = cp.spawnSync(process.execPath, args, {
    stdio: "inherit",
    env: { ...process.env, ...extra },
  });
  if (r.status !== 0)
    throw Error("Local verification failed (exit " + r.status + ")");
};
run(["scripts/audit-math-tower-rules.cjs", baseline, audit]);
run(["scripts/run-math-tower-rules.cjs"], {
  MATH_TOWER_RULES: path.join(audit, "tower-only.rules.json"),
});
run(["scripts/run-math-tower-rules.cjs"], {
  MATH_TOWER_RULES: path.join(audit, "combined.rules.json"),
});
run(["scripts/run-math-tower-rules.cjs", "production-audit"], {
  MATH_TOWER_AUDIT_DIR: audit,
});
