# KV Plan A 完成：TTL 取代手動 Delete

**日期**: 2026-04-06
**Commit**: a4b6fd2
**部署版本**: e82ca73e-4153-4e0e-adab-8a23fb78fc7b

---

## 改動摘要

移除 `worker/src/formosa.js` 中 `handleFormosaFlushBuffer` 的三處 KV delete 操作：

| 原行號 | 移除內容 | 原因 |
|--------|---------|------|
| L587 | `await Promise.all(valid.map(e => env.TICKER_KV.delete(e.key)...))` | buffer keys 已有 TTL 259200s (3天) |
| L603 | `await Promise.all(invalid.map(e => env.TICKER_KV.delete(e.key)...))` | 同上 |
| L628-632 | `kv.get(lockKey)` + `kv.delete(lockKey)` (flush lock 清理) | lock 已有 TTL 90s |

## 偵察發現（與 Cowork handoff 的差異）

- KV namespace 是 `TICKER_KV`（handoff 寫的 `FORMOSA_KV` 不正確）
- **所有 put 已有 expirationTtl**，不需要額外加 TTL — 只需移除 delete
- 淨變更：-9 行，+1 行（lock finally 改為註解）

## 預期效果

- KV delete 操作從 ~1.3M/月 降至 0
- 節省 ~$8-10/月
- 零功能變更，buffer 資料流完全不受影響

## Smoke Test

- ✅ Worker 部署成功（wrangler deploy）
- ✅ 路由正常（/api/formosa/checkin 存在）
- ✅ grep 確認 formosa.js 中 `.delete(` 呼叫歸零
- ✅ 無 merge conflict
