# Handoff → Code：專案治理框架 Phase 1

建議模型: Sonnet
預估量級: M（15-20 分鐘，多檔案建立 + 腳本撰寫）

---

## 背景

Paul 要建一套跨 Cowork 專案的通用治理機制——追蹤每個專案的產出指標（commits、deploys、自訂指標）和自動化覆蓋率。

Phase 1 目標：建好資料管線基礎，讓每次 session 結束時能自動收集指標。Phase 2 才做 Dashboard 頁面。

---

## Cowork 已經建好的檔案（在 repo 裡，尚未 commit）

以下三個檔案已經由 Cowork 寫入 repo，你要做的第一件事就是確認它們存在，然後 commit。

### 1. `worklogs/governance/projects.json`
6 專案註冊表。每個專案有 id、name、custom_metrics 等欄位。

### 2. `worklogs/governance/automation-registry.json`
自動化登記簿。記錄 6 個自動化任務（Action / Scheduled）+ 3 個手動重複性任務。目前自動化覆蓋率 66.7%。

### 3. `worklogs/governance-framework-spec.md`
完整規格書（九章），包含所有 schema 定義、資料流設計、Dashboard 草案。**這是你的主要參考文件。**

### 4. `worklogs/metrics/` 目錄
空目錄，已建立。

---

## Step 0 偵察

```bash
# 確認 Cowork 產出的檔案都在
cat worklogs/governance/projects.json | jq '.projects | length'
# 預期：6

cat worklogs/governance/automation-registry.json | jq '.tasks | length'
# 預期：6

ls worklogs/governance-framework-spec.md
# 預期：存在

ls -la worklogs/metrics/
# 預期：空目錄存在
```

---

## 步驟 1：Commit Cowork 已建好的檔案

```bash
git add worklogs/governance/projects.json \
       worklogs/governance/automation-registry.json \
       worklogs/governance-framework-spec.md

git commit -m "feat: 專案治理框架 — 註冊表 + 自動化登記簿 + 規格書 [影響: 全專案]"
```

---

## 步驟 2：建 6 個專案的 metrics 子目錄

```bash
for id in paulkuo-main formosa-esg llm-wiki acp ai-ready agora; do
  mkdir -p "worklogs/metrics/$id"
  touch "worklogs/metrics/$id/.gitkeep"
done
```

這些 project id 對應 `projects.json` 裡的 `id` 欄位。

---

## 步驟 3：建 `scripts/collect-session-metrics.sh`

這是核心腳本——每次 session 結束時跑一次，自動從 git log 算出產出指標，寫成 JSON。

**用法：**
```bash
bash scripts/collect-session-metrics.sh <project_id> <session_type> <since_commit>
# 例：
bash scripts/collect-session-metrics.sh paulkuo-main code abc1234
```

**輸入參數：**
- `$1` = project_id（如 `paulkuo-main`，對應 projects.json）
- `$2` = session_type（`code` 或 `cowork`）
- `$3` = since_commit（session 開始前的 commit hash，用來計算 diff）

**腳本要做的事：**
1. `command -v jq` 檢查 jq 是否安裝
2. 用 git 計算以下數據：
   - `commits`: `git rev-list --count $3..HEAD`
   - `files_changed`: `git diff --stat $3..HEAD` 解析
   - `lines_added`: 同上，抓 insertions
   - `lines_removed`: 同上，抓 deletions
3. 產出 JSON 到 `worklogs/metrics/{project_id}/{date}-{session_type}.json`

**輸出 JSON 結構：**

```json
{
  "$schema": "session-metrics-v1",
  "project_id": "paulkuo-main",
  "date": "2026-04-09",
  "session_type": "code",
  "model": "",
  "size": "",
  "outputs": {
    "commits": 5,
    "files_changed": 12,
    "lines_added": 340,
    "lines_removed": 87,
    "deploys": 0,
    "issues_closed": 0,
    "handoff_produced": false
  },
  "custom": {},
  "automation_changes": [],
  "notes": ""
}
```

- `model`、`size`、`deploys`、`issues_closed`、`custom`、`notes` 這些欄位腳本填預設值（空字串/0/空物件），由 session 事後手動補。腳本只負責自動算得出來的部分。
- 如果目標檔案已存在（同一天跑兩次），加序號：`{date}-{session_type}-2.json`

---

## 步驟 4：更新 session-handoff SKILL.md → v4.5

讀 `worklogs/governance-framework-spec.md` 的第七節「session-handoff skill v4.5 修改方案」，裡面有完整的修改清單。重點：

1. 版本號 v4.4 → v4.5
2. 版本說明加一行：`> **v4.5 更新（2026-04-09）：** 新增 metrics 收集步驟 + 專案治理框架（governance）`
3. 核心架構圖加入 `worklogs/metrics/` 和 `worklogs/governance/`
4. Handoff 文件必備區塊加第 7 項：「**本輪 metrics**：一行摘要，如 `5 commits, 12 files, +340/-87 lines, 1 deploy`」
5. Code 回報原則補充：「回報需包含 git stat 數據（commits 數、files changed、lines +/-），供 metrics 收集用」
6. 新增一個章節「Metrics 收集 SOP」，說明：
   - Code session：handoff 前跑 `scripts/collect-session-metrics.sh`
   - Cowork session：從 Code 回報提取數據，直接寫 JSON
   - 跨專案 session：每個受影響的 project_id 各寫一份

---

## 步驟 5：Commit + Push

```bash
git add scripts/collect-session-metrics.sh \
       worklogs/metrics/ \
       .claude/skills/session-handoff/SKILL.md

git commit -m "feat: metrics 收集腳本 + session-handoff v4.5 [影響: 全專案]"
git push
```

---

## 驗證（Code 自己做，不要留給 Cowork）

1. 跑腳本測試：
```bash
bash scripts/collect-session-metrics.sh paulkuo-main code HEAD~3
cat worklogs/metrics/paulkuo-main/*.json | jq .
```
→ 預期：有效 JSON，commits/files_changed/lines 數字合理

2. 目錄結構：
```bash
ls worklogs/metrics/*/
```
→ 預期：6 個子目錄（paulkuo-main、formosa-esg、llm-wiki、acp、ai-ready、agora）

3. SKILL.md 版本：
```bash
head -1 .claude/skills/session-handoff/SKILL.md
```
→ 預期：含 v4.5

---

## 注意事項

- 腳本需要 `jq`（Paul 機器上應該有，但開頭要加檢查）
- `lines_added/removed` 在 merge commit 時可能不準，先忽略
- `worklogs/metrics/` 不要加進 `.gitignore`，這些指標要進 repo

---

## 回報格式

```
N commits pushed:
- {hash} {訊息}
- {hash} {訊息}

驗證：
- collect-session-metrics.sh 測試：{通過/失敗，附 JSON 片段}
- metrics 目錄：{6 個子目錄確認}
- SKILL.md：v4.5 確認

本輪 metrics: N commits, N files, +N/-N lines, 0 deploys, 0 issues closed
```
