# Claude開発引き継ぎ・2026-10-16

資料確認対象HEAD：`78d39c27e6688aa6d08a6c8d65c41ba23b489833`。最新実装は`04ce824`。ブランチは`dev/next-major-20261015`。開始時のリモートとローカルは一致し、作業ツリーはクリーンだった。本引き継ぎのコミットはこのHEADに文書だけを追加する。

**大型アップデートは未完成で、公開承認待ちではない。** ChatGPTはディレクター／アートディレクター／イラストレーター、Claudeは実装・テスト・GitHub管理を担当する。まず[開始指示](CLAUDE_START_PROMPT.md)、[UI正式仕様](UI_DESIGN_SPEC_FOR_CLAUDE.md)、[画面状態](UI_SCREEN_STATUS_FOR_CLAUDE.md)を読む。

## 正本と構造

最新状態の正本は[PHASE2_STATUS.md](PHASE2_STATUS.md)冒頭。後半は開発履歴であり、過去の「未接続」「CI実行中」を最新状態と混同しない。公開5.25の基礎仕様は[旧引き継ぎ入口](../handover/00_START_HERE.md)と[Firebase](../handover/04_DATA_AND_FIREBASE.md)、現在の差分は下表の専門資料を参照する。

|領域|主な実装・境界|状態／資料|
|---|---|---|
|アプリ統合|`index.html`のルート、BattleApp、FactorHunt、WeeklyAuthorityGate。既存関数をfactoryへ注入|元ゲームを保持。巨大な単一ファイルの全面置換をしない|
|共通UI・ホーム|`src/next-ui.jsx`、`src/next-home-ui.jsx`、`src/next-navigation.cjs`、`ui-next/tokens.css`、`home.css`|ホーム／ナビ／ランキング総合は接続・検証済み|
|プロフィール・ロビー|`src/next-profile-ui.jsx`、`profile-read.cjs`、`next-lobby-ui.jsx`|[2A](phase2a/README.md)／[2B](phase2b/README.md)。欠損を0にせず、Bのstatsを一度だけ表示|
|競技計算・保存|`server/online-rated/b2.cjs`、`server/online-rated/`、`src/room-b2-client.cjs`|既存A/B2勝敗・レート・確定revisionを保持。派生UIで再確定しない|
|結果・観戦|`src/b-result.cjs`、`src/next-results-ui.jsx`、`src/c-contribution-next.cjs`|[結果](PHASE2C_RESULTS.md)／[観戦](PHASE4_SPECTATOR_UI.md)。Cの確定貢献は未接続|
|大会B2・CPU|`src/tournament-b2.cjs`、`src/room-b2-client.cjs`、`src/room-b2-ui.jsx`、`src/local-b2-bots.cjs`|新規大会B2接続済み。[大会](PHASE4_TOURNAMENT_B2.md)／[追加検証](PHASE5_TOURNAMENT_VERIFICATION.md)|
|週間authority|`server/next-authority/{weekly.cjs,emulator-store.cjs,worker.cjs,weekly-source.js}`|Emulator共有確定処理・実画面まで接続。下節参照|
|称号|`src/title-catalog-next.json`、`title-compat-next.cjs`、`title-cutover-next.cjs`、`title-awards-next.cjs`、`server/next-authority/titles.cjs`|100通常＋1隠し。58件証明adapter接続、42件未接続。下節参照|
|きせかえ|`index.html`のWardrobe、`ui-next/home.css`の`.next-wardrobe`|プロフィール＋旧2コンポーネント入口を新UIへ接続。所有・装備条件は変更なし|
|フレンドレイド|`src/friend-raid-next.cjs`と既存クラスレイド|[開催証明](PHASE4_FRIEND_RAID.md)。Emulatorの公式10試合ID証明。鬼は未有効化|
|教師・塔|既存TeacherArea／MathTowerApp等|認可を保持。教師画面の全面新UI化は未完。旧Towerを誤って現行MathTowerと削除しない|
|生成物|ルートの`next-home-ui.js`等、`server/*/engine-source.js`等|手編集せず、既存buildで生成し差分を照合|

## 週間共有authorityと暫定画面

詳細は[週間実装](PHASE6_WEEKLY_AUTHORITY.md)、[本番運用制約](AUTHORITY_OPERATIONS.md)。`scripts/build-weekly-authority.cjs`が元の数学・得点・ダメージ・報酬関数と後付け9ボス定義を抽出する。原コードとの不一致を避けるため、保存状態の`sourceHash`不一致は拒否する。全15ボスの盤面検査済みだが、全ギミックの全状態を検証した意味ではない。

`worker.cjs`→`emulator-store.cjs`→週単位transactionで要求ID、ACK、共有状態、投影を整合させる。確定順・同時討伐・最終打・週締めとreceiptを保存。切断中も管理側の確定処理で進み、ACK済み盤面・タイル順・コンボ・問題開始時刻・判定待ち等を復帰する。出撃予約と完走は別記録。再送・再接続で出撃／報酬を増やさない。

`src/authority-client-next.cjs`と`src/authority-weekly-ui.jsx`が接続。ホームは`src/next-home-ui.jsx`の`useBoss`が同じpublic投影を参照する。**戦闘画面は機能検証用の暫定UIであり、正式デザインではない。** 正式画面は既存TargetCard／BattleBoard等の操作・演出と承認済みB UIを組み合わせ、ChatGPT側でデザイン確認後に実装する。

接続先は`games/factor/nextAuthorityV1/weekly/<week>`。管理側state、クライアント要求、本人ACK／view、publicを分離。候補ルール断片はEmulatorだけへ合成する。本番への公開は禁止。worker停止時は未ACKの入力を確定表示せず、同じIDで再送。二重workerもtransactionで重複を防ぐ。

未完：waveのドラッグ互換、共有HPフェーズ境界、多人数性能、本番statsとの正式接続。250msごとの週全体transactionは本番負荷未評価。Spark＋PagesだけではNode workerを常駐実行できず、信頼できるホスト／費用の承認が必要。Emulator成功を本番運用可能と呼ばない。

## C writerは未実装

[証拠と認可の調査](PHASE5_C_EVIDENCE.md)。`src/c-contribution-next.cjs`は終了revision・イベント整合を検査する読取集計器だけ。既存`index.html/createBEngine`の`sendAttack`のsentは送信試行量、`receive`のIDはpendingで失われ、`land`／`flush`は複数攻撃・共有HPをまとめる。参加者が書けるev／thpを監視して「確定」とラベル付けしても正式証拠にはならない。

次の実装は元CエンジンのEmulator管理側再生を小さく作り、受信eventID→実適用operation→終了revisionを同一の冪等な確定処理で保存すること。共有HPを個人へ推測配分せず、攻撃・相殺・防御・回復は証明可能な独立指標だけ表示する。既存Cプレイを削除しない。

## 大会B2

新規大会にB2 versionを持たせ、教師coordinatorが既存B2を駆動する。回戦advance・勝敗確定を冪等化し、大会専用receiptとEXP／優勝記録を一度だけ受領する。通常レーティングや`stats.B`へ大会結果を二重加算しない。進行中の旧大会を途中変換しない。4選手のスイス予選2回戦→準決勝→決勝まで7試合、host復帰・第三者拒否の実SDK検証済み。全人数・全引分け・実機は未検証。

## 称号101個とデータ互換

正式マスターは`src/title-catalog-next.json`。通常100、★5は26、No.65勝利の王冠は`tour1`★5、No.66は王者防衛。隠し`factor_factor`は異なる★5の15種類で解放。表示番号を内部IDにしない。

[100件証明台帳](TITLE_EVIDENCE_100.csv)／[付与authority](PHASE7_TITLE_AUTHORITY.md)を正本とする。58件＝対戦30＋歴代レート10＋週間18。未接続42件＝dry-runのみ10＋adapterなし32。CPU・自己ゴーストを公式証明に含めず、証拠不足の旧履歴を推測付与しない。

`titles.cjs/reconcile`は保護された`titleNextV1/snapshots`、`onlineRatedV2/privateState`、正しいsourceHashの週間stateだけを読み、awardsをtransactionで追加する。snapshotがないアカウントは勝手に移行しない。既得ID／塔ID／装備／元日時を保持。不明日時は`dateWasUnknown:true`と確認日時を区分する。既存97称号／92実績／37きせかえ台帳は削除しない。

`title-presentation-next.cjs/claimAutomatic`は演出前に不変seen receiptを確保し、2端末での初回自動演出を一度にする。途中で閉じても自動枠は消費し、再視聴は可能。付与と演出完了を分離し、skip／mute／reduced-motionを維持する。公開条件52件は提案であり正式処理へ接続しない。

## 起動・ビルド・限定テスト

リポジトリ直下で実行。依存がある環境では再インストール不要。新環境は`package-lock.json`に沿って`npm ci`、CIはNode24／Java21、Playwright公式Chromiumを使用する。ローカルChromium利用時は既存ハーネスの`CHROMIUM_PATH`に従う。

```sh
node scripts/build-online-rated.cjs
python3 scripts/title-evidence-next.py --check
node --test tests/weekly-authority.test.cjs tests/title-authority.test.cjs tests/c-contribution-next.test.cjs
node tests/next-board-visibility-browser.cjs
```

週間実アプリを本番接続せず起動するには、既にインストールしたFirebase CLIを使う：

```sh
# firebase がPATHにある場合
node scripts/start-weekly-dev.cjs
# このクラウドの既存CLIを使う場合（他環境では実在パスへ変更）
FIREBASE_CLI_JS=/workspace/math-tower-tools/node_modules/firebase-tools/lib/bin/firebase.js node scripts/start-weekly-dev.cjs
```

ローカル画面は`http://127.0.0.1:4173/`、Auth9099／DB9000、projectは`demo-factorfactor-tower`。開始前に他プロセスとのポート競合を確認する。開発サーバーだけがEmulator bootstrapを挿入し、公開HTMLのFirebase初期化は変えない。終了はSIGTERM等で子プロセスと3ポートの停止を確認。worker再起動は稼働中DBの状態を利用するが、**Emulator全停止をまたぐ永続export/importは既定でない**。本番URLを手動で開いて検証しない。

SDKテストの実行例（既存CLIがある前提）：

```sh
firebase emulators:exec --only auth,database --project demo-factorfactor-tower --config firebase.spark.emulator.json 'HTTP_PROXY= http_proxy= node tests/weekly-authority-emulator.cjs'
```

各SDKテストが候補ルールをdemoに適用する。CLIの本番project設定やConsoleルールを変更しない。全CIの正式な工程順は[開発workflow](../../.github/workflows/next-major-checks.yml)。テストのdemoDB初期化を本番用手順へ転用しない。

## 検証と引き継ぎの限界

最新実装`04ce824`の[開発CI 38860493475](https://github.com/asumax1128/factorfactor/actions/runs/38860493475)は前回保存時に全工程成功を確認済み。今回は文書のみのため再実行しない。週間10＋称号6ユニット、実SDK認可・2端末・同時討伐・worker再起動・正常60秒完走と一度だけの報酬、旧ゲーム回帰等は最新CI／各専門資料に記録済み。375／390／430／1440pxはChromium・モック／demoの検証で、実機Safari／Chromebook／学校大人数は未検証。

未承認：上級52件の公開条件、週間HP3倍の開始週、鬼数値、旧記録救済、週間ゲスト互換、本番authority環境／費用、本番ルール／移行／main統合／公開。「全6種ボス」の対象と現行15種の関係も確認が必要。

本番移行は対象限定バックアップ→dry-run→差分提示→所有者承認→冪等実行→照合。今は実行しない。旧BとB2の`stats.B`は共有値を一度だけ使い、レートは加算しない。取得済み称号・装備・EXPを読み取りUIの都合で書き換えない。

次は資料の理解を所有者へ報告した後、**C writerのEmulator最小確定経路**から着手する。UIを新しく作る場合は実装前にChatGPT側のデザイン確認を受ける。

## ローカルとCIのブラウザ差（Ver.6.10 で確認）

- 公開CI：`npx playwright install --with-deps chromium`（Playwright 1.64.0 同梱の Chromium、build 1248）。
- Claude のクラウド開発環境：事前インストール済みの Chromium build 1194 のみ（`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`、ブラウザのダウンロード不可）。
- そのため「手元では通るが CI で落ちる」ことがある。手元で通っても、最終判定は公開CIで行う。ダウンロードできる環境では `npx playwright install chromium` を実行し、`CHROMIUM_PATH` を指定せずに実行すると CI と同じ版になる。
- CI でブラウザテストが失敗したときは、ワークフロー実行の成果物 `failure-evidence`（失敗時の画面のスクリーンショットと表示文字）を確認する（`tests/browser-harness.cjs` の `PW_ARTIFACT_DIR`）。
- 画面移動は `tests/browser-harness.cjs` の共通ヘルパー（`goHome` / `openSoloHub` / `openSoloMode` / `openOnlineLobby` / `openProfile`）を使う。画面の構成を変えたら、まずここを直す。
