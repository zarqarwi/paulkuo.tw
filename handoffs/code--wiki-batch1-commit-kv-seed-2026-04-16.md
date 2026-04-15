# Handoff → Code：Wiki Batch 1 收尾（commit + KV seed + stats/graph 重建）

- **建議模型**：Haiku 4.5（逐步操作、無邏輯判斷、純執行）
- **Size**：S（10-15 分鐘）
- **前置**：Cowork 已在 `src/content/wiki/sources/` 寫入 5 個新檔，Issue #157 已同步 corpus → 233。本次純收尾。

---

## 背景

Cowork 執行 `wiki-ingest-scanner` 後，從 04_AI與科技 批次 ingest 5 篇 public source。檔案已寫入但還沒 commit、KV 還是舊的、stats/graph 還沒重算。

Issue 追蹤：[#157](https://github.com/zarqarwi/paulkuo.tw/issues/157)（已更新）

---

## 起手路徑

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
git status -sb
```

預期看到 5 個 untracked：

```
?? src/content/wiki/sources/getnote-343376-attention-time-paradigm.md
?? src/content/wiki/sources/getnote-703240-ai-coding-harness-engineering.md
?? src/content/wiki/sources/getnote-732352-content-moat-inauguration.md
?? src/content/wiki/sources/getnote-880568-cybernetics-homeostasis-tacit-knowledge.md
?? src/content/wiki/sources/getnote-975896-gutenberg-meets-ai.md
```

如果還有其他檔，先看清楚再決定是否納入本批。

---

## Step 1：Commit 新 sources

```bash
git add src/content/wiki/sources/getnote-343376-attention-time-paradigm.md \
        src/content/wiki/sources/getnote-703240-ai-coding-harness-engineering.md \
        src/content/wiki/sources/getnote-732352-content-moat-inauguration.md \
        src/content/wiki/sources/getnote-880568-cybernetics-homeostasis-tacit-knowledge.md \
        src/content/wiki/sources/getnote-975896-gutenberg-meets-ai.md

git commit -m "$(cat <<'EOF'
wiki: ingest 5 public sources (batch 1)

- attention-time-paradigm: AI 時代的生產力革命（從人天到注意力時長）
- ai-coding-harness-engineering: AI 編碼代理 Harness 工程
- content-moat-inauguration: 用內容能力構建人生護城河（發刊詞）
- gutenberg-meets-ai: 當古登堡遇上 AI 狂歡
- cybernetics-homeostasis-tacit-knowledge: 當控制論遇見內穩態與隱性知識

Source：get_筆記/04_AI與科技（public，非錄音卡）
Pillar：ai × 4, startup × 1
Wikilinks：703240 ⟷ 880568（雙向）、732352 → yu-kunun-personal-ip

Ref: #157

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Step 2：重建 stats.json + graph.json

**重要**：`scripts/wiki-kv-seed.cjs` 只讀既有的 stats.json / graph.json，不會自動重算。所以要先重建。

如果有 rebuild script（例如 `scripts/wiki-rebuild-stats.mjs` 或類似名稱），執行它。

如果沒有現成腳本，手動更新 `src/content/wiki/stats.json`：

**目前 stats.json**（2026-04-10 的舊數）：
```json
{
  "total_pages": 235,
  "by_type": { "concept": 22, "source": 226, "entity": 1 },
  "by_source_type": { "article": 93, "getnote": 113, "concept": 22, "clip": 8, "entity": 1 },
  "graph": { "nodes": 235, "edges": 459 },
  "generated": "2026-04-10",
  "total_nodes": 239,
  "total_edges": 488
}
```

**本批次變動**：
- source +5（全部 getnote）
- by_pillar：ai +4, startup +1
- by_visibility：public +5
- by_source_type.getnote：113 → 118
- graph.nodes +5；graph.edges：本批內雙向 wikilink 1 對（703240 ⟷ 880568）+ 2 個單向（732352 → yu-kunun-personal-ip、880568 → 703240 反向已算），大約 +6 條 edges

建議走法：跑 existing rebuild script（如果找得到）；找不到就用你判斷。Paul 在場的話可以用 `wiki_rescan.py` 作為輸入來源。

---

## Step 3：跑 KV seed

```bash
node scripts/wiki-kv-seed.cjs
```

預期輸出：`Uploaded 22 concepts + index + graph + stats`。

注意這個腳本只上傳 concepts（不是 sources）+ index + graph + stats。Source 可搜尋性依賴 concept 頁面（見 Issue #157「架構備忘」），本批次 5 個 source 的搜尋曝光之後要靠 Batch 1.5 的 concept 擴充（見下）。

---

## Step 4：Commit stats/graph + push

```bash
git add src/content/wiki/stats.json src/content/wiki/graph.json
git commit -m "$(cat <<'EOF'
wiki: rebuild stats + graph for batch 1 (+5 sources)

- total_pages 235 → 240
- getnote 113 → 118
- graph nodes +5, edges +6

Ref: #157

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"

git push origin main
```

---

## Step 5：回報 Issue #157

用 `gh issue comment 157` 或 GitHub MCP 加一則 comment：

```
✅ Batch 1 收尾完成

- Commit: `<sha>`（ingest 5 sources）+ `<sha>`（rebuild stats/graph）
- KV seed：wiki:index / wiki:graph / wiki:stats + 22 concepts 已上傳
- 驗證：https://paulkuo.tw/api/wiki/search?q=attention 應能找到新 source 的關聯 concept
```

再把 body 裡「🟡 待收尾」章節全部 check ✅。

---

## 下一輪（不在本 handoff 範圍）

- **Batch 1.5 — Concept 擴充**：建議建 4 個新 concept：`attention-time`、`harness-engineering`、`tacit-knowledge`、`content-moat`。這 4 個 concept 如果都做，才能把這批 source 從「索引不到的孤島」升級成「可搜尋的知識節點」。
- **Batch 2 — 下批 ingest**：萬維鋼專欄 4 篇 + untitled 3 篇，由 Cowork 執行，等本批 KV 收尾後再啟動。

---

## 建議模型 / Effort（給後續 handoff）

| 任務 | Session | 模型 | Effort |
|------|---------|------|--------|
| **本 handoff（commit + seed）** | Code | Haiku | S（10-15m）|
| Batch 1.5 concept 擴充 × 4 | Code | Sonnet | M（30-45m）|
| Batch 2 ingest 萬維鋼 4 篇 | Cowork | Sonnet | M |
| column frontmatter scanner | Code | Sonnet | S（20m）|
