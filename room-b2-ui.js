(() => {
  (function(root) {
    root.RoomB2Factory = function(H) {
      const { useState, useRef, useEffect } = React;
      function App(props) {
        const { code, state, players, isHost, acct, spectator, onLeave, muted, setMuted } = props, uid = H.FB.uid;
        const [raw, setRaw] = useState(null), [time, setTime] = useState(H.now()), [err, setErr] = useState(""), [feedback, setFeedback] = useState(null), [pending, setPending] = useState(false), [target, setTarget] = useState(state.players.find((u) => u !== uid));
        const transport = useRef(null), sequence = useRef(0), pendingSeq = useRef(0), answerLock = useRef(false), feedbackTimer = useRef(null);
        useEffect(() => {
          const c = root.RoomB2.create({ db: H.FB.db, code, state, uid, isHost, onView: (r) => {
            var _a;
            setRaw(r);
            sequence.current = ((_a = r.game.seq) == null ? void 0 : _a[uid]) || 0;
            if (sequence.current >= pendingSeq.current) {
              answerLock.current = false;
              setPending(false);
            }
          }, onError: (e) => setErr(e.message) });
          transport.current = c;
          return () => {
            c.close();
            clearTimeout(feedbackTimer.current);
          };
        }, [state.gid, isHost]);
        useEffect(() => {
          const t = setInterval(() => setTime(H.now()), 40);
          return () => clearInterval(t);
        }, []);
        if (!(raw == null ? void 0 : raw.game)) return /* @__PURE__ */ React.createElement("main", { className: "or-app" }, /* @__PURE__ */ React.createElement("p", null, "\u5BFE\u6226\u3092\u540C\u671F\u3057\u3066\u3044\u307E\u3059\u2026"), /* @__PURE__ */ React.createElement("button", { onClick: onLeave }, "\u623B\u308B"), err && /* @__PURE__ */ React.createElement("p", { role: "alert" }, err));
        const g = raw.game;
        if (raw.phase === "cancelled") return /* @__PURE__ */ React.createElement("main", { className: "or-app" }, /* @__PURE__ */ React.createElement("p", null, "\u958B\u59CB\u524D\u306B\u4E2D\u6B62\u3057\u307E\u3057\u305F\u3002\u6557\u5317\u306B\u306F\u306A\u308A\u307E\u305B\u3093\u3002"), /* @__PURE__ */ React.createElement("button", { onClick: onLeave }, "\u623B\u308B"));
        if (spectator) {
          const used = Object.values(g.cheerReceipts || {}).filter((r) => r.viewer === (acct == null ? void 0 : acct.key)).length;
          return /* @__PURE__ */ React.createElement("main", { className: "or-app" }, /* @__PURE__ */ React.createElement("h1", null, "\u89B3\u6226\u30FBB\u65B9\u5F0F"), /* @__PURE__ */ React.createElement("p", null, "\u6B8B\u308A", Math.max(0, (g.endAt - time) / 1e3).toFixed(1), "\u79D2"), g.ids.map((u) => /* @__PURE__ */ React.createElement("section", { key: u }, /* @__PURE__ */ React.createElement("h2", null, state.names[u]), /* @__PURE__ */ React.createElement("p", null, g.states[u].score, "\u70B9\u30FBHP ", Math.round(g.states[u].hp), "%\u30FB\u304A\u90AA\u9B54", g.states[u].cur.oj, "\u679A\u30FB\u5FDC\u63F4", g.states[u].cheerPoints, "pt"), /* @__PURE__ */ React.createElement("button", { disabled: !(acct == null ? void 0 : acct.key) || used >= 3 || !!g.result || time < g.startAt, onClick: () => transport.current.request({ type: "cheer", account: acct.key, target: u, seq: used + 1 }).catch((e) => setErr(e.message)) }, "\u5FDC\u63F4\uFF0B10pt\uFF08\u6B8B\u308A", 3 - used, "\u56DE\uFF09"))), g.result && /* @__PURE__ */ React.createElement("p", null, g.result.draw ? "\u5F15\u304D\u5206\u3051" : `${state.names[g.result.winner]}\u306E\u52DD\u5229`), err && /* @__PURE__ */ React.createElement("p", { role: "alert" }, err), /* @__PURE__ */ React.createElement("button", { onClick: onLeave }, "\u89B3\u6226\u3092\u7D42\u4E86"));
        }
        if (g.result) return /* @__PURE__ */ React.createElement(H.Final, { ...props, state: { ...state, b2Final: g } });
        const view = transport.current.view(raw);
        const answer = (id1, id2) => {
          const ids = Array.isArray(id1) ? id1 : [id1, id2];
          if (answerLock.current || time < g.startAt || time < view.freezeUntil || view.resolving || g.states[uid].hp <= 0) return;
          answerLock.current = true;
          setPending(true);
          const a = view.tiles.find((t) => t.id === ids[0]), b = view.tiles.find((t) => t.id === ids[1]), ok = H.polyEqual(H.multiply(a.factor, b.factor), view.poly), judge = H.timingVisual(ok ? H.getJudgment(time - view.startAt) : { label: "Bad", color: "#FF5C5C" });
          setFeedback({ judge, flash: { [a.id]: ok ? "correct" : "wrong", [b.id]: ok ? "correct" : "wrong" } });
          if (ok) H.CombatFX.merge(H.CombatFX.capture(ids.map((id) => document.querySelector(`[data-btile="${id}"]`)), document.querySelector("[data-online-opponent]")), judge.color);
          clearTimeout(feedbackTimer.current);
          feedbackTimer.current = setTimeout(() => setFeedback(null), 650);
          const seq = sequence.current + 1;
          pendingSeq.current = seq;
          transport.current.request({ type: "answer", seq, question: view.question, tiles: ids, target }).catch((e) => {
            setErr(e.message);
            answerLock.current = false;
            setPending(false);
          });
        };
        return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(H.BattleView, { H, m: { id: state.gid, selfUid: uid, mode: "B", difficulty: state.diff, gameStartAt: g.startAt, members: g.ids.map((u) => ({ uid: u, name: state.names[u] })) }, g: view, time, muted, setMuted, disabled: pending || g.states[uid].hp <= 0, feedback, extraControls: g.ids.length > 2 && /* @__PURE__ */ React.createElement("div", { className: "or-room-targets" }, g.ids.filter((u) => u !== uid).map((u) => /* @__PURE__ */ React.createElement("button", { key: u, disabled: g.states[u].hp <= 0, onClick: () => setTarget(u), "aria-pressed": target === u }, state.names[u], "\uFF1A", g.states[u].score, "\u70B9"))), onMatch: answer, onSpecial: () => {
        }, onLeave: () => {
          if (time < g.startAt || confirm("\u5BFE\u6226\u958B\u59CB\u5F8C\u306E\u9000\u51FA\u306F\u6557\u5317\u6271\u3044\u3067\u3059\u3002\u9000\u51FA\u3057\u307E\u3059\u304B\uFF1F")) transport.current.request({ type: "leave" }).then(onLeave).catch((e) => setErr(e.message));
        } }), err && /* @__PURE__ */ React.createElement("div", { className: "or-room-error", role: "alert" }, err));
      }
      return { App };
    };
  })(window);
})();
