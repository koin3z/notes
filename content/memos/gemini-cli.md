---
title: Gemini CLI
date: 2025-12-07
update: 2025-12-07
draft: false
tags:
  - 
aliases:
  - 
description: Gemin CLI
---

## セットアップ

```bash
→ npx https://github.com/google-gemini/gemini-cli
Need to install the following packages:
github:google-gemini/gemini-cli
Ok to proceed? (y) y


 ███            █████████  ██████████ ██████   ██████ █████ ██████   █████ █████
░░░███         ███░░░░░███░░███░░░░░█░░██████ ██████ ░░███ ░░██████ ░░███ ░░███
  ░░░███      ███     ░░░  ░███  █ ░  ░███░█████░███  ░███  ░███░███ ░███  ░███
    ░░░███   ░███          ░██████    ░███░░███ ░███  ░███  ░███░░███░███  ░███
     ███░    ░███    █████ ░███░░█    ░███ ░░░  ░███  ░███  ░███ ░░██████  ░███
   ███░      ░░███  ░░███  ░███ ░   █ ░███      ░███  ░███  ░███  ░░█████  ░███
 ███░         ░░█████████  ██████████ █████     █████ █████ █████  ░░█████ █████
░░░            ░░░░░░░░░  ░░░░░░░░░░ ░░░░░     ░░░░░ ░░░░░ ░░░░░    ░░░░░ ░░░░░

                                              v0.21.0-nightly.20251207.025e450ac
Tips for getting started:
1. Ask questions, edit files, or run commands.
2. Be specific for the best results.
3. Create GEMINI.md files to customize your interactions with Gemini.
4. /help for more information.

╭──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
│ You are running Gemini CLI in your home directory. It is recommended to run in a project-specific directory.         │
╰──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯

╭──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
│                                                                                                                      │
│ ? Get started                                                                                                        │
│                                                                                                                      │
│   How would you like to authenticate for this project?                                                               │
│                                                                                                                      │
│   ● 1. Login with Google                                                                                             │
│     2. Use Gemini API Key                                                                                            │
│     3. Vertex AI                                                                                                     │
│                                                                                                                      │
│   No authentication method selected.                                                                                 │
│                                                                                                                      │
│   (Use Enter to select)                                                                                              │
│                                                                                                                      │
│   Terms of Services and Privacy Notice for Gemini CLI                                                                │
│                                                                                                                      │
│   https://github.com/google-gemini/gemini-cli/blob/main/docs/tos-privacy.md                                          │
│                                                                                                                      │
╰──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
````

- 「1. Login with Google」を選択して，指定されたURLにログイン。
	- ログイン後，認可コードがブラウザに表示されるので，ターミナルに貼り付けると動く

- `gemini`コマンドで起動するには以下でインストールする
```shell
→ sudo npm install -g @google/gemini-cli
npm warn deprecated node-domexception@1.0.0: Use your platform's native DOMException instead

added 580 packages in 46s

153 packages are looking for funding
  run `npm fund` for details
```

- 以下コマンドで起動
```shell
gemini
```

## Prompt
- `/quit`でやめることができる
	- もしくはCtrl+Dを２回
- `@ファイル名`でファイルを読み込ませる
	- 例：`@package.json を見て、プロジェクトの概要を教えて`
- `!コマンド` でシェルコマンドを実行。
	- 例：`!ls -la` 
	- escでもとに戻る
- `/clear`: 会話の履歴を忘れてリセット（新しい話題に移りたいとき）
- **`/chat save 名前`**: 今の会話を保存
- **`/chat resume 名前`**: 保存した会話を再開

## コンテキストファイル
- `.gemini/GENIMI.md`に配置
- `/memory add <指示内容>`でcliから指示ができる
```shell
> /memory add 日本語で返してください


ℹ Attempting to save to memory: "日本語で返してください"
╭──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
│ ✓  SaveMemory in ~/.gemini/GEMINI.md                                                                                 │
│                                                                                                                      │
│ Okay, I've remembered that: "日本語で返してください"                                                                 │
╰──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯

ℹ Refreshing hierarchical memory (GEMINI.md or other context files)...

ℹ Memory refreshed successfully. Loaded 125 characters from 1 file(s).

╭──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
│ You are running Gemini CLI in your home directory. It is recommended to run in a project-specific directory.         │
╰──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯

```

- ファイルができている
```shell
→ cat GEMINI.md
## Gemini Added Memories
- 日本語で返してください
```
## 参照リンク
- https://github.com/google-gemini/gemini-cli
- https://zenn.dev/schroneko/articles/gemini-cli-tutorial
