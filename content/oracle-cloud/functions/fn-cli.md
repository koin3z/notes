---
title: Fn CLI
date: 2026-03-29
update: 2026-03-29
draft: false
tags:
  - OCI
  - Functions
  - Fn Project
aliases:
  - memos/fn-cli
description: ARM 環境で Fn CLI を利用するためのインストール代替手順を整理する。
---
## インストール
- インストール自体は[ここの手順](https://docs.oracle.com/ja-jp/iaas/Content/Functions/Tasks/functionsinstallfncli.htm)でできるが，ARMインスタンスの場合，以下のエラーがでる

```shell
❯ curl -LSs https://raw.githubusercontent.com/fnproject/cli/master/install | sh
sh: 58: fn: Exec format error
```

- そのため，ここでは別の方法を扱う。

**方法1: ソースからビルド**
- Fn CLIはGoで書かれているため、ARM64インスタンス上でソースからビルドする

```shell
# 1. 前提条件のインストール
# Goのインストール（1.18以降）
sudo dnf install golang -y   # Oracle Linux / RHEL系
# または
sudo apt install golang -y   # Ubuntu / Debian系

# Goのバージョン確認
go version

# 2. Fn CLIのソースを取得してビルド
git clone https://github.com/fnproject/cli.git
cd cli

# 3. ARM64向けにビルド
GOOS=linux GOARCH=arm64 go build -o fn

# 4. バイナリを適切な場所に移動
sudo mv fn /usr/local/bin/
sudo chmod +x /usr/local/bin/fn

# 5. インストール確認
fn version
```

**方法2: OCI Cloud Shell の利用**
- OCI Cloud Shellを使用する場合、Fn Project CLIは既にインストールされている
- Cloud ShellからOCI Functionsへのデプロイを行い、ARMインスタンスでは関数の実行のみを行う

**方法3: Docker内でFn CLIを使用**
https://hub.docker.com/u/fnproject

```
# docker-compose.yaml
services:
  fn-cli:
    image: fnproject/python:3.11-latest
    container_name: fn-cli-arm
    volumes:
      - .:/app
      - /var/run/docker.sock:/var/run/docker.sock  # Docker inside Docker用
    working_dir: /app
    environment:
      - FN_API_URL=http://fnserver:8080  # Fn Serverのホスト名に合わせて設定
    tty: true
    stdin_open: true
    entrypoint: ["/bin/sh"]
```
- Docker Socket マウント: 
	- Fn CLI は内部で Docker コンテナをビルド・起動するため，ホストの Docker デーモンを操作できるように `/var/run/docker.sock` を共有させる必要がある
- FN_API_URL: 
	- Fn Server を別途動かしている場合，そのエンドポイントを指定する
	- 同じ Compose 内に server を入れる場合はサービス名で指定可能

```
# コンテナを起動
docker compose up -d

# コンテナ内のシェルに入る
docker compose exec fn-cli sh

# コンテナ内で `fn` を実行する
fn version
```
## 参照リンク
- 
