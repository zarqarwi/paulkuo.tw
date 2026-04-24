# Wiki Ingest Pending — 2026-04-24

> 由 wiki-daily-pipeline（Cowork 排程，Step 3 scanner）產出
> **注意**：今日透過 GitHub MCP API 執行雲端掃描，**不是**本機 `scripts/build_wiki_ingest_report.py` 的完整結果。
> 完整 frontmatter 比對、去識別化建議、錄音卡筆記 tag 檢查請執行本機 scanner 後再審查。

## 現有 wiki/sources 規模

- paulkuo.tw `src/content/wiki/sources/*.md`：**260 篇**（GitHub Search API 查得）

## get-biji-notes `notes/` 掃描結果（cloud-side file count）

| 資料夾 | 可 ingest 分類 | md 檔數（初估） | 備註 |
|---|---|---|---|
| 01_專欄文章/OpenClaw_上手准备 | public | 1 | 有 series_meta.json |
| 01_專欄文章/_duplicates | — | 1 | 重複內容，跳過 |
| 01_專欄文章/共读_人比AI凶 | public | 1 | 629 |
| 01_專欄文章/共读_预测之书 | public | 1 | 762 |
| 01_專欄文章/快刀青衣_AI龙虾十日谈 | public | 10 | 794–803 |
| 01_專欄文章/快刀青衣_專欄 | public | ≈35 | 38, 603–887 散落 |
| 01_專欄文章/萬維鋼_現代思維工具100講 | public | 13 | 含 untitled_*、叙事、能动等 |
| 02_醫療健康 | internal（去識別化） | ≈30 | 本次 cloud-side 已列 |
| 03_環保循環經濟 | public | ≈14 | 本次 cloud-side 已列 |
| 04_AI與科技 | public（錄音卡降級 internal） | **未知** | MCP output-size 超限，需本機 scanner |
| 05_商務會議 | internal（錄音卡降級 private） | ≈25 | 本次 cloud-side 已列 |
| 06_個人成長與學習 | internal | **未知** | MCP output-size 超限，需本機 scanner |
| 07_生活雜記 | private（skip） | — | 不 ingest |
| 08_其他 | internal | ≈40 | 本次 cloud-side 已列 |
| 09_會議錄音 | private（skip） | — | 不 ingest |

**01 資料夾含 7 個 nested series 子目錄**，共估 ≈62 篇 md。

## Cloud-side 掃描限制

1. **04_AI與科技 與 06_個人成長與學習**：MCP `get_file_contents` 回傳超過 token 限制，列表被截斷到 host 磁碟，Cowork workspace 無法讀取。
2. **Frontmatter 逐檔比對無法完成**：260 篇 wiki/sources × N 篇 notes 的 `raw_note_id` 交叉比對需要大量 API 呼叫，且 `search_code` 單次回傳也超過 token 限制。
3. **錄音卡筆記（`录音卡笔记` tag）降級規則**：需讀每篇 frontmatter 的 tags 陣列，cloud-side 無法大量執行。

## 下一步建議

**本機執行 `python3 scripts/build_wiki_ingest_report.py`**（由 scheduled task `wiki-ingest-scanner` 每日 10:02 自動跑）即可取得：

- 精確的「已 ingest / 待 ingest」比對
- 錄音卡筆記的 visibility 降級標記
- 去識別化 TODO 清單（02/05/06/08 的 internal 類）
- public 優先 ingest 批次建議（本週目標 10–20 篇）

本機 scanner 輸出會覆寫本檔案；這份 cloud-side 摘要僅代表 2026-04-24 pipeline 執行的觀察範圍。

---

_scanned_by: wiki-daily-pipeline (cowork)_
_scanned_at: 2026-04-24_
_coverage: partial — 04/06 資料夾未列、frontmatter 未逐檔讀取_
