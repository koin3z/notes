---
title: Neovim
date: 2025-12-06
update: 2025-12-06
draft: false
tags:
  - Neovim
  - Editor
aliases:
  - memos/neovim
description: Neovim のインストールと LazyVim 連携のメモ。
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

| **動作**          | **キー操作**                          | **補足**                                                 |
| --------------- | --------------------------------- | ------------------------------------------------------ |
| **開閉 (Toggle)** | `<leader>` + `e`                  |                                                        |
| **ファイルを開く**     | `Enter`                           |                                                        |
| **プレビュー**       | `P` (Shift + p)                   |                                                        |
| **前のタブへ**       | `S-h` (Shift + h)                 | 左 (Left) へ移動                                           |
| **次のタブへ**       | `S-l` (Shift + l)                 | 右 (Right) へ移動                                          |
| **タブを閉じる**      | `<leader>` + `b` + `d`            | **B**uffer **D**elete                                  |
| **他のタブを閉じる**    | `<leader>` + `b` + `o`            | **B**uffer **O**nly (自分以外閉じる)                          |
| **タブ固定 (Pin)**  | `<leader>` + `b` + `p`            | VS Codeの「ピン留め」と同じ                                      |
| **表示/非表示**      | `Ctrl` + `/`                      | フローティングターミナルを開閉                                        |
| **履歴をスクロール**    | ターミナルが開いた状態で `Esc` (または `Esc` 2回) | これで「ノーマルモード」になり、`k` や `PgUp` でログを上にスクロールできます。戻る時は `i`。 |
| **Lazygitを開く**  | `<leader>` + `g` + `g`            | LazyGitを呼び出す                                           |
| **縦に分割**        | `<leader>` + `\|`                 | 左右に分割                                                  |
| **横に分割**        | `<leader>` + `-`                  | 上下に分割                                                  |
| **フォーカス移動**     | `Ctrl` + `h` / `j` / `k` / `l`    | マウスで隣のウィンドウをクリックする代わり                                  |
| **ウィンドウを閉じる**   | `<leader>` + `w` + `d` (または `:q`) | 分割を閉じる                                                 |
| **ファイル検索**      | `<leader>` + `f` + `f`            |                                                        |

#### Neo-tree
- **`a`**: 新規ファイル・ディレクトリ作成 (Add)
    - `filename.txt` と入力すればファイル、`folder/` と入力すればフォルダになります。
- **`d`**: 削除 (Delete)
- **`r`**: 名前変更 (Rename)
- **`y`**: ファイル名をコピー
- **`?`**: ヘルプを表示 (操作一覧が見られます)
- `Ctrl + /`でターミナル表示


## 参照リンク
- https://neovim.io/doc/install/
