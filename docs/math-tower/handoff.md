# Claude引き継ぎ記録

## 現在の基準

2026-10-12（日本時間）、正式repoのmain `56981bd90b9aa54a39b0db5458b34d867ec39249` を読み取り照合後、`math-tower-ch1` を作成。旧devは `0dd2f14b5081bb6acd831003026706d653e8f5ab` の読み取り専用資料。役割はユーザー最終決定、Codex実装/テスト、ChatGPT企画/数学監修/レビュー、Claude将来引き継ぎ。

現在有効な許可/保留は [decisions.md](decisions.md)。過去の旧dev文書にある承認を今回の許可へ転用しない。

## 実装

公開UIを `src/math-tower-ui.jsx` に分離し、生成JSを既存HTMLへ読み込む。既存230関数はAST一致で確認（メニュー/ルートの3関数は比較対象外）。HTMLの変更は追加ファイル読込、メニュー札、AppRootの接続とhash入口、旧札の関数名だけ。

入口は先生grantを読める場合だけ表示。直接 `#math-tower` で入っても同じ認可を行う。コンテンツはRTDBの保護領域のみから読み、失敗時に公開原稿へフォールバックしない。追加JSが読み込めなくても他のモードが起動できるfallbackを用意。

第1章の準備→初回プロローグ→章導入→戦闘前→6タイル戦闘→勝敗/保存→戦闘後→章末を接続。E/N/H別記録、章HP、既読・名前解放・図鑑・学習記録・断片、先生試遊報酬を実装。図鑑の名前/討伐数並べ替え・ボス/未討伐フィルタ・画像拡大/移動。次章未完成データは含めない。

途中状態の扱い：戦闘中reloadは最後の保存HP/未クリア階から再試行。戦闘盤面・コンボのクラウド復元は未実装。会話シーケンスは完了時にまとめて既読保存し、途中reloadは未保存のシーケンスを再表示する。勝利後の未読会話はpendingStoryで回収する。HP0は章再開始を案内し、旧記録と試遊ベストランクは保持。

試遊保存はrevision一致のtransaction。別端末更新時には拒否して再読込を案内する。結果の保存失敗は画面で再試行可能。報酬はrunIdで重複付与しない。Firebaseの自己書込可能な試遊結果は `verified:false` であり、公式実績の検証基盤ではない。

## 資産と秘匿

24配信用画像＋24原本と原稿/設定を、Git外のアーカイブとGit bundleで保全。第1章のキャラクター7画像/背景7画像を非公開パッケージに再利用。取得済み章の画像はdata URLで表示する。公開repoへ原稿/素材を追加していない。旧公開suri-data.jsは変更していないため既に公開済みの情報を秘密に戻したわけではない。

本環境での保全先は `/workspace/handoff-preservation/`。これは永続保管先の保証ではない。ユーザー管理の非公開保管先へ移し、復元・Claudeのアクセス・旧dev実行時依存がないことを確認するまで削除準備完了としない。

## 残る作業

- エミュレータの公式JAR取得が `storage.googleapis.com` の403 Domain forbiddenで停止した。必要ドメインを環境設定ドラフトに追加保存済み。ドラフト保存は現在のネットワークへ未適用。TLS/チェックサムは無効化していない。
- `test:tower:rules` の実エミュレータ認可検証が必要。モックの成功を本番ルールの証明にしない。
- 現行の本番Firebaseルールは取得/変更していない。差分統合の際に祖先の広い権限がないことを監査する。
- 全A/B/C対戦の完走・大会の全ラウンド・フレンドレイド全完走、実機Safari/タッチ/音/PWA、本番Firebase/Pages接続は未検証。共有コードAST一致と起動/一部操作を区別する。
- 第1章の零の試練（チャレンジ）、公式プロフィール/称号への反映、一般公開、後続章は今回未実装。正式仕様の将来項目を完成と数えない。
- セーブ時にエラーを表示するが、オフラインの自動クラウド同期・同時更新の自動マージは実装していない。記録を黙って上書きすることを避ける。
- 先生試遊での章パッケージ全体は取得可能。先生本人からも未到達の階を秘匿する階別配信は未実装。

## 次の担当者への手順

1. `git status` / `git log -1` で現在の作業コミットを確認し、未保存変更を保護する。
2. 非公開パッケージと仕様書を取得。公開repoへ貼り付けない。
3. READMEのローカル手順でビルド/テスト。未実施を「通過」に書き換えない。
4. エミュレータ・本番ルール差分・実機の未検証を解消し、レビューに出す。
5. 本番操作はユーザーの別途明示承認後だけ行う。

コミットSHAは自己参照を避け、この文書に推測値を埋め込まず `git log` と最終報告に記録する。今回GitHubへpushしない。main/Pages/Firebase/旧dev/Cloudflareは変更しない。

## 公開前チェックによる更新（2026-10-12）

上記「公式エミュレータ未取得/未検証」は履歴。通信許可後に公式4.11.2を取得し、CLIの期待サイズ/チェックサムと一致を確認。最小fixtureの17認可項目と、旧dev参考ルールへ塔だけを追加した候補の17項目が通過した。参考候補の既存アカウント読取/学習stats保存/普通の部屋作成も通過した。

ただし現行本番ルールの読取は既存認証で失敗。ユーザーはFirebase Consoleから手動共有する方針を回答したが、ルール本文の受領待ち。本番統合監査が完了したとは扱わない。旧dev参考版と現行本番版を混同しない。

参考版ではteacherPassとteacherKeysが両方未設定のとき、旧先生登録のnull同士の比較が通ることをエミュレータで再現した。塔の管理側grantの自己付与は引き続き拒否される。参考版の祖先には広い許可がなかったが、意図的に広い許可を追加したローカルfixtureでは下位拒否が効かないことも再現した。本番監査では両点を重点確認する。

修正済み：会話背景の階別フォールバック、戦闘開始時の前戦通知の消去、第5階断片参照を空の学習項目として重複表示しない処理、ポーズ再開時の既存patternOfによる同系統の別問題保証。共有問題生成/採点関数は変更していない。

13イベント391行の原稿全文・暫定バランス・学習資料・70画面をGit外の非公開レビュー資料へ整理した。旧devのbundleを一時復元し、HEADと48画像チェックサム一致を確認。環境外への永続保存はユーザーによるコピー待ちであり、旧devを削除しない。手順はbackup-and-review.mdと最新の公開前チェック報告を参照。

## 現行本番ルール監査による更新（2026-10-12）

ユーザー提供のConsole全文で監査完了。[統合監査報告](../../reports/2026-10-12_firebase-production-rules-audit.md)が最新。以前の「本番ルール未共有」は解消。塔のみ17件・先生修正込み17件と追加157 assertionsが通過。既存枝は塔追加以外完全保持、先生修正は2つのwrite条件のみ。先生取消は管理側grantも無効化する。factor_devの同種問題は未変更。本番実データ/実接続・実機は未検証。本番配備・main・Pagesは引き続き未承認。

## 操作試遊による更新（2026-10-13）

[ローカル試遊報告](../../reports/2026-10-13_math-tower-local-play.md)を参照。CodexプレビューURLがないため、非公開保管repo経由のWindows/Python＋同一Wi-Fi iPhoneモック試遊を提供。入室コードは起動時発行、原稿/画像/JSもサーバー認証後のみ配信。localStorage保存で端末同期なし、本番先生認証ではない。ドラッグ案内・ヌルの2倍表示・HARDのHP0/Lv8説明・塔のみスマホCSSを追加。試遊policy/既存因数分解エンジンは変更なし。配布パッケージを公開repo/Pagesへ置かない。

## 本番統合準備による更新（2026-10-13）

最新方針は[初回本番設定案](production-setup.md)。ローカルZIPを標準にしない。公開許可されたchapter1.jsonをPagesに含め、RTDB grant確認後に読み、trialProgressだけを既存本番DBで保護する。過去の秘匿前提は更新。CIは全チェック後の限定成果物だけをPagesへ渡すが、初回Settings/Firebase/grantの承認までは無効。現行mainを再fetchして同じ56981bdであることを確認。実機/本番管理状態は未検証。通常更新後のmain-history SHA rollbackと初回前バックアップの復旧を区別する。50階への拡張は未実装。
# 2026-10-13 セーブ・音声修正の引き継ぎ

詳細は [修正記録](../../reports/2026-10-13_save-audio-fixes.md)。保存はStore.createWriterの単一キューで行い、確定revisionを次の保存の基準とする。競合後に強制上書きや自動再試行を追加しない。音声はGameAudio/useGameMute経由で制御し、直接出力するWeb Audioにも共有Gainを通す。新規モードでローカルのuseState(false)によるミュートを追加しない。回帰テストはActionsに組み込み済み。iPhone Safari実機確認は残る。

## 第1章のRPG改善・進行形式の更新

最新仕様と移行の詳細は[RPG改善記録](../../reports/2026-10-13_math-tower-rpg-improvements.md)。難易度共通の冒険には戻さない。共通のクリア階と各難易度の`adventures`を区別し、独立再挑戦は本編を更新しない。保存の外側schemaVersionはルール互換の1、アプリ形式progressVersionは2。migrationBackupを上書き・削除せず、復元でも永久記録やrevisionを巻き戻さない。旧pendingStoryは冒険ごとのphaseへ移した。旧hp/bestを再開地点に使わない。

MagicAttackは正解判定後に表示し、HP更新は命中時。guard・attackRef・cutinRefによる二重入力／タイマー抑制を維持する。CutInはFactoryから再利用可能。ノートは背景とは別の描画部品で、原稿のmath/note行を紙面内へ表示する。共有BattleBoardやソロCSSを塔の変更のために変えない。最新のUI・保存テストはActionsで実行する。

## 数式の切れ・図鑑・書体・勝利の改善

詳細は[追加UI改善記録](../../reports/2026-10-13_math-tower-ui-polish.md)。数式はTowerTargetの3段レイアウトと縦横の字体計測を維持する。共有v7-polyの行高をそのまま固定高のflex枠へ流し込むと再び文字が切れる。新しい章でもフォント読込・指数・高さ変更をテストする。MathTextと同じKaTeXフォントを使用し、同梱ライセンスを削除しない。

Victoryは保存済み結果の表示専用。保存やR.completeを演出部品へ移さない。画像ボタンは遭遇・解放・読込成功を確認し、未知のキャラクターを表示しない。保存・戦闘・音声のエンジンは変更していない。test:tower:polishが旧c426284の切れを再現するため、CIの履歴取得を浅くしない。

## 階クリア後の導線と会話用立ち絵

[導線・会話表示の変更記録](../../reports/2026-10-13_math-tower-adventure-flow.md)。戦闘後のStoryを保存し、R.finishStoryの確定後にafterFloorを表示する。次の階は保存済みadventuresのready状態から再開し、UI遷移で階を加算しない。第5階はchapterEnd、再挑戦は本編と独立したfloorSelectへ戻れる。storyBusy/actionBusyとWriterの直列化を維持する。

会話のunit画像は単体へ展開する。3-preのtwin_fox＋name:プラスを、単体プラスの発言として解釈する。セット画像は戦闘・図鑑に残す。プラス左/マイナス右の位置固定と話者強調を維持。原稿と素材をこの不具合のために削除しない。test:tower:flowは直接進行・全31行・保存失敗/競合も検証する。

## 第3階の正式仕様変更とオンライン新制度の候補

上記の旧左右位置は最新依頼で変更された。正式仕様は**マイナス左／プラス右、背景は左青／右赤**。別ブランチ `fix/tower-floor3-official-background` の `e9e1b7c` は位置変更のみで、正式背景原本の取得と差し替え・検証を待つ。インライン画像を旧画像の反転や新規生成で代用しない。セット画像は会話に追加しない。

オンラインの承認済み仕様・実装・移行・復旧は[実装記録](../online-rated-v2-implementation.md)、テストと未確認事項は[公開前報告](../../reports/2026-10-13_online-rated-v2-preflight.md)。旧レートはEASYへ同値移行、NORMAL1500、新対戦数0、3戦条件、5称号。新制度は `feat/online-rated-v2` の候補で未公開。最新本番ルール・実人数・外部バックアップ・料金・旧試合終了確認を省かない。塔の通常公開とオンラインの本番切替を混同しない。

最新方針は[Spark版](../online-spark-setup.md)。Blaze・Functionsは使用禁止。新制度の初回保存は本人の新profileとバックアップだけを同時作成し、旧accountsを変更しない。本番ルールは最新TXTの全旧枝を保持し、onlineSparkV1だけを追加する。

第3階の原本ZIPは受領済み。`36e0123` で1672×941のPNGを無加工で参照し、中心cover表示、マイナス左／プラス右を検証した。原本SHA256は `d81d75734c057c802bcd80e85e5d6f3a65dff8a0716aced5bbbb63d00514f77c`。旧画像はgit履歴とリポジトリ外の確認用控えに残す。新test:tower:backgroundは他素材・原稿の完全保持、5画面サイズ、色の左右、切れ・会話重複を検証する。

- 2026-10-13: Sparkオンライン入口の初回設定通知遅延による旧qm誤遷移を再現・修正。FB.db専用監視とエラー/再試行、protocol検証を追加。塔・Firebase設定・記録は変更なし。詳細 reports/2026-10-13_online-entry-config-fix.md。

- 正式バージョンはversion.jsonへ統一。所有者承認で5.9→5.10。通常公開ごとminor+1、majorは事前確認。docs/game-version-policy.md参照。
- オンライン検索とレーティングを分離、EASY掲載1501以上、NORMAL3戦を維持。旧データ保持。ゴースト等6項目は reports/2026-10-13_ghost-learning-host-design.md の調査設計のみ、承認前に実装しない。

## 2026-10-13 Ver.5.11への引き継ぎ

- version.json正式管理、通常公開はminor+1（次回5.12）、major変更のみ所有者確認。未公開候補と配信版を区別する。
- ゴースト/限定開催の設計・認可・復旧は reports/2026-10-13_ghost-host-v511.md と firebase/ghost-host.candidate.rules.json を参照。
- 本番ルール変更は安全確認後に事後報告で可。管理認証がない環境では所有者のConsole操作のみ依頼。現行ルールを取得せず全体を再構成しない。
- Spark維持・Cloud Functions不要。数学の塔の物語/戦闘/難易度別保存/先生grantは変更していない。

## 2026-10-13 Ver.5.12への引き継ぎ

- Ver.5.11はmain 6faf135、Actions38388699503で検証・公開成功。所有者が候補049d94aのルールをConsoleで公開済み。
- Ver.5.12は指名ゴースト戦の復帰/UI、読み取り軽量化、開始前退出、遅いゴーストの時間切れ後の古い問題への回答を修正。src/ghost-model.cjsは時間切れheartbeat後に次問のCPU予定を作り直す。数学の判定・タイマーの期限は変更しない。
- 正式な次回公開は5.13。CHANGELOG/version.json/表示を同時更新。現行方針は所有者の最新版依頼を優先し、上記の旧未承認設計やFunctions必須案を採用しない。Sparkを維持。
- Safari実機と実PagesへのHTTPは未確認。Actions/配信アーティファクトの版・SHA確認を実機検証と混同しない。

## 2026-10-13 Ver.5.13 緊急オンライン復旧

- Ver.5.12の新UIで、heartbeatがbusyを切り替え、再取得したtiles配列がBattleBoardの選択解除effectを発火していた。旧テストは通信のない瞬間の短いマウス操作だけを検証していたため見逃した。
- src/online-rated-ui.jsxは操作とバックグラウンド同期を分離し、要求を直列化。同一問題のtiles/onMatchを保持する。Bの判定待ちはview.resolvingに従う。通信失敗の再試行成功時にはエラーを解除する。
- BattleSurfaceをCPU練習と新オンラインで共有。BattleBoardのtapSelectは新オンラインだけで有効。既存のドラッグ・数学エンジン・CPU進行・セーブ・音量OFFは維持。
- tests/online-playability-browser.cjsは650ms遅延と1200msの実タッチ、A/B・E/N・乱入3種類・指名戦・誤答・必殺技・通信復帰・初期化失敗を通して検証。Native Emulatorでも人間Bの遅延タッチと安全中断を追加。
- 既存の配信ビルドはJS/CSSへ内容ハッシュのクエリを付ける。この仕組みを手動バージョンクエリで妨げない。version.jsonが正式元、次回ゲーム公開は5.14。
- 本番ルール追加や既存試合の推測による補正は行っていない。iPhone Safari実機は未検証。詳細 reports/2026-10-13_online-playability-v513.md。

## 2026-10-13 Ver.5.14 UI・共通戦闘演出

- 正式版はversion.jsonの5.14、次回は5.15。数学の塔フォルダ/UI/CSS/ルール/素材は変更なし。FxLayerの既存デフォルト95も維持し、新オンラインのローカルレイヤーがある間だけ重複表示を抑制する。
- 新オンラインの表示名はイージー/ノーマル。内部easy/normal・公式称号名・保存値は変更しない。白いカード/橙色と既存難易度色を再利用。
- TimingJudgment/timingVisual、ComboDisplay、CombatFXをソロ/CPU/オンラインで共有。内部Fairは数学・HP回復量を変更せず表示のみOK。getJudgment/JUDGE_TIERS/attackFor/createBEngineと抽出engine-source.jsは保持。
- engine.cjsのfx callbackは実イベントに連番を付け、上限24件の表示用ログを渡す。viewの復元中はイベントを発火しない。原子的な勝敗/レート/EXPの計算には使わない。
- CombatFXはDOMクローンと既存FXを使い、入力カードを変形/消去しない。独自FXのIDとタイマーだけを退出時に解除。他モード・塔のエフェクトを巻き込まない。
- 新規のすぐ遊ぶは終了済み結果を確認済みにして選択画面へ。進行中試合の復帰は残す。結果のメニュー戻りにもackReceiptを必ず通す。
- 詳細と未検証は reports/2026-10-13_online-ui-combat-v514.md。Safari実機と本番HTTPアクセスは環境制約により未確認。


## Ver.5.15 日本語UIフォント基準

正式なデザイン基準は [UIデザイン基準](../ui-reference/design-standard.md)および `docs/ui-reference/design-standard.md`。比較画像原本は `docs/ui-reference/factorfactor_font_ui_comparison.jpg`。旧42011a6の画面Ver.5.9、Zen Maru Gothic 500/700/900、共有FontImportを確認した。新オンラインのFontImport欠落を補い、見出し/ボタン900へ統一。数式/KaTeX/MathText、ソロ/CPU/塔のルール、Firebaseの記録・認可は変更なし。次の通常公開はVer.5.16。新機能にも共通フォントを必ず読み込み、数式へUIフォントを上書きしない。


## Ver.5.16 緊急・カード操作の正式仕様

オンラインの因数カードはCPU練習と同じ既存BattleBoardの既定操作を利用する。1枚目から2枚目へのドラッグ/スワイプで解答し、単独タップ/別々の2タップでは選択を保持せず解答しない。無効な位置で指を離したら解除。Ver.5.13でオンラインだけtapSelectを有効にしたことが原因だったため、呼び出し側の指定だけを削除。共有入力処理、CPU/ソロ/数学の塔の操作は変更しない。今後tapSelectを再び有効化しない。同期中にdisabledへ戻す、同じ問題のタイルを毎回作り直す修正も禁止。6経路の実タッチ連続スワイプと人間A/Bの実SDKで検証し、公式記録・レート・EXP・Firebaseは保持する。次の通常公開はVer.5.17。


## Ver.5.17 オンライン遅延・同期

調査と計測は `reports/2026-10-14_online-latency-v517.md`。CPUと同じmultiply/polyEqual/getJudgmentによる即時表示と、公式得点の確定を分離する。ローカルの正解表示を公式の得点加算として扱わない。対人戦のRTDBトランザクション順序・旧レコード・1/3乱入レート・指名戦レートなし・試合IDによるEXP/レートの重複防止は維持。

ゴーストは既存G.advance/E.stepを端末内で実行し、1秒間隔または入力時の世代付き保存をまとめる。別の書き手の世代を上書きせず、切断時は未送信チェックポイントを保持する。結果を確定する前に保存成功を待つ。再読み込み用の記録はsessionStorage（同じタブ）で、認証状態が変わった別UIDへ復元しない。公式保存結果が優先。

`onlinePerf=1`を付けた開発確認URLで `OnlineSpark.performance.events` を参照できる。ログは最大600件、UID・アカウントキー・名前・認証情報・PIN・実データ本文を出力しない。JSONスナップショットのバイト数は課金対象の実通信量ではない。iPhone実機と本番Pages直接アクセスは未確認の場合を必ず区別する。Spark維持。有料プラン/サービスは所有者の明示承認が必要。次の通常公開はVer.5.18。


## Ver.5.18 賞金首→詳細のモーダル遷移

BattleHomeは選択時にopenProfileでwinを{type:'profile',key,origin}へ置き換える。単一のモーダル状態で一覧または詳細だけを表示する。一覧と詳細を重ねない。賞金首用のorigin='bounty'は一覧を閉じても保持し、PlayerProfileへ渡す。winからoriginを算出する旧実装へ戻さない。詳細は選択キーで再生成して前の相手の状態を持ち越さず、閉じるとオンラインメニューへ戻す。背景のoverflow/overscrollは一覧または詳細がある間だけ保持し、終了/アンマウント時に以前の値を復元。z-index・共通PlayerProfile・ソロ/CPU/数学の塔・判定/同期・報酬/レート/7日制限・Firebaseルールは変更しない。

回帰: npm run test:bounty-profile（320/390/430/1366px、連続タップ、一つの詳細、実タッチスクロール、閉じて復帰、別相手、みんなの成績、bounty経路の指名戦）。詳細は reports/2026-10-14_bounty-profile-v518.md。次の通常公開はVer.5.19。

## Ver.5.19 Chromebook互換性調査

683×325の縦積みで問題切断・カード高さ4pxを再現。index.htmlのcompat-playだけ短い横画面の2列/低画面スクロールを追加。数学の塔の外枠と入力処理、Ver.5.17の同期、カードのドラッグ方式、数式設定は変更しない。通常タッチ不能はChromiumで未再現。学校の実機確認と匿名診断は[Chromebook確認手順](../ui-reference/chromebook-check.md)。tests/chromebook-browser.cjsをCIに追加。次の通常公開はVer.5.20。

## Ver.5.20 最高レートとマスタータイル

index.htmlのRatingHistoryでEASY/NORMALのmaxRating・seasonMax・seasonHist/maxと旧EASY履歴を共通集計。現在レート/初期1500で歴代最高を作らない。PlayerProfileは旧対戦数0/オンライン経路でも最高を表示。Wardrobeのmasterタイルだけ、履歴>=1820/既存永久達成フラグ/保存済みmaster装備を解放根拠にする。他の条件は既存skinOpen/skinInfoを維持。画面表示中だけ対象プロフィールを1件監視し、アカウント切替の古い値・閉じた後の通知は使わない。マイグレーション/新フラグ保存/ルール変更/全件監視は追加しない。test:rating-historyをCIへ追加。詳細はreports/2026-10-14_rating-history-v520.md。次の通常公開は5.21。指定asumax1128/factorはREADMEだけの初期コミット12d6eceのため、実コードと公開はfactorfactorで保守した。

Ver.5.21追補: 初期1500の未記録判定では人間gamesだけでなくghost.gamesも確認する。乱入戦は公式レートを更新するため、人間games=0でも履歴がある。32件の単体テストでこの境界を保護。次の通常公開は5.22。


## Ver.5.22 現在レート表示の統一

ロビーは旧accounts/stats/ratingではなく、開いているアカウントのonlineSparkV1/profiles/easy,normal/ratingを別々に表示。CurrentRatingsをPlayerProfileとも共用し、useRatingHistoryProfileの対象1件の監視を再利用。前アカウント/未読込はundefinedとして旧値を先に見せない。プロフィールが存在しない移行前だけ、ランキング同様に旧ratingのEASY投影とNORMAL開始値1500を明記する。欠損難易度は旧値で補わず未記録。月替わりはOnlineSpark.ratingView（既存core関数の読み取り専用export）と同じ結果。

RatingDisplay.formatは表示時だけMath.round。ロビー・自己/他人プロフィール・ランキング・レーティング・乱入・結果・ゴースト履歴・旧季節履歴/結果差分を整数化。計算/保存/順位/マスター条件へformat値を渡さない。1819.9は表示1820でも未到達。最高値は引き続きRatingHistoryで別集計する。旧対戦記録/旧レートはラベルで明確に区別。全件取得/書き込みを追加せず、ロビーを閉じると対象リスナー解除。

検証はnpm run test:rating-display。詳細reports/2026-10-14_rating-display-v522.md。通常の次回公開はVer.5.23。
