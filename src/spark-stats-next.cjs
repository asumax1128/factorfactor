'use strict';
// Ver.6.0: what a settled Spark match (human or BOT-type; never a learned-ghost / hyper / self-practice match) adds to
// accounts/<key>/stats besides the official win streak (stats.sk, src/streak-next.cjs).
//
//   stats.sg          matches counted (total-games titles)         stats.sWins / stats.sLoss  wins / losses (初勝利・敗北50回)
//   stats.sw          { A, B } wins by method (kept for the wins100_ab title)
//   stats.og          online matches against a human               stats.giant250Wins  wins against an opponent 250+ above at the start
//   stats.lastDay / dayStreak / maxDayStreak   consecutive play days, counted in JST (the official daily-model epoch)
//
// A match is counted ONCE: only when the streak ledger recorded it now (a repeat of the same id is a duplicate and adds nothing).
const Streak = require('./streak-next.cjs');
const D = require('./daily-model.cjs');
const isObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const num = (x) => (typeof x === 'number' && Number.isFinite(x) && x >= 0 ? x : null);

const validEntry = (e) => Streak.validEntry(e);

// 'YYYY-M-D' (old, device date) and 'YYYY-MM-DD' (JST) are the same day: compare canonical strings.
const canon = (d) => (typeof d === 'string' ? d.replace(/^(\d+)-(\d+)-(\d+)$/, (m, y, mo, da) => `${y}-${mo.padStart(2, '0')}-${da.padStart(2, '0')}`) : '');
const jstDay = (t) => new Date(D.epoch(t) * 86400000).toISOString().slice(0, 10);
const prevDay = (d) => new Date(Date.parse(d + 'T00:00:00Z') - 86400000).toISOString().slice(0, 10);

// Consecutive play days: one shared implementation with recordMatch (src/stats-order-next.cjs). A day is counted once; a day older than the stored last
// day (late arrival, clock) is placed in the play-day history (it can fill a missed day) and never lowers or rewinds lastDay / maxDayStreak.
const Order = require('./stats-order-next.cjs');
function dayStep(s, day) { return Order.dayStep(s, day); }

// Apply a queued entry to a stats object. Returns { status, recorded }.
function apply(s, e) {
  if (!isObj(s)) return { status: 'invalid', recorded: false };
  const r = Streak.applyResult(s, e);
  if (!r.recorded) return r;
  s.sg = (num(s.sg) || 0) + 1;
  if (e.o === 'w') s.sWins = (num(s.sWins) || 0) + 1;
  if (e.o === 'l') s.sLoss = (num(s.sLoss) || 0) + 1;
  if (e.o === 'w' && (e.m === 'A' || e.m === 'B')) { const w = isObj(s.sw) ? { ...s.sw } : {}; w[e.m] = (num(w[e.m]) || 0) + 1; s.sw = w; }
  if (e.h === 1) s.og = (num(s.og) || 0) + 1;
  if (e.o === 'w' && e.g === 1) s.giant250Wins = (num(s.giant250Wins) || 0) + 1;
  dayStep(s, jstDay(e.t));
  return r;
}

module.exports = { apply, validEntry, dayStep, canon, jstDay };
