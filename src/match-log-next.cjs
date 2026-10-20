'use strict';
// Ver.6.3: order-independent match log (stats.ml) for the order-dependent records.
//
// WHY. A result can reach the account long after the match (B2 safe leave, offline queue, another device). Counting "consecutive wins" and
// "lost to this opponent, then won" in arrival order, or by a guessed time, gave wrong answers (a late draw, a missing loss) and a wrong answer
// is a permanent wrong title, because titles are derived from the counters. So:
//
//   * the position of a match is the SERVER commit order of one number, ml.n (all writes to accounts/<key>/stats are serialised by the server).
//     A match gets its position when it STARTS (an "open" entry confirmed by the server before the first answer); its result later fills the
//     same entry. A result with no open (old tab, failed write) is appended where it arrives and is flagged: it is never evidence.
//   * three layers that are never mixed:
//       progress   what the profile / bounty show (stats.streak). Replayed from the log; may move up and down when a late result arrives.
//       evidence   what a NEW title may rest on (maxStreak, sk.best, revenges). Monotone; raised only by a run / pair that is PROVEN:
//                  all entries known and proven, none of them missing in between (no unresolved open, gap or unproven entry inside).
//       held       titles already earned (stats.tk and the old counter values) are never lowered; evidence only ever adds to them.
//   * "unknown" is a barrier, not a guess. An unresolved open, a gap (another client wrote the counters) and an unproven entry restart the evidence
//     run (a lower bound is still valid) and separate revenge pairs. They never add or remove progress by guessing.
//
// Everything here is a pure function of the stats object (no clock, no network); the caller passes `now`.
const CAP = 64;            // entries kept (older ones are folded into the base, never dropped silently)
const OPEN_MAX = 24;       // unresolved opens kept (entries + orphans); a new open beyond this is refused ('full'), play is not blocked
const PL_MAX = 24;         // opponents whose last proven result is a loss (a pending revenge)
const isObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const num = (x) => (typeof x === 'number' && Number.isFinite(x) ? x : null);
const OUT = ['w', 'l', 'd'];
const KINDS = ['r', 'g', 's'];   // r room match, g ghost room match (no official streak), s Spark match (no legacy streak / revenge)

// ---- entry <-> string -------------------------------------------------------------------------------------------------------
// stats.ml.e[id] = "<n base36>|<kind><result><flag>|<opponent>[=<outcome>],..."   result: o open, w l d, x gap   flag: '' proven, u unproven-prompt, L unproven-late
const safeId = (id) => {
  if (typeof id !== 'string' || !id) return '';
  let s = id.replace(/[.#$\[\]\/\s]/g, '_');
  if (s.length > 24) s = s.slice(0, 14) + '~' + (hash(s) >>> 0).toString(36).slice(0, 8);   // long ids (Spark uuid) stay short; the key is only used inside this log
  return s;
};
function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h; }
const enc = (k) => encodeURIComponent(String(k)).replace(/[,|=]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
const dec = (k) => { try { return decodeURIComponent(k); } catch (_) { return k; } };
function format(e) {
  const v = (e.v || []).map((x) => enc(x.k) + (x.o ? '=' + x.o : '')).join(',');
  return e.n.toString(36) + '|' + e.k + e.r + (e.f || '') + '|' + v;
}
function parse(id, str) {
  if (typeof str !== 'string') return null;
  const p = str.split('|');
  if (p.length < 3) return null;
  const n = parseInt(p[0], 36), m = /^([rgs])([owldx])([uL]?)$/.exec(p[1]);
  if (!Number.isFinite(n) || !m) return null;
  const v = p[2] ? p[2].split(',').map((t) => { const i = t.indexOf('='); return i < 0 ? { k: dec(t) } : { k: dec(t.slice(0, i)), o: t.slice(i + 1) }; }) : [];
  return { id, n, k: m[1], r: m[2], f: m[3], v };
}
const entries = (ml) => Object.keys(ml.e).map((id) => parse(id, ml.e[id])).filter(Boolean).sort((a, b) => a.n - b.n);
const goodMl = (ml) => isObj(ml) && ml.v === 1 && isObj(ml.e) && num(ml.n) !== null && isObj(ml.f) && isObj(ml.ev);

// ---- the automaton: one entry at a time, in n order ---------------------------------------------------------------------------
// st = { lp, lc, oc, pl:Set, rc }   lp legacy progress (stats.streak)   lc / oc certified legacy / official run   pl pending-revenge opponents   rc certified revenge pairs
const inLegacy = (k) => k === 'r' || k === 'g', inOfficial = (k) => k === 'r' || k === 's', inRevenge = (k) => k === 'r' || k === 'g';
function consume(st, e, mx) {
  if (e.r === 'x') { st.lp = Math.max(0, Math.floor(Number(e.v[0] && e.v[0].k) || 0)); st.lc = 0; st.oc = 0; st.pl.clear(); return; }   // gap: every run and pair restarts; progress takes the value the other client left
  if (e.r === 'o') {   // not decided yet: a barrier, progress does not move
    if (inLegacy(e.k)) st.lc = 0;
    if (inOfficial(e.k)) st.oc = 0;
    if (inRevenge(e.k)) e.v.forEach((x) => st.pl.delete(x.k));
    return;
  }
  const proven = !e.f, late = e.f === 'L';
  if (inLegacy(e.k)) {
    if (!late) st.lp = e.r === 'w' ? st.lp + 1 : e.r === 'l' ? 0 : st.lp;   // progress: draw keeps, loss resets (the legacy rule)
    if (proven) { st.lc = e.r === 'w' ? st.lc + 1 : e.r === 'l' ? 0 : st.lc; if (mx && st.lc > mx.lg) mx.lg = st.lc; } else st.lc = 0;
  }
  if (inOfficial(e.k)) {
    if (proven) { st.oc = e.r === 'w' ? st.oc + 1 : 0; if (mx && st.oc > mx.og) mx.og = st.oc; } else st.oc = 0;   // official rule: a draw ends the run
  }
  if (inRevenge(e.k)) {
    for (const x of e.v) {
      if (!proven || !OUT.includes(x.o)) { st.pl.delete(x.k); continue; }
      if (x.o === 'w' && st.pl.has(x.k)) st.rc++;
      if (x.o === 'l') { st.pl.add(x.k); } else st.pl.delete(x.k);
    }
    if (st.pl.size > PL_MAX) { const first = st.pl.values().next().value; st.pl.delete(first); }   // forgetting a pending revenge can only lose a count, never invent one
  }
}
const foldState = (ml) => ({ lp: Math.max(0, num(ml.f.lp) || 0), lc: Math.max(0, num(ml.f.lc) || 0), oc: Math.max(0, num(ml.f.oc) || 0), pl: new Set(Array.isArray(ml.f.pl) ? ml.f.pl : []), rc: Math.max(0, num(ml.f.rc) || 0) });

// Derive everything from the log: { progress, evidence }.  Pure; the same entries give the same answer in any arrival order.
function derive(ml) {
  const st = foldState(ml), mx = { lg: st.lc, og: st.oc };
  for (const e of entries(ml)) consume(st, e, mx);
  return { progress: { streak: st.lp }, evidence: { lg: mx.lg, og: mx.og, rv: st.rc }, pending: [...st.pl] };
}

// ---- digest: detect a write by a client that does not know this log (6.2 tab) ----------------------------------------------------
const digestOf = (s) => [s.games, s.sg, s.streak, s.maxStreak, s.revenges, s.sk && s.sk.n, s.sk && s.sk.best].map((x) => (num(x) === null ? 0 : x)).join(',');

// ---- operations (each mutates the stats object and returns { status, ... }) ------------------------------------------------------
function fresh(s) {
  return { v: 1, n: 0, e: {}, f: { lp: Math.max(0, num(s.streak) || 0), lc: 0, oc: 0, pl: [], rc: 0 }, ev: { lg: 0, og: 0, rv: 0 }, d: '' };
}
// Call first in every transaction that touches the records. Creates the log (migration: the current streak is progress only, never evidence) or
// records a gap when the counters changed behind the log's back.
function begin(s) {
  if (!isObj(s)) return { status: 'invalid' };
  if (!goodMl(s.ml)) { s.ml = fresh(s); s.ml.d = digestOf(s); return { status: 'created' }; }
  if (s.ml.d !== digestOf(s)) {
    const ml = s.ml, gid = 'gap' + (ml.n + 1).toString(36);
    ml.e = { ...ml.e, [gid]: format({ n: ++ml.n, k: 'r', r: 'x', f: '', v: [{ k: String(Math.max(0, num(s.streak) || 0)) }] }) };
    compact(ml);
    ml.d = digestOf(s);
    return { status: 'gap' };
  }
  return { status: 'ok' };
}
// Fold the oldest entries into the base until at most CAP remain. An unresolved open is moved to ml.f.ob (kept, resolvable), never deleted.
function compact(ml) {
  const list = entries(ml);
  if (list.length <= CAP) return;
  const st = foldState(ml), ob = Array.isArray(ml.f.ob) ? ml.f.ob.slice() : [], e2 = { ...ml.e };
  for (const e of list.slice(0, list.length - CAP)) {
    consume(st, e, null);
    if (e.r === 'o') ob.push(e.id + '|' + e.k + '|' + e.v.map((x) => enc(x.k)).join(','));
    delete e2[e.id];
  }
  ml.e = e2;
  ml.f = { lp: st.lp, lc: st.lc, oc: st.oc, pl: [...st.pl], rc: st.rc, ...(ob.length ? { ob } : {}) };
}
const unresolved = (ml) => Object.values(ml.e).filter((x) => /^[^|]*\|[rgs]o/.test(x)).length + (Array.isArray(ml.f.ob) ? ml.f.ob.length : 0);
const orphanIndex = (ml, id) => (Array.isArray(ml.f.ob) ? ml.f.ob.findIndex((x) => x.split('|')[0] === id) : -1);

// open: the match has started (call before the first answer, confirmed by the server). `proven` = the open was committed before the match began
// (now <= startAt); a late open is flagged u (still a known match, never evidence).
function open(s, { id, kind, opponents = [], startAt, now }) {
  if (!isObj(s) || !KINDS.includes(kind)) return { status: 'invalid' };
  const key = safeId(id);
  if (!key) return { status: 'invalid' };
  begin(s);
  const ml = s.ml;
  if (ml.e[key] || orphanIndex(ml, key) >= 0) return { status: 'exists' };
  if (unresolved(ml) >= OPEN_MAX) return { status: 'full' };
  const proven = num(startAt) !== null && num(now) !== null && now <= startAt;
  ml.e = { ...ml.e, [key]: format({ n: ++ml.n, k: kind, r: 'o', f: proven ? '' : 'u', v: opponents.filter(Boolean).map((k) => ({ k })) }) };
  compact(ml);
  return { status: proven ? 'opened' : 'opened-late' };
}
// settle: the result of a match. opponents = [{ key, o }] (per opponent outcome, rooms only). late = the result was received after a safe leave.
function settle(s, { id, kind, outcome, opponents = [], late = false }) {
  if (!isObj(s) || !KINDS.includes(kind) || !OUT.includes(outcome)) return { status: 'invalid' };
  const key = safeId(id);
  if (!key) return { status: 'invalid' };
  if (!goodMl(s.ml)) begin(s);   // begin() itself is the caller's first step: the counters have already moved by now, a second digest check would see them as another client's write
  const ml = s.ml, v = opponents.filter((x) => x && x.key).map((x) => ({ k: x.key, o: OUT.includes(x.o) ? x.o : undefined }));
  const cur = ml.e[key] && parse(key, ml.e[key]);
  if (cur) {
    if (cur.r !== 'o') return { status: 'duplicate' };
    ml.e = { ...ml.e, [key]: format({ ...cur, r: outcome, v }) };   // same position, the result fills the open
    return { status: 'resolved' };
  }
  const oi = orphanIndex(ml, key);
  if (oi >= 0) { ml.f = { ...ml.f, ob: ml.f.ob.filter((_, i) => i !== oi) }; if (!ml.f.ob.length) delete ml.f.ob; }
  // no open (6.2 tab, failed write, folded open): appended where it arrives; a late one does not move progress either
  ml.e = { ...ml.e, [key]: format({ n: ++ml.n, k: kind, r: outcome, f: late || oi >= 0 ? 'L' : 'u', v }) };
  compact(ml);
  return { status: oi >= 0 ? 'orphan' : 'appended' };
}
// void: PROVEN that the match never produced a result (the caller must hold server evidence). Removes the open; nothing else changes.
function voidOpen(s, { id }) {
  const key = safeId(id);
  if (!isObj(s) || !key || !goodMl(s.ml)) return { status: 'invalid' };
  const ml = s.ml, cur = ml.e[key] && parse(key, ml.e[key]);
  if (cur && cur.r === 'o') { const e2 = { ...ml.e }; delete e2[key]; ml.e = e2; return { status: 'voided' }; }
  const oi = orphanIndex(ml, key);
  if (oi >= 0) { ml.f = { ...ml.f, ob: ml.f.ob.filter((_, i) => i !== oi) }; if (!ml.f.ob.length) delete ml.f.ob; return { status: 'voided' }; }
  return { status: 'none' };
}
// finish: derive and write the mirrors. progress -> stats.streak; evidence -> maxStreak / sk.best / revenges, each only ever RAISED (held values stay).
// best0 = stats.sk.best before this transaction touched it (the official ledger raises `best` by itself; only proven runs may).
function finish(s, { best0 = 0 } = {}) {
  if (!isObj(s) || !goodMl(s.ml)) return { status: 'invalid' };
  const ml = s.ml, d = derive(ml);
  s.streak = d.progress.streak;
  if (d.evidence.lg > (num(s.maxStreak) || 0)) s.maxStreak = d.evidence.lg;
  const og = Math.max(num(best0) || 0, d.evidence.og);
  if (isObj(s.sk)) s.sk.best = og;
  else if (og > 0) s.sk = { v: 1, n: 0, best: og, n0: 0, l: {} };
  const addRv = Math.max(0, d.evidence.rv - (num(ml.ev.rv) || 0));
  if (addRv) s.revenges = (num(s.revenges) || 0) + addRv;
  ml.ev = { lg: Math.max(num(ml.ev.lg) || 0, d.evidence.lg), og: Math.max(num(ml.ev.og) || 0, d.evidence.og), rv: Math.max(num(ml.ev.rv) || 0, d.evidence.rv) };
  ml.d = digestOf(s);
  return { status: 'ok', ...d };
}

module.exports = { CAP, OPEN_MAX, PL_MAX, safeId, format, parse, entries, derive, digestOf, begin, open, settle, voidOpen, finish, compact, unresolved, goodMl };
