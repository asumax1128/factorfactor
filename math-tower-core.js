/* Chapter-one trial engine. Policy values come from approved private content. */
(function (root) {
  "use strict";
  const CAPS = { easy: 4, normal: 7, hard: 9 },
    COMBO = [1, 1.2, 1.4, 1.5];
  const copy = (x) => JSON.parse(JSON.stringify(x));
  function validatePolicy(p) {
    if (
      !p ||
      !p.id ||
      ![15, 20].includes(p.bossUnits) ||
      !["double-miss"].includes(p.bossAbility)
    )
      throw Error("試遊ルールが未設定です");
    for (const k of ["miss", "timeout", "problemMs", "bossHeal"])
      if (!Number.isFinite(p[k]) || p[k] < 0)
        throw Error("Invalid policy: " + k);
    if (
      p.problemMs < 1000 ||
      p.bossHeal > 100 ||
      !Array.isArray(p.weights) ||
      p.weights.length !== 3 ||
      p.weights.some((x) => x < 0) ||
      Math.abs(p.weights.reduce((a, b) => a + b, 0) - 1) > 1e-6
    )
      throw Error("Invalid weights");
    if (
      !Array.isArray(p.ranks) ||
      p.ranks.length !== 3 ||
      p.ranks.some((x) => x < 0 || x > 1) ||
      !(p.ranks[0] > p.ranks[1] && p.ranks[1] > p.ranks[2])
    )
      throw Error("Invalid ranks");
    return p;
  }
  function begin(floor, difficulty, hp, p) {
    validatePolicy(p);
    if (
      !Number.isInteger(floor) ||
      floor < 1 ||
      floor > 5 ||
      !CAPS[difficulty] ||
      !Number.isFinite(hp) ||
      hp <= 0 ||
      hp > 100
    )
      throw Error("Invalid battle");
    return {
      floor,
      difficulty,
      hp,
      lv: 1,
      combo: 0,
      bestCombo: 0,
      damage: 0,
      correct: 0,
      misses: 0,
      timeouts: 0,
      answerMs: 0,
      solvedHigh: false,
      won: false,
    };
  }
  function nextLevel(lv, d, p, random = Math.random) {
    if (lv < CAPS[d]) return lv + 1;
    const r = random();
    return r < p.weights[0]
      ? CAPS[d]
      : r < p.weights[0] + p.weights[1]
        ? CAPS[d] - 1
        : CAPS[d] - 2;
  }
  function answer(s, ok, ms, p, random) {
    if (s.won || s.hp <= 0) return s;
    const n = { ...s };
    if (!ok) {
      n.misses++;
      n.combo = 0;
      n.hp = Math.max(0, s.hp - p.miss * (s.floor === 5 ? 2 : 1));
      return n;
    }
    n.correct++;
    n.combo++;
    n.bestCombo = Math.max(n.bestCombo, n.combo);
    n.answerMs += Math.max(0, ms);
    n.damage += COMBO[Math.min(3, n.combo - 1)];
    n.solvedHigh = n.solvedHigh || s.lv >= 8;
    n.won =
      n.damage >= (s.floor === 5 ? p.bossUnits : 8) &&
      (!p.hardHighGuard ||
        s.floor === 5 ||
        s.difficulty !== "hard" ||
        n.solvedHigh);
    n.lv = nextLevel(s.lv, s.difficulty, p, random);
    return n;
  }
  function timeout(s, p) {
    return s.won || s.hp <= 0
      ? s
      : {
          ...s,
          hp: Math.max(0, s.hp - p.timeout),
          timeouts: s.timeouts + 1,
          combo: 0,
        };
  }
  function result(s, p) {
    const total = s.correct + s.misses + s.timeouts,
      accuracy = total ? s.correct / total : 0;
    return {
      rank: s.won
        ? accuracy >= p.ranks[0]
          ? "S"
          : accuracy >= p.ranks[1]
            ? "A"
            : accuracy >= p.ranks[2]
              ? "B"
              : "C"
        : null,
      accuracy,
      correct: s.correct,
      misses: s.misses,
      timeouts: s.timeouts,
      bestCombo: s.bestCombo,
      answerMs: s.answerMs,
      averageMs: s.correct ? s.answerMs / s.correct : 0,
      hp: s.hp,
      enemyRemaining: Math.max(0, (s.floor === 5 ? p.bossUnits : 8) - s.damage),
      verified: false,
      purpose: "trial",
      rulesVersion: p.id,
    };
  }
  function fresh() {
    return {
      schemaVersion: 1,
      purpose: "trial",
      revision: 0,
      startedAt: 0,
      read: {},
      reveal: {},
      seen: {},
      kills: {},
      notes: {},
      newInfo: {},
      fragment: false,
      reward: false,
      history: {},
      difficulties: Object.fromEntries(
        Object.keys(CAPS).map((d) => [d, { best: 0, hp: 100, records: {} }]),
      ),
    };
  }
  function complete(progress, s, p, id, now) {
    const n = copy(progress);
    if (n.history[id]) return n;
    const r = result(s, p);
    n.history[id] = { ...r, floor: s.floor, difficulty: s.difficulty, at: now };
    const d = n.difficulties[s.difficulty];
    d.hp = s.won && s.floor === 5 ? Math.min(100, s.hp + p.bossHeal) : s.hp;
    if (s.won) {
      const old = d.records[s.floor];
      const better =
        old &&
        (r.averageMs < old.averageMs ||
          (r.averageMs === old.averageMs &&
            (r.bestCombo > old.bestCombo ||
              (r.bestCombo === old.bestCombo && r.hp > old.hp))));
      if (
        !old ||
        r.accuracy > old.accuracy ||
        (r.accuracy === old.accuracy && better)
      )
        d.records[s.floor] = {
          ...r,
          firstClearAt: old ? old.firstClearAt : now,
        };
      d.best = Math.max(d.best, s.floor);
      n.notes[s.floor] = true;
      n.newInfo["floor" + s.floor] = true;
      n.kills[s.floor] = (n.kills[s.floor] || 0) + 1;
      n.pendingStory = { floor: s.floor, difficulty: s.difficulty };
      if (s.floor === 5) {
        n.fragment = true;
        n.reward = true;
      }
    }
    return n;
  }
  const api = {
    CAPS,
    COMBO,
    validatePolicy,
    begin,
    answer,
    timeout,
    result,
    fresh,
    complete,
    copy,
  };
  if (typeof module !== "undefined") module.exports = api;
  else root.MathTowerRules = api;
})(typeof window === "undefined" ? globalThis : window);
