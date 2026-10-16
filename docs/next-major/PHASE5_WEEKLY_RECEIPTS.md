# 週間確定報酬receiptの開発接続

`src/weekly-rewards-next.cjs`は既存の出撃完走receiptと同じ専用`weeklyNextV1/games/<account>`トランザクションへ討伐・とどめ・週締めreceiptを統合する。適用先はsandbox statsのみ。旧accounts／raidw／本番は書き換えない。

## 入力と認可

確定manifestを`weeklyNextV1/awards/<account>/<週>/{kill,lastHit,final}`に配置する。候補ルールは本人の読取だけを許可し、**本人を含め全クライアントのmanifest作成・変更を拒否**する。テストではEmulatorの管理コンテキストだけで確定fixtureを配置する。実運用のmanifest生成authorityは未実装。プレイヤーのcheckpointや画面のHPだけから確定manifestを作ってはいけない。

manifestはversion／source／account／week／kind／id／確定時刻／ボス／順位／本人ダメージ／最大HP／怒り／既存式のEXPを含む。討伐済み・とどめの本人・週締めの翌週開始後を照合し、受領時もサーバー時刻より未来の記録は処理しない。HP3倍の適用週は決めない。

## 冪等性と互換性

- receiptとEXP／討伐数／ボス種類／怒り討伐／lastHit／aceを一つの本人トランザクションで確定。
- 同週・同種の再送は追加付与しない。異なるmanifest ID／内容は競合として拒否。
- 既存`wk.done[week]`のk/sは受領済みとして記録するだけで再加算しない。過去のdoneを剪定しない。
- 旧lastHit総数だけから週別受領済みを推測しない。authority側で対象の過去receipt照合が必要。明示的なlegacyCoveredはその照合結果用。
- 通常レート・B戦績・称号・装備は触らない。
- 開発週間画面を開いた時に今週・先週のmanifestだけを取得する。新しい常時購読は追加しない。権限不足等はエラー表示。

## 検証と未完了

ユニット3件と実SDK2端末で受領競合／再送、3種receipt、偽manifest作成拒否、他人読取拒否、レート・戦績・装備不変を確認。既存4幅週間UIも成功。

**報酬全体の完成ではない。** 全員共通のHP・ダメージ確定順・最終打・週締めランキングを不変に確定するauthorityおよび実ゲームからのmanifest生成は残る。現在のown-account sandbox stats自体は本人が直接書ける開発データであり、正式称号や本番報酬の証明に使わない。週途中のmeta変更、本番ルール公開、本番移行は未実施。
