# UI・画像・音声・端末

## 共通UIと専用UI

|用途|部品/スタイル|参照|
|---|---|---|
|旧ホーム/メニュー/白いカード|Card/BigBtn/Seg/V7Modal、indexのv7変数|[index.html:8018・`function Card`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L8018)、[index.html:560・`function V7Modal`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L560)|
|通常ソロ|FactorHuntのv7-battle/v7-main/独自pointer処理|[index.html:2366・`const onTilePointerDown`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L2366)|
|CPU/旧ルーム/新オンラインの戦闘|BattleSurface/TargetCard/BattleBoard/HpBar/v7Stat|[index.html:9738・`function BattleSurface`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L9738)、[index.html:7904・`function BattleBoard`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L7904)|
|新レート/新daily/newB room|OnlineRatedFactory.BattleView/Result、or-*|[src/online-rated-ui.jsx:50・`function BattleView`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/src/online-rated-ui.jsx#L50)|
|現行塔|MathTowerFactory、Story/TowerTarget/MagicAttack/Victory/Book、mt-*|[src/math-tower-ui.jsx:365・`function TowerTarget`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/src/math-tower-ui.jsx#L365)|
|数式|MathText/fxm、KaTeX_Main/KaTeX_Mathローカルfont|[index.html:667・`function MathText`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L667)|
|演出|TimingJudgment/ComboDisplay/CombatFX/FxLayer、Tower専用魔法|[index.html:3131・`function TimingJudgment`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L3131)|

旧UI基準は[正式デザイン基準](../ui-reference/design-standard.md)と[比較画像](../ui-reference/factorfactor_font_ui_comparison.jpg)。フォント・色・余白の正本を新設せず再利用する。

## 文字と色

UIはZen Maru Gothic/Hiragino Maru Gothic ProN/Yu Gothic、見出し/ボタン900、補助700、通常UI500。旧本文はZen Kaku Gothic Newも残る。戦闘数値/英語FXはRusso One。数式はKaTeX_Main・Math italic、400。FontImportのGoogle Fontsが失敗すればフォールバックする。

通常背景#F5F2EC、カード白、文字#1D2633、補助#6F7785、線#E4DED3、アクセント#E4572E。旧難易度の緑/黄/赤とDIFFICULTY_CONFIGの実色は別定義が残る。監査で勝手に一括置換しない。戦闘の紺色・白枠・金色をメニュー色へ統一する要件ではない。

問題・因数カード・数学記号は数式用要素に限定する。UIの全要素`*`にfont-family/font-weightを指定しない。モード名は表示だけイージー/ノーマル/ハード、保存IDはeasy/normal/hard。

根拠：[index.html:7316・`function FontImport`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L7316)、[index.html:929・`const DIFFICULTY_CONFIG`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L929)、[online-rated.css:2・`.or-app`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/online-rated.css#L2)。

## 入力と画面幅

BattleBoardはpointerdown→move→up/cancel、座標はgetBoundingClientRect/elementFromPointを用いる。pointerType touch/mouse双方を扱い、タイル内のtouch-actionとpreventDefaultでスクロール競合を避ける。通常のtapSelect既定false。単独/別々タップでは回答せず、無効な場所で離すと解除。ソロは似た別handlerなので「全モードの入力が完全に同じ関数」とは書かない。

小高さ/拡大時はcompat-play/fx-scrollで盤面/問題へ到達できるスクロールを確保する。body全体ロックを残す箇所もあり、モーダル/専用塔/新dailyの各ルートで影響を分けて調べる。CSS viewport/dvh・min-height・safe areaはクラスを確認して改修する。

キーボードは名前入力やブラウザ標準のbutton操作に使えるが、全因数カードをキーボードだけで結ぶ同等操作は確認できていない。開始/FREEZE中のinert/aria-hiddenとDOM非表示は維持する。

根拠：[index.html:7904・`function BattleBoard`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L7904)、[index.html:312・`.compat-play`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L312)、[src/online-rated-ui.jsx:228・`inert={counting`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/src/online-rated-ui.jsx#L228)、[src/math-tower-ui.jsx:23・`function Story`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/src/math-tower-ui.jsx#L23)。

## アセット台帳・参照方式

|場所|用途・参照|注意|
|---|---|---|
|math-tower/chapter1.json|背景7、人物8/敵5、会話13、notes5、policy、image data URI等|JSON内の埋込画像は公開配信される。値を仕様書へ大量コピーしない|
|img/math-tower-floor3-official-d81d75734c05.png|現行塔の3階正式背景、青左/赤右|file名hashとcropを保持|
|suri-data.js|旧塔の背景/人物/設定/画像等|SURI_DATA/suriImgで動的参照。未参照と即断しない|
|img/monsters/*.webp|旧boss/icon。idとid+'2'で変身画像|maou2/king2等は動的。画像が独立きせかえではない|
|img/icon-180/192/512.png|manifest/iOSアイコン|standalone表示用|
|fonts/katex/*.woff2|KaTeX_Main-Regular、KaTeX_Math-Italic|ライセンス同梱、UIフォント変更対象外|
|index内data URI|ゲームBGM/成功/失敗/level/combo/結果音など|HTML容量が大きい。source行をそのままログへdumpしない|
|CSS/skin定義|きせかえ37点、グラデーション/枠/色|この37点は画像ファイル依存なし|
|reports/images/|過去のUI比較・検証画像|当時の版の証拠、現行実機確認とは別|

根拠：[index.html:6181・`function MonsterPic`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L6181)、[index.html:4478・`const bossForm`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/index.html#L4478)、[math-tower-release.js:2・`MathTowerContentUrl`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/math-tower-release.js#L2)、[manifest.webmanifest:14・`"icons"`](https://github.com/asumax1128/factorfactor/blob/558488543e104460a35a8902c22e682c5c46f766/manifest.webmanifest#L14)。画像全件の既存監査は[報告書](../../reports/titles_achievements_cosmetics_audit.md)。人物の埋込画像も含むため、静的なファイル名grepだけでは利用の有無を判定できない。

## 演出・音・端末

- 共通カード合体/正解光/ダメージ/コンボと、塔固有の魔法・物語・ランク演出は役割が違う。共通化する場合も表示契約だけに留め、計算順・入力を止める時間を変えない。
- GameAudioとuseGameMute、Tone unlock、ResultBgm等が併存。mute/メニュー音/結果BGM/reduced motionの組合せは一律でない。実音・OS音量は今回未確認。
- スマホ/タブレット/PC/ハイブリッドタッチは既存テストで対象。Chromebook倍率は有効viewportの縮小＋DPR/文字サイズ模擬であり、ChromeOSの本体表示設定の完全再現ではない。
- manifestはstandalone/fullscreen優先・orientation any。manifestだけで完全offline/PWAキャッシュ動作を保証しない。
- `maximum-scale=1,user-scalable=no`がHTML/ソロeffectにある。アクセシビリティ改善案であり今回変更しない。

確認基準と実機手順：[Chromebook確認](../ui-reference/chromebook-check.md)。今回ブラウザ起動・新規撮影はなし。全画面の実表示は未確認。[画面台帳](15_UI_SCREEN_INVENTORY.md)、[UI監査](17_UI_UX_AUDIT_AND_REDESIGN.md)へ。

[総合案内へ](00_START_HERE.md)
