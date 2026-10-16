// GENERATED from main index.html; do not edit. Server-only.
function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a || 1;
}
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randSign() { return Math.random() < 0.5 ? 1 : -1; }
function randNonZero(min, max) { let v = 0; while (v === 0) v = randInt(min, max); return v; }
function factorKey(f) {
  if (f.type === 'linear') return `L${f.a}_${f.b}`;
  if (f.type === 'quadratic') return `Q${f.A}_${f.B}_${f.C}`;
  return `C${f.k}`;
}
function toCoeffs(f) {
  if (f.type === 'linear') return [f.a, f.b];
  if (f.type === 'quadratic') return [f.A, f.B, f.C];
  return [f.k];
}
function multiply(f1, f2) {
  const c1 = toCoeffs(f1);
  const c2 = toCoeffs(f2);
  const raw = new Array(c1.length + c2.length - 1).fill(0);
  for (let i = 0; i < c1.length; i++) {
    for (let j = 0; j < c2.length; j++) raw[i + j] += c1[i] * c2[j];
  }
  // raw は次数の高い順。x4〜x0 の5項に正規化する(最大で2次×2次=4次まで対応)。
  const padded = [0, 0, 0, 0, 0];
  for (let i = 0; i < raw.length; i++) {
    const degree = raw.length - 1 - i;
    if (degree <= 4) padded[4 - degree] = raw[i];
  }
  return { x4: padded[0], x3: padded[1], x2: padded[2], x1: padded[3], x0: padded[4] };
}
function polyEqual(p1, p2) {
  return p1.x4 === p2.x4 && p1.x3 === p2.x3 && p1.x2 === p2.x2 && p1.x1 === p2.x1 && p1.x0 === p2.x0;
}
function coprime(a, b) { return gcd(Math.abs(a), Math.abs(b)) === 1; }
function genL1() {
  let b, c;
  do {
    b = randInt(1, 9);
    c = randInt(1, 9);
  } while (!coprime(b, c));
  const a = randInt(2, 9);          // a ≠ 1
  const sign = randSign();          // ± の2通り
  const f1 = { type: 'const', k: a };
  const f2 = { type: 'linear', a: b, b: sign * c };
  return { factors: [f1, f2], poly: multiply(f1, f2) };
}
function genL2() {
  let b, c;
  do {
    b = randInt(1, 9);
    c = randInt(1, 9);
  } while (!coprime(b, c));
  const a = randInt(1, 9);          // a = 1 も許容
  const sign = randSign();
  const f1 = { type: 'linear', a, b: 0 };            // ax
  const f2 = { type: 'linear', a: b, b: sign * c };  // bx ± c
  return { factors: [f1, f2], poly: multiply(f1, f2) };
}
function genL3() {
  let a, b;
  do {
    a = randNonZero(-9, 9);
    b = randNonZero(-9, 9);
  } while (a === -b);
  const f1 = { type: 'linear', a: 1, b: a };
  const f2 = { type: 'linear', a: 1, b };
  return { factors: [f1, f2], poly: multiply(f1, f2) };
}
function genL4() {
  let a, b;
  do {
    a = randInt(1, 9);
    b = randInt(1, 9);
  } while (!coprime(a, b));
  const f1 = { type: 'linear', a, b };
  const f2 = { type: 'linear', a, b: -b };
  return { factors: [f1, f2], poly: multiply(f1, f2) };
}
function genL5() {
  let c, b, d;
  do {
    c = randInt(2, 9);
    b = randNonZero(-5, 5);
    d = randNonZero(-5, 5);
  } while (!coprime(c, d));
  const f1 = { type: 'linear', a: 1, b };
  const f2 = { type: 'linear', a: c, b: d };
  return { factors: [f1, f2], poly: multiply(f1, f2) };
}
function genL6() {
  let c, b, d;
  do {
    c = randInt(2, 9);
    b = randNonZero(-9, 9);
    d = randNonZero(-9, 9);
  } while (!coprime(c, d) || !(Math.abs(b) >= 6 || Math.abs(d) >= 6));
  const f1 = { type: 'linear', a: 1, b };
  const f2 = { type: 'linear', a: c, b: d };
  return { factors: [f1, f2], poly: multiply(f1, f2) };
}
function genL7() {
  let a, b;
  do {
    a = randInt(1, 5);
    b = randInt(1, 5);
  } while (!coprime(a, b));
  const isSum = Math.random() < 0.5;        // + なら和、- なら差
  const s = isSum ? 1 : -1;
  const linear = { type: 'linear', a, b: s * b };                       // ax ± b
  const quad = { type: 'quadratic', A: a * a, B: -s * a * b, C: b * b }; // a²x² ∓ abx + b²
  return { factors: [linear, quad], poly: multiply(linear, quad) };
}
function genL8() {
  let a, c, b, d;
  do {
    a = randInt(2, 4);
    c = randInt(2, 4);
    b = randNonZero(-4, 4);
    d = randNonZero(-4, 4);
  } while (!coprime(a, b) || !coprime(c, d) || !(a < c || (a === c && b <= d)));
  const f1 = { type: 'linear', a, b };
  const f2 = { type: 'linear', a: c, b: d };
  return { factors: [f1, f2], poly: multiply(f1, f2) };
}
function genL9() {
  let a, c, b, d;
  do {
    a = randInt(2, 9);
    c = randInt(2, 9);
    b = randNonZero(-9, 9);
    d = randNonZero(-9, 9);
  } while (
    !coprime(a, b) || !coprime(c, d) ||
    !(a < c || (a === c && b <= d)) ||
    !(a >= 5 || c >= 5 || Math.abs(b) >= 5 || Math.abs(d) >= 5)
  );
  const f1 = { type: 'linear', a, b };
  const f2 = { type: 'linear', a: c, b: d };
  return { factors: [f1, f2], poly: multiply(f1, f2) };
}
let GENERATORS = { 1: genL1, 2: genL2, 3: genL3, 4: genL4, 5: genL5, 6: genL6, 7: genL7, 8: genL8, 9: genL9 };
let LEVEL_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
let LEVEL_POINTS = { 1: 10, 2: 12, 3: 14, 4: 16, 5: 18, 6: 20, 7: 30, 8: 40, 9: 50 };
let FIXED_PHASE_LAST_Q = 27;
let RANDOM_PHASE_FIRST_Q = 28;
let INITIAL_WEIGHTS = { 1: 8, 2: 8, 3: 8, 4: 8, 5: 10, 6: 10, 7: 12, 8: 16, 9: 20 };
let WEIGHT_DELTA = { 1: -1, 2: -1, 3: -1, 4: -1, 5: +2, 6: +2, 7: -2, 8: +2 };
let FINAL_STEP = 6;
let FINAL_FIXED_WEIGHTS = { 1: 2, 2: 2, 3: 2, 4: 2, 5: 22, 6: 22, 7: 2, 8: 30, 9: 16 };
function getLevelWeights(questionNumber) {
  const steps = Math.max(0, Math.floor((questionNumber - RANDOM_PHASE_FIRST_Q) / 3));

  if (steps >= FINAL_STEP) return { ...FINAL_FIXED_WEIGHTS };

  const w = {};
  [1, 2, 3, 4].forEach(lv => { w[lv] = Math.max(0, INITIAL_WEIGHTS[lv] + WEIGHT_DELTA[lv] * steps); });
  w[5] = INITIAL_WEIGHTS[5] + WEIGHT_DELTA[5] * steps;
  w[6] = INITIAL_WEIGHTS[6] + WEIGHT_DELTA[6] * steps;
  w[7] = Math.max(0, INITIAL_WEIGHTS[7] + WEIGHT_DELTA[7] * steps);
  w[8] = INITIAL_WEIGHTS[8] + WEIGHT_DELTA[8] * steps;

  // Lv.9は「他の8レベルを引いた残り全部」を引き受ける(常に合計100%になる)
  const usedSum = [1, 2, 3, 4, 5, 6, 7, 8].reduce((s, lv) => s + w[lv], 0);
  w[9] = Math.max(0, 100 - usedSum);
  return w;
}
function pickLevelForQuestion(questionNumber) {
  if (questionNumber <= FIXED_PHASE_LAST_Q) {
    // 1〜3問目=Lv.1、4〜6問目=Lv.2 … 25〜27問目=Lv.9
    return Math.min(9, Math.floor((questionNumber - 1) / 3) + 1);
  }
  const w = getLevelWeights(questionNumber);
  let r = Math.random() * 100;
  for (const lv of LEVEL_IDS) {
    if (r < w[lv]) return lv;
    r -= w[lv];
  }
  return 9; // 丸め誤差対策のフォールバック
}
let DIFFICULTY_CONFIG = {
  easy: { label: 'イージー', clearCount: 15, color: '#52B788', tileCount: 6 },
  normal: { label: 'ノーマル', clearCount: 30, color: '#E8A33D', tileCount: 9 },
  hard: { label: 'ハード', clearCount: 50, color: '#E76F51', tileCount: 9 },
};
function flipSign(f) {
  if (f.type === 'const') return { type: 'const', k: -f.k };
  // quadratic は中央の項(±nx)の符号を間違えるのが典型的なミスなのでそこを反転する
  if (f.type === 'quadratic') return { type: 'quadratic', A: f.A, B: -f.B, C: f.C };
  return { type: 'linear', a: f.a, b: -f.b };
}
function shiftConst(f) {
  const d = randSign();
  if (f.type === 'const') return { type: 'const', k: f.k + d };
  if (f.type === 'quadratic') return { type: 'quadratic', A: f.A, B: f.B, C: f.C + d };
  return { type: 'linear', a: f.a, b: f.b + d };
}
function foreignFactor(level) {
  const { factors } = GENERATORS[level]();
  return factors[randInt(0, 1)];
}
function genDummies(level, correctFactors) {
  const dummies = [];
  const pushUnique = (f) => {
    const key = factorKey(f);
    if (!correctFactors.some(cf => factorKey(cf) === key) && !dummies.some(d => factorKey(d) === key)) {
      dummies.push(f);
    }
  };
  for (let i = 0; i < randInt(1, 2); i++) pushUnique(flipSign(correctFactors[randInt(0, 1)]));
  for (let i = 0; i < randInt(1, 2); i++) pushUnique(shiftConst(correctFactors[randInt(0, 1)]));
  for (let i = 0; i < randInt(1, 2); i++) pushUnique(foreignFactor(level));
  // 盤面のマス数は有限なので、ダミーが多すぎないよう上限を設ける(最終的な枚数はbuildBoard側でtileCountに切り詰める)
  return dummies.slice(0, 5);
}
function buildBoard(level, seenSet, tileCount = 9) {
  let factors, poly, sig;
  let outerAttempt = 0;
  do {
    ({ factors, poly } = GENERATORS[level]());
    sig = `${level}:${poly.x4},${poly.x3},${poly.x2},${poly.x1},${poly.x0}`;
    outerAttempt++;
  } while (seenSet && seenSet.has(sig) && outerAttempt < 60);
  if (seenSet) seenSet.add(sig);

  let tiles = [];
  let attempt = 0;
  while (true) {
    attempt++;
    const dummies = genDummies(level, factors);
    let pool = [...factors, ...dummies];
    let guard = 0;
    while (pool.length < tileCount && guard < 200) {
      guard++;
      const f = foreignFactor(level);
      const key = factorKey(f);
      if (!pool.some(p => factorKey(p) === key)) pool.push(f);
    }
    // 正解ペア2枚は pool の先頭にあるので、slice しても必ず盤面に残る
    pool = pool.slice(0, tileCount);
    tiles = pool.map((f, idx) => ({ id: `${Date.now()}_${idx}_${Math.random().toString(36).slice(2)}`, factor: f }));
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
    let matchCount = 0;
    for (let i = 0; i < tiles.length && matchCount <= 1; i++) {
      for (let j = i + 1; j < tiles.length; j++) {
        if (polyEqual(multiply(tiles[i].factor, tiles[j].factor), poly)) {
          matchCount++;
          if (matchCount > 1) break;
        }
      }
    }
    if (matchCount === 1) break;
    if (attempt > 40) break;
  }
  return { tiles, poly, factors };
}
let QUESTION_TIMEOUT_MS = 20000;
let JUDGE_TIERS = [
  { max: 2000, label: 'Perfect', recover: 25, color: '#FFD54A' },
  { max: 3000, label: 'Excellent', recover: 20, color: '#8BE38F' },
  { max: 5000, label: 'Great', recover: 15, color: '#6BD4E8' },
  { max: 10000, label: 'Good', recover: 10, color: '#8FB8FF' },
  { max: 15000, label: 'OK', recover: 5, color: '#C9C9C9' },
  { max: 20000, label: 'Fair', recover: 2, color: '#FF9F1C' },
];
let JUDGE_BAD = { label: 'Bad', recover: 0, color: '#FF5C5C' };
function getJudgment(elapsedMs) {
  for (const tier of JUDGE_TIERS) {
    if (elapsedMs <= tier.max) return tier;
  }
  return JUDGE_BAD; // 20秒超は本来タイムアップ処理に回るのでここには来ない想定の保険
}
let DIFFICULTY_MISS_PENALTY = { easy: 20, normal: 25, hard: 30 };
let DIFFICULTY_TIMEOUT_EXTRA = { easy: 0, normal: 5, hard: 10 };
let B_LAND_DELAY = 3000;
let B_FORCE_LAND = 7000;
let OJAMA_UNIT = 5;
let OJAMA_MAX_PER_BOARD = 3;
let SP_MAX = 6;
let SP_BIG = { dmg: 15, oj: 1 };
let SP_HEAL = 30;
let SP_SHIELD_MS = 5000;
let PINCH_HP = 30;
let PINCH_MUL = 1.3;
let MULTI_ATK = { 3: 0.7, 4: 0.55 };
let C_HP = { decay: 0.5, recover: 0.5, miss: 0.6 };
let C_UNITE = { dmg: 10, oj: 1, win: 3000, cool: 8000, combo: 3 };
let C_FOLLOW = { win: 3000, mul: 1.2 };
let handiDmgMul = h => 1 - 0.15 * (h || 0);
function hashSeed(s) {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}
function mulberry32(a) {
  return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function withSeed(key, fn) {
  const orig = Math.random;
  Math.random = mulberry32(hashSeed(key));
  try { return fn(); } finally { Math.random = orig; }
}
function makeBank(seed, tileCount) {
  const lists = {}, seen = {}, levels = {};
  return {
    get(level, k) {
      const L = lists[level] || (lists[level] = []);
      const S = seen[level] || (seen[level] = new Set());
      while (L.length <= k) {
        const i = L.length;
        const b = withSeed(`${seed}:${level}:${i}`, () => buildBoard(level, S, tileCount));
        b.tiles = b.tiles.map((t, j) => ({ ...t, id: `q${level}_${i}_${j}` }));
        L.push(b);
      }
      return L[k];
    },
    level(n) { // n 問目（1始まり）のレベル
      if (levels[n] == null) levels[n] = withSeed(`${seed}:lv:${n}`, () => pickLevelForQuestion(n));
      return levels[n];
    },
  };
}
function addOjama(tiles, poly, level, n) {
  const out = [...tiles];
  let guard = 0, added = 0;
  while (added < n && guard < 300) {
    guard++;
    const f = foreignFactor(level);
    const key = factorKey(f);
    if (out.some(t => factorKey(t.factor) === key)) continue;
    if (out.some(t => polyEqual(multiply(t.factor, f), poly))) continue;
    const pos = Math.floor(Math.random() * (out.length + 1));
    out.splice(pos, 0, { id: 'oj_' + Math.random().toString(36).slice(2), factor: f, ojama: true });
    added++;
  }
  return out;
}
function attackFor(judgeLabel, combo) {
  let dmg = 0, oj = 0;
  // ver.5.7 で弱めた（3コンボ目から2・4・6・8、最大8。5コンボごとに+5。おじゃまは Perfect で1枚）
  if (combo >= 3) dmg += Math.min(8, 2 * (combo - 2));
  if (combo > 0 && combo % 5 === 0) dmg += 5;
  if (judgeLabel === 'Perfect') oj += 1;
  return { dmg, oj };
}
function bTarget(me, ids, live, ko, tm) {
  const alive = ids.filter(u => u !== me && !(tm && tm[u] === tm[me]) && !(ko && ko[u]) && !(live[u] && live[u].st === 'ko'));
  if (!alive.length) return null;
  const L = u => live[u] || {};
  alive.sort((a, b) => (L(b).c || 0) - (L(a).c || 0) || (L(b).score || 0) - (L(a).score || 0) || (a < b ? -1 : 1));
  return alive[0];
}
function createBEngine(o) {
  const s = { hp: 100, c: 0, served: {}, score: 0, combo: 0, best: 0, pend: [], ojNext: 0, seenEv: {}, sent: 0, resolving: false, over: false, ko: false,
    lastT: Date.now(), cur: null, qStart: 0, warned: false, sp: 0, shieldUntil: 0, perfects: 0, behind: false, hist: [], pushT: 0, nextAt: null, cancelTotal: 0, ojSent: 0, spUsed: 0, minHp: 100, dmgTaken: 0 };
  const fx = (t, p) => { if (o.fx) o.fx(t, p); };
  const snd = (k, rate) => { if (o.sound) o.sound.play(k, rate); };
  const mul = handiDmgMul(o.hc);
  const r1 = v => Math.round(v * 100) / 100;
  const E = { s };
  /* C：体力はチームで1本（rooms/<code>/thp/<gid>/<チーム>）。自分の増減はためて、まとめて transaction で足す */
  const tm = o.tm || null, TC = !!tm, myT = TC ? tm[o.uid] : null;
  const mate = TC ? o.ids.find(u => u !== o.uid && tm[u] === myT) : null;
  s.pool = 100; s.dq = 0; s.flushT = 0; s.lastOkAt = 0; s.lastMissAt = 0; s.uniteAt = 0; s.unites = 0; s.covers = 0;
  const poolRef = TC ? fref(`rooms/${o.code}/thp/${o.gid}/${myT}`) : null;
  const syncHp = () => { if (TC) s.hp = Math.max(0, Math.min(100, r1(s.pool + s.dq))); };
  const addHp = x => { if (!TC) { s.hp = Math.max(0, Math.min(100, r1(s.hp + x))); return; } s.dq += x; syncHp(); };
  E.flush = force => {
    if (!TC || !s.dq) return;
    const t = Date.now();
    if (!force && t - s.flushT < 300 && Math.abs(s.dq) < 5) return;
    s.flushT = t; const d = s.dq; s.dq = 0;
    poolRef.transaction(v => Math.max(0, Math.min(100, r1((v == null ? 100 : v) + d)))).catch(() => {});
  };
  let poolFn = null;
  if (TC) { poolFn = snap => { const v = snap.val(); s.pool = v == null ? 100 : v; syncHp(); }; poolRef.on('value', poolFn); }
  E.dispose = () => { if (poolFn) poolRef.off('value', poolFn); };
  E.mate = mate; E.team = myT;
  const mateL = () => (mate && ((o.view().live || {})[mate])) || {};
  E.shield = () => Date.now() < s.shieldUntil;
  E.pinch = () => s.hp <= PINCH_HP;
  E.target = () => { const v = o.view(); return bTarget(o.uid, o.ids, v.live || {}, v.ko || {}, o.tm); };
  E.serve = () => {
    const n = s.c + 1, lv = o.bank.level(n), k = s.served[lv] || 0;
    s.served[lv] = k + 1;
    const b = o.bank.get(lv, k);
    let tiles = b.tiles.map(t => ({ ...t }));
    const oj = Math.min(OJAMA_MAX_PER_BOARD, s.ojNext);
    if (oj > 0) { tiles = addOjama(tiles, b.poly, lv, oj); s.ojNext -= oj; fx('ojama', oj); }
    s.cur = { level: lv, k, poly: b.poly, tiles, oj };
    s.qStart = Date.now(); s.warned = false;
  };
  E.writeLive = force => {
    const t = Date.now();
    if (!force && t - s.pushT < 400) return;
    s.pushT = t;
    const pd = s.pend.reduce((a, p) => a + p.dmg, 0), po = s.pend.reduce((a, p) => a + p.oj, 0);
    fref(`rooms/${o.code}/live/${o.gid}/${o.uid}`).set({ hp: Math.round(s.hp * 10) / 10, c: s.c, score: s.score, combo: s.combo, pd, po, sp: s.sp, sh: E.shield() ? 1 : 0,
      boardReady: !s.resolving && !s.over && !s.ko, lv: s.cur ? s.cur.level : 1, k: s.cur ? s.cur.k : 0, oj: s.cur ? s.cur.oj : 0, st: s.ko ? 'ko' : s.over ? 'over' : 'play', ...(TC ? { ok: s.lastOkAt, ms: s.lastMissAt, un: s.uniteAt } : {}) }).catch(() => {});
    E.flush(force);
  };
  E.knockout = () => {
    if (s.over) return;
    s.over = true; s.ko = true;
    if (TC) { s.dq = -200; E.flush(true); }
    s.hp = 0;
    E.writeLive(true);
    fref(`rooms/${o.code}/ko/${o.gid}/${o.uid}`).transaction(cur => cur ? undefined : { at: TSV() }).catch(() => {});
    fx('ko');
  };
  const damage = x => {
    if (x <= 0) return;
    addHp(-x);
    s.minHp = Math.min(s.minHp, s.hp);
    if (s.hp <= 0) E.knockout();
  };
  /* 届いた攻撃を受け取る（シールド中ははね返す） */
  E.receive = evs => {
    if (!evs) return;
    let any = false;
    Object.entries(evs).forEach(([k, e]) => {
      if (s.seenEv[k] || !e) return;
      s.seenEv[k] = 1;
      if (s.over) return;
      if (e.cover) { const c = coverPend(e.cover); if (c > 0) { fx('covered', { from: e.from, units: c }); E.writeLive(true); } return; }
      if (E.shield()) { fx('blocked', e); return; }
      const dmg = Math.round((e.dmg || 0) * mul);
      s.pend.push({ dmg, oj: e.oj || 0, t: Date.now(), from: e.from });
      any = true;
      snd('buzz'); fx('incoming', { dmg, oj: e.oj || 0, from: e.from, sp: e.sp });
    });
    if (any) E.writeLive(true);
  };
  /* 予告時間を過ぎた攻撃を落とす */
  E.land = forceAll => {
    const t = Date.now();
    let dmg = 0, oj = 0;
    s.pend = s.pend.filter(p => {
      if (forceAll || t - p.t >= B_LAND_DELAY) { dmg += p.dmg; oj += p.oj; return false; }
      return true;
    });
    if (E.shield()) { if (dmg || oj) fx('blocked', { dmg, oj }); return; }
    if (oj > 0) s.ojNext += oj;
    if (dmg > 0 || oj > 0) { s.dmgTaken += dmg + oj; snd('hit'); fx('hit', { dmg, oj }); }
    damage(dmg);
  };
  /* C：仲間が代わりに相殺してくれた（units ぶん予告を減らす） */
  const coverPend = units => {
    let done = 0;
    for (const p of s.pend) {
      if (units <= 0) break;
      const pu = p.dmg + p.oj * OJAMA_UNIT, c = Math.min(units, pu);
      units -= c; done += c; let r = c;
      const d = Math.min(p.dmg, r); p.dmg -= d; r -= d;
      if (r > 0) p.oj = Math.max(0, p.oj - Math.ceil(r / OJAMA_UNIT));
    }
    s.pend = s.pend.filter(p => p.dmg > 0 || p.oj > 0);
    return done;
  };
  /* 自分の攻撃：まず届いている攻撃を相殺し、残りを1位の人に送る */
  E.sendAttack = (out, isSp) => {
    let units = out.dmg + out.oj * OJAMA_UNIT;
    if (units <= 0) return;
    const pinch = E.pinch();
    if (pinch) units = Math.round(units * PINCH_MUL);
    // C：仲間がミスした直後はフォロー（攻撃1.2倍）
    const follow = TC && !isSp && mateL().ms && fbNow() - mateL().ms <= C_FOLLOW.win;
    if (follow) units = Math.round(units * C_FOLLOW.mul);
    let cancelled = 0;
    for (const p of s.pend) {
      if (units <= 0) break;
      const pu = p.dmg + p.oj * OJAMA_UNIT;
      const c = Math.min(units, pu);
      units -= c; cancelled += c;
      let r = c;
      const d = Math.min(p.dmg, r); p.dmg -= d; r -= d;
      if (r > 0) p.oj = Math.max(0, p.oj - Math.ceil(r / OJAMA_UNIT));
    }
    s.pend = s.pend.filter(p => p.dmg > 0 || p.oj > 0);
    // C：仲間に届いている攻撃もカバー（自分の分を相殺したあとの残りで）
    let covered = 0;
    if (TC && units > 0 && mate) {
      const ml = mateL(), mp = (ml.pd || 0) + (ml.po || 0) * OJAMA_UNIT;
      if (mp > 0 && ml.st === 'play') {
        covered = Math.min(units, mp); units -= covered; s.covers += covered;
        const key = String(Date.now()).padStart(15, '0') + '_' + Math.random().toString(36).slice(2, 7);
        fref(`rooms/${o.code}/ev/${o.gid}/${mate}/${key}`).set({ cover: covered, from: o.uid, at: TSV() }).catch(() => {});
      }
    }
    const to = units > 0 ? E.target() : null;
    let dmg = 0, oj = 0;
    if (to) {
      // 3人以上のときは、1位に攻撃が集中しすぎないように少し弱める
      const v = o.view(), alive = o.ids.filter(u => !((v.ko || {})[u]) && !(((v.live || {})[u] || {}).st === 'ko')).length;
      if (!TC) units = Math.max(1, Math.round(units * (MULTI_ATK[alive] || 1)));
      oj = Math.min(out.oj, Math.floor(units / OJAMA_UNIT));
      dmg = units - oj * OJAMA_UNIT;
      const key = String(Date.now()).padStart(15, '0') + '_' + Math.random().toString(36).slice(2, 7);
      fref(`rooms/${o.code}/ev/${o.gid}/${to}/${key}`).set({ dmg, oj, from: o.uid, sp: isSp ? 1 : 0, at: TSV() }).catch(() => {});
      s.sent += units; s.ojSent += oj;
      snd('send');
    }
    s.cancelTotal += cancelled + covered;
    fx('send', { dmg, oj, to, cancelled, pinch, covered, follow, unite: isSp === 'unite' });
  };
  E.answer = ok => {
    if (s.resolving || s.over || !s.cur) return null;
    s.resolving = true;
    const ms = Date.now() - s.qStart;
    const cur = s.cur;
    if (ok) {
      const j = getJudgment(ms);
      const mult = 1 + s.combo * 0.1, g = Math.round((LEVEL_POINTS[cur.level] || 10) * mult);
      const rec = TC ? j.recover * C_HP.recover : j.recover;
      const raw = s.hp + rec, over = Math.max(0, Math.round(raw - 100));
      addHp(rec);
      s.score += g + over; s.combo++; s.best = Math.max(s.best, s.combo); s.c++;
      const pe = j.label === 'Perfect' || j.label === 'Excellent';
      s.sp = Math.min(SP_MAX, s.sp + 1 + (pe ? 1 : 0));
      if (j.label === 'Perfect') s.perfects++;
      s.hist.push({ lv: cur.level, k: cur.k, ok: true, ms, j: j.label });
      snd('ok', 1 + Math.min(s.combo, 15) * 0.035); if (pe) snd('speed'); if (s.combo % 5 === 0) snd('combo');
      E.sendAttack(attackFor(j.label, s.combo));
      if (TC) {
        // 合体攻撃：2人とも3コンボ以上を3秒以内にそろえた（8秒に1回まで）
        const ml = mateL(), t = fbNow();
        if (s.combo >= C_UNITE.combo && (ml.combo || 0) >= C_UNITE.combo && ml.ok && t - ml.ok <= C_UNITE.win && t - Math.max(s.uniteAt, ml.un || 0) > C_UNITE.cool && ml.st === 'play') {
          s.uniteAt = t; s.unites++;
          fx('unite', { mate });
          E.sendAttack({ dmg: C_UNITE.dmg, oj: C_UNITE.oj }, 'unite');
        }
        s.lastOkAt = t;
      }
      E.writeLive(true);
      if (TC ? s.c + (mateL().c || 0) >= o.N * 2 : s.c >= o.N) { s.over = true; E.writeLive(true); if (o.onClear) o.onClear(o.uid); return { ok: true, judge: j, gain: g + over, clear: true }; }
      s.nextAt = Date.now() + 420;
      return { ok: true, judge: j, gain: g + over };
    }
    snd('buzz');
    s.combo = 0;
    s.hist.push({ lv: cur.level, k: cur.k, ok: false, ms });
    if (TC) s.lastMissAt = fbNow();
    damage(Math.round((DIFFICULTY_MISS_PENALTY[o.diff] || 20) * mul * (TC ? C_HP.miss : 1)));
    E.writeLive(true);
    s.nextAt = Date.now() + 420;
    return { ok: false };
  };
  E.next = () => {
    E.land(false);
    if (s.over) return;
    E.serve();
    s.resolving = false;
    E.writeLive(true);
    fx('next');
  };
  E.special = kind => {
    if (s.over || s.sp < SP_MAX) return false;
    s.sp = 0; s.spUsed++;
    snd('special');
    if (kind === 'big') E.sendAttack({ dmg: SP_BIG.dmg, oj: SP_BIG.oj }, true);
    else if (kind === 'heal') addHp(SP_HEAL);
    else if (kind === 'shield') { s.shieldUntil = Date.now() + SP_SHIELD_MS; s.pend = []; }
    fx('special', kind);
    E.writeLive(true);
    return true;
  };
  /* 観戦者の応援：体力を少し回復 */
  E.cheer = h => { if (s.over) return false; addHp(h); E.writeLive(true); return true; };
  /* 100ミリ秒ごとに呼ぶ：体力の自然減少・時間切れ・予告の時間切れ */
  E.tick = () => {
    const nowT = Date.now(), dt = nowT - s.lastT; s.lastT = nowT;
    if (s.over) return;
    if (s.nextAt && nowT >= s.nextAt) { s.nextAt = null; E.next(); if (s.over) return; }
    if (!s.resolving) addHp(-dt / 1000 * mul * (TC ? C_HP.decay : 1));
    if (s.pend.some(p => nowT - p.t >= B_FORCE_LAND)) {
      const keep = []; let dmg = 0, oj = 0;
      s.pend.forEach(p => { if (nowT - p.t >= B_FORCE_LAND) { dmg += p.dmg; oj += p.oj; } else keep.push(p); });
      s.pend = keep;
      if (!E.shield()) { s.ojNext += oj; s.dmgTaken += dmg + oj; if (dmg) { snd('hit'); fx('hit', { dmg, oj }); } damage(dmg); if (s.over) return; }
    }
    const qe = nowT - s.qStart;
    if (!s.resolving && qe >= QUESTION_TIMEOUT_MS - 5000 && !s.warned) { s.warned = true; if (o.sound) snd('buzz'); }
    if (!s.resolving && qe >= QUESTION_TIMEOUT_MS) {
      s.resolving = true; s.combo = 0;
      s.hist.push({ lv: s.cur.level, k: s.cur.k, ok: false, timeout: true, ms: qe });
      fx('timeout');
      if (TC) s.lastMissAt = fbNow();
      damage(Math.round((DIFFICULTY_TIMEOUT_EXTRA[o.diff] || 0) * mul * (TC ? C_HP.miss : 1)));
      if (s.over) return;
      s.nextAt = nowT + 420;
    }
    s.minHp = Math.min(s.minHp, s.hp);
    if (s.hp <= 0) { E.knockout(); return; }
    // 逆転勝ちの判定用：ピンチになった、または1位に3問以上差をつけられた
    if (!s.behind) {
      const v = o.view(), live = v.live || {};
      const lead = Math.max(0, ...o.ids.filter(u => u !== o.uid && !(TC && tm[u] === myT)).map(u => (live[u] && live[u].c) || 0));
      if (s.hp <= PINCH_HP || lead - s.c >= 3) s.behind = true;
    }
    E.writeLive(false);
  };
  E.serve();
  return E;
}
({createBEngine,makeBank,polyEqual,multiply,DIFFICULTY_CONFIG,QUESTION_TIMEOUT_MS});
