---
title: Oracle Database パッチ種別
date: 2026-06-18
modified: 2026-07-01
draft: false
tags:
  - cloud/oci/database
description: Oracle Database の CPU、CSPU、RU、MRP、個別パッチとコンポーネント別パッチの関係を整理する。
---

このメモは Oracle Database 19c / Oracle AI Database 26ai を中心に、セキュリティ情報と実際に適用する
パッチを区別するためのもの。公開日や対象製品は変わるため、実施時には Oracle Security Alerts、
Patch Availability Document、My Oracle Support（MOS）、各パッチの README を正とする。

## まず結論

- **CPU、CSPU、Security Alert** は、脆弱性と製品別パッチを案内するセキュリティ公開枠。
- Oracle Database の通常保守の基準は、四半期ごとの最新 **Release Update（RU）**。
- **Monthly Recommended Patch（MRP）** は、特定 RU に追加する Linux x86-64 向けの月次・任意の
  推奨修正バンドル。新しい修正がなければ、その月の MRP が出ないこともある。
- Database / Grid Infrastructure の Linux x86-64 では、適用可能な Database CSPU の内容は既存の
  MRP に含まれる。Database へ毎月「CSPU」という独立バイナリを必ず適用する、という意味ではない。
- RU だけで完了とせず、構成に応じて **OJVM、GI、Client、ORDS、タイムゾーン、one-off** も確認する。
- OPatch のバイナリ適用結果と `datapatch` の SQL 適用結果は別々に確認する。

## 用語の全体像

### セキュリティ公開枠

| 用語                                   | 公開タイミング                 | 役割                                                            |
| -------------------------------------- | ------------------------------ | --------------------------------------------------------------- |
| CPU（Critical Patch Update）           | 1月・4月・7月・10月の第3火曜日 | 複数製品・複数脆弱性に対する四半期の累積的なセキュリティ更新    |
| CSPU（Critical Security Patch Update） | CPU月以外の第3火曜日           | 次のCPUを待たずに提供する、対象を絞った高優先度セキュリティ更新 |
| Security Alert                         | 定期日外                       | 次のCPU/CSPUを待てない重大な脆弱性への臨時対応                  |

### Database へ適用する主なパッチ

| 用語                             | 性質                         | 主な用途                                       |
| -------------------------------- | ---------------------------- | ---------------------------------------------- |
| RU（Release Update）             | 四半期・累積・プロアクティブ | Database / GI の標準保守ベースライン           |
| MRP（Monthly Recommended Patch） | 特定RU向け・月次・累積・任意 | RU間の推奨修正や、該当する月次セキュリティ修正 |
| Interim / one-off patch          | 個別・リアクティブ           | 特定の不具合、SR、緊急修正                     |
| OJVM / GI / Client / TZ patch    | コンポーネント別             | Database RU だけでは完結しない対象の更新       |
| Combo / Full Stack patch         | パッケージ形態               | 複数の既存パッチを一括配布                     |

CPU/CSPU の Advisory と RU/MRP は同じ分類ではない。Advisory の Risk Matrix で影響を判断し、
Patch Availability Document から、対象製品・バージョン・プラットフォームに実際に適用するパッチを
特定する。

## セキュリティ公開枠

### CPU / Critical Patch Update

- サポート対象の Oracle オンプレミス製品向けに、複数のセキュリティ修正をまとめて公開する。
- 通常は累積的で、1月・4月・7月・10月の第3火曜日に公開される。
- Oracle Database だけでなく、GI、Client、OJVM、ORDS、Fusion Middleware、Java などを横断して確認する。
- CPU Advisory の Risk Matrix は、その Advisory で**新たに対処された脆弱性**を示す。過去の
  Advisory が不要になるわけではない。
- 四半期 CPU は、それ以前に公開された CSPU の修正を含む累積的な更新になる。

「CPUパッチ」という1つの共通バイナリを全製品へ適用するのではない。Oracle Database では通常、
CPU公開に対応する最新RUを保守の中心にし、OJVM、GI、Client、ORDSなどの個別対象を追加確認する。

### CSPU / Critical Security Patch Update

CSPU は2026年に開始された、対象を絞った高優先度セキュリティ更新。

- 初回は例外的に **2026年5月28日**に公開された。
- 以降は **2月・3月・5月・6月・8月・9月・11月・12月の第3火曜日**に公開される。
- すべての製品・Databaseリリースに毎月パッチが出るわけではない。
- 影響製品一覧にない製品についても、未適用の過去CPU/CSPUがないか確認する。
- Database / GI の Linux x86-64 では、CSPU内容は、利用可能かつ該当する場合に MRP で提供される。
- Client、ORDS、関連製品は、各月の Patch Availability Document で提供形態を確認する。

2026年7月1日時点の具体例：

- **2026年5月CSPU**：Oracle Database Server `23.4.0-23.26.2` と ORDS
  `24.2.0-26.1.0` が対象。Database Serverの3件は23.xのDatabase、Grid、Clientの各Oracle Homeに
  適用が必要で、client-only installationにも該当した。公式注記では、これらの問題に19c以前は
  影響されないとされている。
- **2026年6月CSPU**：公開自体はあったが、対象製品一覧にOracle Database Serverは含まれていない。

この差からも、月だけを見て機械的にDatabaseへパッチ適用するのではなく、毎月のAffected Productsと
Risk Matrixを確認する必要がある。

### Security Alert

- 次のCPUまたはCSPUまで待てないとOracleが判断した脆弱性に対して、不定期に公開される。
- 公開された場合は、通常の月次・四半期サイクルより優先して影響を確認する。
- 対象製品、対象バージョン、回避策、Patch Availability Document、後続CPU/CSPUへの取り込みを確認する。
- 回避策は恒久修正ではなく、機能を壊す可能性もあるため、パッチ適用までの一時対策として扱う。

## Database のプロアクティブ／リアクティブ・パッチ

### RU / Release Update

RU は Oracle Database パッチ運用の標準ベースライン。

- 1月・4月・7月・10月の第3火曜日に公開される累積パッチ。
- security、regression、optimizer、functional fixesを含み、機能拡張を含む場合もある。
- 対応するすべてのサポート対象プラットフォーム向けに提供される。
- Oracleは、適用頻度にかかわらず、作業時点の**最新RU**を適用することを推奨している。
- Optimizerの実行計画へ影響する一部の修正は、インストールされてもデフォルト無効の場合がある。

`N-1`に留まることを標準とせず、最新RUを基本にする。遅延させる場合は「新しいRUの既知問題を待つ」
という利点だけでなく、その間に既知の不具合・脆弱性を保持するリスクも記録する。

### MRP / Monthly Recommended Patch

MRP は、特定のRUに対して提供される推奨interim patchの集合。

- Oracle Database 19cではRU 19.17から開始。26aiにもMRPが提供される。
- Linux x86-64専用。その他のプラットフォームでは推奨one-offを個別に確認する。
- 各RUに対して最大6個、RU公開後の期間に月次で提供される。
- 前のMRPを含む累積バンドルだが、**別のRUをまたいで累積するという意味ではない**。
- MRPを適用してもDatabaseのRU番号は変わらない。Oracle Inventoryに含まれるone-offとして記録される。
- その月に新しい推奨修正がなければ、MRPが公開されない場合がある。
- 26aiではout-of-place適用が推奨される。in-placeではREADMEに従い `opatchauto` または
  `opatch napply` などを使う。GI MRPはsystem patchのため `opatch napply` では適用できない。

| 観点             | RU                                  | MRP                                                     |
| ---------------- | ----------------------------------- | ------------------------------------------------------- |
| 基準             | 独立した四半期ベースライン          | 特定RUへの追加                                          |
| 頻度             | 四半期                              | 月次、最大6個                                           |
| 必須性           | 標準保守の中心                      | 任意。ただし該当CSPUや重要修正があれば優先判断          |
| プラットフォーム | サポート対象プラットフォーム        | Linux x86-64                                            |
| 主な内容         | Security、回帰、機能、Optimizerなど | 推奨one-off、回帰修正、該当する高優先度セキュリティ修正 |
| バージョン表記   | RU番号が変わる                      | RU番号は変わらない                                      |

### Interim Patch / One-off Patch

- 特定の「不具合・バージョン・プラットフォーム」の組合せに対して提供される個別パッチ。
- SR対応や、次のRU/MRPを待てない既知不具合へのリアクティブ保守に使う。
- RUより限定的なテストで提供され、後続RUへ取り込まれる場合がある。
- 最新RUに修正が含まれるなら、独自one-offを増やすよりRU適用を優先する。
- 適用前に競合を確認し、後続RU/MRP用のmerge patchや置換パッチが必要か確認する。
- 適用理由、Bug ID、SR番号、対象Oracle Home、README、rollback手順を記録する。

競合確認例：

```bash
$ORACLE_HOME/OPatch/opatch prereq CheckConflictAgainstOHWithDetail -ph <PATCH_DIR>
```

複数パッチをまとめて確認する場合は、パッチREADMEに従って `-phBaseDir` を使う。

## コンポーネント／配布形態別の確認

### OJVM Patch

- Database内のOracle JVM（`JAVAVM`）向けパッチで、Database RUとは別に提供される。
- `JAVAVM`がインストールされている環境では、利用していないつもりでも適用要否を確認する。
- SQL変更を含むため、通常は `datapatch` の状態も確認する。
- Base Database Serviceでは、公式ドキュメント上、OJVM updateはOPatchによる手動適用が必要。

```sql
select comp_id, comp_name, version_full, status
from   dba_registry
where  comp_id = 'JAVAVM';
```

### GI Patch / Grid Infrastructure Patch

- RAC、ASM、Clusterware、Oracle Restartを使う環境では、GI Homeも管理対象になる。
- Database RUと同じ四半期のparallel GI RUを使用する。GI RUはsystem patchとして対応するDatabase RUの
  内容も含むが、適用ツールとREADMEに従い、各Oracle Homeへの反映を個別に確認する。
- `opatchauto`、FPP、rolling / non-rolling、ノード順序、停止要否はREADMEと構成によって変わる。
- Database Homeだけでなく、GI Homeと全ノードのInventoryを確認する。

### Client Patch / Client Home Patch

- Oracle Client、Instant Client、JDBC、ODP.NETなど、接続元のライブラリも独立した更新対象。
- アプリケーションサーバー、バッチ、BI、ETL、監視製品、コンテナイメージに含まれるClientを棚卸しする。
- Risk Matrixの「client-only installations」や注記を確認する。
- 2026年5月CSPUのDatabase Server向け3件は、23.xのClient Homeも対象だった。

### Combo Patch / Full Stack Download Patch

- 新しい修正カテゴリではなく、Database RU、OJVM、GI、Exadata System Softwareなどをまとめた配布形態。
- 例として、Database RUとOJVM RUのCombo Patch、Exadata向けQuarterly Full Stack Download Patchがある。
- 一括ダウンロードでも、各Oracle Homeへの適用順、rolling可否、`datapatch`、rollback単位を個別に確認する。

### Time Zone / DST Patch

- 最新のタイムゾーン規則が必要な環境向けに、special time zone patchが提供される場合がある。
- Oracle Database 19c RU 19.18以降では、利用可能なDSTファイルがRUによって
  `$ORACLE_HOME/oracore/zoneinfo` にインストールされる。
- RUの適用だけで、既存Databaseのタイムゾーン・ファイル・バージョンや
  `TIMESTAMP WITH TIME ZONE` データが自動変換されるとは限らない。
- Database側のバージョン変更には `DBMS_DST` などの別手順が必要。Data Pump、Transportable
  Tablespaces、クライアントとのバージョン差も確認する。

## OCI Base Database Service での扱い

Oracle Security AlertsはCPU/CSPUをサポート対象のオンプレミス製品向けと定義している。Oracle Cloudの
運用チームも該当修正を評価・適用する一方、Base Database Serviceの公式ドキュメントでは、利用者が
Databaseを適時更新する責任を持つとされている。マネージドサービスだからDatabase RUまで常に
自動適用される、とは考えず、サービス側と利用者側の責任境界を確認する。

- OCIコンソール/APIの標準更新では、直近4世代（N〜N-3）のDatabase updateを選択できる。
- Oracleは **DBシステムを先に更新し、その後Databaseを更新**することを推奨している。
- 適用前にOCIの `Precheck` を実行し、バックアップとテスト環境での検証を行う。
- 既存interim patchはOracle提供updateの前に自動rollbackされる場合がある。新しいRUに含まれない場合は
  再適用が必要になるため、interim patchを含むcustom Database Software Imageを検討する。
- OJVM updateはOPatchによる手動適用が必要。
- 公開ドキュメントの標準Update一覧は四半期RUが中心。Database CSPU/MRPが該当する場合は、
  Patch Availability Document、MOS、Base Database Serviceの手順で提供・適用方法を確認する。

更新作業全体の流れは
[[cloud/oracle/database/oci-oracledb-update|OCI における Oracle Database のアップデート／アップグレード]]、
事前バックアップは
[[cloud/oracle/database/oci-oracledb-backup|OCI Oracle Database バックアップ]]を参照。

## 適用対象を決める順序

1. 毎月Oracle Security Alertsを確認し、CPU/CSPU/Security Alertの新着を確認する。
2. Affected Products、Risk Matrix、Patch Availability Documentで、製品・バージョン・構成への影響を判断する。
3. Database、GI、OJVM、Client、ORDS、GoldenGate、OEM、JDK/JREなど、すべての配置場所を棚卸しする。
4. Database/GIは最新RUをベースラインにする。
5. Linux x86-64では、対象RU向けの最新MRPと、該当するCSPU内容が含まれるかを確認する。
6. OJVM、Client、ORDS、DSTなど、RU/MRPとは別の対象を確認する。
7. 特定不具合が残る場合にのみone-off/merge patchを追加する。
8. Base Database Service、single instance、RAC、Data Guardなどの構成に合う適用手段を選ぶ。

## 適用前チェックリスト

- [ ] Oracle Security AdvisoryとPatch Availability Documentを確認した
- [ ] 製品、リリース、RU、OS、プラットフォーム、Oracle Homeごとの対象Patch IDを特定した
- [ ] Database / GI / Client / OJVM / ORDS / GoldenGateなどのInventoryを取得した
- [ ] Patch README、既知問題、必要なOPatchバージョン、空き容量を確認した
- [ ] one-off、MRP、OJVMとの競合とmerge patchの要否を確認した
- [ ] rolling / non-rolling、停止時間、ノード順序、Data Guard手順を確認した
- [ ] バックアップ、Guaranteed Restore Point、切り戻し方法を確認した
- [ ] ステージング環境でパッチ適用とアプリケーション回帰を試験した
- [ ] Data Pumpなどのデータ移動ジョブと、必要に応じてGoldenGateプロセスを停止した
- [ ] Base Database ServiceではOCIのPrecheckを実行した

## 適用後の確認

### Oracle Home のバイナリ・パッチ

```bash
$ORACLE_HOME/OPatch/opatch lsinventory
$ORACLE_HOME/OPatch/opatch lspatches
$GRID_HOME/OPatch/opatch lsinventory
```

`opatch lsinventory` はOracle Homeのバイナリ状態を確認する。RACでは全ノード、複数Homeがある場合は
Homeごとに確認する。

### Database の SQL patch

SQLスクリプトを含むパッチでは、OPatch完了後に `datapatch` が必要。READMEまたはサービスの自動化が
実行するかを確認し、CDBでは対象PDBが開かれて処理されたことを確認する。

```sql
select install_id,
       patch_id,
       patch_type,
       action,
       status,
       action_time,
       description,
       logfile
from   dba_registry_sqlpatch
order  by action_time desc;
```

CDB全体を確認する場合：

```sql
select con_id,
       install_id,
       patch_id,
       patch_type,
       action,
       status,
       action_time,
       description
from   cdb_registry_sqlpatch
order  by con_id, action_time desc;
```

`DBA_REGISTRY_SQLPATCH` の各行は適用／rollbackの**試行**を表す。過去の `WITH ERRORS` が残る場合も
あるため、目的とした最新の `APPLY` または `ROLLBACK` が `SUCCESS` か、対象PDBすべてに反映されたか、
`LOGFILE` に未解決エラーがないかを確認する。

### 最終確認

- [ ] `DBA_REGISTRY` のコンポーネントが `VALID`
- [ ] 無効オブジェクト、アラートログ、Clusterware、リスナー、サービスに異常がない
- [ ] アプリケーション接続と主要SQL／バッチの性能を確認した
- [ ] Data Guard、GoldenGate、監視、バックアップを再開して同期・成功を確認した
- [ ] 適用後のバックアップと、必要に応じてリストア試験を実施した
- [ ] Inventory、Patch ID、README、ログ、適用日時、テスト結果、rollback方針を証跡として保存した

## 運用サイクル

### 毎月

- Oracle Security AlertsのCPU/CSPU/Security Alertと事前通知を確認する
- Affected ProductsとRisk Matrixを自社の製品台帳に突き合わせる
- Linux x86-64のDatabase/GIでは最新MRPとCSPU内容を確認する
- Client、ORDS、関連ミドルウェアを含めて緊急度を判断する

### 四半期

- 最新RUを基準にパッチ計画を作る
- DBシステム、GI、Database、OJVM、Clientの整合性を確認する
- ステージングで適用、rollback、回帰、バックアップ／リストアを試験する
- 本番適用後にInventoryとSQL patch状態を記録する

## 公式ドキュメント

- [Critical Patch Updates, Critical Security Patch Updates, Security Alerts and Bulletins](https://www.oracle.com/security-alerts/)
- [Oracle Critical Security Patch Update Advisory - May 2026](https://www.oracle.com/security-alerts/cspumay2026.html)
- [Oracle Critical Security Patch Update Advisory - June 2026](https://www.oracle.com/security-alerts/cspujun2026.html)
- [Oracle Database Patch Maintenance - 19c and later](https://docs.oracle.com/en/database/oracle/oracle-database/19/dbptc/index.html)
- [Oracle AI Database Patch Maintenance Guidelines - 26ai](https://docs.oracle.com/en/database/oracle/oracle-database/26/dbptc/index.html)
- [Software Security Recommendations](https://docs.oracle.com/en/database/oracle/oracle-database/26/haovw/software-security-recommendations.html)
- [Update a Database - Base Database Service](https://docs.oracle.com/en/cloud/paas/base-database/update-db/index.html)
- [Software Images - Base Database Service](https://docs.oracle.com/en/cloud/paas/base-database/software-images/)
- [`DBA_REGISTRY_SQLPATCH`](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/DBA_REGISTRY_SQLPATCH.html)
- [Release Update 19.18 - All Time Zone Files Included](https://docs.oracle.com/en/database/oracle/oracle-database/19/newft/ru-19-18.html)

## 補足資料

- [CPU, CSPU, MRP, RU - some clarifications](https://mikedietrichde.com/2026/06/09/cpu-cspu-mrp-ru-some-clarifications/)
