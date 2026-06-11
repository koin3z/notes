---
title: Codex
date: 2026-03-25
update: 2026-03-25
draft: false
tags:
  - AI
  - Coding Agent
  - Codex
aliases:
  - memos/codex
description: Codex CLI の設定ファイル、カスタムコマンド、MCP 連携の構成を整理する。
---
## フォルダ構成
- codex は Claude Code や Gemini CLI と比較するとかなりミニマル
```
your-project/
├── codex.md                   # プロジェクト全体のコンテキスト（共通指示）
└── .codex/
    └── prompts/               # プロジェクト固有のカスタムコマンド
        ├── code-review.md     # → CLI上で /code-review として実行可能
        └── generate-tests.md  # → CLI上で /generate-tests として実行可能

~/.codex/                      # グローバル（ユーザー）ディレクトリ
├── config.json                # 全体設定（モデル指定、承認モードなど）
└── prompts/                   # 全プロジェクトで共通して使えるグローバルコマンド
    └── security-audit.md      # → どのディレクトリからでも /security-audit が使える
```

- Codex CLIもGemini CLIと同様，Claude Codeのような `skills/` や `agents/` といった専用のMarkdownディレクトリを標準では持っていない
- その代わり，Codex CLIも業界標準のMCPをサポートしている
	- 外部ツール（データベース連携やGitHub連携など）をAIに使わせたい場合は，専用のプロンプトファイルを書くのではなく，MCPサーバーを接続して機能を拡張するアプローチをとる
- ただ，Agent Skills をサポートしているので，`skills`を使用するこはできる
	- https://developers.openai.com/codex/skills
### 1. プロジェクト設定（`codex.md` / `.codex/instructions.md`）
- Codex CLIは，プロジェクトルートにある `codex.md` または `.codex/instructions.md` を読み込み，AIへの「共通指示（システムプロンプト）」として利用する
- 役割:
	- 「このプロジェクトではTypeScriptを使用する」「テストコードは必ずJestで書く」といった，毎回入力する手間を省きたいプロジェクト固有のルールや前提条件を記述
- 特徴: 
	- Claude Codeの `CLAUDE.md` やGemini CLIの `GEMINI.md` と同じ役割だが，ディレクトリごとの階層的な読み込み（サブディレクトリ設定のマージ）よりも，プロジェクト単一のルール適用に重きを置いたシンプルな挙動をする

### 2. グローバル設定（`~/.codex/config.json`）
- ユーザーのホームディレクトリ配下にある `config.json` で，Codex CLI全体の振る舞いを制御
- モデルの切り替え: 
	- デフォルトのモデル（`o4-mini` など）から，より高精度な推論モデル（`o3` や `gpt-5` など）への切り替えを指定する
- 承認モード（Approval Mode）: 
	- Codex CLIの大きな特徴である「AIがコマンドを実行する前に人間の承認（Yes/No）を求めるか，完全自動（full-auto）で実行させるか」のデフォルト設定をここで定義する

## 参照リンク
- 
