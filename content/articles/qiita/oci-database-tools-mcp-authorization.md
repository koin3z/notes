---
title: 【OCI】DB Tools MCPサーバーにおける認可実装を確認する
date: 2026-06-13
modified: 2026-06-13
draft: false
tags:
  - source/qiita
  - cloud/oci/database
  - identity/oauth
  - ai/mcp
aliases:
  - qiita/【OCI】DB Tools MCPサーバーにおける認可実装を確認する
description: OCI Database Tools MCP Server の認可フローを、MCP サーバーのメタデータ取得から OAuth フロー開始まで確認する。
---

2026年5月12日、データベースへの接続機能を提供する OCI サービス「データベース・ツール」に MCP サーバーの機能が追加されました。Release Notes には以下のように記載されており、Oracle Database に MCP 経由でアクセスするためのマネージド MCP サーバーとして利用できます。

> Database Tools MCP Serverは、MCPクライアントがModel Context Protocol (MCP)を介してOracle AI Databaseに安全にアクセスできるようにする、管理されたマルチテナント・サービスです。このサービスは、IAMアイデンティティ・ドメインのOAuth 2.0と統合され、組込みおよびカスタムのSQLおよびPL/SQLツールをサポートします。
> https://docs.oracle.com/ja-jp/iaas/releasenotes/database-tools/mcp.htm

「データベース・ツール」サービスは、OCI IAM による認証もサポートしています。つまり、DB 接続時に OCI IAM のユーザーやグループを使用して接続および権限管理を行えます。固定の接続設定だけで接続するのではなく、OCI IAM のコンテキストを使って接続と認可を行う構成です。

この設定については、以下の記事で紹介しています。

https://qiita.com/koin3z/items/33878a452e5e77a727f0

通常のパスワード認証を用いた MCP 接続については、Oracle のドキュメントにチュートリアルが用意されています。パスワード認証で試す場合は、こちらを参照するとよいでしょう。

https://docs.oracle.com/ja-jp/iaas/database-tools/doc/tutorial.html

MCP を使用した接続では、認証基盤、より正確には認可サーバーとして OCI IAM Identity Domains が使われます。これは MCP サーバーを作成する際に指定する形になりますが、実際の接続フローを見る限り、MCP の 2025-11-25 版 Authorization 仕様に沿っているようです。

この記事では、初期アクセスからトークンが払い出されるまでのフローを確認しながら、DB Tools MCP サーバーの認可の仕組みを追っていきます。

## MCP Authorization 仕様について

DB Tools MCP サーバーの認可フロー自体は、MCP の仕様に沿ったものです。そのため、この記事では仕様を網羅的に説明するのではなく、実際の通信で何が起きているかを確認することに絞ります。

仕様の詳細は以下から確認できます。

https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization

私の理解では、2025-11-25 版の Authorization 仕様は、大きく次の4つのフェーズに分けて整理できます。

- MCP サーバーのメタデータディスカバリ
- 認可サーバーのメタデータディスカバリ
- クライアント登録
- OAuth フローの開始

OAuth フロー自体は OAuth 2.1 に準じるため、この記事では主に OAuth フローを開始する直前までの処理を確認します。

## 1. MCP サーバーのメタデータの取得

MCP クライアントには、まず MCP サーバーの URL が渡されます。DB Tools MCP サーバーの場合、URL は以下のような形式になります。

```text
https://mcp.dbtools.ap-sydney-1.oci.oraclecloud.com/20250830/databaseToolsMcpServers/ocid1.databasetoolsmcpserver.oc1.ap-sydney-1.xxx/actions/invoke
```

クライアントは、この URL に対して最初に POST リクエストを送信します。

```text:リクエスト
POST https://mcp.dbtools.ap-sydney-1.oci.oraclecloud.com/20250830/databaseToolsMcpServers/ocid1.databasetoolsmcpserver.oc1.ap-sydney-1.xxx/actions/invoke
```

アクセストークンを付与していないため、レスポンスは `401 Unauthorized` になります。このとき、`WWW-Authenticate` ヘッダーに MCP サーバーへアクセスするための情報が含まれます。

```text
401 Unauthorized

WWW-Authenticate:
  Bearer error="invalid_request", error_description="No access token was provided in this request", resource_metadata="https://mcp.dbtools.ap-sydney-1.oci.oraclecloud.com/.well-known/oauth-protected-resource/20250830/databaseToolsMcpServers/ocid1.databasetoolsmcpserver.oc1.ap-sydney-1.xxx/actions/invoke", scopes="urn:opc:dbtools:mcpserver:ocid1.databasetoolsmcpserver.oc1.ap-sydney-1.xxx:all"
```

ここで重要なのは `resource_metadata` です。クライアントは、この値に指定された URL へアクセスし、OAuth Protected Resource、つまり MCP サーバー側のメタデータを取得します。

```text
GET https://mcp.dbtools.ap-sydney-1.oci.oraclecloud.com/.well-known/oauth-protected-resource/20250830/databaseToolsMcpServers/ocid1.databasetoolsmcpserver.oc1.ap-sydney-1.xxx/actions/invoke
```

このパス形式は RFC 9728 に沿ったものです。

https://datatracker.ietf.org/doc/rfc9728/

レスポンスは以下のようになります。

```json
{
  "resource": "https://mcp.dbtools.ap-sydney-1.oci.oraclecloud.com/20250830/databaseToolsMcpServers/ocid1.databasetoolsmcpserver.oc1.ap-sydney-1.xxx/actions/invoke",
  "authorization_servers": [
    "https://idcs-7e70daa81c094dcc98776e4ee48be3d1.identity.oraclecloud.com:443"
  ],
  "scopes_supported": [
    "urn:opc:dbtools:mcpserver:ocid1.databasetoolsmcpserver.oc1.ap-sydney-1.xxx:all"
  ],
  "bearer_methods_supported": ["header"],
  "resource_name": "mcp-dbtools-adb-adminpass",
  "resource_documentation": "https://docs.oracle.com/en-us/iaas/database-tools"
}
```

このレスポンスから、対象の MCP サーバーが利用している認可サーバー、つまり Identity Domain の位置と、要求されるスコープを把握できます。

## 2. 認可サーバーのメタデータの取得

MCP サーバーが利用する認可サーバーの位置が分かったので、次に認可サーバーのメタデータを取得します。

この仕組みは OAuth 2.0 Authorization Server Metadata、つまり RFC 8414 の内容に沿ったものです。

https://datatracker.ietf.org/doc/html/rfc8414

リクエストは以下のようになります。

```text
GET https://idcs-aaa.identity.oraclecloud.com:443/.well-known/oauth-authorization-server
```

レスポンスは以下のようになります。

```json
{
  "issuer": "https://identity.oraclecloud.com/",
  "authorization_endpoint": "https://idcs-aaa.oraclecloud.com:443/oauth2/v1/authorize",
  "token_endpoint": "https://idcs-aaa.identity.oraclecloud.com:443/oauth2/v1/token",
  "token_endpoint_auth_methods_supported": [
    "client_secret_basic",
    "private_key_jwt",
    "client_secret_post",
    "none"
  ],
  "token_endpoint_auth_signing_alg_values_supported": ["RS256"],
  "jwks_uri": "https://idcs-aaa.identity.oraclecloud.com:443/admin/v1/SigningCert/jwk",
  "scopes_supported": [
    "openid",
    "profile",
    "offline_access",
    "email",
    "address",
    "phone",
    "groups",
    "get_groups",
    "approles",
    "get_approles"
  ],
  "response_types_supported": [
    "code",
    "token",
    "id_token",
    "code token",
    "code id_token",
    "token id_token",
    "code token id_token"
  ],
  "ui_locales_supported": ["en"],
  "revocation_endpoint": "https://idcs-aaa.identity.oraclecloud.com:443/oauth2/v1/revoke",
  "introspection_endpoint": "https://idcs-aaa.identity.oraclecloud.com:443/oauth2/v1/introspect",
  "code_challenge_methods_supported": ["S256"],
  "secure_authorization_endpoint": "https://idcs-aaa.ap-sydney-idcs-1.secure.identity.oraclecloud.com/oauth2/v1/authorize",
  "secure_token_endpoint": "https://idcs-aaa.ap-sydney-idcs-1.secure.identity.oraclecloud.com/oauth2/v1/token",
  "secure_userinfo_endpoint": "https://idcs-aaa.ap-sydney-idcs-1.secure.identity.oraclecloud.com/oauth2/v1/userinfo",
  "secure_revocation_endpoint": "https://idcs-aaa.ap-sydney-idcs-1.secure.identity.oraclecloud.com/oauth2/v1/revoke",
  "secure_introspection_endpoint": "https://idcs-aaa.ap-sydney-idcs-1.secure.identity.oraclecloud.com/oauth2/v1/introspect",
  "secure_jwks_uri": "https://idcs-aaa.ap-sydney-idcs-1.secure.identity.oraclecloud.com/admin/v1/SigningCert/jwk",
  "grant_types_supported": [
    "client_credentials",
    "password",
    "refresh_token",
    "authorization_code",
    "urn:ietf:params:oauth:grant-type:jwt-bearer",
    "tls_cert_auth"
  ],
  "userinfo_endpoint": "https://idcs-aaa.identity.oraclecloud.com:443/oauth2/v1/userinfo"
}
```

MCP クライアントは、このレスポンスからリクエスト先のエンドポイント、サポートされる付与方式、PKCE の対応状況（`code_challenge_methods_supported`）などを確認します。

`mcp-remote` を使用している場合、このあとトークンキャッシュの確認や接続テストを行い、OAuth フローに入る必要があるかを判断しているようです。

## 3. クライアント登録

次にクライアント登録を行います。

2025-11-25 版の Authorization 仕様では、クライアント登録について次の選択肢が示されています。

> - **Client ID Metadata Documents**: When client and server have no prior relationship (most common)
> - **Pre-registration**: When client and server have an existing relationship
> - **Dynamic Client Registration**: For backwards compatibility or specific requirements

今回確認した OCI IAM Identity Domains では、2026年6月13日時点で、Dynamic Client Registration（DCR）や Client ID Metadata Document（CIDM）を使った登録方法は確認できませんでした。そのため、静的な事前登録（Pre-registration）を使用することになります。

なお、2025-11-25 版の Authorization 仕様に対応していない MCP クライアントもまだ多いため、しばらくは `mcp-remote` を併用する場面が多そうです。

## 4. OAuth フロー

クライアント登録まで完了すると、OAuth フローに入ります。

通常は、MCP サーバーのメタデータ取得時に確認した `scope` と `resource` パラメータを使用します。

OCI コンソールから見ると、`scope` には `offline_access`（リフレッシュトークン）も含まれているようですが、これは必須ではなく、必要に応じて指定するものと考えられます。

![[Pasted image 20260613175256.png]]

## 5. Claude Desktop から接続する

Oracle のチュートリアルでは `mcp-remote` を使用した手順が紹介されています。一方で、2025-11-25 版の Authorization 仕様に対応している MCP クライアントであれば、MCP サーバーの URL を指定してそのまま接続できるはずです。

ここでは MCP クライアントとして Claude Desktop のカスタムコネクタを使用し、DB Tools MCP サーバーへ接続してみます。

https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp

事前準備として、OAuth クライアントの `redirect_uri` に以下を登録しておきます。

```text
https://claude.ai/api/mcp/auth_callback
```

設定手順は以下の通りです。

- Claude の **Customize > Connectors** を開き、`+` から **Add custom connector** を選択

![[Pasted image 20260613182044.png]]

- Remote MCP Server URL を入力
- 事前登録した **OAuth Client ID** と、必要に応じて **OAuth Client Secret** を入力し、**Add** を選択

![[Pasted image 20260613182253.png]]

コネクタ一覧から **Connect** をクリックするとブラウザが開き、Claude 側の認可画面と Identity Domains のログイン画面に遷移します。画面の指示に従って認証を完了します。

![[Pasted image 20260613180145.png]]

DB Tools MCP サーバーで作成したツールが正しく認識されていることを確認します。

![[Pasted image 20260613180248.png]]

コネクタを使用する際は、会話画面の `+` > **Connectors** から、その会話で有効化します。

![[Pasted image 20260613182500.png]]

これで、Claude Desktop から DB Tools MCP サーバーへ OAuth ベースで接続できることを確認できました。
