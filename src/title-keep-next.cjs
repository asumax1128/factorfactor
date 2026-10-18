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

// Ver.6.0 A6: darkhorse is no longer granted ("class rating rank 11 or lower when the tournament starts, then win").
// A tournament's own entrants are not the whole class, so the rank cannot be proven today. Holders keep the title through tk.
// Future (not implemented): a teacher-designated class roster supplies the roster rating order; the award then goes through
// a new, separately named counter. No code path writes such a counter yet.
const DARKHORSE_ROSTER_NOTE = 'reserved: teacher roster';

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

// A1b: freeze right after login, before the player has done anything that writes statistics.
// Reads the account's stats once; writes ONLY when the stats were read successfully, are not empty, and tk/tv2 are
// missing or unusable. Never treats "not loaded", an error, a null or an empty object as "no history": those never write.
// Returns { status, code? }:
//   'present' (nothing to do) | 'empty' (no stats yet: the first stats transaction freezes) | 'frozen'
//   'read-failed' | 'failed' (code names the cause; nothing was written, the next login retries)
// A transaction that starts from an empty cache is returned unchanged, so the server re-runs it with the real data.
const SAFE_CODE = /^[A-Za-z0-9_.:-]{1,40}$/;
const codeOf = (e) => { const c = e && (e.code || e.name); return typeof c === 'string' && SAFE_CODE.test(c) ? c : 'unknown'; };
async function freezeOnLogin({ db, key, stamp, timeoutMs = 15000 }) {
  if (!db || typeof key !== 'string' || !key) return { status: 'failed', code: 'bad-args' };
  const ref = db.ref(`games/factor/accounts/${key}/stats`);
  let value;
  try { value = (await ref.get()).val(); } catch (e) { return { status: 'read-failed', code: codeOf(e) }; }
  if (!isObj(value) || !Object.keys(value).length) return { status: 'empty' };
  if (validKeep(value.tk) && validTv2(value.tv2)) return { status: 'present' };
  let timer;
  try {
    const run = ref.transaction((s) => {
      if (!isObj(s) || !Object.keys(s).length) return s;
      ensureKeep(s, stamp);
      return s;
    });
    const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(Object.assign(new Error('timeout'), { code: 'timeout' })), timeoutMs); });
    const r = await Promise.race([run, timeout]);
    const after = r && r.committed && r.snapshot && typeof r.snapshot.val === 'function' ? r.snapshot.val() : null;
    if (!isObj(after)) return { status: 'failed', code: 'not-committed' };
    if (!(validKeep(after.tk) && validTv2(after.tv2))) return { status: 'failed', code: 'not-created' };
    return { status: 'frozen' };
  } catch (e) { return { status: 'failed', code: codeOf(e) }; } finally { clearTimeout(timer); }
}

module.exports = { DARKHORSE_ROSTER_NOTE, LEGACY_TESTS, KEEP_IDS, validKeep, validTv2, legacyIds, keptIds, isFrozen, held, ensureKeep, freezeOnLogin, codeOf };
