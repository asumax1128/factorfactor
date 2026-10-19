# 公開失敗時に未公開バージョンが積み重なる件（公開後の改善課題）

記録日: 2026-10-19。Ver.6.1 公開の際に発生。公開CIの規則・検証は変更していない。

## 経緯
- 公開CI（`scripts/check-release-version.cjs`）は、main への push ごとに「直前の main（`github.event.before`）」と比較し、公開ゲームファイルが変わっていれば `version.json` のマイナーをちょうど 1 つ上げることを求める。
- 6.0 → 6.1（run 32）は別の検査（数学の塔のUI検査）で公開に失敗。修正を main へ載せた run 33 は、直前の main が 6.1（未公開）だったため 6.1 のままでは「Public game changes must advance minor once」で失敗。結果、6.2 へ更新して再公開した。6.1 は欠番になる。
- 公開されなかったコミットでも版が進むため、公開失敗のたびに未公開の版が積み重なる。

## 改善案（要所有者判断）
1. 比較元を「直前の main」ではなく「最後に公開に成功した版（公開済みタグ／デプロイ済みの `version.json`）」にする。
2. 公開前（dev）の CI でも同じ版検査を、`origin/main` 比較で実行する（`next-major-checks.yml` の paths に `version.json`・`game-version.js` を追加）。
3. 公開CIの失敗を main で受けず、公開前の検査（塔のUI検査など公開CI専用のテスト）を dev でも実行する。

規則自体の変更は所有者の承認後に行う。
