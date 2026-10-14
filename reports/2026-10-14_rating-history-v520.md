# Ver.5.20 最高レート表示・マスタータイル解放

基準: 公開main 772c40ed167c5858febeb78a975b18dc6f6e29aa / Ver.5.19。指定の開発repo asumax1128/factorは12d6eceのREADMEだけ（初期コミット）だった。実コード・履歴・Actionsはfactorfactorにあるため、こちらで最小修正する。factorfactor-devの古い別実装を混ぜない。

## 保存場所と原因

新制度はgames/factor/onlineSparkV1/profiles/<account>/easy,normal のrating（現在）・maxRating（歴代）・seasonMax（当月）・seasonHist/<month>/max（過去月）。core.settleとSparkクライアントの結果適用がmaxRatingをmaxで保持し、マスター達成のeasy_master/normal_master/dual_masterも既存の永久badgesに残す。

旧制度はgames/factor/accounts/<account>/stats のrating,maxRating,seasonMax,seasonHist。移行時、旧現在レートはEASYへ引き継ぐが、新easy.maxRatingの初期値は旧現在レートなので、旧歴代最高がそれより高い場合にはstatsの履歴を併用する必要がある。既存バックアップを上書きしない。

PlayerProfileは旧st.maxRatingだけを読み、旧games=0ならその欄ごと省略。新オンライン/みんなの成績のhideLegacyRatingも欄を隠した。skinInfo/Wardrobeは旧最高値だけからrankを算出し、新EASY/NORMALの達成を認識しなかった。masterタイルはrank5（1820）で解放される。個別生徒の本番データは管理認証なしで直接取得せず、コード・既存ルール構造・再現データで原因を確認した。

## 修正

index.htmlの純粋なRatingHistory.highestがEASY/NORMALの保存済みmaxRating・seasonMax・過去月max、旧EASY履歴を共通集計。正の有限数値と10進の文字列数値を扱い、0/null/undefined/空文字/不正値を除外する。現在レートから最高を作らず、ランキングの未移行プレビュー（statsKnown:false）が現在値から作った仮のmaxも使わない。対戦0の初期1500は未記録とし、履歴なしは「―」。HARDは比較しない。将来は比較difficulty配列へ明示追加可能。

PlayerProfileで最高レート欄を旧戦績条件の外へ出し、自分/他人/オンライン詳細で同じ処理を使う。旧総合の現在レート表示は復活させない。useRatingHistoryProfileは画面表示中だけ対象アカウント1件のプロフィールを監視し、閉じる/切替でoff。前アカウントのキャッシュや解除後の通知は使わない。全件読込・全件監視・表示時の書き込みは追加しない。

Wardrobeはmasterタイルだけ、履歴>=RANKS[5].min(1820)、既存の永久マスターバッジ、保存済みstats.skin.tile=masterを解放根拠に併用する。永久最高値/達成バッジがあるので現在値が下がっても失わない。既に装備していたmasterも維持。他のタイル・背景・エフェクト条件は既存skinOpen/skinInfoをそのまま使う。解放フラグの新設/バックフィルは不要。ユーザーが実際に装備を選ぶときだけ、既存setSkinがstats.skinと端末設定を保存する。

現在値しかなく到達履歴も装備履歴もない対象は推測で全員解放しない。バックアップや本人の過去の記録で確認できる対象は管理者による個別確認が安全。一括の書換えは行わない。

## 検証と保護

30件の単体テスト: 両難易度の大小/同点/片方/未記録/現在値低下/旧形式/数値文字列/欠損/シーズン履歴/初期値/プレビュー/HARD除外、新旧マスター到達・閾値・永久バッジ・既存装備。390/1366pxのE2Eで自己/他人の最高表示、旧games0、リアルタイムEASY1820到達、木の装備維持、マスター選択、未対象の宝石ロック維持、読み取り時にstats/profileを書かないことを検証。

既存212関数のAST比較、ソロ/CPU/学び/デイリー/週レイド回帰、賞金首→プロフィール・指名戦導線、UI/数式フォント、高速判定・同期、Pagesビルドも検証。全CIとデプロイの成功を公開条件とする。

レート計算/ランク閾値/対戦/得点/EXP/称号/マッチング/入力/数学の塔/ランキング/先生権限のコードは変更しない。Firebaseルール・本番データの一括変更なし、Spark維持。iPhone Safari実機・本番サイト直接ブラウザ確認は環境制約があり、Actions公開結果と成果物のversion/commit一致を区別して報告する。

## Ver.5.21追補

5.20の公開CI開始後、乱入ゴースト/BOTだけのプレイヤーは人間games=0だがghost.gamesに正式な対戦記録がある境界を追加確認。highestの未プレイ1500判定にghost.gamesを併用し、文字列の0/1も区別。最大1500の有効履歴を未記録扱いしない。単体テストは32件へ追加。ゲーム結果/保存/レート式/ランキング条件には変更なし。公開ごとのバージョンを進め、最終修正版は5.21。
