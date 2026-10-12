# 第1章：PC・iPhoneローカル試遊準備（2026-10-13）

## 提供方式

このCodex環境には、ユーザーのブラウザへ公開できる開発プレビューURL/ポート転送機能がない。環境内localhostをユーザーPCのURLとして案内しない。代替として、既存の非公開保管repo factorから取得できるWindows用ローカル試遊ZIPを作成した。PC上のPythonサーバーで起動し、同じ信頼できるWi-Fi上のiPhone Safariから利用する。ネット上の公開・新サイト・新サービス・課金を行わない。

入室前には原稿・画像・全ゲームJSを配信しない。起動時にランダムな入室コードとセッションを生成、HttpOnly/SameSite=Strict cookieを使用する。ディレクトリ一覧・ルート外の取得・別Originからのログインを拒否。LANのHTTPなので通信暗号化はない。公衆Wi-Fi、公開トンネル、ルーターのポート転送は使用しない。外部の恒常的なテストサイトが必要なら別承認後、HTTPSとサーバー側の本人/先生認証を備える設計が必要。

## UI変更

- 第1階準備に6枚から2枚をドラッグでつなぐ操作説明を追加。
- 第5階準備と戦闘画面にヌルの誤答2倍と実ダメージ値を明示。時間切れは通常値であることも準備画面に明示。
- HARD通常階の準備にLv8条件を示し、敵HP0で条件未達なら戦闘画面にも理由を表示。HPバーは0をそのまま表示。
- 塔のCSS内だけで数式文字を22〜32px、タイル高さ64px以上、操作ボタン44px以上とし、スマホ縦画面の敵表示/余白を調整。
- 問題生成・正誤判定は既存エンジンのまま。policy・HP/敵耐久/コンボ/ランク/Lv上限の数値は変更していない。

## ローカル保存・制限

Firebase SDKを同梱せずテストダブルで架空の先生UID/accountKey/grantを用いる。認可は本番検証と別で、実際の先生資格は確認しない。保存は各ブラウザlocalStorageの専用名前空間だけ。PC/iPhone間の同期、Firebase再ログイン/保存、本番ランキング等は試せない。外部通信はCSP connect-src noneとローカル依存ライブラリで遮断。原稿/画像の元JSONとの完全一致も確認した。

本番Firebase、main、既存Pages、旧devに変更はない。公開checkoutには生成スクリプト・汎用サーバー/モック・テスト・UI改善・記録だけを追加し、非公開配布ZIPとコンテンツはGit外/非公開保管先に置く。

## 検証

- 実HTTPサーバー＋実配布パッケージ：ログイン、入室前JS/原稿拒否、誤コード拒否、パストラバーサル拒否、別Originログイン拒否。
- Chromium390×844：NORMAL1〜5階完走、誤答、ポーズ/再開、localStorage保存/再読み込み、HARDのHP0説明とLv8撃破。
- Chromiumのネイティブタッチイベントでドラッグ回答。6タイルが画面内、44px以上の幅/64px以上の高さ、横はみ出しなし。
- パッケージから外部HTTP通信なし、ページエラーなし。
- PC1366×768の起動とマウス回答を別smokeで確認。
- 従来の塔ブラウザ23項目（E/N/H、時間切れ・敗北・再挑戦・図鑑/保存等）、コア/保存8項目通過。
- 既存共有230関数AST一致、ソロ/学び/CPU/週レイド/daily回帰通過。

実機Windows/iPhone・Safari/音は未検証。Chromiumタッチ検証をiPhone実機通過と表現しない。本番Firebase接続/端末同期はこの試遊の対象外。本番認可は前回のエミュレータ統合監査結果を参照。

## 再生成・再検証

```sh
npm run build:tower
node scripts/build-math-tower-local-play.cjs /非公開/chapter1-content.json /Git外/配布先
MATH_TOWER_LOCAL_PLAY=/Git外/配布先 node tests/math-tower-local-play.cjs
MATH_TOWER_LOCAL_PLAY=/Git外/配布先 node tests/math-tower-local-play.cjs --pc-smoke
```

ZIPのREADMEにWindowsのPython導入・起動、入室、ipconfig/iPhoneからの接続、ファイアウォール、チェックリストを収録。入室コードは生成物/コミットへ埋め込まない。
