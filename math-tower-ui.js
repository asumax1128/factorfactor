(() => {
  (function(root) {
    const { useState, useEffect, useRef } = React, R = root.MathTowerRules, Store = root.MathTowerStore;
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
      const active = l.who;
      let sceneStart = 0;
      for (let j = 0; j <= li; j++) if (lines[j].bg) sceneStart = j;
      const visible = lines.slice(sceneStart, li + 1).filter(
        (x) => content.characters[x.who] && content.characters[x.who].image
      ).map((x) => x.who);
      if (["plus", "minus"].includes(active)) visible.push("plus", "minus");
      const ids = [...new Set(visible)].slice(-3);
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
          style: {
            backgroundImage: background.image ? `linear-gradient(#09133344,#09133388),url("${background.image}")` : void 0,
            backgroundPosition: background.focus || "50% 50%"
          }
        },
        /* @__PURE__ */ React.createElement("header", null, /* @__PURE__ */ React.createElement("span", null, ev.title || ""), progress.read[ev.id] && /* @__PURE__ */ React.createElement(
          Button,
          {
            onClick: () => {
              if (ei + 1 < events.length) {
                setEi(ei + 1);
                setLi(0);
              } else onDone();
            }
          },
          "\u65E2\u8AAD\u3092\u30B9\u30AD\u30C3\u30D7"
        )),
        /* @__PURE__ */ React.createElement("div", { className: "mt-stage mt-fx-" + (l.fx || "none") }, ids.map((id) => /* @__PURE__ */ React.createElement(
          "img",
          {
            key: id,
            alt: name(content, id, reveal),
            src: content.characters[id].image,
            style: {
              filter: active === id ? "none" : "brightness(.65)",
              maxWidth: ids.length > 1 ? "42%" : "75%"
            }
          }
        )), !ids.length && /* @__PURE__ */ React.createElement("span", { className: "mt-symbol" }, ["book", "bookopen"].includes(l.fx) ? "\u{1F4D6}" : l.kind === "math" ? text : "\u2726"), l.kind === "title" && /* @__PURE__ */ React.createElement("h2", { className: "mt-title" }, text)),
        /* @__PURE__ */ React.createElement("button", { className: "mt-dialog", onClick: next, "data-math-dialog": true }, /* @__PURE__ */ React.createElement("strong", null, speaker), /* @__PURE__ */ React.createElement("p", null, text), /* @__PURE__ */ React.createElement("small", null, "\u30BF\u30C3\u30D7\u3067\u6B21\u3078 \u25BC"))
      );
    }
    function Book({ c, p, onClose }) {
      const [tab, setTab] = useState("notes"), [sort, setSort] = useState("floor"), [filter, setFilter] = useState("all"), [zoom, setZoom] = useState(null), [scale, setScale] = useState(1), [pan, setPan] = useState({ x: 0, y: 0 });
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
      return /* @__PURE__ */ React.createElement("section", { className: "mt-panel", "data-math-book": true }, /* @__PURE__ */ React.createElement("h2", null, "\u6570\u7406\u306E\u66F8"), /* @__PURE__ */ React.createElement(Button, { onClick: onClose }, "\u3068\u3058\u308B"), /* @__PURE__ */ React.createElement("nav", null, /* @__PURE__ */ React.createElement(Button, { onClick: () => setTab("notes") }, "\u5B66\u7FD2\u8A18\u9332"), /* @__PURE__ */ React.createElement(Button, { onClick: () => setTab("monsters") }, "\u56F3\u9451"), /* @__PURE__ */ React.createElement(Button, { onClick: () => setTab("journal") }, "\u5192\u967A\u65E5\u8A8C")), tab === "notes" && c.notes.filter((n) => p.notes[n.floor] && !n.fragment).map((n) => /* @__PURE__ */ React.createElement("article", { key: n.floor }, /* @__PURE__ */ React.createElement("h3", null, n.title), /* @__PURE__ */ React.createElement("p", null, n.law), (n.formulas || []).map((f, i) => /* @__PURE__ */ React.createElement("p", { key: i }, f)), /* @__PURE__ */ React.createElement("p", null, n.point))), tab === "notes" && !Object.keys(p.notes).length && /* @__PURE__ */ React.createElement("p", null, "\u5192\u967A\u3092\u9032\u3081\u308B\u3068\u8A18\u9332\u304C\u5897\u3048\u307E\u3059\u3002"), tab === "notes" && p.fragment && /* @__PURE__ */ React.createElement("article", null, /* @__PURE__ */ React.createElement("h3", null, c.fragment.title, "\u300C", c.fragment.name, "\u300D"), /* @__PURE__ */ React.createElement("p", null, c.fragment.law)), tab === "journal" && /* @__PURE__ */ React.createElement("article", null, /* @__PURE__ */ React.createElement("h3", null, "\u7B2C1\u7AE0"), Object.entries(p.difficulties).map(([d, x]) => /* @__PURE__ */ React.createElement("p", { key: d }, d.toUpperCase(), "\uFF1A", x.best, "/5\u968E ", x.records[5] ? "\u7AE0\u30AF\u30EA\u30A2" : "")), p.reward && /* @__PURE__ */ React.createElement("p", null, "\u96F6\u5149\u306E\u63A2\u7D22\u8005\uFF08\u5148\u751F\u8A66\u904A\u306E\u8A18\u9332\uFF09")), tab === "monsters" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("label", null, "\u4E26\u3079\u66FF\u3048", /* @__PURE__ */ React.createElement("select", { value: sort, onChange: (e) => setSort(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "floor" }, "\u968E\u9806"), /* @__PURE__ */ React.createElement("option", { value: "name" }, "\u540D\u524D"), /* @__PURE__ */ React.createElement("option", { value: "count" }, "\u8A0E\u4F10\u6570"))), /* @__PURE__ */ React.createElement("label", null, "\u7D5E\u308A\u8FBC\u307F", /* @__PURE__ */ React.createElement(
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
        return /* @__PURE__ */ React.createElement("article", { key: f }, /* @__PURE__ */ React.createElement("h3", null, f, "\u968E ", name(c, id, p.reveal)), /* @__PURE__ */ React.createElement(
          Button,
          {
            onClick: () => {
              setZoom(char.image);
              setScale(1);
              setPan({ x: 0, y: 0 });
            }
          },
          "\u753B\u50CF\u3092\u62E1\u5927"
        ), /* @__PURE__ */ React.createElement("p", null, "\u8A0E\u4F10 ", p.kills[f] || 0, "\u56DE"), p.kills[f] > 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("p", null, (c.monsters[id] || {}).nature), /* @__PURE__ */ React.createElement("p", null, (c.monsters[id] || {}).motif)));
      })), zoom && /* @__PURE__ */ React.createElement("div", { className: "mt-zoom" }, /* @__PURE__ */ React.createElement(Button, { onClick: () => setZoom(null) }, "\u3068\u3058\u308B"), /* @__PURE__ */ React.createElement("label", null, "\u62E1\u5927", /* @__PURE__ */ React.createElement(
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
      )), /* @__PURE__ */ React.createElement(
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
            alt: "\u62E1\u5927\u753B\u50CF",
            src: zoom,
            draggable: "false",
            style: {
              transform: `translate(${pan.x}px,${pan.y}px) scale(${scale})`
            }
          }
        )
      )));
    }
    root.MathTowerFactory = function(H) {
      const { BattleBoard, TargetCard, HpBar } = H;
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
        const fb = H.useFbReady(), [loaded, setLoaded] = useState(null), [error, setError] = useState(""), [screen, setScreen] = useState("loading"), [difficulty, setDifficulty] = useState("normal"), [floor, setFloor] = useState(1), [events, setEvents] = useState([]), [battle, setBattle] = useState(null), [prob, setProb] = useState(null), [paused, setPaused] = useState(false), [flash, setFlash] = useState({}), [notice, setNotice] = useState(""), [seconds, setSeconds] = useState(0), [muted, setMuted] = useState(false), [outcome, setOutcome] = useState(null), [saving, setSaving] = useState(false);
        const data = useRef(null), bref = useRef(null), screenRef = useRef(screen), pausedRef = useRef(false), pending = useRef(null), afterStory = useRef(null), seen = useRef(/* @__PURE__ */ new Set()), clock = useRef(Date.now()), runId = useRef(""), guard = useRef(false), sound = H.useBattleSound(muted), life = useRef(true), queue = useRef(Promise.resolve());
        screenRef.current = screen;
        pausedRef.current = paused;
        const setData = (v) => {
          data.current = v;
          setLoaded(v);
        };
        const persist = async (progress2) => {
          const operation = async () => {
            if (!life.current) throw Error("\u753B\u9762\u304C\u9589\u3058\u3089\u308C\u307E\u3057\u305F");
            setSaving(true);
            const saved = await Store.save(H.FB.db, H.FB.uid, acct, {
              ...progress2,
              revision: data.current.progress.revision
            });
            if (life.current) setData({ ...data.current, progress: saved });
            return saved;
          };
          const job = queue.current.then(operation);
          queue.current = job.catch(() => {
          });
          try {
            return await job;
          } finally {
            if (life.current) setSaving(false);
          }
        };
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
          sound.bgm(screen === "battle" && !paused);
          return () => sound.bgm(false);
        }, [screen, paused, muted]);
        const content = loaded && loaded.content, progress = loaded && loaded.progress;
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
          try {
            await persist(data.current.progress);
            afterStory.current();
          } catch (e) {
            setError(e.message);
          }
        };
        const prepare = (f) => {
          setFloor(f);
          setScreen("prepare");
        };
        const continueAdventure = () => {
          const pd = data.current.progress.pendingStory;
          if (pd) {
            setFloor(pd.floor);
            setDifficulty(pd.difficulty);
            showPost(pd.floor);
            return;
          }
          const d2 = data.current.progress.difficulties[difficulty];
          if (d2.best >= 5) {
            setScreen("chapterEnd");
            return;
          }
          if (d2.hp <= 0) {
            setScreen("restart");
            return;
          }
          prepare(d2.best + 1);
        };
        const start = async () => {
          if (saving || guard.current) return;
          guard.current = true;
          setError("");
          try {
            const p = R.copy(data.current.progress);
            p.startedAt = p.startedAt || Date.now();
            p.seen[floor] = true;
            await persist(p);
            const begin = () => {
              seen.current = /* @__PURE__ */ new Set();
              const s = R.begin(
                floor,
                difficulty,
                data.current.progress.difficulties[difficulty].hp,
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
              setScreen("battle");
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
          const p = R.complete(
            data.current.progress,
            s,
            content.policy,
            runId.current,
            Date.now()
          );
          pending.current = { p, s };
          setOutcome(R.result(s, content.policy));
          setScreen("savingResult");
          try {
            await persist(p);
            pending.current = null;
            setScreen("result");
          } catch (e) {
            setError(e.message);
          }
        };
        const retrySave = async () => {
          try {
            await persist(pending.current.p);
            pending.current = null;
            setError("");
            setScreen("result");
          } catch (e) {
            setError(e.message);
          }
        };
        useEffect(() => {
          if (screen !== "battle" || paused) return;
          const timer = setInterval(() => {
            const s = bref.current;
            if (!s || s.won || s.hp <= 0) return;
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
        }, [screen, paused, content]);
        const match = (a, b) => {
          if (screenRef.current !== "battle" || pausedRef.current || guard.current)
            return;
          const s = bref.current, t1 = prob.tiles.find((t) => t.id === a), t2 = prob.tiles.find((t) => t.id === b);
          if (!t1 || !t2) return;
          guard.current = true;
          const ok = H.polyEqual(H.multiply(t1.factor, t2.factor), prob.poly), n = R.answer(s, ok, Date.now() - clock.current, content.policy);
          updateBattle(n);
          setFlash({
            [a]: ok ? "correct" : "wrong",
            [b]: ok ? "correct" : "wrong"
          });
          sound.play(ok ? "ok" : "miss");
          setNotice(
            ok ? `\u6B63\u89E3\uFF01 \u30B3\u30F3\u30DC\xD7${R.COMBO[Math.min(3, n.combo - 1)]}` : s.floor === 5 ? "\u53CD\u6483\uFF01 \u8AA4\u7B54\u30C0\u30E1\u30FC\u30B8\u5897\u52A0" : "\u8AA4\u7B54\uFF1A\u540C\u3058\u30EC\u30D9\u30EB\u3067\u518D\u6311\u6226"
          );
          if (n.won || n.hp <= 0) {
            guard.current = false;
            finish(n);
            return;
          }
          setProb(mk(n.lv));
          clock.current = Date.now();
          setTimeout(() => {
            guard.current = false;
            if (life.current) setFlash({});
          }, 180);
        };
        const resume = () => {
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
        const restart = async () => {
          try {
            const p = R.copy(data.current.progress);
            p.difficulties[difficulty] = {
              ...p.difficulties[difficulty],
              best: 0,
              hp: 100
            };
            await persist(p);
            prepare(1);
          } catch (e) {
            setError(e.message);
          }
        };
        const exit = () => {
          sound.bgm(false);
          onExit();
        };
        const showPost = (f) => showStory(
          [f + "-post", ...f === 5 ? ["5-epilogue"] : []],
          async () => {
            try {
              const p = R.copy(data.current.progress);
              delete p.pendingStory;
              await persist(p);
              setScreen(f === 5 ? "chapterEnd" : "home");
            } catch (e) {
              setError(e.message);
            }
          }
        );
        const post = () => showPost(floor);
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
          ), error && /* @__PURE__ */ React.createElement("div", { className: "mt-error" }, /* @__PURE__ */ React.createElement("p", null, error), /* @__PURE__ */ React.createElement(Button, { disabled: saving, onClick: storyDone }, "\u4FDD\u5B58\u3092\u518D\u8A66\u884C")));
        const d = progress.difficulties[difficulty], enemy = content.characters[content.floors[floor]] || {};
        return /* @__PURE__ */ React.createElement("main", { className: "mt-app", "data-math-screen": screen }, /* @__PURE__ */ React.createElement("header", null, /* @__PURE__ */ React.createElement("h1", null, "\u6570\u5B66\u306E\u5854"), /* @__PURE__ */ React.createElement("span", null, "\u5148\u751F\u8A66\u904A\u30FB\u7B2C1\u7AE0"), /* @__PURE__ */ React.createElement(Button, { disabled: saving, onClick: exit }, "\u30BF\u30A4\u30C8\u30EB\u3078")), error && /* @__PURE__ */ React.createElement("p", { className: "mt-error", role: "alert" }, error), screen === "home" && /* @__PURE__ */ React.createElement("section", { className: "mt-panel" }, /* @__PURE__ */ React.createElement("h2", null, "\u7B2C1\u7AE0"), /* @__PURE__ */ React.createElement("p", null, content.title), /* @__PURE__ */ React.createElement("nav", null, Object.keys(R.CAPS).map((x) => /* @__PURE__ */ React.createElement(
          Button,
          {
            key: x,
            "aria-pressed": difficulty === x,
            onClick: () => setDifficulty(x)
          },
          x.toUpperCase()
        ))), /* @__PURE__ */ React.createElement("p", null, "\u9032\u884C ", d.best, "/5\u968E \u30FB HP ", d.hp), /* @__PURE__ */ React.createElement(Button, { disabled: saving, onClick: continueAdventure }, "\u5192\u967A\u3092\u7D9A\u3051\u308B"), /* @__PURE__ */ React.createElement(
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
        ), /* @__PURE__ */ React.createElement("p", null, "\u8A66\u904A\u8A18\u9332\u306F\u30E9\u30F3\u30AD\u30F3\u30B0\u30FB\u5B66\u7FD2\u5C65\u6B74\u30FB\u516C\u5F0F\u79F0\u53F7\u3078\u53CD\u6620\u3055\u308C\u307E\u305B\u3093\u3002")), screen === "prepare" && /* @__PURE__ */ React.createElement("section", { className: "mt-panel" }, /* @__PURE__ */ React.createElement("h2", null, floor, "\u968E\u306E\u6E96\u5099"), /* @__PURE__ */ React.createElement("p", null, "HP ", d.hp, " \u30FB ", difficulty.toUpperCase()), floor === 1 && /* @__PURE__ */ React.createElement("p", { className: "mt-instructions" }, "6\u679A\u304B\u3089\u3001\u639B\u3051\u5408\u308F\u305B\u308B\u3068\u4E0A\u306E\u5F0F\u306B\u306A\u308B2\u679A\u3092\u9078\u3073\u307E\u3059\u30021\u679A\u3092\u62BC\u3057\u305F\u307E\u307E\u3001\u3082\u30461\u679A\u3078\u7DDA\u3092\u5F15\u3044\u3066\u6307\uFF08\u30DE\u30A6\u30B9\uFF09\u3092\u96E2\u3057\u3066\u304F\u3060\u3055\u3044\u3002"), floor === 5 && /* @__PURE__ */ React.createElement("p", { className: "mt-instructions" }, "\u30CC\u30EB\u306E\u80FD\u529B\uFF1A\u8AA4\u7B54\u30C0\u30E1\u30FC\u30B82\u500D\uFF08HP \u2212", content.policy.miss * 2, "\uFF09\u3002\u6642\u9593\u5207\u308C\u306FHP \u2212", content.policy.timeout, "\u3067\u3059\u3002"), difficulty === "hard" && floor !== 5 && /* @__PURE__ */ React.createElement("p", null, "HARD\u306E\u6483\u7834\u6761\u4EF6\uFF1A\u6575HP\u3092\u524A\u308A\u5207\u308A\u3001Lv8\u4EE5\u4E0A\u306E\u554F\u984C\u306B\u6B63\u89E3\u3059\u308B\u3053\u3068\u3002"), progress.seen[floor] && /* @__PURE__ */ React.createElement("p", null, name(content, content.floors[floor], progress.reveal)), /* @__PURE__ */ React.createElement(Button, { disabled: saving, onClick: start }, "\u8A66\u7DF4\u3092\u958B\u59CB"), /* @__PURE__ */ React.createElement(Button, { onClick: () => setScreen("home") }, "\u623B\u308B")), screen === "battle" && battle && /* @__PURE__ */ React.createElement("section", { className: "mt-battle" }, /* @__PURE__ */ React.createElement(
          "div",
          {
            className: "mt-enemy",
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
          /* @__PURE__ */ React.createElement(
            HpBar,
            {
              hp: Math.max(
                0,
                (floor === 5 ? content.policy.bossUnits : 8) - battle.damage
              ) / (floor === 5 ? content.policy.bossUnits : 8) * 100
            }
          ),
          floor === 5 && /* @__PURE__ */ React.createElement("p", null, "\u30CC\u30EB\u306E\u80FD\u529B\uFF1A\u8AA4\u7B54\u30C0\u30E1\u30FC\u30B82\u500D\uFF08HP \u2212", content.policy.miss * 2, "\uFF09")
        ), /* @__PURE__ */ React.createElement("div", { className: "mt-controls", "data-math-family": prob.family }, /* @__PURE__ */ React.createElement(HpBar, { hp: battle.hp }), /* @__PURE__ */ React.createElement("p", null, "HP ", battle.hp, " \u30FB \u6B8B\u308A ", seconds, "\u79D2 \u30FB \u6700\u5927\u30B3\u30F3\u30DC", " ", battle.bestCombo), /* @__PURE__ */ React.createElement("nav", null, /* @__PURE__ */ React.createElement(Button, { onClick: () => setPaused(true) }, "\u30DD\u30FC\u30BA"), /* @__PURE__ */ React.createElement(Button, { onClick: () => setMuted(!muted) }, muted ? "\u97F3\u3092\u51FA\u3059" : "\u6D88\u97F3")), /* @__PURE__ */ React.createElement("p", { role: "status" }, notice || "1\u679A\u3092\u62BC\u3057\u305F\u307E\u307E\u3001\u3082\u30461\u679A\u3078\u7DDA\u3092\u5F15\u3044\u3066\u96E2\u305D\u3046"), difficulty === "hard" && floor !== 5 && battle.damage >= 8 && !battle.solvedHigh && /* @__PURE__ */ React.createElement("p", { className: "mt-instructions", role: "status" }, "\u6575HP\u306F0\u3067\u3059\u3002HARD\u306FLv8\u4EE5\u4E0A\u306E\u6B63\u89E3\u3067\u6483\u7834\u3067\u304D\u307E\u3059\u3002\u3042\u3068\u5C11\u3057\uFF01"), /* @__PURE__ */ React.createElement(
          TargetCard,
          {
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
            disabled: paused || saving,
            flash,
            v7: true
          }
        ))), paused && /* @__PURE__ */ React.createElement("div", { className: "mt-overlay" }, /* @__PURE__ */ React.createElement("h2", null, "\u30DD\u30FC\u30BA"), /* @__PURE__ */ React.createElement("p", null, "HP\u30FB\u30B3\u30F3\u30DC\u306F\u305D\u306E\u307E\u307E\u3001\u540C\u7A0B\u5EA6\u306E\u5225\u554F\u984C\u3067\u518D\u958B\u3057\u307E\u3059\u3002"), /* @__PURE__ */ React.createElement(Button, { onClick: resume }, "\u518D\u958B"))), screen === "savingResult" && /* @__PURE__ */ React.createElement("section", { className: "mt-panel" }, /* @__PURE__ */ React.createElement("h2", null, "\u7D50\u679C\u3092\u4FDD\u5B58\u3057\u3066\u3044\u307E\u3059"), error && /* @__PURE__ */ React.createElement(Button, { disabled: saving, onClick: retrySave }, "\u4FDD\u5B58\u3092\u518D\u8A66\u884C")), screen === "result" && outcome && /* @__PURE__ */ React.createElement("section", { className: "mt-panel" }, /* @__PURE__ */ React.createElement("h2", null, outcome.rank ? "\u52DD\u5229\uFF01 " + outcome.rank : "\u6557\u5317"), /* @__PURE__ */ React.createElement("p", null, "\u6B63\u7B54\u7387 ", Math.round(outcome.accuracy * 100), "% \u30FB \u30DF\u30B9", " ", outcome.misses, " \u30FB \u6642\u9593\u5207\u308C ", outcome.timeouts), /* @__PURE__ */ React.createElement("p", null, "\u6700\u5927\u30B3\u30F3\u30DC ", outcome.bestCombo, " \u30FB HP ", outcome.hp, " \u30FB \u6575\u6B8BHP", " ", outcome.enemyRemaining.toFixed(1)), outcome.rank ? /* @__PURE__ */ React.createElement(Button, { onClick: post }, "\u7269\u8A9E\u306E\u7D9A\u304D\u3092\u898B\u308B") : /* @__PURE__ */ React.createElement(Button, { onClick: () => setScreen("restart") }, "\u518D\u6311\u6226")), screen === "restart" && /* @__PURE__ */ React.createElement("section", { className: "mt-panel" }, /* @__PURE__ */ React.createElement("h2", null, "\u7AE0\u306E\u518D\u6311\u6226"), /* @__PURE__ */ React.createElement("p", null, "\u7AE0\u306E\u9032\u884C\u30921\u968E\u3078\u623B\u3057HP100\u3067\u518D\u958B\u3057\u307E\u3059\u3002\u904E\u53BB\u306E\u30E9\u30F3\u30AF\u3068\u65E2\u8AAD\u306F\u6B8B\u308A\u307E\u3059\u3002"), /* @__PURE__ */ React.createElement(Button, { disabled: saving, onClick: restart }, "\u7B2C1\u7AE0\u3092\u518D\u958B\u59CB"), /* @__PURE__ */ React.createElement(Button, { onClick: () => setScreen("home") }, "\u30DB\u30FC\u30E0\u3078")), screen === "chapterEnd" && /* @__PURE__ */ React.createElement("section", { className: "mt-panel" }, /* @__PURE__ */ React.createElement("h2", null, "\u7B2C1\u7AE0\u30AF\u30EA\u30A2"), /* @__PURE__ */ React.createElement("p", null, "\u7B2C\u4E00\u306E\u65AD\u7247\u3092\u6570\u7406\u306E\u66F8\u306B\u8A18\u9332\u3057\u307E\u3057\u305F\u3002"), /* @__PURE__ */ React.createElement("p", null, "\u96F6\u5149\u306E\u63A2\u7D22\u8005\uFF08\u8A66\u904A\u8A18\u9332\u30FB\u516C\u5F0F\u79F0\u53F7\u306B\u306F\u672A\u53CD\u6620\uFF09"), /* @__PURE__ */ React.createElement("p", null, "\u7D9A\u304D\u306F\u5236\u4F5C\u4E2D\u3067\u3059\u3002"), /* @__PURE__ */ React.createElement(Button, { onClick: () => setScreen("home") }, "\u30DB\u30FC\u30E0\u3078"), /* @__PURE__ */ React.createElement(Button, { disabled: saving, onClick: restart }, "\u7B2C1\u7AE0\u3092\u518D\u6311\u6226")), screen === "book" && /* @__PURE__ */ React.createElement(
          Book,
          {
            c: content,
            p: progress,
            onClose: () => persist(data.current.progress).then(() => setScreen("home")).catch((e) => setError(e.message))
          }
        ));
      }
      return { App, Tile };
    };
  })(window);
})();
