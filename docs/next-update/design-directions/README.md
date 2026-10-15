# ホーム画面のデザイン方向性 A / B / C

**前回のUIレビュー案は不採用。今回はホーム画面のみを使う新しい比較案であり、実ゲームには未反映。** 所有者がBの方向性を正式基準に選択したが、初稿の完成承認ではない。最新版は[B案改良版4画面](../design-b-refined/README.md)。main・本番Firebase・公開版・数式フォント・ゲームロジックは変更しない。

## 6枚の比較画像

|案|スマートフォン 390px|PC 1440px|
|---|---|---|
|A 現行世界観を尊重した進化版|[スマホ画像](home-a-mobile.png)|[PC画像](home-a-pc.png)|
|B eスポーツ・競技ゲーム風|[スマホ画像](home-b-mobile.png)|[PC画像](home-b-pc.png)|
|C 日本製RPGメニュー風|[スマホ画像](home-c-mobile.png)|[PC画像](home-c-pc.png)|

全案で同じ5つの機能（オンライン対戦、ソロモード、デイリーミッション、ランキング、あそびかた）と、本人情報・E/Nレート・レベル・音/設定を提示する。データは全て例示。PCだけ既存ボス画像を装飾に使う案があるが、追加機能ではない。先生専用機能は権限依存のままにする。

## 色を変えるだけではない構成差

|項目|A 現行進化|B 競技ゲーム|C RPGメニュー|
|---|---|---|---|
|レイアウト|中央ロゴ＋立体的なステージ選択ボタン。PCは右にボスpanel|PCは左サイドバー＋主役2アクション。スマホは主役2アクションを縦積み|章扉風の中央ロゴ＋ステータス窓＋縦のコマンド一覧。PC右は敵の立ち絵|
|見出し|Dela Gothic One。輪郭が太く、圧縮されたゲームらしい和文|Zen Kaku Gothic New Black。角を揃えた強い和文|Shippori Mincho Bold。和製RPGを意識した明朝と字間|
|メニュー/本文|Zen Maru Gothic Boldで既存との連続性を残す|主メニューはZen Kaku Gothic New Black、補助は丸ゴシックを併用|メニューは明朝、説明文はZen Maru Gothic Boldで可読性を確保|
|数字|Rajdhani Bold。Lv/レートは独立した数字用書体|同左。縦長の数値と左右揃えで競技情報を強調|同左。古風なメニューでも数値を読み取りやすく保つ|
|色|薄い方眼＋朱色/濃紺の2主色。金色はミッションの補助|黒に近い紺＋青緑。副アクションのみ青。勝敗色を常用しない|深紺＋くすんだ金。立ち絵の色を引き立てる|
|背景|現行の明るい雰囲気を保ち、濃い操作ボタンでメリハリ|暗いフラット面、細い境界、斜めカットと大きいアイコン|暗い奥行き、二重枠、控えめな幾何装飾|
|ボタン|押下の段差が分かる立体型|角の切り欠きとラインで領域を分ける大型アクション|枠内のコマンド選択。選択行に金のカーソル帯|
|アイコン|同じ線画SVGを丸い操作面に配置|同じSVGを大きい輪郭/小さいナビで使い分け|同じSVGを金色の細い線で統一|
|スマホ|主要2ボタン＋ミッション＋補助2列。PCのボス装飾は省略|サイドバーを撤去し、重要2アクションを優先|縦コマンドを大きく保ち、立ち絵を省略|

抽象的なキャッチコピーは追加していない。ページ名・ボタン名は機能名を使う。絵文字やチェス記号は使用せず、操作アイコンは自作の同一SVG線画セットで統一した。

## タイトル画像と既存素材

`title-original.png`は現行`index.html`の`window.__FXF_ASSETS.LOGO_DATA_URI`をbase64デコードした**同一PNG**。画像の描き直し、再圧縮、色変更、切抜き、フィルターはなし。3案とも同じファイルを参照する。

- サイズ：688×371、38,831 bytes。
- SHA-256：`84a26236efacceac85b9ccea4a0ab088ee4c71ff9176edf92e7431c6ac0d60f2`。
- B/Cの暗い背景では元の黒い輪郭を保つため、画像の背後に明るいプレートを置く。PNG自体は変更しない。
- ドラゴンは既存`img/monsters/dragon.webp`をそのまま参照。新しい画像生成や塔の一般公開はしていない。

## フォントのライセンス・容量・読み込み

全5書体はGoogle Fonts公式リポジトリのOFL配布を取得。SIL Open Font License 1.1の本文/著作権表示をfonts/OFL-*.txtへ同梱。プロトタイプ固定文言だけを含むWOFFへサブセット化し、変更版のfont familyはReview*へ変更した。元ファイルとサブセットのSHA-256はfonts/manifest.jsonに記録する。

|役割|配布元|レビュー用WOFF|
|---|---|---:|
|A見出し|[Dela Gothic One](https://github.com/google/fonts/tree/main/ofl/delagothicone)|29,324 bytes|
|共通補助/A本文|[Zen Maru Gothic](https://github.com/google/fonts/tree/main/ofl/zenmarugothic)|36,524 bytes|
|B主文字|[Zen Kaku Gothic New](https://github.com/google/fonts/tree/main/ofl/zenkakugothicnew)|28,732 bytes|
|C主文字|[Shippori Mincho](https://github.com/google/fonts/tree/main/ofl/shipporimincho)|48,620 bytes|
|数字|[Rajdhani](https://github.com/google/fonts/tree/main/ofl/rajdhani)|11,620 bytes|

1案で使う3書体の合計はA 77,468 bytes、B 76,876 bytes、C 96,764 bytes。CSSで宣言しても未使用の書体は通常取得しない。`font-display:swap`、同一配信元、固定weightを使用。スクリーンショットでは実ファイルを読み込み、フォールバックだけの画像にはしていない。

**これらのサブセットはプロトタイプ用**であり、未収録の日本語を含む本番へそのまま移植しない。方向性選択後に全画面の必要文字、欠損字フォールバック、自己配信の分割WOFF2/キャッシュ、初回/再訪の転送量を設計する。実際の低速回線・Chromebook性能は未計測。数式用KaTeXフォントには一切適用しない。

## 検証したこと・していないこと

- Chromiumを再利用し、各案390×844と1440×1000を撮影。320/768pxも横overflowを検査。
- フォント実読み込み、元タイトル画像decode、メニューボタン→レビュー用dialog、Escape/フォーカス復帰、JSエラーなしを確認。
- タッチ操作の対象は大きいbutton。マウス/keyboard focus、reduced-motionへ配慮。
- 外部リクエストを全遮断し、ローカルHTML/CSS/フォント/画像だけで撮影。Firebase SDKや本番データは使わない。
- Safari/ChromeOS/Windows実機、全画面リザルト、実ゲーム操作・得点/通信はこのデザイン案では検証していない。
- 既存のゲーム回帰は再実行していない（変更はレビュー資料のみ）。

結果はchecks.json。[capture.cjs](capture.cjs)で同じ撮影とチェックを再現できる。実行はプロジェクトrootで`node docs/next-update/design-directions/capture.cjs`。ブラウザ変更時はCHROMIUM_PATHを指定する。依存の追加インストールは行っていない。

## 選択後に進めること

選ばれた案を基準に、バトル・結果・観戦・称号の代表画面へ展開する。今回、ホーム以外の新UIを先行実装しない。リザルトの情報構造/グラフ方針は維持し、勝敗・スコア・レート増減の演出は選択案に合わせて別途レビューする。

UI方向性の承認はmain統合/本番移行/公開の承認ではない。未承認のまま実アプリへ接続しない。
