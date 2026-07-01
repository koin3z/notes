---
title: AGENTS
date: 2026-06-28
update: 2026-07-02
draft: false
tags:
  - 
aliases:
  - 
description: このページの内容についての簡単な説明
---

# Repository Guidelines

## Project Structure & Module Organization

This repository is a Quartz 4 digital garden. Site content lives in `content/` as Markdown, organized by topic such as `content/memos/`, `content/oracle-cloud/`, `content/qiita/`, and `content/quartz/`. Static note assets live in `attachments/`; Quartz copies publishable output into `public/`, which is generated build output. Framework, build, and theme code live in `quartz/`, with components in `quartz/components/`, plugins in `quartz/plugins/`, utilities in `quartz/util/`, and styles in `quartz/styles/`. Site configuration is in `quartz.config.ts`; layout is in `quartz.layout.ts`.

## Build, Test, and Development Commands

- `npm ci`: install pinned dependencies from `package-lock.json` using Node `v22.16.0`.
- `npx quartz build`: build the production site into `public/`; GitHub Pages CI uses this.
- `npx quartz build --serve`: build and serve a local preview while editing content or layout.
- `npm run check`: run TypeScript checks with `tsc --noEmit` and verify Prettier formatting.
- `npm test`: run TypeScript tests through `tsx --test`.
- `npm run format`: apply Prettier formatting across the repository.

## Coding Style & Naming Conventions

Use TypeScript strict mode for Quartz code. Prettier is the formatting source: 2-space indentation, 100-character print width, trailing commas, and no semicolons. Prefer existing Quartz patterns for Preact components, plugins, and utilities. Name tests as `*.test.ts` and keep them near the code they exercise, as in `quartz/util/path.test.ts`. For Markdown content, use descriptive filenames; kebab-case is preferred for English slugs, while topic-specific or Japanese titles are acceptable.

## Testing Guidelines

Add or update tests when changing reusable logic under `quartz/util/`, parsers, path handling, or plugin behavior. Run `npm test` for unit tests and `npm run check` before handing off code changes. For content-only edits, run `npx quartz build` when links, frontmatter, assets, or rendering may be affected.

## Commit & Pull Request Guidelines

Recent history uses automated commit messages like `vault backup: 2026-06-07 20:44:01`. For manual commits, keep messages short and scoped, for example `content: add OCI vault notes` or `quartz: update backlinks styling`. Pull requests should summarize changes, list validation commands, link related issues, and include screenshots for visible layout or theme changes.

## Security & Configuration Tips

Do not commit secrets, private notes, or local-only Obsidian settings. Keep generated directories such as `public/`, `node_modules/`, and `.quartz-cache/` out of review unless a task explicitly requires generated artifacts.

## Codex Knowledge Reuse

Before a non-trivial investigation, read `docs/codex/README.md` and the relevant
knowledge files. Record only durable, repository-specific knowledge; do not copy
chat transcripts or raw command output.

- Add research findings to `docs/codex/research-log.md`.
- Add repeatable failure diagnoses and fixes to `docs/codex/troubleshooting.md`.
- Add architectural or process choices to `docs/codex/decisions.md`.
- Update an existing entry instead of creating a duplicate.
- Separate verified facts from hypotheses, link repository paths or public sources,
  and include enough verification detail for another Codex run to reproduce the result.
- At handoff, state whether reusable knowledge was recorded. If not, briefly say why.

### Mandatory secret handling

Never store authentication credentials, API keys, tokens, cookies, Authorization
headers, private keys, passwords, or their values in `AGENTS.md`, `docs/codex/`,
examples, commands, URLs, logs, or error excerpts. Redact sensitive values before
recording anything. Keep raw or sensitive material only in ignored local paths, and
do not copy an exposed secret into the repository.
