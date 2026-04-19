# Cowork Handoff — v0.3 憲法四軌收尾 + 日常同步

> 建議模型：Sonnet 4.6 + Medium（純同步，無複雜決策）
> Task Size：S（< 30 min）
> 來源 session：Cowork 2026-04-20（Opus 4.6）

---

## 1. 背景

本輪 Cowork 完成兩件大事：

1. **v0.2 結案三件事**（Issue #155 里程碑 + worklog 三維度 + DONE marker）
2. **v0.3 四軌全程協調**：寫 ADR → 寫 Code handoff（8 段式）→ 中繼 Code 執行 → 收尾記錄

v0.3 Code 執行結果：4 commits（b0860dd→eb91a9e→6ed20f8→3c2f3a8），V1-V8 驗證全過。
Cowork 收尾 commit `8729952`（worklog + Issue #155 里程碑），已 push。

**彩蛋**：收尾 commit 被 Track 3 的 worklog 原子化 hook 攔下一次——狀態變更標了 skill 完成，但待辦快照還掛著 `[ ]`。修正後通過，算是 Track 3 的實戰首殺驗收。

---

## 2. Step 0 偵察（開場做）

```bash
# 確認 sync-dashboard Action 有沒有跑
# → 用 GitHub MCP search_issues 查 #155 body 是否包含 "v0.3 四軌落地"
```

```bash
# 確認 HEAD
git log --oneline -5
# 預期：8729952 在 HEAD 附近
```

```bash
# 掃 PENDING.md
cat worklogs/PENDING.md
```

---

## 3. 開場後待確認項目

### 3a. sync-dashboard 驗證

commit `8729952` push 後應觸發 `.github/workflows/sync-dashboard.yml`，自動 PATCH Issue #155 body。
用 GitHub MCP 的 `search_issues` 確認 body 包含 `v0.3 四軌落地` 字串。
如果沒同步成功 → 手動用 `update_issue` 補。

### 3b. PENDING.md 現有待辦（非本輪 scope，但下輪 Cowork 要知道）

| 優先 | 項目 | 狀態 | 前置 |
|------|------|------|------|
| 🔴 | Formosa Post-Event Issues 批次修復 | 待 Code | 活動結束或 Paul 確認可 deploy |
| 🟡 | YouTube Whisper STT backfill 11 支 | 待重跑 | Groq rate limit reset（隔日） |
| 🟡 | YouTube Worker deploy | 待 backfill 完成 | transcript 修復穩定後 |
| 🟢 | wiki-youtube-ingest.cjs 中間檔清理 | 待 Code | 當前轉檔批次跑完 |
| 🟡 | 5c58ee02 smoke test 缺漏（×3 天重複） | 待確認 | scanner 自動產出，可能已過時 |

---

## 4. 上游假設

1. commit `8729952` 已在 origin/main（本輪 Paul 已 push 確認）
2. sync-dashboard Action 正常運作（上次 v0.2 時驗證過）
3. Code session 的 v0.3 四軌 commits 全部在 main（Code V8 驗證 push 成功）

---

## 5. 驗證方式

| # | 驗證項 | 方法 |
|---|--------|------|
| V1 | Issue #155 body 含 v0.3 里程碑 | GitHub MCP `search_issues` grep "v0.3 四軌落地" |
| V2 | worklog-2026-04-19.md 三維度完整 | 讀檔確認完成日誌 + 狀態變更 + 待辦快照都有 |

---

## 6. 注意事項

- CLAUDE.md 目前 269 行，已超 v7 預期 260 但遠低於 800 觸發點，暫不處理
- worklog-2026-04-19.md 已經很長（跨 04-19 + 04-20 兩天的內容），下輪如果是新日期應開新 worklog
- 本輪沒有 skill 行為變更，不需要 bump session-handoff 版本

---

## 7. 信心等級

**高** — 本輪所有產物已 commit + push，Code 四軌 V1-V8 全過，Cowork 收尾也通過 hook 驗證。無未結風險。

---

## 8. Integration Checklist

- [x] worklog-2026-04-19.md 狀態變更 vs 待辦快照一致（hook 驗證通過）
- [x] issue-155-body.md 完成日誌 + 里程碑區塊已寫入
- [x] PENDING.md v0.3 條目已標 [x]
- [ ] sync-dashboard Action 是否成功 PATCH Issue #155（下輪驗）
