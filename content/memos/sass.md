---
title: SASS
tags:
  - CSS
---
> [!abstruct] 参照リンク
> - [Sass - Wikipedia](https://ja.wikipedia.org/wiki/Sass)
> - [Sass: Syntactically Awesome Style Sheets](https://sass-lang.com/)
> - [Sass Introduction](https://www.w3schools.com/sass/sass_intro.asp)

## SASSとは
- Syntactically Awesome Style Sheets の略
- 2006年に登場したCSSのプリプロセッサ
- CSSの拡張機能で，すべてのCSSバージョンと互換性を持つ
- Rubyで実装されるOSSだが，PHPやC++，Javaの実装も存在する


## 特徴
- 主に次のような機能を持つ
	- 変数
	- ネスト
	- ミックスイン：再利用できるスタイルの部品を定義できる
	- 継承：他のスタイル定義を引き継げる
	- 関数・条件分岐
- 2種類の構文がある
	- **SCSS**（`*.scss`）
		- CSSに似た構文で一般的に使用される
		- cssのスーパーセットで，cssはすべてscssとしても有効
	- **SASS**（`*.sass`）
		- 中括弧の代わりにインデントでブロックを表す。
		- あまり現在は使われない。
- 最終的にはCSSにコンパイル（トランスパイル）される
	- Visual Studio に [Live Sass Compiler](https://marketplace.visualstudio.com/items?itemName=glenn2223.live-sass) というプラグインがあり，scssファイルを保存するたびに同じ名前のcssファイルにコンパイルしてくれる
- 次のような場合に有効
	- 大規模プロジェクトのファイル構造管理
	- レスポンシブ対応
	- テーマ切り替え機能
	- パフォーマンス最適化
	- チーム開発時の一貫性保持

## SCSS
- Sassy Cascading Style Sheets の略
- CSSの拡張機能でCSSと完全互換性を持つ
	- そのため，CSSファイルをそのままSCSSファイルとしてコピペしても動く
- sass（Syntactically Awesome Style Sheets）の2つの文法のうちの一つ

- `*.scss`ファイルは最終的にブラウザに対応するCSSファイルにコンパイルされる

 > [!abstruct] 参照リンク
> - [What Is SCSS? A Beginner's Guide for Developers - Upwork](https://www.upwork.com/resources/what-is-scss)
>

