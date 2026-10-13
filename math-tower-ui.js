(() => {
  (function(root) {
    const { useState, useEffect, useRef } = React, R = root.MathTowerRules, Store = root.MathTowerStore;
    let MathRenderer;
    function Button({ children, ...p }) {
      return /* @__PURE__ */ React.createElement("button", { className: "mt-button", ...p }, children);
    }
    function name(c, id, reveal) {
      const x = c.characters[id] || {};
      return x.revealKey && !reveal[x.revealKey] ? x.displayNameBeforeReveal || "\uFF1F\uFF1F\uFF1F" : x.short || x.trueName || "";
    }
    const line = (x) => Array.isArray(x) ? { who: x[0], text: x[1], ...x[2] || {} } : x;
    function Story({ events, content, progress, hero, onRead, onDone }) {
      const [ei, setEi] = useState(0), [li, setLi] = useState(0), [reveal, setReveal] = useState(progress.reveal || {}), ending = useRef(false);
      const ev = events[ei], lines = (ev.lines || []).map(line), l = lines[li];
      const text = String(l.text || "").replaceAll("{playerName}", hero).replaceAll("\u6570\u7406\u306E\u5854", "\u6570\u5B66\u306E\u5854");
      let bg = ev.bg || (ev.floor > 0 ? "f0" + ev.floor : null);
      for (let j = 0; j <= li; j++) if (lines[j].bg) bg = lines[j].bg;
      const portraits = (id) => {
        const unit = content.characters[id]?.unit;
        return Array.isArray(unit) ? unit.flatMap(portraits) : [id];
      };
      const active = portraits(l.who).find(
        (id) => !l.name || name(content, id, reveal) === l.name
      ) || portraits(l.who)[0];
      const paperLines = lines.slice(0, li + 1).filter((x) => ["math", "note"].includes(x.kind));
      const bookSeen = lines.slice(0, li + 1).some((x) => ["book", "bookopen"].includes(x.fx));
      const notebook = ev.id === "prologue" && bg === "classroom" && !bookSeen;
      const book = ["book", "bookopen"].includes(l.fx) || ev.id === "prologue" && bg === "classroom" && bookSeen;
      let sceneStart = 0;
      for (let j = 0; j <= li; j++) if (lines[j].bg) sceneStart = j;
      const visible = lines.slice(sceneStart, li + 1).filter(
        (x) => content.characters[x.who] && content.characters[x.who].image
      ).flatMap((x) => portraits(x.who));
      if (["plus", "minus"].includes(active)) visible.push("plus", "minus");
      const ids = [...new Set(visible)].slice(-3);
      if (ids.includes("plus") && ids.includes("minus")) {
        ids.sort(
          (a, b) => ({ minus: -2, plus: -1 }[a] ?? 0) - ({ minus: -2, plus: -1 }[b] ?? 0)
        );
      }
      const next = () => {
        if (ending.current) return;
        const rev = l.reveal ? { ...reveal, [l.reveal]: true } : reveal;
        setReveal(rev);
        if (li + 1 < lines.length) {
          setLi(li + 1);
          return;
        }
        onRead(ev.id, rev);
        if (ei + 1 < events.length) {
          setEi(ei + 1);
          setLi(0);
        } else {
          ending.current = true;
          onDone();
        }
      };
      const speaker = active === "hero" ? hero : active === "narr" ? "" : l.name || name(content, active, reveal) || "\u6570\u7406\u306E\u66F8";
      const background = content.backgrounds[bg] || {};
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "mt-story",
          "data-math-story": ev.id,
          "data-story-floor": ev.floor || 0,
          style: {
            backgroundImage: background.image ? `linear-gradient(#09133344,#09133388),url("${background.image}")` : void 0,
            backgroundPosition: background.focus || "50% 50%"
          }
        },
        /* @__PURE__ */ React.createElement("header", null, /* @__PURE__ */ React.createElement("span", null, ev.title || ""), progress.read[ev.id] && /* @__PURE__ */ React.createElement(
          Button,
          {
            onClick: () => {
              if (ending.current) return;
              if (ei + 1 < events.length) {
                setEi(ei + 1);
                setLi(0);
              } else {
                ending.current = true;
                onDone();
              }
            }
          },
          "\u65E2\u8AAD\u3092\u30B9\u30AD\u30C3\u30D7"
        )),
        /* @__PURE__ */ React.createElement("div", { className: "mt-stage mt-fx-" + (l.fx || "none") }, ids.map((id) => /* @__PURE__ */ React.createElement(
          "img",
          {
            key: id,
            "data-math-character": id,
            "data-speaking": active === id ? "true" : "false",
            alt: name(content, id, reveal),
            src: content.characters[id].image,
            style: {
              filter: ["plus", "minus"].includes(id) ? `brightness(${active === id ? 1 : 0.65}) drop-shadow(0 0 2px #fff9) drop-shadow(0 3px 7px #071127)` : active === id ? "none" : "brightness(.65)",
              maxWidth: ids.length > 1 ? "42%" : "75%"
            }
          }
        )), notebook && /* @__PURE__ */ React.createElement(
          "div",
          {
            className: "mt-notebook " + (l.fx === "particles" ? "mt-paper-burst" : ""),
            "aria-label": "\u30CE\u30FC\u30C8\u306E\u7D19\u9762"
          },
          /* @__PURE__ */ React.createElement("div", { className: "mt-paper-heading" }, "FACTOR \xD7 FACTOR"),
          paperLines.map((x, i) => /* @__PURE__ */ React.createElement(
            "p",
            {
              key: i,
              className: x.kind === "note" ? "mt-paper-note" : "mt-paper-math"
            },
            x.kind === "math" ? /* @__PURE__ */ React.createElement(MathRenderer, { text: x.text }) : x.text
          ))
        ), book && !notebook && /* @__PURE__ */ React.createElement("div", { className: "mt-tome", "aria-label": "\u5149\u308B\u6570\u7406\u306E\u66F8" }, /* @__PURE__ */ React.createElement("span", null, "\u2726"), /* @__PURE__ */ React.createElement("i", null), /* @__PURE__ */ React.createElement("i", null)), !ids.length && !notebook && !book && /* @__PURE__ */ React.createElement("span", { className: "mt-symbol" }, ["book", "bookopen"].includes(l.fx) ? "\u{1F4D6}" : l.kind === "math" ? text : "\u2726"), l.kind === "title" && /* @__PURE__ */ React.createElement("h2", { className: "mt-title" }, text)),
        /* @__PURE__ */ React.createElement("button", { className: "mt-dialog", onClick: next, "data-math-dialog": true }, /* @__PURE__ */ React.createElement("strong", null, speaker), /* @__PURE__ */ React.createElement("p", null, l.kind === "math" ? /* @__PURE__ */ React.createElement(MathRenderer, { text }) : text), /* @__PURE__ */ React.createElement("small", null, "\u30BF\u30C3\u30D7\u3067\u6B21\u3078 \u25BC"))
      );
    }
    function CutIn({ info, onConfirm }) {
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "mt-overlay mt-cutin",
          role: "dialog",
          "aria-modal": "true",
          "aria-labelledby": "mt-cutin-title",
          "data-math-cutin": info.id
        },
        /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement("div", { className: "mt-cutin-emblem" }, "\u2726"), /* @__PURE__ */ React.createElement("h2", { id: "mt-cutin-title" }, info.title), /* @__PURE__ */ React.createElement("p", null, info.text), /* @__PURE__ */ React.createElement(Button, { autoFocus: true, onClick: onConfirm }, "\u78BA\u8A8D\u3057\u3066\u518D\u958B"))
      );
    }
    const lerp = (a, b, t) => a + (b - a) * t;
    function MagicAttack({ attack, paused, onImpact }) {
      const layer = useRef(null), pause = useRef(paused), done = useRef(onImpact);
      pause.current = paused;
      done.current = onImpact;
      useEffect(() => {
        const el = layer.current;
        let raf, last, elapsed = 0, alive = true;
        const cards = attack.cards.map(({ html, rect }) => {
          const ghost = document.createElement("div");
          ghost.className = "mt-magic-card";
          ghost.innerHTML = html;
          ghost.style.width = rect.width + "px";
          ghost.style.height = rect.height + "px";
          el.appendChild(ghost);
          return ghost;
        });
        const orb = document.createElement("div");
        orb.className = "mt-magic-orb";
        el.appendChild(orb);
        const frame = (now) => {
          if (!alive) return;
          if (last !== void 0 && !pause.current)
            elapsed += Math.min(50, now - last);
          last = now;
          const center = (node) => {
            const r = node.getBoundingClientRect();
            return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
          };
          const q = document.querySelector(".mt-controls .v7-poly"), enemy = document.querySelector(".mt-enemy img");
          if (!q || !enemy) return;
          const target = center(q), hit = center(enemy), origin = attack.cards.map((x) => ({
            x: x.rect.left + x.rect.width / 2,
            y: x.rect.top + x.rect.height / 2
          }));
          const liveCards = attack.ids.map(
            (id) => document.querySelector('[data-btile="' + id + '"]')
          );
          liveCards.forEach((node, i) => {
            if (node) origin[i] = center(node);
          });
          const middle = {
            x: (origin[0].x + origin[1].x) / 2,
            y: (origin[0].y + origin[1].y) / 2
          };
          cards.forEach((card, i) => {
            const t = Math.min(1, elapsed / 160), fly = Math.min(1, Math.max(0, (elapsed - 160) / 180));
            const x = lerp(lerp(origin[i].x, middle.x, t), target.x, fly), y = lerp(lerp(origin[i].y, middle.y, t), target.y, fly);
            card.style.left = x + "px";
            card.style.top = y + "px";
            card.style.transform = `translate(-50%,-50%) scale(${1 - fly * 0.55}) rotate(${(i ? 1 : -1) * (1 - t) * 10}deg)`;
            card.style.opacity = elapsed < 340 ? 1 : Math.max(0, 1 - (elapsed - 340) / 80);
          });
          const flight = Math.min(1, Math.max(0, (elapsed - 400) / 220));
          orb.style.left = lerp(target.x, hit.x, flight) + "px";
          orb.style.top = lerp(target.y, hit.y, flight) - Math.sin(flight * Math.PI) * 35 + "px";
          orb.style.opacity = elapsed >= 340 ? 1 : 0;
          el.dataset.phase = elapsed < 160 ? "merge" : elapsed < 340 ? "formula" : elapsed < 400 ? "energy" : elapsed < 620 ? "flight" : "impact";
          if (elapsed >= 620) {
            alive = false;
            done.current();
            return;
          }
          raf = requestAnimationFrame(frame);
        };
        raf = requestAnimationFrame(frame);
        return () => {
          alive = false;
          cancelAnimationFrame(raf);
          el.replaceChildren();
        };
      }, [attack]);
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          ref: layer,
          className: "mt-magic",
          "aria-hidden": "true",
          "data-math-attack": ""
        }
      );
    }
    function InlineMathFallback({ text }) {
      const s = String(text), sup = { "\xB2": "2", "\xB3": "3", "\u2074": "4", "\xB9": "1", "\u2070": "0" };
      return /* @__PURE__ */ React.createElement("span", { className: "fxm" }, Array.from(s).map(
        (ch, i) => ch === "x" ? /* @__PURE__ */ React.createElement("span", { key: i, className: "fxm-v" }, "x") : sup[ch] ? /* @__PURE__ */ React.createElement("sup", { key: i, className: "fxm-sup" }, sup[ch]) : ["+", "-", "\u2212"].includes(ch) ? /* @__PURE__ */ React.createElement(
          "span",
          {
            key: i,
            className: i > 0 && !s.slice(0, i).trim().endsWith("(") ? "fxm-op" : void 0
          },
          ch === "-" ? "\u2212" : ch
        ) : ch === " " ? null : /* @__PURE__ */ React.createElement("span", { key: i }, ch)
      ));
    }
    function mathBounds(text) {
      const boxes = [text.getBoundingClientRect()];
      const walker = document.createTreeWalker(text, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const range = document.createRange();
        range.selectNodeContents(walker.currentNode);
        boxes.push(...range.getClientRects());
      }
      return {
        left: Math.min(...boxes.map((r) => r.left)),
        right: Math.max(...boxes.map((r) => r.right)),
        top: Math.min(...boxes.map((r) => r.top)),
        bottom: Math.max(...boxes.map((r) => r.bottom))
      };
    }
    function TowerTarget({ TargetCard, ...props }) {
      const wrapper = useRef(null);
      useEffect(() => {
        let live = true, raf;
        const fit = () => {
          if (!live) return;
          const box = wrapper.current.querySelector(".v7-poly"), text = box.querySelector(".fxm");
          text.style.fontSize = "";
          const base = parseFloat(getComputedStyle(text).fontSize), available = box.getBoundingClientRect();
          let scale = 1;
          for (let i = 0; i < 4; i++) {
            const b = mathBounds(text), ratio = Math.min(
              1,
              (available.width - 12) / (b.right - b.left),
              (available.height - 10) / (b.bottom - b.top)
            );
            if (ratio >= 0.999) break;
            scale *= Math.max(0.01, ratio) * 0.98;
            text.style.fontSize = base * scale + "px";
          }
        };
        const schedule = () => {
          cancelAnimationFrame(raf);
          raf = requestAnimationFrame(fit);
        };
        const observer = new ResizeObserver(schedule);
        observer.observe(wrapper.current);
        observer.observe(wrapper.current.querySelector(".v7-poly"));
        fit();
        document.fonts.ready.then(schedule);
        document.fonts.addEventListener("loadingdone", schedule);
        window.visualViewport?.addEventListener("resize", schedule);
        return () => {
          live = false;
          observer.disconnect();
          cancelAnimationFrame(raf);
          document.fonts.removeEventListener("loadingdone", schedule);
          window.visualViewport?.removeEventListener("resize", schedule);
        };
      }, [props.poly, props.level]);
      return /* @__PURE__ */ React.createElement("div", { ref: wrapper, className: "mt-target-wrap" }, /* @__PURE__ */ React.createElement(TargetCard, { ...props }));
    }
    function Victory({ outcome, onNext, background }) {
      const [skip, setSkip] = useState(false), rank = outcome.rank;
      const stats = [
        ["\u6B63\u7B54\u7387", Math.round(outcome.accuracy * 100) + "%"],
        ["\u30DF\u30B9", outcome.misses],
        ["\u6642\u9593\u5207\u308C", outcome.timeouts],
        ["\u6700\u5927\u30B3\u30F3\u30DC", outcome.bestCombo],
        ["\u6B8B\u308AHP", outcome.hp],
        ["\u6575\u6B8BHP", outcome.enemyRemaining.toFixed(1)]
      ];
      return /* @__PURE__ */ React.createElement(
        "section",
        {
          className: "mt-victory" + (skip ? " mt-victory-skip" : ""),
          "data-victory-rank": rank,
          style: {
            backgroundImage: background ? `linear-gradient(#081331b8,#081331ed),url("${background}")` : void 0
          }
        },
        /* @__PURE__ */ React.createElement("div", { className: "mt-victory-burst", "aria-hidden": "true" }),
        /* @__PURE__ */ React.createElement("div", { className: "mt-victory-stars", "aria-hidden": "true" }, Array.from(
          { length: rank === "S" ? 24 : rank === "A" ? 16 : 8 },
          (_, i) => /* @__PURE__ */ React.createElement(
            "i",
            {
              key: i,
              style: {
                left: i * 37 % 100 + "%",
                top: i * 23 % 90 + "%",
                animationDelay: i % 5 * 0.06 + "s"
              }
            },
            "\u2726"
          )
        )),
        /* @__PURE__ */ React.createElement("div", { className: "mt-victory-content" }, /* @__PURE__ */ React.createElement("p", { className: "mt-victory-title", "aria-hidden": "true" }, "VICTORY"), /* @__PURE__ */ React.createElement("h2", null, "\u52DD\u5229\uFF01 ", rank), /* @__PURE__ */ React.createElement("div", { className: "mt-victory-rank", "aria-hidden": "true" }, rank), /* @__PURE__ */ React.createElement("dl", { className: "mt-victory-stats" }, stats.map(([label, value], i) => /* @__PURE__ */ React.createElement(
          "div",
          {
            key: label,
            style: { animationDelay: 0.15 + i * 0.06 + "s" }
          },
          /* @__PURE__ */ React.createElement("dt", null, label),
          /* @__PURE__ */ React.createElement("dd", null, value)
        ))), /* @__PURE__ */ React.createElement(Button, { className: "mt-button mt-victory-next", onClick: onNext }, "\u7269\u8A9E\u306E\u7D9A\u304D\u3092\u898B\u308B"), /* @__PURE__ */ React.createElement(
          "button",
          {
            className: "mt-victory-skip-button",
            onClick: () => setSkip(true)
          },
          "\u6F14\u51FA\u3092\u30B9\u30AD\u30C3\u30D7"
        ))
      );
    }
    function Book({ c, p, onClose, closing }) {
      const [tab, setTab] = useState("notes"), [sort, setSort] = useState("floor"), [filter, setFilter] = useState("all"), [zoom, setZoom] = useState(null), [zoomError, setZoomError] = useState(false), [imageStates, setImageStates] = useState({}), [scale, setScale] = useState(1), [pan, setPan] = useState({ x: 0, y: 0 });
      useEffect(() => {
        let live = true;
        const images = [];
        for (const [f, id] of Object.entries(c.floors)) {
          const char = c.characters[id];
          if (!p.seen[f] || !char.image || char.revealKey && !p.reveal[char.revealKey])
            continue;
          const image = new Image();
          images.push(image);
          let done = false;
          const settle = (state) => {
            if (live && !done) {
              done = true;
              setImageStates((prev) => ({ ...prev, [id]: state }));
            }
          };
          image.onload = () => settle("ready");
          image.onerror = () => settle("error");
          image.src = char.image;
          if (image.complete && image.naturalWidth > 0) settle("ready");
        }
        return () => {
          live = false;
          for (const image of images) {
            image.onload = null;
            image.onerror = null;
          }
        };
      }, [c, p.seen, p.reveal]);
      const drag = useRef(null);
      let floors = Object.keys(c.floors).map(Number).filter((f) => p.seen[f]);
      if (filter === "boss") floors = floors.filter((f) => f === 5);
      if (filter === "alive") floors = floors.filter((f) => !p.kills[f]);
      floors.sort(
        (a, b) => sort === "name" ? name(c, c.floors[a], p.reveal).localeCompare(
          name(c, c.floors[b], p.reveal),
          "ja"
        ) : sort === "count" ? (p.kills[b] || 0) - (p.kills[a] || 0) : a - b
      );
      return /* @__PURE__ */ React.createElement("section", { className: "mt-panel", "data-math-book": true }, /* @__PURE__ */ React.createElement("h2", null, "\u6570\u7406\u306E\u66F8"), /* @__PURE__ */ React.createElement(Button, { disabled: closing, onClick: onClose }, "\u3068\u3058\u308B"), /* @__PURE__ */ React.createElement("nav", null, /* @__PURE__ */ React.createElement(Button, { onClick: () => setTab("notes") }, "\u5B66\u7FD2\u8A18\u9332"), /* @__PURE__ */ React.createElement(Button, { onClick: () => setTab("monsters") }, "\u56F3\u9451"), /* @__PURE__ */ React.createElement(Button, { onClick: () => setTab("journal") }, "\u5192\u967A\u65E5\u8A8C")), tab === "notes" && c.notes.filter((n) => p.notes[n.floor] && !n.fragment).map((n) => /* @__PURE__ */ React.createElement("article", { key: n.floor }, /* @__PURE__ */ React.createElement("h3", null, n.title), /* @__PURE__ */ React.createElement("p", null, n.law), (n.formulas || []).map((f, i) => /* @__PURE__ */ React.createElement("p", { key: i }, f)), /* @__PURE__ */ React.createElement("p", null, n.point))), tab === "notes" && !Object.keys(p.notes).length && /* @__PURE__ */ React.createElement("p", null, "\u5192\u967A\u3092\u9032\u3081\u308B\u3068\u8A18\u9332\u304C\u5897\u3048\u307E\u3059\u3002"), tab === "notes" && p.fragment && /* @__PURE__ */ React.createElement("article", null, /* @__PURE__ */ React.createElement("h3", null, c.fragment.title, "\u300C", c.fragment.name, "\u300D"), /* @__PURE__ */ React.createElement("p", null, c.fragment.law)), tab === "journal" && /* @__PURE__ */ React.createElement("article", null, /* @__PURE__ */ React.createElement("h3", null, "\u7B2C1\u7AE0"), Object.entries(p.difficulties).map(([d, x]) => /* @__PURE__ */ React.createElement("p", { key: d }, d.toUpperCase(), "\uFF1A", x.best, "/5\u968E ", x.records[5] ? "\u7AE0\u30AF\u30EA\u30A2" : "")), Object.entries(p.difficulties).flatMap(
        ([d, x]) => Object.entries(x.records).filter(([, r]) => r != null).map(([floor, r]) => /* @__PURE__ */ React.createElement("p", { key: d + floor }, d.toUpperCase(), " \u7B2C", floor, "\u968E\uFF1A\u6700\u9AD8", r.rank, " \u30FB \u6B63\u7B54\u7387", Math.round(r.accuracy * 100), "%"))
      ), /* @__PURE__ */ React.createElement("h3", null, "\u6700\u8FD1\u306E\u6226\u7E3E"), Object.entries(p.history).filter(([, r]) => r != null).sort(([, a], [, b]) => b.at - a.at).slice(0, 10).map(([id, r]) => /* @__PURE__ */ React.createElement("p", { key: id }, String(r.difficulty || "").toUpperCase(), " \u7B2C", r.floor, "\u968E \u30FB", " ", r.mode === "replay" ? "\u518D\u6311\u6226" : "\u672C\u7DE8", " \u30FB", " ", r.rank || "\u6557\u5317")), p.reward && /* @__PURE__ */ React.createElement("p", null, "\u96F6\u5149\u306E\u63A2\u7D22\u8005\uFF08\u5148\u751F\u8A66\u904A\u306E\u8A18\u9332\uFF09")), tab === "monsters" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("label", null, "\u4E26\u3079\u66FF\u3048", /* @__PURE__ */ React.createElement("select", { value: sort, onChange: (e) => setSort(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "floor" }, "\u968E\u9806"), /* @__PURE__ */ React.createElement("option", { value: "name" }, "\u540D\u524D"), /* @__PURE__ */ React.createElement("option", { value: "count" }, "\u8A0E\u4F10\u6570"))), /* @__PURE__ */ React.createElement("label", null, "\u7D5E\u308A\u8FBC\u307F", /* @__PURE__ */ React.createElement(
        "select",
        {
          value: filter,
          onChange: (e) => setFilter(e.target.value)
        },
        /* @__PURE__ */ React.createElement("option", { value: "all" }, "\u3059\u3079\u3066"),
        /* @__PURE__ */ React.createElement("option", { value: "boss" }, "\u30DC\u30B9"),
        /* @__PURE__ */ React.createElement("option", { value: "alive" }, "\u672A\u8A0E\u4F10")
      )), floors.map((f) => {
        const id = c.floors[f], char = c.characters[id];
        return /* @__PURE__ */ React.createElement("article", { key: f }, /* @__PURE__ */ React.createElement("h3", null, f, "\u968E ", name(c, id, p.reveal)), imageStates[id] === "ready" && /* @__PURE__ */ React.createElement(
          Button,
          {
            className: "mt-button mt-image-button",
            onClick: () => {
              setZoomError(false);
              setZoom(char.image);
              setScale(1);
              setPan({ x: 0, y: 0 });
            }
          },
          /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true" }, "\u25A7 "),
          "\u753B\u50CF\u3092\u898B\u308B"
        ), imageStates[id] === "error" && /* @__PURE__ */ React.createElement("p", null, "\u753B\u50CF\u306F\u73FE\u5728\u8868\u793A\u3067\u304D\u307E\u305B\u3093\u3002"), /* @__PURE__ */ React.createElement("p", null, "\u8A0E\u4F10 ", p.kills[f] || 0, "\u56DE"), p.kills[f] > 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("p", null, (c.monsters[id] || {}).nature), /* @__PURE__ */ React.createElement("p", null, (c.monsters[id] || {}).motif)));
      })), zoom && /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "mt-zoom",
          role: "dialog",
          "aria-modal": "true",
          "aria-label": "\u30E2\u30F3\u30B9\u30BF\u30FC\u753B\u50CF"
        },
        /* @__PURE__ */ React.createElement(Button, { onClick: () => setZoom(null) }, "\u2715 \u753B\u50CF\u3092\u9589\u3058\u308B"),
        /* @__PURE__ */ React.createElement("label", null, "\u62E1\u5927", /* @__PURE__ */ React.createElement(
          "input",
          {
            "aria-label": "\u753B\u50CF\u306E\u500D\u7387",
            type: "range",
            min: "1",
            max: "3",
            step: "0.1",
            value: scale,
            onChange: (e) => setScale(Number(e.target.value))
          }
        )),
        zoomError && /* @__PURE__ */ React.createElement("p", { role: "alert" }, "\u753B\u50CF\u3092\u8AAD\u307F\u8FBC\u3081\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u9589\u3058\u3066\u304B\u3089\u518D\u5EA6\u304A\u8A66\u3057\u304F\u3060\u3055\u3044\u3002"),
        /* @__PURE__ */ React.createElement(
          "div",
          {
            onPointerDown: (e) => {
              drag.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
              e.currentTarget.setPointerCapture(e.pointerId);
            },
            onPointerMove: (e) => {
              if (drag.current)
                setPan({
                  x: e.clientX - drag.current.x,
                  y: e.clientY - drag.current.y
                });
            },
            onPointerUp: () => drag.current = null
          },
          /* @__PURE__ */ React.createElement(
            "img",
            {
              alt: "\u30E2\u30F3\u30B9\u30BF\u30FC\u753B\u50CF",
              onError: () => setZoomError(true),
              src: zoom,
              draggable: "false",
              style: {
                transform: `translate(${pan.x}px,${pan.y}px) scale(${scale})`
              }
            }
          )
        )
      ));
    }
    root.MathTowerFactory = function(H) {
      const { BattleBoard, TargetCard, HpBar } = H;
      MathRenderer = H.MathText || InlineMathFallback;
      function Tile({ acct, onOpen }) {
        const fb = H.useFbReady(), [allowed, setAllowed] = useState(false);
        useEffect(() => {
          setAllowed(false);
          if (!fb.ready || !acct || acct.guest) return;
          let live = true;
          Store.access(H.FB.db, H.FB.uid, acct).then(() => live && setAllowed(true)).catch(() => {
          });
          const path = Store.BASE + "/access/" + acct.key;
          const fn = () => Store.access(H.FB.db, H.FB.uid, acct).then(() => live && setAllowed(true)).catch(() => live && setAllowed(false));
          H.FB.db.ref(path).on("value", fn, () => live && setAllowed(false));
          return () => {
            live = false;
            H.FB.db.ref(path).off("value", fn);
          };
        }, [fb.ready, acct && acct.key]);
        if (!allowed) return null;
        return /* @__PURE__ */ React.createElement("button", { className: "v7-tile v7-cur", onClick: onOpen }, /* @__PURE__ */ React.createElement("div", { className: "top" }, /* @__PURE__ */ React.createElement("span", { className: "v7-ico" }, "\u{1F4D6}"), /* @__PURE__ */ React.createElement("span", { className: "v7-badge" }, "\u5148\u751F\u8A66\u904A")), /* @__PURE__ */ React.createElement("b", null, "\u6570\u5B66\u306E\u5854"), /* @__PURE__ */ React.createElement("span", { className: "s" }, "\u5192\u967A\u3092\u59CB\u3081\u308B"));
      }
      function App({ acct, onExit }) {
        const fb = H.useFbReady(), [loaded, setLoaded] = useState(null), [error, setError] = useState(""), [screen, setScreen] = useState("loading"), [difficulty, setDifficulty] = useState("normal"), [floor, setFloor] = useState(1), [events, setEvents] = useState([]), [battle, setBattle] = useState(null), [prob, setProb] = useState(null), [paused, setPaused] = useState(false), [flash, setFlash] = useState({}), [notice, setNotice] = useState(""), [seconds, setSeconds] = useState(0), [muted, setMuted] = H.useGameMute(), [outcome, setOutcome] = useState(null), [saving, setSaving] = useState(false), [recovering, setRecovering] = useState(false), [playMode, setPlayMode] = useState("adventure"), [attack, setAttack] = useState(null), [impact, setImpact] = useState(null), [cutin, setCutin] = useState(null);
        const data = useRef(null), bref = useRef(null), screenRef = useRef(screen), pausedRef = useRef(false), pending = useRef(null), afterStory = useRef(null), storyBusy = useRef(false), actionBusy = useRef(false), seen = useRef(/* @__PURE__ */ new Set()), clock = useRef(Date.now()), runId = useRef(""), guard = useRef(false), sound = H.useBattleSound(muted), life = useRef(true), writer = useRef(null), recoveryBusy = useRef(false), acctRef = useRef(acct), attackRef = useRef(null), cutinRef = useRef(null), explained = useRef(/* @__PURE__ */ new Set()), animationTimer = useRef(null);
        acctRef.current = acct;
        screenRef.current = screen;
        pausedRef.current = paused;
        cutinRef.current = cutin;
        const explain = (info) => {
          if (!explained.current.has(info.id)) {
            explained.current.add(info.id);
            cutinRef.current = info;
            setCutin(info);
          }
        };
        useEffect(() => () => clearTimeout(animationTimer.current), []);
        const setData = (v) => {
          data.current = v;
          setLoaded(v);
        };
        if (!writer.current)
          writer.current = Store.createWriter({
            read: () => {
              if (!data.current || data.current.key !== acctRef.current.key)
                throw Error("\u8A18\u9332\u306E\u8AAD\u307F\u8FBC\u307F\u304C\u5B8C\u4E86\u3057\u3066\u3044\u307E\u305B\u3093");
              return data.current.progress;
            },
            write: (p) => Store.save(H.FB.db, H.FB.uid, acctRef.current, p),
            commit: (p) => {
              setData({ ...data.current, progress: p });
              setError("");
            },
            busy: setSaving,
            live: () => life.current
          });
        const persist = (change) => writer.current.enqueue(change, true);
        const recover = async () => {
          if (recoveryBusy.current || writer.current.isBusy()) return;
          recoveryBusy.current = true;
          setRecovering(true);
          setPaused(true);
          sound.bgm(false);
          try {
            await writer.current.idle();
            const latest = await Store.load(H.FB.db, H.FB.uid, acctRef.current);
            if (!life.current) return;
            R.validatePolicy(latest.content.policy);
            writer.current.reset(latest.progress);
            pending.current = null;
            afterStory.current = null;
            guard.current = false;
            bref.current = null;
            setBattle(null);
            setProb(null);
            setEvents([]);
            setData(latest);
            setError("");
            attackRef.current = null;
            setAttack(null);
            setCutin(null);
            cutinRef.current = null;
            guard.current = false;
            setScreen("home");
          } catch (e) {
            if (life.current) setError(e.message);
          } finally {
            recoveryBusy.current = false;
            if (life.current) setRecovering(false);
          }
        };
        const recoveryPanel = error && /* @__PURE__ */ React.createElement("section", { className: "mt-recovery", role: "alert" }, /* @__PURE__ */ React.createElement("p", null, error), /* @__PURE__ */ React.createElement("p", null, "\u6700\u65B0\u306E\u8A18\u9332\u3092\u8AAD\u307F\u8FBC\u3080\u3068\u3001\u672A\u4FDD\u5B58\u306E\u9032\u884C\u30FB\u6226\u95D8\u7D50\u679C\u306F\u5931\u308F\u308C\u308B\u53EF\u80FD\u6027\u304C\u3042\u308A\u307E\u3059\u3002\u4FDD\u5B58\u6E08\u307F\u306E\u8A18\u9332\u306F\u524A\u9664\u3057\u307E\u305B\u3093\u3002"), (screen === "story" || screen === "savingResult") && /* @__PURE__ */ React.createElement(
          Button,
          {
            disabled: saving || recovering,
            onClick: () => screen === "story" ? storyDone() : retrySave()
          },
          "\u4FDD\u5B58\u3092\u518D\u8A66\u884C"
        ), /* @__PURE__ */ React.createElement(Button, { disabled: saving || recovering, onClick: recover }, "\u6700\u65B0\u306E\u8A18\u9332\u3092\u8AAD\u307F\u8FBC\u3080"), /* @__PURE__ */ React.createElement(
          Button,
          {
            onClick: () => {
              sound.bgm(false);
              onExit();
            }
          },
          "\u30BF\u30A4\u30C8\u30EB\u3078\u623B\u308B"
        ));
        useEffect(() => {
          life.current = true;
          if (!fb.ready) return;
          let live = true;
          const fail = () => {
            if (!live) return;
            data.current = null;
            setLoaded(null);
            setScreen("denied");
            setError(
              "\u8A66\u904A\u6A29\u9650\u3092\u78BA\u8A8D\u3067\u304D\u307E\u305B\u3093\u3002\u5148\u751F\u30A2\u30AB\u30A6\u30F3\u30C8\u3067\u518D\u30ED\u30B0\u30A4\u30F3\u3057\u3066\u304F\u3060\u3055\u3044\u3002"
            );
          };
          Store.load(H.FB.db, H.FB.uid, acct).then((x) => {
            if (!live) return;
            R.validatePolicy(x.content.policy);
            writer.current.reset(x.progress);
            setData(x);
            setScreen("home");
          }).catch((e) => {
            if (live) {
              setError(e.message);
              setScreen("denied");
            }
          });
          if (acct && !acct.guest) {
            const ref = H.FB.db.ref(Store.BASE + "/access/" + acct.key);
            const fn = () => Store.access(H.FB.db, H.FB.uid, acct).catch(fail);
            ref.on("value", fn, fail);
            return () => {
              live = false;
              life.current = false;
              ref.off("value", fn);
            };
          }
          return () => {
            live = false;
            life.current = false;
          };
        }, [fb.ready, acct && acct.key]);
        useEffect(() => {
          const hide = () => {
            if (document.hidden && screenRef.current === "battle")
              setPaused(true);
          };
          document.addEventListener("visibilitychange", hide);
          return () => document.removeEventListener("visibilitychange", hide);
        }, []);
        useEffect(() => {
          sound.bgm(screen === "battle" && !paused && !cutin);
          return () => sound.bgm(false);
        }, [screen, paused, muted, cutin]);
        useEffect(() => {
          if (!saving) return;
          const timer = setTimeout(() => {
            if (life.current)
              setError(
                "\u4FDD\u5B58\u306E\u5FDC\u7B54\u3092\u5F85\u3063\u3066\u3044\u307E\u3059\u3002\u901A\u4FE1\u72B6\u614B\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002\u901A\u4FE1\u5FA9\u5E30\u5F8C\u306B\u4FDD\u5B58\u304C\u5B8C\u4E86\u3059\u308B\u5834\u5408\u304C\u3042\u308A\u307E\u3059\u3002"
              );
          }, 1e4);
          return () => clearTimeout(timer);
        }, [saving]);
        const content = loaded && loaded.content, progress = loaded && loaded.progress;
        useEffect(() => {
          if (screen !== "battle") return;
          const fit = () => document.querySelectorAll(".mt-board [data-btile] > .fxm").forEach((text) => {
            text.style.fontSize = "";
            const base = parseFloat(getComputedStyle(text).fontSize), width = text.getBoundingClientRect().width, parent = text.parentElement;
            const available = parent.clientWidth - 10;
            if (width > available && available > 0)
              text.style.fontSize = base * available / width + "px";
          });
          const observer = new ResizeObserver(fit);
          document.querySelectorAll(".mt-board [data-btile]").forEach((x) => observer.observe(x));
          fit();
          document.fonts.ready.then(() => life.current && fit());
          return () => observer.disconnect();
        }, [screen, prob]);
        const updateBattle = (n) => {
          bref.current = n;
          setBattle(n);
        };
        const mk = (lv) => {
          const board = H.buildBoard(lv, seen.current, 6);
          return { level: lv, family: H.patternOf(lv, board.factors), ...board };
        };
        const showStory = (ids, next) => {
          const x = data.current;
          const list = ids.map((id) => x.content.events.find((e) => e.id === id)).filter(Boolean);
          if (!list.length) {
            next();
            return;
          }
          afterStory.current = next;
          setEvents(list);
          setScreen("story");
        };
        const markRead = (id, rev) => {
          const p = R.copy(data.current.progress);
          p.read[id] = true;
          p.reveal = { ...p.reveal, ...rev };
          setData({ ...data.current, progress: p });
        };
        const storyDone = async () => {
          if (writer.current.isBusy() || storyBusy.current) return;
          storyBusy.current = true;
          try {
            setError("");
            await persist((p) => p);
            await afterStory.current();
          } catch (e) {
            setError(e.message);
          } finally {
            storyBusy.current = false;
          }
        };
        const prepare = (f) => {
          setFloor(f);
          setScreen("prepare");
        };
        const continueAdventure = (chosen = difficulty) => {
          const adventure = data.current.progress.adventures[chosen];
          if (!adventure) return;
          setDifficulty(chosen);
          setPlayMode("adventure");
          setFloor(adventure.floor);
          if (adventure.phase === "post") {
            showPost(adventure.floor, chosen, "adventure");
            return;
          }
          if (adventure.phase === "cleared") {
            setScreen("chapterEnd");
            return;
          }
          if (adventure.hp <= 0) {
            setScreen("restart");
            return;
          }
          prepare(adventure.floor);
        };
        const newAdventure = async (chosen) => {
          if (writer.current.isBusy()) return;
          try {
            await persist((p) => R.startAdventure(p, chosen, Date.now()));
            setDifficulty(chosen);
            setPlayMode("adventure");
            prepare(1);
          } catch (e) {
            setError(e.message);
          }
        };
        const start = async () => {
          if (writer.current.isBusy() || guard.current) return;
          guard.current = true;
          setError("");
          try {
            await persist((p) => {
              p.startedAt = p.startedAt || Date.now();
              p.seen[floor] = true;
              if (playMode === "adventure")
                p.adventures[difficulty].phase = "battle";
              return p;
            });
            const begin = () => {
              seen.current = /* @__PURE__ */ new Set();
              const s = R.begin(
                floor,
                difficulty,
                playMode === "replay" ? 100 : data.current.progress.adventures[difficulty].hp,
                content.policy
              );
              runId.current = crypto.randomUUID();
              updateBattle(s);
              setProb(mk(1));
              clock.current = Date.now();
              setSeconds(Math.ceil(content.policy.problemMs / 1e3));
              setPaused(false);
              setOutcome(null);
              setNotice("");
              explained.current = /* @__PURE__ */ new Set();
              setScreen("battle");
              if (floor === 5)
                explain({
                  id: "nul",
                  title: "\u96F6\u306E\u756A\u4EBA\u30CC\u30EB",
                  text: `\u80FD\u529B\uFF1A\u8AA4\u7B54\u30C0\u30E1\u30FC\u30B82\u500D\uFF08HP \u2212${content.policy.miss * 2}\uFF09\u3002\u6642\u9593\u5207\u308C\u306FHP \u2212${content.policy.timeout}\u3067\u3059\u3002`
                });
              else if (difficulty === "hard")
                explain({
                  id: "hard-rule",
                  title: "HARD\u306E\u6483\u7834\u6761\u4EF6",
                  text: "\u6575HP\u3092\u524A\u308A\u5207\u308A\u3001Lv8\u4EE5\u4E0A\u306E\u554F\u984C\u306B\u6B63\u89E3\u3059\u308B\u3068\u6483\u7834\u3067\u304D\u307E\u3059\u3002"
                });
            };
            const ids = [];
            if (floor === 1) {
              if (!data.current.progress.read.prologue) ids.push("prologue");
              ids.push("1-chapter");
            }
            ids.push(floor + "-pre");
            showStory(ids, begin);
          } catch (e) {
            setError(e.message);
          } finally {
            guard.current = false;
          }
        };
        const finish = async (s) => {
          if (pending.current) return;
          const attempt = {
            s,
            id: runId.current,
            at: Date.now(),
            mode: playMode
          };
          pending.current = attempt;
          setOutcome(R.result(s, content.policy));
          setScreen("savingResult");
          try {
            await persist(
              (p) => R.complete(
                p,
                attempt.s,
                content.policy,
                attempt.id,
                attempt.at,
                attempt.mode
              )
            );
            pending.current = null;
            setScreen("result");
          } catch (e) {
            setError(e.message);
          }
        };
        const retrySave = async () => {
          if (writer.current.isBusy() || !pending.current) return;
          const attempt = pending.current;
          try {
            await persist(
              (p) => R.complete(
                p,
                attempt.s,
                content.policy,
                attempt.id,
                attempt.at,
                attempt.mode
              )
            );
            pending.current = null;
            setError("");
            setScreen("result");
          } catch (e) {
            setError(e.message);
          }
        };
        useEffect(() => {
          if (screen !== "battle" || paused || attack || cutin) return;
          const timer = setInterval(() => {
            const s = bref.current;
            if (!s || s.won || s.hp <= 0 || guard.current || cutinRef.current)
              return;
            setSeconds(
              Math.max(
                0,
                Math.ceil(
                  (content.policy.problemMs - (Date.now() - clock.current)) / 1e3
                )
              )
            );
            if (Date.now() - clock.current >= content.policy.problemMs) {
              const n = R.timeout(s, content.policy);
              updateBattle(n);
              clock.current = Date.now();
              setNotice("\u6642\u9593\u5207\u308C\uFF1A\u540C\u3058\u554F\u984C\u3092\u7D9A\u3051\u307E\u3059");
              if (n.hp <= 0) finish(n);
            }
          }, 100);
          return () => clearInterval(timer);
        }, [screen, paused, content, attack, cutin]);
        const match = (a, b) => {
          if (screenRef.current !== "battle" || pausedRef.current || guard.current || cutinRef.current)
            return;
          const s = bref.current, t1 = prob.tiles.find((t) => t.id === a), t2 = prob.tiles.find((t) => t.id === b);
          if (!t1 || !t2) return;
          guard.current = true;
          const ok = H.polyEqual(H.multiply(t1.factor, t2.factor), prob.poly), n = R.answer(s, ok, Date.now() - clock.current, content.policy);
          setFlash({
            [a]: ok ? "correct" : "wrong",
            [b]: ok ? "correct" : "wrong"
          });
          if (ok) {
            const nodes = [a, b].map(
              (id) => document.querySelector('[data-btile="' + id + '"]')
            );
            const fx = {
              ids: [a, b],
              cards: nodes.map((node) => ({
                html: node.innerHTML,
                rect: node.getBoundingClientRect().toJSON()
              })),
              next: n,
              damage: n.damage - s.damage
            };
            attackRef.current = fx;
            setAttack(fx);
          } else {
            sound.play("miss");
            updateBattle(n);
            setNotice("\u8AA4\u7B54\uFF1A\u540C\u3058\u30EC\u30D9\u30EB\u3067\u518D\u6311\u6226");
            if (n.hp <= 0) {
              guard.current = false;
              finish(n);
              return;
            }
            setProb(mk(n.lv));
            clock.current = Date.now();
            animationTimer.current = setTimeout(() => {
              guard.current = false;
              if (life.current) setFlash({});
            }, 180);
          }
        };
        const hitEnemy = () => {
          const fx = attackRef.current;
          if (!fx || screenRef.current !== "battle") return;
          attackRef.current = null;
          setAttack(null);
          updateBattle(fx.next);
          setImpact({ id: runId.current + fx.next.correct, damage: fx.damage });
          sound.play("ok");
          setNotice(`\u6B63\u89E3\uFF01 \u30B3\u30F3\u30DC\xD7${R.COMBO[Math.min(3, fx.next.combo - 1)]}`);
          animationTimer.current = setTimeout(() => {
            if (!life.current || screenRef.current !== "battle") return;
            setImpact(null);
            setFlash({});
            guard.current = false;
            if (fx.next.won) {
              finish(fx.next);
              return;
            }
            setProb(mk(fx.next.lv));
            clock.current = Date.now();
            setSeconds(Math.ceil(content.policy.problemMs / 1e3));
            if (difficulty === "hard" && floor !== 5 && fx.next.damage >= 8 && !fx.next.solvedHigh)
              explain({
                id: "hard-remaining",
                title: "\u3042\u3068\u4E00\u6B69\uFF01",
                text: "\u6575HP\u306F0\u3067\u3059\u3002Lv8\u4EE5\u4E0A\u306E\u554F\u984C\u3078\u306E\u6B63\u89E3\u3067\u6483\u7834\u3067\u304D\u307E\u3059\u3002"
              });
          }, 110);
        };
        const resume = () => {
          if (attackRef.current || guard.current) {
            setPaused(false);
            return;
          }
          let next = null;
          for (let i = 0; i < 200; i++) {
            const candidate = mk(bref.current.lv);
            if (candidate.family === prob.family && !H.polyEqual(candidate.poly, prob.poly)) {
              next = candidate;
              break;
            }
          }
          if (!next) {
            setError(
              "\u540C\u7CFB\u7D71\u306E\u5225\u554F\u984C\u3092\u4F5C\u308C\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u30DD\u30FC\u30BA\u306E\u307E\u307E\u518D\u8A66\u884C\u3057\u3066\u304F\u3060\u3055\u3044\u3002"
            );
            return;
          }
          setError("");
          setProb(next);
          clock.current = Date.now();
          setNotice("\u540C\u7A0B\u5EA6\u306E\u5225\u554F\u984C\u3067\u518D\u958B");
          setSeconds(Math.ceil(content.policy.problemMs / 1e3));
          setPaused(false);
        };
        const restart = () => playMode === "replay" ? prepare(floor) : newAdventure(difficulty);
        const exit = () => {
          sound.bgm(false);
          onExit();
        };
        const showPost = (f, chosen = difficulty, mode = playMode) => showStory(
          [f + "-post", ...f === 5 ? ["5-epilogue"] : []],
          async () => {
            try {
              if (mode === "adventure")
                await persist((p) => R.finishStory(p, chosen));
              setScreen(
                mode === "adventure" && f === 5 ? "chapterEnd" : "afterFloor"
              );
            } catch (e) {
              setError(e.message);
            }
          }
        );
        const post = () => showPost(floor);
        const chooseAfterFloor = async (next) => {
          if (actionBusy.current || writer.current.isBusy() || screenRef.current !== "afterFloor")
            return;
          actionBusy.current = true;
          try {
            await persist((p) => p);
            if (next === "next") continueAdventure(difficulty);
            else setScreen(next);
          } catch (e) {
            setError(e.message);
          } finally {
            actionBusy.current = false;
          }
        };
        if (!loaded)
          return /* @__PURE__ */ React.createElement("section", { className: "mt-panel" }, /* @__PURE__ */ React.createElement("h2", null, "\u6570\u5B66\u306E\u5854"), /* @__PURE__ */ React.createElement("p", { role: "alert" }, error || "\u6A29\u9650\u3092\u78BA\u8A8D\u3057\u3066\u3044\u307E\u3059\u2026"), /* @__PURE__ */ React.createElement(Button, { onClick: exit }, "\u30BF\u30A4\u30C8\u30EB\u3078"));
        if (screen === "story")
          return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
            Story,
            {
              key: events.map((x) => x.id).join(","),
              events,
              content,
              progress,
              hero: acct.name,
              onRead: markRead,
              onDone: storyDone
            }
          ), recoveryPanel, error && /* @__PURE__ */ React.createElement("div", { className: "mt-error" }, /* @__PURE__ */ React.createElement("p", null, error), /* @__PURE__ */ React.createElement(Button, { disabled: saving, onClick: storyDone }, "\u4FDD\u5B58\u3092\u518D\u8A66\u884C")));
        const d = progress.adventures[difficulty] || { hp: 100, floor: 1 }, enemy = content.characters[content.floors[floor]] || {};
        return /* @__PURE__ */ React.createElement(
          "main",
          {
            className: "mt-app" + (screen === "battle" ? " mt-battle-app" : screen === "result" && outcome?.rank ? " mt-result-app" : ""),
            "data-math-screen": screen,
            "data-time-stopped": paused || !!attack || !!cutin || !!impact
          },
          /* @__PURE__ */ React.createElement("header", null, /* @__PURE__ */ React.createElement("h1", null, "\u6570\u5B66\u306E\u5854"), /* @__PURE__ */ React.createElement("span", null, "\u5148\u751F\u8A66\u904A\u30FB\u7B2C1\u7AE0"), /* @__PURE__ */ React.createElement(Button, { disabled: saving, onClick: exit }, "\u30BF\u30A4\u30C8\u30EB\u3078")),
          recoveryPanel,
          screen === "home" && /* @__PURE__ */ React.createElement("section", { className: "mt-panel" }, /* @__PURE__ */ React.createElement("h2", null, "\u7B2C1\u7AE0"), /* @__PURE__ */ React.createElement("p", null, content.title), /* @__PURE__ */ React.createElement("nav", { className: "mt-adventure-menu" }, /* @__PURE__ */ React.createElement(Button, { onClick: () => setScreen("newSelect") }, "\u306F\u3058\u3081\u304B\u3089"), /* @__PURE__ */ React.createElement(Button, { onClick: () => setScreen("continueSelect") }, "\u7D9A\u304D\u304B\u3089"), /* @__PURE__ */ React.createElement(
            Button,
            {
              onClick: () => {
                setPlayMode("replay");
                setScreen("floorSelect");
              }
            },
            "\u30AF\u30EA\u30A2\u3057\u305F\u968E\u3092\u9078\u3076"
          )), /* @__PURE__ */ React.createElement(
            Button,
            {
              onClick: () => {
                const p = R.copy(data.current.progress);
                p.newInfo = {};
                setData({ ...data.current, progress: p });
                setScreen("book");
              }
            },
            "\u6570\u7406\u306E\u66F8",
            Object.keys(progress.newInfo || {}).length ? " NEW" : ""
          ), progress.read.prologue && /* @__PURE__ */ React.createElement(
            Button,
            {
              onClick: () => showStory(["prologue"], () => setScreen("home"))
            },
            "\u30D7\u30ED\u30ED\u30FC\u30B0\u3092\u8AAD\u307F\u8FD4\u3059"
          ), progress.migrationBackup && /* @__PURE__ */ React.createElement(Button, { onClick: () => setScreen("migrationBackup") }, "\u79FB\u884C\u524D\u306E\u8A18\u9332\u30FB\u5FA9\u65E7"), /* @__PURE__ */ React.createElement("p", null, "\u8A66\u904A\u8A18\u9332\u306F\u30E9\u30F3\u30AD\u30F3\u30B0\u30FB\u5B66\u7FD2\u5C65\u6B74\u30FB\u516C\u5F0F\u79F0\u53F7\u3078\u53CD\u6620\u3055\u308C\u307E\u305B\u3093\u3002")),
          screen === "migrationBackup" && /* @__PURE__ */ React.createElement("section", { className: "mt-panel" }, /* @__PURE__ */ React.createElement("h2", null, "\u79FB\u884C\u524D\u306E\u8A18\u9332\u30FB\u5FA9\u65E7"), /* @__PURE__ */ React.createElement("p", null, "\u521D\u56DE\u79FB\u884C\u524D\u306E\u8A18\u9332\u3092\u4FDD\u5B58\u3067\u304D\u307E\u3059\u3002\u500B\u4EBA\u306E\u8A66\u904A\u8A18\u9332\u306E\u305F\u3081\u516C\u958B\u3057\u306A\u3044\u3067\u304F\u3060\u3055\u3044\u3002"), /* @__PURE__ */ React.createElement(
            Button,
            {
              onClick: () => {
                const url = URL.createObjectURL(
                  new Blob(
                    [JSON.stringify(progress.migrationBackup, null, 2)],
                    { type: "application/json" }
                  )
                );
                const a = document.createElement("a");
                a.href = url;
                a.download = "math-tower-before-migration.json";
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 1e3);
              }
            },
            "\u30D0\u30C3\u30AF\u30A2\u30C3\u30D7\u3092\u4FDD\u5B58"
          ), Object.keys(R.migrate(progress.migrationBackup).adventures).map(
            (chosen) => /* @__PURE__ */ React.createElement(
              Button,
              {
                key: chosen,
                onClick: () => {
                  setDifficulty(chosen);
                  setScreen("restoreConfirm");
                }
              },
              chosen.toUpperCase(),
              "\u306E\u79FB\u884C\u524D\u306E\u5192\u967A\u3092\u5FA9\u5143"
            )
          ), /* @__PURE__ */ React.createElement("p", null, "\u5FA9\u5143\u306F\u9078\u3093\u3060\u96E3\u6613\u5EA6\u306E\u9032\u884C\u4E2D\u306E\u5192\u967A\u3060\u3051\u3092\u623B\u3057\u307E\u3059\u3002\u79FB\u884C\u5F8C\u306E\u56F3\u9451\u30FB\u5B66\u7FD2\u8A18\u9332\u30FB\u30AF\u30EA\u30A2\u5C65\u6B74\u30FB\u6700\u9AD8\u8A55\u4FA1\u306F\u6D88\u3057\u307E\u305B\u3093\u3002"), /* @__PURE__ */ React.createElement(Button, { onClick: () => setScreen("home") }, "\u623B\u308B")),
          screen === "restoreConfirm" && /* @__PURE__ */ React.createElement("section", { className: "mt-panel", role: "dialog", "aria-modal": "true" }, /* @__PURE__ */ React.createElement("h2", null, "\u79FB\u884C\u524D\u306E", difficulty.toUpperCase(), "\u306E\u5192\u967A\u3092\u5FA9\u5143\u3057\u307E\u3059\u304B\uFF1F"), /* @__PURE__ */ React.createElement("p", null, "\u3053\u306E\u96E3\u6613\u5EA6\u306E\u73FE\u5728\u306E\u5192\u967A\u3092\u7F6E\u304D\u63DB\u3048\u307E\u3059\u3002\u307B\u304B\u306E\u5192\u967A\u3084\u6C38\u7D9A\u8A18\u9332\u306F\u305D\u306E\u307E\u307E\u3067\u3059\u3002"), /* @__PURE__ */ React.createElement(
            Button,
            {
              disabled: saving,
              onClick: async () => {
                try {
                  await persist((p) => R.restoreAdventure(p, difficulty));
                  setScreen("home");
                } catch (e) {
                  setError(e.message);
                }
              }
            },
            "\u78BA\u8A8D\u3057\u3066\u5FA9\u5143"
          ), /* @__PURE__ */ React.createElement(Button, { onClick: () => setScreen("migrationBackup") }, "\u30AD\u30E3\u30F3\u30BB\u30EB")),
          ["newSelect", "continueSelect", "replaySelect"].includes(screen) && /* @__PURE__ */ React.createElement("section", { className: "mt-panel" }, /* @__PURE__ */ React.createElement("h2", null, screen === "newSelect" ? "\u306F\u3058\u3081\u304B\u3089" : screen === "continueSelect" ? "\u7D9A\u304D\u304B\u3089" : `${floor}\u968E\u306E\u518D\u6311\u6226`), Object.keys(R.CAPS).map((chosen) => {
            const a = progress.adventures[chosen];
            return /* @__PURE__ */ React.createElement("article", { key: chosen }, /* @__PURE__ */ React.createElement("h3", null, chosen.toUpperCase()), /* @__PURE__ */ React.createElement("p", { "data-adventure": chosen }, !a ? "\u30C7\u30FC\u30BF\u306A\u3057" : a.phase === "cleared" ? "\u7B2C1\u7AE0\u30AF\u30EA\u30A2" : `\u7B2C${a.floor}\u968E${a.phase === "post" ? "\u306E\u4F1A\u8A71\u304B\u3089" : a.phase === "defeated" ? "\u30FB\u6557\u5317\uFF08\u518D\u958B\u59CB\uFF09" : "\u304B\u3089\u518D\u958B"} \u30FB HP ${a.hp}`), /* @__PURE__ */ React.createElement(
              Button,
              {
                disabled: saving || screen === "continueSelect" && !a,
                onClick: () => {
                  if (screen === "continueSelect")
                    continueAdventure(chosen);
                  else if (screen === "replaySelect") {
                    setDifficulty(chosen);
                    setPlayMode("replay");
                    prepare(floor);
                  } else {
                    setDifficulty(chosen);
                    if (a) setScreen("replaceConfirm");
                    else newAdventure(chosen);
                  }
                }
              },
              chosen.toUpperCase(),
              "\u3092\u9078\u3076"
            ));
          }), /* @__PURE__ */ React.createElement(Button, { onClick: () => setScreen("home") }, "\u623B\u308B")),
          screen === "replaceConfirm" && /* @__PURE__ */ React.createElement("section", { className: "mt-panel", role: "dialog", "aria-modal": "true" }, /* @__PURE__ */ React.createElement("h2", null, difficulty.toUpperCase(), "\u306E\u5192\u967A\u3092\u7F6E\u304D\u63DB\u3048\u307E\u3059\u304B\uFF1F"), /* @__PURE__ */ React.createElement("p", null, "\u3053\u306E\u96E3\u6613\u5EA6\u306E\u9032\u884C\u4E2D\u306E\u5192\u967A\u3060\u3051\u3092\u7B2C1\u968E\u30FBHP100\u3067\u7F6E\u304D\u63DB\u3048\u307E\u3059\u3002\u4ED6\u306E\u96E3\u6613\u5EA6\u3001\u30AF\u30EA\u30A2\u5C65\u6B74\u3001\u56F3\u9451\u3001\u5B66\u7FD2\u8A18\u9332\u3001\u6700\u9AD8\u8A55\u4FA1\u306F\u6B8B\u308A\u307E\u3059\u3002"), /* @__PURE__ */ React.createElement(
            Button,
            {
              disabled: saving,
              onClick: () => newAdventure(difficulty)
            },
            "\u7F6E\u304D\u63DB\u3048\u3066\u958B\u59CB"
          ), /* @__PURE__ */ React.createElement(Button, { onClick: () => setScreen("newSelect") }, "\u30AD\u30E3\u30F3\u30BB\u30EB")),
          screen === "floorSelect" && /* @__PURE__ */ React.createElement("section", { className: "mt-panel" }, /* @__PURE__ */ React.createElement("h2", null, "\u30AF\u30EA\u30A2\u3057\u305F\u968E\u3092\u9078\u3076"), /* @__PURE__ */ React.createElement("p", null, "\u518D\u6311\u6226\u306FHP100\u304B\u3089\u958B\u59CB\u3002\u672C\u7DE8\u306E\u5192\u967A\u306E\u9032\u884C\u30FBHP\u306F\u5909\u66F4\u3057\u307E\u305B\u3093\u3002"), [1, 2, 3, 4, 5].map((f) => /* @__PURE__ */ React.createElement(
            Button,
            {
              key: f,
              disabled: !progress.clearedFloors[f],
              onClick: () => {
                setFloor(f);
                setScreen("replaySelect");
              }
            },
            f,
            "\u968E",
            !progress.clearedFloors[f] ? " \u672A\u89E3\u653E" : ""
          )), /* @__PURE__ */ React.createElement(Button, { onClick: () => setScreen("home") }, "\u623B\u308B")),
          screen === "prepare" && /* @__PURE__ */ React.createElement("section", { className: "mt-panel" }, /* @__PURE__ */ React.createElement("h2", null, floor, "\u968E\u306E\u6E96\u5099"), /* @__PURE__ */ React.createElement("p", null, "HP ", playMode === "replay" ? 100 : d.hp, " \u30FB", " ", difficulty.toUpperCase(), " \u30FB", " ", playMode === "replay" ? "\u72EC\u7ACB\u3057\u305F\u518D\u6311\u6226" : "\u672C\u7DE8\u306E\u5192\u967A"), floor === 1 && /* @__PURE__ */ React.createElement("p", { className: "mt-instructions" }, "6\u679A\u304B\u3089\u3001\u639B\u3051\u5408\u308F\u305B\u308B\u3068\u4E0A\u306E\u5F0F\u306B\u306A\u308B2\u679A\u3092\u9078\u3073\u307E\u3059\u30021\u679A\u3092\u62BC\u3057\u305F\u307E\u307E\u3001\u3082\u30461\u679A\u3078\u7DDA\u3092\u5F15\u3044\u3066\u6307\uFF08\u30DE\u30A6\u30B9\uFF09\u3092\u96E2\u3057\u3066\u304F\u3060\u3055\u3044\u3002"), progress.seen[floor] && /* @__PURE__ */ React.createElement("p", null, name(content, content.floors[floor], progress.reveal)), /* @__PURE__ */ React.createElement(Button, { disabled: saving, onClick: start }, "\u8A66\u7DF4\u3092\u958B\u59CB"), /* @__PURE__ */ React.createElement(Button, { onClick: () => setScreen("home") }, "\u623B\u308B")),
          screen === "battle" && battle && /* @__PURE__ */ React.createElement("section", { className: "mt-battle" }, /* @__PURE__ */ React.createElement(
            "div",
            {
              className: "mt-enemy" + (impact ? " mt-enemy-hit" : ""),
              style: {
                backgroundImage: `url("${content.backgrounds["f0" + floor].image}")`
              }
            },
            /* @__PURE__ */ React.createElement("h2", null, name(content, content.floors[floor], progress.reveal)),
            /* @__PURE__ */ React.createElement(
              "img",
              {
                src: enemy.image,
                alt: name(content, content.floors[floor], progress.reveal)
              }
            ),
            impact && /* @__PURE__ */ React.createElement("div", { className: "mt-impact", key: impact.id, "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("span", null, "\u2212", impact.damage.toFixed(1))),
            /* @__PURE__ */ React.createElement(
              HpBar,
              {
                v7: true,
                height: 18,
                hp: Math.max(
                  0,
                  (floor === 5 ? content.policy.bossUnits : 8) - battle.damage
                ) / (floor === 5 ? content.policy.bossUnits : 8) * 100
              }
            )
          ), /* @__PURE__ */ React.createElement("div", { className: "mt-controls", "data-math-family": prob.family }, /* @__PURE__ */ React.createElement("div", { className: "mt-battle-toolbar" }, /* @__PURE__ */ React.createElement("span", null, "HP ", battle.hp), /* @__PURE__ */ React.createElement("span", null, "\u6B8B\u308A ", seconds, "\u79D2"), /* @__PURE__ */ React.createElement("span", null, "\u30B3\u30F3\u30DC ", battle.combo), /* @__PURE__ */ React.createElement(
            "button",
            {
              className: "mt-icon",
              "aria-label": "\u30DD\u30FC\u30BA",
              disabled: !!impact,
              "aria-pressed": paused,
              onClick: () => setPaused(true)
            },
            "\u2161"
          ), /* @__PURE__ */ React.createElement(
            "button",
            {
              className: "mt-icon",
              "aria-label": muted ? "\u97F3\u3092\u51FA\u3059" : "\u6D88\u97F3",
              "aria-pressed": muted,
              onClick: () => setMuted(!muted)
            },
            muted ? "\u{1F507}" : "\u{1F50A}"
          )), /* @__PURE__ */ React.createElement(HpBar, { hp: battle.hp, height: 16, label: false, v7: true }), /* @__PURE__ */ React.createElement("div", { className: "mt-battle-notice", role: "status" }, notice), /* @__PURE__ */ React.createElement(
            TowerTarget,
            {
              TargetCard,
              poly: prob.poly,
              level: prob.level,
              qLabel: battle.correct + "\u6B63\u89E3",
              gaugeKey: clock.current,
              gaugeMs: content.policy.problemMs,
              v7: true
            }
          ), /* @__PURE__ */ React.createElement("div", { className: "mt-board" }, /* @__PURE__ */ React.createElement(
            BattleBoard,
            {
              tiles: prob.tiles,
              onMatch: match,
              disabled: paused || saving || !!attack || !!impact || !!cutin,
              flash,
              v7: true
            }
          ))), attack && /* @__PURE__ */ React.createElement(
            MagicAttack,
            {
              attack,
              paused,
              onImpact: hitEnemy
            }
          ), cutin && /* @__PURE__ */ React.createElement(
            CutIn,
            {
              info: cutin,
              onConfirm: () => {
                setCutin(null);
                cutinRef.current = null;
                clock.current = Date.now();
                setSeconds(Math.ceil(content.policy.problemMs / 1e3));
              }
            }
          ), paused && /* @__PURE__ */ React.createElement("div", { className: "mt-overlay" }, /* @__PURE__ */ React.createElement("h2", null, "\u30DD\u30FC\u30BA"), /* @__PURE__ */ React.createElement("p", null, "HP\u30FB\u30B3\u30F3\u30DC\u306F\u305D\u306E\u307E\u307E\u3001\u540C\u7A0B\u5EA6\u306E\u5225\u554F\u984C\u3067\u518D\u958B\u3057\u307E\u3059\u3002"), /* @__PURE__ */ React.createElement(Button, { onClick: resume }, "\u518D\u958B"))),
          screen === "savingResult" && /* @__PURE__ */ React.createElement("section", { className: "mt-panel" }, /* @__PURE__ */ React.createElement("h2", null, "\u7D50\u679C\u3092\u4FDD\u5B58\u3057\u3066\u3044\u307E\u3059"), error && /* @__PURE__ */ React.createElement(Button, { disabled: saving, onClick: retrySave }, "\u4FDD\u5B58\u3092\u518D\u8A66\u884C")),
          screen === "result" && outcome && (outcome.rank ? /* @__PURE__ */ React.createElement(
            Victory,
            {
              outcome,
              onNext: post,
              background: content.backgrounds["f0" + floor].image
            }
          ) : /* @__PURE__ */ React.createElement("section", { className: "mt-panel" }, /* @__PURE__ */ React.createElement("h2", null, "\u6557\u5317"), /* @__PURE__ */ React.createElement("p", null, "\u6B63\u7B54\u7387 ", Math.round(outcome.accuracy * 100), "% \u30FB \u30DF\u30B9", " ", outcome.misses, " \u30FB \u6642\u9593\u5207\u308C ", outcome.timeouts), /* @__PURE__ */ React.createElement("p", null, "\u6700\u5927\u30B3\u30F3\u30DC ", outcome.bestCombo, " \u30FB HP ", outcome.hp, " \u30FB \u6575\u6B8BHP", " ", outcome.enemyRemaining.toFixed(1)), /* @__PURE__ */ React.createElement(Button, { onClick: () => setScreen("restart") }, "\u518D\u6311\u6226"))),
          screen === "restart" && /* @__PURE__ */ React.createElement("section", { className: "mt-panel" }, /* @__PURE__ */ React.createElement("h2", null, playMode === "replay" ? "\u540C\u3058\u968E\u306E\u518D\u6311\u6226" : "\u7AE0\u306E\u518D\u6311\u6226"), /* @__PURE__ */ React.createElement("p", null, playMode === "replay" ? "\u672C\u7DE8\u306E\u4FDD\u5B58\u306F\u305D\u306E\u307E\u307E\u3001\u3053\u306E\u968E\u3092HP100\u3067\u518D\u6311\u6226\u3057\u307E\u3059\u3002" : "\u3053\u306E\u96E3\u6613\u5EA6\u306E\u5192\u967A\u3060\u3051\u30921\u968E\u30FBHP100\u3067\u518D\u958B\u3057\u307E\u3059\u3002\u904E\u53BB\u306E\u30E9\u30F3\u30AF\u3068\u65E2\u8AAD\u306F\u6B8B\u308A\u307E\u3059\u3002"), /* @__PURE__ */ React.createElement(Button, { disabled: saving, onClick: restart }, playMode === "replay" ? "\u3053\u306E\u968E\u3092\u518D\u6311\u6226" : "\u7B2C1\u7AE0\u3092\u518D\u958B\u59CB"), /* @__PURE__ */ React.createElement(Button, { onClick: () => setScreen("home") }, "\u30DB\u30FC\u30E0\u3078")),
          screen === "afterFloor" && /* @__PURE__ */ React.createElement("section", { className: "mt-panel", "data-math-after-floor": true }, /* @__PURE__ */ React.createElement("h2", null, "\u7B2C", floor, "\u968E\u30AF\u30EA\u30A2"), /* @__PURE__ */ React.createElement("p", null, "\u8A18\u9332\u3092\u4FDD\u5B58\u3057\u307E\u3057\u305F\u3002"), playMode === "adventure" ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("p", null, difficulty.toUpperCase(), " \u30FB HP ", d.hp, " \u30FB \u6B21\u306F\u7B2C", d.floor, "\u968E"), /* @__PURE__ */ React.createElement(
            Button,
            {
              disabled: saving || recovering,
              onClick: () => chooseAfterFloor("next")
            },
            "\u6B21\u306E\u968E\u3078\u9032\u3080"
          )) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("p", null, "\u518D\u6311\u6226\u306E\u6226\u7E3E\u3092\u8A18\u9332\u3057\u307E\u3057\u305F\u3002\u672C\u7DE8\u306E\u5192\u967A\u306F\u4FDD\u6301\u3055\u308C\u3066\u3044\u307E\u3059\u3002"), /* @__PURE__ */ React.createElement(
            Button,
            {
              disabled: saving || recovering,
              onClick: () => chooseAfterFloor("floorSelect")
            },
            "\u30AF\u30EA\u30A2\u3057\u305F\u968E\u3092\u9078\u3076"
          )), /* @__PURE__ */ React.createElement(
            Button,
            {
              disabled: saving || recovering,
              onClick: () => chooseAfterFloor("home")
            },
            "\u6570\u5B66\u306E\u5854\u30E1\u30CB\u30E5\u30FC\u3078\u623B\u308B"
          )),
          screen === "chapterEnd" && /* @__PURE__ */ React.createElement("section", { className: "mt-panel" }, /* @__PURE__ */ React.createElement("h2", null, "\u7B2C1\u7AE0\u30AF\u30EA\u30A2"), /* @__PURE__ */ React.createElement("p", null, "\u7B2C\u4E00\u306E\u65AD\u7247\u3092\u6570\u7406\u306E\u66F8\u306B\u8A18\u9332\u3057\u307E\u3057\u305F\u3002"), /* @__PURE__ */ React.createElement("p", null, "\u96F6\u5149\u306E\u63A2\u7D22\u8005\uFF08\u8A66\u904A\u8A18\u9332\u30FB\u516C\u5F0F\u79F0\u53F7\u306B\u306F\u672A\u53CD\u6620\uFF09"), /* @__PURE__ */ React.createElement("p", null, "\u7D9A\u304D\u306F\u5236\u4F5C\u4E2D\u3067\u3059\u3002"), /* @__PURE__ */ React.createElement(Button, { onClick: () => setScreen("home") }, "\u30DB\u30FC\u30E0\u3078"), /* @__PURE__ */ React.createElement(Button, { disabled: saving, onClick: restart }, "\u7B2C1\u7AE0\u3092\u518D\u6311\u6226")),
          screen === "book" && /* @__PURE__ */ React.createElement(
            Book,
            {
              c: content,
              p: progress,
              closing: saving,
              onClose: () => persist((p) => p).then(() => setScreen("home")).catch((e) => setError(e.message))
            }
          )
        );
      }
      return { App, Tile, CutIn, Target: TowerTarget, Victory };
    };
  })(window);
})();
