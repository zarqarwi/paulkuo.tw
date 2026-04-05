---
title: "網站訪客數是零，但 Dashboard 說有 130 人"
type: source
pillar: ai
visibility: public
created: 2026-04-05
updated: 2026-04-05
source_count: 0
confidence: high
tags: [流量分析, Cloudflare, 取樣失真, 品牌網站, visit beacon]
links_to: [build-for-models]
linked_from: []
raw_source_path: "src/content/articles/analytics-sampling-trap.md"
raw_source_type: article
---

## 原文摘要

Cloudflare 的 GraphQL Analytics API 在日訪客低於 500 的網站上容易出現嚴重取樣失真，導致 Dashboard 顯示 130 人但實際可能為零。Paul 從自己經營 paulkuo.tw 的經驗出發，論證品牌網站也需要可信的分析基礎，解法是自建 visit beacon 而非依賴平台預設的取樣數據。

## 關鍵概念

- **取樣失真**：低流量網站的分析陷阱
- **自建 beacon**：掌握自己的數據基礎設施 → [[build-for-models]]

## 引用金句

> 不是只有流量型網站才需要在意流量數據。只要你在經營品牌、內容或轉換路徑，就需要可信的分析基礎。

## Ingest 備註

- Ingest 日期：2026-04-05
- 操作者：Cowork session（Article batch ingest）
- 文章發布日：2026-03-23
- 文章連結：[網站訪客數是零，但 Dashboard 說有 130 人](/articles/analytics-sampling-trap/)
