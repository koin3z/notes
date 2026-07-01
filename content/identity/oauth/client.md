---
title: OAuthクライアント
date: 2025-09-21
modified: 2026-06-11
draft: false
tags:
  - identity/oauth
aliases:
  - memos/identity/oauth/client
description: OAuth クライアントの登録、認可リクエスト、トークン取得の処理を整理する。
---

### 事前準備

**クライアント登録**

- 事前に認可サーバーとクライアント間でいくつか情報を共有しておく必要がある

  - この共有方法については取り決めがないが，大きく分けて次の2つがある
    - 手動登録
      - アプリケーション開発者が開発者向けポータルサイトなどから申請
    - 動的登録
      - [RFC 7591「OAuth 2.0 Dynamic Client Registration Protocol」](https://datatracker.ietf.org/doc/html/rfc7591)で標準化されている自動化プロセス
      - 認可サーバーが提供する「登録用エンドポイント」に対し，クライアントの情報を送信。認可サーバーはそのリクエストを検証した後クライアントIDやクライアントシークレットを返す

- クライアント → 認可サーバー
  - クライアント名：アプリケーションの名前
  - リダイレクトURI：認可コードやトークンを送り返す際のURL
  - 利用したいスコープ
- 認可サーバー → クライアント

  - クライアントID：クライアントの識別子
  - クライアントシークレット：正当なクライアントであることを証明するクレデンシャル

- また，クライアントは認可サーバーの次の2つのエンドポイントを知っている必要がある
  - 認可エンドポイント
  - トークンエンドポイント

## やること

- "機密クライアント"で"認可コードグラント"を想定
- また，以下の構造のオブジェクトがあることを前提とする

```javascript
let client = {
  client_id: "xxxxxxxx",
  client_secret: "yyyyyyyy",
  redirect_uris: ["http://zzzzzzzz/callback"],
}
```

```javascript
let authServer = {
  authorizationEndpoint: "http://aaaaaaaa/authorize",
  tokenEndpoint: "http://aaaaaaaa/token",
}
```

```javascript
let state = randomstring.generate()
```

### 認可リクエスト

- ユーザーを認可エンドポイントにリダイレクトする
- リダイレクト先でユーザーは認証および認可委譲の承認を行う

```javascript
app.get("/authorize", function (req, res) {
  let queryParams = {
    response_type: "code",
    client_id: client.client_id,
    redirect_uri: client.redirect_uris[0],
    state: state,
  }
  let authorizeUrl = authServer.authorizationEndpoint + "?" + queryParams.toString()
  res.redirect(authorizeUrl)
})
```

**認可リクエスト**

- クエリパラメータに次のパラメータを付与する
  - `response_type`（必須）
    - 値は`code`にする（MUST）
  - `client_id`（必須）
  - `redirect_uri`（任意）
  - `scope`（任意）
  - `state`（推奨）
    - CSRF対策として用いられるべき（SHOULD）

**認可レスポンス**

- クエリパラメータに次のパラメータを付与する
  - `code`（必須）
    - 漏洩のリスクのため，認可コードは発行されてから短期間で無効にし（MUST），最大でも10分を推奨する（RECOMMENDED）。
    - クライアントは2回以上，同じ認可コードを使用してはいけない（MUST NOT）。2回以上使用された場合は，リクエストを拒否し（MUST），この認可コードを元に発行したすべてのトークンを無効にするべき（SHOULD）。
    - 認可コードはクライアントIDとリダイレクトURIに紐づく
  - `state`
    - 認可リクエストに`state`が含まれていた場合は必須
    - クライアントから受け取った値をそのまま返す
- 認可レスポンスをユーザーエージェントに返し，リダイレクト（302）経由でクライアントの`redirect_uri`に返却する
- クライアントは認識できないレスポンスパラメータは無視しなくてはいけない（MUST）

### 認可コードからアクセストークンへの変換

- 承認ページにて処理が終わると，ユーザーはクライアントの`redirect_uri`に戻される。

```javascript
app.get("/callback", function (req, res) {
  if (req.query.state != state) {
    console.log("error: State value did not match")
    return
  }

  let code = req.query.code

  let form_data = qs.stringify({
    grant_type: "authorization_code",
    code: code,
    redirect_uri: client.redirect_uris[0],
  })
  let headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    Authorization: "Basic " + encodeClientCredentials(client.client_id, client.client_secret),
  }

  let tokRes = request("POST", authServer.tokenEndpoint, {
    body: form_data,
    headers: headers,
  })

  let body = JSON.parse(tokRes.getBody())
  access_token = body.access_token
})
```

**アクセストークンリクエスト**

- 次のパラメータをUTF-8でエンコードし，`application/x-www-form-urlencoded`でBodyに含める
  - `grant_type`（必須）
    - 値は`authorization_code`でなければならない（MUST）
  - `code`（必須）
    - 認可サーバーから受け取った認可コード
  - `redirect_uri`
    - 認可リクエストに含まれていた場合は必須となり，認可リクエストと同じ値である必要がある（MUST）
    - 認可サーバーは認可コードを発行した先の`redirect_uri`と一致しているかどうかを確認し，トークン発行可否を決定する
  - `client_id`
    - 認可サーバーによってクライアントが認証されていなければ必須
  - `state`
    - 認可サーバーは`state`を受け取ると，認可コードとともにそのまま返却する
    - クライアントは自身が送信した`state`と一致するかどうかを調べることで，自身のリクエストに対してのレスポンスであることを確認できる
- クライアントタイプが「機密」である場合，認可サーバーによって認証される必要がある
- 認可サーバーは以下に従う（MUST）
  - 機密クライアントである場合，クライアントに認証を要求する
  - 機密クライアントである場合，認証されたクライアントに対して認可コードが確かに発行されたことを確認する
  - パブリッククライアントの場合，指定された`client_id` に対して認可コードが確かに発行されていることを確認する
  - 認可コードが正当であることを検証する
  - 認可リクエストに`redirect_uri`が含まれていた場合，同じ値であることを確認する

**アクセストークンレスポンス**

- アクセストークンリクエストが正当かつ認可された場合，アクセストークンおよび任意でリフレッシュトークンを発行する
  - https://openid-foundation-japan.github.io/rfc6749.ja.html#token-response

### アクセストークンを使用する

- 「Bearer Token Usage」の仕様ではトークンの送信場所として次の3つがある
  - Authorizationヘッダー
  - `x-www-form-urlencoded`されたリクエストボディパラメータ
  - URLエンコードされたクエリパラメータ
- 仕様では可能な限り，Authorizationヘッダーを使うことを推奨

```javascript
app.get('/fetch_resources', function(req, res),
	function(req, res) {
		if (!access_token) {
			console.log('error: Missing access token');
			return;
		}
	}

	let protectedResource = 'http://cccccccc/resource';
	let headers = {
		'Authorization': 'Bearer ' + access_token
	}
	let resource = request('POST', protectedResource, {headers: headers})
);
```

### アクセストークンのリフレッシュ

```javascript
if (resource.statusCode >= 200 && resource.statusCode < 300) {
  return
} else {
  access_token = null
  if (refresh_token) {
    refreshAccessToken(req, res)
    return
  } else {
    console.log("error")
    return
  }
}
```

**アクセストークンの更新**

- UTF-8エンコードされた次のパラメータが，`application/x-www-form-urlencoded`形式でBodyに入る
  - `grant_type`（必須）
    - `refresh_token`がセットされる（MUST）
  - `refresh_token`（必須）
  - `scope`（任意）
