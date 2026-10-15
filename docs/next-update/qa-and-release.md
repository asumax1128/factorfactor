# QA・公開・ロールバック

## 第1区切りの検証

すべて既存local依存とChromiumを再利用。browser-harnessが全HTTPを捕捉し、Firebaseはfake、GASはfixture、その他をabortする。本番RTDBは使用しない。

|確認|結果|
|---|---|
|`node tests/next-board-visibility-browser.cjs`|成功。phone 390×844とPC 1366×768、E/N、共有A/B1/B2。countdown・future startAt・future readyAt・resolving・freeze・resultで式/カードDOMなし。操作可能時刻ちょうどで6/9枚＋式が出る。4桁/CPU Aの1100ms待機とB/C resolvingも確認|
|`node tests/battle-countdown-browser.cjs`|成功。CPU A/B/C × easy/normalの6経路。開始前DOMなし、開始後に実dragで回答|
|`node tests/online-playability-browser.cjs`|成功。検索中cancel・5秒境界cancel・開始前退出・初期化失敗の無敗北処理、E/N・A/B・通常ghost/hyper/BOT・quick/profileで、単独/別々tapの不成立・範囲外release解除・touch回答→次問→実engine結果・レート/EXP一回反映|
|静的UI案の操作/幅|成功。390×844、1366×900。home/online/result切替、横overflowなし。外部networkを全遮断し6画面撮影|
|実機Safari/ChromeOS/Windows tablet|未確認。Chromiumのviewport/touch模擬と区別|
|実SDK/Emulator認可/新ルール|この区切りでは未実施・変更なし|
|Actions|このブランチでは未起動。既存workflowの対象外。CI成功や製品完成とは報告しない|

新テストは`npm run test:next-board-visibility`から実行でき、既存`test:online-improvements`末尾にも接続した。待ち時間延長/assert無効化はしていない。テストでA liveを数値として構成する必要がある点は、実transportのschemaに合わせてfixtureを修正した。

## 残る総合QA

- 観戦PlayerMirror/SplitViewとB2観戦、C/大会/CPU新B移行後、全経路の先行DOM・同時開始・切断復帰。
- solo/CPU/オンラインの正解・誤答・次問、10〜20秒境界、FREEZE、タッチ/マウス/短いviewport。
- B確定時系列とグラフ最終値、C貢献指標、両者結果一致、再送時のイベント重複。
- 100件mapping/26件★5/15件隠し条件、公開DAG、旧装備/日時不明/再実行/二端末、CPU/自己対象外。
- server JSTで週ボス予約5枠、同時端末/ACK喪失/退出/日跨ぎ。完走と予約を分ける。
- レイド4段階の数値と予告・ギミック、先生レイド不変。
- 新しいメニューから全旧機能の到達、一般アカウントに塔/先生権限が見えないこと。
- エミュレータdemo projectの実SDK複数client、ルール許可/拒否、既存統計/レート/EXP/装備保持。
- 対象画面全件のスクリーンショットと所有者の実操作レビュー。

## 公開手順（まだ実行禁止）

1. 全要件の未完了欄を解消し、承認済みmapping/移行dry-run/ルール差分/backup/全CI結果/画面を提示する。
2. 所有者からmain統合・本番移行・一括公開について明示承認を得る。UI案の承認は本番公開の承認ではない。
3. 承認後に最新mainを再取得して競合を解消し、既存version規則に従う次番号を確定する。現時点は5.25のまま。
4. 必要なルールだけ管理権限・現行全文backup・差分検証・認可テストのうえで適用。ユーザー全件set/import禁止。
5. mainのverify成功後だけ既存Pages deploy。一度に公開、HTTP版/manifestと配信を照合。
6. 承認された本人ログイン時移行を監視し、未証明の履歴を推測補完しない。

## ロールバック（要承認）

- 開発中：本ブランチのcommitを単位に戻す。所有者の未コミット変更は捨てない。
- 本番公開後：main履歴の検証済みSHAを既存workflowのsource_shaへ指定する手順を確認し、所有者承認後に実施。
- DBは全体を巻き戻さない。追記namespace/未知fieldを旧版が壊さないことを事前テスト。移行を停止しても旧統計・装備・取得履歴を保持する。
