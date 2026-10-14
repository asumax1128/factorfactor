# 全画面台帳

基準は5584885。**今回の実画面は未確認**。画面・モーダル・タブ・状態・専用オーバーレイを「論理画面」として棚卸しした。同一コンポーネント内の類似状態は1行に束ね、独立した画面がないものを創作しない。IDは文書専用。各行の確認方法は、掲載コンポーネントの条件分岐と既存テストを読む静的確認である。実際の到達可否は認証・grant・設定に依存する。

全86行。機能のルール・保存・例外は[01](01_GAME_OVERVIEW.md)、[02](02_GAME_RULES.md)、[04](04_DATA_AND_FIREBASE.md)へ分離し、ここでは表示と遷移を扱う。

## 共通・ソロ

実装の入口：[index.html:1457・`function FactorHunt`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L1457)。CSS：`v7-* / Tailwind / inline`。同じ節の各行に適用する。関数名で再検索できる。

|画面ID・名称|対象モード・状態|表示内容|操作ボタン／入力|遷移先|実装コンポーネント|共通／専用・注意事項|確認方法|
|---|---|---|---|---|---|---|---|
|S001 起動・読込／復旧案内|全体・現行・公開中|React/CDN/DBの初期化、失敗案内|再読込|認証/ホーム|`AppRoot / boot fallback`|共通。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S002 認証ゲート|全体・現行・公開中|登録・ログイン・ゲスト|名前/合言葉/登録/ログイン/ゲスト|ホーム|`AccountGate`|共通。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S003 ホーム／ソロ難易度|ソロ・全体・現行・公開中|本人、EXP、E/N/H、各モード入口|難易度/スタート/各カード|各モード|`FactorHunt menu / AccountPanelV7`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S004 レベル表|ソロ・現行・公開中|Lv1〜9の説明と例|とじる|ホーム|`FactorHunt level table`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S005 ソロ開始カウントダウン|ソロ・現行・公開中|3/2/1/GO、開始前遮蔽|待機|ソロプレイ|`FactorHunt countdown`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S006 ソロ通常／逆因数分解|ソロ・現行・公開中|式・カード・HP・得点・時間、逆問題4択|drag/退出/逆問題ボタン|次問/結果|`FactorHunt playing`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S007 ソロ結果|ソロ・現行・公開中|得点・時間・正解・EXP・送信状態|再挑戦/タイトル/名前/送信|ホーム/再開|`FactorHunt gameover`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S008 ソロランキング|ソロ・現行・公開中（GAS依存）|端末TOP3/ネット/総得点、E/N/H|部門/タブ/とじる|ホーム|`FactorHunt ranking`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S009 あそびかた20ページ|全体・現行・公開中|ソロ/オンライン/みんなで/育てる|タブ/前/次/タイトル|ホーム|`TutorialV7 / TutVisual`|共通。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S010 アカウント／成績／着せ替え|共通・現行・公開中|本人・レート・称号・tile/bg/fx|各タブ/装備/とじる|ホーム/ロビー|`AccountBar / Wardrobe / RatingDisplay`|共通。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S011 ログインボーナス|共通・現行・公開中|日次報酬・7日カレンダー|受取/とじる|呼出元|`LoginBonus`|共通。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S012 ゴースト通知|共通・現行・公開中|分身の対戦・既読・報酬|確認/受取/とじる|呼出元|`GhostNews`|共通。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S013 報酬・称号通知／FX|共通・現行・公開中|EXP/レベル/バッジ/コンボなど|とじる/時間経過|呼出元|`ExpGain / BadgeReveal / FxLayer`|共通。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|

## 学習・デイリー

実装の入口：[index.html:4295・`function LearnApp`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L4295)。CSS：`v7-* / or-* / inline`。同じ節の各行に適用する。関数名で再検索できる。

|画面ID・名称|対象モード・状態|表示内容|操作ボタン／入力|遷移先|実装コンポーネント|共通／専用・注意事項|確認方法|
|---|---|---|---|---|---|---|---|
|S014 学びの部屋・苦手分析|学習・現行・公開中|型別正答率/平均時間|weak/drill/dex|ドリル/図鑑/ホーム|`LearnApp weak`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S015 ドリル選択|学習・現行・公開中|レベル/型/苦手から選ぶ|開始/戻る|PracticeRunner|`LearnApp drill`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S016 型図鑑|学習・現行・公開中|型の一覧と習熟|型選択/戻る|学び|`LearnApp dex`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S017 練習ランナー|ドリル・旧デイリー・現行・公開中|式・カード・時間・誤答加算|drag/中断|結果|`PracticeRunner`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S018 ドリル結果／ふり返り|学習・現行・公開中|時間・正誤・EXP・問題別解説|再挑戦/問題展開/戻る|学び|`LearnApp drillRes / RunReview`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S019 日次ミッション|全体・現行・公開中|3通常枠＋弱点枠、条件・受取|対象へ/受取/戻る|各モード|`MissionList / DailyMissionsView`|共通。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S020 旧デイリー入口・結果|旧daily・旧仕様・fallback|10問タイム・旧順位|開始/戻る|PracticeRunner/旧入口|`LegacyDailyApp`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S021 新デイリー読込／認証案内|daily・現行・公開中（ready依存）|ready確認・登録要求|戻る/ログイン|daily/ホーム|`NewDailyApp`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S022 新デイリー難易度・回数|daily・現行・公開中|E/N/H、今日残り合計3回|難易度/挑戦|dailyプレイ|`NewDailyApp`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S023 今日／昨日の3部門順位|daily・現行・公開中|得点・完走タイム/未クリア・優勝者|日付/難易度|daily|`NewDailyApp rankings`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S024 新デイリープレイ／逆問題|daily・現行・公開中|ソロ型得点・HP、出題枠|drag/4択/退出|次枠/結果|`NewDailyApp → BattleView`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S025 新デイリー結果／保存失敗|daily・現行・公開中|完走/未完走・得点・正解・保存エラー|戻る/再送|daily|`NewDailyApp done`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|

## オンライン共通・旧ルーム

実装の入口：[index.html:8469・`function BattleApp`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L8469)。CSS：`v7-* / battle-* / inline`。同じ節の各行に適用する。関数名で再検索できる。

|画面ID・名称|対象モード・状態|表示内容|操作ボタン／入力|遷移先|実装コンポーネント|共通／専用・注意事項|確認方法|
|---|---|---|---|---|---|---|---|
|S026 オンライン総合メニュー|対戦・現行・公開中|CPU/すぐ対戦/ルーム/ゴースト/成績|各入口/戻る|設定/検索/ロビー|`BattleMenu`|共通。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S027 CPU設定|CPU・現行・公開中|方式・難易度・相手強さ|選択/開始|BattleGame|`BattleMenu`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S028 ルーム作成／参加／観戦|ルーム・現行・公開中|コード・方式・難易度・B時間|作成/参加/観戦|BattleLobby|`BattleMenu`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S029 ルーム待合・方式設定|ルーム・現行・公開中|参加者・チーム・ハンデ・準備|開始/退出/各設定|BattleGame/RoomB2App|`BattleLobby`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S030 旧検索・投票|旧quick・互換性維持、18〜24秒補完|旧待機・方式票|キャンセル/投票|BattleGame|`QmWait / QmVote`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S031 VS紹介／開始幕|ルーム・CPU・現行・公開中|対戦者と開始演出|待機|戦闘|`VsCutIn / BattleGame`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S032 A戦闘|ルーム・CPU・大会・現行・公開中|共通問題・得点・獲得状況|drag/退出|次問/結果|`GameA / BattleSurface`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S033 旧B／C戦闘|CPU・既存ルーム等・互換性維持／Cは現行|HP・問題・必殺技/チーム|drag/big/heal/shield/退出|次問/結果|`GameB / createBEngine`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S034 新Bルーム戦闘／FREEZE|ルームB2・現行・公開中|時間・HP・偽カード・ゲージ・遮蔽|drag/退出|次問/結果|`RoomB2App → BattleView`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S035 ルーム／CPU結果・問題レビュー|対戦・現行・公開中|勝敗・得点・HP・EXP・称号・履歴|再戦/ロビー/退出/振り返り|ロビー/メニュー|`BattleResult`|共通。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S036 A詳細グラフ・履歴|A・現行・公開中、共通|確定得点の線・累積・逆転|履歴閲覧|結果内|`AResultDetails`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S037 みんなの成績|共通・現行・公開中|アカウント成績一覧|名前/とじる|PlayerProfile|`VsTable`|共通。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S038 賞金首リスト|共通・現行・公開中、選択時リストを閉じる|対象と懸賞|選択/とじる|PlayerProfile|`BattleMenu bounty overlay`|共通。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S039 プレイヤー成績／指名挑戦|共通・現行・公開中|現在/最高・称号・ゴースト|難易度/挑戦/とじる|指名対戦/呼出元|`PlayerProfile`|共通。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S040 ゴースト履歴2タブ|共通・現行・公開中、成績最下部|自分の挑戦/分身|タブ/とじる|成績|`GhostHistory`|共通。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S041 対戦一覧／観戦／応援|ルーム・現行・公開中|盤面ミラー・観戦対象・応援|対象/応援/退出|観戦/メニュー|`SpectatorView / CheerBar`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S042 2画面ミラー|観戦・現行・公開中|2人または試合の同時表示|対象切替/戻る|観戦|`SplitView / PlayerMirror`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S043 大会待合|大会・現行・公開中（開催権限依存）|参加者・方式・開始|参加/開始/退出|大会表|`TourLobby`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S044 大会表／個別試合／最終順位|大会・現行・公開中|single/Swiss、対戦・最終順位|試合/観戦/進行/退出|試合/大会表|`TourBoard / TourMatchCard`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S045 大会分割観戦|大会・現行・公開中|複数対戦|試合切替/戻る|大会表|`TourSplit`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S046 通信チェック|共通・現行・公開中|接続状態・診断|検査/戻る|メニュー|`ConnCheck`|共通。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|

## Sparkオンライン

実装の入口：[src/online-rated-ui.jsx:278・`function Result`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/src/online-rated-ui.jsx#L278)。CSS：`or-* / online-rated.css`。同じ節の各行に適用する。関数名で再検索できる。

|画面ID・名称|対象モード・状態|表示内容|操作ボタン／入力|遷移先|実装コンポーネント|共通／専用・注意事項|確認方法|
|---|---|---|---|---|---|---|---|
|S047 難易度選択|rated・現行・公開中|イージー/ノーマル、現在レート|選択/戻る|wait|`OnlineRatedApp select`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S048 ゴーストメニュー|ghost・現行・公開中|イージー/ノーマル/ハイパー|選択/戻る|検索/難易度|`OnlineRatedApp ghostMenu`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S049 ハイパー難易度／指名確認|ghost・現行・公開中|TOP10対象の難易度・指名相手|開始/戻る|投票/対戦|`OnlineRatedApp select initialGhost`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S050 検索中|rated・現行・公開中|虫眼鏡・経過秒・5秒補完|キャンセル|select/vote|`OnlineRatedApp wait`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S051 方式投票／乱入案内|rated/ghost・現行・公開中|A/B選択・相手種別|A/B/退出|play|`OnlineRatedApp vote`|共通。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S052 同期カウントダウン／GO|rated/ghost・現行・公開中、問題とカード非描画|開始時刻・不透明遮蔽|待機|戦闘|`BattleView countdown`|共通。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S053 A／旧B／新Bプレイ|rated/ghost・現行・公開中／B1復帰互換|得点・HP・コンボ・時刻・カード|drag/退出/旧B必殺技|次問/結果|`BattleView`|共通。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S054 FREEZE|新B・現行・公開中、問題非描画|氷・3/2/1・操作不可|待機|元の対戦|`BattleView freeze`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S055 結果／報酬確定待ち|rated/ghost・現行・公開中|勝敗・レート・origin説明・EXP・A詳細|退出|オンラインメニュー|`Result`|共通。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S056 レーティング／部門順位|rated・現行・公開中|E/N現在・歴代・TOP順位|部門/相手/戻る|プロフィール|`OnlineRatedApp ratings`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S057 ランク称号選択|rated・現行・公開中|所持称号・現在装備|装備/戻る|ratings|`OnlineRatedApp title selection`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S058 通信エラー／再同期・再試行|rated/ghost・現行・公開中、通常進行では出さない|理由・最新結果確認|再試行/退出|復帰/結果|`OnlineRatedApp error block`|共通。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|

## レイド・週ボス

実装の入口：[index.html:5661・`function WeeklyRaidApp`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L5661)。CSS：`v7-* / inline`。同じ節の各行に適用する。関数名で再検索できる。

|画面ID・名称|対象モード・状態|表示内容|操作ボタン／入力|遷移先|実装コンポーネント|共通／専用・注意事項|確認方法|
|---|---|---|---|---|---|---|---|
|S059 今週のボス入口／情報|weekly・現行・公開中|ボス・残HP・週ルール・初出撃|出撃/図鑑/戻る|RaidPlay|`WeeklyRaidApp menu / BossPanel`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S060 週ボス図鑑|weekly・現行・公開中|15体の属性・履歴|選択/戻る|weekly|`BossDex`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S061 週ボス個人出撃|weekly・現行・公開中|時間・式・ダメージ・弱点・反撃|drag/退出|weekly done|`RaidPlay`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S062 週ボス出撃結果／討伐・締め報酬|weekly・現行・公開中|個人ダメージ・EXP・応援・宝箱|受取/再出撃/戻る|weekly|`WeeklyRaidApp done`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S063 週ランキング／先週MVP|weekly・現行・公開中|累積・最高・週貢献|タブ/戻る|weekly|`WeeklyRaidApp`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S064 クラスレイド待合|teacher raid・現行・公開中（先生開催）|参加者・ボス・チーム|開始/退出|RaidClassPlay|`RaidLobby`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S065 フレンドレイド待合／役割|friend raid・現行・公開中|役割・参加・ボス|役割/開始/退出|RaidClassPlay|`FriendRaidLobby`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S066 先生ボス操作盤|teacher raid・現行・内部機能（権限必須）|HP・ギミック・進行|開始/特殊操作/終了|レイド|`TeacherBossPlay`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S067 レイド戦闘／観戦盤|raid・現行・公開中（部屋依存）|共有HP・役割・救援・部位|drag/役割操作/退出|RaidClassPlay結果footer|`RaidClassPlay / RaidBoard`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S068 レイド結果|raid・現行・公開中|撃破/時間切れ・貢献・MVP・EXP|ホスト再戦/退出|待合/メニュー|`RaidClassPlay結果footer`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|

## 先生・開催係

実装の入口：[index.html:9154・`function TeacherDash`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L9154)。CSS：`v7-* / inline`。同じ節の各行に適用する。関数名で再検索できる。

|画面ID・名称|対象モード・状態|表示内容|操作ボタン／入力|遷移先|実装コンポーネント|共通／専用・注意事項|確認方法|
|---|---|---|---|---|---|---|---|
|S069 先生認証／エリア|teacher・現行・内部機能|権限案内・先生入口|認証/戻る|TeacherDash|`TeacherArea`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S070 先生ダッシュボード|teacher・現行・内部機能、全タブは該当関数参照|live/class/成績/開催・各管理タブ|選択/開催/戻る|各管理/試合|`TeacherDash`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S071 全実績監査|teacher・現行・内部機能、隠し条件を一般公開しない|hidden含む92件・条件・整合性|閲覧/戻る|TeacherDash|`AchievementAuditPanel`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S072 限定開催係・管理|teacher/studentHost・現行・内部機能（grant依存）|有効権限・開催イベント|発行/管理/開催/戻る|イベント|`StudentHostArea / EventHostManager`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|

## 現行数学の塔

実装の入口：[src/math-tower-ui.jsx:761・`function App`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/src/math-tower-ui.jsx#L761)。CSS：`mt-* / math-tower.css`。同じ節の各行に適用する。関数名で再検索できる。

|画面ID・名称|対象モード・状態|表示内容|操作ボタン／入力|遷移先|実装コンポーネント|共通／専用・注意事項|確認方法|
|---|---|---|---|---|---|---|---|
|S073 塔読込／アクセス・エラー|tower・現行・内部機能（先生試遊）|grant・content・save読込、エラー|再試行/戻る|tower home|`MathTowerApp`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S074 塔ホーム|tower・現行・内部機能|第1章試遊・冒険・図鑑|開始/続き/やり直し/図鑑/退出|選択/図鑑|`screen home`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S075 移行バックアップ／復元確認|tower・現行・内部機能|旧保存バックアップ・復旧候補|保全/復元/戻る|home/選択|`migrationBackup / restoreConfirm`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S076 新規／継続／再走選択・置換確認|tower・現行・内部機能|冒険難易度・既存save|選択/確認/戻る|floorSelect|`newSelect / continueSelect / replaySelect / replaceConfirm`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S077 階選択|tower・現行・内部機能、1〜5階|到達階・再戦|階/戻る|prepare|`floorSelect`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S078 戦闘準備／カットイン|tower・現行・内部機能|敵・背景・開始|開始/戻る|battle|`prepare / cutin`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S079 会話・ストーリー|tower・現行・内部機能|立ち絵左右・本文・イベント|次へ/スキップ|戦闘/階後|`Story / story`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S080 塔戦闘／中断・復旧|tower・現行・内部機能、通常対戦とは別|味方HP・敵・式・カード・状態|drag/中断/再開|savingResult|`battle / paused`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S081 結果保存待ち／再試行|tower・現行・内部機能|永続保存の成否|再試行|result|`savingResult`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S082 塔勝利／敗北／再開始|tower・現行・内部機能|SABC・成績・敵残HP|次へ/再開/演出省略|afterFloor/restart|`Victory / result / restart`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S083 階後／章終了|tower・現行・内部機能|進行・物語・次階|進む/ホーム|story/prepare/home|`afterFloor / chapterEnd`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S084 塔の手帳／図鑑／画像拡大|tower・現行・内部機能|notes/journal/monsters・フィルター|タブ/画像/戻る|book/home|`Book / book`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|

## 旧塔・旧教材

実装の入口：[index.html:6631・`function TowerApp`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L6631)。CSS：`旧inline / v7-*`。同じ節の各行に適用する。関数名で再検索できる。

|画面ID・名称|対象モード・状態|表示内容|操作ボタン／入力|遷移先|実装コンポーネント|共通／専用・注意事項|確認方法|
|---|---|---|---|---|---|---|---|
|S085 旧塔ホーム／戦闘／結果|旧tower・未使用（現行AppRootの塔入口なし）|旧フロア・敵・物語・旧保存|旧開始/戦闘/結果|旧TowerApp内|`TowerApp`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|
|S086 旧塔物語／数理図鑑|旧tower・旧仕様、現行Bookと区別|旧会話・SURI資料|ページ/戻る|旧塔|`StoryView / SuriBook`|専用（共通部品を含む）。状態別の戻る先を確認|コード静的確認、実画面未確認。対応テストは[13](13_REQUIREMENTS_TRACEABILITY.md)/[09](09_TEST_AND_DEPLOY.md)|

## 遷移と網羅性の見方

- ホーム→ソロ／学び／デイリー／週ボス／オンライン／塔。設定は独立した万能設定画面ではなく、音・着せ替え・アカウント・部屋設定へ分散する。
- 新rated：総合→難易度→検索→投票→開始遮蔽→対戦→結果→総合。自己/指名/ハイパーは選出入口を変え、同じ対戦・結果へ入る。
- 旧ルーム：待合→紹介→A/B1/Cまたは新B2→共通結果。大会は大会表を親とし、終了後に大会表へ戻る。
- メッセージ・EXP/称号通知・FREEZEは専用ページではなく、親画面上の状態。エラーも各保存/通信画面の条件分岐であり、全体共通の1枚ではない。
- 先生ダッシュボードの列や図鑑の各敵を別画面に水増ししていない。各タブの細部は入口関数のrender分岐で追う。公開利用の実画面確認は別途必要。
- 旧TowerApp/旧Daily/QmWaitは現行MathTowerApp/新Daily/Spark検索と混同しない。配信コードに残ることと通常導線があることは異なる。

[総合案内へ](00_START_HERE.md)
