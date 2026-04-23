# Handoff: Wiki API Route Fix

> 方向：Cowork → Code
> 日期：2026-04-20
> 優先度：🔴 高（Wiki search / graph / ask 全部無法從前端使用）

---

## 問題描述

`paulkuo.tw/api/wiki/*` 的所有端點回傳 HTML 而不是 JSON。

```bash
curl -s -o /dev/null -w "%{http_code} %{content_type}" "https://paulkuo.tw/api/wiki/search?q=AI"
# 回傳：200 text/html; charset=utf-8
```

Worker 的程式碼與路由邏輯完全正確（`worker/src/index.js` line 452-459），問題出在 **paulkuo-ticker Worker 沒有綁定 paulkuo.tw domain 的路由**，Cloudflare Pages 先攔走了 `/api/*` 請求。

---

## 根本原因

`worker/wrangler.toml` 目前只有一條 route：

```toml
[[routes]]
pattern = "mazu.today/*"
zone_name = "mazu.today"
```

paulkuo.tw 沒有對應的 `[[routes]]`，所以 `/api/wiki/*` 的請求全部被 Cloudflare Pages（paulkuo-tw）吃掉，回傳靜態 HTML。

---

## 關鍵發現（調查結論）

**前端呼叫 Wiki API 的方式**：

| 端點 | 前端呼叫位址 |
|------|------------|
| `/api/wiki/ask` | `https://api.paulkuo.tw/api/wiki/ask`（ArticlePage.astro） |
| `/api/wiki/search` | 未找到前端呼叫，但 Wiki 搜尋頁面理論上需要 |
| `/api/wiki/graph` | 未找到前端呼叫 |

**重要**：`api.paulkuo.tw` 是 paulkuo-ticker Worker 的另一個 hostname（推測是 Cloudflare Worker 的預設 workers.dev 或另一條 route）。已知 `/api/wiki/ask` 在 ArticlePage.astro 是打 `api.paulkuo.tw`，**不是** `paulkuo.tw`，所以 Wiki Ask 功能目前可能已經正常。

**需要 Code 在執行前確認的問題**：

1. `api.paulkuo.tw` 是否已解析到 paulkuo-ticker Worker？驗証：
   ```bash
   curl -s "https://api.paulkuo.tw/api/wiki/search?q=AI" | head -c 100
   ```

2. paulkuo.tw 的 Cloudflare Zone 是否與 paulkuo-ticker 在同一個帳號？（帳號 ID: `4bf7e4b38d30ab7d4a191eefbf393133`）驗証：
   ```bash
   cd ~/Desktop/01_專案進行中/paulkuo.tw/worker && wrangler whoami
   ```

3. `functions/` 目錄下有沒有 Cloudflare Pages Function 攔截 `/api/*`？
   ```bash
   ls ~/Desktop/01_專案進行中/paulkuo.tw/functions/
   ```

---

## 決策樹（Code 依驗証結果擇一執行）

### 情況 A：`api.paulkuo.tw` 已正確路由到 Worker
→ **不需要修 wrangler.toml**，只需確認 Wiki 頁面的前端都打 `api.paulkuo.tw` 而不是 `paulkuo.tw`。
→ 掃描前端所有 `/api/wiki` 的呼叫，若有打 `paulkuo.tw/api/wiki` 的改成 `api.paulkuo.tw/api/wiki`。

### 情況 B：`api.paulkuo.tw` 未正確路由（也回傳 HTML）
→ 需要在 `worker/wrangler.toml` 加 paulkuo.tw route：
```toml
[[routes]]
pattern = "api.paulkuo.tw/*"
zone_name = "paulkuo.tw"
```
→ 加完後 `cd worker && wrangler deploy --config wrangler.toml`
→ 驗証：`curl -s "https://api.paulkuo.tw/api/wiki/search?q=AI"` 應回 JSON

### 情況 C：functions/ 有 Pages Function 攔截 `/api/*`
→ 需要調查 Pages Function 的設計意圖，再決定是刪除 function 還是加 `_routes.json` 排除 `/api/wiki/*`。

---

## 影響範圍

**本次修改只影響 Wiki API 路由，不影響：**
- Formosa（打 `api.paulkuo.tw`）
- Auth（打 `api.paulkuo.tw`）
- mazu.today（已有獨立 route）
- 前端靜態頁面

**共用檔案異動**：`worker/wrangler.toml`（若情況 B）→ 僅影響 Worker 路由，不影響其他子專案邏輯。

---

## 執行步驟（情況確認後才執行）

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw

# Step 1：確認 api.paulkuo.tw 狀態
curl -s "https://api.paulkuo.tw/api/wiki/search?q=AI" | head -c 200

# Step 2：確認 functions/ 目錄
ls functions/

# Step 3（依情況）：修改並部署
# 情況 A：掃前端 wiki 呼叫
grep -r "paulkuo\.tw/api/wiki" src/ --include="*.ts" --include="*.astro" --include="*.js"

# 情況 B：加 route 後部署
cd worker && wrangler deploy --config wrangler.toml
```

---

## Smoke Test（執行完必做）

```bash
# Wiki Search
curl -s "https://api.paulkuo.tw/api/wiki/search?q=AI" | head -c 200
# 預期：JSON 格式，有 results 欄位

# Wiki Graph
curl -s "https://api.paulkuo.tw/api/wiki/graph" | head -c 200
# 預期：JSON 格式

# Wiki Ask（POST）
curl -s -X POST "https://api.paulkuo.tw/api/wiki/ask" \
  -H "Content-Type: application/json" \
  -d '{"question":"什麼是循環經濟"}' | head -c 200
```

結果寫進 `worklogs/worklog-2026-04-20.md`。

---

## 相關檔案

- `worker/wrangler.toml` — Worker 路由設定
- `worker/src/index.js` line 451-459 — Wiki API 路由邏輯
- `src/components/ArticlePage.astro` — 唯一確認有呼叫 `api.paulkuo.tw/api/wiki/ask` 的前端
