# Chat Handoff — Cowork Warning 工作流優化討論

**日期**：2026-04-19
**來源 session**：Cowork
**目標 session**：Chat
**任務大小**：M（≈ 45–60 min，含 Chat 評估 + 反饋 + 可能的 skill 規劃 rev1）
**建議模型**：Opus 4.7 + High（對齊 skill 設計議題，需要完整推理）
**信心等級**：中—高（三層問題都有具體實例，但 scope 裁剪需要 Chat 的設計品味把關）

---

## 0. Skill 版本背景

本 handoff 產出時 Cowork 讀到的 `session-handoff` skill 版本為 **v4.13**（2026-04-17 更新，護欄 #15 MCP 寫後驗證）。若 Chat 接手時版本更新，以 Chat 側為準。

### 本 handoff 依據的關鍵規範

| 規範 | 版本 | 適用處 |
|------|------|-------|
| 設計原則四動機 | v4.11 | §3 scope 評估依據 |
| 空中樓閣 meta 護欄 | v5.1（非正式） | §6 注意事項第 3 條 |
| Handoff 八區塊 | v4.6 延續 | 本 handoff 結構 |

### v4.11 四動機速查

新護欄 / 流程必須對齊至少一個：

1. 專案交錯影響
2. 跨 Session 溝通斷點（含工具層假陽性）
3. Token 無效支出
4. Context / 容器管理

動機 3/4 還要同時建 metrics。

---

## 1. 背景

### 1.1 事件

2026-04-19 Cowork 跳出 workspace 容量警示（9.7 GB 剩 401 MB）。Paul 按 Clean up 後叫 Code 診斷，Code 又轉給 Chat，Chat 寫出 `cowork--workspace-cleanup-session-reconcile-2026-04-19.md` handoff 給 Cowork。

Cowork 執行時發現：**Chat 的三路偵察路線（GitHub Issue #155 / worklogs / Apple Notes）全部繞了遠路**。Cowork 側 `scheduled-tasks` MCP 一個 `list_scheduled_tasks` call 就直接對上三個 session 裡的兩個（`governance-metrics-collector`、`wiki-youtube-pull`），命中率 66%。

詳細結果：`worklogs/cowork--workspace-cleanup-diagnostic-2026-04-19.md`

### 1.2 為什麼要系統性優化

Paul 在執行完診斷後主動提出：**「希望你跟 chat 討論出一個處理這類警訊的方式，或許我們的工作流有可以優化的地方」**。

這不是單次事件處理，是 work-stream 層級的優化需求——從「Cowork 警訊如何判斷」「handoff 為什麼繞路」「排程任務如何自清」三個維度一起看。

### 1.3 三層問題（Cowork 初判，需 Chat 評估）

| 層 | 現象 | 根因 | 對齊動機 |
|---|------|------|---------|
| L1 | Chat handoff 的偵察路線繞路 | Handoff 產出者不知道接手方的工具能力 | #2 跨 session 溝通斷點 + #3 token 無效支出 |
| L2 | Paul 看到警訊直覺按 Clean up 沒先判斷 | 沒有 runbook | #4 context/容器管理 + #2 |
| L3 | 排程任務 workspace 中間檔靠 Cowork 被動清 | 設計規範缺失 | #4 context/容器管理 |

Cowork 的判斷：**L1 槓桿最大**——因為它是「改一次、永久提升所有未來 handoff 品質」；L2/L3 是點修。

---

## 2. Step 0 偵察

Chat 接手前請先驗證：

### 2.1 Cowork 的診斷是否可信

讀 `worklogs/cowork--workspace-cleanup-diagnostic-2026-04-19.md` 核對 §1.1 的事實基礎（scheduled-tasks MCP 命中、commit hash 正確、CET 結案）。

### 2.2 v4.11 四動機對齊判讀

逐項審查 L1/L2/L3 的動機對齊是否合理，不合理的當場裁掉。**預設不加**，除非理由充分。

### 2.3 空中樓閣檢查

三層提案裡有沒有 Cowork 主張「既存某規範」但實際不存在的？例如：
- Cowork §1.3 說 L1 對應「v4.11 動機 2」——實際 skill SKILL.md 裡動機 2 的定義是什麼？Cowork 有沒有誤讀？
- Cowork §3 提案「Handoff 必須包含接手方工具能力的相關建議」——session-handoff skill 現有規範是否已部分涵蓋？

Chat 側有歷史脈絡可以快速驗證（v5.0「1086 行」、v5.1 rev3「17 條編號」兩次空中樓閣的教訓）。

---

## 3. 具體步驟

### Step 1：Chat 對三層提案下裁決

每層給明確 status：**Accepted / Rejected / Modified**。Rejected 要寫理由。

#### L1 提案：「Handoff 必須盤點接手方工具能力」

**問題**：今天 Chat 寫 handoff 時沒考慮 Cowork 手上有 scheduled-tasks MCP，導致偵察繞遠路。

**具體規範草案**（待 Chat 細化）：
- Handoff 產出者在寫 §2 Step 0 時，應查詢接手方的工具清單（如 `mcp__scheduled-tasks__*`、`mcp__github__*` 等）
- 若偵察路徑有多條，應優先推薦接手方的最低 token 路徑
- **不要求**產出者列出接手方所有工具——只要求「想過一次」，在 §2 附一行「本偵察路線已考慮接手方 X/Y MCP 能力」

**Metrics**（對齊動機 3）：
- 基線：本次事件 Chat 三路偵察 vs Cowork 一 call（≈ 10× token 差）
- 目標：下一次類似 handoff，接手方可以直接照路徑執行、不需改用更短路線

**Chat 需回答**：
- [ ] Accept / Reject / Modify？
- 若 Accept，寫進 skill SKILL.md 的哪一節？建議新增「#16 handoff 偵察路徑工具盤點」？
- 執行成本評估（skill 膨脹風險）

#### L2 提案：「建立 Cowork 警訊處理 runbook」

**問題**：Paul 看到警訊的直覺是「按 Clean up」，沒先判斷排程 vs ad-hoc。

**具體規範草案**：
- 新建 `docs/runbooks/cowork-workspace-warning.md`
- 三步判斷流程：
  1. `list_scheduled_tasks` → 排除排程 session
  2. 剩下的 ad-hoc session → 看 Cowork UI 裡 session history 是否有未匯出 artifact
  3. 兩項都確認安全 → 再 Clean up
- 在 `CLAUDE.md` §Rollback Protocol 加一行交叉引用

**Metrics**（對齊動機 4）：
- 基線：這次事件從警訊到結案花了多久（Code 診斷 + Cowork 驗證 + Paul 問答 ≈ 30 分鐘）
- 目標：下次 < 10 分鐘

**Chat 需回答**：
- [ ] Accept / Reject / Modify？
- Runbook 寫在 `docs/runbooks/` 還是 `docs/governance/`？
- 是否要 Anthropic 未來改 Cowork UI（把 session type 顯示在警訊裡）才是真正的 fix？

#### L3 提案：「排程任務自清理規範」

**問題**：wiki-youtube-pull 每次跑 Whisper 轉寫會留幾百 MB 中間檔，靠 Cowork 被動清很危險。

**具體規範草案**：
- 新增 scheduled-task 設計規範：script 跑完必須清理自己產生的中間檔
- 範例實作：`scripts/wiki-youtube-ingest.cjs` 在 Whisper 完成後 `fs.rmSync(tmpDir, {recursive:true})`
- 寫進 `CLAUDE.md` 或 `docs/governance/working-environment.md`

**Metrics**（對齊動機 4）：
- 基線：本次 workspace 警訊間隔（無法回推準確時間，但 9.7 GB 剩 401 MB 代表累積數週）
- 目標：警訊間隔 > 3 個月

**Chat 需回答**：
- [ ] Accept / Reject / Modify？
- 這條寫 CLAUDE.md 還是獨立 governance 文件？
- 今日 Paul 指示 wiki-youtube 暫不動（有轉檔進行中）——規範通過後是否要補 PENDING.md 待辦給 Code 一次實作？

### Step 2：若 L1 Accepted，Chat 產出 skill v5.2 規劃 rev1

對齊 session-handoff skill 現有工作流（v5.1 的 rev 循環）：
- rev1：scope 定義 + 源頭事實清單（F-ID）+ 設計原則對齊
- rev2：納入 Cowork 回饋
- rev3：最終定稿

不需要在本 handoff 內完成 rev1，但 Chat 在 §3 裁決時請說明是否要另開 skill 規劃 cycle。

### Step 3：回 handoff 給 Cowork

格式：簡短 markdown 回覆（不要完整八區塊），包含：
- L1/L2/L3 各自裁決
- 若 Accepted，下一步由誰（Cowork / Code / Chat 自己）負責
- Issue #155 完成日誌最終文字建議（Cowork 會負責寫入）

### Step 4：Cowork 收到回覆後，執行剩餘動作

- 寫入 Issue #155 完成日誌（經 sync-dashboard workflow）
- 若 runbook / 規範被 Accepted，產出對應檔案或交辦 Code
- 結束事件

---

## 4. 上游假設

Chat 接手時請先驗證：

1. **Cowork 的 scheduled-tasks MCP 存在且穩定**
   今天 Cowork 實測能 `list_scheduled_tasks` 回傳 15 個任務。若 Chat 測試時失敗，L1 提案的基礎就動搖，需重估。

2. **Chat 側能讀 `cowork--workspace-cleanup-diagnostic-2026-04-19.md`**
   診斷報告是這次討論的事實基礎。讀不到就請 Paul 貼上來。

3. **session-handoff skill 的「新規範納入」流程穩定**
   v5.0/v5.1 兩次迭代都有走 rev1→rev2→rev3 的循環，假設 v5.2 一樣。若 skill 治理流程最近有變（Paul 未告知），以實際為準。

4. **四動機對齊判讀不存在系統性偏誤**
   Cowork 對 L1/L2/L3 的動機歸類是自判，可能有偏誤。Chat 獨立重判，不一致就討論。

---

## 5. 驗證方式

Chat 完成 §3 後需通過：

- **自洽**：三層裁決的理由不互相矛盾（例如不能 L1 Accept 卻把 handoff 工具盤點寫成可選項）
- **空中樓閣檢查**：每個 Accepted 項目的「既存規範引用」都要真實存在，不能憑印象
- **ROI 可衡量**：Accepted 項目的 Metrics 目標可驗證（不是「更好」這種虛詞）
- **sync-dashboard 驗證**：若最終 Issue #155 有更新，用 `gh issue view 155` 或 MCP `get_issue` 確認寫入成功（v4.13 護欄 #15）

---

## 6. 注意事項

- ⚠️ **不要在 Chat 執行 `rm` 或任何檔案刪除** — Cowork 側還有檔案在使用中
- ⚠️ **更新 Issue #155 body > 10KB，走 sync-dashboard 不走 MCP 直推** — Cowork 已驗證 `worklogs/issue-155-body.md` 目前 13KB
- ⚠️ **空中樓閣 meta 第 3 次警戒** — v5.0「1086 行」+ v5.1 rev3「17 條編號」已發生 2 次，若本次出現第 3 次，按 v5.1 retro §5 應升格為 skill 護欄 E1
- ⚠️ **skill 膨脹風險** — L1 若寫進 skill 要控制長度，SKILL.md 現在 543 行（§0 上界 900）
- ⚠️ **不要過度設計** — Paul 的原話是「或許」，不是「必須」。三層全 Accept 不見得是最好結果，Chat 裁掉也可以

---

## 7. 信心等級

**中—高**。理由：

- 三層問題都有明確事件支撐（不是憑空假設）（信心加分）
- L1 有 10× token 差的量化證據，動機對齊強（信心加分）
- 但 L2/L3 是否值得獨立成規範、還是只寫在既有文件裡，需要 Chat 的 skill 設計品味（信心減分）
- v4.11 四動機對齊判讀仰賴主觀詮釋，Chat 可能給出不同結論（信心減分）

降低風險方法：§3 Step 1 要求每層「Accept / Reject / Modify」+ 理由，逼 Chat 明確下判斷，而不是含糊過去。

---

## 8. Integration Checklist

可能影響的其他系統：

- [ ] **session-handoff skill SKILL.md**：若 L1 Accept，需加新規範條目，走 rev1→rev2→rev3 循環
- [ ] **CLAUDE.md**：若 L2/L3 Accept，可能加交叉引用段落（注意 245 行已超 200 軟上限，不要再膨脹）
- [ ] **docs/governance/working-environment.md**：若 L3 寫進這裡而非 CLAUDE.md，需更新 rev 編號
- [ ] **Issue #155 body**：完成日誌追加（sync-dashboard 自動 PATCH）
- [ ] **PENDING.md**：若 L3 通過且需要 Code 實作 wiki-youtube 清理邏輯，寫一條待辦

**不涉及**：

- 不改 API endpoint
- 不動共用函式 / KV / D1
- 不動 deploy / CI

---

**產出者**：Cowork
**產出時間**：2026-04-19 10:3x（本地）
**目標完成時間**：當日 session 內（Chat 評估 + Cowork 執行）
