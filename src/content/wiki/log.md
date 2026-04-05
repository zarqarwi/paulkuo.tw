# Wiki 操作日誌（append-only）

> 每次 ingest / lint / publish 操作都記錄在此。
> 格式：`{日期} {時間} | {操作} | {摘要} | {session 類型}`

---

## 2026-04-05

- 22:00 | init | Wiki 目錄結構建立於 src/content/wiki/，Phase 0 啟動 | Cowork
- 23:00 | ingest | 龍蝦十日談 10 篇批次 ingest（Phase 0 試跑） | Cowork
  - 10 篇 source 摘要頁（全部 public，來自 get_筆記/01_專欄文章/快刀青衣_AI龙虾十日谈/）
  - 7 個概念頁新建：ai-agent-economy, human-ai-collaboration, one-person-team, skill-development, human-judgment-in-ai-era, ai-education, enterprise-ai-adoption
  - 1 個人物頁新建：kuaidao-qingyi（10/10 篇提及）
  - 其餘 9 位嘉賓（張鵬、寧遼原、凱叔、卡茲克、尹會生、李寧、楊天潤、王大仙、王潤宇、曲曉音）各 1 篇，未達 3 篇門檻暫不建獨立頁
  - graph.json 更新：8 節點 + 15 條邊
  - stats.json 更新：18 頁面
- 23:30 | schema | CLAUDE.md 新增 Phase 1 規格：Web 自動蒐集 + 知識摘要排程 | Cowork
- 23:35 | automation | 建立 wiki-knowledge-digest 排程任務（每 2 天 10:00） | Cowork

## 2026-04-05（Phase 1 — 04_AI與科技 批次 ingest）

- 14:00 | ingest | 04_AI與科技 13 篇 public 批次 ingest（Phase 1 第一批） | Cowork
  - 來源：get_筆記/notes/04_AI與科技/（排除 7 untitled + 1 歡迎頁 + 10 錄音卡）
  - 13 篇 source 摘要頁新建（全部 public）
  - 3 個概念頁新建：agentic-web, build-for-models, ai-skill-methodology
  - 7 個現有概念頁更新引用：ai-agent-economy(+4), skill-development(+5), human-ai-collaboration(+8), one-person-team(+4), enterprise-ai-adoption(+2), human-judgment-in-ai-era(+6), ai-education(+2)
  - graph.json 更新：+3 節點 +9 邊（共 11 節點 24 邊）
- 15:00 | ingest | 04_AI與科技 12 篇 internal（錄音卡）批次 ingest（Phase 1 第二批） | Cowork
  - 來源：get_筆記/notes/04_AI與科技/（10 篇錄音卡筆記，全部去識別化）
  - 12 篇 source 摘要頁新建（全部 internal）
  - 10 個現有概念頁更新引用
  - graph.json 節點權重更新（internal 不新增公開節點）
- 15:30 | milestone | 04_AI與科技 資料夾 ingest 完成（共 25 篇） | Cowork
  - 13 public + 12 internal = 25 篇 source 摘要頁
  - 3 個概念頁新建（agentic-web, build-for-models, ai-skill-methodology）
  - 全部 10 個概念頁 + 1 個人物頁已更新引用
  - wiki 總頁數：18 → 46（+28 頁）
  - graph.json：11 節點 + 24 邊

## 2026-04-05 Phase 1 Batch 2 — 01_專欄文章 + 03_環保循環經濟 + 05_商務 + 08_其他

- 操作者：Cowork session
- 範圍：4 個資料夾，36 筆新 source pages
  - 01_專欄文章：20 public（OpenClaw, 共讀, 快刀專欄, 萬維鋼）
  - 03_環保循環經濟：1 public + 9 internal
  - 05_商務會議：4 internal（文章，非錄音）
  - 08_其他：2 internal（有標題的）
- 跳過：07_生活雜記（private）、09_會議錄音（private）、05 錄音筆記（private）、所有 untitled 檔案
- 新增 source pages：36
- 新增 concept pages：4（steady-state-survival-trap, heavy-tail-distribution, circular-economy-practice, narrative-power）
- 更新 concept pages：10（全部既有概念頁 source_count 增加）
- Wiki 成長：46 → 86 頁
- 里程碑：Phase 1 五源匯流第一源（get_筆記）完成 5/8 個資料夾

## 2026-04-05 Phase 1 Batch 3 — 02_醫療健康 + 06_個人成長與學習

- 操作者：Cowork session
- 範圍：2 個資料夾，37 筆新 source pages
  - 02_醫療健康：20 internal（全部去識別化）
  - 06_個人成長與學習：17 internal（去重 7 個萬維鋼系列重複 + 5 untitled）
- 跳過：
  - 06 中的 7 個重複檔（敘事×2、能動×2、重尾×1、約束×2）— 已在 01/05 批次 ingest
  - 5 個 untitled 檔案
  - 2 個 untitled（02_醫療）
- 新增 source pages：37
- 新增 concept pages：3（ai-medical-biotech, regenerative-medicine, emotional-self-awareness）
- 更新現有 concept 節點權重：enterprise-ai-adoption, human-ai-collaboration, skill-development, human-judgment-in-ai-era 等
- Wiki 成長：86 → 126 頁（17 concept + 1 entity + 108 source）
- graph.json：18 節點 + 47 邊
- 🎉 里程碑：Phase 1 get_筆記 ingest 完成！7/8 資料夾已處理（07 生活雜記 + 09 會議錄音 = private 跳過）
