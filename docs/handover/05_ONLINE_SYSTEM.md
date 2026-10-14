# オンライン対戦・同期・レーティング

## 入口を分ける

- 新レート戦：BattleApp→`OnlineRatedApp`（名前と異なりSpark transport）、config.enabled/protocol確認後。E/N別検索→同難易度の人間→A/B投票→play→settled→ACK→オンラインメニュー。
- 通常ルーム：4桁code、host/参加/観戦、最大4。A/新B/C、CPU補充、host設定。新Bはルームduration選択。
- クラス大会：先生/開催係の2〜64、A/旧B、Swiss/単敗T。Cは4人チームのルーム／CPU経路で、新独立レートCはない。
- CPU：DBXローカル。登録EXP・学習の保存は完全に無通信ではない。

根拠：[index.html:8469・`function BattleApp`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L8469)、[index.html:10948・`const OnlineComponents`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L10948)、[src/online-rated-ui.jsx:336・`function App`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/src/online-rated-ui.jsx#L336)。

## 検索・開始・キャンセル

slotsを難易度別にtransactionで取得、25秒lease、claim/fallbackを排他化。quickの補完待ちは**5秒**。旧QMの18〜24秒BOT、旧文書10秒を新仕様に転用しない。通常ゴーストのカテゴリ抽選と明示ハイパーTOP10を混同しない。

voteEndは10秒、双方同じ票ならその方式、票割れ/期限はランダムA/B。ゲームstartAtは準備確定から3800ms、表示は3→2→1→GO。数式・カードは開始前にrenderしない。開始前退出/cancelは未決着・無レート、開始後leaveは敗北処理。結果ACKでactiveMatchを処理し、fresh入口は前試合のUIを初期化する。

`enqueue`は移行・現在試合・検索枠を確認し、fallbackの切替時は短い再試行。再送で人間/ゴースト両試合を作らない。競合テストのprofiles.ab permission_deniedはゲーム障害でなく不整合fixtureだった（09参照）。

根拠：[src/online-spark-client.cjs:465・`async function enqueue`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/src/online-spark-client.cjs#L465)、[src/online-spark-client.cjs:613・`async function intrusion`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/src/online-spark-client.cjs#L613)、[server/online-rated/core.cjs:202・`voteEnd: now + 10000`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/server/online-rated/core.cjs#L202)、[index.html:7349・`const BATTLE_START_DELAY`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L7349)。

## 問題・入力・確定

seed/level/kで問題を共有し、同じ問題のheartbeatで並べ替えない。A questionは獲得枠番号、Bは`level:k`、seqは本人の回答順、revisionは試合更新世代で別物。古い問題への回答・不正ID・同一カード2回・seq gap/duplicateを検証する。

ローカルはpointer-up直後に係数照合し演出を開始、公式点は共有確定を待つ。問題表示・選択とFirebase同期を直列に待たせない。新Bのintent.atはServerValue.TIMESTAMP、共通clockでpump、at→UID→input IDの確定順。再送は同枠で不変、seq gapは消費せず保留、無効観戦応援はreject/handledとして処理を止めない。先頭参加者がheartbeatを進め、停止時は他方が引き継ぐ。通常ルームの確定host権限とは別のtransportである。

Aの先着はtransactionの確定claims。確定claimにptsを記録し、aResultはその値と累積点から生成。古い記録にptsがない場合は同じscoreAのlogを後方互換参照し、別得点式を追加しない。consistentフラグが不一致なら詳細表示で注意を出す。リードの反転は各確定得点後の差から見る。

根拠：[src/online-rated-ui.jsx:5・`const trace`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/src/online-rated-ui.jsx#L5)、[src/online-state-order.cjs:3・`function older`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/src/online-state-order.cjs#L3)、[src/b2-pump.cjs:3・`function pump`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/src/b2-pump.cjs#L3)、[server/online-rated/engine.cjs:234・`m.claims[m.claims.length - 1].pts`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/server/online-rated/engine.cjs#L234)、[src/a-result.cjs:2・`function build`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/src/a-result.cjs#L2)。

## 切断・リロード・世代管理

人間旧遷移のlastSeen期限は8秒。開始前はcancel、開始後はleave扱いの勝敗。新BはServerValue時計とpump/peer heartbeat分岐を確認してから旧timeoutを改修する。`.info/connected`復帰時に再同期、revision/serverTime/acceptedSeqが後退する画面応答は採用しない。initialize failureは自分の確定回答前ならabortInitializationで無敗北中断。通信失敗をゲーム敗北に一律変換しない。

ghostは端末内で状態を進め、checkpoint/revisionをまとめて保存し、未確定ACKを再送・復元する。再読込時に乱数予定を再抽選しない。通信喪失の全状態を公式サーバーが自動復旧する仕組みではなく、ユーザーへの再試行が必要な経路がある。

根拠：[server/online-rated/core.cjs:259・`const absent`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/server/online-rated/core.cjs#L259)、[src/online-spark-client.cjs:112・`connectionRef`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/src/online-spark-client.cjs#L112)、[src/online-spark-client.cjs:786・`abortInitialization`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/src/online-spark-client.cjs#L786)、[src/online-spark-client.cjs:90・`savedRevision`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/src/online-spark-client.cjs#L90)。

## レーティング

新profileはeasy/normal各bucket。初回は旧stats.ratingをEへ一回移行、N=1500。name/statsバックアップを一回保存、既存profileを初期化し直さない。旧の欠損レートは1500、数値不正は移行拒否。別難易度のgames/最高値を混ぜない。

Elo期待値 `E=1/(1+10^((相手−自分)/400))`、人間delta=`32×(結果−E)`。結果=勝1/引分0.5/負0、該当難易度の人間games<10で負deltaのみ半分。内部値は小数1桁へ丸めて保存、**画面だけMath.round相当の整数**。MASTERは内部1820以上、表示1820でも1819.6ならMASTERにならない。

JST月シーズン変更時、1500以下は1500、超える値は`round((1500+(r−1500)/2)*10)/10`。旧seasonHist{last,max}と歴代maxを保持。最高レート表示はE/N maxRating・seasonMax・seasonHist.maxおよび安全な旧履歴の最大。未プレイ初期1500/合成previewは歴代記録扱いにしない。

掲載：Eは季節補正後rating≥1501、Nは人間games≥3。順は内部rating降順→人間勝率降順→account key順。同rating/勝率は同順位。表示の整数だけで順位を再判定しない。ハイパー候補は表示順の先頭10件を対象にする。

ルーム旧レートはstats.ratingへ相手ごとの期待値差を合計して記録。新difficultyレートと同じ保存先ではない。ロビーはCurrentRatingsでE/Nを表示し、古いstats.ratingだけを現行Eと断言しない。

根拠：[server/online-rated/core.cjs:28・`function initial`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/server/online-rated/core.cjs#L28)、[server/online-rated/core.cjs:89・`function settle`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/server/online-rated/core.cjs#L89)、[server/online-rated/core.cjs:307・`function rankings`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/server/online-rated/core.cjs#L307)、[index.html:3506・`const RatingHistory`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L3506)、[index.html:3535・`const RatingDisplay`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L3535)、[index.html:3552・`function CurrentRatings`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L3552)。

## ゴースト・ハイパー・指名・自己

通常学習ゴーストは公開prof.lvの合計n≥20。Lv別の成功平均秒とミス率（時間1〜18秒、ミス2〜45%）を用い、未観測Lvを推定する。保存RNGとcpu予定を保持して進める。録画入力の完全再生ではない。hyperは時間×0.75。

quickカテゴリ：up2=5%、up1=15%、same=55%、down1=10%、BOT=10%、hyper=5%。通常カテゴリの該当ランク候補0なら通常allへフォールバック/BOT。**hyperだけはTOP10以外/BOTへ補充せずエラー**。

hyperは同難易度C.rankingsの先頭10件で有効学習あり、weight=11−rank（1位10〜10位1、同順位はそのrank）。欠損候補を除き再正規化。自己TOP10も選べるが自己練習ガードを適用する。

- quickゴースト/BOT：レート変動は人間の1/3、人間gamesに加えずghost統計へ。勝利EXP8、敗/引分0。quick非BOT勝利の格上1/2またはhyper称号を永久追加。
- profile/bounty指名：公式レート/対人gamesを変えない。勝利EXP8（自己は0）。bountyは対象streak≥3と7日制限、勝利時に同対象・難易度横断のcooldown保存。
- 自己：レート、勝敗、EXP、称号、公開学習、本人宛inboxを更新しない。存在しない記録を新規生成して自己を増殖させない。
- 挑戦者matches/eventsと分身側inboxは別。historyの「自分の挑戦／自分の分身」を同じ意味にしない。

根拠：[src/ghost-model.cjs:9・`function eligible`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/src/ghost-model.cjs#L9)、[src/ghost-model.cjs:52・`function category`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/src/ghost-model.cjs#L52)、[src/hyper-select.cjs:2・`function candidates`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/src/hyper-select.cjs#L2)、[src/ghost-model.cjs:123・`function ratingAfter`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/src/ghost-model.cjs#L123)、[src/online-spark-client.cjs:281・`const selfPractice`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/src/online-spark-client.cjs#L281)、[src/online-spark-client.cjs:654・`async function saveGhostResult`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/src/online-spark-client.cjs#L654)。

テスト索引：[13](13_REQUIREMENTS_TRACEABILITY.md)。同期時刻は公平性を改善するが、Sparkクライアント方式が全面的な改造クライアント対策になるとは主張しない。詳しくは[04](04_DATA_AND_FIREBASE.md)。

[総合案内へ](00_START_HERE.md)
