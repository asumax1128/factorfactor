const fs = require("node:fs"),
  vm = require("node:vm");
const source = fs.readFileSync(require.resolve("./engine-source.js"), "utf8");
const script = new vm.Script(source);
const clone = (x) => JSON.parse(JSON.stringify(x));
const AResult = require("../../src/a-result.cjs");
const banks = new Map();
function runtime(match) {
  match.seq ||= {};
  match.claims ||= [];
  match.locks ||= {};
  match.states ||= {};
  let time = match.time;
  const live = {},
    ko = {},
    events = {},
    engines = {};
  let rng = match.rng || 1;
  const math = Object.create(Math);
  math.random = () => {
    rng = (Math.imul(rng, 1664525) + 1013904223) >>> 0;
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
        if (v !== undefined) put(v);
        return Promise.resolve({ committed: v !== undefined });
      },
    };
  };
  const api = script.runInNewContext(
    { Math: math, Date: Clock, fref, TSV: () => time, fbNow: () => time },
    { timeout: 1000 },
  );
  const conf = api.DIFFICULTY_CONFIG[match.difficulty],
    bankKey = `${match.seed}:${conf.tileCount}`;
  let bank = banks.get(bankKey);
  if (!bank) {
    bank = api.makeBank(match.seed, conf.tileCount);
    banks.set(bankKey, bank);
    if (banks.size > 32) banks.delete(banks.keys().next().value);
  }
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
          match.ids.map((u) => [
            u,
            { ...engines[u]?.s, st: engines[u]?.s.ko ? "ko" : "play" },
          ]),
        ),
        ko,
      }),
      fx: (type, payload) => {
        if (
          !visualReady ||
          !["incoming", "hit", "blocked", "special"].includes(type)
        )
          return;
        match.visualSequence = (match.visualSequence || 0) + 1;
        match.visualEvents = [
          ...(match.visualEvents || []),
          {
            id: match.visualSequence,
            uid,
            type,
            at: time,
            payload: payload ?? null,
          },
        ].slice(-24);
      },
      onClear: (u) => {
        winner = u;
      },
    });
    if (match.states?.[uid])
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
      match.ids.map((u) => [u, clone(engines[u].s)]),
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
    },
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
    rng: 1,
  };
  if (mode === "B") runtime(m).saved();
  return m;
}
function step(match, uid, command, now) {
  const m = clone(match),
    rt = runtime(m),
    { api } = rt;
  if (now - m.time > 3600000) throw Error("MATCH_EXPIRED");
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
      if (
        s.resolving ||
        s.over ||
        command.question !== `${s.cur.level}:${s.cur.k}`
      )
        throw Error("STALE_QUESTION");
      const fs = command.tiles?.map(
        (id) => s.cur.tiles.find((t) => t.id === id)?.factor,
      );
      if (
        fs?.length !== 2 ||
        command.tiles[0] === command.tiles[1] ||
        fs.some((x) => !x)
      )
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
      if (
        now < nextAt() ||
        now < (m.locks[uid] || 0) ||
        command.question !== String(m.claims.length)
      )
        throw Error("STALE_QUESTION");
      const b = api.problemForA(rt.bank, m.claims.length),
        fs = command.tiles?.map(
          (id) => b.tiles.find((t) => t.id === id)?.factor,
        );
      if (
        fs?.length !== 2 ||
        command.tiles[0] === command.tiles[1] ||
        fs.some((x) => !x)
      )
        throw Error("INVALID_TILES");
      if (api.polyEqual(api.multiply(...fs), b.poly)) {
        const j = api.getJudgment(now - nextAt()).label;
        m.claims.push({ uid, at: now, j });
        // Record the awarded points in the same committed claim. No extra write or second scoring path.
        m.claims[m.claims.length - 1].pts = api.scoreA(rt.bank, m.claims, m.ids, N, {}).log.slice(-1)[0].pts;
      } else m.locks[uid] = now + api.A_LOCK_MS;
    }
    if (m.claims.length >= N) {
      const sc = api.scoreA(rt.bank, m.claims, m.ids, N, {}).sc,
        [a, b] = m.ids;
      m.result = {
        winner: sc[a] === sc[b] ? null : sc[a] > sc[b] ? a : b,
        draw: sc[a] === sc[b],
        reason: "clear",
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
  const rt = runtime(match),
    { api } = rt;
  const problem =
    match.mode === "A"
      ? api.problemForA(rt.bank, match.claims.length)
      : match.states[uid].cur;
  return {
    id: match.id,
    mode: match.mode,
    difficulty: match.difficulty,
    result: match.result || null,
    question:
      match.mode === "A"
        ? String(match.claims.length)
        : `${problem.level}:${problem.k}`,
    poly: problem.poly,
    tiles: problem.tiles,
    level: problem.level,
    startAt:
      match.mode === "A"
        ? api.qStartA(match.claims, match.claims.length, match.startAt)
        : match.states[uid].qStart,
    timeoutMs: api.QUESTION_TIMEOUT_MS,
    acceptedSeq: match.seq[uid] || 0,
    visualEvents: match.visualEvents || [],
    resolving: match.mode === "B" && match.states[uid].resolving,
    combo:
      match.mode === "A"
        ? api.scoreA(
            rt.bank,
            match.claims,
            match.ids,
            api.DIFFICULTY_CONFIG[match.difficulty].clearCount,
            {},
          ).cb[uid] || 0
        : match.states[uid].combo,
    readyAt:
      match.mode === "A"
        ? Math.max(
            api.qStartA(match.claims, match.claims.length, match.startAt),
            match.locks[uid] || 0,
          )
        : match.states[uid].nextAt || match.states[uid].qStart,
    live: Object.fromEntries(
      match.ids.map((u) => [
        u,
        match.mode === "B"
          ? {
              hp: match.states[u].hp,
              score: match.states[u].score,
              c: match.states[u].c,
              combo: match.states[u].combo,
              sp: match.states[u].sp,
              shield: nowShield(match.states[u], match.time),
            }
          : api.scoreA(
              rt.bank,
              match.claims,
              match.ids,
              api.DIFFICULTY_CONFIG[match.difficulty].clearCount,
              {},
            ).sc[u],
      ]),
    ),
  };
}
function reportA(match) {
  if (match?.mode !== "A") return null;
  const { api, bank } = runtime(match);
  return AResult.build(api.scoreA(bank, match.claims, match.ids, api.DIFFICULTY_CONFIG[match.difficulty].clearCount, {}), match.claims, match.ids, match.startAt, api.A_NEXT_DELAY);
}
module.exports = { begin, step, view, runtime, reportA };
