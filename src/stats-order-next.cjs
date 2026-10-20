'use strict';
// Ver.6.3: consecutive play days, made independent of the order in which results arrive (a result can be received late after a B2 safe leave).
// Pure functions over a stats object; shared by recordMatch (index.html) and the Spark path (src/spark-stats-next.cjs).
// The other order-dependent records (legacy streak, official best streak, revenge) are the match log's: src/match-log-next.cjs.
// A play day is a SET of days (a day is only ever added), so a late result can never make a day streak wrong in the unsafe direction: no gate is needed.
const isObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const num = (x) => (typeof x === 'number' && Number.isFinite(x) ? x : null);

// ---- consecutive play days (shared by recordMatch and the Spark path) ---------------------------------------------------------
// stats.lastDay / dayStreak / maxDayStreak keep their meaning: dayStreak = the run of consecutive play days that ENDS at the newest play day (lastDay);
// maxDayStreak = the best run ever (never lowered). stats.dl = { d:{ 'YYYY-MM-DD': 1 observed | 2 restored }, pre } is the play-day history of the last
// 60 days (pre = how many consecutive days immediately before the oldest kept day were also played, so a streak longer than 60 days survives trimming).
// Legacy data is restored once from (lastDay, dayStreak): that run is exactly what the old rule counted, so nothing changes at the moment of migration.
// A late result adds its day and the runs are recomputed in date order, so a missed previous day fills the gap. A day older than the 60-day window is ignored.
const DAY_WINDOW = 60;
const canon = (d) => (typeof d === 'string' ? d.replace(/^(\d+)-(\d+)-(\d+)$/, (m, y, mo, da) => `${y}-${mo.padStart(2, '0')}-${da.padStart(2, '0')}`) : '');
const DAYMS = 86400000, ms = (d) => Date.parse(d + 'T00:00:00Z'), fmt = (t) => new Date(t).toISOString().slice(0, 10), addDays = (d, n) => fmt(ms(d) + n * DAYMS);
const validDay = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(ms(d));
function runsOf(dl) {   // [{start,end,len}] in date order, with `pre` added to the first run when it starts at the oldest kept day
  const days = Object.keys(dl.d).sort(), runs = [];
  for (const d of days) { const r = runs[runs.length - 1]; if (r && addDays(r.end, 1) === d) { r.end = d; r.len++; } else runs.push({ start: d, end: d, len: 1 }); }
  if (runs.length && dl.pre > 0) runs[0].len += dl.pre;
  return runs;
}
function dayStep(s, dayIn) {
  const day = canon(dayIn);
  if (!isObj(s) || !validDay(day)) return false;
  let dl = s.dl;
  if (!(isObj(dl) && isObj(dl.d) && num(dl.pre) !== null && Object.keys(dl.d).every(validDay))) {
    const last = canon(s.lastDay), n = Math.max(0, Math.floor(num(s.dayStreak) || 0)), d = {};
    if (validDay(last) && n > 0) { const keep = Math.min(n, DAY_WINDOW); for (let i = 0; i < keep; i++) d[addDays(last, -i)] = 2; dl = { d, pre: n - keep }; }
    else dl = { d: {}, pre: 0 };
  }
  const d = { ...dl.d }; let pre = dl.pre;
  const days = Object.keys(d).sort(), oldest = days[0], newestOld = days[days.length - 1];
  if (d[day]) return false;                                               // this day is already counted
  const newest = newestOld && newestOld > day ? newestOld : day;
  if (day < addDays(newest, -(DAY_WINDOW - 1))) return false;             // older than the window: cannot be placed
  if (oldest && day < oldest && pre > 0) return false;                    // the chain before the oldest day is already counted
  d[day] = 1;
  for (let ks = Object.keys(d).sort(); ks.length && ks[0] < addDays(newest, -(DAY_WINDOW - 1)); ks = Object.keys(d).sort()) {
    const e = ks[0]; delete d[e]; pre = ks[1] && ks[1] === addDays(e, 1) ? pre + 1 : 0;
  }
  const next = { d, pre }, runs = runsOf(next), lastRun = runs[runs.length - 1];
  s.dl = next; s.lastDay = lastRun.end; s.dayStreak = lastRun.len;
  s.maxDayStreak = Math.max(num(s.maxDayStreak) || 0, ...runs.map((r) => r.len));   // never lowered; a late day that joins two runs can raise it
  return true;
}
// "current" streak relative to today: the run counts only while today or yesterday was played (display / rules that ask about NOW)
function currentDayStreak(s, today) {
  const last = canon(s && s.lastDay), t = canon(today);
  if (!validDay(last) || !validDay(t)) return 0;
  return last === t || last === addDays(t, -1) ? (num(s.dayStreak) || 0) : 0;
}
module.exports = { DAY_WINDOW, dayStep, currentDayStreak, canon };
