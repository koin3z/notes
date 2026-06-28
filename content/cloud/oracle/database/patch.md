---
title: Oracle Database パッチ種別
date: 2026-06-18
update: 2026-06-18
draft: false
tags:
  - 
aliases:
  - 
description: このページの内容についての簡単な説明
---




## CPU / Critical Patch Update

- Oracle 製品全体に対する **四半期のセキュリティ更新**。    
- **Oracle Database だけでなく、Oracle 製品群全体を対象にしたセキュリティアドバイザリ**として見る。
- 公開タイミングは通常、**1月・4月・7月・10月の第3火曜日**。
- CPU は複数の脆弱性に対するパッチの集合で、通常は累積的。
- Oracle Database の現場では、「CPU パッチを当てる」というより、CPU Advisory を見て、該当する **Database RU / GI RU / OJVM / Client / ORDS / 関連ミドルウェア**のパッチを確認する、という考え方が実務的。


**メモ**
- CPU はセキュリティ通知・公開枠としての意味が強い。
- Database 本体の定期パッチ適用では、実際には RU が中心になる。
- CPU Advisory の Risk Matrix で、自社のバージョン、コンポーネント、認証要否、リモート悪用可否、CVSS を確認する。

**出典**

- Oracle Security Alerts / CPU・CSPU・Security Alert 一覧。CPU はサポート対象のオンプレミス製品向けセキュリティパッチで、通常 1月・4月・7月・10月の第3火曜日に公開される。([Oracle](https://www.oracle.com/security-alerts/ "Critical Patch Updates, Critical Security Patch Updates, Security Alerts and Bulletins"))
    
---

## RU / Release Update

- Oracle Database の **四半期ごとの累積パッチ**。
- Database パッチ運用の中心。
- セキュリティ修正だけでなく、以下を含む。
    - security fixes
    - regression / bug fixes
    - optimizer fixes
    - functional fixes
    - 一部の機能拡張
- 公開タイミングは通常、**1月・4月・7月・10月の第3火曜日**。
- Oracle は、Database と Grid Infrastructure を **最新 RU に保つこと**を推奨している。
    

**メモ**

- 基本は「最新 RU を定期適用」。
- 古い RU に留まる場合、既知不具合や既知脆弱性を抱え続けるリスクがある。
- Mike Dietrich 氏の記事でも、RU は引き続き主要なパッチであり、`N-1` ではなく最新の `N` RU を追うべき、という整理がされている。
- RU 適用時は Database Home だけでなく、Grid Infrastructure Home、Client Home、OJVM、タイムゾーンパッチ、関連製品も確認する。

**確認例**

```bash
$ORACLE_HOME/OPatch/opatch lsinventory
$ORACLE_HOME/OPatch/opatch lspatches
```

**出典**

- Oracle Database Patch Maintenance では、プロアクティブ保守は四半期の RU 適用を中心に行い、RU は security / regression / optimizer / functional fixes を含むと説明されている。([Oracle Docs](https://docs.oracle.com/en/database/oracle/oracle-database/19/dbptc/index.html "Oracle Database Oracle Database Patch Maintenance, Release 19c and Later Releases"))
- Mike Dietrich 氏の記事では、CPU / CSPU / MRP / RU の関係と、Oracle Database では RU が主要パッチである点が整理されている。([Upgrade your Database - NOW!](https://mikedietrichde.com/2026/06/09/cpu-cspu-mrp-ru-some-clarifications/ "CPU, CSPU, MRP, RU - some clarifications – Upgrade your Database - NOW!"))
    

---

## MRP / Monthly Recommended Patch

- RU と RU の間に提供される **月次の推奨パッチ集合**。
- Oracle Database の RU に対して、最大 6 個の MRP が月次で提供される。
- Oracle 公式ドキュメントでは、19.17 以降、Linux x86-64 向けに MRP が提供されていると説明されている。
- MRP はセキュリティ修正だけではなく、重要修正や回帰修正なども含み得る。
- Mike Dietrich 氏の記事では、19c と 26ai の Linux 向けでは MRP が提供され、MRP は one-off fixes の集合として inventory に個別に入る、と説明されている。
    

**メモ**

- Linux 環境では、RU 適用後に MRP の有無を確認する。
- MRP は「セキュリティ専用」ではない。
- そのため、CSPU が出ていない月でも MRP が存在することがある。
- 例: 2026年5月は Oracle Database 19c 向けの CSPU はなかったが、MRP にはセキュリティ以外の内容があるため MRP は存在し得る、という整理が Mike Dietrich 氏の記事で説明されている。
    

**実務判断**

- Linux x86-64 の 19c / 26ai では、RU 後に MRP を確認する。
- 本番環境では、MRP の README、既知問題、競合、rollback 方針を確認してから適用する。
- 複数 OS を運用している場合、Linux では MRP、非 Linux では CSPU / one-off の提供状況が異なる可能性があるため、OS ごとに確認する。
    

**出典**

- Oracle Database Patch Maintenance では、各 RU に最大 6 個の MRP が月次で提供され、MRP は RU 間の累積的な推奨パッチバンドルと説明されている。([Oracle Docs](https://docs.oracle.com/en/database/oracle/oracle-database/19/dbptc/index.html "Oracle Database Oracle Database Patch Maintenance, Release 19c and Later Releases"))
- Mike Dietrich 氏の記事では、MRP はセキュリティ以外の重要修正・回帰修正も含み得るため、CSPU がない月でも MRP が存在し得ると説明されている。([Upgrade your Database - NOW!](https://mikedietrichde.com/2026/06/09/cpu-cspu-mrp-ru-some-clarifications/ "CPU, CSPU, MRP, RU - some clarifications – Upgrade your Database - NOW!"))
    

---

## CSPU / Critical Security Patch Update

- 2026年から追加された **月次の高優先度セキュリティ更新枠**。
- 初回 CSPU は **2026年5月28日**。
- 通常の公開月は、**2月・3月・5月・6月・8月・9月・11月・12月**。
- 四半期 CPU を補完し、次の CPU を待たずに高優先度のセキュリティ修正を適用できるようにするもの。
- CSPU は、より小さく、焦点を絞ったセキュリティ修正として提供される。

**メモ**

- CSPU は毎月すべての Database バージョンに必ず出るわけではない。
- 対象となるセキュリティ修正がない場合、該当バージョン向け CSPU は出ない。
- 2026年5月 CSPU では、Oracle Database Server の対象は `23.4.0-23.26.2` であり、19c は Database Server Risk Matrix に出ていなかった。
- 2026年5月 CSPU の Oracle Database Server Risk Matrix では、3 件の新しいセキュリティパッチが示され、すべて client-only installation にも該当すると説明されている。
- Database Home だけでなく、Grid Infrastructure Home、Client Home、client-only installation も対象になり得る点に注意する。
    

**実務判断**

- CPU だけを四半期で見る運用では不十分になる。
- 月次で Oracle Security Alerts を確認し、CSPU に Database / GI / Client / ORDS / 関連製品が含まれるかを見る
- CSPU が出た場合は、対象バージョン、対象 Oracle Home、README、Patch Availability Document、競合、datapatch 要否を確認する。
- CSPU の累積性や MRP との関係は製品・プラットフォーム・パッチ単位で変わり得るため、必ず該当パッチの README / MOS を確認する。
    

**出典**

- Oracle Security Blog では、CSPU は 2026年5月28日から月次で開始され、高優先度のクリティカルな問題を次の四半期 CPU を待たずに修正するためのものと説明されている。([Oracle Blogs](https://blogs.oracle.com/security/update-monthly-critical-security-patch-updates-cspus-begin-may-28-2026 "Update: Monthly Critical Security Patch Updates (CSPUs) Begin May 28, 2026 | security"))
- Oracle Security Alerts では、CSPU はサポート対象のオンプレミス製品向けの targeted, high-priority security fixes であり、初回は 2026年5月28日、以後は CPU 月以外の第3火曜日に公開されると説明されている。([Oracle](https://www.oracle.com/security-alerts/ "Critical Patch Updates, Critical Security Patch Updates, Security Alerts and Bulletins"))
- 2026年5月 CSPU Advisory では、Oracle Database Server `23.4.0-23.26.2` が対象として示され、Database Server Risk Matrix には 3 件の新しいセキュリティパッチが記載されている。([Oracle](https://www.oracle.com/security-alerts/cspumay2026.html "Oracle Critical Security Patch Update Advisory - May 2026"))
- Mike Dietrich 氏の記事では、2026年5月に Oracle Database 19c 向け CSPU がなかった理由として、19c に該当するセキュリティ内容がなかったため、と説明されている。([Upgrade your Database - NOW!](https://mikedietrichde.com/2026/06/09/cpu-cspu-mrp-ru-some-clarifications/ "CPU, CSPU, MRP, RU - some clarifications – Upgrade your Database - NOW!"))

---

## Security Alert

- CPU / CSPU を待てないほど重大または緊急度が高い脆弱性に対する臨時通知・修正枠。
- 通常の四半期・月次サイクルとは別に発行される。
- Oracle は、次の CPU または CSPU を待てない脆弱性修正について Security Alert を発行すると説明している。

**メモ**

- Security Alert は例外的・緊急対応として扱う。
- 公開された場合は、通常のパッチサイクルより優先して影響確認する。
- 対象製品、対象バージョン、回避策、暫定パッチ、後続 CPU / CSPU への取り込み予定を確認する。
- Database 本体だけでなく、WebLogic、EBS、ORDS、OEM、Java、OS 側コンポーネントなども確認対象にする。
    

**出典**

- Oracle Security Alerts では、Security Alert は次の CPU または CSPU を待てないほど critical と判断された脆弱性修正に対して発行されると説明されている。([Oracle](https://www.oracle.com/security-alerts/ "Critical Patch Updates, Critical Security Patch Updates, Security Alerts and Bulletins"))

---

## One-off Patch / Interim Patch

- 特定の不具合や脆弱性に対する個別パッチ。
- RU / MRP / CSPU に含まれる前に、個別に提供されることがある。
- MRP は複数の one-off fixes の集合として提供される場合がある。
    

**メモ**

- SR 対応や既知不具合対応で one-off が必要になることがある。
- 適用前に必ず OPatch の conflict check を実施する。
- 後続 RU に含まれた場合、RU 適用時に置き換え・rollback・競合解消が必要になることがある。
- 本番環境では、one-off の適用理由、対象バグ番号、SR 番号、README、rollback 手順を記録する。

**確認例**

```bash
$ORACLE_HOME/OPatch/opatch prereq CheckConflictAgainstOHWithDetail -phBaseDir <PATCH_DIR>
```

**出典**

- Oracle Database Patch Maintenance では、プロアクティブ保守として RU / MRP、リアクティブ保守として one-off patches が区別されている。([Oracle Docs](https://docs.oracle.com/en/database/oracle/oracle-database/19/dbptc/index.html "Oracle Database Oracle Database Patch Maintenance, Release 19c and Later Releases"))
- Mike Dietrich 氏の記事では、MRP は one-off fixes の集合として inventory に個別に追加されると説明されている。([Upgrade your Database - NOW!](https://mikedietrichde.com/2026/06/09/cpu-cspu-mrp-ru-some-clarifications/ "CPU, CSPU, MRP, RU - some clarifications – Upgrade your Database - NOW!"))
    

---

## OJVM Patch

- Oracle JVM コンポーネント向けのパッチ。
- Database RU とは別に提供・適用が必要になる場合がある。
- Java stored procedure や OJVM を利用している環境では特に確認が必要。
    

**メモ**

- OJVM を使っていないつもりでも、コンポーネントがインストールされている場合は影響確認が必要。
- OJVM パッチは datapatch による SQL 適用が必要になることが多い。
- `DBA_REGISTRY_SQLPATCH` で OJVM パッチの SQL 適用状態を確認する。
- OJVM の適用漏れや不整合は、DB 起動後・アプリ実行時のエラーにつながることがある。
    

**確認例**

```sql
select patch_id,
       patch_type,
       action,
       status,
       action_time,
       description
from   dba_registry_sqlpatch
where  upper(description) like '%OJVM%'
order  by action_time desc;
```

**出典**

- Oracle Database Patch Maintenance では、RU / MRP 以外にも combo patches や追加の proactive patches があると説明されている。([Oracle Docs](https://docs.oracle.com/en/database/oracle/oracle-database/19/dbptc/index.html "Oracle Database Oracle Database Patch Maintenance, Release 19c and Later Releases"))
- Oracle `DBA_REGISTRY_SQLPATCH` リファレンスでは、SQL patch は OPatch 完了後に実行が必要な SQL scripts を含むパッチで、`DBA_REGISTRY_SQLPATCH` は datapatch により更新されると説明されている。([Oracle Docs](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/DBA_REGISTRY_SQLPATCH.html?utm_source=chatgpt.com "DBA_REGISTRY_SQLPATCH - Oracle Help Center"))
    

---

## GI Patch / Grid Infrastructure Patch

- Oracle Grid Infrastructure 向けのパッチ。
- RAC、ASM、Clusterware、GI Home を使う環境では Database RU とは別に確認が必要。
- GI と Database Home のパッチレベル差や互換性を確認する。
    

**メモ**

- RAC / ASM / GI 構成では、Database Home だけを見てもパッチ適用状況は不十分。
- GI RU、GI MRP、GI CSPU の有無を確認する。
- Mike Dietrich 氏の記事では、Oracle Grid Infrastructure 19c / 26ai でも MRP が利用可能であり、セキュリティ内容がある場合は CSPU も出ると説明されている。
- GI では rolling patch、opatchauto、クラスタ停止要否、ノード順序を事前確認する。
    

**確認例**

```bash
$ORACLE_HOME/OPatch/opatch lsinventory
$GRID_HOME/OPatch/opatch lsinventory
```

**出典**

- Mike Dietrich 氏の記事では、Grid Infrastructure 19c / 26ai でも MRP があり、セキュリティ内容が該当する場合は CSPU も利用可能になると説明されている。([Upgrade your Database - NOW!](https://mikedietrichde.com/2026/06/09/cpu-cspu-mrp-ru-some-clarifications/ "CPU, CSPU, MRP, RU - some clarifications – Upgrade your Database - NOW!"))
    

---

## Client Patch / Client Home Patch

- Oracle Client、Instant Client、JDBC、ODP.NET などクライアント側のパッチ。
- Database Server だけでなく、接続元クライアントにも脆弱性が存在する場合がある。
- 2026年5月 CSPU では、Oracle Database Server Risk Matrix の対象パッチが client-only installation にも該当すると説明されていた。
    

**メモ**

- DB サーバを最新化しても、アプリサーバ上の Oracle Client が古いままだとリスクが残る。
- 特に Net Services、TLS、JDBC、ODP.NET、Instant Client は確認対象。
- アプリチーム、ミドルウェアチーム、運用チームで Oracle Client の配置場所を棚卸しする。
- コンテナイメージ、バッチサーバ、BI ツール、監視ツール、ETL ツールに含まれる Oracle Client も確認する。

**出典**

- 2026年5月 CSPU Advisory では、Oracle Database Server Risk Matrix の 3 件の新しいセキュリティパッチについて、client-only installation にも該当すると説明されている。([Oracle](https://www.oracle.com/security-alerts/cspumay2026.html "Oracle Critical Security Patch Update Advisory - May 2026"))
    

---

## Combo Patch / Full Stack Patch

- Database RU、OJVM、GI、その他関連パッチをまとめて扱うためのパッチ提供形態。
- Exadata、RAC、GI、OJVM など複数コンポーネントを持つ環境では確認対象。
- 個別パッチを別々に適用するより、整合性を取りやすい場合がある。

**メモ**

- Combo Patch を使う場合でも、中に含まれる個別パッチの README を確認する。
- OJVM が含まれる場合、datapatch の実行と SQL patch 状態確認が必要。
- GI / DB / OJVM / OCW など、どの Home に何を当てるかを事前に整理する。
- rollback 時の単位も確認する。

**出典**

- Oracle Database Patch Maintenance では、RU / MRP に加えて quarterly full stack download patches、combo patches、その他 proactive patches があると説明されている。([Oracle Docs](https://docs.oracle.com/en/database/oracle/oracle-database/19/dbptc/index.html "Oracle Database Oracle Database Patch Maintenance, Release 19c and Later Releases"))
    

---

## TZ Patch / Time Zone Patch

- Oracle Database のタイムゾーンファイル更新パッチ。
- RU とは別に必要になることがある。
- アプリケーションが `TIMESTAMP WITH TIME ZONE` を使う場合や、国・地域の夏時間ルール変更が影響する場合に重要。
    

**メモ**

- RU 適用だけでタイムゾーン要件が満たされるとは限らない。
- DB のタイムゾーンファイルバージョン、アプリ要件、接続クライアント側の整合性を確認する。
- 適用には DBMS_DST などの手順が関係する場合があるため、README と手順を確認する。
- グローバルシステムでは、アプリ影響テストを事前に行う。
    

**出典**

- Oracle Database Patch Maintenance では、RU / MRP 以外の追加 proactive patches として、combo patches など複数のパッチ提供形態があると説明されている。([Oracle Docs](https://docs.oracle.com/en/database/oracle/oracle-database/19/dbptc/index.html "Oracle Database Oracle Database Patch Maintenance, Release 19c and Later Releases"))
    

---

## datapatch / SQL Patch 状態確認

- OPatch でバイナリを適用した後、SQL 変更が必要なパッチでは `datapatch` を実行する。
- SQL patch の適用履歴は `DBA_REGISTRY_SQLPATCH` で確認する。    
- CDB 環境では `CDB_REGISTRY_SQLPATCH` も確認する。

**メモ**

- `opatch lsinventory` は Oracle Home のバイナリパッチ確認。
- `DBA_REGISTRY_SQLPATCH` は DB 内の SQL patch 適用確認。
- 両方を確認しないと、バイナリだけ適用されて SQL 側が未適用という状態を見逃す可能性がある。
- `STATUS = SUCCESS` を確認する。
- `WITH ERRORS` がある場合はログを確認し、再実行または SR 起票を検討する。

**確認 SQL**

```sql
select patch_id,
       patch_type,
       action,
       status,
       action_time,
       description
from   dba_registry_sqlpatch
order  by action_time desc;
```

CDB 環境:

```sql
select con_id,
       patch_id,
       patch_type,
       action,
       status,
       action_time,
       description
from   cdb_registry_sqlpatch
order  by action_time desc;
```

**出典**

- Oracle `DBA_REGISTRY_SQLPATCH` リファレンスでは、同ビューはインストール済み SQL patch の情報を保持し、datapatch utility によって更新されると説明されている。([Oracle Docs](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/DBA_REGISTRY_SQLPATCH.html?utm_source=chatgpt.com "DBA_REGISTRY_SQLPATCH - Oracle Help Center"))
    

---

## 運用メモ

- 月次で確認するもの:
    - Oracle Security Alerts
    - CPU / CSPU Advisory
    - Security Alert
    - MOS Patch Availability Document
    - 対象 RU / MRP / CSPU README
    - OJVM / GI / Client / ORDS / 関連ミドルウェア
        
- 四半期で計画するもの:
    - 最新 RU 適用
    - GI / DB / OJVM / Client の整合性確認
    - ステージング環境での回帰テスト
    - rollback 手順確認
    - datapatch 確認
        
- 証跡として残すもの:
    - 適用前後の `opatch lsinventory`
    - 適用前後の `opatch lspatches`
    - `DBA_REGISTRY_SQLPATCH` / `CDB_REGISTRY_SQLPATCH`
    - パッチ ID
    - README
    - 既知問題
    - 適用日時
    - 対象 Oracle Home
    - rollback 方針
    - テスト結果

---

## まとめ

- **RU**: Oracle Database パッチ運用の中心。四半期ごとに最新化する。
- **MRP**: RU 間の月次推奨修正。特に Linux x86-64 環境で確認する。
- **CSPU**: 2026年から始まった月次の高優先度セキュリティ修正。CPU 月以外にも確認が必要。
- **CPU**: 四半期のセキュリティアドバイザリ。Database では RU / OJVM / GI / Client などの適用判断につなげる。
- **Security Alert**: CPU / CSPU を待てない緊急修正。公開時は優先確認。
- **OJVM / GI / Client / Combo / TZ**: Database RU だけではカバーしきれないため、構成に応じて個別確認する。
- **datapatch**: バイナリ適用後の SQL patch 適用確認に必須。`DBA_REGISTRY_SQLPATCH` を見る。


## 参照リンク
- https://mikedietrichde.com/2026/06/09/cpu-cspu-mrp-ru-some-clarifications/
