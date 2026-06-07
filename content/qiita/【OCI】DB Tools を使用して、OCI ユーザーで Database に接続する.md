---
title: 【OCI】DB Tools を使用して OCI ユーザーで Database に接続する
date: 2026-06-02
update: 2026-06-03
draft: false
tags:
  - OCI
  - Database Tools
  - Oracle Database
  - IAM
aliases:
  - OCI DB Tools IAM認証
description: OCI Database Tools のトークン・ベース認証を使用し、OCI IAM ユーザーで Oracle Database に接続する手順を紹介します。
---
2026年5月12日、データベースへの接続機能を提供する OCI サービス「データベース・ツール」で、OCI IAM によるトークン・ベース認証がサポートされるようになりました。

> データベース・ツール接続では、Oracle DatabaseのIAMトークンベースの認証およびプロキシ認証がサポートされるようになりました。
> https://docs.oracle.com/ja-jp/iaas/releasenotes/database-tools/iam-authentication.htm

OCI 上で提供される Oracle Database では、以前から OCI IAM を認証基盤として使用できます。今回の機能追加により、その IAM 認証を DB Tools の接続機能からも利用できるようになりました。
認証方式の概要については、以下の Speaker Deck も参考になります。

https://speakerdeck.com/oracle4engineer/oracledb-seccurity-overview-authentication?slide=50

本記事では、DB Tools の「トークン・ベースの認証」を使用して、OCI コンソールにログインしている IAM ユーザーの認証情報で Oracle Database に接続する手順を確認します。

## 0. 準備

### 0-1. 前提条件

接続先の Database として、本記事では Autonomous AI Database（以下 ADB）を使用します。ADB は事前に作成済みであるものとします。

この接続方式では、Oracle Database への TLS 接続が必須です。ADB では基本的に TLS 接続を使用するためそのまま利用できますが、Base Database Service などを使用する場合は、リスナーで TLS 接続が有効になっているかを確認してください。環境によっては、デフォルトで構成されている 2486 番ポートの TLS 接続を利用できます。

また、アイデンティティ管理基盤として OCI IAM Identity Domains を使用します。デフォルトで作成される Default ドメインでも利用できますが、通常の OCI 操作に使うユーザーやグループと分離したい場合は、別のドメインを作成しておくと管理しやすくなります。ここでは、ドメイン名を `domain-db` として作成・使用しています。

本記事では、以下の IAM グループを使用します。手順を実行する前に、対象のドメイン内でグループを作成し、接続に使用する IAM ユーザーを必要なグループへ所属させておきます。

- `iamgroup-connect`
	- Database へログインできるユーザーのグループ
- `iamgroup-hr-admin`
	- HR スキーマに対して管理操作を行うユーザーのグループ
- `iamgroup-hr-dev`
	- HR スキーマのデータを参照するユーザーのグループ

DB Tools の接続を作成する OCI ユーザーには、DB Tools 接続リソースを作成・管理する権限も必要です。接続先 Database や、証明書・シークレットを使用する場合は、それらを参照するための OCI IAM ポリシーもあわせて準備してください。

### 0-2. サンプルデータの作成

ADB にはサンプルデータが用意されていますが、ここでは最小構成の確認用データとして、HR ユーザーの作成、セッション権限の付与、表の作成、データ投入を行います。

```
-- ユーザー作成
create user HR identified by "<password>" quota unlimited on data;

-- セッション権限を付与
grant create session to HR;

-- サンプル表を作成
create table HR.DEPARTMENTS (
	DEPT_ID number primary key,
	DEPT_NAME varchar2(50) not null,
	LOCATION varchar2(50)
);

-- サンプルデータを挿入
insert into hr.departments (dept_id, dept_name, location) values (10, 'Accounting', 'Tokyo');
insert into hr.departments (dept_id, dept_name, location) values (20, 'Research', 'Osaka');
insert into hr.departments (dept_id, dept_name, location) values (30, 'Sales', 'Nagoya');
insert into hr.departments (dept_id, dept_name, location) values (40, 'HR', 'Fukuoka');

commit;
```

## 1. Database の設定

### 1-1. 外部認証の有効化

IAM ユーザーによる接続を許可するために、Database の外部認証を OCI IAM と連携するように設定します。  
有効化手順は DB プラットフォーム（ADB / 非 ADB）で異なるため、詳細は公式ドキュメントも参照してください。

※ Oracle Database において、クラウドプロバイダと連携する認証機能は正式には「グローバル認証」といいますが、ここでは説明をわかりやすくするために「外部認証」と表記します。

- ADB-S：
	- https://docs.oracle.com/en/cloud/paas/autonomous-database/serverless/adbsb/enable-iam-authentication.html
- 非 ADB：
	- https://docs.oracle.com/cd/F19136_01/dbseg/authenticating-and-authorizing-iam-users-oracle-dbaas-databases.html#GUID-4149CF38-FE2E-4682-806E-8100CB7A9835

#### ・Autonomous Database（ADB）の場合

ADB の場合、`DBMS_CLOUD_ADMIN` パッケージを使用して OCI IAM 認証を有効化します。

```
BEGIN
	DBMS_CLOUD_ADMIN.ENABLE_EXTERNAL_AUTHENTICATION(
		type => 'OCI_IAM');
END;
/
```

#### ・非 ADB の場合

非 ADB の場合は、`IDENTITY_PROVIDER_TYPE` パラメータを設定します。

```
ALTER SYSTEM SET IDENTITY_PROVIDER_TYPE=OCI_IAM SCOPE=BOTH;
```

設定が正しく反映されたか、状態を確認します。

```
SELECT NAME, VALUE FROM V$PARAMETER WHERE NAME='identity_provider_type';

-- または以下のコマンドでも可
SHOW PARAMETER identity_provider_type;
```

### 1-2. DB ユーザーの作成

外部認証（グローバル認証）を使用する場合、Database 側では OCI IAM と対応付ける「グローバルユーザー」を作成します。

本手順では、IAM グループ `domain-db/iamgroup-connect` に属するすべてのユーザーが、Database 上では単一のユーザー `DBUSER_IAM` として接続するように設定します。そのため、作成するグローバルユーザーは以下の 1 ユーザーのみです。

- `DBUSER_IAM`

管理者権限を持つユーザーで Database に接続し、グローバルユーザーを作成します。

```
create user DBUSER_IAM identified globally as 'IAM_GROUP_NAME=domain-db/iamgroup-connect';
```

これで、`iamgroup-connect` グループに属する IAM ユーザーは、Database では `DBUSER_IAM` ユーザーとして扱われます。接続自体に必要な権限として、`DBUSER_IAM` ユーザーへ `CREATE SESSION` を付与しておきます。

```
grant create session to DBUSER_IAM;
```

### 1-3. グローバルロールの作成

次に、グローバルロールを IAM グループにマッピングし、グループごとに Database 上の権限を分離します。作成するロールは次の 2 つです。

- `GLROLE_HR_ADMIN`（`iamgroup-hr-admin` グループと対応付け。HR スキーマの管理権限を付与）
- `GLROLE_HR_DEV`（`iamgroup-hr-dev` グループと対応付け。HR スキーマの参照権限を付与）

`GLROLE_HR_ADMIN` ロールには、HR スキーマに対する管理権限を付与します。

```
create role GLROLE_HR_ADMIN identified globally as 'IAM_GROUP_NAME=domain-db/iamgroup-hr-admin';

grant all privileges on schema hr to GLROLE_HR_ADMIN;
```

`GLROLE_HR_DEV` ロールには、参照権限のみを付与します。

```
create role GLROLE_HR_DEV identified globally as 'IAM_GROUP_NAME=domain-db/iamgroup-hr-dev';

grant select on hr.departments to GLROLE_HR_DEV;
```

## 2. 接続の作成

DB Tools で接続設定を作成します。OCI コンソールで「開発者サービス」→「データベース・ツール」→「接続」を開き、「接続の作成」から設定します。

この手順では、DB ユーザー名を直接指定しません。画面下部の「拡張オプション」で「トークン・ベースの認証の使用」を有効化すると、通常のユーザー名・パスワードではなく、OCI IAM の認証を利用する接続として作成されます。

「SSL 詳細」欄では、環境にあわせて TLS 接続に必要な証明書を設定します。ADB に接続する場合は、接続方式や証明書の要件に応じて適切な設定を選択してください。

![[Pasted image 20260602231304.png]]

![[Pasted image 20260602231514.png]]

## 3. 接続を試す

接続を作成したら、対象の IAM ユーザーで OCI コンソールにログインし、作成した DB Tools 接続から「SQL ワークシート」を開きます。

ここで使用する IAM ユーザーは、少なくとも `iamgroup-connect` に所属している必要があります。HR スキーマに対する管理操作や参照操作を確認する場合は、あわせて `iamgroup-hr-admin` または `iamgroup-hr-dev` に所属させておきます。

![[Pasted image 20260602231808.png]]

![[Pasted image 20260602232200.png]]

![[Pasted image 20260602232901.png]]

DB ユーザーを確認すると、IAM ユーザー名ではなく、マッピング先として設定した `DBUSER_IAM` で接続していることがわかります。

![[Pasted image 20260602232956.png]]

以下のクエリを実行すると、セッション上のユーザー情報や認証方式を確認できます。

```
select
	sys_context('USERENV', 'SESSION_USER') as session_user,
	sys_context('USERENV', 'CURRENT_USER') as current_user,
	sys_context('USERENV', 'AUTHENTICATION_METHOD') as auth_method,
	sys_context('USERENV', 'IDENTIFICATION_TYPE') as identification_type,
	sys_context('USERENV', 'ENTERPRISE_IDENTITY') as enterprise_identity
from dual;
```

![[Pasted image 20260603100017.png]]

`SESSION_USER` や `CURRENT_USER` には Database 上のユーザーである `DBUSER_IAM` が表示されます。一方で、`AUTHENTICATION_METHOD` や `ENTERPRISE_IDENTITY` を確認することで、OCI IAM を使用した外部認証で接続していることを確認できます。

## 4. まとめ

DB Tools のトークン・ベース認証を使用すると、Database のローカルユーザー名・パスワードを接続設定に保持せず、OCI IAM ユーザーの認証を使って Database に接続できます。

Database 側では、IAM グループに対応するグローバルユーザーやグローバルロールを作成しておくことで、接続可否やスキーマ権限を IAM グループ単位で管理できます。DB Tools を経由する場合でも、Database 側の外部認証設定、TLS 接続、IAM グループとのマッピングが必要になる点は押さえておく必要があります。

## 参照リンク
- [Database Tools Release Notes - IAM Authentication](https://docs.oracle.com/ja-jp/iaas/releasenotes/database-tools/iam-authentication.htm)
- [Use IAM Authentication with Autonomous Database](https://docs.oracle.com/en/cloud/paas/autonomous-database/serverless/adbsb/enable-iam-authentication.html)
- [Authenticating and Authorizing IAM Users for Oracle DBaaS Databases](https://docs.oracle.com/cd/F19136_01/dbseg/authenticating-and-authorizing-iam-users-oracle-dbaas-databases.html#GUID-4149CF38-FE2E-4682-806E-8100CB7A9835)
