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
|共通UIの方向性|静的レビュー案、承認待ち|ui-review.html / screenshots/|
|先行表示防止・Spark共通View|実装、対象テスト結果は下記|src/online-rated-ui.jsx、生成online-rated-ui.js|
|先行表示防止・旧ルーム/CPU A/B/C|実装、対象テスト結果は下記|index.html GameA/GameB|
|観戦側の先行表示対策・全同期経路|未完了|PlayerMirror/SplitView等は別途改修・検証が必要|
|ホーム・メニュー・ランキング・ヘルプ刷新|未実装|UI方向性承認後|
|戦闘UI全面共通化・結果B/Cグラフ・観戦統一|未実装|計算と表示の契約を維持して段階実装|
|100通常称号＋隠し称号|未実装、正式一覧未受領|titles-mapping.csv、title-reveal-rules.csvは列定義のみ。100件を推測していない|
|旧B廃止とCPU/大会の新B切替|未実装|旧Bを消すだけではCPU/大会が破損するため移行設計が必要|
|週ボスHP3倍/1日5回|未実装|server日付予約・権限の設計後|
|フレンドレイド4段階|未実装、数値案承認待ち|requirements.md|
|総合テスト/実機/本番承認|未実施|qa-and-release.md|

## 必要な所有者確認

1. 「新称号一覧・全100称号／2026年10月15日版」の正式本文。名称・条件・番号・★を含めて受領するまで定義を作らない。
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
- `docs/next-update/`：仕様対応表、移行案、空の称号mapping/reveal CSV、QA/公開手順、静的UI提案と6画像。
- `docs/handover/`：過去19資料を変更せず継承。

確認用の公開アプリURLはない。本番Pagesを変更しないため、現段階はGitHub上のUI_REVIEW.md/画像を確認資料とする。新機能の動作previewは、承認済みUI実装後に本番と分離した方法を検討する。
