---
title: "Claude用量を追跡するChrome Extensionを作った"
subtitle: "作業中にrate limitに引っかかったので、用量を見張る橘虎斑を作った。"
description: "公式用量APIとリアルタイムtoken傍受を同時に走らせるChrome Extension開発実録、市場調査から三言語国際化までの完全プロセス。"
abstract: |
  Claudeのヘビーユーザーが最も恐れるのは、会話の途中でrate limitにぶつかることだ。市場には十数個の用量追跡ツールがあるが、ほぼ全てがmacOSネイティブアプリで、単一データソースのみ追跡、中国語インターフェースなし。この記事では、Claudeと協作してChrome Extensionを開発した過程を記録する——公式APIとリアルタイムtoken傍受の二つのパイプラインを同時に走らせ、用量差異を可視化する。isolated worldでのハマり、API形式の推測、iconの三回イテレーションまで、完全な開発体験。
date: 2026-03-19
updated: 2026-03-19
pillar: ai
tags:
  - Chrome Extension
  - Claude
  - AI 協作開発
  - 開発紀実
cover: "/images/covers/claude-usage-nyan-chrome-extension.jpg"
featured: false
draft: false
readingTime: 7

# === AI / Machine 専用欄位 ===
thesis: "公式用量APIとリアルタイムtoken傍受の二つのパイプラインを同時に走らせ、Claudeの用量差異を可視化する。"
domain_bridge: "AIツール開発 × Chrome Extension × プロダクト設計"
confidence: high
content_type: case-study
related_entities:
  - name: Anthropic
    type: Organization
  - name: Claude
    type: Concept
  - name: Chrome Extension MV3
    type: Framework
reading_context: |
  Claude Pro/Maxユーザー、AIツール開発に興味のある開発者、Chrome Extension実装詳細を知りたい人に適している。非技術読者も読めるが、技術部分はスキップ可能と標記。

---

作業中にrate limitに引っかかるのは、おそらくClaudeユーザーにとって最も煩わしい瞬間である。

私の従来の習慣は、ブロックされてからSettingsページで用量を確認し、そこで初めて追加用量が84%、7日間用量も半分を超えていることに気づくというものだった。この数字が画面上で見られたらどんなにいいだろうと思った。

そこで、この問題を解決するChrome Extensionを作った。「Claude用量にゃんにゃん」と名付け、ツールバーに橘虎斑が座っていて、クリック一つで使用量がわかる。

## 何をするものか

インストール後、三箇所で用量を確認できる。

ツールバーの橘猫iconに小さなbadgeが表示され、4秒ごとに自動的にローテーションで切り替わる——5時間セッションでどれだけ使ったか、7日間でどれだけ使ったか、追加creditsがどれだけ残っているか、リアルタイムでいくら消費したか。緑は安全、黄色は注意、オレンジは限界近し、赤は爆発寸前を表す。何もクリックする必要がなく、一瞥するだけでわかる。

popupをクリックすると完全な用量カードが表示される。上半分はAnthropicの公式数値：5時間セッション百分率、7日間用量百分率、追加用量の使用済みと上限、それぞれにリセットカウントダウン付き。下半分はリアルタイムtoken追跡：先ほどの会話でどれだけのinput token、output tokenを使い、いくら費用がかかったか、どのモデルを使ったかを全て列挙する。

claude.aiページの右下には半透明の浮動ステータスバーもあり、用量概要を常駐表示する。猫の頭をクリックで収納可能。

![Claude用量にゃんにゃんのpopupインターフェース、公式用量とリアルタイムtoken追跡を表示](/images/articles/claude-usage-nyan-popup.png)
*popupクリック時の完全画面：上半分は公式用量、下半分はリアルタイムtoken追跡。*

## 二つのパイプライン、差異を見る

このツールが他の追跡器と最も異なる点は、二つのデータパイプラインを同時に走らせることである。

一つ目は公式のもの。Extensionが5分ごとにclaude.aiのusage APIを呼び出し、取得した数値は自分でSettingsページを見るのと全く同じ。この数値は権威的だが遅延がある——Anthropic側の更新はリアルタイムではなく、明らかに多く使っているのに百分率が動かないことがある。

二つ目はリアルタイム推算。ExtensionがClaudeaiページ内でClaudeとの会話API呼び出しを傍受し、request送信時にinput tokenを推定、response streaming時にoutput tokenを累積加算し、モデル価格に基づいて費用を計算する。これはリアルタイムだが推定値で、公式数値との誤差がある。

両者を並べることで、公式の百分率と実際に消費したtokenの差がどれくらいかを自分で観察できる。このツールを作る目的の一つは、この差異を可視化することだった。

## 着手前の市場調査

プログラミングを始める前に、市場の既存ツールを調査した。

結果として、この小ツールは既に多数存在し、私が見つけただけでも十個を超えていた。しかしほぼ全てがmacOSのネイティブアプリで、.dmgダウンロード・インストールが必要で、WindowsやLinuxユーザーには選択肢がない。しかも大部分は公式用量追跡かリアルタイムtoken計算のどちらか一方のみで、両方を組み合わせているものはない。全てのインターフェースが英語で、アジア市場の現地化オプションは皆無だった。

そこで私のポジショニングは明確になった：Chrome Extensionでクロスプラットフォーム化、二つのパイプライン同時実行、中国語優先。後に英語と日本語インターフェースも追加し、Chromeがブラウザ言語に応じて自動切り替えするようにした。

## 開発過程で踏んだいくつかの落とし穴（技術に興味がなければ直接スキップ可）

開発全体はClaudeとの対話で完成させたが、過程は順風満帆ではなかった。

最初の落とし穴はAPI形式。AnthropicのusageAPIには公開ドキュメントがなく、形式を推測するしかなかった。最初の接続時、popupは生のJSONを吐き出した。しかしこのJSON塊自体が答えだった——five_hour.utilization、seven_day.resets_atといったフィールド名を見て、すぐに解析方法がわかった。そこで「Claude」は故意にpopupにdebugモードを残した：解析失敗時は生のJSONを直接表示し、将来API形式が変わっても迅速に修正できるようにした。

二つ目の落とし穴はより興味深い。Chrome Extensionのcontent scriptはisolated worldと呼ばれる分離環境で動き、そこでwindow.fetchにpatchを当ててclaude.aiのAPI呼び出しを傍受しようとしたが、何も傍受できなかった。時間をかけてようやく理解した：isolated worldのwindowとページ本体のwindowは異なるオブジェクトなのだ。解決法はChrome MV3のworld: "MAIN"設定を使い、傍受スクリプトを直接ページのcontextに注入し、CustomEvent経由でデータをisolated worldのブリッジ層に伝送することだった。一つの問題を二層で解決した。

三つ目の落とし穴はicon。三回イテレーションした——初回は平凡すぎ、二回目は円形に収めたが猫と認識できず、三回目で橘虎斑の写真を参考として提供し、「耳が外向きに開いて、M字額紋がある」と指定してようやく納得のいくものになった。このようなことは仕様で記述するのが困難で、参考画像一枚の方が百の説明より有用である。

## 制限を先に明確にしておく

AnthropicのusageAPIには公開ドキュメントがなく、形式はいつでも変更される可能性がある。変更されればこのExtensionも更新が必要で、維持者がいなければ動作しなくなる。リアルタイムtokenは推定値で、精確な数値ではない。英語は約4文字で1token、中国語は約1.5文字で1tokenだが、これはAnthropicの実際のtokenizerとは差がある。

追跡対象はclaude.aiのウェブ版のみ。Claude Code CLIを使用している場合、異なるチャネルを経由するためこのExtensionでは捕捉できない。

Extensionはclaude.aiのsession cookieを読み取ってAPIにアクセスする必要がある。全てのデータはブラウザローカルにのみ保存され、外部サーバーには送信されず、完全オープンソース。ただし、あらゆるExtensionインストール前のリスク判断は基本である。

---

インストール方法は簡単：GitHub repoをclone、Chrome開発者モード、フォルダ読み込み、三ステップ。繁体中国語、英語、日本語インターフェース対応。

🔗 https://github.com/zarqarwi/claude-usage-nyan