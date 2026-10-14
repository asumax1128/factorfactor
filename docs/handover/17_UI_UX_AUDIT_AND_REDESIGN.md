# UI・UX監査と改善案（未実装）

基準5584885。React→CSS→遷移→結果生成→既存テスト/参照画像の順で静的確認した。新規のブラウザ撮影・実機テストは行っていない。**以下は修正の承認ではない。** A共通化候補、B固有性、Cコード上の不整合、D追加確認を分ける。

## 正式な見た目の基準

[08](08_UI_AND_ASSETS.md)と既存UI基準書/比較画像を一次参照する。V7の明るいpaper背景、白card、orange accent、既存の太い日本語、統一corner/影/spacingを通常UIの基準とする。数式の描画/KaTeX fontは別系統で維持する。暗い対戦面・塔RPG・ボス色自体は不具合ではない。

## 優先する5件

1. UI01：新Bと旧Bの説明の分離。
2. UI02：Fairを含む実判定とヘルプ見本の整合。
3. UI03：新Bの結果における確定スコア比較。
4. UI04：dailyの進行枠/正解数・得点・保存状態の意味の明示。
5. UI05：EXP/報酬/保存/戻る操作の共通外枠。

## UI01

|項目|内容|
|---|---|
|問題ID|UI01|
|対象画面|新B説明・操作ラベル|
|現状|B2戦闘と旧Bの説明・ヘルプが併存する|
|不統一の内容|クリア先着/旧必殺技の説明を時間制Bと誤認する可能性|
|ユーザーへの影響|初見で勝利条件やFREEZEを理解しにくい|
|原因となるコード|[index.html:7367・`const BATTLE_MODES`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L7367) / [src/online-rated-ui.jsx:50・`function BattleView`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/src/online-rated-ui.jsx#L50)|
|改善案|B1/B2の説明データを分け、入口のrulesに応じた文言を表示する|
|優先度|高|
|影響範囲|方式説明・ヘルプ・戦闘ラベル|
|既存仕様への影響|ルール数値や既存B1復帰を変えない|
|Claudeへの推奨対応|表示文言の承認後、B1/B2各1件の表示テストを追加|
|確認根拠|C：コードで新旧説明併存を確認。どの導線で誤表示になるか実画面未確認|

## UI02

|項目|内容|
|---|---|
|問題ID|UI02|
|対象画面|タイム判定とあそびかた|
|現状|実判定はFairを含む成功6段階＋Bad、見本はFairなし6表示|
|不統一の内容|Fairの色/名称とネオン見本に差がある|
|ユーザーへの影響|どの回復判定だったか説明と一致しない|
|原因となるコード|[index.html:1361・`const JUDGE_TIERS`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L1361) / [index.html:3125・`function timingVisual`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L3125)|
|改善案|判定データを単一化する案を提示。Fairを消す/閾値変更は別の仕様承認が必要|
|優先度|高|
|影響範囲|ソロ/CPU/オンライン/説明|
|既存仕様への影響|正誤・HP回復・閾値は現状維持|
|Claudeへの推奨対応|まず実データの名称・色対応を提示して所有者に選択してもらう|
|確認根拠|C：定数/表示mappingを確認。実画面未確認|

## UI03

|項目|内容|
|---|---|
|問題ID|UI03|
|対象画面|新B結果の得点比較|
|現状|ルームのBattleResultはB得点を表示、Spark ResultはA詳細中心|
|不統一の内容|同じ得点勝負のB2でも結果情報量が違う|
|ユーザーへの影響|なぜ勝ったか追いにくい|
|原因となるコード|[src/online-rated-ui.jsx:278・`function Result`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/src/online-rated-ui.jsx#L278) / [index.html:10393・`function BattleResult`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L10393)|
|改善案|確定済み双方score/HP/最大comboのsummaryを共通表示。Aの詳細は追加sectionとして残す|
|優先度|高|
|影響範囲|rated/ghost/ルームB2の結果|
|既存仕様への影響|計算・確定履歴・通信量を変えず既存取得値を使う|
|Claudeへの推奨対応|共通ResultSummaryの設計案を先に提示|
|確認根拠|A：表示構造の差を静的確認。見た目は未確認|

## UI04

|項目|内容|
|---|---|
|問題ID|UI04|
|対象画面|デイリーの結果・保存状態・カウンタ|
|現状|結果doneと保存は非同期。保存scoreは0下限、プレイSOLVEDには完了枠を使用|
|不統一の内容|表示得点/正式得点と、回答枠数/正解数の意味に差がある可能性|
|ユーザーへの影響|順位・正解数と結果を誤解する|
|原因となるコード|[src/daily-ui.jsx:14・`game.done`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/src/daily-ui.jsx#L14) / [src/daily-client.cjs:38・`const result=`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/src/daily-client.cjs#L38)|
|改善案|枠進行/正解数のラベルを区別し、保存中/確定/失敗を明示。負得点の実到達性は別検証|
|優先度|高|
|影響範囲|dailyのplay/done/rank/通常ソロ送信|
|既存仕様への影響|ランキング優先順位やスコア下限を無断変更しない|
|Claudeへの推奨対応|誤答混在と0未満fixtureを確認し、表示か仕様どちらを揃えるか承認を得る|
|確認根拠|C/D：コード経路確認。負得点が実際に出たログは未確認|

## UI05

|項目|内容|
|---|---|
|問題ID|UI05|
|対象画面|結果の報酬・保存・戻る操作|
|現状|ExpGain/テキスト/別通知、送信欄/親error/別claimが混在|
|不統一の内容|同じEXPや保存成功の情報形式・戻る位置が異なる|
|ユーザーへの影響|結果確定と受取完了を混同し、戻り先を探す|
|原因となるコード|[index.html:3354・`function ExpGain`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L3354) / [src/online-rated-ui.jsx:278・`function Result`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/src/online-rated-ui.jsx#L278) / [index.html:5661・`function WeeklyRaidApp`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L5661)|
|改善案|結果の共通外枠、数値行、確定状態、主/副ボタン順序を定義する|
|優先度|中|
|影響範囲|ソロ/対戦/daily/raid|
|既存仕様への影響|塔演出/ボス報酬/自己無報酬は固有として維持|
|Claudeへの推奨対応|表示schemaと読み順から段階的に統一する|
|確認根拠|A：部品と配置の差を確認。速度/操作障害は未確認|

## UI06

|項目|内容|
|---|---|
|問題ID|UI06|
|対象画面|引分けの見た目|
|現状|勝利でない場合は敗北系classへ進む分岐がある|
|不統一の内容|drawの文言と色・演出の感情が一致しない可能性|
|ユーザーへの影響|引分けを敗北と受け取る|
|原因となるコード|[src/online-rated-ui.jsx:278・`function Result`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/src/online-rated-ui.jsx#L278)|
|改善案|draw専用の中立tokenと音を検討する|
|優先度|中|
|影響範囲|Spark Result|
|既存仕様への影響|引分けのレート・報酬は変更しない|
|Claudeへの推奨対応|実画面/効果音で確認してからclassのみ設計|
|確認根拠|C/D：条件分岐を確認、実画面・音は未確認|

## UI07

|項目|内容|
|---|---|
|問題ID|UI07|
|対象画面|画面拡大・キーボード・タッチ|
|現状|viewportで拡大制限。入力はdrag中心、複数レイアウトがある|
|不統一の内容|ズーム/短い画面/キーボード代替の保証が揃っていない|
|ユーザーへの影響|補助機能利用者や小型端末に支障の可能性|
|原因となるコード|[index.html:5・`user-scalable=no`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L5) / [index.html:7904・`function BattleBoard`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L7904) / [src/online-rated-ui.jsx:50・`function BattleView`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/src/online-rated-ui.jsx#L50)|
|改善案|ズーム100/125/150/200と短い高さを代表画面で確認し、意味あるfocusと操作代替を別提案|
|優先度|中|
|影響範囲|共通画面/カード操作/結果スクロール|
|既存仕様への影響|独立2タップ回答へ戻さない。数式font変更なし|
|Claudeへの推奨対応|ChromeOS/Safari実機情報を集め、再現した表示だけ修正候補へ|
|確認根拠|D：CSS根拠。実機で障害確認済みとはしない|

## UI08

|項目|内容|
|---|---|
|問題ID|UI08|
|対象画面|ダイアログ・エラー・長い一覧|
|現状|V7Modal/手書きoverlay/各親error、旧青button/新menuが共存|
|不統一の内容|背景スクロール・フォーカス・retry表現を画面別管理|
|ユーザーへの影響|長名/連打/復帰時の動作差の可能性|
|原因となるコード|[index.html:560・`function V7Modal`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L560) / [index.html:9546・`function PlayerProfile`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L9546) / [src/online-rated-ui.jsx:278・`function Result`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/src/online-rated-ui.jsx#L278)|
|改善案|既存モーダル管理を優先し、閉じてから次を開く規約/フォーカス復帰/エラーseverityを定義|
|優先度|中|
|影響範囲|profile/bounty/teacher/結果/通信エラー|
|既存仕様への影響|5.18の賞金首置換を後退させない。権限/隠し条件を保護|
|Claudeへの推奨対応|まず共通ダイアログの使用一覧と状態遷移を確認|
|確認根拠|A/D：構造差は確認。重複表示バグの再発は未確認|

## UI09

|項目|内容|
|---|---|
|問題ID|UI09|
|対象画面|数学表の例・実装コメント|
|現状|Lv9の表示例と積、genL6〜9得点コメントに差がある|
|不統一の内容|説明を見た教師/後任が別ルールと解釈する|
|ユーザーへの影響|教材の信頼性と保守判断に影響|
|原因となるコード|[index.html:864・`const LEVEL_INFO`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L864) / [index.html:862・`const LEVEL_POINTS`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L862)|
|改善案|数学例と現行定数を照合し、説明修正だけを別依頼で行う|
|優先度|中|
|影響範囲|レベル表/コードコメント/教師資料|
|既存仕様への影響|問題生成・得点計算を修正しない|
|Claudeへの推奨対応|18x²+21x−5例の実際の積27xを提示して承認待ち|
|確認根拠|C：静的に積を確認。今回コードは変更しない|

## 横断監査のまとめ

|観点|確認できる構造|評価・次の確認|
|---|---|---|
|配色/グラデーション/枠/影|V7 token、or-*、battle背景、mt-*が共存|共通menu/result tokenを検討。塔/ボスの色はBとして維持|
|日本語font/サイズ/見出し|既存太字とor-*のoverride、font import、inline指定|フォント名は08参照。文字切れ/実際のweight読込は実画面未確認|
|ボタン/カード/パネル/余白|BigBtn/Card/V7Modalと専用部品|通常UIの主/副ボタン規約を先に定義。因数カードを通常buttonへ無断置換しない|
|アイコン/アセット|emoji/CSS/動的画像が混在|動的参照を未使用扱いしない。画像不足の断定は既存auditの範囲のみ|
|ナビ/モーダル|親stateからの分岐、overlayが複数系統|UI08。退室と検索cancelの意味/敗北条件は表示の統一で変えない|
|loading/error/報酬|各非同期処理に個別表示|状態語彙を整理。レート・報酬の確定前表示を確定と誤認させない|
|ドラッグ/タッチ|共有BattleBoard＋新View、非描画で入力防止|単独tap解除、drag中sync維持、FREEZE/GO境界を回帰検証|
|幅/高さ/scroll/重なり|responsiveと専用overflow、長いA履歴/表|実機未確認。320〜1366幅、短い高さ、長名、200%zoomを代表画面で確認|
|accessibility|aria/標準buttonとドラッグ中心の混在|focus順序、読上げ、keyboard、motion低減の全画面保証なし|

## 統一する層と残す層

共通化は「結果の確定状態・情報の読み順・主/副操作・数値単位・通知形式」から進める。勝敗/得点/報酬を表示都合で再計算しない。Aのグラフ、Bの妨害/カウンター、自己ゴーストの練習説明、dailyの順位、塔のRPG/会話/ランク演出、レイド貢献とボス世界観は維持する。

実装する際は、所有者へ対象画面・before/after・共通部品の影響範囲を提示する。入力/同期を触らずに表示だけ直せるものを優先する。今回の文書作成では、提案した変更を一切実装していない。

[総合案内へ](00_START_HERE.md)
