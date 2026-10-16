# B改良版・バランス型 UI正式仕様

対象コード：`78d39c2`（2026-10-16）。**承認された世界観・ホームを再設計しない。** ChatGPTがアートディレクションを担当し、Claudeは既存実装を再利用する。画面別の完成度・画像区分は[画面台帳](UI_SCREEN_STATUS_FOR_CLAUDE.md)。本書の数値は実装済みCSSから抽出した値で、全画面への適用完了を意味しない。

## 正式採用範囲

B改良版・競技ゲームUI。ダークネイビー＋青緑、PC左サイドバー、スマホ5項目固定ナビ、主要モード2列、大きな週間ボスを維持する。スマホは高さ約17.7％縮小のバランス型を採用。その後のHP表示追加を含む**現行CSSのカスケード**を実装の基準にする。レビュー時の高さを後から固定値へ置換しない。

ホームPC／スマホと正式ロゴは承認済み。プロフィール等の実装画像は確認資料であり、全サブ画面の最終承認を意味しない。週間Emulator戦闘画面は暫定で、正式な戦闘UIの基準にしない。

抽象的な広告文を足さず、ホーム／オンライン対戦／ソロモード等の機能名を使う。旧ベージュ・白カード案、A/C別案、不採用の初期レビューを採用し直さない。

## トークン・フォント

一次資料：[tokens.css](../../ui-next/tokens.css)（`.next-home`、`@font-face`）。CSS変数は`.next-home`内にスコープがある。portalへ出す際はスコープを維持する。

|用途|変数／実装値|
|---|---|
|背景／パネル|`--bg:#101720`／`--panel:#192430`|
|本文／補助文字|`--text:#e8f0f5`／`--muted:#9daebd`|
|アクセント／枠|`--accent:#72dfce`／`--line:#324354`|
|共通間隔／角丸／タッチ基準|`--next-gap:20px`／`--next-radius:8px`／`--next-touch:44px`|
|共通パネル／影|`--next-panel:#192b38`／`--next-shadow:0 8px 24px #0002`|
|見出し|`BHeading,'Yu Gothic',sans-serif`、ローカル`heading.woff`、weight900|
|本文|`BBody,'Yu Gothic',sans-serif`、`body.woff`、weight500|
|数値|`BNumber,sans-serif`、`number.woff`、weight700|

フォントは全て`font-display:swap`。[manifest](../../ui-next/fonts/manifest.json)にサイズ・SHA、同フォルダに`OFL-ZenKaku.txt`／`OFL-Rajdhani.txt`を保持する。外部フォントへの無断変更・ライセンス削除をしない。数式は既存TargetCard／BattleBoardの読みやすさと数学記法を維持し、見出しフォントを無差別に適用しない。

## 実装済みレイアウト値

根拠：[home.css](../../ui-next/home.css)。検索キーを表に示す。同ファイル後半に上書きがあるため、最初の定義だけを複製しない。

|対象／検索キー|PC標準|900px以下の最終適用値|
|---|---|---|
|`.app-shell`|`grid-template-columns:var(--nav) minmax(0,1fr)`、max-width1720px|block、sidebar非表示|
|`--nav`／`.sidebar`|228px、sticky top0、height100vh、padding30px 17px 22px|幅0、表示なし|
|`.page-shell`|max-width1390px、padding33px 38px 25px|max-width760px、padding17px 20px、下余白`calc(105px + env(safe-area-inset-bottom, 0px))`|
|`.page-header h1`|900 29px/1.5、letter-spacing .04em|25px|
|`.home-content`|`1fr 1.03fr`、gap21px|縦flex、gap17px|
|`.home-actions`|2段、gap19px|`1fr 1fr`の2列、gap12px|
|`.brand-slot img`／`.mobile-brand img`|表示幅165px、height auto|145px、height auto|
|`.boss-art img`|width94%、height320px、object-fit contain|最終height200px、width90%、transform none、contain|
|`.boss-stage`|min-height430px、radius8px、border #395762|最終min-height0。カード全体の高さ固定なし|
|`.boss-hp`|padding0 23px 10px、min-height40px、12px|padding0 19px 6px、min-height32px、11px|
|`.boss-details h2`|24px／line-height1.2|21px。折返しanywhere|
|`.hp-track`|height6px、背景#0b141e、border #3b5364、radius6px|共通。バー#72dfce、width変化 .25s|
|`.next-panel`|padding22px、radius8px、下間隔20px|padding17px|
|`.next-profile-columns`|2列、gap20px|1列、gap0|
|`.next-metrics`|auto-fit minmax(120px,1fr)、gap16px|2列、gap16px 12px|
|`.ranking-grid`／`.ranking-entry`|3列gap20px、min-height236px、padding26px|1列gap14px、min-height162px、padding20px|
|`.next-lobby-grid`|2列、gap0 22px|1列|

ブレークポイントは`min-width:1550px`（ページpadding38px 50px 30px等）、`901〜1150px`（nav200px、padding29px 26px 24px等）、`max-width:900px`（スマホナビ）、`max-width:360px`（左右14px・ロゴ132px等）。称号一覧は700px以下1列、きせかえは430px以下padding等を調整する。タブレット専用の別デザインは作らず、現行分岐と実操作で確認する。

## カード・ボタン・ナビ

- `.action-card`：padding24px、radius8px、border #456267、`linear-gradient(125deg,#283f45 0%,#1a2934 60%,#172330)`、左3pxアクセントと上部切欠き。ソロは#28394e→#1a2637、補助色#91b5e2。hoverはborder #6aa49f／translateY相当−2px。単なる塗り長方形へ戻さない。
- `.small-button`：min-height44px、padding9px 14px、radius4px、border #50757a。`.next-primary`：min-height48px、背景#73dfce、文字#09262b、padding12px 18px、radius5px。これは全buttonの保証値ではなく該当クラスの値。
- `.nav-item`：min-height49px、padding12px 13px、gap12px、13px。選択中はborder #315554、背景#224c474f→#21313c50、文字#98f2e1、左inset3pxアクセント。hover可能端末だけ背景#24384988／border #3d5564／translateX2px。
- `.bottom-nav`：fixed左右下0、5等分、z-index20、背景#121e2af5、上枠#425b69、padding`5px 7px calc(6px + env(safe-area-inset-bottom))`。項目min-height56px、文字10px、アイコン21px。ホーム・対戦・ソロ・順位・メニューを維持する。
- 共通focus-visibleは2pxアクセント＋offset5px。Wardrobeは3px＋offset3px。`prefers-reduced-motion:reduce`でtransition／animationを無効化する。
- SVGは`src/next-home-icons.json`を基本とし、線幅1.7、round端。見出しアイコンと絵文字・チェス記号を無秩序に混在させない。

## アセット・画面入口・再利用境界

正式ロゴ：[ui-next/logo-official.png](../../ui-next/logo-official.png)、RGBA1774×887（2:1）。SHA256 `f6f33fa07b4c9524d38d1884921276d91eca75f2a9c2bb73c11d9a0484537910`。**下段反転は仕様。一切加工・再生成しない。** srcを差し替えるための白い背景板も付けない。旧ロゴは差戻し用に残す。[原本確認](logo-final/README.md)。

ボス画像は`src/next-home-ui.jsx`から`bossForm`／`suriImg(boss.id)`を呼ぶ既存経路。静的な1体へ固定しない。読込エラー時は画像を隠す。HPは実データだけで、loading／preparing／error／denied／討伐状態を区別する。サンプルHPや推測順位で埋めない。

`src/next-ui.jsx`の`Frame`（タイトル変更時focus）、`Panel`、`Stat`、`MetricGrid`、`BackButton`を再利用する。`src/next-home-ui.jsx`の`Home`がロゴ・ナビ・共通シェル、`createProfile(H)`／`createLobby(H)`が既存処理の注入先。数学・得点・通信・認証を書き込む責務を共通見た目へ入れない。バトルではホーム固定ナビを持ち込まず盤面優先。

遷移の正本は`src/next-navigation.cjs`と`index.html/navigateNext`。`online→battle`、`rank→rankings`、`boss→raidw`。プロフィールは`from/fromArg`を保ち、許可された戻り先でなければhome。ランキング3一覧は総合へ戻り、総合はhomeへ戻る。helpキーはsoloへ`{menu:'help'}`付きで送る。画面IDだけを見て学び画面へ誤接続しない。

UIの境界は[開発引き継ぎ](CLAUDE_DEVELOPER_HANDOFF.md)参照。取得・装備条件、ランキング計算、レーティング保存値、ゲーム判定をCSS更新に合わせて変更しない。未統一画面は1画面ずつレビューして接続する。新しい正式画面案、フォント・配色・ロゴの変更はChatGPT側のデザイン確認と所有者承認が必要。
