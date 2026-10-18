# 称号・実績・きせかえ実装監査

対象: Ver.6.0（基準4b1574b、5.24は未配信）。生成元: scripts/audit-rewards.cjs。ユーザーデータやFirebase本番は読み書きしていません。

## システムの区別

現行実績は独立した定義ではなく、BADGESの達成判定を称号・二つ名・取得通知にも利用する共有システムです。実績CSVはBADGES全101件。称号CSVはこの全件に難易度別レートの独立称号5件を加えた106件。同じIDのghost3称号は統合し、保存先の違いを下記で明示しました。新しい監査用実績や報酬は作っていません。今回の追加依頼以前に許可されたデイリー4称号を含みます。

## A. 称号

総数106。カテゴリ: デイリー優勝: 4、対戦: 63、ミッション: 1、今週のボス: 21、ログイン: 4、数学の塔: 5、ゴースト: 3、難易度別レート: 5。判定関数は全件確認済み。取得不可と断定した称号0件、塔の5件は新規取得経路が切り替わっており要確認。既存名・ID・取得条件・装備条件は変更していません。所有者の確認回答に基づき、共通BADGES一覧・プロフィールの塔5項目は一時非表示にしました。装備中の二つ名は保持し、きせかえ条件は変更しません。

レート系列master1600/master1700/master1900とrgold/rmasterは同じmaxRatingを異なる閾値で判定します。新レート系列easy_master/normal_masterは1820ですが、master1700「因数分解マスター」は1700の旧別称号です。同名の「マスター」とランクの意味を混同しないでください。perfect50/100/300/500/1000、streak10/30/50、combo20/30等は段階報酬です。取得条件の完全一致ではなく包含関係です。

## B. 実績

総数101。active 96、hidden 5、retired 0。要確認5（hiddenの塔5項目と重複する調査分類。保存状態を追加していません）。カテゴリ: デイリー優勝: 4、対戦: 63、ミッション: 1、今週のボス: 21、ログイン: 4、数学の塔: 5、ゴースト: 3。通常の達成率はactiveの達成数/active総数のみ。取得判定がないことだけを理由に廃止にはしていません。全BADGESにtestが存在し、通常対戦・旧クラスB・CPU等の到達経路が残るため、現段階で確実に取得不能と断定できる非塔実績はありません。

塔: tw10（塔の挑戦者）、tw30（塔の熟練者）、tw50（塔を制覇）、tw70（数理の書の継承者）、tw100（終わりなき探究者）。旧TowerAppはst.tower.best/endNを書きますが、現行入口はMathTowerApp試遊版で、公式記録へ反映しません。過去の履歴を保持し、一時非表示です。tw100は説明「第一部3回」に対しendN>=3 OR best>=100。tw50は説明「王を倒す」に対しbest>=50のみ。条件は今回変更しません。

nomiss/clutch/miracle/flawlessは説明がB限定ですが、実集計はisBm(mode)なのでCも含みます。新B2のflawless（無傷の勝利）は、dmgTakenが誤答のHP罰を集計し、お邪魔カードを受けたことは集計しません。説明と指標の対応は今後の精査対象です。いずれも取得可能であり廃止しません。

明示的なhidden/secretフラグのある称号定義はありません。BADGESの名称は未取得でも表示し、取得条件を隠します。未取得のBADGESは既存プロフィールで説明を？？？にするため、先生以外に具体条件を開示しない仕様を維持します。名称は既存の公開表示を維持。

## C. きせかえ

総数37。カテゴリ: タイル: 17、背景: 13、エフェクト: 7。初期解放3、取得可能32、要確認2（tile:towert/bg:summit）、現在取得不可能と断定0、判定未確認0。アバター・衣装・帽子・フレームの独立取得/装備定義は見つかりません。塔の装備品は能力値を持つRPG装備であり、外見きせかえではありません。登場人物の固定立ち絵もプレイヤーの取得・装備アイテムではありません。

レベル解放: tile:wood Lv3、tile:board Lv5、tile:washi Lv8、tile:candy Lv12、tile:neon Lv16、tile:space Lv22、bg:sunset Lv4、bg:forest Lv7、bg:sakura Lv10、bg:lavender Lv14、bg:starry Lv20、fx:gold Lv6、fx:heart Lv9、fx:aqua Lv13、fx:fire Lv18、fx:rainbow Lv25。レート解放: tile:gold rank index 2（閾値1580）、tile:gem rank index 4（閾値1730）、tile:master rank index 5（閾値1820）、bg:goldbg rank index 3（閾値1650）、fx:master rank index 5（閾値1820）。その他の独立した数値・ボスIDはCSVの必要数値を参照。rankはskinInfoの歴代レート、マスター2アイテムのみ新旧EASY/NORMAL履歴と永久達成証明を追加参照します。

レート解放のtile:gold/tile:gem/bg:goldbgは従来statsのmaxRating/seasonMaxによる判定で、MASTERの例外のように新難易度別履歴や保存装備を参照しません。保存済みの装備があっても参照履歴が欠損すると再選択不可となる可能性があるため、個別データは未確認として記録し、条件は変更しません。

全37アイテムはCSS/色の定義で、画像ファイルを参照しません。そのため、このアイテム群の画像欠落・ファイル名不一致は0。img配下の他の画像は塔・ヘルプ・演出用であり、きせかえ定義の不足ではありません。画像共有・未使用の全リソースの到達解析は未確認で、削除していません。

## D. 保存と連動

BADGESは主にgames/factor/accounts/<k>/statsの累積値に対する動的判定です。保存済み取得ID全件リストとは限りません。recordMatch、txStats、週ボス確定、ログイン更新の数値を参照します。二つ名はstats.nick、きせかえはstats.skinおよびローカルfxf_skin_v1保存（setSkinを参照）。通常取得通知はbefore/afterのbadgesOf差分で、今回状態変更はこの判定や履歴を変更しません。

新レート5称号とghost3はgames/factor/onlineSparkV1/profiles/<k>/badgesの永久フラグ（実際のROOTはonline-spark-client参照）。ghost3はlegacy stats.ghostTitlesにも投影。ghostの条件はsrc/ghost-model.cjs titles: quick乱入勝利のみ、hyperまたはrankDifference==1/2。指名・自己練習は対象外。独立レート称号の装備はprofile.titleで、旧stats.nickと別です。従来のw/l/games等はrecordMatchのルーム・大会の戦績で、CPU練習はaddExp/flushLearn経路です。新レート対戦のeasy/normal戦績は別のprofileに保存し、旧BADGESの全統計へ同じように投影する仕組みではありません。デイリー4称号はdailyV2/titles/<k>の確定順位証明を使い、BADGESに注入して装備します。

rainbowタイルはBADGES20、aurora背景は30。実績のactive達成率と異なり、着せかえ用の従来BADGES取得数にはhiddenも含めます。共有の称号・実績一覧の表示数は所有者承認によりactive87件へ統一。着せかえ用の全取得数や所持率は変更しません。ミッション3日、bounty1、ボス討伐フラグ、かけら5、塔best50と各実績の閾値は独立しており、専用IDを持つ実績の取得フラグそのものを要求しません。

## E. 改善候補・確認事項

称号/実績を共有する命名と独立レート称号の扱いを整理すると、取得数と装備先を理解しやすくなります。対戦・週ボスに比べソロとC方式固有の報酬は少なく、きせかえはレベル中心です。段階Perfectや相殺の数値はプレイ頻度次第で大きく難易度が変わります。新Bの相殺量は枚数単位ですが、旧Bのダメージ相殺累積を同じcancelTotalへ蓄積するため単位の差があります。今回変更せず、今後のバランス検討対象です。通常ゴースト/新Bの記録投影と旧ルームの全統計は同一ではなく、実績到達経路の差があります。

全称号・きせかえの判定関数は確認しましたが、各累積値を全モードで実際に達成する長期実機テストは未実施です。旧塔の取得可能性を推測で廃止にはしていません。新塔の試遊版ラベル「零光の探索者」は公式称号解放IDではないため報酬数には含めません。

## 再生成と検証

node scripts/audit-rewards.cjsで3CSVと本書を生成。各CSVはUTF-8 BOM、CRLF、日本語ヘッダー、1行1ID。同一内部IDがカテゴリ間で重複するstd等はcosmeticsのアイテムIDをtile:std/fx:stdにして識別し、元の内部IDを補助列へ必ず保持（保存IDは変更しない）。コードの定義数、CSV行数、重複IDは自動テストで照合します。

## 画像アセットの参照調査

下記はリポジトリ内のimg全ファイル。きせかえ37件はCSSなのでいずれもきせかえ専用画像ではありません。ファイル名だけの静的検索では動的URLを断定できないため、未使用とは判定しません。塔のmonster/NPCなど用途ごとの動的描画を含みます。共有・未参照は削除対象ではありません。

|アセット|静的ファイル名参照|
|---|---|
|img/icon-180.png|動的参照を要確認|
|img/icon-192.png|動的参照を要確認|
|img/icon-512.png|動的参照を要確認|
|img/math-tower-floor3-official-d81d75734c05.png|あり|
|img/backgrounds/README.md|動的参照を要確認|
|img/monsters/README.md|動的参照を要確認|
|img/monsters/abs.webp|動的参照を要確認|
|img/monsters/balance.webp|動的参照を要確認|
|img/monsters/chimera.webp|動的参照を要確認|
|img/monsters/dragon.webp|動的参照を要確認|
|img/monsters/golem.webp|動的参照を要確認|
|img/monsters/king.webp|動的参照を要確認|
|img/monsters/king2.webp|動的参照を要確認|
|img/monsters/kraken.webp|動的参照を要確認|
|img/monsters/maou.webp|動的参照を要確認|
|img/monsters/maou2.webp|動的参照を要確認|
|img/monsters/mirror.webp|動的参照を要確認|
|img/monsters/mod.webp|動的参照を要確認|
|img/monsters/prime.webp|動的参照を要確認|
|img/monsters/robot.webp|動的参照を要確認|
|img/monsters/sim.webp|動的参照を要確認|
|img/monsters/slime.webp|動的参照を要確認|
|img/monsters/wave.webp|動的参照を要確認|
