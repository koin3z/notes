---
title: Neovim
date: 2025-12-06
update: 2025-12-06
draft: false
tags:
  - 
aliases:
  - 
description: Neovim
---
## インストール

- 環境は `Ubuntu 24.04.3 LTS`

- `snap`か`apt`でインストールできるが，バージョンは異なるので注意

```shell
→ nvim
Command 'nvim' not found, but can be installed with:
sudo snap install nvim    # version v0.11.5, or
sudo apt  install neovim  # version 0.7.2-8
```

- 最新バージョンがほしかったので，今回は`appimage`で取得する
	- クリップボード関連の問題を解消したく，Neovim v0.10からはOSC 52が標準で組み込まれているらしいので。
	- DLリンクは以下から入手
		- https://github.com/neovim/neovim/releases/tag/v0.11.5
	- 

```shell
→ wget https://github.com/neovim/neovim/releases/download/v0.11.5/nvim-linux-arm64.appimage
→ chmod u+x nvim-linux-arm64.appimage

# これでneovimが立ち上がる
→ ./nvim-linux-arm64.appimage 
```

`.bashrc`に以下aliasを設定

```shell
alias nvim=~/.config/nvim/nvim-linux-arm64.appimage
```

- `~/.config/nvim/init.lua`に以下の設定を行う
	- これは，v0.10以上じゃないとエラーが出るので注意

```lua
-- システムクリップボードへのコピーにOSC 52を使用する設定
vim.g.clipboard = {
  name = 'OSC 52',
  copy = {
    ['+'] = require('vim.ui.clipboard.osc52').copy('+'),
    ['*'] = require('vim.ui.clipboard.osc52').copy('*'),
  },
  paste = {
    ['+'] = require('vim.ui.clipboard.osc52').paste('+'),
    ['*'] = require('vim.ui.clipboard.osc52').paste('*'),
  },
}
vim.opt.clipboard = "unnamedplus"
```

- コマンドをグローバルに使いたい場合は以下も行う

```shell
mkdir -p /opt/nvim
mv nvim-linux-x86_64.appimage /opt/nvim/nvim

export PATH="$PATH:/opt/nvim/"
```


## プラグイン

### Plugin Manager (LazyVim)
- いろいろあるが，`lazy.vim`が今のデファクトスタンダードらしい
	- https://www.reddit.com/r/neovim/comments/1h1ysln/what_plugin_manager_to_choose/?tl=ja
- `lazyVim`
	- https://github.com/LazyVim/LazyVim
- [[lazyvim]] 参照
### Snack Nvim

- `Ctrl + /`でターミナル表示

- `<leader>` + `g` + `g`でLazyGitを呼び出す

- `<leader>` + `f` + `f`でファイル検索

## 参照リンク
- https://neovim.io/doc/install/
