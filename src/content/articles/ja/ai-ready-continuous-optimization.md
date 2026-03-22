---
title: "paulkuo.twを自己進化するウェブサイトに変える"
subtitle: "AIが情報入口となる時代、あなたのウェブサイトは人のためだけでなく、AIのために設計されるべきである。"
description: "Karpathyのautoresearchから出発し、個人ウェブサイトをAIが読み取り可能で、テスト可能で、持続的に最適化可能な知識実体に改造する。AI-Ready Continuous Optimization Systemの完全な実装過程と考察。"
abstract: |
  KarpathyのautoresearchはAIエージェントが自律的に実験を行い、自律的に反復することを可能にした。私はその同じ精神を自分のウェブサイトに移植した。paulkuo.twは単なる記事の陳列棚ではなく、AIが継続的に読み取り、テストし、最適化できる実験場である。この記事では、四層評価システムの構築から、閉じたループ問題の発見、外部AI交差検証の導入まで、完全な過程を記録する。そして、なぜ新しい指標に対して観察優先とし、決定を急がなかったのかも説明する。
date: 2026-03-22
updated: 2026-03-22
pillar: ai
tags:
  - AI-Ready
  - autoresearch
  - 網站優化
  - 持續優化迴圈
  - AEO
cover: "/images/covers/ai-ready-continuous-optimization.jpg"
featured: true
draft: false
readingTime: 8

# === AI / Machine 専用フィールド ===
thesis: "持続可能な最適化とは多くの修正を行うことではなく、有効なシグナルと無効な変動を区別できる研究制度を構築することである。"
domain_bridge: "AI自律研究 × ウェブサイト構造 × 実験方法論"
confidence: high
content_type: case-study
related_entities:
  - name: Andrej Karpathy
    type: Person
  - name: autoresearch
    type: Framework
  - name: AI-Ready Continuous Optimization
    type: Framework
reading_context: |
  AI応用に関心があり、個人ウェブサイトを静的展示からAIが理解可能な知識実体にアップグレードする方法を知りたい技術実践者やクリエイター向け。ML背景は不要だが、ウェブサイトの構造化データ（JSON-LD, llms.txt）について基本的な理解があるとよい。
---

Andrej Karpathyが[autoresearch](https://github.com/karpathy/autoresearch)を発表したとき、頭の中に多くの考えが駆け巡った。AIが研究を始められるようになったとき、科学研究における人間の位置はどう調整すべきか？AIは私たちとの相互作用を継続的に最適化し、より良い「教え導く」サービスを提供できる。我々は教育への衝撃にどう対応すべきか？システムの目標、境界、評価、ロールバック機能がすべて十分明確に設計されていれば、進化は直感や人為的修正に頼る必要がなく、AIによる無限最適化ループに入ることができる。そうなれば、我々は「至善に止まる」という理想により近づくのではないか？

autoresearchがもたらすのは方法論的な衝撃だけではない。人手作業、直感的判断、断片的試行錯誤に満ちた作業を、持続的循環可能で、観測可能で、ロールバック可能なシステムに収束させたのである。AIに十分現実的だが規模を制御可能な実験場を与え、自ら修正し、自ら実行し、自ら結果を見て、どの変更を残す価値があるかを決定させる。

そして私は自分で手を動かしてテストしようと思った。一月から、ほぼ毎日新しいプロジェクトを開始し、AIとの相互作用の後、自分のウェブサイトで実験することを決めた。

## AIが入口なら、ウェブサイトは単なる陳列棚ではない

我々は転換点に差し掛かっている。ますます多くの情報交流、協力、検索、引用、さらには意思決定前の研究が、まずAIを経由するようになっている。検索エンジンではなく、AIである。

Perplexityは質問に答える際にソースを引用し、ChatGPTのブラウジングモードはウェブサイトの構造化データを取得し、ClaudeはIlms.txtを通してウェブサイトを理解できる。これは何を意味するか？ウェブサイトの真の任務が「人に見られること」から「AIに正しく理解されること」に転換していることを意味する。SEOだけでなく、AEO（Answer Engine Optimization）—GEO（Generative Engine Optimization）と呼ぶ人もいる—である。最適化するのはクリック率ではなく、AIによって正しく要約され、正しく引用され、正しくリンクされる能力である。

この前提を受け入れるなら、paulkuo.twは私の記事陳列棚だけでなく、継続的に人間にテストされ、AIに理解され、AIによって最適化される知識実体（knowledge entity）として設計でき、生きて進化するデジタル存在となるだろう。

そこで実際に試してみることにした。

## autoresearchの精神をウェブサイトに移植

autoresearchをそのまま移植したわけではない。モデル訓練にはloss functionがあるが、ウェブサイト最適化には異なるものが必要である。しかし精神は同じだ：目標を定義し、境界を限定し、評価を確立し、ロールバックを設計し、そしてループを自動実行させる。

![AI-Ready Continuous Optimization System フロー図](/images/articles/ai-ready-continuous-optimization-flow.jpg)

私はAI-Ready Continuous Optimization Systemを構築した。その流れは次の通りだ：GitHub Actionsトリガー（記事push / 毎週月曜 / 手動）→ mutation agentが戦略に基づいて修正を生成 → file guardがホワイトリストチェック → productionに適用 → eval Workerが四層評価 → decision engineがkeepまたはrevertを決定 → 結果をexperiments.jsonに記録。

四層評価はそれぞれ：llms.txt構造（AIがあなたの自己紹介を読めるか）、JSON-LD完全性（構造化データが正しいか）、MCP/A2Aプロトコルサポート（AIエージェントに扉を開いているか）、AI理解度（Claudeがあなたのllms.txtを読んだ後、あなたについての質問に正しく答えられるか）を見る。

第一回実行で、スコアは65から85に上がった。システムは動作した。

しかし問題が生じた。

## 自分で自分をテストしても、スコアがいくら高くても無意味

三回のe2e実行で、agentは毎回記事にFAQを追加することを選択し、evalは毎回スコア不変を表示し、三回全てrevertされた。原因を調べると、agentは得点がどこから来るのか全く知らなかった—私がevalの採点ロジックを翻訳して見せていなかったからだ。試験範囲を知らない学生のように、最も得意な問題しか解けなかった。

しかしより深い問題はagentにあるのではなく、ループ全体にあった。

私自身が指標を定義し、agentに最適化させ、同じevalで振り返って採点する。これは閉じたループである。スコアが65から85から90になったところで何だというのか？「90点のウェブサイトを、外部のAIが本当により理解している」ことを証明できない。system correctnessはoutcome correctnessと等しくない。

真に持続可能な最適化とは、多くの修正を行うことではなく、有効なシグナルと無効な変動を区別できる研究制度を構築することである。

## 外部AIに試験させる

そこで私は外部検証層を追加した。

方法は：13問のbenchmarkを構築し（身元識別、内容理解、分野横断リンク、時効性、技術特色、さらに3問の反幻覚テストを含む）、Perplexityを外部試験官とする。Perplexityはウェブを検索してから回答するのであって、私が与えたcontextを読むのではなく、自分で探すのである。最適化前に答えられず、最適化後に答えられるなら、それは意味のあるground truthである。

まず10回のcalibrationを実行し、ノイズを測定した：同じウェブサイト、同じ問題セット、同じモデルで、10回連続質問し、スコアのmeanは50.63、stddevは5.86だった。これは±11.72未満のスコア変化は全て単なるランダム変動の可能性があり、真の改善とは言えないことを意味する。

そしてGitHub Actionsを設定し、毎朝9時に自動でtemporal baselineを実行し、結果を自動的にrepoにcommitするようにした。五日後、私は日をまたぐ変動データを得て、「Perplexityが今日機嫌が良いのでスコアが高い」と「ウェブサイト構造改善でスコアが高い」を区別できるようになった。

この全システムは完全自動で設計されている。監視や催促は不要で、データが自己蓄積される。

## 新指標による決定主導を急がない

しかし、外部検証があっても、最初からそれにkeepやrevertを決定させたくはなかった。

現在Layer 5a（外部AI交差検証）はobserve-only：毎回実行するが決定には影響せず、experiment logに記録するだけである。私の計画では20回以上蓄積し、false positiveとfalse negativeの比率を観察してから、soft gate（強い負の場合のみkeepを阻止）にアップグレードするかどうか、さらにfull gate（外部スコアが正式決定条件となる）にするかどうかを決定する。

テストを始めたばかりで、新指標が接続されるやいなやコア決定を変更させるわけにはいかない。まず観察され、校正され、証明されなければならない。

Karpathyから得た啓発は「AIが自分で研究できる」ことだけでなく、[働き方のパラダイムが移動している現実](/articles/ai-agents-changing-work)である：誰もが極めて低コストで、自分だけの最適化ループを構築する機会がある。研究者にとってはモデル訓練、企業にとってはプロセスと知識ベース、私にとって、今回の出発点は個人ウェブサイトをAIが継続的に読み取り、テストし、比較し、最適化できる実験に変えることだった。

paulkuo.twは私の個人ウェブサイトだけでなく、未来のより読み取り可能な自分への実験でもある。私が何を書いたかの展示だけでなく、私がAIとどのように知識を共構築するかの現場である。

もっと遠くを考えると、未来、すべての人のデジタル分身（「soul.md」）がこのような進化フレームワークを持つようになるだろうか？

わからない。探求を続ける。

私の考えが間違っているかもしれない！それならなお素晴らしい。

## システム実際構造

以下はAI-Ready Continuous Optimization Systemの完全フローと四層評価の実況である：

![AI-Ready Continuous Optimization System 総覧](/images/articles/ai-ready-opt-system-overview.png)

![Eval Worker 四層評価実況](/images/articles/ai-ready-opt-eval-scoring.png)

---

*参考資料：[Karpathy autoresearch GitHub](https://github.com/karpathy/autoresearch)*