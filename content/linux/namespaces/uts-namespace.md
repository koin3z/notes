---
title: UTS namespace
date: 2026-06-28
modified: 2026-06-28
draft: false
tags:
  - linux/namespaces
aliases:
  - UTS namespace
  - linux/namespace/uts-namespace
description: UTS namespace がホスト名と NIS ドメイン名を分離する仕組みを整理する。
---

## 概要

UTS は Unix Time-Sharing System の略である。UTS namespace は、次の2つのシステム識別子を分離する。

- ホスト名（hostname）
- NIS ドメイン名

新しい UTS namespace を作ると、作成元のホスト名と NIS ドメイン名が初期値としてコピーされる。その後の変更は同じ UTS namespace のプロセスにだけ見え、他の UTS namespace には影響しない。

```bash
$ hostname
host-a

$ sudo unshare --uts bash
# hostname container-a
# hostname
container-a
# exit

$ hostname
host-a
```

`unshare` が起動したシェルの子プロセスは、通常、そのシェルと同じ UTS namespace を継承する。

## 分離されないもの

NIS ドメイン名は DNS のドメイン名や検索ドメインとは別物である。UTS namespace は次のものを分離しない。

- DNS リゾルバの設定
- `/etc/hosts` や `/etc/resolv.conf` の内容
- IP アドレス、ルーティング、ポート

これらには Mount namespace、Network namespace、またはコンテナランタイムの設定が関係する。ホスト名を変えただけでネットワーク上の名前解決が自動的に設定されるわけではない。

## Docker との関係

Docker は通常、コンテナごとに UTS namespace を用意する。`--hostname` を指定しない場合、既定のホスト名にはコンテナ ID の短縮形が使われる。任意の名前を設定する場合は次のように指定する。

```bash
docker run --hostname app-01 IMAGE
```

## 参照リンク

- [uts_namespaces(7) — Linux manual page](https://man7.org/linux/man-pages/man7/uts_namespaces.7.html)
- [sethostname(2) — Linux manual page](https://man7.org/linux/man-pages/man2/sethostname.2.html)
