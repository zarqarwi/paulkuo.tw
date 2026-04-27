# Wiki 每日管線報告 2026-04-27

> 執行時間：2026-04-27 ~02:15 UTC（台北 ~10:15）
> 執行端：Cowork（scheduled task wiki-daily-pipeline）

## Web clips：新增 15 則

| pillar | 標題 |
|--------|------|
| ai | MCP 'design flaw' puts 200k servers at risk: Researcher（theregister.com 2026-04-16）|
| ai | Anthropic MCP Design Vulnerability Enables RCE, Threatening AI Supply Chain（thehackernews.com）|
| ai | How Anthropic's Model Context Protocol Allows For Easy Remote Execution（hackaday.com 2026-04-24）|
| ai | AI agent trends 2026 report（Google Cloud）|
| ai | 2026 企業如何佈局 AI Agent？5 大技術趨勢（iKala）|
| circular | 中東戰火 × 半導體氦氣危機與永續供應鏈（sustainprox 2026-03-16）|
| circular | 2026 台灣產業趨勢展望（Deloitte）|
| life | 相信的力量（vocus / 能動性 5）|
| life | 內在動機 vs 外在動機（信誼基金會）|
| startup | 清華沈陽團隊《一人公司發展研究報告 1.0》（smartcity.team）|
| startup | 代理式 AI 營運模式 2026 規模化與 ROI 全解析（perform-global）|
| startup | 從技術落地到利潤實踐：2026 ROI 決勝點（先知科技）|
| faith | 原教旨中的人工智能：從古代宗教到未來信仰（zhihu）|
| faith | AI 重塑宗教體驗，語音 Agent 能否成為突破點？（zhihu / Hallow App）|
| faith | 人工智能會威脅到基督教信仰嗎？（tisi.org）|

備註：Brave 免費 API 無 freshness=pd 參數，本批次選擇近一個月內帶日期 URL 的優先項目；嚴格「近 24 小時」過濾無法在 Cowork 端達成。

## YouTube：新增 0 支

- Cowork CF MCP 不支援 KV key 操作（only namespace 層級），無法直接讀寫 `youtube-pending` key
- 04-25 split decision 後 YouTube ingest 改由本機 launchd 09:50 跑
- 今日 commit log 無 `[wiki-daily] youtube:` 條目，視為「本機任務未跑或佇列空」
- 建議：Paul 確認本機 launchd `wiki-youtube-ingest` 是否正常啟動

## 待 ingest 筆記：132 則（public 13 / internal 105；private skip 14）

- get-biji-notes 自 2026-04-22 push 後未變動，清單與 04-26 scanner 結果一致
- 04_AI與科技、06_個人成長與學習 兩資料夾 GitHub Contents API 一次回傳超量，本日未重新逐筆比對 raw_note_id
- 嚴格 raw_note_id 對齊建議由本機 wiki_rescan.py 跑後發布

## 建議行動

1. **批次 ingest**（K=132 > 0）：建議開 `[WIKI]` Cowork session 從 public 13 篇起跑，每批 5–10 篇進度。先動 03_環保循環經濟（11 篇 pillar 對齊度高），再清理 04_AI與科技 兩支 untitled。
2. **YouTube launchd 健康檢查**：確認 09:50 wiki-youtube-ingest 是否仍 active，或佇列為空（KV `youtube-pending` 該為空？）。
3. **Brave freshness 限制**：若希望嚴格 24 小時內 clips，可改用 Worker side 的 freshness filter，或 launchd 端跑 brave-search。
4. **Scanner 對齊精度**：今日 Cowork 端 raw_note_id 對齊精度不及本機 scanner，建議保留本機 scanner 為 source of truth；Cowork 僅在資料倉確有變動（透過 get-biji-notes 最新 commit 觀察）時才覆寫 pending.md。

## 明日重試清單

- 無（Brave 雖部分 query 觸 rate limit，但已成功補完 8 個 pillar 主題搜尋）

## 摘要回報（給 Paul）

- 今日 web clips +15 則（ai 5 / circular 2 / life 2 / startup 3 / faith 3），已 commit `wiki/raw/clips/2026-04-27/`
- YouTube 隊列：本機 launchd 路徑，今日 0 支（請檢查任務狀態）
- 待 ingest：132 則（public 13 / internal 105），與昨日相同（源 repo 未變）
- 是否需要介入：是 — 建議排程一個 `[WIKI]` Cowork session 開始消化 132 則積壓
