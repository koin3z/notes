---
title: Untitled
date: 2026-06-02
update: 2026-06-02
draft: false
tags:
  - 
aliases:
  - 
description: このページの内容についての簡単な説明
---
2026年5月12日、データベースへの接続機能を提供するOCIサービス「データベース・ツール」にMCPサーバーの機能が追加されました。Release Notes に以下の記載がある通り、Oracle Database へMCPを介してアクセスできるマネージドMCPサーバーとして利用することができます。

> Database Tools MCP Serverは、MCPクライアントがModel Context Protocol (MCP)を介してOracle AI Databaseに安全にアクセスできるようにする、管理されたマルチテナント・サービスです。このサービスは、IAMアイデンティティ・ドメインのOAuth 2.0と統合され、組込みおよびカスタムのSQLおよびPL/SQLツールをサポートします。
> https://docs.oracle.com/ja-jp/iaas/releasenotes/database-tools/mcp.htm

とはいえ、この機能の利用には通常の MCP 等の知識に加え、Oracle Database の認証方式、および認証基盤として連携されるサービス「OCI IAM Identity Domains」の理解が多少必要となります。

本記事では、そんな MCP 機能を実際に試してみます。

## 準備
対象 Database には、Autonomous AI Database（以下ADB）を使用します。前提条件として、この ADB はすでに作成されているものとします。

### 接続の作成
コンソールのメニューより、「開発者サービス」→「接続」と移り、まずは接続設定を作成します。




![[Pasted image 20260603104328.png]]

ランタイム・アイデンティティ: 認証済プリンシパル
	現在ログインしているOCIユーザーが、接続に必要なDBパスワードやWalletシークレットを取得します
ランタイム・アイデンティティ: リソース・プリンシパル
	DB Tools接続リソース自身がシークレットを取得します。ユーザーにシークレット読取り権限を直接付けなくてよいので、MCP用途ではこちらを推奨します。

なお、拡張オプションの認証欄には「トークン・ベース認証の使用」があり、これはMCPの使用に関係なく、OCI IAM の認証を経てDB Tools で接続することもできます。
DBユーザーを個別に払い出さずに、OCI IAM 側でユーザーおよびグループによる権限管理を行うことができます。
今回はオフにしています。

接続を作成したら、「アクション」より「外部認証の構成」を選択し、「OCI IAM」を設定します。

![[Pasted image 20260603104621.png]]

![[Pasted image 20260603110015.png]]


![[Pasted image 20260603113000.png]]

「クライアント」タブより、MCPクライアントを登録します。

![[Pasted image 20260603120010.png]]


クライアントIDやクライアントシークレットなど、トークン要求情報を控えておきます。
![[Pasted image 20260603120239.png]]


## Tools の作成
「ツールセット」タブより、MCPツールセットを作成します。
本記事ではツールの設定はさほど重要ではないので、AIに適当に以下のツールを作らせました。

### ツール1: 一般ユーザー向け 部門一覧

| 項目               | 値                                                                                                                             |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Toolset name     | `HR User - List Departments`                                                                                                  |
| Tool name        | `hr_list_departments`                                                                                                         |
| Tool description | `List all departments from HR.DEPARTMENTS. Use this for ordinary users who need to see department IDs, names, and locations.` |
| Type             | `Custom SQL tool`                                                                                                             |
| Allowed Roles    | `MCP_USERS`                                                                                                                   |
| Variables        | なし                                                                                                                            |

```sql
SELECT
  dept_id,
  dept_name,
  location
FROM HR.DEPARTMENTS
ORDER BY dept_id
```

### ツール2: 一般ユーザー向け 部門検索

| 項目               | 値                                                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Toolset name     | `HR User - Search Departments`                                                                                                 |
| Tool name        | `hr_search_departments`                                                                                                        |
| Tool description | `Search departments by department name or location. Use this for ordinary users who need to find departments using a keyword.` |
| Type             | `Custom SQL tool`                                                                                                              |
| Allowed Roles    | `MCP_USERS`                                                                                                                    |

| 変数名       | 型          | 説明                                                  |
| --------- | ---------- | --------------------------------------------------- |
| `keyword` | `VARCHAR2` | `Keyword to search in department name or location.` |

```sql
SELECT
  dept_id,
  dept_name,
  location
FROM HR.DEPARTMENTS
WHERE LOWER(dept_name) LIKE '%' || LOWER(:keyword) || '%'
   OR LOWER(location)  LIKE '%' || LOWER(:keyword) || '%'
ORDER BY dept_id
```

### ツール3: 管理者向け 部門サマリー

| 項目               | 値                                                                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Toolset name     | `HR Admin - Department Summary`                                                                                                                                     |
| Tool name        | `hr_admin_department_summary`                                                                                                                                       |
| Tool description | `Return an administrative summary of HR.DEPARTMENTS, including row count, department ID range, and database session information. Use this only for administrators.` |
| Type             | `Custom SQL tool`                                                                                                                                                   |
| Allowed Roles    | `MCP_ADMIN`                                                                                                                                                         |
| Variables        | なし                                                                                                                                                                  |
```sql
SELECT
  COUNT(*) AS department_count,
  MIN(dept_id) AS min_dept_id,
  MAX(dept_id) AS max_dept_id,
  COUNT(DISTINCT location) AS location_count,
  SYS_CONTEXT('USERENV', 'SESSION_USER') AS db_session_user,
  SYS_CONTEXT('USERENV', 'CURRENT_SCHEMA') AS db_current_schema
FROM HR.DEPARTMENTS
```



![[Pasted image 20260603142324.png]]


### MCPクライアントより接続する


## 参照リンク
- https://docs.oracle.com/ja-jp/iaas/database-tools/doc/working-database-tools-mcp-server.html
