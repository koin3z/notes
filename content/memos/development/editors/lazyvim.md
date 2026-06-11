---
title: LazyVim
date: 2025-12-06
update: 2025-12-06
draft: false
tags:
  - Neovim
  - LazyVim
  - Editor
aliases:
  - memos/lazyvim
description: LazyVim のインストール、フォント設定、プラグイン管理のメモ。
---
## インストール

- `LazyVim`をインストールする
	- 日本語の`README.md`もある
		- https://github.com/LazyVim/LazyVim/blob/main/README-JP.md
```shell
mv ~/.config/nvim ~/.config/nvim.bak
git clone https://github.com/LazyVim/starter ~/.config/nvim # nvim/の中はカラにしておく必要がある
rm -rf ~/.config/nvim/.git
```

- 起動する
```
nvim
```

- 起動するとインストールが始まる
![[Pasted image 20251206232014.png]]
![[Pasted image 20251206232043.png]]


## Font設定

- フォントが設定されていないので，これを修正する
- https://www.nerdfonts.com/font-downloads にアクセスして，「JetBrainsMono Nerd Font」をDL
- `zip`ファイルを展開して，`.ttf`ファイルを右クリック。「インストール」を選択
![[Pasted image 20251206232939.png]]

- Terminalのフォント設定から，インストールしたフォント「Nerd Font」を選択する
	- インストールしたフォントを反映するため，Terminalは再起動する
![[Pasted image 20251206233235.png]]

- nvimを立ち上げて，無事表示されることを確認する
![[Pasted image 20251206233356.png]]


## 管理画面

- `:Lazy`でインストールされているプラグインなどを確認できる管理画面に移動できる

![[Pasted image 20251206234021.png]]

## Plugin

- プラグインは`lua/plugins`にluaファイルを追加していく（ファイル名は自由）
	- プラグインごとにファイルを作ってもいいし，一つのファイルにまとめてもいい

## 参照リンク
- 
