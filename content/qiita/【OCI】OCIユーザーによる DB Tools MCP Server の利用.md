---
title: 【OCI】DB Tools MCP Server を試す
date: 2026-06-02
update: 2026-06-02
draft: false
tags:
  - OCI
  - Database Tools
  - Oracle Database
  - MCP
  - OAuth
description: >-
  OCI Database Tools MCP Server を使用し、MCP クライアントから Oracle Database に接続してカスタム SQL
  ツールを実行する手順を整理する。
---

2026年5月12日、データベースへの接続機能を提供するOCIサービス「データベース・ツール」にMCPサーバーの機能が追加されました。Release Notes に以下の記載がある通り、Oracle Database へMCPを介してアクセスできるマネージドMCPサーバーとして利用することができます。

> Database Tools MCP Serverは、MCPクライアントがModel Context Protocol (MCP)を介してOracle AI Databaseに安全にアクセスできるようにする、管理されたマルチテナント・サービスです。このサービスは、IAMアイデンティティ・ドメインのOAuth 2.0と統合され、組込みおよびカスタムのSQLおよびPL/SQLツールをサポートします。
> https://docs.oracle.com/ja-jp/iaas/releasenotes/database-tools/mcp.htm

また、「データベース・ツール」サービスは同時に OCI IAM による認証もサポートしています。これは DB接続の際にOCI IAM のユーザーやグループを使用して接続及び権限管理ができるということです。決められた接続設定でなく、OCI IAM のコンテキストで接続及び認可が行われます。
この設定については以下の記事で紹介しているので、ご参照ください。
https://qiita.com/koin3z/items/33878a452e5e77a727f0

本記事では、そんなOCI IAM による接続を使用して、MCP 機能を実際に試してみます。
通常のパスワード認証を用いたMCP接続に関しては、ドキュメントの方でもチュートリアルとして手順が紹介されているので、それを参考にするのがいいでしょう
https://docs.oracle.com/ja-jp/iaas/database-tools/doc/tutorial.html

## 準備
対象 Database には、Autonomous AI Database（以下ADB）を使用します。前提条件として、この ADB はすでに作成されているものとします。
また、OCI IAM による接続設定はすでにされているものとします。手順については以下を参照ください
https://qiita.com/koin3z/items/33878a452e5e77a727f0#1-oracle-database-%E3%81%AE%E8%A8%AD%E5%AE%9A

なお、接続の作成にあたり、ランタイム・アイデンティティは「認証済プリンシパル」としています。

![[Pasted image 20260603104328.png]]


次にMCPサーバーを作成します。接続には上記にて作成した接続設定を使用します。なお、ここでも実行時アイデンティティを「認証済みプリンシパル」としています。

![[Pasted image 20260603110015.png]]

MCPサーバーが作成できたら、「クライアント」タブより、MCPクライアントを登録します。

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
以下を設定に追記します。

```
"mcpServers": {
	"oci-dbtools-mcp": {
		"command": "npx",
		"args": [
			"-y",
			"mcp-remote",
			"https://mcp.dbtools.ap-sydney-1.oci.oraclecloud.com/20250830/databaseToolsMcpServers/ocid1.databasetoolsmcpserver.oc1.ap-sydney-1.amaaaaaatgpiivia4livhqwgp6heib37orjf3yniuftwstwvzxehxcysj7ha/actions/invoke",
			"8080",
			"--transport",
			"http-only",
			"--debug",
			"--static-oauth-client-metadata",
			"{ \"scope\": \"urn:opc:dbtools:mcpserver:ocid1.databasetoolsmcpserver.oc1.ap-sydney-1.amaaaaaatgpiivia4livhqwgp6heib37orjf3yniuftwstwvzxehxcysj7hamcp:all offline_access\" }",
			"--static-oauth-client-info",
			"{ \"client_id\": \"b0c246dc42c9469c8d5aac4d5fee1878\" }"
		]
	}
},
```


機密クライアントの場合は以下
```
"mcpServers": {
	"oci-dbtools-mcp": {
		"command": "npx",
		"args": [
			"-y",
			"mcp-remote",
			"https://mcp.dbtools.ap-sydney-1.oci.oraclecloud.com/20250830/databaseToolsMcpServers/ocid1.databasetoolsmcpserver.oc1.ap-sydney-1.amaaaaaatgpiivia4livhqwgp6heib37orjf3yniuftwstwvzxehxcysj7ha/actions/invoke",
			"8080",
			"--transport",
			"http-only",
			"--debug",
			"--static-oauth-client-metadata",
			"{ \"scope\": \"urn:opc:dbtools:mcpserver:ocid1.databasetoolsmcpserver.oc1.ap-sydney-1.amaaaaaatgpiivia4livhqwgp6heib37orjf3yniuftwstwvzxehxcysj7hamcp:all offline_access\" }",
			"--static-oauth-client-info",
			"{ \"client_id\": \"b0c246dc42c9469c8d5aac4d5fee1878\" }"
		]
	}
},
```

## 参照リンク
- https://docs.oracle.com/ja-jp/iaas/database-tools/doc/working-database-tools-mcp-server.html
