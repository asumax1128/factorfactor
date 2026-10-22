(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  (function(root) {
    root.OnlineRatedFactory = function(H) {
      const { useState, useRef, useEffect, useMemo, useCallback } = React;
      const trace = (kind, detail) => {
        var _a, _b;
        return (_b = (_a = root.OnlineSpark) == null ? void 0 : _a.performance) == null ? void 0 : _b.mark(kind, detail);
      };
      const label = (d) => {
        var _a;
        return ((_a = H.DIFFICULTY_CONFIG[d]) == null ? void 0 : _a.label) || d;
      };
      const formatRating = H.RatingDisplay.format;
      const titleValid = (id) => {
        var _a, _b;
        return !!(((_a = H.nickOf) == null ? void 0 : _a.call(H, id)) || ((_b = root.TitleLabelsNext) == null ? void 0 : _b.of(id)));
      };
      const rowTitle = (r, titles2) => {
        var _a, _b, _c, _d;
        const D = root.TitleDisplayNext;
        if (!D)
          return titles2[r.title] ? /* @__PURE__ */ React.createElement("small", null, titles2[r.title]) : H.Nick && /* @__PURE__ */ React.createElement(H.Nick, { id: (_b = (_a = r.cosmetics) == null ? void 0 : _a.stats) == null ? void 0 : _b.nick, block: true });
        const d = D.resolve({ nick: (_d = (_c = r.cosmetics) == null ? void 0 : _c.stats) == null ? void 0 : _d.nick, title: r.title }, { valid: titleValid });
        if (d.state === "nick") return H.Nick && /* @__PURE__ */ React.createElement(H.Nick, { id: d.id, block: true });
        if (d.state === "compat") return titles2[d.id] ? /* @__PURE__ */ React.createElement("small", null, titles2[d.id]) : H.Nick && /* @__PURE__ */ React.createElement(H.Nick, { id: d.id, block: true });
        return null;
      };
      const legacyTitles = {
        easy_adept: "\u30A4\u30FC\u30B8\u30FC\u306E\u9054\u4EBA",
        easy_master: "\u30A4\u30FC\u30B8\u30FC\u30DE\u30B9\u30BF\u30FC",
        normal_adept: "\u30CE\u30FC\u30DE\u30EB\u306E\u9054\u4EBA",
        normal_master: "\u30CE\u30FC\u30DE\u30EB\u30DE\u30B9\u30BF\u30FC",
        dual_master: "\u53CC\u74A7\u306E\u30DE\u30B9\u30BF\u30FC",
        hyper_slayer: "\u8D85\u5F71\u306E\u5F81\u670D\u8005",
        ghost_up1: "\u683C\u4E0A\u306E\u5F71\u3092\u7834\u308B\u8005",
        ghost_up2: "\u4E8C\u968E\u7D1A\u306E\u5F71\u3092\u8D85\u3048\u308B\u8005"
      };
      const titles = Object.fromEntries(
        Object.entries(legacyTitles).map(([k, v]) => {
          var _a, _b;
          return [k, ((_b = (_a = root.TitleLabelsNext) == null ? void 0 : _a.of(k)) == null ? void 0 : _b.label) || v];
        })
      );
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
        feedback,
        extraControls
      }) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m;
        const tiles = useMemo(
          () => g.tiles,
          [g.question, JSON.stringify(g.tiles)]
        );
        if (!H2.BattleSurface || !H2.HpBar || !Array.isArray(tiles) || !g.poly)
          throw Error("BATTLE_INITIALIZATION_FAILED");
        const self = g.live[m.selfUid], opponent = (_a = Object.entries(g.live).find(
          ([uid]) => uid !== m.selfUid
        )) == null ? void 0 : _a[1];
        const frozen = g.rules === "b2" && time < g.freezeUntil;
        const counting = time < (m.gameStartAt || g.startAt), ready = !!g.resolving || time < Math.max(g.startAt, g.readyAt || 0);
        const boardHidden = counting || frozen || ready || !!g.result;
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
        useEffect(() => {
          if (!disabled && !boardHidden)
            trace("input-ready", { match: m.id, question: g.question });
        }, [disabled, boardHidden, g.question]);
        useEffect(() => {
          if (counting)
            trace("countdown-display", {
              match: m.id,
              plannedAt: (m.gameStartAt || g.startAt) - 3800,
              actualAt: Date.now() + (H2.FB.off || 0)
            });
        }, [counting, m.id]);
        const [iceBreak, setIceBreak] = useState(false), previousFreeze = useRef(false);
        useEffect(() => {
          const was = previousFreeze.current;
          previousFreeze.current = frozen;
          if (was && !frozen) {
            setIceBreak(true);
            const t = setTimeout(() => setIceBreak(false), 450);
            return () => clearTimeout(t);
          }
        }, [frozen]);
        const N = H2.DIFFICULTY_CONFIG[m.difficulty].clearCount;
        const selfName = ((_e = (_d = m.members) == null ? void 0 : _d.find((x) => x.uid === m.selfUid)) == null ? void 0 : _e.name) || "\u3042\u306A\u305F";
        return /* @__PURE__ */ React.createElement(H2.BattleSurface, { frame: true }, /* @__PURE__ */ React.createElement(
          "div",
          {
            className: "v7-play or-battle",
            "data-online-mode": m.mode,
            "data-online-ready": !disabled && !counting && !frozen && !ready && !g.result
          },
          /* @__PURE__ */ React.createElement("div", { className: "v7-zone" }, /* @__PURE__ */ React.createElement("div", { className: "or-game-header pf-bar" }, /* @__PURE__ */ React.createElement("div", { className: "or-game-controls pf-ctl" }, /* @__PURE__ */ React.createElement(
            "button",
            {
              className: "v7-bar-btn pf-exit",
              onClick: onLeave,
              disabled
            },
            "\u2715 \u9000\u51FA"
          ), /* @__PURE__ */ React.createElement(
            "button",
            {
              className: "v7-bar-btn pf-mute",
              "aria-label": muted ? "\u97F3\u3092\u51FA\u3059" : "\u6D88\u97F3",
              onClick: () => setMuted(!muted)
            },
            muted ? "\u{1F507}" : "\u{1F50A}"
          )), /* @__PURE__ */ React.createElement("span", { className: "v7-chip pf-chip" }, m.mode === "A" ? "\u65E9\u3044\u8005\u52DD\u3061" : "\u30EC\u30FC\u30B9\uFF0B\u653B\u6483", " \u30FB", " ", label(m.difficulty))), /* @__PURE__ */ React.createElement("div", { className: "pf-versus" }, /* @__PURE__ */ React.createElement("div", { className: "pf-self" }, /* @__PURE__ */ React.createElement("b", { className: "pf-name" }, selfName), m.mode === "B" ? /* @__PURE__ */ React.createElement("div", { "data-online-self": "1", style: { position: "relative" } }, /* @__PURE__ */ React.createElement(H2.HpBar, { v7: true, hp: (_f = self == null ? void 0 : self.hp) != null ? _f : 100, height: 22 }), (self == null ? void 0 : self.shield) && /* @__PURE__ */ React.createElement("span", { className: "or-shield-status" }, "\u{1F6E1} \u9632\u5FA1\u4E2D")) : /* @__PURE__ */ React.createElement("small", null, score, "\u70B9")), /* @__PURE__ */ React.createElement("div", { className: "v7-wnd or-opponent", "data-online-opponent": "1" }, /* @__PURE__ */ React.createElement("b", null, ((_g = m.opponent) == null ? void 0 : _g.name) || ((_i = (_h = m.members) == null ? void 0 : _h.find((x) => x.uid !== m.selfUid)) == null ? void 0 : _i.name) || "\u76F8\u624B"), /* @__PURE__ */ React.createElement("small", null, typeof opponent === "number" ? opponent + "\u70B9" : `HP ${(_k = (_j = opponent == null ? void 0 : opponent.hp) == null ? void 0 : _j.toFixed(1)) != null ? _k : 100}% \u30FB ${(opponent == null ? void 0 : opponent.score) || 0}\u70B9`), m.mode === "B" && /* @__PURE__ */ React.createElement(H2.HpBar, { v7: true, hp: (_l = opponent == null ? void 0 : opponent.hp) != null ? _l : 100, height: 8, label: false }))), /* @__PURE__ */ React.createElement("div", { className: "or-stat-grid" }, H2.v7Stat(
            m.mode === "A" ? "\u3042\u306A\u305F" : "SCORE",
            score,
            "#7FD8FF"
          ), H2.v7Stat(
            m.mode === "A" ? "\u76F8\u624B" : "SOLVED",
            m.mode === "A" ? opponent || 0 : g.rules === "b2" ? `${(self == null ? void 0 : self.c) || 0}\u554F` : `${(self == null ? void 0 : self.c) || 0}/${N}`,
            "#FFB59C"
          ), H2.v7Stat("COMBO", combo)), /* @__PURE__ */ React.createElement("div", { className: "or-progress", "aria-label": "\u5BFE\u6226\u306E\u9032\u884C" }, Array.from({ length: g.rules === "b2" ? 20 : N }, (_, i) => /* @__PURE__ */ React.createElement(
            "i",
            {
              key: i,
              style: {
                background: i < (g.rules === "b2" ? Math.max(0, Math.min(20, 20 * (time - m.gameStartAt) / (g.endAt - m.gameStartAt))) : m.mode === "A" ? Number(g.question) : (self == null ? void 0 : self.c) || 0) ? "#7FD8FF" : i === (m.mode === "A" ? Number(g.question) : (self == null ? void 0 : self.c) || 0) ? "#FFD54A" : "#24336E"
              }
            }
          ))), m.mode === "B" && g.rules !== "b2" && !m.daily && /* @__PURE__ */ React.createElement("div", { className: "or-special" }, /* @__PURE__ */ React.createElement("span", null, "\u5FC5\u6BBA ", (self == null ? void 0 : self.sp) || 0, "/", H2.SP_MAX), Object.entries(H2.SP_INFO).map(([kind, info]) => /* @__PURE__ */ React.createElement(
            "button",
            {
              key: kind,
              "data-sp": kind,
              disabled: disabled || ready || ((self == null ? void 0 : self.sp) || 0) < H2.SP_MAX,
              onClick: () => onSpecial(kind)
            },
            info.label
          ))), extraControls),
          /* @__PURE__ */ React.createElement("div", { className: "v7-main", inert: counting || frozen ? "" : void 0, "aria-hidden": counting || frozen || void 0 }, /* @__PURE__ */ React.createElement("div", { className: "or-feedback", "aria-live": "polite" }, /* @__PURE__ */ React.createElement(
            H2.TimingJudgment,
            {
              judge: feedback == null ? void 0 : feedback.judge,
              className: "or-timing"
            }
          ), /* @__PURE__ */ React.createElement(H2.ComboDisplay, { combo })), !boardHidden && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "relative", style: { flexShrink: 0 } }, /* @__PURE__ */ React.createElement(
            H2.TargetCard,
            {
              poly: g.poly,
              level: g.level,
              qLabel: `\u554F${m.mode === "A" ? Number(g.question) + 1 : ((self == null ? void 0 : self.c) || 0) + 1}${g.rules === "b2" ? "" : "/" + N}`,
              gaugeKey: g.question + ":" + g.startAt,
              gaugeMs: Math.max(1, g.timeoutMs - (time - g.startAt)),
              noCaption: true,
              v7: true
            }
          )), /* @__PURE__ */ React.createElement(
            H2.BattleBoard,
            {
              flash: feedback == null ? void 0 : feedback.flash,
              tiles,
              onMatch,
              disabled: disabled || counting || frozen || ready || !!g.result,
              dim: ready,
              v7: true
            }
          )), /* @__PURE__ */ React.createElement("p", { className: "v7-hint" }, m.mode === "A" ? "\u5148\u306B\u6B63\u89E3\u3057\u305F\u4EBA\u3060\u3051\u5F97\u70B9 \u30FB \u307E\u3061\u304C\u3048\u308B\u30682\u79D2\u304A\u624B\u3064\u304D" : m.daily ? "\u6700\u5F8C\u307E\u3067\u5B8C\u8D70\u3067\u30AF\u30EA\u30A2 \u30FB \u8AA4\u7B54\u304C\u3042\u3063\u3066\u3082\u7D9A\u3051\u3089\u308C\u307E\u3059" : "\u30B3\u30F3\u30DC\u3067\u653B\u6483 \u30FB \u30B2\u30FC\u30B8\u6E80\u30BF\u30F3\u3067\u5FC5\u6BBA\u6280")),
          g.rules === "b2" && /* @__PURE__ */ React.createElement("div", { className: "or-b2-status" }, "\u5FC5\u6BBA\u30B2\u30FC\u30B8 ", (self == null ? void 0 : self.gauge) || 0, "% \u30FB \u304A\u90AA\u9B54 ", ((_m = self == null ? void 0 : self.cur) == null ? void 0 : _m.oj) || 0, "\u679A \u30FB \u30AB\u30A6\u30F3\u30BF\u30FC ", (self == null ? void 0 : self.pending) ? Math.max(0, (self.counterUntil - time) / 1e3).toFixed(1) + "\u79D2" : "\u2015"),
          iceBreak && /* @__PURE__ */ React.createElement("div", { className: "or-ice-break", "aria-hidden": "true" }, [0, 1, 2, 3, 4, 5, 6, 7].map((i) => /* @__PURE__ */ React.createElement("i", { key: i, style: { left: i % 4 * 25 + "%", top: Math.floor(i / 4) * 50 + "%", "--ice-x": (i % 2 ? 1 : -1) * 120 + "px" } }))),
          frozen && /* @__PURE__ */ React.createElement("div", { className: "or-freeze", "aria-label": "FREEZE\u4E2D" }, /* @__PURE__ */ React.createElement("strong", null, "FREEZE!"), /* @__PURE__ */ React.createElement("b", null, Math.ceil((g.freezeUntil - time) / 1e3))),
          counting && /* @__PURE__ */ React.createElement("div", { className: "or-countdown", "aria-label": "\u958B\u59CB\u30AB\u30A6\u30F3\u30C8\u30C0\u30A6\u30F3" }, (m.gameStartAt || g.startAt) - time > 3e3 ? "READY" : Math.max(
            1,
            Math.ceil(((m.gameStartAt || g.startAt) - time) / 1e3)
          )),
          !counting && time < (m.gameStartAt || g.startAt) + 550 && /* @__PURE__ */ React.createElement("div", { className: "or-countdown", style: { background: "transparent", pointerEvents: "none" }, "aria-label": "\u5BFE\u6226\u958B\u59CB" }, "GO!")
        ));
      }
      function ResultLegacy({ H: H2, m, state, acct, titles: titles2, badgesBefore, busy, onExit }) {
        var _a, _b, _c, _d;
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
          /* @__PURE__ */ React.createElement("strong", { className: "or-delta" }, "\u30EC\u30FC\u30C8 ", Math.round((_c = r == null ? void 0 : r.delta) != null ? _c : 0) > 0 ? "+" : "", formatRating((_d = r == null ? void 0 : r.delta) != null ? _d : 0)),
          /* @__PURE__ */ React.createElement("p", null, formatRating(r == null ? void 0 : r.before), " \u2192 ", formatRating(r == null ? void 0 : r.after)),
          /* @__PURE__ */ React.createElement("p", null, m.selfPractice ? "\u81EA\u5206\u306E\u30B4\u30FC\u30B9\u30C8\u3068\u306E\u7DF4\u7FD2\uFF1A\u30EC\u30FC\u30C8\u30FB\u52DD\u6557\u30FBEXP\u30FB\u79F0\u53F7\u30FB\u5B66\u7FD2\u8A18\u9332\u306F\u66F4\u65B0\u3057\u307E\u305B\u3093" : ["bounty", "profile"].includes(m.origin) ? "\u6307\u540D\u6226\uFF1A\u516C\u5F0F\u30EC\u30FC\u30C8\u30FB\u5BFE\u6226\u6570\u306F\u5909\u66F4\u3057\u307E\u305B\u3093" : `${label(m.difficulty)}\u306E\u307F\u66F4\u65B0${m.opponent ? "\uFF08\u5909\u52D5\u306F\u4EBA\u9593\u6226\u306E1/3\uFF09" : ""}`),
          m.opponent && /* @__PURE__ */ React.createElement("div", { className: "or-exp" }, "\u7372\u5F97EXP ", /* @__PURE__ */ React.createElement("b", null, "+", m.exp || 0)),
          m.rules === "b2" && root.NextResults && /* @__PURE__ */ React.createElement(root.NextResults.BDetails, { report: m.bResult, me: m.selfUid, names: Object.fromEntries((m.members || []).map((u) => {
            var _a2;
            return [u.uid, u.uid === "_ghost" ? (_a2 = m.opponent) == null ? void 0 : _a2.name : u.name];
          })) }),
          m.mode === "A" && /* @__PURE__ */ React.createElement(H2.AResultDetails, { report: m.aResult, me: m.selfUid, names: Object.fromEntries((m.members || []).map((u) => {
            var _a2;
            return [u.uid, u.uid === "_ghost" ? (_a2 = m.opponent) == null ? void 0 : _a2.name : u.name];
          })) }),
          badges.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "or-new-title", "data-new-title": "1" }, "\u2728 \u65B0\u3057\u3044\u79F0\u53F7\uFF01", badges.map((k) => /* @__PURE__ */ React.createElement("p", { key: k }, titles2[k]))),
          /* @__PURE__ */ React.createElement("button", { disabled: busy, className: "or-primary", onClick: onExit }, ["bounty", "profile"].includes(m.origin) ? "\u4E00\u89A7\u3078\u623B\u308B" : "\u30AA\u30F3\u30E9\u30A4\u30F3\u30E1\u30CB\u30E5\u30FC\u3078\u623B\u308B")
        );
      }
      function Result(props) {
        var _a, _b, _c, _d;
        const { H: H2, m, state, acct, titles: titles2, badgesBefore, busy, onExit } = props;
        const NR = root.NextResults;
        if (!(NR && NR.ResultActions && NR.BattleSummary && NR.MinimalSummary && NR.TitleReveal)) return /* @__PURE__ */ React.createElement(ResultLegacy, { ...props });
        const won = m.outcome === "win", r = (_b = (_a = m.receipt) == null ? void 0 : _a.players) == null ? void 0 : _b[acct.key];
        const newTitles = Object.keys(state.badges || {}).filter((k) => !badgesBefore[k] && titles2[k]);
        useEffect(() => {
          if (won) H2.CombatFX.victory();
          return () => H2.CombatFX.cancel();
        }, [m.id]);
        const names = useMemo(() => Object.fromEntries((m.members || []).map((u) => {
          var _a2;
          return [u.uid, u.uid === "_ghost" ? (_a2 = m.opponent) == null ? void 0 : _a2.name : u.name];
        })), [m.id]);
        const model = useMemo(() => {
          if (!m.members || !m.selfUid || !(m.mode === "A" || m.rules === "b2")) return null;
          try {
            return NR.ResultModel.build({
              kind: m.mode === "A" ? "A" : "B",
              me: m.selfUid,
              ids: m.members.map((u) => u.uid),
              names,
              outcome: { win: "w", draw: "d", lose: "l" }[m.outcome] || "l",
              reasonText: "",
              A: m.mode === "A" ? { report: m.aResult } : void 0,
              B: m.mode !== "A" ? { game: m.game, trace: m.bResult } : void 0
            });
          } catch (e) {
            return null;
          }
        }, [m.id, m.outcome]);
        const note = m.selfPractice ? "\u81EA\u5206\u306E\u30B4\u30FC\u30B9\u30C8\u3068\u306E\u7DF4\u7FD2\uFF1A\u30EC\u30FC\u30C8\u30FB\u52DD\u6557\u30FBEXP\u30FB\u79F0\u53F7\u30FB\u5B66\u7FD2\u8A18\u9332\u306F\u66F4\u65B0\u3057\u307E\u305B\u3093" : ["bounty", "profile"].includes(m.origin) ? "\u6307\u540D\u6226\uFF1A\u516C\u5F0F\u30EC\u30FC\u30C8\u30FB\u5BFE\u6226\u6570\u306F\u5909\u66F4\u3057\u307E\u305B\u3093" : `${label(m.difficulty)}\u306E\u307F\u66F4\u65B0${m.opponent ? "\uFF08\u5909\u52D5\u306F\u4EBA\u9593\u6226\u306E1/3\uFF09" : ""}`;
        const reveal = /* @__PURE__ */ React.createElement(
          NR.TitleReveal,
          {
            titles: newTitles.map((k) => {
              var _a2, _b2;
              return { id: k, icon: ((_b2 = (_a2 = H2.nickOf) == null ? void 0 : _a2.call(H2, k)) == null ? void 0 : _b2.icon) || "\u{1F3C5}", label: titles2[k] };
            }),
            revealKey: `${acct.key}:${m.id}`,
            fx: { sound: () => {
              var _a2;
              return (_a2 = H2.fxSound) == null ? void 0 : _a2.call(H2, "badge");
            }, confetti: () => {
              var _a2, _b2;
              return (_b2 = (_a2 = H2.FX) == null ? void 0 : _a2.confetti) == null ? void 0 : _b2.call(_a2, 30);
            } }
          }
        );
        const growth = /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "rs-rate" }, /* @__PURE__ */ React.createElement("strong", { className: "or-delta" }, "\u30EC\u30FC\u30C8 ", Math.round((_c = r == null ? void 0 : r.delta) != null ? _c : 0) > 0 ? "+" : "", formatRating((_d = r == null ? void 0 : r.delta) != null ? _d : 0)), /* @__PURE__ */ React.createElement("p", null, formatRating(r == null ? void 0 : r.before), " \u2192 ", formatRating(r == null ? void 0 : r.after)), m.opponent && /* @__PURE__ */ React.createElement("div", { className: "or-exp" }, "\u7372\u5F97EXP ", /* @__PURE__ */ React.createElement("b", null, "+", m.exp || 0))), reveal);
        const notes = /* @__PURE__ */ React.createElement("p", { className: "rs-origin" }, note);
        const outcome = { win: "w", draw: "d", lose: "l" }[m.outcome] || "l";
        return /* @__PURE__ */ React.createElement("section", { className: `or-result rs-rated ${won ? "or-victory" : "or-defeat"}`, "data-result-kind": m.outcome }, won && /* @__PURE__ */ React.createElement("div", { className: "or-victory-rays", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement(NR.ResultShell, { kind: "R", outcome: m.outcome, busy }, model ? /* @__PURE__ */ React.createElement(NR.BattleSummary, { model, notes, growth }) : /* @__PURE__ */ React.createElement(NR.MinimalSummary, { outcome: m.outcome, methodLabel: m.mode === "A" ? "A\u65B9\u5F0F" : m.mode === "B" ? "B\u65B9\u5F0F" : "\u30E9\u30F3\u30C0\u30E0\u5BFE\u6226", notes, growth }), m.rules === "b2" && /* @__PURE__ */ React.createElement(NR.BDetails, { report: m.bResult, me: m.selfUid, names }), m.mode === "A" && /* @__PURE__ */ React.createElement(H2.AResultDetails, { report: m.aResult, me: m.selfUid, names }), /* @__PURE__ */ React.createElement(NR.ResultActions, { busy }, /* @__PURE__ */ React.createElement(NR.ResultButton, { tone: "primary", disabled: busy, onClick: onExit }, ["bounty", "profile"].includes(m.origin) ? "\u4E00\u89A7\u3078\u623B\u308B" : "\u30AA\u30F3\u30E9\u30A4\u30F3\u30E1\u30CB\u30E5\u30FC\u3078\u623B\u308B"))));
      }
      function App({ acct, onExit, view = "match", initialGhost = null, rankingMode = false, startHyper = false, autoGhost = null }) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o;
        const [state, setState] = useState(null), [error, setError] = useState(""), [feedback, setFeedback] = useState(null), [screen, setScreen] = useState(
          view === "ratings" ? "ratings" : "select"
        ), [tab, setTab] = useState("easy"), [hyperChoice, setHyperChoice] = useState(!!startHyper), [busy, setBusy] = useState(false), [selectedPlayer, setSelectedPlayer] = useState(null), [rankEquip, setRankEquip] = useState(null), [muted, setMuted] = H.useGameMute();
        const current = useRef(null), inFlight = useRef(false), seq = useRef(0), life = useRef(true), retry = useRef(null), requestRef = useRef(null), requests = useRef(Promise.resolve()), actionPending = useRef(false), pollingPaused = useRef(false), feedbackTimer = useRef(null), searchDiffRef = useRef(null), badgesBefore = useRef(null), initializing = useRef(true);
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
          var _a2, _b2, _c2, _d2, _e2, _f2;
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
            const old = (_a2 = current.current) == null ? void 0 : _a2.match, next = v.match;
            if (root.OnlineSpark.olderView(old, next)) return current.current;
            setState(v);
            current.current = v;
            if ((_b2 = v.match) == null ? void 0 : _b2.game) seq.current = v.match.game.acceptedSeq;
            if (view === "ratings") setScreen("ratings");
            else if (((_c2 = v.match) == null ? void 0 : _c2.phase) === "settled")
              setScreen(
                initializing.current && !initialGhost ? "select" : "result"
              );
            else if (((_d2 = v.match) == null ? void 0 : _d2.phase) === "cancelled") {
              setScreen("select");
              setError("\u5BFE\u6226\u958B\u59CB\u524D\u306B\u76F8\u624B\u304C\u9000\u51FA\u3057\u307E\u3057\u305F");
            } else if (v.match) setScreen(v.match.phase);
            else if (v.ticket) setScreen("wait");
            else setScreen(view === "ghosts" ? "ghostMenu" : "select");
            return v;
          } catch (e) {
            if (life.current) {
              if (["STALE_QUESTION", "SEQUENCE_GAP", "FROZEN"].includes(e.message)) {
                retry.current = {
                  type: "status",
                  matchId: (_f2 = (_e2 = current.current) == null ? void 0 : _e2.match) == null ? void 0 : _f2.id
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
        const equipFromRanking = async (k) => {
          if ((rankEquip == null ? void 0 : rankEquip.state) === "saving") return;
          const unified = !!(H.equipNick && (acct == null ? void 0 : acct.key) && titleValid(k));
          setRankEquip({ id: k, state: "saving", message: "\u4FDD\u5B58\u4E2D\u2026" });
          const slow = setTimeout(
            () => setRankEquip((s) => s && s.id === k && s.state === "saving" ? { ...s, message: "\u4FDD\u5B58\u4E2D\u2026\uFF08\u901A\u4FE1\u304C\u9045\u308C\u3066\u3044\u307E\u3059\u3002\u305D\u306E\u307E\u307E\u304A\u5F85\u3061\u304F\u3060\u3055\u3044\uFF09" } : s),
            6e3
          );
          try {
            if (unified) {
              try {
                await H.equipNick(acct.key, k);
              } catch (e) {
                setRankEquip({ id: k, state: "failed", message: "\u4FDD\u5B58\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u901A\u4FE1\u72B6\u614B\u3092\u3054\u78BA\u8A8D\u306E\u3046\u3048\u3001\u3082\u3046\u4E00\u5EA6\u304A\u8A66\u3057\u304F\u3060\u3055\u3044\uFF08\u88C5\u5099\u306F\u5909\u66F4\u3055\u308C\u3066\u3044\u307E\u305B\u3093\uFF09" });
                return;
              }
            }
            const v = await send({ type: "equipTitle", title: k });
            if (!life.current) return;
            if (!v) {
              retry.current = null;
              setError("");
              setRankEquip({
                id: k,
                state: "partial",
                message: unified ? "\u88C5\u5099\u67A0\u306B\u306F\u4FDD\u5B58\u3057\u307E\u3057\u305F\u304C\u3001\u5F93\u6765\u306E\u30E9\u30F3\u30AD\u30F3\u30B0\u79F0\u53F7\uFF08\u65E7\u30D0\u30FC\u30B8\u30E7\u30F3\u5411\u3051\uFF09\u306E\u4FDD\u5B58\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002\u3082\u3046\u4E00\u5EA6\u304A\u8A66\u3057\u304F\u3060\u3055\u3044\u3002" : "\u4FDD\u5B58\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u901A\u4FE1\u72B6\u614B\u3092\u3054\u78BA\u8A8D\u306E\u3046\u3048\u3001\u3082\u3046\u4E00\u5EA6\u304A\u8A66\u3057\u304F\u3060\u3055\u3044\u3002"
              });
              return;
            }
            setRankEquip({ id: k, state: "saved", message: "\u79F0\u53F7\u3092\u88C5\u5099\u3057\u307E\u3057\u305F" });
          } finally {
            clearTimeout(slow);
          }
        };
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
            if (view === "ghosts" && autoGhost && ["easy", "normal"].includes(autoGhost.difficulty) && ["ghost", "hyper"].includes(autoGhost.kind) && v && !v.match && !v.ticket && v.ghostReady) {
              if (autoGhost.kind === "hyper") setHyperChoice(true);
              await send({ type: "randomGhost", difficulty: autoGhost.difficulty, kind: autoGhost.kind });
            }
          })();
        }, []);
        useEffect(() => {
          var _a2, _b2;
          if (!["wait", "vote", "play"].includes(screen)) return;
          const id = setInterval(
            () => {
              if (retry.current || pollingPaused.current) return;
              const s = current.current, m2 = s == null ? void 0 : s.match;
              requestRef.current({
                type: "heartbeat",
                ...m2 ? { matchId: m2.id } : {}
              });
            },
            screen === "play" && ((_b2 = (_a2 = current.current) == null ? void 0 : _a2.match) == null ? void 0 : _b2.opponent) ? 100 : 1e3
          );
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
        const time = Date.now() + (H.FB.off || 0);
        const answer = useCallback((a, b) => {
          var _a2;
          trace("release");
          const m2 = (_a2 = current.current) == null ? void 0 : _a2.match, g2 = m2 == null ? void 0 : m2.game;
          if (actionPending.current || retry.current || !g2) return;
          if (Date.now() + (H.FB.off || 0) < (m2.gameStartAt || g2.startAt) || Date.now() + (H.FB.off || 0) < (g2.freezeUntil || 0)) return;
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
          const factors = [a, b].map(
            (id) => {
              var _a3;
              return (_a3 = g2.tiles.find((t) => t.id === id)) == null ? void 0 : _a3.factor;
            }
          );
          if (factors.some((f) => !f)) return;
          const ok = H.polyEqual(H.multiply(...factors), g2.poly);
          trace("local-verdict", {
            match: m2.id,
            question: g2.question,
            seq: command.seq,
            ok
          });
          const judge = H.timingVisual(
            ok ? H.getJudgment(
              Math.max(0, Date.now() + (H.FB.off || 0) - g2.startAt)
            ) : { label: "Bad", color: "#FF5C5C" }
          );
          if (ok) {
            H.CombatFX.merge(captured, judge.color);
            sound.play("ok");
          } else sound.play("buzz");
          setFeedback({
            judge,
            flash: {
              [a]: ok ? "correct" : "wrong",
              [b]: ok ? "correct" : "wrong"
            }
          });
          clearTimeout(feedbackTimer.current);
          feedbackTimer.current = setTimeout(() => setFeedback(null), 650);
          send(command);
        }, []);
        useEffect(() => {
          if (!feedback) return;
          const frame = requestAnimationFrame(() => trace("feedback-frame"));
          return () => cancelAnimationFrame(frame);
        }, [feedback]);
        useEffect(() => {
          seq.current = (g == null ? void 0 : g.acceptedSeq) || 0;
        }, [m == null ? void 0 : m.id]);
        const omScreens = ["select", "ghostMenu", "wait", "vote"], searchDiff = searchDiffRef, backLocked = ["wait", "vote"].includes(screen), myVote = ((_a = m == null ? void 0 : m.votes) == null ? void 0 : _a[m == null ? void 0 : m.selfUid]) || null, otherVoted = !!((_b = m == null ? void 0 : m.members) == null ? void 0 : _b.some(
          (x) => {
            var _a2;
            return x.uid !== m.selfUid && ((_a2 = m.votes) == null ? void 0 : _a2[x.uid]);
          }
        )), voteLeft = screen === "vote" && (m == null ? void 0 : m.voteEnd) ? Math.max(0, Math.ceil((m.voteEnd - time) / 1e3)) : null;
        return /* @__PURE__ */ React.createElement(
          "main",
          {
            className: `or-app ${screen === "play" ? "or-playing" : "or-menu"}${omScreens.includes(screen) ? " om" : ""}`,
            "data-or-screen": screen,
            "data-or-view": view
          },
          /* @__PURE__ */ React.createElement(H.FontImport, null),
          ["play", "result"].includes(screen) && /* @__PURE__ */ React.createElement(H.FxLayer, { level: 112, combat: true }),
          screen !== "play" && !(rankingMode && view === "ratings" && root.NextRanking) && /* @__PURE__ */ React.createElement("header", null, /* @__PURE__ */ React.createElement(
            "button",
            {
              "aria-describedby": backLocked ? "om-back-reason" : void 0,
              onClick: () => {
                if (backLocked) {
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
              disabled: busy || backLocked
            },
            initialGhost ? "\u4E00\u89A7\u3078\u623B\u308B" : "\u30AA\u30F3\u30E9\u30A4\u30F3\u3078\u623B\u308B"
          ), /* @__PURE__ */ React.createElement("h2", null, view === "ratings" ? "\u30AA\u30F3\u30E9\u30A4\u30F3\u30EC\u30FC\u30C6\u30A3\u30F3\u30B0" : view === "ghosts" ? "\u30B4\u30FC\u30B9\u30C8\u5BFE\u6226" : initialGhost || ["bounty", "profile"].includes(m == null ? void 0 : m.origin) ? "\u6307\u540D\u30B4\u30FC\u30B9\u30C8\u5BFE\u6226" : "\u3059\u3050\u904A\u3076"), /* @__PURE__ */ React.createElement("small", { className: "or-version" }, (_c = root.FactorVersion) == null ? void 0 : _c.label), /* @__PURE__ */ React.createElement(
            "button",
            {
              "aria-label": muted ? "\u97F3\u3092\u51FA\u3059" : "\u6D88\u97F3",
              onClick: () => setMuted(!muted)
            },
            muted ? "\u{1F507}" : "\u{1F50A}"
          ), backLocked && /* @__PURE__ */ React.createElement("p", { id: "om-back-reason", className: "om-back-reason" }, screen === "wait" ? "\u691C\u7D22\u4E2D\u306F\u623B\u308C\u307E\u305B\u3093\u3002\u300C\u691C\u7D22\u3092\u30AD\u30E3\u30F3\u30BB\u30EB\u300D\u3067\u691C\u7D22\u3092\u6B62\u3081\u3066\u304B\u3089\u623B\u3063\u3066\u304F\u3060\u3055\u3044\u3002" : "\u5BFE\u6226\u306E\u6E96\u5099\u4E2D\u306F\u623B\u308C\u307E\u305B\u3093\u3002\u300C\u958B\u59CB\u524D\u306B\u9000\u51FA\u300D\u3092\u9078\u3093\u3067\u304B\u3089\u623B\u3063\u3066\u304F\u3060\u3055\u3044\u3002")),
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
          screen === "select" && !initialGhost && view === "ghosts" && !state && /* @__PURE__ */ React.createElement("section", { className: "om-card", "data-om": "loading", role: "status" }, /* @__PURE__ */ React.createElement("h3", null, "\u30B4\u30FC\u30B9\u30C8\u5BFE\u6226\u3092\u6E96\u5099\u3057\u3066\u3044\u307E\u3059"), /* @__PURE__ */ React.createElement("p", null, "\u63A5\u7D9A\u3092\u78BA\u8A8D\u3057\u3066\u3044\u307E\u3059\u2026")),
          screen === "select" && !initialGhost && !(view === "ghosts" && !state) && /* @__PURE__ */ React.createElement("section", { className: "om-card", "data-om": "select" }, /* @__PURE__ */ React.createElement("h3", null, "\u96E3\u6613\u5EA6\u3092\u9078\u3093\u3067\u5BFE\u6226"), /* @__PURE__ */ React.createElement("p", { className: "om-lead" }, "\u76F8\u624B\u304C\u898B\u3064\u304B\u3063\u305F\u3089\u3001\u65B9\u5F0F\uFF08A\uFF0FB\uFF09\u3092\u9078\u3073\u307E\u3059\u3002"), /* @__PURE__ */ React.createElement("div", { className: "om-choices" }, ["easy", "normal"].map((d) => /* @__PURE__ */ React.createElement(
            "button",
            {
              key: d,
              className: "or-difficulty om-choice",
              style: { "--difficulty-color": H.DIFFICULTY_CONFIG[d].color },
              disabled: busy || !(acct == null ? void 0 : acct.key),
              onClick: () => {
                searchDiff.current = d;
                send({ type: "enqueue", difficulty: d });
              }
            },
            label(d),
            "\u3067\u76F8\u624B\u3092\u63A2\u3059"
          )))),
          screen === "ghostMenu" && /* @__PURE__ */ React.createElement("section", { className: "om-card", "data-om": "ghost" }, /* @__PURE__ */ React.createElement("h3", null, "\u30B4\u30FC\u30B9\u30C8\u5BFE\u6226\u3092\u9078\u3076"), !(state == null ? void 0 : state.ghostReady) && /* @__PURE__ */ React.createElement("p", { className: "om-note", role: "status" }, "\u30B4\u30FC\u30B9\u30C8\u6A5F\u80FD\u306E\u6E96\u5099\u4E2D\u3067\u3059"), !hyperChoice ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "om-choices" }, ["easy", "normal"].map((d) => /* @__PURE__ */ React.createElement("button", { key: d, className: "or-difficulty om-choice", style: { "--difficulty-color": H.DIFFICULTY_CONFIG[d].color }, disabled: busy || !(acct == null ? void 0 : acct.key) || !(state == null ? void 0 : state.ghostReady), onClick: () => send({ type: "randomGhost", difficulty: d, kind: "ghost" }) }, label(d), "\u30B4\u30FC\u30B9\u30C8")), /* @__PURE__ */ React.createElement("button", { className: "om-choice om-hyper-entry", disabled: busy || !(acct == null ? void 0 : acct.key) || !(state == null ? void 0 : state.ghostReady), onClick: () => setHyperChoice(true) }, "\u30CF\u30A4\u30D1\u30FC\u30B4\u30FC\u30B9\u30C8"))) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("p", { className: "om-lead" }, "\u5404\u96E3\u6613\u5EA6\u306E\u30E9\u30F3\u30AD\u30F3\u30B0TOP10\u304B\u3089\u62BD\u9078\u3057\u307E\u3059\u3002\u9806\u4F4D\u304C\u9AD8\u3044\u307B\u3069\u9078\u3070\u308C\u3084\u3059\u304F\u3001\u5B66\u7FD2\u8A18\u933220\u554F\u672A\u6E80\u306E\u30D7\u30EC\u30A4\u30E4\u30FC\u306F\u5019\u88DC\u306B\u5165\u308A\u307E\u305B\u3093\u3002"), /* @__PURE__ */ React.createElement("div", { className: "om-choices" }, ["easy", "normal"].map((d) => /* @__PURE__ */ React.createElement("button", { key: d, className: "or-difficulty om-choice", style: { "--difficulty-color": H.DIFFICULTY_CONFIG[d].color }, disabled: busy, onClick: () => send({ type: "randomGhost", difficulty: d, kind: "hyper" }) }, label(d), "\u30CF\u30A4\u30D1\u30FC\u30B4\u30FC\u30B9\u30C8"))), /* @__PURE__ */ React.createElement("button", { className: "om-secondary", onClick: () => setHyperChoice(false) }, "\u30B4\u30FC\u30B9\u30C8\u30E1\u30CB\u30E5\u30FC\u3078\u623B\u308B"))),
          screen === "select" && initialGhost && /* @__PURE__ */ React.createElement("section", { className: "om-card", "data-om": "direct-ghost" }, /* @__PURE__ */ React.createElement("h3", null, "\u6307\u540D\u30B4\u30FC\u30B9\u30C8\u5BFE\u6226"), /* @__PURE__ */ React.createElement("p", { className: "om-lead" }, "\u5BFE\u8C61\u30D7\u30EC\u30A4\u30E4\u30FC\u306E\u5B66\u7FD2\u8A18\u9332\u3067\u5BFE\u6226\u3057\u307E\u3059\u3002\u516C\u5F0F\u30EC\u30FC\u30C6\u30A3\u30F3\u30B0\u30FB\u4EBA\u9593\u5BFE\u6226\u6570\u306F\u5909\u66F4\u3057\u307E\u305B\u3093\u3002"), /* @__PURE__ */ React.createElement(
            "button",
            {
              className: "om-primary",
              disabled: busy,
              onClick: () => send({ type: "directGhost", ...initialGhost })
            },
            "\u6307\u540D\u5BFE\u6226\u3092\u518D\u8A66\u884C"
          )),
          screen === "wait" && /* @__PURE__ */ React.createElement("section", { className: "om-card om-wait", "data-om": "wait", role: "status", "aria-live": "polite" }, /* @__PURE__ */ React.createElement("div", { className: "or-search-icon", "aria-hidden": "true" }, "\u{1F50D}"), /* @__PURE__ */ React.createElement("h3", null, "\u5BFE\u6226\u76F8\u624B\u3092\u63A2\u3057\u3066\u3044\u307E\u3059"), searchDiff.current && /* @__PURE__ */ React.createElement("p", { className: "om-chip", style: { "--difficulty-color": H.DIFFICULTY_CONFIG[searchDiff.current].color } }, label(searchDiff.current)), /* @__PURE__ */ React.createElement("p", { className: "or-elapsed", "aria-label": "\u691C\u7D22\u7D4C\u904E\u6642\u9593" }, Math.max(
            0,
            (time - ((state == null ? void 0 : state.searchStarted) || time)) / 1e3
          ).toFixed(1), "\u79D2"), /* @__PURE__ */ React.createElement("p", { className: "om-lead" }, state.ghostReady ? "5\u79D2\u3067\u4EBA\u9593\u304C\u898B\u3064\u304B\u3089\u306A\u3051\u308C\u3070\u30B4\u30FC\u30B9\u30C8\u30FBBOT\u304C\u4E71\u5165\u3057\u307E\u3059" : "\u4EBA\u9593\u306E\u5BFE\u6226\u76F8\u624B\u3092\u63A2\u3057\u3066\u3044\u307E\u3059"), /* @__PURE__ */ React.createElement(
            "button",
            {
              className: "om-secondary",
              disabled: busy,
              onClick: () => send({ type: "cancel", ticket: state.ticket })
            },
            "\u691C\u7D22\u3092\u30AD\u30E3\u30F3\u30BB\u30EB"
          )),
          screen === "vote" && /* @__PURE__ */ React.createElement("section", { className: "om-card om-vote", "data-om": "vote" }, m.opponent && /* @__PURE__ */ React.createElement(
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
            ][m.opponent.rank], " ", "\u30FB \u30EC\u30FC\u30C8", formatRating(m.opponent.rating))
          ), /* @__PURE__ */ React.createElement("h3", null, label(m.difficulty), " \u30FB \u65B9\u5F0F\u3092\u9078\u3076"), /* @__PURE__ */ React.createElement("p", { className: "om-lead" }, "\u96E3\u6613\u5EA6\u306F\u56FA\u5B9A\u3067\u3059\u3002\u65B9\u5F0F\u304C\u5206\u304B\u308C\u305F\u5834\u5408\u30FB\u6642\u9593\u5207\u308C\u306F\u30E9\u30F3\u30C0\u30E0\u306B\u6C7A\u307E\u308A\u307E\u3059\u3002"), /* @__PURE__ */ React.createElement("div", { className: "om-status", role: "status", "aria-live": "polite" }, /* @__PURE__ */ React.createElement("span", { "data-om-vote": "self" }, "\u3042\u306A\u305F\uFF1A", myVote ? `${myVote}\u306B\u6295\u7968\u6E08\u307F` : "\u672A\u6295\u7968"), !m.opponent && /* @__PURE__ */ React.createElement("span", { "data-om-vote": "opponent" }, "\u76F8\u624B\uFF1A", otherVoted ? "\u6295\u7968\u6E08\u307F" : "\u6295\u7968\u5F85\u3061"), voteLeft !== null && /* @__PURE__ */ React.createElement("span", { "data-om-vote": "timer" }, "\u6B8B\u308A", voteLeft, "\u79D2")), /* @__PURE__ */ React.createElement("div", { className: "om-choices" }, ["A", "B"].map((mode) => /* @__PURE__ */ React.createElement("div", { className: "om-opt", key: mode, "data-selected": myVote === mode ? "true" : "false" }, /* @__PURE__ */ React.createElement(
            "button",
            {
              className: "om-choice",
              "aria-pressed": myVote === mode,
              disabled: busy,
              onClick: () => send({ type: "vote", matchId: m.id, mode })
            },
            mode === "A" ? "A\uFF1A\u65E9\u3044\u8005\u52DD\u3061" : "B\uFF1A\u30EC\u30FC\u30B9\uFF0B\u653B\u6483"
          ), myVote === mode && /* @__PURE__ */ React.createElement("span", { className: "om-mark", "aria-hidden": "true" }, "\u2714 \u6295\u7968\u6E08\u307F")))), /* @__PURE__ */ React.createElement(
            "button",
            {
              className: "om-secondary",
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
          view === "ratings" && /* @__PURE__ */ React.createElement(React.Fragment, null, rankingMode && root.NextRanking ? (() => {
            var _a2, _b2, _c2, _d2, _e2;
            const R = root.NextRanking, mine = (_a2 = state == null ? void 0 : state.ratings) == null ? void 0 : _a2[tab];
            const rows = ((_b2 = state == null ? void 0 : state.rankings) == null ? void 0 : _b2[tab]) || [];
            const status = !state ? "loading" : rows.length ? "ok" : "empty";
            return /* @__PURE__ */ React.createElement("div", { className: "rk-rating", "data-ranking": "rating" }, /* @__PURE__ */ React.createElement(R.RankingHead, { title: "\u30EC\u30FC\u30C6\u30A3\u30F3\u30B0\u30E9\u30F3\u30AD\u30F3\u30B0" }), /* @__PURE__ */ React.createElement(R.Segmented, { label: "\u30E9\u30F3\u30AD\u30F3\u30B0\u306E\u96E3\u6613\u5EA6", items: [["easy", label("easy")], ["normal", label("normal")]], value: tab, onChange: setTab }), /* @__PURE__ */ React.createElement("section", { className: "rk-selfcard", "aria-label": "\u81EA\u5206\u306E\u30EC\u30FC\u30C6\u30A3\u30F3\u30B0" }, /* @__PURE__ */ React.createElement("span", null, label(tab), " \u30EC\u30FC\u30C6\u30A3\u30F3\u30B0"), /* @__PURE__ */ React.createElement("strong", { className: "or-rating" }, (mine == null ? void 0 : mine.rating) == null ? "\u8AAD\u8FBC\u4E2D" : formatRating(mine.rating)), /* @__PURE__ */ React.createElement("p", null, "\u6709\u52B9\u306A\u4EBA\u9593\u5BFE\u6226 ", (_c2 = mine == null ? void 0 : mine.games) != null ? _c2 : 0, "\u6226", !!((_d2 = mine == null ? void 0 : mine.ghost) == null ? void 0 : _d2.games) && `\u30FB\u30B4\u30FC\u30B9\u30C8\u30FBBOT\uFF1A${mine.ghost.games}\u6226`), /* @__PURE__ */ React.createElement("p", null, ((_e2 = state == null ? void 0 : state.ranks) == null ? void 0 : _e2[tab]) ? `\u81EA\u5206\u306E\u9806\u4F4D\uFF1A${state.ranks[tab]}\u4F4D` : "\u81EA\u5206\u306E\u9806\u4F4D\uFF1A\u672A\u63B2\u8F09")), /* @__PURE__ */ React.createElement("p", { className: "rk-foot" }, label(tab), "\u30E9\u30F3\u30AD\u30F3\u30B0 \uFF0F ", tab === "easy" ? "\u63B2\u8F09\u6761\u4EF6\uFF1A\u30A4\u30FC\u30B8\u30FC\u30EC\u30FC\u30C6\u30A3\u30F3\u30B01501\u4EE5\u4E0A\uFF08\u5BFE\u6226\u6570\u4E0D\u554F\uFF09" : "\u63B2\u8F09\u6761\u4EF6\uFF1A\u30CE\u30FC\u30DE\u30EB\u306E\u6709\u52B9\u306A\u4EBA\u9593\u5BFE\u62263\u6226\u4EE5\u4E0A"), /* @__PURE__ */ React.createElement(R.ListState, { status, message: status === "loading" ? "\u8AAD\u307F\u8FBC\u307F\u4E2D\u2026" : "\u63B2\u8F09\u6761\u4EF6\u3092\u6E80\u305F\u3059\u30D7\u30EC\u30A4\u30E4\u30FC\u306F\u307E\u3060\u3044\u307E\u305B\u3093" }), status === "ok" && /* @__PURE__ */ React.createElement(R.RankList, { label: label(tab) + "\u30E9\u30F3\u30AD\u30F3\u30B0" }, rows.map((r) => {
              var _a3, _b3;
              return /* @__PURE__ */ React.createElement(
                R.RankRow,
                {
                  key: r.key,
                  rank: r.rank,
                  name: r.name,
                  onName: () => setSelectedPlayer(r),
                  self: !!(acct == null ? void 0 : acct.key) && r.key === acct.key,
                  value: formatRating(r.rating),
                  extra: /* @__PURE__ */ React.createElement(React.Fragment, null, rowTitle(r, titles), H.BadgeIcons && /* @__PURE__ */ React.createElement(H.BadgeIcons, { st: ((_a3 = r.cosmetics) == null ? void 0 : _a3.stats) || {}, max: 4 })),
                  sub: `\u4EBA\u9593\u5BFE\u6226 ${r.statsKnown ? r.games : "\u2015"}\u6226\u30FB\u52DD\u5229 ${r.statsKnown ? r.w : "\u2015"}\u30FB\u6557\u5317 ${r.statsKnown ? r.l : "\u2015"}\u30FB\u52DD\u7387 ${r.statsKnown && r.games ? `${Math.round(r.w / r.games * 100)}%` : "\u2015"}` + (((_b3 = r.ghost) == null ? void 0 : _b3.games) ? `\u3000\u4E71\u5165\u5BFE\u6226\uFF1A${r.ghost.games}\u6226\u30FB${r.ghost.w}\u52DD ${r.ghost.l}\u6557\uFF08\u4EBA\u9593\u6226\u7E3E\u3068\u306F\u5225\u96C6\u8A08\uFF09` : "") + (!r.statsKnown ? "\u3000\u65E7\u30EC\u30FC\u30C8\u3092\u5F15\u304D\u7D99\u3044\u3060\u8A18\u9332\u3067\u3059\u3002\u96E3\u6613\u5EA6\u5225\u306E\u6226\u7E3E\u306F\u672A\u8A18\u9332\u3002" : "")
                }
              );
            })));
          })() : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("nav", { className: "or-tabs", "aria-label": "\u30E9\u30F3\u30AD\u30F3\u30B0\u306E\u96E3\u6613\u5EA6" }, ["easy", "normal"].map((d) => /* @__PURE__ */ React.createElement(
            "button",
            {
              key: d,
              "aria-pressed": tab === d,
              onClick: () => setTab(d)
            },
            label(d)
          ))), /* @__PURE__ */ React.createElement("section", { className: "or-self", "aria-label": "\u81EA\u5206\u306E\u30EC\u30FC\u30C6\u30A3\u30F3\u30B0" }, /* @__PURE__ */ React.createElement("h3", null, label(tab), " \u30EC\u30FC\u30C6\u30A3\u30F3\u30B0"), /* @__PURE__ */ React.createElement("strong", { className: "or-rating" }, ((_e = (_d = state == null ? void 0 : state.ratings) == null ? void 0 : _d[tab]) == null ? void 0 : _e.rating) == null ? "\u8AAD\u8FBC\u4E2D" : formatRating(state.ratings[tab].rating)), /* @__PURE__ */ React.createElement("p", null, "\u6709\u52B9\u306A\u4EBA\u9593\u5BFE\u6226 ", (_h = (_g = (_f = state == null ? void 0 : state.ratings) == null ? void 0 : _f[tab]) == null ? void 0 : _g.games) != null ? _h : 0, "\u6226"), !!((_k = (_j = (_i = state == null ? void 0 : state.ratings) == null ? void 0 : _i[tab]) == null ? void 0 : _j.ghost) == null ? void 0 : _k.games) && /* @__PURE__ */ React.createElement("p", null, "\u30B4\u30FC\u30B9\u30C8\u30FBBOT\uFF1A", state.ratings[tab].ghost.games, "\u6226"), /* @__PURE__ */ React.createElement("p", null, ((_l = state == null ? void 0 : state.ranks) == null ? void 0 : _l[tab]) ? `\u81EA\u5206\u306E\u9806\u4F4D\uFF1A${state.ranks[tab]}\u4F4D` : "\u81EA\u5206\u306E\u9806\u4F4D\uFF1A\u672A\u63B2\u8F09")), /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement("h3", null, label(tab), "\u30E9\u30F3\u30AD\u30F3\u30B0"), /* @__PURE__ */ React.createElement("p", { className: "or-rule" }, tab === "easy" ? "\u63B2\u8F09\u6761\u4EF6\uFF1A\u30A4\u30FC\u30B8\u30FC\u30EC\u30FC\u30C6\u30A3\u30F3\u30B01501\u4EE5\u4E0A\uFF08\u5BFE\u6226\u6570\u4E0D\u554F\uFF09" : "\u63B2\u8F09\u6761\u4EF6\uFF1A\u30CE\u30FC\u30DE\u30EB\u306E\u6709\u52B9\u306A\u4EBA\u9593\u5BFE\u62263\u6226\u4EE5\u4E0A"), !state ? /* @__PURE__ */ React.createElement("p", null, "\u8AAD\u307F\u8FBC\u307F\u4E2D\u2026") : !((_n = (_m = state.rankings) == null ? void 0 : _m[tab]) == null ? void 0 : _n.length) ? /* @__PURE__ */ React.createElement("p", null, "\u63B2\u8F09\u6761\u4EF6\u3092\u6E80\u305F\u3059\u30D7\u30EC\u30A4\u30E4\u30FC\u306F\u307E\u3060\u3044\u307E\u305B\u3093") : /* @__PURE__ */ React.createElement("ol", { className: "or-ranking" }, state.rankings[tab].map((r) => {
            var _a2, _b2;
            return /* @__PURE__ */ React.createElement("li", { key: r.key }, /* @__PURE__ */ React.createElement("span", null, r.rank, "\u4F4D"), /* @__PURE__ */ React.createElement("div", { className: "or-player" }, /* @__PURE__ */ React.createElement(
              "button",
              {
                className: "or-name",
                onClick: () => setSelectedPlayer(r)
              },
              r.name
            ), rowTitle(r, titles), H.BadgeIcons && /* @__PURE__ */ React.createElement(
              H.BadgeIcons,
              {
                st: ((_a2 = r.cosmetics) == null ? void 0 : _a2.stats) || {},
                max: 4
              }
            )), /* @__PURE__ */ React.createElement("strong", null, formatRating(r.rating)), /* @__PURE__ */ React.createElement(
              "div",
              {
                className: "or-record",
                "aria-label": `${r.name}\u306E${label(tab)}\u6226\u7E3E`
              },
              /* @__PURE__ */ React.createElement("span", null, "\u4EBA\u9593\u5BFE\u6226 ", r.statsKnown ? r.games : "\u2015", "\u6226"),
              /* @__PURE__ */ React.createElement("span", null, "\u52DD\u5229 ", r.statsKnown ? r.w : "\u2015"),
              /* @__PURE__ */ React.createElement("span", null, "\u6557\u5317 ", r.statsKnown ? r.l : "\u2015"),
              /* @__PURE__ */ React.createElement("span", null, "\u52DD\u7387", " ", r.statsKnown && r.games ? `${Math.round(r.w / r.games * 100)}%` : "\u2015"),
              !!((_b2 = r.ghost) == null ? void 0 : _b2.games) && /* @__PURE__ */ React.createElement("small", null, "\u4E71\u5165\u5BFE\u6226\uFF1A", r.ghost.games, "\u6226\u30FB", r.ghost.w, "\u52DD", " ", r.ghost.l, "\u6557\uFF08\u4EBA\u9593\u6226\u7E3E\u3068\u306F\u5225\u96C6\u8A08\uFF09"),
              !r.statsKnown && /* @__PURE__ */ React.createElement("small", null, "\u65E7\u30EC\u30FC\u30C8\u3092\u5F15\u304D\u7D99\u3044\u3060\u8A18\u9332\u3067\u3059\u3002\u96E3\u6613\u5EA6\u5225\u306E\u6226\u7E3E\u306F\u672A\u8A18\u9332\u3002")
            ));
          })))), !!Object.keys((state == null ? void 0 : state.badges) || {}).length && /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement("h3", null, "\u7372\u5F97\u3057\u305F\u79F0\u53F7"), /* @__PURE__ */ React.createElement("div", { className: "or-titles" }, Object.keys(state.badges).filter((k) => state.badges[k]).map((k) => /* @__PURE__ */ React.createElement(
            "button",
            {
              key: k,
              disabled: busy || (rankEquip == null ? void 0 : rankEquip.state) === "saving",
              onClick: () => equipFromRanking(k)
            },
            titles[k],
            "\u3092\u88C5\u5099"
          ))), rankEquip && /* @__PURE__ */ React.createElement(
            "p",
            {
              className: "or-equip-status " + rankEquip.state,
              role: rankEquip.state === "saved" || rankEquip.state === "saving" ? "status" : "alert",
              "data-rank-equip": rankEquip.state
            },
            rankEquip.message,
            rankEquip.state === "partial" && /* @__PURE__ */ React.createElement("button", { disabled: busy, onClick: () => equipFromRanking(rankEquip.id) }, "\u518D\u8A66\u884C")
          ))),
          selectedPlayer && H.PlayerView && /* @__PURE__ */ React.createElement(
            H.PlayerView,
            {
              name: selectedPlayer.name,
              st: ((_o = selectedPlayer.cosmetics) == null ? void 0 : _o.stats) || {},
              acctKey: selectedPlayer.key,
              me: selectedPlayer.key === acct.key,
              nameOf: () => "",
              hideLegacyRating: true,
              onClose: () => setSelectedPlayer(null)
            }
          )
        );
      }
      return { App, Result, BattleView };
    };
  })(window);
})();
