# Ver.5.11 本番ルールの手動公開

この環境には本番Firebaseの管理認証がない。秘密鍵やトークンをチャットへ送る必要はない。所有者が2026-10-13に送付した現行全文を確認し、既存の `firebase/online-spark.candidate.rules.json` と内容が一致していることを照合して候補を作成した。管理SDKで本番データを変更していない。

## 対象とコピー範囲

- プロジェクト：`asumath-games`（Sparkのまま）
- Realtime Database：`asumath-games-default-rtdb`
- 画面：<https://console.firebase.google.com/project/asumath-games/database/asumath-games-default-rtdb/rules>
- 新候補： [firebase/ghost-host.candidate.rules.json](../firebase/ghost-host.candidate.rules.json)
- 元の確認済みルール：[Ver.5.10の全文](https://github.com/asumax1128/factorfactor/blob/616200b1f1067f235623ca8a36dfd469ec2de917/firebase/online-spark.candidate.rules.json)

1. **「ルール」タブ**を開く。データ画面のJSONインポートは使わない。
2. 現在のルール全文をPCのテキストファイルへ保存する。送付後に変更があれば、この候補を使わず開発担当へ差分を知らせる。
3. GitHubで新候補を開き、**Raw**を押す。最初の `{` から最後の `}` まで、全文だけをコピーする。コードブロックの記号やこの説明文はコピーしない。
4. Consoleの**ルールエディタだけ**を全文選択し、候補全文を貼る。プロジェクト・データベース名を再確認する。
5. 新機能のEmulator許可・拒否テストが成功した旨の案内を確認してから、**「公開」**を押す。データや料金プランは操作しない。
6. ページを再読込し、`games.factor.ghostV1`、`eventHosts`、`eventHostRooms` と `onlineSparkV1.slots.$difficulty.fallback` が残っていることを確認する。
7. 開発担当へ「ルールを公開した」と返す。公開後のクライアント検証・Actions公開は担当が続ける。

## 差分の範囲

- `ghostV1/users/$account`：本人にひもづくUIDだけが読み書きできる対戦・履歴・休息保存。
- `ghostV1/inbox/$account/$match`：受取本人と当該挑戦者だけが読める通知。本人の終了済み指名対象にだけ作成し、既存通知の内容変更を拒否。
- `onlineSparkV1`：乱入予約後の人間参加を拒否し、3種の撃破称号の獲得・永久保持を追加。従来のプロフィール、レート引き継ぎ、バックアップ、対戦結果ルールは維持。
- `eventHosts`：登録済み教師のアカウント連携を検証した付与・取り消しだけを許可。
- `eventHostRooms`：委任された生徒の開催部屋を登録。取り消し後の新規登録を拒否。
- `rooms/$code`：大会/レイドに限定された開催者を許可し、委任部屋のホスト管理は有効な種別権限または教師に限定。登録済み教師へのメタデータ引き継ぎを許可。参加者本人の回答権限は変更しない。

`accounts`、`pins`、`logins`、`teachers`、`teacherKeys`、`teacherPass`、`mathTowerV2`、他のゲーム・factor_devのルールは変更していない。既存データの削除・初期化・一括移行・料金追加はない。

## 復旧

不具合時は、保存した**変更直前のルール全文**を同じ「ルール」タブへ戻して公開できる。`onlineSparkV1/config/enabled` やユーザーデータは変更しない。新しい履歴・休息・権限データも削除しない。元のルールでは新機能が利用できなくなるため、クライアントも直前の検証済みVer.5.10へActionsのsource_shaで戻す。開催中の引き継ぎ完了後の部屋は通常の教師運営として保持される。
