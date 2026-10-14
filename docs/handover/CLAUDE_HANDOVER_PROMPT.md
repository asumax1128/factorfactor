# Claudeへ渡す開発引継ぎプロンプト

あなたは高校生向け因数分解競技ゲーム「FACTOR×FACTOR」の次期開発担当です。**最初に資料を確認して理解し、所有者へ理解内容と今後の開発方針を確認してください。引継ぎ直後にコード修正・Firebase操作・テスト一式・再デプロイを開始しないでください。**

## 基準

- リポジトリ：`asumax1128/factorfactor`。
- 正式公開版：Ver.5.25。コード基準コミット `558488543e104460a35a8902c22e682c5c46f766`。
- 公開：https://asumax1128.github.io/factorfactor/?v=5.25
- 成功CI：https://github.com/asumax1128/factorfactor/actions/runs/38611955199
- Ver.5.24は公開見送り。引継ぎ文書は`docs/handover/`にあり、文書ブランチからmainへまだマージしていない場合はそのブランチで読む。最新mainとの差分を確認し、所有者の未コミット変更を保護する。

## 読む順序

1. `docs/handover/00_START_HERE.md`、`01_GAME_OVERVIEW.md`、`03_ARCHITECTURE.md`。
2. `04_DATA_AND_FIREBASE.md`、`12_NEXT_DEVELOPER_GUIDE.md`、`09_TEST_AND_DEPLOY.md`。
3. `02_GAME_RULES.md`、`05_ONLINE_SYSTEM.md`、`06_REWARDS_AND_PROGRESSION.md`、`07_MATH_TOWER.md`。
4. `15_UI_SCREEN_INVENTORY.md`、`16_RESULT_SCREEN_COMPARISON.md`、`17_UI_UX_AUDIT_AND_REDESIGN.md`。
5. `10_KNOWN_ISSUES.md`、`11_DEVELOPMENT_HISTORY.md`、`13_REQUIREMENTS_TRACEABILITY.md`、`14_GLOSSARY.md`、`08_UI_AND_ASSETS.md`。

資料中の固定GitHubリンク・関数名を使って実装を確認する。会話履歴やコメントだけから現行仕様を断定しない。未確認を確認済みと扱わない。

## 技術とモード

GitHub Pagesの静的React18アプリ。index.htmlの既存UI/ゲーム、`src/`の新オンライン/デイリー/塔UI、`server/online-rated/`のブラウザとテストで共有する純粋モデル、Firebase Auth/Realtime Database（Spark）、既存ソロGASランキングを使用する。serverというディレクトリ名だけでCloud Functions稼働と誤解しない。

ソロE/N/H、CPU、A、新B2、互換B1、C協力、ルーム、大会、ゴースト/ハイパー/自己練習、daily、ドリル、ミッション、週ボス、クラス/フレンドレイド、先生機能、現行数学の塔がある。通常の因数カード回答はドラッグ/スワイプのみ。別々の2タップ回答を導入しない。

新Bは時間制・HP/得点・偽因数カード・3秒counter・自動FREEZE。旧Bは先着型/旧必殺技、Cはチーム型であり別仕様。詳細値は02を参照。開始前とFREEZE中は式/カードをDOMへ描画しない。Aの確定得点履歴/グラフ、自己ゴーストの無報酬/無レート、歴代MASTER判定、E/N独立レートと表示のみ整数を維持する。

## 保存と保護

主な基底は`games/factor`。旧`accounts`とrooms/tours/raidw等、新`onlineSparkV1`、`ghostV1`、`dailyV2`/dailyRewards、塔の分離保存がある。匿名UIDとゲーム内accountは別ID。詳細パス/認可は04を読む。ユーザー名・PIN・トークン・個人情報を資料やログにコピーしない。

Firebaseの本番データ削除/初期化/一括上書き、権限の緩和、課金化、全件監視を行わない。現行Consoleルールは今回取得していない。`v525.candidate.rules.json`は検証したリポジトリ内スナップショットであり、Console全文の実時点一致を保証しない。client/host権威モデルの限界もあるため、完全なサーバー判定と称さない。

取得履歴、装備、EXP、レート、ランキング、旧形式、先生権限、他ゲームのデータを保護する。履歴を現在値で上書きしない。内部の難易度IDをカタカナへ変えない。

## 成長と塔

正式台帳は`reports/titles_inventory.csv`、`achievements_inventory.csv`、`cosmetics_inventory.csv`と監査Markdown。称号97、実績92＝active87/hidden5/retired0、きせかえ37。共有BADGESと独立レート称号の違いに注意。塔5実績は一覧/率から非表示だが履歴を保持する。先生の監査画面では全条件を確認できる。一般プレイヤーへ隠し条件を公開しない。

現行塔は`MathTowerApp`の第1章1〜5階・先生試遊、独立セーブ/保存確定後の結果表示。旧`TowerApp`とは異なる。50階への拡張は未実装の計画。章JSON/画像/会話・version・既存saveの互換を07で確認する。

## UI監査と既知の注意

UI監査は静的確認であり、今回は実画面/実機/音声を検証していない。優先候補は新旧B説明、Fair判定と見本の差、新B結果の得点比較、dailyの進行枠/正解数と保存状態、EXP/戻る操作の統一。塔RPG・ボス・自己練習の違いは正当な固有性を残す。監査は改善案であり、実装修正の承認ではない。

Lv9の教材例と実際の積、旧コメントと得点定数の差、daily負得点表示/保存下限、非MASTERきせかえの旧レート参照、GASのACK/重複、実機対応は10と17を確認する。不確かなものを勝手に修正しない。

## 開発・検証・公開

作業前にbranch/status/log/versionと依頼範囲を確認する。ownerの承認済み仕様だけ変更し、機能→コード→テストを13で探す。必要なテストから実行し、成功済みを無用に繰り返さない。Playwright公式ChromiumとFirebase demo Emulatorを使う際は09の既存CI手順に合わせる。失敗を隠す、テストを無効化する、タイムアウト延長だけで済ますことは禁止。

今回の引継ぎは文書だけで、バージョン更新/公開はしていない。今後公開を依頼された場合のみversion/CHANGELOG/引継ぎを更新し、既存Actionsのverify成功後にPagesへ公開し、配信版とmanifestを確認する。workflowはmain push/PR等で起動するため、文書をmainへ統合するだけでも再公開し得る点に注意する。ワークフローを無効化して回避しない。

ゲームルール・難易度・バランス・報酬条件・UIの最終決定者は所有者。有料化、破壊的変更、大きな権限変更は実行前承認が必要。最初の返答は、資料の理解、現行との差分、未確認事項、次に取り組む候補を簡潔にまとめ、所有者の方針を確認する内容にしてください。

[総合案内へ](00_START_HERE.md)
