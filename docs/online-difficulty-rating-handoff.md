# オンライン難易度別レート：引き継ぎ

詳細仕様案は[online-difficulty-rating-plan.md](online-difficulty-rating-plan.md)、監査結果は[調査報告](../reports/2026-10-13_online-rating-investigation.md)。設計ブランチのみで、オンライン本番変更の承認はまだ得ていない。

- 数学の塔の3件はmain `9fa9ac3`で実装。オンラインの製品コードは`42011a6`と同じ。
- statsの子に新レートを置かない。上位writeの許可を子write:falseでは取り消せない。`online-rating-audit.cjs`は実エミュレータでこの誤設計を再現する。
- 既存recordMatchはdiff/matchIdを持たず、同じinfoの再送を排除できない。新rated戦からこの関数へそのまま二重送信しない。信頼できるサーバーの確定台帳と両者の原子的更新が必要。
- クライアントの任意result/dr/HPを新レートの根拠にしない。UIDとaccountKey、難易度とprotocol、問題選択/戦闘結果を検証する。
- 旧レート保存＋新各1500、各3戦でランキング掲載、5称号、CPU等の対象外は未承認の案。既存stats/旧称号を勝手に削除・変更しない。
- 管理接続なし。最新本番ルール・レコード構造/件数・別途の完全履歴・料金プランを確認する必要がある。合言葉や秘密鍵をチャットへ要求しない。
- 本番Firebase変更/移行/新課金サービス/オンライン公開をこの監査コミットから実行しない。サーバー検証と新クライアントの混在テストが通過してから、承認済みの範囲で段階公開する。

監査の起動は既存demoエミュレータで、`RTDB_RULES_BASELINE_FILE`を指定して`node scripts/run-math-tower-rules.cjs rating-audit`。新仕様の安全性テストではなく、旧実装の問題を記録する監査なので、将来の改善で拒否が正しくなった場合は期待値を見直す。常設CIに旧脆弱性の許可を要求するテストとして追加しない。
