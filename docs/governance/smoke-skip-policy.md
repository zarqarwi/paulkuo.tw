# Smoke Skip Policy

> 版本 v1.0 | 建立：2026-04-20 | 審計頻率：每季

`worklogs/governance/smoke-skip.json` 是 cross-project-scanner 的白名單機制。
scanner 判定某 commit 缺 Smoke Test 時，若該 hash 已登記在此白名單，視同「已決策跳過」，不追加到 PENDING.md，且 `summary.missing_smoke_tests` 不計入。

---

## 1. 可以 skip 的情況

以下任一條件成立，可登記 skip：

- **Worker 端修復，前端無直接依賴**
  例：`worker/src/youtube-ingest.js` 修復 transcript 管道，paulkuo.tw 前端不讀這支
- **已由其他途徑完成驗證**
  例：本機 backfill 跑完並有 log 紀錄、單元測試全綠、手動 curl 驗過且結果寫進 worklog
- **純文件、純 comment、純格式化**
  例：只改 `README.md`、TSDoc comment、程式碼縮排，無邏輯變更
- **臨時腳本，一次性執行後即刪除**
  例：migration helper，已跑完且已刪

## 2. 不可以 skip 的情況

以下任一條件存在，**禁止** skip，必須補做 Smoke Test：

- commit 的 `risk_level` 為 `critical`
- 影響前端共用模組：`BaseLayout.astro`、`translator.js`、`auth.js`、`utils.js`
- 影響 Worker 主路由：`worker/src/index.js`
- 任何一支 API endpoint 有行為變更（新增、刪除、改 response schema）
- Paul 或 Cowork 明示「這個 commit 需要 smoke test」

## 3. 操作流程

### 登記 skip

1. Paul 決策：確認該 commit 符合第 1 節任一條件
2. 編輯 `worklogs/governance/smoke-skip.json`，在 `entries` 下新增：

   ```json
   "abcd1234": {
     "reason": "一句話說明為何不需要 smoke test",
     "skipped_at": "YYYY-MM-DD",
     "skipped_by": "Paul / Cowork / Code（由誰判定）"
   }
   ```

3. commit 並 push，建議 message：

   ```
   chore(governance): skip smoke test for abcd1234 — {一句話原因}
   ```

4. 下次 scanner 跑時該 hash 自動從 PENDING.md 排除

### 撤銷 skip

直接從 `entries` 刪除對應的 hash，commit push 即生效。
下次 scanner 若 hash 仍在滑動視窗內，會重新追加 PENDING.md。

---

## 4. Schema 說明

```json
{
  "$schema": "smoke-skip-v1",
  "description": "說明文字",
  "entries": {
    "{7-8 字元 commit hash}": {
      "reason": "string（必填）",
      "skipped_at": "YYYY-MM-DD（必填）",
      "skipped_by": "string（必填）"
    }
  }
}
```

`entries` 的 key 使用 7-8 字元短 hash（與 git log --abbrev-commit 一致）。

---

## 5. 審計

- **頻率**：每季（每三個月）由 Cowork session 執行一次 skip list review
- **審計方式**：逐條確認每筆 skip 是否仍合理；若原始 commit 已超過 90 天且從未引發問題，視為 confirmed skip，可保留
- **濫用指標**：單月新增 skip 超過 5 筆，或有 `critical` risk_level 的 commit 被 skip，觸發 Cowork 人工複查

---

## 6. 首批登記紀錄

| Hash | 日期 | 原因摘要 |
|------|------|----------|
| `5c58ee02` | 2026-04-20 | YouTube transcript pipeline 修復（Worker 端），前端無依賴，本機 backfill 已驗 |
