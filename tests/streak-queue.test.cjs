// Ver.6.3 audit: the Spark stats hand-over queue (src/streak-queue-next.cjs) with a fake db.
const test = require('node:test'), assert = require('node:assert/strict');
const Q = require('../src/streak-queue-next.cjs'), Spark = require('../src/spark-stats-next.cjs'), Streak = require('../src/streak-next.cjs');
const store = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
// a fake stats node with transaction semantics: `fail` makes the next n transactions reject, `abort` makes them resolve uncommitted
const fakeDb = (init = {}) => { const d = { v: init, fail: 0, abort: 0, calls: 0 }; d.ref = () => ({ transaction: async (fn) => { d.calls++; if (d.fail > 0) { d.fail--; throw new Error('offline'); } if (d.abort > 0) { d.abort--; return { committed: false }; } const nv = fn(JSON.parse(JSON.stringify(d.v))); d.v = nv; return { committed: true }; } }); return d; };
const entry = (n, o = 'w') => ({ id: 's-' + n, t: 1e12 + n * 60000, o, s: 's' });

test('a flush after an EMPTY flush still runs (the stale "running" promise bug)', async () => {
  const db = fakeDb(), q = Q.create({ db, key: 'k', storage: store() });
  assert.deepEqual(await q.flush(), { left: 0 });
  q.enqueue(entry(1)); assert.deepEqual(await q.flush(), { left: 0 }); assert.equal(db.v.sg, 1);
});
test('an entry leaves the queue only after the stats commit (failure / abort keep it, a retry counts once)', async () => {
  const db = fakeDb(), q = Q.create({ db, key: 'k', storage: store() });
  q.enqueue(entry(1)); db.fail = 1; assert.deepEqual(await q.flush(), { left: 1 }); assert.equal(q.pending(), 1);
  db.abort = 1; assert.deepEqual(await q.flush(), { left: 1 }); assert.equal(q.pending(), 1); assert.equal(db.v.sg, undefined);
  assert.deepEqual(await q.flush(), { left: 0 }); assert.equal(db.v.sg, 1);
  q.enqueue(entry(1)); await q.flush(); assert.equal(db.v.sg, 1, 'the same match again is a duplicate (match log / ledger)');
});
test('a result 65+ matches late is applied (counted once, never a streak) and leaves the queue', async () => {
  const db = fakeDb(), q = Q.create({ db, key: 'k', storage: store() });
  for (let i = 0; i < 70; i++) q.enqueue(entry(100 + i)); await q.flush(); assert.equal(db.v.sg, 70);
  q.enqueue({ id: 's-ancient', t: 1000, o: 'w', s: 's' }); const best = db.v.sk.best;
  assert.deepEqual(await q.flush(), { left: 0 }); assert.equal(db.v.sg, 71, 'counted'); assert.equal(db.v.sk.best, best); assert.equal(q.pending(), 0);
  q.enqueue({ id: 's-ancient', t: 1000, o: 'w', s: 's' }); await q.flush(); assert.equal(db.v.sg, 71, 'not twice');
});
test('the queue survives a lost write: the entry is rebuilt from the receipt later (idempotent by match id)', async () => {
  const db = fakeDb(), s1 = store(), q1 = Q.create({ db, key: 'k', storage: s1 });
  const broken = { getItem: s1.getItem, setItem() { throw new Error('storage'); }, removeItem: s1.removeItem };
  const lost = Q.create({ db, key: 'k', storage: broken }); lost.enqueue(entry(5)); await lost.flush(); assert.equal(db.v.sg, undefined, 'the entry was lost with the storage write');
  q1.enqueue(entry(5)); await q1.flush(); assert.equal(db.v.sg, 1, 'rebuilt from the verified receipt');
  q1.enqueue(entry(5)); await q1.flush(); assert.equal(db.v.sg, 1);
  assert.ok(Streak.LEDGER_MAX === 64);
});
