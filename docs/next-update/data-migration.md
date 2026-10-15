# データ保護・移行仕様案（未適用）

## 調査した保存場所

|データ|現在の正本・根拠|移行案|
|---|---|---|
|従来称号/実績|index BADGES、badgesOf(stats)による累積値からの動的判定|取得済みをsnapshot化する際は旧条件で確実に判定できるものだけ。旧定義/履歴は残す|
|レート系称号|onlineSparkV1/profiles/account.badges/title、core.settle|既存flag・装備IDを残す。旧BADGESと同じ台帳だと仮定しない|
|daily優勝称号|dailyV2 titles/proof/cursor|既存証明と履歴を保持、再発行しない|
|装備|accounts/account/stats.nick、profile.title、stats.skin/local skin|新一覧から消える旧装備も互換表示。強制解除や別ID置換はしない|
|旧B/newBルーム戦績|index recordMatch：stats.B.w/l/d、stats.games/w/l/d、roomSeen|同じB bucketをB表示へ継承。旧Bと新Bの値をもう一度合算しない|
|Spark難易度戦績|profile.easy/normal、ghost、processed/receipt|旧statsは移行元の試合を含む。試合IDで重複除外できない集計を単純加算しない|
|累積補助値|stats.perfects/maxStreak/comebacks/tourWins、info.add/max/min/or|原値保持。加算/最大/最小/bitmaskの区別を維持|
|ボス|raidw/week、stats.wkとboss/done等|既存週/履歴/報酬のdoneを残す。新上限用予約は新しい領域を提案|

## 称号の永続取得（設計案）

新規namespaceを検討するが、保存パスは正式一覧と認可設計後に確定する。取得情報の概念形：

```
awards[internalId] = {
  acquiredAt: サーバー時刻,
  dateOrigin: "original" | "migration-applied" | "new-earned",
  source: 既存履歴の根拠又は確定試合ID,
  migrationVersion: 識別子
}
```

- 元の取得日時が確実なときだけoriginal。日時がない動的称号は適用日のserver時刻＋migration-appliedとし、実獲得日とは表示でも区別する。
- IDと番号/表示名を分離。名称変更はmappingの確認後に既存IDを優先。mapping不明は推測で別の称号へ移さない。
- 一度取得した称号は条件が下がっても保持する。装備中の旧称号は専用互換ラベルで維持し、旧一覧の再表示はしない。
- 先にdry-runの差分を作る。移行は本人ログイン時の限定transactionを候補とし、全ユーザー走査/一括更新は禁止。
- migration receiptとaward初回のみ追記。不明な取得日を再実行ごとにnowへ更新しない。累積値・EXP・レート・勝敗・装備を移行処理で加算/初期化しない。
- 新条件が過去statsから証明できる場合だけ遡及。CPU/自己ゴースト混入を分離できない値は、新条件の対象モードを証明できないため要確認扱い。
- 正式な100件と26件の★5を受領後、全mapping/公開条件の循環検査、旧装備・欠損・取得済み・再送・並行端末のテストを追加する。

## 重要なリスク・事前承認

1. 取得日時を持たない旧称号に「正確な取得日」を復元することはできない。
2. 旧BとnewBは同じstats.Bに既に入る経路があり、世代別合算は危険。読み取り統合を優先する。
3. 全体statsとE/N profileは同じ人間戦の移行重複を含み得る。完全な試合履歴なしで合計を新しい公式総数にしない。
4. 応援ポイントや一部モードの累積は永続保存/単位を確認してから称号に利用する。
5. 新規追記も既存値を変更する必要が出る場合は所有者承認後。本番には一切適用していない。

## 復旧

コードは開発ブランチのcommit単位で戻せる。新領域を読む機能を止めても旧値を読める設計とする。DB全体rollbackや新しい取得履歴削除は自動で行わない。実行前に対象パス限定backup・dry-run・互換テスト・承認を必須にする。
