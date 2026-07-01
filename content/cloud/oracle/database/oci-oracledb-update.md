---
title: OCI における Oracle Database のアップデート／アップグレード
date: 2026-01-09
update: 2026-07-01
draft: false
tags:
  - OCI
  - Oracle Database
  - Upgrade
aliases:
  - cloud/oracle/oci-oracledb-update
description: OCI Base Database Service の更新、メジャーアップグレード、移行の違いと実施時の確認事項。
---

## まず用語を分ける

Oracle Database の変更作業は、目的によって次のように分ける。複数を同時に実施する場合でも、
切り戻し条件と検証項目は分けて考える。

| 作業                              | 何が変わるか                                | 例                                   | 主な手段                                                                           |
| --------------------------------- | ------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------- |
| パッチ／アップデート              | 同じメジャー・リリース内の RU、MRP、one-off | 19.27 → 19.28                        | OCI コンソール/API、カスタム Database Software Image、OPatch、AutoUpgrade Patching |
| Database アップグレード           | Database のメジャー・リリース               | 19c → 26ai                           | OCI コンソール/API、AutoUpgrade                                                    |
| DB システムの更新／アップグレード | OS、Grid Infrastructure などの基盤          | OL 更新、GI 19c → 26ai               | OCI コンソール/API、`dbcli`                                                        |
| 移行                              | DB の配置先、プラットフォーム、構成         | オンプレミス → Base Database Service | ZDM、Database Migration、RMAN、Data Guard、GoldenGate、Data Pump                   |

OCI Base Database Service の画面では、同一リリース内の RU 適用を主に **Update**、メジャー・リリースの
変更を **Upgrade** と呼ぶ。

## 判断の順序

1. セキュリティ修正や不具合修正だけが目的なら、同じリリース内のアップデートを選ぶ。
2. 現行リリースのサポート終了や新機能が理由なら、Database アップグレードを検討する。
3. OS、GI、ハードウェア、クラウド、エディション、CDB/PDB 構成も変えるなら、移行として設計する。
4. 停止時間を短縮する必要がある場合は、Data Guard、GoldenGate、ZDM などのオンライン方式を検討する。
5. バージョン変更と移行を同時に行う場合も、互換性、切替、フォールバックを別々に検証する。

## 同一リリース内のアップデート

### Release Update（RU）

RU は Oracle Database と Grid Infrastructure に対して四半期ごとに提供される累積的な修正集合。
セキュリティ修正だけでなく、回帰、不具合、オプティマイザ、機能上の修正などを含む。パッチ種別の
詳細は [[cloud/oracle/database/patch|Oracle Database パッチ種別]] を参照。

### Base Database Service での基本手順

1. 対象の DB システム、GI、Database、OJVM、one-off、クライアントの現行パッチを棚卸しする。
2. 原則として **DB システムを先に更新し、その後に Database を更新**する。
3. OCI コンソールの `Precheck` を実行し、失敗条件と one-off の競合を解消する。
4. オンデマンド・フルバックアップを取得し、復元可能範囲を確認する。
5. RU を適用し、Database と PDB、リスナー、アプリケーション接続を確認する。
6. `DBA_REGISTRY_SQLPATCH`、`opatch lsinventory`、無効オブジェクト、アラートログを確認する。
7. 自動バックアップが再開し、更新後のバックアップが成功したことを確認する。

Base Database Service では、Oracle 提供アップデートの直近 4 世代（N〜N-3）が選択肢として表示される。
Oracle は最新を推奨している。既存の interim update（one-off）は Oracle 提供アップデート前に自動で
ロールバックされる場合があるため、対象 RU に修正が含まれない場合は再適用が必要。one-off を含む
カスタム Database Software Image の利用を検討する。

> [!warning] OJVM
> Base Database Service の公式手順では、OJVM update は OPatch で手動適用する必要があると記載されている。
> RU だけを適用して完了とせず、OJVM の利用有無とパッチ状態を確認する。

## Database のメジャーアップグレード

### Base Database Service の前提

- OCI コンソールまたは API からアップグレードできるが、**Database のダウンタイムが発生する**。
- Database は `ARCHIVELOG` モードで、Flashback Database が有効である必要がある。
- 対象 Database が要求する OS と Grid Infrastructure のバージョンを先に満たす。
- 現行の公式手順では 19c または 21c から 26ai にアップグレードでき、それより前のリリースは
  先に 19c へ上げる。対応経路は変わり得るため、実施時点のサポート表を確認する。
- 事前にアップグレード・プリチェックを実行し、テスト環境で同じ手順を再現する。
- 自動バックアップ実行中はアップグレードできない。Oracle は自動バックアップを止め、手動バックアップを
  取得してから実行することを推奨している。
- アップグレード後は、アップグレード前の自動バックアップを使って旧バージョンの時点へ戻せない。
  切り戻しに使うバックアップ、Guaranteed Restore Point、クローンまたは移行元の保持方針を別途決める。

### 影響調査

最低限、次を確認する。

- ターゲット・リリースの動作変更、非推奨機能、サポート終了機能、初期化パラメータの変更
- Database、GI、OS、クライアント、ドライバ、ORDS、監視製品、バックアップ製品の互換性
- タイムゾーン・ファイル、文字セット、CDB/PDB、コンポーネント、無効オブジェクト
- SQL 実行計画、バッチ時間、接続数、メモリ、統計情報、アプリケーション回帰
- TDE キーストアと鍵、バックアップ、Data Guard、GoldenGate の扱い
- 切替判定、切り戻し可能時間、アップグレード後に発生した更新データの扱い

[Oracle Database Changes, Desupports, and Deprecations](https://docs.oracle.com/en/database/oracle/oracle-database/19/upgrd/oracle-database-changes-deprecations-desupports.html)
は、単に非推奨一覧を見るだけでなく、デフォルト値やセキュリティ動作の変更を確認するために使う。

## アップデート／アップグレード用ツール

### OCI コンソール／API

Base Database Service では、Database と DB システムの更新・アップグレードを OCI 管理ワークフローで
実行できる。利用可能なバージョン、プリチェック、履歴、失敗時のロールバック可否を OCI 側で管理する。
一般提供リリースの Database アップグレードは、原則として OCI コンソールを使う。

### AutoUpgrade

AutoUpgrade はアップグレード前の解析、修正、実行、アップグレード後の検証を自動化する Oracle 推奨
ユーティリティ。Oracle Home 同梱版ではなく、可能な限り最新の `autoupgrade.jar` を使用する。

- `analyze`：稼働中の Database に読み取り専用の事前分析を行う。
- `fixups`：自動修正可能な項目と手動対応が必要な項目を整理する。
- `deploy`：アップグレードとアップグレード後の処理を実行する。
- AutoUpgrade Patching：19c 以降の RU、MRP、one-off を out-of-place 方式で適用できる。

AutoUpgrade Patching にも Database 再起動とダウンタイムが必要で、RAC のローリング・パッチは
サポートしない。Oracle は RAC や Data Guard を含む環境では Fleet Patching and Provisioning（FPP）を
推奨している。

### Real Application Testing（RAT）

RAT の Database Replay と SQL Performance Analyzer は、本番ワークロードを使ってアップデートや
アップグレードの回帰を調べるために有効。

- 2026 年 7 月時点の Oracle AI Database Licensing Information では、RAT は Base Database Service の
  EE、EE-HP、EE-EP に含まれる。
- オンプレミス Enterprise Edition では追加費用オプション。BYOL には別の特別ライセンス条件がある。
- Database Replay はキャプチャ側とリプレイ側の両方で権利が必要。
- 比較レポートなど一部の機能は Diagnostics Pack も必要になる。

「Base Database Service の EE 以上なら常に自由に使える」と一般化せず、契約形態、実行する機能、
キャプチャ元とリプレイ先の両方を最新の Licensing Information で確認する。

## 移行はアップグレードと分けて考える

| 方式                                     | 種別                       | 向く場面                         | 主な注意点                                                  |
| ---------------------------------------- | -------------------------- | -------------------------------- | ----------------------------------------------------------- |
| Data Pump                                | 論理                       | スキーマ再編、異種構成、選択移行 | 大規模 DB では時間がかかる。型や機能の制約を確認            |
| Transportable Tablespaces                | データファイル＋メタデータ | 大容量表領域を短時間で移す       | 自己完結性、endianness、バージョン互換性を確認              |
| RMAN restore / duplicate                 | 物理                       | 同種構成の大容量 DB              | バージョン、プラットフォーム、TDE、停止時間を確認           |
| Data Guard                               | 物理・オンライン           | 互換構成間で停止時間を短縮       | 対応バージョン／プラットフォームとフォールバックを確認      |
| GoldenGate                               | 論理・オンライン           | 異種構成、段階移行、最小停止     | 対象外オブジェクト、DDL、競合、運用複雑性を確認             |
| PDB clone / relocate / refreshable clone | PDB 単位                   | Multitenant 間の移動             | CDB/PDB の互換性、TDE 鍵、接続性を確認                      |
| Zero Downtime Migration（ZDM）           | オーケストレーション       | Oracle Database を OCI へ移行    | 内部で RMAN、Data Guard、Data Pump、GoldenGate を使い分ける |
| OCI Database Migration                   | マネージド移行             | OCI の管理サービスで移行         | オフラインは更新停止、オンラインは GoldenGate を使用        |

オンライン方式でもアプリケーション接続の切替、最終同期確認、DNS／接続文字列の変更などの停止は
残り得る。「Zero Downtime」という名称だけで停止時間 0 を前提にしない。

## TDE と移行

Base Database Service ではユーザー作成表領域が TDE で暗号化される。次の点に注意する。

- `ENCRYPT_NEW_TABLESPACES` と `TABLESPACE_ENCRYPTION` は別のパラメータで、値を混在させない。
- これらのパラメータは既存表領域を遡って暗号化するものではない。
- Data Pump では、インポート先表領域が暗号化されていれば、格納されたデータも暗号化される。
- 物理移行だから必ず非暗号化のまま配置されるわけではない。RMAN の `RESTORE AS ENCRYPTED` や
  ZDM の移行方式により、リストア時に暗号化できる。
- クラウドへの ZDM 物理移行では、12.2 以降のソースに TDE 構成が必要。ソース表領域自体は
  未暗号化でもよいが、キーストア、マスター鍵、移行方式ごとの暗号化動作を確認する。

詳細は [[cloud/oracle/database/oracledb-tde|Oracle Database TDE]] を参照。

## 実施チェックリスト

### 事前

- [ ] パッチ、アップグレード、DB システム更新、移行のどれかを明確にした
- [ ] サポートされる source / target の組合せ、OS、GI、RU、エディションを確認した
- [ ] OCI と AutoUpgrade のプリチェックを実行した
- [ ] 動作変更、非推奨／サポート終了、アプリケーションとクライアント互換性を確認した
- [ ] TDE キーストアと鍵をバックアップし、移行先で利用できることを確認した
- [ ] オンデマンド・フルバックアップと復元手順を確認した
- [ ] 切替条件、切り戻し条件、アップグレード後データの扱いを決めた
- [ ] クローン環境で同じ手順と主要ワークロードを試験した

### 事後

- [ ] Database、PDB、リスナー、サービス、アプリケーション接続を確認した
- [ ] `DBA_REGISTRY_SQLPATCH`、`DBA_REGISTRY`、無効オブジェクト、アラートログを確認した
- [ ] SQL 性能、バッチ時間、主要業務、バックアップ／リストアを確認した
- [ ] 自動バックアップと監視アラームが正常に戻ったことを確認した
- [ ] 構成管理情報、運用手順、障害対応手順を更新した

バックアップ方式と Recovery Service の詳細は
[[cloud/oracle/database/oci-oracledb-backup|OCI Oracle Database バックアップ]]を参照。

## 公式ドキュメント

- [Update a Database - Base Database Service](https://docs.oracle.com/en/cloud/paas/base-database/update-db/index.html)
- [Upgrade a Database - Base Database Service](https://docs.oracle.com/en/cloud/paas/base-database/upgrade-db/index.html)
- [About the Oracle AutoUpgrade Utility](https://docs.oracle.com/en/database/oracle/oracle-database/21/upgrd/about-oracle-database-autoupgrade.html)
- [AutoUpgrade Patching](https://docs.oracle.com/en/database/oracle/oracle-database/19/upgrd/autoupgrade-patching.html)
- [Oracle AI Database Licensing Information](https://docs.oracle.com/en/database/oracle/oracle-database/26/dblic/Licensing-Information.html)
- [Introduction to Zero Downtime Migration](https://docs.oracle.com/en/database/oracle/zero-downtime-migration/26.1/zdmug/introduction-to-zero-downtime-migration.html)
- [Online migration - OCI Database Migration](https://docs.oracle.com/en-us/iaas/database-migration/doc/online-migration.html)
- [RMAN RESTORE](https://docs.oracle.com/en/database/oracle/oracle-database/19/rcmrf/RESTORE.html)

## 補足資料

- [Oracle Database Upgrade / Migration](https://speakerdeck.com/oracle4engineer/oracle-database-upgrade-migration-jp)
- [Oracle Database アップグレードに関する推奨事項](https://www.oracle.com/jp/technical-resources/article/recommendations-for-upgrading.html)
