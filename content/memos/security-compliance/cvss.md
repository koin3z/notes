---
title: CVSS
date: 2026-01-09
update: 2026-01-09
draft: false
tags:
  - Security
  - Vulnerability
  - CVSS
aliases:
  - memos/cvss
description: CVSS の評価基準、問題点、参照リンクを整理する。
---
- 共通脆弱性評価システム CVSS (Common Vulnerability Scoring System)
- 脆弱性そのもの深刻度を0~10の値で示している

- FIRST（Forum of Incident Response and Security Teams）が管理母体として選出されており，CVSS-SIG (Special Interest Group) で適用推進や仕様改善が行われている
https://www.first.org/cvss/


## 評価
- CVSSは次の３つの基準で脆弱性を評価する
	1. 基本評価基準
	2. 現状評価基準
	3. 環境評価基準
- また，これに加え，補助基準
	- Supplemental Metric Group

- **基本評価基準 (Base Metrics)**
	- 脆弱性そのものの固有の特性を評価
	- 時間や環境で変化しない静的な評価
		- 攻撃元区分（AV）
		- 攻撃条件の複雑さ（AC）など
	- CVSSスコアは一般にこのスコアを指す

- **現状評価基準 (Temporal Metrics)**
	- 脆弱性の悪用状況
	- 脆弱性への対応状況に応じて、時間とともに変化する動的な要素
		- 攻撃コードの成熟度（E）など

-  **環境評価基準 (Environmental Metrics)**
	- 脆弱性が存在する特定のIT環境における影響度
	- 組織ごとのコンテクストを反映するための項目
		- 機密性（CR）
		- 完全性（IR）
		- 可用性（AR）
	- この評価をすべてのアセットに対して正確に行うのは難しい

## 基本評価基準
- AV: Access Vector（攻撃元区分）
- AC: Access Complexity（攻撃条件の複雑さ）
- Au: Authentication（攻撃魔の認証要否）
- C: Confidentiality Impact（機密性への影響）
- I: Integrity Impact（完全性への影響）
- A: Availability Impact（可用性への影響）

## 問題点
- 脆弱性の技術的な深刻度そのものの情報を示すものであり，実際の「脅威」や「環境」などの情報は含まれない
- 


## 参照リンク
- https://www.ipa.go.jp/security/vuln/scap/cvss.html
- https://help.vuls.biz/glossary/cvss_problem/
- https://www.nti.co.jp/blog/blog25081201/
- https://www.k-friendly.com/24077