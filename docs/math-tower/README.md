# 数学の塔：第1章の開発

正式repo `asumax1128/factorfactor`、正式サイトは既存GitHub Pagesのみ。旧devは読み取り専用参考。新しい試遊サイト・Cloudflare構成は追加しない。

第1章専用の `MathTowerApp` が既存AppRootへ接続する。共有の問題生成・採点・BattleBoard・TargetCard・HpBar・音を再利用し、レイド/対戦のダメージ関数を変更しない。既存旧塔コード/記録は削除せず新しいメニューからは起動しない。

## 開発手順

Node 24 / npm 11 / Java 21 / Chromiumを使用した。各クラウドタスクは既に隔離されているので、既存チェックアウトを使う。ユーザーの明示指示がない限りGit worktreeを作らない。

```sh
npm ci
npm run build:tower
npm run test:tower
node --test tests/math-tower-store.test.cjs
MATH_TOWER_CONTENT=/アクセス制限された場所/chapter1.json npm run test:tower:browser
npm run test:regression
node tests/online-regression.cjs
```

Chromium実行ファイルは既定 `/usr/bin/chromium`、必要なら `CHROMIUM_PATH` を指定する。ブラウザテストはFirebase/GAS/CDNを全てモックし、実サービスへ接続しない。`math-tower-ui.js` は `src/math-tower-ui.jsx` の生成物で、変更時はビルドして差分を含める。

## 非公開素材

公開repoには物語・画像・原本・Firebaseの投入JSONを追加しない。旧dev由来の24配信用画像と24原本、原稿・設定はチェックアウト外の保全アーカイブに保持している。実行中の第1章にはキャラクター7画像＋背景7画像を使用し、残りは後続章用として保持する。

```sh
node scripts/prepare-math-tower-private.cjs /非公開の参考資料ディレクトリ /チェックアウト外/chapter1.json
```

出力は上書きしない。作り直す場合は別の出力名を指定する。元ファイルは読み取り専用。コンテンツ本文・画像はGitへ追加せず、アクセス制限された永続保管先へ別途移管する。旧dev削除前に、アーカイブの復元とClaudeからの参照を確認する。

## Firebaseの設計（本番未適用）

RTDBの追加領域 `games/factor/mathTowerV2` のみを使用する。既存匿名Authを維持する。Firestore/Storage/Functions/有料サービスは追加していない。

- `access/{accountKey}`：管理側が用意する `{ enabled: true, role: "teacher" }`。クライアントは書込不可。
- `content/{accountKey}/chapter1`：非公開JSON。画像はdata URLとして同じ保護領域に含める。クライアントは書込不可。
- `trialProgress/{accountKey}`：本人連携＋先生権限＋有効なgrantが必要。試遊専用・schemaVersion/revision付き。公式称号/学習/レート/GAS/旧塔最高階へは書かない。

認可条件は `auth != null`、`logins/{accountKey}/{auth.uid}` の存在、`teachers/{accountKey}` の存在、有効な先生grant。localStorageのaccountKeyを信用せずDBルールが対応を検査する。ゲスト/生徒/別UIDは拒否。取消し時は画面上のコンテンツを破棄する。将来の先生指定テスターは、管理側grantに付与元/対象/期限等を追加してサーバー条件を拡張する。現在は先生のみ。

`firebase/math-tower.rules.fragment.json` は既存 `games.factor` へ追加する差分案。現在配備されている本番ルールを取得・監査してから統合する。参考devの全ルールを正式版へコピーしない。祖先の広い読書き権限がある場合は、この下位の拒否だけでは制限できない。

同一アカウントの複数端末は既存の合言葉ログインでそれぞれのUIDを連携する。セーブはrevision一致のtransaction。競合時に古い端末の保存を拒否し、再読み込みを案内する。通信断時に未検証の書込を公式記録へ自動昇格しない。戦闘中の再読み込みは最後に保存した階/HPから再挑戦で、盤面・コンボの途中復元はしない。ボス撃破後の未読物語はpendingStoryで続きへ案内する。

章単位の配信なので、先生には取得済み第1章のソース解析が可能。未到達情報はUIでは隠すが、先生からも階別に秘匿する認証配信は未実装。第2章以降はパッケージに含めない。公開済み旧suri-data.jsの既存情報を秘密に戻せるとは扱わない。

base64画像をアカウントごとに持つため、初回読込は約6.2MB。試遊人数が増える前に保存/転送量を測る。大規模配信を無料枠で保証しない。変更が必要な場合もユーザー承認前に新サービスや課金を追加しない。

## ローカルエミュレータ

```sh
node scripts/prepare-math-tower-emulator.cjs
npx firebase-tools@14.27.0 emulators:start --project demo-factorfactor-tower --only database --config firebase/emulator.json
# 別ターミナル
npm run test:tower:rules
```

`math-tower.emulator.rules.json` は最小のローカルfixtureであり本番へ配備しない。認可テストは必ずloopback9000とdemoプロジェクトを使用する。公式エミュレータ取得に `storage.googleapis.com` への通信が必要。取得時のチェックサム/TLS検証は維持する。

## 正式サイトへ反映する前の操作

1. エミュレータ認可テスト、現行本番ルールの差分監査、実機と未実施の回帰を完了する。
2. ユーザーがコード差分・試遊用数値・保留事項を確認する。
3. 本番Firebase変更の明示承認後に差分ルールと先生grant、非公開パッケージを管理権限で用意する。未設定では入口も塔も閉じる。
4. mainマージ/pushとPages公開の明示承認後、同じ正式サイトへ反映する。
5. 先生/生徒/ゲストの実際のアクセスと副作用を確認する。

今回の作業では本番ルール・本番データ・main・Pages・旧dev/Cloudflareは変更しない。
