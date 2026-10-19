(() => {
  (function(root) {
    root.RoomB2Factory = function(H) {
      const { useState, useRef, useEffect } = React;
      function App(props) {
        var _a, _b;
        const { code, state, players, isHost, acct, spectator, onLeave, muted, setMuted } = props, uid = props.practice ? "me" : H.FB.uid;
        const [raw, setRaw] = useState(null), [time, setTime] = useState(H.now()), [err, setErr] = useState(""), [feedback, setFeedback] = useState(null), [pending, setPending] = useState(false), [target, setTarget] = useState(state.players.find((u) => u !== uid));
        const transport = useRef(null), sequence = useRef(0), pendingSeq = useRef(0), answerLock = useRef(false), feedbackTimer = useRef(null);
        const progress = useRef({ clock: null, rev: null, at: Date.now() }), wasOnline = useRef(true), offlineSince = useRef(0), busyRef = useRef(false), leftRef = useRef(false), [busy, setBusy] = useState(false), [stallMsg, setStallMsg] = useState("");
        useEffect(() => {
          const c = root.RoomB2.create({ db: props.practice ? H.dbOf() : H.FB.db, code, state, uid, isHost, ...props.practice ? { localBots: root.LocalB2Bots.create({ think: H.cpuThink, miss: H.cpuMiss, levels: H.CPU_LEVELS }) } : {}, onView: (r) => {
            var _a2;
            const p = progress.current;
            if (r.clock !== p.clock || r.revision !== p.rev) {
              p.clock = r.clock;
              p.rev = r.revision;
              p.at = Date.now();
            }
            setRaw(r);
            sequence.current = ((_a2 = r.game.seq) == null ? void 0 : _a2[uid]) || 0;
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
          const t = setInterval(() => {
            setTime(H.now());
            const on = H.FB.conn !== false;
            if (on && !wasOnline.current) progress.current.at = Date.now();
            if (on) offlineSince.current = 0;
            else if (!offlineSince.current) offlineSince.current = Date.now();
            wasOnline.current = on;
          }, 40);
          const vis = () => {
            if (document.visibilityState === "visible") progress.current.at = Date.now();
          };
          document.addEventListener("visibilitychange", vis);
          return () => {
            clearInterval(t);
            document.removeEventListener("visibilitychange", vis);
          };
        }, []);
        if (!(raw == null ? void 0 : raw.game)) return /* @__PURE__ */ React.createElement("main", { className: "or-app" }, /* @__PURE__ */ React.createElement("p", null, "\u5BFE\u6226\u3092\u540C\u671F\u3057\u3066\u3044\u307E\u3059\u2026"), /* @__PURE__ */ React.createElement("button", { onClick: onLeave }, "\u623B\u308B"), err && /* @__PURE__ */ React.createElement("p", { role: "alert" }, err));
        const g = raw.game;
        if (raw.phase === "cancelled") return /* @__PURE__ */ React.createElement("main", { className: "or-app" }, /* @__PURE__ */ React.createElement("p", null, "\u958B\u59CB\u524D\u306B\u4E2D\u6B62\u3057\u307E\u3057\u305F\u3002\u6557\u5317\u306B\u306F\u306A\u308A\u307E\u305B\u3093\u3002"), /* @__PURE__ */ React.createElement("button", { onClick: onLeave }, "\u623B\u308B"));
        if (spectator) {
          const slots = Object.keys(((_a = raw.inputs) == null ? void 0 : _a[uid]) || {}).filter((k) => /^c[1-3]$/.test(k)), used = Math.max(slots.length, Object.values(g.cheerReceipts || {}).filter((r) => r.viewer === (acct == null ? void 0 : acct.key)).length), next = [1, 2, 3].find((n) => !slots.includes("c" + n));
          if ((_b = root.NextResults) == null ? void 0 : _b.Spectator) return /* @__PURE__ */ React.createElement(root.NextResults.Spectator, { H, g, time, names: state.names, onLeave }, /* @__PURE__ */ React.createElement("div", { className: "next-spectator-cheers" }, g.ids.map((u) => /* @__PURE__ */ React.createElement("button", { key: u, disabled: !(acct == null ? void 0 : acct.key) || used >= 3 || g.states[u].hp <= 0 || !!g.result || time < g.startAt, onClick: () => transport.current.request({ type: "cheer", account: acct.key, target: u, seq: next }).catch((e) => setErr(e.message)) }, state.names[u], "\u3078\u5FDC\u63F4\uFF0B10pt\uFF08\u6B8B\u308A", 3 - used, "\u56DE\uFF09"))), err && /* @__PURE__ */ React.createElement("p", { role: "alert" }, err));
          return /* @__PURE__ */ React.createElement("main", { className: "or-app" }, /* @__PURE__ */ React.createElement("h1", null, "\u89B3\u6226\u30FBB\u65B9\u5F0F"), /* @__PURE__ */ React.createElement("p", null, "\u6B8B\u308A", Math.max(0, (g.endAt - time) / 1e3).toFixed(1), "\u79D2"), g.ids.map((u) => /* @__PURE__ */ React.createElement("section", { key: u }, /* @__PURE__ */ React.createElement("h2", null, state.names[u]), /* @__PURE__ */ React.createElement("p", null, g.states[u].score, "\u70B9\u30FBHP ", Math.round(g.states[u].hp), "%\u30FB\u304A\u90AA\u9B54", g.states[u].cur.oj, "\u679A\u30FB\u5FDC\u63F4", g.states[u].cheerPoints, "pt"), /* @__PURE__ */ React.createElement("button", { disabled: !(acct == null ? void 0 : acct.key) || used >= 3 || g.states[u].hp <= 0 || !!g.result || time < g.startAt, onClick: () => transport.current.request({ type: "cheer", account: acct.key, target: u, seq: next }).catch((e) => setErr(e.message)) }, "\u5FDC\u63F4\uFF0B10pt\uFF08\u6B8B\u308A", 3 - used, "\u56DE\uFF09"))), g.result && /* @__PURE__ */ React.createElement("p", null, g.result.draw ? "\u5F15\u304D\u5206\u3051" : `${state.names[g.result.winner]}\u306E\u52DD\u5229`), err && /* @__PURE__ */ React.createElement("p", { role: "alert" }, err), /* @__PURE__ */ React.createElement("button", { onClick: onLeave }, "\u89B3\u6226\u3092\u7D42\u4E86"));
        }
        if (g.result && state.tournamentVersion === 2) return /* @__PURE__ */ React.createElement(H.TournamentFinal, { ...props, game: g });
        if (g.result) return /* @__PURE__ */ React.createElement(H.Final, { ...props, state: { ...state, b2Final: g } });
        const view = transport.current.view(raw);
        const guarded = !isHost && !props.practice && typeof props.onSafeLeave === "function", online = H.FB.conn !== false, st = guarded ? root.RoomB2.health({ online, serverAge: typeof raw.clock === "number" ? time - raw.clock : null, localAge: Date.now() - progress.current.at, lagMs: root.RoomB2.processing(raw, uid) }) : "ok", stopped = st === "stopped", offlineLong = guarded && !online && offlineSince.current > 0 && Date.now() - offlineSince.current >= root.RoomB2.config.leaveMs;
        const recheck = async () => {
          if (busyRef.current || leftRef.current) return;
          busyRef.current = true;
          setBusy(true);
          setStallMsg("");
          const r = await transport.current.refresh();
          busyRef.current = false;
          setBusy(false);
          const d = root.RoomB2.decide(r);
          if (d === "result") return;
          setStallMsg(d === "unreadable" ? "\u8A66\u5408\u7D50\u679C\u3092\u78BA\u8A8D\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u901A\u4FE1\u3092\u78BA\u8A8D\u3057\u3066\u3082\u3046\u4E00\u5EA6\u304A\u8A66\u3057\u304F\u3060\u3055\u3044\u3002" : "\u307E\u3060\u540C\u671F\u304C\u623B\u3063\u3066\u3044\u307E\u305B\u3093\uFF08\u6700\u5F8C\u306B\u78BA\u8A8D\u3057\u305F\u6642\u70B9\u3067\u306F\u7D50\u679C\u306F\u672A\u78BA\u5B9A\u3067\u3059\uFF09\u3002");
        };
        const safeLeave = async () => {
          if (busyRef.current || leftRef.current) return;
          busyRef.current = true;
          setBusy(true);
          if (H.FB.conn === false) {
            leftRef.current = true;
            props.onSafeLeave({ reason: "offline" });
            return;
          }
          const d = root.RoomB2.decide(await transport.current.refresh());
          if (d === "result") {
            busyRef.current = false;
            setBusy(false);
            return;
          }
          leftRef.current = true;
          props.onSafeLeave({ reason: d });
        };
        const answer = (id1, id2) => {
          const ids = Array.isArray(id1) ? id1 : [id1, id2];
          if (answerLock.current || stopped || leftRef.current || time < g.startAt || time < view.freezeUntil || view.resolving || g.states[uid].hp <= 0) return;
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
        return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(H.BattleView, { H, m: { id: state.gid, selfUid: uid, mode: "B", difficulty: state.diff, gameStartAt: g.startAt, members: g.ids.map((u) => ({ uid: u, name: state.names[u] })) }, g: view, time, muted, setMuted, disabled: pending || stopped || g.states[uid].hp <= 0, feedback, extraControls: g.ids.length > 2 && /* @__PURE__ */ React.createElement("div", { className: "or-room-targets pf-targets", role: "group", "aria-label": "\u653B\u6483\u306E\u6A19\u7684" }, g.ids.filter((u) => u !== uid).map((u) => /* @__PURE__ */ React.createElement("button", { key: u, className: "pf-target", disabled: g.states[u].hp <= 0, onClick: () => setTarget(u), "aria-pressed": target === u }, /* @__PURE__ */ React.createElement("i", { className: "pf-target-mark", "aria-hidden": "true" }, "\u{1F3AF}"), state.names[u], "\uFF1A", g.states[u].score, "\u70B9"))), onMatch: answer, onSpecial: () => {
        }, onLeave: () => {
          if (time < g.startAt || confirm("\u5BFE\u6226\u958B\u59CB\u5F8C\u306E\u9000\u51FA\u306F\u6557\u5317\u6271\u3044\u3067\u3059\u3002\u9000\u51FA\u3057\u307E\u3059\u304B\uFF1F")) transport.current.request({ type: "leave" }).then(onLeave).catch((e) => setErr(e.message));
        } }), err && /* @__PURE__ */ React.createElement("div", { className: "or-room-error", role: "alert" }, err), guarded && (st !== "ok" || offlineLong) && /* @__PURE__ */ React.createElement("section", { className: "or-room-stall", role: stopped || offlineLong ? "alertdialog" : "status", "aria-live": "polite", "data-b2-stall": st }, /* @__PURE__ */ React.createElement("p", { className: "or-room-stall-title" }, st === "offline" ? "\u901A\u4FE1\u3092\u78BA\u8A8D\u4E2D\u2026" : st === "warn" ? "\u8A66\u5408\u306E\u540C\u671F\u304C\u9045\u308C\u3066\u3044\u307E\u3059\u2026" : "\u8A66\u5408\u306E\u540C\u671F\u304C\u505C\u6B62\u3057\u3066\u3044\u307E\u3059"), (stopped || offlineLong) && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("p", { className: "or-room-stall-sub" }, offlineLong ? "\u901A\u4FE1\u304C\u56DE\u5FA9\u3057\u3066\u3044\u306A\u3044\u305F\u3081\u3001\u8A66\u5408\u7D50\u679C\u3092\u78BA\u8A8D\u3067\u304D\u307E\u305B\u3093\u3002" : "\u6700\u5F8C\u306B\u78BA\u8A8D\u3057\u305F\u6642\u70B9\u3067\u306F\u3001\u7D50\u679C\u306F\u672A\u78BA\u5B9A\u3067\u3059\u3002\u901A\u4FE1\u304B\u3001\u76F8\u624B\u5074\u306E\u51E6\u7406\u304C\u6B62\u307E\u3063\u3066\u3044\u308B\u53EF\u80FD\u6027\u304C\u3042\u308A\u307E\u3059\u3002"), stallMsg && /* @__PURE__ */ React.createElement("p", { className: "or-room-stall-sub", role: "status" }, stallMsg), /* @__PURE__ */ React.createElement("div", { className: "or-room-stall-actions" }, !offlineLong && /* @__PURE__ */ React.createElement("button", { type: "button", disabled: busy, onClick: recheck }, "\u518D\u63A5\u7D9A\u3092\u78BA\u8A8D"), /* @__PURE__ */ React.createElement("button", { type: "button", disabled: busy, onClick: safeLeave }, "\u7D50\u679C\u672A\u78BA\u8A8D\u306E\u307E\u307E\u30DB\u30FC\u30E0\u3078\u623B\u308B")))));
      }
      return { App };
    };
  })(window);
})();
