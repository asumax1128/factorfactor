# 既知の問題・制約・技術的負債

コード根拠の静的調査。今回、実機や本番データで発生を再確認した一覧ではない。UI詳細は[17](17_UI_UX_AUDIT_AND_REDESIGN.md)、結果は[16](16_RESULT_SCREEN_COMPARISON.md)。修正は所有者の承認後。

|ID/分類|優先|確認した内容・影響|状態/根拠・次の確認|
|---|---|---|---|
|K01 説明不整合|高|BATTLE_MODES.B/チュートリアルの旧解き切り・手動必殺説明が、時間制B2の入口にも関係する|コード差確認済。UI01。旧B向け説明は残し、入口別に分ける案|
|K02 数学の説明|高|LEVEL_INFO[9].exampleの一次係数21は表示された因数の積27と違う|静的文字列の不整合確認。ジェネレータの積判定が同じ誤りという意味ではない|
|K03 判定名/色|高|getJudgmentにはFair、timingVisualではOK側、ヘルプは6段階|実値差確認済。閾値変更はしない。UI02|
|K04 結果と保存|高|daily.doneは即表示、保存成功待ち/失敗と同画面。UIのgame.scoreと保存max(0,score)に負スコア時の差があり得る|コード経路確認、負点シナリオの実画面未確認。UI04|
|K05 不正防止の境界|高|クライアント/host計算。本人result/proof整合は数学プレイのサーバー再計算ではない|仕様上の信頼境界。改造client全対策済とは言わない。04参照|
|K06 旧権限|高|旧accounts集計は本人自己書込、rooms各枝にlegacy参加者権限。全分野の真正性は同一でない|現行ルールの構造確認。強化には現行全文と既存互換テスト/所有者判断が必要|
|K07 GAS配信|中|dailySoloSeenは外部GAS送信より前に請求。ACK喪失/HTTP失敗で完全なexactly-once配送を保証できない|管理GAS未取得。失敗時に同ID再送できる外部契約を別設計|
|K08 未観測例外|中|buildBoardは別解再試行40、重複200の上限、fake生成も有限|コード確認、上限に達する問題の実測頻度は未確認|
|K09 報酬の意味|中|tw50/tw100説明差、B説明でCも対象、B2cancelTotalが旧と単位差、dmgTakenは誤答罰|既存全件監査。条件変更せず、仕様確認へ|
|K10 非MASTERの外見|中|tile:gold/gem、bg:goldbgは主に旧maxRating。新E/N履歴や装備既得救済はMASTERと異なる|個別生徒データ未読取。未解放不具合と一括断定しない|
|K11 塔の世代差|高|旧TowerApp70階と現行先生試遊5階が同時に残り、旧報酬は現行試遊で増えない|公開入口の差を確認。hidden5は削除しない|
|K12 塔の復帰範囲|中|戦闘途中の盤面/comboのクラウド復元、offline自動merge、次章/公式称号は未実装|07参照。保存済み冒険復帰とは区別|
|K13 版/依存/巨大HTML|中|CDNの一部可変版、起動時Babel、大きい埋込音声、複数生成源|技術的負債。無断大規模bundlingしない|
|K14 UI/EXP|中|人間レートResult、daily、塔でEXP表示/意味が異なる|正当な無報酬と欠落を区別。UI05/結果表|
|K15 実機検証|中|iPhone Safari/ChromeOS実機、PWA実音、全画面overlay/keyboard未確認|既存Chromium模擬と別。生徒端末のハード不良を断定しない|
|K16 全経路テスト|中|全大会人数/ラウンド、全raid役割、長期報酬全取得、全UIを新規E2Eしたわけではない|既存テストと静的網羅を分ける|
|K17 legacy daily fallback|中|ready読取エラーで旧10問UIへ戻り、新仕様と大きく変わる|コード確認。通信異常と旧設定状態を区別する案|
|K18 日時|中|新dailyはserver JST、旧の一部streakは端末日付。週/月/epochのキーも別|一括日付処理置換は既存履歴を壊す。04/05参照|
|K19 初回CIブラウザ失敗|低/要確認|公開過程にChromebook検証の一度の失敗記録があり、同一コードのCI/ローカル再実行は成功|原因未特定。現在も再現する機能不具合とは扱わない|

## 解決済み・再発防止として残すもの

5.13入力を同期で無効化/タイル再生成、5.16別々タップ、5.17表示判定の通信直列・古い問題、5.18二重モーダル、5.20/21歴代MASTER、5.22現在レート参照/整数、5.23開始前DOM・A結果・自己報酬・masterFX、5.25同点/forEach/観戦枠/テストfixtureは履歴と成功CIを参照。**現行に未解決として再掲載しない**。

根拠：[index.html:864・`const LEVEL_INFO`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L864)、[index.html:1361・`const JUDGE_TIERS`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L1361)、[index.html:3125・`function timingVisual`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L3125)、[src/daily-client.cjs:38・`const result=`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/src/daily-client.cjs#L38)、[src/daily-ui.jsx:14・`game?.done`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/src/daily-ui.jsx#L14)、[既存報酬監査](../../reports/titles_achievements_cosmetics_audit.md)、[履歴](11_DEVELOPMENT_HISTORY.md)。

## 優先する次の意思決定

新Bの説明整理、タイム判定の正式な見せ方、結果保存の確定状態、EXP/無報酬の案内、navigation/モーダルの基準を先に所有者と合意する。数学の塔のRPG演出はモード個性として維持し、既存の報酬や難易度をUI整理に紛れて変更しない。

[総合案内へ](00_START_HERE.md)
