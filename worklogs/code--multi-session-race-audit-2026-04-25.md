# Multi-Session Race Condition 盤點稽核

**產出日期**：2026-04-25
**產出 session**：Code（Sonnet 4.6）
**上游任務**：Q2 D1-D4 工程落地檢查 D4 項
**紀律**：只盤點實例 + 暴露面，不立法不 framing

---

## 1. 已知散落實例

| # | 日期 | 類型 | 來源路徑 | commit / 簡述 |
|---|------|------|----------|----------------|
| R1 | 2026-04-17 | 同角色多 session 決策撞車 | `worklogs/investigations/2026-04-18-cross-cowork-session-collision.md` | 兩個 Cowork 視窗同時推進治理規劃，Cockpit 方案被後寫入的視窗覆蓋；pre-v5.0 intra-role protocol 缺失 |
| R2 | 2026-04-17 | CI push race | `worklogs/2026-04-17-seo-index-push-rejected-investigation.md` + commit `70173b2` | seo-index.yml / ai-ready-opt.yml 多次觸發互相搶 push；修復：concurrency group + retry + pull --rebase |
| R3 | 2026-04-18 | 跨 session worklog 並發寫衝突 | `worklogs/worklog-2026-04-18.md` L77 | v5.1-B commit 時 remote 已有 Cowork 端 worklog 追加；v5.1-E commit 有衝突需手動解；靠 pull --rebase 緩解 |
| R4 | 2026-04-18/2026-04-25 | Cowork sandbox .git/index.lock | `worklogs/worklog-2026-04-18.md` L72 + `worklogs/worklog-2026-04-25.md` L43 | 跨 session sandbox uid 不同導致前 session 殘留 lock 無法 rm；所有 commit 轉 Code 本機處理 |
| R5 | 2026-04-19 | git index.lock（rebase 中斷） | `worklogs/worklog-2026-04-19.md` | Paul 本機 rebase 進行中時 Code 嘗試 git add，fatal error；Paul 清除後恢復 |

---

## 2. 工程暴露面

### 2.1 git ops

| 操作 | lock 衝突風險 | 說明 |
|------|-------------|------|
| `git commit` | 高 | Cowork sandbox 殘留 index.lock 可直接阻擋 |
| `git push` | 中 | CI workflow 並發觸發搶 push（R2 案例） |
| `git pull --rebase` | 中 | 跨 session 同時改同一份 worklog 必吃 rebase 衝突 |
| `git fetch` | 低 | 只讀，衝突可能性低 |
| `git add` | 低 | 本身安全，但 index.lock 存在時會失敗 |

### 2.2 非 git ops

| 操作 | 並發風險 | 說明 |
|------|--------|------|
| 多 session 同時改 `PENDING.md` | 高 | governance-scanner.yml 的 auto-commit 會 `git add worklogs/PENDING.md`；若 Code session 同時改，衝突必發 |
| 多 session 同時改 `worklog-YYYY-MM-DD.md` | 高 | R3 實際案例，無鎖機制 |
| 多 session 同時寫 `handoffs/*.md` | 中 | 通常同一 handoff 只有一個 writer，但若 Cowork + Code 同時新增不同 handoff 可能觸發 push race |
| 多 Cowork 視窗同時修改治理文件 | 高 | R1 實際案例，intra-role 無協調機制 |

---

## 3. 既有緩解機制

| 機制 | 覆蓋面 | 狀態 |
|------|-------|------|
| force-push 禁止（branch protection） | push race | ✅ 已設，`d46ff7f` 稽核確認 |
| CI concurrency group（cancel-in-progress: false） | CI push race | ✅ `70173b2` 已修，seo-index.yml / ai-ready-opt.yml |
| `git pull --rebase` before push（CI + 手動 SOP） | 一般 push race | ✅ 已採用，但仍需手動解衝突 |
| commit-msg hook（跨子專案影響標注） | 影響範圍標注 | ✅ `.git/hooks/commit-msg` 已安裝 |
| Cowork sandbox 切 Code 本機 commit SOP | index.lock | ✅ WE §1.3.2 已文件化；實際靠 handoff 轉換 |
| governance-lint.sh pre-commit hook | ADR 結構違憲 | ❌ H7 ADR Accepted 但腳本未實作（見 D3） |

---

## 4. 觀察建議（供 Paul 裁決是否升 PENDING.md）

1. **`PENDING.md` 並發保護空白**：governance-scanner.yml auto-commit 每日 10:00 會改 PENDING.md，若 Code session 同時手動改同一份，push race 必發。沒有任何鎖機制。若未來 scanner 執行頻率提高，碰撞機率上升。
2. **worklog 並發寫摩擦**：跨 session 並發寫同一份 worklog 的衝突解決成本目前靠人工 rebase，無自動化緩解。worklog-2026-04-18.md L94 已標 `[ ] 拆分 worklog 為每 session 獨立 sub-file`（延 v5.2）。

---

## 5. 結論

- **需新工具**：否——現有問題有緩解（branch protection + concurrency group + WE SOP）
- **需 ADR**：不立（依 Paul Q2 裁決「不立法」）；若觀察建議 #1 PENDING.md 並發問題加劇再提案
- **本稽核**：純散落紀錄集中，無 framing 分析
