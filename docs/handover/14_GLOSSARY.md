# 用語集

|用語・コード|意味・混同しないもの|
|---|---|
|正式版 / version.json|major/minor整数。コメントver7/8.4や準備版と別。正式5.25、5.24未配信|
|難易度 / difficulty / diff|easy/normal/hard内部ID。表示はカタカナ。出題LvやCPU強さとは別|
|Lv（問題レベル）|genL1〜9の数学形式。プレイヤーEXPレベルと別|
|プレイヤーLv|expNeedで求める成長。出題のLvと別|
|clearCount / N|ソロの必要正解数、Aの獲得枠、旧Bの解き切り数。日次は出題枠、新Bは時間制で上限なし|
|factor / poly|因数の型とx4〜x0係数ベクトル|
|MathText / fxm|数式表示。UIの丸ゴシックとは別font。KaTeX fontを使う独自span描画|
|seed / bank / k|盤面の再現用seed、遅延生成列、同Lv内の番号|
|question|Aは獲得枠番号、Bはlevel:k。UIの「第何問」と必ずしも同じでない|
|seq / acceptedSeq|本人入力の順序・確定番号。問題番号ではない|
|revision / serverTime|共有状態の世代・計算時刻。過去応答の採用を拒否する指標|
|startAt / gameStartAt|試合全体の同期開始。qStart/startAt(view)は現在問題の開始を指す経路もある|
|readyAt / nextAt|次問が操作可能になる予定。通信完了時刻と別|
|claim / claims|A先着の確定得点枠。マッチングslot.claimは相手予約で別構造|
|receipt / processed / ACK|確定結果、本人一回反映、閲覧後確認。ローカル演出の予測ではない|
|slot / ticket / fallback|難易度別検索枠・本人予約ID・補完切替。daily slotsは当日の挑戦権3枠で別|
|B1 / 旧B|解き切り＋ダメージ/手動6ゲージの互換ルール|
|B2 / rules=b2|新時間制＋偽カード/counter/自動FREEZE|
|C / isBm|Cは2v2共有HP、isBmはBまたはCを集計する旧helper|
|oj / queued / pending / cur.oj|新Bの持越妨害、次盤面予約、counter受付中、実配置枚数。得点bonusはcur.oj|
|FREEZE|3秒の不透明遮蔽/操作停止。問題時計/試合時計/HPは進む|
|ghost / hyper / bot|学習統計の疑似相手、TOP10高速版、合成人物。録画再生とは別|
|selfPractice|自分の分身との無報酬・無公式更新戦|
|origin quick/profile/bounty|乱入/成績指名/賞金首指名。レートと報酬に差|
|rating / maxRating / seasonMax|現在値/歴代最高/月内最高。表示丸めは保存/判定に使わない|
|MASTER|レート1820のrank。旧master1700という別称号と混同しない|
|BADGES|旧称号・実績・二つ名の共有判定92件。独立レート称号5は別|
|active / hidden / retired|実績の表示/集計状態。取得履歴の削除や報酬可否とは別|
|nickname / nick / title|旧BADGES二つ名stats.nickと新profile.titleは別保存|
|skin|tile/bg/fxの外見選択。塔RPGの装備ステータスとは別|
|prof / pattern / pid|学習集計と因数分解の型、型ID。Authプロフィールと別|
|JST epoch / date / week / season|日次整数キー、表示日付、週月曜文字列、月文字列。それぞれ別の正本|
|trial / verified:false|現行塔の先生試遊。公式到達/レートの証明ではない|
|TowerApp / MathTowerApp|旧70階コード／現行第1章5階の先生試遊入口|
|schemaVersion / progressVersion|RTDB保存外枠1／塔アプリ形式2。revisionは更新世代で別|
|DBX / LDB|CPU練習のローカル擬似DB。全体のEXP保存がofflineになるわけではない|
|Spark / Functions案|現行無料RTDB方式／リポジトリにある別サービス案。稼働を混同しない|
|GAS|既存ソロ得点/総得点の外部Google Apps Script。RTDBレート順位とは別|
|grant / eventHost|先生試遊許可／限定開催係権限。教師そのものに昇格するわけではない|

式と正確な定数は[02](02_GAME_RULES.md)、同期は[05](05_ONLINE_SYSTEM.md)、保存は[04](04_DATA_AND_FIREBASE.md)を参照する。

[総合案内へ](00_START_HERE.md)
