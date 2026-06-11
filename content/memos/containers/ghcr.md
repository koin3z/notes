---
title: GHCR
date: 2026-03-29
update: 2026-03-29
draft: false
tags:
  - Container
  - Docker
  - GitHub
aliases:
  - memos/ghcr
description: GitHub Container Registry にログインし、コンテナイメージをタグ付けして push する手順。
---
GitHubでコンテナイメージを管理する

- まずはログイン
```shell
❯ docker login ghcr.io
Username: koin3z
Password: 

WARNING! Your credentials are stored unencrypted in '/home/koin3z/.docker/config.json'.
Configure a credential helper to remove this warning. See
https://docs.docker.com/go/credential-store/

Login Succeeded
```

- Password（PAT）の生成は以下を参考
	- https://qiita.com/Jazuma/items/aca397e081a7825d0dec#1-personal-access-tokenpat%E3%82%92%E7%99%BA%E8%A1%8C%E3%81%99%E3%82%8B

## イメージのプッシュ
- タグ付けする
```
docker tag <image>:<tag> ghcr.io/<user>/<image>:<tag>
```

- Pushする
```
docker push ghcr.io/<user>/<image>:<tag>
``` 
