# Ver.6.0 新称号：クライアント判定方式（所有者決定）

2026-10-16。サーバー（authority）・Blazeは使わない。ブラウザが本番に既にあるデータから条件を判定し、**本人の称号記録に追加保存**する。旧称号と同じ信頼レベル。

## 実装済み（第2単位）
- `src/title-client-next.cjs`：判定（レート到達5件 No.30〜34）、切替時の固定（snapshot）、追加のみの付与計画、同期、表示用ビュー。
- 保存先：`games/factor/titleNextV1/snapshots/<account>`（1回だけ・書換不可）と `awards/<account>/<id>`（追加のみ・サーバー時刻）。旧 `stats`・`nick`・Sparkプロフィールには書かない。
- 表示：新プロフィール「称号・装備」タブ（`src/next-profile-ui.jsx`）。ゲストは保存しない。
- 判定元（No.30〜34）：`onlineSparkV1/profiles/<account>/{easy,normal}/maxRating` の**保存値そのまま**（丸め禁止）。easy≥1730/1820、normal≥1730/1820、dual=両方≥1820。現在レートでは判定しない。
- テスト：`tests/title-client-next.test.cjs`（純関数）、`tests/title-client-browser.cjs`（実画面・再読込・ピーク上昇・丸め・ゲスト）、`tests/title-client-emulator.cjs`（候補ルール・他人への書込拒否・上書き/削除拒否・再ログイン・別端末）。

## 既得称号の保持・移行
旧称号は `stats` から**毎回計算**されるため保存されていない。保存されているのは `dailyV2/titles`、`stats.ghostTitles`、`onlineSparkV1/profiles/<account>/badges` のみ。
1. 初回の同期で、全ソースを読み切ってから（読込途中で固定しない）`badgesOf(stats)` の全ID＋上記3種の保存フラグを snapshot に**1回だけ**固定。装備中 `stats.nick` も控える。
2. 以後 snapshot は変更不可（ルール `!data.exists()`）。条件を後で満たさなくなっても表示・保持は snapshot と awards の和集合。
3. 旧判定式の表示は当面そのまま併用（画面の称号は旧計算＋保存フラグ＋新awards）。旧IDのうち新カタログ外はアーカイブ扱い。
4. 付与は追加のみ。既存IDの再付与・上書き・削除はルールで拒否。

## Firebaseルール変更案（本番未適用）
`firebase/title-client.fragment.rules.json` を `games/factor/titleNextV1` に差し替える案。現行の `titleNextV1`（`.write:false`）は Emulator 用の authority 断片で、本番ルールには入っていない前提（`reports/2026-10-12_firebase-production-rules-audit.md` 参照）。
- `snapshots/$account`：本人（`logins/$account/$uid`）のみ、未存在時のみ書込、`capturedAt===now`、形式検証、未知キー拒否。
- `awards/$account/$id`：本人のみ、未存在時のみ、snapshot が存在すること、`at===now`、`source==='client-judged-v1'`、**IDごとに `onlineSparkV1/profiles/<account>/<部門>/maxRating` の閾値をルール側でも確認**。
- `presentations` は既存のまま。**称号を増やすたびにこの断片へID別の証拠条件を追加する。**
適用手順（所有者作業）：①本番ルールを Console からエクスポートして保存 ②断片の統合版を `RTDB_RULES_BASELINE` と比較 ③Emulatorで `tests/title-client-emulator.cjs` が通る統合版を適用。

## バックアップ・ロールバック
- 適用前：`games/factor/accounts`、`onlineSparkV1/profiles`、`dailyV2/titles`、既存の `titleNextV1`（無ければ空）を Console のエクスポートで保存。ルール全文も別保存。
- 新規書込は `titleNextV1/{snapshots,awards}` のみ。ロールバックは (a) クライアントを旧版へ戻す、(b) 必要なら `titleNextV1/snapshots`・`awards` を削除（旧称号は `stats` 由来で影響なし）、(c) ルールを保存した旧版へ戻す。
- 旧 `stats`/`nick`/Sparkプロフィールは変更しないため、これらの復元は不要。

## No.25〜29（レート到達）のデータ源整理（実装は次単位）
所有者決定：旧ルーム対戦の最高レートとランダム対戦の最高レートの**大きい方**、現在値ではなく最高到達値。
| 称号 | 閾値 | 旧ルーム側 | ランダム対戦側 |
|---|---|---|---|
| master1600/1700/1900 | 1600/1700/1900 | `accounts/<k>/stats.maxRating`（旧総合レート。index.html の recordMatch） | `onlineSparkV1/profiles/<k>/{easy,normal}.maxRating` の大きい方 |
| rgold/rmaster | 1580/1820 | 同上 | 同上 |
要確認（所有者）：旧総合レートと部門別レートは別体系だが同じ数値尺度（初期値1500）で比較してよいか。`stats.maxRating` と `seasonMax` のどちらを使うか（最高到達は `maxRating`）。判定は保存値の生数値で行い丸めない。

## 残りの称号：確定仕様の反映
- 連勝（16〜18・39）：A/Bのルーム対戦とランダム対戦を通算、引き分けで終了、同一試合は重複しない。**既存の `stats.maxStreak` は旧ルームのみ・引き分けで途切れない**ため、そのままでは新条件の証明にならず、`onlineSparkV1/matches` の時系列からは**時系列を復元できる範囲のみ**数える。復元できない過去の連勝は認定しない。→ 今後の試合結果に連勝カウンタ（引き分けで0）を保存する案と、ルーム側の結果記録を足す案を次単位で所有者に提示する。
- 通算勝利（7・8・9・14・15 等）：A・B（旧ルーム）、過去のC、ゴースト、ランダム対戦を含める。旧Cの勝利は `stats.C.w`（`cWins`）に残っているのでそれを使う。ランダム対戦は旧 `stats` を更新しないため `profiles.{easy,normal}.w` と `stats.w` の**二重計上に注意**（`ghost` は別カウント）。
- 週間ボス出撃回数（95 wk_runs20）：ダメージ0でも出撃成立なら1回。画面表示ではなく従来版の出撃開始イベント（`raidw/<週>/dmg/<key>.s` の出撃数）を使う。同じ出撃は二重計上しない。
- 判定不能の 66・69・84・85・89 は条件変更せず、**今後のイベント記録追加案**と**取得条件変更案**を所有者に提示する（未実施）。

## 次の実装単位（提案順）
1. No.25〜29（上表の確認後）
2. デイリー（1〜4）・ゴースト/賞金首（37〜42）・ログインボーナス（97〜100）
3. 週間ボス（70〜96のうち従来版データで判定可能なもの）
4. A/B/ランダムの試合内容系（43〜64）
5. 連勝・逆転・特殊勝利（所有者の追加決定が必要）
6. 大会（65・67・68）、継続・ミッション
7. 隠し称号 `factor_factor`（対象★5 26件のうち異なる15。旧保持分＋新規付与分を数える）


## 追補：ランダム対戦専用ユーザー（旧statsが空）の扱い
- **付与と固定を分離**：新称号の判定・付与は Spark の記録（`onlineSparkV1/profiles`）だけで進める。旧称号の固定（snapshot）は従来どおり安全条件（実在アカウント・stats が空でない・接続中）でのみ作り、満たさない間は**作らず**、次回の同期で再試行する。空の snapshot は決して書かない。
- **ルール変更（唯一）**：`awards` の書き込み条件から「snapshot が存在すること」を削除。残る条件は 本人（`logins`）・未存在のときだけ（追加のみ）・`at===now`・`source`・**IDごとの Spark 証拠（`maxRating` 閾値）**で、`snapshots` の条件（本人・1回だけ・形式検証）は変更していない。awards は snapshot に触れられないため、既得称号の保持は弱まらない。
- **既得との整合**：snapshot が未作成の間は、現時点で判明している旧フラグ（デイリー称号・ゴースト称号・Spark の badges・stats 由来の旧称号）を「保持予定」として新規付与から除外する（後の固定で保持されるため、二重付与にならない）。固定後は awards と snapshot の和集合で表示し、重複は1件。
- **表示上の注意**：固定より前に付与された称号が、後で旧称号としても判明した場合の取得日は、旧称号側の日付が不明なら付与日が出る場合がある。
- **残る限界（要所有者判断）**：stats が永久に空のユーザー（ランダム対戦だけで遊ぶ）は、旧称号フラグ（デイリー/ゴースト/Spark badges）の固定がずっと保留される（表示は旧フラグの併用で失われない）。将来「固定済みのデータのみを正とする」切替をする前に、この層の扱い（空の stats を確定済みとみなす条件）を決める必要がある。
