'use strict';
// Ver.6.0 A7: official win streak for streak10 / streak30 / streak50 ("10 / 30 / 50 consecutive wins").
//
// Counted: room matches (A/B/C methods, class tournaments, CPU and BOT opponents) and Spark human / BOT-type matches.
// Not counted: ghost matches, CPU practice. A win is +1; a loss or a draw ends the run (0).
// The legacy counters stats.streak / stats.maxStreak are NOT touched (bounty, お尋ね者 and the profile still use them).
//
//   stats.sk = { v:1, n, best, n0, l:{ <id>:{ t, o, s, r? } } }
//     n     current run          best  longest official run
//     n0    run value just before the oldest ledger entry (the ledger keeps the newest 64 matches)
//     l     match ledger keyed by a RTDB-safe match id: t time (ms), o 'w'|'l'|'d', s 'r' room | 's' Spark, r 1 = restart point
//
// The run is always recomputed by replaying the ledger in time order from n0, so a duplicate, a late arrival (offline queue,
// another device) or a retry gives the same answer. Order that cannot be decided restarts the run (never invents a streak):
//   - a room result and a Spark result within 5 s of each other whose outcomes differ (their order changes the run)
//   - a result older than everything in a full ledger (cannot be placed)
//   - a malformed ledger
// A restart never lowers `best` and never removes a title.

const LEDGER_MAX = 64;
const WINDOW_MS = 5000;
const isObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const num = (x) => (typeof x === 'number' && Number.isFinite(x) ? x : null);
const safeId = (id) => (typeof id === 'string' && id ? id.replace(/[.#$\[\]\/\s]/g, '_').slice(0, 80) : '');
const validEntry = (e) => isObj(e) && safeId(e.id) && num(e.t) !== null && e.t > 0 && ['w', 'l', 'd'].includes(e.o) && ['r', 's'].includes(e.s);

function ordered(l) {
  return Object.keys(l).map((id) => ({ id, ...l[id] })).sort((a, b) => a.t - b.t || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}
const goodLedger = (l) => isObj(l) && Object.values(l).every((x) => isObj(x) && num(x.t) !== null && ['w', 'l', 'd'].includes(x.o) && ['r', 's'].includes(x.s));

// Replay: returns { n, max } for the entries starting from n0.
function replay(n0, list) {
  let n = n0, max = 0;
  for (const e of list) { n = e.r ? 0 : e.o === 'w' ? n + 1 : 0; if (n > max) max = n; }
  return { n, max };
}

// Apply one result to a stats object (mutates and returns { status }). status: 'applied' | 'duplicate' | 'restart' | 'invalid'
function applyResult(s, entry) {
  if (!isObj(s) || !validEntry(entry)) return { status: 'invalid' };
  const id = safeId(entry.id);
  let sk = s.sk;
  if (!isObj(sk) || sk.v !== 1 || !goodLedger(sk.l === undefined ? {} : sk.l) || num(sk.n0 === undefined ? 0 : sk.n0) === null) {
    // missing: start fresh. malformed: start fresh too (restart), keeping the best that was readable
    sk = { v: 1, n: 0, best: isObj(s.sk) && num(s.sk.best) !== null && s.sk.best >= 0 ? s.sk.best : 0, n0: 0, l: {} };
  }
  const l = { ...(sk.l || {}) };
  if (l[id]) return { status: 'duplicate' };
  const list = ordered(l);
  let status = 'applied';
  if (list.length >= LEDGER_MAX && entry.t < list[0].t) {
    // cannot be placed: restart the run, the result itself is not recorded
    s.sk = { ...sk, l, n: 0 };
    return { status: 'restart' };
  }
  const e = { t: entry.t, o: entry.o, s: entry.s };
  for (const x of list) {
    if (x.s !== e.s && Math.abs(x.t - e.t) <= WINDOW_MS && x.o !== e.o) { l[x.id] = { t: x.t, o: x.o, s: x.s, r: 1 }; e.r = 1; status = 'restart'; }
  }
  l[id] = e;
  let all = ordered(l), n0 = num(sk.n0) === null ? 0 : sk.n0;
  while (all.length > LEDGER_MAX) {
    const old = all.shift();
    n0 = old.r ? 0 : old.o === 'w' ? n0 + 1 : 0;
    delete l[old.id];
  }
  const { n, max } = replay(n0, all);
  // `best` only rises when the newest result was just added in order. A late arrival can recompute the current run, but it
  // never raises `best` by itself (a still-missing loss in between could make the replayed run look longer than it was).
  const newest = all.length && all[all.length - 1].id === id;
  s.sk = { v: 1, n, best: Math.max(num(sk.best) || 0, newest ? max : 0), n0, l };
  return { status };
}

const bestOf = (s) => (isObj(s) && isObj(s.sk) && num(s.sk.best) !== null ? s.sk.best : 0);

module.exports = { LEDGER_MAX, WINDOW_MS, safeId, validEntry, applyResult, bestOf, replay, ordered };
