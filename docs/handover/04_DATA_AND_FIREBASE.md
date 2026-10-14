# 保存データ・Firebase・セキュリティ

## 対象と境界

RTDBは`asumath-games-default-rtdb`、料金方針Spark。今回、本番データ・Consoleルール・使用量・grantを取得していない。コード／候補ルールを根拠に記述する。リポジトリの全体候補は`firebase/v525.candidate.rules.json`、前段の保存候補は`v524.candidate.rules.json`、元は`ghost-host.candidate.rules.json`。既存の管理承認・Console公開の経緯は開発履歴へ。**今後の変更前に現行全文を再確認すること。**

Authは匿名UID、ゲーム内の登録名から`acctKey`を作り4桁合言葉によってUIDとaccountを連携する。メール/パスワードAuthやサーバーの管理鍵を必須にしない。PINの値・Auth token・秘密鍵・実在利用者の情報を文書へ書かない。

初期化は`fbStart`、時刻は`.info/serverTimeOffset`で補正、接続は`.info/connected`。Authの保存不能時はPersistence.NONEに切替、失敗は最大3回追加再試行。`fref`は`DBX || FB.db`だが、本人EXP等は直接FB.dbを使う。

根拠：[index.html:7519・`function fbStart`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L7519)、[index.html:7725・`function acctKey`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L7725)、[index.html:7550・`const fref`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L7550)、[firebase/v525.candidate.rules.json:2・`"rules"`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/firebase/v525.candidate.rules.json#L2)。

## 主な保存パス（すべてgames/factor配下）

表のaccount/uid/code/gid/dayは抽象キー。日付、schema、seqを別物として扱う。

|保存パス|用途/主要構造|読取|書込|関連コード|
|---|---|---|---|---|
|pins/account|4桁合言葉|クライアント不可|認証済み・初回のみ/形式検証|loginAccount / v525 rules|
|logins/account/uid|本人accountと匿名UIDの連携証明|クライアント不可|本人UID・PIN一致|loginAccount|
|accounts/account/name,createdAt|登録情報|認証済み（accounts祖先）|初回名/PIN存在、初回時刻|AccountGate|
|accounts/account/stats|旧rating/maxRating/seasonHist、exp、games/w/l/d、モード統計、nick、skin、wk、login、mission等|認証済み|当該accountへ連携済みUID。日次称号装備は追加proof検証|recordMatch、statsTx、addExp|
|accounts/account/prof|lv/pt/judge/mode学習集計、dailySoloSeen|認証済み|本人連携|applyLearn/flushLearn/completeDailySolo|
|accounts/account/mis|d/p/c、日次進捗・受取記録|認証済み|本人連携|applyMis/missionEvent|
|rooms/code/meta|host、createdAt、tour/raid/fraid、acct、委任情報|認証済み|部屋作成/host/期限、先生または開催grant条件|BattleApp、event-host-rules|
|rooms/code/players/uid|name、acct、joinedAt等|認証済み|本人UID・既存部屋、host集合操作|joinRoom/announce|
|rooms/code/state|phase/mode/diff/players/names/seed/startAt/gid、大会/raid設定|認証済み|host、先生専用phase等検証|BattleApp、TourBoard/RaidBoard|
|rooms/code/claims/gid/q|A先着uid/at/j/pts等|認証済み|参加者・空の枠への初回、host管理|GameA/scoreA|
|rooms/code/live,ev,ko,result|旧B/Cの状態・攻撃・KO・結果|認証済み|各枝の本人/参加者/host条件。枝別に異なる|createBEngine/BattleGame|
|rooms/code/rd,tb,fx,thp,cheer|レイド集計、先生操作、特殊演出、チームHP、旧応援|認証済み|枝ごとの条件（legacyでは広い参加者権限も残る）|raidCalc/TeacherBossPlay/CheerBar|
|rooms/code/b2/gid|game、clock、inputs/uid/aSEQ・c1..3、handled、rejected、revision、accounts|認証済み|host確定・時計、本人intent。参加者/観戦者役割・ID/field不変条件|room-b2-client/b2-pump / v525 rules|
|qm/slot|旧ランダム待機枠|認証済み|認証済みとhost保持検証|旧QM互換経路|
|onlineSparkV1/config|enabled、protocol=spark-v1|認証済み|クライアント不可|BattleApp/create|
|onlineSparkV1/backups/account|初回name/statsの退避（PINを含めない）|本人連携|本人初回・不変|ensure/移行rules|
|onlineSparkV1/profiles/account|name、easy/normal、badges、title、migrationId、initialRating、initializedAt、processed、activeMatch/lastAckMatchId|認証済み|本人連携・必須fields/勝敗合計/履歴保持/増分/装備条件|ensure/apply、online-spark-rules|
|onlineSparkV1/slots/easy,normal|id/uid/key/name/until/startedAt/claim/fallback|認証済み|本人待機枠、他者のclaim、fallback競合条件|enqueue/tryGhost|
|onlineSparkV1/matches/id|members、phase、difficulty、seed、votes、game、receipt、clock、inputs、revision|メンバー/待機枠の当事者など限定|メンバーと不変metadata/receipt/本人intent|core.transition/engine/B2Pump|
|ghostV1/users/account|activeMatch、matches、events、bountyCooldowns|本人連携|本人、移行・イベント不変・結果条件|ghost-client処理/ghost-rules|
|ghostV1/inbox/account/event|分身側通知・結果、私有受信箱|宛先本人連携|正当な確定試合から送信者が一回通知|ghost-rules/flushGhost|
|daily/日付/account|旧デイリーt/name|認証済み|本人連携・初回のみ|LegacyDailyApp|
|dailyV2/ready|新dailyの準備判別|認証済み|クライアント不可|DailyAppフォールバック判別|
|dailyV2/clock/uid|ServerValue.TIMESTAMP|本人UID|本人UID、now一致|Daily.clock|
|dailyV2/attempts/account/JSTepoch/slots/0..2|id/seed/difficulty/at、不変result|本人連携|本人・server日付・3枠・不変予約・result|reserve/start/finish|
|dailyV2/boards/day/difficulty|records/accountとleader。score/cleared/elapsed/correct/confirmedAt/sortKey等|認証済み|本人の確定result proofに一致、best順位とleaderを同時検証、期限後不可|publish/daily-v2-rules|
|dailyV2/finals/day/difficulty|猶予後のleader完全コピー|認証済み|一回のみ、server日時と順位proof|awards|
|dailyV2/playedDays,awardCursor,titles|本人参加日、処理済日、4永久優勝称号|本人状態/公開称号は枝による|本人連携、過去日、本人が優勝したproof/all3|awards/daily-v2-rules|
|raidw/week/dmg,kill,meta,sup|全体ダメージ、最後の一撃、週boss/rage/rule、応援|認証済み|dmg/sup本人連携、kill/meta初回等|WeeklyRaidApp/ensureWeekMeta|
|raidwHist/week|週確定資料|認証済み|認証済み初回、構造検証|weekly history|
|teacherPass,teacherKeys/account,teachers/account|既存の先生解放|pass/keys読取不可、teachers認証済み|pass管理のみ、keys/teachers本人連携と照合|unlockTeacher/TeacherArea|
|eventHosts/account|enabled/tournament/raid/teacher/updatedAt|認証済み|先生と本人連携を満たす管理操作|grant/revoke、event-host-rules|
|eventHostRooms/account/code|委任部屋登録|先生/当事者条件|grantと登録metaを照合|createRoom/revoke|
|presence/uid|name/act/detail/room/atなど|認証済み|本人UID、形式|presenceFlush/TeacherDash|
|ghostlog/account/id|旧ゴースト対戦記録|認証済み|本人または正当な初回相手記録のlegacy条件|旧通知互換|
|tower/best/account|旧塔f/name|認証済み|本人連携|旧TowerApp|
|mathTowerV2/access/account|teacher/enabledの試遊grant|連携済み先生本人|管理側のみ|MathTowerStore.access|
|mathTowerV2/content/account/chapter1|旧の私有配信コンテンツ互換|grant付き本人|管理側のみ|MathTowerStore.load fallback|
|mathTowerV2/trialProgress/account|schemaVersion1/progressVersion2/revision、adventures/difficulties/history/read/notes等|grant付き本人|grant付き本人・revision/構造/履歴保持|MathTowerStore.save|

祖先の`.read/.write`が許可すると子で取り消せないRTDB仕様に注意。表を個別子ルールだけで評価しない。`accounts/.read`により学習・statsの多くは認証済み利用者へ公開される一方、PIN/ログイン証明・新ゴースト私有領域は別枝である。crowd/bluff/kyoen/auction/factor_devも同DBの候補全体にあるが、今回のFACTOR実装対象外。ルール統合で削除しない。

## トランザクション・冪等性

Sparkの`tx`はvalue listenerでcacheをprimeし、transaction完了まで保持する。callback内throwを捕まえundefinedで中断し、失敗理由をpromiseへ戻す。楽観表示の値と確定snapshotを混ぜない。

- 人間：intent(seq)・handled、match receipt、profile.processed/lastAckで二重処理を防ぐ。
- ゴースト：localGhost revision/checkpoint、公開イベント/本人報酬の一回記録、bountyCooldowns。
- デイリー：UUID予約・slots、result初回、本人best＋leader、awardCursor/proof、dailyRewards/dailySoloSeen。
- 塔：revision一致・createWriter直列・history[runId]、未来schema拒否・migrationBackup。別端末の保存を自動マージしない。
- 旧stats：roomSeenを新Bで使用、ログインは日付、weekly.doneは受取種別。全古い保存経路が完全なexactly-onceとは保証しない。

根拠：[src/online-spark-client.cjs:18・`async function tx`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/src/online-spark-client.cjs#L18)、[src/daily-client.cjs:4・`async function reserveSerial`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/src/daily-client.cjs#L4)、[math-tower-store.js:81・`function createWriter`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/math-tower-store.js#L81)。

## ローカル保存

|キー群|意味・注意|
|---|---|
|fxf_battle_account_v1 / fxf_battle_name_v1|登録accountの選択・表示名。認証済みである証拠ではない|
|fxf_guest_stats_v1 / fxf_guest_prof_v1 / fxf_guest_mis_v1|ゲストEXP/学習/ミッション。ログイン時の移行経路を維持|
|factorxfactor_ranking_v1 / fxf_solo_ghost_v1_account|ソロTOP3／本人過去ベストsplit|
|fxf_skin_v1 / fxf_cpu_cfg_v1 / fxf_menu_diff_v1|外見・CPU設定・選択難易度|
|fxf_ui_mute_v1 / GameAudioのKEY|メニュー/全体音量。設定の意味を統一する前に所有者確認|
|fxf_login_v1 / fxf_wk_day / fxf_tower_v1|ゲストボーナス/初出撃/旧塔|
|fxf_daily_v2:account|予約ACK不明時の同ID回復。開始済みreloadは権利返還なし|
|fxf_ghost_checkpoint_v517:account:uid|sessionStorageの未同期ゴーストcheckpoint。正式試合結果と区別|

キーの全定義は[index.html:7723・`const ACCT_LS`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L7723)、[src/daily-client.cjs:7・`draftKey`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/src/daily-client.cjs#L7)、[src/online-spark-client.cjs:126・`draftKey`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/src/online-spark-client.cjs#L126)、[game-audio.js:4・`const KEY`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/game-audio.js#L4)。ブラウザ自身のFirebase認証永続化も別にある。今回ストレージ値は取得していない。

## 信頼モデル・禁止操作

現行はクライアント/ルームhostがゲーム計算し、ルールは本人性・時刻・形式・履歴・増分・冪等性を検証する。RTDBルールでJavaScript全エンジンを再実行しているわけではない。デイリーの結果proofは不変の本人投稿との一致で、数学的なプレイ真偽の完全なサーバー検証ではない。既存GASの管理コードも未取得。

Emulatorはdemo projectへのみ接続し、管理無効化ctxはfixture生成限定。本番でrules-unit-testing、全件set/import、remove、認可無効化、推測account/grant、一括レート救済を実行しない。バックアップを取っても認可を弱める許可にはならない。課金変更・破壊的移行・生徒塔公開・セキュリティ変更は所有者と確認する。

関連：[オンライン](05_ONLINE_SYSTEM.md)、[塔保存](07_MATH_TOWER.md)、[安全手順](12_NEXT_DEVELOPER_GUIDE.md)。

[総合案内へ](00_START_HERE.md)
