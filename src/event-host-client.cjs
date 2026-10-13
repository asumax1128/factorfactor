// Scoped client operations; authorization is enforced by RTDB rules.
async function grant({
  db,
  teacher,
  target,
  tournament,
  raid,
  now = Date.now,
}) {
  await db.ref(`games/factor/eventHosts/${target}`).set({
    enabled: !!(tournament || raid),
    tournament: !!tournament,
    raid: !!raid,
    teacher: teacher.key,
    updatedAt: now(),
  });
}
async function revoke({ db, teacher, uid, target, now = Date.now }) {
  const taken = new Set();
  // First atomic update revokes and moves the observed rooms. A second scan catches
  // a room registered concurrently just before revocation; registration after it
  // is rejected by rules. A lost connection leaves records intact and retryable.
  for (let pass = 0; pass < 2; pass++) {
    const rooms =
        (await db.ref(`games/factor/eventHostRooms/${target}`).get()).val() ||
        {},
      patches = {};
    for (const code of Object.keys(rooms)) {
      const m = (await db.ref(`games/factor/rooms/${code}/meta`).get()).val();
      if (m?.delegatedAccount === target && m.acct === target) {
        patches[`rooms/${code}/meta`] = {
          ...m,
          host: uid,
          acct: teacher.key,
          takenOverAt: now(),
          takenOverBy: teacher.key,
        };
        taken.add(code);
      }
    }
    if (pass === 0)
      patches[`eventHosts/${target}`] = {
        enabled: false,
        tournament: false,
        raid: false,
        teacher: teacher.key,
        updatedAt: now(),
      };
    if (Object.keys(patches).length)
      await db.ref("games/factor").update(patches);
  }
  return [...taken];
}
module.exports = { grant, revoke };
