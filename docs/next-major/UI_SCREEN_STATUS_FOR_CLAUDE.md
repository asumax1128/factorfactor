# 画面別状態・画像台帳

確認対象：`78d39c2`、2026-10-16。状態は大型アップデートのUI統一に対する評価。「完成済み」は記載範囲の実装・既存検証を指し、本番公開承認や全実機検証ではない。デザイン基準は[正式UI仕様](UI_DESIGN_SPEC_FOR_CLAUDE.md)、実装全体は[状況正本](PHASE2_STATUS.md)。

## 画面別の状態

|画面|状態|正式参照・主な実装|未完成／確認すべき操作|
|---|---|---|---|
|ホームPC／スマホ|完成済み|B改良版バランス型＋正式ロゴ。`src/next-home-ui.jsx`／`ui-next/home.css`|承認済み構成を維持。HP読込／失敗／討伐、5ナビ、セーフエリア。全ボス長名・実機未検証|
|ランキング総合|完成済み|同シェル、`Home`のrankings分岐|3入口→一覧→総合→home、サイド／下部ナビ。新種を追加しない|
|ソロ／日次／レートのランキング一覧|一部完成|`index.html/FactorHunt`、`src/daily-ui.jsx`、既存ratings画面|外枠と戻りは統一、一覧の内部は再利用。今日／昨日・難易度・E/N、既存集計維持|
|プロフィール・成績|完成済み|`src/next-profile-ui.jsx`／`profile-read.cjs`、phase2a画像|概要／記録／称号装備タブ、元画面復帰、未記録と0、現在と最高E/N、stats.B一度だけ|
|オンラインロビー|完成済み|`src/next-lobby-ui.jsx`、phase2b画像|A/B2/C作成・4桁参加・すぐ対戦・CPU・ghost・検索・賞金首・先生表示。遷移先の全UI完了ではない|
|ログイン／新規登録|未着手（全面統一）|`index.html`の既存認証画面|既存機能は存在。B基準の正式な認証UI化は未確認。認証・本人認可を維持|
|ソロメニュー|完成済み|`PHASE2D_MENUS.md`、`index.html/FactorHunt`＋共通シェル|3難易度・ランキング・成績、塔の先生限定維持|
|ソロ内部・終了|一部完成|既存FactorHunt、`ui-next/results.css`等|内部全体の統一は未完。ドラッグ・HP・採点・終了・ランキングを変えない|
|デイリーミッション／挑戦|一部完成|`src/daily-ui.jsx`、`.next-legacy-daily`|メニュー統一済み、内部は既存。今日のミッションと挑戦を区別、日付・3回制・受領の維持|
|A／B2／C対戦|一部完成|`index.html`、`src/room-b2-ui.jsx`等|READY／FREEZE／resolving／次問待機／結果時のDOM0を維持。各細部の新UI統一が残る|
|CPU B2・大会B2|一部完成|`src/local-b2-bots.cjs`／`tournament-b2.cjs`／`room-b2-ui.jsx`|機能接続済み。練習除外・回戦／終了receipt・復帰。旧大会途中移行なし|
|A詳細リザルト|一部完成|既存A詳細、`src/next-results-ui.jsx`、`PHASE2C_RESULTS.md`|既存問題履歴・得点推移を保持。欠損時の解答時間等を捏造しない|
|B2詳細リザルト|一部完成|`src/b-result.cjs`／`next-results-ui.jsx`|確定revisionの2本得点グラフは実装。詳細項目と全体UIの残統一|
|Cリザルト|一部完成|既存C結果＋`src/c-contribution-next.cjs`|writer未実装。正解・得点等の既存記録のみ、未証明貢献は未記録。共有HPの個人配分禁止|
|A／B2／C観戦|一部完成|`PHASE4_SPECTATOR_UI.md`、既存観戦＋共通UI|両HUD・盤面切替／拡大・Cチーム。未確定／次問非表示。実機と全経路は未検証|
|ゴースト・ハイパー・自己練習|一部完成|ロビー入口＋既存ghost画面|入口接続済み、全サブ画面統一未完。TOP10制約・自己練習無報酬を維持|
|週間ボスの従来画面|一部完成|`index.html/WeeklyRaidApp`|公開版互換経路を保持。新authorityとは別経路。正式B戦闘の完成扱い禁止|
|週間authority戦闘・復帰・結果|暫定UI|`src/authority-weekly-ui.jsx`／`ui-next/weekly.css`、phase7画像|**Emulator機能検証専用。正式採用ではない。** 既存戦闘操作・演出＋承認B基準の正式画面をChatGPT側で確認して制作|
|クラス／フレンドレイド|一部完成|既存レイド＋`PHASE4_FRIEND_RAID.md`|10公式戦証明／4難易度はEmulator。鬼無効、正式画面・未承認数値は保留|
|新100称号一覧・隠し演出|一部完成|`src/title-inventory-ui.jsx`／`title-presentation-next.cjs`|Emulator保護snapshot＋awards接続。58/100取得接続、42未完。52公開条件未承認。未取得隠し情報は表示しない|
|旧称号装備・詳細記録|一部完成|既存PlayerProfile、プロフィールの詳細導線|既得／旧ID／装備を保持。新称号装備の全面移行は未完|
|きせかえ|完成済み（接続範囲）|`index.html/Wardrobe`、`.next-wardrobe`、phase5画像|新プロフィールと旧2入口を統一。タイル／背景／FX・ロック・選択・Escape・focus復帰。取得条件を変更しない|
|あそびかた|一部完成|`src/next-help-ui.jsx`、`PHASE2F_TITLES_HELP.md`|現行A/B2/Cと判定説明を接続。新しい未承認ルール説明を足さない|
|教師ダッシュボード／クラス・大会管理|一部完成|既存TeacherArea等、新ロビーの先生枠|入口維持、内部の全面新UI化は残る。権限を見た目だけで判断しない|
|数学の塔|一部完成（独自UI維持）|既存MathTowerApp、旧引き継ぎ07資料|先生限定。RPG固有UIを一律ホームへ置換しない。旧TowerAppと区別|
|学び・分析・設定・報酬／エラー|一部完成|既存画面、Home設定dialog、個別報酬演出|ホーム設定は新UI。その他の詳細統一・全モーダル調査は未完。失敗時に架空データで埋めない|

全既存画面をさらに辿る場合は[旧全画面台帳](../handover/15_UI_SCREEN_INVENTORY.md)を参照。上表は次期UIの完成状態で、旧画面の存在や機能を削除する指示ではない。

## 既存画像を再利用するための分類

画像にはモックデータ・撮影時だけ伸ばしたページ高さ・旧仮ロゴが含まれる。**画像内の数値・古い文言・撮影時の固定ナビ位置は仕様ではない。** 現在の正式PNGとCSSが優先。過去READMEの未承認表記は撮影当時の状態で、所有者の後続承認と本書の範囲を合わせて読む。

|画面／画像|区分|読み方|
|---|---|---|
|[承認ホームPC構成](../next-update/design-b-balanced/home-pc.png)|正式採用|B改良版PCサイドバー・ボス構成。ロゴは当時の仮配置|
|[承認スマホ・バランス型](../next-update/design-b-balanced/balanced-mobile.png)|正式採用|約17.7％縮小の採用案。後続HP追加・正式PNGは現コード優先|
|[ホームPC・正式PNG接続](logo-final/home-pc.png)／[スマホ](logo-final/home-mobile.png)|正式採用|承認済み基準を実アプリに接続した確認。データは架空。個別のゲーム数値は正式値ではない|
|[正式PNG](../../ui-next/logo-official.png)|正式採用|無加工原本。下段反転は意図的仕様|
|[実ホーム375](../next-update/home-connected/home-375.png)／[1440](../next-update/home-connected/home-1440.png)|実装途中|HP接続当時の記録。正式PNG導入より前の素材を含み得る|
|ランキング|実装途中|独立した保存済みランキングPNGは今回の画像一覧で未確認。[限定操作検証](PHASE1_5_HANDOFF.md)と`tests/ranking-hub-browser.cjs`を参照。ホーム順位入口だけで一覧完成と判断しない|
|[プロフィールPC](phase2a/profile-1440.png)／[390](phase2a/profile-390.png)|実装途中|実データ経路をモックで検証した機能確認。個別の最終見た目承認とは別|
|[オンラインPC](phase2b/lobby-1440.png)／[390](phase2b/lobby-390.png)|実装途中|採用基準に沿う実装確認。全サブ画面の承認ではない|
|[Bロビー参考PC](../next-update/design-b-refined/online-pc.png)／[スマホ](../next-update/design-b-refined/online-mobile.png)|参考のみ|採用された方向性の元レビュー。現機能・正式PNGは現コードで確認|
|[B2結果](phase2-review/b-result-1440.png)／[称号](phase2-review/titles-390.png)|実装途中|確定履歴や称号UIの確認。取得authority全完成を意味しない|
|[A観戦](phase4-review/spectator-A-1440.png)／[C観戦](phase4-review/spectator-C-390.png)|実装途中|両者HUDと盤面の既存確認。確定C貢献は未接続|
|[きせかえPC](phase5-review/wardrobe-1440.png)／[390](phase5-review/wardrobe-390.png)|実装途中|現スキン色を保つ接続確認。個別の新規アート承認ではない|
|[週間暫定375](phase7-review/weekly-375.png)／[1440](phase7-review/weekly-1440.png)|参考のみ|**機能検証用の暫定戦闘UI。正式デザインと誤認しない。**|
|`docs/next-update/screenshots/`の旧6枚、`design-directions/`のA/B/C初案、`design-b-balanced/before-*`|参考のみ|不採用案・比較元・開発履歴。正式ホームへ逆戻りさせない|

今回、新規撮影や実機確認は行っていない。既存画像とコードを整理した。実機Safari／Chromebook、学校大人数運用は未検証。
