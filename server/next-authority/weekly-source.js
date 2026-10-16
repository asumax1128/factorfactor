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
let LEVEL_POINTS = { 1: 10, 2: 12, 3: 14, 4: 16, 5: 18, 6: 20, 7: 30, 8: 40, 9: 50 };
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
let BOSSES = [
  { id: 'dragon', name: '因数ドラゴン', icon: '🐉', color: '#2a9d8f' },
  { id: 'kraken', name: 'たすきがけクラーケン', icon: '🦑', color: '#7B61FF' },
  { id: 'golem', name: '3乗ゴーレム', icon: '🗿', color: '#8d6e63' },
  { id: 'maou', name: '平方の魔王', icon: '👿', color: '#b5487e' },
  { id: 'slime', name: '共通因数スライム', icon: '🫠', color: '#43C97B' },
  { id: 'robot', name: '展開ロボ Ω', icon: '🤖', color: '#457b9d' },
  // ver.8.4：数理の塔の5の倍数の階のボス（ほかのモードにも出る）
  { id: 'abs', name: '絶対値ビースト', icon: '🐾', color: '#C2410C' },
  { id: 'balance', name: '方程式バランサー', icon: '⚖️', color: '#457b9d' },
  { id: 'mod', name: '余りマスター', icon: '🧙‍♂️', color: '#7b2cbf' },
  { id: 'wave', name: '周期関数シード', icon: '🌱', color: '#3FA55F' },
  { id: 'chimera', name: '多項式キマイラ', icon: '🦁', color: '#B7791F' },
  { id: 'prime', name: '素数シャーク', icon: '🦈', color: '#0E86C6' },
  { id: 'sim', name: '連立パペット', icon: '🎭', color: '#b5487e' },
  { id: 'mirror', name: '対称式ファントム', icon: '🪞', color: '#6b5bd6' },
  { id: 'king', name: '因数の王', icon: '👑', color: '#b8860b' },
];
let BOSS_TRAITS = {
  slime: { tag: '入門', hpK: 0.8, parts: [], weak: false, counter: null, lvMul: { 1: 1.5, 2: 1.5 },
    desc: ['部位も弱点もない、ただのぷるぷる', '反撃してこない（はじめてのレイドにおすすめ）', '共通因数（Lv1・2）の問題でダメージ1.5倍', '体力は少なめ（0.8倍）'] },
  dragon: { tag: '攻撃型', seal: { part: 'b', text: 'ブレスのしびれが半分', stunK: 0.5 }, parts: ['角', '翼', 'しっぽ'], counter: { start: 25000, every: 30000, warn: 3000, stun: 4500, oj: 1, name: '🔥 炎のブレス' },
    desc: ['攻撃力が高い：反撃が30秒ごと、予告は3秒だけ', '「炎のブレス」を受けると4.5秒しびれて、おじゃまタイル+1', '角・翼・しっぽの3部位'] },
  kraken: { tag: '妨害型', seal: { part: 'b', text: '墨の時間が半分', fogK: 0.5 }, parts: ['吸盤', '足', '頭'], weakFam: 'tasuki', weak: { len: 20000 }, counter: { stun: 0, fog: 4000, name: '🦑 墨はき' },
    desc: ['反撃は「墨はき」：しびれないが、4秒間 画面が見えにくくなる', '弱点はいつも「たすきがけ」（弱点タイムは20秒）'] },
  golem: { tag: '防御型', seal: { part: 'a', text: '岩おとしのしびれが半分', stunK: 0.5 }, hpK: 1.3, parts: ['腕', '胴', '頭'], lvMul: { 1: 0.5, 2: 0.5, 3: 0.5, 7: 1.5 }, counter: { start: 45000, every: 60000, warn: 5000, stun: 6000, name: '🪨 岩おとし' },
    desc: ['かたい：体力1.3倍。かんたんな問題（Lv1〜3）はダメージ半分', '3乗の和・差（Lv7）が大の苦手：いつでもダメージ1.5倍', '反撃はおそい（60秒ごと）けど、当たると6秒しびれる'] },
  maou: { tag: '変身型', seal: { part: 'c', text: '第2形態に変身できない', noRevive: true }, hpK: 0.85, parts: ['角', 'マント', '杖'], weakFam: 'sa', revive: 0.25, counter: { stunByPhase: [2500, 3000, 4000, 5000], name: '🌑 闇の波動' },
    desc: ['体力が半分を切ると第2形態に変身して、体力が回復する', '体力が減るほど反撃のしびれが長くなる', '弱点はいつも「2乗の差」'] },
  robot: { tag: '機械型', seal: { part: 'a', text: 'ジャミングが止まる', ojK: 0 }, parts: ['アンテナ', 'アーム', 'コア'], weak: { every: 30000, len: 20000 }, chainK: 0.08, counter: { every: 35000, stun: 0, oj: 3, name: '📡 ジャミング' },
    desc: ['反撃は「ジャミング」：しびれないが、おじゃまタイル+3', '弱点タイムが多い（30秒ごとに20秒）', '連携チェインのダメージアップが大きい（最大1.8倍）'] },
};
let traitOf = id => BOSS_TRAITS[id] || {};
let RAID_CTR_DEF = { name: '💢 ボスの反撃' };
let ctrOf = id => ({ start: 35000, every: 40000, warn: 4000, stun: 3000, fog: 0, oj: 0, ...RAID_CTR_DEF, ...(traitOf(id).counter || {}) });
let RAID_JMUL = { Perfect: 1.5, Excellent: 1.3, Great: 1.1 };
let raidDamage = (lv, judge, combo) => Math.round((LEVEL_POINTS[lv] || 10) * (RAID_JMUL[judge] || 1) * (1 + 0.05 * Math.min(10, combo)));
let WEEKLY_HP = 30000;
let WEEKLY_SESSION = 60000;
function weekKey(t = Date.now()) { const d = new Date(t + 9 * 3600e3); const wd = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - wd); return d.toISOString().slice(0, 10); }
let weeklyBoss = wk => BOSSES[hashSeed('wk:' + wk) % BOSSES.length];
let RAID_FAMS = [
  { id: 'kyotsu', name: '共通因数', lv: [1, 2] },
  { id: 'kihon', name: '基本の因数分解', lv: [3] },
  { id: 'sa', name: '2乗の差', lv: [4] },
  { id: 'tasuki', name: 'たすきがけ', lv: [5, 6, 8, 9] },
  { id: 'sanjo', name: '3乗の和・差', lv: [7] },
];
let partOfLv = lv => lv <= 3 ? 'a' : lv <= 6 ? 'b' : 'c';
let RAID_CTR_GUARD = 5000;
let prevWeek = wk => weekKey(Date.parse(wk + 'T03:00:00Z') - 7 * 86400000);
let WK_RULES = [
  { id: 'perfect', icon: '⚡', name: 'スピード勝負', desc: 'Perfect のダメージが2倍' },
  { id: 'combo', icon: '🔥', name: 'コンボ祭り', desc: '5コンボ以上のあいだ、ダメージ1.5倍' },
  { id: 'high', icon: '🧗', name: '上級者の週', desc: 'Lv.5以上はダメージ1.5倍・Lv.4以下は0.7倍（出撃はLv.3から）' },
  { id: 'lucky', icon: '🍀', name: 'ラッキーセブン', desc: 'Lv.7（3乗の和・差）の問題はダメージ3倍' },
  { id: 'long', icon: '⏳', name: 'ロングラン', desc: '1回の出撃が90秒に延長' },
  { id: 'chest', icon: '🎁', name: '宝の山', desc: '宝箱が3倍出やすい' },
];
let wkRuleOf = id => WK_RULES.find(r => r.id === id) || null;
let WK_RAGE_HP = 1.2;
let wkRageReward = r => r >= 2 ? 2 : r >= 1 ? 1.5 : 1;
let wkSession = info => info && info.rule && info.rule.id === 'long' ? 90000 : WEEKLY_SESSION;
let wkSupMul = p => 1 + Math.min(0.5, (p || 0) * 0.005);
function weeklyInfo(wk, v, meta, sup) {
  const boss = (meta && BOSSES.find(b => b.id === meta.boss)) || weeklyBoss(wk), T = traitOf(boss.id);
  const rage = (meta && meta.rage) || 0;
  const hpMax = Math.round(WEEKLY_HP * (T.hpK || 1) * Math.pow(WK_RAGE_HP, rage));
  const supRows = Object.entries(sup || {}).map(([k, e]) => ({ k, ...e })).filter(e => e && e.p).sort((a, b) => b.p - a.p);
  const supTotal = supRows.reduce((a, e) => a + (e.p || 0), 0);
  const rows = Object.entries(v || {}).map(([k, e]) => ({ k, ...e })).filter(e => e && e.d).sort((a, b) => b.d - a.d);
  const total = rows.reduce((a, e) => a + (e.d || 0), 0);
  const revived = !!(T.revive && total >= hpMax * 0.5);   // 魔王：半分を切ると一度だけ回復
  const hp = hpMax - total + (revived ? Math.round(hpMax * T.revive) : 0);
  return { wk, boss, T, hpMax, total, hp, dead: hp <= 0, revived, rows, rage, rule: wkRuleOf(meta && meta.rule), meta, supRows, supTotal, supMul: wkSupMul(supTotal) };
}
let WK_WEAK = { slime: [], kraken: [[18, 38]], robot: [[8, 23], [33, 48]], abs: [], balance: [], mod: [], wave: [], chimera: [], prime: [], sim: [], mirror: [], king: [[6, 18], [36, 48]] };
let WK_CTR = { slime: [], dragon: [22, 44], kraken: [34], golem: [45], maou: [28, 50], robot: [30, 52], abs: [], balance: [], mod: [], wave: [], chimera: [], prime: [], sim: [], mirror: [], king: [24, 52] };
let wkWeakOf = id => WK_WEAK[id] || [[20, 35]];
let wkCtrOf = id => WK_CTR[id] || [35];
let wkBonus = (info, me) => { if (!me) return 0; const rk = info.rows.indexOf(me) + 1; return Math.round((20 + Math.min(60, Math.round(me.d / info.hpMax * 400)) + (rk === 1 ? 30 : rk <= 3 ? 15 : 0)) * wkRageReward(info.rage || 0)); };
function chestRoll(real) {
  const r = Math.random();
  if (r < 0.55) return { exp: 15, label: '経験値 +15' };
  if (r < 0.85) return { exp: 40, label: '経験値 +40' };
  if (r < 0.97) return real ? { shard: 1, label: 'きせかえのかけら ×1' } : { exp: 30, label: '経験値 +30' };
  return { exp: 100, label: '大当たり！ 経験値 +100' };
}
let wkOf = s => { s.wk = s.wk || {}; const W = s.wk; W.boss = W.boss || {}; W.done = W.done || {}; return W; };
let devAward = (s,S,run) => {
    const sd=S.d, base=10+Math.min(30,Math.floor(sd/15)), W=wkOf(s), runWeek=run.week;
    if(sd>0&&W.last!==runWeek){W.weeks=(W.weeks||0)+1;W.streak=W.last===prevWeek(runWeek)?(W.streak||0)+1:1;W.maxStreak=Math.max(W.maxStreak||0,W.streak);W.last=runWeek;}
    if(sd>0)W.best=Math.max(W.best||0,sd);
    if(S.sp){W.sup=(W.sup||0)+S.sp;W.supRuns=(W.supRuns||0)+1;}
    if(S.chests)W.chests=(W.chests||0)+S.chests;
    if(S.shards)W.shards=(W.shards||0)+S.shards;
    const date=new Date(run.reservation.day*86400000).toISOString().slice(0,10),first=W.day!==date;
    if(first)W.day=date;const before=s.exp||0;s.exp=before+base*(first?2:1)+(S.chestExp||0);
    return {before,after:s.exp,first};
  };
let GIM_INIT = () => ({ balLv: null, simLast: null, simG: 0, simAcc: 0, absN: 0, nextWave: 5, fired: {} });
function useBossGim(gim, o) {
  const S = useRef(null); if (!S.current) S.current = GIM_INIT();
  const st = S.current;
  const ctl0 = useRef(null), ctl = o.ctl || ctl0;
  const sec = o.active && o.t0 ? (Date.now() - o.t0) / 1000 : 0;
  const r = o.hpRatio == null ? 1 : o.hpRatio;
  const kPh = gim === 'king' ? (r > 0.66 ? 1 : r > 0.33 ? 2 : 3) : 0;   // 王：絶対値 → 素数 → 周期
  const kb = o.broken || {};
  const absOn = gim === 'abs' || (kPh === 1 && !kb.a);
  const primeOn = gim === 'prime' || kPh === 2, primeHalf = gim === 'prime' || (kPh === 2 && !kb.b);
  const waveOn = gim === 'wave' || (kPh === 3 && !kb.c);
  const head = gim === 'chimera' && o.active ? Math.floor(Math.max(0, sec) / 12) % 2 : null;
  const chFam = head == null ? null : head === 0 ? { id: 'q2', name: '二次式の頭', lv: [4, 5, 6, 8, 9], mul: 1.5 } : { id: 'q3', name: '三次式の頭', lv: [7], mul: 2 };
  const G = {
    gim, kPh, absOn, chFam, ctl, mirror: gim === 'mirror',
    reset: () => { S.current = GIM_INIT(); },
    checkpoint: () => JSON.parse(JSON.stringify(S.current)),
    restore: value => { S.current = {...GIM_INIT(),...value,fired:value?.fired || {}}; },
    buildProb: gim === 'mod' ? towerModProb : gim === 'sim' ? towerSimProb : null,
    missMul: absOn ? 2 : 1,
    hint: gim === 'sim' ? '式Ａ・式Ｂ、どちらの組を作ってもOK（交互に解くと連携ゲージ）' : null,
    // しかけによるダメージの倍率（弱点・キマイラの頭は呼ぶ側でかける）
    mul: (lv, combo) => {
      let m = 1;
      if (gim === 'balance') m *= st.balLv === lv ? 1 : 0.5;
      if (primeOn) m *= ((combo || 0) + 1) % 2 === 1 ? 2 : (primeHalf ? 0.5 : 1);
      return m;
    },
    // 正解したとき：連立パペットのボーナスなど、追加のダメージを返す
    onHit: (d, info, simBonus) => {
      let extra = 0;
      if (absOn) { const ext = o.onAbs ? o.onAbs() : false; const bc = rectC(qs('[data-boss]')); if (bc) FX.text(bc.x, bc.y + 40, ext ? '−→＋ ⏱+3秒' : '−→＋', '#7FD8FF', 22); }
      if (gim === 'balance') st.balLv = st.balLv === info.lv ? null : info.lv;
      if (gim === 'sim' && info.side) {
        if (st.simLast && st.simLast !== info.side) st.simG++;
        st.simLast = info.side; st.simAcc += d;
        if (st.simG >= 4) { extra = simBonus != null ? simBonus : st.simAcc; st.simG = 0; st.simAcc = 0; FX.band('🎭 連立方程式、解けた！', { color: '#b5487e', sub: `連携ボーナス ${extra} ダメージ`, ms: 1400 }); FX.flash('#ffd54a', 0.35, 250); }
      }
      return extra;
    },
    onMiss: () => { st.balLv = null; },
    // 毎回の描画のあとに呼ぶ：お知らせの帯・タイルをずらす
    tick: () => {
      if (!o.active) return;
      if (chFam && !st.fired['h' + Math.floor(sec / 12)]) { st.fired['h' + Math.floor(sec / 12)] = 1; FX.band(`🦁 ${chFam.name}があらわれた！`, { color: '#B7791F', sub: `${chFam.id === 'q2' ? 'たすきがけ・2乗の差' : '3乗の和・差'}が ×${chFam.mul}`, ms: 1300 }); }
      if (kPh && !st.fired['kp' + kPh]) { st.fired['kp' + kPh] = 1; const t = { 1: ['🐾 絶対値の力', 'ミス2倍'], 2: ['🦈 素数の力', '奇数コンボ2倍・偶数コンボ半分'], 3: ['🌱 周期の力', 'タイルの並びがずれていく'] }[kPh]; FX.band(`👑 王が${t[0]}を使った！`, { color: '#b8860b', sub: t[1], ms: 1500 }); }
      if(o.checkpointRotation && waveOn && sec >= (st.nextWave || 5)) {
        // The opt-in recovery callback persists the new tile order and wave
        // deadline together. Failed rotation must retain the previous deadline.
        const previous=st.nextWave;st.nextWave=sec+(gim==='king'?7:5);
        if(!(ctl.current && ctl.current.rotate && ctl.current.rotate()))st.nextWave=previous;
      } else if (waveOn && sec >= (st.nextWave || 5)) { if (ctl.current && ctl.current.rotate && ctl.current.rotate()) st.nextWave = sec + (gim === 'king' ? 7 : 5); }
    },
    // いまの状態の説明（1行）
    line: missText => {
      const nextC = ctl.current && ctl.current.combo ? ctl.current.combo() + 1 : 1;
      return gim === 'abs' ? `🐾 ${missText || 'ミスは2倍'}・正解で −→＋`
        : gim === 'balance' ? (st.balLv ? `⚖ 次も Lv.${st.balLv} を正解 → ふつうのダメージ（ちがうLvは半分）` : '⚖ まず1問正解（半分）→ 同じLvをもう1問で全ダメージ')
        : gim === 'mod' ? '🧙 1枚はニセの因数（あまりがずれている）。だまされるな'
        : gim === 'wave' ? '🌱 5秒ごとにタイルがずれる（ドラッグ中は止まる）'
        : gim === 'prime' ? `🦈 次の正解は ${nextC}コンボ目 → ${nextC % 2 ? '×2' : '×0.5'}（${nextC % 2 ? '奇数' : '偶数'}）`
        : gim === 'sim' ? `🎭 連携ゲージ ${'●'.repeat(st.simG)}${'○'.repeat(4 - st.simG)}（ＡとＢを交互に解く）`
        : gim === 'mirror' ? '🪞 鏡写しのタイルが引き寄せられる。選んだタイルをよく見て'
        : gim === 'chimera' && chFam ? `🦁 ${chFam.name}（あと${Math.ceil(12 - sec % 12)}秒）`
        : gim === 'king' ? `👑 ${kPh === 1 ? (kb.a ? '絶対値の力（封印中）' : `絶対値の力：${missText || 'ミス2倍'}`) : kPh === 2 ? `素数の力：次は${nextC}コンボ目 ${nextC % 2 ? '×2' : (kb.b ? '×1' : '×0.5')}` : (kb.c ? '周期の力（封印中）' : '周期の力：タイルがずれる')}`
        : null;
    },
  };
  return G;
}
function towerModProb(lv, seen) {
  for (let tries = 0; tries < 12; tries++) {
    const b = buildBoard(lv, seen, 6), t = b.tiles;
    let pi = -1, pj = -1;
    for (let i = 0; i < t.length && pi < 0; i++) for (let j = i + 1; j < t.length; j++) if (polyEqual(multiply(t[i].factor, t[j].factor), b.poly)) { pi = i; pj = j; break; }
    if (pi < 0) continue;
    const src = [pi, pj].find(i => t[i].factor.type === 'linear');
    const slot = t.findIndex((x, i) => i !== pi && i !== pj);
    if (src == null || slot < 0) continue;
    const f0 = t[src].factor, d = [1, -1, 2, -2][Math.floor(Math.random() * 4)];
    const fake = { ...f0, b: (f0.b || 0) + d };
    if (!fake.b || t.some(x => factorKey(x.factor) === factorKey(fake))) continue;
    const tiles = t.map((x, i) => i === slot ? { ...x, factor: fake, fake: true } : x);
    let n = 0; for (let i = 0; i < tiles.length; i++) for (let j = i + 1; j < tiles.length; j++) if (polyEqual(multiply(tiles[i].factor, tiles[j].factor), b.poly)) n++;
    if (n === 1) return { level: lv, ...b, tiles };
  }
  return { level: lv, ...buildBoard(lv, seen, 6) };
}
function towerSimProb(lv, seen) {
  for (let tries = 0; tries < 12; tries++) {
    const A = buildBoard(lv, seen, 3), B = buildBoard(lv, seen, 3);
    if (polyEqual(A.poly, B.poly)) continue;
    const tiles = [...A.tiles, ...B.tiles];
    for (let i = tiles.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [tiles[i], tiles[j]] = [tiles[j], tiles[i]]; }
    let na = 0, nb = 0;
    for (let i = 0; i < tiles.length; i++) for (let j = i + 1; j < tiles.length; j++) { const pr = multiply(tiles[i].factor, tiles[j].factor); if (polyEqual(pr, A.poly)) na++; if (polyEqual(pr, B.poly)) nb++; }
    if (na === 1 && nb === 1) return { level: lv, poly: A.poly, factors: A.factors, poly2: B.poly, factors2: B.factors, level2: lv, tiles };
  }
  return { level: lv, ...buildBoard(lv, seen, 6) };
}
function hashSeed(s) {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
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
({buildBoard,multiply,polyEqual,getJudgment,raidDamage,weeklyInfo,wkCtrOf,wkWeakOf,ctrOf,RAID_CTR_GUARD,RAID_FAMS,partOfLv,useBossGim,chestRoll,wkSession,hashSeed,addOjama,devAward,weekKey,wkBonus});
