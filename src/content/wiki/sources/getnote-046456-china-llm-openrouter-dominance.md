---
title: "中國大模型在 OpenRouter 稱霸：執行層的成本優勢與 Token 消耗底層重構"
type: source
pillar: ai
visibility: public
created: 2026-04-05
updated: 2026-04-05
source_count: 1
confidence: low
tags: [ai-models, openrouter, cost-efficiency, agentic-web]
links_to: [ai-agent-economy, build-for-models, kuaidao-qingyi, one-person-team]
linked_from: []
raw_source_path: "notes/01_專欄文章/快刀青衣_專欄/777_便宜，还好用：中国大模型凭什么拿下OpenRouter全球调用量第一？.md"
raw_source_type: getnote
raw_note_id: "1904831475531046456"
enriched_at: "2026-04-22"
enriched_by: "haiku-4.5"
summary: "2026年2月，中國大模型在OpenRouter全球聚合平台首次調用量超越美國模型。文章分析三大驅動力：OpenClaw開源工具催化的Token消耗激增、中國模型在執行層建立的成本優勢、以及Agent工作流重構Token消耗模式。MiniMax M2.5與Kimi K2.5等模型通過極低成本（輸入0.3美元/百萬Token，為Claude的1/17）與特化能力（工具調用準確率76.8%領先Claude），在執行層超越美國頂級模型。這象徵產業出現「判斷層-執行層分工」新格局：複雜推理由Claude承擔，執行工作由高性價比國產模型接手，國內廠商戰略從規模競爭演進至價值鏈分工。"
key_points:
  - "中國模型在OpenRouter調用量反超美國，反映全球開發者在執行層任務上的真實選擇傾向"
  - "OpenClaw龍蝦項目單日消耗3340億Token，催化整個產業從對話模式向Agent工作流的Token消耗底層重構"
  - "MiniMax M2.5成本優勢極端：輸入成本僅Claude的1/17，工具調用準確率領先，建立執行層競爭護城河"
  - "產業新格局：頂層複雜決策由Claude等美國頂尖模型承擔，中層執行任務轉向國產高性價比模型"
  - "中國模型針對角色扮演場景（占開源應用52%）深度優化，通過長上下文維度建立場景特化護城河"
quotes:
  - text: "中國模型在執行層建立了競爭優勢——頂層複雜任務由Claude承擔，執行層任務由高性價比國產模型承接"
    timestamp: ""
  - text: "MiniMax M2.5的工具調用準確率76.8%，領先Claude Opus 4.6的63.3%，輸出速度是Claude的約3倍"
    timestamp: ""
  - text: "OpenClaw龍蝦項目支援AI直接接管電腦執行命令列操作與自動化工作流，GitHub星標超21萬，單日貢獻3340億Token"
    timestamp: ""
  - text: "類比深圳製造業生態：通過執行層規模優勢逐步向上游價值鏈滲透"
    timestamp: ""
chapters:
  - title: "OpenRouter平台現況與調用量反超"
    start: ""
    summary: "中國大模型2026年2月在OpenRouter首次超越美國模型，調用量反超標誌著全球開發者選擇的轉變"
  - title: "執行層與判斷層的產業分工新格局"
    start: ""
    summary: "Claude等美國頂級模型主攻複雜判斷，國產模型專精執行層工具調用與代碼生成，形成戰略互補"
  - title: "Token消耗模式的底層重構"
    start: ""
    summary: "從傳統對話模式演進為Agent工作流，單次任務消耗從數千Token躍升至十萬-百萬Token級別"
  - title: "OpenClaw龍蝦項目的催化作用"
    start: ""
    summary: "開源工具支援AI自動化執行命令，GitHub星標21萬，單日3340億Token消耗引發行業Token激增"
  - title: "MiniMax M2.5的成本與能力優勢"
    start: ""
    summary: "輸入成本0.3美元/百萬Token（Claude的1/17），工具調用準確率76.8%領先，建立執行層護城河"
  - title: "角色扮演場景的特化優勢"
    start: ""
    summary: "中國模型針對佔50%開源應用的角色扮演場景優化，MiniMax M2-Her版本通過長上下文維度建立場景護城河"
concept_links:
  matched: [token-economics, agentic-web, ai-agent-economy]
  candidates:
    - slug_zh: "build-for-models"
      title: "Build for Models"
      reason: "文章強調MiniMax M2.5等模型在成本與工具調用特化上的優勢，體現產品為模型消費優化的設計邏輯。證據：『MiniMax M2.5輸入成本0.3美元/百萬Token（Claude的1/17）、工具調用準確率76.8%領先』，但此concept不是文章主軸（主軸是Token經濟與分工格局），僅為支撐論點，故列為候選"
    - slug_zh: "enterprise-ai-adoption"
      title: "Enterprise AI Adoption"
      reason: "文章涉及企業級開發者在OpenRouter平台選擇模型的決策邏輯，反映成本與性能的採納考量。但文章重點不在企業內部整合挑戰或變革管理，僅涉及API聚合平台的市場選擇，沾邊但非核心"
    - slug_zh: "gpu-economics"
      title: "GPU Economics"
      reason: "Token經濟與GPU成本結構相關，但本文焦點是Token消耗模式與執行層成本競爭，未涉及GPU供應鏈、地緣政治或硬體稀缺性動態，屬產業上游議題但非文章討論範圍"
    - slug_zh: "software-disruption"
      title: "Software Disruption"
      reason: "中國模型成本優勢可能衝擊SaaS定價模式，但文章未直接論述傳統軟體商業模式的結構性瓦解，僅涉及模型層的競爭定位，不符合此concept的定義"
---

## 原文摘要

2026 年 2 月，中國大模型在全球最大 AI 模型 API 聚合平台 OpenRouter 首次超越美國模型，達成調用量反超。文章深入分析三大驅動因素：OpenClaw（龍蝦）開源項目的爆發性 Token 消耗、中國模型在執行層建立的競爭優勢、以及 Agent 工作流催化的 Token 消耗底層重構。MiniMax M2.5 與月之暗面 Kimi K2.5 等模型通過成本與特化能力，在執行層領先 Claude 等美國頂級模型，象徵著國內模型廠商從「用規模換未來」向戰略分工演進。

## 關鍵概念

- **OpenRouter 聚合平台**：全球最大的 AI 模型 API 聚合平台，類似「AI 模型電商平台」，擁有 500 萬開發者用戶（美國占 47%，中國僅 6%），數據反映全球開發者真實選擇，但無法覆蓋廠商官方 API 直調數據，→ [[待建頁面：openrouter-platform]]
- **執行層與判斷層分工**：出現產業新格局——頂層複雜任務（判斷力）由 Claude 等頂尖模型承擔，執行層任務（工具調用、代碼生成）由高性價比國產模型承接，→ [[ai-agent-economy]]
- **Token 消耗模式革新**：從傳統「對話模式」（單次數百-數千 Token）演進為 Agent 工作流模式（需處理十萬-百萬 Token 超長上下文），單次任務消耗提升數十到數百倍，→ [[agentic-web]]
- **MiniMax M2.5 成本優勢**：輸入成本 0.3 美元/百萬 Token（Claude Opus 4.6 的 1/17）、輸出成本 1.2 美元/百萬 Token（Claude 的 1/20），SWE-Bench 代碼能力仍保持 80.2% 水準、工具調用準確率更達 76.8%（領先 Claude 的 63.3%），→ [[build-for-models]]
- **OpenClaw 龍蝦項目**：2026 年 1 月下旬爆火的開源工具，支援 AI 直接接管電腦執行命令列操作與自動化工作流，GitHub 星標超 21 萬，單日貢獻 3340 億 Token，催化了整個行業的 Token 消耗激增，→ [[待建頁面：openclaw-agent-framework]]
- **角色扮演場景特化**：中國模型針對「角色扮演」場景（占開源模型使用量 52%）進行深度優化，由於需長時間維持角色語氣與記憶，對上下文長度要求極高，MiniMax 推出 Minimax M2-Her 角色扮演特化版本建立場景護城河

## 關鍵人物

- **快刀青衣**：本文作者，AI 領域內容工作者，提供 MiniMax M2.5 等模型深度分析的背景
- **卡茲克**：(已於前篇出現)，→ [[kazike-ai-practitioner]]

## 引用金句

1. **「中國模型在執行層建立了競爭優勢——頂層複雜任務由 Claude 承擔，執行層任務由高性價比國產模型承接。」** — 描繪新興分工格局，說明國內模型的市場定位與戰略價值

2. **「MiniMax M2.5 的工具調用準確率 76.8%，領先 Claude Opus 4.6 的 63.3%，輸出速度是 Claude 的約 3 倍。」** — 量化證據展示國產模型在特定維度的超越

3. **「類比深圳製造業生態：通過執行層規模優勢逐步向上游價值鏈滲透。」** — 戰略類比，揭示國內模型從成本競爭向價值鏈升級的長期路徑

## Ingest 備註

- Ingest 日期：2026-04-05
- 來源標記：get_筆記同步，簡體中文原文轉繁體中文（台灣用語）
- 重點轉換：「调用量」→「調用量」、「聚合平台」→「聚合平台」、「成本優勢」→「成本優勢」、「工具」→「工具」
- 關鍵術語保留：OpenRouter、MiniMax M2.5、Claude Opus 4.6、Kimi K2.5、SWE-Bench、OpenClaw（龍蝦）
