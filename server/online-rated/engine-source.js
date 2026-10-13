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
let A_LOCK_MS = 2000;
let A_NEXT_DELAY = 1100;
let A_LASTSPURT = 3;
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
let RATING_K = 32;
let C_HP = { decay: 0.5, recover: 0.5, miss: 0.6 };
let C_UNITE = { dmg: 10, oj: 1, win: 3000, cool: 8000, combo: 3 };
let C_FOLLOW = { win: 3000, mul: 1.2 };
let handiDmgMul = h => 1 - 0.15 * (h || 0);
let handiPtsMul = h => 1 + 0.1 * (h || 0);
let BADGES = [
  // g：系統（同じ系統は一番上だけ名前の横に出す） r：めずらしさ（大きいほど先に出す） desc：取り方
  { id: 'first', g: 'first', r: 1, icon: '🌱', label: 'はじめの一歩', desc: '初めて勝つ', test: st => (st.w || 0) >= 1 },
  { id: 'lose50', g: 'lose', r: 2, icon: '🧱', label: '七転び八起き', desc: '負け50回（それでも続けた！）', test: st => (st.l || 0) >= 50 },
  { id: 'games100', g: 'games', r: 2, icon: '💯', label: '百戦錬磨', desc: '100戦する', test: st => (st.games || 0) >= 100 },
  { id: 'rival20', g: 'rival', r: 2, icon: '🤝', label: '永遠のライバル', desc: '同じ相手と20戦', test: st => Object.values(st.vs || {}).some(v => (v.w || 0) + (v.l || 0) + (v.d || 0) >= 20) },
  { id: 'wide10', g: 'wide', r: 1, icon: '🌏', label: '顔が広い', desc: '10人以上と対戦', test: st => Object.keys(st.vs || {}).length >= 10 },
  { id: 'dual', g: 'dual', r: 2, icon: '⚖️', label: '二刀流', desc: 'A・Bそれぞれで10勝', test: st => ((st.A || {}).w || 0) >= 10 && ((st.B || {}).w || 0) >= 10 },
  { id: 'streak10', g: 'streak', r: 2, icon: '🔥', label: '10連勝', desc: '10連勝する', test: st => (st.maxStreak || 0) >= 10 },
  { id: 'streak30', g: 'streak', r: 4, icon: '🔥', label: '30連勝', desc: '30連勝する', test: st => (st.maxStreak || 0) >= 30 },
  { id: 'streak50', g: 'streak', r: 5, icon: '🔥', label: '50連勝', desc: '50連勝する', test: st => (st.maxStreak || 0) >= 50 },
  { id: 'perfect50', g: 'perfect', r: 1, icon: '⭐', label: 'Perfect 50回', desc: 'Perfect を通算50回', test: st => (st.perfects || 0) >= 50 },
  { id: 'perfect100', g: 'perfect', r: 2, icon: '⭐', label: 'Perfect 100回', desc: 'Perfect を通算100回', test: st => (st.perfects || 0) >= 100 },
  { id: 'perfect300', g: 'perfect', r: 3, icon: '🌟', label: 'Perfect 300回', desc: 'Perfect を通算300回', test: st => (st.perfects || 0) >= 300 },
  { id: 'perfect500', g: 'perfect', r: 4, icon: '🌟', label: 'Perfect 500回', desc: 'Perfect を通算500回', test: st => (st.perfects || 0) >= 500 },
  { id: 'perfect1000', g: 'perfect', r: 5, icon: '👑', label: 'Perfect 1000回', desc: 'Perfect を通算1000回', test: st => (st.perfects || 0) >= 1000 },
  { id: 'comeback', g: 'comeback', r: 2, icon: '🔄', label: '逆転勝ち', desc: '不利な展開からひっくり返して勝つ', test: st => (st.comebacks || 0) >= 1 },
  { id: 'comeback10', g: 'comeback', r: 4, icon: '🔄', label: '逆転の鬼', desc: '逆転勝ち10回', test: st => (st.comebacks || 0) >= 10 },
  { id: 'master1700', g: 'master', r: 4, icon: '👑', label: '因数分解マスター', desc: 'レート1700に到達', test: st => (st.maxRating || 0) >= 1700 },
  { id: 'tour1', g: 'tour', r: 3, icon: '🏆', label: 'クラス王', desc: 'クラス大会で優勝', test: st => (st.tourWins || 0) >= 1 },
  { id: 'tour3', g: 'tour', r: 5, icon: '🏆', label: '三冠王', desc: 'クラス大会で3回優勝', test: st => (st.tourWins || 0) >= 3 },
  { id: 'flash', g: 'flash', r: 3, icon: '⚡', label: '光速の因数分解', desc: '1問を1秒以内に正解', test: st => st.bestMs != null && st.bestMs <= 1000 },
  { id: 'combo20', g: 'combo', r: 3, icon: '🔥', label: 'コンボ職人', desc: '1試合で20コンボ', test: st => (st.maxCombo || 0) >= 20 },
  { id: 'nomiss', g: 'nomiss', r: 3, icon: '🎯', label: 'ノーミス完走', desc: 'Bでミス・時間切れ0のまま勝つ', test: st => (st.nomissWins || 0) >= 1 },
  { id: 'clutch', g: 'clutch', r: 3, icon: '🩸', label: 'ギリギリセーフ', desc: 'Bで体力5%以下になってから勝つ', test: st => (st.clutchWins || 0) >= 1 },
  { id: 'cancel500', g: 'cancel', r: 3, icon: '🛡️', label: '鉄壁の守り', desc: '相殺で打ち消した量が通算500', test: st => (st.cancelTotal || 0) >= 500 },
  { id: 'ojama100', g: 'ojama', r: 3, icon: '💣', label: 'おじゃま職人', desc: 'おじゃまタイルを通算100枚送る', test: st => (st.ojSent || 0) >= 100 },
  { id: 'sp50', g: 'sp', r: 3, icon: '✨', label: '必殺技マスター', desc: '必殺技を通算50回使う', test: st => (st.spUsed || 0) >= 50 },
  { id: 'giant', g: 'giant', r: 4, icon: '🦸', label: 'ジャイアントキラー', desc: '自分よりレートが200以上高い相手に勝つ', test: st => (st.giantWins || 0) >= 1 },
  { id: 'survivor', g: 'survivor', r: 4, icon: '🏝️', label: 'ラストサバイバー', desc: '4人戦（B）で最後の1人まで生き残って勝つ', test: st => (st.survivors || 0) >= 1 },
  { id: 'shutout', g: 'shutout', r: 4, icon: '🥷', label: '完封', desc: 'Aで相手を0点にして勝つ', test: st => (st.shutouts || 0) >= 1 },
  { id: 'lv9', g: 'lv9', r: 4, icon: '🧠', label: 'Lv.9の壁', desc: 'Lv.9の問題を Perfect で正解', test: st => (st.lv9p || 0) >= 1 },
  { id: 'otetsuki100', g: 'otetsuki', r: 2, icon: '🐸', label: 'お手つき大王', desc: 'Aでお手つき通算100回', test: st => (st.otetsuki || 0) >= 100 },
  { id: 'handi', g: 'handi', r: 3, icon: '🎁', label: 'ハンデなんて関係ない', desc: 'ハンデ★★★の相手に勝つ', test: st => (st.handiWins || 0) >= 1 },
  { id: 'games300', g: 'games', r: 4, icon: '🏯', label: '修行の道', desc: '300戦する', test: st => (st.games || 0) >= 300 },
  { id: 'master1600', g: 'master', r: 2, icon: '🌠', label: '期待の新星', desc: 'レート1600に到達', test: st => (st.maxRating || 0) >= 1600 },
  { id: 'master1900', g: 'master', r: 5, icon: '🐉', label: '伝説の因数分解師', desc: 'レート1900に到達', test: st => (st.maxRating || 0) >= 1900 },
  { id: 'combo30', g: 'combo', r: 4, icon: '🌋', label: 'コンボの神', desc: '1試合で30コンボ', test: st => (st.maxCombo || 0) >= 30 },
  { id: 'cancel2000', g: 'cancel', r: 4, icon: '🏰', label: '難攻不落', desc: '相殺で打ち消した量が通算2000', test: st => (st.cancelTotal || 0) >= 2000 },
  { id: 'ojama500', g: 'ojama', r: 4, icon: '😈', label: 'おじゃま魔王', desc: 'おじゃまタイルを通算500枚送る', test: st => (st.ojSent || 0) >= 500 },
  { id: 'nomiss10', g: 'nomiss', r: 4, icon: '🎯', label: 'ノーミスの達人', desc: 'ノーミス完走で10回勝つ', test: st => (st.nomissWins || 0) >= 10 },
  { id: 'wide30', g: 'wide', r: 3, icon: '🎪', label: '人気者', desc: '30人以上と対戦', test: st => Object.keys(st.vs || {}).length >= 30 },
  { id: 'tour10', g: 'tour', r: 5, icon: '🏛️', label: '殿堂入り', desc: 'クラス大会で10回優勝', test: st => (st.tourWins || 0) >= 10 },
  { id: 'miracle', g: 'clutch', r: 5, icon: '😇', label: '奇跡の生還', desc: 'Bで体力1%以下になってから勝つ', test: st => (st.miracleWins || 0) >= 1 },
  { id: 'darkhorse', g: 'darkhorse', r: 5, icon: '🐴', label: 'ダークホース', desc: '出場者の中でレートがいちばん低いのに大会で優勝（記録ありの人が4人以上）', test: st => (st.darkHorse || 0) >= 1 },
  { id: 'daily7', g: 'daily', r: 2, icon: '📅', label: '皆勤賞', desc: '7日続けて対戦する', test: st => (st.maxDayStreak || 0) >= 7 },
  { id: 'daily30', g: 'daily', r: 4, icon: '🗓️', label: '継続は力なり', desc: '30日続けて対戦する', test: st => (st.maxDayStreak || 0) >= 30 },
  { id: 'sp3', g: 'sp3', r: 3, icon: '💥', label: '必殺技三連発', desc: '1試合で必殺技を3回使う', test: st => (st.maxSpMatch || 0) >= 3 },
  { id: 'revenge', g: 'revenge', r: 2, icon: '⚔️', label: 'リベンジ成功', desc: '前の試合で負けた相手に勝つ', test: st => (st.revenges || 0) >= 1 },
  { id: 'calm', g: 'calm', r: 3, icon: '🧘', label: '冷静沈着', desc: 'Aでお手つき0のまま、6問以上取って勝つ', test: st => (st.calmWins || 0) >= 1 },
  { id: 'flawless', g: 'flawless', r: 3, icon: '💎', label: '無傷の勝利', desc: 'Bで攻撃を一度も受けずに勝つ', test: st => (st.flawlessWins || 0) >= 1 },
  { id: 'nosp', g: 'nosp', r: 3, icon: '🥋', label: '必殺技いらず', desc: 'B方式で必殺技を一度も使わずに勝つ', test: st => (st.noSpWins || 0) >= 1 },
  { id: 'rgold', g: 'rank', r: 2, icon: '🥇', label: 'ゴールドの風格', desc: 'ランク帯ゴールド（レート1580）に到達', test: st => (st.maxRating || 0) >= 1580 },
  { id: 'rmaster', g: 'rank', r: 4, icon: '👑', label: '頂点に立つ者', desc: 'ランク帯マスター（レート1820）に到達', test: st => (st.maxRating || 0) >= 1820 },
  { id: 'bounty1', g: 'bounty', r: 2, icon: '💰', label: '賞金稼ぎ', desc: '懸賞金がかかった相手に勝つ', test: st => (st.bountyWins || 0) >= 1 },
  { id: 'bounty10', g: 'bounty', r: 4, icon: '🤠', label: '伝説のハンター', desc: '懸賞金がかかった相手に通算10回勝つ', test: st => (st.bountyWins || 0) >= 10 },
  { id: 'wanted', g: 'wanted', r: 3, icon: '📜', label: 'お尋ね者', desc: '懸賞金50以上がかかる（7連勝）', test: st => (st.maxStreak || 0) >= 7 },
  { id: 'mis7', g: 'mis', r: 3, icon: '📆', label: 'ミッション皆勤', desc: 'デイリーミッションを7日コンプリートする', test: st => (st.misDays || 0) >= 7 },
  { id: 'lasthit', g: 'lasthit', r: 4, icon: '🗡️', label: 'ラストアタッカー', desc: 'クラス協力レイドでボスにとどめを刺す', test: st => (st.lastHits || 0) >= 1 },
  // 今週のボス
  { id: 'wk1', g: 'wk', r: 1, icon: '🗓️', label: '初陣', desc: '今週のボスに初めて出撃する', test: st => ((st.wk || {}).weeks || 0) >= 1 },
  { id: 'wkst3', g: 'wkst', r: 2, icon: '🔁', label: '皆勤の戦士', desc: '今週のボスに3週続けて出撃', test: st => ((st.wk || {}).maxStreak || 0) >= 3 },
  { id: 'wkst5', g: 'wkst', r: 3, icon: '🛡️', label: '歴戦の戦士', desc: '今週のボスに5週続けて出撃', test: st => ((st.wk || {}).maxStreak || 0) >= 5 },
  { id: 'wkst10', g: 'wkst', r: 5, icon: '🏯', label: '不屈の守護者', desc: '今週のボスに10週続けて出撃', test: st => ((st.wk || {}).maxStreak || 0) >= 10 },
  { id: 'wkk1', g: 'wkk', r: 2, icon: '⚔️', label: '討伐隊', desc: '今週のボスの討伐に参加（撃破された週にダメージを与える）', test: st => ((st.wk || {}).kills || 0) >= 1 },
  { id: 'wkk5', g: 'wkk', r: 3, icon: '🎖️', label: '討伐隊長', desc: '今週のボスの討伐に5回参加', test: st => ((st.wk || {}).kills || 0) >= 5 },
  { id: 'wkk10', g: 'wkk', r: 4, icon: '🦁', label: '救国の英雄', desc: '今週のボスの討伐に10回参加', test: st => ((st.wk || {}).kills || 0) >= 10 },
  { id: 'wkace', g: 'wkace', r: 3, icon: '🏅', label: '今週のエース', desc: '今週のボスのダメージで週1位になる', test: st => ((st.wk || {}).ace || 0) >= 1 },
  { id: 'wkace5', g: 'wkace', r: 5, icon: '🌟', label: '絶対的エース', desc: '今週のボスのダメージで週1位を5回', test: st => ((st.wk || {}).ace || 0) >= 5 },
  { id: 'wkone', g: 'wkone', r: 3, icon: '💥', label: '一撃必殺', desc: '今週のボスに1回の出撃で600ダメージ', test: st => ((st.wk || {}).best || 0) >= 600 },
  { id: 'wkone2', g: 'wkone', r: 4, icon: '☄️', label: '会心の出撃', desc: '今週のボスに1回の出撃で1200ダメージ', test: st => ((st.wk || {}).best || 0) >= 1200 },
  { id: 'wkdex3', g: 'wkdex', r: 3, icon: '📖', label: 'ボス図鑑', desc: '3種類のボスの討伐に参加', test: st => Object.keys((st.wk || {}).boss || {}).length >= 3 },
  { id: 'wkdex6', g: 'wkdex', r: 5, icon: '🐲', label: 'ボスハンター', desc: '6種類すべてのボスの討伐に参加', test: st => Object.keys((st.wk || {}).boss || {}).length >= 6 },
  { id: 'lb7', g: 'lb', r: 2, icon: '🎫', label: 'スタンプコンプリート', desc: 'ログインボーナスのカードを1枚完成させる（7日）', test: st => ((st.login || {}).cards || 0) >= 1 },
  { id: 'lb30', g: 'lb', r: 3, icon: '🏫', label: 'いつもの顔', desc: '通算30日ログイン', test: st => ((st.login || {}).n || 0) >= 30 },
  { id: 'lb100', g: 'lb', r: 5, icon: '🌸', label: '常連さん', desc: '通算100日ログイン', test: st => ((st.login || {}).n || 0) >= 100 },
  { id: 'wkchest1', g: 'wkchest', r: 2, icon: '🎁', label: '宝探し', desc: '今週のボスの出撃中に宝箱を開ける', test: st => ((st.wk || {}).chests || 0) >= 1 },
  { id: 'wkchest10', g: 'wkchest', r: 4, icon: '🏴‍☠️', label: 'トレジャーハンター', desc: '宝箱を通算10個開ける', test: st => ((st.wk || {}).chests || 0) >= 10 },
  { id: 'wksup1', g: 'wksup', r: 2, icon: '📣', label: '縁の下の力持ち', desc: '今週のボスにサポーターで出撃', test: st => ((st.wk || {}).supRuns || 0) >= 1 },
  { id: 'wksup100', g: 'wksup', r: 4, icon: '🎺', label: '名サポーター', desc: '応援ポイントを通算100', test: st => ((st.wk || {}).sup || 0) >= 100 },
  { id: 'tw10', g: 'tower', r: 2, icon: '🗼', label: '塔の挑戦者', desc: '数理の塔で10階を突破', test: st => ((st.tower || {}).best || 0) >= 10 },
  { id: 'tw30', g: 'tower', r: 3, icon: '🏯', label: '塔の熟練者', desc: '数理の塔で30階を突破', test: st => ((st.tower || {}).best || 0) >= 30 },
  { id: 'tw50', g: 'tower', r: 5, icon: '👑', label: '塔を制覇', desc: '数理の塔の50階で因数の王を倒す', test: st => ((st.tower || {}).best || 0) >= 50 },
  { id: 'tw70', g: 'tower', r: 5, icon: '📖', label: '数理の書の継承者', desc: '数理の塔の第一部をクリア', test: st => ((st.tower || {}).best || 0) >= 70 },
  { id: 'tw100', g: 'tower', r: 5, icon: '🌌', label: '終わりなき探究者', desc: '数理の塔の第一部を3回クリア', test: st => ((st.tower || {}).endN || 0) >= 3 || ((st.tower || {}).best || 0) >= 100 },
  { id: 'wkrage', g: 'wkrage', r: 4, icon: '😤', label: '怒りを鎮めし者', desc: '怒って居座ったボスの討伐に参加', test: st => ((st.wk || {}).rageKills || 0) >= 1 },
  { id: 'wklast', g: 'wklast', r: 4, icon: '🗡️', label: '討伐の一撃', desc: '今週のボスにとどめを刺す', test: st => ((st.wk || {}).lastHit || 0) >= 1 },
  { id: 'alllv', g: 'alllv', r: 5, icon: '🌈', label: 'オールレベル制覇', desc: 'Lv.1〜Lv.9 すべてで Perfect を取る', test: st => ((st.lvP || 0) & 1022) === 1022 },
];
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
function problemForA(bank, q) {
  const lv = bank.level(q + 1);
  let k = 0;
  for (let i = 0; i < q; i++) if (bank.level(i + 1) === lv) k++;
  return { level: lv, k, ...bank.get(lv, k) };
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
function scoreA(bank, claims, players, N, hc) {
  const sc = {}, cb = {}, best = {};
  players.forEach(p => { sc[p] = 0; cb[p] = 0; best[p] = 0; });
  const log = [];
  for (let q = 0; ; q++) {
    const c = claims && claims[q];
    if (!c) break;
    const lv = bank.level(q + 1);
    if (c.uid in sc) {
      const w = c.uid, mult = 1 + cb[w] * 0.1;
      const spurt = N && q >= N - A_LASTSPURT ? 2 : 1;
      const pts = Math.round((LEVEL_POINTS[lv] || 10) * mult * spurt * handiPtsMul(hc && hc[w]));
      sc[w] += pts; cb[w]++; best[w] = Math.max(best[w], cb[w]);
      players.forEach(p => { if (p !== w) cb[p] = 0; });
      log.push({ q, w, pts, at: c.at, spurt: spurt > 1 });
    } else {
      players.forEach(p => { cb[p] = 0; });
      log.push({ q, w: null, at: c.at });
    }
  }
  return { sc, cb, best, log };
}
let qStartA = (claims, q, startAt) => q === 0 ? startAt : ((claims[q - 1] && claims[q - 1].at) || startAt) + A_NEXT_DELAY;
function ratingDelta(myR, opps) {
  let d = 0;
  opps.forEach(o => { const E = 1 / (1 + Math.pow(10, (o.r - myR) / 400)); d += RATING_K * (o.s - E); });
  return d;
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
      lv: s.cur ? s.cur.level : 1, k: s.cur ? s.cur.k : 0, oj: s.cur ? s.cur.oj : 0, st: s.ko ? 'ko' : s.over ? 'over' : 'play', ...(TC ? { ok: s.lastOkAt, ms: s.lastMissAt, un: s.uniteAt } : {}) }).catch(() => {});
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
({makeBank,createBEngine,scoreA,problemForA,getJudgment,polyEqual,multiply,DIFFICULTY_CONFIG,qStartA,A_LOCK_MS,A_NEXT_DELAY,QUESTION_TIMEOUT_MS,ratingDelta,BADGES});
