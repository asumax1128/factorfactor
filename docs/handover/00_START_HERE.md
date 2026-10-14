# FACTOR×FACTOR Ver.5.25 — Claude引継ぎ入口

## 対象と確認範囲

- 対象リポジトリ：`asumax1128/factorfactor`。
- コードの固定基準：`558488543e104460a35a8902c22e682c5c46f766`（短縮 `5584885`）。2026年10月15日（日本時間）の調査開始時、GitHubのmainとローカルHEADの一致を読み取りで確認した。
- 正式稼働版：**Ver.5.25**。Ver.5.24は公開前検証で停止され、未配信。
- サイト：https://asumax1128.github.io/factorfactor/?v=5.25
- 基準版の成功CI：https://github.com/asumax1128/factorfactor/actions/runs/38611955199
- 今回は静的コード調査・既存資料照合・文書の構造検査だけ。ブラウザ、エミュレータ、ゲームのテスト、ビルド、依存追加、本番Firebaseアクセス、Pages再公開は実施しない。
- 引継ぎ予定：2026年10月16日（金）。資料は文書専用ブランチに保存し、mainは変更しない。文書ブランチをmainへマージすると現行CIが起動し、設定次第で再公開するので、今回の範囲ではマージしない。

**最初の作業は資料の理解であり、修正や再公開ではない。** 所有者が仕様・報酬・難易度・UIの最終決定者である。

## 読む順序

1. 本書 → [Claudeへの指示](CLAUDE_HANDOVER_PROMPT.md) → [全体像](01_GAME_OVERVIEW.md)。
2. [構成](03_ARCHITECTURE.md) → [保存・認可](04_DATA_AND_FIREBASE.md) → [開発手順](12_NEXT_DEVELOPER_GUIDE.md)。
3. 担当するモードの[ルール](02_GAME_RULES.md)、[オンライン](05_ONLINE_SYSTEM.md)、[塔](07_MATH_TOWER.md)。
4. [画面台帳](15_UI_SCREEN_INVENTORY.md) → [結果比較](16_RESULT_SCREEN_COMPARISON.md) → [改善候補](17_UI_UX_AUDIT_AND_REDESIGN.md)。
5. [問題・制約](10_KNOWN_ISSUES.md)と[検証・公開](09_TEST_AND_DEPLOY.md)を確認してから所有者へ方針を提示する。

## 全資料

- [全体像・機能台帳](01_GAME_OVERVIEW.md)
- [数学エンジン・全モードのルール](02_GAME_RULES.md)
- [技術構成](03_ARCHITECTURE.md)
- [保存・認証・セキュリティ](04_DATA_AND_FIREBASE.md)
- [対戦・同期・レーティング](05_ONLINE_SYSTEM.md)
- [成長・報酬](06_REWARDS_AND_PROGRESSION.md)
- [数学の塔](07_MATH_TOWER.md)
- [UI・アセット・端末](08_UI_AND_ASSETS.md)
- [テスト・CI・公開](09_TEST_AND_DEPLOY.md)
- [問題・制約](10_KNOWN_ISSUES.md)
- [開発履歴](11_DEVELOPMENT_HISTORY.md)
- [安全な開発手順](12_NEXT_DEVELOPER_GUIDE.md)
- [仕様・実装・テストの対応](13_REQUIREMENTS_TRACEABILITY.md)
- [用語](14_GLOSSARY.md)
- [画面台帳](15_UI_SCREEN_INVENTORY.md)
- [リザルト比較](16_RESULT_SCREEN_COMPARISON.md)
- [UI監査・改善案](17_UI_UX_AUDIT_AND_REDESIGN.md)
- [Claudeへ渡すプロンプト](CLAUDE_HANDOVER_PROMPT.md)

## 読み方と証拠

本文のコード参照は**基準コミットへ固定したGitHubリンク**である。行番号と関数名／検索文字列を併記している。改修時は同名処理を最新ブランチで再確認する。文書用のF/S/R/UI番号は保存IDではなく、機能・画面・結果・問題の索引である。

状態は「現行・公開中（config/権限依存）」「現行・内部機能」「互換性維持」「旧仕様」「試作・未完成」「未使用（公開入口なし）」「将来構想」「要確認」を区別する。コードが配信されていても、先生grantや設定で入れない場合がある。現行Console設定・全アカウント状態は今回取得していない。

UIの根拠はコンポーネント・CSS・遷移・既存テスト／既存報告書。**今回の実画面・実機は未確認**であり、コード上の懸念を実機で確認した不具合と呼ばない。

## 後退させない仕様

- ドラッグ／スワイプで2枚を結び、別々のタップでは回答しない。単独タップの選択保持なし。
- 開始前とFREEZE中は問題・カードをDOMに描画せず、同期時刻で操作解禁。
- Aの確定得点履歴・得点グラフ・逆転表示。
- 自己ゴーストは無報酬・無レート・無公式戦績・無公開学習／通知。
- EASY/NORMALの内部レート分離、表示のみ四捨五入、歴代MASTER達成保持。
- ID・称号条件・きせかえ・塔の既読／セーブ・全生徒データを保存。Sparkを維持。

## 調査成果

19資料、39機能、86論理画面・状態を索引化した。結果比較は実在する共通コンポーネントを入口別に分け、26観点で比較する。UI改善候補9件は未実装で、優先5件を17へ示した。

## 文書の整合性検査

19ファイル・39機能の相互索引・86画面IDの重複なし、Markdown参照853件（うち固定コードリンク288件）のパス/行番号、表の列数を検査した。既存CSVはBOMと97/92/37件を照合。ゲームのテスト・ビルドは再実行せず、基準版の成功CIを参照する。文書以外の差分なしをコミット前に確認する。

## 台帳と限界

称号97、共有実績92（active87/hidden5/retired0）、きせかえ37は[既存正式台帳](06_REWARDS_AND_PROGRESSION.md)を参照。詳細を重複コピーしない。

コードと既存テストから確認できる範囲の棚卸しは完了。実機Safari/ChromeOS、実際のGAS管理実装、現在の全Firebase設定、長期の全報酬達成、全モーダルの実画面は未確認。これらは[既知の問題](10_KNOWN_ISSUES.md)へ残す。今回の資料は新仕様の承認や実装指示ではない。

[総合案内へ](00_START_HERE.md)
