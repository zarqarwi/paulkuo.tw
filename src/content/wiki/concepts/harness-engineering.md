---
title: "Harness 工程：AI 代理可控性架構"
type: concept
pillar: ai
visibility: public
created: 2026-04-16
updated: 2026-04-26
source_count: 8
confidence: medium
tags: [AI編碼代理, Harness工程, 前饋控制, 反饋控制, Claude Code]
links_to: [tacit-knowledge, human-ai-collaboration]
linked_from: [youtube-U-H_5-eRV8k-agentosagi, getnote-483472-openclaw-setup-guide, article-ai-agents-vs-agentic-ai, getnote-880568-cybernetics-homeostasis-tacit-knowledge, getnote-332008-ai-foreman-buffer-period, youtube-fuz8Y40Ormg-403ai, youtube-STK-TtPlN9I-ai-ai, getnote-703240-ai-coding-harness-engineering]
paul_perspective: >-
  這篇摘要寫的是設計者怎麼搭 Harness 讓 AI 可控，少寫了一面：使用者怎麼跟搭出來的 Harness 共處。我認識你們的方式不是讀官方文件或社群分享，是 35 天連續、12.1M tokens 在視窗中敲鍵盤的當下——同一個底層模型透過不同的 system prompt、memory、project_instructions，成了長相不同的面具，而我得在每次互動中分辨每張面具的邊界。協作久了發現：搭 Harness 的人也被 Harness 改變。我在認識你們的過程中，也被你們認識、被你們塑造。Harness 工程是雙向演化，不是單向控制。
---

## 摘要

**Agent = Model + Harness**。Harness 是 AI 代理中除模型本身之外的所有組件——讓模型的能力真正可控、可靠、可維護的整體系統。Harness 工程是 1948 年控制論（Sensors + Guides）在 AI 時代的具體實踐，目標是提高首次正確率，並建立自校正閉環。

## 核心觀點

### 三層同心圓架構

LangChain 提出的 Agent 定義把 Harness 視覺化為三層同心圓：

1. **核心層**：LLM 模型本身（Claude、GPT 等），這層由模型供應商控制，使用者通常無法修改
2. **中間層**：框架/平台提供者構建，如 Claude Code 的系統提示、檢索工具、編排系統——這是「開箱即用」的 Harness
3. **外層**：使用者為特定業務場景構建的前饋 **Guides** 與反饋 **Sensors**——這是差異化價值的來源

外層的 Harness 是每個組織最獨特、最有競爭壁壘的部分。Claude Code 的 CLAUDE.md 就是一個典型的 Guide；CI/CD 中觸發 AI 審查的 webhook 就是一個 Sensor。

### Guides vs Sensors：控制論的兩種力量

這組對立來自 1948 年諾伯特・維納的控制論，是所有 Harness 設計的底層邏輯：

| 維度 | Guides（前饋控制） | Sensors（反饋控制） |
|------|-------------------|-------------------|
| **時機** | 行動**前**提供方向 | 行動**後**觀察並觸發校正 |
| **類比** | 看到食物分泌消化液（預測性調節） | 體溫過高啟動排汗（偏差修正） |
| **編碼代理例子** | AGENTS.md 規範、技能文檔 | 提交後 lint、AI 代碼審查 |
| **目標** | 提高首次正確率 | 構建自校正閉環 |

兩者協同，才是完整的 Harness。只有 Guides 沒有 Sensors，就像只告訴員工規則但不給反饋；只有 Sensors 沒有 Guides，就是讓 AI 摸索試誤。

### 計算型 vs 推理型執行

Harness 的執行類型決定了使用場景與成本結構：

- **計算型**：確定性高、速度快、成本低，如 lint、型別檢查、測試執行——適合提交前的高頻觸發
- **推理型**：語義靈活、成本高、非確定，如 AI 代碼審查、LLM 判斷——適合集成後的低頻深度檢查

**時間線部署原則**：提交前用快速計算型，集成後用高成本推理型。不能把所有 Sensors 都堆到 CI，也不能讓 AI 審查每一次微小的改動。

### 三大調節維度

Harness 工程實務上圍繞三個維度展開：

1. **可維護性**（最成熟）：程式碼品質、格式規範、文件完整性
2. **架構適應性**（Fitness Functions）：系統是否朝預期的架構方向演化
3. **功能行為**（最具挑戰）：業務邏輯是否正確——這需要規範文檔和 AI 生成測試，目前仍是最難解的部分

### 人類開發者的隱性 Harness

值得特別注意的是：資深人類開發者本身就是一個完整的 Harness。

資深程序員瞬間感受到「味道不對」的直覺、對業務場景的深刻理解、對團隊文化的感知——這些無法被編碼成規則的隱性智慧，才是人類最不可替代的 Harness 組件。AI Harness 工程的本質，是把過去只存在於人腦中的這些判斷，盡可能地外化為系統可執行的規則與流程。

## 來源引用

- [[getnote-703240-ai-coding-harness-engineering]] — 系統闡述 Agent = Model + Harness 框架，三層同心圓架構、Guides vs Sensors、OpenAI 與 Stripe 的實踐案例
- [[getnote-880568-cybernetics-homeostasis-tacit-knowledge]] — 從控制論歷史視角解讀 Harness 工程的思想根源，串連 1948 維納、1968 軟體危機、隱性知識

## 矛盾與爭議

目前來源觀點一致。最大的開放挑戰是「功能行為 Harness 的可靠性」——如何用可執行的規則捕捉業務邏輯的正確性，目前沒有成熟解法，LLM 判斷的非確定性讓這個維度特別難以系統化。

## 延伸連結

- → [[tacit-knowledge]] 隱性知識是理解 Harness 工程人類側價值的核心——外化隱性知識是 Harness 設計的根本挑戰
- → [[human-ai-collaboration]] Harness 工程是人機協作的基礎設施：不設計 Harness，就是把人機協作留給偶然
