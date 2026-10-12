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
const before = JSON.parse(
    fs.readFileSync(input, "utf8").replace(/^\uFEFF/, ""),
  ),
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
// Keep the tower addition and the two teacher write predicates separate.
const teacherFragment = require("../firebase/teacher-registration.rules.fragment.json");
const teacherOnly = JSON.parse(JSON.stringify(before));
for (const branch of ["teacherKeys", "teachers"]) {
  assert.ok(
    before.rules.games.factor[branch]?.$k?.[".write"],
    "Expected existing " + branch + "/$k write predicate",
  );
  teacherOnly.rules.games.factor[branch].$k[".write"] =
    teacherFragment[branch].$k[".write"];
}
const combined = JSON.parse(JSON.stringify(teacherOnly));
combined.rules.games.factor.mathTowerV2 = after.rules.games.factor.mathTowerV2;
const restored = JSON.parse(JSON.stringify(combined));
delete restored.rules.games.factor.mathTowerV2;
for (const branch of ["teacherKeys", "teachers"])
  restored.rules.games.factor[branch].$k[".write"] =
    before.rules.games.factor[branch].$k[".write"];
assert.deepEqual(
  restored,
  before,
  "Only mathTowerV2 and the two write predicates may change",
);
const candidates = {
  "current.canonical.json": before,
  "tower-only.rules.json": after,
  "teacher-only.rules.json": teacherOnly,
  "combined.rules.json": combined,
};
for (const [name, data] of Object.entries(candidates))
  fs.writeFileSync(
    path.join(real, name),
    JSON.stringify(data, null, 2) + "\n",
    { mode: 0o600 },
  );
const { execFileSync } = require("node:child_process");
for (const [name, from, to] of [
  ["01-add-math-tower.diff", "current.canonical.json", "tower-only.rules.json"],
  [
    "02-fix-teacher-registration.diff",
    "current.canonical.json",
    "teacher-only.rules.json",
  ],
  [
    "02-on-tower-candidate.diff",
    "tower-only.rules.json",
    "combined.rules.json",
  ],
]) {
  let diff = "";
  try {
    diff = execFileSync(
      "diff",
      [
        "-u",
        "--label",
        from,
        "--label",
        to,
        path.join(real, from),
        path.join(real, to),
      ],
      { encoding: "utf8" },
    );
  } catch (e) {
    if (e.status !== 1) throw e;
    diff = e.stdout;
  }
  fs.writeFileSync(path.join(real, name), diff, { mode: 0o600 });
}
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
