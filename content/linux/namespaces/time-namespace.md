---
title: Time namespace
date: 2026-06-28
modified: 2026-06-28
draft: false
tags:
  - linux/namespaces
aliases:
  - TIME namespace
  - linux/namespace/time-namespace
description: Time namespace が monotonic clock と boot-time clock のオフセットを仮想化する仕組みを整理する。
---

## 概要

Time namespace は、プロセスから見える次のクロックのオフセットを仮想化する。

- `CLOCK_MONOTONIC` と関連クロック
- `CLOCK_BOOTTIME` と関連クロック

これにより、`clock_gettime(2)`、各種タイマー、`/proc/uptime` などが返す値を namespace ごとにずらせる。主な用途は、コンテナのチェックポイント・リストアや別ホストへの移行時に monotonic time と boot time の連続性を保つことである。

> [!important]
> Time namespace は現在時刻を表す `CLOCK_REALTIME` を仮想化しない。壁時計の日時を namespace ごとに自由に変更する仕組みではない。

## オフセット

オフセットは `/proc/<pid>/timens_offsets` で確認できる。

```text
monotonic           0         0
boottime            0         0
```

各行はクロック名、秒、ナノ秒を表す。新しい Time namespace に最初のプロセスが入った後はオフセットを変更できない。このため、`unshare(2)` は呼び出し元を直接移動させず、それ以降に作る子プロセスを新しい Time namespace に入れる設計になっている。

`unshare(1)` では、`--monotonic` と `--boottime` を使って子プロセスを起動する前にオフセットを設定できる。

```bash
# boot time の見え方を 1 日進めて uptime を実行する
sudo unshare --time --fork --boottime 86400 uptime --pretty
```

オフセットの書き込みには、その Time namespace を所有する User namespace における `CAP_SYS_TIME` が必要である。また、カーネルが `CONFIG_TIME_NS` を有効にしている必要がある。

## Namespace の確認

Time namespace には、現在のプロセスが属する namespace と、次に作る子が入る namespace を示す2つのハンドルがある。

```bash
readlink /proc/self/ns/time
readlink /proc/self/ns/time_for_children
```

`unshare --time` の直後は、この2つが異なる場合がある。

## 参照リンク

- [time_namespaces(7) — Linux manual page](https://man7.org/linux/man-pages/man7/time_namespaces.7.html)
- [unshare(1) — Linux manual page](https://man7.org/linux/man-pages/man1/unshare.1.html)
