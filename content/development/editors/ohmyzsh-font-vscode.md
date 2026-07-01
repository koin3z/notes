---
title: Oh My Zshで使うフォントをVSCodeにいれる
date: 2025-07-19
modified: 2026-06-11
draft: false
tags:
  - development/editors
aliases:
  - memos/ohmyzsh-font-vscode
  - memos/development/editors/ohmyzsh-font-vscode
description: Oh My Zsh で使う Nerd Font を VS Code に設定する手順。
---

## 現象

Oh My Zshを入れたターミナルをVSCodeで開くと
アイコンがレンダリングできないまま，「未定義文字」となり四角形で表示される。

![[Pasted image 20250719120854.png]]

## 解決

> [!success] 前提条件
> [Powerline Font](https://github.com/powerline/fonts) か [Nerd Font](https://github.com/ryanoasis/nerd-fonts) をインストールしておく。ここではNerd Fontから「MesloLGS NF」を使う。

`settings.json`に以下を追記

```
"terminal.integrated.fontFamily": "MesloLGS NF",
```

再起動したら無事，表示される。

![[Pasted image 20250719121847.png]]
