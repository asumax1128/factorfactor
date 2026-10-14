const crypto = require("node:crypto"),
  Engine = require("./engine.cjs");
const copy = (x) => JSON.parse(JSON.stringify(x));
const season = (t) => new Date(t + 9 * 3600e3).toISOString().slice(0, 7);
const normalize = (r, s) => {
  r.seasonHist ||= {};
  if (r.season !== s) {
    r.seasonHist[r.season] = { last: r.rating, max: r.seasonMax };
    r.rating =
      r.rating <= 1500
        ? 1500
        : Math.round((1500 + (r.rating - 1500) / 2) * 10) / 10;
    r.season = s;
    r.seasonMax = r.rating;
  }
  return r;
};
function badges(e, n, had = {}) {
  return {
    ...had,
    ...(e >= 1730 ? { easy_adept: true } : {}),
    ...(e >= 1820 ? { easy_master: true } : {}),
    ...(n >= 1730 ? { normal_adept: true } : {}),
    ...(n >= 1820 ? { normal_master: true } : {}),
    ...(e >= 1820 && n >= 1820 ? { dual_master: true } : {}),
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
    seasonHist: {},
  };
}
function migrate(state, accounts, migrationId, now) {
  if (!/^[a-zA-Z0-9_-]+$/.test(migrationId))
    throw Error("INVALID_MIGRATION_ID");
  const n = copy(
    state || {
      players: {},
      queue: {},
      matches: {},
      settlements: {},
      migrations: {},
    },
  );
  n.migrations ||= {};
  n.players ||= {};
  for (const [key, a] of Object.entries(accounts)) {
    if (!/^a[a-z0-9_]+$/.test(key)) throw Error("INVALID_ACCOUNT_KEY");
    if (typeof a.name !== "string" || a.name.length < 1 || a.name.length > 10)
      throw Error("INVALID_ACCOUNT_NAME");
    if (n.players[key]) continue;
    const v = a.stats?.rating ?? 1500;
    if (typeof v !== "number" || !Number.isFinite(v))
      throw Error("INVALID_LEGACY_RATING:" + key);
    const rt = Engine.runtime(
      Engine.begin("migration", "easy", "A", ["one", "two"], "migration", now),
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
          (b) => b.id,
        ),
      },
    };
  }
  n.migrations[migrationId] ||= {
    at: now,
    count: Object.keys(accounts).length,
  };
  n.cutoverAt ||= now;
  return n;
}
function settle(n, m, now) {
  if (n.settlements[m.id]) return;
  if (!m.game?.result) throw Error("UNVERIFIED_RESULT");
  if (m.mode === "A") m.game.aResult ||= Engine.reportA(m.game);
  const [a, b] = m.members.map((x) => x.key),
    d = m.difficulty,
    s = season(now);
  const ra = normalize(n.players[a][d], s),
    rb = normalize(n.players[b][d], s);
  const score = m.game.result.draw
    ? 0.5
    : m.game.result.winner === m.members[0].uid
      ? 1
      : 0;
  const deltas = [
    32 * (score - 1 / (1 + 10 ** ((rb.rating - ra.rating) / 400))),
    32 * (1 - score - 1 / (1 + 10 ** ((ra.rating - rb.rating) / 400))),
  ];
  const receipt = {
    difficulty: d,
    mode: m.mode,
    at: now,
    result: copy(m.game.result),
    players: {},
  };
  for (const [i, key] of [a, b].entries()) {
    const r = n.players[key][d],
      outcome = i === 0 ? score : 1 - score,
      before = r.rating;
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
      n.players[key].badges,
    );
    receipt.players[key] = {
      before,
      after: r.rating,
      delta: r.rating - before,
    };
  }
  n.settlements[m.id] = receipt;
  m.phase = "settled";
  m.receipt = receipt;
}
function transition(state, actor, cmd, now, entropy) {
  const n = copy(state);
  n.queue ||= {};
  n.matches ||= {};
  n.settlements ||= {};
  if (!actor?.uid || !n.players?.[actor.key])
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
  let m =
    (cmd.matchId && n.matches[cmd.matchId]) ||
    Object.values(n.matches).find(
      (x) =>
        x.members.some((u) => u.key === actor.key) &&
        !["settled", "cancelled"].includes(x.phase),
    );
  if (cmd.type === "status" && !m)
    return {
      state: n,
      ticket: waiting && waiting.until > now ? waiting.id : null,
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
      (q) =>
        q.difficulty === cmd.difficulty &&
        q.key !== actor.key &&
        q.uid !== actor.uid,
    );
    if (other) {
      delete n.queue[other.id];
      const id = entropy.id;
      n.matches[id] = {
        id,
        difficulty: cmd.difficulty,
        phase: "vote",
        voteEnd: now + 10000,
        members: [{ uid: other.uid, key: other.key }, actor],
        votes: {},
        lastSeen: { [other.uid]: now, [actor.uid]: now },
        seed: entropy.seed,
      };
      return { state: n, matchId: id };
    }
    n.queue[entropy.id] = {
      ...actor,
      id: entropy.id,
      difficulty: cmd.difficulty,
      until: now + 25000,
    };
    return { state: n, ticket: entropy.id };
  }
  if (cmd.type === "cancel") {
    const q = n.queue[cmd.ticket];
    if (q && q.key === actor.key && q.uid === actor.uid)
      delete n.queue[cmd.ticket];
    return { state: n, matchId: m?.id || null };
  }
  if (cmd.type === "heartbeat" && !m) {
    if (waiting?.until <= now) delete n.queue[waiting.id];
    else if (waiting?.uid === actor.uid) waiting.until = now + 25000;
    return {
      state: n,
      ticket: waiting && waiting.until > now ? waiting.id : null,
    };
  }
  if (
    !m ||
    m.id !== cmd.matchId ||
    !m.members.some((u) => u.key === actor.key && u.uid === actor.uid)
  )
    throw Error("NOT_PARTICIPANT");
  m.votes ||= {};
  if (m.game) {
    m.game.seq ||= {};
    m.game.claims ||= [];
    m.game.locks ||= {};
    m.game.states ||= {};
  }
  if (["settled", "cancelled"].includes(m.phase))
    return { state: n, matchId: m.id };
  if (cmd.type === "leave") {
    if (m.phase === "vote" || (m.phase === "play" && now < m.game.startAt))
      m.phase = "cancelled";
    else if (m.phase === "play") {
      m.game.result = {
        winner: m.members.find((x) => x.uid !== actor.uid).uid,
        reason: "leave",
      };
      settle(n, m, now);
    }
    return { state: n, matchId: m.id };
  }
  const absent = m.members.find(
    (x) => x.uid !== actor.uid && now - m.lastSeen[x.uid] > 8000,
  );
  if (absent) {
    if (m.phase === "vote" || (m.phase === "play" && now < m.game.startAt))
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
        now + 3800,
        m.rulesVersion === 2 ? {rules:'b2',duration:m.duration||90} : {},
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
  const rows = Object.entries(state.players || {})
    .map(([key, p]) => ({
      key,
      name: p.name,
      title: p.title || null,
      cosmetics: p.cosmetics || {},
      statsKnown: p.statsKnown !== false,
      ...normalize(copy(p[d]), season(now)),
    }))
    .filter((r) => (d === "easy" ? r.rating >= 1501 : r.games >= 3));
  rows.sort(
    (a, b) =>
      b.rating - a.rating ||
      (b.games ? b.w / b.games : 0) - (a.games ? a.w / a.games : 0) ||
      a.key.localeCompare(b.key),
  );
  let rank = 0;
  return rows.map((r, i) => {
    if (
      !i ||
      r.rating !== rows[i - 1].rating ||
      (r.games ? r.w / r.games : 0) !==
        (rows[i - 1].games ? rows[i - 1].w / rows[i - 1].games : 0)
    )
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
  ratingView: (r, now) => normalize(copy(r), season(now)),
};
