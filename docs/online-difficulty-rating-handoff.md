# オンライン難易度別レート：引き継ぎ

**現行方針（Ver.5.12）**：以下の初期監査記録は過去の設計。現在は所有者承認済みのSpark版を公開し、旧rating→EASY/NORMAL1500の一度限り移行を維持。EASY掲載1501以上、NORMAL人間3戦、乱入戦は別集計。Functions/Blazeは使用しない。[現在の実装・認可・公開報告](../reports/2026-10-13_ghost-host-v511.md)と[正式バージョン運用](game-version-policy.md)を優先する。次回公開は5.13。

詳細仕様案は[online-difficulty-rating-plan.md](online-difficulty-rating-plan.md)、監査結果は[調査報告](../reports/2026-10-13_online-rating-investigation.md)。設計ブランチのみで、オンライン本番変更の承認はまだ得ていない。

- 数学の塔の3件はmain `9fa9ac3`で実装。オンラインの製品コードは`42011a6`と同じ。
- statsの子に新レートを置かない。上位writeの許可を子write:falseでは取り消せない。`online-rating-audit.cjs`は実エミュレータでこの誤設計を再現する。
- 既存recordMatchはdiff/matchIdを持たず、同じinfoの再送を排除できない。新rated戦からこの関数へそのまま二重送信しない。信頼できるサーバーの確定台帳と両者の原子的更新が必要。
- クライアントの任意result/dr/HPを新レートの根拠にしない。UIDとaccountKey、難易度とprotocol、問題選択/戦闘結果を検証する。
- 旧レート保存＋新各1500、各3戦でランキング掲載、5称号、CPU等の対象外は未承認の案。既存stats/旧称号を勝手に削除・変更しない。
- 管理接続なし。最新本番ルール・レコード構造/件数・別途の完全履歴・料金プランを確認する必要がある。合言葉や秘密鍵をチャットへ要求しない。
- 本番Firebase変更/移行/新課金サービス/オンライン公開をこの監査コミットから実行しない。サーバー検証と新クライアントの混在テストが通過してから、承認済みの範囲で段階公開する。

監査の起動は既存demoエミュレータで、`RTDB_RULES_BASELINE_FILE`を指定して`node scripts/run-math-tower-rules.cjs rating-audit`。新仕様の安全性テストではなく、旧実装の問題を記録する監査なので、将来の改善で拒否が正しくなった場合は期待値を見直す。常設CIに旧脆弱性の許可を要求するテストとして追加しない。


## Ver.5.15 日本語UIフォント基準

正式なデザイン基準は [UIデザイン基準](ui-reference/design-standard.md)および `docs/ui-reference/design-standard.md`。比較画像原本は `docs/ui-reference/factorfactor_font_ui_comparison.jpg`。旧42011a6の画面Ver.5.9、Zen Maru Gothic 500/700/900、共有FontImportを確認した。新オンラインのFontImport欠落を補い、見出し/ボタン900へ統一。数式/KaTeX/MathText、ソロ/CPU/塔のルール、Firebaseの記録・認可は変更なし。次の通常公開はVer.5.16。新機能にも共通フォントを必ず読み込み、数式へUIフォントを上書きしない。
