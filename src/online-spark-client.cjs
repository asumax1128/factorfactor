// Spark-only transport: clients can write their own profile and shared matches
// they participate in. No Admin SDK, external server, secret or Functions call.
const C = require("../server/online-rated/core.cjs"),
  E = require("../server/online-rated/engine.cjs"),
  G = require("./ghost-model.cjs");
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
  const listener = () => {};
  ref.on("value", listener);
  try {
    await ref.get();
    const r = await ref.transaction(fn, undefined, false);
    if (!r.committed) throw Error("SAVE_NOT_COMMITTED");
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
}) {
  const key = account?.key;
  let profiles = {},
    closed = false;
  const pr = db.ref(`${ROOT}/profiles`),
    profileRef = db.ref(`${ROOT}/profiles/${key}`);
  const listen = (s) => {
    profiles = s.val() || {};
  };
  pr.on("value", listen, () => {});
  let ticket = null,
    difficulty = null,
    currentMatch = null,
    searchStarted = null,
    ghostReady = false,
    ghostActive = null;
  const ghostRoot = `games/factor/ghostV1/users/${key}`;
  async function checkGhost() {
    try {
      const v = (await db.ref(ghostRoot).get()).val();
      ghostReady = true;
      ghostActive = v?.activeMatch || ghostActive;
      return v;
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
    let p = (await profileRef.get()).val();
    if (p) return p;
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
      return (await profileRef.get()).val();
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
      if (!p) throw Error("PROFILE_REQUIRED");
      if (p.processed?.[m.id]) return p;
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
  }
  async function response(m = null, withLegacy = false) {
    if (m && (!m.opponent || m.origin === "quick")) await apply(m);
    if (m?.opponent && m.phase === "settled") await saveGhostResult(m);
    if (m?.phase === "settled") {
      const playUid = m.members.find((u) => u.key === key).uid;
      const rows =
        m.mode === "B"
          ? m.game.states?.[playUid]?.hist || []
          : m.learning?.[playUid] || [];
      await learning(m.id, rows);
    }
    let p = (await profileRef.get()).val();
    profiles[key] = p;
    const players = { ...profiles };
    if (withLegacy) {
      const [profileSnapshot, legacySnapshot] = await Promise.all([
        pr.get(),
        db.ref("games/factor/accounts").get(),
      ]);
      Object.assign(players, profileSnapshot.val() || {});
      p = players[key];
      const legacy = legacySnapshot.val() || {};
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
      const accounts =
        (await db.ref("games/factor/accounts").get()).val() || {};
      for (const [k, player] of Object.entries(players)) {
        player.cosmetics = {
          stats: accounts[k]?.stats || {},
          name: accounts[k]?.name || player.name,
        };
        player.statsKnown = player.statsKnown !== false;
      }
    }
    const ranks = {
      easy: C.rankings({ players }, "easy", now()),
      normal: C.rankings({ players }, "normal", now()),
    };
    return {
      ticket: m ? null : ticket,
      searchStarted,
      ghostReady,
      match: m
        ? {
            id: m.id,
            selfUid: m.members.find((u) => u.key === key)?.uid || uid,
            phase: m.phase,
            difficulty: m.difficulty,
            mode: m.mode || null,
            voteEnd: m.voteEnd,
            votes: m.votes || {},
            opponent: m.opponent || null,
            origin: m.origin || "human",
            exp: m.exp || 0,
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
      const gm = ghostUser.matches?.[ghostUser.activeMatch];
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
      snapshots: { [key]: p },
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
      now() - searchStarted < 10000
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
    const opponent = G.select({
      accounts: all,
      profiles,
      key,
      random,
      difficulty,
      rating: C.ratingView(p[difficulty], now()).rating,
      bot,
    });
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
  async function ghostRequest(m, command) {
    const ref = db.ref(`${ghostRoot}/matches/${m.id}`),
      playUid = m.members[0].uid;
    m = await tx(ref, (raw) => {
      if (!raw) throw Error("MATCH_NOT_FOUND");
      if (["settled", "cancelled"].includes(raw.phase)) return raw;
      let n = copy(raw),
        ts = Math.max(now(), n.game?.time || 0);
      n.votes ||= {};
      if (command.type === "leave") {
        if (n.phase === "vote" || ts < n.game.startAt) {
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
          );
        }
      } else {
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
    if (closed) throw Error("画面が閉じられました");
    if (command.protocol !== undefined && command.protocol !== 2)
      throw Error("UPDATE_REQUIRED");
    await ensure();
    if (command.type === "directGhost") {
      if (
        !["easy", "normal"].includes(command.difficulty) ||
        !["bounty", "profile"].includes(command.origin)
      )
        throw Error("INVALID_GHOST_REQUEST");
      if (await find()) throw Error("対戦を終えてから開始してください");
      if (!ghostReady) throw Error("ゴースト機能の準備中です");
      const a = (
        await db.ref(`games/factor/accounts/${command.target}`).get()
      ).val();
      if (command.origin === "bounty" && (a?.stats?.streak || 0) < 3)
        throw Error("現在このプレイヤーには賞金がありません");
      if (command.target === key || !G.eligible(a))
        throw Error("20問以上の学習記録が必要です");
      const u = (await db.ref(ghostRoot).get()).val();
      if (
        command.origin === "bounty" &&
        (u?.bountyCooldowns?.[command.target] || 0) > now()
      )
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
          name: a.name + "のゴースト",
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
      return response(await find());
    }
    let m = command.matchId ? await getMatch(command.matchId) : await find();
    if (!m) m = await intrusion();
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
    m = await tx(db.ref(`${ROOT}/matches/${m.id}`), (raw) => {
      if (!raw) throw Error("MATCH_NOT_FOUND");
      const model = {
        enabled: true,
        players: copy(raw.snapshots),
        queue: {},
        matches: { [raw.id]: copy(raw) },
        settlements: {},
      };
      const ts = Math.max(now(), raw.game?.time || 0);
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
      return clean(next);
    });
    return response(m);
  }
  return {
    request,
    close() {
      closed = true;
      pr.off("value", listen);
    },
  };
}
module.exports = { create, ROOT, tx };
