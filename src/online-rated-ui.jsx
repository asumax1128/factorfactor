/* Spark RTDB transport only. No external server or admin credentials. */
(function (root) {
  root.OnlineRatedFactory = function (H) {
    const { useState, useRef, useEffect, useMemo, useCallback } = React;
    const trace = (kind, detail) =>
      root.OnlineSpark?.performance?.mark(kind, detail);
    const label = (d) => H.DIFFICULTY_CONFIG[d]?.label || d;
    const formatRating = H.RatingDisplay.format;
    const titles = {
      easy_adept: "イージーの達人",
      easy_master: "イージーマスター",
      normal_adept: "ノーマルの達人",
      normal_master: "ノーマルマスター",
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
      extraControls,
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
      const frozen = g.rules === "b2" && time < g.freezeUntil;
      const counting = time < (m.gameStartAt || g.startAt),
        ready = !!g.resolving || time < Math.max(g.startAt, g.readyAt || 0);
      // Do not mount the next board until the authoritative input window opens.
      const boardHidden = counting || frozen || ready || !!g.result;
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
      useEffect(() => {
        if (!disabled && !boardHidden)
          trace("input-ready", { match: m.id, question: g.question });
      }, [disabled, boardHidden, g.question]);
      useEffect(() => {
        if (counting)
          trace("countdown-display", {
            match: m.id,
            plannedAt: (m.gameStartAt || g.startAt) - 3800,
            actualAt: Date.now() + (H.FB.off || 0),
          });
      }, [counting, m.id]);
      const [iceBreak,setIceBreak]=useState(false), previousFreeze=useRef(false);
      useEffect(()=>{const was=previousFreeze.current;previousFreeze.current=frozen;if(was&&!frozen){setIceBreak(true);const t=setTimeout(()=>setIceBreak(false),450);return()=>clearTimeout(t)}},[frozen]);
      const N = H.DIFFICULTY_CONFIG[m.difficulty].clearCount;
      return (
        <H.BattleSurface>
          <div
            className="v7-play or-battle"
            data-online-mode={m.mode}
            data-online-ready={!disabled && !counting && !frozen && !ready && !g.result}
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
                  m.mode === "A" ? opponent || 0 : g.rules === "b2" ? `${self?.c || 0}問` : `${self?.c || 0}/${N}`,
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
                {Array.from({ length: g.rules==='b2'?20:N }, (_, i) => (
                  <i
                    key={i}
                    style={{
                      background:
                        i < (g.rules==='b2'?Math.max(0,Math.min(20,20*(time-m.gameStartAt)/(g.endAt-m.gameStartAt))):m.mode === "A" ? Number(g.question) : self?.c || 0)
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
              {m.mode === "B" && g.rules !== "b2" && !m.daily && (
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
                {Math.max(0, ((g.rules === "b2" ? g.endAt-time : g.timeoutMs - (time - g.startAt))) / 1000).toFixed(
                  1,
                )}
                秒
              </p>
              {extraControls}
            </div>
            <div className="v7-main" inert={counting || frozen ? "" : undefined} aria-hidden={counting || frozen || undefined}>
              <div className="or-feedback" aria-live="polite">
                <H.TimingJudgment
                  judge={feedback?.judge}
                  className="or-timing"
                />
                <H.ComboDisplay combo={combo} />
              </div>
              {!boardHidden && <><div className="relative" style={{ flexShrink: 0 }}>
                <H.TargetCard
                  poly={g.poly}
                  level={g.level}
                  qLabel={`問${m.mode === "A" ? Number(g.question) + 1 : (self?.c || 0) + 1}${g.rules === "b2" ? "" : "/"+N}`}
                  gaugeKey={g.question + ":" + g.startAt}
                  gaugeMs={Math.max(1, g.timeoutMs - (time - g.startAt))}
                  v7
                />
              </div>
              <H.BattleBoard
                flash={feedback?.flash}
                tiles={tiles}
                onMatch={onMatch}
                disabled={disabled || counting || frozen || ready || !!g.result}
                dim={ready}
                v7
              /></>}
              <p className="v7-hint">
                {m.mode === "A"
                  ? "先に正解した人だけ得点 ・ まちがえると2秒お手つき"
                  : m.daily ? "最後まで完走でクリア ・ 誤答があっても続けられます" : "コンボで攻撃 ・ ゲージ満タンで必殺技"}
              </p>
            </div>
            {g.rules === "b2" && <div className="or-b2-status">必殺ゲージ {self?.gauge || 0}% ・ お邪魔 {self?.cur?.oj || 0}枚 ・ カウンター {self?.pending ? Math.max(0,(self.counterUntil-time)/1000).toFixed(1)+"秒" : "―"}</div>}
            {iceBreak && <div className="or-ice-break" aria-hidden="true">{[0,1,2,3,4,5,6,7].map(i=><i key={i} style={{left:(i%4)*25+"%",top:Math.floor(i/4)*50+"%","--ice-x":(i%2?1:-1)*120+"px"}} />)}</div>}
            {frozen && <div className="or-freeze" aria-label="FREEZE中"><strong>FREEZE!</strong><b>{Math.ceil((g.freezeUntil-time)/1000)}</b></div>}
            {counting && (
              <div className="or-countdown" aria-label="開始カウントダウン">
                {(m.gameStartAt || g.startAt) - time > 3000
                  ? "READY"
                  : Math.max(
                      1,
                      Math.ceil(((m.gameStartAt || g.startAt) - time) / 1000),
                    )}
              </div>
            )}
            {!counting && time < (m.gameStartAt || g.startAt) + 550 && <div className="or-countdown" style={{background:'transparent',pointerEvents:'none'}} aria-label="対戦開始">GO!</div>}
          </div>
        </H.BattleSurface>
      );
    }
    function ResultLegacy({ H, m, state, acct, titles, badgesBefore, busy, onExit }) {
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
            レート {Math.round(r?.delta ?? 0) > 0 ? "+" : ""}
            {formatRating(r?.delta ?? 0)}
          </strong>
          <p>
            {formatRating(r?.before)} → {formatRating(r?.after)}
          </p>
          <p>
            {m.selfPractice ? "自分のゴーストとの練習：レート・勝敗・EXP・称号・学習記録は更新しません" : ["bounty", "profile"].includes(m.origin)
              ? "指名戦：公式レート・対戦数は変更しません"
              : `${label(m.difficulty)}のみ更新${m.opponent ? "（変動は人間戦の1/3）" : ""}`}
          </p>
          {m.opponent && (
            <div className="or-exp">
              獲得EXP <b>+{m.exp || 0}</b>
            </div>
          )}
          {m.rules === "b2" && root.NextResults && <root.NextResults.BDetails report={m.bResult} me={m.selfUid} names={Object.fromEntries((m.members||[]).map(u=>[u.uid,u.uid==='_ghost'?m.opponent?.name:u.name]))}/>}
          {m.mode === "A" && <H.AResultDetails report={m.aResult} me={m.selfUid} names={Object.fromEntries((m.members||[]).map(u=>[u.uid,u.uid==='_ghost'?m.opponent?.name:u.name]))} />}
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
    // Ver.6.0: random-match result on the shared ResultShell. Display only: the ack / exit callbacks, rating receipt,
    // EXP and title detection are exactly the original values; comparison and highlights appear only when the settled
    // match already carries the data (nothing is inferred).
    function Result(props) {
      const { H, m, state, acct, titles, badgesBefore, busy, onExit } = props;
      const NR = root.NextResults;
      if (!(NR && NR.ResultActions && NR.BattleSummary && NR.MinimalSummary && NR.TitleReveal)) return <ResultLegacy {...props} />;
      const won = m.outcome === "win",
        r = m.receipt?.players?.[acct.key];
      const newTitles = Object.keys(state.badges || {}).filter((k) => !badgesBefore[k] && titles[k]);
      useEffect(() => {
        if (won) H.CombatFX.victory();
        return () => H.CombatFX.cancel();
      }, [m.id]);
      const names = useMemo(() => Object.fromEntries((m.members || []).map((u) => [u.uid, u.uid === "_ghost" ? m.opponent?.name : u.name])), [m.id]);
      const model = useMemo(() => {
        if (!m.members || !m.selfUid || !(m.mode === "A" || m.rules === "b2")) return null;
        try {
          return NR.ResultModel.build({
            kind: m.mode === "A" ? "A" : "B", me: m.selfUid, ids: m.members.map((u) => u.uid), names,
            outcome: { win: "w", draw: "d", lose: "l" }[m.outcome] || "l", reasonText: "",
            A: m.mode === "A" ? { report: m.aResult } : undefined,
            B: m.mode !== "A" ? { game: m.game, trace: m.bResult } : undefined,
          });
        } catch (e) { return null; }
      }, [m.id, m.outcome]);
      const note = m.selfPractice ? "自分のゴーストとの練習：レート・勝敗・EXP・称号・学習記録は更新しません" : ["bounty", "profile"].includes(m.origin)
        ? "指名戦：公式レート・対戦数は変更しません"
        : `${label(m.difficulty)}のみ更新${m.opponent ? "（変動は人間戦の1/3）" : ""}`;
      const reveal = (
        <NR.TitleReveal
          titles={newTitles.map((k) => ({ id: k, icon: H.nickOf?.(k)?.icon || "🏅", label: titles[k] }))}
          revealKey={`${acct.key}:${m.id}`}
          fx={{ sound: () => H.fxSound?.("badge"), confetti: () => H.FX?.confetti?.(30) }}
        />
      );
      const growth = (
        <>
          <div className="rs-rate">
            <strong className="or-delta">
              レート {Math.round(r?.delta ?? 0) > 0 ? "+" : ""}
              {formatRating(r?.delta ?? 0)}
            </strong>
            <p>
              {formatRating(r?.before)} → {formatRating(r?.after)}
            </p>
            {m.opponent && (
              <div className="or-exp">
                獲得EXP <b>+{m.exp || 0}</b>
              </div>
            )}
          </div>
          {reveal}
        </>
      );
      const notes = <p className="rs-origin">{note}</p>;
      const outcome = { win: "w", draw: "d", lose: "l" }[m.outcome] || "l";
      return (
        <section className={`or-result rs-rated ${won ? "or-victory" : "or-defeat"}`} data-result-kind={m.outcome}>
          {won && <div className="or-victory-rays" aria-hidden="true" />}
          <NR.ResultShell kind="R" outcome={m.outcome} busy={busy}>
            {model ? (
              <NR.BattleSummary model={model} notes={notes} growth={growth} />
            ) : (
              <NR.MinimalSummary outcome={m.outcome} methodLabel={m.mode === "A" ? "A方式" : m.mode === "B" ? "B方式" : "ランダム対戦"} notes={notes} growth={growth} />
            )}
            {m.rules === "b2" && <NR.BDetails report={m.bResult} me={m.selfUid} names={names} />}
            {m.mode === "A" && <H.AResultDetails report={m.aResult} me={m.selfUid} names={names} />}
            <NR.ResultActions busy={busy}>
              <NR.ResultButton tone="primary" disabled={busy} onClick={onExit}>
                {["bounty", "profile"].includes(m.origin) ? "一覧へ戻る" : "オンラインメニューへ戻る"}
              </NR.ResultButton>
            </NR.ResultActions>
          </NR.ResultShell>
        </section>
      );
    }
    function App({ acct, onExit, view = "match", initialGhost = null, rankingMode = false }) {
      const [state, setState] = useState(null),
        [error, setError] = useState(""),
        [feedback, setFeedback] = useState(null),
        [screen, setScreen] = useState(
          view === "ratings" ? "ratings" : "select",
        ),
        [tab, setTab] = useState("easy"),
        [hyperChoice,setHyperChoice] = useState(false),
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
          const old = current.current?.match,
            next = v.match;
          // A delayed acknowledgement must never roll back a newer board/result.
          if (root.OnlineSpark.olderView(old, next)) return current.current;
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
          else setScreen(view === "ghosts" ? "ghostMenu" : "select");
          return v;
        } catch (e) {
          if (life.current) {
            if (["STALE_QUESTION", "SEQUENCE_GAP", "FROZEN"].includes(e.message)) {
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
        const id = setInterval(
          () => {
            if (retry.current || pollingPaused.current) return;
            const s = current.current,
              m = s?.match;
            requestRef.current({
              type: "heartbeat",
              ...(m ? { matchId: m.id } : {}),
            });
          },
          screen === "play" && current.current?.match?.opponent ? 100 : 1000,
        );
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
      // Read the clock on the transition render too; vote renders must not reuse a stopped timer.
      const time = Date.now() + (H.FB.off || 0);
      const answer = useCallback((a, b) => {
        trace("release");
        const m = current.current?.match,
          g = m?.game;
        if (actionPending.current || retry.current || !g) return;
        if (Date.now() + (H.FB.off || 0) < (m.gameStartAt || g.startAt) || Date.now() + (H.FB.off || 0) < (g.freezeUntil || 0)) return;
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
        // Preview the same polynomial check as CPU practice. No official score is
        // awarded here: RTDB/engine acceptance remains the authority for progression.
        const factors = [a, b].map(
          (id) => g.tiles.find((t) => t.id === id)?.factor,
        );
        if (factors.some((f) => !f)) return;
        const ok = H.polyEqual(H.multiply(...factors), g.poly);
        trace("local-verdict", {
          match: m.id,
          question: g.question,
          seq: command.seq,
          ok,
        });
        const judge = H.timingVisual(
          ok
            ? H.getJudgment(
                Math.max(0, Date.now() + (H.FB.off || 0) - g.startAt),
              )
            : { label: "Bad", color: "#FF5C5C" },
        );
        if (ok) {
          H.CombatFX.merge(captured, judge.color);
          sound.play("ok");
        } else sound.play("buzz");
        setFeedback({
          judge,
          flash: {
            [a]: ok ? "correct" : "wrong",
            [b]: ok ? "correct" : "wrong",
          },
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
          {screen !== "play" && !(rankingMode && view === "ratings" && root.NextRanking) && (
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
                  : view === 'ghosts' ? 'ゴースト対戦'
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
          {screen === 'ghostMenu' && <section>
            <h3>ゴースト対戦を選ぶ</h3>
            {!hyperChoice ? <>
              {['easy','normal'].map(d=><button key={d} className="or-difficulty" style={{'--difficulty-color':H.DIFFICULTY_CONFIG[d].color}} disabled={busy||!acct?.key||!state?.ghostReady} onClick={()=>send({type:'randomGhost',difficulty:d,kind:'ghost'})}>{label(d)}ゴースト</button>)}
              <button disabled={busy||!acct?.key||!state?.ghostReady} onClick={()=>setHyperChoice(true)}>ハイパーゴースト</button>
            </> : <>
              <p>各難易度のランキングTOP10から抽選します。順位が高いほど選ばれやすく、学習記録20問未満のプレイヤーは候補に入りません。</p>
              {['easy','normal'].map(d=><button key={d} className="or-difficulty" style={{'--difficulty-color':H.DIFFICULTY_CONFIG[d].color}} disabled={busy} onClick={()=>send({type:'randomGhost',difficulty:d,kind:'hyper'})}>{label(d)}ハイパーゴースト</button>)}
              <button onClick={()=>setHyperChoice(false)}>ゴーストメニューへ戻る</button>
            </>}
          </section>}
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
                  ? "5秒で人間が見つからなければゴースト・BOTが乱入します"
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
                    ・ レート{formatRating(m.opponent.rating)}
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
              {rankingMode && root.NextRanking ? (() => {
                // Ver.6.0 ranking look: same data, same listing rule, same ranks; only presentation changed.
                const R = root.NextRanking, mine = state?.ratings?.[tab];
                const rows = state?.rankings?.[tab] || [];
                const status = !state ? "loading" : rows.length ? "ok" : "empty";
                return (
                  <div className="rk-rating" data-ranking="rating">
                    <R.RankingHead title="レーティングランキング" />
                    <R.Segmented label="ランキングの難易度" items={[["easy", label("easy")], ["normal", label("normal")]]} value={tab} onChange={setTab} />
                    <section className="rk-selfcard" aria-label="自分のレーティング">
                      <span>{label(tab)} レーティング</span>
                      <strong className="or-rating">{mine?.rating == null ? "読込中" : formatRating(mine.rating)}</strong>
                      <p>有効な人間対戦 {mine?.games ?? 0}戦{!!mine?.ghost?.games && `・ゴースト・BOT：${mine.ghost.games}戦`}</p>
                      <p>{state?.ranks?.[tab] ? `自分の順位：${state.ranks[tab]}位` : "自分の順位：未掲載"}</p>
                    </section>
                    <p className="rk-foot">{label(tab)}ランキング ／ {tab === "easy" ? "掲載条件：イージーレーティング1501以上（対戦数不問）" : "掲載条件：ノーマルの有効な人間対戦3戦以上"}</p>
                    <R.ListState status={status} message={status === "loading" ? "読み込み中…" : "掲載条件を満たすプレイヤーはまだいません"} />
                    {status === "ok" && (
                      <R.RankList label={label(tab) + "ランキング"}>
                        {rows.map((r) => (
                          <R.RankRow key={r.key} rank={r.rank} name={r.name} onName={() => setSelectedPlayer(r)} self={!!acct?.key && r.key === acct.key}
                            value={formatRating(r.rating)}
                            extra={<>
                              {titles[r.title] ? <small>{titles[r.title]}</small> : H.Nick && <H.Nick id={r.cosmetics?.stats?.nick} block />}
                              {H.BadgeIcons && <H.BadgeIcons st={r.cosmetics?.stats || {}} max={4} />}
                            </>}
                            sub={`人間対戦 ${r.statsKnown ? r.games : "―"}戦・勝利 ${r.statsKnown ? r.w : "―"}・敗北 ${r.statsKnown ? r.l : "―"}・勝率 ${r.statsKnown && r.games ? `${Math.round((r.w / r.games) * 100)}%` : "―"}`
                              + (r.ghost?.games ? `　乱入対戦：${r.ghost.games}戦・${r.ghost.w}勝 ${r.ghost.l}敗（人間戦績とは別集計）` : "")
                              + (!r.statsKnown ? "　旧レートを引き継いだ記録です。難易度別の戦績は未記録。" : "")} />
                        ))}
                      </R.RankList>
                    )}
                  </div>
                );
              })() : (
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
                    : formatRating(state.ratings[tab].rating)}
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
                    ? "掲載条件：イージーレーティング1501以上（対戦数不問）"
                    : "掲載条件：ノーマルの有効な人間対戦3戦以上"}
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
                          {formatRating(r.rating)}
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
              </>
              )}
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
    return { App, Result, BattleView };
  };
})(window);
