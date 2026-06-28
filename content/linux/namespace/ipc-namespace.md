---
title: IPC namespace
date: 2026-06-28
update: 2026-06-28
draft: false
tags:
  - Linux
  - Namespace
  - IPC
aliases:
  - IPC namespace
description: IPC namespace が分離する System V IPC と POSIX メッセージキュー、および対象外の IPC を整理する。
---

## 概要

IPC namespace は、パス名以外の方法で識別される次の IPC 資源を分離する。

- System V メッセージキュー
- System V セマフォ集合
- System V 共有メモリセグメント
- POSIX メッセージキュー

同じ IPC namespace のプロセスはこれらのオブジェクトを共有できるが、別の IPC namespace からは参照できない。namespace ごとに System V IPC の識別子集合、POSIX メッセージキュー filesystem、および関連する `/proc` の設定・状態が用意される。

```bash
sudo unshare --ipc bash
readlink /proc/self/ns/ipc
ipcs
```

`ipcs` は、そのプロセスが属する IPC namespace の System V IPC オブジェクトを表示する。

## 分離されない IPC

「IPC」という名前でも、すべてのプロセス間通信を分離するわけではない。

| 仕組み                                                 | 主に関係する分離                                           |
| ------------------------------------------------------ | ---------------------------------------------------------- |
| POSIX 共有メモリ（通常は `/dev/shm` 上のオブジェクト） | Mount namespace とファイルアクセス権                       |
| パス名を持つ UNIX ドメインソケット                     | Mount namespace とファイルアクセス権                       |
| Linux の抽象 UNIX ドメインソケット                     | Network namespace                                          |
| パイプ、`socketpair`、継承済みファイルディスクリプタ   | 既存の参照を通じて利用でき、IPC namespace では遮断されない |

POSIX メッセージキューを `/dev/mqueue` から確認する場合は mount にも注意する。既存の `mqueue` mount は、それを mount したプロセスの IPC namespace に対応するため、コンテナでは Mount namespace も分離して `mqueue` filesystem を mount するのが一般的である。

## ライフサイクル

最後の所属プロセスと参照がなくなり IPC namespace が破棄されると、その namespace 内の IPC オブジェクトも自動的に破棄される。

## 参照リンク

- [ipc_namespaces(7) — Linux manual page](https://man7.org/linux/man-pages/man7/ipc_namespaces.7.html)
- [sysvipc(7) — Linux manual page](https://man7.org/linux/man-pages/man7/sysvipc.7.html)
- [mq_overview(7) — Linux manual page](https://man7.org/linux/man-pages/man7/mq_overview.7.html)
