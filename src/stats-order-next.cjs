'use strict';
// Ver.6.3: records that depend on the ORDER of matches, made independent of the order in which results arrive
// (a result can be received late after a B2 safe leave). Pure functions over a stats object; used by recordMatch in index.html.
//
//   legacyStreak  stats.streak / maxStreak (bounty, 懸賞金, wanted title, profile): win +1, loss 0, draw unchanged. NOT the official
//                 ledger stats.sk (there a draw ends the run). Rebuilt by replaying stats.sl in match-time order.
//   revenge       stats.revenges / stats.vs[opponent].vl (src below, added with its own tests)
//   dayStreak     stats.dl / dayStreak / maxDayStreak (shared with the Spark path)
const LEGACY_MAX = 32;
const isObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const num = (x) => (typeof x === 'number' && Number.isFinite(x) ? x : null);
const step = (n, o) => (o === 'w' ? n + 1 : o === 'l' ? 0 : n);
const ordered = (l) => Object.keys(l).map((id) => ({ id, ...l[id] })).sort((a, b) => a.t - b.t || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
const goodLedger = (sl) => isObj(sl) && sl.v === 1 && num(sl.n0) !== null && num(sl.bt) !== null && isObj(sl.l) && Object.values(sl.l).every((x) => isObj(x) && num(x.t) !== null && ['w', 'l', 'd'].includes(x.o));

// ---- legacy win streak ------------------------------------------------------------------------------------------------------
// entry = { id, t, o }.  ctx.last = stats.last BEFORE this match (the migration baseline: every match before it is already in stats.streak).
// Returns { status: 'applied' | 'duplicate' | 'unplaced-win' | 'unplaced-loss' | 'invalid' }.
function legacyStreak(s, entry, ctx = {}) {
  if (!isObj(s) || !entry || !entry.id || num(entry.t) === null || !['w', 'l', 'd'].includes(entry.o)) return { status: 'invalid' };
  let sl = s.sl;
  if (!goodLedger(sl)) {
    // migration: the value that existed before the first ledger entry is the current streak; matches older than the last recorded one cannot be placed
    const last = num(ctx.last) || 0;
    sl = { v: 1, n0: Math.max(0, num(s.streak) || 0), bt: last > 0 ? Math.max(0, last - 60000) : 0, l: {} };
  }
  const l = { ...sl.l };
  if (l[entry.id]) { s.sl = { ...sl, l }; return { status: 'duplicate' }; }
  let n0 = sl.n0, bt = sl.bt, status = 'applied', newest = false;
  if (entry.t < bt) {
    // cannot be placed against the folded part of the history: never invent a streak. A loss restarts the run (the safe side), a win is not added
    if (entry.o === 'l') n0 = 0;
    status = entry.o === 'l' ? 'unplaced-loss' : 'unplaced-win';
  } else {
    const list = ordered(l), last = list[list.length - 1];
    newest = !last || entry.t > last.t || (entry.t === last.t && entry.id > last.id);
    l[entry.id] = { t: entry.t, o: entry.o };
    let all = ordered(l);
    while (all.length > LEGACY_MAX) { const old = all.shift(); n0 = step(n0, old.o); bt = Math.max(bt, old.t + 1); delete l[old.id]; }
  }
  let n = n0; for (const e of ordered(l)) n = step(n, e.o);
  s.sl = { v: 1, n0, bt, l };
  s.streak = n;
  // best: only a result that is the newest can raise it (a late arrival never raises it by itself); it never goes down
  if (newest) s.maxStreak = Math.max(num(s.maxStreak) || 0, n);
  return { status };
}

// ---- revenge ("lost to this opponent last time, then won") --------------------------------------------------------------------
// stats.vs[opponent] = { w, l, d, last, vl, ... } (w/l/d/last are the legacy fields; vl = { b, bt, l:{id:{t,o}} } is added here, at most REVENGE_MAX entries)
//   revenges counts the adjacent "loss -> win" pairs in match-time order. Inserting a match M between its neighbours X and Y changes the count by
//   trans(X,M) + trans(M,Y) - trans(X,Y), so only the two neighbours are needed. The count is exact in any arrival order unless a late DRAW lands
//   between an already counted loss and win (it would lower the true count): a count that was earned is never taken back (ratchet, titles are kept).
//   b/bt = the baseline: the result just before the oldest kept entry and the time from which a result can be placed. For legacy data b = the
//   old `last` and bt = the account's previous match time minus 60 s (NOT time 0: an older late result must not be judged against `last`).
//   Results that cannot be placed (older than bt) do not change revenges or `last`. The oldest entry beyond the limit becomes the new baseline.
const REVENGE_MAX = 6;
const trans = (a, b) => (a === 'l' && b === 'w' ? 1 : 0);
const before = (x, y) => x.t < y.t || (x.t === y.t && x.id < y.id);
// entry = { id, t, o }; fresh = this opponent has no earlier record; ctx.last = stats.last BEFORE this match. Does NOT touch the w/l/d counters.
function revenge(s, key, entry, ctx = {}, fresh = false) {
  if (!isObj(s) || !key || !entry || !entry.id || num(entry.t) === null || !['w', 'l', 'd'].includes(entry.o)) return { status: 'invalid' };
  s.vs = isObj(s.vs) ? s.vs : {};
  const r = isObj(s.vs[key]) ? s.vs[key] : (s.vs[key] = {});
  let vl = r.vl;
  if (!(isObj(vl) && num(vl.bt) !== null && isObj(vl.l) && Object.values(vl.l).every((x) => isObj(x) && num(x.t) !== null && ['w', 'l', 'd'].includes(x.o)))) {
    const last = num(ctx.last) || 0;
    vl = { ...(['w', 'l', 'd'].includes(r.last) ? { b: r.last } : {}), bt: fresh || !r.last ? 0 : (last > 0 ? Math.max(0, last - 60000) : 0), l: {} };
  }
  const l = { ...vl.l };
  if (l[entry.id]) { r.vl = { ...vl, l }; return { status: 'duplicate' }; }
  if (entry.t < vl.bt) { r.vl = { ...vl, l }; return { status: 'unplaced' }; }
  const m = { id: entry.id, t: entry.t, o: entry.o }, list = ordered(l);
  const X = [...list].reverse().find((e) => before(e, m)), Y = list.find((e) => before(m, e));
  const xo = X ? X.o : vl.b, yo = Y ? Y.o : undefined;
  const delta = trans(xo, m.o) + trans(m.o, yo) - trans(xo, yo);
  if (delta > 0) s.revenges = (num(s.revenges) || 0) + delta;   // never decreased
  l[m.id] = { t: m.t, o: m.o };
  let b = vl.b, bt = vl.bt, all = ordered(l);
  while (all.length > REVENGE_MAX) { const old = all.shift(); b = old.o; bt = Math.max(bt, old.t + 1); delete l[old.id]; }
  r.vl = { ...(b ? { b } : {}), bt, l };
  const newest = all[all.length - 1]; if (newest) r.last = newest.o;
  return { status: 'applied', delta };
}
module.exports = { LEGACY_MAX, REVENGE_MAX, legacyStreak, revenge, ordered, step };
