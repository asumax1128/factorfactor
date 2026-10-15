(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

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
    const r = report || BResult.build(game), [selected, setSelected] = React.useState(0);
    if (!r.consistent) return /* @__PURE__ */ React.createElement("section", { className: "next-result-details", "data-b-result": true }, /* @__PURE__ */ React.createElement("h3", null, "\u65B0B\u65B9\u5F0F \u5F97\u70B9\u306E\u63A8\u79FB"), /* @__PURE__ */ React.createElement("p", { role: "status" }, r.reason || "\u8A73\u7D30\u8A18\u9332\u304C\u3042\u308A\u307E\u305B\u3093\u3002"));
    const ids = r.ids, other = ids.find((u) => u !== me), row = r.rows[Math.min(selected, r.rows.length - 1)], max = Math.max(1, ...Object.values(r.final)), duration = Math.max(1, r.endAt - r.startAt);
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
    }), reversals.map((e) => /* @__PURE__ */ React.createElement("circle", { key: e.id, cx: x(e.at), cy: y(e.scores[me]), r: "5", fill: "#f6bd62" })), /* @__PURE__ */ React.createElement("text", { x: "42", y: "218" }, "0\u79D2"), /* @__PURE__ */ React.createElement("text", { x: "582", y: "218", textAnchor: "end" }, (duration / 1e3).toFixed(1), "\u79D2")), /* @__PURE__ */ React.createElement("label", { className: "next-result-slider" }, "\u78BA\u5B9A\u30A4\u30D9\u30F3\u30C8 ", /* @__PURE__ */ React.createElement("input", { type: "range", min: "0", max: r.rows.length - 1, value: selected, onChange: (e) => setSelected(Number(e.target.value)) })), /* @__PURE__ */ React.createElement("p", { "aria-live": "polite" }, ((row.at - r.startAt) / 1e3).toFixed(1), "\u79D2\uFF1A", ids.map((u) => `${label(u)} ${row.scores[u]}\u70B9`).join(" \uFF0F "), me && other && `\uFF08\u5F97\u70B9\u5DEE ${row.scores[me] - row.scores[other]}\u70B9\uFF09`), /* @__PURE__ */ React.createElement("p", null, "\u25CF \u30EA\u30FC\u30C9\u4EA4\u4EE3 ", reversals.length, "\u56DE\uFF08\u540C\u70B9\u3092\u631F\u3080\u4EA4\u4EE3\u3092\u542B\u3080\uFF09"), /* @__PURE__ */ React.createElement("div", { className: "next-result-table" }, /* @__PURE__ */ React.createElement("table", null, /* @__PURE__ */ React.createElement("caption", null, "\u78BA\u5B9A\u3057\u305F\u6B63\u89E3\u30FB\u653B\u6483\u306E\u5408\u8A08"), /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "\u30D7\u30EC\u30A4\u30E4\u30FC"), ["\u6B63\u89E3", "\u8AA4\u7B54", "\u6642\u9593\u5207\u308C", "\u6700\u9AD8\u30B3\u30F3\u30DC", "Perfect", "\u9001\u4FE1\u304A\u90AA\u9B54", "\u76F8\u6BBA\u679A\u6570", "FREEZE"].map((t) => /* @__PURE__ */ React.createElement("th", { key: t }, t)))), /* @__PURE__ */ React.createElement("tbody", null, ids.map((u) => /* @__PURE__ */ React.createElement("tr", { key: u }, /* @__PURE__ */ React.createElement("th", null, label(u)), ["correct", "wrong", "timeouts", "best", "perfects", "attack", "cancel", "freeze"].map((k) => {
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
  window.NextResults = { BDetails, CDetails, Spectator, buildB: BResult.build };
})();
