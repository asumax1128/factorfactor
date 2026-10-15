# 現行実装と新要件の対応・設計レビュー

現行根拠は5584885の関数。全仕様の正本は[引継ぎ](../handover/00_START_HERE.md)。ここでは今回変える範囲を対応付ける。

|新要件|現行の実装・依存|対応方針|状態|
|---|---|---|---|
|登録→ホーム5系統|index AppRootのmode solo/battle/daily/learn/raidw/tower|認証/既存modeを保持してHome/SoloHome/RankingHubの画面stateを追加。deep linkと戻り先を明示|UIレビュー待ち|
|ログイン情報と詳細成績|AccountPanelV7/CurrentRatings/PlayerProfile/RatingHistory|E/Nを別表示、現在と最高を分ける。取得していない記録は—。新旧対戦数の重複加算禁止|未実装|
|自己通常/ハイパー|Spark selfPractice / hyper-select|自己専用入口から既存練習ガードへ。ハイパーの自己記録構成とTOP10限定選出の関係は明記して承認を得る（既存hyperのTOP10条件を黙って外さない）|仕様確認が必要|
|daily mission並び替え|missionsForはdaily1件＋random2件＋弱点1件。daily-uiは今日の挑戦/順位の後にMissions|取得条件/日付を保持し、Missionsを上へ再配置。ランダム候補に現状raid等がある場合はソロ/online範囲との対応確認|未実装|
|塔の先生限定|MathTowerStore.accessとteacher/grant、MathTowerApp|先生かつ既存grant条件維持。一般利用者のソロホームから隠す。データ権限も継続|未実装|
|オンラインロビー整理/検索|BattleMenu/VsTable/PlayerProfile/TeacherDash|分類カードと成績検索を追加。先生管理は既存権限で非表示/認可両方を維持|未実装|
|フレンド開催10戦以上|BattleApp.createRoomのfraid条件、accounts.statsと新profile|公式オンライン10戦の定義が必要。CPU/自己は除外。旧statsと新profileの同一移行試合を二重に数えない|設計確認|
|ランキング総合|local/GAS、dailyV2、onlineSparkV1の別データ|入口と部品を共通化し、異なる採点のデータは合算しない|未実装|
|Fair/ヘルプ|JUDGE_TIERSはFair回復2、timingVisualはFair→OK。旧B説明が残る|Fair専用の表示・色/名称を実判定に合わせ、閾値は維持。説明は新A/B/C。塔説明は一般向け非表示|未実装|
|型図鑑/旧塔/旧QM廃止|LearnApp dex、TowerApp、QmWait/QmChip/QmVote|入口を先に除去、参照解析後に未使用表示コードを整理。保存データは残す|未実装|
|旧B対戦廃止|createBEngineをCPU B・C・大会が共有|CPU B/大会BをB2へ接続してから旧B単独導線を撤去。Cのエンジンまで削除しない|未実装|
|先行表示|BattleView:readyでもTarget/Boardがmount、GameA:waitingでも次問probをmount|開始/凍結に加えready/resolving/resultをDOM条件へ。GameA待機、GameB/C resolvingも除外|第1修正実装|
|全バトル共通化|ソロはFactorHunt独自入力、他はBattleBoard/TargetCard、塔専用|視覚token/入力契約/判定を共有し、ソロの終了/HP計算を移植しない。塔RPGの個性を維持|未実装|
|B得点推移|b2.states.histは得点/時刻等を確認、ResultはA詳細のみ|確定イベントから履歴を構成。両者同じrevisionまで採用し、UIで得点再計算しない。追加監視なし|未実装|
|C貢献グラフ|createBEngine sent/covers/cancelTotal/hist等、チームHP|何を貢献と呼ぶかを明示し、得点/攻撃/相殺/回復を別指標。単一恣意的換算はしない|定義案が必要|
|観戦2画面/実況|PlayerMirror/SplitView/useCommentary、B2観戦は簡易数値|2人は並列＋拡大対象選択、スマホは両HUD＋片側盤面の拡大を提案。Cはチーム2列/4人切替、raidは共有HP＋貢献表|UI承認待ち|
|通常100/隠し1|BADGES共有92＋独立レート称号等97、実績・装備に連動|新旧mapping、公開条件DAG、報酬取得履歴を別管理。正式100件を受領、★5が25件のため確認。公開案52件を作成|仕様件数確認中|
|★4/5公開|既存secretのみ、段階公開DAGはない|公開前も内部判定。各条件に先行ID、循環/到達不能テスト。前段なしは個別案承認|正式一覧受領・設計照合中|
|隠し称号|現行未実装|異なる★5 26件のうち15件。初回自動/再視聴/スキップ/mute/reduced-motionの状態分離、報酬を演出完了に依存させない|正式一覧受領・設計照合中|
|旧B成績継承|recordMatchのstats[info.mode]、新Bルームもmode B、roomSeen|stats.Bをそのまま参照。新旧重複を推測加算しない。Spark profileは別receipt由来|移行設計のみ|
|週ボスHP3倍|WEEKLY_HP=30000×trait.hpK×1.2^rage、保存週meta|新基準90000。同じ週の既存metaとダメージ割合/報酬との整合は適用時期承認後|未実装|
|週ボス5回/日|出撃回数の全端末予約は現行なし、wk.sなど実績あり|server JSTの5枠をtransaction予約。途中終了の予約は保持、完走実績は別idempotent receipt。過去の出撃予約を完走と推測しない|未実装|
|フレンド4難易度|RAID_POWER easy=.7 normal=1 hard=1.4をクラスと共有|friend専用設定を分離し、classは現行維持。鬼の倍率/予告/反撃は別承認|数値案未確定|

## 確認する数値・定義

- 週ボスの「通算20回出撃完了」は予約回数ではなく、終了時刻到達または討伐で終了が確定したreceiptを数える案。途中退出/切断後の扱いは明文化し、旧sで完走を証明できなければ既得推測しない。
- 5回制は日付の端末変更で回避できないserver nowをルールで検証する必要がある。SparkのためFunctionsは必須にしない。認可テストが通るまで本番ルールは変更しない。
- 鬼のたたき台：通常の3倍HP、反撃予告を短くする場合も回避可能時間を下限設定。これは提案であり承認済み倍率ではない。共有RAID_POWERを書き換えると先生レイドまで変わるため分離する。
- 「最高連勝」「A/B/C勝率」「応援ポイント」「取得日時」には保存世代差がある。欠損は0達成や架空日時で補完せず、未記録/由来を表示する。
