(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // server/online-rated/b2.cjs
  var require_b2 = __commonJS({
    "server/online-rated/b2.cjs"(exports, module) {
      var copy = (x) => JSON.parse(JSON.stringify(x));
      var POINTS = { 1: 10, 2: 12, 3: 14, 4: 16, 5: 18, 6: 20, 7: 30, 8: 40, 9: 50 };
      var heal = (ms) => ms <= 2e3 ? 25 : ms <= 3e3 ? 20 : ms <= 5e3 ? 15 : ms <= 1e4 ? 10 : ms <= 15e3 ? 5 : 2;
      var cap = (d) => d === "easy" ? 6 : 3;
      function event(m, uid, type, payload) {
        m.visualEvents || (m.visualEvents = []);
        m.visualSeq = (m.visualSeq || 0) + 1;
        m.visualEvents.push({ id: m.visualSeq, uid, type, payload });
        m.visualEvents = m.visualEvents.slice(-32);
      }
      function scoreEvent(m, uid, gain) {
        if (!m.scoreTrace) return;
        const t = m.scoreTrace;
        t.seq++;
        t.events.push({ id: t.seq, at: m.time, uid, gain, scores: Object.fromEntries(m.ids.map((u) => [u, m.states[u].score])) });
      }
      function board(m, s, bank, api, at) {
        const lv = bank.level(s.c + 1), k = s.served[lv] || 0;
        s.served[lv] = k + 1;
        const b = bank.get(lv, k), tiles = copy(b.tiles);
        s.oj = Math.min(cap(m.difficulty), s.oj + s.queued);
        s.queued = 0;
        if (s.cheerPoints === 30 && s.oj > 0 && s.cheerRemoved < 3) {
          s.oj--;
          s.cheerRemoved++;
          s.cheerPoints = 0;
        }
        let guard = 0;
        while (tiles.length < b.tiles.length + s.oj && guard < 400) {
          const f = bank.get(lv, k + 77 + guard).tiles[guard % b.tiles.length].factor;
          guard++;
          if (tiles.some((t) => JSON.stringify(t.factor) === JSON.stringify(f) || api.polyEqual(api.multiply(t.factor, f), b.poly))) continue;
          tiles.splice(guard * 7 % (tiles.length + 1), 0, { id: `oj${s.serial}_${guard}`, factor: copy(f) });
        }
        s.cur = { level: lv, k, poly: copy(b.poly), tiles, oj: tiles.length - b.tiles.length };
        s.qStart = at;
        s.comboDue = at + 1e4;
        s.resolving = false;
        s.nextAt = null;
        s.serial++;
      }
      function begin(base, duration, bank, api) {
        if (![60, 90, 120, 180].includes(duration)) throw Error("INVALID_DURATION");
        const m = copy(base);
        m.rules = "b2";
        m.duration = duration;
        m.endAt = m.startAt + duration * 1e3;
        m.visualEvents = [];
        m.states = Object.fromEntries(m.ids.map((u) => [u, { hp: 100, c: 0, score: 0, combo: 0, best: 0, gauge: 0, sp: 0, freezeUntil: 0, oj: 0, queued: 0, pending: 0, counterUntil: 0, cheerPoints: 0, cheerRemoved: 0, serial: 0, served: {}, hist: [], resolving: false, nextAt: null }]));
        for (const u of m.ids) board(m, m.states[u], bank, api, m.startAt);
        m.scoreTrace = { version: 1, complete: true, seq: 0, events: [{ id: 0, at: m.startAt, scores: Object.fromEntries(m.ids.map((u) => [u, 0])) }] };
        return m;
      }
      function finish(m, reason) {
        const dead = m.ids.filter((u) => m.states[u].hp <= 0), top = Math.max(...m.ids.map((u) => m.states[u].score));
        const alive = m.ids.filter((u) => !dead.includes(u));
        const best = Math.max(...alive.map((u) => m.states[u].score));
        const winners = reason === "ko" ? alive : alive.filter((u) => m.states[u].score === best);
        m.result = { winner: winners.length === 1 ? winners[0] : null, draw: winners.length !== 1, reason, at: m.time };
        const order = [...m.ids].sort((a, b) => Number(m.states[b].hp > 0) - Number(m.states[a].hp > 0) || (m.states[b].eliminatedAt || 0) - (m.states[a].eliminatedAt || 0) || m.states[b].score - m.states[a].score);
        const rank = {};
        order.forEach((u, i) => {
          const p = order[i - 1], s = m.states[u], prev = m.states[p];
          rank[u] = p && (s.hp > 0 && prev.hp > 0 && s.score === prev.score || s.hp <= 0 && prev.hp <= 0 && s.eliminatedAt === prev.eliminatedAt) ? rank[p] : i + 1;
        });
        m.result.rank = rank;
      }
      function ko(m) {
        for (const u of m.ids) if (m.states[u].hp <= 0 && m.states[u].eliminatedAt == null) m.states[u].eliminatedAt = m.time;
        const alive = m.ids.filter((u) => m.states[u].hp > 0);
        if (alive.length <= 1) {
          finish(m, "ko");
          return true;
        }
        return false;
      }
      function target(m, uid, requested) {
        return m.ids.find((u) => u === requested && u !== uid && m.states[u].hp > 0) || m.ids.slice(m.ids.indexOf(uid) + 1).concat(m.ids).find((u) => u !== uid && m.states[u].hp > 0);
      }
      function automatic(m) {
        for (const u of m.ids) {
          const s = m.states[u], to = target(m, u, s.target), o = m.states[to];
          if (s.hp <= 0 || !o) continue;
          if (s.gauge === 100 && o.freezeUntil <= m.time) {
            s.spUsed = (s.spUsed || 0) + 1;
            s.gauge = s.sp = 0;
            o.freezeUntil = m.time + 3e3;
            event(m, to, "freeze", { until: o.freezeUntil, from: u });
          }
        }
      }
      function advance(m, to, bank, api) {
        var _a;
        m.seq || (m.seq = {});
        for (const s of Object.values(m.states)) {
          s.hist || (s.hist = []);
          s.served || (s.served = {});
        }
        if (to < m.time) throw Error("CLOCK_REVERSED");
        while (!m.result && m.time < to) {
          let t = Math.min(to, m.endAt);
          for (const u of m.ids) {
            const s = m.states[u], f = s.freezeUntil > m.time;
            if (s.hp <= 0) continue;
            t = Math.min(t, m.time + s.hp * 1e3, s.qStart + 2e4);
            for (const d of [s.nextAt, f ? s.freezeUntil : 0, !f && !s.resolving && s.combo > 0 ? s.comboDue + 1 : 0, !f && s.pending ? s.counterUntil : 0]) if (d > m.time) t = Math.min(t, d);
          }
          if (t <= m.time) t = Math.min(to, m.time + 1);
          const dt = t - m.time;
          for (const u of m.ids) {
            const s = m.states[u];
            if (s.freezeUntil > m.time) {
              if (s.combo > 0) s.comboDue += dt;
              if (s.pending) s.counterUntil += dt;
            }
            s.hp = Math.max(0, Math.round((s.hp - dt / 1e3) * 1e6) / 1e6);
            s.minHp = Math.min((_a = s.minHp) != null ? _a : 100, s.hp);
            if (Math.max(...m.ids.filter((v) => v !== u).map((v) => m.states[v].score)) - s.score >= 40) s.behind = true;
          }
          m.time = t;
          if (ko(m)) break;
          if (t >= m.endAt) {
            finish(m, "time");
            break;
          }
          for (const u of m.ids) {
            const s = m.states[u], f = s.freezeUntil > t;
            if (s.hp <= 0) continue;
            if (!f && !s.resolving && s.combo > 0 && s.comboDue < t) s.combo = 0;
            if (!f && s.pending && s.counterUntil <= t) {
              s.queued = Math.min(cap(m.difficulty) - s.oj, s.queued + s.pending);
              s.pending = 0;
              s.counterUntil = 0;
            }
            if (s.resolving && s.nextAt <= t) board(m, s, bank, api, s.nextAt);
            if (!s.resolving && s.qStart + 2e4 <= t) {
              s.combo = 0;
              s.hp = Math.max(0, s.hp - (m.difficulty === "normal" ? 5 : 0));
              s.hist.push({ lv: s.cur.level, k: s.cur.k, ok: false, timeout: true, ms: 2e4 });
              s.resolving = true;
              s.nextAt = t + 420;
              s.qStart = t;
            }
          }
          if (ko(m)) break;
          automatic(m);
        }
        return m;
      }
      function step(raw, uid, cmd, now, bank, api) {
        var _a, _b;
        const m = advance(copy(raw), now, bank, api);
        if (m.result) return m;
        const s = m.states[uid], to = target(m, uid, cmd.target), o = m.states[to];
        if (!s) throw Error("NOT_PARTICIPANT");
        if (cmd.type === "heartbeat") return m;
        if (cmd.type === "cheer") {
          const actor = cmd.actor || cmd.viewer;
          if (m.ids.includes(actor) || m.ids.includes(cmd.viewer)) throw Error("PLAYER_CANNOT_CHEER");
          m.cheerReceipts || (m.cheerReceipts = {});
          const id = actor + ":" + cmd.seq;
          if (m.cheerReceipts[id]) return m;
          const used = Object.values(m.cheerReceipts).filter((x) => x.viewer === cmd.viewer).length;
          const actorUsed = Object.values(m.cheerReceipts).filter((x) => (x.actor || x.viewer) === actor).length;
          if (used >= 3 || actorUsed >= 3 || !Number.isInteger(cmd.seq) || cmd.seq < 1 || cmd.seq > 3) throw Error("CHEER_LIMIT");
          m.cheerReceipts[id] = { viewer: cmd.viewer, actor, target: uid };
          s.cheerPoints = Math.min(30, s.cheerPoints + 10);
          return m;
        }
        if (cmd.type === "special") throw Error("FREEZE_IS_AUTOMATIC");
        if (s.hp <= 0) throw Error("KO");
        s.target = to;
        if (s.freezeUntil > now) throw Error("FROZEN");
        if (s.resolving || cmd.question !== `${s.cur.level}:${s.cur.k}`) throw Error("STALE_QUESTION");
        const fs = (_a = cmd.tiles) == null ? void 0 : _a.map((id) => {
          var _a2;
          return (_a2 = s.cur.tiles.find((t) => t.id === id)) == null ? void 0 : _a2.factor;
        });
        if ((fs == null ? void 0 : fs.length) !== 2 || cmd.tiles[0] === cmd.tiles[1] || fs.some((f) => !f)) throw Error("INVALID_TILES");
        const ok = api.polyEqual(api.multiply(...fs), s.cur.poly), ms = now - s.qStart;
        if (ok) {
          s.combo++;
          s.best = Math.max(s.best, s.combo);
          const recovery = heal(ms), P = Math.round(POINTS[s.cur.level] * (1 + 0.1 * (s.combo - 1))) + Math.max(0, Math.round(s.hp + recovery - 100));
          const bonus = Math.round(P * 0.1 * s.cur.oj);
          s.score += P + bonus;
          s.hp = Math.min(100, s.hp + recovery);
          s.c++;
          s.oj = Math.max(0, s.oj - 1);
          let attack = s.combo === 1 ? 0 : s.combo === 2 ? 1 : s.combo === 3 ? 2 : 3;
          if (s.pending && s.counterUntil > now) {
            const cancel = Math.min(s.pending, attack);
            s.cancelTotal = (s.cancelTotal || 0) + cancel;
            s.pending -= cancel;
            attack -= cancel;
            if (!s.pending) s.counterUntil = 0;
          }
          const room = Math.max(0, cap(m.difficulty) - o.oj - o.queued - o.pending), arrived = Math.min(attack, room);
          if (arrived) {
            s.ojSent = (s.ojSent || 0) + arrived;
            if (!o.pending) o.counterUntil = now + 3e3;
            o.pending += arrived;
            event(m, to, "incoming", { oj: arrived, until: o.counterUntil });
          }
          if (s.combo >= 2 && s.gauge < 100) s.gauge = Math.min(100, s.gauge + s.cur.level * 3);
          s.sp = s.gauge;
          s.hist.push({ lv: s.cur.level, k: s.cur.k, ok: true, ms, j: api.getJudgment(ms).label, gain: P + bonus, base: P, bonus, oj: s.cur.oj });
          scoreEvent(m, uid, P + bonus);
          if (ms <= 2e3) s.perfects = (s.perfects || 0) + 1;
          automatic(m);
        } else {
          s.combo = 0;
          const dmg = m.difficulty === "easy" ? 20 : 25;
          s.dmgTaken = (s.dmgTaken || 0) + dmg;
          s.hp = Math.max(0, s.hp - dmg);
          s.minHp = Math.min((_b = s.minHp) != null ? _b : 100, s.hp);
          s.hist.push({ lv: s.cur.level, k: s.cur.k, ok: false, ms });
        }
        s.resolving = true;
        s.nextAt = now + 420;
        s.qStart = now;
        ko(m);
        return m;
      }
      function view(m, uid) {
        var _a;
        const s = m.states[uid];
        return { id: m.id, mode: "B", difficulty: m.difficulty, rules: "b2", result: m.result || null, question: `${s.cur.level}:${s.cur.k}`, poly: s.cur.poly, tiles: s.cur.tiles, level: s.cur.level, startAt: s.qStart, timeoutMs: 2e4, acceptedSeq: ((_a = m.seq) == null ? void 0 : _a[uid]) || 0, visualEvents: m.visualEvents || [], resolving: s.resolving, combo: s.combo, readyAt: s.nextAt || s.qStart, endAt: m.endAt, freezeUntil: s.freezeUntil, live: copy(m.states) };
      }
      module.exports = { begin, step, view, advance, heal, cap, POINTS };
    }
  });

  // src/title-catalog-next.json
  var require_title_catalog_next = __commonJS({
    "src/title-catalog-next.json"(exports, module) {
      module.exports = {
        schemaVersion: 1,
        source: "\u6240\u6709\u8005\u63D0\u4F9B \u5168100\u79F0\u53F7 2026-10-15",
        status: "roster-confirmed-reveal-pending",
        expectedNormalCount: 100,
        expectedFiveStarCount: 26,
        excludedAwardModes: [
          "cpu",
          "selfGhost"
        ],
        hidden: {
          id: "factor_factor",
          name: "FACTOR\xD7FACTOR",
          requiredDistinctFiveStar: 15,
          visibleBeforeEarned: false
        },
        titles: [
          {
            number: 1,
            legacyNumber: 1,
            name: "\u6681\u306E\u8987\u8005",
            condition: "\u30C7\u30A4\u30EA\u30FC\u30A4\u30FC\u30B8\u30FC\u512A\u52DD",
            stars: 5,
            id: "daily_easy_king",
            legacyId: "daily_easy_king",
            category: "\u30C7\u30A4\u30EA\u30FC"
          },
          {
            number: 2,
            legacyNumber: 2,
            name: "\u84BC\u7A79\u306E\u8987\u8005",
            condition: "\u30C7\u30A4\u30EA\u30FC\u30CE\u30FC\u30DE\u30EB\u512A\u52DD",
            stars: 5,
            id: "daily_normal_king",
            legacyId: "daily_normal_king",
            category: "\u30C7\u30A4\u30EA\u30FC"
          },
          {
            number: 3,
            legacyNumber: 3,
            name: "\u6DF1\u6DF5\u306E\u8987\u738B",
            condition: "\u30C7\u30A4\u30EA\u30FC\u30CF\u30FC\u30C9\u512A\u52DD",
            stars: 5,
            id: "daily_hard_king",
            legacyId: "daily_hard_king",
            category: "\u30C7\u30A4\u30EA\u30FC"
          },
          {
            number: 4,
            legacyNumber: 4,
            name: "\u5929\u4E0B\u7D71\u4E00",
            condition: "\u540C\u3058\u65E5\u306B\u30C7\u30A4\u30EA\u30FC\u51683\u90E8\u9580\u512A\u52DD",
            stars: 5,
            id: "daily_king",
            legacyId: "daily_king",
            category: "\u30C7\u30A4\u30EA\u30FC"
          },
          {
            number: 5,
            legacyNumber: 92,
            name: "\u958B\u6226\u306E\u72FC\u7159",
            condition: "\u30AA\u30F3\u30E9\u30A4\u30F3\u5BFE\u6226\u3092\u521D\u3081\u30661\u8A66\u5408\u5B8C\u4E86",
            stars: 1,
            id: "online_first",
            legacyId: null,
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 6,
            legacyNumber: 5,
            name: "\u59CB\u307E\u308A\u306E\u5263",
            condition: "\u521D\u3081\u3066\u5BFE\u6226\u306B\u52DD\u5229",
            stars: 1,
            id: "first",
            legacyId: "first",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 7,
            legacyNumber: 91,
            name: "\u767E\u4EBA\u65AC\u308A",
            condition: "A\u30FBB\u65B9\u5F0F\u306E\u30AA\u30F3\u30E9\u30A4\u30F3\u5BFE\u6226\u5408\u7B97\u3067\u901A\u7B97100\u52DD",
            stars: 3,
            id: "wins100_ab",
            legacyId: null,
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 8,
            legacyNumber: 7,
            name: "\u767E\u6226\u932C\u78E8",
            condition: "\u901A\u7B97100\u6226",
            stars: 2,
            id: "games100",
            legacyId: "games100",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 9,
            legacyNumber: 37,
            name: "\u4FEE\u7F85\u306E\u9053",
            condition: "\u901A\u7B97300\u6226",
            stars: 3,
            id: "games300",
            legacyId: "games300",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 10,
            legacyNumber: 6,
            name: "\u6298\u308C\u3056\u308B\u5203",
            condition: "\u901A\u7B9750\u6557",
            stars: 2,
            id: "lose50",
            legacyId: "lose50",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 11,
            legacyNumber: 8,
            name: "\u6C38\u9060\u306E\u30E9\u30A4\u30D0\u30EB",
            condition: "\u540C\u3058\u76F8\u624B\u306820\u6226",
            stars: 2,
            id: "rival20",
            legacyId: "rival20",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 12,
            legacyNumber: 9,
            name: "\u4EA4\u5DEE\u3059\u308B\u904B\u547D",
            condition: "\u7570\u306A\u308B10\u4EBA\u4EE5\u4E0A\u3068\u5BFE\u6226",
            stars: 2,
            id: "wide10",
            legacyId: "wide10",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 13,
            legacyNumber: 44,
            name: "\u4EBA\u6C17\u8005",
            condition: "\u7570\u306A\u308B30\u4EBA\u4EE5\u4E0A\u3068\u5BFE\u6226",
            stars: 3,
            id: "wide30",
            legacyId: "wide30",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 14,
            legacyNumber: 10,
            name: "\u4E8C\u5200\u6D41",
            condition: "A\u30FBB\u65B9\u5F0F\u3067\u305D\u308C\u305E\u308C10\u52DD",
            stars: 3,
            id: "dual",
            legacyId: "dual",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 15,
            legacyNumber: 93,
            name: "\u4E8C\u5200\u7686\u4F1D",
            condition: "A\u30FBB\u65B9\u5F0F\u3067\u305D\u308C\u305E\u308C\u901A\u7B9750\u52DD",
            stars: 4,
            id: "dual50",
            legacyId: null,
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 16,
            legacyNumber: 11,
            name: "\u7834\u7AF9\u306E\u5263",
            condition: "10\u9023\u52DD",
            stars: 4,
            id: "streak10",
            legacyId: "streak10",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 17,
            legacyNumber: 12,
            name: "\u5E38\u52DD\u4E0D\u6557",
            condition: "30\u9023\u52DD",
            stars: 5,
            id: "streak30",
            legacyId: "streak30",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 18,
            legacyNumber: 13,
            name: "\u5929\u4E0B\u7121\u53CC",
            condition: "50\u9023\u52DD",
            stars: 5,
            id: "streak50",
            legacyId: "streak50",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 19,
            legacyNumber: 19,
            name: "\u8D77\u6B7B\u56DE\u751F",
            condition: "\u521D\u3081\u3066\u9006\u8EE2\u52DD\u5229",
            stars: 2,
            id: "comeback",
            legacyId: "comeback",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 20,
            legacyNumber: 20,
            name: "\u904B\u547D\u306E\u53CD\u9006\u8005",
            condition: "\u9006\u8EE2\u52DD\u522910\u56DE",
            stars: 3,
            id: "comeback10",
            legacyId: "comeback10",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 21,
            legacyNumber: 51,
            name: "\u30EA\u30D9\u30F3\u30B8\u30E3\u30FC",
            condition: "\u76F4\u524D\u306E\u8A66\u5408\u3067\u8CA0\u3051\u305F\u76F8\u624B\u306B\u52DD\u5229",
            stars: 2,
            id: "revenge",
            legacyId: "revenge",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 22,
            legacyNumber: 31,
            name: "\u30B8\u30E3\u30A4\u30A2\u30F3\u30C8\u30AD\u30E9\u30FC",
            condition: "\u30EC\u30FC\u30C6\u30A3\u30F3\u30B0200\u4EE5\u4E0A\u9AD8\u3044\u76F8\u624B\u306B\u52DD\u5229",
            stars: 4,
            id: "giant",
            legacyId: "giant",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 23,
            legacyNumber: 96,
            name: "\u738B\u8005\u55B0\u3089\u3044",
            condition: "\u5BFE\u6226\u958B\u59CB\u6642\u306B\u30EC\u30FC\u30C6\u30A3\u30F3\u30B0250\u4EE5\u4E0A\u9AD8\u3044\u76F8\u624B\u306B\u52DD\u5229",
            stars: 5,
            id: "giant250",
            legacyId: null,
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 24,
            legacyNumber: 36,
            name: "\u9006\u5883\u7121\u53CC",
            condition: "\u2605\u2605\u2605\u30CF\u30F3\u30C7\u3092\u80CC\u8CA0\u3063\u3066\u52DD\u5229",
            stars: 5,
            id: "handi",
            legacyId: "handi",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 25,
            legacyNumber: 38,
            name: "\u624D\u80FD\u958B\u82B1",
            condition: "\u30EC\u30FC\u30C6\u30A3\u30F3\u30B01600\u5230\u9054",
            stars: 3,
            id: "master1600",
            legacyId: "master1600",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 26,
            legacyNumber: 21,
            name: "\u6570\u5F0F\u306E\u652F\u914D\u8005",
            condition: "\u30EC\u30FC\u30C6\u30A3\u30F3\u30B01700\u5230\u9054",
            stars: 4,
            id: "master1700",
            legacyId: "master1700",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 27,
            legacyNumber: 39,
            name: "\u771F\u30FB\u56E0\u6570\u738B",
            condition: "\u30EC\u30FC\u30C6\u30A3\u30F3\u30B01900\u5230\u9054",
            stars: 5,
            id: "master1900",
            legacyId: "master1900",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 28,
            legacyNumber: 54,
            name: "\u9EC4\u91D1\u9A0E\u58EB",
            condition: "\u30B4\u30FC\u30EB\u30C9\u30E9\u30F3\u30AF\uFF081580\uFF09\u5230\u9054",
            stars: 3,
            id: "rgold",
            legacyId: "rgold",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 29,
            legacyNumber: 55,
            name: "\u56E0\u6570\u306E\u8987\u738B",
            condition: "\u30DE\u30B9\u30BF\u30FC\u30E9\u30F3\u30AF\uFF081820\uFF09\u5230\u9054",
            stars: 5,
            id: "rmaster",
            legacyId: "rmaster",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 30,
            legacyNumber: 86,
            name: "\u521D\u7D1A\u306E\u8987\u8005",
            condition: "\u30A4\u30FC\u30B8\u30FC1730\u4EE5\u4E0A",
            stars: 4,
            id: "easy_adept",
            legacyId: "easy_adept",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 31,
            legacyNumber: 87,
            name: "\u521D\u7D1A\u306E\u8987\u738B",
            condition: "\u30A4\u30FC\u30B8\u30FC1820\u4EE5\u4E0A",
            stars: 5,
            id: "easy_master",
            legacyId: "easy_master",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 32,
            legacyNumber: 88,
            name: "\u4E2D\u7D1A\u306E\u8987\u8005",
            condition: "\u30CE\u30FC\u30DE\u30EB1730\u4EE5\u4E0A",
            stars: 4,
            id: "normal_adept",
            legacyId: "normal_adept",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 33,
            legacyNumber: 89,
            name: "\u4E2D\u7D1A\u306E\u8987\u738B",
            condition: "\u30CE\u30FC\u30DE\u30EB1820\u4EE5\u4E0A",
            stars: 5,
            id: "normal_master",
            legacyId: "normal_master",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 34,
            legacyNumber: 90,
            name: "\u53CC\u754C\u306E\u8987\u738B",
            condition: "\u30A4\u30FC\u30B8\u30FC\u30FB\u30CE\u30FC\u30DE\u30EB\u4E21\u65B91820\u4EE5\u4E0A",
            stars: 5,
            id: "dual_master",
            legacyId: "dual_master",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 35,
            legacyNumber: 48,
            name: "\u7D99\u7D9A\u306F\u529B\u306A\u308A",
            condition: "7\u65E5\u9023\u7D9A\u3067\u5BFE\u6226",
            stars: 2,
            id: "daily7",
            legacyId: "daily7",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 36,
            legacyNumber: 49,
            name: "\u7686\u52E4\u8CDE",
            condition: "30\u65E5\u9023\u7D9A\u3067\u5BFE\u6226",
            stars: 4,
            id: "daily30",
            legacyId: "daily30",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 37,
            legacyNumber: 56,
            name: "\u30D0\u30A6\u30F3\u30C6\u30A3\u30CF\u30F3\u30BF\u30FC",
            condition: "\u8CDE\u91D1\u9996\u3092\u521D\u3081\u3066\u6483\u7834",
            stars: 2,
            id: "bounty1",
            legacyId: "bounty1",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 38,
            legacyNumber: 57,
            name: "\u4F1D\u8AAC\u306E\u30CF\u30F3\u30BF\u30FC",
            condition: "\u8CDE\u91D1\u9996\u309210\u56DE\u6483\u7834",
            stars: 4,
            id: "bounty10",
            legacyId: "bounty10",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 39,
            legacyNumber: 58,
            name: "\u6307\u540D\u624B\u914D",
            condition: "\u81EA\u5206\u306B50\u4EE5\u4E0A\u306E\u8CDE\u91D1\u304C\u61F8\u304B\u308B\uFF087\u9023\u52DD\uFF09",
            stars: 3,
            id: "wanted",
            legacyId: "wanted",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 40,
            legacyNumber: 81,
            name: "\u8D85\u5F71\u306E\u5F81\u670D\u8005",
            condition: "\u4E71\u5165\u30CF\u30A4\u30D1\u30FC\u30B4\u30FC\u30B9\u30C8\u306B\u521D\u52DD\u5229",
            stars: 4,
            id: "hyper_slayer",
            legacyId: "hyper_slayer",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 41,
            legacyNumber: 82,
            name: "\u4E0B\u514B\u4E0A",
            condition: "1\u30E9\u30F3\u30AF\u4E0A\u306E\u4E71\u5165\u30B4\u30FC\u30B9\u30C8\u306B\u521D\u52DD\u5229",
            stars: 3,
            id: "ghost_up1",
            legacyId: "ghost_up1",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 42,
            legacyNumber: 83,
            name: "\u5927\u756A\u72C2\u308F\u305B",
            condition: "2\u30E9\u30F3\u30AF\u4E0A\u306E\u4E71\u5165\u30B4\u30FC\u30B9\u30C8\u306B\u521D\u52DD\u5229",
            stars: 5,
            id: "ghost_up2",
            legacyId: "ghost_up2",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 43,
            legacyNumber: 24,
            name: "\u96F7\u5149\u4E00\u9583",
            condition: "1\u554F\u30921\u79D2\u4EE5\u5185\u306B\u6B63\u89E3",
            stars: 4,
            id: "flash",
            legacyId: "flash",
            category: "\u6280\u8853"
          },
          {
            number: 44,
            legacyNumber: 94,
            name: "\u795E\u901F\u306E\u9818\u57DF",
            condition: "1\u8A66\u5408\u4E2D\u306B1\u79D2\u4EE5\u5185\u306E\u6B63\u89E3\u30923\u56DE",
            stars: 5,
            id: "flash3",
            legacyId: null,
            category: "\u6280\u8853"
          },
          {
            number: 45,
            legacyNumber: 14,
            name: "\u767D\u9280\u306E\u9583\u5149",
            condition: "Perfect\u901A\u7B9750\u56DE",
            stars: 3,
            id: "perfect50",
            legacyId: "perfect50",
            category: "\u6280\u8853"
          },
          {
            number: 46,
            legacyNumber: 15,
            name: "\u9EC4\u91D1\u306E\u9583\u5149",
            condition: "Perfect\u901A\u7B97100\u56DE",
            stars: 3,
            id: "perfect100",
            legacyId: "perfect100",
            category: "\u6280\u8853"
          },
          {
            number: 47,
            legacyNumber: 16,
            name: "\u767D\u91D1\u306E\u9583\u5149",
            condition: "Perfect\u901A\u7B97300\u56DE",
            stars: 4,
            id: "perfect300",
            legacyId: "perfect300",
            category: "\u6280\u8853"
          },
          {
            number: 48,
            legacyNumber: 17,
            name: "\u91D1\u525B\u306E\u9583\u5149",
            condition: "Perfect\u901A\u7B97500\u56DE",
            stars: 4,
            id: "perfect500",
            legacyId: "perfect500",
            category: "\u6280\u8853"
          },
          {
            number: 49,
            legacyNumber: 18,
            name: "\u7121\u9650\u306E\u9583\u5149",
            condition: "Perfect\u901A\u7B971000\u56DE",
            stars: 5,
            id: "perfect1000",
            legacyId: "perfect1000",
            category: "\u6280\u8853"
          },
          {
            number: 50,
            legacyNumber: 25,
            name: "\u9023\u9396\u306E\u9B54\u8853\u5E2B",
            condition: "1\u8A66\u540820\u30B3\u30F3\u30DC",
            stars: 4,
            id: "combo20",
            legacyId: "combo20",
            category: "\u6280\u8853"
          },
          {
            number: 51,
            legacyNumber: 40,
            name: "\u30B3\u30F3\u30DC\u30DE\u30B9\u30BF\u30FC",
            condition: "1\u8A66\u540830\u30B3\u30F3\u30DC",
            stars: 5,
            id: "combo30",
            legacyId: "combo30",
            category: "\u6280\u8853"
          },
          {
            number: 52,
            legacyNumber: 26,
            name: "\u5B8C\u5168\u52DD\u5229",
            condition: "B\u65B9\u5F0F\u3067\u30DF\u30B9\u30FB\u6642\u9593\u5207\u308C\u306A\u3057\u3067\u52DD\u5229",
            stars: 3,
            id: "nomiss",
            legacyId: "nomiss",
            category: "\u6280\u8853"
          },
          {
            number: 53,
            legacyNumber: 43,
            name: "\u6B63\u78BA\u7121\u6BD4",
            condition: "B\u65B9\u5F0F\u3067\u30DF\u30B9\u30FB\u6642\u9593\u5207\u308C\u306A\u3057\u306E\u52DD\u522910\u56DE",
            stars: 4,
            id: "nomiss10",
            legacyId: "nomiss10",
            category: "\u6280\u8853"
          },
          {
            number: 54,
            legacyNumber: 95,
            name: "\u767E\u767A\u767E\u4E2D",
            condition: "1\u8A66\u540810\u554F\u4EE5\u4E0A\u6B63\u89E3\u3001\u8AA4\u7B540\u30FB\u6642\u9593\u5207\u308C0\uFF08\u52DD\u6557\u4E0D\u554F\uFF09",
            stars: 4,
            id: "accuracy10",
            legacyId: null,
            category: "\u6280\u8853"
          },
          {
            number: 55,
            legacyNumber: 52,
            name: "\u51B7\u9759\u6C88\u7740",
            condition: "A\u65B9\u5F0F\u3067\u304A\u624B\u3064\u304D0\u30FB6\u554F\u4EE5\u4E0A\u6B63\u89E3\u3057\u3066\u52DD\u5229",
            stars: 3,
            id: "calm",
            legacyId: "calm",
            category: "\u6280\u8853"
          },
          {
            number: 56,
            legacyNumber: 27,
            name: "\u6B7B\u5730\u304B\u3089\u306E\u5E30\u9084",
            condition: "B\u65B9\u5F0F\u3067HP5%\u4EE5\u4E0B\u304B\u3089\u52DD\u5229",
            stars: 4,
            id: "clutch",
            legacyId: "clutch",
            category: "\u6280\u8853"
          },
          {
            number: 57,
            legacyNumber: 46,
            name: "\u4E0D\u6B7B\u9CE5",
            condition: "B\u65B9\u5F0F\u3067HP1%\u4EE5\u4E0B\u304B\u3089\u52DD\u5229",
            stars: 5,
            id: "miracle",
            legacyId: "miracle",
            category: "\u6280\u8853"
          },
          {
            number: 58,
            legacyNumber: 53,
            name: "\u7D76\u5BFE\u56DE\u907F",
            condition: "B\u65B9\u5F0F\u3067\u653B\u6483\u3092\u4E00\u5EA6\u3082\u53D7\u3051\u305A\u52DD\u5229",
            stars: 4,
            id: "flawless",
            legacyId: "flawless",
            category: "\u6280\u8853"
          },
          {
            number: 59,
            legacyNumber: 32,
            name: "\u6700\u5F8C\u306E\u751F\u5B58\u8005",
            condition: "B\u65B9\u5F0F4\u4EBA\u5BFE\u6226\u3067\u6700\u5F8C\u306E\u751F\u5B58\u8005\u3068\u3057\u3066\u52DD\u5229",
            stars: 4,
            id: "survivor",
            legacyId: "survivor",
            category: "\u6280\u8853"
          },
          {
            number: 60,
            legacyNumber: 33,
            name: "\u7D76\u5BFE\u652F\u914D",
            condition: "A\u65B9\u5F0F\u3067\u76F8\u624B\u30920\u70B9\u306B\u6291\u3048\u3066\u52DD\u5229",
            stars: 4,
            id: "shutout",
            legacyId: "shutout",
            category: "\u6280\u8853"
          },
          {
            number: 61,
            legacyNumber: 34,
            name: "\u9650\u754C\u7A81\u7834",
            condition: "Lv.9\u3067Perfect",
            stars: 4,
            id: "lv9",
            legacyId: "lv9",
            category: "\u6280\u8853"
          },
          {
            number: 62,
            legacyNumber: 85,
            name: "\u5B8C\u5168\u5236\u8987",
            condition: "Lv.1\u301C9\u3059\u3079\u3066\u3067Perfect",
            stars: 5,
            id: "alllv",
            legacyId: "alllv",
            category: "\u6280\u8853"
          },
          {
            number: 63,
            legacyNumber: 35,
            name: "\u5236\u5FA1\u4E0D\u80FD",
            condition: "A\u65B9\u5F0F\u3067\u304A\u624B\u3064\u304D\u901A\u7B97100\u56DE",
            stars: 2,
            id: "otetsuki100",
            legacyId: "otetsuki100",
            category: "\u6280\u8853"
          },
          {
            number: 64,
            legacyNumber: 50,
            name: "\u79D8\u6280\u4E71\u821E",
            condition: "1\u8A66\u5408\u3067\u5FC5\u6BBA\u6280\u30923\u56DE\u767A\u52D5",
            stars: 4,
            id: "sp3",
            legacyId: "sp3",
            category: "\u6280\u8853"
          },
          {
            number: 65,
            legacyNumber: 22,
            name: "\u52DD\u5229\u306E\u738B\u51A0",
            condition: "\u30AF\u30E9\u30B9\u5927\u4F1A\u3067\u521D\u512A\u52DD",
            stars: 5,
            id: "tour1",
            legacyId: "tour1",
            category: "\u5927\u4F1A"
          },
          {
            number: 66,
            legacyNumber: 97,
            name: "\u738B\u8005\u9632\u885B",
            condition: "\u30AF\u30E9\u30B9\u5927\u4F1A2\u5927\u4F1A\u9023\u7D9A\u512A\u52DD\uFF08\u6B20\u5834\u3067\u9023\u8987\u304C\u9014\u5207\u308C\u308B\uFF09",
            stars: 5,
            id: "tour_streak2",
            legacyId: null,
            category: "\u5927\u4F1A"
          },
          {
            number: 67,
            legacyNumber: 23,
            name: "\u4E09\u51A0\u738B",
            condition: "\u30AF\u30E9\u30B9\u5927\u4F1A\u3067\u901A\u7B973\u56DE\u512A\u52DD",
            stars: 5,
            id: "tour3",
            legacyId: "tour3",
            category: "\u5927\u4F1A"
          },
          {
            number: 68,
            legacyNumber: 45,
            name: "\u6BBF\u5802\u5165\u308A",
            condition: "\u30AF\u30E9\u30B9\u5927\u4F1A\u3067\u901A\u7B975\u56DE\u512A\u52DD",
            stars: 5,
            id: "tour10",
            legacyId: "tour10",
            category: "\u5927\u4F1A"
          },
          {
            number: 69,
            legacyNumber: 47,
            name: "\u30C0\u30FC\u30AF\u30DB\u30FC\u30B9",
            condition: "\u5927\u4F1A\u958B\u59CB\u6642\u30AF\u30E9\u30B9\u5185\u30EC\u30FC\u30C6\u30A3\u30F3\u30B011\u4F4D\u4EE5\u4E0B\u3067\u512A\u52DD",
            stars: 5,
            id: "darkhorse",
            legacyId: "darkhorse",
            category: "\u5927\u4F1A"
          },
          {
            number: 70,
            legacyNumber: 61,
            name: "\u521D\u9663",
            condition: "\u4ECA\u9031\u306E\u30DC\u30B9\u306B\u521D\u51FA\u6483",
            stars: 1,
            id: "wk1",
            legacyId: "wk1",
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 71,
            legacyNumber: 62,
            name: "\u8A0E\u4F10\u968A",
            condition: "3\u9031\u9023\u7D9A\u3067\u4ECA\u9031\u306E\u30DC\u30B9\u306B\u51FA\u6483",
            stars: 2,
            id: "wkst3",
            legacyId: "wkst3",
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 72,
            legacyNumber: 63,
            name: "\u6B74\u6226\u306E\u52C7\u58EB",
            condition: "5\u9031\u9023\u7D9A\u3067\u4ECA\u9031\u306E\u30DC\u30B9\u306B\u51FA\u6483",
            stars: 3,
            id: "wkst5",
            legacyId: "wkst5",
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 73,
            legacyNumber: 64,
            name: "\u6226\u5834\u306E\u5B88\u8B77\u795E",
            condition: "10\u9031\u9023\u7D9A\u3067\u4ECA\u9031\u306E\u30DC\u30B9\u306B\u51FA\u6483",
            stars: 4,
            id: "wkst10",
            legacyId: "wkst10",
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 74,
            legacyNumber: 65,
            name: "\u521D\u8A0E\u4F10",
            condition: "\u4ECA\u9031\u306E\u30DC\u30B9\u8A0E\u4F10\u6210\u529F\u306B\u521D\u3081\u3066\u30C0\u30E1\u30FC\u30B8\u3067\u8CA2\u732E",
            stars: 2,
            id: "wkk1",
            legacyId: "wkk1",
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 75,
            legacyNumber: 66,
            name: "\u8A0E\u4F10\u968A\u9577",
            condition: "\u4ECA\u9031\u306E\u30DC\u30B9\u8A0E\u4F10\u6210\u529F\u306B5\u56DE\u8CA2\u732E",
            stars: 3,
            id: "wkk5",
            legacyId: "wkk5",
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 76,
            legacyNumber: 67,
            name: "\u7D05\u84EE\u306E\u5F13\u77E2",
            condition: "\u4ECA\u9031\u306E\u30DC\u30B9\u8A0E\u4F10\u6210\u529F\u306B10\u56DE\u8CA2\u732E",
            stars: 4,
            id: "wkk10",
            legacyId: "wkk10",
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 77,
            legacyNumber: 68,
            name: "\u4E00\u9A0E\u5F53\u5343",
            condition: "\u9031\u9593\u30DC\u30B9\u30C0\u30E1\u30FC\u30B8\u30E9\u30F3\u30AD\u30F3\u30B01\u4F4D\u30921\u56DE",
            stars: 4,
            id: "wkace",
            legacyId: "wkace",
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 78,
            legacyNumber: 69,
            name: "\u7834\u58CA\u795E",
            condition: "\u9031\u9593\u30DC\u30B9\u30C0\u30E1\u30FC\u30B8\u30E9\u30F3\u30AD\u30F3\u30B01\u4F4D\u30925\u56DE",
            stars: 5,
            id: "wkace5",
            legacyId: "wkace5",
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 79,
            legacyNumber: 70,
            name: "\u4E00\u6483\u5FC5\u6BBA",
            condition: "\u4ECA\u9031\u306E\u30DC\u30B9\u3078\u306E1\u56DE\u306E\u51FA\u6483\u3067600\u30C0\u30E1\u30FC\u30B8",
            stars: 3,
            id: "wkone",
            legacyId: "wkone",
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 80,
            legacyNumber: 71,
            name: "\u795E\u5A01\u306E\u4E00\u6483",
            condition: "\u4ECA\u9031\u306E\u30DC\u30B9\u3078\u306E1\u56DE\u306E\u51FA\u6483\u30671200\u30C0\u30E1\u30FC\u30B8",
            stars: 5,
            id: "wkone2",
            legacyId: "wkone2",
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 81,
            legacyNumber: 72,
            name: "\u30E2\u30F3\u30B9\u30BF\u30FC\u30CF\u30F3\u30BF\u30FC",
            condition: "\u7570\u306A\u308B3\u7A2E\u985E\u306E\u30DC\u30B9\u8A0E\u4F10\u306B\u53C2\u52A0",
            stars: 3,
            id: "wkdex3",
            legacyId: "wkdex3",
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 82,
            legacyNumber: 73,
            name: "\u30E2\u30F3\u30B9\u30BF\u30FC\u30DE\u30B9\u30BF\u30FC",
            condition: "\u51686\u7A2E\u985E\u306E\u30DC\u30B9\u8A0E\u4F10\u306B\u53C2\u52A0",
            stars: 4,
            id: "wkdex6",
            legacyId: "wkdex6",
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 83,
            legacyNumber: 60,
            name: "\u30D5\u30A3\u30CB\u30C3\u30B7\u30E3\u30FC",
            condition: "\u30AF\u30E9\u30B9\u5354\u529B\u30EC\u30A4\u30C9\u3067\u30DC\u30B9\u306B\u3068\u3069\u3081\u3092\u523A\u3059",
            stars: 3,
            id: "lasthit",
            legacyId: "lasthit",
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 84,
            legacyNumber: 28,
            name: "\u7D76\u5BFE\u9632\u58C1",
            condition: "\u653B\u6483\u3092\u7D2F\u8A08500\u56DE\u7121\u52B9\u5316",
            stars: 3,
            id: "cancel500",
            legacyId: "cancel500",
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 85,
            legacyNumber: 41,
            name: "\u96E3\u653B\u4E0D\u843D",
            condition: "\u653B\u6483\u3092\u7D2F\u8A082000\u56DE\u7121\u52B9\u5316",
            stars: 4,
            id: "cancel2000",
            legacyId: "cancel2000",
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 86,
            legacyNumber: 29,
            name: "\u30C8\u30EA\u30C3\u30AF\u30B9\u30BF\u30FC",
            condition: "\u304A\u3058\u3083\u307E\u30BF\u30A4\u30EB\u3092\u901A\u7B97100\u500B\u9001\u308B",
            stars: 2,
            id: "ojama100",
            legacyId: "ojama100",
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 87,
            legacyNumber: 42,
            name: "\u30C8\u30EA\u30C3\u30AF\u30DE\u30B9\u30BF\u30FC",
            condition: "\u304A\u3058\u3083\u307E\u30BF\u30A4\u30EB\u3092\u901A\u7B97500\u500B\u9001\u308B",
            stars: 3,
            id: "ojama500",
            legacyId: "ojama500",
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 88,
            legacyNumber: 30,
            name: "\u5965\u7FA9\u7686\u4F1D",
            condition: "\u5FC5\u6BBA\u6280\u3092\u901A\u7B9750\u56DE\u767A\u52D5",
            stars: 3,
            id: "sp50",
            legacyId: "sp50",
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 89,
            legacyNumber: 59,
            name: "\u4EFB\u52D9\u5B8C\u9042",
            condition: "7\u65E5\u9023\u7D9A\u3067\u30C7\u30A4\u30EA\u30FC\u30DF\u30C3\u30B7\u30E7\u30F3\u3092\u3059\u3079\u3066\u9054\u6210",
            stars: 3,
            id: "mis7",
            legacyId: "mis7",
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 90,
            legacyNumber: 77,
            name: "\u5B9D\u63A2\u3057",
            condition: "\u4ECA\u9031\u306E\u30DC\u30B9\u51FA\u6483\u4E2D\u306B\u5B9D\u7BB1\u3092\u958B\u3051\u308B",
            stars: 1,
            id: "wkchest1",
            legacyId: "wkchest1",
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 91,
            legacyNumber: 78,
            name: "\u30C8\u30EC\u30B8\u30E3\u30FC\u30CF\u30F3\u30BF\u30FC",
            condition: "\u5B9D\u7BB1\u3092\u901A\u7B9710\u500B\u958B\u3051\u308B",
            stars: 3,
            id: "wkchest10",
            legacyId: "wkchest10",
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 92,
            legacyNumber: 79,
            name: "\u7E01\u306E\u4E0B\u306E\u529B\u6301\u3061",
            condition: "\u4ECA\u9031\u306E\u30DC\u30B9\u306B\u30B5\u30DD\u30FC\u30BF\u30FC\u3068\u3057\u3066\u51FA\u6483",
            stars: 1,
            id: "wksup1",
            legacyId: "wksup1",
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 93,
            legacyNumber: 80,
            name: "\u5F71\u306E\u82F1\u96C4",
            condition: "\u5FDC\u63F4\u30DD\u30A4\u30F3\u30C8\u901A\u7B97100\u7372\u5F97",
            stars: 2,
            id: "wksup100",
            legacyId: "wksup100",
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 94,
            legacyNumber: 99,
            name: "\u5F71\u306E\u5B88\u8B77\u795E",
            condition: "\u5FDC\u63F4\u30DD\u30A4\u30F3\u30C8\u901A\u7B97500\u7372\u5F97",
            stars: 3,
            id: "wksup500",
            legacyId: null,
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 95,
            legacyNumber: 98,
            name: "\u6226\u53CB\u306E\u7D46",
            condition: "\u4ECA\u9031\u306E\u30DC\u30B9\u3078\u306E\u51FA\u6483\u3092\u901A\u7B9720\u56DE\u5B8C\u4E86",
            stars: 3,
            id: "wk_runs20",
            legacyId: null,
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 96,
            legacyNumber: 84,
            name: "\u6012\u308A\u3092\u93AE\u3081\u3057\u8005",
            condition: "\u6012\u3063\u3066\u5C45\u5EA7\u3063\u305F\u30DC\u30B9\u306E\u8A0E\u4F10\u306B\u53C2\u52A0",
            stars: 3,
            id: "wkrage",
            legacyId: "wkrage",
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 97,
            legacyNumber: 74,
            name: "\u4E03\u3064\u306E\u8A3C",
            condition: "\u30ED\u30B0\u30A4\u30F3\u30DC\u30FC\u30CA\u30B9\u30AB\u30FC\u30C9\u30921\u679A\u5B8C\u6210",
            stars: 1,
            id: "lb7",
            legacyId: "lb7",
            category: "\u30ED\u30B0\u30A4\u30F3"
          },
          {
            number: 98,
            legacyNumber: 100,
            name: "\u4E03\u3064\u306E\u5B9D\u5370",
            condition: "\u30ED\u30B0\u30A4\u30F3\u30DC\u30FC\u30CA\u30B9\u30AB\u30FC\u30C9\u3092\u901A\u7B977\u679A\u5B8C\u6210",
            stars: 3,
            id: "lb_cards7",
            legacyId: null,
            category: "\u30ED\u30B0\u30A4\u30F3"
          },
          {
            number: 99,
            legacyNumber: 75,
            name: "\u99B4\u67D3\u307F\u306E\u5192\u967A\u8005",
            condition: "\u901A\u7B9730\u65E5\u30ED\u30B0\u30A4\u30F3",
            stars: 2,
            id: "lb30",
            legacyId: "lb30",
            category: "\u30ED\u30B0\u30A4\u30F3"
          },
          {
            number: 100,
            legacyNumber: 76,
            name: "\u6C38\u9060\u306E\u5192\u967A\u8005",
            condition: "\u901A\u7B97100\u65E5\u30ED\u30B0\u30A4\u30F3",
            stars: 3,
            id: "lb100",
            legacyId: "lb100",
            category: "\u30ED\u30B0\u30A4\u30F3"
          }
        ],
        ownerClarifications: {
          attackNullificationMetric: "distinct-attack-events",
          legacyNullificationAmountsMustNotBecomeEventCounts: true,
          withdrawnFiveStarPromotion: 65,
          nameCorrections: {
            "66": "\u738B\u8005\u9632\u885B"
          }
        }
      };
    }
  });

  // src/title-compat-next.cjs
  var require_title_compat_next = __commonJS({
    "src/title-compat-next.cjs"(exports, module) {
      "use strict";
      var catalog2 = require_title_catalog_next();
      var ids = new Set(catalog2.titles.map((t) => t.id));
      function read({ legacyEarned = [], flags = [], equipped = null } = {}) {
        var _a;
        const earned = /* @__PURE__ */ new Map();
        for (const id of legacyEarned) if (typeof id === "string") earned.set(id, { id, at: null, source: "legacy-evidence" });
        for (const map of flags) for (const [id, v] of Object.entries(map || {})) {
          if (v !== true && (v == null ? void 0 : v.earned) !== true) continue;
          const at = v && typeof v === "object" && Number.isFinite(v.at) && v.at > 0 ? v.at : null;
          const previous = earned.get(id);
          earned.set(id, { id, at: (_a = previous == null ? void 0 : previous.at) != null ? _a : at, source: "stored-flag" });
        }
        const normal = catalog2.titles.filter((t) => earned.has(t.id)), rare = normal.filter((t) => t.stars === 5).length;
        return { earned: Object.fromEntries(earned), normal, fiveStarCount: rare, hiddenEligible: rare >= 15, hiddenOwned: earned.has(catalog2.hidden.id), archived: [...earned.keys()].filter((id) => !ids.has(id) && id !== catalog2.hidden.id), equipped };
      }
      module.exports = { read };
    }
  });

  // src/b-result.cjs
  var require_b_result = __commonJS({
    "src/b-result.cjs"(exports, module) {
      "use strict";
      var finite = (n) => typeof n === "number" && Number.isFinite(n);
      function build(game) {
        var _a;
        const bad = (reason) => ({ consistent: false, reason });
        if (!(game == null ? void 0 : game.result)) return bad("\u7D50\u679C\u306F\u307E\u3060\u78BA\u5B9A\u3057\u3066\u3044\u307E\u305B\u3093\u3002");
        const t = game.scoreTrace, ids = game.ids;
        if (!t || t.version !== 1 || !t.complete || !Array.isArray(ids) || ids.length < 2) return bad("\u3053\u306E\u8A66\u5408\u306B\u306F\u5B8C\u5168\u306A\u5F97\u70B9\u5C65\u6B74\u304C\u3042\u308A\u307E\u305B\u3093\u3002");
        const events = Array.isArray(t.events) ? t.events : Object.values(t.events || {}), rows = [];
        let previous = null;
        for (const e of events) {
          if (previous && e.id === previous.id) {
            if (JSON.stringify(e) !== JSON.stringify(previous)) return bad("\u5C65\u6B74\u306E\u91CD\u8907\u5185\u5BB9\u304C\u4E00\u81F4\u3057\u307E\u305B\u3093\u3002");
            continue;
          }
          if (!Number.isInteger(e.id) || e.id !== (previous ? previous.id + 1 : 0) || !finite(e.at) || e.at < ((_a = previous == null ? void 0 : previous.at) != null ? _a : game.startAt) || e.at > game.result.at || ids.some((u) => {
            var _a2;
            return !finite((_a2 = e.scores) == null ? void 0 : _a2[u]) || e.scores[u] < 0;
          })) return bad("\u5F97\u70B9\u5C65\u6B74\u304C\u4E0D\u8DB3\u3057\u3066\u3044\u307E\u3059\u3002");
          if (!previous && (e.at !== game.startAt || ids.some((u) => e.scores[u] !== 0))) return bad("\u958B\u59CB\u6642\u306E\u8A18\u9332\u304C\u4E0D\u8DB3\u3057\u3066\u3044\u307E\u3059\u3002");
          if (previous && (!ids.includes(e.uid) || !finite(e.gain) || e.gain < 0 || ids.some((u) => e.scores[u] !== previous.scores[u] + (u === e.uid ? e.gain : 0)))) return bad("\u5F97\u70B9\u5C65\u6B74\u306E\u6574\u5408\u6027\u3092\u78BA\u8A8D\u3067\u304D\u307E\u305B\u3093\u3002");
          rows.push(e);
          previous = e;
        }
        if (!previous || previous.id !== t.seq || ids.some((u) => {
          var _a2, _b;
          return previous.scores[u] !== ((_b = (_a2 = game.states) == null ? void 0 : _a2[u]) == null ? void 0 : _b.score);
        })) return bad("\u6700\u7D42\u5F97\u70B9\u3068\u5C65\u6B74\u304C\u4E00\u81F4\u3057\u307E\u305B\u3093\u3002");
        return { consistent: true, ids, startAt: game.startAt, endAt: game.result.at, revision: t.seq, rows, final: previous.scores, summary: Object.fromEntries(ids.map((u) => {
          var _a2, _b, _c, _d;
          const s = game.states[u], h = s.hist || [];
          return [u, { correct: s.c, wrong: h.filter((x) => x.ok === false && !x.timeout).length, timeouts: h.filter((x) => x.timeout).length, best: s.best, perfects: (_a2 = s.perfects) != null ? _a2 : h.filter((x) => x.ok && x.j === "Perfect").length, attack: (_b = s.ojSent) != null ? _b : 0, cancel: (_c = s.cancelTotal) != null ? _c : 0, freeze: (_d = s.spUsed) != null ? _d : 0 }];
        })) };
      }
      module.exports = { build };
    }
  });

  // src/authority-weekly-ui.jsx
  function AuthorityWeekly({ H, acct, onExit }) {
    var _a;
    const { useState, useEffect, useMemo } = React, { FB, fbNow, weekKey, useTick, TargetCard, BattleBoard, weeklyInfo, bossForm, MonsterPic } = H;
    const key = "fxf_weekly_authority:" + acct.key, [week, setWeek] = useState(() => {
      var _a2;
      try {
        return ((_a2 = JSON.parse(localStorage.getItem(key))) == null ? void 0 : _a2.week) || weekKey(fbNow());
      } catch {
        return weekKey(fbNow());
      }
    }), [view, setView] = useState(null), [shared, setShared] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState(""), [pending, setPending] = useState(() => {
      var _a2;
      try {
        return ((_a2 = JSON.parse(localStorage.getItem(key))) == null ? void 0 : _a2.pending) || null;
      } catch {
        return null;
      }
    });
    const client = useMemo(() => window.NextAuthority.weekly({ db: FB.db, uid: FB.uid, account: acct, week }), [acct.key, week]);
    useEffect(() => {
      setView(null);
      setShared(null);
      const stop = client.subscribe(setView, (e) => setError(e.message)), r = FB.db.ref(`${window.NextAuthority.ROOT}/weekly/${week}/public`), f = (s) => setShared(s.val());
      r.on("value", f, (e) => setError(e.message));
      return () => {
        stop();
        r.off("value", f);
      };
    }, [client]);
    useTick(200, true);
    const persist = (p) => {
      localStorage.setItem(key, JSON.stringify({ week, pending: p }));
      setPending(p);
    };
    async function send(command2) {
      if (busy) return;
      const c = command2 || pending;
      if (!c) return;
      persist(c);
      setBusy(true);
      setError("");
      try {
        await client.submit(c.type, c.payload, c.id);
        persist(null);
      } catch (e) {
        if (e.confirmed) persist(null);
        setError(e.message);
      } finally {
        setBusy(false);
      }
    }
    const command = (type, payload) => send({ id: client.newId(), type, payload }), now = fbNow(), runs = Object.values((view == null ? void 0 : view.runs) || {}), run = runs.find((r) => r.status === "play") || runs.sort((a, b) => b.startAt - a.startAt)[0], active = (run == null ? void 0 : run.status) === "play", live = !!view && now - view.serverAt < 4e3 && FB.conn !== false;
    const board = useMemo(() => run == null ? void 0 : run.prob, [JSON.stringify(run == null ? void 0 : run.prob)]);
    const ready = active && !!run.prob && !run.pending && !busy && !pending && live && view.revision === (shared == null ? void 0 : shared.revision) && now >= run.startAt && now >= run.stunUntil && now < run.endAt;
    const info = (shared == null ? void 0 : shared.meta) ? weeklyInfo(week, {}, shared.meta, {}) : null, boss = info && bossForm(info.boss, shared.revived), fmt = (n) => Number.isFinite(n) ? n.toLocaleString() : "\u2014";
    return /* @__PURE__ */ React.createElement("main", { className: "authority-weekly next-result-details", "data-weekly-authority": true }, /* @__PURE__ */ React.createElement("link", { rel: "stylesheet", href: "ui-next/home.css" }), /* @__PURE__ */ React.createElement("link", { rel: "stylesheet", href: "ui-next/weekly.css" }), /* @__PURE__ */ React.createElement("header", null, /* @__PURE__ */ React.createElement("button", { className: "small-button", onClick: onExit }, "\u30DB\u30FC\u30E0\u3078"), /* @__PURE__ */ React.createElement("h1", null, "\u4ECA\u9031\u306E\u30DC\u30B9")), /* @__PURE__ */ React.createElement("p", { className: "authority-dev-note" }, "Emulator\u5C02\u7528\u30FB\u672C\u756A\u306E\u6226\u7E3E\u3068\u5831\u916C\u306B\u306F\u53CD\u6620\u3055\u308C\u307E\u305B\u3093"), error && /* @__PURE__ */ React.createElement("p", { role: "alert" }, error), pending && /* @__PURE__ */ React.createElement("button", { className: "small-button", disabled: busy, onClick: () => send() }, "\u540C\u3058\u64CD\u4F5C\u3092\u518D\u9001"), (shared == null ? void 0 : shared.enabled) ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("section", { className: "authority-boss" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", null, (boss == null ? void 0 : boss.name) || "\u4ECA\u9031\u306E\u30DC\u30B9"), /* @__PURE__ */ React.createElement("p", null, "HP ", /* @__PURE__ */ React.createElement("b", { "data-authority-hp": true }, fmt(shared.hp), " / ", fmt(shared.hpMax)), shared.kill ? " \u30FB \u8A0E\u4F10\u6E08\u307F" : ""), /* @__PURE__ */ React.createElement("progress", { "aria-label": "\u30DC\u30B9\u306E\u6B8B\u308AHP", value: shared.hp, max: shared.hpMax }), /* @__PURE__ */ React.createElement("p", null, week, " \u306E\u9031", shared.closed ? " \u30FB \u78BA\u5B9A\u6E08\u307F" : "")), boss && /* @__PURE__ */ React.createElement(MonsterPic, { id: boss.id, icon: boss.icon, size: "8rem" })), active ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("dl", { className: "authority-hud" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("dt", null, "\u6B8B\u308A\u6642\u9593"), /* @__PURE__ */ React.createElement("dd", null, Math.max(0, Math.ceil((run.endAt - now) / 1e3)), "\u79D2")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("dt", null, "\u30C0\u30E1\u30FC\u30B8"), /* @__PURE__ */ React.createElement("dd", null, fmt(run.d))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("dt", null, "\u30B3\u30F3\u30DC"), /* @__PURE__ */ React.createElement("dd", null, run.combo))), /* @__PURE__ */ React.createElement("p", { role: "status" }, now < run.startAt ? "READY" : busy ? "\u89E3\u7B54\u3092\u78BA\u5B9A\u3057\u3066\u3044\u307E\u3059\u2026" : !live ? "\u901A\u4FE1\u30FBworker\u306E\u5FA9\u65E7\u3092\u5F85\u3063\u3066\u3044\u307E\u3059" : run.pending ? "\u6B21\u306E\u554F\u984C\u3092\u5F85\u3063\u3066\u3044\u307E\u3059" : now < run.stunUntil ? "\u53CD\u6483\u3067\u3057\u3073\u308C\u3066\u3044\u307E\u3059" : ((_a = run.chest) == null ? void 0 : _a.on) ? "\u5B9D\u7BB1\uFF1A\u6B21\u306E\u554F\u984C\u3067\u958B\u9320" : "\u56E0\u6570\u30BF\u30A4\u30EB\u30922\u679A\u3064\u306A\u3044\u3067\u89E3\u7B54"), run.lastAnswer && now - run.lastAnswer.at < 1500 && /* @__PURE__ */ React.createElement("p", { "aria-live": "polite" }, run.lastAnswer.ok ? `${run.lastAnswer.judge} \uFF0B${run.lastAnswer.damage}\u30C0\u30E1\u30FC\u30B8` : "\u4E0D\u6B63\u89E3"), /* @__PURE__ */ React.createElement("div", { className: "authority-board" + (now < run.fogUntil ? " fogged" : "") }, ready ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(TargetCard, { v7: true, poly: board.poly, level: board.level, qLabel: board.poly2 ? "\u5F0FA" : void 0, gaugeKey: run.qs, gaugeMs: 2e4 }), board.poly2 && /* @__PURE__ */ React.createElement(TargetCard, { v7: true, poly: board.poly2, level: board.level2 || board.level, qLabel: "\u5F0FB\uFF08\u3069\u3061\u3089\u3082\u89E3\u7B54\u53EF\u80FD\uFF09", gaugeKey: run.qs, gaugeMs: 2e4 }), /* @__PURE__ */ React.createElement(BattleBoard, { v7: true, tiles: Array.isArray(board.tiles) ? board.tiles : Object.values(board.tiles), flash: {}, mirror: (info == null ? void 0 : info.T.gim) === "mirror", disabled: !ready, onMatch: (first, second) => command("answer", { runId: run.id, questionAt: run.qs, first, second }) })) : /* @__PURE__ */ React.createElement("div", { className: "authority-board-wait", "aria-label": "\u76E4\u9762\u306F\u64CD\u4F5C\u89E3\u7981\u307E\u3067\u8868\u793A\u3055\u308C\u307E\u305B\u3093" })), /* @__PURE__ */ React.createElement("button", { className: "small-button", disabled: busy || !!pending, onClick: () => command("quit", { runId: run.id }) }, "\u51FA\u6483\u3092\u7D42\u4E86")) : /* @__PURE__ */ React.createElement(React.Fragment, null, run && /* @__PURE__ */ React.createElement("section", { "data-authority-result": true }, /* @__PURE__ */ React.createElement("h2", null, run.receipt ? "\u51FA\u6483\u304A\u3064\u304B\u308C\u3055\u307E\uFF01" : "\u51FA\u6483\u7D42\u4E86\uFF08\u672A\u5B8C\u8D70\uFF09"), /* @__PURE__ */ React.createElement("p", null, fmt(run.d), "\u30C0\u30E1\u30FC\u30B8 \uFF0F \u6B63\u89E3 ", run.n, "\u554F \uFF0F \u6700\u9AD8 ", run.best, "\u30B3\u30F3\u30DC"), run.reward && /* @__PURE__ */ React.createElement("p", null, "\u7372\u5F97EXP ", run.reward.after - run.reward.before)), /* @__PURE__ */ React.createElement("p", null, "1\u65E55\u56DE\u307E\u3067\u3002\u9014\u4E2D\u9000\u51FA\u30821\u56DE\u3068\u3057\u3066\u6D88\u8CBB\u3057\u307E\u3059\u3002"), /* @__PURE__ */ React.createElement("div", { className: "authority-actions" }, /* @__PURE__ */ React.createElement("button", { className: "small-button", disabled: busy || !!pending || shared.closed || !!shared.kill, onClick: () => command("start", { role: "atk" }) }, "\u30A2\u30BF\u30C3\u30AB\u30FC\u3067\u51FA\u6483"), /* @__PURE__ */ React.createElement("button", { className: "small-button", disabled: busy || !!pending || shared.closed || !!shared.kill, onClick: () => command("start", { role: "sup" }) }, "\u30B5\u30DD\u30FC\u30BF\u30FC\u3067\u51FA\u6483"))), shared.closed && /* @__PURE__ */ React.createElement("button", { className: "small-button", onClick: () => {
      localStorage.removeItem(key);
      setPending(null);
      setWeek(weekKey(fbNow()));
    } }, "\u4ECA\u9031\u3078\u5207\u308A\u66FF\u3048"), (view == null ? void 0 : view.awards) && Object.keys(view.awards).length > 0 && /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement("h2", null, "\u78BA\u5B9A\u5831\u916C"), /* @__PURE__ */ React.createElement("ul", null, Object.values(view.awards).map((a) => /* @__PURE__ */ React.createElement("li", { key: a.id }, { kill: "\u8A0E\u4F10", lastHit: "\u6700\u7D42\u6253", final: "\u9031\u7DE0\u3081" }[a.kind], "\uFF1A", a.exp, " EXP")))), (view == null ? void 0 : view.ranking) && /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement("h2", null, "\u9031\u7DE0\u3081\u9806\u4F4D"), /* @__PURE__ */ React.createElement("ol", null, view.ranking.map((r) => /* @__PURE__ */ React.createElement("li", { key: r.account }, r.account, "\uFF1A", fmt(r.damage), "\u30C0\u30E1\u30FC\u30B8"))))) : /* @__PURE__ */ React.createElement("p", { role: "status" }, error ? "HP\u60C5\u5831\u3092\u53D6\u5F97\u3067\u304D\u307E\u305B\u3093" : "\u7BA1\u7406\u5074worker\u306E\u6E96\u5099\u3092\u5F85\u3063\u3066\u3044\u307E\u3059\u2026"));
  }

  // src/legacy-spectator-next.jsx
  function LegacySpectator({ H, ids = [], names = {}, mode, diff, bank, live = {}, ko = {}, result, probA, startAt, time, scoreA, teams = {}, feed = [], onLeave, children }) {
    var _a;
    const [focus, setFocus] = React.useState(ids[0]), [expanded, setExpanded] = React.useState(false), selected = ids.includes(focus) ? focus : ids[0];
    const number = (x) => typeof x === "number" && Number.isFinite(x) ? x : null, text = (x) => number(x) === null ? "\u672A\u8A18\u9332" : Math.round(x);
    const hud = (u) => {
      var _a2, _b, _c, _d, _e, _f, _g;
      return mode === "A" ? { score: (_a2 = scoreA == null ? void 0 : scoreA.sc) == null ? void 0 : _a2[u], correct: (_b = scoreA == null ? void 0 : scoreA.log) == null ? void 0 : _b.filter((x) => x.w === u).length, combo: (_c = scoreA == null ? void 0 : scoreA.cb) == null ? void 0 : _c[u] } : { score: (_d = live[u]) == null ? void 0 : _d.score, correct: (_e = live[u]) == null ? void 0 : _e.c, combo: (_f = live[u]) == null ? void 0 : _f.combo, hp: (_g = live[u]) == null ? void 0 : _g.hp };
    };
    const notice = (_a = feed.at(-1)) == null ? void 0 : _a.txt;
    return ReactDOM.createPortal(/* @__PURE__ */ React.createElement("main", { className: "next-spectator " + (expanded ? "expanded" : ""), "data-next-legacy-spectator": mode }, /* @__PURE__ */ React.createElement("header", null, /* @__PURE__ */ React.createElement("h1", null, "\u89B3\u6226\u30FB", mode, "\u65B9\u5F0F"), /* @__PURE__ */ React.createElement("button", { onClick: onLeave }, "\u89B3\u6226\u3092\u7D42\u4E86")), mode === "C" && /* @__PURE__ */ React.createElement("p", null, "\u30C1\u30FC\u30E0HP\u3068\u500B\u4EBA\u306E\u8A18\u9332\u3092\u5206\u3051\u3066\u8868\u793A\u3057\u307E\u3059\u3002\u8A18\u9332\u306E\u306A\u3044\u5024\u306F\u88DC\u5B8C\u3057\u307E\u305B\u3093\u3002"), /* @__PURE__ */ React.createElement("div", { className: "next-spectator-hud" }, ids.map((u) => {
      const s = hud(u);
      return /* @__PURE__ */ React.createElement("button", { key: u, "aria-pressed": u === selected, onClick: () => setFocus(u) }, /* @__PURE__ */ React.createElement("strong", null, names[u] || "\u30D7\u30EC\u30A4\u30E4\u30FC", mode === "C" ? `\uFF08${teams[u] === 0 ? "\u8D64" : teams[u] === 1 ? "\u9752" : "\u672A\u8A18\u9332"}\u30C1\u30FC\u30E0\uFF09` : ""), /* @__PURE__ */ React.createElement("span", null, text(s.score), "\u70B9", mode === "C" ? ` \uFF0F \u30C1\u30FC\u30E0HP\u5831\u544A ${text(s.hp)}%` : ""), /* @__PURE__ */ React.createElement("small", null, "\u6B63\u89E3", text(s.correct), "\u554F \uFF0F ", text(s.combo), "\u30B3\u30F3\u30DC", ko[u] ? " \uFF0F KO" : ""));
    })), notice && /* @__PURE__ */ React.createElement("p", { "aria-live": "polite" }, notice), /* @__PURE__ */ React.createElement("button", { className: "next-view-size", onClick: () => setExpanded((v) => !v) }, expanded ? "\u5168\u54E1\u3092\u4E26\u3079\u308B" : "\u9078\u629E\u3057\u305F\u76E4\u9762\u3092\u62E1\u5927"), /* @__PURE__ */ React.createElement("div", { className: "next-spectator-boards" }, ids.map((u) => {
      const l = live[u] || {}, ready = !result && time >= startAt && !ko[u] && time >= (l.freezeUntil || 0) && l.resolving !== true && (mode === "A" ? !!probA : l.boardReady === true && l.st !== "ko" && l.st !== "over"), p = ready ? mode === "A" ? probA : Number.isInteger(l.lv) && l.lv >= 1 && l.lv <= 9 && Number.isInteger(l.k) && l.k >= 0 ? bank.get(l.lv, l.k) : null : null, unknownExtra = mode === "C" && (number(l.oj) === null || l.oj > 0);
      return /* @__PURE__ */ React.createElement("section", { key: u, "data-spectator-player": u, className: "spectator-board " + (u === selected ? "focused" : "") }, /* @__PURE__ */ React.createElement("h2", null, names[u] || "\u30D7\u30EC\u30A4\u30E4\u30FC"), p ? /* @__PURE__ */ React.createElement("div", { className: "next-readonly-board", inert: "" }, /* @__PURE__ */ React.createElement(H.TargetCard, { v7: true, poly: p.poly, level: p.level || l.lv, qLabel: "\u5171\u6709\u3055\u308C\u305F\u554F\u984C" }), unknownExtra ? /* @__PURE__ */ React.createElement("p", null, "\u8FFD\u52A0\u30AB\u30FC\u30C9\u3092\u542B\u3080\u76E4\u9762\u306F\u5171\u6709\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002") : /* @__PURE__ */ React.createElement(H.BattleBoard, { v7: true, tiles: p.tiles, disabled: true, onMatch: () => {
      } })) : /* @__PURE__ */ React.createElement("p", { role: "status" }, result ? "\u8A66\u5408\u7D42\u4E86" : time < startAt ? "\u958B\u59CB\u5F85\u3061" : time < (l.freezeUntil || 0) ? "FREEZE\u4E2D" : ko[u] ? "KO" : "\u6B21\u306E\u554F\u984C\u307E\u305F\u306F\u76E4\u9762\u306E\u5171\u6709\u3092\u5F85\u3063\u3066\u3044\u307E\u3059"));
    })), result && /* @__PURE__ */ React.createElement("p", null, result.draw ? "\u5F15\u304D\u5206\u3051" : mode === "C" ? result.team === 0 ? "\u8D64\u30C1\u30FC\u30E0\u306E\u52DD\u5229" : result.team === 1 ? "\u9752\u30C1\u30FC\u30E0\u306E\u52DD\u5229" : "\u52DD\u5229\u30C1\u30FC\u30E0\u306F\u672A\u8A18\u9332" : result.winner ? `${names[result.winner] || "\u30D7\u30EC\u30A4\u30E4\u30FC"}\u306E\u52DD\u5229` : "\u7D50\u679C\u3092\u78BA\u5B9A\u3057\u307E\u3057\u305F"), /* @__PURE__ */ React.createElement("section", { className: "next-spectator-support", "aria-label": "\u89B3\u6226\u8005\u306E\u5FDC\u63F4" }, children)), document.body);
  }

  // src/next-help-ui.jsx
  var B2 = require_b2();
  function Help({ tiers, difficulties, aLockMs, onClose }) {
    const [tab, setTab] = React.useState("play");
    const sections = [["play", "\u57FA\u672C\u64CD\u4F5C\u30FB\u30BD\u30ED"], ["online", "A\u30FB\u65B0B\u30FBC\u65B9\u5F0F"], ["daily", "\u30C7\u30A4\u30EA\u30FC\u30FB\u30E9\u30F3\u30AD\u30F3\u30B0"], ["growth", "\u79F0\u53F7\u30FB\u304D\u305B\u304B\u3048\u30FB\u5354\u529B"]];
    return /* @__PURE__ */ React.createElement("main", { className: "next-help", "data-next-help": true }, /* @__PURE__ */ React.createElement("button", { className: "small-button", onClick: onClose }, "\u30BD\u30ED\u30E1\u30CB\u30E5\u30FC\u3078\u623B\u308B"), /* @__PURE__ */ React.createElement("nav", { "aria-label": "\u3042\u305D\u3073\u304B\u305F\u306E\u9805\u76EE" }, sections.map(([id, label]) => /* @__PURE__ */ React.createElement("button", { key: id, "aria-pressed": tab === id, onClick: () => setTab(id) }, label))), tab === "play" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement("h2", null, "\u56E0\u6570\u30BF\u30A4\u30EB\u3092\u3064\u306A\u3052\u308B"), /* @__PURE__ */ React.createElement("p", null, "\u5F0F\u3068\u540C\u3058\u7A4D\u306B\u306A\u308B2\u679A\u3092\u3001\u6307\u307E\u305F\u306F\u30DE\u30A6\u30B9\u3067\u62BC\u3055\u3048\u305F\u307E\u307E\u3064\u306A\u304E\u3001\u3082\u30461\u679A\u306E\u4E0A\u3067\u306F\u306A\u3057\u307E\u3059\u3002\u5225\u3005\u306B2\u56DE\u30BF\u30C3\u30D7\u3059\u308B\u56DE\u7B54\u65B9\u5F0F\u3067\u306F\u3042\u308A\u307E\u305B\u3093\u3002"), /* @__PURE__ */ React.createElement("p", null, "\u5404\u554F\u984C\u306F20\u79D2\u3002HP\u304C0\u306B\u306A\u308B\u3068\u7D42\u4E86\u3057\u307E\u3059\u3002\u5236\u9650\u554F\u6570\u30FB\u30DF\u30B9\u6642\u306EHP\u6E1B\u5C11\u306F\u96E3\u6613\u5EA6\u3054\u3068\u306B\u7570\u306A\u308A\u307E\u3059\u3002"), /* @__PURE__ */ React.createElement("ul", null, Object.entries(difficulties).map(([id, d]) => /* @__PURE__ */ React.createElement("li", { key: id }, d.label, "\uFF1A", d.clearCount, "\u554F")))), /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement("h2", null, "\u30BF\u30A4\u30E0\u5224\u5B9A\u3068\u56DE\u5FA9"), /* @__PURE__ */ React.createElement("p", null, "\u4E0B\u306E\u6642\u9593\u300C\u4EE5\u5185\u300D\u304C\u5404\u5224\u5B9A\u306E\u4E0A\u9650\u3067\u3059\u3002\u6B63\u89E3\u3067HP\u304C\u56DE\u5FA9\u3057\u3001\u9023\u7D9A\u6B63\u89E3\u3067\u30B3\u30F3\u30DC\u304C\u5897\u3048\u307E\u3059\u3002"), /* @__PURE__ */ React.createElement("table", null, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "\u5224\u5B9A"), /* @__PURE__ */ React.createElement("th", null, "\u89E3\u7B54\u6642\u9593"), /* @__PURE__ */ React.createElement("th", null, "HP\u56DE\u5FA9"))), /* @__PURE__ */ React.createElement("tbody", null, tiers.map((t) => /* @__PURE__ */ React.createElement("tr", { key: t.label }, /* @__PURE__ */ React.createElement("th", null, t.label), /* @__PURE__ */ React.createElement("td", null, t.max / 1e3, "\u79D2\u4EE5\u5185"), /* @__PURE__ */ React.createElement("td", null, "\uFF0B", t.recover, "%"))))), /* @__PURE__ */ React.createElement("p", null, "\u8AA4\u7B54\u30FB\u6642\u9593\u5207\u308C\u306FBad\u3002\u8AA4\u7B54\u30DA\u30CA\u30EB\u30C6\u30A3\u3068\u6642\u9593\u5207\u308C\u306E\u8FFD\u52A0\u6E1B\u5C11\u306F\u540C\u3058\u5024\u3067\u306F\u3042\u308A\u307E\u305B\u3093\u3002"))), tab === "online" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement("h2", null, "A\u65B9\u5F0F"), /* @__PURE__ */ React.createElement("p", null, "\u540C\u3058\u554F\u984C\u3092\u540C\u6642\u306B\u89E3\u304D\u3001\u5148\u306B\u6B63\u89E3\u3057\u305F\u4EBA\u304C\u5F97\u70B9\u3057\u307E\u3059\u3002\u304A\u624B\u3064\u304D\u306F", aLockMs / 1e3, "\u79D2\u3002\u7D42\u4E86\u5F8C\u306F\u554F\u984C\u3054\u3068\u306E\u78BA\u5B9A\u5F97\u70B9\u3068\u63A8\u79FB\u3092\u78BA\u8A8D\u3067\u304D\u307E\u3059\u3002")), /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement("h2", null, "\u65B0B\u65B9\u5F0F"), /* @__PURE__ */ React.createElement("p", null, "\u6642\u9593\u7D42\u4E86\u6642\u306E\u5F97\u70B9\u3067\u52DD\u6557\u3092\u6C7A\u3081\u3001HP0\u306FKO\u3067\u3059\u3002\u3059\u3050\u904A\u3076\u306F90\u79D2\u3001\u30EB\u30FC\u30E0\u3067\u306F60\u30FB90\u30FB120\u30FB180\u79D2\u304B\u3089\u9078\u3079\u307E\u3059\u3002"), /* @__PURE__ */ React.createElement("p", null, "HP\u306F\u6BCE\u79D21%\u6E1B\u5C11\u3002\u8AA4\u7B54\u306F\u30A4\u30FC\u30B8\u30FC20%\u30FB\u30CE\u30FC\u30DE\u30EB25%\u6E1B\u5C11\u3002\u554F\u984C\u6642\u9593\u5207\u308C\u306E\u8FFD\u52A0\u6E1B\u5C11\u306F\u30A4\u30FC\u30B8\u30FC0%\u30FB\u30CE\u30FC\u30DE\u30EB5%\u3067\u3059\u3002\u6B63\u89E3\u56DE\u5FA9\u306EHP\u8D85\u904E\u5206\u306F\u5F97\u70B9\u306B\u306A\u308A\u307E\u3059\u3002"), /* @__PURE__ */ React.createElement("p", null, "2\u30B3\u30F3\u30DC\u30671\u679A\u30013\u30B3\u30F3\u30DC\u30672\u679A\u30014\u30B3\u30F3\u30DC\u4EE5\u964D\u306F3\u679A\u306E\u304A\u90AA\u9B54\u3092\u9001\u308A\u307E\u3059\u3002\u901A\u5E386\u679A\uFF0F9\u679A\u3001\u76E4\u9762\u306F\u6700\u592712\u679A\u3002\u304A\u90AA\u9B54\u306F\u6B63\u89E3\u306B\u4F7F\u3048\u306A\u3044\u507D\u30AB\u30FC\u30C9\u3067\u3059\u3002"), /* @__PURE__ */ React.createElement("p", null, "\u554F\u984C\u958B\u59CB\u6642\u306B\u914D\u7F6E\u3055\u308C\u305F\u304A\u90AA\u9B541\u679A\u306B\u3064\u304D\u901A\u5E38\u5F97\u70B9\u306E10%\u3092\u52A0\u7B97\u3002\u5230\u7740\u3057\u305F\u653B\u6483\u306F3\u79D2\u9593\u3001\u4ECA\u56DE\u306E\u6B63\u89E3\u3067\u767A\u751F\u3057\u305F\u653B\u6483\u3068\u76F8\u6BBA\u3067\u304D\u307E\u3059\u3002\u78BA\u5B9A\u3057\u305F\u304A\u90AA\u9B54\u306F\u6B21\u306E\u554F\u984C\u304B\u3089\u9069\u7528\u3057\u307E\u3059\u3002"), /* @__PURE__ */ React.createElement("p", null, "2\u30B3\u30F3\u30DC\u76EE\u304B\u3089\u30EC\u30D9\u30EB\xD73%\u306E\u30B2\u30FC\u30B8\u3092\u7372\u5F97\u3002100%\u3067FREEZE\u304C\u81EA\u52D5\u767A\u52D5\u3057\u3001\u76F8\u624B\u306E\u5F0F\u30FB\u30AB\u30FC\u30C9\u3068\u64CD\u4F5C\u30923\u79D2\u906E\u853D\u3057\u307E\u3059\u3002\u8A66\u5408\u6642\u9593\u30FB\u554F\u984C\u6642\u9593\u30FBHP\u6E1B\u5C11\u306F\u9032\u307F\u3001\u30B3\u30F3\u30DC\u7D99\u7D9A\u3068\u30AB\u30A6\u30F3\u30BF\u30FC\u306E\u6642\u8A08\u306F\u505C\u6B62\u3057\u307E\u3059\u3002"), /* @__PURE__ */ React.createElement("p", null, "\u30B3\u30F3\u30DC\u306F\u6B21\u306E\u554F\u984C\u304C\u64CD\u4F5C\u53EF\u80FD\u306B\u306A\u3063\u3066\u304B\u308910\u79D2\u4EE5\u5185\u306B\u6B63\u89E3\u3059\u308B\u3068\u7D99\u7D9A\u3057\u307E\u3059\u3002\u89B3\u6226\u5FDC\u63F4\u306F1\u56DE10pt\u30011\u4EBA3\u56DE\u300230pt\u3067\u6B21\u554F\u306E\u304A\u90AA\u9B541\u679A\u3092\u9664\u53BB\u3057\u3001\u8A66\u5408\u5168\u4F53\u3067\u6700\u59273\u679A\u3067\u3059\u3002"), /* @__PURE__ */ React.createElement("details", null, /* @__PURE__ */ React.createElement("summary", null, "\u30EC\u30D9\u30EB\u5225\u306E\u57FA\u790E\u5F97\u70B9"), /* @__PURE__ */ React.createElement("ul", null, Object.entries(B2.POINTS).map(([lv, n]) => /* @__PURE__ */ React.createElement("li", { key: lv }, "Lv.", lv, "\uFF1A", n, "\u70B9"))))), /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement("h2", null, "C\u65B9\u5F0F"), /* @__PURE__ */ React.createElement("p", null, "4\u4EBA\u30FB2\u5BFE2\u306E\u30C1\u30FC\u30E0\u6226\u3067\u3059\u3002HP\u306F\u30C1\u30FC\u30E0\u3067\u5171\u6709\u3057\u307E\u3059\u3002\u5473\u65B9\u3078\u306E\u653B\u6483\u3092\u30AB\u30D0\u30FC\u3067\u304D\u3001\u6761\u4EF6\u3092\u305D\u308D\u3048\u308B\u3068\u5408\u4F53\u653B\u6483\u304C\u767A\u751F\u3057\u307E\u3059\u3002\u7D50\u679C\u3067\u306F\u500B\u4EBA\u306E\u6B63\u89E3\u6570\u30FB\u5F97\u70B9\u3092\u5225\u3005\u306B\u78BA\u8A8D\u3067\u304D\u307E\u3059\u3002"), /* @__PURE__ */ React.createElement("p", null, "CPU\u7DF4\u7FD2\u3068\u81EA\u5206\u306E\u30B4\u30FC\u30B9\u30C8\u306F\u516C\u5F0F\u5BFE\u4EBA\u6226\u7E3E\u30FB\u79F0\u53F7\u53D6\u5F97\u306E\u5BFE\u8C61\u5916\u3067\u3059\u3002"))), tab === "daily" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement("h2", null, "\u4ECA\u65E5\u306E\u30DF\u30C3\u30B7\u30E7\u30F3\u3068\u4ECA\u65E5\u306E\u6311\u6226"), /* @__PURE__ */ React.createElement("p", null, "\u30DF\u30C3\u30B7\u30E7\u30F3\u306E\u304A\u984C\u3068\u30011\u65E5\u5408\u8A083\u56DE\u306E\u30C7\u30A4\u30EA\u30FC\u30C1\u30E3\u30EC\u30F3\u30B8\u306F\u5225\u306E\u6A5F\u80FD\u3067\u3059\u3002\u30C1\u30E3\u30EC\u30F3\u30B8\u306F\u30A4\u30FC\u30B8\u30FC\u30FB\u30CE\u30FC\u30DE\u30EB\u30FB\u30CF\u30FC\u30C9\u3092\u81EA\u7531\u306B\u9078\u3073\u3001\u30BD\u30ED\u3068\u540C\u3058\u554F\u984C\u6570\u30FB\u7BC4\u56F2\u3067\u6311\u307F\u307E\u3059\u3002\u65E5\u672C\u6642\u95930\u6642\u3067\u6311\u6226\u6A29\u304C\u66F4\u65B0\u3055\u308C\u307E\u3059\u3002"), /* @__PURE__ */ React.createElement("p", null, "\u958B\u59CB\u5F8C\u306E\u9000\u51FA\u30FB\u518D\u8AAD\u307F\u8FBC\u307F\u3067\u3082\u56DE\u6570\u306F\u623B\u308A\u307E\u305B\u3093\u3002\u8AA4\u7B54\u304C\u3042\u3063\u3066\u3082\u6700\u5F8C\u307E\u3067\u5B8C\u8D70\u3059\u308C\u3070\u30AF\u30EA\u30A2\u30BF\u30A4\u30E0\u3092\u8A18\u9332\u3057\u3001\u672A\u30AF\u30EA\u30A2\u3067\u3082\u5F97\u70B9\u304C\u3042\u308C\u3070\u30E9\u30F3\u30AD\u30F3\u30B0\u5BFE\u8C61\u3067\u3059\u3002")), /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement("h2", null, "\u30E9\u30F3\u30AD\u30F3\u30B0"), /* @__PURE__ */ React.createElement("p", null, "\u30E9\u30F3\u30AD\u30F3\u30B0\u7DCF\u5408\u304B\u3089\u30BD\u30ED\u30FB\u30C7\u30A4\u30EA\u30FC\u30FB\u30EC\u30FC\u30C6\u30A3\u30F3\u30B0\u3078\u9032\u3081\u307E\u3059\u3002\u30C7\u30A4\u30EA\u30FC\u306F\u5F97\u70B9\u3092\u6700\u512A\u5148\u3057\u3001\u540C\u70B9\u306A\u3089\u30AF\u30EA\u30A2\u72B6\u614B\u3001\u30BF\u30A4\u30E0\uFF0F\u6B63\u89E3\u6570\u3001\u78BA\u5B9A\u6642\u523B\u3067\u9806\u4F4D\u3092\u6C7A\u3081\u307E\u3059\u3002\u73FE\u5728\u30EC\u30FC\u30C8\u3068\u6B74\u4EE3\u6700\u9AD8\u30EC\u30FC\u30C8\u306F\u5225\u306E\u8A18\u9332\u3067\u3059\u3002"))), tab === "growth" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement("h2", null, "\u79F0\u53F7\u30FB\u304D\u305B\u304B\u3048"), /* @__PURE__ */ React.createElement("p", null, "\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB\u304B\u3089\u53D6\u5F97\u6E08\u307F\u79F0\u53F7\u3068\u30BF\u30A4\u30EB\u30FB\u80CC\u666F\u30FB\u30A8\u30D5\u30A7\u30AF\u30C8\u3092\u78BA\u8A8D\u3067\u304D\u307E\u3059\u3002\u79F0\u53F7\u306E\u672A\u516C\u958B\u6761\u4EF6\u306F\uFF1F\uFF1F\uFF1F\u3067\u3059\u3002\u73FE\u5728\u306E\u88C5\u5099\u3084\u904E\u53BB\u306E\u53D6\u5F97\u8A18\u9332\u306F\u4FDD\u6301\u3055\u308C\u307E\u3059\u3002")), /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement("h2", null, "\u4ECA\u9031\u306E\u30DC\u30B9\u30FB\u5354\u529B\u30EC\u30A4\u30C9"), /* @__PURE__ */ React.createElement("p", null, "\u9031\u9593\u30DC\u30B9\u306F\u307F\u3093\u306A\u306E\u30C0\u30E1\u30FC\u30B8\u3092\u5408\u308F\u305B\u3066\u8A0E\u4F10\u3057\u307E\u3059\u3002\u30AF\u30E9\u30B9\u5354\u529B\u30EC\u30A4\u30C9\u306F\u5148\u751F\u304C\u958B\u50AC\u3057\u3001\u30D5\u30EC\u30F3\u30C9\u30EC\u30A4\u30C9\u306F\u53C2\u52A0\u8005\u304C\u5F79\u5272\u3092\u5206\u62C5\u3057\u3066\u5354\u529B\u3057\u307E\u3059\u3002\u30DC\u30B9\u3084\u5F79\u5272\u3054\u3068\u306E\u7279\u6027\u3092\u78BA\u8A8D\u3057\u3066\u6311\u307F\u307E\u3057\u3087\u3046\u3002"))));
  }

  // src/title-inventory-ui.jsx
  var catalog = require_title_catalog_next();
  var compat = require_title_compat_next();
  function TitleCinematic({ muted = false, reducedMotion = false, onFinish = () => {
  } }) {
    const [sound, setSound] = React.useState(!muted), finished = React.useRef(false);
    const audio = React.useRef(null), done = () => {
      if (finished.current) return;
      finished.current = true;
      onFinish();
    };
    React.useEffect(() => {
      const old = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        var _a;
        document.body.style.overflow = old;
        (_a = audio.current) == null ? void 0 : _a.close().catch(() => {
        });
      };
    }, []);
    React.useEffect(() => {
      var _a;
      if (!sound) {
        (_a = audio.current) == null ? void 0 : _a.close().catch(() => {
        });
        audio.current = null;
        return;
      }
      try {
        const C = window.AudioContext || window.webkitAudioContext;
        if (!C) return;
        const c = new C();
        audio.current = c;
        const gain = c.createGain();
        gain.gain.value = 0.035;
        gain.connect(c.destination);
        for (const [f, i] of [[220, 0], [330, 1], [440, 2], [660, 3]]) {
          const o = c.createOscillator();
          o.type = "sine";
          o.frequency.value = f;
          o.connect(gain);
          o.start(c.currentTime + i * 0.2);
          o.stop(c.currentTime + i * 0.2 + 0.3);
        }
      } catch (e) {
      }
      return () => {
        var _a2;
        (_a2 = audio.current) == null ? void 0 : _a2.close().catch(() => {
        });
        audio.current = null;
      };
    }, [sound]);
    const ref = React.useRef(null);
    React.useEffect(() => {
      var _a;
      (_a = ref.current) == null ? void 0 : _a.showModal();
      return () => {
        var _a2;
        return (_a2 = ref.current) == null ? void 0 : _a2.close();
      };
    }, []);
    return /* @__PURE__ */ React.createElement("dialog", { ref, className: "next-title-cinematic " + (reducedMotion ? "reduced" : ""), "aria-label": "\u79F0\u53F7\u7372\u5F97\u6F14\u51FA", onCancel: (e) => {
      e.preventDefault();
      done();
    } }, /* @__PURE__ */ React.createElement("div", { className: "next-title-particles", "aria-hidden": "true" }, Array.from({ length: 18 }, (_, i) => /* @__PURE__ */ React.createElement("i", { key: i, style: { "--i": i } }))), /* @__PURE__ */ React.createElement("div", { className: "next-title-emblem", "aria-hidden": "true" }, "\xD7"), /* @__PURE__ */ React.createElement("div", { className: "next-title-slash", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("div", { className: "next-title-reveal" }, /* @__PURE__ */ React.createElement("p", null, "\u7279\u5225\u79F0\u53F7\u3092\u7372\u5F97"), /* @__PURE__ */ React.createElement("img", { src: "ui-next/logo-official.png", alt: "FACTOR\xD7FACTOR" }), /* @__PURE__ */ React.createElement("strong", null, "FACTOR\xD7FACTOR")), /* @__PURE__ */ React.createElement("div", { className: "next-title-controls" }, /* @__PURE__ */ React.createElement("button", { onClick: () => setSound((x) => !x), "aria-pressed": sound }, "\u97F3\u58F0", sound ? "ON" : "OFF"), /* @__PURE__ */ React.createElement("button", { autoFocus: true, onClick: done }, reducedMotion ? "\u9589\u3058\u308B" : "\u30B9\u30AD\u30C3\u30D7\u30FB\u9589\u3058\u308B")));
  }

  // src/next-spectator-ui.jsx
  function Spectator({ H, g, time, names = {}, onLeave, children }) {
    var _a, _b;
    const [selected, setSelected] = React.useState(g.ids[0]), [expanded, setExpanded] = React.useState(false), focus = g.ids.includes(selected) ? selected : g.ids[0];
    const last = (_b = (_a = g.scoreTrace) == null ? void 0 : _a.events) == null ? void 0 : _b.slice(-1)[0], notice = (last == null ? void 0 : last.uid) ? `${names[last.uid] || "\u30D7\u30EC\u30A4\u30E4\u30FC"}\u304C\u6B63\u89E3\u3002\uFF0B${last.gain}\u70B9` : "\u8A66\u5408\u72B6\u6CC1\u3092\u8868\u793A\u3057\u3066\u3044\u307E\u3059\u3002";
    return /* @__PURE__ */ React.createElement("main", { className: "next-spectator " + (expanded ? "expanded" : ""), "data-next-spectator": true }, /* @__PURE__ */ React.createElement("header", null, /* @__PURE__ */ React.createElement("h1", null, "\u89B3\u6226\u30FB\u65B0B\u65B9\u5F0F"), /* @__PURE__ */ React.createElement("button", { onClick: onLeave }, "\u89B3\u6226\u3092\u7D42\u4E86")), /* @__PURE__ */ React.createElement("p", null, "\u6B8B\u308A ", Math.max(0, (g.endAt - time) / 1e3).toFixed(1), "\u79D2"), /* @__PURE__ */ React.createElement("div", { className: "next-spectator-hud" }, g.ids.map((u) => {
      const s = g.states[u];
      return /* @__PURE__ */ React.createElement("button", { key: u, onClick: () => setSelected(u), "aria-pressed": u === focus }, /* @__PURE__ */ React.createElement("strong", null, names[u] || "\u30D7\u30EC\u30A4\u30E4\u30FC"), /* @__PURE__ */ React.createElement("span", null, s.score, "\u70B9 \uFF0F HP ", Math.round(s.hp), "%"), /* @__PURE__ */ React.createElement("small", null, "\u6B63\u89E3", s.c, "\u554F \u30FB ", s.combo, "\u30B3\u30F3\u30DC \uFF0F \u304A\u90AA\u9B54", s.cur.oj, "\u679A"));
    })), /* @__PURE__ */ React.createElement("p", { "aria-live": "polite" }, notice), /* @__PURE__ */ React.createElement("button", { className: "next-view-size", onClick: () => setExpanded((v) => !v) }, expanded ? "\u4E21\u8005\u3092\u4E26\u3079\u308B" : "\u9078\u629E\u3057\u305F\u76E4\u9762\u3092\u62E1\u5927"), /* @__PURE__ */ React.createElement("div", { className: "next-spectator-boards" }, g.ids.map((u) => {
      const s = g.states[u], visible = time >= g.startAt && !s.resolving && time >= s.qStart && time >= s.freezeUntil && !g.result && s.hp > 0;
      return /* @__PURE__ */ React.createElement("section", { key: u, "data-spectator-player": u, className: (u === focus ? "focused" : "") + " spectator-board" }, /* @__PURE__ */ React.createElement("h2", null, names[u] || "\u30D7\u30EC\u30A4\u30E4\u30FC"), visible ? /* @__PURE__ */ React.createElement("div", { className: "next-readonly-board", inert: "" }, /* @__PURE__ */ React.createElement(H.TargetCard, { poly: s.cur.poly, level: s.cur.level, qLabel: `${s.c + 1}\u554F`, v7: true }), /* @__PURE__ */ React.createElement(H.BattleBoard, { tiles: s.cur.tiles, disabled: true, onMatch: () => {
      }, v7: true })) : /* @__PURE__ */ React.createElement("p", { role: "status" }, g.result ? "\u8A66\u5408\u7D42\u4E86" : time < g.startAt ? "\u958B\u59CB\u5F85\u3061" : time < s.freezeUntil ? "FREEZE\u4E2D" : s.hp <= 0 ? "KO" : "\u6B21\u306E\u554F\u984C\u3092\u5F85\u3063\u3066\u3044\u307E\u3059"));
    })), children, g.result && /* @__PURE__ */ React.createElement("p", null, g.result.draw ? "\u5F15\u304D\u5206\u3051" : `${names[g.result.winner] || "\u30D7\u30EC\u30A4\u30E4\u30FC"}\u306E\u52DD\u5229`));
  }

  // src/next-results-ui.jsx
  var BResult = require_b_result();
  var palette = ["#71e0cf", "#f6bd62", "#b5a5ff", "#83c8ff"];
  function BDetails({ game, report, names = {}, me }) {
    const r = report || (game ? BResult.build(game) : { consistent: false, reason: "\u3053\u306E\u8A66\u5408\u306E\u8A73\u7D30\u306A\u5F97\u70B9\u5C65\u6B74\u306F\u3042\u308A\u307E\u305B\u3093\u3002" }), [selected, setSelected] = React.useState(null);
    if (!r.consistent) return /* @__PURE__ */ React.createElement("section", { className: "next-result-details", "data-b-result": true }, /* @__PURE__ */ React.createElement("h3", null, "\u65B0B\u65B9\u5F0F \u5F97\u70B9\u306E\u63A8\u79FB"), /* @__PURE__ */ React.createElement("p", { role: "status" }, r.reason || "\u8A73\u7D30\u8A18\u9332\u304C\u3042\u308A\u307E\u305B\u3093\u3002"));
    const ids = r.ids, other = ids.find((u) => u !== me), selectedIndex = selected === null ? r.rows.length - 1 : Math.min(selected, r.rows.length - 1), row = r.rows[selectedIndex], max = Math.max(1, ...Object.values(r.final)), duration = Math.max(1, r.endAt - r.startAt);
    const x = (at) => 42 + (at - r.startAt) / duration * 540, y = (n) => 196 - n / max * 155, label = (u) => names[u] || "\u30D7\u30EC\u30A4\u30E4\u30FC";
    let lastLead = 0;
    const reversals = r.rows.filter((e) => {
      const lead = Math.sign(e.scores[me] - e.scores[other]);
      const change = lead && lastLead && lead !== lastLead;
      if (lead) lastLead = lead;
      return change;
    });
    return /* @__PURE__ */ React.createElement("section", { className: "next-result-details", "data-b-result": true }, /* @__PURE__ */ React.createElement("h3", null, "\u65B0B\u65B9\u5F0F \u5F97\u70B9\u306E\u63A8\u79FB"), /* @__PURE__ */ React.createElement("p", null, "\u78BA\u5B9A\u5F97\u70B9\u5C65\u6B74 #", r.revision, " \u30FB \u6A2A\u8EF8\uFF1A\u7D4C\u904E\u79D2 \uFF0F \u7E26\u8EF8\uFF1A\u5F97\u70B9"), /* @__PURE__ */ React.createElement("ul", { className: "next-result-legend" }, ids.map((u, i) => /* @__PURE__ */ React.createElement("li", { key: u }, /* @__PURE__ */ React.createElement("span", { style: { background: palette[i % 4] } }), label(u), " ", /* @__PURE__ */ React.createElement("b", null, r.final[u], "\u70B9")))), /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 610 230", role: "img", "aria-label": "\u78BA\u5B9A\u3057\u305F\u7D2F\u7A4D\u5F97\u70B9\u306E\u63A8\u79FB" }, /* @__PURE__ */ React.createElement("title", null, "\u78BA\u5B9A\u5F97\u70B9\u3002\u9006\u8EE2\u7B87\u6240\u306F\u4E38\u5370"), [0, Math.round(max / 2), max].map((n, i) => /* @__PURE__ */ React.createElement("g", { key: i }, /* @__PURE__ */ React.createElement("line", { x1: "42", x2: "582", y1: y(n), y2: y(n), stroke: "#344c60" }), /* @__PURE__ */ React.createElement("text", { x: "36", y: y(n) + 4, textAnchor: "end" }, n))), ids.map((u, i) => {
      let points = [];
      r.rows.forEach((e, j) => {
        if (j) points.push([x(e.at), y(r.rows[j - 1].scores[u])]);
        points.push([x(e.at), y(e.scores[u])]);
      });
      points.push([x(r.endAt), y(r.final[u])]);
      return /* @__PURE__ */ React.createElement("polyline", { key: u, fill: "none", stroke: palette[i % 4], strokeWidth: "3", strokeDasharray: i % 2 ? "7 3" : void 0, points: points.map((p) => p.join(",")).join(" ") });
    }), reversals.map((e) => /* @__PURE__ */ React.createElement("circle", { key: e.id, cx: x(e.at), cy: y(e.scores[me]), r: "5", fill: "#f6bd62" })), /* @__PURE__ */ React.createElement("text", { x: "42", y: "218" }, "0\u79D2"), /* @__PURE__ */ React.createElement("text", { x: "582", y: "218", textAnchor: "end" }, (duration / 1e3).toFixed(1), "\u79D2")), /* @__PURE__ */ React.createElement("label", { className: "next-result-slider" }, "\u78BA\u5B9A\u30A4\u30D9\u30F3\u30C8 ", /* @__PURE__ */ React.createElement("input", { type: "range", min: "0", max: r.rows.length - 1, value: selectedIndex, onChange: (e) => setSelected(Number(e.target.value)) })), /* @__PURE__ */ React.createElement("p", { "aria-live": "polite" }, ((row.at - r.startAt) / 1e3).toFixed(1), "\u79D2\uFF1A", ids.map((u) => `${label(u)} ${row.scores[u]}\u70B9`).join(" \uFF0F "), me && other && `\uFF08\u5F97\u70B9\u5DEE ${row.scores[me] - row.scores[other]}\u70B9\uFF09`), /* @__PURE__ */ React.createElement("p", null, "\u25CF \u30EA\u30FC\u30C9\u4EA4\u4EE3 ", reversals.length, "\u56DE\uFF08\u540C\u70B9\u3092\u631F\u3080\u4EA4\u4EE3\u3092\u542B\u3080\uFF09"), /* @__PURE__ */ React.createElement("div", { className: "next-result-table" }, /* @__PURE__ */ React.createElement("table", null, /* @__PURE__ */ React.createElement("caption", null, "\u78BA\u5B9A\u3057\u305F\u6B63\u89E3\u30FB\u653B\u6483\u306E\u5408\u8A08"), /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "\u30D7\u30EC\u30A4\u30E4\u30FC"), ["\u6B63\u89E3", "\u8AA4\u7B54", "\u6642\u9593\u5207\u308C", "\u6700\u9AD8\u30B3\u30F3\u30DC", "Perfect", "\u9001\u4FE1\u304A\u90AA\u9B54", "\u76F8\u6BBA\u679A\u6570", "FREEZE"].map((t) => /* @__PURE__ */ React.createElement("th", { key: t }, t)))), /* @__PURE__ */ React.createElement("tbody", null, ids.map((u) => /* @__PURE__ */ React.createElement("tr", { key: u }, /* @__PURE__ */ React.createElement("th", null, label(u)), ["correct", "wrong", "timeouts", "best", "perfects", "attack", "cancel", "freeze"].map((k) => {
      var _a;
      return /* @__PURE__ */ React.createElement("td", { key: k }, (_a = r.summary[u][k]) != null ? _a : "\u2014");
    })))))), /* @__PURE__ */ React.createElement("details", null, /* @__PURE__ */ React.createElement("summary", null, "\u5F97\u70B9\u30A4\u30D9\u30F3\u30C8\u306E\u8A73\u7D30"), /* @__PURE__ */ React.createElement("ol", null, r.rows.slice(1).map((e) => /* @__PURE__ */ React.createElement("li", { key: e.id }, "#", e.id, " ", ((e.at - r.startAt) / 1e3).toFixed(1), "\u79D2\uFF1A", label(e.uid), " \uFF0B", e.gain, "\u70B9 \uFF0F ", ids.map((u) => `${label(u)} ${e.scores[u]}\u70B9`).join("\u30FB"))))));
  }
  function CDetails({ ids = [], records = {}, names = {}, teams = {}, teamLabels = {} }) {
    const known = (u, k) => {
      var _a;
      return typeof ((_a = records[u]) == null ? void 0 : _a[k]) === "number" && Number.isFinite(records[u][k]) ? records[u][k] : null;
    };
    const max = Math.max(1, ...ids.map((u) => {
      var _a;
      return (_a = known(u, "c")) != null ? _a : 0;
    }));
    return /* @__PURE__ */ React.createElement("section", { className: "next-result-details", "data-c-result": true }, /* @__PURE__ */ React.createElement("h3", null, "C\u65B9\u5F0F \u500B\u4EBA\u5225\u306E\u8A18\u9332"), /* @__PURE__ */ React.createElement("p", null, "\u7D42\u4E86\u753B\u9762\u3067\u53D6\u5F97\u3067\u304D\u305F\u4FDD\u5B58\u6E08\u307F\u5831\u544A\u3002\u6B63\u89E3\u6570\u3068\u5F97\u70B9\u306F\u5225\u306E\u6307\u6A19\u3067\u3059\u3002\u7DCF\u5408\u8CA2\u732E\u70B9\u306B\u306F\u63DB\u7B97\u3057\u307E\u305B\u3093\u3002"), /* @__PURE__ */ React.createElement("ul", { className: "next-c-bars" }, ids.map((u, i) => {
      var _a, _b;
      return /* @__PURE__ */ React.createElement("li", { key: u }, /* @__PURE__ */ React.createElement("div", null, teamLabels[teams[u]] || "\u30C1\u30FC\u30E0\u672A\u8A18\u9332", " \uFF0F ", names[u] || "\u30D7\u30EC\u30A4\u30E4\u30FC", " ", /* @__PURE__ */ React.createElement("b", null, known(u, "c") === null ? "\u672A\u8A18\u9332" : known(u, "c") + "\u554F\u6B63\u89E3")), known(u, "c") !== null && /* @__PURE__ */ React.createElement("div", { className: "next-c-bar", role: "img", "aria-label": `${names[u] || "\u30D7\u30EC\u30A4\u30E4\u30FC"} \u6B63\u89E3${known(u, "c")}\u554F` }, /* @__PURE__ */ React.createElement("span", { style: { width: 100 * known(u, "c") / max + "%", background: palette[i % 4] } })), /* @__PURE__ */ React.createElement("p", null, "\u5F97\u70B9 ", (_a = known(u, "score")) != null ? _a : "\u672A\u8A18\u9332", " \uFF0F \u6700\u7D42\u5831\u544A\u30B3\u30F3\u30DC ", (_b = known(u, "combo")) != null ? _b : "\u672A\u8A18\u9332"));
    })), /* @__PURE__ */ React.createElement("p", null, "\u653B\u6483\u30FB\u76F8\u6BBA\u30FB\u9632\u5FA1\u30FB\u56DE\u5FA9\u30FB\u500B\u4EBA\u5225HP\u5BC4\u4E0E\u306E\u78BA\u5B9A\u5408\u8A08\uFF0F\u6642\u7CFB\u5217\u306F\u672A\u8A18\u9332\u306E\u305F\u3081\u8868\u793A\u3067\u304D\u307E\u305B\u3093\u3002\u30C1\u30FC\u30E0\u5171\u6709HP\u3092\u500B\u4EBA\u306E\u8CA2\u732E\u3078\u63A8\u6E2C\u914D\u5206\u3057\u307E\u305B\u3093\u3002"));
  }
  window.NextResults = { AuthorityWeekly, LegacySpectator, BDetails, CDetails, Spectator, TitleCinematic, Help, buildB: BResult.build };
})();
