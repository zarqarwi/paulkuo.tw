# Cowork Workspace Cleanup — Reconcile 診斷報告

**日期**：2026-04-19
**來源 session**：Chat（handoff `cowork--workspace-cleanup-session-reconcile-2026-04-19.md`）
**執行 session**：Cowork
**信心等級**：高（三個 session 名稱有兩個能精確對應到 scheduled task，輸出已驗證落 repo）

---

## TL;DR

| Session | 身分 | 輸出是否安全 | 風險 | 需補救 |
|---------|------|-------------|------|--------|
| Governance metrics collector | scheduled task `governance-metrics-collector` | ✅ 已 commit `c905f2a` | 無 | 否 |
| Wiki youtube pull | scheduled task `wiki-youtube-pull` | ✅ 已 commit `7b81235`、`be49a9a` | 無 | 否 |
| Analyze CET company documentation | ad-hoc Cowork session（來源待確認） | ❓ 需 Paul 確認 | 中 | 看 Paul 回答 |

**結論**：排程任務的工作檔被清無所謂，設計上中間產物本來就不該留；Clean up 沒有掉資料。唯一要確認的是 CET 那個 ad-hoc session。

---

## 1. Step 0 三路偵察結果

### 1.1 scheduled-tasks 清單（最強證據）

Chat 在 handoff 裡沒提到這條線，但這是決定性的——Cowork 側有 scheduled tasks MCP，直接列出來就真相大白：

| Task ID | 描述 | 本地最後執行 | 狀態 |
|---------|------|------------|------|
| `governance-metrics-collector` | 每日 10:33 收集各專案 GitHub 活動，產出 metrics JSON 並 **commit 到 repo** | 2026-04-18 10:33 | enabled |
| `wiki-youtube-pull` | 每日 10:19 從 KV 拉 YouTube pending 影片，寫入 `wiki/sources/` | 2026-04-18 10:19 | enabled |

兩個 session 名稱一字不差對應到 task ID（只是 dash 換空格）。Cowork 幫每個 scheduled task 啟一個 session 執行，session 名稱 = task description。

### 1.2 worklogs grep

```
worklogs/governance/audit-results/2026-04-18.json  ← metrics collector 的產出
worklogs/governance/last-scan.json                  ← 掃描時間戳
worklogs/governance/automation-registry.json
src/content/wiki/sources/youtube-*.md               ← youtube pull 的產出（Apr 19 10:00 前後批次）
```

### 1.3 Git log 交叉驗證

```
c905f2a auto(scanner): daily audit 2026-04-18           ← metrics collector output
7b81235 chore(wiki-sources): YouTube Whisper STT backfill rate limit 重試第一波
be49a9a chore(wiki-sources): YouTube Whisper STT backfill 7 支
```

兩個排程任務都有「自動 commit 到 repo」的設計——這正是 CLAUDE.md §工程慣例要求的「長時間 pipeline 產出寫入外部儲存」。工作檔被清**不影響最終產物**。

### 1.4 CET 無對應

- scheduled-tasks 清單沒有 `CET` 任何關鍵字
- worklogs / PENDING.md / 近 30 天 git log 無 `CET`、`company documentation`、`盡職調查` 等命中
- 結論：ad-hoc session，需 Paul 主動回憶

---

## 2. 對應表（handoff Step 1 格式）

| Session | 對應身分 | 來源證據 | 輸出永久儲存 | 風險 |
|---------|---------|---------|-------------|------|
| Analyze CET company documentation | ad-hoc Cowork session | 無 | 未知 | 🟡 中 |
| Governance metrics collector | `governance-metrics-collector` scheduled task | scheduled-tasks MCP + commit c905f2a + `worklogs/governance/audit-results/2026-04-18.json` | ✅ GitHub repo | 🟢 無 |
| Wiki youtube pull | `wiki-youtube-pull` scheduled task | scheduled-tasks MCP + commit 7b81235/be49a9a + `src/content/wiki/sources/youtube-*.md` | ✅ GitHub repo | 🟢 無 |

---

## 3. 補救建議（handoff Step 2 格式）

### Governance metrics collector — ✅ 無需補救

設計上就是「掃完 → 寫 JSON → commit」，工作檔只是中間暫存。下次 10:33 會重新執行並覆蓋。

### Wiki youtube pull — ✅ 無需補救

yt-dlp 下載的 mp4/wav 是大宗（Whisper STT 暫存檔），這些本來就不該留。轉寫完的 markdown 已在 repo。**但這個 pipeline 會繼續撐爆 workspace**——9.7 GB 吃掉一半都是它。見 §5 系統性建議。

### Analyze CET company documentation — 🟡 需 Paul 確認

兩個問題：

1. CET 是什麼？（例：中華工程 2515、某客戶縮寫、某技術名詞…）
2. 該 session 有沒有產出 artifact（報告、Excel、Word）已匯出到 `~/Desktop/`？

**三種情境的處理**：
- 情境 A：已匯出 → ✅ 結案
- 情境 B：結論只在對話裡，但 Cowork session history 還能開 → 手動把關鍵內容複製到對應資料夾
- 情境 C：結論要重做 → 產出 Chat → Cowork handoff 重跑

---

## 4. Issue #155 同步建議（handoff Step 3）

**建議不新增 Phase 條目**，因為三個 session 沒觸發任何 Phase 變更。改為在「完成日誌」區追加一條：

```
- 04-19 10:0x Workspace 容量警示清理驗證：governance-metrics-collector + wiki-youtube-pull 產出已 commit (c905f2a, 7b81235, be49a9a)，Clean up 未掉資料；CET ad-hoc session 待 Paul 確認產出歸檔 Cowork
```

⚠️ 按 handoff §6 注意事項：更新前先 `get_issue` 拉最新 body；若 body > 10KB 走本機 `gh issue edit` 而非 MCP 直推。

**我還沒 push 這條更新**，等你決定 CET 結果後一次寫入，避免分兩次 race。

---

## 5. 系統性建議（handoff Integration Checklist §4）

按 v4.11 設計原則四動機審查，以下是對齊檢核：

### 建議 A：wiki-youtube-pull 加「轉寫後立即刪中間檔」

- **動機對齊**：動機 4（Context / 容器管理）
- **Metrics**：下次 workspace 警示時間間隔（目前約 N 天 → 目標延長 3×）
- **成本**：腳本一行 `fs.unlinkSync()`，低
- **建議採納**：✅

具體改法（`scripts/wiki-youtube-ingest.cjs` 或等價腳本）：Whisper transcribe 完成 → `rm -rf tmp/${videoId}/` → 再 commit markdown。

### 建議 B：新增「ad-hoc session 匯出 SOP」護欄

- **動機對齊**：嘗試對齊動機 2（跨 session 溝通斷點）
- **問題**：CET 這次是單點事件，沒有重複發生證據
- **v4.11 守則**：單點事件不加護欄，否則護欄暴脹
- **建議採納**：❌ 暫不加；等同類事件再發生第二次再考慮

### 建議 C：SOP「長時間 pipeline 必須寫入 R2/D1/GitHub」

- **動機對齊**：動機 1（專案交錯影響）+ 動機 3（Token 無效支出）
- **現狀**：CLAUDE.md §Rollback Protocol 已涵蓋
- **建議採納**：❌ 重複不加；**但**可在 CLAUDE.md 加一行交叉引用 scheduled-tasks，讓未來新加排程任務的人看到這條紀律

---

## 6. 上游假設驗證（handoff §4）

| 假設 | 驗證結果 |
|------|---------|
| Session 名稱 ≈ 任務主題 | ✅ 兩個排程任務命中；CET 未驗證但 session 名稱已足夠具體 |
| GitHub Issue #155 是 SSoT | ✅ 依 v4.12 術語定義，本次沿用 |
| Clean up 完成、1.1 GB 釋出 | 未實際 `df -h`（沙盒磁碟不等於 Cowork workspace）；Paul 回報按下後系統未再跳警示，間接驗證 |
| session history 與 output 保留 | 未驗證；建議 Paul 手動開過去 session 看看能否 replay（這點只能在 Cowork UI 做） |

---

## 7. 下一步（給 Paul）

1. **先回答 CET 問題**：那 session 是在做什麼？有沒有匯出 artifact？
2. 決定後我把 Issue #155 完成日誌一次寫入
3. 要的話我幫你把「轉寫後立即刪中間檔」的邏輯加進 wiki-youtube 腳本（建議 A）

---

## 8. 本次診斷用到的來源

- scheduled-tasks MCP `list_scheduled_tasks`
- `/worklogs/governance/audit-results/2026-04-18.json`
- `git log --since="2026-04-17"` in paulkuo.tw
- `src/content/wiki/sources/` 時間戳比對
- Chat handoff `cowork--workspace-cleanup-session-reconcile-2026-04-19.md`

**產出者**：Cowork
**產出時間**：2026-04-19 10:1x（本地）
