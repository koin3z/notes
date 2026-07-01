---
title: 【OCI】Autonomous Database でパスワード定期変更がないように設定する
date: 2026-06-28
modified: 2026-06-28
draft: false
tags:
  - source/qiita
  - cloud/oci/database
aliases:
  - qiita/【OCI】Autonomous Database でパスワード定期変更がないように設定する
description: Autonomous Databaseでユーザーのパスワードを期限切れにしないためのプロファイル設定を整理する。
---

Oracle Autonomous Database（ADB）で、ユーザーのパスワードを期限切れにしないように設定する方法を整理します。

Oracle Database では、ユーザーに「プロファイル」を割り当てることで、パスワードの有効期限やロック条件などのポリシーを制御します。本記事では、ADB 上でパスワードの定期変更を不要にするために、プロファイルを変更または作成してユーザーに適用する手順を確認します。

## はじめに

Oracle Database のプロファイルでは、パスワードに関するさまざまな制限を定義できます。代表的な項目は、以下の資料でも紹介されています。

<script defer class="speakerdeck-embed" data-slide="17" data-id="16c1b9018cbb4c1e8625b4be6c8eeb3a" data-ratio="1.7777777777777777" src="//speakerdeck.com/assets/embed.js"></script>

ただし、OCI が提供するマネージド・データベース・サービスである Autonomous Database では、デフォルトのプロファイル設定が次のようになっています。

```sql
SELECT resource_name, limit FROM dba_profiles
	WHERE profile = 'DEFAULT' AND resource_type = 'PASSWORD';
```

```sql:実行結果
SQL> select resource_name, limit from dba_profiles where profile='DEFAULT' and resource_type='PASSWORD';

RESOURCE_NAME               LIMIT
___________________________ ________________________
FAILED_LOGIN_ATTEMPTS       10
PASSWORD_REUSE_MAX          4
PASSWORD_VERIFY_FUNCTION    CLOUD_VERIFY_FUNCTION
PASSWORD_REUSE_TIME         1
PASSWORD_LOCK_TIME          1
PASSWORD_LIFE_TIME          360
PASSWORD_GRACE_TIME         30
INACTIVE_ACCOUNT_TIME       UNLIMITED
PASSWORD_ROLLOVER_TIME      0
9 rows selected.
```

プロファイルを明示せずにユーザーを作成すると、`DEFAULT` プロファイルが割り当てられます。この場合、`PASSWORD_LIFE_TIME` が `360` に設定されているため、パスワードには 360 日の有効期限が設定されます。

この有効期限を変更する方法として、ここでは次の 2 つを確認します。

- `DEFAULT` プロファイルのパスワード有効期限を変更する
- パスワードを期限切れにしない専用プロファイルを作成し、対象ユーザーに割り当てる

## A. DEFAULT プロファイルのパスワード有効期限を変更する

`DEFAULT` プロファイル自体を変更する場合は、以下を実行します。

```
alter profile DEFAULT limit PASSWORD_LIFE_TIME unlimited;
```

設定が反映されたか確認します。

```
select resource_name, limit from dba_profiles where profile='DEFAULT' and resource_type='PASSWORD';
```

## B. パスワード無期限のユーザープロファイルを作成する

`DEFAULT` プロファイルを直接変更すると、プロファイルを明示していないユーザー全体に影響します。データベース全体のベースラインを変えず、特定のユーザーだけパスワードを期限切れにしたくない場合は、専用プロファイルを作成して割り当てます。

ADMIN ユーザー、または `CREATE PROFILE` と `ALTER USER` 権限を持つ管理者ユーザーで ADB に接続し、以下の SQL を順に実行します。

### 1. プロファイルを作成

新しいプロファイルを作成し、パスワードの有効期限を無期限（`UNLIMITED`）に設定します。ここでは例として、プロファイル名を `NO_EXPIRE_PROFILE` としています。

```sql
create profile NO_EXPIRE_PROFILE limit PASSWORD_LIFE_TIME UNLIMITED;
```

ここで明示的に指定しなかった他の項目は、`DEFAULT` プロファイルの設定が引き継がれます。そのため、変更したい制限だけを専用プロファイル側で定義できます。

### 2. 既存ユーザーに新しいプロファイルを割り当てる

パスワードの定期変更を不要にしたいユーザーに対して、作成したプロファイルを適用します。

```sql
alter user <既存のユーザー名> profile NO_EXPIRE_PROFILE;
```

これで、指定したユーザーには `NO_EXPIRE_PROFILE` が適用され、パスワードの有効期限が無期限になります。

### 関連リンク

プロファイルによるパスワード有効期限の設定や、ユーザーへのプロファイル割当てについては、Oracle 公式ドキュメントにも記載されています。

- [Configuring Authentication - Oracle Database Security Guide](https://docs.oracle.com/en/database/oracle/oracle-database/19/dbseg/configuring-authentication.html)
- [Managing Security for Oracle Database Users](https://docs.oracle.com/en/database/oracle/oracle-database/19/dbseg/managing-security-for-oracle-database-users.html)

## ADMIN ユーザーについて

ここまでの手順は一般ユーザー向けのプロファイル設定です。ADB の `ADMIN` ユーザーについては、`ORA_ADMIN_PROFILE` プロファイルが割り当てられており、このプロファイルのパスワード期限は変更できません。

```sql
SQL> select username, profile from dba_users where username = 'ADMIN';

USERNAME    PROFILE
___________ ____________________
ADMIN       ORA_ADMIN_PROFILE

SQL> alter profile ORA_ADMIN_PROFILE limit PASSWORD_LIFE_TIME unlimited;

Error starting at line : 1 in command -
alter profile ORA_ADMIN_PROFILE limit PASSWORD_LIFE_TIME unlimited
Error report -
ORA-41724: insufficient privileges for ALTER PROFILE

https://docs.oracle.com/error-help/db/ora-41724/
41724. 0000 -  "insufficient privileges for ALTER PROFILE"
*Document: YES
*Cause:    An attempt was made to
           1) Alter a common or default profile in root without the ALTER
           PROFILE privilege.
           2) Alter a federation profile in federation root without the
           federationally granted ALTER PROFILE privilege.
           3) Alter Oracle defined profiles ORA_STIG_PROFILE and ORA_CIS_PROFILE
           by lesser privileged users with ALTER PROFILE privilege.
           4) Alter a protected profile in a pluggable database with profile
           parameters that are not allowed to be modified.
*Action:   Grant the required privilege and retry the operation.
```

公式ドキュメントにも、`ORA_PROTECTED_PROFILE` および `ORA_ADMIN_PROFILE` を持つユーザーのプロファイル割当ては変更できないことが記載されています。対象となるユーザーとして、次のような管理用ユーザーが挙げられています。

- `ADBSNMP`
- `ADB_APP_STORE`
- `DCAT_ADMIN`
- `GGADMIN`
- `RMAN$CATALOG`

`ADMIN` ユーザーは `ORA_ADMIN_PROFILE` に割り当てられるため、通常のユーザープロファイルと同じ方法では変更できません。

https://docs.oracle.com/ja-jp/iaas/autonomous-database-serverless/doc/manage-user-profiles.html

そのため、`ADMIN` ユーザーのパスワードは、通常の DB ユーザーと同じプロファイル運用ではなく、OCI コンソールなど ADB の管理機能側で扱うものとして整理しておくとよさそうです。ADMIN パスワードの管理については、OCI のシークレット管理サービスを使用する方法も案内されています。

https://docs.oracle.com/en/cloud/paas/autonomous-database/serverless/adbsb/manage-users-create.html
