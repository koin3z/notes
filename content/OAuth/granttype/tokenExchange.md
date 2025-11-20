---
title: Token Exchange
---
## 用語
- **STS (Security Token Service)**
    - 提供されたトークンを検証し、それに応じて新しいセキュリティトークンを発行するサービス
    - OAuth 2.0 Token Exchange拡張では、認可サーバーがSTSとして動作し、異なるトークンタイプや権限セットを安全に交換する仕組みを提供する

## 背景
- WS-Trustによるトークン交換
    - もともとSOAP/XMLを利用したプロトコルで、Webサービス環境では広く使われてきた。
    - しかし、SOAPの重厚さとXMLメッセージの冗長さは、近年の軽量なREST/JSONベース開発トレンドには不向き。
- OAuth 2.0の普及とその制約
    - 従来のOAuth2.0ではアクセストークンでは、リソースオーナーの承認の表現（認可コード）との交換が含まれている
    - これは実際に非常に有用なパターンだが、入力と出力をそのままセキュリティトークン交換フレームワークに対応させるには、そのままではやや制約が多い
    - つまり、「リソース所有者の認可コード ↔ アクセストークン」の交換に特化しており、汎用的なトークン交換プロトコルとしては機能が限られるということ。

## 概要
- この仕様（RFC 8693）では、クライアントがSTSの役割を果たす認可サーバーに、セキュリティトークンをリクエストして取得できるようにするOAuth2.0の拡張プロトコルを定義している
- ここで定義されるSTSプロトコル自体はRESTfulではないが、RESTfulに慣れている開発者に馴染みのあるパターンとデータ形式を利用している
    - 標準的なHTTPクライアントとJSONパーサーだけで利用が可能

- この仕様（RFC 8693）では、**トークン交換要求のための新しい付与タイプと、トークンエンドポイントがその要求に応えるためのパラメータが定義されている**
    - Token Exchange Responseは、トークンエンドポイントからの通常のOAuthレスポンスであり、クライアントに情報を提供するための数個のパラメータがある
    - 委任セマンティクスを表現できるJWTクレームが新たに数個定義されている
    - トークン自体の構文やセマンティクス、セキュリティ特性は範囲外

## リクエスト

- 付与拡張タイプを使用し、認可サーバーのトークンエンドポイントにトークン要求を行う
- クライアント認証はOAuth2.0の通常のメカニズムを使用

- メソッドはPOSTを使用

| ヘッダー      |    値                         |
| ------------ | ----------------------------- |
| Content-Type | `application/x-www-form-urlencoded` |

|リクエストパラメータ|必須可否|説明|
|---|---|---|
|grant_type|==REQUIRED==|`urn:ietf:params:oauth:grant-type:token-exchange`|
|resource|OPTIONAL|クライアントが要求したセキュリティトークンを使用する対象となるサービスまたはリソースを示すURI。  <br>このリクエストパラメーターは複数回指定してもよい。  <br>クライアントはトークンを使用する対象サービスURIのみを知っている|
|audience|OPTIONAL|クライアントが要求したセキュリティ トークンを使用する対象サービスの論理名。  <br>新しく発行されるトークンの対象。このリクエストパラメーターも複数回指定してもよいが、認可サーバー内で一意である必要がある  <br>例として次のようなものが挙げられる。  <br>- OAuth client identifier  <br>- SAML entity identifier  <br>- OpenID Connect Issuer Identifier|
|scope|OPTIONAL|新しく発行されるトークンに結び付けられるスコープ群の名前をスペース区切りで並べたもの。|
|requested_token_type|OPTIONAL|クライアントが希望する、新しく発行されるトークンのトークンタイプ。登録されているトークンタイプ識別子が定義されている。  <br>指定されていない場合、発行されるトークンの種類は認可サーバーの裁量に委ねられる。|
|subject_token|==REQUIRED==|リクエストの送信元となる当事者の身元を表すセキュリティトークン。  <br>通常、このトークンのサブジェクトは、このリクエストへのレスポンスとして発行されるセキュリティトークンのサブジェクトと同じになる|
|subject_token_type|==REQUIRED==|サブジェクトトークンのトークンタイプ。登録されているトークンタイプ識別子が定義されている。（以下後述）|
|actor_token|OPTIONAL|要求されたセキュリティトークンをサブジェクトに変わって使用する、当事者の身元を表すセキュリティトークン。|
|actor_token_type|OPTIONAL|アクタートークンのトークンタイプ。登録されているトークンタイプ識別子のいずれか。actor_tokenフィールドがあれば**必須**。なければ**含めてはいけない。**|


### トークン・タイプ

- トークン交換フローにおいて、提示するトークンは以下の２種類がある
    - **サブジェクトトークン (Subject Token)** （Required）
        - リクエストの当事者のアイデンティティを表すもの
    - **アクタートークン (Actor Token)** （Option）
        - 代行者のアイデンティティを表すもの

仕様として定義されているのは以下のトークン識別子

- `urn:ietf:params:oauth:token-type:access_token`
    - 認可サーバーによって発行されたOAuthアクセストークンであることを示す
- `urn:ietf:params:oauth:token-type:refresh_token`
    - 認可サーバーによって発行されたOAuthリフレッシュトークンであることを示す
- `urn:ietf:params:oauth:token-type:id_token`
    - IDトークンであるとを示す
- `urn:ietf:params:oauth:token-type:saml1`
    - base64urlエンコードされたSAML1.1アサーションであることを示す
- `urn:ietf:params:oauth:token-type:saml2`
    - base64urlエンコードされたSAML2.0アサーションであることを示す
- `urn:ietf:params:oauth:token-type:jwt`
    - トークンがJWTであることを示す

これらのトークン識別子は以下のリンクにて登録されている
[https://www.iana.org/assignments/oauth-parameters/oauth-parameters.xhtml](https://www.iana.org/assignments/oauth-parameters/oauth-parameters.xhtml)

## レスポンス

- リクエストが有効の場合、`application/json`で各パラメータを最上位に追加したJSONを返却する
- パラメータの順序は重要ではないため、変更してもよい

| フィールド             | 必須可否                     | 説明                                                                                                                                                                                                                            |
| ----------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| access_token      | ==REQUIRED==             | トークン交換リクエストにおける応答として、認可サーバーが発行するセキュリティトークン<br>access_tokenである必要はないが、このフィールドを利用することにより、トークンエンドポイント用に定義されているOAuth2.0リクエストをそのまま使用できる                                                                                             |
| issued_token_type | ==REQUIRED==             | 発行されたセキュリティトークンを表すトークン識別子                                                                                                                                                                                                     |
| token_type        | ==REQUIRED==             | 発行されたトークンの使用方法を指定。大文字・小文字は区別しない。                                                                                                                                                                                              |
| expires_in        | RECOMMENDED              | 認可サーバーが発行するトークンの有効期間（秒単位）                                                                                                                                                                                                     |
| scope             | OPTIONAL or ==REQUIRED== | 発行されたセキュリティトークンのスコープがクライアントによって要求されたスコープと一致する場合はOptional<br>それ以外はREQUIRED                                                                                                                                                     |
| refresh_token     | OPTIONAL                 | 通常は一時的なトークン同士の交換ではリフレッシュトークンは発行されない。ただし、ユーザーが不在でもクライアントが継続的にリソースへアクセスする必要がある場合は、リフレッシュトークンが発行されることがある。<br>そのため、トークン交換付与方式（urn:ietf:params:oauth:grant-type:token-exchange）では、どの条件でリフレッシュトークンが発行されるかを明確にドキュメントとして定義・公開する必要がある。 |


## Token Exchangeの例

リソースサーバーにリクエストを送信

```bash
 GET /resource HTTP/1.1
 Host: frontend.example.com
 Authorization: Bearer accVkjcJyb4BWCxGsndESCJQbdFMogUC5PbRDqceLTC
```

リソースサーバーはトークン交換におけるクライアントの役割を担い、上記にて送信されたアクセストークンで認可サーバーに送信

```bash
 POST /as/token.oauth2 HTTP/1.1
 Host: as.example.com
 Authorization: Basic cnMwODpsb25nLXNlY3VyZS1yYW5kb20tc2VjcmV0
 Content-Type: application/x-www-form-urlencoded

 grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Atoken-exchange
 &resource=https%3A%2F%2Fbackend.example.com%2Fapi
 &subject_token=accVkjcJyb4BWCxGsndESCJQbdFMogUC5PbRDqceLTC
 &subject_token_type=
  urn%3Aietf%3Aparams%3Aoauth%3Atoken-type%3Aaccess_token
```

認可サーバーはクライアント資格情報と、上記のトークン交換付与方式でリクエストされたsubject_tokenを検証。

rsourceパラメータから、[https://backend.example.com](https://backend.example.com)のアクセスに必要なトークンを発行し、レスポンスを返す

```bash
 HTTP/1.1 200 OK
 Content-Type: application/json
 Cache-Control: no-cache, no-store

 {
  "access_token":"eyJhbGciOiJFUzI1NiIsImtpZCI6IjllciJ9.eyJhdWQiOiJo
    dHRwczovL2JhY2tlbmQuZXhhbXBsZS5jb20iLCJpc3MiOiJodHRwczovL2FzLmV
    4YW1wbGUuY29tIiwiZXhwIjoxNDQxOTE3NTkzLCJpYXQiOjE0NDE5MTc1MzMsIn
    N1YiI6ImJkY0BleGFtcGxlLmNvbSIsInNjb3BlIjoiYXBpIn0.40y3ZgQedw6rx
    f59WlwHDD9jryFOr0_Wh3CGozQBihNBhnXEQgU85AI9x3KmsPottVMLPIWvmDCM
    y5-kdXjwhw",
  "issued_token_type":
      "urn:ietf:params:oauth:token-type:access_token",
  "token_type":"Bearer",
  "expires_in":60
 }
```

リソースサーバーは新しく取得したアクセストークンを使用してバックエンドサーバーにリクエストを送信

```bash
 GET /api HTTP/1.1
 Host: backend.example.com
 Authorization: Bearer eyJhbGciOiJFUzI1NiIsImtpZCI6IjllciJ9.eyJhdWQ
    iOiJodHRwczovL2JhY2tlbmQuZXhhbXBsZS5jb20iLCJpc3MiOiJodHRwczovL2
    FzLmV4YW1wbGUuY29tIiwiZXhwIjoxNDQxOTE3NTkzLCJpYXQiOjE0NDE5MTc1M
    zMsInN1YiI6ImJkY0BleGFtcGxlLmNvbSIsInNjb3BlIjoiYXBpIn0.40y3ZgQe
    dw6rxf59WlwHDD9jryFOr0_Wh3CGozQBihNBhnXEQgU85AI9x3KmsPottVMLPIW
    vmDCMy5-kdXjwhw
```

## ## 参考リンク
[https://www.rfc-editor.org/rfc/rfc8693.html#section-2.1](https://www.rfc-editor.org/rfc/rfc8693.html#section-2.1)
[https://www.authlete.com/ja/developers/token_exchange/](https://www.authlete.com/ja/developers/token_exchange/)
[https://tex2e.github.io/rfc-translater/html/rfc8693.html](https://tex2e.github.io/rfc-translater/html/rfc8693.html)