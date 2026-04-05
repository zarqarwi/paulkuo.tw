# Worklog 2026-04-05 — LLM Wiki Phase 1: Article Ingest

## 完成日誌（最新在上）
- 15:xx 重建 graph.json (219 nodes / 413 edges)、stats.json、index.md Cowork
- 15:xx 更新 16 個 concept pages 的 linked_from + source_count（Python batch script） Cowork
- 15:xx 寫入 93 篇 article source pages 至 wiki/sources/ Cowork
- 14:xx 讀取全部 93 篇文章 frontmatter（osascript batch extraction） Cowork

## 完成摘要

### Article Source Pages（93 篇）
- AI pillar: 41 篇
- Startup pillar: 17 篇
- Life pillar: 18 篇
- Faith pillar: 15 篇
- Circular pillar: 2 篇

### Concept Pages 反向連結更新（16 個）
| Concept | 既有 | +文章 | 總計 |
|---------|------|-------|------|
| human-judgment-in-ai-era | 6 | +23 | 29 |
| ai-agent-economy | 20 | +15 | 35 |
| skill-development | 3 | +21 | 24 |
| human-ai-collaboration | 6 | +16 | 22 |
| enterprise-ai-adoption | 2 | +14 | 16 |
| one-person-team | 3 | +12 | 15 |
| build-for-models | 2 | +10 | 12 |
| ai-education | 3 | +8 | 11 |
| emotional-self-awareness | 0 | +8 | 8 |
| narrative-power | 3 | +7 | 10 |
| heavy-tail-distribution | 3 | +6 | 9 |
| ai-skill-methodology | 1 | +6 | 7 |
| steady-state-survival-trap | 4 | +5 | 9 |
| agentic-web | 1 | +3 | 4 |
| circular-economy-practice | 8 | +3 | 11 |
| ai-medical-biotech | 0 | +1 | 1 |

### Wiki 總計
- 219 頁面（17 concept + 201 source + 1 entity）
- 201 sources = 93 articles + 108 get_筆記
- 219 graph nodes / 413 edges

## 技術備忘
- 使用 osascript + `do shell script` 一次性抓取全部 93 篇 article frontmatter，比逐檔 read_text_file 快 10x
- linked_from 更新用 Python 腳本（寫到 Paul Mac 再 python3 執行），處理 inline array 和 YAML list 兩種格式
- graph.json edges 來自所有 source pages 的 links_to，共 413 條（平均每個 concept 被 ~24 個 source 指向）
- regenerative-medicine 是唯一沒有 article backlink 的 concept（只有 ai-medical-biotech 指向它）

## Phase 1 剩餘待辦
- [ ] Web 自動蒐集：關鍵字追蹤清單 + 排程任務
- [ ] Phase 2: Graph View 前端（/wiki/ route + D3.js）
- [ ] Phase 2: 對話查詢介面
