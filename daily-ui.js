(() => {
  (function(root) {
    root.DailyFactory = function(H) {
      const { useState, useEffect, useRef } = React, D = root.DailyV2.model, P = root.DailyV2.Play;
      function App({ acct, onExit, onMode, rankingsOnly = false, renderMenu }) {
        const [client] = useState(() => (acct == null ? void 0 : acct.key) ? root.DailyV2.create({ db: H.FB.db, uid: H.FB.uid, account: acct }) : null);
        const [status, setStatus] = useState(null), [day, setDay] = useState(null), [difficulty, setDifficulty] = useState("easy"), [rows, setRows] = useState([]), [err, setErr] = useState(""), [busy, setBusy] = useState(false), [record, setRecord] = useState(null), [loadingRows, setLoadingRows] = useState(false), [retry, setRetry] = useState(0);
        const [game, setGame] = useState(null), [time, setTime] = useState(0), [muted, setMuted] = H.useGameMute(), [feedback, setFeedback] = useState(null), [attempt, setAttempt] = useState(null);
        const sound = H.useBattleSound(muted);
        const ref = useRef(null), saved = useRef(false), pending = useRef(null), feedbackTimer = useRef(null), origin = useRef(0), startClock = useRef(0);
        const refresh = async () => {
          if (!client) return;
          const s = await client.status();
          setStatus(s);
          setDay((d) => d === null ? s.day : (status == null ? void 0 : status.day) !== s.day ? s.day + (d === (status == null ? void 0 : status.day) - 1 ? -1 : 0) : d);
        };
        useEffect(() => {
          if (!status) return;
          const ms = (status.day + 1) * D.DAY - D.SHIFT - status.now;
          const timer = setTimeout(() => refresh().catch((e) => setErr(e.message)), Math.max(100, ms + 100));
          return () => clearTimeout(timer);
        }, [status == null ? void 0 : status.now]);
        useEffect(() => {
          refresh().then(() => !rankingsOnly && (client == null ? void 0 : client.awards())).catch((e) => setErr(e.message));
          return () => clearTimeout(feedbackTimer.current);
        }, []);
        useEffect(() => {
          if (client && day !== null) {
            let active = true;
            setLoadingRows(true);
            client.rankings(day, difficulty).then((r) => {
              if (active) {
                setRows(r);
                setErr("");
                setLoadingRows(false);
              }
            }).catch((e) => {
              if (active) {
                setErr(e.message);
                setLoadingRows(false);
              }
            });
            return () => {
              active = false;
            };
          }
        }, [day, difficulty, record, retry]);
        const done = async (s, a) => {
          var _a;
          if (saved.current) return;
          saved.current = true;
          pending.current = { s, a };
          try {
            const r = await client.finish(a, s);
            setRecord(r);
            setErr("");
            await refresh();
            await ((_a = H.onCompleted) == null ? void 0 : _a.call(H, acct, a, s));
            pending.current = null;
          } catch (e) {
            saved.current = false;
            setErr("\u8A18\u9332\u3092\u9001\u4FE1\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u518D\u8A66\u884C\u3057\u3066\u304F\u3060\u3055\u3044\uFF1A" + e.message);
          }
        };
        useEffect(() => {
          if (!attempt || !game || game.done) return;
          const t = setInterval(() => {
            const now = startClock.current + performance.now() - origin.current;
            setTime(now);
            if (now < startClock.current) return;
            const n = P.tick(ref.current, now);
            ref.current = n;
            setGame(n);
            if (n.done) done(n, attempt);
          }, 40);
          return () => clearInterval(t);
        }, [attempt, !!game, game == null ? void 0 : game.done]);
        const start = async () => {
          if (busy) return;
          setBusy(true);
          setErr("");
          try {
            const a = await client.start(difficulty);
            setStatus((s2) => {
              var _a;
              return { ...s2, day: a.day, now: a.at, used: (_a = a.used) != null ? _a : s2 == null ? void 0 : s2.used };
            });
            setDifficulty(a.difficulty);
            setAttempt(a);
            setRecord(null);
            saved.current = false;
            origin.current = performance.now() + 3e3;
            startClock.current = Date.now();
            const s = P.begin(a.difficulty, a.seed, startClock.current);
            ref.current = s;
            setGame(s);
            setTime(startClock.current - 3e3);
          } catch (e) {
            setErr(e.message);
          } finally {
            setBusy(false);
          }
        };
        const answer = (id1, id2) => {
          var _a, _b;
          const ids = Array.isArray(id1) ? id1 : [id1, id2];
          if (time < startClock.current || ((_a = ref.current) == null ? void 0 : _a.resolving) || ((_b = ref.current) == null ? void 0 : _b.done)) return;
          const at = startClock.current + performance.now() - origin.current;
          try {
            const n = P.answer(ref.current, ids, at), hist = n.hist.slice(-1)[0];
            ref.current = n;
            setGame(n);
            setFeedback({ judge: H.timingVisual(hist.ok ? H.getJudgment(hist.ms) : { label: "Bad", color: "#FF5C5C" }), flash: Object.fromEntries(ids.map((id) => [id, hist.ok ? "correct" : "wrong"])) });
            sound.play(hist.ok ? "ok" : "buzz");
            clearTimeout(feedbackTimer.current);
            feedbackTimer.current = setTimeout(() => setFeedback(null), 420);
            if (n.done) done(n, attempt);
          } catch (e) {
            setErr(e.message);
          }
        };
        if (game && !game.done) {
          if (game.cur.reverse) return /* @__PURE__ */ React.createElement(H.BattleSurface, null, /* @__PURE__ */ React.createElement("h2", null, "\u5C55\u958B\u30DC\u30FC\u30CA\u30B9\u30FB", H.DIFFICULTY_CONFIG[difficulty].label), /* @__PURE__ */ React.createElement(H.MathText, { text: game.cur.factors.map(H.formatFactorTile).join("") }), /* @__PURE__ */ React.createElement("p", null, "\u6B63\u3057\u3044\u5C55\u958B\u7D50\u679C\u3092\u9078\u307C\u3046"), game.cur.choices.map((c) => /* @__PURE__ */ React.createElement("button", { key: c.id, "data-daily-choice": c.id, disabled: game.resolving || time < startClock.current, onClick: () => answer([c.id]) }, /* @__PURE__ */ React.createElement(H.MathText, { text: c.text }))), /* @__PURE__ */ React.createElement(H.HpBar, { hp: game.hp }));
          const g = { id: attempt.id, mode: "B", difficulty, question: `${game.cur.level}:${game.cur.k}`, poly: game.cur.poly, tiles: game.cur.tiles, level: game.cur.level, startAt: game.qStart, timeoutMs: 2e4, resolving: game.resolving, readyAt: game.readyAt, combo: game.combo, live: { daily: { ...game, c: game.index }, unused: { score: 0, hp: 100, c: 0, combo: 0 } }, acceptedSeq: 0 };
          return /* @__PURE__ */ React.createElement(H.BattleView, { H, m: { id: attempt.id, daily: true, selfUid: "daily", mode: "B", difficulty, gameStartAt: startClock.current, members: [{ uid: "daily", name: acct.name }, { uid: "unused", name: "\u30C7\u30A4\u30EA\u30FC\u30C1\u30E3\u30EC\u30F3\u30B8" }] }, g, time, muted, setMuted, disabled: time < startClock.current, onMatch: answer, onSpecial: () => {
          }, feedback, onLeave: () => {
            if (confirm("\u9014\u4E2D\u9000\u51FA\u306F\u672A\u30AF\u30EA\u30A2\u3068\u306A\u308A\u3001\u6311\u6226\u56DE\u6570\u306F\u623B\u308A\u307E\u305B\u3093\u3002\u9000\u51FA\u3057\u307E\u3059\u304B\uFF1F")) {
              const s = { ...ref.current, done: true, cleared: false, elapsed: Math.max(0, time - startClock.current) };
              ref.current = s;
              setGame(s);
              done(s, attempt);
            }
          } });
        }
        if (rankingsOnly && root.NextRanking) {
          const R = root.NextRanking, L = H.DIFFICULTY_CONFIG[difficulty].label, which = status && day !== null && day < status.day ? "yesterday" : "today";
          const state = !client ? "empty" : err ? "error" : loadingRows || day === null ? "loading" : rows.length ? "ok" : "empty";
          return /* @__PURE__ */ React.createElement("div", { className: "rk-daily", "data-ranking": "daily" }, /* @__PURE__ */ React.createElement(R.RankingHead, { title: "\u30C7\u30A4\u30EA\u30FC\u30E9\u30F3\u30AD\u30F3\u30B0", note: day === null ? "" : D.date(day) }), /* @__PURE__ */ React.createElement("div", { className: "rk-bar" }, /* @__PURE__ */ React.createElement(R.Segmented, { label: "\u65E5\u4ED8", items: [["today", "\u4ECA\u65E5"], ["yesterday", "\u6628\u65E5"]], value: which, onChange: (v) => status && setDay(v === "today" ? status.day : status.day - 1) }), /* @__PURE__ */ React.createElement(R.Segmented, { label: "\u96E3\u6613\u5EA6", items: ["easy", "normal", "hard"].map((d) => [d, H.DIFFICULTY_CONFIG[d].label]), value: difficulty, onChange: setDifficulty })), /* @__PURE__ */ React.createElement("p", { className: "rk-foot" }, L, " TOP10"), /* @__PURE__ */ React.createElement(R.ListState, { status: state, message: !client ? "1\u65E53\u56DE\u306E\u6311\u6226\u6A29\u3068\u30E9\u30F3\u30AD\u30F3\u30B0\u3092\u7BA1\u7406\u3059\u308B\u305F\u3081\u3001\u767B\u9332\u30A2\u30AB\u30A6\u30F3\u30C8\u3067\u30ED\u30B0\u30A4\u30F3\u3057\u3066\u304F\u3060\u3055\u3044\u3002\u30BD\u30ED\u30FBCPU\u7DF4\u7FD2\u306F\u30B2\u30B9\u30C8\u3067\u3082\u904A\u3079\u307E\u3059\u3002" : err ? err : state === "empty" ? "\u307E\u3060\u8A18\u9332\u304C\u3042\u308A\u307E\u305B\u3093" : void 0, onRetry: client && err ? () => setRetry((n) => n + 1) : null, retryLabel: "\u21BB \u518D\u8AAD\u307F\u8FBC\u307F" }), state === "ok" && /* @__PURE__ */ React.createElement(R.RankList, { label: L + " TOP10" }, rows.map((r, i) => /* @__PURE__ */ React.createElement(R.RankRow, { key: r.key, rank: i + 1, name: r.name, value: r.score, unit: "\u70B9", self: !!(acct == null ? void 0 : acct.key) && r.key === acct.key, sub: (r.cleared ? `\u30AF\u30EA\u30A2\u30BF\u30A4\u30E0 ${(r.elapsed / 1e3).toFixed(2)}\u79D2` : "\u672A\u30AF\u30EA\u30A2") + `\u30FB${r.correct}\u554F\u6B63\u89E3` + (day < (status == null ? void 0 : status.day) && i === 0 ? "\u30FB\u{1F3C6} \u512A\u52DD" : "") }))), /* @__PURE__ */ React.createElement("p", { className: "rk-foot" }, "\u5F97\u70B9\u2192\u30AF\u30EA\u30A2\u2192\u30BF\u30A4\u30E0\uFF0F\u6B63\u89E3\u6570\u2192\u78BA\u5B9A\u6642\u523B\u306E\u9806\u3002\u524D\u65E5\u306E\u512A\u52DD\u79F0\u53F7\u306F\u65E5\u8DE8\u304E\u6311\u6226\u306E\u7D42\u4E86\u7336\u4E88\u5F8C\u3001\u6B21\u56DE\u8D77\u52D5\u6642\u306B\u4ED8\u4E0E\u3057\u307E\u3059\u3002"));
        }
        return (renderMenu && !rankingsOnly ? renderMenu : (x) => x)(/* @__PURE__ */ React.createElement("main", { className: "or-app" }, /* @__PURE__ */ React.createElement("header", null, /* @__PURE__ */ React.createElement("button", { onClick: onExit }, rankingsOnly ? "\u30E9\u30F3\u30AD\u30F3\u30B0\u7DCF\u5408\u3078" : renderMenu ? "\u2190 \u623B\u308B" : "\u2190 \u30BF\u30A4\u30C8\u30EB\u3078"), /* @__PURE__ */ React.createElement("h1", null, rankingsOnly ? "\u30C7\u30A4\u30EA\u30FC\u30E9\u30F3\u30AD\u30F3\u30B0" : "\u30C7\u30A4\u30EA\u30FC\u30C1\u30E3\u30EC\u30F3\u30B8")), !client && /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement("p", null, "1\u65E53\u56DE\u306E\u6311\u6226\u6A29\u3068\u30E9\u30F3\u30AD\u30F3\u30B0\u3092\u7BA1\u7406\u3059\u308B\u305F\u3081\u3001\u767B\u9332\u30A2\u30AB\u30A6\u30F3\u30C8\u3067\u30ED\u30B0\u30A4\u30F3\u3057\u3066\u304F\u3060\u3055\u3044\u3002\u30BD\u30ED\u30FBCPU\u7DF4\u7FD2\u306F\u30B2\u30B9\u30C8\u3067\u3082\u904A\u3079\u307E\u3059\u3002")), err && /* @__PURE__ */ React.createElement("section", { role: "alert" }, /* @__PURE__ */ React.createElement("p", null, err), pending.current && /* @__PURE__ */ React.createElement("button", { onClick: () => done(pending.current.s, pending.current.a) }, "\u8A18\u9332\u306E\u9001\u4FE1\u3092\u518D\u8A66\u884C")), (game == null ? void 0 : game.done) && /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement("h2", null, game.cleared ? "\u30AF\u30EA\u30A2\uFF01" : "\u672A\u30AF\u30EA\u30A2"), /* @__PURE__ */ React.createElement("p", null, game.score, "\u70B9\u30FB", game.correct, "\u554F\u6B63\u89E3"), /* @__PURE__ */ React.createElement("p", null, game.cleared ? `\u30AF\u30EA\u30A2\u30BF\u30A4\u30E0 ${(game.elapsed / 1e3).toFixed(2)}\u79D2` : "\u9014\u4E2D\u7D42\u4E86\u3082\u7372\u5F97\u5F97\u70B9\u3067\u30E9\u30F3\u30AD\u30F3\u30B0\u306B\u53C2\u52A0\u3057\u307E\u3059"), /* @__PURE__ */ React.createElement("button", { onClick: () => {
          setGame(null);
          setAttempt(null);
        } }, "\u30C7\u30A4\u30EA\u30FC\u3078\u623B\u308B")), !rankingsOnly && /* @__PURE__ */ React.createElement("section", { className: "next-today-missions" }, /* @__PURE__ */ React.createElement("h2", null, "\u4ECA\u65E5\u306E\u30DF\u30C3\u30B7\u30E7\u30F3"), /* @__PURE__ */ React.createElement(H.Missions, { acct, onMode })), !rankingsOnly && /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement("h2", null, "\u4ECA\u65E5\u306E\u6311\u6226"), /* @__PURE__ */ React.createElement("p", null, "3\u96E3\u6613\u5EA6\u3092\u5408\u308F\u305B\u30661\u65E53\u56DE\u3002\u6B8B\u308A", status ? Math.max(0, 3 - status.used) : "\u2026", "\u56DE"), /* @__PURE__ */ React.createElement("p", null, H.DIFFICULTY_CONFIG[difficulty].clearCount, "\u554F\u3002\u30BD\u30ED\u3068\u540C\u3058\u96E3\u6613\u5EA6\u306E\u30E9\u30F3\u30C0\u30E0\u554F\u984C\u3067\u3059\u3002\u8AA4\u7B54\u304C\u3042\u3063\u3066\u3082\u6700\u5F8C\u307E\u3067\u5B8C\u8D70\u3059\u308C\u3070\u30AF\u30EA\u30A2\u3002"), /* @__PURE__ */ React.createElement("div", { className: "or-difficulty-grid" }, ["easy", "normal", "hard"].map((d) => /* @__PURE__ */ React.createElement("button", { key: d, className: "or-difficulty " + (difficulty === d ? "selected" : ""), style: { "--difficulty-color": H.DIFFICULTY_CONFIG[d].color }, onClick: () => setDifficulty(d) }, H.DIFFICULTY_CONFIG[d].label))), /* @__PURE__ */ React.createElement("button", { disabled: busy || !client || !status || status.used >= 3, onClick: start }, "\u3053\u306E\u96E3\u6613\u5EA6\u3067\u6311\u6226"), /* @__PURE__ */ React.createElement("p", null, "\u958B\u59CB\u5F8C\u306E\u9000\u51FA\u30FB\u518D\u8AAD\u307F\u8FBC\u307F\u3067\u30821\u56DE\u6D88\u8CBB\u3057\u307E\u3059\u3002\u65E5\u672C\u6642\u95930\u6642\u306B\u66F4\u65B0\u3002")), /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement("h2", null, "\u30C7\u30A4\u30EA\u30FC\u30E9\u30F3\u30AD\u30F3\u30B0\u30FB", day === null ? "" : D.date(day)), /* @__PURE__ */ React.createElement("button", { onClick: () => status && setDay(status.day) }, "\u4ECA\u65E5"), /* @__PURE__ */ React.createElement("button", { onClick: () => status && setDay(status.day - 1) }, "\u6628\u65E5"), rankingsOnly && /* @__PURE__ */ React.createElement("div", { className: "or-difficulty-grid" }, ["easy", "normal", "hard"].map((d) => /* @__PURE__ */ React.createElement("button", { key: d, "aria-pressed": difficulty === d, onClick: () => setDifficulty(d) }, H.DIFFICULTY_CONFIG[d].label))), /* @__PURE__ */ React.createElement("p", null, H.DIFFICULTY_CONFIG[difficulty].label, " TOP10"), /* @__PURE__ */ React.createElement("ol", null, rows.map((r, i) => /* @__PURE__ */ React.createElement("li", { key: r.key }, i + 1, "\u4F4D ", r.name, "\uFF1A", r.score, "\u70B9\u30FB", r.cleared ? `${(r.elapsed / 1e3).toFixed(2)}\u79D2` : "\u672A\u30AF\u30EA\u30A2", "\uFF08", r.correct, "\u554F\u6B63\u89E3\uFF09", day < (status == null ? void 0 : status.day) && i === 0 ? " \u{1F3C6} \u512A\u52DD" : ""))), !rows.length && /* @__PURE__ */ React.createElement("p", null, "\u307E\u3060\u8A18\u9332\u304C\u3042\u308A\u307E\u305B\u3093"), /* @__PURE__ */ React.createElement("p", null, "\u5F97\u70B9\u2192\u30AF\u30EA\u30A2\u2192\u30BF\u30A4\u30E0\uFF0F\u6B63\u89E3\u6570\u2192\u78BA\u5B9A\u6642\u523B\u306E\u9806\u3002\u524D\u65E5\u306E\u512A\u52DD\u79F0\u53F7\u306F\u65E5\u8DE8\u304E\u6311\u6226\u306E\u7D42\u4E86\u7336\u4E88\u5F8C\u3001\u6B21\u56DE\u8D77\u52D5\u6642\u306B\u4ED8\u4E0E\u3057\u307E\u3059\u3002"))));
      }
      return { App };
    };
  })(window);
})();
