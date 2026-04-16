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
