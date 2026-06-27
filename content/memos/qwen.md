---
title: Qwen ローカル実行ガイド
date: 2026-06-26
update: 2026-06-28
draft: false
tags:
  - LLM
  - Ollama
  - Qwen
  - LocalLLM
aliases:
  - 
description: Qwen をローカル環境で動かすためのモデル選び・Ollama セットアップ・GUI 連携までを解説するガイド
---

## Qwen とは

Alibaba が開発・公開しているオープンソースの大規模言語モデル（LLM）シリーズ。日本語を含む多言語への対応度が高く、コード生成・論理推論・長文処理など幅広いタスクで高い性能を発揮する。

2026 年現在、ローカル環境で動かせるオープンソース LLM の中でも特に人気の高いモデルのひとつ。VRAM の制約が小さいコンシューマー向け GPU でも実用的な速度で動作する。

## 1. 自分のPCに合ったモデルを選ぶ

Qwen シリーズはパラメータ数（モデルの大きさ）によっていくつかのバリエーションがある。手元環境の VRAM（ビデオメモリ）容量を確認し、以下を目安にモデルを選ぶ。

| **VRAM容量**                                   | **おすすめのQwenバージョン**   | **特徴・用途**                                    |
| -------------------------------------------- | -------------------- | -------------------------------------------- |
| **8GB 前後**<br>(RTX 3060 / 4060 など)           | **Qwen3 7B（または 9B）** | 最も軽量。一般的な返答やテキストの要約・生成に対応する。                 |
| **12GB 〜 16GB**<br>(RTX 4070 / 4080 など)      | **Qwen3 14B** ★推奨？   | バランスが最良。日本語の表現力が一段と上がり、コード生成やデバッグの精度も実用レベルに。 |
| **24GB 近く**<br>(RTX 3090 / 4090 / M2 Max など) | **Qwen3 32B**        | 非常に高精度で、複雑な長文の文脈を理解できる。技術的な壁打ちやインフラ設計の整理に最適。 |

プログラミングのデバッグや複雑な条件分岐の処理をさせたい場合は、Qwen をベースに推論特化型にチューニングされた **`deepseek-r1:14b`** または **`deepseek-r1:32b`** を選ぶのも 2026 年現在のトレンド（内部の仕組みは Qwen アーキテクチャを流用している）。

## 2. 最も簡単で安全な使用法（Ollama を使った手順）

ローカル LLM を動かすツールはいくつかあるが、現在は **Ollama（オラマ）** を使うのが最も簡単で、セキュリティ的にもクローズドな環境を作りやすい。Ollama については [[ollama|こちらの記事]] も参照。

### 手順1. Ollama のインストール

公式サイト（[https://ollama.com](https://ollama.com/)）から、使用中の OS（Windows / macOS / Linux）に合わせたインストーラーをダウンロードする。

Windows の場合は PowerShell で以下を実行する方法もある。

```bash
PS C:\Users\koin3z> irm https://ollama.com/install.ps1 | iex
>>> Downloading Ollama for Windows...
######################################## 100.0%
>>> Installing Ollama...
>>> Install complete. Run 'ollama' from the command line.
```

### 手順2. インストールの確認

ターミナル（Windows の場合は PowerShell またはコマンドプロンプト）を開き、バージョンが表示されるか確認する。

```bash
PS C:\Users\koin3z> ollama --version
ollama version is 0.30.10
```

### 手順3. Qwen モデルのダウンロードと起動

最もバランスの良い **14B（140億パラメータ）** モデルを例にする。以下のコマンドを実行すると、自動的にダウンロードが始まり、そのままチャット画面が立ち上がる。

```bash
ollama run qwen3:14b
```

- VRAM が 8GB 程度の場合は `ollama run qwen3:7b`
- 推論特化型を試したい場合は `ollama run deepseek-r1:14b`

に変更する。

### 手順4. ローカル環境での対話

ダウンロードが完了すると `>>>` という入力待ち状態になる。ここに日本語で質問を投げれば、PC 内の GPU が回り、完全にローカル環境で回答が生成される。

終了するときは `/bye` または `Ctrl + D` を入力する。

## 3. さらに便利に使うための応用（GUI やエディタ連携）

ターミナルでの対話ではなく ChatGPT のような UI で使いたい場合や、開発環境と連携させたい場合は、Ollama をバックグラウンドで起動した状態で以下のツールを組み合わせる。

- **Page Assist（ブラウザ拡張機能）:** Chrome や Edge に導入できる拡張機能。Ollama と連携し、Web ブラウザ上で綺麗な UI のチャット画面を利用できる。

- **LM Studio:** Ollama を使わず、アプリ単体でモデルの検索からチャット画面までを完結させたい場合に最適な GUI ツール。

- **Neovim / VS Code 連携:** VS Code の `Continue` プラグインなどの接続先を `http://localhost:11434`（Ollama のデフォルト URL）に設定することで、ローカルの Qwen をコード補完アシスタントとして組み込むことができる。

まずは `ollama run qwen3:14b`（または `qwen3:7b`）から試し、PC のファンがどれくらい回るか、速度にストレスがないかを確認するのがおすすめ。


## OpenWebUI

ChatGPT そっくりの画面をローカルに構築できるオープンソースの Web UI。Ollama との相性が最も良い。Docker などで起動すると、自動的にローカルの Ollama（Qwen2.5-vision）を検知する。チャット画面の「＋」ボタンやドラッグ＆ドロップで画像をアップロードし、そのまま Qwen に質問できる。

ここでは Docker を使用する。

```bash
docker run -d -p 3000:8080 --add-host=host.docker.internal:host-gateway -v open-webui:/app/backend/data --name open-webui --restart always ghcr.io/open-webui/open-webui:main
```

Open WebUI 自体は AI モデルを持たない。ブラウザ上で動作する「UI（画面）」を提供するだけの独立したシステム（コンテナ）として動作する。

コマンド中の `--add-host=host.docker.internal:host-gateway` という設定が重要なポイント。この設定により、「独立した空間にいる Open WebUI」が「PC 本体で動いている Ollama」を自動的に見つけ出し、裏側で連携してデータをやり取りする仕組みになっている。

- ダウンロードと起動が完了したら、ブラウザのアドレスバーに `http://localhost:3000` と入力してアクセスする。
- ログイン画面が表示されたら「Sign Up（サインアップ）」をクリックし、名前・メールアドレス・パスワードを入力してアカウントを作成する。

![[Pasted image 20260628005426.png]]

## 参照リンク

- [Qwen 公式（Hugging Face）](https://huggingface.co/Qwen)
- [Ollama 公式サイト](https://ollama.com/)
- [Ollama モデルライブラリ](https://ollama.com/library)
