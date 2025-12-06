---
title: Device Authorization Grant
date: 2025-12-06
update: 2025-12-06
draft: false
tags:
  - 
aliases:
  - 
description: このページの内容についての簡単な説明
---



|            |                                                |
| ---------- | ---------------------------------------------- |
| grant_type | `urn:ietf:params:oauth:grant-type:device_code` |


## フロー

```mermaid
sequenceDiagram
    autonumber
    participant Device as Device Client<br>(スマートTV/IoT/CLI)
    participant AS as Authorization Server<br>(認可サーバー)
    participant User as User<br>(ユーザー)
    participant Browser as Secondary Device<br>(スマホ/PCのブラウザ)

    Note over Device, AS: 【1. 認可の開始】
    Device->>AS: 1. デバイス認可リクエスト<br>(client_id)
    AS->>Device: 2. デバイス認可レスポンス<br>(device_code, user_code, verification_uri)

    Note over Device, User: 【2. ユーザーへの指示】
    Device->>User: 3. 画面にURLとユーザーコードを表示<br>「スマホで {verification_uri} にアクセスし、<br>コード {user_code} を入力してください」

    Note over Device, AS: 【3. ポーリング & ユーザー認証】
    par デバイス側の処理
        loop ユーザーの許可待ち (ポーリング)
            Device->>AS: 4. トークンリクエスト<br>(grant_type=...device_code, client_id)
            AS-->>Device: 5. エラー: authorization_pending<br>(まだ許可されていない)
        end
    and ユーザー側の処理
        User->>Browser: 6. 指定URLへアクセス
        Browser->>AS: 7. ユーザーコード入力
        AS->>Browser: 8. 同意画面表示
        Browser->>AS: 9. 同意(Approve)
    end

    Note over Device, AS: 【4. トークン取得】
    Device->>AS: 10. トークンリクエスト (ポーリング継続)
    Note right of AS: ユーザーの同意を確認完了
    AS->>Device: 11. アクセストークン & リフレッシュトークン発行
```


## 参照リンク
- https://qiita.com/TakahikoKawasaki/items/78eff94cef92741131f0
- https://tex2e.github.io/rfc-translater/html/rfc8628.html
- 