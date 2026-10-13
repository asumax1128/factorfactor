# FACTOR×FACTOR UIデザイン基準

正式な基準は画面表示Ver.5.9以前。画像の類似フォントを推測せず、Gitの `42011a6:index.html`（画面に `ver.5.9` と表示）を確認した。内部コメントのver.7/ver.8.4は正式版番号ではない。版番号は今後もversion.jsonのみを使用する。

[所有者提供の旧UI／Ver.5.14比較画像](factorfactor_font_ui_comparison.jpg)。原本を加工せず保存。左は正式な文字デザインの参照、右4画面は修正前の比較用であり新しい基準ではない。

## フォントの正式設定

旧実装の `:root`、`FontImport`、`BigBtn`、`Seg`、`.v7-name/.v7-cap/.v7-pill` を参照する。

```css
--v7-f-ui: "Zen Maru Gothic", "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif;
--v7-f-fx: "Russo One", "Zen Maru Gothic", sans-serif;
```

- 日本語の名前・見出し・主要ボタン：`var(--v7-f-ui)`、900。旧BigBtnも900。700は小さなラベル、補足、ピル。通常の丸いUI文は500。800の独自指定で旧900を代用しない。
- 旧メニューの本文基盤：`Zen Kaku Gothic New, sans-serif`。400/500、強調700/900。既存の適切な本文指定は一括置換しない。新オンラインは丸いUIファミリー500を基盤とし、見出し/ボタン900・補足700へ揃える。
- 数字・英語の戦闘演出：既存の`--v7-f-fx`を継続。`.v7-st b`は22px/400、HPやCOMBOも既存コンポーネントを利用し、数学の数字とは区別する。
- 旧Webフォントは`FontImport`のCSS `@import`で読み込む。新しい独立画面も必ず共有`FontImport`をマウントし、画面遷移で旧メニューが外れた後も読み込みを維持する。

```text
https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@500;700;900&family=Zen+Kaku+Gothic+New:wght@400;500;700;900&family=Russo+One&display=swap
```

Google FontsのCSS/フォント取得は利用者の通信環境に依存する。読み込み不能時は上記の旧フォールバックを使用する。代替フォントの太さ検証と実Webフォントの読み込み検証を混同しない。

## 文字・配置・色

既存の`.v7-*`、Card、BigBtn、Seg、V7Modalを優先。通常見出し18px/900、主見出し22〜24px/900、主要ボタン15〜18px/900、小ラベル10〜13px/700。本文は読みやすい行高を維持し、スマホで横に長い文章を固定幅にしない。プレイヤー名や説明は折り返し、操作ボタンは44px以上を基本とする。戦闘は問題/カードの操作領域を優先し、完成済みHUDを再利用する。

正式トークンはindex.htmlの`:root`。背景#F5F2EC、カード#FFFFFF、文字#1D2633、補足#6F7785、境界#E4DED3。アクセント#E4572E、濃色#B5401F、淡色#FBE7DF。旧難易度色はイージー#3FA55F／ノーマル#E9A82A／ハード#DD4A3A。オンラインの既存の緑/黄の難易度境界は今回変更しない。

旧ボタンは角丸12px、ピルは999px、白いカードは既存`.v7-panel`の設定。枠は1.5〜2px、押せるボタンの影は旧BigBtnの内側下3pxまたは`.v7-go`の下3px。余白は既存の14〜16pxを基準に、画面端のセーフエリアを保護する。戦闘の紺色ウィンドウ・白枠・金色アクセントはCPU練習のBattleSurfaceを継続し、メニュー色で上書きしない。

## 数式の保護（必須）

問題・因数カード・数学記号・変数はMathTextに渡す。`.fxm`はKaTeX_Main/Times New Roman/Cambria Math/serif、400、通常体。`.fxm-v`はKaTeX_Mathの斜体。既存の@font-face、指数、字間、行高、MathText/TargetCard/BattleBoard、数学の塔の数式処理を変更しない。

UI用の一括`*`指定、MathText内へのfont-family/font-weight上書き、因数カードの文字にUIフォントを直接適用する指定は禁止。新しいフォント指定はUI見出し/ラベル/操作ボタンへ限定する。実際の数式要素がUIフォントを継承しないことをcomputed styleと表示寸法で確認する。数字でも式の一部は数式フォントのまま。

## 新機能を追加する場合

1. この文書と旧コンポーネントを読み、共通FontImport/フォント変数/ボタン/カードを再利用する。
2. CSSは新機能のルートクラスへ限定する。既存のソロ/CPU/塔へ漏らさない。
3. UIだけの変更で通信・数学・判定・保存・認可を変更しない。数式をUI指定の対象にしない。
4. スマートフォン縦画面320/390/430pxとPC、フォント取得不能時のフォールバック、折り返し/ボタン幅/数式寸法を確認する。実機Safari未検証なら記載する。
5. version.jsonを公開1回につき1回進め、CHANGELOGとClaude引き継ぎを更新する。整数部分の更新だけ事前確認する。

Ver.5.15の修正：新オンラインで欠落していたFontImportを共有し、見出し/ボタンを旧900へ統一。ゴースト履歴と開催係の新規UIだけ丸いフォントを指定。既存ソロ/CPU/塔のフォント・数式・データは保持。
