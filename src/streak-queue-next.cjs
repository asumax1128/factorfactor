'use strict';
// Ver.6.0 A7: durable hand-over of a Spark match result to the official win streak (accounts/<key>/stats/sk).
// The result is stored in localStorage first and removed only after the stats transaction committed, so a closed tab,
// a lost connection or a refused write is retried by the next flush; the ledger ignores repeats by match id.
const Streak = require('./streak-next.cjs');
const Spark = require('./spark-stats-next.cjs');
const Keep = require('./title-keep-next.cjs');

const LATE_MS = 120000;   // a Spark result applied this long after the match, with no open entry, is placed nowhere (src/match-log-next.cjs)
function create({ db, key, storage }) {
  const qKey = `fxf_sk_queue_v1:${key}`;
  const read = () => {
    try {
      const q = JSON.parse(storage && storage.getItem(qKey) || '[]');
      return Array.isArray(q) ? q.filter(Spark.validEntry).slice(-Streak.LEDGER_MAX) : [];
    } catch (_) { return []; }
  };
  const write = (q) => {
    try { if (q.length) storage && storage.setItem(qKey, JSON.stringify(q)); else storage && storage.removeItem(qKey); } catch (_) {}
  };
  let running = null;
  function flush() {
    if (running) return running;
    running = (async () => {
      try {
        for (;;) {
          const q = read();
          if (!q.length) return { left: 0 };
          const e = q[0];
          let r;
          try {
            r = await db.ref(`games/factor/accounts/${key}/stats`).transaction((st) => {
              st = st || {};
              Keep.ensureKeep(st, { '.sv': 'timestamp' });
              Spark.apply(st, e, { late: Date.now() - e.t > LATE_MS });
              return st;
            });
          } catch (_) { return { left: q.length }; }
          if (!r || !r.committed) return { left: q.length };
          write(read().filter((x) => x.id !== e.id));
        }
      } finally { running = null; }
    })();
    return running;
  }
  function enqueue(e) {
    if (!Spark.validEntry(e)) return false;
    const q = read();
    if (!q.some((x) => x.id === e.id)) q.push(e);
    write(q.slice(-Streak.LEDGER_MAX));
    return true;
  }
  return { enqueue, flush, pending: () => read().length };
}

module.exports = { create };
