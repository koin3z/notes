---
title: Untitled
date: 2026-06-07
update: 2026-06-07
draft: false
tags:
  - Linux
aliases:
  - 
description: このページの内容についての簡単な説明
---
# Linux Capability

## なぜ Capability が必要か

### setuid root の問題点

setuid root は「必要な権限だけを与える」という**最小権限の原則**に違反している。

```
passwd が本当に必要な権限：
  → /etc/shadow への書き込みだけ

setuid root で実際に持つ権限：
  → ネットワーク設定の変更
  → 任意のファイルの削除
  → 新しいプロセスの起動
  → ... root の全権限 😱
```

### 最小権限の原則（Principle of Least Privilege）

> 「必要な権限だけを与えるべき」

---

## Capability とは

Linux の root 権限を**細かく分割したもの**。

```
root という巨大な権限カード
         ↓
細かく分割
         ↓
必要な権限だけを付与できる
```

### 代表的な Capability

|Capability|意味|
|---|---|
|`CAP_CHOWN`|ファイルのオーナーを変更できる|
|`CAP_DAC_OVERRIDE`|通常のファイルパーミッションを無視できる|
|`CAP_NET_BIND_SERVICE`|1024番以下のポートをバインドできる|
|`CAP_NET_RAW`|生のネットワークパケットを扱える|
|`CAP_SYS_REBOOT`|システムを再起動できる|

---

## 3つの集合

Capability には3つの「集合」がある。

| 集合              | 意味                    |
| --------------- | --------------------- |
| **Permitted**   | 使っていいよと許可された権限の「引き出し」 |
| **Effective**   | 今この瞬間、実際にオンになっている権限   |
| **Inheritable** | 子プロセスに渡していい権限         |

### Permitted と Effective の関係

プログラムが自分で必要な瞬間だけ権限をオン・オフできる。

```
setuid root:
  実行開始 ──────────────────────── 終了
  |← root 権限ずっとオン →|

capability:
  実行開始 ── 通常 ──[オン]── 特権処理 ──[オフ]── 通常 ── 終了
                      ↑                    ↑
                   自分で上げる          自分で下げる
                  （raise）              （drop）
```

### Inheritable の役割

Permitted に持っていても Inheritable に入れていない capability は子プロセスに渡らない。 つまり**子プロセスへの継承を細かく制御できる**。

```
親プロセス:
  Permitted    = {CAP_NET_RAW, CAP_DAC_OVERRIDE}
  Effective    = {CAP_NET_RAW}
  Inheritable  = {CAP_NET_RAW}          ← これだけ子に渡る

子プロセス（exec後）:
  Permitted    = {CAP_NET_RAW}           ← DAC_OVERRIDE は渡らない
  Effective    = {}
  Inheritable  = {CAP_NET_RAW}
```

---

## 実践例：ping コマンド

`ping` は ICMP（生のネットワークパケット）を扱うため、かつては setuid root だった。 現在は `CAP_NET_RAW` だけを付与する方式に移行している。

```
昔（setuid root）:
  ping 実行中 = root の全権限 😱

今（capability）:
  ping 実行中 = CAP_NET_RAW だけ ✅
```

---

## 実際のコマンド

```bash
# プロセスの capability を確認
$ cat /proc/self/status | grep Cap

# ファイルに設定された capability を確認
$ getcap /usr/bin/ping
/usr/bin/ping = cap_net_raw+ep
#                          ^^
#                          e = Effective
#                          p = Permitted

# ファイルに capability を付与
$ setcap cap_net_raw+ep /usr/bin/ping
```

---

## まとめ

```
setuid root → 巨大な権限カードをまるごと渡す　（最小権限の原則に違反）
capability  → 必要な権限だけを細かく渡す　　　（最小権限の原則に準拠）

Permitted   → 使っていい権限の引き出し
Effective   → 今この瞬間オンになっている権限
Inheritable → 子プロセスに渡せる権限
```