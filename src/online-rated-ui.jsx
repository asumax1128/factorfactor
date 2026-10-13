/* Spark RTDB transport only. No external server or admin credentials. */
(function (root) {
  root.OnlineRatedFactory = function (H) {
    const { useState, useRef, useEffect } = React;
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
    function App({ acct, onExit, view = "match", initialGhost = null }) {
      const [state, setState] = useState(null),
        [error, setError] = useState(""),
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
        requestRef = useRef(null);
      const sound = H.useBattleSound(muted);
      const [spark] = useState(() =>
        H.createTransport && acct?.key ? H.createTransport(acct) : null,
      );
      current.current = state;
      useEffect(
        () => () => {
          life.current = false;
          spark?.close();
          sound.bgm(false);
        },
        [],
      );
      async function send(command) {
        if (inFlight.current) return;
        inFlight.current = true;
        setBusy(true);
        setError("");
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
          retry.current = null;
          setState(v);
          current.current = v;
          if (v.match?.game) seq.current = v.match.game.acceptedSeq;
          if (view === "ratings") setScreen("ratings");
          else if (v.match?.phase === "settled") setScreen("result");
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
          if (life.current) setBusy(false);
        }
      }
      requestRef.current = send;
      useEffect(() => {
        if (acct?.key)
          send(
            initialGhost
              ? { type: "directGhost", ...initialGhost }
              : { type: view === "ratings" ? "ratings" : "status" },
          );
        else setError("登録アカウントでログインしてから検索してください");
      }, []);
      useEffect(() => {
        if (!["wait", "vote", "play"].includes(screen)) return;
        const id = setInterval(() => {
          if (retry.current) return;
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
      const time = Date.now() + (H.FB.off || 0);
      const answer = (a, b) => {
        if (inFlight.current || retry.current || !g) return;
        const command = {
          type: "answer",
          matchId: m.id,
          question: g.question,
          tiles: [a, b],
          seq: ++seq.current,
        };
        send(command);
      };
      useEffect(() => {
        seq.current = g?.acceptedSeq || 0;
      }, [m?.id]);
      return (
        <main
          className={`or-app ${screen === "play" ? "or-playing" : "or-menu"}`}
        >
          <header>
            <button
              onClick={() => {
                if (["wait", "vote", "play"].includes(screen)) {
                  setError(
                    "検索をキャンセル、または対戦から退出してから戻ってください",
                  );
                  return;
                }
                onExit();
              }}
              disabled={busy}
            >
              オンラインへ戻る
            </button>
            <h2>
              {view === "ratings" ? "オンラインレーティング" : "すぐ遊ぶ"}
            </h2>
            <small className="or-version">{root.FactorVersion?.label}</small>
            <button
              aria-label={muted ? "音を出す" : "消音"}
              onClick={() => setMuted(!muted)}
            >
              {muted ? "🔇" : "🔊"}
            </button>
          </header>
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
          {screen === "select" && (
            <section>
              <h3>難易度を選んで対戦</h3>
              {["easy", "normal"].map((d) => (
                <button
                  key={d}
                  disabled={busy || !acct?.key}
                  onClick={() => send({ type: "enqueue", difficulty: d })}
                >
                  {d.toUpperCase()}で相手を探す
                </button>
              ))}
            </section>
          )}
          {screen === "wait" && (
            <section>
              <h3>同じ難易度の相手を検索中</h3>
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
              <h3>{m.difficulty.toUpperCase()} ・ 方式を選ぶ</h3>
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
            <section className="or-battle">
              <h3>
                {m.difficulty.toUpperCase()} ・ {m.mode}方式
              </h3>
              <p>
                Lv.{g.level} ・ {time < g.startAt ? "まもなく開始" : "対戦中"}
              </p>
              <div className="or-live">
                {Object.entries(g.live).map(([uid, v]) => (
                  <p key={uid}>
                    {uid === m.selfUid ? "自分" : "相手"}：
                    {typeof v === "number"
                      ? `${v}点`
                      : `HP ${v.hp.toFixed(1)} ・ ${v.c}正解 ・ コンボ${v.combo}`}
                  </p>
                ))}
              </div>
              <H.TargetCard
                poly={g.poly}
                level={g.level}
                gaugeMs={g.timeoutMs}
                v7
              />
              <H.BattleBoard
                tiles={g.tiles}
                onMatch={answer}
                disabled={
                  busy ||
                  !!error ||
                  time < Math.max(g.startAt, g.readyAt || 0) ||
                  !!g.result
                }
                v7
              />
              {m.mode === "B" && (
                <div>
                  {["big", "heal", "shield"].map((kind) => (
                    <button
                      key={kind}
                      disabled={busy}
                      onClick={() =>
                        send({
                          type: "special",
                          matchId: m.id,
                          kind,
                          seq: ++seq.current,
                        })
                      }
                    >
                      {
                        { big: "大攻撃", heal: "回復", shield: "シールド" }[
                          kind
                        ]
                      }
                    </button>
                  ))}
                </div>
              )}
              <button
                disabled={busy}
                onClick={() => {
                  if (confirm("退出すると敗北扱いになります。退出しますか？"))
                    send({ type: "leave", matchId: m.id });
                }}
              >
                対戦から退出
              </button>
            </section>
          )}
          {screen === "result" && (
            <section>
              <h3>
                {m.outcome === "draw"
                  ? "引き分け"
                  : m.outcome === "win"
                    ? "勝利！"
                    : "敗北"}
              </h3>
              <p>
                レート {m.receipt?.players?.[acct.key]?.before} →{" "}
                {m.receipt?.players?.[acct.key]?.after}
              </p>
              <p>
                {m.origin === "bounty" || m.origin === "profile"
                  ? "指名ゴースト戦：公式レート・対戦数は変更しません。"
                  : `${m.difficulty.toUpperCase()}のレートのみ更新しました。${m.opponent ? "変動幅は人間対戦の1/3。人間との有効対戦数には含みません。" : ""}`}
              </p>
              {m.opponent && <p>獲得EXP：{m.exp}</p>}
              <button
                disabled={busy}
                onClick={() => {
                  send({ type: "ackReceipt", matchId: m.id }).then((v) => {
                    if (v && initialGhost) onExit();
                  });
                }}
              >
                {initialGhost ? "一覧へ戻る" : "もう一度対戦する"}
              </button>
            </section>
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
                    {d.toUpperCase()}
                  </button>
                ))}
              </nav>
              <section className="or-self" aria-label="自分のレーティング">
                <h3>{tab.toUpperCase()} レーティング</h3>
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
                <h3>{tab.toUpperCase()}ランキング</h3>
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
                          aria-label={`${r.name}の${tab.toUpperCase()}戦績`}
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
    return { App };
  };
})(window);
