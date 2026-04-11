---
name: cross-project-impact
description: |
  paulkuo.tw 跨子專案程式碼影響偵測與驗證追蹤。當 Cowork 開場讀 worklog、處理 Code handoff、
  審查 git log、或 Paul 提到「影響」「壞掉」「跨專案」「smoke test」「共用模組」「部署驗證」時觸發。
  也在 session-handoff skill 產出 handoff 時觸發——自動附上影響分析段落。
  即使 Paul 只說「剛改了 index.js」「translator 有更新」「部署完了」，
  只要語境涉及可能影響多個子專案的程式碼變更，就應該觸發此 skill。
  不要用於單一子專案內部的改動（例如只改 formosa.js 不影響其他專案）。
---

# Cross-Project Impact — 跨子專案影響偵測 Skill

## 這個 skill 解決什麼問題

paulkuo.tw repo 有多個子專案共用同一個 codebase。
改 A 可能壞 B，但靜態文件只靠人記得去查。
這個 skill 讓 Cowork 在三個關鍵時機自動執行影響分析，把「規範層」的防線升級為「執行層」。

## 資料來源（關注點分離）

兩份 JSON 各管一件事：

- **專案清單** → `worklogs/governance/projects.json`（唯一事實來源）
- **共用檔案清單** → `docs/shared-files.json`（唯一事實來源）

觸發此 skill 時，第一步永遠是讀這兩份 JSON。不要依賴硬寫清單。
如果 JSON 讀不到，fallback 到 `docs/shared-file-impact-map.md`。

## 開場檢查：Scanner 心跳

觸發本 skill 時，先檢查 `worklogs/governance/last-scan.json`：
- 如果 `last_success` 距今超過 48 小時 → 告警「跨專案掃描器可能失效」
- 如果檔案不存在 → 告警「掃描器從未成功執行」

這是 Chat 審查時建議的靜默失敗防護。

## 三個觸發時機

### 1. 開場掃描（Session 開始時）

讀最新的 worklog 和近期 git log，比對是否有「動到共用檔案但沒跑 smoke test」的 commit。

**關鍵優化**：不要掃完整三天的 git log。找到最近一份 worklog 或 handoff 文件的日期，只掃那之後的新 commits。這樣在長對話裡不會重複分析已經看過的 commits。

**執行步驟：**

1. 讀 `docs/shared-files.json` 和 `worklogs/governance/projects.json`
2. 檢查 `worklogs/governance/last-scan.json` 心跳
3. 找最新 worklog 的日期作為掃描起點（沒有就用 3 天前）
4. 跑 `git log --name-only --since="{起點}" --pretty=format:"%h %s"`
5. 比對 shared-files.json 的 critical + shared_modules + ai_ready_auto
6. 檢查 commit message 的 `[影響: ...]` 標注和 worklog 的 Smoke Test 記錄
7. 產出摘要

**產出格式：**
```
## 跨專案影響掃描（{日期}）

### 需要注意的 commits
- {hash} {message} — 動到 {檔案}，影響 {子專案}
  - ✅ / ❌ commit message 標注
  - ✅ / ❌ smoke test 記錄

### 待驗證項目
- [ ] {子專案} — `{驗證指令}`（從 shared-files.json 的 smoke_tests 取）

### 無異常
```

### 2. Handoff 影響分析（產出 handoff 時）

Cowork 寫 handoff 給 Code 時，自動分析涉及的檔案。

1. 讀 `docs/shared-files.json` 和 `worklogs/governance/projects.json`
2. 掃描 handoff 內容中的檔案路徑
3. 比對共用檔案清單
4. 涉及共用檔案時，在 handoff 尾部加上：

```markdown
## ⚠️ 跨子專案影響提醒

本次改動涉及以下共用檔案：
- `{檔案}` → 影響：{子專案}

### 部署後必驗
{從 shared-files.json smoke_tests 取}

### Commit 格式提醒
commit message 必須包含 [影響: {子專案}] 標注（commit-msg hook 會自動擋）
```

### 3. Worklog 審查（讀 worklog 時）

讀 Code 的 worklog 時：

1. 讀 `docs/shared-files.json`
2. 比對 worklog 裡提到的 commit 是否涉及共用檔案
3. 缺少 Smoke Test → 提醒 Paul 並附上 smoke_tests 裡的對應指令

## 新增子專案的流程

1. 在 `worklogs/governance/projects.json` 加入新專案（唯一要改的專案清單）
2. 在 `worklogs/governance/automation-registry.json` 登記自動化任務
3. 如果有新的共用檔案，在 `docs/shared-files.json` 加入
4. 如果新專案有 API，在 `docs/shared-files.json` 的 `smoke_tests` 加驗證指令

Hook、skill、scanner 全部動態讀 JSON，不需要改任何程式碼。

## 與其他機制的協作

三層防線 + Dashboard，各自職責清楚：

- **commit-msg hook**（第一層・預防）：commit 時即時攔截。讀 `shared-files.json` + `projects.json`
- **本 skill**（第二層・分析）：Cowork 開場、handoff、worklog 審查。讀同樣兩份 JSON
- **scheduled task**（第三層・稽核）：`cross-project-impact-scanner`，每日 10:30。寫心跳到 `last-scan.json`
- **Governance Dashboard**（巨觀監測）：專案健康度、產出趨勢、自動化覆蓋率。不處理逐次 commit 的稽核

異常偵測的邊界（Chat 審查結論）：
- Dashboard 看**趨勢層級**的異常（某專案一週沒活動）
- 防線看**逐次 commit** 的稽核（改了共用檔案有沒有標注）
