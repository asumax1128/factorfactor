# Claude向け安全な開発手順

## 引継ぎ直後

1. 00→CLAUDE_HANDOVER_PROMPT→01→03→04→10を読む。担当モードの02/05/07とUI15〜17を続ける。
2. git status、現在branch/HEAD、origin/main、version.json、workflowを読み取りで確認。今回のコード基準は5584885、文書コミットは別。
3. 既存の未コミット変更を保持。新たなworktreeを自動作成せず、既存checkout/ユーザー指定branchを使う。セットアップは既存手順とlockfileを優先し、秘密値をチャットへ求めない。
4. 最初は理解した構成・未確認事項・次の改善候補を所有者へ説明し、**今後の開発方針を確認する**。資料を読まず修正/再公開を始めない。

## 実装前の境界

ゲームバランス（時間/HP/点/出題/ランク/報酬）・新機能・称号/実績/きせかえ条件・大きなUI変更の最終決定者は所有者。監査候補は承認済み要件ではない。単なる表示修正でも旧B/newB/C/CPU/塔を同じルールへまとめない。

有料サービス、Blaze、破壊的移行、権限拡大、生徒の塔公開、公式報酬への試遊反映は事前確認。既存アカウント/レート/EXPを推測で一括補正しない。

## 修正の進め方

- 13の機能IDからコードとテストを特定。生成JSを直接編集せずsrc/index/データの正本を修正する。
- 原因を測定/最小再現し、UI不統一はA/B/C/D分類（17）で正当な差を残す。
- 新Bはrules=b2、旧B/CはcreateBEngine、現行塔はMathTowerRules、ソロはFactorHunt。共有係数エンジン・drag入力・数式font・即時ローカル判定を維持する。
- 同一問題heartbeatでタイルを作り直さない。seq、question、revision、startAt、readyAtを別管理。楽観表示を公式score/receiptとして保存しない。
- 保存は既存field/ID/未知値/既得装備を残す。移行時は読み取り互換とbackup/rollbackの方針を先に決める。

## 検証・コミット

対象unit→必要な実ブラウザ操作→影響する回帰→実SDK/認可の順。成功済み結果を活用し、同じ失敗を無目的に繰り返さない。画面が出るだけでは入力完走の検証にならない。Playwright viewport/DPRはSafari/ChromeOS実機そのものではない。

fixtureはproductionルールの不変条件（例games=w+l+d）を満たす。UI textの待機条件は旧モードと新モードを区別し、実確定値も検証する。timeout延長/skip/ルール緩和で隠さない。

ゲーム変更を公開する承認がある場合のみminor+1、CHANGELOG/引継ぎ更新、build:pagesと生成差分、必要テストをコミット。GitHub Actionsのverify→deploy→実HTTP版照合まで確認。**文書だけを保存する今回はdocsブランチpushだけで停止**。

## Firebaseとロールバック

本番の読み取りも学級の個人情報を含むため、依頼範囲と権限を確認する。エミュレータはdemo project、本番にtest seed/remove/set/importを向けない。ルール変更は最新全文・backup・他ゲーム差分・許可拒否テスト、管理認証がなければ所有者の具体操作のみ依頼。

rollbackはmain履歴上の検証済みSHAを現行workflowのsource_shaへ指定する方式。アプリだけ戻して新save/rulesと矛盾しないか先に確認する。DB全体巻戻しを自動実行しない。

## 最初の改善候補（実装許可ではない）

17の上位5件を説明し、どれを最初に扱うか所有者と合意する。塔の次章/50階、オンラインHARD、新報酬は別プロジェクトとして仕様を決める。

関連：[テスト・CI](09_TEST_AND_DEPLOY.md)、[保存](04_DATA_AND_FIREBASE.md)、[既知の制約](10_KNOWN_ISSUES.md)。

[総合案内へ](00_START_HERE.md)
