# CPUのB2接続と観戦の安全な表示

基準 `8be63eb`。開発ブランチだけ。大会B2／観戦全経路の新UI統一まで完了した記録ではない。

## CPU練習

- `src/local-b2-bots.cjs`：従来の`cpuThink`／`cpuMiss`／`CPU_LEVELS`を注入し、各問題に一度だけ思考時間と誤答を抽選。FREEZE中の回答は禁止。既存強さ・人数・難易度を保持。
- `startMatch`のlocal BだけB2へ変更。`RoomB2.prepare`と同じエンジンを既存`makeLocalDb`で使用。ローカルUIDはme、オンラインUID／Firebase DBを使わない。local DBにchild()がないため、同じ完全パスをdb.refで取得する互換APIに変更。
- Room B2クライアントはローカル専用プランナーを渡された時だけ100ms周期でCPUを処理。オンラインホストは従来の500msと同じ。CPU入力を本番へ送る経路は有効化しない。
- 新B結果も`practice`と従来のacct=nullを保持。レート・対人戦績・称号用recordMatchは実行しない。従来CPUの練習EXPと学習prof／ミッションの処理は維持し、B2用公開ゴーストイベントのflushOnlineLearnへ流さない。累積stats.Bを移行・再加算しない。
- C共有エンジン、旧BOT・大会エンジンは削除しない。

## 観戦

- 新Bルーム観戦をPCの複数盤面＋HUD、スマホの全員HUD＋選択盤面へ接続。拡大／対象切替が可能。盤面はinert＋disabledで、応援だけ従来のrequestを使う。
- 開始前・resolving・次問待ち・FREEZE・KO・終了は式／タイルをマウントしない。実況は確定scoreTraceの正解イベントだけ。未確定入力や答えを読み上げない。
- 旧A分割観戦／概要観戦はqStartAの次問待機まで式を描画しない。旧C/Bエンジンは既存liveに`boardReady`という表示フラグだけ追加。false／欠損時は観戦へ問題を出さない。得点やHPの変更はなし。
- 既存liveのC表示フラグは参加者の報告であり、新Bの一括確定履歴と同じ保証ではない。Cの攻撃・回復の確定時系列、旧A/C観戦の全面新UI化は未完了。

## 検証

- `local-b2-bots.test.cjs`：従来思考／誤答関数の利用、同一問題の再計画防止、コマンド重複防止、FREEZEを確認。
- `local-b2-browser.cjs`：実アプリのCPUつよい→B2→ドラッグ正解→CPU正解→結果グラフ。モックの公式レート／対人戦績／装備称号不変、online profile／rooms/local／ghostV1への書込み0。
- `next-spectator-browser.cjs`：375／390／430／1440px、B2 HUD・切替・拡大・横はみ出しなし。開始・FREEZE・resolving・終了で式／タイルDOM0。旧A/Cの表示待機を実コンポーネントで確認。
- `next-board-visibility-browser.cjs`：スマホ／PCの既存先行DOM検証に成功。
- `legacy-regression.cjs`：新しい表示フラグと観戦ガードの式を厳密検査してから、その追加部分だけを正規化し、既存204関数の残りをAST比較。関数丸ごとの除外を追加していない。ソロ／学び／CPU／週ボス／デイリー成功。
- `v524-emulator.cjs`：RoomB2 ref API変更後も実SDKの同期・trace一致・再送拒否・観戦権限拒否が成功。Auth/RTDBはdemoエミュレーターだけ。

## 残課題

大会は教師ホストが試合へ参加せず、複数試合を進行する。既存B2は単一試合のホストpumpを前提とし、現在の大会確定／レート記録をそのまま付け替えられない。教師による各対戦のpump所有・切断復帰・決着を大会進行へ一度だけ反映する設計と専用テストが必要。未検証で切り替えず、旧Bを残す。

実機Safari／Chromebook、全CI、新UIの全観戦経路は未検証。本番操作はしていない。
