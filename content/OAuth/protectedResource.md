---
title: 保護対象リソース
tags:
  - 認証
publish: "true"
---

## ToDo
- Tokenを取り出す
```javascript
let getAccessToken = function(req, res, next) {
	let inToken = nulll;
	let auth.headers['authorization'];
	
	if (auth && auth.toLowerCase().indexOf('bearer') == 0) {
		inToken == auth.slice('beaer '.length)
	} else if (req.body && req.body.access_token) {
		inToken = req.body.access_token;
	} else if (req.query && req.query.access_token) {
		inToken = req.query.access_token;
	}
};
```

- Tokenを検証する
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

- リクエストに対して認可を行う
```javascript

```
