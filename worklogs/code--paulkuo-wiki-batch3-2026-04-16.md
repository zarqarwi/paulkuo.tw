# Code Handoff：Wiki Batch 3 — KV Seed + Ask UI Perplexity 改版

> 建立：2026-04-16（Cowork）
> 模型建議：**Sonnet 4.6 + Medium**
> Task Size：**M**
> 預估時間：45-60 分鐘

---

## 本次任務摘要

兩件事，按順序做：

1. **Task A（15 min）**：KV seed — 把新 concept 同步進 Cloudflare KV
2. **Task B（30-40 min）**：Ask UI 改版 — 把 `/wiki/ask` 從 chat bubble 改成 Perplexity 型

---

## 前置確認（先跑）

```bash
git pull origin main
```

確認看到這些新 commit：
- `feat(wiki): add concept token-economics`
- `feat(wiki): add concept software-disruption`
- `feat(wiki): add concept ai-capabilities-benchmark`
- `feat(wiki): add concept gpu-economics`
- `feat(wiki): add concept learning-as-meta-skill`
- `feat(wiki): add concept personal-knowledge-system`

---

## Task A：KV Seed

### 做什麼

Cowork 新建了 6 個 concept 頁面，需要跑 KV seed 讓它們進 search index 和 ask API。

### 指令

```bash
cd /path/to/paulkuo.tw
node scripts/wiki-kv-seed.cjs
```

### 預期輸出

```
Seeding wiki KV...
Concepts: 32
...
Done. wiki:index updated, 32 concepts seeded.
```

### 驗證

```bash
curl "https://api.paulkuo.tw/api/wiki/search?q=token" | jq '.results[].title'
# 應該看到 "Token Economics"

curl "https://api.paulkuo.tw/api/wiki/search?q=learning" | jq '.results[].title'
# 應該看到 "Learning as Meta-Skill"
```

### Worklog 格式

```
- {HH:MM} Wiki KV seed（6 個新 concept：token-economics 等）({commit SHA}) Code
```

---

## Task B：Ask UI 改版（Perplexity 型）

### 做什麼

`src/pages/wiki/ask.astro` 現在是 chat bubble 風格，改成 Perplexity 型：大搜尋框 + 答案頁 + 來源 chips + follow-up 建議。

### 確認 API 格式

```bash
curl -X POST https://api.paulkuo.tw/api/wiki/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "什麼是一人公司？"}' | jq .
```

回傳：
```json
{
  "answer": "...文字...[[one-person-team]]...",
  "related_concepts": [{ "slug": "one-person-team", "title": "一人公司" }],
  "sources": [{ "slug": "one-person-team", "title": "一人公司" }]
}
```

**後端不動，純前端改版。**

### 目標 UI 結構

```
┌─────────────────────────────────────────┐
│  breadcrumb: 首頁 / 知識圖譜 / 知識問答   │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 輸入你的問題，例如：AI 時代需要...│[問]│
│  └───────────────────────────────────┘  │
│                                         │
│  [初始狀態] 範例問題 chips（問完後隱藏） │
│                                         │
│  [問完後顯示] ─────────────────────     │
│  ## {user question}                     │
│                                         │
│  {答案，[[slug]] → 藍色 <a> 連結}       │
│                                         │
│  來源：[🔗 概念A] [🔗 概念B]            │
│                                         │
│  繼續探索：[什麼是概念A？] [關於概念B?] │
└─────────────────────────────────────────┘
```

### 改版規格

**搜尋框行為**
- Enter 或按鈕送出
- 送出後不清空，讓使用者可以修改再問
- loading 時在搜尋框下方顯示 spinner（不是 chat bubble）

**答案區（`#answerSection`，預設 `display:none`）**
- 問完後 `display:block`
- `<h2>` 顯示問題
- 答案段落：`[[slug]]` → `<a href="/wiki/{slug}/">` 藍色連結（沿用現有 `convertSlugsToLinks()` 邏輯）

**來源區（Sources）**
- 從 `data.sources` 渲染
- 每個：`<a href="/wiki/{slug}/" class="source-chip">🔗 {title}</a>`
- `sources` 為空時整個區塊隱藏

**繼續探索（Follow-up）**
- 從 `data.related_concepts` 取最多 3 個
- 點擊後把 `「什麼是 {title}？」` 填入搜尋框並自動送出
- `related_concepts` 為空時整個區塊隱藏

**範例問題 chips**
- 初始顯示，第一次問完後 `display:none` 永遠隱藏

**CSS**
- 延續現有 CSS 變數（`--text-primary`、`--accent-ai`、`--border`、dark mode 架構）
- Mobile（≤768px）：搜尋框和按鈕垂直排列

### 重要注意

- **整個重寫** `ask.astro`，不要保留 chat bubble 的 HTML
- `API_URL` 不變：`https://api.paulkuo.tw/api/wiki/ask`
- 不需要 chat history，每次問答獨立
- `related_concepts` 和 `sources` 都要做 null/empty check

### 驗證

```bash
npm run build   # 無 error
npm run dev     # 開 /wiki/ask 測試
```

手動測試流程：
1. 初始顯示範例問題 chips
2. 輸入問題 + Enter → loading spinner → 顯示答案
3. 答案中 `[[slug]]` 變藍色連結
4. 來源 chips 顯示，點擊跳轉正確
5. follow-up 點擊 → 自動送出新問題
6. 375px 寬度 layout 正常

### Worklog 格式

```
- {HH:MM} Wiki Ask UI 改版為 Perplexity 型（前端重寫 ask.astro）({commit SHA}) Code
```

狀態變更：
- Issue #157 待辦「對話查詢介面（Phase 3E）」→ `[x]`

---

## 上游假設

- ✅ 6 個新 concept 已 push 到 main（git pull 後確認）
- ✅ `wiki-kv-seed.cjs` 腳本存在且可執行
- ✅ API endpoint 可打通（Task A 驗證步驟確認）
- ✅ `src/pages/wiki/ask.astro` 現有 CSS 變數與 BaseLayout 相容

---

## 信心等級

**高** — Task A 是已知腳本，Task B 是純前端改版。API 格式明確，不動後端。

---

## Integration Checklist

- [ ] KV seed 後 search API 回傳 32 個 concept（原 26 + 新 6）
- [ ] Ask UI 改版不影響 `/wiki/` 主頁和 `/wiki/[slug]/` 頁面
- [ ] breadcrumb 連結正確
- [ ] sitemap 不需要變動（URL 不變）
- [ ] 無新 endpoint 新增，無防護繼承問題

---

## Commit 建議

```
feat(wiki): KV seed 32 concepts (Batch 3: +6 new)
feat(wiki): redesign ask UI to Perplexity-style search
```
