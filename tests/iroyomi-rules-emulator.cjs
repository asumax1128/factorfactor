// games/iroyomi/rooms/<code> rules (demo emulators only; nothing is deployed). Run through
//   firebase emulators:exec --only database --project demo-factorfactor-tower --config firebase.spark.emulator.json "node tests/iroyomi-rules-emulator.cjs"
// The rules only ask for auth != null, so an anonymous login is the unit-testing auth context with the anonymous provider
// (no Auth emulator needed).
// RTDB_RULES_BASELINE_FILE is the Console export of the current rules (as for the other emulator suites). Without it
// (a local run) firebase/online-spark.candidate.rules.json, a full rules file that contains games.factor, stands in.
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  os = require("node:os"),
  path = require("node:path"),
  cp = require("node:child_process");
const { initializeTestEnvironment, assertFails, assertSucceeds } = require("@firebase/rules-unit-testing");
const { set, ref, get, remove } = require("firebase/database");
const baselineFile = process.env.RTDB_RULES_BASELINE_FILE || path.join(__dirname, "../firebase/online-spark.candidate.rules.json");
if (!process.env.RTDB_RULES_BASELINE_FILE) console.log("NOTE: no Console export given; using firebase/online-spark.candidate.rules.json as the stand-in baseline");
const original = JSON.parse(fs.readFileSync(baselineFile, "utf8"));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "iroyomi-rules-"));
const prepare = (file) => cp.spawnSync(process.execPath, [path.join(__dirname, "../scripts/prepare-iroyomi-rules.cjs"), file, path.join(tmp, "out")], { encoding: "utf8" });

// ---- the prepare script: adds games/iroyomi only, and stops where it must
const made = prepare(baselineFile);
assert.equal(made.status, 0, made.stderr);
assert.match(made.stdout, /Only games\/iroyomi added; every existing rule preserved; no deployment\./);
const candidate = JSON.parse(fs.readFileSync(path.join(tmp, "out/iroyomi-candidate.rules.json"), "utf8"));
assert.deepEqual(candidate.rules.games.iroyomi, { rooms: { $code: { ".read": "auth != null", ".write": "auth != null" } } });
const rest = JSON.parse(JSON.stringify(candidate));
delete rest.rules.games.iroyomi;
assert.deepEqual(rest, original, "every existing rule preserved");
assert.deepEqual(Object.keys(candidate.rules.games).filter((k) => !(k in original.rules.games)), ["iroyomi"]);
const stop = (mutate) => {
  const f = path.join(tmp, "case.json"),
    x = JSON.parse(JSON.stringify(original));
  mutate(x);
  fs.writeFileSync(f, JSON.stringify(x));
  return prepare(f);
};
assert.match(stop((x) => (x.rules.games.iroyomi = { rooms: {} })).stderr, /EXISTING_IROYOMI_BRANCH_REQUIRES_REVIEW/);
assert.match(stop((x) => delete x.rules.games.factor).stderr, /UNEXPECTED_CURRENT_RULES/);
assert.match(stop((x) => (x.rules[".read"] = true)).stderr, /BROAD_ANCESTOR_PERMISSION_REQUIRES_REVIEW/);
assert.match(stop((x) => (x.rules.games[".write"] = "auth != null")).stderr, /BROAD_ANCESTOR_PERMISSION_REQUIRES_REVIEW/);
assert.notEqual(prepare("").status, 0);
console.log("PASS prepare-iroyomi-rules: adds only games/iroyomi, preserves every existing rule, stops on existing branch / odd export / broad ancestor permission");

(async () => {
  if (process.env.GCLOUD_PROJECT !== "demo-factorfactor-tower") throw Error("DEMO_ONLY");
  const mk = (rules) => initializeTestEnvironment({ projectId: "demo-factorfactor-tower", database: { host: "127.0.0.1", port: 9000, rules: JSON.stringify(rules) } });
  const uid = "anon-iroyomi";
  const env = await mk(candidate);
  try {
    const open = env.unauthenticatedContext().database(),
      anon = env.authenticatedContext(uid, { firebase: { sign_in_provider: "anonymous" } }).database();
    // ---- games/iroyomi/rooms/<code>
    await assertFails(get(ref(open, "games/iroyomi/rooms/TEST")));
    await assertFails(set(ref(open, "games/iroyomi/rooms/TEST"), { x: 1 }));
    await assertSucceeds(set(ref(anon, "games/iroyomi/rooms/TEST"), { host: uid, n: 1 }));
    assert.deepEqual((await assertSucceeds(get(ref(anon, "games/iroyomi/rooms/TEST")))).val(), { host: uid, n: 1 });
    await assertSucceeds(set(ref(anon, "games/iroyomi/rooms/TEST/n"), 2));
    await assertSucceeds(remove(ref(anon, "games/iroyomi/rooms/TEST")));
    assert.equal((await get(ref(anon, "games/iroyomi/rooms/TEST"))).val(), null);
    // an unauthenticated client still cannot read what an authenticated one wrote
    await set(ref(anon, "games/iroyomi/rooms/ABCD"), { host: uid });
    await assertFails(get(ref(open, "games/iroyomi/rooms/ABCD")));
    // nothing else under games/iroyomi opens up
    await assertFails(set(ref(anon, "games/iroyomi/other"), { x: 1 }));
    await assertFails(set(ref(anon, "games/iroyomi"), { x: 1 }));
    await assertFails(get(ref(anon, "games/iroyomi")));
    console.log("PASS games/iroyomi/rooms/<code>: denied without login; read/write/remove with an anonymous login; nothing else under games/iroyomi opens");
  } finally {
    await env.cleanup();
  }
  // ---- games/factor: the same probes behave identically with and without the new branch
  const before = await mk(original);
  const after = await mk(candidate);
  try {
    const seed = { games: { factor: { accounts: { aa: { name: "A", stats: { rating: 1500 } } }, logins: { aa: { [uid]: "x" } }, teachers: { aa: true } }, bluff: { x: 1 }, iroyomiNot: 1 } };
    const probes = ["games/factor/accounts", "games/factor/accounts/aa", "games/factor/accounts/aa/stats", "games/factor/logins/aa", "games/factor/teachers/aa", "games/factor/rooms/R1", "games/factor/onlineSparkV1/config", "games/bluff/x", "games/iroyomiNot"];
    const result = async (env2, ctx, p, write) => {
      await env2.withSecurityRulesDisabled((c) => set(ref(c.database()), seed));
      try {
        if (write) await set(ref(ctx, p), { probe: 1 });
        else await get(ref(ctx, p));
        return "ok";
      } catch (e) {
        return /permission[_ ]denied/i.test(String(e.code) + e.message) ? "denied" : "error:" + e.message;
      }
    };
    for (const [name, ctxOf] of [["unauthenticated", (e2) => e2.unauthenticatedContext().database()], ["anonymous login", (e2) => e2.authenticatedContext(uid, { firebase: { sign_in_provider: "anonymous" } }).database()]])
      for (const write of [false, true])
        for (const p of probes) {
          const a = await result(before, ctxOf(before), p, write),
            b = await result(after, ctxOf(after), p, write);
          assert.equal(b, a, `${name} ${write ? "write" : "read"} ${p}: ${a} before, ${b} after`);
          assert(!a.startsWith("error"), a);
        }
    console.log("PASS games/factor and every other branch: " + probes.length * 4 + " read/write probes behave exactly as before");
  } finally {
    await before.cleanup();
    await after.cleanup();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
