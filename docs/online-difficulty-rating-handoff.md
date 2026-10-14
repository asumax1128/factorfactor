# オンライン難易度別レート：引き継ぎ

**現行方針（Ver.5.12）**：以下の初期監査記録は過去の設計。現在は所有者承認済みのSpark版を公開し、旧rating→EASY/NORMAL1500の一度限り移行を維持。EASY掲載1501以上、NORMAL人間3戦、乱入戦は別集計。Functions/Blazeは使用しない。[現在の実装・認可・公開報告](../reports/2026-10-13_ghost-host-v511.md)と[正式バージョン運用](game-version-policy.md)を優先する。次回公開は5.13。

詳細仕様案は[online-difficulty-rating-plan.md](online-difficulty-rating-plan.md)、監査結果は[調査報告](../reports/2026-10-13_online-rating-investigation.md)。設計ブランチのみで、オンライン本番変更の承認はまだ得ていない。

- 数学の塔の3件はmain `9fa9ac3`で実装。オンラインの製品コードは`42011a6`と同じ。
- statsの子に新レートを置かない。上位writeの許可を子write:falseでは取り消せない。`online-rating-audit.cjs`は実エミュレータでこの誤設計を再現する。
- 既存recordMatchはdiff/matchIdを持たず、同じinfoの再送を排除できない。新rated戦からこの関数へそのまま二重送信しない。信頼できるサーバーの確定台帳と両者の原子的更新が必要。
- クライアントの任意result/dr/HPを新レートの根拠にしない。UIDとaccountKey、難易度とprotocol、問題選択/戦闘結果を検証する。
- 旧レート保存＋新各1500、各3戦でランキング掲載、5称号、CPU等の対象外は未承認の案。既存stats/旧称号を勝手に削除・変更しない。
- 管理接続なし。最新本番ルール・レコード構造/件数・別途の完全履歴・料金プランを確認する必要がある。合言葉や秘密鍵をチャットへ要求しない。
- 本番Firebase変更/移行/新課金サービス/オンライン公開をこの監査コミットから実行しない。サーバー検証と新クライアントの混在テストが通過してから、承認済みの範囲で段階公開する。

監査の起動は既存demoエミュレータで、`RTDB_RULES_BASELINE_FILE`を指定して`node scripts/run-math-tower-rules.cjs rating-audit`。新仕様の安全性テストではなく、旧実装の問題を記録する監査なので、将来の改善で拒否が正しくなった場合は期待値を見直す。常設CIに旧脆弱性の許可を要求するテストとして追加しない。


## Ver.5.15 日本語UIフォント基準

正式なデザイン基準は [UIデザイン基準](ui-reference/design-standard.md)および `docs/ui-reference/design-standard.md`。比較画像原本は `docs/ui-reference/factorfactor_font_ui_comparison.jpg`。旧42011a6の画面Ver.5.9、Zen Maru Gothic 500/700/900、共有FontImportを確認した。新オンラインのFontImport欠落を補い、見出し/ボタン900へ統一。数式/KaTeX/MathText、ソロ/CPU/塔のルール、Firebaseの記録・認可は変更なし。次の通常公開はVer.5.16。新機能にも共通フォントを必ず読み込み、数式へUIフォントを上書きしない。


## Ver.5.16 緊急・カード操作の正式仕様

オンラインの因数カードはCPU練習と同じ既存BattleBoardの既定操作を利用する。1枚目から2枚目へのドラッグ/スワイプで解答し、単独タップ/別々の2タップでは選択を保持せず解答しない。無効な位置で指を離したら解除。Ver.5.13でオンラインだけtapSelectを有効にしたことが原因だったため、呼び出し側の指定だけを削除。共有入力処理、CPU/ソロ/数学の塔の操作は変更しない。今後tapSelectを再び有効化しない。同期中にdisabledへ戻す、同じ問題のタイルを毎回作り直す修正も禁止。6経路の実タッチ連続スワイプと人間A/Bの実SDKで検証し、公式記録・レート・EXP・Firebaseは保持する。次の通常公開はVer.5.17。


## Ver.5.17 オンライン遅延・同期

調査と計測は `reports/2026-10-14_online-latency-v517.md`。CPUと同じmultiply/polyEqual/getJudgmentによる即時表示と、公式得点の確定を分離する。ローカルの正解表示を公式の得点加算として扱わない。対人戦のRTDBトランザクション順序・旧レコード・1/3乱入レート・指名戦レートなし・試合IDによるEXP/レートの重複防止は維持。

ゴーストは既存G.advance/E.stepを端末内で実行し、1秒間隔または入力時の世代付き保存をまとめる。別の書き手の世代を上書きせず、切断時は未送信チェックポイントを保持する。結果を確定する前に保存成功を待つ。再読み込み用の記録はsessionStorage（同じタブ）で、認証状態が変わった別UIDへ復元しない。公式保存結果が優先。

`onlinePerf=1`を付けた開発確認URLで `OnlineSpark.performance.events` を参照できる。ログは最大600件、UID・アカウントキー・名前・認証情報・PIN・実データ本文を出力しない。JSONスナップショットのバイト数は課金対象の実通信量ではない。iPhone実機と本番Pages直接アクセスは未確認の場合を必ず区別する。Spark維持。有料プラン/サービスは所有者の明示承認が必要。次の通常公開はVer.5.18。


## Ver.5.18 賞金首→詳細のモーダル遷移

BattleHomeは選択時にopenProfileでwinを{type:'profile',key,origin}へ置き換える。単一のモーダル状態で一覧または詳細だけを表示する。一覧と詳細を重ねない。賞金首用のorigin='bounty'は一覧を閉じても保持し、PlayerProfileへ渡す。winからoriginを算出する旧実装へ戻さない。詳細は選択キーで再生成して前の相手の状態を持ち越さず、閉じるとオンラインメニューへ戻す。背景のoverflow/overscrollは一覧または詳細がある間だけ保持し、終了/アンマウント時に以前の値を復元。z-index・共通PlayerProfile・ソロ/CPU/数学の塔・判定/同期・報酬/レート/7日制限・Firebaseルールは変更しない。

回帰: npm run test:bounty-profile（320/390/430/1366px、連続タップ、一つの詳細、実タッチスクロール、閉じて復帰、別相手、みんなの成績、bounty経路の指名戦）。詳細は reports/2026-10-14_bounty-profile-v518.md。次の通常公開はVer.5.19。

## Ver.5.19 Chromebook互換性調査

683×325の縦積みで問題切断・カード高さ4pxを再現。index.htmlのcompat-playだけ短い横画面の2列/低画面スクロールを追加。数学の塔の外枠と入力処理、Ver.5.17の同期、カードのドラッグ方式、数式設定は変更しない。通常タッチ不能はChromiumで未再現。学校の実機確認と匿名診断は[Chromebook確認手順](ui-reference/chromebook-check.md)。tests/chromebook-browser.cjsをCIに追加。次の通常公開はVer.5.20。

## Ver.5.20 最高レートとマスタータイル

index.htmlのRatingHistoryでEASY/NORMALのmaxRating・seasonMax・seasonHist/maxと旧EASY履歴を共通集計。現在レート/初期1500で歴代最高を作らない。PlayerProfileは旧対戦数0/オンライン経路でも最高を表示。Wardrobeのmasterタイルだけ、履歴>=1820/既存永久達成フラグ/保存済みmaster装備を解放根拠にする。他の条件は既存skinOpen/skinInfoを維持。画面表示中だけ対象プロフィールを1件監視し、アカウント切替の古い値・閉じた後の通知は使わない。マイグレーション/新フラグ保存/ルール変更/全件監視は追加しない。test:rating-historyをCIへ追加。詳細はreports/2026-10-14_rating-history-v520.md。次の通常公開は5.21。指定asumax1128/factorはREADMEだけの初期コミット12d6eceのため、実コードと公開はfactorfactorで保守した。

Ver.5.21追補: 初期1500の未記録判定では人間gamesだけでなくghost.gamesも確認する。乱入戦は公式レートを更新するため、人間games=0でも履歴がある。32件の単体テストでこの境界を保護。次の通常公開は5.22。


## Ver.5.22 現在レート表示の統一

ロビーは旧accounts/stats/ratingではなく、開いているアカウントのonlineSparkV1/profiles/easy,normal/ratingを別々に表示。CurrentRatingsをPlayerProfileとも共用し、useRatingHistoryProfileの対象1件の監視を再利用。前アカウント/未読込はundefinedとして旧値を先に見せない。プロフィールが存在しない移行前だけ、ランキング同様に旧ratingのEASY投影とNORMAL開始値1500を明記する。欠損難易度は旧値で補わず未記録。月替わりはOnlineSpark.ratingView（既存core関数の読み取り専用export）と同じ結果。

RatingDisplay.formatは表示時だけMath.round。ロビー・自己/他人プロフィール・ランキング・レーティング・乱入・結果・ゴースト履歴・旧季節履歴/結果差分を整数化。計算/保存/順位/マスター条件へformat値を渡さない。1819.9は表示1820でも未到達。最高値は引き続きRatingHistoryで別集計する。旧対戦記録/旧レートはラベルで明確に区別。全件取得/書き込みを追加せず、ロビーを閉じると対象リスナー解除。

検証はnpm run test:rating-display。詳細reports/2026-10-14_rating-display-v522.md。通常の次回公開はVer.5.23。
