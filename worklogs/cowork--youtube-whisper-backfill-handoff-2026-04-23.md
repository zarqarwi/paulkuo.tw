# YouTube Whisper Backfill Handoff

> 建立：2026-04-23
> Cowork session：paulkuo.tw 專案盤點（`worklogs/2026-04-23-project-audit.md`）
> 目標 session：Code [LLM Wiki]
> 來源：Project Audit §2 PENDING + §8.3
> **建議模型**：Claude Sonnet 4.6 + Effort Low（已知流程，單純補資料）

---

## 問題描述

LLM Wiki 的 YouTube 逐字稿 backfill 流程卡在缺 secret。

現況：
- Whisper 後處理用 Groq API（worker/src/translator.js 使用 `GROQ_API_KEY`）
- 本地 `.env` 或 Cloudflare Workers secret 缺這把 key
- `scripts/wiki-youtube-ingest.cjs` 跑不完整

這個卡住不動會導致 Wiki 的 sources 覆蓋率停在目前數字，之後 concept 頁的 source_count 累積也停。

---

## 需要做的事：三選一路徑

### 路徑 A：Paul 已提供 GROQ_API_KEY

如果 Cowork 這邊已從 Paul 拿到 key 並貼進 handoff 底部的「Secret 區塊」：

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw

# Worker 端
cd worker
wrangler secret put GROQ_API_KEY --config wrangler.toml
# 貼 key 進互動 prompt

# 本地腳本端（如果有本地跑逐字稿的需求）
echo "GROQ_API_KEY=<key>" >> .env.local
```

然後：

```bash
# 跑單支測試
node scripts/wiki-youtube-ingest.cjs --test --video <某支尚未 ingest 的 ID>

# 確認輸出 OK 後批跑剩餘
node scripts/wiki-youtube-ingest.cjs --batch
```

### 路徑 B：Paul 還沒給 key

**不要用假 key / dummy 跑過去**。回報 Cowork「等 Paul 提供 GROQ_API_KEY」，handoff 停在這。

### 路徑 C：改用替代方案（需 Cowork 授權才能走）

如果 Paul 決定放棄 Groq 改走 OpenAI Whisper 或 Cloudflare AI 內建 Whisper，這是**架構變更**，不在本 handoff 範圍。Code 不要擅自切換，回報 Cowork 重開新 handoff。

---

## 驗證

backfill 跑完後：

```bash
# 1. 確認新 source 檔有逐字稿欄位
head -40 src/content/wiki/sources/youtube-<new-id>.md

# 2. 跑 wiki-enrich 確認能產出 concept_links
node scripts/wiki-enrich.cjs --source <new-id>

# 3. 確認 Wiki search 能找到
curl -s "https://api.paulkuo.tw/api/wiki/search?q=<關鍵詞>" | jq '.hits[0]'
```

---

## 跨專案影響

- `worker/src/translator.js` 是 **Wiki + 主站 + TQEF 共用模組**（見 shared-file-impact-map.md）
- 只加 secret 不改程式碼 → 共用模組行為**不變** → 無須跑跨專案 smoke test
- 如果改動了 `translator.js` 程式碼（不在本 handoff 範圍），commit message 必須標 `[影響: Wiki + 主站 + TQEF]` 並跑 shared-file-impact-map §最低驗證

---

## 完成後請做

1. 在本 handoff 底部加「Code 回報」區塊
2. 更新 `worklogs/PENDING.md`：把 YouTube Whisper backfill 項目從 🟡 改為 ✅ 並標完成日期
3. Worklog 三維度紀錄
4. 回報 Cowork

---

## Secret 區塊（Paul 或 Cowork 填）

```
GROQ_API_KEY：（如由 Paul 口頭提供，Cowork 複製貼上，不要寫進 git）
提供時間：
```

⚠️ 這份 handoff 是 committed 檔案，**不要把真正的 key 貼進這裡**。key 只進 `wrangler secret` 和 `.env.local`（已在 `.gitignore`）。

---

## Code 回報區塊

```
驗收時間：
路徑選擇：A / B / C
wrangler secret put 結果：
單支測試影片 ID：
單支測試結果：
批次 ingest 完成支數：
wiki-enrich 能否抓到新 source：
curl wiki/search 回傳：
PENDING.md 更新：
```
