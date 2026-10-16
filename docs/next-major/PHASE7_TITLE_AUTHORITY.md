# 称号取得証明の管理側接続（Emulator限定）

## 全100件の照合

正式一覧は変更せず、通常100・★5が26・No.65 `tour1`・No.66「王者防衛」を維持。
[取得証明対応表](TITLE_EVIDENCE_100.csv) はUTF-8 BOM付き、1行1IDの100行。既存97件台帳を参照し、元の取得式・内部ID・旧番号・正式条件を併記する。

- 対戦証明adapter：27件。管理側の確定した人間同士のB2履歴の範囲。A/Cの記録まで対応した意味ではない。
- 歴代レート：10件。保護されたonlineRatedV2の保存値で判定し、表示の丸めを適用しない。
- 週間authority：18件。確定出撃予約・完走receipt・実ダメージ・宝箱・応援・討伐／週締めmanifest。重複週・出撃IDは一度。
- 既存dry-runだけの10件：日次・ログイン・攻撃無効化イベント。正式な信頼できる取得元へ未接続。
- 残る35件：新取得adapter未接続。過去の取得済みは保護するが、旧カウンターを推測変換して新規付与しない。

「全6種討伐」は現行15種との対象定義の確認が必要。任意の6種で新規付与せず未接続のまま。

生成・照合：`python3 scripts/title-evidence-next.py`／`python3 scripts/title-evidence-next.py --check`。

## 正式付与の境界

`server/next-authority/titles.cjs` の `reconcile({database,account})` はEmulator三重チェック後、次の保護パスを管理側で読む。クライアントからproof本文・sourceラベルを受け取るAPIは作っていない。

- `titleNextV1/snapshots/<account>`：一度固定した旧取得・元日時・装備。
- `onlineRatedV2/privateState`：サーバー計算済みB2の試合・settlements・歴代レート。未確定、練習、CPU／自己対戦を除外。
- `nextAuthorityV1/weekly/<week>/state`：週間管理側状態。本人書込可能な旧sandboxではない。

既存の `titleNextV1/awards/<account>` と同じトランザクションで追加付与する。既存レコードは上書きせず、元の日時・旧ID・塔IDを保持。旧equipもsnapshotに保持し、元のstats.nickへ変更を書き込まない。

元日時がない記録は確認したサーバー時刻と `dateWasUnknown:true` を保存し、UIは「確認日・取得日不明」と表示する。実際の過去獲得日として表示しない。

**取得条件と公開条件を分離**し、取得証明がある★4/5は内部付与可能。52件の公開条件グラフをimportせず、条件表示は「？？？」のまま。★5の異なる15ID（既得tour1を含む）を満たすと隠し称号を一度追加する。

## 実アプリ接続

Emulator workerは保護されたsnapshotが存在するアカウントだけを5秒ごとに照合する。snapshotがない旧ユーザーの取得状態を、現在の動的旧判定から勝手に固定しない。開発HTTPサーバーは既存title候補断片もEmulatorへ読み込む。

新プロフィールの称号タブは、Emulator接続時だけsnapshotと管理側awardsを参照。本番・非Emulatorの既存表示と保存を変更していない。元のプロフィールEXP／レート／skin／nickを更新しない。

隠し称号の演出は既存のskip／再視聴／ミュート／reduced-motion部品を維持。既存2端末のseen ACKは不変receiptだが、**同時に初回を開いた2端末の演出所有権はまだ未実装**。取得付与の冪等性とは別の残課題。

## 検証

- 新ユニット5件＋互換／cutoverの既存を合わせ10件成功。旧日時と不明区分、旧装備・塔ID保持、26中15の重複排除、1820未満を丸め付与しないこと、公開グラフを有効化しないこと、確定B2／週間の条件を確認。
- 実SDK：2本人端末の同時reconcile、同一awards読取、再試行不変。自己award／snapshot／private対戦状態の偽造と他人読取を拒否。旧stats一式不変。
- 実SDK＋実プロフィール：100件表示、管理側隠し称号と演出、skip、不明日時ラベル、未承認条件「？？？」、元の装備保持を確認。

## 未完成

45件は新規付与まで接続できていない。55件も保持された確定記録の範囲だけで、全旧履歴を救済するものではない。snapshot作成の承認・本番dry-run差分・本番移行は未実行。取得済み新称号の装備選択全面移行、演出の同時初回所有権、正式本番authority環境は残る。管理側の一括読取はEmulator段階で、本番の通信量・費用を検証済みとは扱わない。
