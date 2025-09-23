---
title: リソースサーバー
tags:
  - 認証
publish: "true"
---
## 概要

- リソースサーバーは「アクセストークン」「スコープ」を解釈し，レスポンスを行う
- これは言い換えると，トークンが有効であれ無効であれ「最終的なレスポンスの形を最終決定する権限」をもっていると言える
	- それに付随し，時間帯による制限やリクエスト内容によるアクセス可否の決定，外部のポリシーエンジンなどと組み合わせるなど，独自のルールを適用することもできる


## やること
### Tokenを取り出す
```javascript
let getAccessToken = function(req, res, next) {
	let inToken = null;
	let auth = req.headers['authorization'];
	
	if (auth && auth.toLowerCase().indexOf('bearer') == 0) {
		inToken = auth.slice('bearer '.length)
	} else if (req.body && req.body.access_token) {
		inToken = req.body.access_token;
	} else if (req.query && req.query.access_token) {
		inToken = req.query.access_token;
	}
};
```

### Tokenを検証する
```javascript
/*  inTokenを直接解析するかインストロペクトするか，何かしらの方法でaccess_tokenを取得する 
 *  この例ではaccess_tokenは以下のJSON形式としている
 *  ```
 *  {
 * 	   "access_token": "xxxxxxxxxxxxxxx",
 *     "clientId": "aaaaaaaaaaaa",
 *	   "scope": ["foo"]
 *  }
 *  ``` 
 */

if (token.access_token == inToken){
	return token;
}

if (token) {
	console.log("Found a matching token: %s", inToken);
} else {
	console.log("No matching token");
}
req.access_token = token;
next();
}
```

- この関数の使用どころとして次の2つの選択肢がある
	1. トークンを検証する必要があるリクエストのみ
		- 特定のエンドポイント（またはルート）のみを保護
	2. すべてのリクエスト
		- アプリケーションに届くすべてのリクエストに対して検証


> [!abstruct] 認可サーバー間でのトークン理解について
> トークンの状態を理解する方法として次のような選択肢が挙げられる
> 1. 認可サーバーとDBを共有する
> 2. 認可サーバーが提供する「トークンインストロペクション」機能を使用する
> 	- メリット：認可サーバー側でトークンを即座に無効にできる
> 	- デメリット：リクエストのたびに認可サーバーへのトラフィックが発生するため，遅延が生まれる
> 3. トークン自体が情報を含み，リソースサーバーが直接解析できる形式を使用する
> 	- 形式としてはJWTがある
> 	- メリット：認可サーバーの問い合わせが不要になるため，高速でスケーラブルになる
> 	- デメリット：一度発行すると，有効期限が切れるまで基本的に無効化できない。
> 		- この対策としては次のようなものがある
> 			- 「有効なトークンIDリスト」の利用（後述）
> 			- トークンの有効期限を極端に短くし，代わりにリフレッシュトークンを別に発行しておく。無効化するためにはリフレッシュトークンを無効化する

> [!abstruct] 認可サーバー内でのトークン格納方法について
> トークンをそのまま格納することもできるが，その他に次のような方法がある
> 1. トークンのハッシュ値
> 	- ハッシュ値を比較して，一致するかを調べる
> 2. トークンに一意の識別子を付与し，その識別子のみを保存する
> 	- トークンには，識別子を加えたものをサーバーが持つ秘密鍵で署名
> 	- トークンの署名を検証し，トークンを解析し識別子を取得。その識別子でデータベースを検索する
> 		- `"jwi": "uuid-12345"`
> 		- 認可サーバーは識別子をデータベースから削除することでそのトークンを無効化することができる
> 	- リソースサーバーは以下のステップで検証を行う
> 		1.  JWTの署名が正しいか，有効期限が切れていないかを手元で確認
> 		2. 識別子が認可サーバーの「有効なトークンIDリスト」に存在するかを確認（キャッシュで高速化できる）


### トークンによる処理分け
- トークンが必要である処理に対して，トークンの存在を確認し，存在していれば次のハンドラに処理を移す

```javascript
let requireAccessToken = function (req, res, next) {
	if (req.access_token) {
		next();
	} else {
		res.status(401).end();
	}
};
```

- その後，アクセス権に応じて様々な処理を決定する

**スコープに応じて異なるアクセス可否を決定する場合**

```javascript
app.get('/resources', 
	function(req, res) {
	...
	}
);

app.post('/resources', getAccessToken, requireAccessToken,
	function(req, res) {
		if (__.contains(req.access_token.scope, 'write')) {
		...
		} else {
			res.set('WWW-Authenticate',\
				'Bearer realm=localhost:9002,\
				 error="insufficient_scope",\
				 scope="read"'')
			res.status(403).end();
		}
	}
);
```

- `WWW-Authenticate`ヘッダーに認証・認可に関するエラーの詳細を含めるべき，とOAuth2.0の仕様では定められている。

> 保護リソースへのリクエストが, 認証クレデンシャルを含んでいない, または保護リソースへアクセスすることができるアクセストークンを含んでいない場合, リソースサーバはHTTP WWW-Authenticate レスポンスヘッダフィールドを含めなければならない (MUST). 同様に, その他の条件下でもリソースサーバはそれをレスポンスに含めてよい (MAY). WWW-Authenticate ヘッダフィールドはHTTP/1.1 [[RFC2617]](https://openid-foundation-japan.github.io/rfc6750.ja.html#RFC2617) で定義されているフレームワークを使用する.
https://openid-foundation-japan.github.io/rfc6750.ja.html#authn-header

**スコープに応じて異なる結果を返す場合**

```javascript
app.get('/resources', getAccessToken, requireAccessToken,
	function (req, res) {
		if (!__.contains(req.access_token.scope, 'profile')) {
			return res.status(403).end();
		}
		const userProfile = {
			id: req.access_token.clientId,
			name: "Alice"
		};
		if (__.contains(req.access_token.scope, 'email')) {
			userProfile.email = "alice@example.com";
		}
	}
);
```

**異なるユーザーに応じて異なる結果を返す場合**

- 以下の例では，`access_token`の`user`フィールドにリソースオーナーの名前があるとしている。

```javascript
app.get('/resources', getAccessToken, requireAccessToken, 
	function(req, res) {
		if (req.access_token.user == 'alice') {
			res.json({user: 'Alice', address: 'xxxxxx'});
		} else if (req.access_token.user == 'bob') {
			res.json({user: 'bob', address: 'yyyyyy'})
		} else {
			let unknown = {user: 'Unknown', address: 'Unknown'};
			res.json(unknown);
		}
	}
);
```

- ユーザー名などリソースオーナー情報の取得
	- JWTのような自己完結型の場合，トークンのペイロードにあるのでそこから取る（`sub`など）
	- トークンがランダム文字列のような不透明なトークンの場合，トークンインストロペクションを行い，認可情報を認可サーバーから取得する

- OAuthクライアントは個人情報を直接扱う必要がないため，クライアント側のセキュリティリスクが低減される。
- その一方で，上の例のように，名前やメールアドレスなど個人情報を扱うクライアントの場合は，認証プロトコル（OIDC）と合わせて使うべきである。
