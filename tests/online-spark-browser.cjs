const assert = require("node:assert/strict");
const { chromium, context } = require("./browser-harness.cjs");
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  });
  try {
    const t = await context(b);
    const result = await t.page.evaluate(async () => {
      const tree = {
        games: {
          factor: {
            accounts: {
              aa: { name: "A", stats: { rating: 1800 } },
              ab: { name: "B", stats: { rating: 1620 } },
            },
            onlineSparkV1: { config: { enabled: true } },
          },
        },
      };
      let clock = Date.now();
      const observers = new Map(),
        copy = (x) => (x == null ? null : JSON.parse(JSON.stringify(x)));
      const value = (p) => p.split("/").reduce((n, k) => n?.[k], tree) ?? null;
      const snap = (p) => ({
        val: () => copy(value(p)),
        exists: () => value(p) !== null,
      });
      function resolve(v){if(Array.isArray(v))return v.map(resolve);if(v&&typeof v==='object'){if(v['.sv']==='timestamp')return clock;return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,resolve(x)]));}return v;}
      function write(p, v) {
        v=resolve(v);
        const parts = p.split("/");
        let node = tree;
        for (const k of parts.slice(0, -1)) node = node[k] || (node[k] = {});
        if (v === null) delete node[parts.at(-1)];
        else node[parts.at(-1)] = copy(v);
        for (const [q, handlers] of observers)
          for (const f of handlers) f(snap(q));
      }
      const db = {
        ref: (p) => ({
          child:q=>db.ref(p+"/"+q),
          set:async v=>write(p,v),
          get: async () => snap(p),
          on(event, f) {
            if (!observers.has(p)) observers.set(p, new Set());
            observers.get(p).add(f);
            f(snap(p));
          },
          off(event, f) {
            observers.get(p)?.delete(f);
          },
          update: async (data) => {
            for (const [k, v] of Object.entries(data)) write(p + "/" + k, v);
          },
          transaction: async (fn) => {
            const v = fn(copy(value(p)));
            if (v === undefined) return { committed: false, snapshot: snap(p) };
            write(p, v);
            return { committed: true, snapshot: snap(p) };
          },
        }),
      };
      const a = window.OnlineSpark.create({
          db,
          uid: "ua",
          account: { key: "aa", name: "A" },
          now: () => clock,
        }),
        c = window.OnlineSpark.create({
          db,
          uid: "ub",
          account: { key: "ab", name: "B" },
          now: () => clock,
        });
      const migrated = await a.request({ type: "status" });
      await c.request({ type: "status" });
      await a.request({ type: "enqueue", difficulty: "easy" });
      await c.request({ type: "enqueue", difficulty: "normal" });
      await c.request({ type: "cancel" });
      const matched = await c.request({ type: "enqueue", difficulty: "easy" });
      const id = matched.match.id;
      await a.request({ type: "heartbeat" });
      await a.request({ type: "vote", matchId: id, mode: "B" });
      await c.request({ type: "vote", matchId: id, mode: "B" });
      clock += 4000;
      const v = (await a.request({ type: "heartbeat", matchId: id })).match
        .game;
      const co = (f) =>
        f.type === "linear"
          ? [f.a, f.b]
          : f.type === "quadratic"
            ? [f.A, f.B, f.C]
            : [f.k];
      let tiles;
      for (let i = 0; i < v.tiles.length; i++)
        for (let j = i + 1; j < v.tiles.length; j++) {
          const aa = co(v.tiles[i].factor),
            bb = co(v.tiles[j].factor),
            out = { x4: 0, x3: 0, x2: 0, x1: 0, x0: 0 };
          aa.forEach((x, k) =>
            bb.forEach(
              (y, l) =>
                (out["x" + (aa.length + bb.length - 2 - k - l)] += x * y),
            ),
          );
          if (Object.keys(out).every((k) => out[k] === v.poly[k]))
            tiles = [v.tiles[i].id, v.tiles[j].id];
        }
      if (!tiles) throw Error("No valid factor pair");
      await a.request({
        type: "answer",
        matchId: id,
        question: v.question,
        tiles,
        seq: 1,
      });
      await a.request({
        type: "answer",
        matchId: id,
        question: v.question,
        tiles,
        seq: 1,
      });
      const answerCount = value(
        "games/factor/onlineSparkV1/matches/" + id + "/game/states/ua/c",
      );
      clock += 500;
      await a.request({ type: "leave", matchId: id });
      await c.request({ type: "heartbeat", matchId: id });
      const p = value("games/factor/onlineSparkV1/profiles/aa");
      a.close();
      c.close();
      return {
        initial: migrated.ratings.easy.rating,
        normal: migrated.ratings.normal.rating,
        answerCount,
        easyGames: p.easy.games,
        normalGames: p.normal.games,
        old: tree.games.factor.accounts.aa.stats.rating,
      };
    });
    assert.deepEqual(result, {
      initial: 1800,
      normal: 1500,
      answerCount: 1,
      easyGames: 1,
      normalGames: 0,
      old: 1800,
    });
    assert.deepEqual(t.errors, []);
    console.log(
      "PASS shipped Spark bundle math: migrated ratings, separate queues, actual B answer once, own settlement and legacy preservation",
    );
    await t.ctx.close();
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
