---
title: Agent Tools
date: 2026-03-29
update: 2026-03-29
draft: false
tags:
  - AI
  - Agent
description: AI エージェントにおける Tool の役割、引数の扱い、実装例を整理する。
---
## 要素
- 基本的な要素は次の３つ
	1. **引数（型ヒント）**：引数と戻り値の型。LLMが引数の形式を理解する
	2. **docsting**：LLMへの説明書。LLMがいつ使うかを判断する
	3. **戻り値**：必ず文字列で返す。LLMが結果を解釈し，回答に組み込む

例）
```python
def get_weather(
	city: str,
	date: str = "today"
) -> str:
	"""指定した都市の天気を取得します。
	
	Args:
	city: 都市名（例: tokyo）
	date: 日付（デフォルト: today）
	"""
	
# 実装...
return f"{city}: 晴れ"
```


## 引数（Argument）
- 引数のパターンとしては次のようなものがある
	1. **引数なし**
	2. **必須引数**
	3. **オプション引数**
	4. **複数の型**
	5. **リスト引数**
	6. **選択肢を限定**

- ベストプラクティスとしては以下がある
	- 引数は３つ以下
	- オプション引数にはデフォルト値を設定する
	- 複雑な構造は避ける


### 1. 引数なし
```python
def get_current_time() -> str:
    """現在の日時を取得します。
    
    Returns:
        現在の日時（例: 2025年4月1日 14:30）
    """
    from datetime import datetime
    return datetime.now().strftime("%Y年%m月%d日 %H:%M")
```

### 2. 必須引数
```python
def search_wikipedia(query: str) -> str:
    """Wikipediaで検索します。
    
    Args:
        query: 検索キーワード（例: "東京タワー", "Python"）
    """
    import requests
    url = f"https://ja.wikipedia.org/api/rest_v1/page/summary/{query}"
    response = requests.get(url)
    if response.status_code == 200:
        return response.json().get("extract", "情報なし")
    return f"「{query}」が見つかりませんでした"
```

### 3. オプション引数
- デフォルト値つき
```python
def get_weather(
    city: str,
    units: str = "celsius"  # デフォルト値あり
) -> str:
    """天気を取得します。
    
    Args:
        city: 都市名（例: Tokyo, Osaka）
        units: 温度単位。"celsius"（摂氏）または"fahrenheit"（華氏）
    """
    # 実装...
    return f"{city}: 25℃" if units == "celsius" else f"{city}: 77°F"
```

### 4. 選択肢を限定（Literal）
```python
from typing import Literal

def translate(
    text: str,
    target_language: Literal["ja", "en", "ko", "zh"]  # 4択に限定
) -> str:
    """テキストを翻訳します。
    
    Args:
        text: 翻訳するテキスト
        target_language: 翻訳先言語
            - "ja": 日本語
            - "en": 英語
            - "ko": 韓国語
            - "zh": 中国語
    """
    # 実装...
    return f"[{target_language}] {text}"
```


### 5. リスト引数
```python
def send_notification(
    recipients: list[str],
    message: str
) -> str:
    """複数の宛先に通知を送信します。
    
    Args:
        recipients: 送信先のリスト（例: ["user1", "user2"]）
        message: 送信するメッセージ
    """
    return f"{len(recipients)}人に送信しました: {message}"
```


## docstring
- docstingはLLMに正しく理解させることが重要
	- 何ができるかを１行で説明
	- 引数の意味を説明する。`Args:`セクション
	- 具体例を示す
	- 制約を示す（上限，形式など）

```python
def search_restaurants(
    location: str,
    cuisine: str = "all",
    price_range: Literal["$", "$$", "$$$", "$$$$"] = "$$",
    open_now: bool = True
) -> str:
    """指定した条件でレストランを検索します。
    
    ユーザーが「近くのレストラン」「イタリアン食べたい」などと
    言ったときに使用してください。
    
    Args:
        location: 検索する場所。都市名や駅名を指定。
                  例: "渋谷", "新宿駅", "Tokyo"
        cuisine: 料理のジャンル。
                 例: "japanese", "italian", "chinese", "all"
        price_range: 価格帯。
                     - "$": 〜1000円
                     - "$$": 1000〜3000円
                     - "$$$": 3000〜5000円
                     - "$$$$": 5000円以上
        open_now: Trueの場合、現在営業中の店舗のみ表示
    
    Returns:
        検索結果のレストラン情報（最大5件）
    
    Note:
        位置情報が曖昧な場合は、ユーザーに確認してから呼び出してください。
    """
    # 実装...
```

## エラーハンドリング
- ツールが失敗したときのため，エラーは適切に処理するようにする
- エラーメッセージも `str` で返すようにすると，LLMはユーザーに適切に伝えることができる

```python
def get_weather(city: str) -> str:
    """天気を取得します。
    
    Args:
        city: 都市名（例: Tokyo）
    """
    import requests
    
    try:
        # API呼び出し
        response = requests.get(
            f"https://api.weather.com/{city}",
            timeout=10  # タイムアウト設定
        )
        
        # ステータスコードチェック
        if response.status_code == 404:
            return f"エラー: 「{city}」という都市が見つかりません。都市名を確認してください。"
        
        if response.status_code != 200:
            return f"エラー: 天気情報を取得できませんでした（コード: {response.status_code}）"
        
        # 正常処理
        data = response.json()
        return f"{city}の天気: {data['condition']}、気温{data['temp']}℃"
    
    except requests.Timeout:
        return "エラー: 接続がタイムアウトしました。後でもう一度お試しください。"
    
    except requests.ConnectionError:
        return "エラー: ネットワーク接続に問題があります。"
    
    except Exception as e:
        return f"エラー: 予期しない問題が発生しました - {str(e)}"
```


## Google ADK の組み込みツール
- 詳細はここから
	- https://adk-labs.github.io/adk-docs/ja/tools/built-in-tools/
- 主に次のようなものがある
	- `google_search`：Google検索を実行
	- `code_execution`：Pythonコードを実行


## 参照リンク
- 
