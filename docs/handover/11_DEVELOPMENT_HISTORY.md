# Codex担当期の開発履歴

対象範囲はGit上の塔第1章分離から5584885。前史の5.9以前もGitにあるが、作者の担当範囲をcommit名から推測して拡張しない。以下の理由はcommit差分/既存報告書の要旨。過去文書の将来案を実装済みにしない。日付の代わりに不変SHAと正式版を基準とする。

|コミット|変更|主要ファイル群|理由・互換性|
|---|---|---|---|
|[ad819e6](https://github.com/asumax1128/factorfactor/commit/ad819e6)|塔第1章試遊の分離追加|math-tower-core/store、src/math-tower-ui、policy/content|既存通常ゲームから専用保存/認可へ分離|
|[3f7a7cb](https://github.com/asumax1128/factorfactor/commit/3f7a7cb)|塔ルールEmulator・非公開review準備|firebase/math-tower、tests、docs|初期は一般公開/本番操作を保留|
|[520bd7a](https://github.com/asumax1128/factorfactor/commit/520bd7a)|本番ルールの監査・先生権限案|scripts/audit-math-tower-rules、reports|祖先権限・現行snapshotとの互換性|
|[fbbc763](https://github.com/asumax1128/factorfactor/commit/fbbc763)|本番統合・条件付きPages|workflow/build-pages、store/UI|素材配信方針の更新、試遊grantは維持|
|[9597af4](https://github.com/asumax1128/factorfactor/commit/9597af4)|塔の保存競合と全体mute|store/writer、game-audio|revision/直列化、音量状態を保持|
|[c426284](https://github.com/asumax1128/factorfactor/commit/c426284)|塔RPG演出と難易度別冒険|math-tower-core、src/math-tower-ui|E/N/H冒険の独立・旧保存退避|
|[42011a6](https://github.com/asumax1128/factorfactor/commit/42011a6)|塔数式/画像/勝利UI修正|src/math-tower-ui、CSS|文字切れ・画像・勝利演出。正式画面は旧5.9系|
|[9fa9ac3](https://github.com/asumax1128/factorfactor/commit/9fa9ac3)|塔の会話→戦闘導線|src/math-tower-ui、content|会話単位人物/次階復帰|
|[36e0123](https://github.com/asumax1128/factorfactor/commit/36e0123)|3階正式背景|imgの正式PNG、chapter1|青左・赤右を素材で一致|
|[f42dd04](https://github.com/asumax1128/factorfactor/commit/f42dd04)|Spark難易度別レート|online-spark-client、core/rules|旧値をEへ本人一回移行、N初期1500|
|[616200b](https://github.com/asumax1128/factorfactor/commit/616200b)|5.10 メニュー分離|index/UI/version|新レート入口とE掲載条件|
|[6faf135](https://github.com/asumax1128/factorfactor/commit/6faf135)|5.11 学習ゴースト・開催係|ghost/event-host modules/rules|Spark/限定権限、旧学習を再利用|
|[1d5b2a1](https://github.com/asumax1128/factorfactor/commit/1d5b2a1)|5.12 ゴースト復帰・開始/期限|online-spark-client/UI|reload/timeoutの回復|
|[4dce881](https://github.com/asumax1128/factorfactor/commit/4dce881)|5.13 タッチ入力復旧|shared BattleView/Board、state order|同期中入力解除・盤面作り直し防止|
|[42032d2](https://github.com/asumax1128/factorfactor/commit/42032d2)|5.14 UIと戦闘演出共有|combat helpers/UI/CSS|旧UI基準、結果後再入場、成績履歴順|
|[d7480dd](https://github.com/asumax1128/factorfactor/commit/d7480dd)|5.15 旧日本語フォント復元|FontImport/UI/CSS、design docs|Zen Maru 900を調査復元、数式保持|
|[d2cc1c6](https://github.com/asumax1128/factorfactor/commit/d2cc1c6)|5.16 drag-only復元|BattleBoard/new UI/tests|別々タップ回答を廃止、単独保持なし|
|[c95f8e6](https://github.com/asumax1128/factorfactor/commit/c95f8e6)|5.17 遅延・問題同期|online client/性能/順序|ローカル即時表示と公式確定を分離|
|[e03f3fc](https://github.com/asumax1128/factorfactor/commit/e03f3fc)|5.18 賞金首→成績|BattleMenuのwin状態|二重modalでなく単一状態へ遷移|
|[772c40e](https://github.com/asumax1128/factorfactor/commit/772c40e)|5.19 Chromebook互換|compat-play CSS/input tests|短い画面/倍率/タッチとマウスの到達性|
|[3ccf7ed](https://github.com/asumax1128/factorfactor/commit/3ccf7ed)|5.20 最高値とMASTERタイル|RatingHistory/Wardrobe|新旧履歴を参照、保存値は書き換えない|
|[48c0e90](https://github.com/asumax1128/factorfactor/commit/48c0e90)|5.21 ゴーストのみ履歴保持|RatingHistory/tests|人間0戦でもghostの歴代を除外しない|
|[2744b45](https://github.com/asumax1128/factorfactor/commit/2744b45)|5.22 現在値整合/整数表示|RatingDisplay/CurrentRatings|E/N保存元と季節補正を共通利用|
|[4b1574b](https://github.com/asumax1128/factorfactor/commit/4b1574b)|5.23 公平開始・A詳細・自己練習・MASTER FX|UI/engine/a-result/Wardrobe|開始前DOMなし、自己無報酬、歴代達成|
|[debd263](https://github.com/asumax1128/factorfactor/commit/debd263)|5.24準備 新B/日次/報酬監査|b2/daily/hyper、reports、candidate rules|ソロ15/30/50・GAS連携、データ非破壊|
|[6536ebe](https://github.com/asumax1128/factorfactor/commit/6536ebe)|塔5hiddenと公開版照合|index/監査/C I|共有一覧87、取得/装備維持|
|[9119a6d](https://github.com/asumax1128/factorfactor/commit/9119a6d)|5.24公開停止|workflow|完全同点の認可境界確認のため配信を止める|
|[a110558](https://github.com/asumax1128/factorfactor/commit/a110558)|5.25 日次同点/TOP10補正|daily-model/client/rules/tests|forEach戻り値と最終account tie順|
|[baf7f3a](https://github.com/asumax1128/factorfactor/commit/baf7f3a)|5.25 観戦応援の本人枠|b2/pump/room-client/rules|UID/account上限、無効入力で処理を止めない|
|[e875d16](https://github.com/asumax1128/factorfactor/commit/e875d16)|5.25 SDK結果表示待機|tests/online-spark-emulator、docs|1/15→1問と確定点/seq、ゲーム本体変更なし|
|[5584885](https://github.com/asumax1128/factorfactor/commit/5584885)|5.25 ghost fixture整合・正式公開|tests/ghost-emulator、docs|games3=d3、認可維持、最終CI成功|

## 重要な設計判断

- Spark継続のため現行ブラウザはRTDB client方式。初期のFunctionsサービス案と別。
- 旧ratingを消してE/Nを新規1500へリセットせず、本人一回移行/backup。最高値表示は読み取り合成。
- 旧CPU/C/大会と新BをrulesVersion/rulesで分離。数学の共通部分は抽出し別ルールを作らない。
- 自己ゴーストはすべての報酬・公開学習・通知に練習ガード。
- 塔は旧TowerAppと別の先生試遊として進め、revision移行と画像/物語を保全。公開素材と私有記録を区別。
- 5.24は未配信。5.25のルール候補は所有者のConsole公開を経た記録があり、今回再取得・再公開していない。
- UI/数学コメントの内部ver7/8.4と正式version.jsonを区別。

## 解決と残課題

解決済みは上表の差分と[成功CI](https://github.com/asumax1128/factorfactor/actions/runs/38611955199)。直前の2件は本体バグではなくテスト条件/fixtureの不整合だった。テストを無効化せず修正した。

残課題は[10](10_KNOWN_ISSUES.md)。旧実績の条件不一致、旧B説明、新B/日次結果情報、GAS配送、クライアント信頼境界、実機未確認は「公開障害なし」と別概念。過去のChromebook CI一度失敗の原因は未確定で、実装を推測修正しない。

詳細証拠：[CHANGELOG](../../CHANGELOG.md)、[5.25統合記録](../v524-integration.md)、[過去レート引継ぎ](../online-difficulty-rating-handoff.md)、[reports](../../reports)。同じ説明を本書へ全複製しない。

[総合案内へ](00_START_HERE.md)
