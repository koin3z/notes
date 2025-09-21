---
title: SOC2
tags:
  - Security
  - Compliance
---
> [!abstruct] 参照リンク
> - [サービスの統制を保証する「SOC2」の概要をざっくりまとめてみた | DevelopersIO](https://dev.classmethod.jp/articles/soc2_overview/)
> - [Sass: Syntactically Awesome Style Sheets](https://sass-lang.com/)
> - [Sass Introduction](https://www.w3schools.com/sass/sass_intro.asp)

## SOC2とは
- Service Organization Control Type 2 の略
- 米国公認会計士協会（AICPA）が定めたサイバーセキュリティのフレームワークの1つ

SOC2 保証報告書は、米国公認会計士協会（AICPA）が定めたTrustサービス規準に基づいて提供されます。Trustサービス規準は、「セキュリティ」「可用性」「処理のインテグリティ」「機密保持」「プライバシー」の5つから構成され、この中から一つまたは複数の規準を選択し、評価が提供されます。


## SOCの種類
### SOC
そもそもSOCにはSOC1，SOC2，SOC3の３つがある。
- **SOC1**
	- その会社の財務報告に関連する内部統制の評価
	- 情報システムを委託している顧客（ユーザー）が財務諸表監査にあたって内部統制の監査を受けた際に、事業者側の内部統制の情報としてSOC1の報告書を利用することができます。
- **SOC2**
	- 企業が監査してほしいサービスやシステムを対象に、セキュリティや可用性などの統制を評価
	- 具体的には「セキュリティ」「可用性」「処理のインテグリティ」「機密保持」「プライバシー」の5つの指標があり、この中から任意の項目について評価を受けます。
- **SOC3**
	- SOC2と評価する規準は変わりませんが、前述のとおり、広く公開することを目的とします。そのためSOC2と比べ報告書は簡潔なものとなります。
	- SOC3は公開情報なので誰でもDLできる
		- [OCI (For the Period April 1, 2024 to September 30, 2024)](https://www.oracle.com/a/ocom/docs/oci-soc-3-report.pdf)
		- [AWS (For the Period April 1, 2024 to March 31, 2025)](https://d1.awsstatic.com/whitepapers/compliance/AWS_SOC3.pdf)



### Type
加えて，SOC1，SOC2には次の２つのTypeがある。
- Type1
	- 特定の時点における組織の標準システム及びプロセスを元に監査
- Type2
	- 一定期間（６ヶ月以上）の機関における組織の標準システム及びプロセスの監査
	- 取得の難易度はこちらのほうが当然高い

