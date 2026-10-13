(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  (function(root) {
    root.OnlineRatedFactory = function(H) {
      const { useState, useRef, useEffect, useMemo, useCallback } = React;
      const label = (d) => {
        var _a;
        return ((_a = H.DIFFICULTY_CONFIG[d]) == null ? void 0 : _a.label) || d;
      };
      const titles = {
        easy_adept: "EASY\u306E\u9054\u4EBA",
        easy_master: "EASY\u30DE\u30B9\u30BF\u30FC",
        normal_adept: "NORMAL\u306E\u9054\u4EBA",
        normal_master: "NORMAL\u30DE\u30B9\u30BF\u30FC",
        dual_master: "\u53CC\u74A7\u306E\u30DE\u30B9\u30BF\u30FC",
        hyper_slayer: "\u8D85\u5F71\u306E\u5F81\u670D\u8005",
        ghost_up1: "\u683C\u4E0A\u306E\u5F71\u3092\u7834\u308B\u8005",
        ghost_up2: "\u4E8C\u968E\u7D1A\u306E\u5F71\u3092\u8D85\u3048\u308B\u8005"
      };
      class PlayBoundary extends React.Component {
        constructor() {
          super(...arguments);
          __publicField(this, "state", { failed: false });
        }
        static getDerivedStateFromError() {
          return { failed: true };
        }
        componentDidCatch() {
          this.props.onFailure();
        }
        render() {
          return this.state.failed ? /* @__PURE__ */ React.createElement("section", { role: "alert" }, /* @__PURE__ */ React.createElement("p", null, "\u5BFE\u6226\u753B\u9762\u3092\u8AAD\u307F\u8FBC\u3081\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u9000\u51FA\u306B\u3088\u308B\u6557\u5317\u3092\u78BA\u5B9A\u305B\u305A\u3001\u5FA9\u5E30\u307E\u305F\u306F\u5B89\u5168\u306A\u4E2D\u65AD\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002"), /* @__PURE__ */ React.createElement(
            "button",
            {
              onClick: () => {
                this.setState({ failed: false });
                this.props.onRecover();
              }
            },
            "\u753B\u9762\u3092\u518D\u8A66\u884C"
          ), /* @__PURE__ */ React.createElement("button", { onClick: this.props.onAbort }, "\u521D\u671F\u5316\u5931\u6557\u306E\u5BFE\u6226\u3092\u5B89\u5168\u306B\u4E2D\u65AD")) : this.props.children;
        }
      }
      function BattleView({
        H: H2,
        m,
        g,
        time,
        muted,
        setMuted,
        disabled,
        onMatch,
        onSpecial,
        onLeave,
        feedback
      }) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _i;
        const tiles = useMemo(
          () => g.tiles,
          [g.question, JSON.stringify(g.tiles)]
        );
        if (!H2.BattleSurface || !H2.HpBar || !Array.isArray(tiles) || !g.poly)
          throw Error("BATTLE_INITIALIZATION_FAILED");
        const self = g.live[m.selfUid], opponent = (_a = Object.entries(g.live).find(
          ([uid]) => uid !== m.selfUid
        )) == null ? void 0 : _a[1];
        const counting = time < (m.gameStartAt || g.startAt), ready = !!g.resolving || time < Math.max(g.startAt, g.readyAt || 0);
        const score = typeof self === "number" ? self : (self == null ? void 0 : self.score) || 0, combo = typeof self === "object" ? self.combo : g.combo || 0;
        const seenVisual = useRef(((_c = (_b = g.visualEvents) == null ? void 0 : _b.slice(-1)[0]) == null ? void 0 : _c.id) || 0);
        useEffect(() => {
          const selfEl = document.querySelector("[data-online-self]"), oppEl = document.querySelector("[data-online-opponent]");
          for (const e of g.visualEvents || []) {
            if (e.id <= seenVisual.current) continue;
            seenVisual.current = e.id;
            const mine = e.uid === m.selfUid, el = mine ? selfEl : oppEl, p = e.payload;
            if (e.type === "incoming" && mine)
              H2.CombatFX.fly(oppEl, selfEl, "#FF5C5C");
            if (e.type === "hit") H2.CombatFX.hit(el, (p == null ? void 0 : p.dmg) || 0);
            if (e.type === "blocked") H2.CombatFX.ring(el, "#8FB8FF");
            if (e.type === "special" && p === "heal")
              H2.CombatFX.ring(el, "#8BE38F");
            if (e.type === "special" && p === "shield")
              H2.CombatFX.ring(el, "#8FB8FF");
          }
        }, [g.visualEvents, m.selfUid]);
        const N = H2.DIFFICULTY_CONFIG[m.difficulty].clearCount;
        return /* @__PURE__ */ React.createElement(H2.BattleSurface, null, /* @__PURE__ */ React.createElement(
          "div",
          {
            className: "v7-play or-battle",
            "data-online-mode": m.mode,
            "data-online-ready": !disabled && !ready && !g.result
          },
          /* @__PURE__ */ React.createElement("div", { className: "v7-zone" }, /* @__PURE__ */ React.createElement("div", { className: "or-game-header" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "or-game-controls" }, /* @__PURE__ */ React.createElement(
            "button",
            {
              className: "v7-bar-btn",
              onClick: onLeave,
              disabled
            },
            "\u2715 \u9000\u51FA"
          ), /* @__PURE__ */ React.createElement(
            "button",
            {
              className: "v7-bar-btn",
              "aria-label": muted ? "\u97F3\u3092\u51FA\u3059" : "\u6D88\u97F3",
              onClick: () => setMuted(!muted)
            },
            muted ? "\u{1F507}" : "\u{1F50A}"
          )), /* @__PURE__ */ React.createElement("span", { className: "v7-chip" }, m.mode === "A" ? "\u65E9\u3044\u8005\u52DD\u3061" : "\u30EC\u30FC\u30B9\uFF0B\u653B\u6483", " \u30FB", " ", label(m.difficulty))), /* @__PURE__ */ React.createElement("div", { className: "v7-wnd or-opponent", "data-online-opponent": "1" }, /* @__PURE__ */ React.createElement("b", null, ((_d = m.opponent) == null ? void 0 : _d.name) || ((_f = (_e = m.members) == null ? void 0 : _e.find((x) => x.uid !== m.selfUid)) == null ? void 0 : _f.name) || "\u76F8\u624B"), /* @__PURE__ */ React.createElement("small", null, typeof opponent === "number" ? opponent + "\u70B9" : `HP ${(_h = (_g = opponent == null ? void 0 : opponent.hp) == null ? void 0 : _g.toFixed(1)) != null ? _h : 100}% \u30FB ${(opponent == null ? void 0 : opponent.score) || 0}\u70B9`))), /* @__PURE__ */ React.createElement("div", { className: "or-stat-grid" }, H2.v7Stat(
            m.mode === "A" ? "\u3042\u306A\u305F" : "SCORE",
            score,
            "#7FD8FF"
          ), H2.v7Stat(
            m.mode === "A" ? "\u76F8\u624B" : "SOLVED",
            m.mode === "A" ? opponent || 0 : `${(self == null ? void 0 : self.c) || 0}/${N}`,
            "#FFB59C"
          ), H2.v7Stat("COMBO", combo)), m.mode === "B" && /* @__PURE__ */ React.createElement("div", { "data-online-self": "1", style: { position: "relative" } }, /* @__PURE__ */ React.createElement(H2.HpBar, { v7: true, hp: (_i = self == null ? void 0 : self.hp) != null ? _i : 100, height: 22 }), (self == null ? void 0 : self.shield) && /* @__PURE__ */ React.createElement("span", { className: "or-shield-status" }, "\u{1F6E1} \u9632\u5FA1\u4E2D")), /* @__PURE__ */ React.createElement("div", { className: "or-progress", "aria-label": "\u5BFE\u6226\u306E\u9032\u884C" }, Array.from({ length: N }, (_, i) => /* @__PURE__ */ React.createElement(
            "i",
            {
              key: i,
              style: {
                background: i < (m.mode === "A" ? Number(g.question) : (self == null ? void 0 : self.c) || 0) ? "#7FD8FF" : i === (m.mode === "A" ? Number(g.question) : (self == null ? void 0 : self.c) || 0) ? "#FFD54A" : "#24336E"
              }
            }
          ))), m.mode === "B" && /* @__PURE__ */ React.createElement("div", { className: "or-special" }, /* @__PURE__ */ React.createElement("span", null, "\u5FC5\u6BBA ", (self == null ? void 0 : self.sp) || 0, "/", H2.SP_MAX), Object.entries(H2.SP_INFO).map(([kind, info]) => /* @__PURE__ */ React.createElement(
            "button",
            {
              key: kind,
              "data-sp": kind,
              disabled: disabled || ready || ((self == null ? void 0 : self.sp) || 0) < H2.SP_MAX,
              onClick: () => onSpecial(kind)
            },
            info.label
          ))), /* @__PURE__ */ React.createElement("p", { className: "or-connection", role: "status" }, counting ? "\u307E\u3082\u306A\u304F\u958B\u59CB" : ready ? "\u6B21\u306E\u554F\u984C\u3092\u6E96\u5099\u4E2D" : "\u5BFE\u6226\u4E2D", " ", "\u30FB \u6B8B\u308A", " ", Math.max(0, (g.timeoutMs - (time - g.startAt)) / 1e3).toFixed(
            1
          ), "\u79D2")),
          /* @__PURE__ */ React.createElement("div", { className: "v7-main" }, /* @__PURE__ */ React.createElement("div", { className: "or-feedback", "aria-live": "polite" }, /* @__PURE__ */ React.createElement(
            H2.TimingJudgment,
            {
              judge: feedback == null ? void 0 : feedback.judge,
              className: "or-timing"
            }
          ), /* @__PURE__ */ React.createElement(H2.ComboDisplay, { combo })), /* @__PURE__ */ React.createElement("div", { className: "relative", style: { flexShrink: 0 } }, /* @__PURE__ */ React.createElement(
            H2.TargetCard,
            {
              poly: g.poly,
              level: g.level,
              qLabel: `\u554F${m.mode === "A" ? Number(g.question) + 1 : ((self == null ? void 0 : self.c) || 0) + 1}/${N}`,
              gaugeKey: g.question + ":" + g.startAt,
              gaugeMs: Math.max(1, g.timeoutMs - (time - g.startAt)),
              v7: true
            }
          )), /* @__PURE__ */ React.createElement(
            H2.BattleBoard,
            {
              flash: feedback == null ? void 0 : feedback.flash,
              tiles,
              onMatch,
              disabled: disabled || ready || !!g.result,
              dim: ready,
              v7: true
            }
          ), /* @__PURE__ */ React.createElement("p", { className: "v7-hint" }, m.mode === "A" ? "\u5148\u306B\u6B63\u89E3\u3057\u305F\u4EBA\u3060\u3051\u5F97\u70B9 \u30FB \u307E\u3061\u304C\u3048\u308B\u30682\u79D2\u304A\u624B\u3064\u304D" : "\u30B3\u30F3\u30DC\u3067\u653B\u6483 \u30FB \u30B2\u30FC\u30B8\u6E80\u30BF\u30F3\u3067\u5FC5\u6BBA\u6280")),
          counting && /* @__PURE__ */ React.createElement("div", { className: "or-countdown", "aria-label": "\u958B\u59CB\u30AB\u30A6\u30F3\u30C8\u30C0\u30A6\u30F3" }, Math.max(
            1,
            Math.ceil(((m.gameStartAt || g.startAt) - time) / 1e3)
          ))
        ));
      }
      function Result({ H: H2, m, state, acct, titles: titles2, badgesBefore, busy, onExit }) {
        var _a, _b, _c;
        const won = m.outcome === "win", r = (_b = (_a = m.receipt) == null ? void 0 : _a.players) == null ? void 0 : _b[acct.key];
        const badges = Object.keys(state.badges || {}).filter(
          (k) => !badgesBefore[k] && titles2[k]
        );
        useEffect(() => {
          if (won) H2.CombatFX.victory();
          return () => H2.CombatFX.cancel();
        }, [m.id]);
        return /* @__PURE__ */ React.createElement(
          "section",
          {
            className: `or-result ${won ? "or-victory" : "or-defeat"}`,
            "data-result-kind": m.outcome
          },
          won && /* @__PURE__ */ React.createElement("div", { className: "or-victory-rays", "aria-hidden": "true" }),
          /* @__PURE__ */ React.createElement("h3", null, won ? "\u52DD\u5229\uFF01" : m.outcome === "draw" ? "\u5F15\u304D\u5206\u3051" : "\u6557\u5317"),
          /* @__PURE__ */ React.createElement("p", { className: "or-result-sub" }, won ? "VICTORY\uFF01" : m.outcome === "draw" ? "DRAW" : "\u307E\u305F\u6311\u6226\u3057\u3088\u3046"),
          /* @__PURE__ */ React.createElement("strong", { className: "or-delta" }, "\u30EC\u30FC\u30C8 ", (r == null ? void 0 : r.delta) >= 0 ? "+" : "", (_c = r == null ? void 0 : r.delta) != null ? _c : 0),
          /* @__PURE__ */ React.createElement("p", null, r == null ? void 0 : r.before, " \u2192 ", r == null ? void 0 : r.after),
          /* @__PURE__ */ React.createElement("p", null, ["bounty", "profile"].includes(m.origin) ? "\u6307\u540D\u6226\uFF1A\u516C\u5F0F\u30EC\u30FC\u30C8\u30FB\u5BFE\u6226\u6570\u306F\u5909\u66F4\u3057\u307E\u305B\u3093" : `${label(m.difficulty)}\u306E\u307F\u66F4\u65B0${m.opponent ? "\uFF08\u5909\u52D5\u306F\u4EBA\u9593\u6226\u306E1/3\uFF09" : ""}`),
          m.opponent && /* @__PURE__ */ React.createElement("div", { className: "or-exp" }, "\u7372\u5F97EXP ", /* @__PURE__ */ React.createElement("b", null, "+", m.exp || 0)),
          badges.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "or-new-title", "data-new-title": "1" }, "\u2728 \u65B0\u3057\u3044\u79F0\u53F7\uFF01", badges.map((k) => /* @__PURE__ */ React.createElement("p", { key: k }, titles2[k]))),
          /* @__PURE__ */ React.createElement("button", { disabled: busy, className: "or-primary", onClick: onExit }, ["bounty", "profile"].includes(m.origin) ? "\u4E00\u89A7\u3078\u623B\u308B" : "\u30AA\u30F3\u30E9\u30A4\u30F3\u30E1\u30CB\u30E5\u30FC\u3078\u623B\u308B")
        );
      }
      function App({ acct, onExit, view = "match", initialGhost = null }) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m;
        const [state, setState] = useState(null), [error, setError] = useState(""), [feedback, setFeedback] = useState(null), [screen, setScreen] = useState(
          view === "ratings" ? "ratings" : "select"
        ), [tab, setTab] = useState("easy"), [busy, setBusy] = useState(false), [selectedPlayer, setSelectedPlayer] = useState(null), [muted, setMuted] = H.useGameMute();
        const current = useRef(null), inFlight = useRef(false), seq = useRef(0), life = useRef(true), retry = useRef(null), requestRef = useRef(null), requests = useRef(Promise.resolve()), actionPending = useRef(false), pollingPaused = useRef(false), feedbackTimer = useRef(null), badgesBefore = useRef(null), initializing = useRef(true);
        const sound = H.useBattleSound(muted);
        const [spark] = useState(
          () => H.createTransport && (acct == null ? void 0 : acct.key) ? H.createTransport(acct) : null
        );
        current.current = state;
        useEffect(
          () => () => {
            life.current = false;
            H.CombatFX.cancel();
            clearTimeout(feedbackTimer.current);
            spark == null ? void 0 : spark.close();
            sound.bgm(false);
          },
          []
        );
        function send(command) {
          if (!command) return Promise.resolve();
          const background = command.type === "heartbeat";
          if (background && (inFlight.current || actionPending.current || pollingPaused.current))
            return Promise.resolve();
          if (!background && actionPending.current) return Promise.resolve();
          if (!background) {
            actionPending.current = true;
            setBusy(true);
            if (["cancel", "leave", "abortInitialization"].includes(command.type))
              pollingPaused.current = true;
            else pollingPaused.current = false;
          }
          const task = requests.current.then(() => perform(command, background));
          requests.current = task.catch(() => {
          });
          return task;
        }
        async function perform(command, background) {
          var _a2, _b2, _c2, _d2, _e2;
          if (!life.current) return;
          inFlight.current = true;
          if (!background) setError("");
          try {
            if (!spark)
              throw Error(
                "\u5BFE\u6226\u306E\u6E96\u5099\u304C\u3067\u304D\u3066\u3044\u307E\u305B\u3093\u3002\u30E1\u30CB\u30E5\u30FC\u304B\u3089\u958B\u304D\u76F4\u3057\u3066\u304F\u3060\u3055\u3044"
              );
            let timeout;
            const slow = new Promise((_, reject) => {
              timeout = setTimeout(
                () => reject(
                  Error(
                    "\u901A\u4FE1\u304C\u9045\u308C\u3066\u3044\u307E\u3059\u3002\u63A5\u7D9A\u3092\u78BA\u8A8D\u3057\u3001\u518D\u8A66\u884C\u3057\u3066\u304F\u3060\u3055\u3044\u3002\u4FDD\u5B58\u7D50\u679C\u306F\u518D\u78BA\u8A8D\u3057\u307E\u3059\u3002"
                  )
                ),
                15e3
              );
            });
            let v;
            try {
              v = await Promise.race([spark.request(command), slow]);
            } finally {
              clearTimeout(timeout);
            }
            if (!life.current) return;
            setError("");
            retry.current = null;
            if (badgesBefore.current === null)
              badgesBefore.current = { ...v.badges };
            setState(v);
            current.current = v;
            if ((_a2 = v.match) == null ? void 0 : _a2.game) seq.current = v.match.game.acceptedSeq;
            if (view === "ratings") setScreen("ratings");
            else if (((_b2 = v.match) == null ? void 0 : _b2.phase) === "settled")
              setScreen(
                initializing.current && !initialGhost ? "select" : "result"
              );
            else if (((_c2 = v.match) == null ? void 0 : _c2.phase) === "cancelled") {
              setScreen("select");
              setError("\u5BFE\u6226\u958B\u59CB\u524D\u306B\u76F8\u624B\u304C\u9000\u51FA\u3057\u307E\u3057\u305F");
            } else if (v.match) setScreen(v.match.phase);
            else if (v.ticket) setScreen("wait");
            else setScreen("select");
            return v;
          } catch (e) {
            if (life.current) {
              if (["STALE_QUESTION", "SEQUENCE_GAP"].includes(e.message)) {
                retry.current = {
                  type: "status",
                  matchId: (_e2 = (_d2 = current.current) == null ? void 0 : _d2.match) == null ? void 0 : _e2.id
                };
                setError("\u554F\u984C\u304C\u66F4\u65B0\u3055\u308C\u307E\u3057\u305F\u3002\u6700\u65B0\u306E\u554F\u984C\u3092\u78BA\u8A8D\u3057\u3066\u3044\u307E\u3059\u2026");
                setTimeout(() => {
                  if (life.current) requestRef.current(retry.current);
                }, 100);
                return;
              }
              retry.current = command;
              setError(
                e.message === "The operation was aborted." ? "\u901A\u4FE1\u304C\u9045\u308C\u3066\u3044\u307E\u3059\u3002\u7D50\u679C\u3092\u78BA\u8A8D\u3057\u3066\u304B\u3089\u518D\u8A66\u884C\u3057\u307E\u3059\u3002" : e.message
              );
            }
          } finally {
            inFlight.current = false;
            if (!background) {
              actionPending.current = false;
              if (life.current) setBusy(false);
            }
          }
        }
        requestRef.current = send;
        useEffect(() => {
          if (!(acct == null ? void 0 : acct.key)) {
            setError("\u767B\u9332\u30A2\u30AB\u30A6\u30F3\u30C8\u3067\u30ED\u30B0\u30A4\u30F3\u3057\u3066\u304B\u3089\u691C\u7D22\u3057\u3066\u304F\u3060\u3055\u3044");
            return;
          }
          (async () => {
            var _a2;
            const v = await send(
              initialGhost ? { type: "directGhost", ...initialGhost } : { type: view === "ratings" ? "ratings" : "status" }
            );
            if (view === "match" && !initialGhost && ((_a2 = v == null ? void 0 : v.match) == null ? void 0 : _a2.phase) === "settled")
              await send({ type: "ackReceipt", matchId: v.match.id });
            initializing.current = false;
          })();
        }, []);
        useEffect(() => {
          if (!["wait", "vote", "play"].includes(screen)) return;
          const id = setInterval(() => {
            if (retry.current || pollingPaused.current) return;
            const s = current.current, m2 = s == null ? void 0 : s.match;
            requestRef.current({
              type: "heartbeat",
              ...m2 ? { matchId: m2.id } : {}
            });
          }, 1e3);
          return () => clearInterval(id);
        }, [screen]);
        useEffect(() => {
          sound.bgm(screen === "play" && !error);
        }, [screen, error, muted]);
        const m = state == null ? void 0 : state.match, g = m == null ? void 0 : m.game;
        const [localTime, setLocalTime] = useState(Date.now());
        useEffect(() => {
          if (!["play", "wait"].includes(screen)) return;
          const timer = setInterval(() => setLocalTime(Date.now()), 100);
          return () => clearInterval(timer);
        }, [screen]);
        const time = localTime + (H.FB.off || 0);
        const answer = useCallback((a, b) => {
          var _a2;
          const m2 = (_a2 = current.current) == null ? void 0 : _a2.match, g2 = m2 == null ? void 0 : m2.game;
          if (actionPending.current || retry.current || !g2) return;
          const command = {
            type: "answer",
            matchId: m2.id,
            question: g2.question,
            tiles: [a, b],
            seq: ++seq.current
          };
          const captured = H.CombatFX.capture(
            [a, b].map((id) => document.querySelector(`[data-btile="${id}"]`)),
            document.querySelector("[data-online-opponent]")
          );
          const prior = g2.live[m2.selfUid];
          send(command).then((v) => {
            var _a3, _b2, _c2;
            if (!(v == null ? void 0 : v.match) || !life.current) return;
            const next = (_a3 = v.match.game) == null ? void 0 : _a3.live[m2.selfUid];
            const won = v.match.outcome === "win" || (typeof prior === "number" ? next > prior : (next == null ? void 0 : next.c) > (prior == null ? void 0 : prior.c));
            const moved = v.match.phase === "settled" || ((_b2 = v.match.game) == null ? void 0 : _b2.question) !== g2.question;
            const record = v.match.lastAnswer;
            const judge = won ? H.timingVisual(
              (record == null ? void 0 : record.ok) === false ? { label: "Bad", color: "#FF5C5C" } : H.getJudgment((_c2 = record == null ? void 0 : record.ms) != null ? _c2 : Math.max(0, time - g2.startAt))
            ) : moved ? { label: "\u6B21\u306E\u554F\u984C\u3078", color: "#6BD4E8", small: true } : H.timingVisual({ label: "Bad", color: "#FF5C5C" });
            if (won && (record == null ? void 0 : record.ok) !== false) {
              H.CombatFX.merge(captured, judge.color);
              sound.play("ok");
            } else if (!moved) sound.play("buzz");
            setFeedback({
              judge,
              flash: {
                [a]: won ? "correct" : "wrong",
                [b]: won ? "correct" : "wrong"
              }
            });
            clearTimeout(feedbackTimer.current);
            feedbackTimer.current = setTimeout(() => setFeedback(null), 650);
          });
        }, []);
        useEffect(() => {
          seq.current = (g == null ? void 0 : g.acceptedSeq) || 0;
        }, [m == null ? void 0 : m.id]);
        return /* @__PURE__ */ React.createElement(
          "main",
          {
            className: `or-app ${screen === "play" ? "or-playing" : "or-menu"}`
          },
          /* @__PURE__ */ React.createElement(H.FontImport, null),
          ["play", "result"].includes(screen) && /* @__PURE__ */ React.createElement(H.FxLayer, { level: 112, combat: true }),
          screen !== "play" && /* @__PURE__ */ React.createElement("header", null, /* @__PURE__ */ React.createElement(
            "button",
            {
              onClick: () => {
                if (["wait", "vote", "play"].includes(screen)) {
                  setError(
                    "\u691C\u7D22\u3092\u30AD\u30E3\u30F3\u30BB\u30EB\u3001\u307E\u305F\u306F\u5BFE\u6226\u304B\u3089\u9000\u51FA\u3057\u3066\u304B\u3089\u623B\u3063\u3066\u304F\u3060\u3055\u3044"
                  );
                  return;
                }
                if ((m == null ? void 0 : m.phase) === "settled") {
                  send({ type: "ackReceipt", matchId: m.id }).then((v) => {
                    if (v) onExit();
                  });
                  return;
                }
                onExit();
              },
              disabled: busy
            },
            initialGhost ? "\u4E00\u89A7\u3078\u623B\u308B" : "\u30AA\u30F3\u30E9\u30A4\u30F3\u3078\u623B\u308B"
          ), /* @__PURE__ */ React.createElement("h2", null, view === "ratings" ? "\u30AA\u30F3\u30E9\u30A4\u30F3\u30EC\u30FC\u30C6\u30A3\u30F3\u30B0" : initialGhost || ["bounty", "profile"].includes(m == null ? void 0 : m.origin) ? "\u6307\u540D\u30B4\u30FC\u30B9\u30C8\u5BFE\u6226" : "\u3059\u3050\u904A\u3076"), /* @__PURE__ */ React.createElement("small", { className: "or-version" }, (_a = root.FactorVersion) == null ? void 0 : _a.label), /* @__PURE__ */ React.createElement(
            "button",
            {
              "aria-label": muted ? "\u97F3\u3092\u51FA\u3059" : "\u6D88\u97F3",
              onClick: () => setMuted(!muted)
            },
            muted ? "\u{1F507}" : "\u{1F50A}"
          )),
          error && /* @__PURE__ */ React.createElement("section", { role: "alert" }, /* @__PURE__ */ React.createElement("p", null, error), /* @__PURE__ */ React.createElement(
            "button",
            {
              disabled: busy,
              onClick: () => send(
                retry.current || {
                  type: view === "ratings" ? "ratings" : "heartbeat",
                  matchId: m == null ? void 0 : m.id
                }
              )
            },
            "\u518D\u8A66\u884C\u30FB\u6700\u65B0\u7D50\u679C\u3092\u78BA\u8A8D"
          )),
          screen === "select" && !initialGhost && /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement("h3", null, "\u96E3\u6613\u5EA6\u3092\u9078\u3093\u3067\u5BFE\u6226"), ["easy", "normal"].map((d) => /* @__PURE__ */ React.createElement(
            "button",
            {
              key: d,
              className: "or-difficulty",
              style: { "--difficulty-color": H.DIFFICULTY_CONFIG[d].color },
              disabled: busy || !(acct == null ? void 0 : acct.key),
              onClick: () => send({ type: "enqueue", difficulty: d })
            },
            label(d),
            "\u3067\u76F8\u624B\u3092\u63A2\u3059"
          ))),
          screen === "select" && initialGhost && /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement("h3", null, "\u6307\u540D\u30B4\u30FC\u30B9\u30C8\u5BFE\u6226"), /* @__PURE__ */ React.createElement("p", null, "\u5BFE\u8C61\u30D7\u30EC\u30A4\u30E4\u30FC\u306E\u5B66\u7FD2\u8A18\u9332\u3067\u5BFE\u6226\u3057\u307E\u3059\u3002\u516C\u5F0F\u30EC\u30FC\u30C6\u30A3\u30F3\u30B0\u30FB\u4EBA\u9593\u5BFE\u6226\u6570\u306F\u5909\u66F4\u3057\u307E\u305B\u3093\u3002"), /* @__PURE__ */ React.createElement(
            "button",
            {
              disabled: busy,
              onClick: () => send({ type: "directGhost", ...initialGhost })
            },
            "\u6307\u540D\u5BFE\u6226\u3092\u518D\u8A66\u884C"
          )),
          screen === "wait" && /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement("div", { className: "or-search-icon", "aria-hidden": "true" }, "\u{1F50D}"), /* @__PURE__ */ React.createElement("h3", null, "\u5BFE\u6226\u76F8\u624B\u3092\u63A2\u3057\u3066\u3044\u307E\u3059"), /* @__PURE__ */ React.createElement("p", { className: "or-elapsed", "aria-label": "\u691C\u7D22\u7D4C\u904E\u6642\u9593" }, Math.max(
            0,
            (time - ((state == null ? void 0 : state.searchStarted) || time)) / 1e3
          ).toFixed(1), "\u79D2"), /* @__PURE__ */ React.createElement("p", null, state.ghostReady ? "10\u79D2\u3067\u4EBA\u9593\u304C\u898B\u3064\u304B\u3089\u306A\u3051\u308C\u3070\u30B4\u30FC\u30B9\u30C8\u30FBBOT\u304C\u4E71\u5165\u3057\u307E\u3059" : "\u4EBA\u9593\u306E\u5BFE\u6226\u76F8\u624B\u3092\u63A2\u3057\u3066\u3044\u307E\u3059"), /* @__PURE__ */ React.createElement(
            "button",
            {
              disabled: busy,
              onClick: () => send({ type: "cancel", ticket: state.ticket })
            },
            "\u691C\u7D22\u3092\u30AD\u30E3\u30F3\u30BB\u30EB"
          )),
          screen === "vote" && /* @__PURE__ */ React.createElement("section", null, m.opponent && /* @__PURE__ */ React.createElement(
            "div",
            {
              className: `or-intrusion ${m.opponent.type === "hyper" ? "or-hyper" : ""}`,
              role: "status"
            },
            /* @__PURE__ */ React.createElement("strong", null, m.opponent.type === "hyper" ? "HYPER GHOST \u4E71\u5165\uFF01" : m.opponent.type === "bot" ? "BOT \u4E71\u5165\uFF01" : "GHOST \u4E71\u5165\uFF01"),
            /* @__PURE__ */ React.createElement("p", null, m.opponent.name),
            /* @__PURE__ */ React.createElement("small", null, [
              "\u30D6\u30ED\u30F3\u30BA",
              "\u30B7\u30EB\u30D0\u30FC",
              "\u30B4\u30FC\u30EB\u30C9",
              "\u30D7\u30E9\u30C1\u30CA",
              "\u30C0\u30A4\u30E4",
              "\u30DE\u30B9\u30BF\u30FC"
            ][m.opponent.rank], " ", "\u30FB \u30EC\u30FC\u30C8", m.opponent.rating)
          ), /* @__PURE__ */ React.createElement("h3", null, label(m.difficulty), " \u30FB \u65B9\u5F0F\u3092\u9078\u3076"), /* @__PURE__ */ React.createElement("p", null, "\u96E3\u6613\u5EA6\u306F\u56FA\u5B9A\u3067\u3059\u3002\u65B9\u5F0F\u304C\u5206\u304B\u308C\u305F\u5834\u5408\u30FB\u6642\u9593\u5207\u308C\u306F\u30E9\u30F3\u30C0\u30E0\u306B\u6C7A\u307E\u308A\u307E\u3059\u3002"), ["A", "B"].map((mode) => /* @__PURE__ */ React.createElement(
            "button",
            {
              key: mode,
              disabled: busy,
              onClick: () => send({ type: "vote", matchId: m.id, mode })
            },
            mode === "A" ? "A\uFF1A\u65E9\u3044\u8005\u52DD\u3061" : "B\uFF1A\u30EC\u30FC\u30B9\uFF0B\u653B\u6483"
          )), /* @__PURE__ */ React.createElement(
            "button",
            {
              disabled: busy,
              onClick: () => send({ type: "leave", matchId: m.id })
            },
            "\u958B\u59CB\u524D\u306B\u9000\u51FA"
          )),
          screen === "play" && g && /* @__PURE__ */ React.createElement(
            PlayBoundary,
            {
              key: m.id,
              onFailure: () => {
                pollingPaused.current = true;
              },
              onRecover: () => {
                pollingPaused.current = false;
                send({ type: "status", matchId: m.id });
              },
              onAbort: () => send({ type: "abortInitialization", matchId: m.id })
            },
            /* @__PURE__ */ React.createElement(
              BattleView,
              {
                H,
                feedback,
                m,
                g,
                time,
                muted,
                setMuted,
                disabled: busy || !!error,
                onMatch: answer,
                onSpecial: (kind) => send({
                  type: "special",
                  matchId: m.id,
                  kind,
                  seq: ++seq.current
                }),
                onLeave: () => {
                  if (time < m.gameStartAt || confirm("\u9000\u51FA\u3059\u308B\u3068\u6557\u5317\u6271\u3044\u306B\u306A\u308A\u307E\u3059\u3002\u9000\u51FA\u3057\u307E\u3059\u304B\uFF1F"))
                    send({ type: "leave", matchId: m.id });
                }
              }
            )
          ),
          screen === "result" && /* @__PURE__ */ React.createElement(
            Result,
            {
              H,
              m,
              state,
              acct,
              titles,
              badgesBefore: badgesBefore.current || {},
              busy,
              onExit: () => send({ type: "ackReceipt", matchId: m.id }).then((v) => {
                if (v) onExit();
              })
            }
          ),
          view === "ratings" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("nav", { className: "or-tabs", "aria-label": "\u30E9\u30F3\u30AD\u30F3\u30B0\u306E\u96E3\u6613\u5EA6" }, ["easy", "normal"].map((d) => /* @__PURE__ */ React.createElement(
            "button",
            {
              key: d,
              "aria-pressed": tab === d,
              onClick: () => setTab(d)
            },
            label(d)
          ))), /* @__PURE__ */ React.createElement("section", { className: "or-self", "aria-label": "\u81EA\u5206\u306E\u30EC\u30FC\u30C6\u30A3\u30F3\u30B0" }, /* @__PURE__ */ React.createElement("h3", null, label(tab), " \u30EC\u30FC\u30C6\u30A3\u30F3\u30B0"), /* @__PURE__ */ React.createElement("strong", { className: "or-rating" }, ((_c = (_b = state == null ? void 0 : state.ratings) == null ? void 0 : _b[tab]) == null ? void 0 : _c.rating) == null ? "\u8AAD\u8FBC\u4E2D" : Number(state.ratings[tab].rating).toLocaleString(
            "ja-JP",
            { maximumFractionDigits: 1 }
          )), /* @__PURE__ */ React.createElement("p", null, "\u6709\u52B9\u306A\u4EBA\u9593\u5BFE\u6226 ", (_f = (_e = (_d = state == null ? void 0 : state.ratings) == null ? void 0 : _d[tab]) == null ? void 0 : _e.games) != null ? _f : 0, "\u6226"), !!((_i = (_h = (_g = state == null ? void 0 : state.ratings) == null ? void 0 : _g[tab]) == null ? void 0 : _h.ghost) == null ? void 0 : _i.games) && /* @__PURE__ */ React.createElement("p", null, "\u30B4\u30FC\u30B9\u30C8\u30FBBOT\uFF1A", state.ratings[tab].ghost.games, "\u6226"), /* @__PURE__ */ React.createElement("p", null, ((_j = state == null ? void 0 : state.ranks) == null ? void 0 : _j[tab]) ? `\u81EA\u5206\u306E\u9806\u4F4D\uFF1A${state.ranks[tab]}\u4F4D` : "\u81EA\u5206\u306E\u9806\u4F4D\uFF1A\u672A\u63B2\u8F09")), /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement("h3", null, label(tab), "\u30E9\u30F3\u30AD\u30F3\u30B0"), /* @__PURE__ */ React.createElement("p", { className: "or-rule" }, tab === "easy" ? "\u63B2\u8F09\u6761\u4EF6\uFF1AEASY\u30EC\u30FC\u30C6\u30A3\u30F3\u30B01501\u4EE5\u4E0A\uFF08\u5BFE\u6226\u6570\u4E0D\u554F\uFF09" : "\u63B2\u8F09\u6761\u4EF6\uFF1ANORMAL\u306E\u6709\u52B9\u306A\u4EBA\u9593\u5BFE\u62263\u6226\u4EE5\u4E0A"), !state ? /* @__PURE__ */ React.createElement("p", null, "\u8AAD\u307F\u8FBC\u307F\u4E2D\u2026") : !((_l = (_k = state.rankings) == null ? void 0 : _k[tab]) == null ? void 0 : _l.length) ? /* @__PURE__ */ React.createElement("p", null, "\u63B2\u8F09\u6761\u4EF6\u3092\u6E80\u305F\u3059\u30D7\u30EC\u30A4\u30E4\u30FC\u306F\u307E\u3060\u3044\u307E\u305B\u3093") : /* @__PURE__ */ React.createElement("ol", { className: "or-ranking" }, state.rankings[tab].map((r) => {
            var _a2, _b2, _c2, _d2;
            return /* @__PURE__ */ React.createElement("li", { key: r.key }, /* @__PURE__ */ React.createElement("span", null, r.rank, "\u4F4D"), /* @__PURE__ */ React.createElement("div", { className: "or-player" }, /* @__PURE__ */ React.createElement(
              "button",
              {
                className: "or-name",
                onClick: () => setSelectedPlayer(r)
              },
              r.name
            ), titles[r.title] ? /* @__PURE__ */ React.createElement("small", null, titles[r.title]) : H.Nick && /* @__PURE__ */ React.createElement(H.Nick, { id: (_b2 = (_a2 = r.cosmetics) == null ? void 0 : _a2.stats) == null ? void 0 : _b2.nick, block: true }), H.BadgeIcons && /* @__PURE__ */ React.createElement(
              H.BadgeIcons,
              {
                st: ((_c2 = r.cosmetics) == null ? void 0 : _c2.stats) || {},
                max: 4
              }
            )), /* @__PURE__ */ React.createElement("strong", null, Number(r.rating).toLocaleString("ja-JP", {
              maximumFractionDigits: 1
            })), /* @__PURE__ */ React.createElement(
              "div",
              {
                className: "or-record",
                "aria-label": `${r.name}\u306E${label(tab)}\u6226\u7E3E`
              },
              /* @__PURE__ */ React.createElement("span", null, "\u4EBA\u9593\u5BFE\u6226 ", r.statsKnown ? r.games : "\u2015", "\u6226"),
              /* @__PURE__ */ React.createElement("span", null, "\u52DD\u5229 ", r.statsKnown ? r.w : "\u2015"),
              /* @__PURE__ */ React.createElement("span", null, "\u6557\u5317 ", r.statsKnown ? r.l : "\u2015"),
              /* @__PURE__ */ React.createElement("span", null, "\u52DD\u7387", " ", r.statsKnown && r.games ? `${Math.round(r.w / r.games * 100)}%` : "\u2015"),
              !!((_d2 = r.ghost) == null ? void 0 : _d2.games) && /* @__PURE__ */ React.createElement("small", null, "\u4E71\u5165\u5BFE\u6226\uFF1A", r.ghost.games, "\u6226\u30FB", r.ghost.w, "\u52DD", " ", r.ghost.l, "\u6557\uFF08\u4EBA\u9593\u6226\u7E3E\u3068\u306F\u5225\u96C6\u8A08\uFF09"),
              !r.statsKnown && /* @__PURE__ */ React.createElement("small", null, "\u65E7\u30EC\u30FC\u30C8\u3092\u5F15\u304D\u7D99\u3044\u3060\u8A18\u9332\u3067\u3059\u3002\u96E3\u6613\u5EA6\u5225\u306E\u6226\u7E3E\u306F\u672A\u8A18\u9332\u3002")
            ));
          }))), !!Object.keys((state == null ? void 0 : state.badges) || {}).length && /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement("h3", null, "\u7372\u5F97\u3057\u305F\u79F0\u53F7"), /* @__PURE__ */ React.createElement("div", { className: "or-titles" }, Object.keys(state.badges).filter((k) => state.badges[k]).map((k) => /* @__PURE__ */ React.createElement(
            "button",
            {
              key: k,
              disabled: busy,
              onClick: () => send({ type: "equipTitle", title: k })
            },
            titles[k],
            "\u3092\u88C5\u5099"
          ))))),
          selectedPlayer && H.PlayerProfile && /* @__PURE__ */ React.createElement(
            H.PlayerProfile,
            {
              name: selectedPlayer.name,
              st: ((_m = selectedPlayer.cosmetics) == null ? void 0 : _m.stats) || {},
              acctKey: selectedPlayer.key,
              me: selectedPlayer.key === acct.key,
              nameOf: () => "",
              hideLegacyRating: true,
              onClose: () => setSelectedPlayer(null)
            }
          )
        );
      }
      return { App, Result };
    };
  })(window);
})();
