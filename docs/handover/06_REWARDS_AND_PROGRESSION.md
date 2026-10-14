# 成長・報酬・取得条件

## 正式な全件台帳

全件のID・条件・必要数値・モード・判定行・更新経路は既存CSVを参照する。本書で条件を再定義しない。

- [称号97件](../../reports/titles_inventory.csv)
- [共有実績92件](../../reports/achievements_inventory.csv)
- [きせかえ37件](../../reports/cosmetics_inventory.csv)
- [既存全件監査](../../reports/titles_achievements_cosmetics_audit.md)

基準5584885でCSV行数とコード定義を照合：BADGESは88直接定義＋デイリー4＝92、独立レート称号5を足し97。実績active87/hidden5/retired0。きせかえはタイル17/背景13/エフェクト7（初期3、取得可能32、塔の2は要確認）。明確に取得不能と断定した項目は0で、要確認をretiredへ変換しない。

称号カテゴリ：対戦57、今週のボス19、ログイン3、ミッション1、数学の塔5、ゴースト3、デイリー4、独立レート5。実績では独立レート5を含めない。

根拠：[index.html:7397・`const BADGES`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L7397)、[index.html:3432・`const SKIN_TILES`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L3432)、[scripts/audit-rewards.cjs:14・`const extra`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/scripts/audit-rewards.cjs#L14)。

## EXPとレベル

次レベル必要EXP=`40+20×現在Lv`、Lv1から累積分を順に引き、上限999。ゲストはlocal、登録者はaccounts.stats.exp。`addExp`はtransactionだが、任意の呼出し自体に全モード共通の一回キーがあるわけではない。

|経路|実値・主な一回制御|
|---|---|
|ソロ|正解>0なら5+2×正解数、目標クリアで+20。finishGame/学習送信|
|CPU|勝8/それ以外5。公式戦績は更新しない|
|旧ルーム/新Bルームの通常結果|勝30/引分20/負15＋min(10,Perfect数)＋適用される懸賞金。新BはroomSeen[gid]|
|新レート人間戦|core/本人applyはdifficultyレート/戦績・学習を処理するが、ResultのEXP欄はopponent付きだけ。旧ルームと同じEXPを付与しているとは断定しない|
|学習ゴースト|quick/指名勝8、他0、自己0。結果・本人statsの受取記録で一回|
|新デイリー|完走のみ、そのJST日の最初20/追加5。dailyRewards[day][attemptId]。部分スコアは順位へ、EXPなし|
|ドリル/旧daily|PracticeRunner/LegacyDailyAppで別採点・報酬。新dailyの量を転用しない|
|日次ミッション|各30、全達成追加50。mis.cと一日集計で重複受取を抑制|
|週間出撃|base=10+min(30,floor(damage/15))。JST初出撃base2倍＋宝箱EXP|
|週間討伐|round((20+min(60,round(個人d/全体HP×400))+順位1位30/2〜3位15)×怒り倍率)。doneのk/sで討伐/週締め区別|
|ログイン|7段階EXP20/30/10/40/50/10/100、3/6日目かけら1、7日目2。休んでもカードをリセットしない|
|現行塔試遊|trialProgressのreward/fragmentのみ。通常EXP・公式称号へ未反映|

根拠：[index.html:3304・`const expNeed`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L3304)、[index.html:3311・`async function addExp`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L3311)、[index.html:1974・`const gotExp`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L1974)、[index.html:9930・`const exp = practice`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L9930)、[index.html:4026・`const MIS_EXP`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L4026)、[index.html:5516・`const wkBonus`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L5516)、[index.html:5567・`const LB_REWARDS`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L5567)、[index.html:10951・`async function completeDailySolo`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L10951)。

## ミッションと学習

日付＋accountのseedで共通ch枠（daily1回）＋poolから2枠＋弱点/新しい型1枠を選ぶ。pool目標は正解30/40/50、Perfect8/12/16、combo8/10/12、対戦2/3、勝1/2、solo2/3、clear1、Lv3〜8を6/8問、raid1、drill1。弱点5問/未収集型3問。日付はJSTで、通常対戦・ソロ・ドリル・レイドのapplyLearn/missionEvent経路に依存する。

profはlv別・pattern別n/ok/ms/judge等の集計。学びの部屋は苦手分析、10問ドリル、型図鑑。新レート・旧ルーム・CPUの保存モードは同一ではない。

根拠：[index.html:4049・`function missionsFor`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L4049)、[index.html:4064・`function applyMis`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L4064)、[index.html:3765・`function applyLearn`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L3765)、[index.html:4295・`function LearnApp`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L4295)。

## 称号・実績の表示と装備

BADGES.testによる動的取得判定は、全件の「取得済みID永久リスト」ではない。旧二つ名はstats.nick、新独立レートtitleはprofile.title、レート/ゴーストbadgeは永久flag、dailyは順位proofに基づく別branch。

塔5（tw10/tw30/tw50/tw70/tw100）はhidden。通常の一覧/プロフィール/達成率対象はactiveのみ。達成率=取得済みactive数/87。先生は既存teachers認可を確認して全92条件・数値・更新箇所を見られる。未取得条件の通常表示は？？？を維持。取得歴・装備中二つ名・きせかえのBADGES全数条件は消さない。

根拠：[index.html:7490・`const badgesOf`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L7490)、[index.html:7493・`const activeAchievements`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L7493)、[index.html:7494・`function AchievementAuditPanel`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L7494)、[index.html:9154・`function TeacherDash`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L9154)。

## きせかえと歴代MASTER

skinOpenはLv/rank/badges/mis/bounty/boss/shards/tower条件。選択はstats.skinとfxf_skin_v1。MathTextへUIフォント/外見を侵入させない。レベル条件など全37の値はCSVが正本。

tile:masterとfx:masterは歴代E/N最高値・旧履歴・easy_master/normal_master/dual_master永久証明を参照。下がっても条件を喪失しない。装備済みMASTERの後方互換もある。その他rank解放品は旧skinInfo(maxRating/seasonMax)が中心で、勝手に全品へ新レート履歴を適用しない。

デイリー称号はDEキング/DNキング/DHキングと3つ保有時のデイリーキング、4種を独立保持/装備。JST日次確定の仕組みは05ではなく[保存04](04_DATA_AND_FIREBASE.md)と[ルール02](02_GAME_RULES.md)へ。

根拠：[index.html:3491・`function skinOpen`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L3491)、[index.html:3506・`const RatingHistory`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L3506)、[index.html:3585・`function Wardrobe`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L3585)、[src/daily-client.cjs:43・`async function awards`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/src/daily-client.cjs#L43)。

## 未修正の条件・説明差

tw50説明の王撃破とbest≥50、tw100説明3回とendN≥3 OR best≥100、B限定説明なのにCも取得対象、B2のdmgTaken/cancelTotalの意味の違い、旧rankアイテムの歴代新bucket参照差は既存監査に記録済み。今回は報告だけ。塔関連の称号/きせかえ条件を公開予定に合わせて変更しない。

通知も`BadgeReveal`、FX.band、Resultの新称号、ExpGain、LoginBonusなど複数。共通化候補は[UI監査](17_UI_UX_AUDIT_AND_REDESIGN.md)。

[総合案内へ](00_START_HERE.md)
