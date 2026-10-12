# 本番統合・自動更新の初回設定案（2026-10-13）

ユーザーの最新依頼により、素材公開・本番統合・初回設定後の通常更新の自動公開へ方針変更した。以前の本番公開禁止/素材秘匿はこの範囲で更新される。Firebase本番ルール/データ/grant・Actions初回設定は未承認、まだ実施しない。

## 統合構造

正式repo `factorfactor` のmain `56981bd90b9aa54a39b0db5458b34d867ec39249` を再fetchし、前回基準と一致を確認した。既存HTML＋独立core/store/UI/CSSを維持し、作業branch `math-tower-ch1` の実装を統合する。既存mainにはActionsがなく、GitHub Pagesの現在の設定はAPIのForbiddenにより未確認。

`math-tower/chapter1.json` はユーザーが公開を許可した第1章素材（約6.2MB、13イベント/391行、再利用画像）。未到達表示をUIで隠すが、直接取得による素材秘匿は行わない。`math-tower-release.js` の素材URLを更新するだけで文章/画像を通常公開工程に含められる。素材をRTDBへアカウントごとに複製する必要はなく、初回のコンテンツDB配置も不要。

Firebase側で保護するのは管理側grant・試遊記録・予約されたcontent枝。匿名UID/accountKey/logins/teachers/有効teacher grantを維持し、生徒や未許可ユーザーの試遊データ取得/保存を拒否する。素材取得の前後もサーバーgrantを確認する。公開JSの加工でこのDB認可を迂回できない。古いprotected-content読込はローカルfixture互換用のfallbackとして残すが、本番HTMLは公開素材URLを設定する。

先生入口は有効grantの取得に成功した場合だけ表示。直接hash入口でも認可を実施し、セーブは専用trialProgressのrevision付きtransaction。PC/iPhoneが普段のアカウントで各UIDを連携すれば同一accountKeyへ保存する。競合時は古い保存を拒否し再読込、通信失敗は再試行案内。モック先生・ローカルZIPを本番成果物へ含めない。公式学習・ランキング・プロフィール・称号の保存先は変更しない。

## 自動公開の構成

`.github/workflows/math-tower-pages.yml`：PR/mainで検証。ビルド→単体→実RTDBエミュレータ17×2＋統合回帰157→E/N/Hブラウザ→既存モード/対戦/先生ロビー/既存ログイン/ランキング→公開ファイル再検査を全て通過してからPages artifactを作成する。共有エンジン230関数のAST比較も併用する。

公開ファイルは明示リスト＋既存imgだけ。テスト・snapshot・CI設定・ログ・ローカルモック・私的セーブを除外し、管理者秘密鍵/サービスアカウント/GitHub token/先生パスワード値/私的データ/モック混入を検査する。FirebaseクライアントapiKey等は既存の公開クライアント設定で、管理者秘密情報とは扱わない。検出は既知形式と公開対象限定による防止であり、あらゆる秘密情報の完全な判定を保証するものではない。

deployは検証成功後のみ、main限定、かつRepository variable `MATH_TOWER_AUTODEPLOY=true` の場合だけ。初回未設定なら公開しない。通常ジョブはcontents:read、deployジョブだけpages:write/id-token:write/contents:read。全Actionsを公式repoから確認した40桁SHAで固定。workflow自身のactionlintもchecksum固定の公式binaryで検証。Firebase管理者認証情報をCIへ渡さず、本番ルールやデータを自動deployしない。

通常運用は作業branch→CI通過PR→main統合→再検証済みartifact→同じ本番Pages。初回設定後の許可された塔UI/素材/内部バグ修正は毎回承認を求めない。ルール・grant・生徒解禁・有料サービス・大幅な既存仕様変更は引き続き事前承認が必要。

## 承認が必要な初回作業

A. **Firebaseルール**：最新Console全文と元exportを比較し、`games/factor/mathTowerV2`追加だけの差分と、teachers/$k・teacherKeys/$kの2 write修正を別々に確認・適用する。全既存枝/他ゲームを保持する。差分はfirebase内の2fragment。元export SHA256は `684d3898d3497696ae23ae0310301b1be70b9acf245155eac4cd1b1cfb887f96`。本番設定値の型/既存先生の信頼性は未確認。既存先生マーカー/キーを削除・移行しない。先生パス/キーが空でない文字列か管理者がConsole内で確認し、値はチャットやコードに載せない。

B. **管理側grant**：ユーザーが指定した自分のaccountKeyだけに、Console管理側で以下を初回配置する（IDは未確定なのでまだ実施できない）。

```text
games/factor/mathTowerV2/access/{指定されたaccountKey}
```

```json
{"enabled": true, "role": "teacher"}
```

他の先生へ一括付与しない。教師マーカー削除だけでは正しいキーによる再登録が可能なので、取消にはenabled=falseを使用。grantを再作成/再有効化する管理操作も都度承認。既存のtrialProgressは初期化せず、最初の許可ユーザーの保存で作成する。

C. **GitHub初回設定**：PagesのSourceをGitHub Actionsへ変更、workflow内の最小権限とgithub-pages environmentのmain-only deploymentを許可する。現在Sourceがbranch deployなら、main統合より先に切替を確認する。そうしないとテストを待たず旧方式で公開される恐れがある。環境の毎回手動レビューは通常の自動公開を止めるので、初回承認後の運用では付けない。できればmainのrequired checkにverifyを設定し、通過PRだけ統合する。ルール検証用Repository secret `RTDB_RULES_BASELINE` へ、承認された**統合前**ルールexport（ルール文字列だけ、管理者鍵/実データではない）を設定する。設定値が欠けるとCIは失敗して公開しない。

このbaselineは初回に確認した原本を固定して回帰差分を再現する。統合後ルールをそのまま上書きすると、既存mathTowerV2の自動置換を拒否してCIが停止する。CIは本番の最新ルールを自動取得する監視ではない。将来の本番ルール変更は別承認＋snapshot/検証の更新が必要。

D. **初回の有効化**：A〜Cを確認してからmainへ検証済みコードを統合し、`MATH_TOWER_AUTODEPLOY=true` を設定して初回公開を実行する。今回は本番統合自体の方針は承認済みだが、その前提となる初回設定はまだ承認されていない。GitHub管理API/本番Firebase管理接続が利用できない場合は、承認後に所有者がConsole/Settingsで初回設定するか、環境へ管理可能な接続を安全に追加する。秘密値はチャットに送らない。

公開repoの標準GitHub Actions/Pagesを利用し、新しい課金サービスは追加しない。実機確認が終わるまでSafari/本番端末間同期は未検証と表示する。

## 復旧

- 通常更新後：Actionsの「Verify and publish FACTORxFACTOR」→Run workflowで、main上の前回正常releaseの40桁SHAをsource_shaに指定する。main履歴のSHAだけを受け付け、過去コードも全検証を再実行してから公開する。セーブデータやルールへは触らない。これによりUI/素材を戻せる。
- 自動公開の停止：Repository variable MATH_TOWER_AUTODEPLOYをfalseにする。既存公開サイトを削除しない。
- 最初の統合に問題がある場合：初回前のmain `56981bd...` のZIP/Git bundleを非公開保管しておく。この古いmainには新CIがないので上記自動rollbackは通らず、所有者の承認によるバックアップ成果物の復旧が必要。旧branch deployへ戻すなら設定を明示確認する。復旧方式まで初回設定で確認する。
- 先生試遊を止める場合：管理側grant.enabled=false（管理操作はユーザー承認/所有者操作）。既存の本番学習記録は削除しない。

## 今回の検証範囲と保留

ビルド/32公開ファイル検査、単体10件、認可17×2、統合/互換157、塔ブラウザ23、旧共有230関数、ソロ/学び/CPU/週レイド/daily、2人対戦の実操作・大会/クラスレイドロビー、既存アカウントlogin/reload/既存stats保持、ランキング窓を確認。通信はエミュレータかモックで、本番アカウントへ操作していない。Actions YAML/actionlint/シェル文法は通過、GitHub Actions上の実ジョブ・Pages公開は未実施。

最新Consoleルール、現在のGitHub Pages/Actions設定、実際のteacherPass/keys型、先生一覧、PC/iPhoneの本番保存/再ログイン/通信断/Safari実機は未確認。大会全ラウンド・全対戦形式・クラスレイド完走も未検証。素材公開許可は既存データの削除/移行や管理権限公開の許可ではない。

第2章以降は各章5階のcontent/schema設計へ拡張し、別の公開chapter package＋権限/到達制御を段階追加する。今回のエンジン/保存検証は第1章5階固定で、50階対応済みとは扱わない。
