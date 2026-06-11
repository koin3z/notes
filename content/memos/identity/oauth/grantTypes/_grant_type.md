---
title: OAuth グラントタイプ
date: 2025-11-20
update: 2025-11-20
draft: false
tags:
  - OAuth
  - Grant Type
description: OAuth 2.0 の主要グラントタイプと認可/トークンリクエストを整理する。
---

### 認可リクエスト

```http
GET https://auth.server.com/authorize
	?client_id=r4y78fhusfrhs7i4
	&response_type=code
	&scope=openid+email
	&state=frji48H8f4i*h
	&redirect_uri=https%3A%2F%2Foauth.client.com%2Fcallback
	&code_challenge=jirsojgirsjfr
	&code_challenge_method=2389
	HTTP/1.1
```


### トークンリクエスト

```http
POST https://auth.server.com/token
Content-type: application/x-www-form-urlencoded

client_id=jgriojifrs
&grant_type=authorization_code
&code=
&redirect_uri=
&code_verifier
```


## 参照リンク
- 
