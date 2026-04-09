# 專案治理框架規格書 v1.0

> 日期：2026-04-09
> 作者：Cowork（Opus 4.6）
> 目的：定義跨 Cowork 專案的通用治理機制，涵蓋專案註冊、產出指標收集、自動化覆蓋率追蹤
> 交付對象：Code session 實作 + Cowork session-handoff skill 更新

---

## 一、設計原則

1. **量產出，不量成本。** Token 花費無法精確取得，追蹤 commits、deploys、ingest 數等實際產出更有意義。
2. **零手動輸入。** 所有指標從 git log、worklogs、scheduled tasks 自動擷取，Paul 不需要填表。
3. **專案自治。** 每個專案宣告自己關心的指標，框架不假設所有專案長一樣。
4. **新專案即插即用。** 新增一個 JSON entry + 一份 automation registry 就完成註冊。

---

## 二、專案註冊表 — `worklogs/governance/projects.json`

```json
{
  "$schema": "projects-v1",
  "projects": [
    {
      "id": "paulkuo-main",
      "name": "Paulkuo 網站",
      "repo": "zarqarwi/paulkuo.tw",
      "dashboard_issue": 155,
      "cowork_folder": "paulkuo.tw",
      "status": "active",
      "started": "2026-03-25",
      "description": "個人網站主站 + Worker API",
      "custom_metrics": [
        { "key": "deploys", "label": "部署次數", "source": "worklog" },
        { "key": "issues_closed", "label": "Issue 結案數", "source": "github" }
      ]
    },
    {
      "id": "formosa-esg",
      "name": "白沙屯 ESG 繞境",
      "repo": "zarqarwi/paulkuo.tw",
      "dashboard_issue": 155,
      "cowork_folder": "白沙屯ESG繞境",
      "status": "active",
      "started": "2026-03-24",
      "description": "白沙屯媽祖繞境碳足跡追蹤 + LINE LIFF",
      "custom_metrics": [
        { "key": "deploys", "label": "部署次數", "source": "worklog" },
        { "key": "issues_closed", "label": "Issue 結案數", "source": "github" }
      ]
    },
    {
      "id": "llm-wiki",
      "name": "LLM Wiki",
      "repo": "zarqarwi/paulkuo.tw",
      "dashboard_issue": 157,
      "cowork_folder": "paulkuo.tw",
      "status": "active",
      "started": "2026-04-05",
      "description": "Karpathy Pattern 個人知識圖譜",
      "custom_metrics": [
        { "key": "sources_ingested", "label": "來源 ingest 數", "source": "worklog" },
        { "key": "concepts_count", "label": "Concept 總數", "source": "filesystem" },
        { "key": "corpus_pages", "label": "Corpus 頁數", "source": "filesystem" }
      ]
    },
    {
      "id": "acp",
      "name": "AI 協作力評量",
      "repo": "zarqarwi/paulkuo.tw",
      "dashboard_issue": 155,
      "cowork_folder": "paulkuo.tw",
      "status": "active",
      "started": "2026-04-08",
      "description": "AI Collaboration Proficiency 自評工具",
      "custom_metrics": [
        { "key": "submissions", "label": "填寫次數", "source": "d1" }
      ]
    },
    {
      "id": "ai-ready",
      "name": "讓 AI 懂我",
      "repo": "zarqarwi/paulkuo.tw",
      "dashboard_issue": 155,
      "cowork_folder": "paulkuo.tw",
      "status": "active",
      "started": "2026-04-09",
      "description": "AI Ready 分數監測 + JSON-LD 優化",
      "custom_metrics": [
        { "key": "ai_ready_score", "label": "AI Ready 分數", "source": "action" }
      ]
    },
    {
      "id": "agora",
      "name": "阿哥拉廣場",
      "repo": "zarqarwi/paulkuo.tw",
      "dashboard_issue": 155,
      "cowork_folder": null,
      "status": "active",
      "started": "2026-04-07",
      "description": "即時會議記錄翻譯引擎",
      "custom_metrics": [
        { "key": "tqef_score", "label": "TQEF 總分", "source": "worklog" },
        { "key": "corpus_sentences", "label": "語料庫句數", "source": "worklog" }
      ]
    }
  ]
}
```

### Schema 說明

| 欄位 | 型別 | 用途 |
|------|------|------|
| `id` | string | 全域唯一識別碼，用於 metrics 檔名和 KV key |
| `name` | string | 人類可讀名稱，Dashboard 顯示用 |
| `repo` | string | GitHub repo（owner/name） |
| `dashboard_issue` | number | 對應的 GitHub Issue 編號 |
| `cowork_folder` | string \| null | Cowork 綁定的資料夾名稱（null = 獨立專案） |
| `status` | enum | `active` / `paused` / `archived` |
| `started` | date | 專案起始日 |
| `description` | string | 一行描述 |
| `custom_metrics` | array | 專案自訂指標，每項有 key、label、source |

`custom_metrics.source` 可用值：
- `worklog` — 從 worklog 文字解析（Cowork 手動或腳本 regex）
- `github` — 從 GitHub API 查詢（issues closed、commits 等）
- `filesystem` — 從 repo 檔案系統計算（ls + wc）
- `d1` — 從 D1 資料庫查詢
- `action` — 從 GitHub Actions 結果取得

---

## 三、Session 指標 — `worklogs/metrics/{project_id}/{YYYY-MM-DD}.json`

每次 session 結束（handoff 時）自動產出一份：

```json
{
  "$schema": "session-metrics-v1",
  "project_id": "paulkuo-main",
  "date": "2026-04-09",
  "session_type": "code",
  "model": "sonnet",
  "size": "M",

  "outputs": {
    "commits": 5,
    "files_changed": 12,
    "lines_added": 340,
    "lines_removed": 87,
    "deploys": 1,
    "issues_closed": 2,
    "handoff_produced": true
  },

  "custom": {
    "sources_ingested": 0,
    "concepts_count": 0
  },

  "automation_changes": [
    {
      "task": "sync-dashboard",
      "change": "created",
      "type": "action"
    }
  ],

  "notes": "sync-dashboard Action 建立 + PENDING.md 跨專案備忘格式"
}
```

### 通用欄位（所有專案必填）

| 欄位 | 型別 | 說明 |
|------|------|------|
| `project_id` | string | 對應 projects.json 的 id |
| `date` | date | ISO 日期 |
| `session_type` | enum | `code` / `cowork` |
| `model` | enum | `opus` / `sonnet` / `haiku` |
| `size` | enum | `S` / `M` / `L`（已在 handoff v4.4 定義） |
| `outputs.commits` | number | 本次 session 的 commit 數 |
| `outputs.files_changed` | number | 變更檔案數 |
| `outputs.lines_added` | number | 新增行數 |
| `outputs.lines_removed` | number | 刪除行數 |
| `outputs.deploys` | number | 部署次數 |
| `outputs.issues_closed` | number | 結案 issue 數 |
| `outputs.handoff_produced` | boolean | 是否產出 handoff 文件 |

### 專案自訂欄位 — `custom`

自由 key-value，key 對應 `projects.json` 裡的 `custom_metrics[].key`。
不適用的欄位填 0 或 null，Dashboard 端判斷是否顯示。

### 自動化變更 — `automation_changes`

記錄本次 session 新增/修改/移除的自動化任務。
累積起來就是自動化覆蓋率的時間軸。

---

## 四、自動化登記簿 — `worklogs/governance/automation-registry.json`

```json
{
  "$schema": "automation-registry-v1",
  "tasks": [
    {
      "id": "sync-dashboard",
      "project_id": "paulkuo-main",
      "name": "儀表板自動同步",
      "type": "action",
      "status": "active",
      "trigger": "push to main (issue-155-body.md changed)",
      "created": "2026-04-09",
      "description": "編輯 issue-155-body.md → push → Action 自動 PATCH Issue #155"
    },
    {
      "id": "wiki-ingest-scanner",
      "project_id": "llm-wiki",
      "name": "Wiki Ingest 掃描器",
      "type": "scheduled",
      "status": "active",
      "trigger": "每日 10:02",
      "created": "2026-04-05",
      "description": "掃 get_筆記 → 產出 wiki-ingest-pending.md"
    },
    {
      "id": "wiki-web-collector",
      "project_id": "llm-wiki",
      "name": "Wiki Web 收集器",
      "type": "scheduled",
      "status": "active",
      "trigger": "每日 09:37",
      "created": "2026-04-05",
      "description": "搜 pillar 關鍵字 → 存 raw/clips/"
    },
    {
      "id": "wiki-knowledge-digest",
      "project_id": "llm-wiki",
      "name": "Wiki 知識摘要",
      "type": "scheduled",
      "status": "active",
      "trigger": "每 2 天 10:00",
      "created": "2026-04-05",
      "description": "彙整 corpus 變化摘要"
    },
    {
      "id": "ai-ready-weekly-scan",
      "project_id": "ai-ready",
      "name": "AI Ready 週掃描",
      "type": "action",
      "status": "active",
      "trigger": "每週一 1AM UTC",
      "created": "2026-04-09",
      "description": "GitHub Actions 自動掃描 AI Ready 分數"
    },
    {
      "id": "health-check",
      "project_id": "paulkuo-main",
      "name": "Health Check",
      "type": "action",
      "status": "active",
      "trigger": "每 6 小時",
      "created": "2026-04-02",
      "description": "GitHub Actions 監測站點健康狀態"
    }
  ],

  "manual_recurring": [
    {
      "id": "wiki-batch-ingest",
      "project_id": "llm-wiki",
      "name": "Wiki 批次 Ingest",
      "frequency": "每週",
      "owner": "cowork",
      "description": "每週 10-20 篇 source ingest",
      "automation_candidate": true,
      "notes": "目前需 Cowork 人工審查 visibility 分類，短期難全自動"
    },
    {
      "id": "issue-155-update",
      "project_id": "paulkuo-main",
      "name": "儀表板更新",
      "frequency": "每次 session 結束",
      "owner": "cowork",
      "description": "更新 issue-155-body.md 並 push",
      "automation_candidate": true,
      "notes": "PATCH 已自動化，但內容編輯仍需 Cowork 判斷"
    },
    {
      "id": "pending-md-scan",
      "project_id": "paulkuo-main",
      "name": "PENDING.md 掃描",
      "frequency": "每次 session 開場",
      "owner": "cowork",
      "description": "讀 PENDING.md 確認跨 session 待辦",
      "automation_candidate": false,
      "notes": "需要理解語境，不適合全自動"
    }
  ]
}
```

### 自動化覆蓋率計算

```
覆蓋率 = tasks(type=scheduled|action, status=active).count
         ÷ (tasks.count + manual_recurring.count)
```

目前值：6 automated / (6 + 3 manual) = **66.7%**

`automation_candidate: true` 的手動任務 = 未來可以提升覆蓋率的目標。
Dashboard 顯示：目前覆蓋率 + 「可自動化但尚未自動化」的清單。

---

## 五、資料流與實作分工

### Phase 1：Schema + 收集（本輪 Cowork + 一輪 Code）

| 項目 | 誰做 | 說明 |
|------|------|------|
| `worklogs/governance/projects.json` | Cowork 建檔 | 現在就可以建 |
| `worklogs/governance/automation-registry.json` | Cowork 建檔 | 現在就可以建 |
| `worklogs/metrics/` 目錄結構 | Code commit | 建目錄 + .gitkeep |
| session-handoff skill v4.5 | Cowork 設計 → Code commit | 加「metrics 收集」步驟 |
| metrics 收集腳本 | Code | `scripts/collect-session-metrics.sh`：從 git log 自動算 commits/files/lines |

### Phase 2：API + Dashboard（Code 為主）

| 項目 | 誰做 | 說明 |
|------|------|------|
| `scripts/governance-kv-seed.cjs` | Code | 彙總 metrics JSON → seed 到 KV |
| Worker endpoint `/api/governance/metrics` | Code | 從 KV 讀彙總資料 |
| Worker endpoint `/api/governance/projects` | Code | 回傳 projects.json |
| Dashboard 頁面 `src/pages/dashboard/` | Code | auth-gated，讀 API 渲染 |

### Phase 3：主動監測（後續迭代）

| 項目 | 誰做 | 說明 |
|------|------|------|
| Scheduled task：metrics 彙總 | Cowork 排程 | 每日彙總前一天的 metrics |
| 異常偵測規則 | Cowork 定義 | 超過 7 天沒活動 → 提醒 |
| Dashboard 趨勢圖 | Code | D3/Recharts 時間軸 |

---

## 六、Dashboard 頁面結構（草案）

```
/dashboard/  (auth-gated)
├── 總覽：6 專案卡片，每張顯示最近活動 + 狀態燈號
├── 產出趨勢：折線圖（每週 commits、deploys、ingest 數）
├── 自動化覆蓋率：環形圖 + 「可自動化」清單
└── 專案明細：點進去看單一專案的指標歷史
```

### 狀態燈號邏輯

| 燈號 | 條件 |
|------|------|
| 🟢 | 7 天內有活動 |
| 🟡 | 7-14 天沒活動 |
| 🔴 | 14 天以上沒活動 |
| ⏸️ | status = paused |

---

## 七、session-handoff skill v4.5 修改方案

### 新增位置

在現有 handoff 流程的「寫 worklog」和「產出 handoff 文件」之間，插入一步 **metrics 收集**。

### 流程變更

```
現有流程（v4.4）：
  做事 → 寫 worklog → 產出 handoff 文件 → 更新 PENDING.md → 結束

新流程（v4.5）：
  做事 → 寫 worklog → ⭐ 收集 metrics → 產出 handoff 文件 → 更新 PENDING.md → 結束
```

### ⭐ Metrics 收集步驟（新增）

**Code session 的做法：**

```bash
# 自動跑腳本（scripts/collect-session-metrics.sh）
# 輸入：project_id、今天日期、session 起始 commit hash
# 輸出：worklogs/metrics/{project_id}/{date}.json

scripts/collect-session-metrics.sh paulkuo-main 2026-04-09 abc1234
```

腳本從 git log 自動計算：commits、files_changed、lines_added、lines_removed。
deploys、issues_closed、custom metrics 由 Code 手動補入 JSON（通常只需改 2-3 個數字）。

**Cowork session 的做法：**

Cowork 不跑 git，所以用不同方式收集：
- `commits`、`files_changed`、`lines_added/removed`：從 Code 的回報裡提取（Code 回報原則已要求附帶這些）
- `deploys`、`issues_closed`：Cowork 自己知道（因為是 Cowork 開工單給 Code 做的）
- `custom`：根據本次 session 工作內容填入
- Cowork 直接寫 JSON 到 `worklogs/metrics/{project_id}/{date}.json`

**跨專案 session：**

一個 session 如果觸及多個專案（例如改共用模組），產出多份 metrics JSON，每個受影響的 project_id 各一份。

### Handoff 文件新增欄位

在 handoff 文件開頭的 metadata 區，除了「建議模型」和「預估量級」，新增「本輪 metrics」摘要：

```
建議模型: Sonnet
預估量級: M
本輪 metrics: 5 commits, 12 files, +340/-87 lines, 1 deploy, 2 issues closed
```

這一行不取代 JSON，只是讓 Paul 掃一眼就知道這輪做了多少事。

### SKILL.md 修改清單

| 位置 | 改什麼 |
|------|--------|
| 版本號 | v4.4 → v4.5 |
| 版本說明 | 新增 metrics 收集步驟 + governance 框架 |
| 核心架構圖 | 加入 `worklogs/metrics/` 和 `worklogs/governance/` |
| Handoff 文件必備區塊 | 新增第 7 項「本輪 metrics 摘要」 |
| Code 回報原則 | 補充「回報需包含 git stat 數據供 metrics 收集用」 |
| 新章節 | 「Metrics 收集 SOP」完整說明 |

---

## 八、新專案加入 SOP

1. 在 `projects.json` 加一筆 entry（id、name、custom_metrics）
2. 在 `automation-registry.json` 登記該專案的自動化 + 手動任務
3. 建 `worklogs/metrics/{project_id}/` 目錄
4. 如有 Cowork Project Instructions，加一行「handoff 時寫 metrics JSON」
5. Dashboard 自動根據 projects.json 顯示新卡片

---

## 九、驗證：Schema 涵蓋性檢查

### 現有 6 專案 × Schema 對照

| 專案 | 通用指標夠用？ | custom_metrics 涵蓋？ | automation 登記？ |
|------|---------------|----------------------|-------------------|
| Paulkuo 網站 | ✅ commits/deploys/issues | ✅ deploys, issues_closed | ✅ sync-dashboard, health-check |
| 白沙屯 ESG | ✅ commits/deploys/issues | ✅ deploys, issues_closed | ⚠️ 待登記（目前沒有專屬自動化） |
| LLM Wiki | ✅ commits/deploys | ✅ sources_ingested, concepts_count, corpus_pages | ✅ 3 條管線 |
| ACP | ✅ commits/deploys | ✅ submissions（D1 查） | ⚠️ 待登記 |
| 讓 AI 懂我 | ✅ commits | ✅ ai_ready_score（Action 產出） | ✅ 週掃描 Action |
| 阿哥拉廣場 | ✅ commits/deploys | ✅ tqef_score, corpus_sentences | ⚠️ 待登記 |

### 擴充性測試

假設未來新增一個「Paul 的投資筆記」Cowork 專案：
- `projects.json`：加 `{"id": "invest-notes", "custom_metrics": [{"key": "notes_processed", "label": "筆記處理數", "source": "worklog"}]}`
- `automation-registry.json`：加手動任務「每週整理投資筆記」
- `worklogs/metrics/invest-notes/` 目錄
- Dashboard 自動出現新卡片

→ 不需要改框架程式碼，**擴充性通過**。

### 已知限制

1. **Cowork session 的 git 指標依賴 Code 回報。** 如果 Code 沒回報 git stat，Cowork 只能填 0。但 v4.4 的 Code 回報原則已要求附帶數據，風險低。
2. **custom metrics 的 source=d1/action 需要額外查詢。** 不是 handoff 時自動能拿到的，需要額外一步。Phase 2 的 KV seed 腳本可以自動化這一步。
3. **同一天多個 session 會覆蓋 metrics。** 檔名是 `{date}.json`，同一天跑兩次 Code session 會覆蓋。解法：改用 `{date}-{n}.json` 或 `{date}-{session_type}.json`。建議後者。

### 檔名修正

metrics 檔名改為：`{YYYY-MM-DD}-{session_type}.json`

例：`2026-04-09-code.json`、`2026-04-09-cowork.json`

同一天同類型多個 session → `2026-04-09-code-2.json`（罕見，遇到再加序號）
