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
enriched_at: "2026-04-22"
enriched_by: "haiku-4.5"
summary: "Cloudflare 的 GraphQL Analytics API 在低流量網站（日訪客 < 500）上存在嚴重取樣失真問題，導致分析數據嚴重失真——Paul 在自己的品牌網站 paulkuo.tw 上親身經歷訪客實際為零但 Dashboard 顯示 130 人的現象。文章論證品牌網站、內容網站同樣需要可信的分析基礎，不能完全依賴平台預設取樣。解決方案是自建 visit beacon 等數據收集基礎設施，掌握自己的數據主權，避免被黑盒演算法的取樣誤差所迷惑。這涉及對數據基礎設施自主性的認知升級——不應被第三方平台的預設邏輯綁架。"
key_points:
  - "Cloudflare Analytics 在低流量網站上產生嚴重取樣失真，Dashboard 數據完全不可信"
  - "品牌、內容、轉換路徑網站都需要可信的流量分析，不只流量型網站"
  - "自建 visit beacon 是掌握數據主權、避免平台取樣陷阱的核心方案"
  - "低於 500 日訪客的網站最容易受取樣失真影響，需特別警惕"
  - "建立自主數據基礎設施是長期品牌經營的基礎投資"
quotes:
  - text: "不是只有流量型網站才需要在意流量數據。只要你在經營品牌、內容或轉換路徑，就需要可信的分析基礎。"
    timestamp: ""
  - text: "Cloudflare 的 GraphQL Analytics API 在日訪客低於 500 的網站上容易出現嚴重取樣失真，導致 Dashboard 顯示 130 人但實際可能為零。"
    timestamp: ""
  - text: "解法是自建 visit beacon 而非依賴平台預設的取樣數據。"
    timestamp: ""
chapters:
  - title: "問題現象：Dashboard 的虛幻數據"
    start: ""
    summary: "Paul 的品牌網站 paulkuo.tw 訪客實際為零，但 Cloudflare Dashboard 卻顯示 130 人的荒謬現象"
  - title: "根因分析：低流量網站的取樣陷阱"
    start: ""
    summary: "Cloudflare GraphQL Analytics API 在日訪客 < 500 的網站上產生嚴重取樣失真，黑盒演算法導致數據完全失真"
  - title: "認知升級：品牌網站也需要可信分析"
    start: ""
    summary: "品牌、內容、轉換路徑網站同樣需要可信數據基礎，不能依賴第三方平台的預設取樣邏輯"
  - title: "解決方案：自建 visit beacon"
    start: ""
    summary: "掌握數據主權的核心方案是自建 visit beacon，建立自主的數據收集基礎設施"
concept_links:
  matched: [build-for-models]
  candidates:
    - slug_zh: "data-ownership-infrastructure"
      title: "數據主權與自主基礎設施"
      reason: "文章核心主軸是論證為何應自建數據基礎設施而非依賴平台黑盒取樣。原文：『解法是自建 visit beacon 而非依賴平台預設的取樣數據』。這是關於個人/品牌對自有數據的主權掌控，涉及基礎設施自主性的戰略認知——超越現有 concept 清單範圍，建議獨立成主題。"
    - slug_zh: "sampling-bias-analytics"
      title: "取樣失真與低流量網站的分析陷阱"
      reason: "文章詳細論述 Cloudflare Analytics 在低流量網站上的取樣失真現象，但此為技術問題層面的具體案例，而非跨域的通用 concept，建議作為『數據主權』concept 下的應用案例而非獨立 concept。"
    - slug_zh: "personal-analytics-stack"
      title: "個人/品牌網站的分析堆棧設計"
      reason: "文章暗示需要為個人品牌網站設計可信的數據收集系統，涉及工具選擇、基礎設施設計，但原文未深入展開此主題，僅點到為止，沾邊程度較低，不應列為核心 concept。"
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
