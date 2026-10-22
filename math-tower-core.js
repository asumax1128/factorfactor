/* Chapter-one trial engine. Policy values come from approved private content. */
(function (root) {
  "use strict";
  const CAPS = { easy: 4, normal: 7, hard: 9 },
    COMBO = [1, 1.2, 1.4, 1.5];
  const copy = (x) => JSON.parse(JSON.stringify(x));
  // Ver.6.12: the floor count and the boss floor come from the scenario (layout() fills them
  // from content.floors). Without them the chapter-one values apply: 5 floors, boss on floor 5.
  const lastFloor = (p) => (p && p.floorCount) || 5,
    bossFloor = (p) => (p && p.bossFloor) || lastFloor(p);
  function layout(content) {
    const floors = Object.keys((content && content.floors) || {})
      .map(Number)
      .sort((a, b) => a - b);
    if (!floors.length || floors.some((f, i) => f !== i + 1))
      throw Error("Invalid floors");
    return validatePolicy({
      ...content.policy,
      floorCount: floors.length,
      bossFloor: content.policy.bossFloor || floors.length,
    });
  }
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
    if (
      p.floorCount !== undefined &&
      (!Number.isInteger(p.floorCount) ||
        p.floorCount < 1 ||
        !Number.isInteger(p.bossFloor) ||
        p.bossFloor < 1 ||
        p.bossFloor > p.floorCount)
    )
      throw Error("Invalid floors");
    return p;
  }
  function begin(floor, difficulty, hp, p) {
    validatePolicy(p);
    if (
      !Number.isInteger(floor) ||
      floor < 1 ||
      floor > lastFloor(p) ||
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
      n.hp = Math.max(0, s.hp - p.miss * (s.floor === bossFloor(p) ? 2 : 1));
      return n;
    }
    n.correct++;
    n.combo++;
    n.bestCombo = Math.max(n.bestCombo, n.combo);
    n.answerMs += Math.max(0, ms);
    n.damage += COMBO[Math.min(3, n.combo - 1)];
    n.solvedHigh = n.solvedHigh || s.lv >= 8;
    n.won =
      n.damage >= (s.floor === bossFloor(p) ? p.bossUnits : 8) &&
      (!p.hardHighGuard ||
        s.floor === bossFloor(p) ||
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
      enemyRemaining: Math.max(0, (s.floor === bossFloor(p) ? p.bossUnits : 8) - s.damage),
      verified: false,
      purpose: "trial",
      rulesVersion: p.id,
    };
  }
  function fresh() {
    return {
      schemaVersion: 1,
      progressVersion: 2,
      adventures: {},
      clearedFloors: {},
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
  // The RTDB envelope remains schemaVersion 1; progressVersion is the app format.
  function migrate(value) {
    const raw = copy(value || {}),
      n = { ...fresh(), ...raw };
    if ((raw.progressVersion || 1) > 2 || (raw.schemaVersion || 1) > 1)
      throw Error(
        "この記録には新しい版の数学の塔が必要です。更新してから読み込んでください",
      );
    for (const k of [
      "read",
      "reveal",
      "seen",
      "kills",
      "notes",
      "newInfo",
      "history",
      "clearedFloors",
      "adventures",
    ])
      n[k] = n[k] || {};
    n.difficulties = Object.fromEntries(
      Object.keys(CAPS).map((d) => [
        d,
        {
          best: 0,
          hp: 100,
          ...(raw.difficulties || {})[d],
          records: Object.fromEntries(
            Object.entries(
              ((raw.difficulties || {})[d] || {}).records || {},
            ).filter(([, r]) => r != null),
          ),
        },
      ]),
    );
    if (raw.progressVersion !== 2 && value) {
      n.migrationBackup = raw; // immutable original, including unknown fields
      n.migration = { from: 1, to: 2 };
      for (const d of Object.keys(CAPS)) {
        const old = (raw.difficulties || {})[d];
        if (!old) continue;
        const pending =
          raw.pendingStory && raw.pendingStory.difficulty === d
            ? raw.pendingStory
            : null;
        const played =
          old.best > 0 ||
          old.hp < 100 ||
          Object.values(raw.history || {}).some(
            (x) => x && x.difficulty === d,
          ) ||
          pending ||
          raw.activeDifficulty === d;
        if (old.adventure && old.adventure.difficulty === d)
          n.adventures[d] = copy(old.adventure);
        else if (!n.adventures[d] && played)
          n.adventures[d] = {
            difficulty: d,
            // progressVersion 1 records exist only for chapter one (5 floors).
            floor: pending ? pending.floor : Math.min(5, old.best + 1),
            hp: old.hp,
            phase: pending
              ? "post"
              : old.best >= 5
                ? "cleared"
                : old.hp <= 0
                  ? "defeated"
                  : "ready",
            startedAt: raw.startedAt || 0,
          };
      }
      // A legacy visit with no result had no difficulty field: preserve evidence,
      // do not guess which difficulty that visit belonged to.
      delete n.pendingStory;
    }
    for (const d of Object.values(n.difficulties)) {
      if (raw.progressVersion !== 2)
        for (let f = 1; f <= d.best; f++) n.clearedFloors[f] = true;
      for (const f of Object.keys(d.records)) n.clearedFloors[f] = true;
    }
    for (const [f, count] of Object.entries(n.kills))
      if (count > 0) n.clearedFloors[f] = true;
    n.progressVersion = 2;
    return n;
  }
  function startAdventure(progress, difficulty, now) {
    if (!CAPS[difficulty]) throw Error("Invalid difficulty");
    const n = migrate(progress);
    n.adventures[difficulty] = {
      difficulty,
      floor: 1,
      hp: 100,
      phase: "ready",
      startedAt: now,
    };
    return n;
  }
  function restoreAdventure(progress, difficulty) {
    const n = copy(progress),
      original = migrate(n.migrationBackup).adventures[difficulty];
    if (!n.migrationBackup || !original)
      throw Error("復元できる冒険がありません");
    n.adventures[difficulty] = copy(original);
    return n;
  }
  function finishStory(progress, difficulty, p) {
    const n = copy(progress),
      a = n.adventures[difficulty];
    if (a && a.phase === "post") {
      a.phase = a.floor === lastFloor(p) ? "cleared" : "ready";
      a.floor = Math.min(lastFloor(p), a.floor + 1);
    }
    return n;
  }
  function complete(progress, s, p, id, now, mode = "adventure") {
    const n = migrate(progress);
    if (n.history[id]) return n;
    const r = result(s, p);
    n.history[id] = {
      ...r,
      floor: s.floor,
      difficulty: s.difficulty,
      mode,
      at: now,
    };
    const d = n.difficulties[s.difficulty];
    if (mode === "adventure") {
      d.hp = s.won && s.floor === bossFloor(p) ? Math.min(100, s.hp + p.bossHeal) : s.hp;
      n.adventures[s.difficulty] = {
        ...(n.adventures[s.difficulty] || {}),
        difficulty: s.difficulty,
        floor: s.floor,
        hp: d.hp,
        phase: s.won ? "post" : "defeated",
      };
    }
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
      n.clearedFloors[s.floor] = true;
      if (s.floor === lastFloor(p)) {
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
    layout,
    lastFloor,
    bossFloor,
    begin,
    answer,
    timeout,
    result,
    fresh,
    complete,
    migrate,
    startAdventure,
    restoreAdventure,
    finishStory,
    copy,
  };
  if (typeof module !== "undefined") module.exports = api;
  else root.MathTowerRules = api;
})(typeof window === "undefined" ? globalThis : window);
