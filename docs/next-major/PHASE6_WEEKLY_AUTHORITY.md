# 第6次：週間ボスの共有authority — Emulator検証済みの区切り

対象ブランチ `dev/next-major-20261015`。開始HEAD `9ce4630`。
本番接続・移行・ルール公開・main統合・公開版5.25の更新は行わない。

## 完了した範囲

- `server/next-authority/weekly.cjs`：元コードから抽出した問題生成・判定・ダメージ・週間HP・ギミック・出撃完走EXPを使う共有計算核。
- `scripts/build-weekly-authority.cjs` → `server/next-authority/weekly-source.js`：`index.html` の `raidDamage`, `weeklyInfo`, `wkBonus`, `useBossGim`, `devAward` 等を抽出。既存アプリの関数・ルールは変更していない。
- `server/next-authority/emulator-store.cjs`：demoプロジェクト・loopback DB・Emulator環境変数の三重チェック。一般クライアントには管理権限を渡さない。
- SDK要求をサーバーtimestamp順、同時刻はアカウント・要求ID順に一意に処理。要求再送receipt、古い盤面拒否、同一アカウントの同時出撃拒否。
- 出撃中の問題・タイル順・問題開始時刻・次問待ち・コンボ・ギミック・乱数状態を管理側状態に保持。クライアントの自己申告ダメージ／checkpointを採用しない。
- 切断中の反撃とwave/chimera/kingの時刻境界を管理側で処理し、revision付き確定ログへ記録。前の管理側状態から再生し、同じ時刻までの再実行で追加効果を発生させない。
- 共通HP・同時攻撃・討伐・一人の最終打・討伐時の報酬manifestを同じトランザクション内で確定。既存 `weekly-rewards-next.cjs` のreceipt消費を再利用。
- JSTの出撃予約は5回、完走receiptとは分離。退出は返還しない。週境界前の出撃は元の制限時間を維持し、その完了後に旧週の順位と週締めreceiptを確定。旧週への新規開始は拒否。
- 本人向けviewには開始前／判定待ち／終了後の盤面を含めない。**これはデータ投影の確認であり、実アプリのDOM検証完了を意味しない。**

## データと認可

候補の独立ルート：`games/factor/nextAuthorityV1/weekly/<JST月曜キー>`。

|子パス|用途|権限|
|---|---|---|
|`state`|共有HP算出元、全出撃、確定log、accounts、報酬receipt|管理側のみ|
|`public`|HP／最大HP／revision／討伐／締め状態|認証ユーザー読取のみ|
|`views/<account>`|本人の出撃・同一revisionの共有状態・確定後順位|既存loginsに紐づく本人の読取のみ|
|`requests/<account>/<id>`|開始・解答・再開・退出の入力|本人のみ、新規timestampはrulesのnow、既存内容変更・削除不可|
|`processed/<account>/<id>`|成功／失敗の確定ACK|本人読取、管理側書込のみ|

`firebase/next-authority.fragment.rules.json` は**Emulator試験用の追加断片**。本番ルール全文ではなく、Consoleへ貼り付けない。
SDKテストの `withSecurityRulesDisabled` はrules-unit-testingによる管理側の代用であり、ブラウザが入手できる権限ではない。管理側baselineはテストfixtureからのみ渡し、本番プロフィールからは取得していない。

処理開始後にトランザクションの再試行へ流入した、取得済みclockより新しい正規要求は拒否せず次バッチへ残す。要求の未来timestamp偽造はrulesで拒否する。clockと同時要求の競合を、制限時間延長や認可緩和では回避していない。

## 検証結果

- 新規ユニット6件成功：実因数ペア・元ダメージ・ID再送・古い盤面、dragon反撃22/44秒、同時討伐と唯一の最終打・週締め、5回予約／退出、wave/chimera/kingの一括対逐次再生、JST週またぎ90秒完走。
- 既存週間ユニットと合わせ14件成功：HP切替・checkpoint・報酬receipt互換を含む。
- 実SDK Emulator成功：4匿名クライアント（本人2端末・別参加者・第三者）。private状態／他人view／HP／報酬偽造／要求改変を拒否。2端末同一問題の解答は一度のみ。切断相当の反撃再生と再送、2参加者の同時討伐・最終打・報酬一度、旧レート／B勝利／装備維持を確認。
- 生成処理と構文確認、`git diff --check` 成功。アプリ本体・既存UI bundle・既存台帳・公式ロゴは変更なし。
- 新テストをデプロイなしの `next-major-checks.yml` に追加。CIの実際の結果は `PHASE2_STATUS.md` に追記する。

実行コマンド：

```bash
node scripts/build-online-rated.cjs
node --test tests/weekly-authority.test.cjs tests/weekly-next.test.cjs tests/weekly-combat.test.cjs tests/weekly-gimmick-checkpoint.test.cjs tests/weekly-rewards-next.test.cjs
# インストール済みfirebase CLIで、必ずdemoプロジェクトを指定
firebase emulators:exec --only auth,database --project demo-factorfactor-tower --config firebase.spark.emulator.json 'HTTP_PROXY= http_proxy= node tests/weekly-authority-emulator.cjs'
```

## 未完成・制約

1. **実アプリへの接続、常駐worker／起動コマンド、既存checkpointからの切替は未実装。** SDKテストが明示的に `ensure/process` を実行する。既存ブラウザの本人書込可能な週間sandboxを正式authorityの証明とする変更はしていない。
2. 全15ボス・全週間ルールの原版との差分検証、複数出撃にまたがる共有HPフェーズ変化、切断中の全ギミック境界・宝箱・同時境界の網羅は残る。代表ケース成功を全ギミック完成と扱わない。
3. 一週間全体の状態／ログをトランザクション対象にする**Emulator段階の実装**。人数・週内履歴の増大に伴う転送量／再試行／Spark枠の測定、分割・保持方式の設計が必要。本番へ流用できる性能を確認したわけではない。
4. 完走／討伐／最終打／週締めの更新先は専用の管理側 `state.accounts`。既存ユーザーstats・正式EXP／称号への移行・反映は未接続。既に部分進行した本番週に初期化して置換しない。旧最終打receiptの不足等を推測で救済しない。
5. 本人viewはポーリングworkerによる投影なので、実アプリ接続時はACK・同一revision・開始時刻・stun/fog／2式表示・盤面操作条件を別途検証する。未完成のUI接続は今回のコミットに含めない。
6. HP3倍適用週、ゲスト互換は未承認のまま。元の30000基準と個体倍率・怒り補正を維持。
7. C writer、100称号の正式付与、残UIは今回着手せず。実機Safari／Chromebook、新UI4幅検証も今回新規実施していない。

## 次回の最初の作業

HEAD／作業ツリー／本資料／CIを確認し、成功済みのSDK試験を理由なく繰り返さない。まず週間authorityの残る全ギミック差分検証とworkerのEmulator限定起動方式を整備し、既存アプリ接続の設計を固める。クライアントcheckpointを正式証拠へ昇格させず、既存の認可・旧データを保持する。本番操作が必要ならここで停止し所有者へ確認する。

## 再開後の実アプリ接続（2026-10-16）

以下の第6次時点の未完成項目を更新する。

- Emulator限定 `worker.cjs` と起動・停止手順を追加。管理側の保存状態を再読取して再起動し、二重workerでも要求receiptを共有。JST週替わり時はauthority内の前週状態と元の週ルール選出式を使い、新週を準備する。本番の旧raidwからコピーしない。
- `WeeklyAuthorityGate` は**ページとDBの両方がloopback、DBプロジェクトがdemo**の場合だけ新画面へ接続する。新画面は本人viewとpublic状態を読み、同じrevisionのときだけ盤面を出す。停止・切断でheartbeatが古い場合、READY／判定待ち同様に問題・タイルをDOMから外す。
- 新規要求はIDをlocalStorageに記録してから送信。ACK前に閉じても同じIDで再送できる。解答ごとにダメージを画面で計算し直さない。2式ボスは両式を表示し、旧ドラッグ部品・数学フォントを再利用。
- ホームHPもEmulator接続時だけ同じpublicのHP／最大HP／metaを使用。本番側の取得先と公開版を変更していない。
- 元の `fbStart` を変更せず、開発サーバーがHTMLへ `ui-next/emulator-bootstrap.js` を挿入する。公開HTMLからこのスクリプトは参照しない。ローカルサーバーは127.0.0.1にのみbindする。

### 起動・確認・停止

リポジトリルートで、既存依存関係とインストール済みFirebase CLIを使用する。

```bash
node scripts/build-online-rated.cjs
# firebaseコマンドがPATHにある場合
node scripts/start-weekly-dev.cjs
# CLIを別ディレクトリへインストール済みの場合（パスをその環境へ合わせる）
FIREBASE_CLI_JS=/workspace/math-tower-tools/node_modules/firebase-tools/lib/bin/firebase.js node scripts/start-weekly-dev.cjs
```

HTTPはloopbackの4173番、Authは9099番、DBは9000番。ブラウザからローカル4173番を開き、**開発用の新規アカウント**で登録する。本番のアカウント・認証情報を入力しない。ホームのHP→週間出撃→実ドラッグ→再読み込みを確認する。

停止は起動ターミナルのCtrl+C、または起動プロセスへのSIGTERM。今回の環境ではSIGTERM後に4173／9000／9099が閉じることを確認した。再起動でDBを保持したい場合は、Emulatorのexport/importを**demo専用ディレクトリに限って**構成する必要がある。既定起動は永続export/importを付けていないため、Emulator自体の終了後にデータ保持するとは説明しない。workerだけの停止・再起動ではDBを保持する。

### 追加検証

- 管理側計算核＋既存週間13ユニット成功。
- 実SDK＋実React画面：375／390／430／1440pxで実タイル、1回だけの解答確定、2端末以上の同一出撃、reloadで予約増加なし、worker停止時のDOM非表示、再起動・二重workerで元の問題開始時刻／ダメージ／コンボ維持、退出時に完走報酬なし、旧stats不変、横スクロールなし。
- 旧週間checkpoint画面の4幅テスト成功。204旧関数AST比較＋ソロ／学び／CPU／週間／デイリー回帰成功。
- ワンコマンド起動、実HTMLのloopback配信とbootstrap挿入、worker起動、SIGTERM停止を確認。
- [スマホ画面](phase7-review/weekly-375.png)・[PC画面](phase7-review/weekly-1440.png)。実機Safari／Chromebookではない。
- 新SDK画面テストを既存デプロイなしCIのEmulator工程へ追加。

### なお未完成

全15ボス／全週間ルールの原版差分、ドラッグ中のwave回転タイミング、既存の部位選択など全演出・操作の互換は未網羅。新画面に接続したことを全週間機能の完成とはしない。正式EXP／称号は専用state.accounts内までで、本番既存statsへの反映・移行は行わない。実アプリの正常完走表示の追加確認、長時間／多人数の性能確認、Emulator全体の永続起動設定は残る。

本番の実行環境・費用・認可方針は [AUTHORITY_OPERATIONS.md](AUTHORITY_OPERATIONS.md)。SparkのDBだけではNode workerを実行できない。本番構成未承認のため、公開可能な完成機能とは数えない。
