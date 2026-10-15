# 次期大型アップデート — 開発台帳

## 基準・保存場所

- 2026-10-15に`git fetch origin main`で取得したmain：`558488543e104460a35a8902c22e682c5c46f766`、Ver.5.25。
- 独立ブランチ：`dev/next-major-20261015`。major番号を上げる意味ではなく、次期大型更新の作業名。
- 引継ぎ19資料を文書ブランチの`9f9bf1b`からcherry-pickして同梱。mainへは未統合。
- 本番データの読取/書込、ルール公開、mainへのpush/merge、Pages公開、正式版番号変更を行わない。
- 既存のpush workflowはmain/release/v524/release/v525のみ。この開発ブランチのpushでは公開されない。ワークフロー変更・skip-ciは使わない。

## 今回の状態

**全機能の完成ではない。調査・レビュー準備と、承認不要な先行表示修正の第1区切り。**

|項目|状態|実装先・確認資料|
|---|---|---|
|最新基準確認/独立ブランチ/旧資料継承|完了|本書、../handover/|
|要件と現行実装の対応表|作成済み|requirements.md|
|データ移行方式|設計案、未実行・承認待ち|data-migration.md|
|共通UIの方向性|B方向性を正式基準に選択。ホーム/ロビー改良版4画像はレビュー待ち|design-b-refined/README.md|
|先行表示防止・Spark共通View|実装、対象テスト結果は下記|src/online-rated-ui.jsx、生成online-rated-ui.js|
|先行表示防止・旧ルーム/CPU A/B/C|実装、対象テスト結果は下記|index.html GameA/GameB|
|観戦側の先行表示対策・全同期経路|未完了|PlayerMirror/SplitView等は別途改修・検証が必要|
|ホーム・メニュー・ランキング・ヘルプ刷新|未実装|UI方向性承認後|
|戦闘UI全面共通化・結果B/Cグラフ・観戦統一|未実装|計算と表示の契約を維持して段階実装|
|100通常称号＋隠し称号|未実装、正式一覧受領・最新訂正で★5が25件、公開条件案も未承認|100件のID対応と52件の公開条件案を記録。TITLE_SPEC_REVIEW.md参照|
|旧B廃止とCPU/大会の新B切替|未実装|旧Bを消すだけではCPU/大会が破損するため移行設計が必要|
|週ボスHP3倍/1日5回|未実装|server日付予約・権限の設計後|
|フレンドレイド4段階|未実装、数値案承認待ち|requirements.md|
|総合テスト/実機/本番承認|未実施|qa-and-release.md|

## 必要な所有者確認

1. 正式100件は受領済み。最新指定でNo.65は★★★★。★5の26件目は未確定。公開条件案と新旧条件差もTITLE_SPEC_REVIEW.mdで確認する。
2. ui-review.htmlの方向性（paper/白いカード/orange、ホーム5導線、ソロ基準の対戦HUD）。これは実アプリの変更前レビューである。
3. 既存値の変更は不要な読取統合を優先する案。将来必要になる取得履歴追記について、data-migration.mdの日時由来・装備保持方式を確認。
4. フレンドレイドの鬼の具体的なHP/ギミック案と、週ボスの既存週途中HPを変える適用時期。未決定の値を本番へ投入しない。

## 再開時の指示

まずgit status/branchと本書、requirements、data-migration、qaを読む。先行表示修正のテスト結果を確認し、未完了欄を飛ばして完成扱いしない。100称号資料とUI方針の承認を受領したら、要件表を更新して実装を続ける。CPU/自己ゴーストの称号判定除外を専用テストにする。旧Bの統計を足し直さない。本番操作は最終の明示承認まで禁止。

## 第1区切りのテストと変更ファイル

- 新規先行DOMテスト：成功（phone/PC、E/N共有A/B1/B2、4桁/CPU A待機・B/C解答待機）。
- 既存開始回帰：成功（CPU A/B/C×E/N、GO後drag）。
- 既存online-playability：成功（検索cancel/初期化失敗、E/N・A/B・ghost/hyper/BOT・quick/profile、tap拒否/drag/結果/報酬一回）。詳細はqa-and-release.md。
- UI静的案：3画面×2幅の6画像、横overflowなし。Webfont実読込と実機は未検証。
- `src/online-rated-ui.jsx`、`online-rated-ui.js`：ready/resolving/resultで問題・カードをmountしない。判定フィードバックは通常遷移中も表示/読み上げ可能に保つ。
- `index.html`：GameA待機中、GameB/C解答待機・終了で問題/カードをmountしない。数学・得点・入力・同期・保存は変更していない。
- `tests/next-board-visibility-browser.cjs`、`package.json`：新テストと既存CI経路への接続。
- `docs/next-update/`：仕様対応表、移行案、100件の称号mapping/52件のreveal案CSV、QA/公開手順、静的UI提案と6画像。
- `docs/handover/`：過去19資料を変更せず継承。

確認用の公開アプリURLはない。本番Pagesを変更しないため、現段階はGitHub上のUI_REVIEW.md/画像を確認資料とする。新機能の動作previewは、承認済みUI実装後に本番と分離した方法を検討する。

## 正式称号一覧の追加受領

[TITLE_SPEC_REVIEW.md](TITLE_SPEC_REVIEW.md)に確認結果を記録。通常100件・★5は25件（最新指定で新No.65を★★★★へ復元）。100件を機械可読データへ転記し、既存ID90件/新設ID案10件、公開条件案52件を照合。レビュー用ユニットテスト6件成功。まだ現行UIへ接続せず、取得/装備/本番データは変更していない。

最新の仕様再照合・直前26件一覧・前提52件・UI画像6枚：[TITLE_RECONCILIATION.md](TITLE_RECONCILIATION.md)。No.66は最新指定の「王者防衛」。

## UI再検討 — 前案不採用

所有者の指示により前のUI案を不採用として記録。既存タイトルPNGを無変更で使用し、A現行進化・B競技ゲーム・C日本製RPGのホーム3案×スマホ/PCを作成した。[比較と画像6枚](design-directions/README.md)を参照。新フォント/線画アイコン/構成はプロトタイプ内に限定。選択されるまで実ゲームへ接続せず、本番/ルール/版番号は未変更。

## B案を正式デザイン基準として選択

所有者がB案の方向性を選択。ただし完成版の承認ではない。左サイドバー/ダークネイビー/青緑を維持し、ホームの大きなボス・仮ロゴの白板除去・字重/数値・カード質感・スマホ下部ナビを改良した。[今回の4画面](design-b-refined/README.md)でレビューする。実アプリは未反映。本番/ルール/main/版番号は未変更。
