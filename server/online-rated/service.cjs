const crypto = require("node:crypto"),
  C = require("./core.cjs"),
  E = require("./engine.cjs");
const { archiveMatch, readArchive } = require("./archive.cjs");
const PRIVATE = "games/factor/onlineRatedV2/privateState";
function createService({ db, verifyToken, now = Date.now }) {
  return async function request(token, body) {
    const identity = await verifyToken(token),
      uid = identity.uid,
      key = body.accountKey;
    if (!uid || !/^a[a-z0-9_]+$/.test(key || "")) throw Error("AUTH_REQUIRED");
    const linked = (
      await db.ref(`games/factor/logins/${key}/${uid}`).get()
    ).exists();
    if (!linked) throw Error("LINKED_ACCOUNT_REQUIRED");
    if (!body.command || JSON.stringify(body).length > 4096)
      throw Error("INVALID_REQUEST");
    if (body.command.protocol !== 2) throw Error("UPDATE_REQUIRED");
    const ts = now(),
      entropy = {
        id: crypto.randomUUID(),
        seed: crypto.randomBytes(32).toString("hex"),
        mode: crypto.randomInt(2) ? "A" : "B",
      };
    let out, problem;
    const reference = db.ref(PRIVATE),
      listener = () => {};
    reference.on("value", listener);
    try {
      const known = (await reference.get()).val();
      if (!known?.migrationReady) throw Error("MIGRATION_NOT_READY");
      const legacy = known.players?.[key]
        ? null
        : (await db.ref(`games/factor/accounts/${key}`).get()).val();
      const archived =
        body.command.matchId && !known.matches?.[body.command.matchId]
          ? await readArchive(db, body.command.matchId, key)
          : null;
      if (archived && !["equipTitle", "ackReceipt"].includes(body.command.type))
        return response(known, key, uid, archived, null, ts);
      if (
        body.command.type === "status" &&
        !Object.values(known.matches || {}).some(
          (m) =>
            m.members.some((u) => u.key === key) &&
            !["settled", "cancelled"].includes(m.phase),
        )
      ) {
        const p = known.players[key];
        if (p?.lastMatchId && p.lastMatchId !== p.lastAckMatchId) {
          const old = await readArchive(db, p.lastMatchId, key);
          if (old) return response(known, key, uid, old, null, ts);
        }
      }
      const r = await reference.transaction(
        (raw) => {
          out = null;
          problem = null;
          try {
            if (!raw?.migrationReady) throw Error("MIGRATION_NOT_READY");
            if (!raw.players[key]) {
              if (!legacy?.name || !(legacy.createdAt > raw.cutoverAt))
                throw Error("ACCOUNT_NOT_IN_VERIFIED_MIGRATION");
              raw = C.migrate(
                raw,
                { [key]: { name: legacy.name, stats: {} } },
                "new-accounts-v1",
                ts,
              );
              raw.players[key].legacy.stats = C.copy(legacy.stats || {});
            }
            out = C.transition(raw, { uid, key }, body.command, ts, entropy);
            return out.state;
          } catch (e) {
            problem = e;
            return;
          }
        },
        undefined,
        false,
      );
      if (!r.committed) throw problem || Error("TRANSACTION_FAILED");
      const state = r.snapshot.val(),
        m = out.matchId ? state.matches?.[out.matchId] || archived : null;
      if (m && !m.members.some((x) => x.key === key))
        throw Error("NOT_PARTICIPANT");
      if (
        m &&
        ["settled", "cancelled"].includes(m.phase) &&
        state.matches?.[m.id]
      )
        await archiveMatch(db, m);
      return response(state, key, uid, m, out.ticket, ts);
    } finally {
      reference.off("value", listener);
    }
  };
}
function response(state, key, uid, m, ticket, ts) {
  const p = state.players[key];
  return {
    ticket: ticket || null,
    match: m
      ? {
          id: m.id,
          phase: m.phase,
          difficulty: m.difficulty,
          mode: m.mode || null,
          voteEnd: m.voteEnd,
          votes: m.votes,
          game: m.phase === "play" && m.game ? E.view(m.game, uid) : null,
          result: m.receipt?.result || null,
          outcome: m.receipt?.result
            ? m.receipt.result.draw
              ? "draw"
              : m.members.find((u) => u.uid === m.receipt.result.winner)
                    ?.key === key
                ? "win"
                : "lose"
            : null,
          receipt: m.receipt || null,
        }
      : null,
    ratings: {
      easy: C.ratingView(p.easy, ts),
      normal: C.ratingView(p.normal, ts),
    },
    badges: p.badges,
    rankings: {
      easy: C.rankings(state, "easy", ts).slice(0, 10),
      normal: C.rankings(state, "normal", ts).slice(0, 10),
    },
    ranks: {
      easy:
        C.rankings(state, "easy", ts).find((x) => x.key === key)?.rank || null,
      normal:
        C.rankings(state, "normal", ts).find((x) => x.key === key)?.rank ||
        null,
    },
  };
}
module.exports = { createService, PRIVATE };
