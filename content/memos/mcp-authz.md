---
title: MCP Authorization
date: 2025-12-10
update: 2025-12-10
draft: false
tags:
  - 
aliases:
  - 
description: MCP認可について
---
## 概要
- MCPにおいて，認証の実装はオプション
- サポートする場合
	- HTTP Transport に準拠する必要がある（**SHOULD**）
	- 一方，STDIO Transport を使用する場合はこの仕様に従わない（**SHOULD NOT**）
	- 代替のTransportを仕様する場合は，そのプロトコルのベストプラクティスに従う（**MUST**）

- 参照する標準は以下の通り
	- <u>OAuth 2.1 IETF DRAFT</u> ([draft-ietf-oauth-v2-1-13](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-13))
		- 認可サーバーはOAuth2.1を実装する必要がある（**MUST**）
	- <u>OAuth 2.0 Authorization Server Metadata </u>([RFC8414](https://datatracker.ietf.org/doc/html/rfc8414))
		- 認可サーバーはこれか [OpenID Connect Discovery 1.0](https://openid.net/specs/openid-connect-discovery-1_0.html) の検出メカニズムを最低1つは提供する必要がある（**MUST**）
		- また，MCPクライアントは認可サーバーの情報を取得するため，上記2つの検出メカニズムをサポートする必要がある（MUST）
	- <u>OAuth 2.0 Dynamic Client Registration Protocol</u> ([RFC7591](https://datatracker.ietf.org/doc/html/rfc7591))
		- MCPサーバーは動的クライアント登録をサポートする場合がある（**MAY**）
	- <u>OAuth 2.0 Protected Resource Metadata</u> ([RFC9728](https://datatracker.ietf.org/doc/html/rfc9728))
		- MCPサーバーは実装する必要がある（**MUST**）
	- <u>OAuth Client ID Metadata Documents</u> ([draft-ietf-oauth-client-id-metadata-document-00](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-client-id-metadata-document-00))
		- 認可サーバーとMCPクライアントはOAuth Client ID Metadataをサポートする必要がある（**SHOULD**）
## 登場人物

- MCPサーバー
	- OAuth リソースサーバーとして機能
	- アクセストークンを利用し，保護されたリソースへのリソースを受け付ける
- MCPクライアント
	- OAuth クライアントとして機能
	- リソースオーナーに変わってリクエストを行う
- 認可サーバー
	- MCPサーバーにて使用するアクセストークンを発行

## 認可フロー
### 概要
- フロー全体としては以下のステップで進行する

#### ステップ１「認可サーバーのディスカバリ」
- MCPクライアントは，アクセスしたいMCPサーバーがどの認可サーバーを使用しているかを知る必要がある
- この発見フローには以下の2つの方法があり，クライアントは両方サポートする必要がある（**MUST**: [RFC9728 - OAuth 2.0 Protected Resource Metadata ](https://datatracker.ietf.org/doc/html/rfc9728)）
	- なお，MCPクライアントはまずはヘッダーを確認し，それがなければWell-Know URIにフォールバックする

1. `WWW-Authenticateヘッダー`
	- クライアントが認証なしでリクエストを送った場合，サーバーは401を返却し，ヘッダー内の`resource_metadata`にてメタデータのURLを含める
```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer resource_metadata="https://mcp.example.com/.well-known/oauth-protected-resource",scope="files:read"
```

- なお，MCPサーバーはこのとき，リソースのアクセスに必要なスコープをヘッダーに含めるべき（**SHOULD**）
	- 過剰なスコープ要求を防ぐため
	- このとき，含まれるスコープは`scopes_supported`に含まれていない場合がある（Subset, Superset, Alternativeのどれか）
	- ここに記載されるスコープは"絶対に正式なもの"として扱い（**MUST**），MCPクライアントは勝手にこのスコープを間違いだと判断してはいけない
- `scope`パラメータがない場合は，スコープ選択のストラテジーにて定義される動作にフォールバックする

2. `Well-Known URI`
	- どちらかが使用できる
		- MCPサーバーがサブディレクトリで動作する場合
			- MCPサーバー: `https://example.com/public/mcp`
			- メタデータ: `https://example.com/.well-known/oauth-protected-resource/public/mcp`
			- 1つのドメインの中に異なるMCPサーバーがある場合でもそれぞれ別の設定ファイルをもてるようにしている
		- MCPサーバーがルートで動作する場合
			- メタデータ: `.well-known/oauth-protected-resource`


- クライアント・メタデータ・レスポンスのサンプル
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
	"resource":
		"https://resource.example.com",
	"authorization_servers":
		["https://as1.example.com",
		 "https://as2.example.net"],
	"bearer_methods_supported":
		["header", "body"],
	"scopes_supported":
		["profile", "email", "phone"],
	"resource_documentation":
		"https://resource.example.com/resource_documentation.html"
}
```

- このメタデータのレスポンスには最低でも1つの認可サーバーのフィールド`authorization_servers`が含まれている必要がある（**MUST**）

#### ステップ２「認可サーバーのメタデータ取得」
- MCPクライアントは認可サーバーと対話する前にOAuthクライアントとして登録する/されている必要がある
- が，そもそもその前に認可サーバーの情報（メタデータ）を取得する必要がある
- この認可サーバーのメタデータの取得方法としてはいくつかの方法があり，以下の優先度で順に行う必要がある（**MUST**）
	- なお，エンドポイントは先程の`authorization_servers`をにパスが含まれるかで分かれる

- パスが含まれる場合
	1. OAuth 2.0 認可サーバー メタデータ
		- `https://auth.example.com/.well-known/oauth-authorization-server/tenant1` 
	2. OpenID Connect Discovery 1.0
		- `https://auth.example.com/.well-known/openid-configuration/tenant1`
	3. OpenID Connect Discovery パスの追加
		- `https://auth.example.com/tenant1/.well-known/openid-configuration`

- パスが含まれない場合
	1. OAuth 2.0 認可サーバー メタデータ
		- `https://auth.example.com/.well-known/oauth-authorization-server`
	2. OpenID Connect Discovery 1.0
		- `https://auth.example.com/.well-known/openid-configuration`

- 認可サーバーが次の「クライアント登録」で使用する方式「Client ID Metadata Documents」をサポートしているかは，認可サーバーのメタデータに以下のクレームを入れることでアドバタイズする
```json
{
  "client_id_metadata_document_supported": true
}
```
- MCPクライアントはこの機能をチェックする必要があり（**MUST**），利用できない場合は静的または動的クライアント登録にフォールバックする

#### ステップ３「クライアント登録」
- そして，MCPクライアントは認可サーバーの位置を把握したが，対話する前にOAuthクライアントとして登録する/されている必要がある
- このクライアントの登録方法として3つの方法があり，シナリオに応じていづれかを選択する
	- なお，すべての方法をサポートする場合は以下の優先度に従う
1. 静的クライアント登録
	- 事前に登録しておき，そのクライアント情報を使用する
2. Client ID Metadata Documents（**SHOULD**: [draft-ietf-oauth-client-id-metadata-document-00](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-client-id-metadata-document-00)）
	- 事前設定がない場合，最も一般的な方法
	- クライアントは自身のメタデータ（名前，リダイレクトURIなど）を指すHTTPS URLを`client_id`として使用する
		- URLはクラリアントメタデータを含むJSONオブジェクトを指す
	- 認可サーバーがサポートしているかどうかは，メタデータの `client_id_metadata_document_supported`を参照する
3. 動的クライアント登録（**MAY**: [RFC 7591 - OAuth 2.0 Dynamic Client Registration Protocol](https://datatracker.ietf.org/doc/html/rfc7591)）
	- 下位互換性または特定の要件用
	- 認可サーバーがサポートしているかどうかは，メタデータの`registration_endpoint`を参照する
4. どれも利用できない場合は，ユーザーにクライアント情報の入力を促す

> [!NOTE]
> なお，FastMCPのOIDC Proxyを使うことで，動的クライアント登録を標準でサポートしていないOIDCプロバイダーとの認証が可能になる
> https://gofastmcp.com/servers/auth/oidc-proxy
> 

- Client ID Metadata Documentsをサポートする場合，MCPサーバーと認可サーバーはそれぞれ以下の要件に従う必要がある（**MUST**）

- <u>MCPクライアント</u>
	- HTTPS URLでメタデータはホストする（MUST）
	- `client_id`として使うURIはHTTPSを使用し，パスを含む必要がある（**MUST**）
		- 例: `https://example.com/client.json`
	- MCPクライアントはメタデータの値とドキュメントのURLの正確な一致を確認する必要がある（**MUST**）
	- セキュアなクライアント認証が必要な場合は，`private_key_jwt`を使用する
```json
{
  "client_id": "https://app.example.com/oauth/client-metadata.json",
  "client_name": "Example MCP Client",
  "client_uri": "https://app.example.com",
  "logo_uri": "https://app.example.com/logo.png",
  "redirect_uris": [
    "http://127.0.0.1:3000/callback",
    "http://localhost:3000/callback"
  ],
  "grant_types": ["authorization_code"],
  "response_types": ["code"],
  "token_endpoint_auth_method": "none"
}
```

- <u>認可サーバー</u>
	- 

#### ステップ４「スコープの選択と要求」
- クライアントは「最小権限の原則」に従い，必要な分のスコープを要求する
- 最初の401レスポンスに`scope`パラメータが含まれている場合はそれを使用する
- 含まれていない場合，メタデータドキュメント内の`scopes_supported`から使用する
	- `scopes_supported`が未定義の場合は`scope`パラメータは省略する
- `scopes_supported`は基本機能に必要な最小限のスコープセットを使用させることを目的とする
	- 足りない場合は，後述するステップアップ認可フローの手順にて，スコープを追加で獲得していく

#### ステップ５「認可リクエスト＆トークンリクエスト」
- クライアントは認可サーバーに対してトークンを要求する
- セキュリティのため，以下の要素は必須
	- [RFC7 636 - PKCE](https://datatracker.ietf.org/doc/html/rfc7636)
		- S256 challengeを使用する
		- 認可サーバーがPKCEに対応しているかを確認する手段がOAuth2.1及びPKCEの仕様では定義されていないので，認可サーバーのメタデータをつかって検証する必要がある（**MUST**）
			- `code_challenge_methods_supported`が存在しない場合，MCPクライアントは続行を拒否する（**MUST**）
			- OIDC ディスカバリエンドポイントでは，上のパラメータが定義されていないが，一般的なOIDCプロバイダーはこのパラメータを含んでいる（?!）。同様に`code_challenge_methods_supported`が存在しない場合，MCPクライアントは続行を拒否する（**MUST**）
				- そのため，OIDC ディスカバリエンドポイントを提供する認可サーバーは，MCPの互換性のため，`code_challenge_methods_supported`を含める必要がある
	- [RFC 8707 - Resource Indicators for OAuth 2.0](https://datatracker.ietf.org/doc/html/rfc8707)
		- トークンを使用する対象のMCPサーバーのURIを明示的に指定する必要がある（**MUST**）
			- トークンが意図しないサーバーで悪用されるのを防ぐため
		- これは認可リクエストとトークンリクエストの両方に含める（**MUST**）
		- [RFC 8707 セクション 2](https://www.rfc-editor.org/rfc/rfc8707.html#name-access-token-request)で示される，MCPサーバーの正規URIを使用する必要がある（**MUST**）
			- https://modelcontextprotocol.io/specification/draft/basic/authorization#canonical-server-uri
			- スキームがなかったり，URLフラグメントを含むURIは無効
			- 末尾のスラッシュの有無はどちらも技術的には有効なURIだが，相互運用性のためスラッシュはなしを使用するべき（**SHOULD**）
				- ○: https://mcp.example.com
				- ✗: https://mcp.example.com/
		- MCPクライアントは認可サーバーがサポートしているかにかかわらず，このパラメータは確認する必要がある（**MUST**）

- 認可リクエストのサンプル（認可コード）
	- リソース所有者の連絡先とカレンダーデータへのアクセスを要求している
```http
GET /as/authorization.oauth2?response_type=code
	&client_id=s6BhdRkqt3
	&state=tNwzQ87pC6llebpmac_IDeeq-mCR2wLDYljHUZUAWuI
	&redirect_uri=https%3A%2F%2Fclient.example.org%2Fcb
	&scope=calendar%20contacts
	&resource=https%3A%2F%2Fcal.example.com%2F
	&resource=https%3A%2F%2Fcontacts.example.com%2F HTTP/1.1
Host: authorization-server.example.com
```

- トークンリクエストのサンプル（認可コード）
```http
POST /as/token.oauth2 HTTP/1.1
Host: authorization-server.example.com
Authorization: Basic czZCaGRSa3F0Mzpoc3FFelFsVW9IQUU5cHg0RlNyNHlJ
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code &redirect_uri=https%3A%2F%2Fclient.example.org%2Fcb &code=10esc29BWC2qZB0acc9v8zAv9ltc2pko105tQauZ &resource=https%3A%2F%2Fcal.example.com%2F
```
#### ステップ５「アクセストークンの使用」
- トークンを無事取得後，MCPクライアントはMCPサーバーへのリクエストにトークンを含める
	- トークンは`Authorization`ヘッダーに入れる

#### ステップ６「トークンの検証」
- MCPサーバーは受け取ったトークンを検証する
- トークンが有効であり，かつ`audience`が自分自身であることを確認

- 権限不足が発生した場合は「HTTP 403 Forbidden」を返却し，以下のステップアップ認可フローが行われる
	1. サーバーは`WWW-Ahthenticate`ヘッダーで`error="insufficient_scope`とともに，必要な追加スコープ`scope="XXX..."`を返す
	2. クライアントはこの情報を解析し，不足したスコープを含めて再度認可フローを開始する
	3. 新しいトークンを取得したら，元のリクエストを再試行する


## メモ
- EntraIDでは動的クライアント登録の機能実装について，ロードマップにはないと回答（2025/8/21）
	- https://learn.microsoft.com/en-us/answers/questions/5516363/does-entraid-has-a-plan-to-introduce-dynamic-clien

## 参照リンク
- https://tex2e.github.io/rfc-translater/html/rfc9728.html
- https://tex2e.github.io/rfc-translater/html/rfc7591.html
- https://tex2e.github.io/rfc-translater/html/rfc8707.html