---
title: Vim コマンド
date: 2026-01-11
update: 2026-01-11
draft: false
tags:
  - Vim
  - Editor
aliases:
  - memos/vi-cmd
description: Vim の移動、検索、編集コマンドを整理する。
---

## 移動
### `w`, `e`, `b`
- 記号や空白で区切られた文字の集まりをWordという

- `w`は次のwordの先頭にジャンプ
- `e`は今のwordの最後にジャンプ
- `b`は前のwordの先頭にジャンプ

- 大文字もあり，これはスペース区切りのみのより大きな括りで移動ができる

### `f{char}`，`t{char}`
- `f`は次の`{char}`の真上にジャンプ
- `t`は次の`{char}`の直前にジャンプ

- 大文字の`F`や`T`では左にジャンプする

### `*`, `n`
- `*`でカーソル下の単語を検索し，`n`で次の結果にジャンプ
- `g*`で部分一致で検索
- `N`で前にジャンプする
- `/{pattern}`で文字検索


## 範囲で操作する

### `{select}x`, `d{motion}`
- 文字を消す
- `{select}x`は選択範囲を削除
- `d{motion}`はカーソルが一回動いた部分を消す
	- `dh`はback space
	- `dl`はdelete

### `{select}y`, `y{motion}`
- 文字をコピー（ヤンク）する

### `{select}c`, `c{motion}`
- 文字を消してInsertに移る

### `{select}U`, `gU{motion}`
- 文字を大文字にする

## Text Objects
- motionの指定する特殊な方法
- カーソルがあるところをなにかを範囲内とみなし，コマンドを実行

- 基本的に 「命令」+「a | i」+「範囲」 の3文字で構成される
	- di"
		- delete inner ""
	- gUaw
		- go upper a word
- `a`：範囲ごと
- `i`：範囲内

- 範囲は様々
	- word：`w`
	- `"`や`{`
	- html tagの`t`
	- ...

## 繰り返す
### `.`
- 直前のコマンドを再実行する
	- 直前にxだったらxになる
	- 直前にA;だったらA;になる
	- 直前にgUiwだったら，gUiwになる

- 1コマンドは「1変更」
	- 画面のテキストが変わる瞬間が1変更
	- `d{motion}`は`[motion]`込みで繰り返す
	- 移動は「.」に影響しない
		- `w`や`t`の移動は繰り返せない
	- Insert-modeは出るまでが1変更
		- 変更内容（Insertでの操作）も繰り返すことができる

- カーソルや文字に左右されないコマンドにする
	- どこまで消すか，まとまりを意識する
	- TextObjectsを使う
## 参照リンク
- https://www.youtube.com/watch?v=UP0oV_1Q0Q8
