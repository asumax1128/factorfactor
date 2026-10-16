# Claudeへ渡す最初の指示文

あなたはFACTOR×FACTORの新しいプログラマーです。**まず資料の確認と理解から始め、直ちにコード変更・再設計・公開を開始しないでください。** ChatGPTはディレクター／アートディレクター／イラストレーター、あなたは実装・テスト・GitHub管理を担当します。

リポジトリは`asumax1128/factorfactor`、引き継ぐ作業ブランチは`dev/next-major-20261015`です。資料調査時のHEADは`78d39c2`、最新実装は`04ce824`。このプロンプトを含む後続文書コミット以降も更新があり得るため、実際のHEAD・remote・未コミット差分を最初に確認してください。未コミット変更を破棄しないでください。

## 読む順番

1. [PHASE2_STATUS.md](PHASE2_STATUS.md)の冒頭（後半は履歴）
2. [CLAUDE_DEVELOPER_HANDOFF.md](CLAUDE_DEVELOPER_HANDOFF.md)
3. [UI_DESIGN_SPEC_FOR_CLAUDE.md](UI_DESIGN_SPEC_FOR_CLAUDE.md)
4. [UI_SCREEN_STATUS_FOR_CLAUDE.md](UI_SCREEN_STATUS_FOR_CLAUDE.md)とリンク先の承認ホーム画像・正式PNG
5. [週間authority](PHASE6_WEEKLY_AUTHORITY.md)／[本番構成制約](AUTHORITY_OPERATIONS.md)
6. [C証拠の境界](PHASE5_C_EVIDENCE.md)／[称号authority](PHASE7_TITLE_AUTHORITY.md)／[100件台帳](TITLE_EVIDENCE_100.csv)
7. 作業対象に応じて[大会B2](PHASE4_TOURNAMENT_B2.md)、[追加検証](PHASE5_TOURNAMENT_VERIFICATION.md)、[既存Firebase構造](../handover/04_DATA_AND_FIREBASE.md)

最初に確認するコードは`index.html`のcreateBEngine／ルート接続、`src/c-contribution-next.cjs`、`server/next-authority/emulator-store.cjs`、`worker.cjs`、`src/next-ui.jsx`、`ui-next/tokens.css`／`home.css`です。生成JSは直接編集せず、既存buildスクリプトを使ってください。

## 既存成果と制約

承認済みB改良版・バランス型ホーム、正式PNG、左サイドバー、5項目下部ナビ、ランキング総合、プロフィール、オンラインロビーを作り直さないでください。ロゴ`ui-next/logo-official.png`は無加工・下段反転が仕様です。不要なキャッチコピーを追加しないでください。

週間共有authorityはEmulatorの実画面・共有HP・再起動・通常完走・receiptまで接続済みですが、本番構成・性能と残互換検証は未完です。**週間のEmulator戦闘画面は機能検証用の暫定UIで、正式採用デザインではありません。** 新しい正式戦闘画面は、既存の盤面操作・演出とB基準を組み合わせ、ChatGPT側でデザイン確認を受けてから実装してください。

Cは確定集計器だけでwriter未実装。参加者書込のev／thpや送信試行sentを正式貢献と扱わず、共有HPを個人へ推測配分しないでください。新規大会・CPUのB2接続は完了済みで、再実装不要です。

称号は通常100、★5は26、隠し1。No.65は勝利の王冠`tour1`★5、No.66王者防衛。隠しは異なる★5の15種類。取得adapterは58件接続、42未接続で、101個全体の本番統合は未完です。既得・元日時・不明日時区分・装備・旧IDを維持し、証拠のない過去実績を補完しないでください。CPU練習・自己ゴーストは公式取得証明に含めません。

## 最初の1作業

資料の理解、実際のGit状態、完成／未完成を簡潔に所有者へ報告し、今後の開発方針を確認してください。その後の推奨最初の実装は、**Cの1受信eventIDについて、元エンジンをEmulator管理側で再生し、適用operationと終了revisionを一意に保存する最小経路**です。全Cエンジンを一括置換せず、重複再送・終了後入力・第三者書込拒否を限定テストしてから結果集計器へ接続してください。

既存の週間・大会・ホームを再実装したり、稀な事象の総当たりで独立作業を止めたりしないでください。ただしデータ破壊・権限突破・二重報酬・勝敗不一致の検証は省略しないでください。

## テスト・コミット・承認

変更範囲のユニット→必要なモック／demo SDK→回帰→開発ブランチの小さなコミット・pushの順です。起動とテストコマンドは開発引き継ぎ資料のとおり。最新実装`04ce824`の開発CIは成功済みで、理由なく全成功テストを繰り返す必要はありません。失敗を隠す・テスト無効化・タイムアウト延長だけで合格させることは禁止です。

`docs/next-major/PHASE2_STATUS.md`へ実装・SHA・テスト・未完・承認待ち・次の1作業を記録してください。実機Safari／Chromebook／大人数は実際に確認するまで未検証です。

**mainへのmerge／push、本番Firebaseへの読書きテスト、ルール公開、プレイヤーデータ移行、公開Ver.5.25の変更は行わないでください。** 旧B／B2は共有`stats.B`を重複加算せず、レート／EXPを再計算しないでください。バックアップ・dry-run・差分・明示承認なしに実データ移行しないでください。

所有者とChatGPT側の承認が必要なのは、ゲームルール・バランス・報酬条件、B基準からのデザイン変更、新しい正式画面、フォント／ロゴ変更です。上級52件の公開条件、週間HP3倍の開始週、鬼数値、旧記録救済、週間ゲスト互換、本番authority環境・費用、本番ルール・移行・main統合・公開は未承認です。「全6種ボス」の対象も勝手に決めないでください。

未完成を完成と呼ばず、本番公開の最終判断は所有者へ残してください。
