'use strict';
// Ver.6.0 A7: durable hand-over of a Spark match result to the official win streak (accounts/<key>/stats/sk).
// The result is stored in localStorage first and removed only after the stats transaction committed, so a closed tab,
// a lost connection or a refused write is retried by the next flush; the ledger ignores repeats by match id.
const Streak = require('./streak-next.cjs');
const Spark = require('./spark-stats-next.cjs');
const Keep = require('./title-keep-next.cjs');

// The hand-over queue is NOT the streak ledger: a verified result waits here until the stats committed it, however many matches have passed (an entry is ~100 bytes).
// Nothing is dropped silently:
//   * the persisted part (localStorage) holds up to QUEUE_MAX entries; an entry that does not fit, or that the storage refuses, is kept in MEMORY for this session
//     (flushed like the others) and enqueue() says so ({ persisted: false });
//   * only when even the memory part is full does enqueue() refuse ({ ok: false }): the caller must not treat the result as handed over, and the receipt
//     (still unacknowledged) rebuilds it at the next sight.
// `onDone(id)` is called after the stats transaction committed that entry: that is the only moment a result counts as handed over.
const QUEUE_MAX = 500, MEM_MAX = 5000;
const LATE_MS = 120000;   // a Spark result applied this long after the match, with no open entry, is placed nowhere (src/match-log-next.cjs)
function create({ db, key, storage, now = Date.now, onDone = () => {} }) {
  const qKey = `fxf_sk_queue_v1:${key}`, mem = [];
  const read = () => {
    try {
      const q = JSON.parse(storage && storage.getItem(qKey) || '[]');
      return Array.isArray(q) ? q.filter(Spark.validEntry) : [];
    } catch (_) { return []; }
  };
  const write = (q) => {   // true = the storage now holds exactly q
    try { if (q.length) storage.setItem(qKey, JSON.stringify(q)); else storage.removeItem(qKey); return true; } catch (_) { return false; }
  };
  const all = () => { const q = read(); return q.concat(mem.filter((m) => !q.some((x) => x.id === m.id))); };
  let running = null;
  function flush() {
    if (running) return running;
    // The body runs on a microtask AFTER `running` is set: an async body that finishes synchronously (an empty queue) would clear `running` first and then have it
    // overwritten by its own promise, and every later flush of this session would return that stale promise without running.
    running = Promise.resolve().then(async () => {
      try {
        for (;;) {
          const q = all();
          if (!q.length) return { left: 0 };
          const e = q[0];
          let r;
          try {
            r = await db.ref(`games/factor/accounts/${key}/stats`).transaction((st) => {
              st = st || {};
              Keep.ensureKeep(st, { '.sv': 'timestamp' });
              Spark.apply(st, e, { late: now() - e.t > LATE_MS, now: now() });
              return st;
            });
          } catch (_) { return { left: q.length }; }
          if (!r || !r.committed) return { left: q.length };
          const i = mem.findIndex((x) => x.id === e.id); if (i >= 0) mem.splice(i, 1);
          const p = read().filter((x) => x.id !== e.id); if (p.length !== read().length) write(p);
          try { onDone(e.id); } catch (_) {}
        }
      } finally { running = null; }
    });
    return running;
  }
  // -> { ok, persisted }. ok:false only when the entry is invalid or even the memory part is full (nothing was kept).
  function enqueue(e) {
    if (!Spark.validEntry(e)) return { ok: false, persisted: false };
    const q = read();
    if (q.some((x) => x.id === e.id)) return { ok: true, persisted: true };
    if (mem.some((x) => x.id === e.id)) return { ok: true, persisted: false };
    if (q.length < QUEUE_MAX && write(q.concat([e])) && read().some((x) => x.id === e.id)) return { ok: true, persisted: true };
    if (mem.length >= MEM_MAX) return { ok: false, persisted: false };
    mem.push(e);
    return { ok: true, persisted: false };
  }
  return { enqueue, flush, pending: () => all().length };
}

module.exports = { create, QUEUE_MAX, MEM_MAX };
