(() => {
  (function(root) {
    root.OnlineRatedFactory = function(H) {
      const { useState, useRef, useEffect } = React;
      const titles = {
        easy_adept: "EASY\u306E\u9054\u4EBA",
        easy_master: "EASY\u30DE\u30B9\u30BF\u30FC",
        normal_adept: "NORMAL\u306E\u9054\u4EBA",
        normal_master: "NORMAL\u30DE\u30B9\u30BF\u30FC",
        dual_master: "\u53CC\u74A7\u306E\u30DE\u30B9\u30BF\u30FC"
      };
      function App({ acct, onExit, endpoint }) {
        var _a, _b, _c, _d, _e, _f, _g;
        const [state, setState] = useState(null), [error, setError] = useState(""), [screen, setScreen] = useState("select"), [tab, setTab] = useState("easy"), [busy, setBusy] = useState(false), [muted, setMuted] = H.useGameMute();
        const current = useRef(null), inFlight = useRef(false), seq = useRef(0), life = useRef(true), retry = useRef(null), requestRef = useRef(null);
        const sound = H.useBattleSound(muted);
        current.current = state;
        useEffect(
          () => () => {
            life.current = false;
            sound.bgm(false);
          },
          []
        );
        async function send(command) {
          var _a2, _b2, _c2, _d2, _e2;
          if (inFlight.current) return;
          inFlight.current = true;
          setBusy(true);
          setError("");
          try {
            if (endpoint !== "https://asia-southeast1-asumath-games.cloudfunctions.net/onlineRated")
              throw Error("\u65B0\u5236\u5EA6\u306E\u63A5\u7D9A\u5148\u304C\u672A\u78BA\u8A8D\u3067\u3059");
            const token = await H.getIdToken();
            const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 1e4);
            let r;
            try {
              r = await fetch(endpoint, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: "Bearer " + token
                },
                body: JSON.stringify({
                  accountKey: acct.key,
                  command: { protocol: 2, ...command }
                }),
                signal: controller.signal
              });
            } finally {
              clearTimeout(timer);
            }
            const v = await r.json();
            if (!r.ok || v.error) throw Error(v.error || "\u901A\u4FE1\u306B\u5931\u6557\u3057\u307E\u3057\u305F");
            if (!life.current) return;
            retry.current = null;
            setState(v);
            current.current = v;
            if ((_a2 = v.match) == null ? void 0 : _a2.game) seq.current = v.match.game.acceptedSeq;
            if (((_b2 = v.match) == null ? void 0 : _b2.phase) === "settled") setScreen("result");
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
            if (life.current) setBusy(false);
          }
        }
        requestRef.current = send;
        useEffect(() => {
          if (acct == null ? void 0 : acct.key) send({ type: "status" });
          else setError("\u767B\u9332\u30A2\u30AB\u30A6\u30F3\u30C8\u3067\u30ED\u30B0\u30A4\u30F3\u3057\u3066\u304B\u3089\u691C\u7D22\u3057\u3066\u304F\u3060\u3055\u3044");
        }, []);
        useEffect(() => {
          if (!["wait", "vote", "play"].includes(screen)) return;
          const id = setInterval(() => {
            if (retry.current) return;
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
        const time = Date.now() + (H.FB.off || 0);
        const answer = (a, b) => {
          if (inFlight.current || retry.current || !g) return;
          const command = {
            type: "answer",
            matchId: m.id,
            question: g.question,
            tiles: [a, b],
            seq: ++seq.current
          };
          send(command);
        };
        useEffect(() => {
          seq.current = 0;
        }, [m == null ? void 0 : m.id]);
        return /* @__PURE__ */ React.createElement("main", { className: "or-app" }, /* @__PURE__ */ React.createElement("header", null, /* @__PURE__ */ React.createElement(
          "button",
          {
            onClick: () => {
              if (["wait", "vote", "play"].includes(screen)) {
                setError(
                  "\u691C\u7D22\u3092\u30AD\u30E3\u30F3\u30BB\u30EB\u3001\u307E\u305F\u306F\u5BFE\u6226\u304B\u3089\u9000\u51FA\u3057\u3066\u304B\u3089\u623B\u3063\u3066\u304F\u3060\u3055\u3044"
                );
                return;
              }
              onExit();
            },
            disabled: busy
          },
          "\u30AA\u30F3\u30E9\u30A4\u30F3\u3078\u623B\u308B"
        ), /* @__PURE__ */ React.createElement("h2", null, "\u96E3\u6613\u5EA6\u5225\u30E9\u30F3\u30C0\u30E0\u5BFE\u6226"), /* @__PURE__ */ React.createElement(
          "button",
          {
            "aria-label": muted ? "\u97F3\u3092\u51FA\u3059" : "\u6D88\u97F3",
            onClick: () => setMuted(!muted)
          },
          muted ? "\u{1F507}" : "\u{1F50A}"
        )), error && /* @__PURE__ */ React.createElement("section", { role: "alert" }, /* @__PURE__ */ React.createElement("p", null, error), /* @__PURE__ */ React.createElement(
          "button",
          {
            disabled: busy,
            onClick: () => send(retry.current || { type: "heartbeat", matchId: m == null ? void 0 : m.id })
          },
          "\u518D\u8A66\u884C\u30FB\u6700\u65B0\u7D50\u679C\u3092\u78BA\u8A8D"
        )), screen === "select" && /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement("p", null, "\u96E3\u6613\u5EA6\u3092\u9078\u3093\u3067\u76F8\u624B\u3092\u63A2\u3057\u307E\u3059\u3002\u90E8\u5C4B\u756A\u53F7\u5BFE\u6226\u30FBCPU\u306F\u5225\u30E1\u30CB\u30E5\u30FC\u3067\u3059\u3002"), ["easy", "normal"].map((d) => /* @__PURE__ */ React.createElement(
          "button",
          {
            key: d,
            disabled: busy || !(acct == null ? void 0 : acct.key),
            onClick: () => send({ type: "enqueue", difficulty: d })
          },
          d.toUpperCase(),
          "\u3067\u76F8\u624B\u3092\u63A2\u3059"
        ))), screen === "wait" && /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement("h3", null, "\u540C\u3058\u96E3\u6613\u5EA6\u306E\u76F8\u624B\u3092\u691C\u7D22\u4E2D"), /* @__PURE__ */ React.createElement(
          "button",
          {
            disabled: busy,
            onClick: () => send({ type: "cancel", ticket: state.ticket })
          },
          "\u691C\u7D22\u3092\u30AD\u30E3\u30F3\u30BB\u30EB"
        )), screen === "vote" && /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement("h3", null, m.difficulty.toUpperCase(), " \u30FB \u65B9\u5F0F\u3092\u9078\u3076"), /* @__PURE__ */ React.createElement("p", null, "\u96E3\u6613\u5EA6\u306F\u56FA\u5B9A\u3067\u3059\u3002\u65B9\u5F0F\u304C\u5206\u304B\u308C\u305F\u5834\u5408\u30FB\u6642\u9593\u5207\u308C\u306F\u30E9\u30F3\u30C0\u30E0\u306B\u6C7A\u307E\u308A\u307E\u3059\u3002"), ["A", "B"].map((mode) => /* @__PURE__ */ React.createElement(
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
        )), screen === "play" && g && /* @__PURE__ */ React.createElement("section", { className: "or-battle" }, /* @__PURE__ */ React.createElement("h3", null, m.difficulty.toUpperCase(), " \u30FB ", m.mode, "\u65B9\u5F0F"), /* @__PURE__ */ React.createElement("p", null, "Lv.", g.level, " \u30FB ", time < g.startAt ? "\u307E\u3082\u306A\u304F\u958B\u59CB" : "\u5BFE\u6226\u4E2D"), /* @__PURE__ */ React.createElement("div", { className: "or-live" }, Object.entries(g.live).map(([uid, v]) => /* @__PURE__ */ React.createElement("p", { key: uid }, uid === H.FB.uid ? "\u81EA\u5206" : "\u76F8\u624B", "\uFF1A", typeof v === "number" ? `${v}\u70B9` : `HP ${v.hp.toFixed(1)} \u30FB ${v.c}\u6B63\u89E3 \u30FB \u30B3\u30F3\u30DC${v.combo}`))), /* @__PURE__ */ React.createElement(
          H.TargetCard,
          {
            poly: g.poly,
            level: g.level,
            gaugeMs: g.timeoutMs,
            v7: true
          }
        ), /* @__PURE__ */ React.createElement(
          H.BattleBoard,
          {
            tiles: g.tiles,
            onMatch: answer,
            disabled: busy || !!error || time < Math.max(g.startAt, g.readyAt || 0) || !!g.result,
            v7: true
          }
        ), m.mode === "B" && /* @__PURE__ */ React.createElement("div", null, ["big", "heal", "shield"].map((kind) => /* @__PURE__ */ React.createElement(
          "button",
          {
            key: kind,
            disabled: busy,
            onClick: () => send({
              type: "special",
              matchId: m.id,
              kind,
              seq: ++seq.current
            })
          },
          { big: "\u5927\u653B\u6483", heal: "\u56DE\u5FA9", shield: "\u30B7\u30FC\u30EB\u30C9" }[kind]
        ))), /* @__PURE__ */ React.createElement(
          "button",
          {
            disabled: busy,
            onClick: () => {
              if (confirm("\u9000\u51FA\u3059\u308B\u3068\u6557\u5317\u6271\u3044\u306B\u306A\u308A\u307E\u3059\u3002\u9000\u51FA\u3057\u307E\u3059\u304B\uFF1F"))
                send({ type: "leave", matchId: m.id });
            }
          },
          "\u5BFE\u6226\u304B\u3089\u9000\u51FA"
        )), screen === "result" && /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement("h3", null, m.outcome === "draw" ? "\u5F15\u304D\u5206\u3051" : m.outcome === "win" ? "\u52DD\u5229\uFF01" : "\u6557\u5317"), /* @__PURE__ */ React.createElement("p", null, "\u30EC\u30FC\u30C8 ", (_c = (_b = (_a = m.receipt) == null ? void 0 : _a.players) == null ? void 0 : _b[acct.key]) == null ? void 0 : _c.before, " \u2192", " ", (_f = (_e = (_d = m.receipt) == null ? void 0 : _d.players) == null ? void 0 : _e[acct.key]) == null ? void 0 : _f.after), /* @__PURE__ */ React.createElement("p", null, m.difficulty.toUpperCase(), "\u306E\u30EC\u30FC\u30C8\u306E\u307F\u66F4\u65B0\u3057\u307E\u3057\u305F\u3002"), /* @__PURE__ */ React.createElement(
          "button",
          {
            disabled: busy,
            onClick: () => {
              send({ type: "ackReceipt", matchId: m.id });
            }
          },
          "\u3082\u3046\u4E00\u5EA6\u5BFE\u6226\u3059\u308B"
        )), /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement("h3", null, "\u81EA\u5206\u306E\u30EC\u30FC\u30C6\u30A3\u30F3\u30B0"), ["easy", "normal"].map((d) => {
          var _a2, _b2, _c2, _d2, _e2, _f2, _g2;
          return /* @__PURE__ */ React.createElement("p", { key: d }, d.toUpperCase(), "\uFF1A", (_c2 = (_b2 = (_a2 = state == null ? void 0 : state.ratings) == null ? void 0 : _a2[d]) == null ? void 0 : _b2.rating) != null ? _c2 : "\u8AAD\u8FBC\u524D", " \u30FB", " ", (_f2 = (_e2 = (_d2 = state == null ? void 0 : state.ratings) == null ? void 0 : _d2[d]) == null ? void 0 : _e2.games) != null ? _f2 : 0, "\u6226", ((_g2 = state == null ? void 0 : state.ranks) == null ? void 0 : _g2[d]) ? " \u30FB " + state.ranks[d] + "\u4F4D" : " \u30FB \u63B2\u8F09\u306F3\u6226\u304B\u3089");
        }), /* @__PURE__ */ React.createElement("p", null, Object.keys((state == null ? void 0 : state.badges) || {}).filter((k) => state.badges[k]).map((k) => /* @__PURE__ */ React.createElement(
          "button",
          {
            key: k,
            disabled: busy,
            onClick: () => send({
              type: "equipTitle",
              title: k,
              ...m ? { matchId: m.id } : {}
            })
          },
          titles[k],
          "\u3092\u88C5\u5099"
        )))), /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement("h3", null, "\u30EC\u30FC\u30C6\u30A3\u30F3\u30B0\u30E9\u30F3\u30AD\u30F3\u30B0"), ["easy", "normal"].map((d) => /* @__PURE__ */ React.createElement(
          "button",
          {
            key: d,
            "aria-pressed": tab === d,
            onClick: () => setTab(d)
          },
          d.toUpperCase()
        )), /* @__PURE__ */ React.createElement("p", null, "\u3053\u306E\u96E3\u6613\u5EA6\u3067\u6709\u52B9\u5BFE\u62263\u6226\u4EE5\u4E0A"), (((_g = state == null ? void 0 : state.rankings) == null ? void 0 : _g[tab]) || []).map((r) => /* @__PURE__ */ React.createElement("p", { key: r.key }, r.rank, "\u4F4D ", r.name, " ", titles[r.title] || "", "\uFF1A", r.rating))));
      }
      return { App };
    };
  })(window);
})();
