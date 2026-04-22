---
type: source
title: "從「空談廉價」到「程式碼廉價」：兩位 AI 大神看到的工作方式巨變"
source_type: get_note
pillar: ai
visibility: public
confidence: high
raw_note_id: "1902834118171439768"
tags:
  - Vibe Coding
  - Claws
  - Karpathy
  - Simon Willison
  - 程式碼廉價化
links_to:
  - one-person-team
  - harness-engineering
linked_from: []
enriched_at: "2026-04-22"
enriched_by: "haiku-4.5"
summary: "Andrej Karpathy 與 Simon Willison 等 AI 領袖揭示軟體開發的範式轉移：從「程式碼稀缺」到「程式碼廉價」。Karpathy 創造的「Vibe Coding」與「Claws」（智能體上層架構）體現了 AI 生成代碼能力的突破；Google 工程師用 Claude 1 小時完成原需一年的任務，說明開發效率的指數級提升。核心能力從「寫程式碼」轉向「知道寫什麼」，強調判斷力、戰略思維與領域專業知識。未來互動範式中，應用概念淡化，AI 助理成為使用者與系統的中介，顛覆 Linus Torvalds 經典名言，標誌著軟體產業結構性巨變。"
key_points:
  - "程式碼從稀缺資源變廉價商品，開發重點從編寫轉為決策"
  - "Claws 框架：大模型→智能體→即用型成品應用的三層遞進"
  - "判斷力與戰略思維成核心能力，技術執行日益自動化"
  - "AI 助理作中介，使用者無需理解應用存在，交互方式根本改變"
  - "Google 工程師案例：一年任務縮短至一小時，效率躍升展示產業變化"
quotes:
  - text: "Code is cheap now. Show me the talk."
    timestamp: ""
  - text: "奶奶不必了解應用程式的存在，因為她的 AI 助理應該知道這些"
    timestamp: ""
  - text: "從『會寫程式碼』到『知道該寫什麼程式碼』，判斷力、戰略思維、領域專業知識、產品思維成為關鍵能力"
    timestamp: ""
  - text: "Claws 是智能體之上的新一層技術——底層大模型 = 小麥，智能體 = 麵粉，Claws = 麵包"
    timestamp: ""
chapters:
  - title: "Karpathy 的命名藝術與技術演進"
    start: ""
    summary: "Karpathy 十年創造四個影響深遠的術語，從 Hallucination 到 Claws，展現 AI 認知與架構的進化層次。"
  - title: "程式碼廉價化的範式轉移"
    start: ""
    summary: "從「Show me the code」到「Code is cheap」，軟體開發的經濟基礎發生根本改變，編寫成本趨近零。"
  - title: "未來互動範式重構"
    start: ""
    summary: "應用概念從使用者認知中消失，AI 助理成為使用者與系統的中介層，交互邏輯根本改變。"
  - title: "核心能力轉變與案例驗證"
    start: ""
    summary: "判斷力與戰略思維升為一級公民，技術執行日益自動化。Google 工程師案例驗證效率躍升。"
concept_links:
  matched: [agentic-web, one-person-team, human-judgment-in-ai-era]
  candidates:
    - slug_zh: "ai-skill-methodology"
      title: "AI Skill Methodology"
      reason: "文中強調『從會寫程式碼到知道該寫什麼程式碼』的能力轉變，涉及判斷力與戰略思維的系統化方法論，但主軸不在「如何設計 AI 工作流程」而在「工作方式的範式轉移」，故作為候選主題。"
    - slug_zh: "software-disruption"
      title: "Software Disruption"
      reason: "程式碼廉價化直接衝擊傳統軟體開發模式與經濟邏輯，但文章重點不在「SaaS 定價模式崩潰」等商業模式破壞，而在「開發方式的技術轉變」，屬邊界相近但焦點不同的概念。"
    - slug_zh: "build-for-models"
      title: "Build for Models"
      reason: "Claws 框架體現為大模型優化的設計哲學，但文章未深入探討「如何設計產品供模型消費」的實踐細節，主要著眼於層級架構概念本身。"
---

## 摘要

Karpathy 創造的「Vibe Coding」僅 9 個月就成為柯林斯年度詞彙，2026 年又提出「Claws」概念。Django 創始人 Simon Willison 呼應提出「Writing code is cheap now」，顛覆 Linus Torvalds 的經典名言，揭示程式碼從稀缺資源變為廉價商品的範式轉移。

## 核心觀點

### Karpathy 的命名藝術

十年間創造四個影響深遠的術語：Hallucination（2015）、Software 2.0（2017）、Vibe Coding（2025）、Claws（2026）。Claws 是智能體之上的新一層技術——底層大模型 = 小麥（原材料），智能體 = 麵粉（半成品），Claws = 麵包（即開即用的成品）。

### 未來交互範式

「奶奶不必了解應用程式的存在，因為她的 AI 助理應該知道這些。」未來不是讓所有人學會寫程式，而是讓 AI 成為中介。「應用」概念可能從使用者認知中消失。

### 程式碼廉價化革命

| 時代 | 核心理念 | 底層邏輯 |
|------|---------|---------|
| 傳統軟體開發 | Talk is cheap. Show me the code. | 程式碼昂貴、稀缺 |
| AI 輔助開發 | Code is cheap. Show me the talk. | 程式碼生成成本趨近於零 |

Google 首席工程師：團隊 2025 年花一年構建的分散式智能體編排器，2026 年用 Claude Code 僅 1 小時完成。

### 核心能力轉變

從「會寫程式碼」到「知道該寫什麼程式碼」，從「會用工具」到「知道該解決什麼問題」。判斷力、戰略思維、領域專業知識、產品思維成為關鍵能力。

## 來源

快刀青衣專欄第 772 期，2026-02-27。引用 Karpathy X 平台發文、Simon Willison「Agentic Engineering Patterns」。
