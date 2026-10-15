# 第2段階・実装状況

開始基準：`6fed85c`。ブランチ `dev/next-major-20261015`。公開版Ver.5.25／main／本番Firebase／ルールは変更しない。

|Phase|状態|コミット・記録|
|---|---|---|
|2A 共通基盤・プロフィール|実装・対象検証完了|`daa7440`・[詳細](phase2a/README.md)|
|2B オンラインロビー|新UI・既存機能接続の対象検証完了。CPU B2接続済み・大会B2は未完了|本資料と同じコミット・[詳細](phase2b/README.md)|
|2C 対戦・結果|一部実装：新B確定推移・A配色・C保存済み指標。対戦全面統一は未完了|[結果実装](PHASE2C_RESULTS.md)|
|2D 観戦・ソロ・デイリー|一部実装：新B観戦と旧A/Cの表示ガード|[CPU・観戦](PHASE2_CPU_AND_SPECTATOR.md)|
|2E 週間ボス・レイド|未実装・一部承認待ち|HP3倍・1日5回は承認済み。週切替の適用日・鬼の数値は未承認|
|2F 称号・継続|未実装・公開条件52件は未承認|100／26／tour1／15条件は確定済み。未承認条件を正式付与へ接続しない|

今回のセッションはPhase 2AとロビーUI接続を区切りとして保存。2C〜2FやCPU・大会B2切替を完成扱いにしない。各Phaseの対象テスト・コミットを完了してから次へ進む。本番操作や大規模削除が必要になった場合は独立した承認が必要。

## Phase 2Bの最終検証

- `node tests/next-lobby-browser.cjs`：375／390／430／1440pxと設定無効・教師有無のシナリオ成功。最終のレーティング画面→ロビーの戻り先は`NEXT_LOBBY_WIDTH=390`指定の追加確認で成功。
- `node tests/rating-display-browser.cjs`：390／1366px成功。現在レートのリアルタイム更新、保存値不変、歴代最高、順位7位／8位と表示丸め、他人プロフィール、ノーマル、結果表示、stats／profile書込0。
- `node tests/online-menu-browser.cjs`：320／390／430／1366px成功。すぐ対戦とレーティング専用画面の分離、旧レートの読取互換、無書換。
- `node tests/online-playability-browser.cjs`：遅延heartbeat中のキャンセル、5秒境界、開始前退出、描画初期化失敗時の安全中止、E/N・A/旧B・ghost/hyper/BOT・quick/profileの6戦でスワイプ→実エンジン結果、レート／EXP一度だけを確認。旧B1の回帰であり、新B2の全検証の代用ではない。
- `node tests/legacy-regression.cjs`：204関数AST不変、ソロ／学び／CPU／週間ボス／デイリー成功。
- JSXコンパイル、生成JS、`git diff --check`成功。正式PNGのSHA-256は第1.5段階後と同一。

途中で旧ラベル待機によるTimeoutと、新プロフィール＋旧詳細モーダルの両方を無指定で探すstrict locator失敗を検出。最終的に旧入口名を維持し、最高レートの検証対象を実際の詳細モーダルへ限定して解消。assertionやテスト本体を削除・無効化していない。

全てローカルモック。全CI／実SDKエミュレーター／実機Safari・Chromebookは今回未実施。スクリーンショットは各Phase資料参照。dev pushは現行workflowの対象外であり、公開は起動しない。

## 旧再開メモ（確定履歴はPHASE2C_RESULTS.mdで実装済み）

1. 現在ブランチ・本資料・未コミット差分を確認。既存成功テストの不要な再実行を避ける。
2. `server/online-rated/b2.cjs`の`step`／`advance`と`src/room-b2-client.cjs`／`src/b2-pump.cjs`の確定トランザクションを読む。既存`states[uid].hist`には`gain/base/bonus/oj/ms`があるが、正解確定時刻と双方の累積得点スナップショットはない。解答所要時間を足して試合時刻を推測しない。
3. 新Bの確定処理内で時刻・単調ID・累積得点を記録する後方互換設計を作り、再送・同時解答・終了境界をエミュレーターで検証する。画面側で得点式を再計算しない。履歴がない過去試合には「詳細記録なし」とする。
4. 新Bの結果は`src/online-rated-ui.jsx::Result`と`index.html::BattleGame`の`state.b2Final`経路の両方。片方だけグラフを足さない。既存AResultDetailsは維持。
5. Cは旧共有エンジンの指標定義・確定保存先を確認してから個別指標を設計する。未承認の総合貢献スコアを作らない。
6. `src/online-rated-ui.jsx::BattleView`の`boardHidden`、既存`tests/next-board-visibility-browser.cjs`を保持し、開始／READY／FREEZE／次問／終了／観戦で漏れを確認。
7. CPU・大会B2切替は旧B／C共有エンジンの依存を確認し、小さい独立コミットで対応。`stats.B`を旧新で二重加算しない。

## 引き続き保留する事項

- 称号公開条件52件の正式採用。
- 週間HP3倍を実際に適用する週の承認。
- フレンドレイド「鬼」の具体値と、公式10戦の重複を避ける集計・認可の実装。
- 本番への移行、Firebaseルール公開、mainへの統合、バージョン更新、デプロイ。すべて今回の対象外。

第3次開発でPhase 2Cの結果可視化を実装。以後は各Phaseの最新記録を優先する。

CPU B2と観戦の最新情報は[実装記録](PHASE2_CPU_AND_SPECTATOR.md)を参照。
