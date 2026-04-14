# Governance Phase 3 — Dashboard 整合 Scanner 稽核結果

> 產出者：Cowork (Opus 4.6)
> 日期：2026-04-11
> 建議執行模型：Sonnet 4.6
> 前置條件：Phase 2 已部署完成（前端 + Worker + GOVERNANCE_TOKEN secret，2026-04-11 17:07 確認上線）

---

## 背景

治理框架 Phase 1+2 已上線：Dashboard（`/governance/`）能顯示專案卡片、自動化覆蓋率、commits 長條圖。
三層防線（hook / skill / scanner）也已建立。

但 Dashboard 目前只是「靜態專案概覽」——**看不到跨專案稽核的結果**。
L3 scanner 的排程已存在，但沒有實際的執行腳本，也沒有結構化輸出。
Phase 3 要讓 scanner 結果「從 PENDING.md 的純文字」升級為「Dashboard 上可視化的趨勢數據」。

**設計邊界**（Chat Opus 4.6 審查結論）：
- Dashboard 看**週/月趨勢**異常（某專案 7+ 天沒活動、每週漏測次數趨勢）
- 防線看**逐次 commit**（改共用檔案沒標注就攔）
- Phase 3 **不碰** hook 和 skill 的邏輯

---

## Step 0 偵察（先查再改）

開工前先確認現狀，避免重複或衝突：

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw

# 1. 確認 shared-files.json 存在且格式正確
cat docs/shared-files.json | python3 -m json.tool | head -20

# 2. 確認 projects.json 存在
cat worklogs/governance/projects.json | python3 -m json.tool | head -10

# 3. 確認 governance-api.js 現有 export
grep "export async function" worker/src/governance-api.js

# 4. 確認 index.js 路由區塊位置
grep -n "governance" worker/src/index.js

# 5. 確認 audit-results 目錄不存在（首次建立）
ls worklogs/governance/audit-results/ 2>/dev/null || echo "不存在，需新建"

# 6. 確認 last-scan.json 不存在（首次建立）
ls worklogs/governance/last-scan.json 2>/dev/null || echo "不存在，需新建"

# 7. 確認 governance-kv-seed.cjs 的 KV namespace ID
grep "NAMESPACE_ID" scripts/governance-kv-seed.cjs

# 8. 查近 3 天 git log，確認 scanner 有東西可掃
git log --oneline --since="3 days ago" | wc -l
```

---

## 具體步驟

### Step 1：新增 `scripts/cross-project-scanner.cjs`

**這是什麼**：L3 scanner 排程任務的執行體。每日 10:30 由 Cowork scheduled task 觸發。

**輸入**：
- `docs/shared-files.json`（共用檔案清單，唯一事實來源）
- `worklogs/governance/projects.json`（專案清單，唯一事實來源）
- 近 3 天的 git log：`git log --name-only --since="3 days ago" --pretty=format:"%h|%s|%ad" --date=short`

**邏輯**：
1. 讀 shared-files.json，建立 `{ filepath → { risk, affects } }` 的 lookup map
2. 用 `execSync` 跑 git log，解析每個 commit 的 hash、message、日期、changed files
3. 每個 commit 的每個 changed file 比對 lookup map
4. 命中的 commit 檢查兩件事：
   - commit message 是否包含 `[影響:` → `has_tag: true/false`
   - worklog 目錄中是否有同日期的 worklog 且包含 `Smoke Test` 區塊 → `has_smoke_test: true/false`
5. 彙總結果

**輸出 1 — 結構化 JSON**：`worklogs/governance/audit-results/{YYYY-MM-DD}.json`

```json
{
  "$schema": "audit-result-v1",
  "date": "2026-04-11",
  "scan_range": "2026-04-08 ~ 2026-04-11",
  "total_commits_scanned": 25,
  "flagged": [
    {
      "hash": "abc1234",
      "message": "fix: 修正 translator.js 詞典",
      "date": "2026-04-10",
      "shared_files": ["worker/src/translator.js"],
      "affected_projects": ["llm-wiki", "paulkuo-main", "agora"],
      "risk_level": "shared_modules",
      "has_tag": true,
      "has_smoke_test": false
    }
  ],
  "summary": {
    "total_flagged": 3,
    "missing_tags": 1,
    "missing_smoke_tests": 2,
    "by_risk_level": {
      "critical": 1,
      "shared_modules": 2,
      "ai_ready_auto": 0
    }
  }
}
```

**輸出 2 — 心跳**：`worklogs/governance/last-scan.json`

```json
{
  "last_success": "2026-04-11T10:30:00.000Z",
  "commits_scanned": 25,
  "flagged_count": 3
}
```

**輸出 3 — PENDING.md 追加**：
如果 `missing_smoke_tests > 0`，在 PENDING.md 的「待 Code 執行」區塊追加一行：
`- [ ] 🟡 跨專案 smoke test 缺漏：{列出 hash 和缺的專案} → Code (auto-scanner {日期})`

**注意**：
- 如果 git / python3 / JSON 讀取失敗，graceful exit（exit 0），不要擋 scheduled task
- `audit-results/` 目錄不存在時自動 `mkdirSync` 建立
- 腳本開頭加 `#!/usr/bin/env node`

### Step 2：擴充 `scripts/governance-kv-seed.cjs`

**修改檔案**：`scripts/governance-kv-seed.cjs`（現有 159 行）

在現有的 Step 4（`gov:summary`）之後，新增：

**Step 5 — `gov:audit`**：
```javascript
// 5. gov:audit — 稽核結果（最近 7 天）
console.log('5. gov:audit');
const auditDir = path.join(GOVERNANCE_DIR, 'audit-results');
```

讀取 `worklogs/governance/audit-results/` 下最近 7 天的 JSON 檔案，彙總成：

```json
{
  "recent": [
    { "date": "2026-04-11", "total_flagged": 3, "missing_tags": 1, "missing_smoke_tests": 2 },
    { "date": "2026-04-10", "total_flagged": 1, "missing_tags": 0, "missing_smoke_tests": 1 }
  ],
  "trend": {
    "dates": ["2026-04-05", "2026-04-06", "2026-04-07", "..."],
    "missing_tags": [0, 1, 0, 0, 1, 0, 2],
    "missing_smoke_tests": [1, 0, 0, 2, 0, 1, 0]
  },
  "scanner_health": {
    "last_success": "2026-04-11T10:30:00.000Z",
    "is_healthy": true
  }
}
```

`is_healthy` 判定：`last-scan.json` 的 `last_success` 距今 < 48 小時。
如果 `audit-results/` 不存在或是空的，上傳一個空結構（不要 crash）。

**同時修改 Step 4 的 `gov:summary`**，加入 `audit` 摘要欄位：
```json
{
  "projects": ["...existing..."],
  "automation": {"...existing..."},
  "audit": {
    "last_scan": "2026-04-11",
    "scanner_healthy": true,
    "open_issues": 2,
    "trend_7d_avg": 0.7
  },
  "total_metrics_entries": "...existing...",
  "last_updated": "...existing..."
}
```

### Step 3：新增 API endpoint

**修改檔案**：`worker/src/governance-api.js`（現有 82 行）

在檔案底部 `handleGovernanceAutomation` 之後加入：

```javascript
/**
 * GET /api/governance/audit
 * Returns cross-project audit results + trend
 */
export async function handleGovernanceAudit(request, env) {
  if (!isAuthorized(request, env)) return unauthorized(request);
  const data = await env.TICKER_KV.get('gov:audit');
  if (!data) return jsonResponse({ error: 'Audit data not available. Run scanner + kv-seed first.' }, 404, request);
  return new Response(data, {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(request) },
  });
}
```

### Step 4：路由註冊（⚠️ critical 共用檔案）

**修改檔案**：`worker/src/index.js`

⚠️ **這是 critical 共用檔案**，影響所有 6 個子專案。

**改動 1** — L37 的 import 行，加入 `handleGovernanceAudit`：
```javascript
import { handleGovernanceSummary, handleGovernanceProjects, handleGovernanceMetrics, handleGovernanceAutomation, handleGovernanceAudit } from './governance-api.js';
```

**改動 2** — L462 governance 路由區塊，在 `metrics` 路由（L465）前加：
```javascript
  if (path === '/api/governance/audit' && method === 'GET') return handleGovernanceAudit(request, env);
```

**commit 格式**：`feat: governance audit API endpoint [影響: 全部子專案]`

### Step 5：Dashboard 前端加稽核面板

**修改檔案**：`src/pages/governance/index.astro`（現有 470 行）

**HTML**：在 L55 `</section>` 結束的 `two-col` section 之後，加入：

```html
<!-- Audit health -->
<section class="section">
  <h2 class="section-title">跨專案稽核</h2>
  <div class="audit-panel two-col">
    <div>
      <div class="audit-summary">
        <div class="audit-stat">
          <span id="audit-scanner-status" class="scanner-badge loading">⏳ 載入中</span>
        </div>
        <div class="audit-stat">
          <span id="audit-open-issues" class="audit-number">—</span>
          <span class="audit-label">待處理問題</span>
        </div>
      </div>
      <div id="audit-flagged-list" class="audit-flagged"></div>
    </div>
    <div>
      <canvas id="audit-trend-chart" width="400" height="160"></canvas>
    </div>
  </div>
</section>
```

**JS**（加在 `renderDashboard` 函式 L217 附近）：

```javascript
// Fetch audit data (non-blocking — dashboard still loads if audit unavailable)
govFetch('/api/governance/audit', token).then(async res => {
  if (!res.ok) {
    document.getElementById('audit-scanner-status').textContent = '⚠️ 無資料';
    document.getElementById('audit-scanner-status').className = 'scanner-badge warn';
    return;
  }
  const audit = await res.json();
  renderAudit(audit);
}).catch(() => {
  document.getElementById('audit-scanner-status').textContent = '❌ 連線失敗';
  document.getElementById('audit-scanner-status').className = 'scanner-badge error';
});
```

新增 `renderAudit(audit)` 函式：
1. **Scanner badge**：`audit.scanner_health.is_healthy` → `'✅ 正常'`（綠底） 或 `'⚠️ 48h 未更新'`（橘底）
2. **待處理數字**：`audit.recent[0]` 的 `missing_tags + missing_smoke_tests`，數字 > 0 時顯示紅色
3. **趨勢折線圖**：用 Canvas 畫 7 天的兩條線（`missing_tags` 藍線、`missing_smoke_tests` 橘線），X 軸日期、Y 軸次數
4. **Flagged list**：如果 `audit.recent[0]` 有 flagged items，顯示 commit 清單，每項附 ✅/❌ 標示 tag 和 smoke test 狀態。沒有就顯示「✅ 近期無異常」

**CSS**（加在現有 style 區塊末尾）：

```css
/* ── Audit Panel ── */
.audit-summary { display: flex; gap: 1.5rem; margin-bottom: 1rem; }
.audit-stat { display: flex; flex-direction: column; gap: 0.25rem; }
.audit-label { font-size: 0.75rem; color: #9ca3af; }
.audit-number { font-size: 2rem; font-weight: 700; color: #111827; }
.audit-number.warn { color: #ef4444; }

.scanner-badge {
  display: inline-block; padding: 0.3rem 0.75rem;
  border-radius: 999px; font-size: 0.8rem; font-weight: 500;
}
.scanner-badge.ok { background: #dcfce7; color: #166534; }
.scanner-badge.warn { background: #fef3c7; color: #92400e; }
.scanner-badge.error { background: #fee2e2; color: #991b1b; }
.scanner-badge.loading { background: #f3f4f6; color: #6b7280; }

.audit-flagged { margin-top: 0.75rem; }
.flagged-item {
  display: flex; align-items: center; gap: 0.5rem;
  font-size: 0.8rem; padding: 0.4rem 0;
  border-bottom: 1px solid #f3f4f6;
}
.flagged-hash { font-family: monospace; color: #6b7280; }
.flagged-msg { flex: 1; color: #374151; }

#audit-trend-chart {
  display: block; max-width: 100%;
  border-radius: 8px; background: #fafafa;
  border: 1px solid #f3f4f6;
}
```

### Step 6：更新 automation-registry.json

**修改檔案**：`worklogs/governance/automation-registry.json`

在 `tasks` 陣列加入：

```json
{
  "id": "cross-project-impact-scanner",
  "project_id": "paulkuo-main",
  "name": "跨專案影響掃描器",
  "type": "scheduled",
  "status": "active",
  "trigger": "每日 10:30",
  "created": "2026-04-11",
  "description": "掃 3 天 git log，比對 shared-files.json，輸出稽核結果到 audit-results/"
}
```

同時更新 `coverage` 區塊：
```json
"coverage": {
  "automated": 7,
  "manual": 3,
  "total": 10,
  "rate": 0.7,
  "last_updated": "2026-04-11"
}
```

---

## 驗證方式

完成所有步驟後，依序執行：

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw

# 1. Scanner 腳本能跑
node scripts/cross-project-scanner.cjs
# 預期：console 輸出掃描結果，audit-results/ 有 JSON

# 2. 確認 audit-results 有檔案
ls worklogs/governance/audit-results/
cat worklogs/governance/audit-results/$(date +%Y-%m-%d).json | python3 -m json.tool

# 3. 確認心跳
cat worklogs/governance/last-scan.json

# 4. KV seed 能跑
node scripts/governance-kv-seed.cjs
# 預期：包含 "5. gov:audit" 步驟且成功

# 5. 衝突標記檢查
grep -rn "<<<<<<" worker/src/

# 6. Worker 部署後（Paul 手動）
# curl -H "Authorization: Bearer {token}" https://api.paulkuo.tw/api/governance/audit
# 預期：200 + JSON

# 7. 前端部署後（Paul 手動）
# 開 https://paulkuo.tw/governance/，登入後確認「跨專案稽核」面板出現
```

---

## 注意事項

1. **`worker/src/index.js` 是 critical**：改動影響全部 6 個子專案，commit 必須標注 `[影響: 全部子專案]`
2. **Scanner graceful degradation**：git / JSON 讀取失敗時 exit 0，不要擋排程
3. **Dashboard audit 面板是 non-blocking**：API 404 或失敗時，其他面板照常顯示
4. **`governance-kv-seed.cjs` 使用 `--namespace-id`**（不要加 `--remote`，之前踩過坑，已修 be42206）
5. **部署順序**：先 `npm run build && wrangler deploy`（前端），再 `cd worker && wrangler deploy --config wrangler.toml`（Worker）
6. **Astro `<style>` 是 scoped**：新增的 CSS 如果要套用到 JS 動態產生的 DOM，用 `:global()` 或 `is:inline`
7. **架構天花板備註**：目前 6 個專案用全 repo git log 沒問題。未來 15-20 個專案時，scanner 的 git log 要加 `--` 路徑限定

---

## 回報格式

完成後在 worklog 記錄：

```markdown
## 完成日誌
- {HH:MM} Governance Phase 3：scanner 腳本 + KV seed 擴充 + audit API + Dashboard 稽核面板 ({commit hash}) Code

## 待 Paul 執行
- [ ] 部署前端 + Worker → 驗證: curl https://api.paulkuo.tw/api/governance/audit（需 Bearer token）
- [ ] 打開 /governance/ 確認稽核面板 → 驗證: 肉眼確認 Scanner 狀態 badge + 趨勢圖

## 狀態變更
- 治理框架 Phase 3：未開始 → ✅ 已完成（Dashboard 整合 scanner 稽核結果）
- automation coverage：66.7% → 70%（新增 cross-project-impact-scanner）
```
