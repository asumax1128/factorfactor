// Shared harness for the Ver.6.0 step-9 title tests: the REAL BADGES / statsTx / recordMatch (and any extra index.html snippets)
// run in a vm against an in-memory stats record that behaves like an RTDB transaction target.
const assert = require("node:assert/strict"), fs = require("node:fs"), vm = require("node:vm");
const Keep = require("../src/title-keep-next.cjs"), Labels = require("../src/title-labels-next.cjs");
const html = fs.readFileSync("index.html", "utf8");
const cut = (a, b) => { const i = html.indexOf(a), j = html.indexOf(b, i); assert(i >= 0 && j > i, a); return html.slice(i, j); };
const clone = (x) => JSON.parse(JSON.stringify(x));
const base = cut("const BADGES = [", "function AchievementAuditPanel") + "\n" + cut("async function statsTx(acct, fn)", "const wkOf = s =>")  + "\n" + cut("async function recordMatch(acct, info)", "/* ---------- 効果音");
function world(initial, { keep = Keep, extra = [], globals = {} } = {}) {
  const db = { value: initial, writes: 0 };
  // WITH_ORDER=1 runs the production path (order-independent records, src/stats-order-next.cjs); without it the previous inline rules run
  const sandbox = {
    window: { ...(keep ? { TitleKeepNext: keep } : {}), ...(process.env.WITH_ORDER ? { StatsOrderNext: require("../src/stats-order-next.cjs") } : {}) }, titleLabelOf: (id) => Labels.resolve(id, null),
    isReal: () => true, DBX: null, RATING_INIT: 1500, jstDate: (t = Date.now()) => new Date(t + 9 * 3600e3).toISOString().slice(0, 10), fbNow: () => Date.now(), SEASON0: "2026-10", seasonKey: () => "2026-10", seasonReset: (r) => r,
    FX: { band() {}, confetti() {} }, fxSound() {}, setTimeout: (f) => f(), console: { warn() {} }, prevWeek: () => "", ...globals,
    FB: { db: { ref: () => ({ transaction: async (cb) => {
      const out = cb(db.value === null ? null : clone(db.value));
      if (out === undefined) return { committed: false };
      db.value = clone(out); db.writes++; return { committed: true };
    } }) } },
  };
  vm.createContext(sandbox);
  vm.runInContext(base + "\n" + extra.join("\n") + "\nthis.api = { BADGES, badgesOf, statsTx, recordMatch, announceableBadges, keptTitle };", sandbox);
  return { db, sandbox, api: sandbox.api };
}
const acct = { key: "aw" };
const ids = (api, st) => [...api.badgesOf(st).map((b) => b.id)];
module.exports = { Keep, html, cut, clone, world, acct, ids };
