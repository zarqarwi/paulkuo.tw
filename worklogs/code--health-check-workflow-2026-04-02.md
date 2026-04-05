# Code Session：建立 GitHub Actions 健康巡檢 Workflow（2026-04-02）

## 背景

Feedback 自動化 SOP 需要定時巡檢線上服務。Cowork 設計完方案後交接給 Code 建檔部署。

---

## 完成項目

### 1. 建立 `.github/workflows/health-check.yml`
- 6 項端點檢查：主站、Tracker、Feedback API、Worker、CORS、Checkin 效能
- 排程：每小時一次（4/12 後改 30 分鐘）
- 支援手動觸發（workflow_dispatch）
- 失敗自動開 GitHub Issue（標籤 `health-check` + `formosa-esg`）
- 已有 open issue 時加 comment 而不重複開

### 2. Commit + Push
- Commit: `25019af` — `ci: add hourly health check workflow for Formosa ESG endpoints`
- Push to main 成功

### 3. 手動觸發驗證
- Run #23898500106 — **全部通過** ✅
- 6/6 checks success
- Summary step 正確產出表格
- Create issue on failure 正確 skipped（無失敗項）

| Step | Result |
|------|--------|
| Check main site | ✅ success |
| Check tracker page | ✅ success |
| Check feedback public API | ✅ success |
| Check Worker alive | ✅ success |
| Check CORS header | ✅ success |
| Check checkin API response time | ✅ success |
| Summary | ✅ success |
| Create issue on failure | ⏭️ skipped (correct) |

---

## 備註

- Push 同時觸發 deploy.yml，正常現象
- `health-check` / `formosa-esg` labels 尚未建立，若首次失敗時 GitHub script 會自動建
- 4/12 起駕後需將 cron 改為 `*/30 * * * *`
