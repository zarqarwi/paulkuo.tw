# mazu.today Redirect Rules — Cowork 偵查結果

> 來源：Cowork session 2026-04-06 (session 2)
> 目標：Code session 偵察 → Paul 在 Cloudflare Dashboard 手動設定
> 風險等級：L2（Paul 親驗，PR #101 前車之鑑）
> 優先級：🟡 活動後也可以

---

## Cowork 偵查結論

| URL | 行為 | 是否正確 |
|-----|------|----------|
| `mazu.today/` | 顯示進香首頁 | ✅ |
| `mazu.today/tracker/` | 顯示打卡頁 | ✅ |
| `mazu.today/dashboard/` | 顯示儀表板 | ✅ |
| `mazu.today/en/` | 顯示英文首頁 | ✅ |
| `mazu.today/en/tracker/` | 顯示英文打卡頁 | ✅ |
| `paulkuo.tw/projects/formosa-esg-2026/tracker/` | 直接顯示內容（無 redirect）| ❌ |

**根本原因**：Worker 的 `handleRequest()` 裡有 paulkuo.tw → mazu.today 的 redirect 邏輯，但 paulkuo.tw 的請求不經過 Worker（直接由 Cloudflare Pages 服務）。Worker 路由只掛了 `api.paulkuo.tw` 和 `mazu.today/*`。那段 redirect code 是死碼。

**解法**：Cloudflare Dashboard Redirect Rules（不是 _redirects 檔案，PR #101 教訓）。

---

## 待 Code 偵察

Code session 請先跑 Step 0，回報偵察結果，不要改任何東西。
完整 handoff 文件在 Paul 本機：`白沙屯ESG繞境/code-prompt-mazu-redirect.md`
