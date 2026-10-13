/* Enabled only after an approved, verified server cutover. No admin credentials. */
(function (root) {
  root.OnlineRatedFactory = function (H) {
    const { useState, useRef, useEffect } = React;
    const titles = {
      easy_adept: "EASYの達人",
      easy_master: "EASYマスター",
      normal_adept: "NORMALの達人",
      normal_master: "NORMALマスター",
      dual_master: "双璧のマスター",
    };
    function App({ acct, onExit, endpoint }) {
      const [state, setState] = useState(null),
        [error, setError] = useState(""),
        [screen, setScreen] = useState("select"),
        [tab, setTab] = useState("easy"),
        [busy, setBusy] = useState(false),
        [muted, setMuted] = H.useGameMute();
      const current = useRef(null),
        inFlight = useRef(false),
        seq = useRef(0),
        life = useRef(true),
        retry = useRef(null),
        requestRef = useRef(null);
      const sound = H.useBattleSound(muted);
      current.current = state;
      useEffect(
        () => () => {
          life.current = false;
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
          if (
            endpoint !==
            "https://asia-southeast1-asumath-games.cloudfunctions.net/onlineRated"
          )
            throw Error("新制度の接続先が未確認です");
          const token = await H.getIdToken();
          const controller = new AbortController(),
            timer = setTimeout(() => controller.abort(), 10000);
          let r;
          try {
            r = await fetch(endpoint, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token,
              },
              body: JSON.stringify({
                accountKey: acct.key,
                command: { protocol: 2, ...command },
              }),
              signal: controller.signal,
            });
          } finally {
            clearTimeout(timer);
          }
          const v = await r.json();
          if (!r.ok || v.error) throw Error(v.error || "通信に失敗しました");
          if (!life.current) return;
          retry.current = null;
          setState(v);
          current.current = v;
          if (v.match?.game) seq.current = v.match.game.acceptedSeq;
          if (v.match?.phase === "settled") setScreen("result");
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
        if (acct?.key) send({ type: "status" });
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
        seq.current = 0;
      }, [m?.id]);
      return (
        <main className="or-app">
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
            <h2>難易度別ランダム対戦</h2>
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
                  send(retry.current || { type: "heartbeat", matchId: m?.id })
                }
              >
                再試行・最新結果を確認
              </button>
            </section>
          )}
          {screen === "select" && (
            <section>
              <p>
                難易度を選んで相手を探します。部屋番号対戦・CPUは別メニューです。
              </p>
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
                    {uid === H.FB.uid ? "自分" : "相手"}：
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
              <p>{m.difficulty.toUpperCase()}のレートのみ更新しました。</p>
              <button
                disabled={busy}
                onClick={() => {
                  send({ type: "ackReceipt", matchId: m.id });
                }}
              >
                もう一度対戦する
              </button>
            </section>
          )}
          <section>
            <h3>自分のレーティング</h3>
            {["easy", "normal"].map((d) => (
              <p key={d}>
                {d.toUpperCase()}：{state?.ratings?.[d]?.rating ?? "読込前"} ・{" "}
                {state?.ratings?.[d]?.games ?? 0}戦
                {state?.ranks?.[d]
                  ? " ・ " + state.ranks[d] + "位"
                  : " ・ 掲載は3戦から"}
              </p>
            ))}
            <p>
              {Object.keys(state?.badges || {})
                .filter((k) => state.badges[k])
                .map((k) => (
                  <button
                    key={k}
                    disabled={busy}
                    onClick={() =>
                      send({
                        type: "equipTitle",
                        title: k,
                        ...(m ? { matchId: m.id } : {}),
                      })
                    }
                  >
                    {titles[k]}を装備
                  </button>
                ))}
            </p>
          </section>
          <section>
            <h3>レーティングランキング</h3>
            {["easy", "normal"].map((d) => (
              <button
                key={d}
                aria-pressed={tab === d}
                onClick={() => setTab(d)}
              >
                {d.toUpperCase()}
              </button>
            ))}
            <p>この難易度で有効対戦3戦以上</p>
            {(state?.rankings?.[tab] || []).map((r) => (
              <p key={r.key}>
                {r.rank}位 {r.name} {titles[r.title] || ""}：{r.rating}
              </p>
            ))}
          </section>
        </main>
      );
    }
    return { App };
  };
})(window);
