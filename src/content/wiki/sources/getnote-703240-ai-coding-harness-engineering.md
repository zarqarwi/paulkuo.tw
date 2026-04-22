---
title: "AI 編碼代理的 Harness 工程：構建高效可控的智能開發系統"
type: source
pillar: ai
visibility: public
created: 2026-04-06
updated: 2026-04-16
source_count: 1
confidence: medium
tags: [AI編碼代理, Harness工程, 前饋控制, 反饋控制, Claude Code]
links_to: [cybernetics-homeostasis-tacit-knowledge]
linked_from: []
raw_source_path: "notes/04_AI與科技/AI编码代理的Harness工程：构建高效可控的智能开发系统_1906359250159703240.md"
raw_source_type: getnote
raw_note_id: "1906359250159703240"
enriched_at: "2026-04-22"
enriched_by: "haiku-4.5"
summary: "本文介紹 AI 編碼代理的 Harness 工程框架。LangChain 定義代理為「模型+Harness」，Harness 是除模型外的所有組件，採三層同心圓架構：核心層（LLM）、中間層（系統提示、工具、編排）、外層（使用者構建的前饋 Guides 與反饋 Sensors）。核心目標為提高首次正確率與構建自校正閉環。執行分計算型（確定、快速、低成本的 lint、測試）與推理型（語義分析、高成本的代碼審查）。通過編碼規範、項目初始化、代碼修改工具、結構測試、審查指導等實踐，結合前饋與反饋控制，實現代理可控性。文中強調人類開發者的隱性 Harness（經驗、責任感、組織記憶、美學判斷）同樣關鍵，並引用 OpenAI、Stripe 等案例展示分層架構與反饋左移策略的應用。"
key_points:
  - "Agent=Model+Harness，Harness 包含三層同心圓：模型核心層、框架中間層、使用者外層"
  - "前饋 Guides 在行動前引導，反饋 Sensors 在行動後觀察；兩者結合實現自校正閉環"
  - "計算型執行快速確定便宜，推理型執行靈活但成本高；需按時間線選擇最適執行策略"
  - "可維護性最成熟，架構適應性依賴 Fitness Functions，功能行為最具挑戰需規範與 AI 生成測試"
  - "人類開發者的隱性 Harness（經驗、責任感、組織記憶、美學）與顯性系統同等重要"
quotes:
  - text: "Agent = Model + Harness"
    timestamp: ""
  - text: "Harness 的兩大目標：提高首次正確率（前饋控制減少錯誤）+ 構建自校正閉環（反饋控制自動修復）"
    timestamp: ""
  - text: "執行類型分計算型（確定、快、低成本，如 lint、測試、型別檢查）與推理型（語義分析、高成本、非確定，如 AI 代碼審查、LLM 判斷）"
    timestamp: ""
  - text: "時間線部署原則：提交前用快速計算型控制（lint、基礎 AI 審查），集成後用高成本控制（變異測試、架構審查）"
    timestamp: ""
  - text: "人類開發者的隱性 Harness：經驗、社會責任感、組織記憶、美學判斷"
    timestamp: ""
chapters:
  - title: "Harness 架構定義與三層同心圓模型"
    start: ""
    summary: "定義代理為模型加 Harness，Harness 採三層同心圓：核心層（LLM）、中間層（系統提示、工具、編排）、外層（使用者 Guides 與 Sensors）"
  - title: "兩大核心目標與前反饋控制"
    start: ""
    summary: "提高首次正確率與構建自校正閉環，前饋 Guides 在行動前引導，反饋 Sensors 在行動後觀察並觸發自校正"
  - title: "執行類型與成本權衡"
    start: ""
    summary: "計算型執行確定、快速、低成本（lint、測試、型別檢查），推理型執行靈活但高成本（AI 代碼審查、LLM 判斷）"
  - title: "三大調節維度與新興模式"
    start: ""
    summary: "可維護性最成熟，架構適應性依賴 Fitness Functions，功能行為最具挑戰；Approved Fixtures 為新興模式"
  - title: "關鍵實踐與時間線部署"
    start: ""
    summary: "編碼規範、項目初始化、代碼修改工具、結構測試、審查指導等實踐，提交前用計算型，集成後用高成本控制"
  - title: "人類開發者的隱性 Harness"
    start: ""
    summary: "經驗、社會責任感、組織記憶、美學判斷等隱性因素與顯性系統同等重要，形成完整的代理可控架構"
  - title: "行業案例與實施啟示"
    start: ""
    summary: "OpenAI 分層架構與自定義檢查器，Stripe 啟發式預推送與反饋左移策略，展示架構實踐價值"
concept_links:
  matched: [harness-engineering, human-ai-collaboration, ai-skill-methodology]
  candidates:
    - slug_zh: "ai-agent-economy"
      title: "AI Agent 經濟"
      reason: "文章強調代理可控性架構與編碼實踐，但未涉及代理經濟學、激勵機制或市場模式，僅涉邊。"
    - slug_zh: "tacit-knowledge"
      title: "隱性知識：無法言說的人類智慧"
      reason: "文中明確提及「人類開發者的隱性 Harness：經驗、社會責任感、組織記憶、美學判斷」，但作為支線論述而非主軸。"
    - slug_zh: "enterprise-ai-adoption"
      title: "Enterprise AI Adoption"
      reason: "OpenAI、Stripe 等企業案例展示系統落地，但重點在技術架構而非組織變革管理，僅涉邊。"
    - slug_zh: "personal-knowledge-system"
      title: "Personal Knowledge System"
      reason: "AGENTS.md、Skills 文檔系統與知識組織相關，但重點在代理可控性框架，非知識管理系統設計。"
    - slug_zh: "build-for-models"
      title: "Build for Models"
      reason: "Harness 設計針對 AI 模型交互優化，但強調的是代理可控架構而非模型消費導向的產品設計。"
---

## 原文摘要

LangChain 定義：**Agent = Model + Harness**。Harness 是 AI 代理中除模型本身外的所有組件。在編碼代理場景，Harness 分為三層同心圓：核心層（LLM 模型）、中間層（編碼代理構建者提供，如 Claude Code 的系統提示、檢索工具、編排系統）、外層（使用者為特定場景構建的前饋 Guides 與反饋 Sensors）。

兩大核心目標：**提高首次正確率**（前饋控制減少錯誤）+ **構建自校正閉環**（反饋控制自動修復）。

執行類型分計算型（確定、快、低成本，如 lint、測試、型別檢查）與推理型（語義分析、高成本、非確定，如 AI 代碼審查、LLM 判斷）。

## 關鍵概念

- **Harness 三層同心圓**：核心層（模型）/ 中間層（框架提供）/ 外層（使用者構建）
- **Guides vs Sensors**：前饋控制在行動前引導，反饋控制在行動後觀察並觸發自校正
- **計算型 vs 推理型執行**：前者確定性快速便宜，後者語義靈活但成本高
- **三大調節維度**：可維護性（最成熟）、架構適應性（Fitness Functions）、功能行為（最具挑戰，依賴規範與 AI 生成測試）
- **Approved Fixtures**：新興模式，已批准的測試固定裝置
- **人類開發者的隱性 Harness**：經驗、社會責任感、組織記憶、美學判斷 → [[cybernetics-homeostasis-tacit-knowledge]]

## 關鍵實踐

| 方向 | 執行類型 | 實現 |
|------|---------|------|
| 編碼規範 | 前饋推理型 | AGENTS.md、Skills |
| 項目初始化 | 前饋混合型 | 技能文檔+引導腳本 |
| 代碼修改工具 | 前饋計算型 | OpenRewrite recipes |
| 結構測試 | 反饋計算型 | ArchUnit + 提交前鉤子 |
| 審查指導 | 反饋推理型 | Review Skills |

**時間線部署原則**：提交前用快速計算型控制（lint、基礎 AI 審查），集成後用高成本控制（變異測試、架構審查）。

## 行業案例

- **OpenAI**：分層架構 + 自定義代碼檢查器 + 漂移掃描代理
- **Stripe**：啟發式預推送鉤子 + 反饋左移策略 + 工作流集成

## 引用金句

- 「Agent = Model + Harness」
- 「Harness 的兩大目標：提高首次正確率，構建自校正閉環」
- 「未解決挑戰：行為 Harness 的可靠性、權衡決策能力、Harness 質量評估方法」

## Ingest 備註

- ingest 日期：2026-04-16
- 操作者：Cowork session（wiki-ingest-scanner batch 1）
- 來源：get_筆記/04_AI與科技
- visibility：public（AI链接笔记，非錄音卡）
