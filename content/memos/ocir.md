---
title: OCIR
date: 2025-12-28
update: 2025-12-28
draft: false
tags:
  - 
aliases:
  - 
description: OCI コンテナレジストリ
---
ocirのレジストリURLは以下の形式
```
<registry-domain>/<tenancy-namespace>/<repo-name>:<version
```

その中で，`<registry-domain>`は以下の形式が推奨されている。（他にもいくつか形式があるので注意）
```
ocir.<region-identifier>.oci.oraclecloud.com
```

例えば，アッシュバーンの場合，以下のようになる
```
ocir.us-ashburn-1.oci.oraclecloud.com/<namaspace>/<ocir-repo-iad-dev>/test:latest
```


## IAM Policy
使用する場合は，権限を付与しておく
https://docs.oracle.com/ja-jp/iaas/Content/Registry/Concepts/registrypolicyrepoaccess.htm

また，事前に認証トークンを生成しておく。
![[Pasted image 20251228214001.png]]

## Loginする
```
→ docker login ocir.us-ashburn-1.oci.oraclecloud.com
Username: <namaspace>/<identity domain>/<username>
Password: <先程取得した認証トークン>

WARNING! Your credentials are stored unencrypted in '/home/koin3z/.docker/config.json'.
Configure a credential helper to remove this warning. See
https://docs.docker.com/go/credential-store/
```

記載にある通り，`~/.docker/config.json`にログイン情報が保存される

## Push
tagをフルパスに変換する
```
docker tag <repo>:<rag> <registry-domain>/<tenancy-namespace>/<repo-name>:<version>
```

Pushする
```
docker push <registry-domain>/<tenancy-namespace>/<repo-name>:<version>
```

例
```
→ docker push ocir.us-ashburn-1.oci.oraclecloud.com/xxxxxxxxx/ocir-iad-jupyterlab:v1.0
The push refers to repository [ocir.us-ashburn-1.oci.oraclecloud.com/xxxxxxxxx/ocir-iad-jupyterlab]
1272e4f056ad: Pushed 
7d230e37adbc: Pushed 
ccd7ffd0cc2b: Pushed 
4d7c3b3e69ba: Pushed 
631a84bae701: Pushed 
742b5304df6e: Pushed 
v1.0: digest: sha256:268c14610e322f07f001fbc4a0400b63684c4206a8bd1cc3fc547f73214831ec size: 1582
```
## Pull
```
docker pull ocir.us-ashburn-1.oci.oraclecloud.com/xxxxxxxxx/ocir-iad-jupyterlab:v1.0
```

例
```
→ docker pull ocir.us-ashburn-1.oci.oraclecloud.com/xxxxxxxxx/ocir-iad-jupyterlab:v1.0
v1.0: Pulling from xxxxxxxxx/ocir-iad-jupyterlab
ec07bd474c56: Already exists 
7bf6e8047453: Already exists 
faa8861819f0: Already exists 
913c05e4a1c0: Already exists 
becdbfcb9e87: Already exists 
6922befd02d1: Already exists 
Digest: sha256:268c14610e322f07f001fbc4a0400b63684c4206a8bd1cc3fc547f73214831ec
Status: Downloaded newer image for ocir.us-ashburn-1.oci.oraclecloud.com/xxxxxxxxx/ocir-iad-jupyterlab:v1.0
ocir.us-ashburn-1.oci.oraclecloud.com/xxxxxxxxx/ocir-iad-jupyterlab:v1.0
```

## 参照リンク
- https://docs.oracle.com/ja-jp/iaas/Content/Registry/Concepts/registryconcepts.htm
- https://zenn.dev/hiroki1928/articles/a06442e65b497c
