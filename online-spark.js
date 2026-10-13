(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // server/online-rated/engine.cjs
  var require_engine = __commonJS({
    "server/online-rated/engine.cjs"(exports, module) {
      var makeRuntime = new Function("Math", "Date", "fref", "TSV", "fbNow", "// GENERATED from main index.html; do not edit. Server-only.\nfunction gcd(a, b) {\n  a = Math.abs(a); b = Math.abs(b);\n  while (b) { [a, b] = [b, a % b]; }\n  return a || 1;\n}\nfunction randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }\nfunction randSign() { return Math.random() < 0.5 ? 1 : -1; }\nfunction randNonZero(min, max) { let v = 0; while (v === 0) v = randInt(min, max); return v; }\nfunction factorKey(f) {\n  if (f.type === 'linear') return `L${f.a}_${f.b}`;\n  if (f.type === 'quadratic') return `Q${f.A}_${f.B}_${f.C}`;\n  return `C${f.k}`;\n}\nfunction toCoeffs(f) {\n  if (f.type === 'linear') return [f.a, f.b];\n  if (f.type === 'quadratic') return [f.A, f.B, f.C];\n  return [f.k];\n}\nfunction multiply(f1, f2) {\n  const c1 = toCoeffs(f1);\n  const c2 = toCoeffs(f2);\n  const raw = new Array(c1.length + c2.length - 1).fill(0);\n  for (let i = 0; i < c1.length; i++) {\n    for (let j = 0; j < c2.length; j++) raw[i + j] += c1[i] * c2[j];\n  }\n  // raw \u306F\u6B21\u6570\u306E\u9AD8\u3044\u9806\u3002x4\u301Cx0 \u306E5\u9805\u306B\u6B63\u898F\u5316\u3059\u308B(\u6700\u5927\u30672\u6B21\xD72\u6B21=4\u6B21\u307E\u3067\u5BFE\u5FDC)\u3002\n  const padded = [0, 0, 0, 0, 0];\n  for (let i = 0; i < raw.length; i++) {\n    const degree = raw.length - 1 - i;\n    if (degree <= 4) padded[4 - degree] = raw[i];\n  }\n  return { x4: padded[0], x3: padded[1], x2: padded[2], x1: padded[3], x0: padded[4] };\n}\nfunction polyEqual(p1, p2) {\n  return p1.x4 === p2.x4 && p1.x3 === p2.x3 && p1.x2 === p2.x2 && p1.x1 === p2.x1 && p1.x0 === p2.x0;\n}\nfunction coprime(a, b) { return gcd(Math.abs(a), Math.abs(b)) === 1; }\nfunction genL1() {\n  let b, c;\n  do {\n    b = randInt(1, 9);\n    c = randInt(1, 9);\n  } while (!coprime(b, c));\n  const a = randInt(2, 9);          // a \u2260 1\n  const sign = randSign();          // \xB1 \u306E2\u901A\u308A\n  const f1 = { type: 'const', k: a };\n  const f2 = { type: 'linear', a: b, b: sign * c };\n  return { factors: [f1, f2], poly: multiply(f1, f2) };\n}\nfunction genL2() {\n  let b, c;\n  do {\n    b = randInt(1, 9);\n    c = randInt(1, 9);\n  } while (!coprime(b, c));\n  const a = randInt(1, 9);          // a = 1 \u3082\u8A31\u5BB9\n  const sign = randSign();\n  const f1 = { type: 'linear', a, b: 0 };            // ax\n  const f2 = { type: 'linear', a: b, b: sign * c };  // bx \xB1 c\n  return { factors: [f1, f2], poly: multiply(f1, f2) };\n}\nfunction genL3() {\n  let a, b;\n  do {\n    a = randNonZero(-9, 9);\n    b = randNonZero(-9, 9);\n  } while (a === -b);\n  const f1 = { type: 'linear', a: 1, b: a };\n  const f2 = { type: 'linear', a: 1, b };\n  return { factors: [f1, f2], poly: multiply(f1, f2) };\n}\nfunction genL4() {\n  let a, b;\n  do {\n    a = randInt(1, 9);\n    b = randInt(1, 9);\n  } while (!coprime(a, b));\n  const f1 = { type: 'linear', a, b };\n  const f2 = { type: 'linear', a, b: -b };\n  return { factors: [f1, f2], poly: multiply(f1, f2) };\n}\nfunction genL5() {\n  let c, b, d;\n  do {\n    c = randInt(2, 9);\n    b = randNonZero(-5, 5);\n    d = randNonZero(-5, 5);\n  } while (!coprime(c, d));\n  const f1 = { type: 'linear', a: 1, b };\n  const f2 = { type: 'linear', a: c, b: d };\n  return { factors: [f1, f2], poly: multiply(f1, f2) };\n}\nfunction genL6() {\n  let c, b, d;\n  do {\n    c = randInt(2, 9);\n    b = randNonZero(-9, 9);\n    d = randNonZero(-9, 9);\n  } while (!coprime(c, d) || !(Math.abs(b) >= 6 || Math.abs(d) >= 6));\n  const f1 = { type: 'linear', a: 1, b };\n  const f2 = { type: 'linear', a: c, b: d };\n  return { factors: [f1, f2], poly: multiply(f1, f2) };\n}\nfunction genL7() {\n  let a, b;\n  do {\n    a = randInt(1, 5);\n    b = randInt(1, 5);\n  } while (!coprime(a, b));\n  const isSum = Math.random() < 0.5;        // + \u306A\u3089\u548C\u3001- \u306A\u3089\u5DEE\n  const s = isSum ? 1 : -1;\n  const linear = { type: 'linear', a, b: s * b };                       // ax \xB1 b\n  const quad = { type: 'quadratic', A: a * a, B: -s * a * b, C: b * b }; // a\xB2x\xB2 \u2213 abx + b\xB2\n  return { factors: [linear, quad], poly: multiply(linear, quad) };\n}\nfunction genL8() {\n  let a, c, b, d;\n  do {\n    a = randInt(2, 4);\n    c = randInt(2, 4);\n    b = randNonZero(-4, 4);\n    d = randNonZero(-4, 4);\n  } while (!coprime(a, b) || !coprime(c, d) || !(a < c || (a === c && b <= d)));\n  const f1 = { type: 'linear', a, b };\n  const f2 = { type: 'linear', a: c, b: d };\n  return { factors: [f1, f2], poly: multiply(f1, f2) };\n}\nfunction genL9() {\n  let a, c, b, d;\n  do {\n    a = randInt(2, 9);\n    c = randInt(2, 9);\n    b = randNonZero(-9, 9);\n    d = randNonZero(-9, 9);\n  } while (\n    !coprime(a, b) || !coprime(c, d) ||\n    !(a < c || (a === c && b <= d)) ||\n    !(a >= 5 || c >= 5 || Math.abs(b) >= 5 || Math.abs(d) >= 5)\n  );\n  const f1 = { type: 'linear', a, b };\n  const f2 = { type: 'linear', a: c, b: d };\n  return { factors: [f1, f2], poly: multiply(f1, f2) };\n}\nlet GENERATORS = { 1: genL1, 2: genL2, 3: genL3, 4: genL4, 5: genL5, 6: genL6, 7: genL7, 8: genL8, 9: genL9 };\nlet LEVEL_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9];\nlet LEVEL_POINTS = { 1: 10, 2: 12, 3: 14, 4: 16, 5: 18, 6: 20, 7: 30, 8: 40, 9: 50 };\nlet FIXED_PHASE_LAST_Q = 27;\nlet RANDOM_PHASE_FIRST_Q = 28;\nlet INITIAL_WEIGHTS = { 1: 8, 2: 8, 3: 8, 4: 8, 5: 10, 6: 10, 7: 12, 8: 16, 9: 20 };\nlet WEIGHT_DELTA = { 1: -1, 2: -1, 3: -1, 4: -1, 5: +2, 6: +2, 7: -2, 8: +2 };\nlet FINAL_STEP = 6;\nlet FINAL_FIXED_WEIGHTS = { 1: 2, 2: 2, 3: 2, 4: 2, 5: 22, 6: 22, 7: 2, 8: 30, 9: 16 };\nfunction getLevelWeights(questionNumber) {\n  const steps = Math.max(0, Math.floor((questionNumber - RANDOM_PHASE_FIRST_Q) / 3));\n\n  if (steps >= FINAL_STEP) return { ...FINAL_FIXED_WEIGHTS };\n\n  const w = {};\n  [1, 2, 3, 4].forEach(lv => { w[lv] = Math.max(0, INITIAL_WEIGHTS[lv] + WEIGHT_DELTA[lv] * steps); });\n  w[5] = INITIAL_WEIGHTS[5] + WEIGHT_DELTA[5] * steps;\n  w[6] = INITIAL_WEIGHTS[6] + WEIGHT_DELTA[6] * steps;\n  w[7] = Math.max(0, INITIAL_WEIGHTS[7] + WEIGHT_DELTA[7] * steps);\n  w[8] = INITIAL_WEIGHTS[8] + WEIGHT_DELTA[8] * steps;\n\n  // Lv.9\u306F\u300C\u4ED6\u306E8\u30EC\u30D9\u30EB\u3092\u5F15\u3044\u305F\u6B8B\u308A\u5168\u90E8\u300D\u3092\u5F15\u304D\u53D7\u3051\u308B(\u5E38\u306B\u5408\u8A08100%\u306B\u306A\u308B)\n  const usedSum = [1, 2, 3, 4, 5, 6, 7, 8].reduce((s, lv) => s + w[lv], 0);\n  w[9] = Math.max(0, 100 - usedSum);\n  return w;\n}\nfunction pickLevelForQuestion(questionNumber) {\n  if (questionNumber <= FIXED_PHASE_LAST_Q) {\n    // 1\u301C3\u554F\u76EE=Lv.1\u30014\u301C6\u554F\u76EE=Lv.2 \u2026 25\u301C27\u554F\u76EE=Lv.9\n    return Math.min(9, Math.floor((questionNumber - 1) / 3) + 1);\n  }\n  const w = getLevelWeights(questionNumber);\n  let r = Math.random() * 100;\n  for (const lv of LEVEL_IDS) {\n    if (r < w[lv]) return lv;\n    r -= w[lv];\n  }\n  return 9; // \u4E38\u3081\u8AA4\u5DEE\u5BFE\u7B56\u306E\u30D5\u30A9\u30FC\u30EB\u30D0\u30C3\u30AF\n}\nlet DIFFICULTY_CONFIG = {\n  easy: { label: '\u30A4\u30FC\u30B8\u30FC', clearCount: 15, color: '#52B788', tileCount: 6 },\n  normal: { label: '\u30CE\u30FC\u30DE\u30EB', clearCount: 30, color: '#E8A33D', tileCount: 9 },\n  hard: { label: '\u30CF\u30FC\u30C9', clearCount: 50, color: '#E76F51', tileCount: 9 },\n};\nfunction flipSign(f) {\n  if (f.type === 'const') return { type: 'const', k: -f.k };\n  // quadratic \u306F\u4E2D\u592E\u306E\u9805(\xB1nx)\u306E\u7B26\u53F7\u3092\u9593\u9055\u3048\u308B\u306E\u304C\u5178\u578B\u7684\u306A\u30DF\u30B9\u306A\u306E\u3067\u305D\u3053\u3092\u53CD\u8EE2\u3059\u308B\n  if (f.type === 'quadratic') return { type: 'quadratic', A: f.A, B: -f.B, C: f.C };\n  return { type: 'linear', a: f.a, b: -f.b };\n}\nfunction shiftConst(f) {\n  const d = randSign();\n  if (f.type === 'const') return { type: 'const', k: f.k + d };\n  if (f.type === 'quadratic') return { type: 'quadratic', A: f.A, B: f.B, C: f.C + d };\n  return { type: 'linear', a: f.a, b: f.b + d };\n}\nfunction foreignFactor(level) {\n  const { factors } = GENERATORS[level]();\n  return factors[randInt(0, 1)];\n}\nfunction genDummies(level, correctFactors) {\n  const dummies = [];\n  const pushUnique = (f) => {\n    const key = factorKey(f);\n    if (!correctFactors.some(cf => factorKey(cf) === key) && !dummies.some(d => factorKey(d) === key)) {\n      dummies.push(f);\n    }\n  };\n  for (let i = 0; i < randInt(1, 2); i++) pushUnique(flipSign(correctFactors[randInt(0, 1)]));\n  for (let i = 0; i < randInt(1, 2); i++) pushUnique(shiftConst(correctFactors[randInt(0, 1)]));\n  for (let i = 0; i < randInt(1, 2); i++) pushUnique(foreignFactor(level));\n  // \u76E4\u9762\u306E\u30DE\u30B9\u6570\u306F\u6709\u9650\u306A\u306E\u3067\u3001\u30C0\u30DF\u30FC\u304C\u591A\u3059\u304E\u306A\u3044\u3088\u3046\u4E0A\u9650\u3092\u8A2D\u3051\u308B(\u6700\u7D42\u7684\u306A\u679A\u6570\u306FbuildBoard\u5074\u3067tileCount\u306B\u5207\u308A\u8A70\u3081\u308B)\n  return dummies.slice(0, 5);\n}\nfunction buildBoard(level, seenSet, tileCount = 9) {\n  let factors, poly, sig;\n  let outerAttempt = 0;\n  do {\n    ({ factors, poly } = GENERATORS[level]());\n    sig = `${level}:${poly.x4},${poly.x3},${poly.x2},${poly.x1},${poly.x0}`;\n    outerAttempt++;\n  } while (seenSet && seenSet.has(sig) && outerAttempt < 60);\n  if (seenSet) seenSet.add(sig);\n\n  let tiles = [];\n  let attempt = 0;\n  while (true) {\n    attempt++;\n    const dummies = genDummies(level, factors);\n    let pool = [...factors, ...dummies];\n    let guard = 0;\n    while (pool.length < tileCount && guard < 200) {\n      guard++;\n      const f = foreignFactor(level);\n      const key = factorKey(f);\n      if (!pool.some(p => factorKey(p) === key)) pool.push(f);\n    }\n    // \u6B63\u89E3\u30DA\u30A22\u679A\u306F pool \u306E\u5148\u982D\u306B\u3042\u308B\u306E\u3067\u3001slice \u3057\u3066\u3082\u5FC5\u305A\u76E4\u9762\u306B\u6B8B\u308B\n    pool = pool.slice(0, tileCount);\n    tiles = pool.map((f, idx) => ({ id: `${Date.now()}_${idx}_${Math.random().toString(36).slice(2)}`, factor: f }));\n    for (let i = tiles.length - 1; i > 0; i--) {\n      const j = Math.floor(Math.random() * (i + 1));\n      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];\n    }\n    let matchCount = 0;\n    for (let i = 0; i < tiles.length && matchCount <= 1; i++) {\n      for (let j = i + 1; j < tiles.length; j++) {\n        if (polyEqual(multiply(tiles[i].factor, tiles[j].factor), poly)) {\n          matchCount++;\n          if (matchCount > 1) break;\n        }\n      }\n    }\n    if (matchCount === 1) break;\n    if (attempt > 40) break;\n  }\n  return { tiles, poly, factors };\n}\nlet QUESTION_TIMEOUT_MS = 20000;\nlet JUDGE_TIERS = [\n  { max: 2000, label: 'Perfect', recover: 25, color: '#FFD54A' },\n  { max: 3000, label: 'Excellent', recover: 20, color: '#8BE38F' },\n  { max: 5000, label: 'Great', recover: 15, color: '#6BD4E8' },\n  { max: 10000, label: 'Good', recover: 10, color: '#8FB8FF' },\n  { max: 15000, label: 'OK', recover: 5, color: '#C9C9C9' },\n  { max: 20000, label: 'Fair', recover: 2, color: '#FF9F1C' },\n];\nlet JUDGE_BAD = { label: 'Bad', recover: 0, color: '#FF5C5C' };\nfunction getJudgment(elapsedMs) {\n  for (const tier of JUDGE_TIERS) {\n    if (elapsedMs <= tier.max) return tier;\n  }\n  return JUDGE_BAD; // 20\u79D2\u8D85\u306F\u672C\u6765\u30BF\u30A4\u30E0\u30A2\u30C3\u30D7\u51E6\u7406\u306B\u56DE\u308B\u306E\u3067\u3053\u3053\u306B\u306F\u6765\u306A\u3044\u60F3\u5B9A\u306E\u4FDD\u967A\n}\nlet DIFFICULTY_MISS_PENALTY = { easy: 20, normal: 25, hard: 30 };\nlet DIFFICULTY_TIMEOUT_EXTRA = { easy: 0, normal: 5, hard: 10 };\nlet A_LOCK_MS = 2000;\nlet A_NEXT_DELAY = 1100;\nlet A_LASTSPURT = 3;\nlet B_LAND_DELAY = 3000;\nlet B_FORCE_LAND = 7000;\nlet OJAMA_UNIT = 5;\nlet OJAMA_MAX_PER_BOARD = 3;\nlet SP_MAX = 6;\nlet SP_BIG = { dmg: 15, oj: 1 };\nlet SP_HEAL = 30;\nlet SP_SHIELD_MS = 5000;\nlet PINCH_HP = 30;\nlet PINCH_MUL = 1.3;\nlet MULTI_ATK = { 3: 0.7, 4: 0.55 };\nlet RATING_K = 32;\nlet C_HP = { decay: 0.5, recover: 0.5, miss: 0.6 };\nlet C_UNITE = { dmg: 10, oj: 1, win: 3000, cool: 8000, combo: 3 };\nlet C_FOLLOW = { win: 3000, mul: 1.2 };\nlet handiDmgMul = h => 1 - 0.15 * (h || 0);\nlet handiPtsMul = h => 1 + 0.1 * (h || 0);\nlet BADGES = [\n  // g\uFF1A\u7CFB\u7D71\uFF08\u540C\u3058\u7CFB\u7D71\u306F\u4E00\u756A\u4E0A\u3060\u3051\u540D\u524D\u306E\u6A2A\u306B\u51FA\u3059\uFF09 r\uFF1A\u3081\u305A\u3089\u3057\u3055\uFF08\u5927\u304D\u3044\u307B\u3069\u5148\u306B\u51FA\u3059\uFF09 desc\uFF1A\u53D6\u308A\u65B9\n  { id: 'first', g: 'first', r: 1, icon: '\u{1F331}', label: '\u306F\u3058\u3081\u306E\u4E00\u6B69', desc: '\u521D\u3081\u3066\u52DD\u3064', test: st => (st.w || 0) >= 1 },\n  { id: 'lose50', g: 'lose', r: 2, icon: '\u{1F9F1}', label: '\u4E03\u8EE2\u3073\u516B\u8D77\u304D', desc: '\u8CA0\u305150\u56DE\uFF08\u305D\u308C\u3067\u3082\u7D9A\u3051\u305F\uFF01\uFF09', test: st => (st.l || 0) >= 50 },\n  { id: 'games100', g: 'games', r: 2, icon: '\u{1F4AF}', label: '\u767E\u6226\u932C\u78E8', desc: '100\u6226\u3059\u308B', test: st => (st.games || 0) >= 100 },\n  { id: 'rival20', g: 'rival', r: 2, icon: '\u{1F91D}', label: '\u6C38\u9060\u306E\u30E9\u30A4\u30D0\u30EB', desc: '\u540C\u3058\u76F8\u624B\u306820\u6226', test: st => Object.values(st.vs || {}).some(v => (v.w || 0) + (v.l || 0) + (v.d || 0) >= 20) },\n  { id: 'wide10', g: 'wide', r: 1, icon: '\u{1F30F}', label: '\u9854\u304C\u5E83\u3044', desc: '10\u4EBA\u4EE5\u4E0A\u3068\u5BFE\u6226', test: st => Object.keys(st.vs || {}).length >= 10 },\n  { id: 'dual', g: 'dual', r: 2, icon: '\u2696\uFE0F', label: '\u4E8C\u5200\u6D41', desc: 'A\u30FBB\u305D\u308C\u305E\u308C\u306710\u52DD', test: st => ((st.A || {}).w || 0) >= 10 && ((st.B || {}).w || 0) >= 10 },\n  { id: 'streak10', g: 'streak', r: 2, icon: '\u{1F525}', label: '10\u9023\u52DD', desc: '10\u9023\u52DD\u3059\u308B', test: st => (st.maxStreak || 0) >= 10 },\n  { id: 'streak30', g: 'streak', r: 4, icon: '\u{1F525}', label: '30\u9023\u52DD', desc: '30\u9023\u52DD\u3059\u308B', test: st => (st.maxStreak || 0) >= 30 },\n  { id: 'streak50', g: 'streak', r: 5, icon: '\u{1F525}', label: '50\u9023\u52DD', desc: '50\u9023\u52DD\u3059\u308B', test: st => (st.maxStreak || 0) >= 50 },\n  { id: 'perfect50', g: 'perfect', r: 1, icon: '\u2B50', label: 'Perfect 50\u56DE', desc: 'Perfect \u3092\u901A\u7B9750\u56DE', test: st => (st.perfects || 0) >= 50 },\n  { id: 'perfect100', g: 'perfect', r: 2, icon: '\u2B50', label: 'Perfect 100\u56DE', desc: 'Perfect \u3092\u901A\u7B97100\u56DE', test: st => (st.perfects || 0) >= 100 },\n  { id: 'perfect300', g: 'perfect', r: 3, icon: '\u{1F31F}', label: 'Perfect 300\u56DE', desc: 'Perfect \u3092\u901A\u7B97300\u56DE', test: st => (st.perfects || 0) >= 300 },\n  { id: 'perfect500', g: 'perfect', r: 4, icon: '\u{1F31F}', label: 'Perfect 500\u56DE', desc: 'Perfect \u3092\u901A\u7B97500\u56DE', test: st => (st.perfects || 0) >= 500 },\n  { id: 'perfect1000', g: 'perfect', r: 5, icon: '\u{1F451}', label: 'Perfect 1000\u56DE', desc: 'Perfect \u3092\u901A\u7B971000\u56DE', test: st => (st.perfects || 0) >= 1000 },\n  { id: 'comeback', g: 'comeback', r: 2, icon: '\u{1F504}', label: '\u9006\u8EE2\u52DD\u3061', desc: '\u4E0D\u5229\u306A\u5C55\u958B\u304B\u3089\u3072\u3063\u304F\u308A\u8FD4\u3057\u3066\u52DD\u3064', test: st => (st.comebacks || 0) >= 1 },\n  { id: 'comeback10', g: 'comeback', r: 4, icon: '\u{1F504}', label: '\u9006\u8EE2\u306E\u9B3C', desc: '\u9006\u8EE2\u52DD\u306110\u56DE', test: st => (st.comebacks || 0) >= 10 },\n  { id: 'master1700', g: 'master', r: 4, icon: '\u{1F451}', label: '\u56E0\u6570\u5206\u89E3\u30DE\u30B9\u30BF\u30FC', desc: '\u30EC\u30FC\u30C81700\u306B\u5230\u9054', test: st => (st.maxRating || 0) >= 1700 },\n  { id: 'tour1', g: 'tour', r: 3, icon: '\u{1F3C6}', label: '\u30AF\u30E9\u30B9\u738B', desc: '\u30AF\u30E9\u30B9\u5927\u4F1A\u3067\u512A\u52DD', test: st => (st.tourWins || 0) >= 1 },\n  { id: 'tour3', g: 'tour', r: 5, icon: '\u{1F3C6}', label: '\u4E09\u51A0\u738B', desc: '\u30AF\u30E9\u30B9\u5927\u4F1A\u30673\u56DE\u512A\u52DD', test: st => (st.tourWins || 0) >= 3 },\n  { id: 'flash', g: 'flash', r: 3, icon: '\u26A1', label: '\u5149\u901F\u306E\u56E0\u6570\u5206\u89E3', desc: '1\u554F\u30921\u79D2\u4EE5\u5185\u306B\u6B63\u89E3', test: st => st.bestMs != null && st.bestMs <= 1000 },\n  { id: 'combo20', g: 'combo', r: 3, icon: '\u{1F525}', label: '\u30B3\u30F3\u30DC\u8077\u4EBA', desc: '1\u8A66\u5408\u306720\u30B3\u30F3\u30DC', test: st => (st.maxCombo || 0) >= 20 },\n  { id: 'nomiss', g: 'nomiss', r: 3, icon: '\u{1F3AF}', label: '\u30CE\u30FC\u30DF\u30B9\u5B8C\u8D70', desc: 'B\u3067\u30DF\u30B9\u30FB\u6642\u9593\u5207\u308C0\u306E\u307E\u307E\u52DD\u3064', test: st => (st.nomissWins || 0) >= 1 },\n  { id: 'clutch', g: 'clutch', r: 3, icon: '\u{1FA78}', label: '\u30AE\u30EA\u30AE\u30EA\u30BB\u30FC\u30D5', desc: 'B\u3067\u4F53\u529B5%\u4EE5\u4E0B\u306B\u306A\u3063\u3066\u304B\u3089\u52DD\u3064', test: st => (st.clutchWins || 0) >= 1 },\n  { id: 'cancel500', g: 'cancel', r: 3, icon: '\u{1F6E1}\uFE0F', label: '\u9244\u58C1\u306E\u5B88\u308A', desc: '\u76F8\u6BBA\u3067\u6253\u3061\u6D88\u3057\u305F\u91CF\u304C\u901A\u7B97500', test: st => (st.cancelTotal || 0) >= 500 },\n  { id: 'ojama100', g: 'ojama', r: 3, icon: '\u{1F4A3}', label: '\u304A\u3058\u3083\u307E\u8077\u4EBA', desc: '\u304A\u3058\u3083\u307E\u30BF\u30A4\u30EB\u3092\u901A\u7B97100\u679A\u9001\u308B', test: st => (st.ojSent || 0) >= 100 },\n  { id: 'sp50', g: 'sp', r: 3, icon: '\u2728', label: '\u5FC5\u6BBA\u6280\u30DE\u30B9\u30BF\u30FC', desc: '\u5FC5\u6BBA\u6280\u3092\u901A\u7B9750\u56DE\u4F7F\u3046', test: st => (st.spUsed || 0) >= 50 },\n  { id: 'giant', g: 'giant', r: 4, icon: '\u{1F9B8}', label: '\u30B8\u30E3\u30A4\u30A2\u30F3\u30C8\u30AD\u30E9\u30FC', desc: '\u81EA\u5206\u3088\u308A\u30EC\u30FC\u30C8\u304C200\u4EE5\u4E0A\u9AD8\u3044\u76F8\u624B\u306B\u52DD\u3064', test: st => (st.giantWins || 0) >= 1 },\n  { id: 'survivor', g: 'survivor', r: 4, icon: '\u{1F3DD}\uFE0F', label: '\u30E9\u30B9\u30C8\u30B5\u30D0\u30A4\u30D0\u30FC', desc: '4\u4EBA\u6226\uFF08B\uFF09\u3067\u6700\u5F8C\u306E1\u4EBA\u307E\u3067\u751F\u304D\u6B8B\u3063\u3066\u52DD\u3064', test: st => (st.survivors || 0) >= 1 },\n  { id: 'shutout', g: 'shutout', r: 4, icon: '\u{1F977}', label: '\u5B8C\u5C01', desc: 'A\u3067\u76F8\u624B\u30920\u70B9\u306B\u3057\u3066\u52DD\u3064', test: st => (st.shutouts || 0) >= 1 },\n  { id: 'lv9', g: 'lv9', r: 4, icon: '\u{1F9E0}', label: 'Lv.9\u306E\u58C1', desc: 'Lv.9\u306E\u554F\u984C\u3092 Perfect \u3067\u6B63\u89E3', test: st => (st.lv9p || 0) >= 1 },\n  { id: 'otetsuki100', g: 'otetsuki', r: 2, icon: '\u{1F438}', label: '\u304A\u624B\u3064\u304D\u5927\u738B', desc: 'A\u3067\u304A\u624B\u3064\u304D\u901A\u7B97100\u56DE', test: st => (st.otetsuki || 0) >= 100 },\n  { id: 'handi', g: 'handi', r: 3, icon: '\u{1F381}', label: '\u30CF\u30F3\u30C7\u306A\u3093\u3066\u95A2\u4FC2\u306A\u3044', desc: '\u30CF\u30F3\u30C7\u2605\u2605\u2605\u306E\u76F8\u624B\u306B\u52DD\u3064', test: st => (st.handiWins || 0) >= 1 },\n  { id: 'games300', g: 'games', r: 4, icon: '\u{1F3EF}', label: '\u4FEE\u884C\u306E\u9053', desc: '300\u6226\u3059\u308B', test: st => (st.games || 0) >= 300 },\n  { id: 'master1600', g: 'master', r: 2, icon: '\u{1F320}', label: '\u671F\u5F85\u306E\u65B0\u661F', desc: '\u30EC\u30FC\u30C81600\u306B\u5230\u9054', test: st => (st.maxRating || 0) >= 1600 },\n  { id: 'master1900', g: 'master', r: 5, icon: '\u{1F409}', label: '\u4F1D\u8AAC\u306E\u56E0\u6570\u5206\u89E3\u5E2B', desc: '\u30EC\u30FC\u30C81900\u306B\u5230\u9054', test: st => (st.maxRating || 0) >= 1900 },\n  { id: 'combo30', g: 'combo', r: 4, icon: '\u{1F30B}', label: '\u30B3\u30F3\u30DC\u306E\u795E', desc: '1\u8A66\u5408\u306730\u30B3\u30F3\u30DC', test: st => (st.maxCombo || 0) >= 30 },\n  { id: 'cancel2000', g: 'cancel', r: 4, icon: '\u{1F3F0}', label: '\u96E3\u653B\u4E0D\u843D', desc: '\u76F8\u6BBA\u3067\u6253\u3061\u6D88\u3057\u305F\u91CF\u304C\u901A\u7B972000', test: st => (st.cancelTotal || 0) >= 2000 },\n  { id: 'ojama500', g: 'ojama', r: 4, icon: '\u{1F608}', label: '\u304A\u3058\u3083\u307E\u9B54\u738B', desc: '\u304A\u3058\u3083\u307E\u30BF\u30A4\u30EB\u3092\u901A\u7B97500\u679A\u9001\u308B', test: st => (st.ojSent || 0) >= 500 },\n  { id: 'nomiss10', g: 'nomiss', r: 4, icon: '\u{1F3AF}', label: '\u30CE\u30FC\u30DF\u30B9\u306E\u9054\u4EBA', desc: '\u30CE\u30FC\u30DF\u30B9\u5B8C\u8D70\u306710\u56DE\u52DD\u3064', test: st => (st.nomissWins || 0) >= 10 },\n  { id: 'wide30', g: 'wide', r: 3, icon: '\u{1F3AA}', label: '\u4EBA\u6C17\u8005', desc: '30\u4EBA\u4EE5\u4E0A\u3068\u5BFE\u6226', test: st => Object.keys(st.vs || {}).length >= 30 },\n  { id: 'tour10', g: 'tour', r: 5, icon: '\u{1F3DB}\uFE0F', label: '\u6BBF\u5802\u5165\u308A', desc: '\u30AF\u30E9\u30B9\u5927\u4F1A\u306710\u56DE\u512A\u52DD', test: st => (st.tourWins || 0) >= 10 },\n  { id: 'miracle', g: 'clutch', r: 5, icon: '\u{1F607}', label: '\u5947\u8DE1\u306E\u751F\u9084', desc: 'B\u3067\u4F53\u529B1%\u4EE5\u4E0B\u306B\u306A\u3063\u3066\u304B\u3089\u52DD\u3064', test: st => (st.miracleWins || 0) >= 1 },\n  { id: 'darkhorse', g: 'darkhorse', r: 5, icon: '\u{1F434}', label: '\u30C0\u30FC\u30AF\u30DB\u30FC\u30B9', desc: '\u51FA\u5834\u8005\u306E\u4E2D\u3067\u30EC\u30FC\u30C8\u304C\u3044\u3061\u3070\u3093\u4F4E\u3044\u306E\u306B\u5927\u4F1A\u3067\u512A\u52DD\uFF08\u8A18\u9332\u3042\u308A\u306E\u4EBA\u304C4\u4EBA\u4EE5\u4E0A\uFF09', test: st => (st.darkHorse || 0) >= 1 },\n  { id: 'daily7', g: 'daily', r: 2, icon: '\u{1F4C5}', label: '\u7686\u52E4\u8CDE', desc: '7\u65E5\u7D9A\u3051\u3066\u5BFE\u6226\u3059\u308B', test: st => (st.maxDayStreak || 0) >= 7 },\n  { id: 'daily30', g: 'daily', r: 4, icon: '\u{1F5D3}\uFE0F', label: '\u7D99\u7D9A\u306F\u529B\u306A\u308A', desc: '30\u65E5\u7D9A\u3051\u3066\u5BFE\u6226\u3059\u308B', test: st => (st.maxDayStreak || 0) >= 30 },\n  { id: 'sp3', g: 'sp3', r: 3, icon: '\u{1F4A5}', label: '\u5FC5\u6BBA\u6280\u4E09\u9023\u767A', desc: '1\u8A66\u5408\u3067\u5FC5\u6BBA\u6280\u30923\u56DE\u4F7F\u3046', test: st => (st.maxSpMatch || 0) >= 3 },\n  { id: 'revenge', g: 'revenge', r: 2, icon: '\u2694\uFE0F', label: '\u30EA\u30D9\u30F3\u30B8\u6210\u529F', desc: '\u524D\u306E\u8A66\u5408\u3067\u8CA0\u3051\u305F\u76F8\u624B\u306B\u52DD\u3064', test: st => (st.revenges || 0) >= 1 },\n  { id: 'calm', g: 'calm', r: 3, icon: '\u{1F9D8}', label: '\u51B7\u9759\u6C88\u7740', desc: 'A\u3067\u304A\u624B\u3064\u304D0\u306E\u307E\u307E\u30016\u554F\u4EE5\u4E0A\u53D6\u3063\u3066\u52DD\u3064', test: st => (st.calmWins || 0) >= 1 },\n  { id: 'flawless', g: 'flawless', r: 3, icon: '\u{1F48E}', label: '\u7121\u50B7\u306E\u52DD\u5229', desc: 'B\u3067\u653B\u6483\u3092\u4E00\u5EA6\u3082\u53D7\u3051\u305A\u306B\u52DD\u3064', test: st => (st.flawlessWins || 0) >= 1 },\n  { id: 'nosp', g: 'nosp', r: 3, icon: '\u{1F94B}', label: '\u5FC5\u6BBA\u6280\u3044\u3089\u305A', desc: 'B\u65B9\u5F0F\u3067\u5FC5\u6BBA\u6280\u3092\u4E00\u5EA6\u3082\u4F7F\u308F\u305A\u306B\u52DD\u3064', test: st => (st.noSpWins || 0) >= 1 },\n  { id: 'rgold', g: 'rank', r: 2, icon: '\u{1F947}', label: '\u30B4\u30FC\u30EB\u30C9\u306E\u98A8\u683C', desc: '\u30E9\u30F3\u30AF\u5E2F\u30B4\u30FC\u30EB\u30C9\uFF08\u30EC\u30FC\u30C81580\uFF09\u306B\u5230\u9054', test: st => (st.maxRating || 0) >= 1580 },\n  { id: 'rmaster', g: 'rank', r: 4, icon: '\u{1F451}', label: '\u9802\u70B9\u306B\u7ACB\u3064\u8005', desc: '\u30E9\u30F3\u30AF\u5E2F\u30DE\u30B9\u30BF\u30FC\uFF08\u30EC\u30FC\u30C81820\uFF09\u306B\u5230\u9054', test: st => (st.maxRating || 0) >= 1820 },\n  { id: 'bounty1', g: 'bounty', r: 2, icon: '\u{1F4B0}', label: '\u8CDE\u91D1\u7A3C\u304E', desc: '\u61F8\u8CDE\u91D1\u304C\u304B\u304B\u3063\u305F\u76F8\u624B\u306B\u52DD\u3064', test: st => (st.bountyWins || 0) >= 1 },\n  { id: 'bounty10', g: 'bounty', r: 4, icon: '\u{1F920}', label: '\u4F1D\u8AAC\u306E\u30CF\u30F3\u30BF\u30FC', desc: '\u61F8\u8CDE\u91D1\u304C\u304B\u304B\u3063\u305F\u76F8\u624B\u306B\u901A\u7B9710\u56DE\u52DD\u3064', test: st => (st.bountyWins || 0) >= 10 },\n  { id: 'wanted', g: 'wanted', r: 3, icon: '\u{1F4DC}', label: '\u304A\u5C0B\u306D\u8005', desc: '\u61F8\u8CDE\u91D150\u4EE5\u4E0A\u304C\u304B\u304B\u308B\uFF087\u9023\u52DD\uFF09', test: st => (st.maxStreak || 0) >= 7 },\n  { id: 'mis7', g: 'mis', r: 3, icon: '\u{1F4C6}', label: '\u30DF\u30C3\u30B7\u30E7\u30F3\u7686\u52E4', desc: '\u30C7\u30A4\u30EA\u30FC\u30DF\u30C3\u30B7\u30E7\u30F3\u30927\u65E5\u30B3\u30F3\u30D7\u30EA\u30FC\u30C8\u3059\u308B', test: st => (st.misDays || 0) >= 7 },\n  { id: 'lasthit', g: 'lasthit', r: 4, icon: '\u{1F5E1}\uFE0F', label: '\u30E9\u30B9\u30C8\u30A2\u30BF\u30C3\u30AB\u30FC', desc: '\u30AF\u30E9\u30B9\u5354\u529B\u30EC\u30A4\u30C9\u3067\u30DC\u30B9\u306B\u3068\u3069\u3081\u3092\u523A\u3059', test: st => (st.lastHits || 0) >= 1 },\n  // \u4ECA\u9031\u306E\u30DC\u30B9\n  { id: 'wk1', g: 'wk', r: 1, icon: '\u{1F5D3}\uFE0F', label: '\u521D\u9663', desc: '\u4ECA\u9031\u306E\u30DC\u30B9\u306B\u521D\u3081\u3066\u51FA\u6483\u3059\u308B', test: st => ((st.wk || {}).weeks || 0) >= 1 },\n  { id: 'wkst3', g: 'wkst', r: 2, icon: '\u{1F501}', label: '\u7686\u52E4\u306E\u6226\u58EB', desc: '\u4ECA\u9031\u306E\u30DC\u30B9\u306B3\u9031\u7D9A\u3051\u3066\u51FA\u6483', test: st => ((st.wk || {}).maxStreak || 0) >= 3 },\n  { id: 'wkst5', g: 'wkst', r: 3, icon: '\u{1F6E1}\uFE0F', label: '\u6B74\u6226\u306E\u6226\u58EB', desc: '\u4ECA\u9031\u306E\u30DC\u30B9\u306B5\u9031\u7D9A\u3051\u3066\u51FA\u6483', test: st => ((st.wk || {}).maxStreak || 0) >= 5 },\n  { id: 'wkst10', g: 'wkst', r: 5, icon: '\u{1F3EF}', label: '\u4E0D\u5C48\u306E\u5B88\u8B77\u8005', desc: '\u4ECA\u9031\u306E\u30DC\u30B9\u306B10\u9031\u7D9A\u3051\u3066\u51FA\u6483', test: st => ((st.wk || {}).maxStreak || 0) >= 10 },\n  { id: 'wkk1', g: 'wkk', r: 2, icon: '\u2694\uFE0F', label: '\u8A0E\u4F10\u968A', desc: '\u4ECA\u9031\u306E\u30DC\u30B9\u306E\u8A0E\u4F10\u306B\u53C2\u52A0\uFF08\u6483\u7834\u3055\u308C\u305F\u9031\u306B\u30C0\u30E1\u30FC\u30B8\u3092\u4E0E\u3048\u308B\uFF09', test: st => ((st.wk || {}).kills || 0) >= 1 },\n  { id: 'wkk5', g: 'wkk', r: 3, icon: '\u{1F396}\uFE0F', label: '\u8A0E\u4F10\u968A\u9577', desc: '\u4ECA\u9031\u306E\u30DC\u30B9\u306E\u8A0E\u4F10\u306B5\u56DE\u53C2\u52A0', test: st => ((st.wk || {}).kills || 0) >= 5 },\n  { id: 'wkk10', g: 'wkk', r: 4, icon: '\u{1F981}', label: '\u6551\u56FD\u306E\u82F1\u96C4', desc: '\u4ECA\u9031\u306E\u30DC\u30B9\u306E\u8A0E\u4F10\u306B10\u56DE\u53C2\u52A0', test: st => ((st.wk || {}).kills || 0) >= 10 },\n  { id: 'wkace', g: 'wkace', r: 3, icon: '\u{1F3C5}', label: '\u4ECA\u9031\u306E\u30A8\u30FC\u30B9', desc: '\u4ECA\u9031\u306E\u30DC\u30B9\u306E\u30C0\u30E1\u30FC\u30B8\u3067\u90311\u4F4D\u306B\u306A\u308B', test: st => ((st.wk || {}).ace || 0) >= 1 },\n  { id: 'wkace5', g: 'wkace', r: 5, icon: '\u{1F31F}', label: '\u7D76\u5BFE\u7684\u30A8\u30FC\u30B9', desc: '\u4ECA\u9031\u306E\u30DC\u30B9\u306E\u30C0\u30E1\u30FC\u30B8\u3067\u90311\u4F4D\u30925\u56DE', test: st => ((st.wk || {}).ace || 0) >= 5 },\n  { id: 'wkone', g: 'wkone', r: 3, icon: '\u{1F4A5}', label: '\u4E00\u6483\u5FC5\u6BBA', desc: '\u4ECA\u9031\u306E\u30DC\u30B9\u306B1\u56DE\u306E\u51FA\u6483\u3067600\u30C0\u30E1\u30FC\u30B8', test: st => ((st.wk || {}).best || 0) >= 600 },\n  { id: 'wkone2', g: 'wkone', r: 4, icon: '\u2604\uFE0F', label: '\u4F1A\u5FC3\u306E\u51FA\u6483', desc: '\u4ECA\u9031\u306E\u30DC\u30B9\u306B1\u56DE\u306E\u51FA\u6483\u30671200\u30C0\u30E1\u30FC\u30B8', test: st => ((st.wk || {}).best || 0) >= 1200 },\n  { id: 'wkdex3', g: 'wkdex', r: 3, icon: '\u{1F4D6}', label: '\u30DC\u30B9\u56F3\u9451', desc: '3\u7A2E\u985E\u306E\u30DC\u30B9\u306E\u8A0E\u4F10\u306B\u53C2\u52A0', test: st => Object.keys((st.wk || {}).boss || {}).length >= 3 },\n  { id: 'wkdex6', g: 'wkdex', r: 5, icon: '\u{1F432}', label: '\u30DC\u30B9\u30CF\u30F3\u30BF\u30FC', desc: '6\u7A2E\u985E\u3059\u3079\u3066\u306E\u30DC\u30B9\u306E\u8A0E\u4F10\u306B\u53C2\u52A0', test: st => Object.keys((st.wk || {}).boss || {}).length >= 6 },\n  { id: 'lb7', g: 'lb', r: 2, icon: '\u{1F3AB}', label: '\u30B9\u30BF\u30F3\u30D7\u30B3\u30F3\u30D7\u30EA\u30FC\u30C8', desc: '\u30ED\u30B0\u30A4\u30F3\u30DC\u30FC\u30CA\u30B9\u306E\u30AB\u30FC\u30C9\u30921\u679A\u5B8C\u6210\u3055\u305B\u308B\uFF087\u65E5\uFF09', test: st => ((st.login || {}).cards || 0) >= 1 },\n  { id: 'lb30', g: 'lb', r: 3, icon: '\u{1F3EB}', label: '\u3044\u3064\u3082\u306E\u9854', desc: '\u901A\u7B9730\u65E5\u30ED\u30B0\u30A4\u30F3', test: st => ((st.login || {}).n || 0) >= 30 },\n  { id: 'lb100', g: 'lb', r: 5, icon: '\u{1F338}', label: '\u5E38\u9023\u3055\u3093', desc: '\u901A\u7B97100\u65E5\u30ED\u30B0\u30A4\u30F3', test: st => ((st.login || {}).n || 0) >= 100 },\n  { id: 'wkchest1', g: 'wkchest', r: 2, icon: '\u{1F381}', label: '\u5B9D\u63A2\u3057', desc: '\u4ECA\u9031\u306E\u30DC\u30B9\u306E\u51FA\u6483\u4E2D\u306B\u5B9D\u7BB1\u3092\u958B\u3051\u308B', test: st => ((st.wk || {}).chests || 0) >= 1 },\n  { id: 'wkchest10', g: 'wkchest', r: 4, icon: '\u{1F3F4}\u200D\u2620\uFE0F', label: '\u30C8\u30EC\u30B8\u30E3\u30FC\u30CF\u30F3\u30BF\u30FC', desc: '\u5B9D\u7BB1\u3092\u901A\u7B9710\u500B\u958B\u3051\u308B', test: st => ((st.wk || {}).chests || 0) >= 10 },\n  { id: 'wksup1', g: 'wksup', r: 2, icon: '\u{1F4E3}', label: '\u7E01\u306E\u4E0B\u306E\u529B\u6301\u3061', desc: '\u4ECA\u9031\u306E\u30DC\u30B9\u306B\u30B5\u30DD\u30FC\u30BF\u30FC\u3067\u51FA\u6483', test: st => ((st.wk || {}).supRuns || 0) >= 1 },\n  { id: 'wksup100', g: 'wksup', r: 4, icon: '\u{1F3BA}', label: '\u540D\u30B5\u30DD\u30FC\u30BF\u30FC', desc: '\u5FDC\u63F4\u30DD\u30A4\u30F3\u30C8\u3092\u901A\u7B97100', test: st => ((st.wk || {}).sup || 0) >= 100 },\n  { id: 'tw10', g: 'tower', r: 2, icon: '\u{1F5FC}', label: '\u5854\u306E\u6311\u6226\u8005', desc: '\u6570\u7406\u306E\u5854\u306710\u968E\u3092\u7A81\u7834', test: st => ((st.tower || {}).best || 0) >= 10 },\n  { id: 'tw30', g: 'tower', r: 3, icon: '\u{1F3EF}', label: '\u5854\u306E\u719F\u7DF4\u8005', desc: '\u6570\u7406\u306E\u5854\u306730\u968E\u3092\u7A81\u7834', test: st => ((st.tower || {}).best || 0) >= 30 },\n  { id: 'tw50', g: 'tower', r: 5, icon: '\u{1F451}', label: '\u5854\u3092\u5236\u8987', desc: '\u6570\u7406\u306E\u5854\u306E50\u968E\u3067\u56E0\u6570\u306E\u738B\u3092\u5012\u3059', test: st => ((st.tower || {}).best || 0) >= 50 },\n  { id: 'tw70', g: 'tower', r: 5, icon: '\u{1F4D6}', label: '\u6570\u7406\u306E\u66F8\u306E\u7D99\u627F\u8005', desc: '\u6570\u7406\u306E\u5854\u306E\u7B2C\u4E00\u90E8\u3092\u30AF\u30EA\u30A2', test: st => ((st.tower || {}).best || 0) >= 70 },\n  { id: 'tw100', g: 'tower', r: 5, icon: '\u{1F30C}', label: '\u7D42\u308F\u308A\u306A\u304D\u63A2\u7A76\u8005', desc: '\u6570\u7406\u306E\u5854\u306E\u7B2C\u4E00\u90E8\u30923\u56DE\u30AF\u30EA\u30A2', test: st => ((st.tower || {}).endN || 0) >= 3 || ((st.tower || {}).best || 0) >= 100 },\n  { id:'hyper_slayer',g:'hyper_slayer',r:5,icon:'\u{1F30C}',label:'\u8D85\u5F71\u306E\u5F81\u670D\u8005',desc:'\u4E71\u5165\u30CF\u30A4\u30D1\u30FC\u30B4\u30FC\u30B9\u30C8\u306B\u521D\u52DD\u5229\uFF08\u6C38\u4E45\uFF09',test:st=>st.ghostTitles?.hyper_slayer===true },\n  { id:'ghost_up1',g:'ghost_up1',r:3,icon:'\u2694\uFE0F',label:'\u683C\u4E0A\u306E\u5F71\u3092\u7834\u308B\u8005',desc:'1\u30E9\u30F3\u30AF\u4E0A\u306E\u4E71\u5165\u30B4\u30FC\u30B9\u30C8\u306B\u521D\u52DD\u5229\uFF08\u6C38\u4E45\uFF09',test:st=>st.ghostTitles?.ghost_up1===true },\n  { id:'ghost_up2',g:'ghost_up2',r:4,icon:'\u{1F320}',label:'\u4E8C\u968E\u7D1A\u306E\u5F71\u3092\u8D85\u3048\u308B\u8005',desc:'2\u30E9\u30F3\u30AF\u4E0A\u306E\u4E71\u5165\u30B4\u30FC\u30B9\u30C8\u306B\u521D\u52DD\u5229\uFF08\u6C38\u4E45\uFF09',test:st=>st.ghostTitles?.ghost_up2===true },\n  { id: 'wkrage', g: 'wkrage', r: 4, icon: '\u{1F624}', label: '\u6012\u308A\u3092\u93AE\u3081\u3057\u8005', desc: '\u6012\u3063\u3066\u5C45\u5EA7\u3063\u305F\u30DC\u30B9\u306E\u8A0E\u4F10\u306B\u53C2\u52A0', test: st => ((st.wk || {}).rageKills || 0) >= 1 },\n  { id: 'wklast', g: 'wklast', r: 4, icon: '\u{1F5E1}\uFE0F', label: '\u8A0E\u4F10\u306E\u4E00\u6483', desc: '\u4ECA\u9031\u306E\u30DC\u30B9\u306B\u3068\u3069\u3081\u3092\u523A\u3059', test: st => ((st.wk || {}).lastHit || 0) >= 1 },\n  { id: 'alllv', g: 'alllv', r: 5, icon: '\u{1F308}', label: '\u30AA\u30FC\u30EB\u30EC\u30D9\u30EB\u5236\u8987', desc: 'Lv.1\u301CLv.9 \u3059\u3079\u3066\u3067 Perfect \u3092\u53D6\u308B', test: st => ((st.lvP || 0) & 1022) === 1022 },\n];\nfunction hashSeed(s) {\n  let h = 1779033703 ^ s.length;\n  for (let i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }\n  h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909);\n  return (h ^= h >>> 16) >>> 0;\n}\nfunction mulberry32(a) {\n  return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };\n}\nfunction withSeed(key, fn) {\n  const orig = Math.random;\n  Math.random = mulberry32(hashSeed(key));\n  try { return fn(); } finally { Math.random = orig; }\n}\nfunction makeBank(seed, tileCount) {\n  const lists = {}, seen = {}, levels = {};\n  return {\n    get(level, k) {\n      const L = lists[level] || (lists[level] = []);\n      const S = seen[level] || (seen[level] = new Set());\n      while (L.length <= k) {\n        const i = L.length;\n        const b = withSeed(`${seed}:${level}:${i}`, () => buildBoard(level, S, tileCount));\n        b.tiles = b.tiles.map((t, j) => ({ ...t, id: `q${level}_${i}_${j}` }));\n        L.push(b);\n      }\n      return L[k];\n    },\n    level(n) { // n \u554F\u76EE\uFF081\u59CB\u307E\u308A\uFF09\u306E\u30EC\u30D9\u30EB\n      if (levels[n] == null) levels[n] = withSeed(`${seed}:lv:${n}`, () => pickLevelForQuestion(n));\n      return levels[n];\n    },\n  };\n}\nfunction problemForA(bank, q) {\n  const lv = bank.level(q + 1);\n  let k = 0;\n  for (let i = 0; i < q; i++) if (bank.level(i + 1) === lv) k++;\n  return { level: lv, k, ...bank.get(lv, k) };\n}\nfunction addOjama(tiles, poly, level, n) {\n  const out = [...tiles];\n  let guard = 0, added = 0;\n  while (added < n && guard < 300) {\n    guard++;\n    const f = foreignFactor(level);\n    const key = factorKey(f);\n    if (out.some(t => factorKey(t.factor) === key)) continue;\n    if (out.some(t => polyEqual(multiply(t.factor, f), poly))) continue;\n    const pos = Math.floor(Math.random() * (out.length + 1));\n    out.splice(pos, 0, { id: 'oj_' + Math.random().toString(36).slice(2), factor: f, ojama: true });\n    added++;\n  }\n  return out;\n}\nfunction attackFor(judgeLabel, combo) {\n  let dmg = 0, oj = 0;\n  // ver.5.7 \u3067\u5F31\u3081\u305F\uFF083\u30B3\u30F3\u30DC\u76EE\u304B\u30892\u30FB4\u30FB6\u30FB8\u3001\u6700\u59278\u30025\u30B3\u30F3\u30DC\u3054\u3068\u306B+5\u3002\u304A\u3058\u3083\u307E\u306F Perfect \u30671\u679A\uFF09\n  if (combo >= 3) dmg += Math.min(8, 2 * (combo - 2));\n  if (combo > 0 && combo % 5 === 0) dmg += 5;\n  if (judgeLabel === 'Perfect') oj += 1;\n  return { dmg, oj };\n}\nfunction scoreA(bank, claims, players, N, hc) {\n  const sc = {}, cb = {}, best = {};\n  players.forEach(p => { sc[p] = 0; cb[p] = 0; best[p] = 0; });\n  const log = [];\n  for (let q = 0; ; q++) {\n    const c = claims && claims[q];\n    if (!c) break;\n    const lv = bank.level(q + 1);\n    if (c.uid in sc) {\n      const w = c.uid, mult = 1 + cb[w] * 0.1;\n      const spurt = N && q >= N - A_LASTSPURT ? 2 : 1;\n      const pts = Math.round((LEVEL_POINTS[lv] || 10) * mult * spurt * handiPtsMul(hc && hc[w]));\n      sc[w] += pts; cb[w]++; best[w] = Math.max(best[w], cb[w]);\n      players.forEach(p => { if (p !== w) cb[p] = 0; });\n      log.push({ q, w, pts, at: c.at, spurt: spurt > 1 });\n    } else {\n      players.forEach(p => { cb[p] = 0; });\n      log.push({ q, w: null, at: c.at });\n    }\n  }\n  return { sc, cb, best, log };\n}\nlet qStartA = (claims, q, startAt) => q === 0 ? startAt : ((claims[q - 1] && claims[q - 1].at) || startAt) + A_NEXT_DELAY;\nfunction ratingDelta(myR, opps) {\n  let d = 0;\n  opps.forEach(o => { const E = 1 / (1 + Math.pow(10, (o.r - myR) / 400)); d += RATING_K * (o.s - E); });\n  return d;\n}\nfunction bTarget(me, ids, live, ko, tm) {\n  const alive = ids.filter(u => u !== me && !(tm && tm[u] === tm[me]) && !(ko && ko[u]) && !(live[u] && live[u].st === 'ko'));\n  if (!alive.length) return null;\n  const L = u => live[u] || {};\n  alive.sort((a, b) => (L(b).c || 0) - (L(a).c || 0) || (L(b).score || 0) - (L(a).score || 0) || (a < b ? -1 : 1));\n  return alive[0];\n}\nfunction createBEngine(o) {\n  const s = { hp: 100, c: 0, served: {}, score: 0, combo: 0, best: 0, pend: [], ojNext: 0, seenEv: {}, sent: 0, resolving: false, over: false, ko: false,\n    lastT: Date.now(), cur: null, qStart: 0, warned: false, sp: 0, shieldUntil: 0, perfects: 0, behind: false, hist: [], pushT: 0, nextAt: null, cancelTotal: 0, ojSent: 0, spUsed: 0, minHp: 100, dmgTaken: 0 };\n  const fx = (t, p) => { if (o.fx) o.fx(t, p); };\n  const snd = (k, rate) => { if (o.sound) o.sound.play(k, rate); };\n  const mul = handiDmgMul(o.hc);\n  const r1 = v => Math.round(v * 100) / 100;\n  const E = { s };\n  /* C\uFF1A\u4F53\u529B\u306F\u30C1\u30FC\u30E0\u30671\u672C\uFF08rooms/<code>/thp/<gid>/<\u30C1\u30FC\u30E0>\uFF09\u3002\u81EA\u5206\u306E\u5897\u6E1B\u306F\u305F\u3081\u3066\u3001\u307E\u3068\u3081\u3066 transaction \u3067\u8DB3\u3059 */\n  const tm = o.tm || null, TC = !!tm, myT = TC ? tm[o.uid] : null;\n  const mate = TC ? o.ids.find(u => u !== o.uid && tm[u] === myT) : null;\n  s.pool = 100; s.dq = 0; s.flushT = 0; s.lastOkAt = 0; s.lastMissAt = 0; s.uniteAt = 0; s.unites = 0; s.covers = 0;\n  const poolRef = TC ? fref(`rooms/${o.code}/thp/${o.gid}/${myT}`) : null;\n  const syncHp = () => { if (TC) s.hp = Math.max(0, Math.min(100, r1(s.pool + s.dq))); };\n  const addHp = x => { if (!TC) { s.hp = Math.max(0, Math.min(100, r1(s.hp + x))); return; } s.dq += x; syncHp(); };\n  E.flush = force => {\n    if (!TC || !s.dq) return;\n    const t = Date.now();\n    if (!force && t - s.flushT < 300 && Math.abs(s.dq) < 5) return;\n    s.flushT = t; const d = s.dq; s.dq = 0;\n    poolRef.transaction(v => Math.max(0, Math.min(100, r1((v == null ? 100 : v) + d)))).catch(() => {});\n  };\n  let poolFn = null;\n  if (TC) { poolFn = snap => { const v = snap.val(); s.pool = v == null ? 100 : v; syncHp(); }; poolRef.on('value', poolFn); }\n  E.dispose = () => { if (poolFn) poolRef.off('value', poolFn); };\n  E.mate = mate; E.team = myT;\n  const mateL = () => (mate && ((o.view().live || {})[mate])) || {};\n  E.shield = () => Date.now() < s.shieldUntil;\n  E.pinch = () => s.hp <= PINCH_HP;\n  E.target = () => { const v = o.view(); return bTarget(o.uid, o.ids, v.live || {}, v.ko || {}, o.tm); };\n  E.serve = () => {\n    const n = s.c + 1, lv = o.bank.level(n), k = s.served[lv] || 0;\n    s.served[lv] = k + 1;\n    const b = o.bank.get(lv, k);\n    let tiles = b.tiles.map(t => ({ ...t }));\n    const oj = Math.min(OJAMA_MAX_PER_BOARD, s.ojNext);\n    if (oj > 0) { tiles = addOjama(tiles, b.poly, lv, oj); s.ojNext -= oj; fx('ojama', oj); }\n    s.cur = { level: lv, k, poly: b.poly, tiles, oj };\n    s.qStart = Date.now(); s.warned = false;\n  };\n  E.writeLive = force => {\n    const t = Date.now();\n    if (!force && t - s.pushT < 400) return;\n    s.pushT = t;\n    const pd = s.pend.reduce((a, p) => a + p.dmg, 0), po = s.pend.reduce((a, p) => a + p.oj, 0);\n    fref(`rooms/${o.code}/live/${o.gid}/${o.uid}`).set({ hp: Math.round(s.hp * 10) / 10, c: s.c, score: s.score, combo: s.combo, pd, po, sp: s.sp, sh: E.shield() ? 1 : 0,\n      lv: s.cur ? s.cur.level : 1, k: s.cur ? s.cur.k : 0, oj: s.cur ? s.cur.oj : 0, st: s.ko ? 'ko' : s.over ? 'over' : 'play', ...(TC ? { ok: s.lastOkAt, ms: s.lastMissAt, un: s.uniteAt } : {}) }).catch(() => {});\n    E.flush(force);\n  };\n  E.knockout = () => {\n    if (s.over) return;\n    s.over = true; s.ko = true;\n    if (TC) { s.dq = -200; E.flush(true); }\n    s.hp = 0;\n    E.writeLive(true);\n    fref(`rooms/${o.code}/ko/${o.gid}/${o.uid}`).transaction(cur => cur ? undefined : { at: TSV() }).catch(() => {});\n    fx('ko');\n  };\n  const damage = x => {\n    if (x <= 0) return;\n    addHp(-x);\n    s.minHp = Math.min(s.minHp, s.hp);\n    if (s.hp <= 0) E.knockout();\n  };\n  /* \u5C4A\u3044\u305F\u653B\u6483\u3092\u53D7\u3051\u53D6\u308B\uFF08\u30B7\u30FC\u30EB\u30C9\u4E2D\u306F\u306F\u306D\u8FD4\u3059\uFF09 */\n  E.receive = evs => {\n    if (!evs) return;\n    let any = false;\n    Object.entries(evs).forEach(([k, e]) => {\n      if (s.seenEv[k] || !e) return;\n      s.seenEv[k] = 1;\n      if (s.over) return;\n      if (e.cover) { const c = coverPend(e.cover); if (c > 0) { fx('covered', { from: e.from, units: c }); E.writeLive(true); } return; }\n      if (E.shield()) { fx('blocked', e); return; }\n      const dmg = Math.round((e.dmg || 0) * mul);\n      s.pend.push({ dmg, oj: e.oj || 0, t: Date.now(), from: e.from });\n      any = true;\n      snd('buzz'); fx('incoming', { dmg, oj: e.oj || 0, from: e.from, sp: e.sp });\n    });\n    if (any) E.writeLive(true);\n  };\n  /* \u4E88\u544A\u6642\u9593\u3092\u904E\u304E\u305F\u653B\u6483\u3092\u843D\u3068\u3059 */\n  E.land = forceAll => {\n    const t = Date.now();\n    let dmg = 0, oj = 0;\n    s.pend = s.pend.filter(p => {\n      if (forceAll || t - p.t >= B_LAND_DELAY) { dmg += p.dmg; oj += p.oj; return false; }\n      return true;\n    });\n    if (E.shield()) { if (dmg || oj) fx('blocked', { dmg, oj }); return; }\n    if (oj > 0) s.ojNext += oj;\n    if (dmg > 0 || oj > 0) { s.dmgTaken += dmg + oj; snd('hit'); fx('hit', { dmg, oj }); }\n    damage(dmg);\n  };\n  /* C\uFF1A\u4EF2\u9593\u304C\u4EE3\u308F\u308A\u306B\u76F8\u6BBA\u3057\u3066\u304F\u308C\u305F\uFF08units \u3076\u3093\u4E88\u544A\u3092\u6E1B\u3089\u3059\uFF09 */\n  const coverPend = units => {\n    let done = 0;\n    for (const p of s.pend) {\n      if (units <= 0) break;\n      const pu = p.dmg + p.oj * OJAMA_UNIT, c = Math.min(units, pu);\n      units -= c; done += c; let r = c;\n      const d = Math.min(p.dmg, r); p.dmg -= d; r -= d;\n      if (r > 0) p.oj = Math.max(0, p.oj - Math.ceil(r / OJAMA_UNIT));\n    }\n    s.pend = s.pend.filter(p => p.dmg > 0 || p.oj > 0);\n    return done;\n  };\n  /* \u81EA\u5206\u306E\u653B\u6483\uFF1A\u307E\u305A\u5C4A\u3044\u3066\u3044\u308B\u653B\u6483\u3092\u76F8\u6BBA\u3057\u3001\u6B8B\u308A\u30921\u4F4D\u306E\u4EBA\u306B\u9001\u308B */\n  E.sendAttack = (out, isSp) => {\n    let units = out.dmg + out.oj * OJAMA_UNIT;\n    if (units <= 0) return;\n    const pinch = E.pinch();\n    if (pinch) units = Math.round(units * PINCH_MUL);\n    // C\uFF1A\u4EF2\u9593\u304C\u30DF\u30B9\u3057\u305F\u76F4\u5F8C\u306F\u30D5\u30A9\u30ED\u30FC\uFF08\u653B\u64831.2\u500D\uFF09\n    const follow = TC && !isSp && mateL().ms && fbNow() - mateL().ms <= C_FOLLOW.win;\n    if (follow) units = Math.round(units * C_FOLLOW.mul);\n    let cancelled = 0;\n    for (const p of s.pend) {\n      if (units <= 0) break;\n      const pu = p.dmg + p.oj * OJAMA_UNIT;\n      const c = Math.min(units, pu);\n      units -= c; cancelled += c;\n      let r = c;\n      const d = Math.min(p.dmg, r); p.dmg -= d; r -= d;\n      if (r > 0) p.oj = Math.max(0, p.oj - Math.ceil(r / OJAMA_UNIT));\n    }\n    s.pend = s.pend.filter(p => p.dmg > 0 || p.oj > 0);\n    // C\uFF1A\u4EF2\u9593\u306B\u5C4A\u3044\u3066\u3044\u308B\u653B\u6483\u3082\u30AB\u30D0\u30FC\uFF08\u81EA\u5206\u306E\u5206\u3092\u76F8\u6BBA\u3057\u305F\u3042\u3068\u306E\u6B8B\u308A\u3067\uFF09\n    let covered = 0;\n    if (TC && units > 0 && mate) {\n      const ml = mateL(), mp = (ml.pd || 0) + (ml.po || 0) * OJAMA_UNIT;\n      if (mp > 0 && ml.st === 'play') {\n        covered = Math.min(units, mp); units -= covered; s.covers += covered;\n        const key = String(Date.now()).padStart(15, '0') + '_' + Math.random().toString(36).slice(2, 7);\n        fref(`rooms/${o.code}/ev/${o.gid}/${mate}/${key}`).set({ cover: covered, from: o.uid, at: TSV() }).catch(() => {});\n      }\n    }\n    const to = units > 0 ? E.target() : null;\n    let dmg = 0, oj = 0;\n    if (to) {\n      // 3\u4EBA\u4EE5\u4E0A\u306E\u3068\u304D\u306F\u30011\u4F4D\u306B\u653B\u6483\u304C\u96C6\u4E2D\u3057\u3059\u304E\u306A\u3044\u3088\u3046\u306B\u5C11\u3057\u5F31\u3081\u308B\n      const v = o.view(), alive = o.ids.filter(u => !((v.ko || {})[u]) && !(((v.live || {})[u] || {}).st === 'ko')).length;\n      if (!TC) units = Math.max(1, Math.round(units * (MULTI_ATK[alive] || 1)));\n      oj = Math.min(out.oj, Math.floor(units / OJAMA_UNIT));\n      dmg = units - oj * OJAMA_UNIT;\n      const key = String(Date.now()).padStart(15, '0') + '_' + Math.random().toString(36).slice(2, 7);\n      fref(`rooms/${o.code}/ev/${o.gid}/${to}/${key}`).set({ dmg, oj, from: o.uid, sp: isSp ? 1 : 0, at: TSV() }).catch(() => {});\n      s.sent += units; s.ojSent += oj;\n      snd('send');\n    }\n    s.cancelTotal += cancelled + covered;\n    fx('send', { dmg, oj, to, cancelled, pinch, covered, follow, unite: isSp === 'unite' });\n  };\n  E.answer = ok => {\n    if (s.resolving || s.over || !s.cur) return null;\n    s.resolving = true;\n    const ms = Date.now() - s.qStart;\n    const cur = s.cur;\n    if (ok) {\n      const j = getJudgment(ms);\n      const mult = 1 + s.combo * 0.1, g = Math.round((LEVEL_POINTS[cur.level] || 10) * mult);\n      const rec = TC ? j.recover * C_HP.recover : j.recover;\n      const raw = s.hp + rec, over = Math.max(0, Math.round(raw - 100));\n      addHp(rec);\n      s.score += g + over; s.combo++; s.best = Math.max(s.best, s.combo); s.c++;\n      const pe = j.label === 'Perfect' || j.label === 'Excellent';\n      s.sp = Math.min(SP_MAX, s.sp + 1 + (pe ? 1 : 0));\n      if (j.label === 'Perfect') s.perfects++;\n      s.hist.push({ lv: cur.level, k: cur.k, ok: true, ms, j: j.label });\n      snd('ok', 1 + Math.min(s.combo, 15) * 0.035); if (pe) snd('speed'); if (s.combo % 5 === 0) snd('combo');\n      E.sendAttack(attackFor(j.label, s.combo));\n      if (TC) {\n        // \u5408\u4F53\u653B\u6483\uFF1A2\u4EBA\u3068\u30823\u30B3\u30F3\u30DC\u4EE5\u4E0A\u30923\u79D2\u4EE5\u5185\u306B\u305D\u308D\u3048\u305F\uFF088\u79D2\u306B1\u56DE\u307E\u3067\uFF09\n        const ml = mateL(), t = fbNow();\n        if (s.combo >= C_UNITE.combo && (ml.combo || 0) >= C_UNITE.combo && ml.ok && t - ml.ok <= C_UNITE.win && t - Math.max(s.uniteAt, ml.un || 0) > C_UNITE.cool && ml.st === 'play') {\n          s.uniteAt = t; s.unites++;\n          fx('unite', { mate });\n          E.sendAttack({ dmg: C_UNITE.dmg, oj: C_UNITE.oj }, 'unite');\n        }\n        s.lastOkAt = t;\n      }\n      E.writeLive(true);\n      if (TC ? s.c + (mateL().c || 0) >= o.N * 2 : s.c >= o.N) { s.over = true; E.writeLive(true); if (o.onClear) o.onClear(o.uid); return { ok: true, judge: j, gain: g + over, clear: true }; }\n      s.nextAt = Date.now() + 420;\n      return { ok: true, judge: j, gain: g + over };\n    }\n    snd('buzz');\n    s.combo = 0;\n    s.hist.push({ lv: cur.level, k: cur.k, ok: false, ms });\n    if (TC) s.lastMissAt = fbNow();\n    damage(Math.round((DIFFICULTY_MISS_PENALTY[o.diff] || 20) * mul * (TC ? C_HP.miss : 1)));\n    E.writeLive(true);\n    s.nextAt = Date.now() + 420;\n    return { ok: false };\n  };\n  E.next = () => {\n    E.land(false);\n    if (s.over) return;\n    E.serve();\n    s.resolving = false;\n    E.writeLive(true);\n    fx('next');\n  };\n  E.special = kind => {\n    if (s.over || s.sp < SP_MAX) return false;\n    s.sp = 0; s.spUsed++;\n    snd('special');\n    if (kind === 'big') E.sendAttack({ dmg: SP_BIG.dmg, oj: SP_BIG.oj }, true);\n    else if (kind === 'heal') addHp(SP_HEAL);\n    else if (kind === 'shield') { s.shieldUntil = Date.now() + SP_SHIELD_MS; s.pend = []; }\n    fx('special', kind);\n    E.writeLive(true);\n    return true;\n  };\n  /* \u89B3\u6226\u8005\u306E\u5FDC\u63F4\uFF1A\u4F53\u529B\u3092\u5C11\u3057\u56DE\u5FA9 */\n  E.cheer = h => { if (s.over) return false; addHp(h); E.writeLive(true); return true; };\n  /* 100\u30DF\u30EA\u79D2\u3054\u3068\u306B\u547C\u3076\uFF1A\u4F53\u529B\u306E\u81EA\u7136\u6E1B\u5C11\u30FB\u6642\u9593\u5207\u308C\u30FB\u4E88\u544A\u306E\u6642\u9593\u5207\u308C */\n  E.tick = () => {\n    const nowT = Date.now(), dt = nowT - s.lastT; s.lastT = nowT;\n    if (s.over) return;\n    if (s.nextAt && nowT >= s.nextAt) { s.nextAt = null; E.next(); if (s.over) return; }\n    if (!s.resolving) addHp(-dt / 1000 * mul * (TC ? C_HP.decay : 1));\n    if (s.pend.some(p => nowT - p.t >= B_FORCE_LAND)) {\n      const keep = []; let dmg = 0, oj = 0;\n      s.pend.forEach(p => { if (nowT - p.t >= B_FORCE_LAND) { dmg += p.dmg; oj += p.oj; } else keep.push(p); });\n      s.pend = keep;\n      if (!E.shield()) { s.ojNext += oj; s.dmgTaken += dmg + oj; if (dmg) { snd('hit'); fx('hit', { dmg, oj }); } damage(dmg); if (s.over) return; }\n    }\n    const qe = nowT - s.qStart;\n    if (!s.resolving && qe >= QUESTION_TIMEOUT_MS - 5000 && !s.warned) { s.warned = true; if (o.sound) snd('buzz'); }\n    if (!s.resolving && qe >= QUESTION_TIMEOUT_MS) {\n      s.resolving = true; s.combo = 0;\n      s.hist.push({ lv: s.cur.level, k: s.cur.k, ok: false, timeout: true, ms: qe });\n      fx('timeout');\n      if (TC) s.lastMissAt = fbNow();\n      damage(Math.round((DIFFICULTY_TIMEOUT_EXTRA[o.diff] || 0) * mul * (TC ? C_HP.miss : 1)));\n      if (s.over) return;\n      s.nextAt = nowT + 420;\n    }\n    s.minHp = Math.min(s.minHp, s.hp);\n    if (s.hp <= 0) { E.knockout(); return; }\n    // \u9006\u8EE2\u52DD\u3061\u306E\u5224\u5B9A\u7528\uFF1A\u30D4\u30F3\u30C1\u306B\u306A\u3063\u305F\u3001\u307E\u305F\u306F1\u4F4D\u306B3\u554F\u4EE5\u4E0A\u5DEE\u3092\u3064\u3051\u3089\u308C\u305F\n    if (!s.behind) {\n      const v = o.view(), live = v.live || {};\n      const lead = Math.max(0, ...o.ids.filter(u => u !== o.uid && !(TC && tm[u] === myT)).map(u => (live[u] && live[u].c) || 0));\n      if (s.hp <= PINCH_HP || lead - s.c >= 3) s.behind = true;\n    }\n    E.writeLive(false);\n  };\n  E.serve();\n  return E;\n}\nreturn ({makeBank,createBEngine,scoreA,problemForA,getJudgment,polyEqual,multiply,DIFFICULTY_CONFIG,qStartA,A_LOCK_MS,A_NEXT_DELAY,QUESTION_TIMEOUT_MS,ratingDelta,BADGES});\n");
      var script = { runInNewContext: (c) => makeRuntime(c.Math, c.Date, c.fref, c.TSV, c.fbNow) };
      var clone = (x) => JSON.parse(JSON.stringify(x));
      function runtime(match) {
        var _a;
        match.seq || (match.seq = {});
        match.claims || (match.claims = []);
        match.locks || (match.locks = {});
        match.states || (match.states = {});
        let time = match.time;
        const live = {}, ko = {}, events = {}, engines = {};
        let rng = match.rng || 1;
        const math = Object.create(Math);
        math.random = () => {
          rng = Math.imul(rng, 1664525) + 1013904223 >>> 0;
          return rng / 4294967296;
        };
        class Clock extends Date {
          static now() {
            return time;
          }
        }
        const fref = (p) => {
          const [, , field, , uid, key] = p.split("/");
          const put = (v) => {
            if (field === "live") live[uid] = v;
            if (field === "ko") ko[uid] = v;
            if (field === "ev") (events[uid] || (events[uid] = {}))[key] = v;
          };
          return {
            set(v) {
              put(v);
              return Promise.resolve();
            },
            transaction(fn) {
              const v = fn(ko[uid]);
              if (v !== void 0) put(v);
              return Promise.resolve({ committed: v !== void 0 });
            }
          };
        };
        const api = script.runInNewContext(
          { Math: math, Date: Clock, fref, TSV: () => time, fbNow: () => time },
          { timeout: 1e3 }
        );
        const conf = api.DIFFICULTY_CONFIG[match.difficulty], bank = api.makeBank(match.seed, conf.tileCount);
        let winner = null;
        let visualReady = false;
        for (const uid of match.ids) {
          engines[uid] = api.createBEngine({
            code: match.id,
            gid: match.id,
            uid,
            ids: match.ids,
            bank,
            N: conf.clearCount,
            diff: match.difficulty,
            hc: 0,
            view: () => ({
              live: Object.fromEntries(
                match.ids.map((u) => {
                  var _a2, _b;
                  return [
                    u,
                    { ...(_a2 = engines[u]) == null ? void 0 : _a2.s, st: ((_b = engines[u]) == null ? void 0 : _b.s.ko) ? "ko" : "play" }
                  ];
                })
              ),
              ko
            }),
            fx: (type, payload) => {
              if (!visualReady || !["incoming", "hit", "blocked", "special"].includes(type))
                return;
              match.visualSequence = (match.visualSequence || 0) + 1;
              match.visualEvents = [
                ...match.visualEvents || [],
                {
                  id: match.visualSequence,
                  uid,
                  type,
                  at: time,
                  payload: payload != null ? payload : null
                }
              ].slice(-24);
            },
            onClear: (u) => {
              winner = u;
            }
          });
          if ((_a = match.states) == null ? void 0 : _a[uid])
            Object.assign(engines[uid].s, clone(match.states[uid]));
          if (engines[uid].s.ko) ko[uid] = { at: time };
        }
        visualReady = true;
        const receive = () => {
          for (const u of match.ids) {
            engines[u].receive(events[u]);
            delete events[u];
          }
        };
        function advance(now) {
          if (now < time) throw Error("CLOCK_REVERSED");
          while (time < now && !winner) {
            time = Math.min(now, time + 100);
            for (const e of Object.values(engines)) e.tick();
            receive();
            const alive = match.ids.filter((u) => !engines[u].s.ko);
            if (alive.length === 1) winner = alive[0];
          }
        }
        const saved = () => {
          match.time = time;
          match.rng = rng;
          match.states = Object.fromEntries(
            match.ids.map((u) => [u, clone(engines[u].s)])
          );
          return winner;
        };
        return {
          api,
          bank,
          engines,
          advance,
          saved,
          receive,
          setTime: (t) => {
            time = t;
          }
        };
      }
      function begin(id, difficulty, mode, ids, seed, now) {
        const m = {
          id,
          difficulty,
          mode,
          ids,
          seed,
          time: now,
          startAt: now,
          claims: [],
          locks: {},
          states: {},
          seq: {},
          rng: 1
        };
        if (mode === "B") runtime(m).saved();
        return m;
      }
      function step(match, uid, command, now) {
        var _a, _b;
        const m = clone(match), rt = runtime(m), { api } = rt;
        if (now - m.time > 36e5) throw Error("MATCH_EXPIRED");
        if (now < m.time) throw Error("CLOCK_REVERSED");
        if (m.result) return m;
        if (!m.ids.includes(uid)) throw Error("NOT_PARTICIPANT");
        if (m.mode === "B") {
          rt.advance(now);
          const winner = rt.saved();
          if (winner) {
            m.result = { winner, reason: "ko" };
            return m;
          }
          if (command.type === "answer") {
            const s = rt.engines[uid].s;
            if (s.resolving || s.over || command.question !== `${s.cur.level}:${s.cur.k}`)
              throw Error("STALE_QUESTION");
            const fs = (_a = command.tiles) == null ? void 0 : _a.map(
              (id) => {
                var _a2;
                return (_a2 = s.cur.tiles.find((t) => t.id === id)) == null ? void 0 : _a2.factor;
              }
            );
            if ((fs == null ? void 0 : fs.length) !== 2 || command.tiles[0] === command.tiles[1] || fs.some((x) => !x))
              throw Error("INVALID_TILES");
            rt.engines[uid].answer(api.polyEqual(api.multiply(...fs), s.cur.poly));
            rt.receive();
          } else if (command.type === "special") {
            if (!["big", "heal", "shield"].includes(command.kind))
              throw Error("INVALID_SPECIAL");
            rt.engines[uid].special(command.kind);
            rt.receive();
          }
          const won = rt.saved();
          if (won) m.result = { winner: won, reason: "clear" };
        } else {
          const N = api.DIFFICULTY_CONFIG[m.difficulty].clearCount;
          const nextAt = () => api.qStartA(m.claims, m.claims.length, m.startAt);
          while (m.claims.length < N && now >= nextAt() + api.QUESTION_TIMEOUT_MS)
            m.claims.push({ uid: "_none", at: nextAt() + api.QUESTION_TIMEOUT_MS });
          if (m.claims.length < N && command.type === "answer") {
            if (now < nextAt() || now < (m.locks[uid] || 0) || command.question !== String(m.claims.length))
              throw Error("STALE_QUESTION");
            const b = api.problemForA(rt.bank, m.claims.length), fs = (_b = command.tiles) == null ? void 0 : _b.map(
              (id) => {
                var _a2;
                return (_a2 = b.tiles.find((t) => t.id === id)) == null ? void 0 : _a2.factor;
              }
            );
            if ((fs == null ? void 0 : fs.length) !== 2 || command.tiles[0] === command.tiles[1] || fs.some((x) => !x))
              throw Error("INVALID_TILES");
            if (api.polyEqual(api.multiply(...fs), b.poly)) {
              const j = api.getJudgment(now - nextAt()).label;
              m.claims.push({ uid, at: now, j });
            } else m.locks[uid] = now + api.A_LOCK_MS;
          }
          if (m.claims.length >= N) {
            const sc = api.scoreA(rt.bank, m.claims, m.ids, N, {}).sc, [a, b] = m.ids;
            m.result = {
              winner: sc[a] === sc[b] ? null : sc[a] > sc[b] ? a : b,
              draw: sc[a] === sc[b],
              reason: "clear"
            };
          }
          m.time = now;
        }
        return m;
      }
      function nowShield(s, time) {
        return time < (s.shieldUntil || 0);
      }
      function view(match, uid) {
        const rt = runtime(match), { api } = rt;
        const problem = match.mode === "A" ? api.problemForA(rt.bank, match.claims.length) : match.states[uid].cur;
        return {
          id: match.id,
          mode: match.mode,
          difficulty: match.difficulty,
          result: match.result || null,
          question: match.mode === "A" ? String(match.claims.length) : `${problem.level}:${problem.k}`,
          poly: problem.poly,
          tiles: problem.tiles,
          level: problem.level,
          startAt: match.mode === "A" ? api.qStartA(match.claims, match.claims.length, match.startAt) : match.states[uid].qStart,
          timeoutMs: api.QUESTION_TIMEOUT_MS,
          acceptedSeq: match.seq[uid] || 0,
          visualEvents: match.visualEvents || [],
          resolving: match.mode === "B" && match.states[uid].resolving,
          combo: match.mode === "A" ? api.scoreA(
            rt.bank,
            match.claims,
            match.ids,
            api.DIFFICULTY_CONFIG[match.difficulty].clearCount,
            {}
          ).cb[uid] || 0 : match.states[uid].combo,
          readyAt: match.mode === "A" ? Math.max(
            api.qStartA(match.claims, match.claims.length, match.startAt),
            match.locks[uid] || 0
          ) : match.states[uid].nextAt || match.states[uid].qStart,
          live: Object.fromEntries(
            match.ids.map((u) => [
              u,
              match.mode === "B" ? {
                hp: match.states[u].hp,
                score: match.states[u].score,
                c: match.states[u].c,
                combo: match.states[u].combo,
                sp: match.states[u].sp,
                shield: nowShield(match.states[u], match.time)
              } : api.scoreA(
                rt.bank,
                match.claims,
                match.ids,
                api.DIFFICULTY_CONFIG[match.difficulty].clearCount,
                {}
              ).sc[u]
            ])
          )
        };
      }
      module.exports = { begin, step, view, runtime };
    }
  });

  // server/online-rated/core.cjs
  var require_core = __commonJS({
    "server/online-rated/core.cjs"(exports, module) {
      var Engine = require_engine();
      var copy = (x) => JSON.parse(JSON.stringify(x));
      var season = (t) => new Date(t + 9 * 36e5).toISOString().slice(0, 7);
      var normalize = (r, s) => {
        r.seasonHist || (r.seasonHist = {});
        if (r.season !== s) {
          r.seasonHist[r.season] = { last: r.rating, max: r.seasonMax };
          r.rating = r.rating <= 1500 ? 1500 : Math.round((1500 + (r.rating - 1500) / 2) * 10) / 10;
          r.season = s;
          r.seasonMax = r.rating;
        }
        return r;
      };
      function badges(e, n, had = {}) {
        return {
          ...had,
          ...e >= 1730 ? { easy_adept: true } : {},
          ...e >= 1820 ? { easy_master: true } : {},
          ...n >= 1730 ? { normal_adept: true } : {},
          ...n >= 1820 ? { normal_master: true } : {},
          ...e >= 1820 && n >= 1820 ? { dual_master: true } : {}
        };
      }
      function initial(value, now) {
        return {
          rating: value,
          games: 0,
          w: 0,
          l: 0,
          d: 0,
          season: season(now),
          seasonMax: value,
          maxRating: value,
          seasonHist: {}
        };
      }
      function migrate(state, accounts, migrationId, now) {
        var _a, _b, _c;
        if (!/^[a-zA-Z0-9_-]+$/.test(migrationId))
          throw Error("INVALID_MIGRATION_ID");
        const n = copy(
          state || {
            players: {},
            queue: {},
            matches: {},
            settlements: {},
            migrations: {}
          }
        );
        n.migrations || (n.migrations = {});
        n.players || (n.players = {});
        for (const [key, a] of Object.entries(accounts)) {
          if (!/^a[a-z0-9_]+$/.test(key)) throw Error("INVALID_ACCOUNT_KEY");
          if (typeof a.name !== "string" || a.name.length < 1 || a.name.length > 10)
            throw Error("INVALID_ACCOUNT_NAME");
          if (n.players[key]) continue;
          const v = (_b = (_a = a.stats) == null ? void 0 : _a.rating) != null ? _b : 1500;
          if (typeof v !== "number" || !Number.isFinite(v))
            throw Error("INVALID_LEGACY_RATING:" + key);
          const rt = Engine.runtime(
            Engine.begin("migration", "easy", "A", ["one", "two"], "migration", now)
          ).api;
          n.players[key] = {
            name: a.name,
            easy: initial(v, now),
            normal: initial(1500, now),
            badges: badges(v, 1500),
            legacy: {
              migrationId,
              at: now,
              stats: copy(a.stats || {}),
              earnedBadges: Array.from(
                rt.BADGES.filter((b) => b.test(a.stats || {})),
                (b) => b.id
              )
            }
          };
        }
        (_c = n.migrations)[migrationId] || (_c[migrationId] = {
          at: now,
          count: Object.keys(accounts).length
        });
        n.cutoverAt || (n.cutoverAt = now);
        return n;
      }
      function settle(n, m, now) {
        var _a;
        if (n.settlements[m.id]) return;
        if (!((_a = m.game) == null ? void 0 : _a.result)) throw Error("UNVERIFIED_RESULT");
        const [a, b] = m.members.map((x) => x.key), d = m.difficulty, s = season(now);
        const ra = normalize(n.players[a][d], s), rb = normalize(n.players[b][d], s);
        const score = m.game.result.draw ? 0.5 : m.game.result.winner === m.members[0].uid ? 1 : 0;
        const deltas = [
          32 * (score - 1 / (1 + 10 ** ((rb.rating - ra.rating) / 400))),
          32 * (1 - score - 1 / (1 + 10 ** ((ra.rating - rb.rating) / 400)))
        ];
        const receipt = {
          difficulty: d,
          mode: m.mode,
          at: now,
          result: copy(m.game.result),
          players: {}
        };
        for (const [i, key] of [a, b].entries()) {
          const r = n.players[key][d], outcome = i === 0 ? score : 1 - score, before = r.rating;
          n.players[key].lastMatchId = m.id;
          const delta = deltas[i] < 0 && r.games < 10 ? deltas[i] / 2 : deltas[i];
          r.rating = Math.round((r.rating + delta) * 10) / 10;
          r.games++;
          r[outcome === 1 ? "w" : outcome === 0 ? "l" : "d"]++;
          r.seasonMax = Math.max(r.seasonMax, r.rating);
          r.maxRating = Math.max(r.maxRating, r.rating);
          n.players[key].badges = badges(
            n.players[key].easy.maxRating,
            n.players[key].normal.maxRating,
            n.players[key].badges
          );
          receipt.players[key] = {
            before,
            after: r.rating,
            delta: r.rating - before
          };
        }
        n.settlements[m.id] = receipt;
        m.phase = "settled";
        m.receipt = receipt;
      }
      function transition(state, actor, cmd, now, entropy) {
        var _a, _b, _c, _d, _e;
        const n = copy(state);
        n.queue || (n.queue = {});
        n.matches || (n.matches = {});
        n.settlements || (n.settlements = {});
        if (!(actor == null ? void 0 : actor.uid) || !((_a = n.players) == null ? void 0 : _a[actor.key]))
          throw Error("LINKED_ACCOUNT_REQUIRED");
        if (cmd.protocol !== 2) throw Error("UPDATE_REQUIRED");
        if (!Number.isSafeInteger(now)) throw Error("INVALID_TIME");
        if (cmd.type === "ackReceipt") {
          if (n.players[actor.key].lastMatchId !== cmd.matchId)
            throw Error("UNKNOWN_RECEIPT");
          n.players[actor.key].lastAckMatchId = cmd.matchId;
          return { state: n };
        }
        if (cmd.type === "equipTitle") {
          if (!(n.players[actor.key].badges || {})[cmd.title])
            throw Error("TITLE_NOT_EARNED");
          n.players[actor.key].title = cmd.title;
          return { state: n, matchId: cmd.matchId || null };
        }
        const waiting = Object.values(n.queue).find((x) => x.key === actor.key);
        let m = cmd.matchId && n.matches[cmd.matchId] || Object.values(n.matches).find(
          (x) => x.members.some((u) => u.key === actor.key) && !["settled", "cancelled"].includes(x.phase)
        );
        if (cmd.type === "status" && !m)
          return {
            state: n,
            ticket: waiting && waiting.until > now ? waiting.id : null
          };
        if (cmd.type === "status") cmd = { ...cmd, type: "heartbeat" };
        if (cmd.type === "heartbeat" && m && !cmd.matchId)
          cmd = { ...cmd, matchId: m.id };
        if (cmd.type === "enqueue") {
          if (m) return { state: n, matchId: m.id };
          if (!["easy", "normal"].includes(cmd.difficulty))
            throw Error("INVALID_DIFFICULTY");
          if (!n.enabled) throw Error("MAINTENANCE");
          for (const [id, q] of Object.entries(n.queue))
            if (q.until <= now) delete n.queue[id];
          if (waiting && waiting.until > now) {
            if (waiting.difficulty !== cmd.difficulty)
              throw Error("CANCEL_BEFORE_RESEARCH");
            return { state: n, ticket: waiting.id };
          }
          const other = Object.values(n.queue).find(
            (q) => q.difficulty === cmd.difficulty && q.key !== actor.key && q.uid !== actor.uid
          );
          if (other) {
            delete n.queue[other.id];
            const id = entropy.id;
            n.matches[id] = {
              id,
              difficulty: cmd.difficulty,
              phase: "vote",
              voteEnd: now + 1e4,
              members: [{ uid: other.uid, key: other.key }, actor],
              votes: {},
              lastSeen: { [other.uid]: now, [actor.uid]: now },
              seed: entropy.seed
            };
            return { state: n, matchId: id };
          }
          n.queue[entropy.id] = {
            ...actor,
            id: entropy.id,
            difficulty: cmd.difficulty,
            until: now + 25e3
          };
          return { state: n, ticket: entropy.id };
        }
        if (cmd.type === "cancel") {
          const q = n.queue[cmd.ticket];
          if (q && q.key === actor.key && q.uid === actor.uid)
            delete n.queue[cmd.ticket];
          return { state: n, matchId: (m == null ? void 0 : m.id) || null };
        }
        if (cmd.type === "heartbeat" && !m) {
          if ((waiting == null ? void 0 : waiting.until) <= now) delete n.queue[waiting.id];
          else if ((waiting == null ? void 0 : waiting.uid) === actor.uid) waiting.until = now + 25e3;
          return {
            state: n,
            ticket: waiting && waiting.until > now ? waiting.id : null
          };
        }
        if (!m || m.id !== cmd.matchId || !m.members.some((u) => u.key === actor.key && u.uid === actor.uid))
          throw Error("NOT_PARTICIPANT");
        m.votes || (m.votes = {});
        if (m.game) {
          (_b = m.game).seq || (_b.seq = {});
          (_c = m.game).claims || (_c.claims = []);
          (_d = m.game).locks || (_d.locks = {});
          (_e = m.game).states || (_e.states = {});
        }
        if (["settled", "cancelled"].includes(m.phase))
          return { state: n, matchId: m.id };
        if (cmd.type === "leave") {
          if (m.phase === "vote" || m.phase === "play" && now < m.game.startAt)
            m.phase = "cancelled";
          else if (m.phase === "play") {
            m.game.result = {
              winner: m.members.find((x) => x.uid !== actor.uid).uid,
              reason: "leave"
            };
            settle(n, m, now);
          }
          return { state: n, matchId: m.id };
        }
        const absent = m.members.find(
          (x) => x.uid !== actor.uid && now - m.lastSeen[x.uid] > 8e3
        );
        if (absent) {
          if (m.phase === "vote" || m.phase === "play" && now < m.game.startAt)
            m.phase = "cancelled";
          else if (m.phase === "play") {
            m.game.result = { winner: actor.uid, reason: "leave" };
            settle(n, m, now);
          }
        }
        m.lastSeen[actor.uid] = Math.max(m.lastSeen[actor.uid] || 0, now);
        if (m.phase === "vote") {
          if (cmd.type === "vote") {
            if (!["A", "B"].includes(cmd.mode)) throw Error("INVALID_MODE");
            m.votes[actor.uid] = cmd.mode;
          }
          if (Object.keys(m.votes).length === 2 || now >= m.voteEnd) {
            const vs = Object.values(m.votes);
            m.mode = vs.length === 2 && vs[0] === vs[1] ? vs[0] : entropy.mode;
            m.phase = "play";
            m.game = Engine.begin(
              m.id,
              m.difficulty,
              m.mode,
              m.members.map((x) => x.uid),
              m.seed,
              now + 3800
            );
          }
        } else if (m.phase === "play" && now >= m.game.startAt) {
          if (!["heartbeat", "answer", "special"].includes(cmd.type))
            throw Error("INVALID_COMMAND");
          if (cmd.type !== "heartbeat") {
            if (!Number.isSafeInteger(cmd.seq) || cmd.seq < 1)
              throw Error("INVALID_SEQUENCE");
            if (cmd.seq <= (m.game.seq[actor.uid] || 0))
              return { state: n, matchId: m.id };
            if (cmd.seq !== (m.game.seq[actor.uid] || 0) + 1)
              throw Error("SEQUENCE_GAP");
          }
          m.game = Engine.step(m.game, actor.uid, cmd, now);
          if (cmd.type !== "heartbeat") m.game.seq[actor.uid] = cmd.seq;
          if (m.game.result) settle(n, m, now);
        }
        return { state: n, matchId: m.id };
      }
      function rankings(state, d, now) {
        if (!["easy", "normal"].includes(d)) throw Error("INVALID_DIFFICULTY");
        const rows = Object.entries(state.players || {}).map(([key, p]) => ({
          key,
          name: p.name,
          title: p.title || null,
          cosmetics: p.cosmetics || {},
          statsKnown: p.statsKnown !== false,
          ...normalize(copy(p[d]), season(now))
        })).filter((r) => d === "easy" ? r.rating >= 1501 : r.games >= 3);
        rows.sort(
          (a, b) => b.rating - a.rating || (b.games ? b.w / b.games : 0) - (a.games ? a.w / a.games : 0) || a.key.localeCompare(b.key)
        );
        let rank = 0;
        return rows.map((r, i) => {
          if (!i || r.rating !== rows[i - 1].rating || (r.games ? r.w / r.games : 0) !== (rows[i - 1].games ? rows[i - 1].w / rows[i - 1].games : 0))
            rank = i + 1;
          return { ...r, rank };
        });
      }
      module.exports = {
        migrate,
        transition,
        rankings,
        badges,
        initial,
        settle,
        copy,
        ratingView: (r, now) => normalize(copy(r), season(now))
      };
    }
  });

  // src/ghost-model.cjs
  var require_ghost_model = __commonJS({
    "src/ghost-model.cjs"(exports, module) {
      var C = require_core();
      var E = require_engine();
      var thresholds = [-Infinity, 1530, 1580, 1650, 1730, 1820];
      var rank = (r) => thresholds.reduce((a, t, i) => r >= t ? i : a, 0);
      var clamp = (v, a, b) => Math.min(b, Math.max(a, v));
      var valid = (n) => typeof n === "number" && Number.isFinite(n);
      var mean = (a, d) => a.length ? a.reduce((s, x) => s + x, 0) / a.length : d;
      function eligible(a) {
        var _a;
        return !!(a == null ? void 0 : a.name) && Object.values(((_a = a.prof) == null ? void 0 : _a.lv) || {}).reduce(
          (s, l) => s + (valid(l == null ? void 0 : l.n) && l.n > 0 ? l.n : 0),
          0
        ) >= 20;
      }
      function profile(prof, stats, hyper = false) {
        var _a, _b, _c;
        const t = {}, miss = {}, tr = [], mr = [];
        for (let lv = 1; lv <= 9; lv++) {
          const L = (_a = prof == null ? void 0 : prof.lv) == null ? void 0 : _a["L" + lv];
          if ((L == null ? void 0 : L.ok) >= 2 && valid(L.ms) && L.ms > 0) {
            const v = clamp(L.ms / L.ok / 1e3, 1, 18);
            t["L" + lv] = v;
            tr.push(v / (4 + 0.9 * lv));
          }
          if ((L == null ? void 0 : L.n) >= 3 && valid(L.ok) && L.ok >= 0 && L.ok <= L.n) {
            const v = clamp(1 - L.ok / L.n, 0.02, 0.45);
            miss["L" + lv] = v;
            mr.push(v);
          }
        }
        for (let lv = 1; lv <= 9; lv++) {
          const k = "L" + lv;
          t[k] = Math.round(
            clamp((_b = t[k]) != null ? _b : (4 + 0.9 * lv) * mean(tr, 1), 1, 18) * (hyper ? 0.75 : 1) * 100
          ) / 100;
          miss[k] = Math.round(((_c = miss[k]) != null ? _c : mean(mr, 0.12)) * 100) / 100;
        }
        const sp = (stats == null ? void 0 : stats.bGames) > 0 && valid(stats.spGames) ? clamp(stats.spGames / stats.bGames, 0, 1) : 0.8;
        return { t, miss, sp };
      }
      function category(roll) {
        return roll < 0.05 ? "up2" : roll < 0.2 ? "up1" : roll < 0.75 ? "same" : roll < 0.85 ? "down1" : roll < 0.95 ? "bot" : "hyper";
      }
      function select({
        accounts,
        profiles = {},
        key,
        difficulty,
        rating,
        random: random2 = Math.random,
        bot
      }) {
        const kind = category(random2()), band = rank(rating), offset = { up2: 2, up1: 1, same: 0, down1: -1 }[kind];
        const all = Object.entries(accounts).filter(([k, a]) => k !== key && eligible(a)).map(([k, a]) => {
          var _a, _b;
          const rt = ((_a = profiles[k]) == null ? void 0 : _a[difficulty]) ? C.ratingView(profiles[k][difficulty], Date.now()).rating : difficulty === "easy" && valid((_b = a.stats) == null ? void 0 : _b.rating) ? a.stats.rating : 1500;
          return {
            key: k,
            base: a.name,
            rating: rt,
            rank: rank(rt),
            prof: a.prof,
            stats: a.stats
          };
        });
        let pool = offset == null ? all : all.filter((a) => a.rank === band + offset);
        if (!pool.length) pool = all;
        if (kind === "bot" || !pool.length) {
          const b = bot();
          return {
            type: "bot",
            name: b.name + "\uFF08BOT\uFF09",
            base: b.name,
            rating: b.rt,
            rank: rank(b.rt),
            rankDifference: rank(b.rt) - band,
            profile: profile(null, null)
          };
        }
        const p = pool[Math.floor(random2() * pool.length)], hyper = kind === "hyper";
        return {
          type: hyper ? "hyper" : "ghost",
          key: p.key,
          base: p.base,
          name: p.base + (hyper ? "\u306E\u30CF\u30A4\u30D1\u30FC\u30B4\u30FC\u30B9\u30C8" : "\u306E\u30B4\u30FC\u30B9\u30C8"),
          rating: p.rating,
          rank: p.rank,
          rankDifference: p.rank - band,
          profile: profile(p.prof, p.stats, hyper)
        };
      }
      function ratingAfter(before, opponent, outcome, games, rated = true) {
        if (!rated) return before;
        const score = outcome === "win" ? 1 : outcome === "lose" ? 0 : 0.5;
        let delta = 32 * (score - 1 / (1 + 10 ** ((opponent - before) / 400)));
        if (delta < 0 && games < 10) delta /= 2;
        return Math.round((before + delta / 3) * 10) / 10;
      }
      function titles(opponent, outcome, origin, had = {}) {
        if (origin !== "quick" || outcome !== "win") return { ...had };
        return {
          ...had,
          ...opponent.type === "hyper" ? { hyper_slayer: true } : {},
          ...opponent.type !== "bot" && opponent.rankDifference === 1 ? { ghost_up1: true } : {},
          ...opponent.type !== "bot" && opponent.rankDifference === 2 ? { ghost_up2: true } : {}
        };
      }
      function random(m) {
        m.rng = Math.imul(m.rng || 1, 1664525) + 1013904223 >>> 0;
        return m.rng / 4294967296;
      }
      function advance(raw, now) {
        var _a, _b, _c, _d;
        const m = C.copy(raw), bot = "_ghost", gp = m.opponent.profile;
        if (m.phase !== "play" || now < m.game.startAt) return m;
        for (let count = 0; count < 100 && !m.game.result; count++) {
          if (m.mode === "B" && ((_b = (_a = m.game.states) == null ? void 0 : _a[bot]) == null ? void 0 : _b.resolving)) {
            m.game = E.step(
              m.game,
              bot,
              { type: "heartbeat" },
              Math.max(m.game.time, Math.min(now, m.game.states[bot].nextAt))
            );
            if (m.game.states[bot].resolving || m.game.result) break;
          }
          const v = E.view(m.game, bot);
          if (((_c = m.cpu) == null ? void 0 : _c.question) !== v.question) {
            const at = Math.max(v.startAt, v.readyAt || 0) + gp.t["L" + v.level] * (0.6 + random(m) * 0.8) * 1e3;
            m.cpu = {
              question: v.question,
              at: Math.max(m.game.time, Math.round(at))
            };
          }
          const deadline = v.startAt + v.timeoutMs;
          if (deadline <= now && m.cpu.at >= deadline) {
            m.game = E.step(
              m.game,
              bot,
              { type: "heartbeat" },
              Math.max(m.game.time, deadline)
            );
            delete m.cpu;
            continue;
          }
          if (m.cpu.at > now) break;
          const rt = E.runtime(m.game), a = rt.api;
          let good = [], bad = [];
          for (let i = 0; i < v.tiles.length; i++)
            for (let j = i + 1; j < v.tiles.length; j++)
              (a.polyEqual(a.multiply(v.tiles[i].factor, v.tiles[j].factor), v.poly) ? good : bad).push([v.tiles[i].id, v.tiles[j].id]);
          const correct = random(m) >= gp.miss["L" + v.level], pool = correct ? good : bad;
          m.game = E.step(
            m.game,
            bot,
            { type: "answer", question: v.question, tiles: pool[0] || good[0] },
            Math.max(m.game.time, m.cpu.at)
          );
          if (m.mode === "B" && m.usesSpecial && !m.game.result) {
            const s = m.game.states[bot];
            if (s.sp >= 6 && !m.specialAt)
              m.specialAt = m.game.time + Math.round(600 + random(m) * 1500);
          }
          m.cpu.at = m.game.time + Math.round(
            gp.t["L" + v.level] * (0.6 + random(m) * 0.8) * 1e3 * (correct ? 1 : 0.4)
          );
          if (m.mode === "A" && !correct)
            m.cpu.at += Math.max(0, (m.game.locks[bot] || 0) - m.game.time);
        }
        if (m.mode === "B" && m.specialAt && m.specialAt <= now && !m.game.result) {
          const s = m.game.states[bot];
          m.game = E.step(
            m.game,
            bot,
            {
              type: "special",
              kind: s.hp < 40 ? "heal" : ((_d = s.pend) == null ? void 0 : _d.length) ? "shield" : "big"
            },
            Math.max(m.game.time, m.specialAt)
          );
          delete m.specialAt;
        }
        if (!m.game.result)
          m.game = E.step(
            m.game,
            bot,
            { type: "heartbeat" },
            Math.max(m.game.time, now)
          );
        return m;
      }
      module.exports = {
        rank,
        eligible,
        profile,
        category,
        select,
        ratingAfter,
        titles,
        advance
      };
    }
  });

  // src/online-spark-client.cjs
  var require_online_spark_client = __commonJS({
    "src/online-spark-client.cjs"(exports, module) {
      var C = require_core();
      var E = require_engine();
      var G = require_ghost_model();
      var ROOT = "games/factor/onlineSparkV1";
      var copy = C.copy;
      var id = () => {
        const c = globalThis.crypto;
        if (c.randomUUID) return c.randomUUID();
        return Array.from(
          c.getRandomValues(new Uint8Array(16)),
          (v) => v.toString(16).padStart(2, "0")
        ).join("");
      };
      var clean = (x) => JSON.parse(JSON.stringify(x));
      async function tx(ref, fn) {
        const listener = () => {
        };
        ref.on("value", listener);
        try {
          await ref.get();
          const r = await ref.transaction(fn, void 0, false);
          if (!r.committed) throw Error("SAVE_NOT_COMMITTED");
          return r.snapshot.val();
        } finally {
          ref.off("value", listener);
        }
      }
      function aRecord(game, uid, command, ts) {
        var _a, _b;
        if ((game == null ? void 0 : game.mode) !== "A" || command.type !== "answer" || command.seq <= (((_a = game.seq) == null ? void 0 : _a[uid]) || 0))
          return null;
        const v = E.view(copy(game), uid), api = E.runtime(copy(game)).api;
        const f = (_b = command.tiles) == null ? void 0 : _b.map(
          (id2) => {
            var _a2;
            return (_a2 = v.tiles.find((t) => t.id === id2)) == null ? void 0 : _a2.factor;
          }
        );
        if ((f == null ? void 0 : f.length) !== 2 || f.some((x) => !x)) return null;
        return {
          lv: v.level,
          ok: api.polyEqual(api.multiply(...f), v.poly),
          ms: Math.max(0, ts - v.startAt),
          q: Number(v.question)
        };
      }
      function create({
        db,
        uid,
        account,
        now = Date.now,
        bot = () => ({ name: "CPU", rt: 1500 }),
        learning = async () => {
        },
        random = Math.random
      }) {
        const key = account == null ? void 0 : account.key;
        let profiles = {}, closed = false;
        const pr = db.ref(`${ROOT}/profiles`), profileRef = db.ref(`${ROOT}/profiles/${key}`);
        const listen = (s) => {
          profiles = s.val() || {};
        };
        pr.on("value", listen, () => {
        });
        let ticket = null, difficulty = null, currentMatch = null, searchStarted = null, ghostReady = false, ghostActive = null;
        const ghostRoot = `games/factor/ghostV1/users/${key}`;
        async function checkGhost() {
          try {
            const active = (await db.ref(`${ghostRoot}/activeMatch`).get()).val();
            ghostReady = true;
            ghostActive = active || null;
            return { activeMatch: active };
          } catch (e) {
            if (e.code === "PERMISSION_DENIED" || /permission/i.test(e.message)) {
              ghostReady = false;
              return null;
            }
            throw e;
          }
        }
        async function ensure() {
          if (!uid || !key || !/^a[a-z0-9_]+$/.test(key))
            throw Error("\u767B\u9332\u30A2\u30AB\u30A6\u30F3\u30C8\u3067\u30ED\u30B0\u30A4\u30F3\u3057\u3066\u304F\u3060\u3055\u3044");
          let p = (await profileRef.get()).val();
          if (p) return p;
          const legacy = (await db.ref(`games/factor/accounts/${key}`).get()).val();
          if (!(legacy == null ? void 0 : legacy.name))
            throw Error("\u30A2\u30AB\u30A6\u30F3\u30C8\u3092\u78BA\u8A8D\u3067\u304D\u307E\u305B\u3093\u3002\u30ED\u30B0\u30A4\u30F3\u3057\u76F4\u3057\u3066\u304F\u3060\u3055\u3044");
          const init = C.migrate(
            null,
            { [key]: legacy },
            "spark-legacy-to-easy-v1",
            now()
          ).players[key];
          const next = {
            name: legacy.name,
            easy: init.easy,
            normal: init.normal,
            badges: init.badges,
            migrationId: "spark-legacy-to-easy-v1",
            initialRating: init.easy.rating,
            initializedAt: now()
          };
          try {
            await db.ref(ROOT).update({
              ["profiles/" + key]: next,
              ["backups/" + key]: {
                name: legacy.name,
                stats: legacy.stats || {},
                at: next.initializedAt
              }
            });
            return (await profileRef.get()).val();
          } catch (e) {
            const latest = (await profileRef.get()).val();
            if (latest) return latest;
            throw Error(
              "\u5F15\u304D\u7D99\u304E\u5143\u304C\u66F4\u65B0\u3055\u308C\u305F\u304B\u4FDD\u5B58\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u518D\u8A66\u884C\u3057\u3066\u304F\u3060\u3055\u3044"
            );
          }
        }
        async function getMatch(matchId) {
          if (!matchId) return null;
          if (String(matchId).startsWith("ghost-"))
            return (await db.ref(`${ghostRoot}/matches/${matchId}`).get()).val();
          return (await db.ref(`${ROOT}/matches/${matchId}`).get()).val();
        }
        async function apply(m) {
          if (m.phase !== "settled" || !m.receipt) return;
          if (!m.members.some((u) => u.key === key)) throw Error("NOT_PARTICIPANT");
          const mine = m.receipt.players[key];
          if (!mine) throw Error("INVALID_RECEIPT");
          await tx(profileRef, (p) => {
            var _a, _b;
            if (!p) throw Error("PROFILE_REQUIRED");
            if ((_a = p.processed) == null ? void 0 : _a[m.id]) return p;
            const r = C.ratingView(p[m.difficulty], m.receipt.at);
            if (r.rating !== mine.before)
              throw Error("\u8A18\u9332\u306E\u9806\u5E8F\u304C\u5408\u3044\u307E\u305B\u3093\u3002\u6700\u65B0\u306E\u8A18\u9332\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044");
            const outcome = m.receipt.result.draw ? "d" : ((_b = m.members.find((x) => x.uid === m.receipt.result.winner)) == null ? void 0 : _b.key) === key ? "w" : "l";
            r.rating = mine.after;
            if (m.opponent) {
              r.ghost || (r.ghost = { games: 0, w: 0, l: 0, d: 0 });
              r.ghost.games++;
              r.ghost[outcome]++;
            } else {
              r.games++;
              r[outcome]++;
            }
            r.maxRating = Math.max(r.maxRating, r.rating);
            r.seasonMax = Math.max(r.seasonMax, r.rating);
            p[m.difficulty] = r;
            p.processed = { ...p.processed || {}, [m.id]: true };
            p.lastMatchId = m.id;
            p.activeMatch = m.id;
            if (m.opponent)
              p.badges = G.titles(
                m.opponent,
                outcome === "w" ? "win" : outcome === "l" ? "lose" : "draw",
                m.origin,
                p.badges
              );
            p.badges = C.badges(p.easy.maxRating, p.normal.maxRating, p.badges);
            return p;
          });
        }
        async function response(m = null, withLegacy = false) {
          var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u;
          if (m && (!m.opponent || m.origin === "quick")) await apply(m);
          if ((m == null ? void 0 : m.opponent) && m.phase === "settled") await saveGhostResult(m);
          if ((m == null ? void 0 : m.phase) === "settled") {
            const playUid = m.members.find((u) => u.key === key).uid;
            const rows = m.mode === "B" ? ((_b = (_a = m.game.states) == null ? void 0 : _a[playUid]) == null ? void 0 : _b.hist) || [] : ((_c = m.learning) == null ? void 0 : _c[playUid]) || [];
            await learning(m.id, rows);
          }
          let p = (await profileRef.get()).val();
          profiles[key] = p;
          const players = { ...profiles };
          if (withLegacy) {
            const [profileSnapshot, legacySnapshot] = await Promise.all([
              pr.get(),
              db.ref("games/factor/accounts").get()
            ]);
            Object.assign(players, profileSnapshot.val() || {});
            p = players[key];
            const legacy = legacySnapshot.val() || {};
            for (const [k, a] of Object.entries(legacy)) {
              if (players[k] || !(a == null ? void 0 : a.name) || typeof ((_d = a.stats) == null ? void 0 : _d.rating) !== "number" || !Number.isFinite(a.stats.rating))
                continue;
              players[k] = {
                name: a.name,
                statsKnown: false,
                easy: {
                  rating: a.stats.rating,
                  games: 0,
                  w: 0,
                  l: 0,
                  d: 0,
                  season: new Date(now() + 9 * 36e5).toISOString().slice(0, 7),
                  maxRating: a.stats.rating,
                  seasonMax: a.stats.rating
                },
                normal: {
                  rating: 1500,
                  games: 0,
                  w: 0,
                  l: 0,
                  d: 0,
                  season: new Date(now() + 9 * 36e5).toISOString().slice(0, 7),
                  maxRating: 1500,
                  seasonMax: 1500
                }
              };
            }
          }
          if (withLegacy) {
            const accounts = (await db.ref("games/factor/accounts").get()).val() || {};
            for (const [k, player] of Object.entries(players)) {
              player.cosmetics = {
                stats: ((_e = accounts[k]) == null ? void 0 : _e.stats) || {},
                name: ((_f = accounts[k]) == null ? void 0 : _f.name) || player.name
              };
              player.statsKnown = player.statsKnown !== false;
            }
          }
          const ranks = {
            easy: C.rankings({ players }, "easy", now()),
            normal: C.rankings({ players }, "normal", now())
          };
          return {
            ticket: m ? null : ticket,
            searchStarted,
            ghostReady,
            match: m ? {
              id: m.id,
              selfUid: ((_g = m.members.find((u) => u.key === key)) == null ? void 0 : _g.uid) || uid,
              gameStartAt: (_h = m.game) == null ? void 0 : _h.startAt,
              members: m.members.map((x) => ({ uid: x.uid, name: x.name })),
              phase: m.phase,
              difficulty: m.difficulty,
              mode: m.mode || null,
              voteEnd: m.voteEnd,
              votes: m.votes || {},
              opponent: m.opponent || null,
              origin: m.origin || "human",
              exp: m.exp || 0,
              lastAnswer: m.mode === "B" ? ((_m = (_l = (_k = (_i = m.game) == null ? void 0 : _i.states) == null ? void 0 : _k[(_j = m.members.find((u) => u.key === key)) == null ? void 0 : _j.uid]) == null ? void 0 : _l.hist) == null ? void 0 : _m.slice(-1)[0]) || null : ((_p = (_o = m.learning) == null ? void 0 : _o[(_n = m.members.find((u) => u.key === key)) == null ? void 0 : _n.uid]) == null ? void 0 : _p.slice(-1)[0]) || null,
              game: m.phase === "play" ? E.view(
                m.game,
                ((_q = m.members.find((u) => u.key === key)) == null ? void 0 : _q.uid) || uid
              ) : null,
              result: ((_r = m.receipt) == null ? void 0 : _r.result) || null,
              receipt: m.receipt || null,
              outcome: m.receipt ? m.receipt.result.draw ? "draw" : ((_s = m.members.find((u) => u.uid === m.receipt.result.winner)) == null ? void 0 : _s.key) === key ? "win" : "lose" : null
            } : null,
            ratings: {
              easy: C.ratingView(p.easy, now()),
              normal: C.ratingView(p.normal, now())
            },
            badges: p.badges || {},
            title: p.title || null,
            rankings: {
              easy: ranks.easy.slice(0, 10),
              normal: ranks.normal.slice(0, 10)
            },
            ranks: {
              easy: ((_t = ranks.easy.find((r) => r.key === key)) == null ? void 0 : _t.rank) || null,
              normal: ((_u = ranks.normal.find((r) => r.key === key)) == null ? void 0 : _u.rank) || null
            }
          };
        }
        async function find() {
          const ghostUser = await checkGhost();
          if (ghostUser == null ? void 0 : ghostUser.activeMatch) {
            const gm = await getMatch(ghostUser.activeMatch);
            if (gm && gm.phase !== "cancelled") {
              ghostActive = gm.id;
              return gm;
            }
          }
          const p = (await profileRef.get()).val();
          const m = await getMatch(currentMatch || (p == null ? void 0 : p.activeMatch));
          if (m && m.phase !== "cancelled" && !(m.phase === "settled" && p.lastAckMatchId === m.id)) {
            currentMatch = m.id;
            return m;
          }
          if ((m == null ? void 0 : m.phase) === "cancelled") {
            currentMatch = null;
            await tx(profileRef, (p2) => ({ ...p2, activeMatch: null }));
          }
          if (ticket && difficulty) {
            const slot = (await db.ref(`${ROOT}/slots/${difficulty}`).get()).val();
            if ((slot == null ? void 0 : slot.id) === ticket && slot.claim) {
              const joined = await getMatch(ticket);
              if (joined) {
                currentMatch = ticket;
                await tx(profileRef, (p2) => ({ ...p2, activeMatch: ticket }));
                if (slot.uid === uid)
                  await tx(
                    db.ref(`${ROOT}/slots/${difficulty}`),
                    (cur) => (cur == null ? void 0 : cur.id) === ticket && cur.uid === uid ? null : cur
                  );
                ticket = null;
                return joined;
              }
            }
            if (!slot || slot.id !== ticket || slot.until <= now()) {
              ticket = null;
              difficulty = null;
            }
          }
          return null;
        }
        async function enqueue(d, attempt = 0) {
          if (!["easy", "normal"].includes(d)) throw Error("INVALID_DIFFICULTY");
          const cfg = (await db.ref(`${ROOT}/config`).get()).val();
          if (!(cfg == null ? void 0 : cfg.enabled)) throw Error("\u305F\u3060\u3044\u307E\u5BFE\u6226\u306E\u6E96\u5099\u4E2D\u3067\u3059");
          const active = await find();
          if (active) return response(active);
          if (ticket && difficulty !== d)
            throw Error("\u691C\u7D22\u3092\u30AD\u30E3\u30F3\u30BB\u30EB\u3057\u3066\u304B\u3089\u96E3\u6613\u5EA6\u3092\u5909\u66F4\u3057\u3066\u304F\u3060\u3055\u3044");
          const ref = db.ref(`${ROOT}/slots/${d}`), newId = id(), ts = now();
          let claimed;
          let slot;
          try {
            slot = await tx(ref, (cur) => {
              claimed = null;
              if (!cur || cur.until <= ts)
                return {
                  id: newId,
                  uid,
                  key,
                  name: account.name,
                  until: ts + 25e3,
                  startedAt: ts
                };
              if (cur.fallback) throw Error("SEARCH_SLOT_TRANSITION");
              if (cur.uid === uid && cur.key === key)
                return { ...cur, until: ts + 25e3 };
              if (cur.key === key) throw Error("\u540C\u3058\u30A2\u30AB\u30A6\u30F3\u30C8\u3067\u691C\u7D22\u4E2D\u3067\u3059");
              if (cur.claim && cur.claim.uid !== uid)
                throw Error("\u76F8\u624B\u3092\u691C\u7D22\u4E2D\u3067\u3059\u3002\u518D\u8A66\u884C\u3057\u3066\u304F\u3060\u3055\u3044");
              claimed = cur;
              return { ...cur, claim: { uid, key, name: account.name } };
            });
          } catch (e) {
            const latest = (await ref.get()).val();
            if (e.message === "SEARCH_SLOT_TRANSITION" || /permission/i.test(e.message) && (!latest || latest.fallback)) {
              if (attempt < 3) {
                await new Promise((resolve) => setTimeout(resolve, 300));
                return enqueue(d, attempt + 1);
              }
              throw Error("\u691C\u7D22\u67A0\u3092\u5207\u308A\u66FF\u3048\u3066\u3044\u307E\u3059\u3002\u518D\u8A66\u884C\u3057\u3066\u76F8\u624B\u3092\u63A2\u3057\u3066\u304F\u3060\u3055\u3044");
            }
            throw e;
          }
          ticket = slot.id;
          difficulty = d;
          searchStarted = slot.startedAt || ts;
          if (!claimed) return response();
          const host = (await db.ref(`${ROOT}/profiles/${slot.key}`).get()).val(), guest = (await profileRef.get()).val();
          if (!host || !guest) throw Error("PROFILE_REQUIRED");
          const model = {
            enabled: true,
            players: { [slot.key]: host, [key]: guest },
            queue: {
              [slot.id]: {
                id: slot.id,
                uid: slot.uid,
                key: slot.key,
                until: slot.until,
                difficulty: d
              }
            },
            matches: {},
            settlements: {}
          };
          const entropy = {
            id: slot.id,
            seed: id() + id(),
            mode: Math.random() < 0.5 ? "A" : "B"
          };
          const next = C.transition(
            model,
            { uid, key },
            { type: "enqueue", difficulty: d, protocol: 2 },
            now(),
            entropy
          ).state.matches[slot.id];
          next.snapshots = {
            [slot.key]: {
              name: host.name,
              easy: host.easy,
              normal: host.normal,
              badges: host.badges || {}
            },
            [key]: {
              name: guest.name,
              easy: guest.easy,
              normal: guest.normal,
              badges: guest.badges || {}
            }
          };
          const match = await tx(
            db.ref(`${ROOT}/matches/${slot.id}`),
            (cur) => cur || clean(next)
          );
          currentMatch = match.id;
          ticket = null;
          await tx(profileRef, (p) => ({ ...p, activeMatch: match.id }));
          return response(match);
        }
        async function beginGhost(d, opponent, origin = "quick", matchId = "ghost-" + id()) {
          const p = (await profileRef.get()).val();
          const m = {
            id: matchId,
            difficulty: d,
            phase: "vote",
            voteEnd: now() + 1e4,
            seed: id() + id(),
            members: [
              { uid, key },
              { uid: "_ghost", key: "_ghost" }
            ],
            votes: {},
            lastSeen: { [uid]: now(), _ghost: now() },
            opponent,
            origin,
            rng: Math.floor(Math.random() * 4294967295) + 1,
            snapshots: {
              [key]: {
                name: p.name,
                easy: p.easy,
                normal: p.normal,
                badges: p.badges || {}
              }
            },
            usesSpecial: Math.random() < opponent.profile.sp
          };
          await tx(db.ref(ghostRoot), (u) => {
            var _a, _b;
            u || (u = {});
            if (u.activeMatch && ((_b = (_a = u.matches) == null ? void 0 : _a[u.activeMatch]) == null ? void 0 : _b.phase) !== "cancelled")
              return u;
            u.matches || (u.matches = {});
            u.matches[matchId] = clean(m);
            u.activeMatch = matchId;
            return u;
          });
          return response(await find());
        }
        async function intrusion() {
          if (!ghostReady || !ticket || !difficulty || searchStarted == null || now() - searchStarted < 1e4)
            return null;
          const ref = db.ref(`${ROOT}/slots/${difficulty}`), gid = "ghost-" + ticket;
          const cur = await tx(
            ref,
            (s) => (s == null ? void 0 : s.id) === ticket && s.uid === uid && !s.claim && !s.fallback ? { ...s, fallback: gid } : s
          );
          if ((cur == null ? void 0 : cur.id) !== ticket || cur.claim || cur.fallback !== gid) return find();
          const all = (await db.ref("games/factor/accounts").get()).val() || {}, p = (await profileRef.get()).val();
          const opponent = G.select({
            accounts: all,
            profiles,
            key,
            random,
            difficulty,
            rating: C.ratingView(p[difficulty], now()).rating,
            bot
          });
          const d = difficulty;
          await beginGhost(d, opponent, "quick", gid);
          await tx(
            ref,
            (s) => (s == null ? void 0 : s.id) === ticket && s.uid === uid && s.fallback === gid ? null : s
          );
          ticket = null;
          difficulty = null;
          searchStarted = null;
          return find();
        }
        async function saveGhostResult(m) {
          var _a;
          const result = m.receipt.result, won = ((_a = m.members.find((u) => u.uid === result.winner)) == null ? void 0 : _a.key) === key, draw = !!result.draw, outcome = draw ? "d" : won ? "w" : "l", exp = m.origin === "bounty" ? won ? 8 : 0 : won ? 8 : 0;
          await tx(db.ref(`games/factor/accounts/${key}/stats`), (s) => {
            s || (s = {});
            s.ghostAwards || (s.ghostAwards = {});
            if (s.ghostAwards[m.id]) return s;
            s.ghostAwards[m.id] = { exp, at: m.receipt.at };
            s.exp = (s.exp || 0) + exp;
            s.ghostTitles = G.titles(
              m.opponent,
              won ? "win" : draw ? "draw" : "lose",
              m.origin,
              s.ghostTitles
            );
            return s;
          });
          const event = {
            id: m.id,
            at: m.receipt.at,
            opponent: m.opponent.base,
            type: m.opponent.type,
            opponentKey: m.opponent.key || "",
            difficulty: m.difficulty,
            mode: m.mode,
            outcome,
            exp,
            delta: m.receipt.players[key].delta,
            origin: m.origin
          };
          await tx(db.ref(ghostRoot), (u) => {
            var _a2, _b;
            u || (u = {});
            u.events || (u.events = {});
            (_a2 = u.events)[_b = m.id] || (_a2[_b] = event);
            if (m.origin === "bounty" && won) {
              u.bountyCooldowns || (u.bountyCooldowns = {});
              u.bountyCooldowns[m.opponent.key] = Math.max(
                u.bountyCooldowns[m.opponent.key] || 0,
                m.receipt.at + 7 * 864e5
              );
            }
            return u;
          });
          if (m.opponent.key)
            await tx(
              db.ref(`games/factor/ghostV1/inbox/${m.opponent.key}/${m.id}`),
              (old) => old || {
                ...event,
                by: account.name,
                byKey: key,
                owner: m.opponent.key,
                outcome: draw ? "d" : won ? "l" : "w"
              }
            );
        }
        async function ghostRequest(m, command) {
          const ref = db.ref(`${ghostRoot}/matches/${m.id}`), playUid = m.members[0].uid;
          m = await tx(ref, (raw) => {
            var _a, _b, _c, _d, _e;
            if (!raw) throw Error("MATCH_NOT_FOUND");
            if (["settled", "cancelled"].includes(raw.phase)) return raw;
            let n = copy(raw), ts = Math.max(now(), ((_a = n.game) == null ? void 0 : _a.time) || 0);
            n.votes || (n.votes = {});
            const beforeStart = n.phase === "play" && now() < n.game.startAt;
            if (command.type === "abortInitialization") {
              if ((_c = (_b = n.game) == null ? void 0 : _b.seq) == null ? void 0 : _c[m.members.find((x) => x.key === key).uid])
                throw Error("\u5BFE\u6226\u304C\u9032\u884C\u3057\u3066\u3044\u307E\u3059\u3002\u6700\u65B0\u306E\u72B6\u614B\u304B\u3089\u518D\u958B\u3057\u3066\u304F\u3060\u3055\u3044");
              n.phase = "cancelled";
              return n;
            }
            if (command.type === "leave") {
              if (n.phase === "vote" || beforeStart) {
                n.phase = "cancelled";
                return n;
              }
              n.game.result = { winner: "_ghost", reason: "leave" };
            } else if (n.phase === "vote") {
              if (command.type === "vote") {
                if (!["A", "B"].includes(command.mode)) throw Error("INVALID_MODE");
                n.votes[playUid] = command.mode;
              }
              if (n.votes[playUid] || ts >= n.voteEnd) {
                n.mode = n.votes[playUid] || "B";
                n.phase = "play";
                n.game = E.begin(
                  n.id,
                  n.difficulty,
                  n.mode,
                  [playUid, "_ghost"],
                  n.seed,
                  ts + 3800
                );
              }
            } else if (!beforeStart) {
              n = G.advance(n, ts);
              if (!n.game.result && ["answer", "special"].includes(command.type)) {
                if (!Number.isSafeInteger(command.seq) || command.seq < 1)
                  throw Error("INVALID_SEQUENCE");
                if (command.seq > (n.game.seq[playUid] || 0)) {
                  if (command.seq !== (n.game.seq[playUid] || 0) + 1)
                    throw Error("SEQUENCE_GAP");
                  const rec = aRecord(n.game, playUid, command, ts);
                  n.game = E.step(n.game, playUid, command, ts);
                  if (rec) {
                    n.learning || (n.learning = {});
                    (_d = n.learning)[playUid] || (_d[playUid] = []);
                    n.learning[playUid].push(rec);
                  }
                  n.game.seq[playUid] = command.seq;
                }
              }
            }
            if ((_e = n.game) == null ? void 0 : _e.result) {
              const r = C.ratingView(n.snapshots[key][n.difficulty], ts), o = n.game.result.draw ? "draw" : n.game.result.winner === playUid ? "win" : "lose";
              const after = G.ratingAfter(
                r.rating,
                n.opponent.rating,
                o,
                r.games,
                n.origin === "quick"
              );
              n.phase = "settled";
              n.receipt = {
                at: ts,
                result: n.game.result,
                players: {
                  [key]: {
                    before: r.rating,
                    after,
                    delta: Math.round((after - r.rating) * 10) / 10
                  }
                }
              };
              n.exp = o === "win" ? 8 : 0;
            }
            return clean(n);
          });
          if (m.phase === "cancelled") {
            await tx(db.ref(ghostRoot), (u) => ({ ...u, activeMatch: null }));
            ghostActive = null;
          }
          return response(m.phase === "cancelled" ? null : m);
        }
        async function request(command) {
          var _a, _b, _c, _d;
          if (closed) throw Error("\u753B\u9762\u304C\u9589\u3058\u3089\u308C\u307E\u3057\u305F");
          if (command.protocol !== void 0 && command.protocol !== 2)
            throw Error("UPDATE_REQUIRED");
          await ensure();
          if (command.type === "directGhost") {
            if (!["easy", "normal"].includes(command.difficulty) || !["bounty", "profile"].includes(command.origin))
              throw Error("INVALID_GHOST_REQUEST");
            const active = await find();
            if (active) {
              if (((_a = active.opponent) == null ? void 0 : _a.key) === command.target && active.difficulty === command.difficulty && active.origin === command.origin)
                return response(active);
              throw Error(
                "\u7D9A\u884C\u4E2D\u306E\u5BFE\u6226\u304C\u3042\u308A\u307E\u3059\u3002\u30AA\u30F3\u30E9\u30A4\u30F3\u753B\u9762\u3078\u623B\u308A\u3001\u305D\u306E\u5BFE\u6226\u3092\u7D42\u3048\u3066\u304B\u3089\u958B\u59CB\u3057\u3066\u304F\u3060\u3055\u3044"
              );
            }
            if (!ghostReady) throw Error("\u30B4\u30FC\u30B9\u30C8\u6A5F\u80FD\u306E\u6E96\u5099\u4E2D\u3067\u3059");
            const a = (await db.ref(`games/factor/accounts/${command.target}`).get()).val();
            if (command.origin === "bounty" && (((_b = a == null ? void 0 : a.stats) == null ? void 0 : _b.streak) || 0) < 3)
              throw Error("\u73FE\u5728\u3053\u306E\u30D7\u30EC\u30A4\u30E4\u30FC\u306B\u306F\u8CDE\u91D1\u304C\u3042\u308A\u307E\u305B\u3093");
            if (command.target === key || !G.eligible(a))
              throw Error("20\u554F\u4EE5\u4E0A\u306E\u5B66\u7FD2\u8A18\u9332\u304C\u5FC5\u8981\u3067\u3059");
            const cooldown = (await db.ref(`${ghostRoot}/bountyCooldowns/${command.target}`).get()).val();
            if (command.origin === "bounty" && (cooldown || 0) > now())
              throw Error("\u3053\u306E\u8CDE\u91D1\u9996\u306F7\u65E5\u9593\u4F11\u606F\u4E2D\u3067\u3059");
            const d = command.difficulty, p = (await profileRef.get()).val(), target = (await db.ref(`${ROOT}/profiles/${command.target}`).get()).val(), rt = (target == null ? void 0 : target[d]) ? C.ratingView(target[d], now()).rating : d === "easy" ? (_d = (_c = a.stats) == null ? void 0 : _c.rating) != null ? _d : 1500 : 1500;
            return beginGhost(
              d,
              {
                type: "ghost",
                key: command.target,
                base: a.name,
                name: a.name + "\u306E\u30B4\u30FC\u30B9\u30C8",
                rating: rt,
                rank: G.rank(rt),
                rankDifference: G.rank(rt) - G.rank(p[d].rating),
                profile: G.profile(a.prof, a.stats)
              },
              command.origin
            );
          }
          if (command.type === "ratings") return response(null, true);
          if (command.type === "enqueue") return enqueue(command.difficulty);
          if (command.type === "equipTitle") {
            await tx(profileRef, (p) => {
              var _a2;
              if (!((_a2 = p.badges) == null ? void 0 : _a2[command.title])) throw Error("TITLE_NOT_EARNED");
              return { ...p, title: command.title };
            });
            return response(await find(), true);
          }
          if (command.type === "ackReceipt" && String(command.matchId).startsWith("ghost-")) {
            const gm = await getMatch(command.matchId);
            if (!gm || gm.phase !== "settled") throw Error("UNKNOWN_RECEIPT");
            await response(gm);
            await tx(db.ref(ghostRoot), (u) => ({ ...u, activeMatch: null }));
            if (gm.origin === "quick")
              await tx(profileRef, (p) => ({
                ...p,
                lastAckMatchId: gm.id,
                activeMatch: null
              }));
            ghostActive = null;
            currentMatch = null;
            return response();
          }
          if (command.type === "ackReceipt") {
            await tx(profileRef, (p) => {
              if (p.lastMatchId !== command.matchId) throw Error("UNKNOWN_RECEIPT");
              return { ...p, lastAckMatchId: command.matchId, activeMatch: null };
            });
            currentMatch = null;
            return response();
          }
          if (command.type === "cancel") {
            if (ticket && difficulty)
              await tx(db.ref(`${ROOT}/slots/${difficulty}`), (cur) => {
                var _a2;
                if (!cur || cur.id !== ticket) return cur;
                if (cur.uid === uid) return null;
                if (((_a2 = cur.claim) == null ? void 0 : _a2.uid) === uid) {
                  const n = { ...cur };
                  delete n.claim;
                  return n;
                }
                return cur;
              });
            ticket = null;
            difficulty = null;
            const active = await find();
            if (active && !["settled", "cancelled"].includes(active.phase))
              return request({ type: "abortInitialization", matchId: active.id });
            return response(active);
          }
          let m = command.matchId ? await getMatch(command.matchId) : await find();
          if (!m) m = await intrusion();
          if (m == null ? void 0 : m.opponent) return ghostRequest(m, command);
          if (!m) {
            if (ticket && difficulty)
              await tx(
                db.ref(`${ROOT}/slots/${difficulty}`),
                (cur) => (cur == null ? void 0 : cur.id) === ticket && cur.uid === uid ? { ...cur, until: now() + 25e3 } : cur
              );
            return response();
          }
          if (!m.members.some((x) => x.uid === uid && x.key === key) && !["settled", "cancelled"].includes(m.phase))
            throw Error("\u3053\u306E\u8A66\u5408\u3092\u5225\u306E\u30ED\u30B0\u30A4\u30F3\u72B6\u614B\u3067\u9032\u884C\u4E2D\u3067\u3059");
          if (["settled", "cancelled"].includes(m.phase)) return response(m);
          m = await tx(db.ref(`${ROOT}/matches/${m.id}`), (raw) => {
            var _a2, _b2, _c2, _d2, _e, _f;
            if (!raw) throw Error("MATCH_NOT_FOUND");
            if (command.type === "abortInitialization") {
              if (raw.receipt || Object.values(((_a2 = raw.game) == null ? void 0 : _a2.seq) || {}).some((n) => n > 0) || ((_c2 = (_b2 = raw.game) == null ? void 0 : _b2.claims) == null ? void 0 : _c2.length))
                throw Error("\u5BFE\u6226\u304C\u9032\u884C\u3057\u3066\u3044\u307E\u3059\u3002\u6700\u65B0\u306E\u72B6\u614B\u304B\u3089\u518D\u958B\u3057\u3066\u304F\u3060\u3055\u3044");
              return { ...raw, phase: "cancelled" };
            }
            const model = {
              enabled: true,
              players: copy(raw.snapshots),
              queue: {},
              matches: { [raw.id]: copy(raw) },
              settlements: {}
            };
            const ts = raw.phase === "play" && now() < raw.game.startAt ? now() : Math.max(now(), ((_d2 = raw.game) == null ? void 0 : _d2.time) || 0);
            const next = C.transition(
              model,
              { uid, key },
              { ...command, protocol: 2, matchId: raw.id },
              ts,
              { mode: Math.random() < 0.5 ? "A" : "B" }
            ).state.matches[raw.id];
            const rec = aRecord(raw.game, uid, command, ts);
            if (rec && ((_e = next.game.seq) == null ? void 0 : _e[uid]) === command.seq) {
              next.learning || (next.learning = {});
              (_f = next.learning)[uid] || (_f[uid] = []);
              next.learning[uid].push(rec);
            }
            return clean(next);
          });
          return response(m);
        }
        return {
          request,
          close() {
            closed = true;
            pr.off("value", listen);
          }
        };
      }
      module.exports = { create, ROOT, tx };
    }
  });

  // src/event-host-client.cjs
  var require_event_host_client = __commonJS({
    "src/event-host-client.cjs"(exports, module) {
      async function grant({
        db,
        teacher,
        target,
        tournament,
        raid,
        now = Date.now
      }) {
        await db.ref(`games/factor/eventHosts/${target}`).set({
          enabled: !!(tournament || raid),
          tournament: !!tournament,
          raid: !!raid,
          teacher: teacher.key,
          updatedAt: now()
        });
      }
      async function revoke({ db, teacher, uid, target, now = Date.now }) {
        const taken = /* @__PURE__ */ new Set();
        for (let pass = 0; pass < 2; pass++) {
          const rooms = (await db.ref(`games/factor/eventHostRooms/${target}`).get()).val() || {}, patches = {};
          for (const code of Object.keys(rooms)) {
            const m = (await db.ref(`games/factor/rooms/${code}/meta`).get()).val();
            if ((m == null ? void 0 : m.delegatedAccount) === target && m.acct === target) {
              patches[`rooms/${code}/meta`] = {
                ...m,
                host: uid,
                acct: teacher.key,
                takenOverAt: now(),
                takenOverBy: teacher.key
              };
              taken.add(code);
            }
          }
          if (pass === 0)
            patches[`eventHosts/${target}`] = {
              enabled: false,
              tournament: false,
              raid: false,
              teacher: teacher.key,
              updatedAt: now()
            };
          if (Object.keys(patches).length)
            await db.ref("games/factor").update(patches);
        }
        return [...taken];
      }
      module.exports = { grant, revoke };
    }
  });

  // <stdin>
  window.OnlineSpark = require_online_spark_client();
  window.EventHost = require_event_host_client();
})();
