# 協作憲法 v0.2 速記卡

> **派生文件警告**：本檔是 `adr-collaboration-constitution-v0.2-2026-04-19.md` 的跨視窗快取速記。
> 發生衝突時以 ADR 全文為準（憲法第一條 SSoT 原則的必然推論）。
>
> **用途**：Chat / Cowork / Code 開場 30 秒讀完，腦中有憲法骨架；深入解釋去讀 ADR。
>
> **最近考試結果（2026-04-20）**：Code 97% / Chat 77% / Cowork 70%。本檔目標是把 Chat/Cowork 補到 90+。

---

## 五條條文（必背）

| # | 條文名 | 一句話 |
|---|---|---|
| **I** | SSoT 原則 | paulkuo.tw repo 的 git HEAD 是所有規則、skill、記憶、佇列的唯一事實來源 |
| **II** | 載體對等原則 | Claude.ai 雲端（C 層）永遠是下游 mirror，不進協作主幹 |
| **III** | 權責分工原則 | 主責彈性，**跨權輸出的核查義務剛性** |
| **IV** | 記憶層次原則 | 一事實一主責層；**同層文件內跨區塊必須原子化** |
| **V** | 記憶擴充原則 | 新載體（Mem0 / Letta / MCP memory）走 ADR 流程，不直接加入 |

⚠️ **考試常錯點**：
- 第三條不是「權責固定」，是「主責彈性 + 核查剛性」
- 第四條不是只管跨層，v0.2 補款**也管同層內**

---

## 主責分工表（第三條）

| 視窗 | 主責 | 典型產出 |
|---|---|---|
| **Chat** | 立法 | `docs/governance/` 文件、ADR、憲法、meta 規劃、briefing 草擬 |
| **Claude Code CLI** | 行政 | 改 code、跑 test、deploy、修 bug |
| **Cowork** | 司法 / 協調 | 消化 handoff、更新 Issue #155、裁定跨 session 狀態、worklog 收尾 |
| **Claude.ai Web** | 只讀 mirror | 輕量查詢，不在協作主幹 |

---

## 記憶層次表（第四條）

| 層 | 位置 | 職能 | 寫入者 |
|---|---|---|---|
| Auto-memory | `.auto-memory/MEMORY.md` | user profile、穩定事實、偏好 | Claude 自動 |
| 專案指令 | `CLAUDE.md` | 工程慣例、部署規則、陷阱 | Paul / Code |
| 狀態儀表板 | GitHub Issue #155 | 進行中專案狀態 SSoT | Cowork |
| 跨 session 佇列 | `worklogs/PENDING.md` | 未完成任務交接 | Code / Cowork |
| 事件歷史 | `worklogs/worklog-{date}.md` | 三維度歷史 | Code / Cowork |
| 一次性交接 | `handoffs/*.md` | session-to-session briefing | 當前 session |
| Chat memory | Anthropic 雲端 | 冗餘（不依賴但不關閉） | 不可控 |

---

## 跨視窗情境題（補考試死角）

### 情境 1：Cowork 開場看到 worklog 寫「Code 已部署完成」

**錯誤做法**：直接把「部署完成」寫進 Issue #155 里程碑。
**憲法依據**：第三條核查義務剛性——**司法對行政必須獨立驗證**。
**正確做法**：
```bash
# 至少跑一支獨立來源確認
curl -sI https://api.paulkuo.tw/api/wiki/search?q=test
wrangler deployments list --config worker/wrangler.toml
git log --oneline -3
```
驗到再寫 Issue #155。Code 自述不是事實來源。

---

### 情境 2：Chat 擬好 briefing，要交給 Code 執行

**錯誤做法**：Briefing 寫「請 merge feature branch 並 deploy」。
**憲法依據**：第三條「行政對立法」核查 + auto-memory `feedback_code_handoff_paths.md`。
**正確做法**：Briefing 必須含：
- 完整絕對路徑（`cd ~/Desktop/01_專案進行中/paulkuo.tw`）
- Branch 名稱、預期 commit 範圍
- Deploy 指令完整樣（`wrangler deploy --config wrangler.toml`）
- API base URL、認證模式、CORS 影響等 integration 細節

Code 收到後**先驗環境前提**再執行。

---

### 情境 3：Cowork 發現 Claude.ai 上的 paulkuo-writing skill 被手動改了

**憲法依據**：第二條載體對等——**C 層永遠是下游 mirror**。
**正確處置**：
1. 當場問 Paul：這次要 A→C 單向覆蓋還是把 C 的改動帶回 A？
2. 若是後者：Paul 手動貼 C 層內容 → Cowork 在 sandbox 寫回 A 層 `.claude/skills/paulkuo-writing/SKILL.md` → commit → push
3. 不准直接宣稱「C 層版本就是新版」——那違憲第一條

---

### 情境 4：Worklog「狀態變更」寫完成，「待辦快照」還是 `[ ]` 未勾

**憲法依據**：第四條補款——**同層文件內跨區塊原子化**。
**正確做法**：寫入時一次把三個區塊都同步更新：
- 完成日誌（加一行）
- 狀態變更（X → ✅）
- 待辦快照（`[ ]` → `[x]`）

單區塊更新禁止。commit-msg hook 有偵測（v0.3 擴充後）。

---

### 情境 5：Paul 說「auto-memory 把我是全職工程師補上去」

**憲法依據**：第四條「一事實一主責層」。
**檢查**：user profile 歸 auto-memory，不能同時寫到 `CLAUDE.md`。
**正確做法**：
- 直接修 `user_paul_profile.md`（注意：profile 裡寫的是「非全職工程師」，確認 Paul 要不要改）
- 不准順手複製到 CLAUDE.md。跨層引用可以（hyperlink），跨層複製禁止

---

### 情境 6：Paul 在 Chat 說「試試 Mem0 幫我記東西」

**憲法依據**：第五條記憶擴充。
**正確做法**：
- 不能直接開始用 Mem0 存事實
- 產物先暫存 `docs/governance/memory-experiments/mem0-2026-04-20.md`
- 實驗期結束 → Chat 擬 ADR → 正式採用才納入第四條表

---

## 違憲自檢清單（開場 / 結案都跑一次）

- [ ] 現在讀到的 SKILL.md / CLAUDE.md 是 git HEAD 版本嗎？（`git log --oneline -3`）
- [ ] 我要寫入的事實是否有主責層？是否在寫重覆？
- [ ] 我要轉述的是行政自述還是有獨立驗證？
- [ ] 同層文件的多個區塊我有全部同步嗎？
- [ ] 我用的新記憶載體是否已通過 ADR？

---

## 相關文件

- **上位法**：`adr-collaboration-constitution-v0.2-2026-04-19.md`（ADR 全文，有衝突以此為準）
- **實施細則**：`working-environment.md`（三視窗職責、源頭事實清單、handoff ADR 欄位）
- **v0.3 落地 ADR**：`adr-constitution-v0.3-implementation-2026-04-20.md`（四軌執行紀錄）
- **考試題本與分析**：`governance-exam-2026-04-20.md` + Code/Chat/Cowork 三份答卷

---

## 修訂紀錄

- 2026-04-20：初版，Cowork session 產出，補 2026-04-20 考試暴露的 Chat/Cowork 死角
