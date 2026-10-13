// Spark-only transport: clients can write their own profile and shared matches
// they participate in. No Admin SDK, external server, secret or Functions call.
const C = require("../server/online-rated/core.cjs"),
  E = require("../server/online-rated/engine.cjs");
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
function create({ db, uid, account, now = Date.now }) {
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
    currentMatch = null;
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
      r.games++;
      r[outcome]++;
      r.maxRating = Math.max(r.maxRating, r.rating);
      r.seasonMax = Math.max(r.seasonMax, r.rating);
      p[m.difficulty] = r;
      p.processed = { ...(p.processed || {}), [m.id]: true };
      p.lastMatchId = m.id;
      p.activeMatch = m.id;
      p.badges = C.badges(p.easy.maxRating, p.normal.maxRating, p.badges);
      return p;
    });
  }
  async function response(m = null) {
    if (m) await apply(m);
    const p = (await profileRef.get()).val();
    profiles[key] = p;
    const ranks = {
      easy: C.rankings({ players: profiles }, "easy", now()),
      normal: C.rankings({ players: profiles }, "normal", now()),
    };
    return {
      ticket: m ? null : ticket,
      match: m
        ? {
            id: m.id,
            phase: m.phase,
            difficulty: m.difficulty,
            mode: m.mode || null,
            voteEnd: m.voteEnd,
            votes: m.votes || {},
            game: m.phase === "play" ? E.view(m.game, uid) : null,
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
  async function enqueue(d) {
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
    const slot = await tx(ref, (cur) => {
      claimed = null;
      if (!cur || cur.until <= ts)
        return { id: newId, uid, key, name: account.name, until: ts + 25000 };
      if (cur.uid === uid && cur.key === key)
        return { ...cur, until: ts + 25000 };
      if (cur.key === key) throw Error("同じアカウントで検索中です");
      if (cur.claim && cur.claim.uid !== uid)
        throw Error("相手を検索中です。再試行してください");
      claimed = cur;
      return { ...cur, claim: { uid, key, name: account.name } };
    });
    ticket = slot.id;
    difficulty = d;
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
  async function request(command) {
    if (closed) throw Error("画面が閉じられました");
    if (command.protocol !== undefined && command.protocol !== 2)
      throw Error("UPDATE_REQUIRED");
    await ensure();
    if (command.type === "enqueue") return enqueue(command.difficulty);
    if (command.type === "equipTitle") {
      await tx(profileRef, (p) => {
        if (!p.badges?.[command.title]) throw Error("TITLE_NOT_EARNED");
        return { ...p, title: command.title };
      });
      return response(await find());
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
      return clean(
        C.transition(
          model,
          { uid, key },
          { ...command, protocol: 2, matchId: raw.id },
          ts,
          { mode: Math.random() < 0.5 ? "A" : "B" },
        ).state.matches[raw.id],
      );
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
