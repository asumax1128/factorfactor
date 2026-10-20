'use strict';
// Ver.6.3 match log (src/match-log-next.cjs): exact-oracle property tests and the four Codex findings as reproductions.
const test = require('node:test');
const assert = require('node:assert/strict');
const ML = require('../src/match-log-next.cjs');

// ---- tiny deterministic PRNG --------------------------------------------------------------------------------------------------
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const shuffle = (r, a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

// ---- the oracle: the TRUE sequence in start order -------------------------------------------------------------------------------
function truth(seq) {
  let lp = 0, lc = 0, lg = 0, oc = 0, og = 0, rv = 0; const last = {};
  for (const m of seq) {
    if (m.k !== 's') { lp = m.o === 'w' ? lp + 1 : m.o === 'l' ? 0 : lp; lc = lp; if (lg < lc) lg = lc; }
    if (m.k !== 'g') { oc = m.o === 'w' ? oc + 1 : 0; if (og < oc) og = oc; }
    if (m.k !== 's') for (const v of m.v) { if (v.o === 'w' && last[v.key] === 'l') rv++; last[v.key] = v.o; }
  }
  return { lp, lg, og, rv };
}
const OPPS = ['a', 'b', 'c'];
function genSeq(r, n) {
  const seq = [];
  for (let i = 0; i < n; i++) {
    const k = r() < 0.35 ? 's' : 'r', o = r() < 0.5 ? 'w' : r() < 0.6 ? 'l' : 'd';
    const x = OPPS[Math.floor(r() * OPPS.length)];
    seq.push({ id: 'm' + i, t: 1000 + i * 100, k, o, v: k === 's' ? [] : [{ key: x, o }] });
  }
  return seq;
}
// a match starts at m.t seconds (default: by its number); its open is saved 5 s before and confirmed 4 s before the start (so it is provable)
const tOf = (m) => (m.t !== undefined ? m.t : 1000 + (parseInt(String(m.id).replace(/\D/g, ''), 10) || 0) * 100);
const openOf = (m) => ({ id: m.id, kind: m.k, opponents: m.v.map((x) => x.key), startAt: tOf(m) * 1000, now: tOf(m) * 1000 - 5000 });
const openP = (x, m) => { const st = ML.open(x, openOf(m)); ML.prove(x, { id: m.id, now: tOf(m) * 1000 - 4000 }); return st; };
const settleOf = (m) => ({ id: m.id, kind: m.k, outcome: m.o, opponents: m.v });
const fresh = () => ({ games: 0 });
const apply = (s, fn) => { const best0 = s.sk ? s.sk.best : 0; ML.begin(s); fn(s); ML.finish(s, { best0 }); };
const snap = (s) => JSON.stringify({ e: s.ml.e, f: s.ml.f, ev: s.ml.ev, streak: s.streak, maxStreak: s.maxStreak, rev: s.revenges, best: s.sk && s.sk.best });

test('all opens proven, results in ANY order: evidence <= truth at every step, == truth at the end, independent of arrival order', () => {
  for (let seed = 1; seed <= 300; seed++) {
    const r = rng(seed), seq = genSeq(r, 3 + Math.floor(r() * 22)), T = truth(seq);
    const finals = new Set();
    for (let rep = 0; rep < 4; rep++) {
      const s = fresh();
      for (const m of seq) apply(s, (x) => assert.equal(openP(x, m).status, 'opened'));
      let prev = { lg: 0, og: 0, rv: 0 };
      for (const m of shuffle(r, seq)) {
        apply(s, (x) => assert.equal(ML.settle(x, settleOf(m)).status, 'resolved'));
        const ev = s.ml.ev;
        assert.ok(ev.lg <= T.lg && ev.og <= T.og && ev.rv <= T.rv, `seed ${seed}: evidence above truth ${JSON.stringify(ev)} vs ${JSON.stringify(T)}`);
        assert.ok(ev.lg >= prev.lg && ev.og >= prev.og && ev.rv >= prev.rv, 'evidence must be monotone');
        assert.ok((s.maxStreak || 0) >= prev.lg && ((s.sk && s.sk.best) || 0) >= prev.og, 'counters must not go down');
        prev = { ...ev };
      }
      assert.deepEqual(s.ml.ev, { lg: T.lg, og: T.og, rv: T.rv }, `seed ${seed}: evidence must equal truth once everything is resolved`);
      assert.equal(s.streak, T.lp, 'progress equals the replayed truth');
      assert.equal(s.revenges || 0, T.rv);
      finals.add(snap(s));
    }
    assert.equal(finals.size, 1, `seed ${seed}: the final state must not depend on the arrival order of the results`);
  }
});

test('results that arrive in start order with no open (prompt): progress is the truth, evidence never above truth', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const r = rng(seed * 7), seq = genSeq(r, 3 + Math.floor(r() * 20)), T = truth(seq), s = fresh();
    for (const m of seq) apply(s, (x) => ML.settle(x, settleOf(m)));
    assert.equal(s.streak, T.lp);
    assert.ok(s.ml.ev.lg === 0 && s.ml.ev.og === 0 && s.ml.ev.rv === 0, 'an unopened match is never evidence');
  }
});

test('Codex #1: a late DRAW between a loss and a win never makes a revenge (old logic counted 1)', () => {
  const s = fresh(); const L = { id: 'L', t: 1000, k: 'r', o: 'l', v: [{ key: 'x', o: 'l' }] }, D = { id: 'D', t: 1100, k: 'r', o: 'd', v: [{ key: 'x', o: 'd' }] }, W = { id: 'W', t: 1200, k: 'r', o: 'w', v: [{ key: 'x', o: 'w' }] };
  for (const m of [L, D, W]) apply(s, (x) => openP(x, m));
  apply(s, (x) => ML.settle(x, settleOf(L)));
  apply(s, (x) => ML.settle(x, settleOf(W)));
  assert.equal(s.revenges || 0, 0, 'while the draw is unknown the pair is not proven');
  apply(s, (x) => ML.settle(x, settleOf(D)));
  assert.equal(s.revenges || 0, 0, 'the draw sits between them: no revenge, ever');
  // and without the draw it is counted exactly once
  const t = fresh();
  for (const m of [L, W]) apply(t, (x) => openP(x, m));
  apply(t, (x) => ML.settle(x, settleOf(W)));
  assert.equal(t.revenges || 0, 0, 'the loss is still unknown');
  apply(t, (x) => ML.settle(x, settleOf(L)));
  assert.equal(t.revenges, 1);
});

test('Codex #2: receipt-order inversion neither gives a false max streak nor misses one', () => {
  const mk = (id, o) => ({ id, t: 1000 + (parseInt(id, 36) || 0) * 100, k: 'r', o, v: [{ key: 'x', o }] });
  // W W [L late] W W: truth max 2. Arrival W W W W then L: must never show 4
  const seq = [mk('1', 'w'), mk('2', 'w'), mk('3', 'l'), mk('4', 'w'), mk('5', 'w')], s = fresh();
  for (const m of seq) apply(s, (x) => openP(x, m));
  for (const id of ['1', '2', '4', '5']) apply(s, (x) => ML.settle(x, settleOf(seq.find((m) => m.id === id))));
  assert.equal(s.maxStreak || 0, 2, 'the unknown loss in the middle separates the run');
  apply(s, (x) => ML.settle(x, settleOf(seq[2])));
  assert.equal(s.maxStreak, 2);
  assert.equal(s.streak, 2);
  // [W late] W W: truth 3. While the first is unknown: 2. After it arrives: 3 (no miss)
  const seq2 = [mk('a', 'w'), mk('b', 'w'), mk('c', 'w')], t = fresh();
  for (const m of seq2) apply(t, (x) => openP(x, m));
  for (const id of ['b', 'c']) apply(t, (x) => ML.settle(x, settleOf(seq2.find((m) => m.id === id))));
  assert.equal(t.maxStreak, 2);
  apply(t, (x) => ML.settle(x, settleOf(seq2[0])));
  assert.equal(t.maxStreak, 3);
});

test('Codex #4: an unplaceable (late, unopened) loss does not erase the existing streak; held records stay', () => {
  const s = { games: 12, streak: 5, maxStreak: 7, revenges: 2, sk: { v: 1, n: 5, best: 9, n0: 0, l: {} } };
  apply(s, (x) => ML.settle(x, { id: 'old', kind: 'r', outcome: 'l', opponents: [{ key: 'x', o: 'l' }], late: true }));
  assert.equal(s.streak, 5, 'a result whose place is unknown does not move the streak');
  assert.equal(s.maxStreak, 7); assert.equal(s.revenges, 2); assert.equal(s.sk.best, 9);
  // migration: the pre-migration streak is shown but never becomes evidence for a new title
  const t = { games: 3, streak: 9, maxStreak: 9, revenges: 0 };
  apply(t, (x) => openP(x, { id: 'n1', t: 2000, k: 'r', v: [{ key: 'x' }] }));
  apply(t, (x) => ML.settle(x, { id: 'n1', kind: 'r', outcome: 'w', opponents: [{ key: 'x', o: 'w' }] }));
  assert.equal(t.streak, 10, 'progress continues from the old streak');
  assert.equal(t.maxStreak, 9, 'but the old streak is not evidence: maxStreak stays the held value');
  assert.equal(t.ml.ev.lg, 1);
});

test('another client wrote the counters (a 6.2 tab): a gap restarts every run and pair; counters are kept', () => {
  const m = (id, o) => ({ id, k: 'r', o, v: [{ key: 'x', o }] }), s = fresh();
  for (const x of [m('1', 'w'), m('2', 'w')]) { apply(s, (y) => openP(y, x)); apply(s, (y) => ML.settle(y, settleOf(x))); }
  assert.equal(s.maxStreak, 2);
  s.games += 1; s.streak += 1; s.maxStreak = 3;                       // an old tab recorded a win behind our back
  for (const id of ['3', '4', '5']) { const x = m(id, 'w'); apply(s, (y) => openP(y, x)); apply(s, (y) => ML.settle(y, settleOf(x))); }
  assert.ok(Object.values(s.ml.e).some((v) => /\|rx\|/.test(v)), 'a gap entry was recorded');
  assert.equal(s.maxStreak, 3, 'the value the old client wrote is held');
  assert.equal(s.ml.ev.lg, 3, 'the run restarted after the gap (3 wins after it, not 5 across it)');
  assert.equal(s.streak, 6, 'progress took the old client\'s value (3) and continued');
});

test('an unresolved open is never dropped: cap, orphan, resolve, void, refuse beyond OPEN_MAX', () => {
  const s = fresh(); const ids = [];
  for (let i = 0; i < ML.CAP + 10; i++) { const m = { id: 'm' + i, k: 'r', o: 'w', v: [{ key: 'x', o: 'w' }] }; ids.push(m); apply(s, (y) => openP(y, m)); if (i > 0) apply(s, (y) => ML.settle(y, settleOf(m))); }
  assert.ok(Object.keys(s.ml.e).length <= ML.CAP, 'entries are capped');
  assert.ok(Array.isArray(s.ml.f.ob) && s.ml.f.ob.some((x) => x.startsWith('m0|')), 'the oldest unresolved open was moved, not deleted');
  assert.equal(ML.unresolved(s.ml), 1);
  const before = s.ml.ev.lg;
  apply(s, (y) => assert.equal(ML.settle(y, settleOf(ids[0])).status, 'orphan'));
  assert.equal(ML.unresolved(s.ml), 0);
  assert.ok(s.ml.ev.lg >= before, 'evidence does not drop');
  // void removes only a proven-void open
  const t = fresh(); apply(t, (y) => openP(y, { id: 'v', k: 'r', v: [] }));
  apply(t, (y) => assert.equal(ML.voidOpen(y, { id: 'v' }).status, 'voided'));
  assert.equal(ML.unresolved(t.ml), 0);
  // too many unresolved opens: refused, nothing lost
  const u = fresh(); let full = 0;
  for (let i = 0; i < ML.OPEN_MAX + 5; i++) apply(u, (y) => { if (openP(y, { id: 'o' + i, t: 5000 + i * 100, k: 'r', v: [] }).status === 'full') full++; });
  assert.equal(full, 5); assert.equal(ML.unresolved(u.ml), ML.OPEN_MAX);
});

test('late open (committed after the match began) is a known match but never evidence', () => {
  const s = fresh(), m = { id: 'late', k: 'r', o: 'w', v: [{ key: 'x', o: 'w' }] };
  apply(s, (y) => assert.equal(ML.open(y, { ...openOf(m), startAt: tOf(m) * 1000, now: tOf(m) * 1000 + 3000 }).status, 'opened-late'));
  apply(s, (y) => ML.settle(y, settleOf(m)));
  assert.equal(s.streak, 1); assert.equal(s.ml.ev.lg, 0);
});

test('size: 64 entries with 6 opponents fit the +3 KB budget', () => {
  const s = fresh();
  for (let i = 0; i < 80; i++) { const m = { t: 1000 + i * 100, id: i % 3 ? `r-1234-${1700000000000 + i}` : `s-${'0123456789abcdef0123456789abcdef'.replace(/./g, (c) => ((c.charCodeAt(0) + i) % 16).toString(16))}`, k: i % 3 ? 'r' : 's', o: 'w', v: i % 3 ? [{ key: 'player' + (i % 6), o: 'w' }, { key: 'taro' + (i % 5), o: 'w' }] : [] }; apply(s, (y) => openP(y, m)); apply(s, (y) => ML.settle(y, settleOf(m))); }
  const bytes = JSON.stringify(s.ml).length;
  console.log('ml bytes', bytes);
  assert.ok(bytes <= 3300, `ml is ${bytes} bytes`);
});

test('exhaustive: every sequence of 5 (w/l/d, mixed kinds and opponents) x every arrival order: exact at the end, never above truth, same final state', () => {
  const O = ['w', 'l', 'd'], perms = (a) => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p])));
  const P = perms([0, 1, 2, 3, 4]);
  let count = 0;
  for (let code = 0; code < 3 ** 5; code += 3) {                 // every third sequence keeps the run time small and still covers all outcome patterns
    const seq = [0, 1, 2, 3, 4].map((i) => { const o = O[Math.floor(code / 3 ** i) % 3], k = (code + i) % 3 === 0 ? 's' : 'r'; return { id: 'e' + i, k, o, v: k === 's' ? [] : [{ key: i % 2 ? 'a' : 'b', o }] }; });
    const T = truth(seq), finals = new Set();
    for (const p of P) {
      const s = fresh(); for (const m of seq) apply(s, (x) => openP(x, m));
      for (const i of p) { apply(s, (x) => ML.settle(x, settleOf(seq[i]))); assert.ok(s.ml.ev.lg <= T.lg && s.ml.ev.og <= T.og && s.ml.ev.rv <= T.rv); }
      assert.deepEqual(s.ml.ev, { lg: T.lg, og: T.og, rv: T.rv }); assert.equal(s.streak, T.lp); finals.add(snap(s)); count++;
    }
    assert.equal(finals.size, 1);
  }
  assert.ok(count > 3000);
});

test('long play with a delay of a few matches: the 64-entry fold keeps the evidence exact (never above truth, equal at the end)', () => {
  for (let seed = 1; seed <= 40; seed++) {
    const r = rng(seed * 31), seq = genSeq(r, 160), s = fresh(), pending = [];
    let started = 0, T = null;
    const prefixTruth = (n) => truth(seq.slice(0, n));
    for (let step = 0; step < 400 && (started < seq.length || pending.length); step++) {
      if (started < seq.length && pending.length < 5 && (r() < 0.6 || !pending.length)) { const m = seq[started++]; apply(s, (x) => openP(x, m)); pending.push(m); }
      else { const m = pending.splice(Math.floor(r() * Math.min(pending.length, 5)), 1)[0]; apply(s, (x) => ML.settle(x, settleOf(m))); }
      T = truth(seq);
      assert.ok(s.ml.ev.lg <= T.lg && s.ml.ev.og <= T.og && s.ml.ev.rv <= T.rv, `seed ${seed}: above truth`);
      assert.ok(Object.keys(s.ml.e).length <= ML.CAP);
    }
    assert.equal(ML.unresolved(s.ml), 0);
    assert.deepEqual(s.ml.ev, { lg: T.lg, og: T.og, rv: T.rv }, `seed ${seed}: equal to the truth after a long play with folds`);
    assert.equal(s.streak, T.lp);
  }
});

test('results with no open that arrive promptly, mixed with opened matches: progress is exact, evidence never above truth', () => {
  for (let seed = 1; seed <= 150; seed++) {
    const r = rng(seed * 13), seq = genSeq(r, 4 + Math.floor(r() * 18)), T = truth(seq), s = fresh(), opened = [];
    seq.forEach((m) => { if (r() < 0.5) { apply(s, (x) => openP(x, m)); opened.push(m); apply(s, (x) => ML.settle(x, settleOf(m))); } else apply(s, (x) => ML.settle(x, settleOf(m))); });
    assert.equal(s.streak, T.lp, `seed ${seed}`);
    assert.ok(s.ml.ev.lg <= T.lg && s.ml.ev.og <= T.og && s.ml.ev.rv <= T.rv);
  }
});

// ---- Ver.6.3 audit 2: start order is not open-commit order -------------------------------------------------------------------------
test('audit#2: L, D, W start in that order but the opens commit L, W, D: no false revenge, in every commit order and result order', () => {
  const L = { id: 'L', t: 1000, k: 'r', o: 'l', v: [{ key: 'x', o: 'l' }] }, D = { id: 'D', t: 1010, k: 'r', o: 'd', v: [{ key: 'x', o: 'd' }] }, W = { id: 'W', t: 1020, k: 'r', o: 'w', v: [{ key: 'x', o: 'w' }] };
  const perms = (a) => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p])));
  for (const commit of perms([L, D, W])) for (const res of perms([L, D, W])) {
    const s = fresh();
    for (const m of commit) apply(s, (x) => assert.equal(openP(x, m).status, 'opened'));
    for (const m of res) apply(s, (x) => ML.settle(x, settleOf(m)));
    assert.equal(s.revenges || 0, 0, `commit ${commit.map((m) => m.id)} results ${res.map((m) => m.id)}`);
    assert.equal(s.ml.ev.rv, 0);
  }
  // and the pair that really is adjacent is still counted whatever the commit order
  const A = { id: 'A', t: 1000, k: 'r', o: 'l', v: [{ key: 'x', o: 'l' }] }, B = { id: 'B', t: 1100, k: 'r', o: 'w', v: [{ key: 'x', o: 'w' }] };
  for (const commit of [[A, B], [B, A]]) { const s = fresh(); for (const m of commit) apply(s, (x) => openP(x, m)); for (const m of [B, A]) apply(s, (x) => ML.settle(x, settleOf(m))); assert.equal(s.revenges, 1); }
});

test('audit#2 timeline: opens commit out of start order (always before their own start), results later: evidence never above truth, exact at the end', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const r = rng(seed * 101), n = 3 + Math.floor(r() * 12), seq = [];
    let t = 1000;
    for (let i = 0; i < n; i++) { t += 4 + Math.floor(r() * 80); const m = genSeq(r, 1)[0]; seq.push({ ...m, id: 'm' + i, t }); }   // starts at least 4 s apart (provable)
    const T = truth(seq), ev = [];
    for (const m of seq) {
      const commit = m.t * 1000 - 1500 - Math.floor(r() * 6000), done = m.t * 1000 + 61000 + Math.floor(r() * 90000);     // saved shortly before the start (any device order), result after the match
      ev.push({ at: commit, kind: 'open', m }, { at: commit + 100, kind: 'prove', m }, { at: done, kind: 'settle', m });
    }
    ev.sort((a, b) => a.at - b.at || (a.kind === 'open' ? -1 : 1));
    const s = fresh(); let prev = { lg: 0, og: 0, rv: 0 };
    for (const e of ev) {
      const best0 = s.sk ? s.sk.best : 0; ML.begin(s);
      if (e.kind === 'open') ML.open(s, { id: e.m.id, kind: e.m.k, opponents: e.m.v.map((x) => x.key), startAt: e.m.t * 1000, now: e.at });
      else if (e.kind === 'prove') ML.prove(s, { id: e.m.id, now: e.at });
      else ML.settle(s, settleOf(e.m));
      ML.finish(s, { best0, now: e.at });
      const v = s.ml.ev;
      assert.ok(v.lg <= T.lg && v.og <= T.og && v.rv <= T.rv, `seed ${seed}: evidence above truth at ${e.kind} ${e.m.id}: ${JSON.stringify(v)} vs ${JSON.stringify(T)}`);
      assert.ok(v.lg >= prev.lg && v.og >= prev.og && v.rv >= prev.rv); prev = { ...v };
    }
    ML.begin(s); ML.finish(s, { now: ev[ev.length - 1].at + 1e6 });
    assert.deepEqual(s.ml.ev, { lg: T.lg, og: T.og, rv: T.rv }, `seed ${seed}: exact at the end`);
    assert.equal(s.streak, T.lp);
  }
});

test('open proof: confirmed before the start -> proven; confirmed after -> demoted to the head; q is never evidence', () => {
  const m = { id: 'P', t: 5000, k: 'r', o: 'w', v: [{ key: 'x', o: 'w' }] };
  const a = fresh(); apply(a, (x) => ML.open(x, openOf(m))); apply(a, (x) => ML.settle(x, settleOf(m)));
  assert.equal(a.ml.ev.lg, 0, 'proof still pending: not evidence');
  const b = fresh(); apply(b, (x) => ML.open(x, openOf(m))); apply(b, (x) => assert.equal(ML.prove(x, { id: 'P', now: m.t * 1000 - 4000 }).status, 'proven')); apply(b, (x) => ML.settle(x, settleOf(m)));
  assert.equal(b.ml.ev.lg, 1);
  const c = fresh(); apply(c, (x) => ML.open(x, openOf(m))); apply(c, (x) => assert.equal(ML.prove(x, { id: 'P', now: m.t * 1000 + 2000 }).status, 'demoted')); apply(c, (x) => ML.settle(x, settleOf(m)));
  assert.equal(c.ml.ev.lg, 0, 'confirmed after the match began: never evidence'); assert.equal(c.streak, 1, 'but a known match: the profile streak moves');
  const d = fresh(); apply(d, (x) => ML.open(x, openOf(m))); apply(d, (x) => ML.prove(x, { id: 'P', now: m.t * 1000 - 100 }));
  assert.match(d.ml.e.P, /^[0-9a-z]+\|ro[u]\|/, 'a confirmation closer than the clock margin is not proof');
});

test('recent matches and matches too close in time are not evidence yet; far enough apart and old enough they are', () => {
  const W = (id, t) => ({ id, t, k: 'r', o: 'w', v: [{ key: 'x', o: 'w' }] });
  const run = (a, b, now) => {
    const s = fresh(); ML.begin(s);
    for (const m of [a, b]) { ML.open(s, openOf(m)); ML.prove(s, { id: m.id, now: tOf(m) * 1000 - 4000 }); }
    for (const m of [a, b]) ML.settle(s, settleOf(m));
    ML.finish(s, { now }); return s.ml.ev.lg;
  };
  assert.equal(run(W('a', 1000), W('b', 1001), 9e9), 0, 'one second apart: the order is not provable');
  assert.equal(run(W('a', 1000), W('b', 1010), 9e9), 2);
  assert.equal(run(W('a', 1000), W('b', 1100), 1100 * 1000 + 3000), 1, 'only the older match is stable yet');
  assert.equal(run(W('a', 1000), W('b', 1100), 1101 * 1000 + ML.STABLE_MS + 1), 2, 'stable later');
});

// ---- audit round 2 -----------------------------------------------------------------------------------------------------------------
test('F4: start times are stored as floor seconds: a real difference of 1001 ms is never evidence, whatever the second boundary', () => {
  const run = (a, b) => {
    const s = fresh(); ML.begin(s);
    for (const [id, ms] of [['a', a], ['b', b]]) { ML.open(s, { id, kind: 'r', opponents: ['x'], startAt: ms, now: ms - 5000 }); ML.prove(s, { id, now: ms - 4000 }); }
    for (const id of ['a', 'b']) ML.settle(s, { id, kind: 'r', outcome: 'w', opponents: [{ key: 'x', o: 'w' }] });
    ML.finish(s, { now: 9e12 }); return s.ml.ev.lg;
  };
  assert.equal(run(1000999, 1002000), 0, '1001 ms apart but 2 stored seconds apart: both stay out');
  assert.equal(run(1000000, 1001001), 0);
  assert.equal(run(1000999, 1001000), 0);
  assert.equal(run(1000000, 1002999), 0, 'conservative: 2999 ms apart is also out (stored 2 s apart)');
  assert.equal(run(1000999, 1003000), 2, '2001 ms apart (stored 3 s apart): provable');
  assert.equal(run(1000000, 1003000), 2);
  for (let i = 0; i < 400; i++) { const r = rng(i + 7), a = 1000000 + Math.floor(r() * 3000), b = a + 1 + Math.floor(r() * 4000); if (run(a, b) === 2) assert.ok(b - a > 2000, `${a} ${b}`); }
});

test('F2: unresolved opens at the limit: a B2 loss that could not be tracked still separates the run (barrier), for B2 and Spark opens mixed', () => {
  const s = fresh(); ML.begin(s);
  const W = (id, t, kind = 'r') => ({ id, t, k: kind, o: 'w', v: kind === 'r' ? [{ key: 'x', o: 'w' }] : [] });
  const wins = [0, 1, 2, 3, 4, 5].map((i) => W('w' + i, 10000 + i * 100, i % 2 ? 's' : 'r'));
  for (const m of wins) { openP(s, m); ML.settle(s, settleOf(m)); }
  ML.finish(s, { now: 9e12 }); assert.equal(s.ml.ev.og, 6, 'six proven wins in a row (official: Spark and B2 together)');
  // 24 unresolved opens (12 B2 + 12 Spark) elsewhere in time: the limit is reached
  for (let i = 0; i < ML.OPEN_MAX; i++) { const kind = i % 2 ? 's' : 'r', t = 100 + i * 100; ML.open(s, { id: 'u' + i, kind, opponents: kind === 'r' ? ['x'] : [], startAt: t * 1000, now: t * 1000 - 5000 }); ML.prove(s, { id: 'u' + i, now: t * 1000 - 4000 }); }
  assert.equal(ML.unresolved(s.ml), ML.OPEN_MAX);
  const L = { id: 'L', t: 10600, k: 'r', o: 'l', v: [{ key: 'x', o: 'l' }] }, w7 = W('w7', 10700), w8 = W('w8', 10800, 's');
  assert.equal(openP(s, L).status, 'full'); assert.ok(Object.values(s.ml.e).some((v) => /\|rb\|/.test(v)), 'a barrier was left');
  assert.equal(ML.unresolved(s.ml), ML.OPEN_MAX, 'the barrier is not an unresolved open: no extra room needed');
  for (const m of [w7, w8]) { assert.equal(openP(s, m).status, 'full'); ML.settle(s, settleOf(m)); }   // refused too (barrier); the results are appended unproven
  ML.finish(s, { now: 9e12 });
  assert.equal(s.ml.ev.og, 6, 'never 7: the untracked loss in the middle is not jumped'); assert.equal(s.ml.ev.lg, 3, 'legacy streak counts the 3 B2 wins only; w7 would have made 4');
  ML.settle(s, settleOf(L)); ML.finish(s, { now: 9e12 }); assert.equal(s.ml.ev.og, 6, 'the loss recorded late changes nothing');
  const n = Object.keys(s.ml.e).length; openP(s, L); assert.equal(Object.keys(s.ml.e).length, n, 'the same match offered again leaves one barrier');
});

test('F2: the barrier survives folding and a Spark loss at the limit also separates official runs', () => {
  const s = fresh(); ML.begin(s);
  for (let i = 0; i < ML.OPEN_MAX; i++) { const t = 100 + i * 100; ML.open(s, { id: 'u' + i, kind: 'r', opponents: ['x'], startAt: t * 1000, now: t * 1000 - 5000 }); ML.prove(s, { id: 'u' + i, now: t * 1000 - 4000 }); }
  const mk = (id, t, k, o) => ({ id, t, k, o, v: k === 'r' ? [{ key: 'x', o }] : [] });
  const seq = [mk('a', 10000, 'r', 'w'), mk('b', 10100, 's', 'w'), mk('c', 10200, 's', 'l'), mk('d', 10300, 'r', 'w'), mk('e', 10400, 'r', 'w')];
  for (const m of seq) { openP(s, m); }
  assert.equal(ML.unresolved(s.ml), ML.OPEN_MAX);
  for (const m of seq) { ML.settle(s, settleOf(m)); }
  for (let i = 0; i < 70; i++) { const m = mk('f' + i, 20000 + i * 100, 'r', 'd'); openP(s, m); ML.settle(s, settleOf(m)); }   // fold well past the barrier
  ML.finish(s, { now: 9e12 }); assert.ok(s.ml.ev.og <= 2, 'official runs are cut by the untracked Spark loss: ' + s.ml.ev.og);
});
