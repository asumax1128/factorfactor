// Real-player ghosts use only public learning aggregates, never credentials.
const C = require("../server/online-rated/core.cjs");
const E = require("../server/online-rated/engine.cjs");
const thresholds = [-Infinity, 1530, 1580, 1650, 1730, 1820];
const rank = (r) => thresholds.reduce((a, t, i) => (r >= t ? i : a), 0);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const valid = (n) => typeof n === "number" && Number.isFinite(n);
const mean = (a, d) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : d);
function eligible(a) {
  return (
    !!a?.name &&
    Object.values(a.prof?.lv || {}).reduce(
      (s, l) => s + (valid(l?.n) && l.n > 0 ? l.n : 0),
      0,
    ) >= 20
  );
}
function profile(prof, stats, hyper = false) {
  const t = {},
    miss = {},
    tr = [],
    mr = [];
  for (let lv = 1; lv <= 9; lv++) {
    const L = prof?.lv?.["L" + lv];
    if (L?.ok >= 2 && valid(L.ms) && L.ms > 0) {
      const v = clamp(L.ms / L.ok / 1000, 1, 18);
      t["L" + lv] = v;
      tr.push(v / (4 + 0.9 * lv));
    }
    if (L?.n >= 3 && valid(L.ok) && L.ok >= 0 && L.ok <= L.n) {
      const v = clamp(1 - L.ok / L.n, 0.02, 0.45);
      miss["L" + lv] = v;
      mr.push(v);
    }
  }
  for (let lv = 1; lv <= 9; lv++) {
    const k = "L" + lv;
    t[k] =
      Math.round(
        clamp(t[k] ?? (4 + 0.9 * lv) * mean(tr, 1), 1, 18) *
          (hyper ? 0.75 : 1) *
          100,
      ) / 100;
    miss[k] = Math.round((miss[k] ?? mean(mr, 0.12)) * 100) / 100;
  }
  const sp =
    stats?.bGames > 0 && valid(stats.spGames)
      ? clamp(stats.spGames / stats.bGames, 0, 1)
      : 0.8;
  return { t, miss, sp };
}
function category(roll) {
  return roll < 0.05
    ? "up2"
    : roll < 0.2
      ? "up1"
      : roll < 0.75
        ? "same"
        : roll < 0.85
          ? "down1"
          : roll < 0.95
            ? "bot"
            : "hyper";
}
function select({
  accounts,
  profiles = {},
  key,
  difficulty,
  rating,
  random = Math.random,
  bot,
  now = Date.now(),
}) {
  const kind = category(random()),
    band = rank(rating),
    offset = { up2: 2, up1: 1, same: 0, down1: -1 }[kind];
  if(kind==="hyper")return require("./hyper-select.cjs").select({accounts,profiles,key,difficulty,now,random});
  const all = Object.entries(accounts)
    .filter(([k, a]) => k !== key && eligible(a))
    .map(([k, a]) => {
      const rt = profiles[k]?.[difficulty]
        ? C.ratingView(profiles[k][difficulty], Date.now()).rating
        : difficulty === "easy" && valid(a.stats?.rating)
          ? a.stats.rating
          : 1500;
      return {
        key: k,
        base: a.name,
        rating: rt,
        rank: rank(rt),
        prof: a.prof,
        stats: a.stats,
      };
    });
  let pool = offset == null ? all : all.filter((a) => a.rank === band + offset);
  if (!pool.length) pool = all;
  if (kind === "bot" || !pool.length) {
    const b = bot();
    return {
      type: "bot",
      name: b.name + "（BOT）",
      base: b.name,
      rating: b.rt,
      rank: rank(b.rt),
      rankDifference: rank(b.rt) - band,
      profile: profile(null, null),
    };
  }
  const p = pool[Math.floor(random() * pool.length)],
    hyper = kind === "hyper";
  return {
    type: hyper ? "hyper" : "ghost",
    key: p.key,
    base: p.base,
    name: p.base + (hyper ? "のハイパーゴースト" : "のゴースト"),
    rating: p.rating,
    rank: p.rank,
    rankDifference: p.rank - band,
    profile: profile(p.prof, p.stats, hyper),
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
    ...(opponent.type === "hyper" ? { hyper_slayer: true } : {}),
    ...(opponent.type !== "bot" && opponent.rankDifference === 1
      ? { ghost_up1: true }
      : {}),
    ...(opponent.type !== "bot" && opponent.rankDifference === 2
      ? { ghost_up2: true }
      : {}),
  };
}
function random(m) {
  m.rng = (Math.imul(m.rng || 1, 1664525) + 1013904223) >>> 0;
  return m.rng / 4294967296;
}
function advance(raw, now) {
  const m = C.copy(raw),
    bot = "_ghost",
    gp = m.opponent.profile;
  if (m.phase !== "play" || now < m.game.startAt) return m;
  // Persist timing/RNG so retries, reloads and duplicate requests do not re-roll.
  for (let count = 0; count < 100 && !m.game.result; count++) {
    if(m.game.rules==='b2' && m.game.states[bot].freezeUntil>m.game.time){
      const s=m.game.states[bot];m.game=E.step(m.game,bot,{type:'heartbeat'},Math.max(m.game.time,Math.min(now,s.freezeUntil,s.qStart+20000)));
      delete m.cpu;if(m.game.result||m.game.states[bot].freezeUntil>now)break;continue;
    }
    if (m.mode === "B" && m.game.states?.[bot]?.resolving) {
      m.game = E.step(
        m.game,
        bot,
        { type: "heartbeat" },
        Math.max(m.game.time, Math.min(now, m.game.states[bot].nextAt)),
      );
      if (m.game.states[bot].resolving || m.game.result) break;
    }
    const v = E.view(m.game, bot);
    if (m.cpu?.question !== v.question) {
      const at =
        Math.max(v.startAt, v.readyAt || 0) +
        gp.t["L" + v.level] * (0.6 + random(m) * 0.8) * 1000;
      m.cpu = {
        question: v.question,
        at: Math.max(m.game.time, Math.round(at)),
      };
    }
    const deadline = v.startAt + v.timeoutMs;
    if (deadline <= now && m.cpu.at >= deadline) {
      // A suspended tab can pass both the plan and timeout. Commit the timeout
      // before choosing the next board instead of answering an expired question.
      m.game = E.step(
        m.game,
        bot,
        { type: "heartbeat" },
        Math.max(m.game.time, deadline),
      );
      delete m.cpu;
      continue;
    }
    if (m.cpu.at > now) break;
    const rt = E.runtime(m.game),
      a = rt.api;
    let good = [],
      bad = [];
    for (let i = 0; i < v.tiles.length; i++)
      for (let j = i + 1; j < v.tiles.length; j++)
        (a.polyEqual(a.multiply(v.tiles[i].factor, v.tiles[j].factor), v.poly)
          ? good
          : bad
        ).push([v.tiles[i].id, v.tiles[j].id]);
    const correct = random(m) >= gp.miss["L" + v.level],
      pool = correct ? good : bad;
    m.game = E.step(
      m.game,
      bot,
      { type: "answer", question: v.question, tiles: pool[0] || good[0] },
      Math.max(m.game.time, m.cpu.at),
    );
    if (m.mode === "B" && m.game.rules!=='b2' && m.usesSpecial && !m.game.result) {
      const s = m.game.states[bot];
      if (s.sp >= 6 && !m.specialAt)
        m.specialAt = m.game.time + Math.round(600 + random(m) * 1500);
    }
    // A mistake keeps the question, after the standard lock re-think at 40% speed.
    m.cpu.at =
      m.game.time +
      Math.round(
        gp.t["L" + v.level] *
          (0.6 + random(m) * 0.8) *
          1000 *
          (correct ? 1 : 0.4),
      );
    if (m.mode === "A" && !correct)
      m.cpu.at += Math.max(0, (m.game.locks[bot] || 0) - m.game.time);
  }
  if (m.mode === "B" && m.game.rules!=='b2' && m.specialAt && m.specialAt <= now && !m.game.result) {
    const s = m.game.states[bot];
    m.game = E.step(
      m.game,
      bot,
      {
        type: "special",
        kind: s.hp < 40 ? "heal" : s.pend?.length ? "shield" : "big",
      },
      Math.max(m.game.time, m.specialAt),
    );
    delete m.specialAt;
  }
  if (!m.game.result)
    m.game = E.step(
      m.game,
      bot,
      { type: "heartbeat" },
      Math.max(m.game.time, now),
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
  advance,
};
