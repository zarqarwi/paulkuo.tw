# Code Handoff：Wiki Ask UI — Perplexity 型改版

> 建立：2026-04-16（Cowork）
> 模型建議：**Sonnet 4.6 + Medium**
> Task Size：**M**（主要改前端 ask.astro，後端不動）

---

## 背景

`/wiki/ask` 頁面已存在（`src/pages/wiki/ask.astro`），目前是 ChatGPT 對話氣泡風格。
Paul 決定改為 Perplexity 型：大搜尋框 + 獨立答案頁 + inline 來源標籤 + follow-up 建議。
後端 `/api/wiki/ask`（`worker/src/wiki-api.js`）完整可用，不需要改。

---

## Step 0 偵察（先讀再改）

執行前先確認這兩個檔案的現況：

```bash
# 看現有 ask.astro 結構
cat src/pages/wiki/ask.astro

# 確認 API 回傳格式
curl -X POST https://api.paulkuo.tw/api/wiki/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "什麼是一人公司？"}' | jq .
```

API 應該回傳：
```json
{
  "answer": "...文字... [[one-person-team]] ...文字...",
  "related_concepts": [{ "slug": "one-person-team", "title": "一人公司" }],
  "sources": [{ "slug": "one-person-team", "title": "一人公司" }]
}
```

---

## 具體步驟

### 1. 完整替換 `src/pages/wiki/ask.astro`

把現有的 chat bubble UI 整個替換成 Perplexity 型。以下是完整規格：

#### 頁面佈局（Perplexity 型）

```
┌──────────────────────────────────────┐
│  breadcrumb: 首頁 / 知識圖譜 / 知識問答  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │  [搜尋框：輸入你的問題...]  [問] │  │
│  └────────────────────────────────┘  │
│                                      │
│  ── 範例問題 chips（初始狀態才顯示）──  │
│  [什麼是 AI Agent 經濟？]             │
│  [Paul 怎麼看一人公司？]              │
│  ...                                 │
│                                      │
│  ── 答案區（問完後顯示）──            │
│  問題：{user question}               │
│                                      │
│  {answer text，[[slug]] 轉成藍色連結} │
│                                      │
│  來源：                              │
│  [概念 A 🔗] [概念 B 🔗] ...         │
│                                      │
│  繼續探索：                          │
│  [什麼是一人公司？]  [AI 時代的 ...?] │
└──────────────────────────────────────┘
```

#### 關鍵 UX 細節

**搜尋框**
- 寬度 100%，border-radius: 0.75rem
- placeholder：「輸入你的問題，例如：AI 時代需要什麼能力？」
- Enter 送出
- 送出後搜尋框保留 user input（不清空），讓使用者可以修改再問

**答案區**
- 初始隱藏（`display: none`），問完後顯示
- 問題標題：`h2` 顯示 user question
- 答案文字：`[[slug]]` 全部轉成 `<a href="/wiki/{slug}/">` 藍色連結
- loading state：搜尋框下方出現 spinner（不是 chat bubble）

**來源（Sources）**
- 從 API 回傳的 `sources` array 渲染
- 每個 source 是一個 pill/chip，點擊跳轉 `/wiki/{slug}/`
- 格式：`🔗 {title}`

**繼續探索（Follow-up）**
- 從 `related_concepts` array 渲染（最多 3 個）
- 格式：點擊後把 `「什麼是 {title}？」` 自動填入搜尋框並送出
- 如果 related_concepts 是空的就不顯示這區

**範例問題 chips**
- 只在「尚未問過任何問題」時顯示（初始狀態）
- 問完第一個問題後隱藏

#### CSS 設計原則
- 延續現有的 CSS 變數（`--text-primary`、`--accent-ai`、`--border` 等）
- 支援 dark mode（現有 `html[data-theme="dark"]` 架構）
- mobile: 搜尋框和按鈕垂直排列，答案區全寬

---

### 2. 後端不改

`worker/src/wiki-api.js` 的 `handleWikiAsk` 不需要修改。
回傳的 `related_concepts` 在前端用來生成 follow-up 問題即可。

---

## 上游假設（接手前先驗）

- ✅ API endpoint `https://api.paulkuo.tw/api/wiki/ask` 可打通（先 curl 確認）
- ✅ `src/pages/wiki/ask.astro` 的 CSS 變數與 `BaseLayout` 相容
- ✅ 現有 `related_concepts` 是 `{ slug, title }` 物件陣列（不是純 string）

---

## 驗證方式

1. `npm run build` 無 error
2. 本機 `npm run dev` 開 `/wiki/ask`：
   - 初始顯示範例問題 chips
   - 輸入問題 + Enter → loading → 顯示答案
   - 答案中 `[[slug]]` 變成藍色連結
   - 來源 chips 顯示，點擊跳轉正確
   - follow-up 點擊 → 自動送出新問題
3. 手機寬度（375px）layout 正常

---

## 注意事項

- **不要保留 chat bubble UI 的 HTML 結構**，整個重寫比較乾淨
- `is:inline` script 中的 `API_URL` 保持不變：`https://api.paulkuo.tw/api/wiki/ask`
- 現有 `convertSlugsToLinks()` 函式邏輯可以直接複用
- 不需要 chat history，每次問答是獨立的（Perplexity 型不是 chat thread）
- `related_concepts` 有時候可能是空陣列，follow-up 區要做 null check

---

## 信心等級

**高** — 前端改版，邊界清楚。後端已通且格式確認，API 不動。

---

## Integration Checklist

- [ ] `/wiki/ask` 改版不影響 `/wiki/` 主頁（各自獨立頁面）
- [ ] breadcrumb 連結正確（`/` → `/wiki/` → `/wiki/ask/`）
- [ ] 改版後 sitemap 不需要變動（URL 不變）
- [ ] OG image 沿用 BaseLayout 預設即可（不需要特別處理）
- [ ] 新增 endpoint：無（後端不動）

---

## Worklog 回寫

完成後寫 `worklogs/worklog-2026-04-16.md`，格式：

```markdown
- {HH:MM} Wiki Ask UI 改版為 Perplexity 型（前端重寫 ask.astro）({commit SHA}) Code
```

狀態變更：
- Issue #157 待辦「對話查詢介面（Phase 3E）」→ `[x]` 完成
