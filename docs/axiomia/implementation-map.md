# AXIOMIA 第1部 実装対応表（Ver.6.17：プロローグ＋第1層）

正式原典は `docs/axiomia/story/` の11編。ゲームデータは原典から生成する（手で書き換えない）。

```
node scripts/build-axiomia.cjs          # docs/axiomia/story -> math-tower/axiomia-part1.json
node scripts/build-axiomia.cjs --check  # 生成物が原典と一致しているか
```

`npm run build:pages` は `build:tower` の中でこれを実行する。CI は生成物がコミット済みと一致することを確認する。

## 構造

```
第1部（content.part = 1）
 ├ prologue.events       AX1-L00-S1 … S5
 └ layers[]              層 → 地点(floors 1..5) → イベント → 戦闘 → 戦闘後会話
     ├ floors            地点 → 敵（1:count_rabbit 2:zero_slime 3:twin_fox 4:abs_wolf 5:nul＝ボス）
     ├ flow.pre / flow.post   地点ごとに表示するイベントID（地点5の post は clear → fragment → gate が続く）
     ├ battleBg          地点ごとの戦闘背景
     ├ notes / fragment  数学ノート4件 / 第一の断片
     └ events[]          会話イベント
```

- イベントID：`AX1-L{層2桁}-P{地点}-{pre|post}`、`AX1-L{層}-clear`、`-fragment`、`-gate`、プロローグは `AX1-L00-S{n}`。
- 各会話行は `[話者, 本文, 演出, "原典ファイル:行番号"]`。話者の表示名は原典の表記のまま（`opts.name`）。
- 進行データは形式3：層ごとのキーは `L<層>-<地点>`（`clearedFloors`・`kills`・`notes`・`seen`・`records`）。`adventures[難易度].layer` が現在の層。
  `difficulties[難易度].layerBest[層]`、`fragments[層]`。旧第1章のキーと `best` は変更しない。
- 旧第1章（`math-tower/chapter1.json`）は従来のままの形で読め、旧テストはそのまま動く（`R.view()` が両方の形を同じ画面用の形にする）。

## 演出の指定（原典に書かれていない部分）

原典は背景・効果を指定していないため、`scripts/build-axiomia.cjs` の `STAGE`／`BG_LABELS`／`BACKGROUNDS` に明示している。
指定は原典の本文そのものに紐づけ、1回ずつ必ず一致しないとビルドが失敗する（黙って落ちない）。

| 背景ID | 使う場面 | 状態 |
|---|---|---|
| classroom | プロローグ S1 | 採用済みの画像（旧第1章と同一） |
| classroom-light / classroom-geo | S2 / S3・S4前半 | 同じ画像に光の重ね（CSS） |
| starfield / starfield-dim | S4（幻視・幻視の終わり） | **仮背景** |
| l1-gate | S5 第1層の入口 | **仮背景** |
| l1-market / l1-pool / l1-crossroad / l1-hill / l1-garden | 第1層 地点1〜5・戦闘 | **仮背景** |
| l1-plaza / l1-north-gate | クリア後のゼロの広場・界門 | **仮背景** |

正式背景が届いたら `BACKGROUNDS[id]` に `image` を設定し、`placeholder`／`css` を外して再生成する。

## 原典に含めず、リストに残している行

`math-tower/axiomia-part1.json` の `source.skipped`：`背景：…／登場：…` などのステージ指示、地点見出し（`主要地点N・…`）、`### 戦闘前／戦闘後` などの構造見出し、断片カードの制作メモ（caption）。
それ以外の本文・カード・見出しカードはすべてゲーム内に表示される。

## 第2層以降への引き継ぎ

- 変換器は第2〜9層の書式（`\[ … \]` の数式ブロック、`> **「…」**` の引用）も読める。数式ブロックは `kind: "math"`・`tex: true` の行になる。
  画面での数式描画（TeX → 表示）は第2層以降で確認が必要（第1層に数式ブロックはない）。会話内の `\( … \)` はそのまま文字として残る。
- 第10層は書式が異なる（会話が2行）。変換器は読めるが、戦闘開始の合図・戦闘中の台詞・最終ボスの形態変化（HP引き継ぎ）は未実装。
- 第6層以降の戦闘のない幕（第8・9層の第六幕など）は、ボス撃破後の post にイベントを追加する形で対応できる（`flow.post[5]`）。
- 未解決の判断は完了報告を参照。
