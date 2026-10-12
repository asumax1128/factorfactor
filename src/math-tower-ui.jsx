/* Public UI only. Story text and images are loaded from protected RTDB. */
(function (root) {
  const { useState, useEffect, useRef } = React,
    R = root.MathTowerRules,
    Store = root.MathTowerStore;
  function Button({ children, ...p }) {
    return (
      <button className="mt-button" {...p}>
        {children}
      </button>
    );
  }
  function name(c, id, reveal) {
    const x = c.characters[id] || {};
    return x.revealKey && !reveal[x.revealKey]
      ? x.displayNameBeforeReveal || "？？？"
      : x.short || x.trueName || "";
  }
  const line = (x) =>
    Array.isArray(x) ? { who: x[0], text: x[1], ...(x[2] || {}) } : x;
  function Story({ events, content, progress, hero, onRead, onDone }) {
    const [ei, setEi] = useState(0),
      [li, setLi] = useState(0),
      [reveal, setReveal] = useState(progress.reveal || {}),
      ending = useRef(false);
    const ev = events[ei],
      lines = (ev.lines || []).map(line),
      l = lines[li];
    const text = String(l.text || "")
      .replaceAll("{playerName}", hero)
      .replaceAll("数理の塔", "数学の塔");
    let bg = ev.bg || (ev.floor > 0 ? "f0" + ev.floor : null);
    for (let j = 0; j <= li; j++) if (lines[j].bg) bg = lines[j].bg;
    const active = l.who;
    let sceneStart = 0;
    for (let j = 0; j <= li; j++) if (lines[j].bg) sceneStart = j;
    const visible = lines
      .slice(sceneStart, li + 1)
      .filter(
        (x) => content.characters[x.who] && content.characters[x.who].image,
      )
      .map((x) => x.who);
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
    const speaker =
      active === "hero"
        ? hero
        : active === "narr"
          ? ""
          : l.name || name(content, active, reveal) || "数理の書";
    const background = content.backgrounds[bg] || {};
    return (
      <div
        className="mt-story"
        data-math-story={ev.id}
        style={{
          backgroundImage: background.image
            ? `linear-gradient(#09133344,#09133388),url("${background.image}")`
            : undefined,
          backgroundPosition: background.focus || "50% 50%",
        }}
      >
        <header>
          <span>{ev.title || ""}</span>
          {progress.read[ev.id] && (
            <Button
              onClick={() => {
                if (ei + 1 < events.length) {
                  setEi(ei + 1);
                  setLi(0);
                } else onDone();
              }}
            >
              既読をスキップ
            </Button>
          )}
        </header>
        <div className={"mt-stage mt-fx-" + (l.fx || "none")}>
          {ids.map((id) => (
            <img
              key={id}
              alt={name(content, id, reveal)}
              src={content.characters[id].image}
              style={{
                filter: active === id ? "none" : "brightness(.65)",
                maxWidth: ids.length > 1 ? "42%" : "75%",
              }}
            />
          ))}
          {!ids.length && (
            <span className="mt-symbol">
              {["book", "bookopen"].includes(l.fx)
                ? "📖"
                : l.kind === "math"
                  ? text
                  : "✦"}
            </span>
          )}
          {l.kind === "title" && <h2 className="mt-title">{text}</h2>}
        </div>
        <button className="mt-dialog" onClick={next} data-math-dialog>
          <strong>{speaker}</strong>
          <p>{text}</p>
          <small>タップで次へ ▼</small>
        </button>
      </div>
    );
  }
  function Book({ c, p, onClose }) {
    const [tab, setTab] = useState("notes"),
      [sort, setSort] = useState("floor"),
      [filter, setFilter] = useState("all"),
      [zoom, setZoom] = useState(null),
      [scale, setScale] = useState(1),
      [pan, setPan] = useState({ x: 0, y: 0 });
    const drag = useRef(null);
    let floors = Object.keys(c.floors)
      .map(Number)
      .filter((f) => p.seen[f]);
    if (filter === "boss") floors = floors.filter((f) => f === 5);
    if (filter === "alive") floors = floors.filter((f) => !p.kills[f]);
    floors.sort((a, b) =>
      sort === "name"
        ? name(c, c.floors[a], p.reveal).localeCompare(
            name(c, c.floors[b], p.reveal),
            "ja",
          )
        : sort === "count"
          ? (p.kills[b] || 0) - (p.kills[a] || 0)
          : a - b,
    );
    return (
      <section className="mt-panel" data-math-book>
        <h2>数理の書</h2>
        <Button onClick={onClose}>とじる</Button>
        <nav>
          <Button onClick={() => setTab("notes")}>学習記録</Button>
          <Button onClick={() => setTab("monsters")}>図鑑</Button>
          <Button onClick={() => setTab("journal")}>冒険日誌</Button>
        </nav>
        {tab === "notes" &&
          c.notes
            .filter((n) => p.notes[n.floor] && !n.fragment)
            .map((n) => (
              <article key={n.floor}>
                <h3>{n.title}</h3>
                <p>{n.law}</p>
                {(n.formulas || []).map((f, i) => (
                  <p key={i}>{f}</p>
                ))}
                <p>{n.point}</p>
              </article>
            ))}
        {tab === "notes" && !Object.keys(p.notes).length && (
          <p>冒険を進めると記録が増えます。</p>
        )}
        {tab === "notes" && p.fragment && (
          <article>
            <h3>
              {c.fragment.title}「{c.fragment.name}」
            </h3>
            <p>{c.fragment.law}</p>
          </article>
        )}
        {tab === "journal" && (
          <article>
            <h3>第1章</h3>
            {Object.entries(p.difficulties).map(([d, x]) => (
              <p key={d}>
                {d.toUpperCase()}：{x.best}/5階 {x.records[5] ? "章クリア" : ""}
              </p>
            ))}
            {p.reward && <p>零光の探索者（先生試遊の記録）</p>}
          </article>
        )}
        {tab === "monsters" && (
          <>
            <label>
              並べ替え
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="floor">階順</option>
                <option value="name">名前</option>
                <option value="count">討伐数</option>
              </select>
            </label>
            <label>
              絞り込み
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">すべて</option>
                <option value="boss">ボス</option>
                <option value="alive">未討伐</option>
              </select>
            </label>
            {floors.map((f) => {
              const id = c.floors[f],
                char = c.characters[id];
              return (
                <article key={f}>
                  <h3>
                    {f}階 {name(c, id, p.reveal)}
                  </h3>
                  <Button
                    onClick={() => {
                      setZoom(char.image);
                      setScale(1);
                      setPan({ x: 0, y: 0 });
                    }}
                  >
                    画像を拡大
                  </Button>
                  <p>討伐 {p.kills[f] || 0}回</p>
                  {p.kills[f] > 0 && (
                    <>
                      <p>{(c.monsters[id] || {}).nature}</p>
                      <p>{(c.monsters[id] || {}).motif}</p>
                    </>
                  )}
                </article>
              );
            })}
          </>
        )}
        {zoom && (
          <div className="mt-zoom">
            <Button onClick={() => setZoom(null)}>とじる</Button>
            <label>
              拡大
              <input
                aria-label="画像の倍率"
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
              />
            </label>
            <div
              onPointerDown={(e) => {
                drag.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                if (drag.current)
                  setPan({
                    x: e.clientX - drag.current.x,
                    y: e.clientY - drag.current.y,
                  });
              }}
              onPointerUp={() => (drag.current = null)}
            >
              <img
                alt="拡大画像"
                src={zoom}
                draggable="false"
                style={{
                  transform: `translate(${pan.x}px,${pan.y}px) scale(${scale})`,
                }}
              />
            </div>
          </div>
        )}
      </section>
    );
  }
  root.MathTowerFactory = function (H) {
    const { BattleBoard, TargetCard, HpBar } = H;
    function Tile({ acct, onOpen }) {
      const fb = H.useFbReady(),
        [allowed, setAllowed] = useState(false);
      useEffect(() => {
        setAllowed(false);
        if (!fb.ready || !acct || acct.guest) return;
        let live = true;
        Store.access(H.FB.db, H.FB.uid, acct)
          .then(() => live && setAllowed(true))
          .catch(() => {});
        const path = Store.BASE + "/access/" + acct.key;
        const fn = () =>
          Store.access(H.FB.db, H.FB.uid, acct)
            .then(() => live && setAllowed(true))
            .catch(() => live && setAllowed(false));
        H.FB.db.ref(path).on("value", fn, () => live && setAllowed(false));
        return () => {
          live = false;
          H.FB.db.ref(path).off("value", fn);
        };
      }, [fb.ready, acct && acct.key]);
      if (!allowed) return null;
      return (
        <button className="v7-tile v7-cur" onClick={onOpen}>
          <div className="top">
            <span className="v7-ico">📖</span>
            <span className="v7-badge">先生試遊</span>
          </div>
          <b>数学の塔</b>
          <span className="s">冒険を始める</span>
        </button>
      );
    }
    function App({ acct, onExit }) {
      const fb = H.useFbReady(),
        [loaded, setLoaded] = useState(null),
        [error, setError] = useState(""),
        [screen, setScreen] = useState("loading"),
        [difficulty, setDifficulty] = useState("normal"),
        [floor, setFloor] = useState(1),
        [events, setEvents] = useState([]),
        [battle, setBattle] = useState(null),
        [prob, setProb] = useState(null),
        [paused, setPaused] = useState(false),
        [flash, setFlash] = useState({}),
        [notice, setNotice] = useState(""),
        [seconds, setSeconds] = useState(0),
        [muted, setMuted] = useState(false),
        [outcome, setOutcome] = useState(null),
        [saving, setSaving] = useState(false);
      const data = useRef(null),
        bref = useRef(null),
        screenRef = useRef(screen),
        pausedRef = useRef(false),
        pending = useRef(null),
        afterStory = useRef(null),
        seen = useRef(new Set()),
        clock = useRef(Date.now()),
        runId = useRef(""),
        guard = useRef(false),
        sound = H.useBattleSound(muted),
        life = useRef(true),
        queue = useRef(Promise.resolve());
      screenRef.current = screen;
      pausedRef.current = paused;
      const setData = (v) => {
        data.current = v;
        setLoaded(v);
      };
      const persist = async (progress) => {
        const operation = async () => {
          if (!life.current) throw Error("画面が閉じられました");
          setSaving(true);
          const saved = await Store.save(H.FB.db, H.FB.uid, acct, {
            ...progress,
            revision: data.current.progress.revision,
          });
          if (life.current) setData({ ...data.current, progress: saved });
          return saved;
        };
        const job = queue.current.then(operation);
        queue.current = job.catch(() => {});
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
            "試遊権限を確認できません。先生アカウントで再ログインしてください。",
          );
        };
        Store.load(H.FB.db, H.FB.uid, acct)
          .then((x) => {
            if (!live) return;
            R.validatePolicy(x.content.policy);
            setData(x);
            setScreen("home");
          })
          .catch((e) => {
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
      const content = loaded && loaded.content,
        progress = loaded && loaded.progress;
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
        const list = ids
          .map((id) => x.content.events.find((e) => e.id === id))
          .filter(Boolean);
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
        const d = data.current.progress.difficulties[difficulty];
        if (d.best >= 5) {
          setScreen("chapterEnd");
          return;
        }
        if (d.hp <= 0) {
          setScreen("restart");
          return;
        }
        prepare(d.best + 1);
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
            seen.current = new Set();
            const s = R.begin(
              floor,
              difficulty,
              data.current.progress.difficulties[difficulty].hp,
              content.policy,
            );
            runId.current = crypto.randomUUID();
            updateBattle(s);
            setProb(mk(1));
            clock.current = Date.now();
            setSeconds(Math.ceil(content.policy.problemMs / 1000));
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
          Date.now(),
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
                (content.policy.problemMs - (Date.now() - clock.current)) /
                  1000,
              ),
            ),
          );
          if (Date.now() - clock.current >= content.policy.problemMs) {
            const n = R.timeout(s, content.policy);
            updateBattle(n);
            clock.current = Date.now();
            setNotice("時間切れ：同じ問題を続けます");
            if (n.hp <= 0) finish(n);
          }
        }, 100);
        return () => clearInterval(timer);
      }, [screen, paused, content]);
      const match = (a, b) => {
        if (
          screenRef.current !== "battle" ||
          pausedRef.current ||
          guard.current
        )
          return;
        const s = bref.current,
          t1 = prob.tiles.find((t) => t.id === a),
          t2 = prob.tiles.find((t) => t.id === b);
        if (!t1 || !t2) return;
        guard.current = true;
        const ok = H.polyEqual(H.multiply(t1.factor, t2.factor), prob.poly),
          n = R.answer(s, ok, Date.now() - clock.current, content.policy);
        updateBattle(n);
        setFlash({
          [a]: ok ? "correct" : "wrong",
          [b]: ok ? "correct" : "wrong",
        });
        sound.play(ok ? "ok" : "miss");
        setNotice(
          ok
            ? `正解！ コンボ×${R.COMBO[Math.min(3, n.combo - 1)]}`
            : s.floor === 5
              ? "反撃！ 誤答ダメージ増加"
              : "誤答：同じレベルで再挑戦",
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
          if (
            candidate.family === prob.family &&
            !H.polyEqual(candidate.poly, prob.poly)
          ) {
            next = candidate;
            break;
          }
        }
        if (!next) {
          setError(
            "同系統の別問題を作れませんでした。ポーズのまま再試行してください。",
          );
          return;
        }
        setError("");
        setProb(next);
        clock.current = Date.now();
        setNotice("同程度の別問題で再開");
        setSeconds(Math.ceil(content.policy.problemMs / 1000));
        setPaused(false);
      };
      const restart = async () => {
        try {
          const p = R.copy(data.current.progress);
          p.difficulties[difficulty] = {
            ...p.difficulties[difficulty],
            best: 0,
            hp: 100,
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
      const showPost = (f) =>
        showStory(
          [f + "-post", ...(f === 5 ? ["5-epilogue"] : [])],
          async () => {
            try {
              const p = R.copy(data.current.progress);
              delete p.pendingStory;
              await persist(p);
              setScreen(f === 5 ? "chapterEnd" : "home");
            } catch (e) {
              setError(e.message);
            }
          },
        );
      const post = () => showPost(floor);
      if (!loaded)
        return (
          <section className="mt-panel">
            <h2>数学の塔</h2>
            <p role="alert">{error || "権限を確認しています…"}</p>
            <Button onClick={exit}>タイトルへ</Button>
          </section>
        );
      if (screen === "story")
        return (
          <>
            <Story
              key={events.map((x) => x.id).join(",")}
              events={events}
              content={content}
              progress={progress}
              hero={acct.name}
              onRead={markRead}
              onDone={storyDone}
            />
            {error && (
              <div className="mt-error">
                <p>{error}</p>
                <Button disabled={saving} onClick={storyDone}>
                  保存を再試行
                </Button>
              </div>
            )}
          </>
        );
      const d = progress.difficulties[difficulty],
        enemy = content.characters[content.floors[floor]] || {};
      return (
        <main className="mt-app" data-math-screen={screen}>
          <header>
            <h1>数学の塔</h1>
            <span>先生試遊・第1章</span>
            <Button disabled={saving} onClick={exit}>
              タイトルへ
            </Button>
          </header>
          {error && (
            <p className="mt-error" role="alert">
              {error}
            </p>
          )}
          {screen === "home" && (
            <section className="mt-panel">
              <h2>第1章</h2>
              <p>{content.title}</p>
              <nav>
                {Object.keys(R.CAPS).map((x) => (
                  <Button
                    key={x}
                    aria-pressed={difficulty === x}
                    onClick={() => setDifficulty(x)}
                  >
                    {x.toUpperCase()}
                  </Button>
                ))}
              </nav>
              <p>
                進行 {d.best}/5階 ・ HP {d.hp}
              </p>
              <Button disabled={saving} onClick={continueAdventure}>
                冒険を続ける
              </Button>
              <Button
                onClick={() => {
                  const p = R.copy(data.current.progress);
                  p.newInfo = {};
                  setData({ ...data.current, progress: p });
                  setScreen("book");
                }}
              >
                数理の書
                {Object.keys(progress.newInfo || {}).length ? " NEW" : ""}
              </Button>
              {progress.read.prologue && (
                <Button
                  onClick={() =>
                    showStory(["prologue"], () => setScreen("home"))
                  }
                >
                  プロローグを読み返す
                </Button>
              )}
              <p>試遊記録はランキング・学習履歴・公式称号へ反映されません。</p>
            </section>
          )}
          {screen === "prepare" && (
            <section className="mt-panel">
              <h2>{floor}階の準備</h2>
              <p>
                HP {d.hp} ・ {difficulty.toUpperCase()}
              </p>
              {progress.seen[floor] && (
                <p>{name(content, content.floors[floor], progress.reveal)}</p>
              )}
              <Button disabled={saving} onClick={start}>
                試練を開始
              </Button>
              <Button onClick={() => setScreen("home")}>戻る</Button>
            </section>
          )}
          {screen === "battle" && battle && (
            <section className="mt-battle">
              <div
                className="mt-enemy"
                style={{
                  backgroundImage: `url("${content.backgrounds["f0" + floor].image}")`,
                }}
              >
                <h2>{name(content, content.floors[floor], progress.reveal)}</h2>
                <img
                  src={enemy.image}
                  alt={name(content, content.floors[floor], progress.reveal)}
                />
                <HpBar
                  hp={
                    (Math.max(
                      0.01,
                      (floor === 5 ? content.policy.bossUnits : 8) -
                        battle.damage,
                    ) /
                      (floor === 5 ? content.policy.bossUnits : 8)) *
                    100
                  }
                />
                {floor === 5 && <p>ヌルの反撃：誤答時のダメージが増えます</p>}
              </div>
              <div className="mt-controls" data-math-family={prob.family}>
                <HpBar hp={battle.hp} />
                <p>
                  HP {battle.hp} ・ 残り {seconds}秒 ・ 最大コンボ{" "}
                  {battle.bestCombo}
                </p>
                <nav>
                  <Button onClick={() => setPaused(true)}>ポーズ</Button>
                  <Button onClick={() => setMuted(!muted)}>
                    {muted ? "音を出す" : "消音"}
                  </Button>
                </nav>
                <p role="status">{notice || "2枚の因数タイルをつなごう"}</p>
                <TargetCard
                  poly={prob.poly}
                  level={prob.level}
                  qLabel={battle.correct + "正解"}
                  gaugeKey={clock.current}
                  gaugeMs={content.policy.problemMs}
                  v7
                />
                <div className="mt-board">
                  <BattleBoard
                    tiles={prob.tiles}
                    onMatch={match}
                    disabled={paused || saving}
                    flash={flash}
                    v7
                  />
                </div>
              </div>
              {paused && (
                <div className="mt-overlay">
                  <h2>ポーズ</h2>
                  <p>HP・コンボはそのまま、同程度の別問題で再開します。</p>
                  <Button onClick={resume}>再開</Button>
                </div>
              )}
            </section>
          )}
          {screen === "savingResult" && (
            <section className="mt-panel">
              <h2>結果を保存しています</h2>
              {error && (
                <Button disabled={saving} onClick={retrySave}>
                  保存を再試行
                </Button>
              )}
            </section>
          )}
          {screen === "result" && outcome && (
            <section className="mt-panel">
              <h2>{outcome.rank ? "勝利！ " + outcome.rank : "敗北"}</h2>
              <p>
                正答率 {Math.round(outcome.accuracy * 100)}% ・ ミス{" "}
                {outcome.misses} ・ 時間切れ {outcome.timeouts}
              </p>
              <p>
                最大コンボ {outcome.bestCombo} ・ HP {outcome.hp} ・ 敵残HP{" "}
                {outcome.enemyRemaining.toFixed(1)}
              </p>
              {outcome.rank ? (
                <Button onClick={post}>物語の続きを見る</Button>
              ) : (
                <Button onClick={() => setScreen("restart")}>再挑戦</Button>
              )}
            </section>
          )}
          {screen === "restart" && (
            <section className="mt-panel">
              <h2>章の再挑戦</h2>
              <p>
                章の進行を1階へ戻しHP100で再開します。過去のランクと既読は残ります。
              </p>
              <Button disabled={saving} onClick={restart}>
                第1章を再開始
              </Button>
              <Button onClick={() => setScreen("home")}>ホームへ</Button>
            </section>
          )}
          {screen === "chapterEnd" && (
            <section className="mt-panel">
              <h2>第1章クリア</h2>
              <p>第一の断片を数理の書に記録しました。</p>
              <p>零光の探索者（試遊記録・公式称号には未反映）</p>
              <p>続きは制作中です。</p>
              <Button onClick={() => setScreen("home")}>ホームへ</Button>
              <Button disabled={saving} onClick={restart}>
                第1章を再挑戦
              </Button>
            </section>
          )}
          {screen === "book" && (
            <Book
              c={content}
              p={progress}
              onClose={() =>
                persist(data.current.progress)
                  .then(() => setScreen("home"))
                  .catch((e) => setError(e.message))
              }
            />
          )}
        </main>
      );
    }
    return { App, Tile };
  };
})(window);
