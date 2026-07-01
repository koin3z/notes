---
title: コンテナイメージの作成手順
date: 2025-12-28
modified: 2025-12-28
draft: false
tags:
  - containers/docker
aliases:
  - notes/creating-container-image
  - memos/containers/creating-container-image
description: JupyterLab を題材に、コンテナイメージを手動検証から Dockerfile 化する流れを整理する。
---

コンテナ環境を準備する際の手順メモ

## 1. 構成を書き出す

まずは何が必要かを整理する

- **ベースOS:** Ubuntu, Alpine, Debianなど
- **ランタイム:** Python 3.11, Node.js 20, Goなど
- **必要なライブラリ:** `gcc`, `git`, `libpq-dev`など
- **環境変数:** ポート番号、APIキー

## 2. インタラクティブモードで手動で構築する

ベースとなるイメージを`-it`で起動し，コンソール上で一つづつコマンドを試す。

```shell
docker run --rm -it ubuntu:22.04 /bin/bash
```

必要なパッケージをインストールし，次のことを確認する

- `apt-get update` は必要か？
- インストール中に「Yes/No」を聞かれないか？（`-y` オプションの確認）
- インストール後の設定ファイルはどこにあるか？

## 3. 手順をメモし，Dockerfileに書く

手動で成功した手順（コマンド履歴）を、そのまま `Dockerfile` の命令に書き換えていきます。

| **手動操作**                 | **Dockerfileの命令**                           |
| ---------------------------- | ---------------------------------------------- |
| `apt-get install ...`        | `RUN apt-get update && apt-get install -y ...` |
| ファイルをドラッグ＆ドロップ | `COPY . /app`                                  |
| `cd /app`                    | `WORKDIR /app`                                 |
| `export PORT=8080`           | `ENV PORT=8080`                                |

## 4. ビルドとテスト

`docker build`を行う。
エラーが出たら，Dockerfileを修正して，再ビルドする。

```
docker build -t my-custom-env .
```

## 5. 最適化

動くものができたら，最後に「運用しやすさ」のために形を整える

- **イメージの軽量化:** 不要なキャッシュの削除（`rm -rf /var/lib/apt/lists/*`）や、[マルチステージビルド](https://docs.docker.jp/develop/develop-images/multistage-build.html)の検討。
- **セキュリティ:** `root` ユーザー以外で実行するように `USER` 指定を追加。
- **再現性の確保:** バージョンを `latest` ではなく `3.11.5` のように固定。

## 参照リンク

- https://docs.docker.com/build/building/best-practices/
