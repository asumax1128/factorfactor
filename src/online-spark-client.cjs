// Spark-only transport: clients can write their own profile and shared matches
// they participate in. No Admin SDK, external server, secret or Functions call.
const C = require("../server/online-rated/core.cjs"),
  E = require("../server/online-rated/engine.cjs"),
  G = require("./ghost-model.cjs");
const Perf = require("./online-performance.cjs");
const BResult = require('./b-result.cjs');
const B2Pump = require('./b2-pump.cjs');
const StreakQueue = require("./streak-queue-next.cjs");
const MatchLog = require("./match-log-next.cjs");
const Keep = require("./title-keep-next.cjs");
const ROOT = "games/factor/onlineSparkV1";
const copy = C.copy;
const id = () => {
  const c = globalThis.crypto;
  if (c.randomUUID) return c.randomUUID();
  return Array.from(c.getRandomValues(new Uint8Array(16)), (v) =>
    v.toString(16).padStart(2, "0"),
  ).join("");
};
const clean = (x) => JSON.parse(JSON.stringify(x));
async function tx(ref, fn) {
  let ready, failed;
  const initial = new Promise((resolve, reject) => {
    ready = resolve;
    failed = reject;
  });
  const listener = () => ready();
  ref.on("value", listener, failed);
  try {
    // Prime the transaction cache once via this listener instead of an extra get.
    await initial;
    let failure;
    const r = await ref.transaction(
      (value) => {
        failure = null;
        try {
          return fn(value);
        } catch (e) {
          failure = e;
          return undefined;
        }
      },
      undefined,
      false,
    );
    // Returning undefined aborts through the SDK's normal promise path. Throwing
    // inside a rerun callback can escape exceptionGuard and strand the request.
    if (!r.committed) throw failure || Error("SAVE_NOT_COMMITTED");
    return r.snapshot.val();
  } finally {
    ref.off("value", listener);
  }
}
function aRecord(game, uid, command, ts) {
  if (
    game?.mode !== "A" ||
    command.type !== "answer" ||
    command.seq <= (game.seq?.[uid] || 0)
  )
    return null;
  const v = E.view(copy(game), uid),
    api = E.runtime(copy(game)).api;
  const f = command.tiles?.map(
    (id) => v.tiles.find((t) => t.id === id)?.factor,
  );
  if (f?.length !== 2 || f.some((x) => !x)) return null;
  return {
    lv: v.level,
    ok: api.polyEqual(api.multiply(...f), v.poly),
    ms: Math.max(0, ts - v.startAt),
    q: Number(v.question),
  };
}
function create({
  db,
  uid,
  account,
  now = Date.now,
  bot = () => ({ name: "CPU", rt: 1500 }),
  learning = async () => {},
  random = Math.random,
  modernB = true,
  storage = typeof sessionStorage !== "undefined" ? sessionStorage : null,
  queueStorage = typeof localStorage !== "undefined" ? localStorage : null,
}) {
  db = Perf.instrument(db);
  const key = account?.key,
    writerSession = id();
  let profiles = {},
    closed = false,
    ownProfile = null,
    ensured = false,
    localGhost = null,
    savedRevision = 0,
    checkpoint = null,
    checkpointTask = null,
    checkpointError = null,
    lastCheckpoint = 0;
  const pr = db.ref(`${ROOT}/profiles`),
    profileRef = db.ref(`${ROOT}/profiles/${key}`);
  const ownListen = (s) => {
    ownProfile = s.val();
  };
  profileRef.on("value", ownListen, () => {});
  let ticket = null,
    difficulty = null,
    currentMatch = null,
    searchStarted = null,
    ghostReady = false,
    ghostActive = null;
  let matchCache=null,matchWatch=null;
  const stopMatchWatch=()=>{if(matchWatch){matchWatch.ref.off('value',matchWatch.fn);matchWatch=null;}matchCache=null;};
  const watchMatch=m=>{if(m?.game?.rules!=='b2'||m.opponent)return;if(matchWatch?.id===m.id)return;stopMatchWatch();matchCache=copy(m);const ref=db.ref(`${ROOT}/matches/${m.id}`),fn=s=>{const v=s.val();if(!v)return;if(matchCache&&v.revision<(matchCache.revision||0))return;matchCache=v;};matchWatch={id:m.id,ref,fn};ref.on('value',fn,()=>{stopMatchWatch()});};
  let connected = false;
  const reconnects = new Set();
  const connectionRef = db.ref(".info/connected");
  const connectionListen = (s) => {
    connected = !!s.val();
    if (connected) {
      for (const resume of reconnects) resume();
      reconnects.clear();
    }
  };
  connectionRef.on("value", connectionListen);
  const waitConnection = () =>
    connected
      ? Promise.resolve()
      : new Promise((resolve) => reconnects.add(resolve));
  const ghostRoot = `games/factor/ghostV1/users/${key}`;
  const draftKey = `fxf_ghost_checkpoint_v517:${key}:${uid}`;
  const remember = () => {
    if (closed) return;
    try {
      storage?.setItem(
        draftKey,
        JSON.stringify({ base: savedRevision, match: localGhost }),
      );
    } catch (_) {}
  };
  const forget = () => {
    try {
      storage?.removeItem(draftKey);
    } catch (_) {}
  };

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
      throw Error("登録アカウントでログインしてください");
    skFlush().catch(() => {});
    if (ensured && ownProfile) return ownProfile;
    let p = (await profileRef.get()).val();
    if (p) {
      ownProfile = p;
      ensured = true;
      return p;
    }
    const legacy = (await db.ref(`games/factor/accounts/${key}`).get()).val();
    if (!legacy?.name)
      throw Error("アカウントを確認できません。ログインし直してください");
    const init = C.migrate(
      null,
      { [key]: legacy },
      "spark-legacy-to-easy-v1",
      now(),
    ).players[key];
    // Only name/stats are backed up; never copy account credentials or PINs.
    const next = {
      name: legacy.name,
      easy: init.easy,
      normal: init.normal,
      badges: init.badges,
      migrationId: "spark-legacy-to-easy-v1",
      initialRating: init.easy.rating,
      initializedAt: now(),
    };
    try {
      await db.ref(ROOT).update({
        ["profiles/" + key]: next,
        ["backups/" + key]: {
          name: legacy.name,
          stats: legacy.stats || {},
          at: next.initializedAt,
        },
      });
      ownProfile = (await profileRef.get()).val();
      ensured = true;
      return ownProfile;
    } catch (e) {
      const latest = (await profileRef.get()).val();
      if (latest) return latest;
      // The legacy rating may have changed between reading it and the rules check.
      // Never force an old snapshot into the new profile.
      throw Error(
        "引き継ぎ元が更新されたか保存できませんでした。再試行してください",
      );
    }
  }
  async function getMatch(matchId) {
    if (!matchId) return null;
    if (String(matchId).startsWith("ghost-")) {
      if (localGhost?.id === matchId) return copy(localGhost);
      const remote = (
        await db.ref(`${ghostRoot}/matches/${matchId}`).get()
      ).val();
      if (remote) {
        localGhost = copy(remote);
        savedRevision = remote.revision || 0;
        try {
          const draft = JSON.parse(storage?.getItem(draftKey) || "null");
          if (
            draft?.match?.id === matchId &&
            (draft.base === savedRevision ||
              (remote.writerSession === draft.match.writerSession &&
                savedRevision <= draft.match.revision)) &&
            draft.match.revision > savedRevision &&
            remote.phase !== "settled"
          ) {
            localGhost = draft.match;
            checkpoint = copy(localGhost);
            flushCheckpoint();
          }
        } catch (_) {}
      }
      return copy(localGhost);
    }
    if(matchCache?.id===matchId)return copy(matchCache);
    const m=(await db.ref(`${ROOT}/matches/${matchId}`).get()).val();watchMatch(m);return m;
  }
  // Ver.6.0 A7: a settled Spark match (human / BOT-type, not a ghost match) also counts for the official win streak.
  const skQueue = StreakQueue.create({ db, key, storage: queueStorage, now });
  const skFlush = () => skQueue.flush();
  // Ver.6.3: the START of a counted match (human or BOT-type; not ghost / hyper / self practice) is saved in the match log (stats.ml) and confirmed by the
  // server before the first answer. The result later fills the same entry, so a late or queued result cannot land inside an already proven run.
  const handed = new Set();
  const startsCount = (m) => !!m && m.opponent?.key !== key && (!m.opponent || m.opponent.type === "bot");
  const opened = new Map();
  // Resolves { saved, status }: saved = the server confirmed the commit. Only status 'opened' can become evidence (see MatchLog.prove); 'full' = not tracked,
  // the match is still played (the gate opens) but its result will not be evidence.
  function ensureOpen(m) {
    const mid = `s-${m.id}`;
    if (opened.has(mid)) return opened.get(mid);
    const p = (async () => {
      try {
        let status = "failed";
        const r = await db.ref(`games/factor/accounts/${key}/stats`).transaction((st) => {
          st = st || {};
          Keep.ensureKeep(st, { ".sv": "timestamp" });
          status = MatchLog.open(st, { id: mid, kind: "s", startAt: m.game?.startAt, now: now() }).status;
          return st;
        });
        if (!r || !r.committed) return { saved: false, status: "failed" };
        const confirmedAt = now();   // the commit happened before this moment
        if (status === "opened" || status === "exists")
          await Promise.race([db.ref(`games/factor/accounts/${key}/stats`).transaction((st) => { if (!st) return st; MatchLog.prove(st, { id: mid, now: confirmedAt }); return st; }).catch(() => {}), new Promise((res) => setTimeout(res, 1500))]);
        return { saved: true, status };
      } catch (_) { return { saved: false, status: "failed" }; }
    })().then((o) => { if (!o.saved) opened.delete(mid); return o; });
    opened.set(mid, p);
    return p;
  }
  const openGate = (m) => Promise.race([ensureOpen(m).then((o) => o.saved), new Promise((res) => setTimeout(() => res(false), 5000))]);
  const skEnqueue = (e) => skQueue.enqueue(e);
  async function apply(m) {
    if (m.phase !== "settled" || !m.receipt) return;
    if (!m.members.some((u) => u.key === key)) throw Error("NOT_PARTICIPANT");
    const mine = m.receipt.players[key];
    if (!mine) throw Error("INVALID_RECEIPT");
    let fresh = false;
    ownProfile = await tx(profileRef, (p) => {
      fresh = false;
      if (!p) throw Error("PROFILE_REQUIRED");
      if (p.processed?.[m.id]) return p;
      fresh = true;
      const r = C.ratingView(p[m.difficulty], m.receipt.at);
      if (r.rating !== mine.before)
        throw Error("記録の順序が合いません。最新の記録を確認してください");
      const outcome = m.receipt.result.draw
        ? "d"
        : m.members.find((x) => x.uid === m.receipt.result.winner)?.key === key
          ? "w"
          : "l";
      r.rating = mine.after;
      if (m.opponent) {
        r.ghost ||= { games: 0, w: 0, l: 0, d: 0 };
        r.ghost.games++;
        r.ghost[outcome]++;
      } else {
        r.games++;
        r[outcome]++;
      }
      r.maxRating = Math.max(r.maxRating, r.rating);
      r.seasonMax = Math.max(r.seasonMax, r.rating);
      p[m.difficulty] = r;
      p.processed = { ...(p.processed || {}), [m.id]: true };
      p.lastMatchId = m.id;
      p.activeMatch = m.id;
      if (m.opponent)
        p.badges = G.titles(
          m.opponent,
          outcome === "w" ? "win" : outcome === "l" ? "lose" : "draw",
          m.origin,
          p.badges,
        );
      p.badges = C.badges(p.easy.maxRating, p.normal.maxRating, p.badges);
      return p;
    });
    // human matches and BOT-type matches count; learned-ghost / hyper matches and self practice do not
    const countsForStreak = !m.opponent || (m.opponent.type === "bot" && m.opponent.key !== key);
    // The stats hand-over is rebuilt from the verified receipt on every first sight in this session, NOT only when the profile was just saved: a stop between
    // the profile save and the queue write would otherwise never reach the stats. The stats side is idempotent by match id (match log / ledger).
    if (countsForStreak && !handed.has(m.id)) {
      handed.add(m.id);
      const o = m.receipt.result.draw ? "d" : m.members.find((x) => x.uid === m.receipt.result.winner)?.key === key ? "w" : "l";
      const opp = m.members.find((x) => x.key !== key), their = opp && m.receipt.players[opp.key];
      const g = o === "w" && !m.opponent && their && typeof their.before === "number" && typeof mine.before === "number" && their.before - mine.before >= 250 ? 1 : 0;
      skEnqueue({
        id: `s-${m.id}`, t: m.receipt.at, o, s: "s",
        ...(m.mode === "A" || m.mode === "B" ? { m: m.mode } : {}), ...(g ? { g: 1 } : {}), ...(!m.opponent ? { h: 1 } : {}),
      });
    }
    skFlush().catch(() => {});
  }
  async function response(m = null, withLegacy = false) {
    const selfPractice = m?.opponent?.key === key;
    if (m && m.phase === "play" && startsCount(m)) ensureOpen(m).catch(() => {});
    if (m && !selfPractice && (!m.opponent || m.origin === "quick")) await apply(m);
    if (m?.opponent && m.phase === "settled") await saveGhostResult(m);
    if (m?.phase === "settled" && !selfPractice) {
      const playUid = m.members.find((u) => u.key === key).uid;
      const rows =
        m.mode === "B"
          ? m.game.states?.[playUid]?.hist || []
          : m.learning?.[playUid] || [];
      await learning(m.id, rows);
    }
    let p = ownProfile || (await profileRef.get()).val();
    profiles[key] = p;
    let accounts = {};
    const players = { ...profiles };
    if (withLegacy) {
      const [profileSnapshot, legacySnapshot] = await Promise.all([
        pr.get(),
        db.ref("games/factor/accounts").get(),
      ]);
      Object.assign(players, profileSnapshot.val() || {});
      p = players[key];
      const legacy = legacySnapshot.val() || {};
      accounts = legacy;
      for (const [k, a] of Object.entries(legacy)) {
        if (
          players[k] ||
          !a?.name ||
          typeof a.stats?.rating !== "number" ||
          !Number.isFinite(a.stats.rating)
        )
          continue;
        // Read-only preview for accounts that have not opened the new mode.
        // No bulk migration or write to old accounts; a real profile always wins.
        players[k] = {
          name: a.name,
          statsKnown: false,
          easy: {
            rating: a.stats.rating,
            games: 0,
            w: 0,
            l: 0,
            d: 0,
            season: new Date(now() + 9 * 3600e3).toISOString().slice(0, 7),
            maxRating: a.stats.rating,
            seasonMax: a.stats.rating,
          },
          normal: {
            rating: 1500,
            games: 0,
            w: 0,
            l: 0,
            d: 0,
            season: new Date(now() + 9 * 3600e3).toISOString().slice(0, 7),
            maxRating: 1500,
            seasonMax: 1500,
          },
        };
      }
    }
    if (withLegacy) {
      for (const [k, player] of Object.entries(players)) {
        player.cosmetics = {
          stats: accounts[k]?.stats || {},
          name: accounts[k]?.name || player.name,
        };
        player.statsKnown = player.statsKnown !== false;
      }
    }
    const ranks = {
      easy: withLegacy ? C.rankings({ players }, "easy", now()) : [],
      normal: withLegacy ? C.rankings({ players }, "normal", now()) : [],
    };
    return {
      ticket: m ? null : ticket,
      searchStarted,
      ghostReady,
      match: m
        ? {
            id: m.id,
            revision: m.revision || 0,
            serverTime: m.game?.time || 0,
            selfUid: m.members.find((u) => u.key === key)?.uid || uid,
            gameStartAt: m.game?.startAt,
            rules: m.game?.rules || null,
            members: m.members.map((x) => ({ uid: x.uid, name: x.name })),
            phase: m.phase,
            difficulty: m.difficulty,
            mode: m.mode || null,
            voteEnd: m.voteEnd,
            votes: m.votes || {},
            opponent: m.opponent || null,
            origin: m.origin || "human",
            selfPractice,
            aResult: m.phase === "settled" && m.mode === "A" ? (m.game.aResult || E.reportA(m.game)) : null,
            bResult: m.phase === 'settled' && m.game?.rules === 'b2' ? BResult.build(m.game) : null,
            exp: m.exp || 0,
            lastAnswer:
              m.mode === "B"
                ? m.game?.states?.[
                    m.members.find((u) => u.key === key)?.uid
                  ]?.hist?.slice(-1)[0] || null
                : m.learning?.[
                    m.members.find((u) => u.key === key)?.uid
                  ]?.slice(-1)[0] || null,
            game:
              m.phase === "play"
                ? E.view(
                    m.game,
                    m.members.find((u) => u.key === key)?.uid || uid,
                  )
                : null,
            result: m.receipt?.result || null,
            receipt: m.receipt || null,
            outcome: m.receipt
              ? m.receipt.result.draw
                ? "draw"
                : m.members.find((u) => u.uid === m.receipt.result.winner)
                      ?.key === key
                  ? "win"
                  : "lose"
              : null,
          }
        : null,
      ratings: {
        easy: C.ratingView(p.easy, now()),
        normal: C.ratingView(p.normal, now()),
      },
      badges: p.badges || {},
      title: p.title || null,
      rankings: {
        easy: ranks.easy.slice(0, 10),
        normal: ranks.normal.slice(0, 10),
      },
      ranks: {
        easy: ranks.easy.find((r) => r.key === key)?.rank || null,
        normal: ranks.normal.find((r) => r.key === key)?.rank || null,
      },
    };
  }
  async function find() {
    const ghostUser = await checkGhost();
    if (ghostUser?.activeMatch) {
      const gm = await getMatch(ghostUser.activeMatch);
      if (gm && gm.phase !== "cancelled") {
        ghostActive = gm.id;
        return gm;
      }
    }
    const p = (await profileRef.get()).val();
    const m = await getMatch(currentMatch || p?.activeMatch);
    if (
      m &&
      m.phase !== "cancelled" &&
      !(m.phase === "settled" && p.lastAckMatchId === m.id)
    ) {
      currentMatch = m.id;
      return m;
    }
    if (m?.phase === "cancelled") {
      currentMatch = null;
      await tx(profileRef, (p) => ({ ...p, activeMatch: null }));
    }
    if (ticket && difficulty) {
      const slot = (await db.ref(`${ROOT}/slots/${difficulty}`).get()).val();
      if (slot?.id === ticket && slot.claim) {
        const joined = await getMatch(ticket);
        if (joined) {
          currentMatch = ticket;
          await tx(profileRef, (p) => ({ ...p, activeMatch: ticket }));
          if (slot.uid === uid)
            await tx(db.ref(`${ROOT}/slots/${difficulty}`), (cur) =>
              cur?.id === ticket && cur.uid === uid ? null : cur,
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
    if (!cfg?.enabled) throw Error("ただいま対戦の準備中です");
    const active = await find();
    if (active) return response(active);
    if (ticket && difficulty !== d)
      throw Error("検索をキャンセルしてから難易度を変更してください");
    const ref = db.ref(`${ROOT}/slots/${d}`),
      newId = id(),
      ts = now();
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
            until: ts + 25000,
            startedAt: ts,
          };
        if (cur.fallback) throw Error("SEARCH_SLOT_TRANSITION");
        if (cur.uid === uid && cur.key === key)
          return { ...cur, until: ts + 25000 };
        if (cur.key === key) throw Error("同じアカウントで検索中です");
        if (cur.claim && cur.claim.uid !== uid)
          throw Error("相手を検索中です。再試行してください");
        claimed = cur;
        return { ...cur, claim: { uid, key, name: account.name } };
      });
    } catch (e) {
      const latest = (await ref.get()).val();
      if (
        e.message === "SEARCH_SLOT_TRANSITION" ||
        (/permission/i.test(e.message) && (!latest || latest.fallback))
      ) {
        if (attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, 300));
          return enqueue(d, attempt + 1);
        }
        throw Error("検索枠を切り替えています。再試行して相手を探してください");
      }
      throw e;
    }
    ticket = slot.id;
    difficulty = d;
    searchStarted = slot.startedAt || ts;
    if (!claimed) return response();
    const host = (await db.ref(`${ROOT}/profiles/${slot.key}`).get()).val(),
      guest = (await profileRef.get()).val();
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
          difficulty: d,
        },
      },
      matches: {},
      settlements: {},
    };
    const entropy = {
      id: slot.id,
      seed: id() + id(),
      mode: Math.random() < 0.5 ? "A" : "B",
    };
    const next = C.transition(
      model,
      { uid, key },
      { type: "enqueue", difficulty: d, protocol: 2 },
      now(),
      entropy,
    ).state.matches[slot.id];
    next.snapshots = {
      [slot.key]: {
        name: host.name,
        easy: host.easy,
        normal: host.normal,
        badges: host.badges || {},
      },
      [key]: {
        name: guest.name,
        easy: guest.easy,
        normal: guest.normal,
        badges: guest.badges || {},
      },
    };
    const match = await tx(
      db.ref(`${ROOT}/matches/${slot.id}`),
      (cur) => cur || clean(next),
    );
    currentMatch = match.id;
    ticket = null;
    await tx(profileRef, (p) => ({ ...p, activeMatch: match.id }));
    return response(match);
  }
  async function beginGhost(
    d,
    opponent,
    origin = "quick",
    matchId = "ghost-" + id(),
  ) {
    const p = (await profileRef.get()).val();
    const m = {
      id: matchId,
      difficulty: d,
      phase: "vote",
      voteEnd: now() + 10000,
      seed: id() + id(),
      members: [
        { uid, key },
        { uid: "_ghost", key: "_ghost" },
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
          badges: p.badges || {},
        },
      },
      usesSpecial: Math.random() < opponent.profile.sp,
    };
    await tx(db.ref(ghostRoot), (u) => {
      u ||= {};
      if (u.activeMatch && u.matches?.[u.activeMatch]?.phase !== "cancelled")
        return u;
      u.matches ||= {};
      u.matches[matchId] = clean(m);
      u.activeMatch = matchId;
      return u;
    });
    return response(await find());
  }
  async function intrusion() {
    if (
      !ghostReady ||
      !ticket ||
      !difficulty ||
      searchStarted == null ||
      now() - searchStarted < 5000
    )
      return null;
    const ref = db.ref(`${ROOT}/slots/${difficulty}`),
      gid = "ghost-" + ticket;
    // Competes atomically with a human claim. Once reserved, no guest can enter.
    const cur = await tx(ref, (s) =>
      s?.id === ticket && s.uid === uid && !s.claim && !s.fallback
        ? { ...s, fallback: gid }
        : s,
    );
    if (cur?.id !== ticket || cur.claim || cur.fallback !== gid) return find();
    const all = (await db.ref("games/factor/accounts").get()).val() || {},
      p = (await profileRef.get()).val();
    profiles = (await pr.get()).val() || {};
    let opponent;
    try { opponent = G.select({
      accounts: all,
      profiles,
      key,
      random,
      difficulty,
      rating: C.ratingView(p[difficulty], now()).rating,
      bot, now: now(),
    }); } catch(e) {await tx(ref,s=>s?.id===ticket&&s.uid===uid?null:s);ticket=null;difficulty=null;searchStarted=null;throw e;}
    const d = difficulty;
    await beginGhost(d, opponent, "quick", gid);
    await tx(ref, (s) =>
      s?.id === ticket && s.uid === uid && s.fallback === gid ? null : s,
    );
    ticket = null;
    difficulty = null;
    searchStarted = null;
    return find();
  }
  async function saveGhostResult(m) {
    if (m.opponent?.key === key) return; // Self practice cannot award XP/titles or write a passive inbox.
    const result = m.receipt.result,
      won = m.members.find((u) => u.uid === result.winner)?.key === key,
      draw = !!result.draw,
      outcome = draw ? "d" : won ? "w" : "l",
      exp = m.origin === "bounty" ? (won ? 8 : 0) : won ? 8 : 0;
    // XP and its receipt are one own-account transaction. History retries never award twice.
    await tx(db.ref(`games/factor/accounts/${key}/stats`), (s) => {
      s ||= {};
      s.ghostAwards ||= {};
      if (s.ghostAwards[m.id]) return s;
      s.ghostAwards[m.id] = { exp, at: m.receipt.at };
      if (m.opponent.type !== "bot") s.gg = (s.gg || 0) + 1; // Ver.6.0 A9: learned-ghost / hyper matches count for the total-games titles once per match (receipt above); BOT-type matches are counted by the streak hand-over instead
      s.exp = (s.exp || 0) + exp;
      s.ghostTitles = G.titles(
        m.opponent,
        won ? "win" : draw ? "draw" : "lose",
        m.origin,
        s.ghostTitles,
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
      origin: m.origin,
    };
    await tx(db.ref(ghostRoot), (u) => {
      u ||= {};
      u.events ||= {};
      u.events[m.id] ||= event;
      if (m.origin === "bounty" && won) {
        u.bountyCooldowns ||= {};
        u.bountyCooldowns[m.opponent.key] = Math.max(
          u.bountyCooldowns[m.opponent.key] || 0,
          m.receipt.at + 7 * 86400e3,
        );
      }
      return u;
    });
    if (m.opponent.key)
      await tx(
        db.ref(`games/factor/ghostV1/inbox/${m.opponent.key}/${m.id}`),
        (old) =>
          old || {
            ...event,
            by: account.name,
            byKey: key,
            owner: m.opponent.key,
            outcome: draw ? "d" : won ? "l" : "w",
          },
      );
  }
  function flushCheckpoint() {
    if (checkpointTask) return checkpointTask;
    checkpointTask = (async () => {
      while (checkpoint) {
        const next = checkpoint;
        checkpoint = null;
        await waitConnection();
        if (closed) throw Error("CHECKPOINT_CLOSED");
        try {
          await tx(db.ref(`${ghostRoot}/matches/${next.id}`), (remote) => {
            if (
              remote?.revision === next.revision &&
              remote.writerSession === next.writerSession
            )
              return remote;
            if (
              !remote ||
              ((remote.revision || 0) !== savedRevision &&
                !(
                  remote.writerSession === next.writerSession &&
                  (remote.revision || 0) >= savedRevision &&
                  remote.revision <= next.revision
                ))
            )
              throw Error("GHOST_CONFLICT_RESYNC");
            return clean(next);
          });
        } catch (e) {
          if (/disconnect|unavailable|network/i.test(e.message) && !closed) {
            checkpoint ||= next;
            await new Promise((resolve) => setTimeout(resolve, 100));
            // The SDK's connection listener releases the retry after reconnect.
            await waitConnection();
            continue;
          }
          throw e;
        }
        Perf.mark("checkpoint-confirmed", {
          match: next.id,
          revision: next.revision,
          question:
            next.game?.mode === "A"
              ? String(next.game.claims?.length || 0)
              : undefined,
        });
        savedRevision = next.revision || 0;
        remember();
      }
    })()
      .catch((e) => {
        checkpointError = e;
        throw e;
      })
      .finally(() => {
        checkpointTask = null;
      });
    // A background save failure is surfaced by the next action/status, not hidden.
    checkpointTask.catch(() => {});
    return checkpointTask;
  }
  async function ghostRequest(m, command) {
    const playUid = m.members[0].uid;
    const raw = copy(localGhost?.id === m.id ? localGhost : m);
    const issuedAt = now();
    m = ((raw) => {
      if (!raw) throw Error("MATCH_NOT_FOUND");
      if (["settled", "cancelled"].includes(raw.phase)) return raw;
      let n = copy(raw),
        ts = Math.max(issuedAt, n.game?.time || 0);
      n.votes ||= {};
      const beforeStart = n.phase === "play" && now() < n.game.startAt;
      if (command.type === "abortInitialization") {
        if (n.game?.seq?.[m.members.find((x) => x.key === key).uid])
          throw Error("対戦が進行しています。最新の状態から再開してください");
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
            ts + 3800,
            modernB ? { rules:'b2',duration:90 } : {},
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
              n.learning ||= {};
              n.learning[playUid] ||= [];
              n.learning[playUid].push(rec);
            }
            n.game.seq[playUid] = command.seq;
          }
        }
      }
      if (n.game?.result) {
        if (n.mode === "A") n.game.aResult ||= E.reportA(n.game);
        const r = C.ratingView(n.snapshots[key][n.difficulty], ts),
          o = n.game.result.draw
            ? "draw"
            : n.game.result.winner === playUid
              ? "win"
              : "lose";
        const after = G.ratingAfter(
          r.rating,
          n.opponent.rating,
          o,
          r.games,
          n.origin === "quick",
        );
        n.phase = "settled";
        n.receipt = {
          at: ts,
          result: n.game.result,
          players: {
            [key]: {
              before: r.rating,
              after,
              delta: Math.round((after - r.rating) * 10) / 10,
            },
          },
        };
        n.exp = n.opponent.key === key ? 0 : o === "win" ? 8 : 0;
      }
      n.revision = (raw.revision || 0) + 1;
      return clean(n);
    })(raw);
    m.revision = (raw.revision || 0) + 1;
    m.writerSession = writerSession;
    localGhost = copy(m);
    // Only this account owns a simulated opponent. Display/physics run locally;
    // checkpoints are coalesced while a write is in flight. Receipts await durability.
    if (checkpointError) {
      const e = checkpointError;
      checkpointError = null;
      localGhost = null;
      throw e;
    }
    if (
      command.type !== "heartbeat" ||
      issuedAt - lastCheckpoint >= 1000 ||
      m.phase !== "play"
    ) {
      checkpoint = copy(m);
      remember();
      lastCheckpoint = issuedAt;
      flushCheckpoint();
    }
    if (["settled", "cancelled"].includes(m.phase)) await checkpointTask;
    if (m.phase === "cancelled") {
      await tx(db.ref(ghostRoot), (u) => ({ ...u, activeMatch: null }));
      ghostActive = null;
      localGhost = null;
      forget();
    }
    return response(m.phase === "cancelled" ? null : m);
  }
  async function request(command) {
    if (closed) throw Error("画面が閉じられました");
    if (command.protocol !== undefined && command.protocol !== 2)
      throw Error("UPDATE_REQUIRED");
    await ensure();
    if(command.type==='randomGhost'){
      if(!['easy','normal'].includes(command.difficulty)||!['ghost','hyper'].includes(command.kind))throw Error('INVALID_GHOST_REQUEST');
      if(await find())throw Error('続行中の対戦があります');if(!ghostReady)throw Error('ゴースト機能の準備中です');
      const [a,p]=await Promise.all([db.ref('games/factor/accounts').get(),pr.get()]);const accounts=a.val()||{},profiles=p.val()||{};
      const opponent=command.kind==='hyper'?require('./hyper-select.cjs').select({accounts,profiles,key,difficulty:command.difficulty,now:now(),random}):G.select({accounts,profiles,key,difficulty:command.difficulty,rating:C.ratingView(ownProfile[command.difficulty],now()).rating,random:()=>.5,bot});
      if(opponent.type==='bot')throw Error('対戦可能なゴーストの学習記録がありません');return beginGhost(command.difficulty,opponent,'profile');
    }
    if (command.type === "directGhost") {
      if (
        !["easy", "normal"].includes(command.difficulty) ||
        !["bounty", "profile"].includes(command.origin)
      )
        throw Error("INVALID_GHOST_REQUEST");
      const active = await find();
      if (active) {
        if (
          active.opponent?.key === command.target &&
          active.difficulty === command.difficulty &&
          active.origin === command.origin
        )
          return response(active);
        throw Error(
          "続行中の対戦があります。オンライン画面へ戻り、その対戦を終えてから開始してください",
        );
      }
      if (!ghostReady) throw Error("ゴースト機能の準備中です");
      const a = (
        await db.ref(`games/factor/accounts/${command.target}`).get()
      ).val();
      if (command.origin === "bounty" && (a?.stats?.streak || 0) < 3)
        throw Error("現在このプレイヤーには賞金がありません");
      if ((command.target === key && command.origin !== "profile") || !G.eligible(a))
        throw Error("20問以上の学習記録が必要です");
      const cooldown = (
        await db.ref(`${ghostRoot}/bountyCooldowns/${command.target}`).get()
      ).val();
      if (command.origin === "bounty" && (cooldown || 0) > now())
        throw Error("この賞金首は7日間休息中です");
      const d = command.difficulty,
        p = (await profileRef.get()).val(),
        target = (
          await db.ref(`${ROOT}/profiles/${command.target}`).get()
        ).val(),
        rt = target?.[d]
          ? C.ratingView(target[d], now()).rating
          : d === "easy"
            ? (a.stats?.rating ?? 1500)
            : 1500;
      return beginGhost(
        d,
        {
          type: "ghost",
          key: command.target,
          base: a.name,
          name: a.name + (command.target === key ? "のゴースト（自分・練習）" : "のゴースト"),
          rating: rt,
          rank: G.rank(rt),
          rankDifference: G.rank(rt) - G.rank(p[d].rating),
          profile: G.profile(a.prof, a.stats),
        },
        command.origin,
      );
    }
    if (command.type === "ratings") return response(null, true);
    if (command.type === "enqueue") return enqueue(command.difficulty);
    if (command.type === "equipTitle") {
      await tx(profileRef, (p) => {
        if (!p.badges?.[command.title]) throw Error("TITLE_NOT_EARNED");
        return { ...p, title: command.title };
      });
      return response(await find(), true);
    }
    if (
      command.type === "ackReceipt" &&
      String(command.matchId).startsWith("ghost-")
    ) {
      const gm = await getMatch(command.matchId);
      if (!gm || gm.phase !== "settled") throw Error("UNKNOWN_RECEIPT");
      await response(gm);
      await tx(db.ref(ghostRoot), (u) => ({ ...u, activeMatch: null }));
      if (gm.origin === "quick")
        await tx(profileRef, (p) => ({
          ...p,
          lastAckMatchId: gm.id,
          activeMatch: null,
        }));
      ghostActive = null;
      localGhost = null;
      forget();
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
          if (!cur || cur.id !== ticket) return cur;
          if (cur.uid === uid) return null;
          if (cur.claim?.uid === uid) {
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
    if (m && command.type === "answer" && m.phase === "play" && startsCount(m) && !(await openGate(m)))
      throw Error("試合の記録を準備しています。少し待ってからもう一度お試しください");
    if (m?.opponent) return ghostRequest(m, command);
    if (!m) {
      if (ticket && difficulty)
        await tx(db.ref(`${ROOT}/slots/${difficulty}`), (cur) =>
          cur?.id === ticket && cur.uid === uid
            ? { ...cur, until: now() + 25000 }
            : cur,
        );
      return response();
    }
    if (
      !m.members.some((x) => x.uid === uid && x.key === key) &&
      !["settled", "cancelled"].includes(m.phase)
    )
      throw Error("この試合を別のログイン状態で進行中です");
    if (["settled", "cancelled"].includes(m.phase)) return response(m);
    if(m.game?.rules==='b2'&&command.type==='heartbeat'&&m.members[0].uid!==uid&&now()-(m.clock||m.game.startAt)<1400)return response(m);
    // Server stamps, rather than either device's wall clock, order new B inputs.
    // Local feedback still starts at pointer-up; these writes only settle score.
    let serverClock=null;
    const matchRef=db.ref(`${ROOT}/matches/${m.id}`);
    if(m.game?.rules==='b2'){
      if(['answer','leave'].includes(command.type)){
        const inputId=command.type==='answer'?`a${command.seq}`:'leave';
        const intentRef=matchRef.child(`inputs/${uid}/${inputId}`);
        await tx(intentRef,c=>c||clean({...command,at:{'.sv':'timestamp'}}));
      }
      await matchRef.child('clock').set({'.sv':'timestamp'});
      serverClock=(await matchRef.child('clock').get()).val();
    } else if(m.phase==='vote'){
      await matchRef.child('clock').set({'.sv':'timestamp'});
      serverClock=(await matchRef.child('clock').get()).val();
    }
    m = await tx(db.ref(`${ROOT}/matches/${m.id}`), (raw) => {
      if (!raw) throw Error("MATCH_NOT_FOUND");
      if (command.type === "abortInitialization") {
        if (
          raw.receipt ||
          Object.values(raw.game?.seq || {}).some((n) => n > 0) ||
          raw.game?.claims?.length
        )
          throw Error("対戦が進行しています。最新の状態から再開してください");
        return { ...raw, phase: "cancelled" };
      }
      if(raw.game?.rules==='b2'){
        const next=B2Pump.pump(raw,Math.max(serverClock||raw.clock,raw.game.time));
        next.revision=(raw.revision||0)+1;
        if(next.game.result&&!next.receipt){
          const model={players:copy(next.snapshots),settlements:{}};
          C.settle(model,next,next.game.result.at||serverClock);
        }
        return clean(next);
      }
      const model = {
        enabled: true,
        players: copy(raw.snapshots),
        queue: {},
        matches: { [raw.id]: copy(raw) },
        settlements: {},
      };
      if(raw.phase==='vote'&&modernB) {model.matches[raw.id].rulesVersion=2;model.matches[raw.id].duration=90;}
      const ts =
        raw.phase === "play" && now() < raw.game.startAt
          ? now()
          : Math.max(serverClock||now(), raw.game?.time || 0);
      const next = C.transition(
        model,
        { uid, key },
        { ...command, protocol: 2, matchId: raw.id },
        ts,
        { mode: Math.random() < 0.5 ? "A" : "B" },
      ).state.matches[raw.id];
      const rec = aRecord(raw.game, uid, command, ts);
      if (rec && next.game.seq?.[uid] === command.seq) {
        next.learning ||= {};
        next.learning[uid] ||= [];
        next.learning[uid].push(rec);
      }
      next.revision = (raw.revision || 0) + 1;
      return clean(next);
    });
    watchMatch(m);
    return response(m);
  }
  return {
    request,
    async flush() {
      if (checkpointTask) await checkpointTask;
      if (checkpointError) throw checkpointError;
    },
    close() {
      closed = true;
      stopMatchWatch();
      for (const resume of reconnects) resume();
      reconnects.clear();
      connectionRef.off("value", connectionListen);
      profileRef.off("value", ownListen);
    },
  };
}
module.exports = {
  buildAResult: require("./a-result.cjs").build,
  ratingView: C.ratingView,
  create,
  ROOT,
  tx,
  performance: Perf,
  olderView: require("./online-state-order.cjs").older,
};
