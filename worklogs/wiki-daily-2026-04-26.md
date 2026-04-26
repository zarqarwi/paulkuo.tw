---
title: Wiki 每日管線報告 — 2026-04-26
generated_at: 2026-04-26
generator: wiki-daily-pipeline (Cowork scheduled task)
runtime: ~10 min
---

# Wiki 每日管線報告 2026-04-26

## Web clips：新增 14 則

依五大 pillar 用 Brave search 搜尋並 dedupe（對 04-25 批次 URL 比對通過），commit 路徑 `wiki/raw/clips/2026-04-26/`，全部 visibility=internal（待 Paul 審）。

| Pillar | 新增 | 重點 title |
|--------|------|-----------|
| ai (4) | techorange、jtdatastoryteller、ikala、gravitee | 2026 AI Agent 趨勢 / MCP Spotlight / 88% 企業遭遇 Agent 資安事件 |
| circular (3) | dnb、digitimes、tsmc | 半導體 ESG 永續生態圈 / 台積電 ESG 入口 |
| life (2) | thenewslens、benihi | 自我決定理論 SDT / 內在動機啟動 |
| startup (2) | blocktempo、cnblogs | 一人公司結構性機遇 / OPC AI 時代組織革命 |
| faith (3) | ct.org.tw x2、tcnn | AI 福音處境化 / 神學 vs AI / AI 時代的公共神學 |

> 04-25 重複命中：cloud.google.com/resources/content/ai-agent-trends-2026 已 dedupe。
> 排除 Wikipedia / books.com.tw / YouTube 連結（YouTube 走 Step 2 管線）。

## YouTube：新增 0 支（Cowork 端）

依 2026-04-25 拍板（Issue #186）的拆檔決策，YouTube ingest 已切換到本機 launchd（`~/Library/LaunchAgents/tw.paulkuo.wiki-youtube.plist`，09:50 daily）。

- 本機 09:50 launchd 跑完會 push `worklogs/wiki-youtube-daily-YYYY-MM-DD.md`
- 截至 Cowork 10:02 啟動時（UTC 01:42 ≈ 台北 09:42），**今日 worklog 尚未生成**（launchd 預定 09:50 才跑）
- Cowork 端不再直接接 KV pending（CF MCP 沒 KV key 操作權限，記憶 #feedback_cowork_no_kv_key_ops）
- 明日報告會回看今日 launchd 結果並補摘要

## 待 ingest 筆記：82 則（public 9 則 / internal 73 則）

掃 `zarqarwi/get-biji-notes`（master）共 208 則 substantive + untitled 候選，比對 paulkuo.tw `src/content/wiki/sources/` 下的 `getnote-XXXXXX-` 已 ingest 清單（152 個 raw_note_id 後 6 碼）。

| 資料夾 | Visibility | 待 ingest |
|--------|-----------|----------|
| 03_環保循環經濟 | public | 1 |
| 04_AI與科技 | public | 8 |
| 02_醫療健康 | internal | 10 |
| 05_商務會議 | internal | 14 |
| 06_個人成長與學習 | internal | 28 |
| 08_其他 | internal | 21 |
| **小計** | | **82** |

> 詳細逐筆清單見 `worklogs/wiki-ingest-pending.md`（commit 48225c1）

### 限制與後續

1. **01_專欄文章子資料夾未展開**（OpenClaw_上手准备、共读_*、快刀青衣_*、萬維鋼_*）— scanner 本輪未遞迴下到子資料夾，下個版本要補。
2. **錄音卡 tag 降級未套用** — scanner 用資料夾預設 visibility，未逐筆讀 frontmatter 的 `tags`。05_商務會議 內若有錄音卡需另行降為 private。實際 ingest 前 Cowork batch 流程會逐筆覆核。

## 建議行動

- 公開類 9 則 → 排 [WIKI] Cowork session 批次 ingest（**Sonnet 4.6, effort=medium**），目標本週吸 5-10 則
- 內部類 73 則 → 累積較多，建議 Paul 確認去識別化標準後分週批次走（**Sonnet 4.6, effort=high**），優先 04 / 02
- Issue #157 Wiki 儀表板：本批 commit 後 corpus 計數仍為 307（尚未實際 ingest，只是收 raw clips + scanner report）

## 明日重試清單

- 無 API rate limit（Brave Search 中段觸過限額但已分批重試完成）
- 無失敗 commit

## Commit 紀錄

- `b8b73a9` `[wiki-daily] clips: 新增 14 則`
- `48225c1` `[wiki-daily] scanner: 82 則待 ingest`
- 本檔（report）：`[wiki-daily] report: 2026-04-26 完成`

---

**狀態：✅ 完成。**

**需要 Paul 介入嗎？**
- ⚠️ 本機 YouTube launchd 是否照預期 09:50 跑？需 Paul 看一下 `~/Library/Logs/wiki-youtube.log`
- 📌 82 則待 ingest 累積，建議本週排一個 [WIKI] Cowork batch session 處理 public 類
