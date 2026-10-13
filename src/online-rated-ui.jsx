/* Spark RTDB transport only. No external server or admin credentials. */
(function (root) {
  root.OnlineRatedFactory = function (H) {
    const { useState, useRef, useEffect, useMemo, useCallback } = React;
    const label = (d) => H.DIFFICULTY_CONFIG[d]?.label || d;
    const titles = {
      easy_adept: "EASYの達人",
      easy_master: "EASYマスター",
      normal_adept: "NORMALの達人",
      normal_master: "NORMALマスター",
      dual_master: "双璧のマスター",
      hyper_slayer: "超影の征服者",
      ghost_up1: "格上の影を破る者",
      ghost_up2: "二階級の影を超える者",
    };
    class PlayBoundary extends React.Component {
      state = { failed: false };
      static getDerivedStateFromError() {
        return { failed: true };
      }
      componentDidCatch() {
        this.props.onFailure();
      }
      render() {
        return this.state.failed ? (
          <section role="alert">
            <p>
              対戦画面を読み込めませんでした。退出による敗北を確定せず、復帰または安全な中断を確認してください。
            </p>
            <button
              onClick={() => {
                this.setState({ failed: false });
                this.props.onRecover();
              }}
            >
              画面を再試行
            </button>
            <button onClick={this.props.onAbort}>
              初期化失敗の対戦を安全に中断
            </button>
          </section>
        ) : (
          this.props.children
        );
      }
    }
    function BattleView({
      H,
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
    }) {
      const tiles = useMemo(
        () => g.tiles,
        [g.question, JSON.stringify(g.tiles)],
      );
      if (!H.BattleSurface || !H.HpBar || !Array.isArray(tiles) || !g.poly)
        throw Error("BATTLE_INITIALIZATION_FAILED");
      const self = g.live[m.selfUid],
        opponent = Object.entries(g.live).find(
          ([uid]) => uid !== m.selfUid,
        )?.[1];
      const counting = time < (m.gameStartAt || g.startAt),
        ready = !!g.resolving || time < Math.max(g.startAt, g.readyAt || 0);
      const score = typeof self === "number" ? self : self?.score || 0,
        combo = typeof self === "object" ? self.combo : g.combo || 0;
      const seenVisual = useRef(g.visualEvents?.slice(-1)[0]?.id || 0);
      useEffect(() => {
        const selfEl = document.querySelector("[data-online-self]"),
          oppEl = document.querySelector("[data-online-opponent]");
        for (const e of g.visualEvents || []) {
          if (e.id <= seenVisual.current) continue;
          seenVisual.current = e.id;
          const mine = e.uid === m.selfUid,
            el = mine ? selfEl : oppEl,
            p = e.payload;
          if (e.type === "incoming" && mine)
            H.CombatFX.fly(oppEl, selfEl, "#FF5C5C");
          if (e.type === "hit") H.CombatFX.hit(el, p?.dmg || 0);
          if (e.type === "blocked") H.CombatFX.ring(el, "#8FB8FF");
          if (e.type === "special" && p === "heal")
            H.CombatFX.ring(el, "#8BE38F");
          if (e.type === "special" && p === "shield")
            H.CombatFX.ring(el, "#8FB8FF");
        }
      }, [g.visualEvents, m.selfUid]);
      const N = H.DIFFICULTY_CONFIG[m.difficulty].clearCount;
      return (
        <H.BattleSurface>
          <div
            className="v7-play or-battle"
            data-online-mode={m.mode}
            data-online-ready={!disabled && !ready && !g.result}
          >
            <div className="v7-zone">
              <div className="or-game-header">
                <div>
                  <div className="or-game-controls">
                    <button
                      className="v7-bar-btn"
                      onClick={onLeave}
                      disabled={disabled}
                    >
                      ✕ 退出
                    </button>
                    <button
                      className="v7-bar-btn"
                      aria-label={muted ? "音を出す" : "消音"}
                      onClick={() => setMuted(!muted)}
                    >
                      {muted ? "🔇" : "🔊"}
                    </button>
                  </div>
                  <span className="v7-chip">
                    {m.mode === "A" ? "早い者勝ち" : "レース＋攻撃"} ・{" "}
                    {label(m.difficulty)}
                  </span>
                </div>
                <div className="v7-wnd or-opponent" data-online-opponent="1">
                  <b>
                    {m.opponent?.name ||
                      m.members?.find((x) => x.uid !== m.selfUid)?.name ||
                      "相手"}
                  </b>
                  <small>
                    {typeof opponent === "number"
                      ? opponent + "点"
                      : `HP ${opponent?.hp?.toFixed(1) ?? 100}% ・ ${opponent?.score || 0}点`}
                  </small>
                </div>
              </div>
              <div className="or-stat-grid">
                {H.v7Stat(
                  m.mode === "A" ? "あなた" : "SCORE",
                  score,
                  "#7FD8FF",
                )}
                {H.v7Stat(
                  m.mode === "A" ? "相手" : "SOLVED",
                  m.mode === "A" ? opponent || 0 : `${self?.c || 0}/${N}`,
                  "#FFB59C",
                )}
                {H.v7Stat("COMBO", combo)}
              </div>
              {m.mode === "B" && (
                <div data-online-self="1" style={{ position: "relative" }}>
                  <H.HpBar v7 hp={self?.hp ?? 100} height={22} />
                  {self?.shield && (
                    <span className="or-shield-status">🛡 防御中</span>
                  )}
                </div>
              )}
              <div className="or-progress" aria-label="対戦の進行">
                {Array.from({ length: N }, (_, i) => (
                  <i
                    key={i}
                    style={{
                      background:
                        i < (m.mode === "A" ? Number(g.question) : self?.c || 0)
                          ? "#7FD8FF"
                          : i ===
                              (m.mode === "A"
                                ? Number(g.question)
                                : self?.c || 0)
                            ? "#FFD54A"
                            : "#24336E",
                    }}
                  />
                ))}
              </div>
              {m.mode === "B" && (
                <div className="or-special">
                  <span>
                    必殺 {self?.sp || 0}/{H.SP_MAX}
                  </span>
                  {Object.entries(H.SP_INFO).map(([kind, info]) => (
                    <button
                      key={kind}
                      data-sp={kind}
                      disabled={disabled || ready || (self?.sp || 0) < H.SP_MAX}
                      onClick={() => onSpecial(kind)}
                    >
                      {info.label}
                    </button>
                  ))}
                </div>
              )}
              <p className="or-connection" role="status">
                {counting
                  ? "まもなく開始"
                  : ready
                    ? "次の問題を準備中"
                    : "対戦中"}{" "}
                ・ 残り{" "}
                {Math.max(0, (g.timeoutMs - (time - g.startAt)) / 1000).toFixed(
                  1,
                )}
                秒
              </p>
            </div>
            <div className="v7-main">
              <div className="or-feedback" aria-live="polite">
                <H.TimingJudgment
                  judge={feedback?.judge}
                  className="or-timing"
                />
                <H.ComboDisplay combo={combo} />
              </div>
              <div className="relative" style={{ flexShrink: 0 }}>
                <H.TargetCard
                  poly={g.poly}
                  level={g.level}
                  qLabel={`問${m.mode === "A" ? Number(g.question) + 1 : (self?.c || 0) + 1}/${N}`}
                  gaugeKey={g.question + ":" + g.startAt}
                  gaugeMs={Math.max(1, g.timeoutMs - (time - g.startAt))}
                  v7
                />
              </div>
              <H.BattleBoard
                flash={feedback?.flash}
                tiles={tiles}
                onMatch={onMatch}
                disabled={disabled || ready || !!g.result}
                dim={ready}
                v7
              />
              <p className="v7-hint">
                {m.mode === "A"
                  ? "先に正解した人だけ得点 ・ まちがえると2秒お手つき"
                  : "コンボで攻撃 ・ ゲージ満タンで必殺技"}
              </p>
            </div>
            {counting && (
              <div className="or-countdown" aria-label="開始カウントダウン">
                {Math.max(
                  1,
                  Math.ceil(((m.gameStartAt || g.startAt) - time) / 1000),
                )}
              </div>
            )}
          </div>
        </H.BattleSurface>
      );
    }
    function Result({ H, m, state, acct, titles, badgesBefore, busy, onExit }) {
      const won = m.outcome === "win",
        r = m.receipt?.players?.[acct.key];
      const badges = Object.keys(state.badges || {}).filter(
        (k) => !badgesBefore[k] && titles[k],
      );
      useEffect(() => {
        if (won) H.CombatFX.victory();
        return () => H.CombatFX.cancel();
      }, [m.id]);
      return (
        <section
          className={`or-result ${won ? "or-victory" : "or-defeat"}`}
          data-result-kind={m.outcome}
        >
          {won && <div className="or-victory-rays" aria-hidden="true" />}
          <h3>{won ? "勝利！" : m.outcome === "draw" ? "引き分け" : "敗北"}</h3>
          <p className="or-result-sub">
            {won
              ? "VICTORY！"
              : m.outcome === "draw"
                ? "DRAW"
                : "また挑戦しよう"}
          </p>
          <strong className="or-delta">
            レート {r?.delta >= 0 ? "+" : ""}
            {r?.delta ?? 0}
          </strong>
          <p>
            {r?.before} → {r?.after}
          </p>
          <p>
            {["bounty", "profile"].includes(m.origin)
              ? "指名戦：公式レート・対戦数は変更しません"
              : `${label(m.difficulty)}のみ更新${m.opponent ? "（変動は人間戦の1/3）" : ""}`}
          </p>
          {m.opponent && (
            <div className="or-exp">
              獲得EXP <b>+{m.exp || 0}</b>
            </div>
          )}
          {badges.length > 0 && (
            <div className="or-new-title" data-new-title="1">
              ✨ 新しい称号！
              {badges.map((k) => (
                <p key={k}>{titles[k]}</p>
              ))}
            </div>
          )}
          <button disabled={busy} className="or-primary" onClick={onExit}>
            {["bounty", "profile"].includes(m.origin)
              ? "一覧へ戻る"
              : "オンラインメニューへ戻る"}
          </button>
        </section>
      );
    }
    function App({ acct, onExit, view = "match", initialGhost = null }) {
      const [state, setState] = useState(null),
        [error, setError] = useState(""),
        [feedback, setFeedback] = useState(null),
        [screen, setScreen] = useState(
          view === "ratings" ? "ratings" : "select",
        ),
        [tab, setTab] = useState("easy"),
        [busy, setBusy] = useState(false),
        [selectedPlayer, setSelectedPlayer] = useState(null),
        [muted, setMuted] = H.useGameMute();
      const current = useRef(null),
        inFlight = useRef(false),
        seq = useRef(0),
        life = useRef(true),
        retry = useRef(null),
        requestRef = useRef(null),
        requests = useRef(Promise.resolve()),
        actionPending = useRef(false),
        pollingPaused = useRef(false),
        feedbackTimer = useRef(null),
        badgesBefore = useRef(null),
        initializing = useRef(true);
      const sound = H.useBattleSound(muted);
      const [spark] = useState(() =>
        H.createTransport && acct?.key ? H.createTransport(acct) : null,
      );
      current.current = state;
      useEffect(
        () => () => {
          life.current = false;
          H.CombatFX.cancel();
          clearTimeout(feedbackTimer.current);
          spark?.close();
          sound.bgm(false);
        },
        [],
      );
      function send(command) {
        if (!command) return Promise.resolve();
        const background = command.type === "heartbeat";
        if (
          background &&
          (inFlight.current || actionPending.current || pollingPaused.current)
        )
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
        requests.current = task.catch(() => {});
        return task;
      }
      async function perform(command, background) {
        if (!life.current) return;
        inFlight.current = true;
        if (!background) setError("");
        try {
          if (!spark)
            throw Error(
              "対戦の準備ができていません。メニューから開き直してください",
            );
          let timeout;
          const slow = new Promise((_, reject) => {
            timeout = setTimeout(
              () =>
                reject(
                  Error(
                    "通信が遅れています。接続を確認し、再試行してください。保存結果は再確認します。",
                  ),
                ),
              15000,
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
          if (v.match?.game) seq.current = v.match.game.acceptedSeq;
          if (view === "ratings") setScreen("ratings");
          else if (v.match?.phase === "settled")
            setScreen(
              initializing.current && !initialGhost ? "select" : "result",
            );
          else if (v.match?.phase === "cancelled") {
            setScreen("select");
            setError("対戦開始前に相手が退出しました");
          } else if (v.match) setScreen(v.match.phase);
          else if (v.ticket) setScreen("wait");
          else setScreen("select");
          return v;
        } catch (e) {
          if (life.current) {
            if (["STALE_QUESTION", "SEQUENCE_GAP"].includes(e.message)) {
              retry.current = {
                type: "status",
                matchId: current.current?.match?.id,
              };
              setError("問題が更新されました。最新の問題を確認しています…");
              setTimeout(() => {
                if (life.current) requestRef.current(retry.current);
              }, 100);
              return;
            }
            retry.current = command;
            setError(
              e.message === "The operation was aborted."
                ? "通信が遅れています。結果を確認してから再試行します。"
                : e.message,
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
        if (!acct?.key) {
          setError("登録アカウントでログインしてから検索してください");
          return;
        }
        (async () => {
          const v = await send(
            initialGhost
              ? { type: "directGhost", ...initialGhost }
              : { type: view === "ratings" ? "ratings" : "status" },
          );
          if (
            view === "match" &&
            !initialGhost &&
            v?.match?.phase === "settled"
          )
            await send({ type: "ackReceipt", matchId: v.match.id });
          initializing.current = false;
        })();
      }, []);
      useEffect(() => {
        if (!["wait", "vote", "play"].includes(screen)) return;
        const id = setInterval(() => {
          if (retry.current || pollingPaused.current) return;
          const s = current.current,
            m = s?.match;
          requestRef.current({
            type: "heartbeat",
            ...(m ? { matchId: m.id } : {}),
          });
        }, 1000);
        return () => clearInterval(id);
      }, [screen]);
      useEffect(() => {
        sound.bgm(screen === "play" && !error);
      }, [screen, error, muted]);
      const m = state?.match,
        g = m?.game;
      const [localTime, setLocalTime] = useState(Date.now());
      useEffect(() => {
        if (!["play", "wait"].includes(screen)) return;
        const timer = setInterval(() => setLocalTime(Date.now()), 100);
        return () => clearInterval(timer);
      }, [screen]);
      const time = localTime + (H.FB.off || 0);
      const answer = useCallback((a, b) => {
        const m = current.current?.match,
          g = m?.game;
        if (actionPending.current || retry.current || !g) return;
        const command = {
          type: "answer",
          matchId: m.id,
          question: g.question,
          tiles: [a, b],
          seq: ++seq.current,
        };
        const captured = H.CombatFX.capture(
          [a, b].map((id) => document.querySelector(`[data-btile="${id}"]`)),
          document.querySelector("[data-online-opponent]"),
        );
        const prior = g.live[m.selfUid];
        send(command).then((v) => {
          if (!v?.match || !life.current) return;
          const next = v.match.game?.live[m.selfUid];
          const won =
            v.match.outcome === "win" ||
            (typeof prior === "number" ? next > prior : next?.c > prior?.c);
          const moved =
            v.match.phase === "settled" ||
            v.match.game?.question !== g.question;
          const record = v.match.lastAnswer;
          const judge = won
            ? H.timingVisual(
                record?.ok === false
                  ? { label: "Bad", color: "#FF5C5C" }
                  : H.getJudgment(record?.ms ?? Math.max(0, time - g.startAt)),
              )
            : moved
              ? { label: "次の問題へ", color: "#6BD4E8", small: true }
              : H.timingVisual({ label: "Bad", color: "#FF5C5C" });
          if (won && record?.ok !== false) {
            H.CombatFX.merge(captured, judge.color);
            sound.play("ok");
          } else if (!moved) sound.play("buzz");
          setFeedback({
            judge,
            flash: {
              [a]: won ? "correct" : "wrong",
              [b]: won ? "correct" : "wrong",
            },
          });
          clearTimeout(feedbackTimer.current);
          feedbackTimer.current = setTimeout(() => setFeedback(null), 650);
        });
      }, []);
      useEffect(() => {
        seq.current = g?.acceptedSeq || 0;
      }, [m?.id]);
      return (
        <main
          className={`or-app ${screen === "play" ? "or-playing" : "or-menu"}`}
        >
          <H.FontImport />
          {["play", "result"].includes(screen) && (
            <H.FxLayer level={112} combat />
          )}
          {screen !== "play" && (
            <header>
              <button
                onClick={() => {
                  if (["wait", "vote", "play"].includes(screen)) {
                    setError(
                      "検索をキャンセル、または対戦から退出してから戻ってください",
                    );
                    return;
                  }
                  if (m?.phase === "settled") {
                    send({ type: "ackReceipt", matchId: m.id }).then((v) => {
                      if (v) onExit();
                    });
                    return;
                  }
                  onExit();
                }}
                disabled={busy}
              >
                {initialGhost ? "一覧へ戻る" : "オンラインへ戻る"}
              </button>
              <h2>
                {view === "ratings"
                  ? "オンラインレーティング"
                  : initialGhost || ["bounty", "profile"].includes(m?.origin)
                    ? "指名ゴースト対戦"
                    : "すぐ遊ぶ"}
              </h2>
              <small className="or-version">{root.FactorVersion?.label}</small>
              <button
                aria-label={muted ? "音を出す" : "消音"}
                onClick={() => setMuted(!muted)}
              >
                {muted ? "🔇" : "🔊"}
              </button>
            </header>
          )}
          {error && (
            <section role="alert">
              <p>{error}</p>
              <button
                disabled={busy}
                onClick={() =>
                  send(
                    retry.current || {
                      type: view === "ratings" ? "ratings" : "heartbeat",
                      matchId: m?.id,
                    },
                  )
                }
              >
                再試行・最新結果を確認
              </button>
            </section>
          )}
          {screen === "select" && !initialGhost && (
            <section>
              <h3>難易度を選んで対戦</h3>
              {["easy", "normal"].map((d) => (
                <button
                  key={d}
                  className="or-difficulty"
                  style={{ "--difficulty-color": H.DIFFICULTY_CONFIG[d].color }}
                  disabled={busy || !acct?.key}
                  onClick={() => send({ type: "enqueue", difficulty: d })}
                >
                  {label(d)}で相手を探す
                </button>
              ))}
            </section>
          )}
          {screen === "select" && initialGhost && (
            <section>
              <h3>指名ゴースト対戦</h3>
              <p>
                対象プレイヤーの学習記録で対戦します。公式レーティング・人間対戦数は変更しません。
              </p>
              <button
                disabled={busy}
                onClick={() => send({ type: "directGhost", ...initialGhost })}
              >
                指名対戦を再試行
              </button>
            </section>
          )}
          {screen === "wait" && (
            <section>
              <div className="or-search-icon" aria-hidden="true">
                🔍
              </div>
              <h3>対戦相手を探しています</h3>
              <p className="or-elapsed" aria-label="検索経過時間">
                {Math.max(
                  0,
                  (time - (state?.searchStarted || time)) / 1000,
                ).toFixed(1)}
                秒
              </p>
              <p>
                {state.ghostReady
                  ? "10秒で人間が見つからなければゴースト・BOTが乱入します"
                  : "人間の対戦相手を探しています"}
              </p>
              <button
                disabled={busy}
                onClick={() => send({ type: "cancel", ticket: state.ticket })}
              >
                検索をキャンセル
              </button>
            </section>
          )}
          {screen === "vote" && (
            <section>
              {m.opponent && (
                <div
                  className={`or-intrusion ${m.opponent.type === "hyper" ? "or-hyper" : ""}`}
                  role="status"
                >
                  <strong>
                    {m.opponent.type === "hyper"
                      ? "HYPER GHOST 乱入！"
                      : m.opponent.type === "bot"
                        ? "BOT 乱入！"
                        : "GHOST 乱入！"}
                  </strong>
                  <p>{m.opponent.name}</p>
                  <small>
                    {
                      [
                        "ブロンズ",
                        "シルバー",
                        "ゴールド",
                        "プラチナ",
                        "ダイヤ",
                        "マスター",
                      ][m.opponent.rank]
                    }{" "}
                    ・ レート{m.opponent.rating}
                  </small>
                </div>
              )}
              <h3>{label(m.difficulty)} ・ 方式を選ぶ</h3>
              <p>
                難易度は固定です。方式が分かれた場合・時間切れはランダムに決まります。
              </p>
              {["A", "B"].map((mode) => (
                <button
                  key={mode}
                  disabled={busy}
                  onClick={() => send({ type: "vote", matchId: m.id, mode })}
                >
                  {mode === "A" ? "A：早い者勝ち" : "B：レース＋攻撃"}
                </button>
              ))}
              <button
                disabled={busy}
                onClick={() => send({ type: "leave", matchId: m.id })}
              >
                開始前に退出
              </button>
            </section>
          )}
          {screen === "play" && g && (
            <PlayBoundary
              key={m.id}
              onFailure={() => {
                pollingPaused.current = true;
              }}
              onRecover={() => {
                pollingPaused.current = false;
                send({ type: "status", matchId: m.id });
              }}
              onAbort={() =>
                send({ type: "abortInitialization", matchId: m.id })
              }
            >
              <BattleView
                H={H}
                feedback={feedback}
                m={m}
                g={g}
                time={time}
                muted={muted}
                setMuted={setMuted}
                disabled={busy || !!error}
                onMatch={answer}
                onSpecial={(kind) =>
                  send({
                    type: "special",
                    matchId: m.id,
                    kind,
                    seq: ++seq.current,
                  })
                }
                onLeave={() => {
                  if (
                    time < m.gameStartAt ||
                    confirm("退出すると敗北扱いになります。退出しますか？")
                  )
                    send({ type: "leave", matchId: m.id });
                }}
              />
            </PlayBoundary>
          )}
          {screen === "result" && (
            <Result
              H={H}
              m={m}
              state={state}
              acct={acct}
              titles={titles}
              badgesBefore={badgesBefore.current || {}}
              busy={busy}
              onExit={() =>
                send({ type: "ackReceipt", matchId: m.id }).then((v) => {
                  if (v) onExit();
                })
              }
            />
          )}
          {view === "ratings" && (
            <>
              <nav className="or-tabs" aria-label="ランキングの難易度">
                {["easy", "normal"].map((d) => (
                  <button
                    key={d}
                    aria-pressed={tab === d}
                    onClick={() => setTab(d)}
                  >
                    {label(d)}
                  </button>
                ))}
              </nav>
              <section className="or-self" aria-label="自分のレーティング">
                <h3>{label(tab)} レーティング</h3>
                <strong className="or-rating">
                  {state?.ratings?.[tab]?.rating == null
                    ? "読込中"
                    : Number(state.ratings[tab].rating).toLocaleString(
                        "ja-JP",
                        { maximumFractionDigits: 1 },
                      )}
                </strong>
                <p>有効な人間対戦 {state?.ratings?.[tab]?.games ?? 0}戦</p>
                {!!state?.ratings?.[tab]?.ghost?.games && (
                  <p>ゴースト・BOT：{state.ratings[tab].ghost.games}戦</p>
                )}
                <p>
                  {state?.ranks?.[tab]
                    ? `自分の順位：${state.ranks[tab]}位`
                    : "自分の順位：未掲載"}
                </p>
              </section>
              <section>
                <h3>{label(tab)}ランキング</h3>
                <p className="or-rule">
                  {tab === "easy"
                    ? "掲載条件：EASYレーティング1501以上（対戦数不問）"
                    : "掲載条件：NORMALの有効な人間対戦3戦以上"}
                </p>
                {!state ? (
                  <p>読み込み中…</p>
                ) : !state.rankings?.[tab]?.length ? (
                  <p>掲載条件を満たすプレイヤーはまだいません</p>
                ) : (
                  <ol className="or-ranking">
                    {state.rankings[tab].map((r) => (
                      <li key={r.key}>
                        <span>{r.rank}位</span>
                        <div className="or-player">
                          <button
                            className="or-name"
                            onClick={() => setSelectedPlayer(r)}
                          >
                            {r.name}
                          </button>
                          {titles[r.title] ? (
                            <small>{titles[r.title]}</small>
                          ) : (
                            H.Nick && (
                              <H.Nick id={r.cosmetics?.stats?.nick} block />
                            )
                          )}
                          {H.BadgeIcons && (
                            <H.BadgeIcons
                              st={r.cosmetics?.stats || {}}
                              max={4}
                            />
                          )}
                        </div>
                        <strong>
                          {Number(r.rating).toLocaleString("ja-JP", {
                            maximumFractionDigits: 1,
                          })}
                        </strong>
                        <div
                          className="or-record"
                          aria-label={`${r.name}の${label(tab)}戦績`}
                        >
                          <span>人間対戦 {r.statsKnown ? r.games : "―"}戦</span>
                          <span>勝利 {r.statsKnown ? r.w : "―"}</span>
                          <span>敗北 {r.statsKnown ? r.l : "―"}</span>
                          <span>
                            勝率{" "}
                            {r.statsKnown && r.games
                              ? `${Math.round((r.w / r.games) * 100)}%`
                              : "―"}
                          </span>
                          {!!r.ghost?.games && (
                            <small>
                              乱入対戦：{r.ghost.games}戦・{r.ghost.w}勝{" "}
                              {r.ghost.l}敗（人間戦績とは別集計）
                            </small>
                          )}
                          {!r.statsKnown && (
                            <small>
                              旧レートを引き継いだ記録です。難易度別の戦績は未記録。
                            </small>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
              {!!Object.keys(state?.badges || {}).length && (
                <section>
                  <h3>獲得した称号</h3>
                  <div className="or-titles">
                    {Object.keys(state.badges)
                      .filter((k) => state.badges[k])
                      .map((k) => (
                        <button
                          key={k}
                          disabled={busy}
                          onClick={() => send({ type: "equipTitle", title: k })}
                        >
                          {titles[k]}を装備
                        </button>
                      ))}
                  </div>
                </section>
              )}
            </>
          )}
          {selectedPlayer && H.PlayerProfile && (
            <H.PlayerProfile
              name={selectedPlayer.name}
              st={selectedPlayer.cosmetics?.stats || {}}
              acctKey={selectedPlayer.key}
              me={selectedPlayer.key === acct.key}
              nameOf={() => ""}
              hideLegacyRating
              onClose={() => setSelectedPlayer(null)}
            />
          )}
        </main>
      );
    }
    return { App, Result };
  };
})(window);
