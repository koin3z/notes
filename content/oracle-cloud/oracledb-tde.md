---
title: TDE - Oracle DB
date: 2026-01-09
update: 2026-01-09
draft: false
tags:
  - 
aliases:
  - 
description: このページの内容についての簡単な説明
---

- TDEのセキュリティ強度は，マスター暗号化キー（MEK）とそれを保護するキーストア（Wallet）の管理に依存する
- OCIでは，この管理形態として以下２つの方法がある
	- Oracle Wallet
		- ファイルベースで管理する，デフォルトの構成
		- DBシステムのローカルファイルシステムに，`ewallet.p12`（PKCS#12形式）および `cwallet.sso`（Auto-login形式）として保存される。
		- オンプレミスの構成と最も近い。
	- OCI Vault
		-  外部キーストア構成。
		- マスターキーをOCIのフルマネージドKMS（Vault）に保管し、データベースはAPI経由でキーを取得する。
		- セキュリティポスチャは高いが、移行時にオンプレミスのキーをVaultにインポートする追加手順が必要となる。

- TDEのほか，ライセンスについては以下を参照
- https://docs.oracle.com/en/database/oracle/oracle-database/26/dblic/Licensing-Information.html#GUID-0F9EB85D-4610-4EDF-89C2-4916A0E7AC87__GUID-B8A99315-D5F4-49BB-AC6F-6D9FFC50CC57

## 参照リンク
- https://docs.oracle.com/en/database/oracle/oracle-database/26/dbtde/introduction-to-transparent-data-encryption.html
