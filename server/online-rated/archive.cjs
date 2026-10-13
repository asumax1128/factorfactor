const C = require("./core.cjs");
const ROOT = "games/factor/onlineRatedV2";
const canonical = (x) =>
  JSON.stringify(x, function (k, v) {
    return v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(
          Object.keys(v)
            .sort()
            .map((key) => [key, v[key]]),
        )
      : v;
  });
async function archiveMatch(db, m) {
  if (!["settled", "cancelled"].includes(m.phase)) return;
  const archived = await db
    .ref(`${ROOT}/matchArchive/${m.id}`)
    .transaction((cur) => cur || C.copy(m), undefined, false);
  if (
    !archived.committed ||
    canonical(archived.snapshot.val().receipt) !== canonical(m.receipt)
  )
    throw Error("ARCHIVE_CONFLICT");
  const active = db.ref(`${ROOT}/privateState`),
    listener = () => {};
  active.on("value", listener);
  try {
    await active.get();
    await active.transaction(
      (s) => {
        if (!s?.matches?.[m.id]) return;
        if (
          !["settled", "cancelled"].includes(s.matches[m.id].phase) ||
          canonical(s.matches[m.id].receipt) !== canonical(m.receipt)
        )
          throw Error("ARCHIVE_CONFLICT");
        delete s.matches[m.id];
        if (s.settlements) delete s.settlements[m.id];
        return s;
      },
      undefined,
      false,
    );
  } finally {
    active.off("value", listener);
  }
}
async function readArchive(db, id, key) {
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(id || "")) return null;
  const m = (await db.ref(`${ROOT}/matchArchive/${id}`).get()).val();
  if (m && !m.members.some((u) => u.key === key))
    throw Error("NOT_PARTICIPANT");
  return m;
}
module.exports = { archiveMatch, readArchive, canonical };
