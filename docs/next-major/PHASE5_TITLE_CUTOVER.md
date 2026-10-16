# 称号：既得snapshotと日次確定証明のdry-run

正式100件／★5 26／tour1★5／王者防衛／隠し15種類は維持。52件の公開案は未承認であり、新しい上級称号の正式付与へ接続しない。

## 今回追加

- `src/title-cutover-next.cjs`：旧条件から確実に確認した既得ID・取得日時・装備を一度だけ固定する純粋関数。別migration IDの混在を拒否。同じ移行の再試行は後から増えた旧カウンターを取り込まない。塔・旧ID・未知IDも保管。
- `title-awards-next.plan({legacySnapshot,...})`：snapshotがある場合は動的legacyEarned／flags／装備を無視し、固定した取得履歴から互換読取する。実画面の動的旧判定はまだ置換していない。
- 元取得日時は保持。nullがFirebaseで省略されても未記録として扱う。適用時刻を使うdraftには`dateOrigin:migration-applied`／`dateWasUnknown:true`を残し、実獲得日と区別する。
- `dailyV2/finals/<JST日>/<難易度>`の確定recordを読むadapter。日次確定可能時刻（既存GRACE含む）、本人key、dayを照合し、同日3部門と別々の日の3部門を区別する。矛盾する同日・同部門finalは拒否。上級はpendingのまま。
- Emulator候補`titleNextV1/snapshots/<account>`は本人読取のみ、全クライアントの書込・削除を拒否。管理コンテキストでseedしたsnapshotと移行draftを2回適用し、旧日時／不明日時／装備／塔IDを保持することを確認。

## テスト

称号ユニット9件（既存6＋追加3）成功。実SDKでsnapshot偽造・削除・他人読取・自己award／migrationDraft書込を拒否し、管理側の冪等dry-runと既存の2端末演出ackが成功。実データ移行・本番書込は行っていない。

## 未完成

これは100称号すべての正式取得authorityの完成ではない。B2・保存レート・ログイン・日次final以外の多くのadapterは残る。C確定記録、通常乱入ゴースト、大会の連続性／開始順位、週次全員authority、ミッションの証拠等が不足したまま推測付与しない。本人が入力したsource文字列だけを信頼する認可にはしていない（plan自体は信頼された入力を渡すオフラインdry-run用で、入力のDB認可は代替しない）。

正式接続前に、対象限定バックアップ→管理側snapshot dry-run→差分照合→所有者承認→冪等移行→照合が必要。一般クライアントが旧称号snapshotを自作して賞品を得る経路は作らない。旧UIは動的旧条件を読み続けているため、snapshot読取へ切替えないまま公開不可。
