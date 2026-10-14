// Presentation record from the existing authoritative scoreA output, not a new score formula.
function build(score, claims, ids, startAt, nextDelay) {
  const totals = Object.fromEntries(ids.map(u => [u, 0]));
  const events = score.log.map(e => {
    const c = claims[e.q], pts = e.w ? (Number.isFinite(c?.pts) ? c.pts : e.pts) : 0;
    if (e.w) totals[e.w] += pts;
    const begin = e.q ? claims[e.q - 1]?.at + nextDelay : startAt;
    return { id: String(e.q), question: e.q + 1, winner: e.w || null, pts,
      at: Number.isFinite(c?.at) ? c.at : null,
      ms: Number.isFinite(c?.at) && Number.isFinite(begin) ? Math.max(0, c.at - begin) : null,
      totals: { ...totals } };
  });
  return { version: 1, ids: [...ids], events, scores: { ...score.sc }, best: { ...score.best },
    consistent: ids.every(u => totals[u] === score.sc[u]) };
}
module.exports = { build };
