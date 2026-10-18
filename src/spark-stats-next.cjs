'use strict';
// Ver.6.0 A9: what a settled Spark match adds to accounts/<key>/stats besides the official win streak (stats.sk).
//
//   stats.sg        Spark human / BOT-type matches counted (ghost matches are counted in stats.gg by the Spark client)
//   stats.sw        { A, B } Spark wins by method
//   stats.giant250Wins  wins against an opponent whose rating at the start was 250 or more above the player's
//   stats.og        online matches against a human (Spark human matches; room matches against registered players are in stats.vs)
//   stats.sx        { e, n } highest Spark rating reached on the easy / normal scale (a mirror of the Spark profile, only ever raised)
//
// A match is counted ONCE: only when the streak ledger recorded it now (a repeat of the same id is a duplicate and adds nothing).
const Streak = require('./streak-next.cjs');
const isObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const num = (x) => (typeof x === 'number' && Number.isFinite(x) && x >= 0 ? x : null);

const validRatings = (e) => isObj(e) && e.kind === 'ratings' && typeof e.id === 'string' && !!e.id && (num(e.e) !== null || num(e.n) !== null);
const validEntry = (e) => (isObj(e) && e.kind === 'ratings' ? validRatings(e) : Streak.validEntry(e));

function raiseSx(s, e, n) {
  const a = num(e), b = num(n);
  if (a === null && b === null) return;
  const x = isObj(s.sx) ? { ...s.sx } : {};
  if (a !== null && !(num(x.e) >= a)) x.e = a;
  if (b !== null && !(num(x.n) >= b)) x.n = b;
  s.sx = x;
}

// Apply a queued entry to a stats object. Returns { status, recorded }.
function apply(s, e) {
  if (!isObj(s)) return { status: 'invalid', recorded: false };
  if (isObj(e) && e.kind === 'ratings') {
    if (!validRatings(e)) return { status: 'invalid', recorded: false };
    raiseSx(s, e.e, e.n);
    return { status: 'applied', recorded: false };
  }
  const r = Streak.applyResult(s, e);
  if (!r.recorded) return r;
  s.sg = (num(s.sg) || 0) + 1;
  if (e.o === 'w' && (e.m === 'A' || e.m === 'B')) { const w = isObj(s.sw) ? { ...s.sw } : {}; w[e.m] = (num(w[e.m]) || 0) + 1; s.sw = w; }
  if (e.h === 1) s.og = (num(s.og) || 0) + 1;
  if (e.o === 'w' && e.g === 1) s.giant250Wins = (num(s.giant250Wins) || 0) + 1;
  raiseSx(s, e.re, e.rn);
  return r;
}

module.exports = { apply, validEntry, validRatings };
