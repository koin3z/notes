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

## フォルダ構成
- Gemini CLIでは以下のようなディレクトリの構成を取る
- Claude Codeとは思想が異なり，階層的なコンテキストの結合と，MCPを中心として拡張に重きをおく
```
your-project/
├── GEMINI.md                  # チームの指示・プロジェクト全体のコンテキスト (コミット対象)
├── .geminiignore              # AIの読み取りから除外するファイル設定 (コミット対象)
│
├── frontend/
│   └── GEMINI.md              # サブディレクトリ固有のルール (階層的に結合される)
│
└── .gemini/
    ├── settings.json          # プロジェクト固有の設定 (グローバル設定を上書き)
    ├── sandbox-macos.sb       # (任意) 安全にコマンドを実行するためのカスタムサンドボックス設定
    └── sandbox.Dockerfile     # (任意) カスタムDockerサンドボックス環境
    │
    └── commands/              # カスタムスラッシュコマンド (拡張機能)
        ├── review.toml        # → /review コマンドを定義
        └── deploy.toml        # → /deploy コマンドを定義

~/.gemini/                     # グローバル (ユーザー) ディレクトリ
├── settings.json              # グローバル設定、MCPサーバー定義、UIテーマなど
├── GEMINI.md                  # 全プロジェクトに適用されるあなたのグローバル指示
├── .env                       # APIキーや環境変数 (ここに置くことも可能)
├── commands/                  # グローバルなカスタムコマンド (.tomlファイル群)
└── cache/                     # トークンキャッシュやセッション履歴などの内部データ
```
- `skills/` と `agents/` は「MCPサーバー」に集約される 
	- Claude Codeのように専用のディレクトリを作ってプロンプトベースのWorkflow（スキルやエージェント）を管理するのではなく、Gemini CLIは業界標準の MCP (Model Context Protocol) の利用を推奨している
    - Geminiでの運用: 
	    - `~/.gemini/settings.json`（またはプロジェクトの `settings.json`）の `"mcpServers"` ブロックに、ローカルまたは外部のMCPサーバーを登録
	    - これにより、コードレビュー用ツールやセキュリティ監査ツールなどを「外部ツール」としてAIにシームレスに提供
- `rules/` は「ディレクトリごとの `GEMINI.md`」で代用する
	- モジュール化されたルールファイル（`testing.md` など）を1箇所に集めるアプローチも可能だが、Gemini CLIの強みは階層型コンテキスト
    - Geminiでの運用: 
	    - フロントエンドのルールは `frontend/GEMINI.md` に、バックエンドの規約は `backend/GEMINI.md` に配置します。CLIを実行したディレクトリに応じて、ルートから現在のディレクトリまでの `GEMINI.md` が自動的に収集・マージされるため、必要なルールだけが動的に適用される
- `CLAUDE.local.md` や `settings.local.json` のような個人用の上書き機能 
	- Gemini CLIには、デフォルトで `.local` のつく予約ファイルはない
    - Geminiでの運用: 
	    - プロジェクトの `.gemini/settings.json` にて `"contextFileName": ["GEMINI.md", "GEMINI.local.md"]` と指定し、`GEMINI.local.md` を `.gitignore` に追加することで全く同じ運用が可能

### settings.json
https://geminicli.com/docs/reference/configuration/#settings-files
- 設定ファイル

## 参照リンク
- https://github.com/google-gemini/gemini-cli
- https://zenn.dev/schroneko/articles/gemini-cli-tutorial
