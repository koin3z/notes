---
title: OCI Oracle Database バックアップ
date: 2026-01-09
update: 2026-07-01
draft: false
tags:
  - OCI
  - Backup
aliases:
  - cloud/oracle/oci-oracledb-backup
description: OCI 上の Oracle Database バックアップと Autonomous Recovery Service の選択・運用メモ。
---

このメモでは、主に Oracle Base Database Service の自動バックアップと Oracle Database
Autonomous Recovery Service（以下、Recovery Service）を扱う。

## 要点

- OCI のマネージド自動バックアップでは、保存先に **Recovery Service** または **Object
  Storage** を選択できる。Oracle は Recovery Service を推奨している。
- `RCV` と `ZRCV` は別々のバックアップ製品というより、Recovery Service で
  **リアルタイム・データ保護を使わない構成／使う構成**を区別する際によく使われる呼び方。
- Recovery Service は増分バックアップをブロック単位で管理し、必要な時点の完全なデータベース像を**Virtual Level 0（仮想フル・バックアップ）**として構成する。
- リアルタイム・データ保護を有効にすると REDO 変更が継続転送され、公式には
  **直近のサブ秒に近い RPO** を実現できる。ただし、ネットワークや保護状態に依存するため、
  「常に最後のコミットまで無条件に復旧できる」という意味ではない。
- バックアップの分離だけでなく、保護ポリシーの **Retention Lock**、監視、定期的なリストア試験を組み合わせて初めてランサムウェア対策になる。

## バックアップ保存先の選択

| 保存先                                  | 特徴                                                                                             | 主な注意点                                                                  |
| --------------------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| Recovery Service                        | ポリシー管理、Virtual Level 0、バックアップ検証、リアルタイム・データ保護、Retention Lock を提供 | 同一 VCN 内のサブネットと通信要件がある。リアルタイム・データ保護は追加料金 |
| Object Storage                          | OCI の標準的な自動バックアップ先                                                                 | Recovery Service 固有のリアルタイム保護や Virtual Level 0 はない            |
| ローカル FRA                            | リストアが速い                                                                                   | DB システム障害時にバックアップも失う可能性があり、単独の保護先には向かない |
| RMAN / `dbcli` による非管理バックアップ | 独自要件に合わせやすい                                                                           | スケジュール、保持、監視、Object Storage バケットを利用者が管理する         |

Recovery Service を使う OCI Database は、OCI コンソールまたは API のマネージド自動バックアップで
構成する。Oracle は、Recovery Service を有効にする前に、別の保存先へ送る運用バックアップ用の
手動スクリプトを停止するよう注意している。複数方式を無計画に併用すると、RMAN 設定やバックアップの
整合性を崩す可能性がある。

## Recovery Service の仕組み

### Incremental Forever と Virtual Level 0

1. データベースから最初の Level 0 と、その後の Level 1 増分バックアップを送信する。
2. Recovery Service は受信した Oracle Database ブロックを索引付けして管理する。
3. 復旧時には、複数の増分バックアップにまたがるブロックから、指定時点の完全なデータベース像である
   Virtual Level 0 を構成する。

この方式では、仮想フルを作るために本番データベースから毎回フル・バックアップを読み直す必要がない。
一方、「内部で何もマージしない」「復旧時に REDO 適用が一切ない」とまでは解釈しない。指定時点への
Point-in-Time Recovery では、その時点までの REDO が必要になる。

> [!note] Delta Store という用語
> `Delta Store` はオンプレミス製品 Zero Data Loss Recovery Appliance（ZDLRA）の内部構造を説明する
> 資料で使われる。現在の Recovery Service 公式ドキュメントでは `Virtual Level 0` が中心用語なので、
> クラウドサービスの内部実装名として断定せず、ブロック単位の増分管理という概念を押さえる。

### 検証と異常検知

Recovery Service は、本番データベースにフル・バックアップ検証の負荷を掛けずに、バックアップの
検証と継続的なデータ異常検知を行う。公式ドキュメントでは、次の段階で異常を確認するとされている。

- ソース・データベースから送信する前
- Recovery Service に到着したとき
- バックアップをレプリケートするとき
- リカバリ・ウィンドウ内で定期的に

これは復旧可能性を高める仕組みだが、リストア手順、アプリケーション整合性、復旧時間まで自動的に
保証するものではない。定期的なリストア試験は別途必要。

## RCV と ZRCV

| 観点                     | RCV と呼ばれる構成                             | ZRCV と呼ばれる構成                |
| ------------------------ | ---------------------------------------------- | ---------------------------------- |
| Recovery Service         | 使用する                                       | 使用する                           |
| リアルタイム・データ保護 | 無効                                           | 有効                               |
| 保護対象                 | 増分バックアップとアーカイブ REDO ログ         | 左記に加え、REDO 変更を継続転送    |
| RPO の考え方             | 最後に正常転送されたアーカイブ REDO ログに依存 | 公式表現では直近のサブ秒に近い RPO |
| 料金                     | 通常の自動バックアップ                         | リアルタイム・データ保護は追加料金 |

### RCV：リアルタイム・データ保護なし

- 障害直前までの復旧可否は、アーカイブ REDO ログのバックアップ間隔と最終成功時刻に依存する。
- 「常に 15 分 RPO」とは限らない。サービス、構成、バックアップ状態によって変わるため、OCI
  コンソールの保護状態、最終バックアップ時刻、復元可能範囲を確認する。
- 要求 RPO がアーカイブ REDO ログの転送間隔より短い場合は、リアルタイム・データ保護または
  Data Guard などを検討する。

### ZRCV：リアルタイム・データ保護あり

- 保護対象データベースから Recovery Service へ REDO 変更を継続的に転送する。
- オンライン REDO ログ・ファイルそのものを定期バックアップする、というより、Oracle の REDO
  転送機構を使って変更をストリーミングする仕組みと捉える。
- 公式ドキュメントの表現は「直近のサブ秒に近い RPO」または「near-zero RPO」であり、
  無条件の RPO 0 保証ではない。
- ネットワーク断、サービス障害、REDO 転送遅延があると保護ギャップが生じ得る。`Protected`、
  `Warning`、`Alert` などの保護状態とアラームを監視する。
- リアルタイム・データ保護の利用可否には Database のバージョン／RU 要件があるため、構成時点の
  サポート表を確認する。

## 保持、長期保管、耐改ざん

### Protection Policy

Recovery Service の通常バックアップは保護ポリシーで管理する。

| Oracle 定義ポリシー |            保持期間 |
| ------------------- | ------------------: |
| Bronze              |               14 日 |
| Silver              | 35 日（デフォルト） |
| Gold                |               65 日 |
| Platinum            |               95 日 |

カスタム・ポリシーも 14〜95 日で設定できる。コンプライアンスなどでより長い保持が必要な場合は、
通常のリカバリ・ウィンドウとは別に Long-Term Retention（LTR）バックアップを使用し、90 日から
最長 10 年まで保持できる。

### Retention Lock

- 保護ポリシーに Retention Lock を設定すると、ロック発効後は保持期間が終わるまでバックアップの
  変更・削除が禁止される。この制限はテナンシ管理者にも適用される。
- ロックの発効には最低 14 日の猶予期間があり、その間は無効化や保持期間の変更が可能。
- 発効後はロックを解除できず、保持期間は延長だけが可能になる。事前に費用、法務、削除要件を確認する。

「バックアップ領域が DB サーバーの OS から直接見えない」ことは分離に有効だが、それだけで
イミュータブルになるわけではない。誤削除・悪意ある操作への強い保護が必要なら Retention Lock を使う。

## 導入・運用チェックリスト

1. 業務要件として RPO、RTO、通常保持期間、長期保持期間を決める。
2. Recovery Service、Object Storage、ローカル、非管理 RMAN の役割を分ける。
3. サブ秒に近い RPO が必要なら、リアルタイム・データ保護の対応バージョンと追加料金を確認する。
4. Recovery Service 用サブネットと、TCP 2484 / 8005 の通信要件を確認する。
5. データベースが `ARCHIVELOG` モードであり、自動バックアップの前提条件を満たすことを確認する。
6. 保護ポリシー、Retention Lock、DB 終了時のバックアップ削除オプションを決める。
7. 保護状態、最終バックアップ、復元可能範囲、異常検知アラームを監視する。
8. 別 DB システムへのリストアと、アプリケーションを含む復旧手順を定期的に試験する。
9. パッチ、アップグレード、移行の前にはオンデマンド・フルバックアップを取得し、復元方法を確認する。

アップデート／アップグレード前後の注意点は
[[cloud/oracle/database/oci-oracledb-update|OCI における Oracle Database のアップデート／アップグレード]]を参照。

## 公式ドキュメント

- [Back Up and Recovery in Base Database Service](https://docs.oracle.com/en/cloud/paas/base-database/backup-recover/index.html)
- [Recovery Service Terminology](https://docs.oracle.com/en-us/iaas/recovery-service/doc/recovery-service-concepts.html)
- [Real-time Data Protection](https://docs.oracle.com/en-us/iaas/recovery-service/doc/about-real-time.html)
- [Immutability and Anomaly Detection](https://docs.oracle.com/en-us/iaas/recovery-service/doc/recovery-service-fault-tolerance.html)
- [Retention Lock](https://docs.oracle.com/en-us/iaas/recovery-service/doc/protection-policy-locking.html)
- [Onboarding Oracle Database to Recovery Service](https://docs.oracle.com/en-us/iaas/recovery-service/doc/getting-started-recovery-service.html)

## 補足資料

- [Autonomous Recovery Service（RCV / ZRCV）概要](https://speakerdeck.com/oracle4engineer/zrcv-overview)
- [Autonomous Recovery Service（RCV / ZRCV）と Object Storage](https://speakerdeck.com/oracle4engineer/rcvzrcv-objectstorage)
- [OCI Database Autonomous Recovery Service を試す](https://qiita.com/fujid/items/5795112bbf5cf40bfd85)
