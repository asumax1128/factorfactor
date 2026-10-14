// Order only committed views of the same match. A deliberate receipt ACK may
// clear the match; a fresh search may enter a different match.
function older(old, next) {
  if (!old || !next || old.id !== next.id) return false;
  if (["settled", "cancelled"].includes(old.phase) && old.phase !== next.phase)
    return true;
  if (old.phase === "play" && next.phase === "vote") return true;
  if ((next.revision || 0) < (old.revision || 0)) return true;
  if ((next.serverTime || 0) < (old.serverTime || 0) && next.phase === "play")
    return true;
  return !!(
    old.game &&
    next.game &&
    next.game.acceptedSeq < old.game.acceptedSeq
  );
}
module.exports = { older };
