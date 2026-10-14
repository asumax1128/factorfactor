# 数学の塔 — 現行先生試遊と旧TowerApp

## 現行実装の範囲

現行AppRootが使うのは`MathTowerApp`（`MathTowerFactory`）。**第1章「ゼロの消えた街」1〜5階のみ、登録先生＋mathTowerV2/access grant**。HTML/第1章JSON/素材は配信に含まれるが、試遊記録・入口は権限確認する。一般公開された70階RPGが現在の入口にあるわけではない。

第1章では通常の装備による攻防ステータス変更、買い物/アイテム経済、50階、次章、零の試練ランキング、公式称号付与は実装範囲に含めない。旧TowerAppの装備・ボスを新試遊へ存在すると誤記しない。

根拠：[index.html:10969・`const { App: MathTowerApp`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L10969)、[math-tower-core.js:41・`floor > 5`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/math-tower-core.js#L41)、[math-tower-store.js:10・`async function access`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/math-tower-store.js#L10)、[math-tower/chapter1.json:1・`"title"`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/math-tower/chapter1.json#L1)。

## 章と登場人物

|階|敵・主題|戦闘・物語|
|---|---|---|
|1|count_rabbit／カウント・ラビット、位取り記数法|プロローグ/章導入/前後会話、101と11を扱う学習ノート|
|2|zero_slime／ゼロ・スライム、0|名の非公開→revealの進行を保持|
|3|twin_fox／プラスとマイナス、正負|会話speakerのplus/minusを個別表示。正式背景は青左・赤右の通路|
|4|abs_wolf／アブソリュート・ウルフ、絶対値|原点からの距離をノートへ|
|5|nul／零の番人ヌル、0・数の起点|章ボス、第一の断片、章末。公式称号ではない試遊ラベル|

chapter1のevents13、notes5、characters8（謎の声はnoPortrait）、backgrounds7、monsters5。floorsは階→キャラクターIDのmapで、汎用敵ステータスの配列ではない。会話原稿・背景・ノート全文はJSONを正本にし、文書へ大量複製しない。

根拠：[math-tower/chapter1.json:1・`"floors"`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/math-tower/chapter1.json#L1)、[math-tower/chapter1.json:1・`"events"`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/math-tower/chapter1.json#L1)、[src/math-tower-ui.jsx:23・`function Story`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/src/math-tower-ui.jsx#L23)。

## 戦闘・判定

- HPは章内持越しで最大100、1問45秒、自然減少なし。
- 難易度のLv上限はE4/N7/H9。Lv1から正解ごとに上げ、上限到達後は上限/−1/−2を50%/30%/20%。上限後の仕様は通常ソロの確率抽選と別。
- 正解の火力単位はcombo1→1、2→1.2、3→1.4、4以降1.5。通常階の敵8単位、ボス15。ハード通常階はLv8以上正解の証明も必要（hardHighGuard）、ボスはこの条件から除外。
- 誤答でcombo0・HP−5、5階のみ誤答2倍−10。timeoutはHP−10・combo0。正解による常時HP回復はない。5階勝利後bossHeal100を上限100に収める。
- 正答率=correct/(correct+misses+timeouts)。勝利時S≥95%、A≥85%、B≥70%、他C。失敗rankはnull。平均時間は正解answerMs/correctで、正答率の閾値を時間で緩めない。
- 火力・HPを確定した後、カード合体→魔法命中の演出。演出/カットイン/一時停止中は問題タイマーを進めない。background/resize後にTowerTargetをfitする。カード操作は共有BattleBoardのdrag。

根拠：[math-tower-policy.json:5・`"problemMs"`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/math-tower-policy.json#L5)、[math-tower-core.js:64・`function nextLevel`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/math-tower-core.js#L64)、[math-tower-core.js:73・`function answer`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/math-tower-core.js#L73)、[math-tower-core.js:107・`function result`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/math-tower-core.js#L107)、[src/math-tower-ui.jsx:214・`function MagicAttack`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/src/math-tower-ui.jsx#L214)、[src/math-tower-ui.jsx:1243・`const hitEnemy`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/src/math-tower-ui.jsx#L1243)。

## RPGループと画面

ホーム→冒険の新規/続き/既クリア階再挑戦→E/N/H→準備→初回プロローグ・章/戦闘前会話→戦闘→savingResult→結果→戦闘後会話→afterFloor→次階/メニュー、5階はchapterEnd。

敗北はrestartへ、選択難易度だけの章を1階HP100へ再開。過去ベスト・既読・別難易度を消さない。replayは本編adventuresを保持してその階をHP100で試遊。数理の書はnotes/journal/monsters、reveal・既読・討伐数・並べ替え・絞り込み・画像拡大を提供する。モンスターの名称解放は会話進行のrevealに依存する。

VictoryはS/A/B/C、正答率/ミス/timeout/bestCombo/HP/敵残HP、物語へ進む/演出スキップ。通常の対戦勝敗/レート/EXPの結果ではない。保存完了前はsavingResultとして再試行を案内。

根拠：[src/math-tower-ui.jsx:1029・`const continueAdventure`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/src/math-tower-ui.jsx#L1029)、[src/math-tower-ui.jsx:1049・`const newAdventure`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/src/math-tower-ui.jsx#L1049)、[src/math-tower-ui.jsx:1118・`const finish =`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/src/math-tower-ui.jsx#L1118)、[src/math-tower-ui.jsx:417・`function Victory`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/src/math-tower-ui.jsx#L417)、[src/math-tower-ui.jsx:488・`function Book`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/src/math-tower-ui.jsx#L488)。

## セーブ・移行・復帰

RTDB envelope schemaVersion1、アプリprogressVersion2、revision単調増加。主なfieldsはadventures[difficulty]{floor,hp,phase,startedAt}、difficulties[difficulty]{best,hp,records}、read/reveal/seen/kills/notes/newInfo/clearedFloors、fragment/reward、history[runId]。

migrateは未知fieldを残し、旧値をmigrationBackupへ退避。未来schema/versionは拒否して新アプリを要求。正答率が同じ個人ベストは平均時間→bestCombo→HPで比較、firstClearAtを保持。

createWriterは変更を最新ローカル状態へ直列適用し、saveはrevisionが一致したtransactionだけ成功。競合はTOWER_CONFLICTで再読込要求、自動mergeや勝手な上書きなし。同runIdをcompleteしても二重記録しない。

reload時は保存済み階/HP/冒険へ戻る。戦闘の途中盤面・comboをクラウドから完全復元する実装ではない。会話既読はsequence完了時に保存し、途中reloadは未完了会話を再提示、phase postの未読を回収する。権限再確認/ネット復帰/別端末競合はrecover手順を使う。

通常EXP、旧stats.tower、旧tower/bestとは別保存。trial結果はverified:false/purpose:trial。公式実績の不正防止基盤と同じにしない。

根拠：[math-tower-core.js:158・`function migrate`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/math-tower-core.js#L158)、[math-tower-core.js:270・`function complete`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/math-tower-core.js#L270)、[math-tower-store.js:47・`async function save`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/math-tower-store.js#L47)、[src/math-tower-ui.jsx:836・`const recover`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/src/math-tower-ui.jsx#L836)。

## 画像と旧TowerApp

素材はchapter1 JSONのimage/data URI、3階の外部PNG、background.focus/facePosition/faceScale等のcrop指定。配信URLはmath-tower-release.jsでhash付き。取得後もアクセス再確認する。失敗時のplaceholder/InlineMathFallbackは実画像の代替で、教師権限の代替ではない。

旧`TowerApp`はindexのTOWER_GOAL70・TOWER_KING_F50・旧mob/boss/gim・SURI物語・旧save体系を持つ。現行rootのmode=towerはMathTowerAppなので、古いtw50/tw70等が新試遊で達成できるとは言わない。旧コードに100階関連の閾値があっても現行の100階実装ではない。

根拠：[math-tower-release.js:2・`MathTowerContentUrl`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/math-tower-release.js#L2)、[src/math-tower-ui.jsx:318・`function InlineMathFallback`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/src/math-tower-ui.jsx#L318)、[index.html:5987・`const TOWER_GOAL`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L5987)、[index.html:6631・`function TowerApp`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L6631)。

## 次章・50階へ向けた変更手順（未実装の計画）

1. 所有者と章・出題・HP/装備/報酬・一般公開範囲を確定する。旧dev文書の承認を流用しない。
2. beginのfloor≤5、CAPS/policy、UIの章固定/5階分岐、storeのchapter/version/取得パス、content validatorを列挙する。
3. 新章JSONへfloors/characters/events/notes/fragment/monsters/backgroundsを定義し、IDの互換性を決める。第1章原稿を削除しない。
4. chapter/floorを区別できるsave構造と移行を設計。schemaVersionとprogressVersionを混同せず、migrationBackup/未知field/旧runIdを保全。
5. 画像原本・crop・動的参照・フォールバックを検査。3階の正式PNGと対話の左右位置を後退させない。
6. core/store/writer/adventures/rulesユニット、会話→戦闘→保存→次章、復帰・二重保存・別端末競合・権限のブラウザ/Emulatorテストを追加する。
7. 公式称号/EXP/旧塔実績へ連携するかを別承認にする。新階追加だけで既存生徒を自動解放しない。

テスト：`math-tower-core/store/writer/adventures.test.cjs`、`math-tower-flow/rpg/recovery/browser.cjs`、`math-tower-floor3-background.cjs`、`math-tower-rules.cjs`。既存詳細は[docs/math-tower](../math-tower/README.md)も参照。ただし古い文書の未実施認可テスト/非公開素材方針はGit履歴と現行コードを優先する。

[総合案内へ](00_START_HERE.md)
