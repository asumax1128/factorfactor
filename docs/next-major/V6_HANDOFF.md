# FACTOR×FACTOR Ver.6.0 開発 引き継ぎ資料（V6_HANDOFF）

作成：2026-10-17（旧セッションの末尾）／2026-10-18 に第0.5章を追加（段階6〜8・称号監査）。第0〜15章は2026-10-17時点の記述。対象リポジトリ：`asumax1128/factorfactor`。
この資料は「現在の開発状況」専用です。長期的な開発ルールは将来の `CLAUDE.md`（現時点では存在しない。第12章の提案を参照）に分離してください。

> **読み方**：事実は「GitHub で確認済み」「会話の報告のみ（未再確認）」「未確認」を区別して書いています。**未検証のものを検証済みとして扱わないでください。**

---

## 0. 最初の30秒（要点）

1. 本番は **Ver.5.25（main）**。次期が **Ver.6.0**。開発基準ブランチは `dev/next-major-20261015`。
2. **dev に未統合の独立ブランチが2本**あります。互いに含まれていません。**勝手にマージ・リベースしない**（所有者の承認が必要）。
   - `claude/v6-title-spark-only`（称号：旧statsが空のユーザー対応）— 1コミット `6d5bf9a`
   - `claude/v6-result-shell`（リザルト画面統一）— 5コミット、最新 `6711de5`
3. どちらのブランチも **GitHub Actions は一度も実行していません**（開発用CIの対象ブランチ一覧に入っていないため自動起動しない）。
4. **本番 Firebase ルール・データは一切変更していません**。称号を本番で保存するには**所有者による本番ルール適用が必須**です（第5章）。
5. 作業ツリーは、この資料を作る前の時点でクリーン（未コミットなし）でした。この資料自体は未コミットです。

---

## 0.5 【2026-10-18 更新】段階1〜8の現況（最優先で読む）

> 以下は旧セッション末尾の最新情報。第0〜15章の古い記述（dev未統合ブランチ2本など）より**この章が優先**。称号の整合性監査は [V6_TITLE_AUDIT.md](V6_TITLE_AUDIT.md)。

### 方針・保護
- 本番は main（Ver.5.25、`5584885`）。次期Ver.6.0。統合基準 `dev/next-major-20261015`（`3fe0a35`）。**main・本番Firebase・デプロイ・CI設定（所有者承認なし）には触らない。公開ワークフロー `math-tower-pages.yml` は起動禁止。force push・rebase禁止、dev統合は fast-forward のみ・所有者承認後。**
- 本番Firebaseルールは一切変更していない（適用は所有者のみ）。

### 段階の進捗
| 段階 | 内容 | 状態 |
|---|---|---|
| 1〜5 | 称号（旧statsが空のユーザー対応）・リザルト統一ほか | dev統合済み |
| 6 | ゴースト選択／ランダム待機／投票画面のUI統一 | dev統合済み（CI確認済み） |
| 7 | オンラインA/B2プレイ画面枠＋数式フォント統一 | dev統合済み（CI確認済み） |
| 8 | 新プロフィールの称号装備UI＋廃止称号の新規取得停止＋取得演出の正式名統一 | `claude/v6-title-equip`。**CI run 37（`c4368a1`）全通過。dev統合は所有者承認済み（fast-forwardのみ）。実機未確認**（詳細は下の「第8工程 追補」） |

### 段階8の実装内容
- 新プロフィールで装備／解除／切替。未取得はロック表示。保存中・成功・失敗の状態表示。取得済みの100＋隠し1＝101称号を装備可能。
- 装備枠は `stats/nick` の単一枠（所有者承認の案A）。状態：ID＝装備、`""`＝明示解除、未設定＝旧 `onlineSparkV1/profiles/<k>/title`（profile.title）を互換表示。共通表示ルール `src/title-display-next.cjs`。
- 表示名：カタログの正式名を優先。カタログ外の旧IDだけ旧ラベル／アイコン、共通アイコン🏅。HOME・プロフィール・ランキングで同じ解決器を使用。旧モーダルは互換維持（解除は`""`に統一）。
- ランキング画面の装備ボタンは二重保存（統一枠→equipTitle）。保存順を統一枠先にし、部分成功状態と再試行を専用化。保存失敗・低速回線・複数端末は成功表示を実保存後のみにする。
- デイリー王の既存バグ（dailyTitles未反映）を修正。プロフィールを開くだけでは書き込まない。
- 検証：ローカルゲート58件（build:pages＋公開26＋ユニット＋ブラウザ回帰＋Emulator）全通過。**CI未実行・実機未確認**。
- 主なファイル：`src/title-labels-next.cjs`、`title-equip-next.cjs`、`title-display-next.cjs`、`next-profile-ui.jsx`、`title-inventory-ui.jsx`、`next-home-ui.jsx`、`online-rated-ui.jsx`、`title-client-next.cjs`、`ui-next/home.css`、`online-rated.css`。重要テスト：`tests/title-equip-next.test.cjs`、`title-display-next.test.cjs`、`v6-title-equip-browser.cjs`、`title-nick-state-emulator.cjs`、`v525-nick-compat-browser.cjs`、更新した`legacy-regression.cjs`・`ui-font-v515.cjs`。

### 101称号カタログ・削除称号・保護
- 正本 `src/title-catalog-next.json`（通常100＋隠し`factor_factor`、★5を15種以上で解放、獲得前は非表示）。
- 所有者の削除対象7称号（必殺技いらず`nosp`、塔の挑戦者`tw10`、塔の熟練者`tw30`、塔を制覇`tw50`、数理の書の継承者`tw70`、終わりなき探究者`tw100`、討伐の一撃`wklast`）は、カタログ外の旧実績IDと**ID・名称とも1対1で一致**（カタログ外はこの7件のみ）。新プロフィール一覧には出ない。
- **既得記録・装備は保持**（スナップショットは無フィルタ、装備中は表示継続、自動解除なし）。削除済み称号を勝手に消さない／別称号へ転用しない（`docs/next-update/TITLE_SPEC_REVIEW.md`）。
- **発覚した不整合**：`nosp`と`wklast`はコード上まだ新規取得可能（active）。塔5件はhiddenで実質取得経路なし。**未修正・所有者判断待ち**。所有者の正式削除リストは文書として存在せず、会話提示のみ。
- 取得判定の実装状況：カタログ100件のうち、旧BADGES判定流用85／クライアント判定5（easy/normal/dual系）／新設で未実装10。隠し称号の判定はEmulator専用サーバー側のみ。詳細は監査レポート§5。

### 第8工程 追補（2026-10-18）：廃止称号の新規取得停止・演出の正式名統一
- **CI**：`claude/v6-title-equip` のコミット `c4368a1`、Actions run 37（`Next major development checks (no deployment)`）が**全ステップ成功**。第8工程のユニット（`title-equip-next`・`title-display-next`・`v6-title-retire`）、ブラウザ（`v6-title-equip-browser`・`v525-nick-compat-browser`）、Emulator（`title-nick-state-emulator`）を同ワークフローに追加済み（作業ブランチ限定の登録）。
- **廃止称号7件（`nosp` `wklast` `tw10` `tw30` `tw50` `tw70` `tw100`）の新規取得停止**：取得状態は統計カウンタそのもの（`noSpWins>=1`、`wk.lastHit>=1`。増えるだけで減らない）。`index.html` の `holdRetiredCounters` が、`statsTx` と `recordMatch` のトランザクション内で **0→1になる更新だけを取り消す**。取得演出は `announceableBadges` が廃止7件を除外。塔5件は進捗カウンタ（`tower`）を触らず、演出対象から外すだけ。
- **保持するもの**：既得者のカウンタ（増加は継続）・取得記録（snapshot/awards）・装備（`stats/nick`）・他の統計カウンタ・戦績・称号ID。自動解除・初期化・別称号への転用はしない。`BADGES`の判定式・`achievementStatus`は不変（既得判定は従来どおり）。
- **別の統計カウンタは新設しない**（所有者決定）。そのため未取得者の `noSpWins`／`wk.lastHit` は増えない（カウンタが称号そのものであるため）。
- **取得演出の名称**：`statsTx` のトースト、`BadgeReveal`、`TitleReveal` はカタログの正式名で表示（アイコン・説明文`desc`は従来のまま）。`legacy-regression` は `statsTx` を承認済み変更として許可。
- **未解決リスク（記録）**：**旧Ver.5.25クライアント経由で廃止称号が新規取得される可能性が残る**。取り消せるのはVer.6.0のコードだけで、旧端末で0→1になった分は以後、既得と区別できない。完全に止めるには本番Firebaseルールの変更が必要だが、**本番ルールは一切変更していない**（所有者承認事項。AIは適用しない）。
- **未実装・未検証**：**通常称号の取得判定が未実装10件**（`online_first, wins100_ab, dual50, giant250, flash3, accuracy10, tour_streak2, wksup500, wk_runs20, lb_cards7`）と、**隠し称号 `factor_factor` の獲得判定（クライアント）が未実装**（別工程）。**実機検証（スマホ幅・複数端末・低速回線）は未実施**。本番Firebaseルール・データ・デプロイは未変更。週間ボスのauthority経路（`weekly-rewards-next`）はlocalhost＋demoプロジェクト限定で本番では動かないため今回は未変更。

### 未解決事項
1. 段階8のCI登録（`claude/v6-title-equip`と新テストを開発用CIの対象に追加＝所有者承認が必要）とdev統合が未実施。
2. 実機確認（スマホ幅・複数端末・低速回線）未実施。
3. `nosp`／`wklast`の新規取得停止の可否、`statsTx`演出のフィルタ、塔5件の扱い、新設10称号の判定実装（監査レポート§7）。
4. 本番で称号を保存するには本番ルール適用が必要（所有者作業）。

### 次セッションの最初の作業
1. `git fetch` で各ブランチの先頭を確認（dev=`3fe0a35`、title-equip=この資料のコミット）。
2. 所有者に確認：段階8のCI登録とdev統合の承認、`nosp`/`wklast`の方針。
3. 承認後：CI対象に追加→CI全通過を確認→fast-forwardでdev統合。
4. 未実装10称号の判定、実機確認、UI統一の残作業（第9章）へ。

---

## 1. プロジェクト概要（A）

### 1.1 ゲームの目的
FACTOR×FACTOR は、**因数分解（多項式を2つの因数カードの積に分ける）を遊びで身につける数学教育ゲーム**。UI は日本語。対象は小中高生〜。先生向け機能（クラス大会・協力レイド・ダッシュボード）がある。

### 1.2 モード
| モード | 概要 | Ver.6.0 での扱い |
|---|---|---|
| ソロ | イージー15問/ノーマル30問/ハード50問。終了で CLEAR! / GAME OVER、EXP、ネットランキング送信（GAS） | 公開（新リザルト済み） |
| A方式 | 同じ問題を同時に解き、先に正解した人が得点（お手つきあり）。ルーム・CPU・ランダム対戦 | 公開 |
| 新B方式（B2） | 時間制・得点＋妨害（お邪魔カード）、HP/FREEZE/必殺。サーバー確定の記録（`b2`） | 公開（ルーム・CPU・レート戦の「B」はbot以外すべてB2） |
| 旧B方式 | レース＋攻撃の旧版。**bot経路にのみ残る。廃止は禁止（コード・テスト維持）** | 維持（旧UIのまま） |
| C方式（2vs2） | 4人チーム戦 | **非公開**（フラグで入口と新規開始を無効。コード・過去実績は保持） |
| CPU練習 | CPU相手。記録に残らない（EXPは入る） | 公開 |
| ゴースト対戦 | 過去の自分/他人の動きのコピーと対戦 | 公開 |
| ランダム対戦（すぐ遊ぶ） | `onlineSparkV1`（spark-v1）の2人マッチ。設定ONのときのみ | 公開（設定OFFなら無効） |
| デイリー | 1日3回の挑戦、日本時間0時で日替わり（`dailyV2`） | 公開 |
| 週間ボス | **従来版**（`raidw`/`raidwHist`、クライアント判定）を継続 | 公開（従来版のまま。新authorityは本番化しない） |
| クラス大会 | 先生がホストするトーナメント（B2対応） | 公開（最終リザルトも統一済み・別単位） |
| 数理の塔 | 先生限定試遊 | **Ver.6.0 一般公開対象外**（新規開発も行わない） |

### 1.3 コード構造（主要）
- **`index.html`**：単一ファイルのReactアプリ（`<script type="text/plain" id="app-source">` をブラウザ内Babelで実行）。ソロ（`FactorHunt`）、ルーム対戦（`BattleApp`、`BattleGame`、`BattleResult`）、旧ロビー（`BattleHome`）、旧プロフィール（`PlayerProfile`）などがここにある。
- **`src/*.jsx / *.cjs`**：分離されたUI・純関数。`scripts/build-online-rated.cjs` が esbuild でバンドルし、リポジトリ直下に**生成物**（`next-home-ui.js`、`next-results-ui.js`、`online-rated-ui.js`、`daily-ui.js`、`room-b2-ui.js`、`online-spark.js` など）を出力する。**生成物はコミット対象で、CIがドリフト（再生成との差）を検査する。**
- **`ui-next/*.css`**：新デザイン（トークン `tokens.css`、`home.css`、`results.css`、`result-shell.css`、`ranking.css`）。フォント `BHeading/BBody/BNumber`、ダーク基調、角丸8px、タップ44px。
- **`server/`**：エンジン抽出物・authority（Emulator専用）。**本番にサーバーは存在しない**（Spark + GitHub Pages）。
- **`firebase/`**：ルール候補（`v525.candidate.rules.json` が現行本番に近い候補、`*.fragment.rules.json` は追加断片）。**本番のルール全文はリポジトリにない**（CIの secret `RTDB_RULES_BASELINE` から生成）。
- **`tests/`**：ブラウザテスト（Playwright + モックFirebase `tests/firebase-mock.js` + `tests/browser-harness.cjs`）、`node --test` ユニット、Emulatorテスト。
- **`docs/next-major/`**：Ver.6.0 の設計・状況文書群（第13章）。

### 1.4 外部サービス
- **Firebase Realtime Database（Sparkプラン）**：`games/factor/...`。匿名Auth＋`logins/<account>/<uid>` による本人確認。Cloud Functions・Blaze は**使わない方針**（所有者決定）。
- **GAS（Google Apps Script）**：ソロのネットランキング（`GAS_ENDPOINT_URL`、`index.html` 内）。Firebase ではない。
- **GitHub Pages**：本番配信（`.github/workflows/math-tower-pages.yml`）。

### 1.5 ビルド・テスト・CI
- 生成物の再生成：`node scripts/build-online-rated.cjs`（ビルド後に `python3 scripts/title-evidence-next.py` で称号証拠台帳を再生成、`--check` で検査。**`index.html` の行番号が動くと台帳・`reports/` が変わるので再生成してコミット**）。
- 公開用テストの準備：`npm run build:pages`（`dist/` を作る。`online-entry` が `dist` を使う）。
- ブラウザテストの実行：`CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node tests/<file>.cjs`（このクラウド環境の例。環境により異なる＝**未確認**）。
- Emulator：`firebase emulators:exec --only auth,database --project demo-factorfactor-tower --config firebase.spark.emulator.json "<node tests/...>"`（firebase-tools 14.27.0。旧セッションでは `npm install --prefix /tmp/fbcli firebase-tools@14.27.0` で用意。**/tmp は消える**）。環境変数 `HTTP_PROXY=` を空にして実行していた。
- **GitHub Actions ワークフロー**
  - 開発用（**デプロイしない**）：`Next major development checks (no deployment)` = `.github/workflows/next-major-checks.yml`。push 対象ブランチは `branches:` に列挙（現在の dev では `dev/next-major-20261015, claude/solo-result-ui, claude/publish-tests-newui, claude/v6-c-hide-random-off, claude/v6-ranking-ui`）。新しい作業ブランチは**そのファイルに1行追加**しないと自動起動しない（過去は所有者の承認を得てこの方法を使った）。
  - 本番（**絶対に起動しない**）：`Verify and publish FACTORxFACTOR` = `.github/workflows/math-tower-pages.yml`。main/release への push と **`workflow_dispatch` はデプロイ**。テストだけ実行したいときはローカルで `npm run test:*` を使う。
- **公開用テスト26本**（公開ワークフローが実行する `npm run test:*`）：
  `version, tower, audio, tower:polish, tower:flow, tower:background, tower:rpg, tower:recovery, tower:browser, online, online-rated, online-entry, online-menu, ui-font, online-presentation, online-latency, online-playability, bounty-profile, rating-history, rating-display, online-improvements, rewards-audit, online-v524, chromebook, ghost, accounts`
  （これに加えて公開ワークフローには `test:regression` と Emulator 系があるが、26本の対象外。Emulator系の一部は本番ルールのスナップショット secret が必要でローカル実行不可）。

### 1.6 GitHub のブランチ運用
- `main`：本番。**勝手に変更しない**。
- `dev/next-major-20261015`：Ver.6.0 の統合先。**直接 push は所有者承認後のみ**（fast-forward のみ、force 禁止）。
- 作業は `claude/<名前>` の専用ブランチ。統合は「CI全工程成功 → fast-forward → 統合後の dev でもCI成功確認」の順。
- **凍結ブランチ（変更・統合禁止）**：`claude/c-writer-min`、`claude/c-input-log`、`claude/c-input-hardening`、`claude/c-replay-solo`（C方式の確定writer/操作ログ/再生の研究）。
- `release/v524`、`release/v525` は本番ワークフローの対象（触らない）。

---

## 2. Ver.6.0 の確定方針（B）

所有者が決定した事項（変更禁止。変える場合は必ず所有者に確認）。

### 2.1 公開範囲
- **公開する**：A方式、新B方式（B2）、ランダム対戦、週間ボス（従来版）、通常ソロ、新HOME・新リザルト、CPU練習、ゴースト対戦、デイリー、ランキング、クラス大会、**新称号100＋隠し1**。
- **C方式は今回公開しない**：後日の追加コンテンツ。入口と新規開始を機能フラグで無効化。**コード・既存データ・過去実績は削除しない。**
- **数理の塔は一般公開しない**：先生限定試遊は維持してよい。**新規開発しない。**
- 旧B方式の廃止は禁止。

### 2.2 UI
- HOME と オンラインロビーは**新UI（B改良版）で完成済み**。作り直さない。
- **ランキングは「3つの入口（ソロ/デイリー/レーティング）を維持」**（A案）。1画面への統合・入口カード削除は禁止。中身だけを刷新（実装済み、第7章）。
- 新UIの基準：暗い紺系、`BHeading/BBody/BNumber`、角丸8px、タップ44px以上。新しいフォントは追加しない。
- デザインを大きく変える場合・機能の削除・非公開化・公開範囲の変更・優先順位の変更は**所有者に確認**する。

### 2.3 ランダム対戦の設定OFF（`onlineSparkV1/config.enabled:false`）
- ランダム対戦は利用不可。旧 `quickMatch()`（旧ランダム対戦、`qm`）への自動切り戻しは**しない**。
- 新ロビー・旧ロビーとも「すぐ遊ぶ」は無効化し、「レーティング対戦は現在利用できません。ルーム対戦・CPU練習を利用できます。」を表示。`qm/rooms` には書き込まない。ルーム作成・CPU練習は使える。
- 旧ロビーは**削除しない**（新ホームの部品が読めない場合のフォールバックで残る）。実装済み（dev に統合済み、`df6bc8b` 系）。

### 2.4 称号に関する所有者決定（要約。詳細は第5章）
- 通常100件＋隠し「FACTOR×FACTOR」1件。
- **判定方式**：クライアントで取得条件を判定し、本人の称号記録へ保存。追加の常時稼働サーバー・Blazeプランは前提にしない。本番に存在するデータだけで判定（`onlineRatedV2/privateState`、`nextAuthorityV1/weekly` のような本番に無い証明元に依存しない）。
- 既存の取得状態を維持、取得済みを消さない、一度取得したら条件を後で満たさなくなっても保持、本人以外の記録に書けない、ルールで本人確認と形式検証、再ログイン・別端末で維持、切替前にバックアップとロールバック手順。
- **No.25〜29（レート到達）**：旧ルーム対戦の最高レートとランダム対戦の最高レートを比較し**大きい方の最高到達値**で判定（現在値は不可、部門別称号と混同しない、丸めによる誤取得禁止）。※実装は未着手。「旧総合レートと部門別レートを同じ尺度で比較してよいか」の確認は**未決着**。
- **連勝称号**：A・B方式のルーム対戦＋ランダム対戦を通算。引き分けは連勝終了。同一試合の重複なし。時系列を復元できない過去の連勝は**推測で認定しない**。
- **通算勝利**：A、B、**過去のC方式**、ゴースト、ランダム対戦を含める（二重計上禁止）。C方式の過去勝利は保持。
- **週間ボス出撃回数**：ダメージ0でも出撃が正式に成立していれば1回。画面表示と出撃成立を区別。同じ出撃を二重計上しない。従来版（`raidw`）を使う。
- **取得条件が判定できない場合**：条件を緩和・推測しない。「今後イベント記録を追加する案」と「取得条件を変更する案」を分けて所有者に提示する。
- **隠し称号**：対象★5称号（26件）のうち**異なる15個**を取得で解放。取得前は非表示。旧システムから保持した★5も含める。同じ称号を重複して数えない。解放後は維持。

### 2.5 C方式（2vs2）の所有者決定
- レーティング対象にしない、詳細な貢献分析は不要、凍結中の新authority/確定writerは公開に含めない、簡易リザルトでよい。C方式の不正対策・内部再設計は今回行わない。
- 実装済みの非公開化：機能フラグ `FEATURES.cMode=false`（`index.html` の script 冒頭、`window.FXF_FEATURES` として公開）。入口（新ロビー、旧CPU選択、ホスト方式選択、ヘルプ）を隠し、`startMatch`（記録を消す前に拒否）、`startPractice`（保存済みC設定はBへ補正）、`createRoom`、`joinRoom`（旧版が作った待機中C部屋は案内付きで拒否、観戦は可）を制御。テスト：`tests/v6-c-hidden-browser.cjs`。
- **Firebaseルールでの禁止は見送り**（旧Ver.5.25端末が固まる恐れ）。旧端末はCの部屋を作れる状態が残る。

---

## 3. 本番Firebase・公開に関する現状
- **本番Firebaseルール・データは未変更。** 本番ルール全文はリポジトリに無い。
- 本番の `onlineSparkV1/config` の実際の値は**未確認**（リポジトリから見えない）。
- バージョンアップ：`version.json` は `{"major":5,"minor":25}` のまま。6.0 にするには、所有者がリポジトリ変数 `APPROVED_MAJOR_VERSION=6` を設定、`version.json` 更新、`game-version.js` 再生成（`scripts/build-version.cjs`）、`CHANGELOG.md` 追記が必要（`docs/game-version-policy.md`）。**未実施。**
- 本番デプロイは未実施・禁止。
- 実機（iPhone Safari、Chromebook、Android）の確認は**1件も未実施**。

---

## 4. 称号システムの現状（C）

### 4.1 構成（クライアント判定方式）
- **カタログ**：`src/title-catalog-next.json`（通常100件＋隠し `factor_factor`、★5は26件）。取得条件の対応表：`docs/next-major/TITLE_EVIDENCE_100.csv`。
- **コア**：`src/title-client-next.cjs`（純関数 `judge` `plan` `view` と `sync`）。
- **表示**：新プロフィールの「称号・装備」タブ（`src/next-profile-ui.jsx` → `src/title-inventory-ui.jsx`）。`sync` は `useEffect` で実行。ゲストは保存しない。
- **ルール断片**：`firebase/title-client.fragment.rules.json`（**本番未適用の候補**）。
- **設計文書**：`docs/next-major/V6_TITLES_CLIENT.md`（移行方式・バックアップ・ロールバック・次単位計画。追補はtitle-spark-onlyブランチ側にある）。

### 4.2 実装済み：No.30〜34（5件）
`easy_adept`(イージー≥1730)、`easy_master`(≥1820)、`normal_adept`(ノーマル≥1730)、`normal_master`(≥1820)、`dual_master`(両方≥1820)。
判定元：`games/factor/onlineSparkV1/profiles/<account>/{easy,normal}/maxRating` の**保存値そのまま**（丸めなし。1729.99 は付与されない。現在レートでは判定しない）。

### 4.3 保存先と方式
- `games/factor/titleNextV1/snapshots/<account>`：旧称号の固定（**1回だけ書ける**、以後変更不可）。
- `games/factor/titleNextV1/awards/<account>/<id>`：新称号の付与（**追加のみ**、`{earned:true, at:サーバー時刻, source:'client-judged-v1'}`）。
- 旧 `stats` / `nick` / Spark プロフィールには**書かない**。
- 画面表示は「旧称号（statsから毎回計算＋保存済みフラグ）」と「snapshot」「awards」の和集合。

### 4.4 旧称号のスナップショット（固定）— 付与とは別物
- 旧称号は**保存されていない**：`BADGES`（`index.html`）が `stats` から毎回計算している。保存されているのは `dailyV2/titles`、`stats.ghostTitles`、`onlineSparkV1/profiles/<k>/badges` のみ。
- そのため切替時点の取得状況を **snapshot に1回だけ固定**する（`badgesOf(stats)` の全ID＋上記3種の保存フラグ＋装備中 `stats.nick`）。
- **固定の安全条件**（書き込みは取り消せないため厳格）：実在アカウント／**`stats` が空でない**／接続中（`.info/connected` が false でない）。読み取りに失敗した場合は何も書かず `failed`。満たさない間は固定を**見送って**次回の同期で再試行する（空のsnapshotは絶対に書かない）。

### 4.5 ランダム対戦専用ユーザー（旧statsが空）の問題と修正
- **問題（dev に統合済みの版 = c8aa59c）**：旧 `stats` が空だと snapshot 固定を見送る設計のため、**新称号の付与まで止まった**。ルール案も「awards の書込に snapshot の存在が必要」としていた。
- **修正（`claude/v6-title-spark-only`、`6d5bf9a`、未統合）**：**新称号の付与と旧称号の固定を分離**。
  - `stats` が空/未取得でも、Spark の記録から No.30〜34 を判定・保存する。固定は従来の安全条件を満たしたときだけ作り、満たさない間は作らず次回再試行（`freezeDeferred` に理由）。
  - snapshot が無い間は、判明している旧フラグ（デイリー/ゴースト/Spark badges/stats由来）を**新規付与から除外**（後の固定で保持されるため二重付与にならない）。固定後は awards と snapshot の和集合で表示（重複1件）。
  - オフライン時は何も書かず `deferred`（書込がオフラインで固まるのを避ける）。
  - **ルール断片の変更は1か所のみ**：awards の書き込み条件から「snapshot が存在すること」を削除。残る条件（本人`logins`／未存在のときだけ=追加のみ／`at===now`／`source`／IDごとのSpark証拠 `maxRating` 閾値）と、snapshots 側のルール（本人・1回だけ・形式検証）は不変。awards から snapshot には触れられないので既得称号の保持は弱まらない。
- **dev にある版（`c8aa59c` 由来、`3851072` に含まれる）は上記修正前**であることに注意。

### 4.6 保存失敗の案内（dev に統合済み、`c8aa59c`）
称号タブに「新称号の保存を確認できませんでした。通信状態をご確認ください。」を**失敗時だけ**表示（正常時・見送り時は無表示）。**本番ルール適用前は本番で読み書きが拒否されるため、全ユーザーにこの案内が出る**（ルール適用が公開の前提）。

### 4.7 既得称号の保護方法（まとめ）
1. snapshot は write-once（ルール `!data.exists()`）。空では書かない。
2. awards は追加のみ（既存の上書き・削除はルールで拒否）。
3. 旧 `stats`/`nick` は書き換えない。条件を後で満たさなくなっても表示・保持は和集合なので消えない。
4. 読み取り失敗を「称号なし」と扱わない。
5. バックアップ/ロールバック：適用前に `accounts`・`onlineSparkV1/profiles`・`dailyV2/titles`・既存 `titleNextV1` をエクスポート、ルール全文も保存。新規書込みは `titleNextV1/{snapshots,awards}` のみなので、クライアントを旧版に戻し必要なら該当ノードを削除、ルールを戻す。旧 `stats` 由来の称号は影響を受けない。

### 4.8 未実装・未決定（称号）
- 実装済みは **No.30〜34 の5件のみ**。**残り95件（通常）＋隠し1件は未実装**（「実装済み」と書かない）。
- 判定元の整理結果（旧セッションの調査）：判定可能が約86件、**今後のイベント記録の追加が必要：66 王者防衛、84・85 攻撃無効化（保存は量で回数ではない。量→回数の換算は禁止）、89 任務完遂（連続日数の記録なし）**、69 ダークホース（開始時クラス内順位が未保存・旧判定と定義が違う）。
- 条件が旧称号と異なる/定義が必要なもの：4 daily_king（新=同日3部門、旧=別日でも可）、68 tour10（新=5回、旧=10回）、89 mis7（連続7日、旧=通算）、24 handi（「背負って勝利」の向きが旧と逆の可能性）、16〜18・39 連勝の範囲、95 wk_runs20、82 wkdex6（現行ボスは15種、「全6種」の対象が未確定）。
- **所有者の判断待ち**：①旧総合レートと部門別レートを同尺度で比較してよいか（No.25〜29）、②判定不能の 66/69/84/85/89 を「イベント記録の追加」と「条件変更」のどちらにするか、③wkdex6 の6種、④公開条件の表示文52件の承認（`src/title-reveal-next.json` は全て proposal）、⑤stats が永久に空のユーザー（ランダム対戦のみ）の旧称号フラグ固定を保留し続けてよいか（将来「固定済みのみを正とする」運用へ切替える前に決める必要）。
- `ownerClarifications.withdrawnFiveStarPromotion: 65` は古いキーの残り（削除/改名を推奨、未実施）。
- 隠し称号の対象★5 26件と判定：解放ロジックは Emulator 専用のサーバー側コード（`server/next-authority/titles.cjs`）と planner にあるが、**クライアント判定としては未実装**（サーバー側は付与済み全体、planner は保持済みのみを数える不一致あり。クライアントで一本化が必要）。

### 4.9 本番公開前に必要なFirebaseルール対応（称号）
- 本番ルールは `titleNextV1` を定義しておらず、ルートが `.read/.write:false`（調査時点の読み取り。本番そのものは**未確認**）。
- 所有者作業：①現行ルール全文を Console から書き出して保存 ②関連データを書き出し ③`firebase/title-client.fragment.rules.json` を `games/factor/titleNextV1` に統合（**称号を増やすたびにID別の証拠条件を追記**） ④統合版を `RTDB_RULES_BASELINE` secret と比較（secret 未設定だと公開ワークフローが止まる。適用後は secret の更新も必要） ⑤Emulator で `tests/title-client-emulator.cjs` が通る版を適用 ⑥本番で1アカウントだけ実機確認。
- **この作業は未実施。AIは本番ルールを適用しない。**

---

## 5. ランキング刷新（実装済み・dev 統合済み）
- 入口3つ維持。中身を刷新：`src/ranking-kit.jsx`（`RankRow` `Segmented` `ListState` `RankingHead` `RankList`）、`src/solo-ranking-ui.jsx`、`src/daily-ui.jsx`（`rankingsOnly` 分岐）、`src/online-rated-ui.jsx`（`rankingMode` 分岐）、`ui-next/ranking.css`。
- ソロ：難易度タブ、TOP20、自分の行を強調（`withRanks`・GAS取得は従来のまま）。デイリー：今日/昨日・難易度タブ、TOP10、前日優勝表示。レーティング：イージー/ノーマル、自分の順位カード、掲載条件は従来どおり。
- 集計条件・順位・同点処理・件数・取得元は**変更していない**。TOP外の自分の順位は計算しない（仕様）。
- テスト：`tests/ranking-ui-browser.cjs`、`tests/ranking-hub-browser.cjs`。
- 既知：旧ソロメニュー内のランキング窓（ranking画面以外の経路）は旧デザインのまま。

---

## 6. リザルト画面統一【最新の実装状況】（D）

作業ブランチ：**`claude/v6-result-shell`**（dev `3851072` から分岐、origin に push 済み、**dev 未統合**）。HEAD は GitHub で確認：`6711de560cb9`。

| コミット | 内容 |
|---|---|
| `72da0a9` | ResultShell基盤＋A/B2/CPUリザルト |
| `93958b1` | ソロリザルト |
| `68c891a` | ランダム対戦リザルト |
| `02b5641` | 大会B2最終リザルト（別単位） |
| `6711de5` | 仕上げのCSS修正（ランダム対戦の見出しに旧勝利演出の装飾が残る問題） |

### 6.1 ResultShell の構成とファイル
- `src/result-shell.jsx`：`ResultShell` `ResultDetails` `ResultActions` `ResultButton` `ReviewCard` `TitleReveal`、`wordOf`（WIN!/DRAW/LOSE）。
- `ui-next/result-shell.css`：トークンと各部品、ソロの送信UI（`rs-net`）、ランダム対戦用の上書き（`.or-result.rs-rated`）、大会（`rs-page`）。`index.html` が `<link>` で読み込む。
- `src/next-battle-result-ui.jsx`：`BattleSummary`、`SoloSummary`、`MinimalSummary`（新規：ヒーロー＋成長だけの要約）。`src/next-results-ui.jsx` が `window.NextResults` として公開。
- `src/battle-result-model.cjs`：`LOSE…` → `LOSE`。
- **ResultShell は表示専用**：結果確定・保存・送信・受領確認・再戦は呼び出し側の既存コールバックのまま。

### 6.2 共通部品
- **ResultActions/ResultButton**：下端に固定（`position:sticky`。親が全体を包むことが条件）、短い画面は横並び、保存/送信中のみ押せない（`busy`）。
- **ResultDetails**：A方式の得点推移などの詳細パネル（新配色）。
- **ReviewCard**：「📝 ふり返り（…）」の開閉カード。
- **TitleReveal**：バッジのめくり。**同じ試合（`アカウント:試合ID`）を `localStorage` の `fxf_title_reveal_v1:<key>` に記録し、再表示では音・演出を再生しない**。動きを減らす設定では静止表示。既得称号を新規扱いしない（呼び出し側の判定を使う）。

### 6.3 方式別
1. **A/B2・CPU**（`BattleResult`、`index.html`）：要約、A得点推移（`AResultDetails` を新配色に作り直し、`data-a-result`/`data-a-question` は維持）、B2詳細（`BDetails`）、ふり返り、操作ボタンを1つの `fx-scroll` 内にまとめた。再戦の準備OK、参加者の準備チップ、ホストのルール変更、部屋を出る、CPUの「同じルールでもう一戦」「CPUの設定にもどる」、大会の「大会の表にもどる」は**既存ハンドラのまま**。C方式・旧Bは旧表示のまま（`summary` が作れない場合のフォールバック）。
2. **ソロ**：ネット送信（名前入力・送信・再送信・スキップ）を新配色の `rs-net` に。状態遷移・送信内容は不変。「もう一度あそぶ」「タイトルにもどる」「学びの部屋へ」、LEVEL UP の帯、EXP 表示を維持。自動送信中のみ操作行を押せない。
3. **ランダム対戦**（`src/online-rated-ui.jsx` の `Result`）：`ResultShell`＋`BattleSummary`（データが揃う場合）/`MinimalSummary`。`.or-result` `data-result-kind` `.or-delta` `.or-exp` `data-new-title` `.or-victory-rays` は維持。レート before→after・増減、通常/指名/自分ゴースト練習の説明、EXPは従来どおり。**旧 `Result` は `ResultLegacy` として残してフォールバック**。H（コンポーネント注入）に `nickOf` `fxSound` `FX` を追加。
4. **大会B2最終**（`TournamentB2Final`、`index.html`）：WIN!/DRAW/LOSE、「大会B方式・公式レーティング対象外」、確定得点推移、保存状況、「大会の表にもどる」。**保存処理（stats transaction）と勝敗確定は不変**。戻るボタンは保存中のみ押せず、成功/失敗/8秒で解除。

### 6.4 主要な仕様事項の実装
- **WIN!/DRAW/LOSE**：全方式で統一（所有者決定①）。3人以上で負けた場合は大きく「◯位」＋小さく「LOSE」（**この扱いは所有者の承認待ち**）。
- **ソロは CLEAR! / GAME OVER を維持**：所有者決定「勝敗が明確でない画面は既存の結果判定に従い、無理に勝敗を作らない」に従う。
- **1つのスクロール容器**：A/B2/CPUは既存の `fx-scroll`、ソロ/ランダム対戦/大会はページスクロール。内側に独立スクロール領域を作らない（テストで検査）。
- **保存・送信・再戦の維持**：ランキング送信、再戦準備OK、大会記録保存、レーティング/EXP/称号の処理は触っていない。
- **ランダム対戦の `ackReceipt`**：`App` 側の `send({type:'ackReceipt'})` を不変。1クリック=1回、失敗時は結果画面に残る（現行挙動）、再試行で成功すると退出、再戦ボタンは追加しない。回帰テストあり（`tests/result-rated-browser.cjs`）。
- **既存データだけの比較・ハイライト（ランダム対戦）**：`aResult` / `game` / `bResult` に記録がある項目だけ表示。無ければ非表示。Firebase保存形式・集計は不変。Perfect は問題ごとの判定が記録されていないため出さない。

---

## 7. リザルト画面のテスト状況（E）— 正確に

| 項目 | 状況 |
|---|---|
| ローカル全体検証（公開用26本＋開発用回帰＋Emulator。実行結果ファイルで `exit=0` 55行、失敗なし） | **`02b5641` まで全件成功**（旧セッションの報告。結果ファイル `/tmp/final8` はセッション終了で失われる可能性あり＝再確認不可） |
| 最終CSS修正 `6711de5` 後 | **関連テストのみ再実行**（`tests/result-rated-browser.cjs` が成功。それ以外の再実行は未確認） |
| **`6711de5` での全55項目の通しテスト** | **未実施** |
| GitHub Actions（開発用CI） | **`claude/v6-result-shell` では未実施** |
| dev への統合 | **未統合** |
| 実機（iPhone Safari・Chromebook 等） | **未実施**（Playwright の 375×844 / 390×844 / 1440×900 / 683×325 のみ） |

新規・更新したテスト：`tests/result-solo-actions-browser.cjs`（新規）、`tests/result-rated-browser.cjs`（新規）、`tests/next-battle-result-browser.cjs`、`tests/tournament-b2-browser.cjs`、`tests/online-ui-v514.cjs`、`tests/online-playability-browser.cjs`（旧勝敗文言の期待値更新）。`package.json` に `test:result-shell`、`.github/workflows/next-major-checks.yml` に新テストを追加済み。

### 7.1 ランダム変更に関する直前の最重要メモ
- 称号修正ブランチ側（`claude/v6-title-spark-only`）の検証：ローカルのユニット15件・Emulator・実画面・称号関連回帰は成功（報告ベース）。**GitHub Actions 未実施、全体の通しテスト（公開用26本等）は未実施。**

---

## 8. リザルト画面の残課題（F）
- **要所有者判断**：3人以上の対戦で「順位を大きく、LOSE を小さく」の現行案の承認（「LOSE」を大きく出す案もあり）。
- 非公開のC方式・旧B方式の結果表示は旧UI（`summary` 無しのフォールバック）。
- `BDetails`（B2詳細）は元から暗い配色のためそのまま使用（新配色に揃える余地は未検討）。
- **大会の保存中ボタン制御**：保存を遅延させた状態の自動テストは未作成（保存完了後の状態のみ確認）。
- 実機での表示確認は未実施。
- `result-rated` の比較・ハイライトは実データ形に依存（Perfectなど記録が無い項目は出ない）。

---

## 9. UI統一の残作業（G）— 実コード確認ベース

| 画面 | 状態 | 備考 |
|---|---|---|
| HOME | **完成** | `src/next-home-ui.jsx`、`ui-next/home.css` |
| オンラインロビー | **完成** | `src/next-lobby-ui.jsx` |
| ランキング（3種） | **完成（dev統合済み）** | 旧ソロメニュー内の窓は旧のまま |
| 新プロフィール/称号一覧 | **一部完成** | 称号一覧は新デザイン。**装備ボタンは無く、装備は旧 `PlayerProfile` モーダル**（「称号の装備・詳細記録」）。ゴースト履歴・自己ゴースト対戦も旧モーダル内 |
| リザルト（A/B2/CPU/ソロ/ランダム/大会） | **実装済み（未統合・未実機確認）** | 第6章 |
| ソロメニュー | **一部完成** | 旧メニューを新枠で包んだ形。「オンライン対戦・CPU練習」「接続チェック」「旧ランキング」「あそびかた」等の重複導線が残る |
| ソロプレイ画面 | **未実装（旧デザイン）** | `FactorHunt`。外枠のみ統一する想定、リスク高 |
| A/B2/CPU プレイ画面 | **未実装（旧デザイン）** | `BattleView`（`src/online-rated-ui.jsx`）/`GameA`/`GameB`/`room-b2-ui.jsx`。盤面の READY/FREEZE 中のアンマウント、タッチドラッグ、短い画面の制約あり。CPU練習は2系統（B2は `RoomB2App`） |
| ゴースト選択画面 | **未実装（旧紙色 `or-app`）** | `OnlineRatedApp view='ghosts'` |
| ランダム対戦 待機・投票 | **未実装（旧紙色）** | `view='match'`、旧 `QmWait`/`QmVote` もフォールバックで残る |
| 週間ボス | **未実装（旧デザイン）** | 従来版 `WeeklyRaidApp` を継続（本番化方針どおり） |
| 共通モーダル | **未実装** | `V7Modal`（Escなし・フォーカス制御なし）が約7か所。`<dialog>` ベースへの置換案あり |
| 設定 | **一部完成** | ホームの設定は新デザイン |
| あそびかた | **完成** | 戻り先が「ソロメニュー」 |
| 重複導線の整理 | **未実装・未承認** | デイリーミッションの入口3か所、旧「← タイトルへ」系、称号の入口2か所など。**削除は所有者承認が必要** |

提案された実装順：①`claude/v6-result-shell` と `claude/v6-title-spark-only` の統合判断 ②ゴースト・ランダム対戦の待機/投票 ③プレイ画面の外枠（オンラインA/B2→ソロ最後） ④称号の装備ボタン ⑤共通モーダル・導線整理。デザインの大きな変更は所有者確認が先。

---

## 10. GitHub の現在地（H）— 2026-10-17 に `git fetch` で確認

| ブランチ | HEAD | 状態 |
|---|---|---|
| `main` | `558488543e10…`（5584885） | 本番。`version.json` 5.25。**変更禁止** |
| `dev/next-major-20261015` | `3851072f4a55…` | main より 79 コミット先行。`claude/v6-ranking-ui` と同一SHA（統合済み） |
| `claude/v6-title-spark-only` | `6d5bf9a678e8` | dev に対して +1 / −0（未統合）。変更：`src/title-client-next.cjs`、`src/next-profile-ui.jsx`、`next-home-ui.js`（生成物）、`firebase/title-client.fragment.rules.json`、`docs/next-major/V6_TITLES_CLIENT.md`、称号テスト3本 |
| `claude/v6-result-shell` | `6711de560cb9` | dev に対して +5 / −0（未統合）。22ファイル（第6章） |
| `claude/v6-ranking-ui` | `3851072f4a55` | dev と同一（統合済み） |
| `claude/v6-c-hide-random-off` | `fc85ffba48b2` | dev に含まれる（統合済み） |
| `claude/publish-tests-newui` | `160809483447` | dev に含まれる（統合済み） |
| `claude/solo-result-ui` | `9347060c1a56` | 旧dev。dev に含まれる |
| 凍結：`claude/c-writer-min` / `c-input-log` / `c-input-hardening` / `c-replay-solo` | `6dff7c61b36a` / `2210b9e731c0` / `423bff333474` / `7bbf2a2c20fb` | **dev 未統合・変更禁止** |

- **2本の相互関係**：`title-spark-only` は `result-shell` を含まず、`result-shell` も `title-spark-only` を含まない（どちらも dev `3851072` から分岐）。
- **最後に成功した開発用CI**：Run **38977792968**（`dev/next-major-20261015` @ `3851072`、全工程成功）。同内容のブランチ側：Run 38976438387（`claude/v6-ranking-ui` @ `3851072`）。それ以前の成功：38948644002（dev @ `fc85ffb`）、38946175968、38928211417。
- **未実施のCI**：`claude/v6-title-spark-only` @ `6d5bf9a`、`claude/v6-result-shell` @ `6711de5`。
- **作業ツリー**：資料作成前は `claude/v6-result-shell` 上でクリーン（未コミットなし）。この `V6_HANDOFF.md` が未コミットの新規ファイル。
- **統合時の衝突/依存の見立て（実際のマージは未試行）**：
  - 両ブランチとも**生成物をコミット**している。統合後は `node scripts/build-online-rated.cjs` → `python3 scripts/title-evidence-next.py` を再実行して**ドリフト検査**を通す必要がある。`title-spark-only` は `next-home-ui.js`、`result-shell` は `next-results-ui.js`/`online-rated-ui.js`/`index.html` を変更（同一生成物の衝突は無い見込みだが**未確認**）。
  - `result-shell` は `index.html` の行番号を動かすため `docs/next-major/TITLE_EVIDENCE_100.csv` と `reports/*` を再生成済み。`title-spark-only` 側にその変更は無い。
  - **開発用CIは両ブランチの `branches:` に未登録**。CIを走らせるには `.github/workflows/next-major-checks.yml` の対象に1行追加する（所有者承認）。**両ブランチが同じ行を編集すると衝突する**ため、順番に統合し、追加行は統合ごとに扱うこと。
  - 統合は fast-forward のみ。2本目は1本目の統合後に dev へ追従が必要になる（merge/rebase は所有者承認が必要。**勝手に行わない**）。
- **会話の報告と GitHub の差異**：
  - 会話で「CLAUDE.md」の存在を前提にしていたが、**リポジトリに `CLAUDE.md` は存在しない**（`docs/next-major/CLAUDE_DEVELOPER_HANDOFF.md` と `CLAUDE_START_PROMPT.md` が近い役割）。
  - それ以外（各ブランチの HEAD・コミット列・統合状況）は会話の報告と一致。
  - 旧セッションのローカルテスト出力（`/tmp/...`）は GitHub 上に無く、再確認はできない。

---

## 11. 開発上の絶対ルール（I）
1. `main` を勝手に変更しない。本番 Ver.5.25 を変更しない。
2. **本番Firebaseルール・データを変更しない。** 本番デプロイしない。`math-tower-pages.yml` を起動しない（`workflow_dispatch` はデプロイ）。
3. dev への統合は**所有者の承認後**、fast-forward のみ。**force push 禁止。**
4. 称号修正ブランチとリザルトUIブランチを**勝手にマージ・リベースしない**。凍結C系ブランチを触らない。
5. 既得称号・既存記録を保持。`stats`/`nick`/対戦記録を書き換えない。
6. ゲームルール・レーティング・EXP計算を勝手に変更しない。旧B方式を廃止しない。
7. C方式と数理の塔を一般公開しない。
8. **テスト成功を確認してから**コミット・push。大きな変更は実装単位に分ける。
9. 所有者が未承認の事項（仕様変更、称号条件変更、機能削除/非公開、公開範囲・優先順位、デザイン大変更、複数案のデータ移行）は**実装前に質問**。
10. 取得条件を判定できない称号は、緩和・推測せず「記録追加案/条件変更案」を提示。
11. 秘密鍵・認証情報・トークンをコミット・文書に書かない。

### 11.1 開発のコツ（過去の失敗から）
- `index.html` を編集して行番号が動いたら `title-evidence-next.py` を再生成（`--check` が `TITLE_EVIDENCE_100.csv must be regenerated` で落ちる）。
- 生成物（`*-ui.js`）のドリフトはCIで落ちる。ソース変更後は必ずビルドしてコミット。
- `online-v524` は日本時間0時またぎで「残り0回」待ちが失敗することがある（時刻依存。実行した時間帯に注意。ゲームの不具合ではない）。
- `online-entry` は `npm run build:pages`（`dist/`）が先に必要。
- `sticky` の操作行は親が結果全体を包む必要がある。内側に `overflow:hidden` の祖先があると効かない。
- 旧テストの文言（「勝利！」「VICTORY！」「LOSE…」）はリザルト統一で WIN!/DRAW/LOSE に更新済み。

---

## 12. CLAUDE.md の扱い
- 現状：**リポジトリに `CLAUDE.md` は無い**（確認済み）。作成していない。
- 提案（未実施。所有者の承認後）：長期ルール（第11章の1〜11、第1.6章のブランチ運用、第1.5章のテスト/CIコマンド、日本語で報告、PR・マージ・デプロイは明示許可があるときのみ）を `CLAUDE.md` に置き、進捗・ブランチ状況・未決定事項は本資料（`V6_HANDOFF.md`）に限定する。

---

## 13. 参照すべき文書（`docs/next-major/` ほか）
- 開発方針・状況：`CLAUDE_DEVELOPER_HANDOFF.md`、`CLAUDE_START_PROMPT.md`、`PHASE2_STATUS.md`、`UI_DESIGN_SPEC_FOR_CLAUDE.md`、`UI_SCREEN_STATUS_FOR_CLAUDE.md`、`PHASE4_PENDING_DECISIONS.md`
- 称号：`V6_TITLES_CLIENT.md`、`PHASE7_TITLE_AUTHORITY.md`（Emulator専用authority）、`PHASE5_TITLE_CUTOVER.md`、`PHASE4_TITLE_COMPATIBILITY.md`、`TITLE_REVEAL_REVIEW.md`、`TITLE_EVIDENCE_100.csv`、`src/title-catalog-next.json`
- 週間ボス：`PHASE4_WEEKLY_CONNECTION.md`、`PHASE6_WEEKLY_AUTHORITY.md`、`AUTHORITY_OPERATIONS.md`（authorityの本番化は今回しない）
- C方式：`PHASE5_C_EVIDENCE.md`（凍結中）
- リザルト：`PHASE2C_RESULTS.md`、`result-impl-screens/`、`solo-result-screens/`、`result-proto/`
- バージョン・公開手順：`docs/game-version-policy.md`、`docs/next-update/qa-and-release.md`、`docs/online-spark-setup.md`、`docs/handover/`（`10_KNOWN_ISSUES.md` ほか）
- Firebase：`firebase/*.json`、`reports/2026-10-12_firebase-production-rules-audit.md`

---

## 14. 新セッションで最初に行うこと（J）
1. **本資料（`docs/next-major/V6_HANDOFF.md`）と `docs/next-major/CLAUDE_DEVELOPER_HANDOFF.md`、`V6_TITLES_CLIENT.md` を読む。**（`CLAUDE.md` は無い。第12章）
2. **GitHub の最新状態を確認**：`git fetch origin` → `main`/`dev`/`claude/v6-title-spark-only`/`claude/v6-result-shell` の HEAD と dev との差（`git rev-list --count`）を第10章と照合。差があれば所有者に報告。
3. 未統合の2ブランチ（称号修正・リザルトUI）の差分を `git diff --stat origin/dev/... origin/claude/...` で確認。**マージ・リベース・チェックアウト上書きをしない。**
4. 最新コミットのテスト状況を確認（第7章：`6711de5` の全体通しは未実施、CIは両ブランチとも未実施）。
5. **所有者へ開発状況を報告**（実装済み／未検証／未決定を区別して）。
6. 所有者の承認を得てから、CI確認（`next-major-checks.yml` の対象にブランチ名を1行追加）→ fast-forward統合（CI全工程成功後のみ）→ 統合後のdev CI確認 → 次の実装へ。2本の統合順序と、2本目の dev 追従方法も承認を取る。

### 14.1 推奨する次の実装候補（承認が前提）
称号：No.25〜29（確認後）→デイリー/ゴースト/賞金首/ログインボーナス→週間ボス→試合内容系→連勝等→大会・継続→隠し称号。UI：第9章の順序。

---

## 15. 未決定・未検証事項の一覧（所有者に確認が必要なもの）
**未決定**
- 3人以上の負けの表示（「◯位」大＋LOSE小、または LOSE大）
- 称号：No.25〜29のレート比較の尺度、連勝の扱いの細部、66/69/84/85/89 の方針、wkdex6 の6種、公開条件52件の承認、statsが空のままのユーザーの旧称号フラグ固定
- 重複導線の削除可否、ソロメニューの整理範囲、共通モーダルの置換方針
- 本番 `onlineSparkV1/config.enabled` の運用タイミング、バージョン6.0の手続き
**未検証**
- 2本の未統合ブランチのCI（未実施）、通しテスト（`6711de5`/`6d5bf9a` で未実施）
- 実機（iPhone Safari・Chromebook・Android）
- 本番ルールの実際の内容、Emulator検証のうち本番ルールのスナップショットが必要なもの
- 大会の保存中ボタン制御の遅延ケース

## 第9工程A4（逆境無双 `handi`）— 実装メモ
- **正式条件**：自分自身が★★★ハンデを背負って勝利。旧条件（相手に★★★ハンデがいる勝利＝`handiWins`）は向きが逆だった。
- **新カウンタ `handiSelf`（所有者が今回に限り例外承認）**：`recordMatch` に渡す `add` に `win && hc[me]>=3`（`state.handi`＝部屋の正式なハンデ記録）のときだけ1を足す。敗北・引き分け・相手だけのハンデ・★★未満では足さない。対象範囲は従来の `handiWins` と同じ（`recordMatch` を通る戦績保存対象のルーム・大会。CPU練習は対象外）。二重計上は、同じトランザクションで `games` 等と一緒に加算されるため既存の `roomSeen`（B2の部屋ID）の保護に従う。
- **旧カウンタ `handiWins`**：削除・リセットしない。6.0の対戦結果処理は以後加算しない（5.25端末だけが加算し得る）。
- **取得判定（BADGES）**：`handiSelf>=1` または（有効な`stats.tk`があれば`tk.ids.handi`、無ければ`handiWins>=1`）。保護モジュールが無い・壊れている場合は例外を出さず旧条件にフォールバック（既得は失わない）。固定の失敗は既存の `FXF_KEEP_DIAG` で検知。
- **未解決リスク（公開準備）**：旧Ver.5.25端末が`tk`固定前に`handiWins`を書くと既得と区別できない／固定後に書かれた分は6.0では数えない。完全に止めるには本番Security Rulesの変更が必要（所有者作業・未実施）。天下統一(`daily_king`)の旧5.25累積書込みも同様に未解決。

## 第9工程A5（ミッション皆勤 `mis7`）— 実装メモ
- 正式条件：7日連続でデイリーミッションをすべて達成。ミッションの日付(JST `jstDate()`)ごとに1回、`stats.misRun={last,n,best}` を更新（前日なら+1、途切れたら1、同日・過去日付は数えない）。`best>=7` で取得。
- 全達成時の統計更新を `statsTx` 経由に変更（先に `ensureKeep` が走り既得を固定）。`misDays` は従来どおり加算（表示・旧版互換）。
- 判定：`misRun.best>=7` または `keptTitle`（有効なtkなら`tk.ids.mis7`、無い・モジュール不可なら旧条件`misDays>=7`）。

## 第9工程A6（ダークホース `darkhorse`）— 実装メモ
- 正式条件：大会開始時点でクラス全体のレート順位が11位以下の人が優勝。クラス全体の名簿を保証できないため**新規付与を停止**（結果画面の `add.darkHorse` 加算を削除。大会の出場者だけをクラス全体と見なさない）。
- 判定：`keptTitle`（有効なtkなら`tk.ids.darkhorse`、無い・保護不可なら旧`darkHorse>=1`）。既得・装備・旧統計は変更しない。
- 将来の教師指定名簿方式：新カウンタを別名で追加して付与する設計（`DARKHORSE_ROSTER_NOTE`に予約。書込み経路は未実装、名簿管理機能は新設しない）。

## 第9工程A7（連勝称号 `streak10/30/50`）— 実装メモ
- **正式連勝 `stats.sk`**（`src/streak-next.cjs`）：`{v,n,best,n0,l:{<試合ID>:{t,o,s,r?}}}`。直近64試合の台帳を**時刻順に並べ直して**数える（`n0`＝台帳の先頭より前の連勝数）。勝ち+1、負け・引き分け0。`best` が10/30/50で取得（即時）。旧 `streak`/`maxStreak` は懸賞金・お尋ね者・プロフィール用に従来どおり更新（意味は変更しない）。
- **対象**：部屋戦（A/B/C・クラス大会・CPU・BOT）は `recordMatch` の `info.sk`（ID=`r-<部屋>-<gid>`、時刻=`fbNow()`）。ゴースト戦（`state.ghostKey`）・CPU練習は対象外。Spark人間対戦・BOT型対戦（`m.opponent` なし、または `opponent.type==='bot'`）は `apply(m)`（学習ゴースト/ハイパー・自分自身の練習は除く）で `s-<試合ID>` をlocalStorageキュー（`src/streak-queue-next.cjs`）に入れ、統計トランザクションがコミットされてから削除（失敗は次回の `ensure()`／結果反映で再送）。
- **順序が決められない場合は連勝を再開始**：部屋戦とSparkが5秒以内で結果が異なる／満杯の台帳より古い結果／壊れた台帳。`best` は下がらず、称号は取り消さない。遅れて届いた結果は現在の連勝を再計算するが、それだけでは `best` を上げない。
- 既得：`keptTitle`（有効なtk→tk.ids、無い・保護不可→旧`maxStreak`条件）。Spark由来で取得した場合の取得演出は、次に部屋戦の統計更新があるまで出ない（取得自体は即時）。
- 残るリスク：旧5.25端末の `maxStreak` 書込みはtk固定後は数えない／固定前は既得扱い。欠けた負けが後から届くまでの間は連勝が長く見える可能性（5秒窓外の遅延到着）。

## 第9工程A8（防御称号 `cancel500/2000`）— 実装メモ
- 正式条件：攻撃を累計500／2000回無効化。**量ではなく完全に無効化した攻撃の回数**を新カウンタ `cancelFull` で数える（旧 `cancelTotal`＝相殺した量は表示・旧版互換のため従来どおり）。
- 数え方：待機中の攻撃を古い順に打ち消し、**残りが0になった攻撃1回につき+1**（途中までで残りが着弾した攻撃は数えない。部分的に打ち消した後に残りも打ち消した場合は着弾していないので1回）。旧A/B/C系は `sendAttack` の予告配列（1件=攻撃1回）、新B2（Spark/大会）は `server/online-rated/b2.cjs` に待機中の攻撃の大きさの列 `pendQ` を追加（量の計算は不変。更新前から進行中の試合は `pending` から再構築）。仲間のカバー（C方式の `coverPend`／`covered`）は自分の相殺ではないので数えない。
- 判定：`cancelFull>=500/2000` または `keptTitle`（有効なtk→`tk.ids`、無い・保護不可→旧`cancelTotal`条件）。
- `tests/v6-a8-cancel.test.cjs`：`b2.cjs`／`sendAttack` が基準(949f2cc)と**計数の追加文以外同一**であることを文字列射影で検証。

## 第9工程A9（その他の戦績・レート称号）— 実装メモ
- **実装した（既得を失わない＝旧条件の上位集合で追加のみ）**
  - `games100 / games300`：通算戦数＝部屋戦の`games`（旧記録を含む＝切替時点の旧gamesが基準）＋Spark人間/BOT型対戦`sg`＋ゴースト戦`gg`。Sparkは台帳に今回記録された試合だけを1回数える（`src/spark-stats-next.cjs`、再送・複数端末の重複は台帳が弾く）。ゴースト戦は既存の受領記録 `ghostAwards[試合ID]` を最初に作るときだけ+1。
  - `dual`：A方式・B方式それぞれ10勝。`A.w`/`B.w`（部屋戦）＋Sparkの方式別勝利`sw.A`/`sw.B`（C方式・ゴーストは数えない）。
  - レート称号（`rgold master1600 master1700 rmaster master1900`）：旧総合 `maxRating` と Spark イージー最高（`stats.sx.e`、Sparkプロフィールのミラー・上げるだけ）の大きい方。
- **記録して未実装（仕様確定待ち／判断が必要）**：Sparkノーマルのスケールを含めるか（レート称号は現状イージーのみ）／`first lose50 rival20 wide10 wide30 perfect* daily7 daily30` のSpark対戦分と日付基準（端末日→JST）／`bounty*` のゴースト賞金／`revenge`（「直前の試合」の解釈）／`wanted`（`maxStreak>=7`＝懸賞金式と連動、連勝仕様と切り離す設計が要）／`ojama*`（単位の文言）／A方式のA/B別Sparkではない試合。

## 第9工程B（新称号 実装9件／未実装1件）— 実装メモ
正式カタログ（`src/title-catalog-next.json`）の ID・名称・条件文を唯一の基準に、`BADGES` へ追加。取得判定は追加のみで既得・装備・旧統計に影響しない。**CPUが加わった部屋は新称号の対象外**（カタログ `excludedAwardModes: cpu, selfGhost`。結果画面の `humanOnly`）。
| ID | 名称 | 判定 |
|---|---|---|
| online_first | 開戦の狼煙 | 登録プレイヤーとの部屋戦（`stats.vs`）またはSpark人間対戦（`stats.og`）が1試合以上 |
| wins100_ab | 百人斬り | `A.w+B.w`＋Sparkの方式別勝利`sw.A+sw.B` が100（C方式・ゴースト除く） |
| dual50 | 二刀皆伝 | A方式・B方式がそれぞれ50勝（`dual`と同じ集計） |
| giant250 | 王者喰らい | 対戦開始時のレートが250以上高い登録プレイヤーに勝利（部屋戦＝`state.rt`、Spark人間対戦＝受領記録の開始前レート）→`giant250Wins` |
| flash3 | 神速の領域 | B/C方式で1秒以内の正解が1試合に3回以上（A方式は1問ごとの時間記録が無いため対象外）→`flash3` |
| accuracy10 | 百発百中 | 1試合10問以上正解・誤答0・時間切れ0（勝敗不問。A方式は自分の正解10以上かつお手つき0）→`accuracy10` |
| wksup500 | 影の守護神 | `wk.sup>=500` |
| wk_runs20 | 戦友の絆 | 出撃を最後まで完了した回数 `wk.runs>=20`（途中で止めた出撃は数えない） |
| lb_cards7 | 七つの宝印 | `login.cards>=7` |
- **未実装（仕様確定待ち）**：`tour_streak2` 王者防衛（クラス大会2大会連続優勝・欠場で連覇が途切れる）— 「同じクラスの大会の連続」と「欠場」を判定するには、クラスごとの大会の並びと各大会への参加記録（出場名簿）が必要だが現状の保存データにない。教師指定名簿方式（ダークホースと同じ前提）の確定後に実装。
- テストの件数固定（`rewards-audit`：BADGES 92→101、有効 87→96）と `title-evidence-next.py` の旧台帳件数（97→106）は、9件の追加に合わせて更新（正式カタログ100件・★5の26件は不変）。

## 第9工程C（隠し称号 `factor_factor` FACTOR×FACTOR）— 実装メモ
- 条件：正式カタログの★5称号26種のうち、**異なる15種類**を取得（隠し称号自身は数えない・重複は1回）。取得状態は画面側の「取得済み一覧」（BADGES＝旧条件の既得保護`keptTitle`を含む／日別称号／Sparkバッジ／ゴースト称号／新称号）から数える。
- `src/title-compat-next.cjs` の `read({deriveHidden:true})`（クライアントの画面だけが指定。既定は従来どおり保存記録のみで「推定付与」しない）。15種類に達した瞬間に所有扱い。
- **保存と取り消し禁止**：初めて達したときに自分のアカウントに `stats.ff={v:1,at}` を1回だけ保存（追加のみ・既存統計と装備は変更しない）。以後は保存記録で所有を維持し、証拠が15未満に見えても取り消さない。
- **非表示と演出**：取得するまで名称・条件は一覧に出さない（`visibleBeforeEarned:false`）。取得演出は既存の称号一覧の仕組み（`claimAutomatic`／端末の保存フラグ）で**1端末につき1回**。装備は既存の単一スロット（`stats/nick`）。本番ルールに `titleNextV1` が無い現状では端末ごとの1回表示になる（複数端末で共有する1回は `titleNextV1/presentations` のルール適用後）。
- 注意：★5のうち `tour_streak2`（王者防衛）は未実装のため、現状取得可能な★5は25種（15種に達するには十分）。
