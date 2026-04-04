# Handoff: Health Check Cron 提頻至每 30 分鐘

**日期**：2026-04-05
**來源**：Cowork session
**優先級**：🟡 低風險，一行改動
**給**：Code session

---

## 背景

Issue #97 的 checklist 有一項「4/12 前把 cron 改為 */30」，Paul 決定現在就改，提早 burn-in 測試告警機制。

Cowork 嘗試透過 GitHub API 直接改，但 token 缺少 `workflow` scope，無法推送 `.github/workflows/` 路徑的檔案。

## 具體步驟

### 修改 `.github/workflows/health-check.yml`

第 4-5 行，從：
```yaml
    # Every hour. Change to '*/30 * * * *' after 4/12 event start
    - cron: '0 * * * *'
```

改為：
```yaml
    # Every 30 minutes — activated 4/05 for burn-in before 4/12 event
    - cron: '*/30 * * * *'
```

### Commit + Push
```bash
git add .github/workflows/health-check.yml
git commit -m "chore: health-check cron 提頻至每 30 分鐘，4/12 前 burn-in"
git push origin main
```

## 驗證

1. Push 後到 GitHub Actions 頁面確認 workflow 有顯示 `*/30 * * * *`
2. 等 30 分鐘看有沒有自動觸發一次 run
3. 或手動 `workflow_dispatch` 跑一次確認

## 注意

- 活動結束後（約 4/21）記得改回 `0 * * * *`
- Issue #97 的對應 checklist 項目可以打勾

---

*Cowork session 2026-04-05 產出*
