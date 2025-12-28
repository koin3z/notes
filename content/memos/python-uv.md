---
title: uv
date: 2025-12-28
update: 2025-12-28
draft: false
tags:
  - Python
aliases:
  - 
description: uv
---
## 概要
- Pythonではプロジェクトごとにパッケージを管理するため，仮想環境があったほうが便利。
	- 一方，Python以外のライブラリやツールの仮想環境はDockerを使える
- Python3.3より，`venv`による仮想環境機能が実装され，プロジェクトごとに独立したライブラリ/バージョンを管理することができる

- `pip`，`conda`，`poetry`，`rye`など様々なパッケージ管理ツールがある
	- 今のおすすめは`uv`
	- `Pixi`という`conda`の上位互換のようなツールも登場し，Python以外の依存関係も管理したい際にはこれを使うことも

- uvとは
	- Astral社によって提供される，Rustで書かれたpythonパッケージ管理ツール


## `uv`のセットアップ
### インストールする
- 以下リンクを参考にインストールする
https://docs.astral.sh/uv/getting-started/installation/

### アップデートする
```shell
uv self update
```

### プロジェクトの作成
```shell
uv init <project>
```
- すでに作成したいプロジェクト直下にいる場合は，`uv init`だけでいい
	- この段階ではまだ仮想環境`.venv`はつくられない
	- `uv venv`または`uv add <package>`すると仮想環境が作られる

- 作成されるファイル
	- https://docs.astral.sh/uv/concepts/projects/layout/
```shell
→ tree -a -L 2
.
├── .git
│   ├── HEAD
│   ├── branches
│   ├── config
│   ├── description
│   ├── hooks
│   ├── info
│   ├── objects
│   └── refs
├── .gitignore
├── .python-version  # このプロジェクトで使用するpythonのバージョンが記載されたファイル
├── README.md
├── main.py
└── pyproject.toml   # プロジェクトのビルドシステム，依存関係，メタデータを一元管理するための設定ファイル
```

```shell
→ cat .python-version 
3.13

→ cat pyproject.toml 
[project]
name = "uv-test"
version = "0.1.0"
description = "Add your description here"
readme = "README.md"
requires-python = ">=3.13"
dependencies = []
```

- `--package`オプションで配布可能なパッケージとしての構造を自動生成する
	- 自分のコードをライブラリとして扱いやすくし，他のスクリプトから簡単に呼び出せるようになる
```shell
→ uv init --package uv-test
→ tree -a -L 2
.
├── .git
│   ├── FETCH_HEAD
│   ├── HEAD
│   ├── branches
│   ├── config
│   ├── description
│   ├── hooks
│   ├── info
│   ├── objects
│   └── refs
├── .gitignore
├── .python-version
├── README.md
├── pyproject.toml
└── src                   # ソースコードを置くディレクトリ
    └── uv_test           # 実際のパッケージ
        └── __init__.py   # そのディレクトリがPythonパッケージであることを示すためのファイル
```

- srcレイアウトを採用した方がいい理由
	- 意図しない動作（インポート衝突）を防ぐため
		- フラットレイアウト：カレントディレクトリにあるコードを優先するため，インストール後のテストが不正確になりやすい
		- srcレイアウト：インストールされたパッケージとしてふるまうため，配布時と同じ環境を再現しやすい
	- https://packaging.python.org/ja/latest/discussions/src-layout-vs-flat-layout/
- `src`配下は自動でeditable installされる
	- uvはプロジェクトの初期化，同期時にsrc内のパッケージを仮想環境に自動でリンクするので，プロジェクトのどの階層にあるテストコードやスクリプトからでも`import <project>`と書くだけでその機能が使えるようになる
- editable installされているかの確認
```shell
→ uv pip list
Package Version Editable project location
------- ------- -------------------------------
numpy   2.4.0
uv-test 0.1.0   /home/koin3z/workspaces/uv-test
```

## `uv`でのPython管理

### Pythonのインストール
- `uv`では好きなバージョンのPythonをインストールできる
	- spaceで開けることで，複数のバージョンを一気にインストールできる
	- https://docs.astral.sh/uv/concepts/python-versions/#python-version-files
```shell
uv python install 3.12
```

### Pythonのバージョン固定
- プロジェクトで使用するpythonのバージョンを固定する
	- 固定されたバージョンは`.python-version`に記述される
	- しかし，`pyproject.toml`にて，`requires-python = ">=3.13"`との記述がある場合，バージョンは`3.13`未満のバージョンには固定できずエラーがでる
		- 下位のバージョンを使用したい場合は，`requires-python`を書き換える
	- https://docs.astral.sh/uv/reference/cli/#uv-python-pin
```shell
uv python pin 3.11
```

### Pythonパッケージを追加する
```shell
uv add numpy
```

-  次のようにバージョンを指定することも可能
```shell
uv add "numpy==2.3.4"
```

- 追加されたパッケージは`pyproject.toml`の`depencies`に追加される
	- また，`uv.lock`が更新され，すべての依存関係がまとめて記録される
	- https://docs.astral.sh/uv/concepts/projects/dependencies/

- `uv add`と`uv pip install`の違い
	- どちらもパッケージを追加するコマンドだが，次の違いがある
	- `uv add`は`pyproject.toml`に登録し，パッケージを追加する
	- `uv pip install`は仮想環境にパッケージを追加するのみ
	- `pyproject.toml`に登録がないと，パッケージの依存関係の情報が追加されないため，再現性がさがるので極力使わない
	- 一方で，`uv pip install`でないと追加できないパッケージもある
		- その場合は`README.mc`に追加したパッケージとバージョンを書いておく
		- Dockerを使っている場合，バージョンを固定して`uv pip install`するようにすると，ある程度再現性が確保できる
- `uv add`は，デフォルトではPython Package Index (PyPI)（パイピーアイ）でホストされているパッケージのみをインストールする
	- そのため，インストールが失敗した場合はPyPI以外からインストールするようにすればうまくいくことがある
	- PyTorchは専用のidexでホストされているので，indexを指定してインストールする必要がある
```shell
# Install over HTTPS
uv add git+https://github.com/encode/httpx

# Install over SSH
uv add git+ssh://git@github.com/encode/httpx
```

### Pythonパッケージを削除する
```shell
uv remove numpy
```

### Pythonパッケージのバージョンを更新する
```shell
uv lock --upgrade-package numpy
```


## 仮想環境
### スクリプトの実行
- 仮想環境を有効化せずに特定のスクリプトを実行することができる
```shell
uv run main.py
```

- 仮想環境を有効化していた場合は，もちろん以下で実行ができる
```shell
python main.py
```

### プロジェクト環境の同期
- `uv.lock`と`pyproject.toml`を共有すればプロジェクト環境を再現することができる
- プロジェクト直下で以下を実行
```shell
uv sync
```

```shell
→ uv sync
Using CPython 3.12.3 interpreter at: /usr/bin/python3.12
Creating virtual environment at: .venv
Resolved 13 packages in 0.45ms
Prepared 11 packages in 3.87s
Installed 12 packages in 129ms
 + contourpy==1.3.3
 + cycler==0.12.1
 + fonttools==4.60.1
 + kiwisolver==1.4.9
 + matplotlib==3.10.7
 + numpy==2.3.4
 + packaging==25.0
 + pillow==12.0.0
 + pyparsing==3.2.5
 + python-dateutil==2.9.0.post0
 + scipy==1.16.2
 + six==1.17.0
```

## `uvx`
- PyPIに公開せずとも，GitHubレポジトリから直接Pythonツールを実行できる機能
- 以下コマンドのエイリアス
```shell
uv tool run
```

- ツールをインストールする（やらなくてもいい）
```shell
uv tool install git+https://github.com/XXXX...
```

- インストール済みのツール一覧を表示
```shell
uv tool list
uv tool ls
```

- ツールのアップデート
```shell
uv tool upgrade <tool>
uv tool upgrade --all
```

- ツールを削除
```shell
uv tool uninstall <tool>
```
## Usage
```shell
→ uv help
An extremely fast Python package manager.

Usage: uv [OPTIONS] <COMMAND>

Commands:
  run                        Run a command or script
  init                       Create a new project
  add                        Add dependencies to the project
  remove                     Remove dependencies from the project
  sync                       Update the project's environment
  lock                       Update the project's lockfile
  export                     Export the project's lockfile to an alternate format
  tree                       Display the project's dependency tree
  tool                       Run and install commands provided by Python packages
  python                     Manage Python versions and installations
  pip                        Manage Python packages with a pip-compatible interface
  venv                       Create a virtual environment
  build                      Build Python packages into source distributions and wheels
  publish                    Upload distributions to an index
  cache                      Manage uv's cache
  self                       Manage the uv executable
  version                    Display uv's version
  generate-shell-completion  Generate shell completion
  help                       Display documentation for a command

Cache options:
  -n, --no-cache               Avoid reading from or writing to the cache, instead using a temporary directory for the duration of the operation [env:
                               UV_NO_CACHE=]
      --cache-dir <CACHE_DIR>  Path to the cache directory [env: UV_CACHE_DIR=]

Python options:
  --managed-python       Require use of uv-managed Python versions [env: UV_MANAGED_PYTHON=]
  --no-managed-python    Disable use of uv-managed Python versions [env: UV_NO_MANAGED_PYTHON=]
  --no-python-downloads  Disable automatic downloads of Python. [env: "UV_PYTHON_DOWNLOADS=never"]

Global options:
  -q, --quiet...                                   Use quiet output
  -v, --verbose...                                 Use verbose output
      --color <COLOR_CHOICE>                       Control the use of color in output [possible values: auto, always, never]
      --native-tls                                 Whether to load TLS certificates from the platform's native certificate store [env: UV_NATIVE_TLS=]
      --offline                                    Disable network access [env: UV_OFFLINE=]
      --allow-insecure-host <ALLOW_INSECURE_HOST>  Allow insecure connections to a host [env: UV_INSECURE_HOST=]
      --no-progress                                Hide all progress outputs [env: UV_NO_PROGRESS=]
      --directory <DIRECTORY>                      Change to the given directory prior to running the command
      --project <PROJECT>                          Run the command within the given project directory [env: UV_PROJECT=]
      --config-file <CONFIG_FILE>                  The path to a `uv.toml` file to use for configuration [env: UV_CONFIG_FILE=]
      --no-config                                  Avoid discovering configuration files (`pyproject.toml`, `uv.toml`) [env: UV_NO_CONFIG=]
  -h, --help                                       Display the concise help for this command
  -V, --version                                    Display the uv version

Use `uv help <command>` for more information on a specific command.
```
## 従来の方法
### `venv` + `pyenv` + `pip`
- `venv`はpython本体のバージョン切り替えができないので，`pyenv`でPythonの複数バージョンを共存させる
- `pip`はパッケージ管理

### `requirements.txt`
- 仮想環境を有効化した上で，以下を実行することで，仮想環境にインストールされているパッケージの情報を共有できる

- パッケージを出力する
```shell
pip freeze > requirements.txt
```

- パッケージをインストールする
```shell
pip install -r requirements.txt
```

- ただ，問題点も
	- 再現性が不十分
		- インストールされたパッケージのリストのため，間接依存関係が管理できず，環境の再現ができない場合も
	- 手動管理
		- パッケージの更新や削除は自分で編集する必要があり，依存関係の競合が起きた場合は自己解決する必要がある

## 参照リンク
- https://www.docswell.com/s/2625216247/Z2Q3YV-2025-10-22-170737
- https://zenn.dev/karaage0703/articles/3ce79805245fef