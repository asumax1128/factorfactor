# 数学エンジンとゲームルール

## 1. 数学の表現・正誤判定

因数は`const{k}`、`linear{a,b}`、`quadratic{A,B,C}`。式は`{x4,x3,x2,x1,x0}`という係数ベクトルで表す。`multiply`は多項式の畳込み、`polyEqual`は5係数の厳密等値。見た目や文字列では判定しない。順序を逆に選んでも積は同じで、通常は異なるIDの2タイルを結ぶ。三乗公式の2次因数にも同じ処理を使う。

根拠：[index.html:614・`function toCoeffs`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L614)、[index.html:619・`function multiply`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L619)、[index.html:634・`function polyEqual`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L634)。

## 2. Lv1〜9の出題台帳

下表の例は係数範囲・互いに素条件に合う積。基礎点は**LEVEL_POINTSの実値**を使用する。古いgenL6〜9のコメントの点数は一致しない。

|Lv・基礎点|形式と例|係数の範囲・制約|特徴・判定|実装・テスト|
|---|---|---|---|---|
|1・10|abx±ac=a(bx±c)、6x+15=3(2x+5)|a=2〜9、b,c=1〜9、gcd(b,c)=1|数の共通因数。const×linearを係数照合|[index.html:714・`function genL1`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L714) / legacy-regression、online-rated.test|
|2・12|abx²±acx=ax(bx±c)、6x²+4x=2x(3x+2)|a=1〜9、b,c=1〜9、gcd(b,c)=1|xを含む共通因数。linear×linear|[index.html:729・`function genL2`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L729) / 同上|
|3・14|x²+(a+b)x+ab=(x+a)(x+b)、x²+5x+6|a,bは−9〜9の非0、a≠−b|一次項が消えない。a=bの平方も生成範囲|[index.html:746・`function genL3`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L746) / 同上|
|4・16|a²x²−b²=(ax+b)(ax−b)、4x²−9|a,b=1〜9、gcd(a,b)=1|二乗の差。余分な数の共通因数を避ける|[index.html:760・`function genL4`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L760) / 同上|
|5・18|(x+b)(cx+d)、2x²+7x+3|c=2〜9、b,dは±1〜±5、gcd(c,d)=1|片側のx係数が1、数値小|[index.html:775・`function genL5`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L775) / 同上|
|6・20|(x+b)(cx+d)、2x²+19x+9|c=2〜9、b,dは±1〜±9、gcd(c,d)=1、\|b\|≥6 OR \|d\|≥6|Lv5と係数条件を分離|[index.html:791・`function genL6`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L791) / 同上|
|7・30|a³x³±b³=(ax±b)(a²x²∓abx+b²)、x³+8|a,b=1〜5、互いに素|三乗の和・差、複号同順|[index.html:805・`function genL7`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L805) / 同上|
|8・40|(ax+b)(cx+d)、6x²+7x+2|a,c=2〜4、b,dは±1〜±4、各因数で互いに素。a<c OR a=cかつb≤d|両側の係数が1より大きい、数値小|[index.html:822・`function genL8`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L822) / 同上|
|9・50|(ax+b)(cx+d)、18x²+27x−5=(3x+5)(6x−1)|a,c=2〜9、b,dは±1〜±9、各因数で互いに素・上と同じ順序条件。a≥5 OR c≥5 OR \|b\|≥5 OR \|d\|≥5|Lv8と範囲を分離、数値大|[index.html:841・`function genL9`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L841) / 同上|

`LEVEL_INFO[9].example`の「18x²+21x−5 → (6x−1)(3x+5)」は一次係数が一致せず、**静的説明の不整合**。上表は実ジェネレータに合う27xを使用し、コードは今回変更していない。根拠：[index.html:864・`const LEVEL_INFO`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L864)。

## 3. 出題順・誤答・再現性

- 正解数ベースの通常出題：1〜27問は3問ずつLv1→9。28問以降は重み抽選。初期重み `[8,8,8,8,10,10,12,16,20]`、3問ごとLv1〜4各−1、Lv5/6各+2、Lv7−2、Lv8+2、Lv9は残り。46問以降 `[2,2,2,2,22,22,2,30,16]`。
- イージー15問/6枚、ノーマル30問/9枚、ハード50問/9枚。オンラインの難易度はイージー・ノーマルのみ。デイリーのハードをオンラインHARD実装と誤認しない。
- `buildBoard`は正しい2因数を残し、符号反転・定数±1・同レベルの別因数を誤答候補にする。全ペアを照合し別解を減らす。seenはレベルと係数の署名で同じ多項式を避ける。
- **有限再試行の限界**：重複生成はouterAttempt<200、別解チェックはattempt>40で抜ける。常に数学的唯一性を無限に保証するアルゴリズムではない。新Bの偽カード追加は400回、旧お邪魔追加は300回の上限。限界時に予定枚数まで追加されない可能性を残す。
- `withSeed`/`hashSeed`/`mulberry32`を使う`makeBank(seed,tileCount)`はレベルと通し番号ごとに同じ盤面を作り、IDを`q<level>_<index>_<slot>`へ固定。ソロの直接生成はMath.randomとDate.nowのIDで、全モードが完全に同じ乱数方式ではない。
- 通常ソロの正解数>30かつ3%で逆引き展開4択、対象Lv5/6/8/9、一律基礎50点。デイリーも共有値を参照する。通常ドラッグ禁止をこの4択に適用してはいけない。

根拠：[index.html:915・`function pickLevelForQuestion`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L915)、[index.html:1294・`function buildBoard`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L1294)、[index.html:7631・`function makeBank`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L7631)、[index.html:1346・`const REVERSE_STAGE_LEVELS`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L1346)。テスト：`legacy-regression.cjs`、`online-rated.test.cjs`、`daily-play.test.cjs`、`b2.test.cjs`。

## 4. 判定時間・HPと得点

|経過時間|実判定名|回復|色|
|---|---|---:|---|
|≤2秒|Perfect|25|#FFD54A|
|≤3秒|Excellent|20|#8BE38F|
|≤5秒|Great|15|#6BD4E8|
|≤10秒|Good|10|#8FB8FF|
|≤15秒|OK|5|#C9C9C9|
|≤20秒|Fair|2|#FF9F1C（計算用定義）|
|誤答/期限超過|Bad|0|#FF5C5C|

「成功6段階＋Bad」が実装。UIの`timingVisual`はFairをOK表現へ寄せるため、ヘルプの6文字とルールの段数には差がある。新Bのhealは同じ回復量を直接実装。閾値を監査名目で変更しない。

普通の正解得点 `round(Lv基礎点 × (1+0.1×正解前combo)) + max(0,round(HP_before+回復−100))`。HP上限100。ソロ・旧Bと新B2の基本Pに共通するが、AはHP超過点を使わずラスト3問2倍。時間は直接点へ乗算せず回復／超過点を通じて影響する。

根拠：[index.html:1361・`const JUDGE_TIERS`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L1361)、[index.html:3125・`function timingVisual`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L3125)、[index.html:2193・`const attemptMatch`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L2193)、[server/online-rated/b2.cjs:4・`const heal`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/server/online-rated/b2.cjs#L4)。

## 5. モード比較（終了・保存・例外）

|モード|開始/人数|時間・HP|正誤・コンボ・攻撃|終了条件|得点/報酬・保存・退出|
|---|---|---|---|---|---|
|通常ソロ|ホームからE/N/H、1人、ゲスト可|1問20秒、HP100、通常問題中1%/秒|正解で回復・combo+1、ミス20/25/30%とcombo0。ミス/timeoutは同じ正解数枠の新問|15/30/50**正解**またはHP0|上記P＋クリア時round(正解数×15−経過秒)。EXP・localTOP3・GAS・学習。退出と回復はソロUIの処理。オンライン復帰仕様を流用しない|
|CPU|ロビーでA/B/C・E/N・相手強さ選択、ローカルDB|A/旧B/Cのルール|共有BattleBoard、CPUが時間/ミス率で回答|方式ごとの勝敗|公式勝敗・レートなし、勝8/他5EXP。ローカルDBだが登録者EXPはRTDB|
|ルームA/レートA|共有seed、ルーム最大4/レート2|1問20秒、開始+3.8秒、HPなし|先着のみ得点、誤答2秒ロック、他人取得/未解答でcombo切れる。次問1100ms|15/30問の獲得枠終了、得点最大、同点引分|ラスト3問2倍、詳細履歴。レートの保存先は入口により旧statsか新difficulty bucket|
|新B2|新規通常ルーム/すぐ対戦/ゴースト、E/N|60/90/120/180秒、quick90、HP自然1%/秒、1問20秒|得点・偽カード・3秒counter・自動FREEZE。詳細は次節|HP0でKO、期限で得点最大、同時KO/同点引分|旧Bの解き切り勝ちを適用しない。遷移420ms。記録と報酬は入口ごと|
|旧B|開始済み旧試合、CPU、クラス大会など互換経路|1問20秒、HP100、解答中のみ自然減少|旧ダメージ・Perfectお邪魔・3種手動必殺技|規定正解数へ先着、または最後の生存者|同じPだが新Bの偽カード10%はなし。旧スキーマ維持|
|C|4人2チーム、足りない分CPU可|HPをチーム共有。旧B倍率参照|回復0.5倍、誤答等0.6倍、自然減少0.5倍、カバー・合体・フォロー|チーム計N×2正解または相手HP0|旧ルーム結果/戦績。独立レートのC bucketはない|
|新デイリー|登録者、E/N/H合計1日3回|1問20秒、HP100、15/30/50**出題枠**|誤答でも枠を進める。通常ソロの生成/採点/HPを共有|最後の回答を完了しHP>0でクリア。最終timeoutは未クリア。途中KO/退出未クリア|誤答ありでもクリア、部分得点も順位対象。EXP初完走20/追加5。開始日所属・開始消費|
|旧デイリー/ドリル|新daily準備不能時／学びの部屋|10問タイムアタック、誤答ペナルティ5秒|PracticeRunner。HP得点競技ではない|10問終了/退出|旧dailyランキング／ドリル記録。新3回制と別。フォールバック注意|
|今週のボス|ホームから出撃、登録者は全体HPへ寄与|通常60秒、long週90秒、個人HPとは別|raidDamage、弱点/反撃/お邪魔/役割/宝箱|出撃期限／全体討伐|週HP30000×特性×怒り、ダメージ累計順位、EXP・討伐報酬。ゲストのダメージは全体へ送らない|
|クラス/フレンドレイド|先生/開催係またはfriendルーム|ホストの時間・強さ、default3分|部位、チェイン、総攻撃、7役割、先生ボス|全体ボスHP0または終了時刻|RaidClassPlay結果footer。通常の対人レートではない|
|クラス大会|先生/開催係、2〜64人、A/旧B|方式別、単敗T/Swiss+決勝|同点扱いは予選と決勝で異なる|勝ち抜き／最終決勝|旧statsと大会項目。全ラウンド実機は未確認|
|数学の塔MathTowerApp|登録先生＋grant、第1章1〜5階|1問45秒、自然減少なし、章HP|専用COMBO火力・ミス/timeout。詳細は07|敵単位撃破/HP0、会話と保存後に続行|試遊記録。通常EXP/公式塔実績へ反映しない|
|旧TowerApp|現行rootからは呼ばれない互換コード|旧45秒/階、旧70階目標|旧ボスギミック/装備・旧保存|旧階突破・章終了|旧stats.tower等。現行試遊と同じ仕様と呼ばない|

根拠：[index.html:1457・`function FactorHunt`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L1457)、[index.html:8108・`function createBEngine`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L8108)、[index.html:7390・`const CPU_LEVELS`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L7390)、[index.html:7696・`function scoreA`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L7696)、[server/daily-play.cjs:9・`function finish`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/server/daily-play.cjs#L9)、[index.html:4696・`function RaidPlay`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L4696)、[index.html:10637・`function TourLobby`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L10637)、[math-tower-core.js:36・`function begin`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/math-tower-core.js#L36)。

## 6. 新B2の確定ルール

- **P**＝round(LEVEL_POINTS[level]×(1+0.1×(combo−1)))＋max(0,round(HP_before+heal−100))。正解後comboを使う。**bonus**＝round(P×0.10×cur.oj)、total=P+bonus。途中で到着した未配置カードは含めない。
- E/N基本枚数6/9、最大12、妨害上限6/3。通常カードと見た目を分けない。正解後の持越しojは1減り、全カードは次問用へ交換。誤答でも次問へ進むがoj減少は正解だけ。
- 正解combo1/2/3/4以上の攻撃0/1/2/3枚。最初の到着からcounter3秒、追加で延長なし。受付中に今回発生した攻撃から相殺し余剰だけ送信。受付期限後のカードは次盤面へ。判定は`counterUntil>now`で、ちょうど期限では相殺しない。
- コンボ10秒は新問操作可能から。`comboDue<time`で切れるので、ちょうど10秒は保持。誤答/timeoutで0。凍結中はcomboDue/counterUntilを延長して残時間を保持する。
- ゲージは1combo目0、2combo目からlevel×3、100で自動FREEZE3秒・0に戻す。超過持越しなし。相手凍結中は100保持、解除後に別の3秒を発動。
- FREEZE中は操作/数式DOMなし。試合時間・問題20秒・自然HPは進み、combo/counterだけ停止。
- Eミス−20、N−25、timeout追加E0/N−5。HP計算は共通時刻へadvanceし、自然KO→期限→時間効果の順、同じ確定段階の両者KOは引分。
- 観戦応援は10pt×3回（UIDとaccount両方で制限）、30保持、次盤面で1枚除去、試合全体最大3枚。余剰ptなし、妨害0時は30保持。本人/参加account応援を拒否し、同じseq再送を重複加算しない。
- 2〜4人のルームでは生存者が1人以下になった時点でKO決着。期限時は生存者の得点で順位を決める。2人戦の同時KOルールを4人途中脱落へそのまま拡張しない。

根拠：[server/online-rated/b2.cjs:7・`function board`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/server/online-rated/b2.cjs#L7)、[server/online-rated/b2.cjs:45・`function advance`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/server/online-rated/b2.cjs#L45)、[server/online-rated/b2.cjs:72・`function step`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/server/online-rated/b2.cjs#L72)、[src/b2-pump.cjs:3・`function pump`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/src/b2-pump.cjs#L3)。テスト：`b2.test.cjs`、`v524-browser.cjs`、`v524-emulator.cjs`。

## 7. 旧B/C・CPU・ハンデの詳細

旧Bの攻撃はcombo≥3でmin(8,2×(combo−2))ダメージ、5comboごと+5、Perfectでお邪魔1。1お邪魔=相殺5単位、予告3秒・7秒で強制着弾、盤面追加最大3。HP≤30で攻撃1.3倍、3人生存0.7倍/4人0.55倍。必殺ゲージ0〜6、正解+1、Perfect/Excellentは追加+1。大攻撃15ダメージ＋1枚、回復30、shield5秒。

ハンデ★0〜3：受ける減少×(1−0.15h)、Aロックmax(500,2000−500h)、A得点×(1+0.1h)。新Bへ無条件に同じ倍率を追加しない。

C合体は双方combo≥3・相方正解から3秒以内・共通cooldown8秒、攻撃10+1枚。仲間ミス後3秒は攻撃1.2倍。チームHP差分は300msまたは一定量でtransaction集約する。

CPU時間はweak=7+1.3Lv秒/ミス25%、normal=4+0.9Lv/12%、strong=2.2+0.5Lv/5%。乱数揺れなど実際の予定生成は`CpuBots`を確認する。オンラインBOT/学習ゴーストと同一の定数ではない。

根拠：[index.html:7687・`function attackFor`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L7687)、[index.html:7378・`const C_UNITE`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L7378)、[index.html:7387・`const handiDmgMul`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L7387)、[index.html:7390・`const CPU_LEVELS`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L7390)。

## 8. レイド・週間・大会の追加規則

raidDamage＝round(Lv点×判定倍率×(1+0.05×min(10,正解前combo)))。判定倍率Perfect1.5/Excellent1.3/Great1.1/他1。別途、弱点・役割・チェイン・週ルール・ギミックの倍率を適用する。

クラス/フレンドは部位HP=全体HPの15%、部位破壊ボーナス8%、総攻撃1回6%、ゲージ基準max(10,参加記録人数×3)。共有正解数に基づいて総攻撃回数を算出。基本弱点開始20秒/周期45秒/15秒間、基本反撃35秒/周期40秒/予告4秒/しびれ3秒、ボスごとに上書き。先生ボスは独立の妨害/回復操作を持つ。

7役割：atk攻撃1、sup0.4＋6ゲージで10秒1.3倍/しびれ救済、grd0.6＋予告中正解でバリア、brk本体0.5・part6（説明は部位3倍、倍率の適用元を参照）、tch0.8＋救援問2倍/コンボ復元、tk0.8＋Perfect2秒（上限60秒）、gmb3倍/Lv7〜9/ミスしびれ4秒。

週間HP=round(30000×boss.hpK×1.2^rage)。未討伐なら同ボス継続でrage最大2、討伐報酬倍率1/1.5/2。週キーはJST月曜。週ルールはPerfect2倍、combo5以上1.5倍、Lv5以上1.5/以下0.7、Lv7=3倍、90秒、宝箱出現率増の6種。出撃の初日EXPは2倍。報酬詳細は06。

ボス15種の定義/特性（dragon/kraken/golem/maou/slime/robot/abs/balance/mod/wave/chimera/prime/sim/mirror/king）とteacherを確認する。通常6種は弱点・部位・反撃・変身、追加9種は`useBossGim`のmod/回転/連立等を共有する。数字や演出を全モードで同じと決めず`WK_WEAK/WK_CTR`とクラスscheduleの上書きを優先する。

大会は単敗T、またはSwiss予選勝3/引分1/負0→OMW→OOMW→安定ハッシュ順。再戦回避/不戦勝を配慮し、予選終了は全勝者≤1またはceil(log2人数)+3回。決勝同点の抽選/上位シードは`tourWinner`と方式分岐で確認する。

根拠：[index.html:4481・`const raidDamage`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L4481)、[index.html:4653・`function raidCalc`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L4653)、[index.html:4465・`const ROLES`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L4465)、[index.html:4434・`const BOSS_TRAITS`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L4434)、[index.html:6071・`function useBossGim`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L6071)、[index.html:5467・`function weeklyInfo`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L5467)、[index.html:10695・`function swissStandings`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L10695)。

途中退出・切断・報酬確定の違いは[オンライン](05_ONLINE_SYSTEM.md)、[保存](04_DATA_AND_FIREBASE.md)、[リザルト](16_RESULT_SCREEN_COMPARISON.md)を参照。全方式・全人数・全役割の長時間実機試験を今回実施したわけではない。

[総合案内へ](00_START_HERE.md)
