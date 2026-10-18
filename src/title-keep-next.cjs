'use strict';
// Ver.6.0 A1: protection of already-held legacy titles.
//
// Legacy titles are not stored: BADGES recomputes them from `stats` counters on every render, and a counter never
// decreases, so "held" == "the legacy condition is true". Later steps (A2+) replace some legacy conditions with
// stricter, official ones. To keep every title a player already holds, the legacy result of the 8 titles whose
// condition will change is frozen ONCE into `stats.tk`, together with the legacy totals at that moment (`stats.tv2.base`).
//
//   stats.tk  = { v:1, at, ids:{ <id>:1, ... } }      ids is omitted when empty (RTDB drops empty objects)
//   stats.tv2 = { v:1, since, base:{ games, Aw, Bw } } later steps add fields beside these
//
// A1 only creates these records. It never changes how a title is earned or shown.

// Frozen copies of the legacy conditions (index.html BADGES, exact same expressions). Do NOT edit these when the live
// conditions change: they define what "already held" meant under Ver.5.25.
const LEGACY_TESTS = Object.freeze({
  handi: (st) => (st.handiWins || 0) >= 1,
  streak10: (st) => (st.maxStreak || 0) >= 10,
  streak30: (st) => (st.maxStreak || 0) >= 30,
  streak50: (st) => (st.maxStreak || 0) >= 50,
  mis7: (st) => (st.misDays || 0) >= 7,
  cancel500: (st) => (st.cancelTotal || 0) >= 500,
  cancel2000: (st) => (st.cancelTotal || 0) >= 2000,
  darkhorse: (st) => (st.darkHorse || 0) >= 1,
});
const KEEP_IDS = Object.freeze(Object.keys(LEGACY_TESTS));

const isObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const count = (x) => (typeof x === 'number' && Number.isFinite(x) && x >= 0 ? x : 0);
const isHeld = (v) => v === 1 || v === true;

// A usable tk: right version, and ids (when present) only holds known titles with a held marker.
// Anything else is ignored (never trusted, never used to take a title away) and is rebuilt from the legacy counters.
function validKeep(tk) {
  if (!isObj(tk) || tk.v !== 1) return false;
  if (tk.ids === undefined) return true;
  return isObj(tk.ids) && Object.keys(tk.ids).every((id) => KEEP_IDS.includes(id) && isHeld(tk.ids[id]));
}
const validBase = (b) => isObj(b) && ['games', 'Aw', 'Bw'].every((k) => typeof b[k] === 'number' && Number.isFinite(b[k]) && b[k] >= 0);
const validTv2 = (t) => isObj(t) && t.v === 1 && t.since !== undefined && validBase(t.base);

// Legacy ids that are true for these stats right now.
function legacyIds(stats) {
  const st = isObj(stats) ? stats : {};
  return KEEP_IDS.filter((id) => LEGACY_TESTS[id](st));
}
const keptIds = (stats) => (isObj(stats) && validKeep(stats.tk) ? Object.keys(stats.tk.ids || {}).filter((id) => isHeld(stats.tk.ids[id])) : []);
const isFrozen = (stats) => isObj(stats) && validKeep(stats.tk);

// Held == the legacy condition is true OR it was frozen into tk. In A1 this equals the legacy result (tk is a subset of
// what the counters already say), so nothing changes; later steps drop the live legacy term for new acquisitions only.
function held(stats, id) {
  if (!KEEP_IDS.includes(id)) return false;
  const st = isObj(stats) ? stats : {};
  return LEGACY_TESTS[id](st) || keptIds(st).includes(id);
}

// Call INSIDE a stats transaction, on the object the transaction received, BEFORE any counter is changed.
// Writes tk / tv2 only when they are missing or unusable; a valid record is never touched. Pure and synchronous, so a
// transaction retry simply runs it again on fresh data. `stamp` is the time to store (a server timestamp placeholder in
// production, a number in tests). Returns what was created.
function ensureKeep(s, stamp) {
  const out = { tk: false, tv2: false };
  if (!isObj(s)) return out;
  if (!validKeep(s.tk)) {
    const ids = {};
    for (const id of legacyIds(s)) ids[id] = 1;
    s.tk = Object.keys(ids).length ? { v: 1, at: stamp, ids } : { v: 1, at: stamp };
    out.tk = true;
  }
  const base = { games: count(s.games), Aw: count(isObj(s.A) ? s.A.w : 0), Bw: count(isObj(s.B) ? s.B.w : 0) };
  if (!validTv2(s.tv2)) {
    if (isObj(s.tv2) && s.tv2.v === 1) {
      // keep later-step fields; repair only what A1 owns
      if (s.tv2.since === undefined) s.tv2.since = stamp;
      if (!validBase(s.tv2.base)) s.tv2.base = base;
    } else {
      s.tv2 = { v: 1, since: stamp, base };
    }
    out.tv2 = true;
  }
  return out;
}

module.exports = { LEGACY_TESTS, KEEP_IDS, validKeep, validTv2, legacyIds, keptIds, isFrozen, held, ensureKeep };
