---
title: Wiki Ingest Pending — 待 ingest 筆記清單
generated_at: 2026-04-25
generator: wiki-daily-pipeline (Cowork, GitHub MCP scan)
status: partial
---

# Wiki Ingest Pending — 2026-04-25

雲端 scanner 從 `zarqarwi/get-biji-notes` (master) 掃出來的待 ingest 候選清單。
這次跟昨天一樣，受 MCP 單次回應大小限制，**04 / 06 沒辦法在雲端完整列出**，
精確的 `raw_note_id` 比對交給本機 `scripts/build_wiki_ingest_report.py`。

---

## Visibility 分類規則套用

| 資料夾 | 預設 visibility | 例外 |
|--------|-----------------|------|
| 01_專欄文章 | public | 無 |
| 02_醫療健康 | internal | 含 `录音卡笔记` tag → 維持 internal |
| 03_環保循環經濟 | public | 無 |
| 04_AI與科技 | public | 含 `录音卡笔记` tag → 降為 internal |
| 05_商務會議 | internal | 含 `录音卡笔记` tag → 降為 **private**（不 ingest） |
| 06_個人成長與學習 | internal | 無 |
| 07_生活雜記 | **private**（不 ingest） | — |
| 08_其他 | internal | 無 |
| 09_會議錄音 | **private**（不 ingest） | — |

> 雲端 scanner 沒讀檔案內 frontmatter → tag-based 降級規則目前無法套用，需要本機 scanner 接手。

---

## 雲端可見的檔案盤點

### 01_專欄文章（public）— 7 個子系列

- `OpenClaw_上手准备/`
- `_duplicates/`
- `共读_人比AI凶/`
- `共读_预测之书/`
- `快刀青衣_AI龙虾十日谈/`
- `快刀青衣_專欄/`
- `萬維鋼_現代思維工具100講/`

子目錄內檔案數本次未逐一展開（避免 MCP context 爆量），交本機 scanner 接手。

### 02_醫療健康（internal，需去識別化）— 30 檔

主題涵蓋：AI 助力新藥開發、醫療領域 AI 應用合作、AI 藥物設計與生命科學、長照 / 健康管理 / 親子關係 / 中年成長 / 抗衰老 / 預防醫學 / 干細胞外泌體培養 / 子宮頸癌治療 / 健康管家 / 日本 CET 再生醫療等。包含若干 `untitled_*` 小檔（可能為短記）。

### 03_環保循環經濟（public）— 13 檔

主題涵蓋：二手物資回收 / 物流模式創新、循環經濟回收商業模式、岩棉回收、台灣環保循環產業合作、整理師公益講座、環保創新與公益事業、防火材料替代、（馬斯克言行錄相關清單異常出現在此資料夾，建議檢查歸類）。

### 04_AI與科技（public）— 未列檔

雲端 enumerate 超過 MCP 回應上限。**需要本機 scanner 接手列檔 + tag 比對（內含 `录音卡笔记` 者要降為 internal）**。

### 05_商務會議（internal；錄音卡降為 private）— 21 檔

主題涵蓋：104 履歷篩選 / 樂行廠介紹 / 嘉龍科技開市典禮 / 愿景協會籌建與會員經營 / 礦泉水銷售合作 / WOOP 思維工具 / 重尾 / 結構洞 / 場域 / 老喻決策三公式 / 複利的本質與資本累積 / 供給側心態。包含 4 個 `untitled_*` 微檔（疑似錄音卡片段，需本機讀 tag 確認）。

### 06_個人成長與學習（internal）— 未列檔

雲端 enumerate 超過 MCP 回應上限。**交本機 scanner 接手**。

### 08_其他（internal）— 38 檔

主題涵蓋：自我決定理論（SDT）/ 元認知 / 身份認同 / 自由能原理（FEP）/ 全球經濟驅動因素 / 自媒體爆款選題 / 哈佛 19 個頂級思維 / 高情商說話細節 / 立人設 / 正念呼吸與身體掃描練習 / 西方經典散文。包含若干 `untitled_*` 微檔。

### 07_生活雜記、09_會議錄音（private）— 跳過

依規則不 ingest，雲端不再列檔。

---

## 本機 scanner 必須補的洞

1. **04_AI與科技 / 06_個人成長與學習**：完整列檔 + 套用 visibility 規則
2. **錄音卡筆記降級**：讀每篇 frontmatter 的 tags，含 `录音卡笔记` 的：
   - 04 中的 → 降為 internal
   - 05 中的 → 降為 private（不 ingest）
3. **`raw_note_id` 比對**：對照 `src/content/wiki/sources/` 已 ingest 清單，標出哪些是新候選、哪些已 ingest

---

## 建議

待 04 / 06 列檔 + tag 降級 + `raw_note_id` 比對完成後，再決定本批次的 ingest 範圍。
本週若要批次處理，建議排 [WIKI] Cowork session，由 Paul 確認 internal 類去識別化標準後再批次走。
