// Ver.6.0 A8: cancel500 / cancel2000 = attacks cancelled COMPLETELY (event count), not the cancelled amount.
const test = require("node:test"), assert = require("node:assert/strict"), fs = require("node:fs"), cp = require("node:child_process"), vm = require("node:vm");
const { Keep, html, world, acct, ids } = require("./a-batch-harness.cjs");
const E = require("../server/online-rated/engine.cjs");
const old = (file) => cp.execFileSync("git", ["show", `949f2cc:${file}`], { encoding: "utf8", maxBuffer: 1 << 26 });

// ---- B2 engine: bookkeeping only, amounts and every other state field are exactly as before ----
test("b2.cjs differs from the A3 baseline ONLY by the event bookkeeping (nothing else in attack/defence changed)", () => {
  let now = fs.readFileSync("server/online-rated/b2.cjs", "utf8");
  const undo = [
    ["pending:0,pendQ:[],cancelFull:0,counterUntil:0", "pending:0,counterUntil:0"],
    ["s.pending=0;s.pendQ=[];s.counterUntil=0}", "s.pending=0;s.counterUntil=0}"],
    ["s.cancelTotal=(s.cancelTotal||0)+cancel;cancelEvents(s,cancel);s.pending-=cancel;", "s.cancelTotal=(s.cancelTotal||0)+cancel;s.pending-=cancel;"],
    ["queueArrival(o,arrived);o.pending+=arrived;", "o.pending+=arrived;"],
  ];
  for (const [a, b] of undo) { assert.equal(now.split(a).length - 1, 1, a); now = now.replace(a, b); }
  const i = now.indexOf("// Ver.6.0 A8: bookkeeping"), j = now.indexOf("function view(m,uid){");
  assert(i > 0 && j > i); now = now.slice(0, i) + now.slice(j);
  assert.equal(now, old("server/online-rated/b2.cjs"));
});
const begin = () => E.begin("t", "easy", "B", ["a", "b"], "fixed", 10000, { rules: "b2", duration: 90 });
function answer(m, u) {
  const v = E.view(m, u), api = E.runtime(m).api; let pair;
  for (let i = 0; i < v.tiles.length && !pair; i++) for (let j = i + 1; j < v.tiles.length; j++) if (api.polyEqual(api.multiply(v.tiles[i].factor, v.tiles[j].factor), v.poly)) { pair = [v.tiles[i].id, v.tiles[j].id]; break; }
  return E.step(m, u, { type: "answer", seq: (m.states[u].serial || 0) + 1, question: v.question, tiles: pair }, m.time + 100);
}
// give `u` an incoming queue of attack events (same state shape the engine builds), then let `u` answer with a given combo
const setup = (events, combo) => { const m = begin(); const s = m.states.b; s.pending = events.reduce((x, y) => x + y, 0); s.pendQ = events.slice(); s.counterUntil = m.time + 3000; s.combo = combo - 1; s.cur.oj = 0; return m; };
test("an attack cancelled completely is counted once; the amount counter is unchanged", () => {
  const m = answer(setup([3], 4), "b"); // combo 4 -> attack 3 -> cancels 3
  assert.equal(m.states.b.cancelFull, 1); assert.equal(m.states.b.cancelTotal, 3); assert.equal(m.states.b.pending, 0); assert.deepEqual([...m.states.b.pendQ], []);
});
test("a partly cancelled attack is not counted; finishing it later counts it once", () => {
  let m = answer(setup([3], 2), "b"); // combo 2 -> attack 1 -> cancels 1 of 3
  assert.equal(m.states.b.cancelFull || 0, 0); assert.equal(m.states.b.pending, 2); assert.deepEqual([...m.states.b.pendQ], [2]);
  m = E.step(m, "b", { type: "heartbeat" }, m.states.b.nextAt);
  m = answer(m, "b"); // combo 3 -> attack 2 -> cancels the rest
  assert.equal(m.states.b.cancelFull, 1); assert.equal(m.states.b.cancelTotal, 3);
});
test("several waiting attacks: each one fully cancelled counts, oldest first; a surviving remainder is not counted", () => {
  const m = answer(setup([1, 2, 3], 4), "b"); // attack 3 cancels the 1 and the 2 completely
  assert.equal(m.states.b.cancelFull, 2); assert.equal(m.states.b.pending, 3); assert.deepEqual([...m.states.b.pendQ], [3]);
  const n = answer(setup([2, 3], 2), "b"); // attack 1 cancels half of the first: none complete
  assert.equal(n.states.b.cancelFull || 0, 0); assert.deepEqual([...n.states.b.pendQ], [1, 3]);
});
test("an attack that landed (pending expired) is never counted afterwards; old in-flight states without pendQ are rebuilt safely", () => {
  const m = begin(), s = m.states.b; s.pending = 2; s.counterUntil = m.time + 3000; s.combo = 2; delete s.pendQ; // state from before the update
  const n = answer(m, "b"); // attack 3 cancels 2
  assert.equal(n.states.b.cancelFull, 1);
  const landed = begin(); landed.states.b.pending = 2; landed.states.b.pendQ = [2]; landed.states.b.counterUntil = landed.time + 10;
  const l = E.step(landed, "a", { type: "heartbeat" }, landed.time + 20);
  assert.equal(l.states.b.cancelFull || 0, 0); assert.deepEqual([...(l.states.b.pendQ || [])], []);
});
test("new attacks queue one event each (arrival sizes) and the queue sum equals pending", () => {
  let m = begin(); m.states.a.combo = 2;
  m = answer(m, "a"); // attack 2 -> b
  assert.equal(m.states.b.pending, 2); assert.deepEqual([...m.states.b.pendQ], [2]);
});

// ---- legacy A/C-style engine in index.html ----
const send = html.slice(html.indexOf("let cancelled = 0;\n    for (const p of s.pend) {"), html.indexOf("s.pend = s.pend.filter(p => p.dmg > 0 || p.oj > 0);\n    // C：仲間に届いている攻撃もカバー"));
const run = (pend, units) => { const s = { pend: pend.map((p) => ({ ...p })), cancelFull: 0 }; const f = new Function("s", "units", "OJAMA_UNIT", send + "\nreturn { cancelled, units };"); const r = f(s, units, 2); return { s, ...r }; };
test("legacy engine (A/B/C): complete cancellations are counted, partial ones are not, the amounts are as before", () => {
  let r = run([{ dmg: 3, oj: 0 }], 3); assert.equal(r.s.cancelFull, 1); assert.equal(r.cancelled, 3);
  r = run([{ dmg: 3, oj: 0 }], 2); assert.equal(r.s.cancelFull, 0); assert.equal(r.s.pend[0].dmg, 1);
  r = run([{ dmg: 1, oj: 0 }, { dmg: 2, oj: 0 }, { dmg: 5, oj: 0 }], 4); assert.equal(r.s.cancelFull, 2); assert.equal(r.s.pend[2].dmg, 4);
  r = run([{ dmg: 0, oj: 1 }], 5); assert.equal(r.s.cancelFull, 1, "an ojama-only attack fully cancelled");
  r = run([{ dmg: 2, oj: 1 }], 3); assert.equal(r.s.cancelFull, 1, "the engine drops an ojama card once any of it is cancelled (round up), so nothing lands: counted");
  r = run([{ dmg: 4, oj: 1 }], 3); assert.equal(r.s.cancelFull, 0, "damage still remains: not counted");
  r = run([], 4); assert.equal(r.s.cancelFull, 0);
});
test("index.html differs from the A3 baseline in sendAttack ONLY by the one counting statement; coverPend (a teammate's cancel) is untouched", () => {
  const cut = (t) => t.slice(t.indexOf("E.sendAttack = "), t.indexOf("E.answer = ok =>"));
  const stmt = "      if (c > 0 && p.dmg <= 0 && p.oj <= 0) s.cancelFull = (s.cancelFull || 0) + 1; // Ver.6.0 A8：攻撃1回を自分の相殺で完全に打ち消した\n";
  const now = cut(html); assert.equal(now.split(stmt).length - 1, 1);
  assert.equal(now.replace(stmt, ""), cut(old("index.html")));
  assert.equal(html.split("cancelFull").length > 1, true);
  const cp0 = (t) => t.slice(t.indexOf("const coverPend"), t.indexOf("/* 自分の攻撃"));
  assert.equal(cp0(html), cp0(old("index.html")));
});

// ---- titles ----
const info = (add, o = {}) => ({ outcome: "w", mode: "B", dr: 5, exp: 30, perfects: 0, vs: [], add, max: {}, min: {}, or: {}, ...o });
test("500 / 2000 complete cancellations grant the titles; the old amount no longer does (with tk)", async () => {
  const w = world({ games: 2, cancelFull: 499 });
  const r0 = await w.api.recordMatch(acct, info({ cancelFull: 1 }));
  assert.equal(r0.badges.some((b) => b.id === "cancel500"), true); assert.equal(r0.badges.find((b) => b.id === "cancel500").label, "絶対防壁");
  assert.equal(ids(w.api, { cancelFull: 1999, tk: { v: 1, at: 1 } }).includes("cancel2000"), false);
  assert.equal(ids(w.api, { cancelFull: 2000, tk: { v: 1, at: 1 } }).includes("cancel2000"), true);
  assert.equal(ids(w.api, { cancelTotal: 5000, tk: { v: 1, at: 1 } }).includes("cancel500"), false, "amount alone no longer grants once tk exists");
});
test("old holders keep both titles (tk, no tk, after the first write); equipment and amounts untouched; freeze failure keeps them", async () => {
  const start = { cancelTotal: 2500, games: 30, nick: "cancel2000" };
  assert.equal(ids(world(null).api, start).includes("cancel2000"), true);
  const w = world({ ...start }); await w.api.recordMatch(acct, info({ cancelTotal: 4, cancelFull: 1 }));
  assert.deepEqual(Object.keys(w.db.value.tk.ids).sort(), ["cancel2000", "cancel500"]);
  assert.equal(w.db.value.cancelTotal, 2504); assert.equal(w.db.value.nick, "cancel2000");
  assert.equal(ids(w.api, w.db.value).includes("cancel2000"), true);
  for (const keep of [null, {}, { ensureKeep() { throw new Error("x"); }, isFrozen: () => false, keptIds: () => [] }]) {
    const f = world({ ...start }, { keep }); await f.api.recordMatch(acct, info({ cancelFull: 1 }));
    assert.equal(ids(f.api, f.db.value).includes("cancel2000"), true);
  }
});
test("result screen records the event count next to the amount", () => {
  assert.match(html, /add\.cancelTotal = es\.cancelTotal; add\.cancelFull = es\.cancelFull \|\| 0;/);
  const cat = JSON.parse(fs.readFileSync("src/title-catalog-next.json", "utf8")), list = Array.isArray(cat) ? cat : cat.titles;
  assert.equal(list.find((x) => x.id === "cancel500").condition, "攻撃を累計500回無効化"); assert.equal(list.find((x) => x.id === "cancel2000").condition, "攻撃を累計2000回無効化");
  assert.equal(Keep.LEGACY_TESTS.cancel500({ cancelTotal: 500 }), true);
});
