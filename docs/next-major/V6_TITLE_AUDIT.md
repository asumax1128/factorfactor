# Ver.6.0 称号整合性監査レポート（読み取り専用監査）

監査日：2026-10-18 ／ 対象：`claude/v6-title-equip`（HEAD `2ed7e58` 時点のコード）。
**コード・称号定義・取得条件・表示処理・Firebaseルール・テストは一切変更していない。** 数値はすべてコード／台帳から機械的に数えた値（推測なし）。

## 1. 正式カタログ（100＋隠し1）
- 出典：`src/title-catalog-next.json`（`source: 所有者提供 全100称号 2026-10-15`、`status: roster-confirmed-reveal-pending`）。通常100件（`TITLE_EVIDENCE_100.csv` も100行）＋隠し1件 `factor_factor`「FACTOR×FACTOR」（★5を15種類以上、獲得前は非表示）＝**101**。
- 一覧（番号・ID・正式名）は `docs/next-major/TITLE_EVIDENCE_100.csv` の `新番号／内部ID／正式名` 列が正本（本書では重複掲載しない）。星数内訳：★5=26、★4=26、★3=28、★2=14、★1=6。
- 所有者の明確化（`ownerClarifications`）：attackNullificationMetric、withdrawnFiveStarPromotion（65）、nameCorrections（66＝王者防衛）。

## 2. 旧実績 BADGES
- `index.html` の BADGES は **92件**、`achievements-audit.js` も92件（active 87／hidden 5／retired 0）。
- カタログ内ID（旧判定を流用する）は 92−7＝85件。カタログのうちBADGESにないID（新設・新レート）は15件（下記§6）。

## 3. カタログ外の旧実績ID（7件）と所有者の削除対象7称号の個別照合
「7件」という数ではなく **ID・名称を1対1で照合**した。

| 所有者の削除対象（会話で提示） | 旧ID | BADGES名称 | カタログに存在 | 監査表の状態 |
|---|---|---|---|---|
| 必殺技いらず | `nosp` | 必殺技いらず | なし | **active**（取得可能） |
| 塔の挑戦者 | `tw10` | 塔の挑戦者 | なし | hidden |
| 塔の熟練者 | `tw30` | 塔の熟練者 | なし | hidden |
| 塔を制覇 | `tw50` | 塔を制覇 | なし | hidden |
| 数理の書の継承者 | `tw70` | 数理の書の継承者 | なし | hidden |
| 終わりなき探究者 | `tw100` | 終わりなき探究者 | なし | hidden |
| 討伐の一撃 | `wklast` | 討伐の一撃 | なし | **active**（取得可能） |

- ID・名称とも7件が完全に一致。カタログ外のBADGES IDは**この7件のみ**で、余剰・不足なし。隠し称号 `factor_factor` はBADGESに存在しない（カタログ側にのみ存在）。
- **所有者の正式な削除リスト自体はリポジトリ内に文書として存在しない**（上記7名はこの会話での所有者提示）。リポジトリ内の関連記述は `docs/next-update/TITLE_SPEC_REVIEW.md` L30 のみ：「旧 tw10/30/50/70/100 は通常100件へ含めず保管。nosp と wklast も新100件に該当項目がないため旧履歴・装備互換に残す。**削除／別称号への自動転用は禁止**」。つまりリポジトリの仕様は「新カタログ外・履歴と装備互換は保持」であり、「新規取得を止める」とまでは明記していない。
- その他に所有者が決定した称号削除は、grep（廃止／削除／撤回／退役／retired ほか）の範囲で**確認できなかった**。確認できないものは確定していない。

## 4. 監査項目ごとの結果
1. **カタログ不在**：7件とも正式カタログ（100＋隠し）に存在しない。✔
2. **新規取得の可否**：
   - `tw10/30/50/70/100`：監査表は hidden。BADGES判定式は残るが、塔は現行入口が試遊版で公式記録（`st.tower`）に反映しないため、実際には新規取得経路が閉じている（`reports/titles_achievements_cosmetics_audit.md` の記述と一致）。通常UIの達成率からは除外。
   - **`nosp`・`wklast`：現状コードでは新規取得できる**。`nosp` は `noSpWins` を、`wklast` は `wk.lastHit`／`lastHits` を書く既存処理が稼働し、監査表も active。取得時の「称号ゲット」演出（`statsTx`）はステータスで絞っていない。**所有者の「削除」方針がコードに反映されていない。** 未修正（今回は修正禁止）。要承認事項。
3. **新プロフィール一覧**：描画は正式カタログ（100＋隠し）のみ。7件は一覧に出ない。取得済みの `nosp`／`wklast` は `archived` に入り非表示。✔
4. **過去記録・装備の保持**：固定スナップショット（`titleNextV1/snapshots`、書込一回）は無フィルタの `badgesOf` で旧取得済みIDを保存するため、取得済みの7件も保持。装備中のIDはそのまま表示され、解除できるのは本人のみ（tw10装備のテストで確認済み。プロフィールを開くだけでは書き込まない）。削除・自動解除・別称号への転用なし。✔
5. **余剰・不足**：カタログ外BADGES=7件のみ。カタログ内でBADGESに無いのは15件（§6）。

## 5. 取得判定の実装状況（カタログ100件、コードで機械集計）
| 区分 | 件数 | 内容 |
|---|---|---|
| 旧BADGES判定を流用（カタログ内ID） | 85 | `index.html` の `BADGES[].test`。旧stats由来 |
| クライアント判定（新レート称号） | 5 | `easy_adept, easy_master, normal_adept, normal_master, dual_master`。add-onlyで `titleNextV1/awards` |
| 新設で判定未実装 | 10 | `online_first, wins100_ab, dual50, giant250, flash3, accuracy10, tour_streak2, wksup500, wk_runs20, lb_cards7` |
| 隠し `factor_factor` | 1 | 判定はEmulator専用のサーバー側コードのみ。クライアントでは付与されない |

- 台帳（`TITLE_EVIDENCE_100.csv`）の「正式付与接続」：Emulator専用で reconcile→`titleNextV1/awards`＝58件、「Emulator専用。新規付与未接続」＝42件。**本番で新規付与が動くのは、本番ルール適用後のクライアント判定の範囲に限られ、本番ルールは未適用。**
- 上記の件数のうち「実機・本番での取得を確認済み」は0件（未検証）。

## 6. カタログ内・BADGES外の15 ID
online_first(5)・wins100_ab(7)・dual50(15)・giant250(23)・easy_adept(30)・easy_master(31)・normal_adept(32)・normal_master(33)・dual_master(34)・flash3(44)・accuracy10(54)・tour_streak2(66)・wksup500(94)・wk_runs20(95)・lb_cards7(98)。

## 7. 要所有者判断（未実装・未変更）
1. `nosp`／`wklast` の新規取得を止めるか（削除＝新規取得停止とするか。現状は取得可能）。止める場合も既得・装備は保持し、自動解除しない。
2. 塔5件：塔公開まで hidden のまま維持でよいか。
3. 取得演出（`statsTx`）をステータスで絞るか。
4. 新設10件の判定実装の優先順位。

## 8. 【2026-10-18 追補】§7の判断結果と実装（所有者決定・CI run 37 全通過）
- **決定**：`nosp`・`wklast` の新規取得を停止する（既得者のカウンタ・取得記録・装備は維持／別の統計カウンタは新設しない／本番Firebaseルールは変更しない）。塔5件は引き続き取得経路なし、演出対象から除外。取得演出（`statsTx`）は廃止7件を除外し、正式カタログの称号は正式名で表示（アイコン・`desc`は従来のまま）。
- **実装**（`claude/v6-title-equip`、`c4368a1`）：§2・§4-2の「`nosp`・`wklast` は新規取得できる」は**解消**。`holdRetiredCounters`（`index.html`）が `statsTx`・`recordMatch` の書込みで0→1の更新だけを取り消す。判定式（`BADGES`）・既得の再計算・`stats/nick`・snapshot/awards は不変。
- **検証**：`tests/v6-title-retire.test.cjs`（index.htmlの実コードを検証）ほか。CI run 37 は全ステップ成功。**実機・本番では未検証**。
- **残リスク**：**旧Ver.5.25クライアント経由の新規取得は止められない**（旧端末で0→1になった分は既得と区別不能。完全停止は本番ルール変更が必要＝未実施・所有者承認事項）。週間ボスauthority経路（`weekly-rewards-next.cjs`が`lastHit`を書く）はlocalhost＋demo限定で本番では動かない。
- **§5の件数は変更なし**：通常称号の取得判定が**未実装10件**（§5）と、隠し `factor_factor` のクライアント判定**未実装**は別工程。§7の2（塔5件の扱い）・4（新設10件の優先順位）は未決定のまま。
