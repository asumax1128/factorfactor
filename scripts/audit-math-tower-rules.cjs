// Read-only audit preparation. Writes a candidate outside checkout; never deploys.
const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const [input, outputArg] = process.argv.slice(2);
if (!input || !outputArg)
  throw Error(
    "Usage: audit-math-tower-rules.cjs RULES_EXPORT OUTPUT_OUTSIDE_CHECKOUT",
  );
const root = path.resolve(__dirname, ".."),
  output = path.resolve(outputArg);
fs.mkdirSync(output, { recursive: true });
const real = fs.realpathSync(output);
if (real === root || real.startsWith(root + path.sep))
  throw Error("Audit exports must remain outside checkout");
const before = JSON.parse(fs.readFileSync(input, "utf8")),
  rules = before.rules;
assert.ok(
  rules && rules.games && rules.games.factor,
  "Expected rules.games.factor from an RTDB export",
);
assert.equal(
  rules.games.factor.mathTowerV2,
  undefined,
  "Existing mathTowerV2 requires manual merge review",
);
const after = JSON.parse(JSON.stringify(before));
after.rules.games.factor.mathTowerV2 =
  require("../firebase/math-tower.rules.fragment.json").mathTowerV2;
const preserved = JSON.parse(JSON.stringify(after));
delete preserved.rules.games.factor.mathTowerV2;
assert.deepEqual(preserved, before);
const levels = [
  ["rules", rules],
  ["games", rules.games],
  ["factor", rules.games.factor],
];
const ancestorGrants = levels.flatMap(([p, n]) =>
  [".read", ".write"]
    .filter((k) => n[k] !== undefined && n[k] !== false && n[k] !== "false")
    .map((k) => ({ path: p, operation: k, expression: n[k] })),
);
const teacher =
  rules.games.factor.teachers?.$k?.[".write"] ||
  rules.games.factor.teachers?.$account?.[".write"];
fs.writeFileSync(
  path.join(real, "integrated.rules.json"),
  JSON.stringify(after, null, 2) + "\n",
  { mode: 0o600 },
);
fs.writeFileSync(
  path.join(real, "audit-summary.json"),
  JSON.stringify(
    {
      inputSha256: require("node:crypto")
        .createHash("sha256")
        .update(fs.readFileSync(input))
        .digest("hex"),
      preservedExistingRules: true,
      ancestorGrants,
      teacherWritePredicate: teacher || null,
    },
    null,
    2,
  ) + "\n",
  { mode: 0o600 },
);
console.log(
  "Prepared local candidate; existing branches unchanged; ancestor grants: " +
    ancestorGrants.length +
    ". NOT applied.",
);
