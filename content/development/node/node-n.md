---
title: "n"
date: 2025-12-07
modified: 2025-12-07
draft: false
tags:
  - development/nodejs
aliases:
  - memos/node-n
  - memos/development/node/node-n
description: Node.jsのバージョン管理ツール「n」
---

## インストール

```shell
sudo npm install -g n
```

- インストールできるnode.jsのバージョンを見る

```shell
→ n --stable # 安定版
24.11.1

→ n --latest # 最新版
25.2.1
```

- バージョンを切り替える

```shell
→ n ls # インストールされているバージョンを確認する
node/25.2.1

→ sudo n 25.2.1
     copying : node/25.2.1
   installed : v25.2.1 (with npm 11.6.2)

→ node -v
v25.2.1
```

- こっちでもいい

```shell
→ n

  ο node/25.2.1

Use up/down arrow keys to select a version, return key to install, d to delete, q to quit
```

- バージョンが変わらない場合は，ターミナルを再起動する

## 参照リンク

- https://qiita.com/siakio/items/99817fc98c633bd3fd21
-
