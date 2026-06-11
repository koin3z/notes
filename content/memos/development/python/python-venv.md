---
title: Python 仮想環境
date: 2025-12-28
update: 2025-12-28
draft: false
tags:
  - Python
  - venv
aliases:
  - memos/python-venv
description: Python 標準 venv の仮想環境作成と参照リンクを整理する。
---

- 作成する
	- `.venv`ディレクトリが作成され，仮想環境ができる
	- `.venv`以外の名前でもいいが，慣習的にこの名前にするのが習わし
	- `.venv`はgitで管理してはいけない。容量が大きい他，他人の環境では動かないので共有するメリットがない
```shell
python -m venv .venv
```


- 仮想環境を有効化する
	- macまたはLinux
	- 仮想環境を有効化した状態で`pip install`すれば，仮想環境にパッケージを追加することができる
		- 追加されたパッケージは`.venv/lib/python<version>/site-packages`に配置される
```shell
source .venv/bin/activate
```

- 仮想環境を無効化する
```shell
deactivate
```

## 参照リンク
- 
