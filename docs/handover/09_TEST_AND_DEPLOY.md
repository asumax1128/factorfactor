# テスト・CI・公開手順

## この引継ぎで実行したこと

文書のファイル数、Markdownリンク、根拠コード/行番号、既存CSV件数、変更範囲だけを静的確認する。ゲームのテスト・ビルド・Playwright・Emulatorを今回は再実行しない。基準版の成功根拠は[5584885のActions](https://github.com/asumax1128/factorfactor/actions/runs/38611955199)。過去の成功は将来変更の検証を省く承認ではない。

## 環境・依存

Node24、npm ci（lockfile維持）、ブラウザテストはPlaywright1.64.0とChromium、RTDB/Authはfirebase-tools14.27.0・Java21のdemo Emulator。CHROMIUM_PATHで検証対象ブラウザを明示する。配信Firebase compat10.12.2と開発SDK12.12.0の差を意識する。

実機Safari/ChromeOSの操作、音/フォントの取得可否、GAS本番の管理処理はEmulatorやモックだけで証明できない。外部ダウンロードが403の場合は許可ドメイン/認証を調べ、TLS/検証を無効化しない。過去のcloud環境ではPlaywright公式配布が制限されたが、CI標準Chromiumで実行できた。

## コマンドの選び方

|変更対象|最低限確認する入口（実装作業が承認された場合）|
|---|---|
|数学/ソロ|test:regression、共有engine tests、該当モードの実操作|
|ドラッグ/表示|test:online-playability、test:chromebook、対象のUI browser|
|レート/最高値/MASTER|test:rating-history、test:rating-display、test:online-improvements|
|新B/日次/ハイパー|test:online-v524、tests/v524-emulator.cjs、hyper/b2/daily各unit|
|報酬台帳|test:rewards-audit（生成資料の更新は別途許可が必要）|
|ゴースト/委任|test:ghost、ghost-emulator.cjs、event-host-emulator.cjs|
|塔|test:tower、対応flow/rpg/recovery/browser/rules、対象floor画像|
|音|test:audio、muteを実操作|
|生成物/公開前|npm run build:pages、生成物差分、test:version、全CI|

`package.json`のscriptsが正本。`tests/*.test.cjs`の全実行とpackageのCI経路は完全には同じでない。根拠：[package.json:4・`"scripts"`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/package.json#L4)。

## テストファイル全件索引

基準のtests直下CJSは61件（共通補助を含む）。「CI直接経路」はworkflowかpackage commandへの直接参照を示し、補助/手動扱いを未実装のテストと混同しない。テスト内容の主張は本文・assertionを確認する。

|ファイル|主対象|実行入口|位置付け|
|---|---|---|---|
|[account-ranking-regression.cjs](../../tests/account-ranking-regression.cjs)|登録・ログイン・個人/共有ソロ順位|`npm run test:accounts`|CI直接経路|
|[audio-regression.cjs](../../tests/audio-regression.cjs)|音|`npm run test:audio`|CI直接経路|
|[b2.test.cjs](../../tests/b2.test.cjs)|新B|`npm run test:online-v524`|CI直接経路|
|[battle-countdown-browser.cjs](../../tests/battle-countdown-browser.cjs)|開始前の数式・カード非描画とGO入力解禁|`npm run test:online-improvements`|CI直接経路|
|[bounty-profile-browser.cjs](../../tests/bounty-profile-browser.cjs)|賞金首リスト→プロフィールの単一モーダル遷移|`npm run test:bounty-profile`|CI直接経路|
|[browser-harness.cjs](../../tests/browser-harness.cjs)|ブラウザ起動・fixture・座標操作の共通補助|`他テストからrequire`|補助（単独競技テストではない）|
|[chromebook-browser.cjs](../../tests/chromebook-browser.cjs)|小高さ・拡大相当viewport・touch/mouse drag|`npm run test:chromebook`|CI直接経路|
|[combat-events-v514.test.cjs](../../tests/combat-events-v514.test.cjs)|HP/回復/防御/コンボの表示イベント抽出|`npm run test:online-presentation`|CI直接経路|
|[daily-model.test.cjs](../../tests/daily-model.test.cjs)|日次競技|`npm run test:online-v524`|CI直接経路|
|[daily-play.test.cjs](../../tests/daily-play.test.cjs)|日次競技|`npm run test:online-v524`|CI直接経路|
|[event-host-emulator.cjs](../../tests/event-host-emulator.cjs)|先生と限定開催係のgrant/部屋認可|`node tests/event-host-emulator.cjs`|CI直接経路|
|[game-audio.test.cjs](../../tests/game-audio.test.cjs)|音|`npm run test:audio`|CI直接経路|
|[game-version.test.cjs](../../tests/game-version.test.cjs)|版番号|`npm run test:version`|CI直接経路|
|[ghost-emulator.cjs](../../tests/ghost-emulator.cjs)|ハイパー/ゴースト|`node tests/ghost-emulator.cjs`|CI直接経路|
|[ghost-learning.test.cjs](../../tests/ghost-learning.test.cjs)|ハイパー/ゴースト|`npm run test:ghost`|CI直接経路|
|[ghost-ui-browser.cjs](../../tests/ghost-ui-browser.cjs)|ハイパー/ゴースト|`npm run test:ghost`|CI直接経路|
|[hyper-top10.test.cjs](../../tests/hyper-top10.test.cjs)|ハイパー/ゴースト|`npm run test:online-v524`|CI直接経路|
|[legacy-regression.cjs](../../tests/legacy-regression.cjs)|数学生成・既存ソロ/UIの回帰|`npm run test:regression`|CI直接経路|
|[master-effect-browser.cjs](../../tests/master-effect-browser.cjs)|歴代MASTERエフェクトの解放・装備|`npm run test:online-improvements`|CI直接経路|
|[math-tower-adventures.test.cjs](../../tests/math-tower-adventures.test.cjs)|数学の塔|`npm run test:tower`|CI直接経路|
|[math-tower-browser.cjs](../../tests/math-tower-browser.cjs)|数学の塔|`npm run test:tower:browser`|CI直接経路|
|[math-tower-core.test.cjs](../../tests/math-tower-core.test.cjs)|数学の塔|`npm run test:tower`|CI直接経路|
|[math-tower-floor3-background.cjs](../../tests/math-tower-floor3-background.cjs)|数学の塔|`npm run test:tower:background`|CI直接経路|
|[math-tower-flow-browser.cjs](../../tests/math-tower-flow-browser.cjs)|数学の塔|`npm run test:tower:flow`|CI直接経路|
|[math-tower-live-save.cjs](../../tests/math-tower-live-save.cjs)|数学の塔|`node tests/math-tower-live-save.cjs`|補助/手動またはCI内部呼出（実行前に本文確認）|
|[math-tower-local-play.cjs](../../tests/math-tower-local-play.cjs)|数学の塔|`node tests/math-tower-local-play.cjs`|補助/手動またはCI内部呼出（実行前に本文確認）|
|[math-tower-production-audit.cjs](../../tests/math-tower-production-audit.cjs)|数学の塔|`node tests/math-tower-production-audit.cjs`|補助/手動またはCI内部呼出（実行前に本文確認）|
|[math-tower-recovery-browser.cjs](../../tests/math-tower-recovery-browser.cjs)|数学の塔|`npm run test:tower:recovery`|CI直接経路|
|[math-tower-reference-audit.cjs](../../tests/math-tower-reference-audit.cjs)|数学の塔|`node tests/math-tower-reference-audit.cjs`|補助/手動またはCI内部呼出（実行前に本文確認）|
|[math-tower-rpg-browser.cjs](../../tests/math-tower-rpg-browser.cjs)|数学の塔|`npm run test:tower:rpg`|CI直接経路|
|[math-tower-rules.cjs](../../tests/math-tower-rules.cjs)|数学の塔|`node tests/math-tower-rules.cjs`|補助/手動またはCI内部呼出（実行前に本文確認）|
|[math-tower-store.test.cjs](../../tests/math-tower-store.test.cjs)|数学の塔|`npm run test:tower`|CI直接経路|
|[math-tower-ui-polish.cjs](../../tests/math-tower-ui-polish.cjs)|数学の塔|`npm run test:tower:polish`|CI直接経路|
|[math-tower-writer.test.cjs](../../tests/math-tower-writer.test.cjs)|数学の塔|`npm run test:tower`|CI直接経路|
|[online-improvements-browser.cjs](../../tests/online-improvements-browser.cjs)|A結果詳細・自己練習・開始遮蔽の表示|`npm run test:online-improvements`|CI直接経路|
|[online-improvements.test.cjs](../../tests/online-improvements.test.cjs)|A確定得点履歴・リード反転・自己練習の純粋処理|`npm run test:online-improvements`|CI直接経路|
|[online-latency-browser.cjs](../../tests/online-latency-browser.cjs)|遅延下の即時演出・盤面安定・選択維持|`npm run test:online-latency`|CI直接経路|
|[online-latency-native.cjs](../../tests/online-latency-native.cjs)|実SDK/Emulator遅延と世代管理|`node tests/online-latency-native.cjs`|CI直接経路|
|[online-menu-browser.cjs](../../tests/online-menu-browser.cjs)|オンライン入口・画面状態初期化|`npm run test:online-menu`|CI直接経路|
|[online-playability-browser.cjs](../../tests/online-playability-browser.cjs)|CPUとオンラインのdrag操作・解答進行|`npm run test:online-playability`|CI直接経路|
|[online-rated-browser.cjs](../../tests/online-rated-browser.cjs)|管理サービス案のオンラインUI（現行Sparkと別）|`node tests/online-rated-browser.cjs`|補助/手動またはCI内部呼出（実行前に本文確認）|
|[online-rated-migration.test.cjs](../../tests/online-rated-migration.test.cjs)|旧レート移行/backup/履歴保全|`npm run test:online-rated`|CI直接経路|
|[online-rated-rules.cjs](../../tests/online-rated-rules.cjs)|オンライン・学習・UI（ファイル名/本文参照）|`node tests/online-rated-rules.cjs`|補助/手動またはCI内部呼出（実行前に本文確認）|
|[online-rated-service-emulator.cjs](../../tests/online-rated-service-emulator.cjs)|管理サービス案の認証・レート処理（Spark本体とは別）|`node tests/online-rated-service-emulator.cjs`|補助/手動またはCI内部呼出（実行前に本文確認）|
|[online-rated.test.cjs](../../tests/online-rated.test.cjs)|E/Nレート・遷移・共有ゲームモデル|`npm run test:online-rated`|CI直接経路|
|[online-rating-audit.cjs](../../tests/online-rating-audit.cjs)|オンライン・学習・UI（ファイル名/本文参照）|`node tests/online-rating-audit.cjs`|補助/手動またはCI内部呼出（実行前に本文確認）|
|[online-regression.cjs](../../tests/online-regression.cjs)|既存ルーム・CPU・battle UI回帰|`npm run test:online`|CI直接経路|
|[online-spark-browser.cjs](../../tests/online-spark-browser.cjs)|Spark接続UIをfixtureで検証|`npm run test:online-rated`|CI直接経路|
|[online-spark-emulator.cjs](../../tests/online-spark-emulator.cjs)|実SDK複数clientのAuth・E/N検索・回答・レート・再送|`node tests/online-spark-emulator.cjs`|CI直接経路|
|[online-spark-entry.cjs](../../tests/online-spark-entry.cjs)|Spark config/ログインの入口処理|`npm run test:online-entry`|CI直接経路|
|[online-state-order.test.cjs](../../tests/online-state-order.test.cjs)|古いrevision/seq/時刻の表示拒否|`npm run test:online-latency`|CI直接経路|
|[online-ui-v514.cjs](../../tests/online-ui-v514.cjs)|既存UI・検索・戦闘・結果・6色の表示|`npm run test:online-presentation`|CI直接経路|
|[rating-display-browser.cjs](../../tests/rating-display-browser.cjs)|ロビーと部門順位の参照先・整数表示|`npm run test:rating-display`|CI直接経路|
|[rating-display.test.cjs](../../tests/rating-display.test.cjs)|整数formatと内部非丸め/部門レート参照|`npm run test:rating-display`|CI直接経路|
|[rating-history-browser.cjs](../../tests/rating-history-browser.cjs)|歴代最高レートとMASTERタイル表示|`npm run test:rating-history`|CI直接経路|
|[rating-history.test.cjs](../../tests/rating-history.test.cjs)|E/N最高履歴・欠損/旧値・MASTER永続判定|`npm run test:rating-history`|CI直接経路|
|[rewards-audit-browser.cjs](../../tests/rewards-audit-browser.cjs)|報酬監査|`npm run test:rewards-audit`|CI直接経路|
|[rewards-audit.cjs](../../tests/rewards-audit.cjs)|報酬監査|`npm run test:rewards-audit`|CI直接経路|
|[ui-font-v515.cjs](../../tests/ui-font-v515.cjs)|旧日本語UIフォントと数式フォント保護|`npm run test:ui-font`|CI直接経路|
|[v524-browser.cjs](../../tests/v524-browser.cjs)|新B・daily・hyperメニューと実カード操作|`npm run test:online-v524`|CI直接経路|
|[v524-emulator.cjs](../../tests/v524-emulator.cjs)|新B intent/応援、daily回数/日付/同点/称号認可|`node tests/v524-emulator.cjs`|CI直接経路|

## Emulatorと本番を分離

`GCLOUD_PROJECT=demo-factorfactor-tower`、`firebase.spark.emulator.json`でAuth/Databaseを起動。`firebase/emulator.json`は塔のDatabase用。`RTDB_RULES_BASELINE_FILE`は承認済み元ルールをローカルファイルへ置くためのパス。CIはSecretの値を表示せず一時ファイルへ書く。資料へ値や実アカウントIDを書かない。

fixtureのSecurityRulesDisabledはdemoデータ生成だけ。本番設定で同じテストを実行しない。新ルールが通ったことと現在のConsole全文一致は別である。

## 現行CIの順序・公開条件

1. push main/release/v524/release/v525、PR→main、または手動dispatchで起動。並行groupはfactorfactor-pages、cancel-in-progress=false。
2. checkout全履歴、Node24/Java21、workflow検査、npm ci、CI標準Chromiumを導入。
3. 承認済みルールsnapshotの存在/形式、正式version、build:pagesを確認。
4. コミット済み生成UI/CSV/engine-sourceの再生成差分ゼロを確認。
5. 版・塔・実Emulator認可・音・各回帰・新旧オンライン・報酬・新B/daily/hyper・Chromebookを実行。
6. Auth/RTDB実SDKでマッチング/レート、遅延/ゴースト/委任/日次/新B認可、アカウントを検証。
7. 最終dist再検査、Pages artifactアップロード。
8. deployはverify成功＋main＋非PR＋MATH_TOWER_AUTODEPLOY=trueだけ。pages/id-token権限はdeployジョブに限定。
9. 配信game-version.jsをHTTP取得し期待番号に一致するまで最大12回、各間10秒。ビルド成功だけで公開完了と呼ばない。

根拠：[.github/workflows/math-tower-pages.yml:1・`name: Verify`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/.github/workflows/math-tower-pages.yml#L1)、[.github/workflows/math-tower-pages.yml:136・`Verify live published version`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/.github/workflows/math-tower-pages.yml#L136)。

## バージョン・成果物

version.jsonはmajor/minorの整数。ゲーム変更時は公開1回につきminor+1、文書/テストだけなら同番号を維持できる。majorは所有者承認。build-versionでgame-version.js、build-pagesでdistとrelease-manifest.json/静的hash参照を作る。srcと生成物の片方だけを直さない。

今回の文書保存は**docs/claude-handover-v525ブランチへpushのみ**。既存workflowのpush対象外なのでworkflow変更/skip-ciは不要。mainへのマージやPR作成はしない。PRはverifyを起動する。将来mainへ文書だけマージしてもdeploy条件が成立し得る点に注意。

根拠：[scripts/check-release-version.cjs:27・`const game =`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/scripts/check-release-version.cjs#L27)、[scripts/build-pages.cjs:129・`release-manifest`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/scripts/build-pages.cjs#L129)、[正式ルール](../game-version-policy.md)。

## 公開直前の失敗事例と再発防止

### 1. 旧Bの表示待機

`e875d16`でtests/online-spark-emulator.cjsの520付近を修正。旧「1/15」を待っていたが、時間制新Bは「1問」。DOMの実表示に加え、実RTDBのrules=b2・正解数1・得点>0・seq1を検証する。時間延長やassert削除ではない。

### 2. ゴーストテストのpermission_denied

`5584885`でtests/ghost-emulator.cjsのTOP10用fixtureを修正。NORMAL games=3に対してw/l/d=0/0/0だったため、後の本人profile transactionがgames=w+l+dの既存ルールに違反し、349付近の競合assertが失敗していた。3戦3引分に整合し、実SDKで人間claim対fallbackが単一試合になることまで確認。本体/認可は変更していない。fixture生成時にも本番不変条件を守る。

### 3. 5.24と5.25

5.24準備中に実SDKのforEach真値中断、完全同点record拒否、観戦入力の境界を確認し公開停止。5.25へ補正し、最終5584885でverify/deploy/配信番号照合が成功。タグ・mainの版数だけで途中版を公開済みと推定しない。

根拠：[e875d16差分](https://github.com/asumax1128/factorfactor/commit/e875d16)、[5584885差分](https://github.com/asumax1128/factorfactor/commit/5584885)、[tests/online-spark-emulator.cjs:520・`Timed B2 has no fixed`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/tests/online-spark-emulator.cjs#L520)、[tests/ghost-emulator.cjs:97・`Keep the production invariant`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/tests/ghost-emulator.cjs#L97)。

## 失敗とロールバック

失敗工程とエラー末尾を一回取得し、該当テストを優先して再現する。成功済み全件の無意味な再実行、テスト無効化、秘密値ログ、権限緩和で通さない。公開は止める。ロールバックはworkflow_dispatchのsource_shaへ**main履歴上の検証済み40桁SHA**を指定し、CIを通して旧artifactを生成/配信する仕組み。DB/ルールの自動巻戻しはなく、互換性と所有者の指示を確認する。

[総合案内へ](00_START_HERE.md)
