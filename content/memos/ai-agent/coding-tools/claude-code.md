---
title: Claude Code
date: 2026-03-24
update: 2026-03-24
draft: false
tags:
  - AI
  - Coding Agent
  - Claude Code
aliases:
  - memos/claude-code
description: Claude Code のプロジェクト構成、コマンド、サブエージェント設定を整理する。
---
## フォルダ構成
- `.claude`は claude の動作を制御するディレクトリ
- 指示，カスタムコマンド，権限のルール，セッションをまたいだメモリ情報などが格納される
- `.claude`ディレクトリは次の2つがある
	- プロジェクト内
	- ホームディレクトリ内
- プロジェクト内 `.claude`
	- チームの設定が格納
	- Gitでコミットすると，チーム内のメンバー全員が同じカスタムコマンド，同じ権限ポリシーを使用することができる
- ホームディレクトリ内 `.claude`
	- セッション履歴や自動メモリ等の個人設定，ローカルマシンの状態が保存される
![[Pasted image 20260324232344.png]]

- 全体としては以下のようになる
```plaintext
your-project/
├── CLAUDE.md                  # Team instructions (committed)
├── CLAUDE.local.md            # Your personal overrides (gitignored)
│
└── .claude/
    ├── settings.json          # Permissions + config (committed)
    ├── settings.local.json    # Personal permission overrides (gitignored)
    │
    ├── commands/              # Custom slash commands
    │   ├── review.md          # → /project:review
    │   ├── fix-issue.md       # → /project:fix-issue
    │   └── deploy.md          # → /project:deploy
    │
    ├── rules/                 # Modular instruction files
    │   ├── code-style.md
    │   ├── testing.md
    │   └── api-conventions.md
    │
    ├── skills/                # Auto-invoked workflows
    │   ├── security-review/
    │   │   └── SKILL.md
    │   └── deploy/
    │       └── SKILL.md
    │
    └── agents/                # Specialized subagent personas
        ├── code-reviewer.md
        └── security-auditor.md

~/.claude/
├── CLAUDE.md                  # Your global instructions
├── settings.json              # Your global settings
├── commands/                  # Your personal commands (all projects)
├── skills/                    # Your personal skills (all projects)
├── agents/                    # Your personal agents (all projects)
└── projects/                  # Session history + auto-memory
```


### CALUDE.md
- Claude Code のセッションを開始した際，まず最初に読み込まれる
- システムプロンプトに直接読み込まれ，会話全体を通してその内容が保持される
- プロジェクトのルートディレクトリに作成するのが最も一般的
- ただ，すべてのプロジェクトに適用されるグローバル設定のため，`~/.claude/CLAUDE.md`を作成することもできる
- また，フォルダ固有のルールとして，サブディレクトリに作成することもできる
- Claude はこれらのファイルをすべて読み込み，組み合わせて使用する
- 効果的な書き方としては以下を記載するといい
	- ビルド、テスト、リンティングのコマンド（npm run test、make buildなど）
	- 重要なアーキテクチャ上の決定事項（「Turborepoを使用したモノレポを採用しています」）
	- 気づきにくい落とし穴（「TypeScriptの厳格モードが有効になっているため、未使用の変数はエラーになります」）
	- インポート規則、命名パターン、エラー処理スタイル
	- メインモジュールのファイルとフォルダ構造
- 逆に書かないほうがいいもの
	- リンターまたはフォーマッターの設定に含めるものすべて
	- 既にリンク可能な完全なドキュメント
	- 理論を説明する長い段落
- 200行以内に収めること。それ以上はコンテキストが過剰に消費され，Claudeが指示を守らなくなる可能性がある
- 例
```plaintext
# Project: Acme API

## Commands
npm run dev          # Start dev server
npm run test         # Run tests (Jest)
npm run lint         # ESLint + Prettier check
npm run build        # Production build

## Architecture
- Express REST API, Node 20
- PostgreSQL via Prisma ORM
- All handlers live in src/handlers/
- Shared types in src/types/

## Conventions
- Use zod for request validation in every handler
- Return shape is always { data, error }
- Never expose stack traces to the client
- Use the logger module, not console.log

## Watch out for
- Tests use a real local DB, not mocks. Run `npm run db:test:reset` first
- Strict TypeScript: no unused imports, ever
```

- 個人的にオーバーライドしたいものについては `CLAUDE.local.md`を使用する
- チーム共有ではなく，その人個人で使いたい場合に使用
	- 別のテストランナーを使用する場合など
- プロジェクトのルートディレクトリに作成する
	- Claudeは CLAUDE.md と並列に読み込む
- `gitignore`からは自動で除外されるので，個人的な変更がリポジトリに反映されることはない
![[Pasted image 20260324231324.png]]


### rules/
- `rules`ディレクトリは `CLAUDE.md`といっしょに自動で読み込まれる
- 一つのファイルではなく，懸念事項とともにファイル（指示）を分割する
```plaintext
.claude/rules/
├── code-style.md
├── testing.md
├── api-conventions.md
└── security.md
```
- 各ファイルは独立しており，作業者の間で編集が競合することはない
- このディレクトリの特徴はパス範囲をルールとして指定することにある
- yamlフロントマターにより，Claude がそれに一致するファイルを操作している場合にのみ，そのルールが有効になる
- paths フィールドがない場合は，無条件で読み込まれる
```markdown
---
paths:
  - "src/api/**/*.ts"
  - "src/handlers/**/*.ts"
---
# API Design Rules

- All handlers return { data, error } shape
- Use zod for request body validation
- Never expose internal error details to clients
```

### commands/
- Claude Codeには，`/help`や`/compact`といったコマンドが組み込まれている
- このディレクトリを使用すると，独自のコマンドを追加できる
- この配下に追加した md ファイルはすべてスラッシュコマンドになる
	- ファイル名はそのままコマンド名になる
![[Pasted image 20260324232533.png]]

- 例
```markdown
---
description: Review the current branch diff for issues before merging
---
## Changes to Review

!`git diff --name-only main...HEAD`

## Detailed Diff

!`git diff main...HEAD`

Review the above changes for:
1. Code quality issues
2. Security vulnerabilities
3. Missing test coverage
4. Performance concerns

Give specific, actionable feedback per file.
```

- `/project:review`を実行すると，Claudeが認識する前に，実際の `git diff`が自動でプロンプトに挿入される
- `!` + バッククォート はシェルコマンドを実行し，その結果を埋め込む

- コマンドに引数を渡す場合は `$ARGUMENTS` を使用する
- 以下の例では，`/project:fix-issue 234`を実行すると、issue 234 の内容がプロンプトに直接表示される
```markdown
---
description: Investigate and fix a GitHub issue
argument-hint: [issue-number]
---
Look at issue #$ARGUMENTS in this repo.

!`gh issue view $ARGUMENTS`

Understand the bug, trace it to the root cause, fix it, and write a
test that would have caught it.
```

- プロジェクトに関係なく，独自のコマンドを使用したい場合は `~/.claude/commands/`に記述する
	- これらのコマンドは `/user:command-name` で表示される

### skills/
- タスクが skills の説明に合致する際，スラッシュコマンドを実行しなくても，Claudeが自動で起動できるワークフロー
- `commands/`との違い
	- `commands/`はユーザーの指示を待つが，`skills`は会話を監視し，適切なタイミングで動作する
![[Pasted image 20260324234321.png]]

- skills は専用のディレクトリに格納され，その中に `SKILL.md`ファイルが含まれる
```markdown
.claude/skills/
├── security-review/
│   ├── SKILL.md
│   └── DETAILED_GUIDE.md
└── deploy/
    ├── SKILL.md
    └── templates/
        └── release-notes.md
```

- `SKILL.md`は yamlフロントマターを使用し，いつ使用するかを記述する
```markdown
---
name: security-review
description: Comprehensive security audit. Use when reviewing code for
  vulnerabilities, before deployments, or when the user mentions security.
allowed-tools: Read, Grep, Glob
---
Analyze the codebase for security vulnerabilities:

1. SQL injection and XSS risks
2. Exposed credentials or secrets
3. Insecure configurations
4. Authentication and authorization gaps

Report findings with severity ratings and specific remediation steps.
Reference @DETAILED_GUIDE.md for our security standards.
```

- 「このプルリクエストのセキュリティ上の問題点を確認する」と入力すると，Claude は説明文を読み取り，一致すると自動的にスキルを呼び出す
	- また、/security-reviewと明示的に指定して呼び出すこともできる
- commands との大きな違いとして**サポートファイルと一緒にバンドルできる**点がある
	- commands は単一ファイル
	- skills はパッケージ
- 個人の skills は `~/.claude/skills/`に保存する

### agents/
- タスクが複雑な場合，`.claude/agents/`ディレクトリに，サブエージェントのペルソナを定義できる
- 各エージェントファイルは，独自のシステムプロンプト，ツールアクセス，モデル設定を含むマークダウンで表現される
```plaintext
.claude/agents/
├── code-reviewer.md
└── security-auditor.md
```

- 例えば，`code-reviewer.md`は以下の通り
```markdown
---
name: code-reviewer
description: Expert code reviewer. Use PROACTIVELY when reviewing PRs,
  checking for bugs, or validating implementations before merging.
model: sonnet
tools: Read, Grep, Glob
---
You are a senior code reviewer with a focus on correctness and maintainability.

When reviewing code:
- Flag bugs, not just style issues
- Suggest specific fixes, not vague improvements
- Check for edge cases and error handling gaps
- Note performance concerns only when they matter at scale
```

- コードレビューが必要な場合，独立したコンテキストウィンドウでエージェントが起動される
	- エージェントは処理を実行し，結果を圧縮して報告する
- `tools`フィールド
	- エージェントが実行できる操作を制限する
	- セキュリティ監査にファイルへの書き込み権限は不要
	- この制限は意図的なものであり，明確にしておく必要がある
- `model`フィールド
	- 特定のタスク向けに，より安価で高速なモデルを使用できる
	- Haiku：ほとんどの読み取り専用の探索を適切に処理
	- Sonnet，Opus：実際に作業が必要なときに取っておく
- 個人用エージェントは `~/.claude/agents/`に配置

![[Pasted image 20260324235421.png]]

### settions.json
- `.claude`ディレクトリ内の`settings.json`では，Claudeに許可されている操作と許可されない操作を制御する
- Claudeが実行できるツール，読み取れるファイル，特定のコマンドを実行する前に許可を求める必要があるかどうかなどを定義する
- 例
```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "allow": [
      "Bash(npm run *)",
      "Bash(git status)",
      "Bash(git diff *)",
      "Read",
      "Write",
      "Edit"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Bash(curl *)",
      "Read(./.env)",
      "Read(./.env.*)"
    ]
  }
}
```

- `$schema`
	- VSCodeまたはCursorでのオートコンプリートとインライン検証を有効にする
	- 必ず含める
- `allow` List
	- Claudeが確認を求めずに実行できるコマンドが含まれる
	- ほとんどのプロジェクトでは、適切な許可リストには以下の項目が含まれる
		- `Bash(npm run *)` または `Bash(make *)` を使用すれば、Claude は自由にスクリプトを実行できる
		- 読み取り専用のgitコマンドにはBash(git \*)を使用する
		- ファイル操作のための読み取り、書き込み、編集、Glob、Grep
- `deny` List
	- いかなる場合でも完全にブロックされるコマンドが含まれる
	- 適切な拒否リストは、以下のコマンドをブロックします。
		- `rm -rf` のような破壊的なシェルコマンド
		- `curl`のような直接ネットワークコマンド
		- `.env` や `secrets/` 内のあらゆるものなどの機密ファイル
- どちらのリストにも乗っていな場合，Claudeは先に確認してから先に進む

- 個人設定の上書きには `settings.local.json`を使用する
	- `CLAUDE.local.md`と同じ考え方
	- コミットしたくない権限変更については、`.claude/settings.local.json`を作成する
	- これは自動的に gitignore される

### Global `~/.claude/`
- すべてのプロジェクトで Claudeのセッションごとに読み込まれる
- 個人のコーディング原則、好みのスタイル、またはどのリポジトリにいても Claude に記憶させておきたいことを記述するのに最適な場所

- `~/.claude/projects/`
	- プロジェクトごとにセッションの記録と自動メモリが保存される
	  - Claudeは，動作中に発見したコマンド，観察したパターン，アーキテクチャに関する洞察などを自動的にメモとして保存
  - これらのメモはセッション間で保持される
  - `/memory` コマンドを使用して、メモを閲覧および編集できる

- 通常、これらを手動で管理する必要はない
	- しかし、Claudeが指示していないことを「記憶」しているように見える場合や、プロジェクトの自動記憶を消去して最初からやり直したい場合などに、これらの存在を知っておくと便利


## セットアップ
### 1. /init を実行
- プロジェクトを読み込んで starter CLAUDE.md が生成される
- それを編集し，必要最低限の内容に絞り込む

### 2. settings.json を編集
- `.claude/settings.json`にシステムに適した許可，拒否ルールを追加する
- 最低限，実行コマンドは許可し，`.env`ファイルの読み取りは拒否する

### 3. 頻繁に使用するワークフローに対応する commands を１つか２つ作成する
- コードレビューや問題修正は良い出発点となる

### 4. CLAUDE.md が混雑してきたら rules/ に分割し始める
- 適切なパスで範囲を指定する

### 5. Global CLAUDE.md を作成し，個人的な好みを記述する
- 例えば、「実装よりも型を先に記述する」や「クラスベースのパターンよりも関数型パターンを優先する」といった内容

- skill や agents が必要になるのは、繰り返し発生する複雑なワークフローをパッケージ化する価値がある場合

## 参照リンク
- https://x.com/akshay_pachaar/status/2035341800739877091
