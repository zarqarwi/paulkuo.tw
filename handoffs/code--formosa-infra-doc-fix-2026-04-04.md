# Handoff → Code session

## 背景

Cowork session 在 Cloudflare Dashboard 上實際確認了 paulkuo-ticker Worker 的 Variables and Secrets。
發現 `FORMOSA_ALERT_USER_ID` **已經設定且值已加密**，健康監控告警功能不會被 skip。

但在排查過程中發現一個文件層面的問題：之前某次 Code session 對話中提到的 Worker 名稱 `formosa-worker` 是錯的，
實際上 Cloudflare 上的 Worker 叫 **`paulkuo-ticker`**（wrangler.toml 第一行：`name = "paulkuo-ticker"`）。

這個名稱不一致可能會讓未來的 Code session 在排查問題時找錯方向。

---

## 確認事實（Cowork 已驗證）

| 項目 | 狀態 |
|------|------|
| `FORMOSA_ALERT_USER_ID` secret | ✅ 已設定於 paulkuo-ticker，Value encrypted |
| Worker 正式名稱 | `paulkuo-ticker`（不是 `formosa-worker`） |
| wrangler.toml 位置 | `worker/wrangler.toml`，第一行 `name = "paulkuo-ticker"` |
| Cloudflare Dashboard URL | `https://dash.cloudflare.com/4bf7e4b38d30ab7d4a191eefbf393133/workers-and-pages/paulkuo-ticker` |
| 帳號下所有 Workers | paulkuo-tw (Pages), paulkuo-ticker, paulkuo-tw (Worker), paulkuo-eval |

---

## Step 0：偵察（先查再改）

```bash
# 確認 repo 內是否有任何地方引用了 formosa-worker 這個錯誤名稱
grep -rn "formosa-worker" .

# 確認 wrangler.toml 的 Worker 名稱
head -1 worker/wrangler.toml

# 確認程式碼中 FORMOSA_ALERT_USER_ID 的使用方式
grep -rn "FORMOSA_ALERT_USER_ID" worker/src/
```

---

## 具體步驟

### 1. 掃描 repo 中所有 `formosa-worker` 引用

如果 grep 找到任何檔案引用了 `formosa-worker`，全部改為 `paulkuo-ticker`。

### 2. 在 worker 程式碼中加入 infrastructure 註解

在 `worker/src/index.js`（或主入口）的頂部加入註解：

```javascript
/**
 * Worker: paulkuo-ticker
 * Cloudflare Dashboard: https://dash.cloudflare.com/.../workers-and-pages/paulkuo-ticker
 * Routes: api.paulkuo.tw, mazu.today/*
 *
 * Required Secrets (set via Dashboard or wrangler secret):
 *   - FORMOSA_ALERT_USER_ID: LINE User ID for health alert push
 *   - FORMOSA_LINE_TOKEN: LINE Messaging API channel token
 *   - FORMOSA_LINE_CHANNEL_SECRET: LINE channel secret
 *   - FORMOSA_ADMIN_TOKEN: Admin API authentication
 *   - ... (see Dashboard for full list)
 */
```

### 3. 考慮建立 docs/infrastructure-map.md

建一份簡單的 infrastructure mapping 文件，把 Cloudflare 資源名稱、對應的 repo 路徑、route 都記下來。
這樣未來任何 session 查問題時都有一份可靠的對照表。

建議內容：

```markdown
# Infrastructure Map

## Cloudflare Workers

| Worker 名稱 | Repo 路徑 | 部署指令 | Routes |
|-------------|----------|---------|--------|
| paulkuo-ticker | worker/ | `wrangler deploy --config worker/wrangler.toml` | api.paulkuo.tw, mazu.today/* |
| paulkuo-eval | eval-worker/ | `wrangler deploy --config eval-worker/wrangler.toml` | — |

## Cloudflare Pages

| 專案名稱 | Repo 路徑 | 部署方式 | Domain |
|----------|----------|---------|--------|
| paulkuo-tw | / (root) | `git push` → CI/CD | paulkuo.tw |
```

---

## 驗證方式

1. `grep -rn "formosa-worker" .` 應該回傳空結果
2. `head -5 worker/src/index.js` 可看到新增的 infrastructure 註解
3. （如有建立）`cat docs/infrastructure-map.md` 確認內容正確

---

## 注意事項

- **不需要動任何 secret 設定**，`FORMOSA_ALERT_USER_ID` 已經存在且正常
- 這次只是文件修正，不涉及程式邏輯改動
- `formosa-worker` 這個名稱從未在 Cloudflare 上存在過，純粹是文件/對話記憶錯誤

---

## 回報格式

完成後在 worklog 記錄：
```
- {HH:MM} 修正 formosa-worker → paulkuo-ticker 文件錯誤，新增 infrastructure map ({commit hash}) Code
```
