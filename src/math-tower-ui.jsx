/* Chapter-one UI; Firebase protects trial access and progress. */
(function (root) {
  const { useState, useEffect, useRef } = React,
    R = root.MathTowerRules,
    Store = root.MathTowerStore;
  let MathRenderer;
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
    // Unit artwork belongs to battle/bestiary. Resolve dialogue speakers and
    // accumulated entrances to individual portraits, including future units.
    const portraits = (id) => {
      const unit = content.characters[id]?.unit;
      return Array.isArray(unit) ? unit.flatMap(portraits) : [id];
    };
    const active =
      portraits(l.who).find(
        (id) => !l.name || name(content, id, reveal) === l.name,
      ) || portraits(l.who)[0];
    const paperLines = lines
      .slice(0, li + 1)
      .filter((x) => ["math", "note"].includes(x.kind));
    const bookSeen = lines
      .slice(0, li + 1)
      .some((x) => ["book", "bookopen"].includes(x.fx));
    const notebook = ev.id === "prologue" && bg === "classroom" && !bookSeen;
    const book =
      ["book", "bookopen"].includes(l.fx) ||
      (ev.id === "prologue" && bg === "classroom" && bookSeen);
    let sceneStart = 0;
    for (let j = 0; j <= li; j++) if (lines[j].bg) sceneStart = j;
    const visible = lines
      .slice(sceneStart, li + 1)
      .filter(
        (x) => content.characters[x.who] && content.characters[x.who].image,
      )
      .flatMap((x) => portraits(x.who));
    if (["plus", "minus"].includes(active)) visible.push("plus", "minus");
    const ids = [...new Set(visible)].slice(-3);
    // Preserve established left/right entrances; speaking order cannot swap them.
    if (ids.includes("plus") && ids.includes("minus")) {
      ids.sort(
        (a, b) =>
          (({ plus: -2, minus: -1 })[a] ?? 0) -
          ({ plus: -2, minus: -1 }[b] ?? 0),
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
                if (ending.current) return;
                if (ei + 1 < events.length) {
                  setEi(ei + 1);
                  setLi(0);
                } else {
                  ending.current = true;
                  onDone();
                }
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
              data-math-character={id}
              data-speaking={active === id ? "true" : "false"}
              alt={name(content, id, reveal)}
              src={content.characters[id].image}
              style={{
                filter: ["plus", "minus"].includes(id)
                  ? `brightness(${active === id ? 1 : 0.65}) drop-shadow(0 0 2px #fff9) drop-shadow(0 3px 7px #071127)`
                  : active === id
                    ? "none"
                    : "brightness(.65)",
                maxWidth: ids.length > 1 ? "42%" : "75%",
              }}
            />
          ))}
          {notebook && (
            <div
              className={
                "mt-notebook " + (l.fx === "particles" ? "mt-paper-burst" : "")
              }
              aria-label="ノートの紙面"
            >
              <div className="mt-paper-heading">FACTOR × FACTOR</div>
              {paperLines.map((x, i) => (
                <p
                  key={i}
                  className={
                    x.kind === "note" ? "mt-paper-note" : "mt-paper-math"
                  }
                >
                  {x.kind === "math" ? <MathRenderer text={x.text} /> : x.text}
                </p>
              ))}
            </div>
          )}
          {book && !notebook && (
            <div className="mt-tome" aria-label="光る数理の書">
              <span>✦</span>
              <i />
              <i />
            </div>
          )}
          {!ids.length && !notebook && !book && (
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
          <p>{l.kind === "math" ? <MathRenderer text={text} /> : text}</p>
          <small>タップで次へ ▼</small>
        </button>
      </div>
    );
  }
  function CutIn({ info, onConfirm }) {
    return (
      <div
        className="mt-overlay mt-cutin"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mt-cutin-title"
        data-math-cutin={info.id}
      >
        <section>
          <div className="mt-cutin-emblem">✦</div>
          <h2 id="mt-cutin-title">{info.title}</h2>
          <p>{info.text}</p>
          <Button autoFocus onClick={onConfirm}>
            確認して再開
          </Button>
        </section>
      </div>
    );
  }
  const lerp = (a, b, t) => a + (b - a) * t;
  function MagicAttack({ attack, paused, onImpact }) {
    const layer = useRef(null),
      pause = useRef(paused),
      done = useRef(onImpact);
    pause.current = paused;
    done.current = onImpact;
    useEffect(() => {
      const el = layer.current;
      let raf,
        last,
        elapsed = 0,
        alive = true;
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
        if (last !== undefined && !pause.current)
          elapsed += Math.min(50, now - last);
        last = now;
        const center = (node) => {
          const r = node.getBoundingClientRect();
          return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        };
        const q = document.querySelector(".mt-controls .v7-poly"),
          enemy = document.querySelector(".mt-enemy img");
        if (!q || !enemy) return;
        const target = center(q),
          hit = center(enemy),
          origin = attack.cards.map((x) => ({
            x: x.rect.left + x.rect.width / 2,
            y: x.rect.top + x.rect.height / 2,
          }));
        // Layout is measured each frame: rotation/address-bar/viewport changes are safe.
        const liveCards = attack.ids.map((id) =>
          document.querySelector('[data-btile="' + id + '"]'),
        );
        liveCards.forEach((node, i) => {
          if (node) origin[i] = center(node);
        });
        const middle = {
          x: (origin[0].x + origin[1].x) / 2,
          y: (origin[0].y + origin[1].y) / 2,
        };
        cards.forEach((card, i) => {
          const t = Math.min(1, elapsed / 160),
            fly = Math.min(1, Math.max(0, (elapsed - 160) / 180));
          const x = lerp(lerp(origin[i].x, middle.x, t), target.x, fly),
            y = lerp(lerp(origin[i].y, middle.y, t), target.y, fly);
          card.style.left = x + "px";
          card.style.top = y + "px";
          card.style.transform = `translate(-50%,-50%) scale(${1 - fly * 0.55}) rotate(${(i ? 1 : -1) * (1 - t) * 10}deg)`;
          card.style.opacity =
            elapsed < 340 ? 1 : Math.max(0, 1 - (elapsed - 340) / 80);
        });
        const flight = Math.min(1, Math.max(0, (elapsed - 400) / 220));
        orb.style.left = lerp(target.x, hit.x, flight) + "px";
        orb.style.top =
          lerp(target.y, hit.y, flight) -
          Math.sin(flight * Math.PI) * 35 +
          "px";
        orb.style.opacity = elapsed >= 340 ? 1 : 0;
        el.dataset.phase =
          elapsed < 160
            ? "merge"
            : elapsed < 340
              ? "formula"
              : elapsed < 400
                ? "energy"
                : elapsed < 620
                  ? "flight"
                  : "impact";
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
    return (
      <div
        ref={layer}
        className="mt-magic"
        aria-hidden="true"
        data-math-attack=""
      />
    );
  }
  function InlineMathFallback({ text }) {
    const s = String(text),
      sup = { "²": "2", "³": "3", "⁴": "4", "¹": "1", "⁰": "0" };
    return (
      <span className="fxm">
        {Array.from(s).map((ch, i) =>
          ch === "x" ? (
            <span key={i} className="fxm-v">
              x
            </span>
          ) : sup[ch] ? (
            <sup key={i} className="fxm-sup">
              {sup[ch]}
            </sup>
          ) : ["+", "-", "−"].includes(ch) ? (
            <span
              key={i}
              className={
                i > 0 && !s.slice(0, i).trim().endsWith("(")
                  ? "fxm-op"
                  : undefined
              }
            >
              {ch === "-" ? "−" : ch}
            </span>
          ) : ch === " " ? null : (
            <span key={i}>{ch}</span>
          ),
        )}
      </span>
    );
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
      bottom: Math.max(...boxes.map((r) => r.bottom)),
    };
  }
  function TowerTarget({ TargetCard, ...props }) {
    const wrapper = useRef(null);
    useEffect(() => {
      let live = true,
        raf;
      const fit = () => {
        if (!live) return;
        const box = wrapper.current.querySelector(".v7-poly"),
          text = box.querySelector(".fxm");
        text.style.fontSize = "";
        const base = parseFloat(getComputedStyle(text).fontSize),
          available = box.getBoundingClientRect();
        let scale = 1;
        // Include superscript text ranges and loaded font metrics, not just width.
        for (let i = 0; i < 4; i++) {
          const b = mathBounds(text),
            ratio = Math.min(
              1,
              (available.width - 12) / (b.right - b.left),
              (available.height - 10) / (b.bottom - b.top),
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
    return (
      <div ref={wrapper} className="mt-target-wrap">
        <TargetCard {...props} />
      </div>
    );
  }
  // Presentation only: results have already been committed before mounting.
  function Victory({ outcome, onNext, background }) {
    const [skip, setSkip] = useState(false),
      rank = outcome.rank;
    const stats = [
      ["正答率", Math.round(outcome.accuracy * 100) + "%"],
      ["ミス", outcome.misses],
      ["時間切れ", outcome.timeouts],
      ["最大コンボ", outcome.bestCombo],
      ["残りHP", outcome.hp],
      ["敵残HP", outcome.enemyRemaining.toFixed(1)],
    ];
    return (
      <section
        className={"mt-victory" + (skip ? " mt-victory-skip" : "")}
        data-victory-rank={rank}
        style={{
          backgroundImage: background
            ? `linear-gradient(#081331b8,#081331ed),url("${background}")`
            : undefined,
        }}
      >
        <div className="mt-victory-burst" aria-hidden="true" />
        <div className="mt-victory-stars" aria-hidden="true">
          {Array.from(
            { length: rank === "S" ? 24 : rank === "A" ? 16 : 8 },
            (_, i) => (
              <i
                key={i}
                style={{
                  left: ((i * 37) % 100) + "%",
                  top: ((i * 23) % 90) + "%",
                  animationDelay: (i % 5) * 0.06 + "s",
                }}
              >
                ✦
              </i>
            ),
          )}
        </div>
        <div className="mt-victory-content">
          <p className="mt-victory-title" aria-hidden="true">
            VICTORY
          </p>
          <h2>勝利！ {rank}</h2>
          <div className="mt-victory-rank" aria-hidden="true">
            {rank}
          </div>
          <dl className="mt-victory-stats">
            {stats.map(([label, value], i) => (
              <div
                key={label}
                style={{ animationDelay: 0.15 + i * 0.06 + "s" }}
              >
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <Button className="mt-button mt-victory-next" onClick={onNext}>
            物語の続きを見る
          </Button>
          <button
            className="mt-victory-skip-button"
            onClick={() => setSkip(true)}
          >
            演出をスキップ
          </button>
        </div>
      </section>
    );
  }
  function Book({ c, p, onClose, closing }) {
    const [tab, setTab] = useState("notes"),
      [sort, setSort] = useState("floor"),
      [filter, setFilter] = useState("all"),
      [zoom, setZoom] = useState(null),
      [zoomError, setZoomError] = useState(false),
      [imageStates, setImageStates] = useState({}),
      [scale, setScale] = useState(1),
      [pan, setPan] = useState({ x: 0, y: 0 });
    useEffect(() => {
      let live = true;
      const images = [];
      for (const [f, id] of Object.entries(c.floors)) {
        const char = c.characters[id];
        if (
          !p.seen[f] ||
          !char.image ||
          (char.revealKey && !p.reveal[char.revealKey])
        )
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
        <Button disabled={closing} onClick={onClose}>
          とじる
        </Button>
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
            {Object.entries(p.difficulties).flatMap(([d, x]) =>
              Object.entries(x.records)
                .filter(([, r]) => r != null)
                .map(([floor, r]) => (
                  <p key={d + floor}>
                    {d.toUpperCase()} 第{floor}階：最高{r.rank} ・ 正答率
                    {Math.round(r.accuracy * 100)}%
                  </p>
                )),
            )}
            <h3>最近の戦績</h3>
            {Object.entries(p.history)
              .filter(([, r]) => r != null)
              .sort(([, a], [, b]) => b.at - a.at)
              .slice(0, 10)
              .map(([id, r]) => (
                <p key={id}>
                  {String(r.difficulty || "").toUpperCase()} 第{r.floor}階 ・{" "}
                  {r.mode === "replay" ? "再挑戦" : "本編"} ・{" "}
                  {r.rank || "敗北"}
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
                  {imageStates[id] === "ready" && (
                    <Button
                      className="mt-button mt-image-button"
                      onClick={() => {
                        setZoomError(false);
                        setZoom(char.image);
                        setScale(1);
                        setPan({ x: 0, y: 0 });
                      }}
                    >
                      <span aria-hidden="true">▧ </span>画像を見る
                    </Button>
                  )}
                  {imageStates[id] === "error" && (
                    <p>画像は現在表示できません。</p>
                  )}
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
          <div
            className="mt-zoom"
            role="dialog"
            aria-modal="true"
            aria-label="モンスター画像"
          >
            <Button onClick={() => setZoom(null)}>✕ 画像を閉じる</Button>
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
            {zoomError && (
              <p role="alert">
                画像を読み込めませんでした。閉じてから再度お試しください。
              </p>
            )}
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
                alt="モンスター画像"
                onError={() => setZoomError(true)}
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
    MathRenderer = H.MathText || InlineMathFallback;
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
        [muted, setMuted] = H.useGameMute(),
        [outcome, setOutcome] = useState(null),
        [saving, setSaving] = useState(false),
        [recovering, setRecovering] = useState(false),
        [playMode, setPlayMode] = useState("adventure"),
        [attack, setAttack] = useState(null),
        [impact, setImpact] = useState(null),
        [cutin, setCutin] = useState(null);
      const data = useRef(null),
        bref = useRef(null),
        screenRef = useRef(screen),
        pausedRef = useRef(false),
        pending = useRef(null),
        afterStory = useRef(null),
        storyBusy = useRef(false),
        actionBusy = useRef(false),
        seen = useRef(new Set()),
        clock = useRef(Date.now()),
        runId = useRef(""),
        guard = useRef(false),
        sound = H.useBattleSound(muted),
        life = useRef(true),
        writer = useRef(null),
        recoveryBusy = useRef(false),
        acctRef = useRef(acct),
        attackRef = useRef(null),
        cutinRef = useRef(null),
        explained = useRef(new Set()),
        animationTimer = useRef(null);
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
              throw Error("記録の読み込みが完了していません");
            return data.current.progress;
          },
          write: (p) => Store.save(H.FB.db, H.FB.uid, acctRef.current, p),
          commit: (p) => {
            setData({ ...data.current, progress: p });
            setError("");
          },
          busy: setSaving,
          live: () => life.current,
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
      const recoveryPanel = error && (
        <section className="mt-recovery" role="alert">
          <p>{error}</p>
          <p>
            最新の記録を読み込むと、未保存の進行・戦闘結果は失われる可能性があります。保存済みの記録は削除しません。
          </p>
          {(screen === "story" || screen === "savingResult") && (
            <Button
              disabled={saving || recovering}
              onClick={() => (screen === "story" ? storyDone() : retrySave())}
            >
              保存を再試行
            </Button>
          )}
          <Button disabled={saving || recovering} onClick={recover}>
            最新の記録を読み込む
          </Button>
          <Button
            onClick={() => {
              sound.bgm(false);
              onExit();
            }}
          >
            タイトルへ戻る
          </Button>
        </section>
      );
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
            writer.current.reset(x.progress);
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
        sound.bgm(screen === "battle" && !paused && !cutin);
        return () => sound.bgm(false);
      }, [screen, paused, muted, cutin]);
      useEffect(() => {
        if (!saving) return;
        const timer = setTimeout(() => {
          if (life.current)
            setError(
              "保存の応答を待っています。通信状態を確認してください。通信復帰後に保存が完了する場合があります。",
            );
        }, 10000);
        return () => clearTimeout(timer);
      }, [saving]);
      const content = loaded && loaded.content,
        progress = loaded && loaded.progress;
      useEffect(() => {
        if (screen !== "battle") return;
        const fit = () =>
          document
            .querySelectorAll(".mt-board [data-btile] > .fxm")
            .forEach((text) => {
              text.style.fontSize = "";
              const base = parseFloat(getComputedStyle(text).fontSize),
                width = text.getBoundingClientRect().width,
                parent = text.parentElement;
              const available = parent.clientWidth - 10;
              if (width > available && available > 0)
                text.style.fontSize = (base * available) / width + "px";
            });
        const observer = new ResizeObserver(fit);
        document
          .querySelectorAll(".mt-board [data-btile]")
          .forEach((x) => observer.observe(x));
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
            seen.current = new Set();
            const s = R.begin(
              floor,
              difficulty,
              playMode === "replay"
                ? 100
                : data.current.progress.adventures[difficulty].hp,
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
            explained.current = new Set();
            setScreen("battle");
            if (floor === 5)
              explain({
                id: "nul",
                title: "零の番人ヌル",
                text: `能力：誤答ダメージ2倍（HP −${content.policy.miss * 2}）。時間切れはHP −${content.policy.timeout}です。`,
              });
            else if (difficulty === "hard")
              explain({
                id: "hard-rule",
                title: "HARDの撃破条件",
                text: "敵HPを削り切り、Lv8以上の問題に正解すると撃破できます。",
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
          mode: playMode,
        };
        pending.current = attempt;
        setOutcome(R.result(s, content.policy));
        setScreen("savingResult");
        try {
          await persist((p) =>
            R.complete(
              p,
              attempt.s,
              content.policy,
              attempt.id,
              attempt.at,
              attempt.mode,
            ),
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
          await persist((p) =>
            R.complete(
              p,
              attempt.s,
              content.policy,
              attempt.id,
              attempt.at,
              attempt.mode,
            ),
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
      }, [screen, paused, content, attack, cutin]);
      const match = (a, b) => {
        if (
          screenRef.current !== "battle" ||
          pausedRef.current ||
          guard.current ||
          cutinRef.current
        )
          return;
        const s = bref.current,
          t1 = prob.tiles.find((t) => t.id === a),
          t2 = prob.tiles.find((t) => t.id === b);
        if (!t1 || !t2) return;
        guard.current = true;
        const ok = H.polyEqual(H.multiply(t1.factor, t2.factor), prob.poly),
          n = R.answer(s, ok, Date.now() - clock.current, content.policy);
        setFlash({
          [a]: ok ? "correct" : "wrong",
          [b]: ok ? "correct" : "wrong",
        });
        if (ok) {
          const nodes = [a, b].map((id) =>
            document.querySelector('[data-btile="' + id + '"]'),
          );
          const fx = {
            ids: [a, b],
            cards: nodes.map((node) => ({
              html: node.innerHTML,
              rect: node.getBoundingClientRect().toJSON(),
            })),
            next: n,
            damage: n.damage - s.damage,
          };
          attackRef.current = fx;
          setAttack(fx);
        } else {
          sound.play("miss");
          updateBattle(n);
          setNotice("誤答：同じレベルで再挑戦");
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
        setNotice(`正解！ コンボ×${R.COMBO[Math.min(3, fx.next.combo - 1)]}`);
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
          setSeconds(Math.ceil(content.policy.problemMs / 1000));
          if (
            difficulty === "hard" &&
            floor !== 5 &&
            fx.next.damage >= 8 &&
            !fx.next.solvedHigh
          )
            explain({
              id: "hard-remaining",
              title: "あと一歩！",
              text: "敵HPは0です。Lv8以上の問題への正解で撃破できます。",
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
      const restart = () =>
        playMode === "replay" ? prepare(floor) : newAdventure(difficulty);
      const exit = () => {
        sound.bgm(false);
        onExit();
      };
      const showPost = (f, chosen = difficulty, mode = playMode) =>
        showStory(
          [f + "-post", ...(f === 5 ? ["5-epilogue"] : [])],
          async () => {
            try {
              if (mode === "adventure")
                await persist((p) => R.finishStory(p, chosen));
              setScreen(
                mode === "adventure" && f === 5 ? "chapterEnd" : "afterFloor",
              );
            } catch (e) {
              setError(e.message);
            }
          },
        );
      const post = () => showPost(floor);
      const chooseAfterFloor = async (next) => {
        if (
          actionBusy.current ||
          writer.current.isBusy() ||
          screenRef.current !== "afterFloor"
        )
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
            {recoveryPanel}
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
      const d = progress.adventures[difficulty] || { hp: 100, floor: 1 },
        enemy = content.characters[content.floors[floor]] || {};
      return (
        <main
          className={
            "mt-app" +
            (screen === "battle"
              ? " mt-battle-app"
              : screen === "result" && outcome?.rank
                ? " mt-result-app"
                : "")
          }
          data-math-screen={screen}
          data-time-stopped={paused || !!attack || !!cutin || !!impact}
        >
          <header>
            <h1>数学の塔</h1>
            <span>先生試遊・第1章</span>
            <Button disabled={saving} onClick={exit}>
              タイトルへ
            </Button>
          </header>
          {recoveryPanel}
          {screen === "home" && (
            <section className="mt-panel">
              <h2>第1章</h2>
              <p>{content.title}</p>
              <nav className="mt-adventure-menu">
                <Button onClick={() => setScreen("newSelect")}>
                  はじめから
                </Button>
                <Button onClick={() => setScreen("continueSelect")}>
                  続きから
                </Button>
                <Button
                  onClick={() => {
                    setPlayMode("replay");
                    setScreen("floorSelect");
                  }}
                >
                  クリアした階を選ぶ
                </Button>
              </nav>
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
              {progress.migrationBackup && (
                <Button onClick={() => setScreen("migrationBackup")}>
                  移行前の記録・復旧
                </Button>
              )}
              <p>試遊記録はランキング・学習履歴・公式称号へ反映されません。</p>
            </section>
          )}
          {screen === "migrationBackup" && (
            <section className="mt-panel">
              <h2>移行前の記録・復旧</h2>
              <p>
                初回移行前の記録を保存できます。個人の試遊記録のため公開しないでください。
              </p>
              <Button
                onClick={() => {
                  const url = URL.createObjectURL(
                    new Blob(
                      [JSON.stringify(progress.migrationBackup, null, 2)],
                      { type: "application/json" },
                    ),
                  );
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "math-tower-before-migration.json";
                  a.click();
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                }}
              >
                バックアップを保存
              </Button>
              {Object.keys(R.migrate(progress.migrationBackup).adventures).map(
                (chosen) => (
                  <Button
                    key={chosen}
                    onClick={() => {
                      setDifficulty(chosen);
                      setScreen("restoreConfirm");
                    }}
                  >
                    {chosen.toUpperCase()}の移行前の冒険を復元
                  </Button>
                ),
              )}
              <p>
                復元は選んだ難易度の進行中の冒険だけを戻します。移行後の図鑑・学習記録・クリア履歴・最高評価は消しません。
              </p>
              <Button onClick={() => setScreen("home")}>戻る</Button>
            </section>
          )}
          {screen === "restoreConfirm" && (
            <section className="mt-panel" role="dialog" aria-modal="true">
              <h2>移行前の{difficulty.toUpperCase()}の冒険を復元しますか？</h2>
              <p>
                この難易度の現在の冒険を置き換えます。ほかの冒険や永続記録はそのままです。
              </p>
              <Button
                disabled={saving}
                onClick={async () => {
                  try {
                    await persist((p) => R.restoreAdventure(p, difficulty));
                    setScreen("home");
                  } catch (e) {
                    setError(e.message);
                  }
                }}
              >
                確認して復元
              </Button>
              <Button onClick={() => setScreen("migrationBackup")}>
                キャンセル
              </Button>
            </section>
          )}
          {["newSelect", "continueSelect", "replaySelect"].includes(screen) && (
            <section className="mt-panel">
              <h2>
                {screen === "newSelect"
                  ? "はじめから"
                  : screen === "continueSelect"
                    ? "続きから"
                    : `${floor}階の再挑戦`}
              </h2>
              {Object.keys(R.CAPS).map((chosen) => {
                const a = progress.adventures[chosen];
                return (
                  <article key={chosen}>
                    <h3>{chosen.toUpperCase()}</h3>
                    <p data-adventure={chosen}>
                      {!a
                        ? "データなし"
                        : a.phase === "cleared"
                          ? "第1章クリア"
                          : `第${a.floor}階${a.phase === "post" ? "の会話から" : a.phase === "defeated" ? "・敗北（再開始）" : "から再開"} ・ HP ${a.hp}`}
                    </p>
                    <Button
                      disabled={saving || (screen === "continueSelect" && !a)}
                      onClick={() => {
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
                      }}
                    >
                      {chosen.toUpperCase()}を選ぶ
                    </Button>
                  </article>
                );
              })}
              <Button onClick={() => setScreen("home")}>戻る</Button>
            </section>
          )}
          {screen === "replaceConfirm" && (
            <section className="mt-panel" role="dialog" aria-modal="true">
              <h2>{difficulty.toUpperCase()}の冒険を置き換えますか？</h2>
              <p>
                この難易度の進行中の冒険だけを第1階・HP100で置き換えます。他の難易度、クリア履歴、図鑑、学習記録、最高評価は残ります。
              </p>
              <Button
                disabled={saving}
                onClick={() => newAdventure(difficulty)}
              >
                置き換えて開始
              </Button>
              <Button onClick={() => setScreen("newSelect")}>キャンセル</Button>
            </section>
          )}
          {screen === "floorSelect" && (
            <section className="mt-panel">
              <h2>クリアした階を選ぶ</h2>
              <p>再挑戦はHP100から開始。本編の冒険の進行・HPは変更しません。</p>
              {[1, 2, 3, 4, 5].map((f) => (
                <Button
                  key={f}
                  disabled={!progress.clearedFloors[f]}
                  onClick={() => {
                    setFloor(f);
                    setScreen("replaySelect");
                  }}
                >
                  {f}階{!progress.clearedFloors[f] ? " 未解放" : ""}
                </Button>
              ))}
              <Button onClick={() => setScreen("home")}>戻る</Button>
            </section>
          )}
          {screen === "prepare" && (
            <section className="mt-panel">
              <h2>{floor}階の準備</h2>
              <p>
                HP {playMode === "replay" ? 100 : d.hp} ・{" "}
                {difficulty.toUpperCase()} ・{" "}
                {playMode === "replay" ? "独立した再挑戦" : "本編の冒険"}
              </p>
              {floor === 1 && (
                <p className="mt-instructions">
                  6枚から、掛け合わせると上の式になる2枚を選びます。1枚を押したまま、もう1枚へ線を引いて指（マウス）を離してください。
                </p>
              )}
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
                className={"mt-enemy" + (impact ? " mt-enemy-hit" : "")}
                style={{
                  backgroundImage: `url("${content.backgrounds["f0" + floor].image}")`,
                }}
              >
                <h2>{name(content, content.floors[floor], progress.reveal)}</h2>
                <img
                  src={enemy.image}
                  alt={name(content, content.floors[floor], progress.reveal)}
                />
                {impact && (
                  <div className="mt-impact" key={impact.id} aria-hidden="true">
                    <span>−{impact.damage.toFixed(1)}</span>
                  </div>
                )}
                <HpBar
                  v7
                  height={18}
                  hp={
                    (Math.max(
                      0,
                      (floor === 5 ? content.policy.bossUnits : 8) -
                        battle.damage,
                    ) /
                      (floor === 5 ? content.policy.bossUnits : 8)) *
                    100
                  }
                />
              </div>
              <div className="mt-controls" data-math-family={prob.family}>
                <div className="mt-battle-toolbar">
                  <span>HP {battle.hp}</span>
                  <span>残り {seconds}秒</span>
                  <span>コンボ {battle.combo}</span>
                  <button
                    className="mt-icon"
                    aria-label="ポーズ"
                    disabled={!!impact}
                    aria-pressed={paused}
                    onClick={() => setPaused(true)}
                  >
                    Ⅱ
                  </button>
                  <button
                    className="mt-icon"
                    aria-label={muted ? "音を出す" : "消音"}
                    aria-pressed={muted}
                    onClick={() => setMuted(!muted)}
                  >
                    {muted ? "🔇" : "🔊"}
                  </button>
                </div>
                <HpBar hp={battle.hp} height={16} label={false} v7 />
                <div className="mt-battle-notice" role="status">
                  {notice}
                </div>
                <TowerTarget
                  TargetCard={TargetCard}
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
                    disabled={
                      paused || saving || !!attack || !!impact || !!cutin
                    }
                    flash={flash}
                    v7
                  />
                </div>
              </div>
              {attack && (
                <MagicAttack
                  attack={attack}
                  paused={paused}
                  onImpact={hitEnemy}
                />
              )}

              {cutin && (
                <CutIn
                  info={cutin}
                  onConfirm={() => {
                    setCutin(null);
                    cutinRef.current = null;
                    clock.current = Date.now();
                    setSeconds(Math.ceil(content.policy.problemMs / 1000));
                  }}
                />
              )}
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
          {screen === "result" &&
            outcome &&
            (outcome.rank ? (
              <Victory
                outcome={outcome}
                onNext={post}
                background={content.backgrounds["f0" + floor].image}
              />
            ) : (
              <section className="mt-panel">
                <h2>敗北</h2>
                <p>
                  正答率 {Math.round(outcome.accuracy * 100)}% ・ ミス{" "}
                  {outcome.misses} ・ 時間切れ {outcome.timeouts}
                </p>
                <p>
                  最大コンボ {outcome.bestCombo} ・ HP {outcome.hp} ・ 敵残HP{" "}
                  {outcome.enemyRemaining.toFixed(1)}
                </p>
                <Button onClick={() => setScreen("restart")}>再挑戦</Button>
              </section>
            ))}
          {screen === "restart" && (
            <section className="mt-panel">
              <h2>{playMode === "replay" ? "同じ階の再挑戦" : "章の再挑戦"}</h2>
              <p>
                {playMode === "replay"
                  ? "本編の保存はそのまま、この階をHP100で再挑戦します。"
                  : "この難易度の冒険だけを1階・HP100で再開します。過去のランクと既読は残ります。"}
              </p>
              <Button disabled={saving} onClick={restart}>
                {playMode === "replay" ? "この階を再挑戦" : "第1章を再開始"}
              </Button>
              <Button onClick={() => setScreen("home")}>ホームへ</Button>
            </section>
          )}
          {screen === "afterFloor" && (
            <section className="mt-panel" data-math-after-floor>
              <h2>第{floor}階クリア</h2>
              <p>記録を保存しました。</p>
              {playMode === "adventure" ? (
                <>
                  <p>
                    {difficulty.toUpperCase()} ・ HP {d.hp} ・ 次は第{d.floor}階
                  </p>
                  <Button
                    disabled={saving || recovering}
                    onClick={() => chooseAfterFloor("next")}
                  >
                    次の階へ進む
                  </Button>
                </>
              ) : (
                <>
                  <p>
                    再挑戦の戦績を記録しました。本編の冒険は保持されています。
                  </p>
                  <Button
                    disabled={saving || recovering}
                    onClick={() => chooseAfterFloor("floorSelect")}
                  >
                    クリアした階を選ぶ
                  </Button>
                </>
              )}
              <Button
                disabled={saving || recovering}
                onClick={() => chooseAfterFloor("home")}
              >
                数学の塔メニューへ戻る
              </Button>
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
              closing={saving}
              onClose={() =>
                persist((p) => p)
                  .then(() => setScreen("home"))
                  .catch((e) => setError(e.message))
              }
            />
          )}
        </main>
      );
    }
    return { App, Tile, CutIn, Target: TowerTarget, Victory };
  };
})(window);
