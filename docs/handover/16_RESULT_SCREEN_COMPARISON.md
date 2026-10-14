# リザルト画面の横断比較

## 確認範囲と画面の関係

コード静的監査（5584885）。今回のブラウザ・スマホ実画面、音の実聴、実データ保存成否は未確認。✓はコードに該当表示がある、—は当該結果枠に直接表示なし、条件は条件付き表示。「—」は即不具合ではなく、別画面やモード仕様による正当な省略も含む。

|結果ID・対象|実際の表示実装|注意|
|---|---|---|
|R01 通常ソロ|[index.html:1927・`screen === 'gameover'`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L1927)|FactorHuntのgameover、CLEAR/GAMEOVER。同じ式でもdailyとは終了単位が異なる|
|R02 CPU|[index.html:10393・`function BattleResult`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L10393)|旧ルーム共通結果。CPU練習扱い|
|R03 オンラインA|[src/online-rated-ui.jsx:278・`function Result`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/src/online-rated-ui.jsx#L278) / [index.html:9513・`function AResultDetails`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L9513)|Spark Result＋確定イベントの詳細。旧ルームAはBattleResultにも詳細を付ける|
|R04 新B|同上Result、ルームはBattleResult|同じ新Bでも入口で結果枠が異なる。通常対戦は最終スコア比較が重要|
|R05 旧B／C|BattleResult|互換Bと協力C。新Bへ勝手に置換しない|
|R06 通常／ハイパー／指名ゴースト|Spark Result|相手種別・origin・自己対戦の扱いで文言/報酬が変わる。独立した別リザルトではない|
|R07 自己ゴースト|Spark Result|練習を明示、報酬/レートなしが正しい|
|R08 新デイリー|[src/daily-ui.jsx:14・`game.done`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/src/daily-ui.jsx#L14)|同じ画面下のランキングと挑戦権へ戻る。完走/未完走|
|R09 旧デイリー／ドリル|[index.html:4176・`function LegacyDailyApp`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L4176) / [index.html:4304・`drillRes`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L4304)|PracticeRunnerとRunReview、旧dailyは時間中心。新dailyと区別|
|R10 今週のボス|[index.html:5661・`function WeeklyRaidApp`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L5661)|出撃結果はmenuのdone分岐。1出撃と週全体の討伐/締め報酬を区別|
|R11 クラス／フレンドレイド|[index.html:5175・`function RaidClassPlay`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L5175)|BattleSurfaceのfooterで撃破/時間切れと役割貢献|
|R12 現行数学の塔|[src/math-tower-ui.jsx:417・`function Victory`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/src/math-tower-ui.jsx#L417) / result・restart|保存後に勝利表示。敗北は別分岐、階後/章末へ進む|
|R13 旧数学の塔|[index.html:6631・`function TowerApp`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L6631)|現行AppRootの公開入口なし。旧階/旧報酬の表示は現行試遊仕様ではない|
|R14 大会・観戦|[index.html:10802・`function TourBoard`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L10802) / SpectatorView|個別試合はBattleResult。大会表の勝者/順位表示を独立報酬結果として創作しない|

## 比較表1：勝敗と戦闘数値（項目1〜8）

|モード|1勝敗|2スコア|3正解数|4正答率|5プレイ時間|6残り時間|7HP|8コンボ|
|---|---|---|---|---|---|---|---|---|
|ソロ|CLEAR/GAMEOVER|✓＋クリア加点|✓|—|✓|—|—|主結果には—|
|CPU|順位/勝敗/理由|A得点/B行|B行|レビューで正誤|—|—|B行|A最大/B行|
|オンラインA|勝敗|A詳細で双方最終|獲得履歴|—|各問時間は記録依存|—|対象外|A詳細最大|
|新B Spark|勝敗/理由|主結果に直接なし|—|—|—|—|—|—|
|新Bルーム|勝敗/順位|✓|✓|レビュー|—|—|✓|✓|
|旧B/C|勝敗/チーム結果|モード別行|✓|レビュー|—|—|✓/共有HP|✓|
|通常/ハイパー/指名|勝敗|A詳細のみ|A履歴のみ|—|A履歴依存|—|B主結果—|A詳細のみ|
|自己ゴースト|練習勝敗|同じResult|同左|—|同左|—|同左|同左|
|新デイリー|完走/未完走|✓|✓|—|完走time|—|—|—|
|旧daily/ドリル|完走/時間|時間中心|レビュー|レビュー|✓＋ペナルティ|—|対象外|対象外|
|週ボス|1出撃結果/討伐状況|ダメージ|主結果—|—|主結果—|—|ボスHP別panel|主結果—|
|クラス/フレンドレイド|撃破/時間切れ|本人/全体ダメージ|主結果—|—|主結果—|—|共有ボスHP|最大✓|
|現行塔|VICTORY/失敗＋SABC|通常得点対象外|主結果—|✓|記録にあり・主結果6枠外|—|本人/敵✓|最大✓|
|旧塔|旧TowerApp参照|旧処理|旧処理|旧処理|旧処理|旧処理|旧処理|旧処理|
|大会/観戦|表の勝者/最終順位|個別結果を再利用|同左|同左|同左|同左|同左|同左|

## 比較表2：成長・保存先の表示（項目9〜16）

「ランキング反映」は表示と実処理を分ける。結果に出ないから未保存と断定しない。EXPの付与条件は[06](06_REWARDS_AND_PROGRESSION.md)。

|モード|9EXP|10レベルup|11レート増減|12順位反映表示|13称号|14実績|15きせかえ解放|16特殊報酬|
|---|---|---|---|---|---|---|---|---|
|ソロ|ExpGain条件|同部品|なし|GAS送信状態|別stats条件|共有条件・別一覧|結果専用—|クリア加点|
|CPU|rec.exp条件|ExpGain|無レート案内|公式順位なし|BadgeReveal条件|共有BADGES|結果専用—|練習EXP|
|A Spark|相手/反映条件|汎用ExpGainでない|✓|プロフィール/順位画面|新規称号表示|旧BADGESと別|結果専用—|種別の説明|
|新B Spark|同上|同上|✓|同上|同上|同上|同上|同上|
|新Bルーム|rec.exp条件|ExpGain|記録種別依存|結果から別参照|BadgeReveal|共有BADGES|専用—|部屋種別依存|
|旧B/C|rec.exp条件|ExpGain|対人旧処理のみ|別画面|BadgeReveal|共有BADGES|専用—|懸賞/役割等の条件|
|通常/ハイパー/指名|勝ち8/入口条件|主結果専用—|quick1/3、指名なし|別画面|非自己・種別条件|別一覧|専用—|懸賞条件付き|
|自己ゴースト|なしが正しい|なし|なし|なし|更新なし|更新なし|更新なし|なし|
|新デイリー|この結果枠に—|—|なし|下部3部門/通常ソロへ送信|翌日lazy award|別一覧|専用—|完走EXPは別処理|
|旧daily/ドリル|画面/条件依存|ExpGain条件|なし|旧daily時間順位|条件別|条件別|専用—|学習反映|
|週ボス|ExpGain|同部品|なし|週累積/最高/先週|週のstats条件|同BADGES|専用—|応援/宝箱/締め・討伐|
|レイド|ExpGain条件|同部品|なし|部屋内貢献順位|条件別|条件別|専用—|MVP/last attack|
|現行塔|公式EXP対象外|対象外|なし|公式ソロ順位対象外|旧塔BADGESと自動接続しない|塔5項目hidden|既存解放判定は別|試遊進行/物語|
|旧塔|旧処理|旧処理|なし|旧記録|旧条件|hidden維持|旧条件|現行試遊へ流用禁止|
|大会/観戦|個別結果に従う|同左|同左|大会順位|同左|同左|同左|観戦者へ勝者報酬なし|

## 比較表3：操作・演出・確定状態（項目17〜26）

|モード|17再戦|18ホーム|19ボタン|20文字/配色|21アニメ|22効果音|23スマホ|24スクロール|25確定待ち|26通信エラー|
|---|---|---|---|---|---|---|---|---|---|---|
|ソロ|もう一度|タイトル|末尾、送信欄別|V7＋暗い結果panel|score/EXP/FX|ResultBgm|responsive、実機未確認|ページ縦|送信中を表示|送信失敗/再送|
|CPU|再戦|メニュー/退出|権限別複数|BattleResult V7|CountUp/BadgeReveal|battle sound|同左|結果/レビュー|rec取得条件|個別catch、統一枠なし|
|A Spark|退出後に選択|オンライン戻り|末尾退出|or-result、勝利gold|勝利光/CombatFX|勝敗sound条件|同左|グラフ＋履歴で長い|busy/receipt|親error枠/再試行|
|新B Spark|同上|同上|同上|同上|同上|同上|同上|Aほど情報なし|同上|同上|
|新Bルーム|再戦条件|ロビー/退出|BattleResult|旧共通枠|同部品|battle sound|同左|縦/レビュー|rec条件|各入口のerror|
|旧B/C|同上|同上|同上|同上|同上|同上|同左|同上|同上|同上|
|ゴースト各種|退出→再選択|総合メニュー|Result末尾|勝敗/origin|Result再利用|同部品|同左|Aのみ長い|正式結果反映待ち|親error|
|自己ゴースト|同上|同上|同上|練習説明あり|同部品|同部品|同左|同上|無報酬と区別|親error|
|新daily|回数があれば|戻る|結果下/順位上|白card/or-*|勝利専用なし|shared sound経由|同左|順位含む縦|doneと保存は非同期|err/再送|
|旧daily/ドリル|条件で可|戻る|画面別|V7|EXP条件|個別処理|同左|レビュー縦|保存画面別|旧個別処理|
|週ボス|出撃|戻る|menuカード群|白card/boss色|boss/EXP等|raid sound|同左|複数panel縦|討伐claim別|claim/出撃個別|
|クラス/フレンドraid|hostのみ/先生待ち|退出|footer|boss色/V7|EXP等|raid sound|同左|貢献行縦|結果後exp条件|個別処理|
|現行塔|再開始/次階|塔home|次/演出省略|専用RPG mt-*|ランク粒子/演出省略|tower audio|専用responsive、未実機|専用panel|savingResult→結果|保存再試行|
|旧塔|旧導線|旧導線|旧UI|旧UI|旧UI|旧処理|未確認|未確認|旧処理|旧処理|
|大会/観戦|大会進行に従う|退出/大会表|観戦専用|Mirror/Tour|試合再利用|試合側条件|分割は実機要確認|表/分割|大会進行条件|親画面|

## 差異の評価

|分類|対象|根拠・意味|推奨|
|---|---|---|---|
|A 共通化が望ましい|同じ新BのSpark/ルームで最終得点の情報量が異なる|ResultにA詳細はあるがBの最終得点比較がない。BattleResultはB行に得点あり|結果データの共通schemaを先に設計し、表示を共通化。勝敗処理を触らない|
|A|EXP/レベル/保存状態/退出ボタン|ExpGain、テキスト、別途通知が混在|表示項目と単位・確定/保留を揃える。未付与を表示だけで補わない|
|B モード固有として維持|塔/週ボス/レイド|RPG評価・共有貢献・宝箱と対人レートは異なる目的|共通の外枠だけ検討、固有報酬/演出を残す|
|B|自己ゴーストの無報酬、新daily未クリア得点|意図した不正稼ぎ抑制/競技仕様|報酬表示を他戦へ合わせて追加しない|
|C 不整合が疑われる|新daily画面得点と保存clamp|done.scoreと永続scoreの下限処理が異なる（10参照）|負得点が到達可能な条件をfixtureで確認後、所有者へ方針確認|
|C/D|引分けに敗北用class|Resultの勝利以外のクラス分岐は敗北側。draw文言自体は正しい|中立表現を検討。実画面・音の確認前に欠陥と断定しない|
|D 追加確認|スマホ高さ/横幅/音/長い名前/保存失敗|CSSと条件分岐は読んだが今回は実画面なし|代表データと低速通信で再現確認してから修正する|

詳しい改善提案は[17](17_UI_UX_AUDIT_AND_REDESIGN.md)。結果画面を揃えるために、得点・報酬・勝敗の定義を変えてはならない。

[総合案内へ](00_START_HERE.md)
