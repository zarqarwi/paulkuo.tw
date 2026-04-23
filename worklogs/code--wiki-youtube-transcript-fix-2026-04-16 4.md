# Handoff → Code：修復 YouTube Transcript 抓取 + 後處理管線

> **建議模型：Opus 4.6 + High**
> **Task Size：M**（預估 1-2 小時）
> **專案：paulkuo.tw — LLM Wiki 知識管線**
> **日期：2026-04-16**
> **來源：Cowork 技術盤點**

---

## 背景

YouTube ingest pipeline 的 Worker cron + CLI pull 架構已完整運作（每日掃 3 頻道 → KV pending → 本機 markdown），但有一個系統性問題：**23 個 YouTube source 的字幕全部抓取失敗**（transcript_lang 全為空字串，100% 失敗率）。

沒有逐字稿，後續的摘要產生、concept 提取、wikilinks 都無法自動化，每篇 source 都停在骨架狀態（「待 Cowork session 補充摘要」）。

---

## Step 0 偵察（先查再改）

```bash
# 1. 確認 transcript 失敗的具體錯誤
cd ~/Desktop/01_專案進行中/paulkuo.tw

# 檢查 Worker deploy log 或本地測試
grep -n 'transcript' worker/src/youtube-ingest.js | head -20

# 2. 用 tqef-api.js 的同源邏輯對比（它也有 youtube-transcript endpoint）
grep -n 'youtube-transcript\|fetchTranscript\|Innertube' worker/src/tqef-api.js | head -20

# 3. 本地測試某部影片的 transcript 抓取（挑一部已知有字幕的）
# 可用 curl 測 Innertube API，確認是 YouTube 端封鎖還是邏輯問題
curl -s "https://www.youtube.com/watch?v=8cGy6Fwt0zc" -H "User-Agent: Mozilla/5.0" | grep -o '"captionTracks":\[[^]]*\]' | head -1

# 4. 檢查 KV 裡 youtube:channels 是否已 seed
npx wrangler kv key get 'youtube:channels' --namespace-id c066a2fd7942494c8ead37cc518b191b --remote
```

---

## 問題分析（Cowork 盤點結論）

### P1：Transcript 100% 失敗

`worker/src/youtube-ingest.js` 的 `fetchTranscript()` 使用 Innertube ANDROID client 抓字幕：

```
watch page → INNERTUBE_API_KEY → /youtubei/v1/player (ANDROID client) → captionTracks → baseUrl → XML/JSON parse
```

這套做法從 Cloudflare Worker 發出時很可能被 YouTube 擋（429 或空 captionTracks）。程式碼有 `try/catch` 靜默 fallback 到 metadata-only，所以不會報錯，但字幕永遠拿不到。

**注意**：`tqef-api.js` 第 1129 行有一個 `POST /api/tqef/youtube-transcript` endpoint，邏輯幾乎一樣，可以用來做對照測試。

### P2：無 backfill 機制

已經 ingest 但缺字幕的 23 篇 source，目前沒有工具可以批次補字幕。

### P3：無後處理管線

Ingest 只產出骨架 markdown（metadata + 空 sections）。目前缺少：
- 摘要產生（用 LLM 從逐字稿產出）
- Concept 提取（識別 linked concepts）
- `links_to` / `linked_from` 更新
- 自動觸發 `wiki-kv-seed.cjs`

---

## 具體步驟

### Task 1：診斷並修復 transcript 抓取

**目標**：讓 `fetchTranscript()` 在 Worker 環境能穩定拿到字幕。

可能的修復方向（依優先順序）：

1. **改用 YouTube Data API v3 的 captions endpoint**
   - 已經有 `YOUTUBE_API_KEY`，可以直接用
   - `GET https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId={id}&key={key}`
   - 列出可用字幕 → 下載字幕文字
   - 優點：穩定、不被反爬蟲擋
   - 缺點：Captions API 下載需要 OAuth，不是 API key 就能用

2. **改用第三方 transcript service**
   - 例如 `https://www.searchapi.io/` 或開源的 `youtube-transcript-api` 等
   - 需評估成本和可靠性

3. **修復現有 Innertube 方法**
   - 嘗試改 client 參數（WEB / TVHTML5 / IOS 等不同 client）
   - 調整 User-Agent 和 headers
   - 增加更好的 retry 和 error logging

4. **Fallback 到 Whisper STT**
   - 下載音軌 → 用現有的 `callGroqWhisper()` 或 Deepgram 做語音轉文字
   - tqef-api.js 已經有完整的 STT 管線可以復用
   - 成本較高但最可靠

**建議**：先在本機測試方向 3（最低成本），如果確認是 YouTube 封鎖 CF Worker IP，再走方向 1 或 4。

### Task 2：建立 backfill 機制

在 `scripts/wiki-youtube-ingest.cjs` 增加 `--backfill` 模式：

```bash
node scripts/wiki-youtube-ingest.cjs --backfill
```

行為：
1. 掃描 `src/content/wiki/sources/youtube-*.md`
2. 找出 `transcript_lang: ""` 的檔案
3. 對每個 videoId 重新嘗試抓字幕
4. 成功 → 更新 markdown 的逐字稿 section + frontmatter `transcript_lang`
5. 失敗 → 記錄到 stderr，繼續下一個

### Task 3：後處理管線（enrichment）— 可分拆為獨立 Issue

在有逐字稿之後，建立 enrichment 步驟：

```bash
node scripts/wiki-youtube-enrich.cjs [--all | --file youtube-xxx.md]
```

行為：
1. 讀 source markdown，取出逐字稿
2. 呼叫 LLM（Workers AI 或 Anthropic）產出：
   - 200 字以內的繁體中文摘要
   - 3-5 個關鍵概念（對應現有 concepts/ 的 slug）
   - 建議的 pillar 分類
3. 寫回 markdown 的「原文摘要」和「關鍵概念」section
4. 更新 frontmatter：`confidence: low → medium`、`links_to: [...]`
5. 更新被連結 concept 的 `linked_from` 和 `source_count`

**注意**：這個步驟可以先做成 CLI 工具讓 Cowork 排程呼叫，不需要一開始就全自動。

---

## 上游假設（接手前先驗證）

| 假設 | 驗證方式 |
|------|---------|
| Worker cron 有在跑 YouTube scan | `npx wrangler kv key get 'youtube:last_scan' --namespace-id c066a2fd7942494c8ead37cc518b191b --remote` |
| youtube:channels 已 seed 到 KV | `npx wrangler kv key get 'youtube:channels' --namespace-id ...` |
| YOUTUBE_API_KEY 已設定 | `npx wrangler secret list` 或查 Worker 環境變數 |
| 23 篇 source 都沒字幕 | `grep -l 'transcript_lang: ""' src/content/wiki/sources/youtube-*.md \| wc -l`（應回傳 23） |

---

## 驗證方式

### Task 1 驗證
```bash
# 對一部已知有中文字幕的影片做 single ingest
node scripts/wiki-youtube-ingest.cjs https://www.youtube.com/watch?v=8cGy6Fwt0zc --force

# 檢查產出的 markdown
grep 'transcript_lang' src/content/wiki/sources/youtube-8cGy6Fwt0zc-*.md
# 預期：transcript_lang: "zh-Hant" 或 "zh" 或任何非空值

# 檢查逐字稿 section 不是空的
grep -A5 '## 逐字稿' src/content/wiki/sources/youtube-8cGy6Fwt0zc-*.md
# 預期：有 [MM:SS] 時間戳 + 文字內容
```

### Task 2 驗證
```bash
node scripts/wiki-youtube-ingest.cjs --backfill 2>&1 | tail -10
# 預期：看到 ✓ Updated: xxx.md 或明確的失敗原因

grep -l 'transcript_lang: ""' src/content/wiki/sources/youtube-*.md | wc -l
# 預期：數字顯著下降
```

---

## 注意事項

- ⚠️ **不要 deploy Worker 到 production 直到本機測試通過** — transcript 修復涉及 YouTube API 呼叫模式改變，需要先確認不會觸發 rate limit
- `buildSourceMarkdown()` 裡 pillar 硬編為 `ai`，但 `youtube-channels.json` 每個頻道有自己的 pillar 設定（wow=ai, 矽谷101=startup, 林亦=ai）。cron scan 已正確處理，但 single ingest 的 `--pillar` 參數要確保傳入
- backfill 會改動現有 23 個 markdown 檔案，建議先 `git stash` 或開 branch
- enrichment 步驟（Task 3）如果要用 Anthropic API，成本估算：23 篇 × ~2000 token/篇 ≈ 46K token，可控

## 信心等級

- **P1 診斷**：高 — 100% 失敗率代表是系統性問題，不是個案
- **P1 修復方向**：中 — 需要本機測試才知道哪個方向可行
- **P2 backfill**：高 — 純 CLI 工具，邏輯清楚
- **P3 enrichment**：中 — LLM 摘要品質需要 prompt 調優

## Integration Checklist

- [ ] transcript 修復不影響現有的 `tqef-api.js` YouTube transcript endpoint
- [ ] backfill 不會覆蓋已有摘要的 source（目前沒有，但要防呆）
- [ ] 新增的 CLI flag（`--backfill`）不影響現有的 `pullPending()` 和 `triggerIngest()` 模式
- [ ] 如果改了 Worker 的 `fetchTranscript()`，要同步檢查 `tqef-api.js` 是否需要一起改

---

## 儀表板更新提示

完成後請更新 Issue #157：
- 待辦的「YouTube ingest end-to-end」可改狀態
- 新增 YouTube transcript 修復的工作紀錄
