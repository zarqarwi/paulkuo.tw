---
title: "我做了一個追蹤 Claude 用量的 Chrome Extension"
type: source
pillar: ai
visibility: public
created: 2026-04-05
updated: 2026-04-05
source_count: 0
confidence: high
tags: [Claude, Chrome Extension, 用量追蹤, AI工具]
links_to: [one-person-team, build-for-models]
linked_from: []
raw_source_path: "src/content/articles/claude-usage-nyan-chrome-extension.md"
raw_source_type: article
enriched_at: "2026-04-22"
enriched_by: "haiku-4.5"
summary: "Paul 自行開發了一個追蹤 Claude 用量的 Chrome Extension，同時運行官方 API 和即時 token 攔截兩條驗證管道，使 Claude 的實際用量差異得以可視化。這個案例展現了超級個體如何透過自建工具解決自身痛點，並運用雙重驗證機制確保數據可信度。該 Extension 整合了 token 層級的即時監控與官方帳戶級別的用量統計，形成互補的觀測系統。這不僅是個人生產力工具的典型應用，更體現了在 AI 時代中，開發者能夠快速迭代自己的工作流程，並將個人洞察轉化為可複用的產品。整個開發過程反映了 Builder Mindset 的實踐——從識別自身需求到動手解決，再到驗證成效的完整循環。"
key_points:
  - "雙管道驗證設計：API 與 token 攔截互補，確保用量數據可信"
  - "超級個體工具開發：自行解決 Claude 用量追蹤的可見性問題"
  - "即時 token 監控：Chrome Extension 提供粒度級別的消費追蹤"
  - "Builder 心態實踐：從痛點出發快速迭代個人工作流程"
  - "可視化差異分析：官方統計與實時攔截數據對比揭示隱藏資訊"
quotes:
  - text: "同時跑官方用量 API 和即時 token 攔截兩條管道，讓 Claude 的用量差異可見"
    timestamp: ""
chapters:
  - title: "Chrome Extension 的開發動機"
    start: ""
    summary: "Paul 識別到 Claude 官方用量追蹤的不透明問題，決定自行開發工具以獲得實時可見性"
  - title: "雙管道驗證架構"
    start: ""
    summary: "結合官方 API 與即時 token 攔截，形成互補的數據收集與驗證機制"
  - title: "超級個體的工具實踐"
    start: ""
    summary: "體現了個人開發者利用 AI 工具快速迭代、解決自身痛點的能力"
concept_links:
  matched: [one-person-team, builder-mindset]
  candidates:
    - slug_zh: "build-for-models"
      title: "Build for Models"
      reason: "文中提及『同時跑官方用量 API 和即時 token 攔截兩條管道』涉及針對 AI model 消費層面的產品設計最佳化，但本 source 主軸是個人工具開發而非為 model 設計的產品通用框架，故列為候選而非核心主題"
    - slug_zh: "token-economics"
      title: "Token Economics"
      reason: "文中涉及 token 的追蹤與消費監控，但核心不在探討 token 作為經濟單位的體系框架，而是個人層級的用量可視化工具，屬沾邊提及"
    - slug_zh: "ai-skill-methodology"
      title: "AI Skill Methodology"
      reason: "開發 Extension 涉及提示詞工程與工具使用的技能層面，但本 source 重點不在傳授 AI 技能方法論，而在展示具體工具實踐"
---

## 原文摘要

Paul 自行開發了一個追蹤 Claude 用量的 Chrome Extension，同時跑官方用量 API 和即時 token 攔截兩條管道，讓 Claude 的用量差異可見。這是超級個體用 AI 解決自身痛點的又一個實踐案例。

## 關鍵概念

- **超級個體工具開發**：自己做工具解決自己的痛點 → [[one-person-team]]
- **雙管道驗證**：API + 即時攔截確保數據可信 → [[build-for-models]]

## 引用金句

> 同時跑官方用量 API 和即時 token 攔截兩條管道，讓 Claude 的用量差異可見。

## Ingest 備註

- Ingest 日期：2026-04-05
- 操作者：Cowork session（Article batch ingest）
- 文章發布日：2026-03-19
- 文章連結：[我做了一個追蹤 Claude 用量的 Chrome Extension](/articles/claude-usage-nyan-chrome-extension/)
