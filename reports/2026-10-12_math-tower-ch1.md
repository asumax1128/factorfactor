# 数学の塔 第1章：実装・検証報告

2026-10-12（日本時間）。正式repoの作業ブランチ `work/math-tower-ch1`。
基準main `56981bd90b9aa54a39b0db5458b34d867ec39249` は開始時にリモートと一致した。

## 状態

第1章のローカル実装と通信モック検証を完了。本番への安全な反映を完了したものではない。Firebaseエミュレータ検証は環境のネットワーク制限で未完了。main・GitHub Pages・本番Firebaseには反映していない。

## 1. 実装した機能

- 既存メインメニューの独立した数学の塔。生徒/ゲストには入口を表示せず、直接hashでも認可する。
- 匿名Firebase UIDとaccountKeyの連携＋先生権限＋管理側grantを要求する追加DBルール案とクライアント取得/保存。
- 非公開の物語/画像をRTDB保護領域から取得。旧devの原稿・設定・画像を、公開repoへコピーせず再利用するパッケージ生成。
- プロローグ、章導入、1〜5階の前後会話、章末。主人公画像なし、背景上の全身キャラ、複数話者の明暗、既読のみ手動スキップ。
- EASY/NORMAL/HARD、6タイル、既存生成/採点/ドラッグの再利用。Lv1開始、誤答同Lv別問題、時間切れ同問題、ポーズ同程度別問題、章HP持越し。
- 承認済み暫定ポリシー、ヌルの誤答2倍反撃、勝敗と試遊ランク/報酬、章再挑戦。第1章で停止。
- 数理の書/図鑑/学習記録/断片/冒険日誌。名前解放、討伐、NEW、並べ替え/フィルタ、画像拡大/移動。
- 端末間の試遊保存、revision競合拒否、結果保存再試行、勝利後の未読会話回収。旧記録や公式ランキング/学習/称号への書込なし。

## 2. 変更したファイル

|分類|ファイル|
|---|---|
|既存との接続|`index.html`（追加読込、メニュー札、ルート/hash、旧札関数名）|
|塔ルール/保存|`math-tower-core.js`、`math-tower-policy.json`、`math-tower-store.js`|
|画面|`src/math-tower-ui.jsx`、生成 `math-tower-ui.js`、`math-tower.css`|
|Firebase差分案/ローカルfixture|`firebase/math-tower.rules.fragment.json`、`firebase/emulator.json`、`firebase/math-tower.emulator.rules.json`|
|ローカル生成|`scripts/build-math-tower.cjs`、`prepare-math-tower-private.cjs`、`prepare-math-tower-emulator.cjs`|
|検証|`tests/math-tower-core.test.cjs`、`math-tower-store.test.cjs`、`math-tower-browser.cjs`、`math-tower-rules.cjs`、`browser-harness.cjs`、`firebase-mock.js`、`legacy-regression.cjs`、`online-regression.cjs`|
|依存/記録|`package.json`、`package-lock.json`、`.gitignore`、`docs/math-tower/`、この報告|

旧devの追跡/未追跡ファイルに変更なし。正式版の `suri-data.js`・既存画像・manifestは変更なし。非公開パッケージはチェックアウト外に保存。

## 3. テスト結果

|実行対象|結果・意味|
|---|---|
|`npm run build:tower`|成功。公開UI生成|
|`npm run test:tower`|8件成功：戦闘ルール6件、保存競合/入力2件|
|`npm run test:tower:browser`|23確認成功。生徒/ゲスト/別UID拒否、E/N/H全1〜5階、未読プロローグ→1階、6枚盤面、ポーズ、勝利、保存/reload/別UID連携端末、図鑑/名前解放/画像拡大、旧stats/ランキング書込なし、時間切れ同問題、敗北/HP100再開始、先生取消し。すべて外部通信モック|
|`npm run test:regression`|既存230関数AST一致。ソロ/学び/CPU/週間レイド/デイリー起動成功|
|`node tests/online-regression.cjs`|2人オンライン対戦のドラッグ/同期、先生大会ロビー、先生クラスレイドロビー成功（モック）|
|JS/テスト構文、`git diff --check`|成功|
|私用パッケージ監査|公開チェックアウトへ私用JSON/画像が入っていないことを確認|
|画面|390×844のプロローグ/戦闘スクリーンショットを目視。NORMALは1366×768、EASY/HARDは390×844の自動検証。横幅超過なし|
|公式Firebaseエミュレータ取得|失敗：`storage.googleapis.com` に403 Domain forbidden。検証回避はしていない|
|`npm run test:tower:rules`|初期化でECONNREFUSED（エミュレータ未起動）。認可の17確認は実行されていない。成功とは数えない|

初期テストで、hash変更が初回起動以外に反映されない接続不備を修正。二重会話完了を抑止。モックのtransaction/current値と権限取消し通知、マルチプレイヤーロビー待機を実際の意図に合わせて修正した。テストのタイムアウトをそのまま無視したり、期待値を通るだけに緩めていない。

## 4. 既存モードへの影響

共有戦闘・Auth・レイド・学習・大会・ランキング等の既存関数は変更していない（ASTで230関数確認）。変更はメニュー表示とAppRootへの接続。ソロ・通常オンライン・先生機能の起動/一部操作は通過。

全対戦方式の完走、大会全ラウンド、フレンドレイド完走、本番ランキング送信は未実施。AST一致や起動成功を全機能実プレイと同一とは扱わない。

## 5. 未解決・保留

- エミュレータ認可未検証。必要ドメインを環境設定ドラフトへ追加保存したが、現在のネットワークへ適用済みとは確認していない。
- 現行本番ルールとの統合監査、実機Safari/タッチ/音/PWA、本番Firebase/Pages接続は未実施。
- 端末間同期はモックで確認。通信断の自動同期/競合自動マージ、戦闘盤面の途中復元は未実装。失敗/競合は画面で案内する。
- 第1章再戦チャレンジ「零の試練」、公式プロフィール/称号検証、後続章は未実装。第1章試遊報酬は公式称号ではない。
- 章単位コンテンツを先生へ配信する。一般ユーザーにはDBで制限する設計だが、許可された先生による第1章のソース解析/保存を防止しない。階単位の秘匿配信は未実装。
- 約6.2MBの章JSONをアカウント別に用意する設計。試遊人数増加前にRTDB容量/転送量を確認する。追加サービス/課金を行っていない。
- チャレンジランキング/最終称号名の仕様競合は引き続き保留。戦闘数値はユーザー承認済みの試遊用暫定値。

## 6. 作業ブランチとコミット

`work/math-tower-ch1` にローカルコミットを作成する。正確なSHAは `git log -1` とチャット最終報告に記録する。GitHubへpushしていないため、GitHub上の作業ブランチ作成済みとは主張しない。

## 7. 正式サイトへの反映に必要な操作

まずクラウド環境設定で `storage.googleapis.com` を許可し、公式エミュレータを取得して認可テストを実行する。設定ドラフトの保存/環境の公開は、GitHub Pages公開とは別操作。今回どちらも代理実行していない。

その後、現行本番ルール差分監査・残り回帰・実機確認、ユーザー/ChatGPTレビューを行う。本番Firebase変更の明示承認後に差分ルール・先生grant・非公開コンテンツを用意し、mainマージ/pushとPages公開の明示承認後に既存サイトへ反映する。未設定の間は入口/塔とも閉じる。

## 8. Claudeへの記録

`docs/math-tower/README.md` に実行/検証/非公開資料/反映手順、`decisions.md` に現在の許可と暫定値、`handoff.md` に構成/制約/未完了/次の担当者の手順を整理した。原稿の表示名修正と旧制作条件の不採用を記録。秘密値・未公開原稿は含めていない。
