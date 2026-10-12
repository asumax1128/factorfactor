# 数学の塔：現行本番ルール統合監査（2026-10-12）

## 結論と対象

ユーザーがFirebase Consoleから取得した `asumath-games` / `asumath-games-default-rtdb` の全文を現行ルールとして監査した。サーバーから独立取得したものではない。本番ルール・データ・認証、main、Pagesを変更していない。公開前のルール検証は通過したが、本番接続と実機検証は未完了のため公開承認を求める段階ではない。

原本SHA-256: `684d3898d3497696ae23ae0310301b1be70b9acf245155eac4cd1b1cfb887f96`。原本・完全な統合候補・実行ログはGit外の `/workspace/firebase-production-audit/` に保管。ルールの内容をデータや追加の作業指示として実行していない。秘密の実データや先生パスワードは取得していない。

## 独立した差分

**差分1：塔追加だけ**。`rules.games.factor.mathTowerV2` を [塔fragment](../firebase/math-tower.rules.fragment.json) から追加。他の枝は構造比較で完全一致。accountKeyと匿名UIDの連携、先生マーカー、有効な管理側teacher grantを要求し、content/accessのクライアント書込を禁止。試遊保存は専用枝に限定する。root/games/factorに広い許可はなく、祖先の許可による塔認可の迂回はなかった。

**差分2：先生登録の修正だけ**。[先生登録fragment](../firebase/teacher-registration.rules.fragment.json) の2つの `.write` のみ変更する。既存auth・UID/accountKey対応条件と以下をANDで組み合わせる。

- `teacherKeys/$k`：teacherPassが存在し、空でない文字列であること。newDataも文字列で、teacherPassと一致すること。
- `teachers/$k`：teacherPassが存在し、空でない文字列であること。teacherKeys/$kが存在する文字列で、teacherPassと一致すること。

`.read`、先生マーカーの形式、既存レコードは変更しない。既存の先生マーカーによる読み取り・大会作成は、キャッシュキーが欠けていても従来通り通過する。文字列の正常な登録も通過する。数値などの設定で新規登録を許す従来挙動は意図的に拒否するため、適用前に管理者が実データの型を確認する必要がある。

候補生成は既存全枝を保持し、塔削除と2条件の復元で元JSONへ完全一致することをassertする。crowd/bluff/kyoen/auction/factor_dev、factorの旧tower/accounts/rooms/daily/raidw/先生機能等は変更しない。他ゲームの式に正式factorのパス参照もなかった。既存mathTowerV2がある入力は自動上書きせず停止する。

Git外候補：`tower-only.rules.json` / `teacher-only.rules.json` / `combined.rules.json`。独立差分：`01-add-math-tower.diff` / `02-fix-teacher-registration.diff`。`02-on-tower-candidate.diff` は塔追加済み候補へ修正2を適用する差分。JSON整形による無関係な差分を避け、canonical原本と比較した。

## 再現した問題と取消

現行式はキーとパスがともに未設定なら `null === null` となり、連携済みユーザーによる先生登録を許可した。teacherPass未設定時のteacherKeys削除も許可した。数値・真偽値・空文字の同値でも登録/キー操作を許可した。修正候補はこれらを拒否する。不正文字列、未連携UID、未認証は現行も候補も拒否した。これはルール条件の脆弱性を再現した結果であり、本番のパスが実際に未設定、または不正登録が実際に存在するとの断定ではない。

先生マーカー削除後は塔の読み書きを拒否する。ただし正常なキャッシュキーが残ると、従来の登録操作で先生マーカーを再作成でき、enabledのままの塔grantが再び使える。この互換動作を残したため、**塔の恒久的な試遊取消は管理側でaccess/$k/enabledをfalseにする**。無効grantは先生マーカー再作成後もアクセスを拒否し、クライアントはgrantを自己付与・再有効化できない。先生資格そのものの恒久取消には、共通パスとキャッシュキーを含む別途の管理方針が必要。

## 実行済み検証

すべてdemoプロジェクト・127.0.0.1:9000の公式RTDBエミュレータ4.11.2で実行。本番へテスト接続していない。

| 検証 | 結果 |
| --- | --- |
| 基本認可17項目：実原本＋塔のみ | 17/17通過 |
| 基本認可17項目：実原本＋塔＋先生修正 | 17/17通過 |
| 未設定・削除・型・UID等23条件を現行/修正で比較 | 46/46通過 |
| 既存先生互換3条件を現行/修正で比較 | 6/6通過 |
| 既存ルール24条件を現行/塔のみ/先生のみ/統合で比較 | 96/96通過 |
| grant・先生取消・再登録・grant無効化 | 9/9通過 |
| コア・ストア単体 | 8/8通過 |
| 塔ブラウザ：E/N/H、1〜5階、会話、保存、敗北等 | 23/23通過 |
| 既存共有関数 | 230関数AST一致（意図的な接続変更は対象外） |
| 既存ブラウザ | ソロ・学びの部屋・CPU・週レイド・daily通過 |
| 対戦等ブラウザ | 2人対戦操作・先生大会ロビー・クラスレイドロビー、3件通過 |

追加ルール検証は合計157 assertions。既存ルールの24条件はaccounts読取、本人stats/prof、他人/ゲスト保存拒否、rooms/meta/player/state/live/result、先生大会/レイド、生徒大会拒否、daily、raidw各記録、旧tower、presence、qm、ghostlogを含む。

ブラウザは外部通信をモックしている。エミュレータルールテストとは別検証であり、実ブラウザ＋本番Firebaseの端末間連携を通過したとは扱わない。全対戦形式・大会全ラウンド・レイド全完走、Safari実機/タッチ/音/PWA、他ゲームの実プレイは未実施。

## 残るリスク（優先順）

1. 本番の既存先生一覧/パス・キーの型は未監査。既に得られた不正先生マーカーは今回の修正では消えない。管理側で信頼できる先生にだけ塔grantを設定する必要がある。
2. 先生取消はマーカー削除だけに頼らず、管理側grantも無効化する。全先生機能の恒久取消は別設計。
3. `factor_dev` 側の同種条件は保持した。今回の正式factor修正では旧名前空間の問題は解消しない。
4. 本番実接続・実端末の確認が必要。非公開資産はまだ本一時環境外への保管/復元確認が必要で、旧devを削除してはならない。
5. 既存の章単位配信・自己申告試遊スコア・戦闘途中復元未実装等の制限は従前報告通り。

## 再実行と適用手順（未適用）

```sh
node scripts/audit-math-tower-rules.cjs /非公開/現行ルール.txt /Git外/監査先
# READMEに従いdemoエミュレータを起動してから
MATH_TOWER_AUDIT_DIR=/Git外/監査先 npm run test:tower:audit
MATH_TOWER_RULES=/Git外/監査先/tower-only.rules.json npm run test:tower:rules
MATH_TOWER_RULES=/Git外/監査先/combined.rules.json npm run test:tower:rules
```

適用を承認された場合でも、まずConsoleから最新全文を再取得して今回原本との差を確認し、復元用原本を非公開保管する。変更があれば再統合・再検証する。管理者が先生設定の型と信頼できる対象を確認し、差分1/2を独立してレビューする。明示承認された差分だけを適用し、grant/非公開章データの配置も別途承認後に実施する。実アカウントで先生・生徒・ゲスト・取消と既存ゲームを確認する。main/Pagesはさらに別途明示承認が必要。既存記録の削除・移行はこの手順に含めない。
