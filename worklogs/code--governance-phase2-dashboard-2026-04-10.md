# Handoff → Code：專案治理框架 Phase 2 — API + Dashboard

> **Repo 路徑：`~/Desktop/01_專案進行中/paulkuo.tw`**
> 開工前先 `cd ~/Desktop/01_專案進行中/paulkuo.tw`

建議模型: Sonnet
預估量級: L（30-45 分鐘，Worker 新增 API + KV seed 腳本 + Astro 頁面）

---

## 背景

Phase 1 已完成資料管線（`worklogs/governance/` + `scripts/collect-session-metrics.sh` + session-handoff v4.5）。

Phase 2 要做的是：把收集到的 metrics 資料透過 KV 提供 API，然後在前端建一個 auth-gated 的 Dashboard 頁面讓 Paul 看到所有專案的狀態。

**參考文件：** `worklogs/governance-framework-spec.md`（第五、六節）

---

## Step 0 偵察

```bash
# 確認 Phase 1 產出都在
ls worklogs/governance/projects.json worklogs/governance/automation-registry.json
jq '.projects | length' worklogs/governance/projects.json  # 預期：6

# 確認現有 KV key 命名慣例
grep -n "TICKER_KV" worker/src/wiki-api.js | head -10

# 確認 Worker 路由入口
grep -n "api/wiki" worker/src/index.js | head -5

# 確認 AuthGate 元件位置
find src -name "AuthGate*" -type f
```

---

## 架構總覽

```
worklogs/governance/*.json ──→ governance-kv-seed.cjs ──→ TICKER_KV
worklogs/metrics/**/*.json ─┘                               │
                                                             ↓
                                              Worker API (/api/governance/*)
                                                             ↓
                                              Dashboard 頁面 (/dashboard/)
                                              （auth-gated，只有 Paul 能看）
```

---

## 步驟 1：先 commit 上一輪 Cowork 未推的檔案

```bash
git add worklogs/issue-155-body.md \
       worklogs/PENDING.md \
       worklogs/metrics/paulkuo-main/2026-04-10-cowork.json \
       worklogs/cowork--next-session-handoff-2026-04-10.md

git commit -m "chore: 治理框架 Phase 1 收尾 — 儀表板更新 + 首筆 metrics + handoff"
git push
```

---

## 步驟 2：建 KV Seed 腳本 — `scripts/governance-kv-seed.cjs`

**參考：** `scripts/wiki-kv-seed.cjs` 的模式——Node.js 讀檔 → JSON 序列化 → `wrangler kv key put --remote`

**KV Key 設計：**

| Key | 內容 | 來源 |
|-----|------|------|
| `gov:projects` | projects.json 全文 | `worklogs/governance/projects.json` |
| `gov:automation` | automation-registry.json 全文 | `worklogs/governance/automation-registry.json` |
| `gov:metrics:{project_id}` | 該專案所有 metrics 的彙總（按日期排序） | `worklogs/metrics/{project_id}/*.json` |
| `gov:summary` | 全專案彙總摘要（每專案最新活動日、累計 commits、覆蓋率） | 腳本計算產出 |

**腳本邏輯：**

```javascript
// 1. 讀 projects.json → put gov:projects
// 2. 讀 automation-registry.json → put gov:automation
// 3. 遍歷 worklogs/metrics/{project_id}/ 目錄
//    - 讀每個 JSON 檔，合併成陣列，按 date 降序排列
//    - put gov:metrics:{project_id}
// 4. 計算 summary:
//    - 每個 project: last_activity_date, total_commits, total_deploys, total_files_changed
//    - 全域: automation_coverage_rate, total_metrics_entries
//    - put gov:summary
```

**Namespace ID：** `c066a2fd7942494c8ead37cc518b191b`（跟 wiki-kv-seed 一樣，共用 TICKER_KV）

**用法：**
```bash
node scripts/governance-kv-seed.cjs
```

---

## 步驟 3：建 Worker API — `worker/src/governance-api.js`

**模式：** 跟 `wiki-api.js` 一樣，export named handler functions，在 `index.js` 裡 import + 加路由。

### Endpoint 1：`GET /api/governance/summary`

回傳全專案彙總摘要。Dashboard 首頁用這支。

```json
{
  "projects": [
    {
      "id": "paulkuo-main",
      "name": "Paulkuo 網站",
      "status": "active",
      "last_activity": "2026-04-10",
      "total_commits": 47,
      "total_deploys": 12,
      "total_files_changed": 156,
      "health": "green"
    }
  ],
  "automation": {
    "coverage_rate": 0.667,
    "automated_count": 6,
    "manual_count": 3,
    "candidates": ["wiki-batch-ingest", "issue-155-content-update"]
  },
  "last_updated": "2026-04-10T00:00:00Z"
}
```

**實作：** `TICKER_KV.get('gov:summary')` → JSON.parse → return

### Endpoint 2：`GET /api/governance/projects`

回傳完整專案註冊表。

**實作：** `TICKER_KV.get('gov:projects')` → return

### Endpoint 3：`GET /api/governance/metrics/:project_id`

回傳單一專案的 metrics 歷史（按日期降序）。

```json
{
  "project_id": "paulkuo-main",
  "metrics": [
    {
      "date": "2026-04-10",
      "session_type": "cowork",
      "model": "opus",
      "outputs": { "commits": 4, "files_changed": 12, ... }
    }
  ]
}
```

**實作：** `TICKER_KV.get('gov:metrics:' + project_id)` → return

### Endpoint 4：`GET /api/governance/automation`

回傳自動化登記簿。

**實作：** `TICKER_KV.get('gov:automation')` → return

### Auth

**所有 governance API 都需要 auth。** 不是公開 API。

最簡單的做法：跟 formosa admin API 一樣，用 Bearer token 驗證。
在 wrangler.toml 加一個 secret `GOVERNANCE_TOKEN`，
API handler 開頭檢查 `Authorization: Bearer {token}`。

Dashboard 頁面存 token 在 sessionStorage，請求時帶上。

（或者用現有的 auth/me session 機制——看哪個更簡單，Code 判斷。）

---

## 步驟 4：在 `worker/src/index.js` 加路由

```javascript
// 在 import 區加
import { handleGovernanceSummary, handleGovernanceProjects, handleGovernanceMetrics, handleGovernanceAutomation } from './governance-api.js';

// 在路由區加（放在 wiki 路由附近）
if (path === '/api/governance/summary' && method === 'GET') {
  return handleGovernanceSummary(request, env);
}
if (path === '/api/governance/projects' && method === 'GET') {
  return handleGovernanceProjects(request, env);
}
if (path.startsWith('/api/governance/metrics/') && method === 'GET') {
  const projectId = path.split('/api/governance/metrics/')[1];
  return handleGovernanceMetrics(request, env, projectId);
}
if (path === '/api/governance/automation' && method === 'GET') {
  return handleGovernanceAutomation(request, env);
}
```

**注意：** 加路由到 index.js 時要注意 `[影響: 全專案]`——這是共用檔案，參考 `docs/shared-file-impact-map.md`。

---

## 步驟 5：建 Dashboard 頁面 — `src/pages/dashboard/index.astro`

**Auth gate：** 最簡單的做法——頁面載入時向 `/api/governance/summary` 送帶 token 的請求，如果 401 就顯示密碼輸入框。跟 Formosa AuthGate 類似但更輕量，因為只有一個 admin 用戶（Paul）。

**頁面結構（單頁，不需要子頁）：**

```
┌─────────────────────────────────────────┐
│  🎛️ 專案治理 Dashboard                  │
│  最後更新：2026-04-10                    │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐      │
│  │🟢   │ │🟢   │ │🟢   │ │🟢   │      │  ← 專案卡片
│  │主站 │ │ESG  │ │Wiki │ │ACP  │      │     每張：名稱 + 燈號 + 最近活動日
│  │47c  │ │32c  │ │28c  │ │15c  │      │     + 累計 commits
│  └─────┘ └─────┘ └─────┘ └─────┘      │
│                                         │
│  ── 產出趨勢 ──────────────────────     │
│  [折線圖：每週 commits / deploys]        │  ← 用 Recharts 或原生 canvas
│                                         │
│  ── 自動化覆蓋率 ─────────────────      │
│  [環形圖] 66.7%                         │
│  可自動化但尚未：wiki-batch-ingest       │
│                                         │
└─────────────────────────────────────────┘
```

### 燈號邏輯

```javascript
function getHealth(lastActivity) {
  const days = daysSince(lastActivity);
  if (days <= 7) return 'green';   // 🟢
  if (days <= 14) return 'yellow'; // 🟡
  return 'red';                     // 🔴
}
```

### 技術選型

- **框架：** Astro 頁面 + client-side JS（不需要 React component，資料量小）
- **圖表：** 如果不想引入大型 lib，用簡單的 CSS bar chart 或 SVG。如果可以用 Chart.js CDN 也行。Code 判斷。
- **RWD：** 手機上卡片改成單欄，圖表自動縮放

### CSS

跟主站其他頁面風格一致。可以參考 `/projects/formosa-esg-2026/` 的設計語言。

---

## 步驟 6：Commit + Push + 驗證

```bash
git add scripts/governance-kv-seed.cjs \
       worker/src/governance-api.js \
       worker/src/index.js \
       src/pages/dashboard/index.astro

git commit -m "feat: 治理 Dashboard Phase 2 — API + KV seed + 前端 [影響: 全專案]"
git push
```

### 驗證清單

**KV Seed：**
```bash
node scripts/governance-kv-seed.cjs
# 確認無錯誤，6 個 project metrics 都有上傳
```

**Worker API（需先 deploy）：**
```bash
# Paul 在本機跑
cd worker && wrangler deploy --config wrangler.toml

# 然後測 API
curl -H "Authorization: Bearer {token}" https://paulkuo.tw/api/governance/summary | jq .
curl -H "Authorization: Bearer {token}" https://paulkuo.tw/api/governance/projects | jq .
curl -H "Authorization: Bearer {token}" https://paulkuo.tw/api/governance/metrics/paulkuo-main | jq .
curl -H "Authorization: Bearer {token}" https://paulkuo.tw/api/governance/automation | jq .
```
→ 預期：四支 API 都回 200 + 有效 JSON

**Dashboard 頁面：**
- 瀏覽器打開 `https://paulkuo.tw/dashboard/`
- 預期：顯示密碼輸入框 → 輸入 token → 看到 6 張專案卡片 + 圖表

---

## 注意事項

1. **index.js 是共用檔案。** 改動前確認不會影響其他 API。加路由就好，不要動現有的路由和 handler。
2. **Worker deploy 需要 Paul 手動跑。** Code 跑不了 `wrangler deploy`（網路限制）。部署指令寫在回報裡。
3. **GOVERNANCE_TOKEN secret 需要 Paul 設定。** 在 Cloudflare Dashboard → paulkuo-ticker → Settings → Variables 加。回報時提醒 Paul。
4. **Dashboard 目前只有一筆 metrics 資料。** 不用擔心圖表空空的——隨著 session 累積，資料會越來越多。先把管線建好。
5. **CDN 快取 max-age=3600。** 部署後可能要等最多一小時。驗證時用 hard refresh。

---

## 回報格式

```
N commits pushed:
- {hash} {訊息}

驗證：
- governance-kv-seed.cjs：{通過/失敗}
- 4 支 API endpoint：{各自狀態}
- Dashboard 頁面：{截圖或描述}
- ⚠️ 需 Paul 手動：
  - wrangler deploy --config worker/wrangler.toml
  - Cloudflare Dashboard 設定 GOVERNANCE_TOKEN secret

本輪 metrics: N commits, N files, +N/-N lines, 1 deploy, 0 issues closed
```
