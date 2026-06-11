---
title: OCI におけるOracle DBのアップデート/アップグレード
date: 2026-01-09
update: 2026-01-09
draft: false
tags:
  - OCI
  - Oracle Database
  - Upgrade
aliases:
  - oracle-cloud/oci-oracledb-update
description: OCI における Oracle Database のパッチ、RU、アップデート/アップグレード手順を整理する。
---

## パッチ



### Release Update (RU)
- 4半期ごとに提供される，Oracle DatabaseとGrid Infrastructureの修正コレクション
	- 機能テスト，ストレステスト，パフォーマンステスト等の広範なテストが行われている


## 影響調査
- アップグレードにおいては，アップグレードガイドの「動作の変更」を見ておく
https://docs.oracle.com/cd/G47991_01/upgrd/oracle-database-changes-deprecations-desupports.html#GUID-469CEF1A-40A3-46B1-B48D-EB0A00D9648C

- Real Application Test（RAT）
	- OCIではBase DB EE以上であれば実行可能


## ツール
- アップグレード
	- 使用するツール
		- AutoUpgrade
		- クラウドツール
- 移行
	- 使用ツール
		- Data Pump
		- トランスポータブル表領域
		- リフレッシュ可能クローン
		- Oracle GoldenGate
		- Data Guard
	- 効率化ツール
		- AutoUpgrade
		- Zero Downtime Migration
		- Database Migration Service

### AutoUpgrade
自動アップグレードユーティリティ

- アップグレード作業を自動化，コマンド一つでアップグレード可能
- configファイルを編集し，DBの情報を入力するだけ
- パッチ適用にも対応

### クラウドツール
OCIコンソールやAPIでのアップグレード

- アップグレード中はダウンタイムが発生
- 


## TDE
- オンプレミスとクラウドのTDEにおける最大の差異は，以下の２つにある
	- 機能の強制力
	- 管理主体

### 機能の強制力
- DBaaSでは，DB作成時にTDEが強制的に構成される
- この挙動は以下２つの初期化パラメータに設定される
	- `ENCRYPT_NEW_TABLESPACES`（Oracle 12cR2以降）
	- `TABLESPACE_ENCRYPTION`（Oracle 19c以降）
- OCI環境では，これらのパラメータはデフォルトで`CLOUD_ONLY` または `AUTO_ENABLE` に設定されている。

| **パラメータ設定値**      | **挙動の説明**                                                                 | **OCIでの適用**                    |
| ----------------- | ------------------------------------------------------------------------- | ------------------------------ |
| **AUTO_ENABLE**   | 新規作成される全てのテーブルスペースを自動的に暗号化する。`CREATE TABLESPACE` 文で明示的に暗号化句を指定しなくても適用される。 | **デフォルト** (Oracle 19c以降)       |
| **CLOUD_ONLY**    | クラウド環境にある場合のみ、透過的に暗号化を行う。オンプレミスでは無効化されるハイブリッド設定。                          | **デフォルト** (Oracle 12cR2 - 18c) |
| **MANUAL_ENABLE** | ユーザーが明示的に `ENCRYPTION... ENCRYPT` 句を指定した場合のみ暗号化する。                        | オンプレミスのデフォルト（OCIでは非推奨または無視される） |
| **DECRYPT_ONLY**  | 新規テーブルスペースの暗号化を禁止する。                                                      | OCIでは使用不可（エラーまたは無視）            |

- 移行（リストア）によって持ち込まれた既存のデータ・ファイルに関しては自動でこの暗号化が適用されないケースがあるため注意が必要


## 移行シナリオ
### TDE無し→TDE有り (OCI)
- 論理移行（Data Pump）
	- エクスポートしたダンプファイルには，データそのものが論理的な形式で格納される
	- これをインポートする際，データは再構築され，ターゲットDBの表領域に書き込まれる
	- OCI側のデータベースは`TABLESPACE_ENCRYPTION = AUTO_ENABLE` が設定されているため、インポートプロセスによって書き込まれるデータブロックは、ディスク着地時に自動的に暗号化される。
- 物理移行（RMAN/Data Guard）
	- RMANによるバックアップ・リストアや，Data Guardによるフィジカルスタンバイを使った物理移行では，バイナリレベルで整合性が保たれる
		- そのため，ソースDBの非暗号化のデータファイルがそのまま非暗号化状態でOCIに配置される
	- そのため，移行直後には，既存データは平文，新規データは暗号文という状態になる
https://alexzaballa.com/plugin-an-on-premises-pdb-without-tde-into-a-cdb-running-in-the-oracle-base-database-service/


- ZDMでは，ソースDBにTDEが有効になっていない場合，移行前にソースDBの方にTDEウォレットを構成しておく必要がある
- https://docs.oracle.com/cd/F30065_01/zdmug/preparing-for-database-migration.html#GUID-B294CAD7-63AD-44BA-BE22-C8BAAE211643

## 参照リンク
- https://speakerdeck.com/oracle4engineer/oracle-database-upgrade-migration-jp
- https://www.oracle.com/jp/technical-resources/article/recommendations-for-upgrading.html