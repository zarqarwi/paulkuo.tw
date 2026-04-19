# Rollback Protocol

> 從 `CLAUDE.md` 抽離，2026-04-20。
> 出事時照這份文件操作。

---

## 復原步驟

1. **Worker API 壞了**：`cd worker && git checkout HEAD~1 -- src/ && wrangler deploy --config wrangler.toml`
2. **前端壞了**：`git checkout HEAD~1 -- src/ && npm run build && wrangler deploy`
3. **D1 Schema 改壞了**：D1 沒有原生 rollback，靠 `backup-d1.yml` Action 的每日備份還原
4. **KV 資料錯了**：重新跑對應的 seed 腳本（如 `node scripts/governance-kv-seed.cjs`）
5. **共用檔案改壞多個子專案**：先 revert commit，再逐一跑 smoke test 確認全部恢復

回退後必須對每個受影響的子專案跑 smoke test（見 `docs/shared-file-impact-map.md`）。

---

## Cowork Workspace 警訊處理

跳出容量警訊時，先跑 `list_scheduled_tasks` 區分排程 vs ad-hoc session：
- 排程任務的 working files 可安全清除（產物已 commit 到 repo）
- ad-hoc session 需先確認 artifact 已匯出
