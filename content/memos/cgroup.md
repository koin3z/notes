---
title: Untitled
date: 2026-06-07
update: 2026-06-07
draft: false
tags:
  - 
aliases:
  - 
description: このページの内容についての簡単な説明
---
## 1. cgroup とは何か

**cgroup（Control Groups）** は、プロセスをグループにまとめ、リソースの**制限・計測・優先制御**を行うLinuxカーネルの機能。コンテナ技術（Docker, Kubernetes）の根幹を成す。

### 解決する問題

```
# cgroup なし：プロセスがリソースを奪い合う
プロセスA ──┐
プロセスB ──┼──→ CPU / メモリ / IO を無制限に使用
プロセスC ──┘

# cgroup あり：グループ単位でリソースを制御
[グループ1: webserver]  → CPU 最大40%、メモリ 2GB まで
  └─ nginx, php-fpm
[グループ2: database]   → CPU 最大50%、メモリ 4GB まで
  └─ postgres
```

### 主なコントローラ（サブシステム）

|コントローラ|制御対象|
|---|---|
|`cpu`|CPU時間の割り当て・制限|
|`memory`|メモリ使用量の制限|
|`blkio` / `io`|ブロックI/Oの制御（v1は`blkio`、v2は`io`）|
|`pids`|プロセス数の制限|
|`cpuset`|使用できるCPUコアの固定|
|`net_cls`|ネットワークパケットへのクラスID付与（v1系の仕組み）|

---

## 2. cgroup v1

### 構造：コントローラごとに独立した階層

v1 では、基本的にコントローラごとに**別々のファイルシステム**としてマウントされる。

```bash
/sys/fs/cgroup/
├── memory/        # memoryコントローラ
├── cpu,cpuacct/   # cpuコントローラ
├── blkio/         # blkioコントローラ
├── pids/          # pidsコントローラ
└── ...
```

### 基本操作

```bash
# グループ作成（ディレクトリ作成 = グループ作成）
mkdir /sys/fs/cgroup/memory/myapp

# メモリ上限を 256MB に設定
echo 268435456 > /sys/fs/cgroup/memory/myapp/memory.limit_in_bytes

# プロセスをグループに追加
echo <PID> > /sys/fs/cgroup/memory/myapp/tasks

# 現在の使用量確認
cat /sys/fs/cgroup/memory/myapp/memory.usage_in_bytes
```

### v1 の問題点

#### 「コンテナ」という統一エンティティとして扱いにくい

```
/memory/containerA/  → PID 100, 200 を管理
/cpu/containerA/     → PID 100, 300 を管理  ← 別階層のグループ
/pids/containerA/    → PID 200, 400 を管理
```

`memory/containerA` と `cpu/containerA` は**別々の階層上のグループ**であり、同じ `containerA` という名前でも自動的に1つの単位として扱われるわけではない。

これが引き起こす問題：

- **一貫性の保証ができない**：memoryは設定したがcpuの設定を忘れる、といったミスが起きる
- **アトミックな操作ができない**：「コンテナ削除」が複数ツリーへのバラバラな操作の寄せ集めになる
- **リソースリーク**：削除し忘れたツリーが残り続ける

#### Pod レベルのリソース管理が困難（Kubernetes の問題）

```
# Kubernetes: Pod に メモリ 1GB を割り当てたい
Pod
├── コンテナA：500MB
└── コンテナB：500MB

# v1 でも memory 階層上で Pod 全体の上限は表現できる
# ただし CPU / memory / pids などが別階層になりやすく、
# Pod を1つの統一エンティティとして扱いにくい
```

---

## 3. cgroup v2

### 設計思想：単一の統合ツリー

v2 の最大の変化は、**全コントローラが1つの階層ツリーを共有する**点。

```bash
/sys/fs/cgroup/               # マウントは1箇所だけ
├── cgroup.controllers        # 利用可能なコントローラ一覧
├── cgroup.subtree_control    # 子に委譲するコントローラ
├── myapp/
│   ├── cgroup.procs          # このグループのPID
│   ├── memory.max            # メモリ上限
│   ├── cpu.max               # CPU制限
│   └── io.max                # IO制限
└── database/
    ├── cgroup.procs
    └── memory.max
```

### 基本操作

```bash
# グループ作成
mkdir /sys/fs/cgroup/myapp

# 親グループで子に委譲するコントローラを宣言
echo "+memory +cpu +io" > /sys/fs/cgroup/cgroup.subtree_control

# メモリ上限設定（書式が整理された）
echo "256M" > /sys/fs/cgroup/myapp/memory.max

# CPU制限：quota/period の形式（50ms/100ms = 50%）
echo "50000 100000" > /sys/fs/cgroup/myapp/cpu.max

# プロセス追加
echo <PID> > /sys/fs/cgroup/myapp/cgroup.procs
```

### subtree_control の役割

`subtree_control` に書かれたコントローラだけが子グループに伝播する。デフォルトは「何も使えない」状態。

```bash
# 親が memory と cpu だけを委譲する場合
echo "+memory +cpu" > /sys/fs/cgroup/myapp/cgroup.subtree_control

# → 子グループは memory と cpu だけを使える
# → io や pids は子グループでは使えない（明示しない限り）
```

これにより「このグループの子孫は memory と cpu だけを使える」という**委譲の連鎖**が明確になる。

### No Internal Process Constraint（重要な設計ルール）

```
子にリソースを配分する中間ノードは、自分自身にプロセスを持たない。

/sys/fs/cgroup/          ← root は例外
└── myapp/               ← 子に controller を有効化するなら PID を置かない
    ├── web/             ← PIDを置ける（リーフ）
    └── worker/          ← PIDを置ける（リーフ）
```

リソースの階層的な割り当てが明確になる。

### PSI（Pressure Stall Information）— v2 で扱いやすい機能

```bash
# メモリプレッシャーの確認
cat /sys/fs/cgroup/myapp/memory.pressure
# some avg10=0.00 avg60=0.23 avg300=0.12 total=152340
# full avg10=0.00 avg60=0.11 avg300=0.05 total=60123

# some = 一部のタスクが待たされた時間の割合
# full = 全タスクが待たされた時間の割合
```

---

## 4. v1 vs v2 比較

|観点|cgroup v1|cgroup v2|
|---|---|---|
|**階層**|コントローラごとに独立|単一の統合ツリー|
|**マウント数**|コントローラ数分|1つ|
|**プロセス管理**|`tasks`（スレッド単位も可）|`cgroup.procs`（プロセス単位）|
|**スレッド制御**|混在|`cgroup.threads` で明示的に分離|
|**権限委譲**|困難|`subtree_control` で明確|
|**コントローラ有効化**|マウント時に決定|`subtree_control` で動的に制御|
|**リソース設定書式**|コントローラごとにバラバラ|統一・整理|
|**PSI**|統一的な per-cgroup PSI はない|`memory.pressure` 等で利用可能|
|**統一エンティティ**|扱いにくい（コントローラごとに階層が分かれる）|扱いやすい（単一ツリーのグループ）|

### 本質的な違い

> v1：「コントローラごとのバラバラな管理」→ 1つの統一グループとして扱いにくい  
> v2：「カーネルが知っている単一のツリー」→ グループが統一エンティティとして存在する

---

## 5. systemd・コンテナとの連携

### systemd との連携

systemd 採用環境では、systemd が cgroup 階層を管理することが多い。近年の主要ディストリビューションでは cgroup v2 が標準になりつつある。

```bash
# サービスの cgroup 確認
systemctl status nginx
# CGroup: /system.slice/nginx.service
#         ├─1234 nginx: master process
#         └─1235 nginx: worker process

# リソース制限を systemd で設定
systemctl set-property nginx.service MemoryMax=512M CPUQuota=20%

# 手軽に試す：メモリ100MB制限でコマンド実行
systemd-run --scope -p MemoryMax=100M --user bash
```

### コンテナランタイム（Docker）での利用

```bash
# Docker 起動時のリソース制限
docker run --memory=512m --cpus=0.5 nginx

# これは内部的に以下のような cgroup を作る
/sys/fs/cgroup/
└── system.slice/
    └── docker-<container_id>.scope/
        ├── memory.max     ← --memory=512m に対応
        ├── cpu.max        ← --cpus=0.5 に対応
        └── cgroup.procs   ← コンテナ内プロセス
```

---

## 6. Kubernetes との関係

### v2 で実現できるようになったこと

```
# Pod / コンテナ階層を単一ツリーで表現できる
/sys/fs/cgroup/pod-xxx/        ← memory.max = 1GB（Pod全体の上限）
    ├── containerA/            ← memory.max = 500MB
    └── containerB/            ← memory.max = 500MB

# v2 のポイント：Pod上限とコンテナ上限を同じ階層で一貫して扱える
# v1 でも階層制限は可能だが、コントローラごとの統一管理が難しかった
```

### Kubernetes が v2 を推進した主な理由

1. **Pod 階層をカーネルレベルで表現できる**：Pod → コンテナという構造が cgroup ツリーで自然に対応する
2. **複数リソースの階層管理が一貫する**：Pod 全体の上限と各コンテナの上限を同じツリーで扱える
3. **管理の一貫性**：コントローラごとにバラバラな設定が不要になる
4. **PSI によるプレッシャー検知**：リソース枯迫の早期検知が可能になる

---

## 7. カーネルバージョンと普及状況

|カーネル|出来事|
|---|---|
|2.6.24 (2008)|cgroup v1 導入|
|4.5 (2016)|cgroup v2 導入|
|5.0+|v2 が本格的に安定|
|現在|v1/v2 のハイブリッドマウントも可能だが非推奨|

```bash
# 現在のシステムが v1 か v2 かを確認
stat -fc %T /sys/fs/cgroup/
# cgroup2fs → v2
# tmpfs     → v1（または混在）
```
