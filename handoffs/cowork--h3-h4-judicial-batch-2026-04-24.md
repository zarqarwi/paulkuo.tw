# cowork--h3-h4-judicial-batch-2026-04-24

## Meta

- **Date**: 2026-04-24（晚間起草，給下個 Cowork session 接手）
- **From**: Cowork session（Opus 4.6，2026-04-24 下午+晚間）
- **To**: 下一個 Cowork session（建議 Opus 4.6；若 H3/H4 涉及 WE 條文編修工作量中等，Sonnet 4.6 夠用）
- **Scope**: 兩項 Cowork 司法議題（H3/H4）的處理脈絡與建議方向
- **Status**: Proposed — 下個 Cowork 決定是否採納方向或另提方案

---

## 為什麼這份是 Cowork 專屬

依協作憲法第三條權責分工：
- H1/H2/H5/H7/H8/H9 = **Chat 立法**（見 `handoffs/chat--h1-h9-legislative-batch-2026-04-24.md`，等 Chat session）
- **H3/H4 = Cowork 司法**（憲法實施細則層級的修補，不涉及新立法）

H3/H4 都是「既有規範的實施缺陷」而非「要制定新規範」，屬 Cowork 司法範圍。**可以獨立於 Chat 裁決並行處理**——不互相擋。

---

## H3 · auto-memory 跨視窗不對稱寫入

### 問題脈絡

**事實**：
- Cowork 能寫 `.auto-memory/`（macOS 本機路徑）
- Chat 視窗不掛載這個路徑
- 結果：Cowork 寫的 auto-memory 只對 Cowork 後續 session 生效，Chat 完全讀不到

**為什麼這是結構缺陷**：
- 護欄設計假設 auto-memory 跨視窗生效（R1 護欄：觸發句型時載入對應 memory）
- 實際上 R1 在 Chat 的穿透率 = 0%
- Chat 的 memory 在 Claude.ai 雲端另一套系統，**邏輯上屬 cloud 層**，不是 auto-memory 同一套
- 工程上**單邊無法解決**（Chat 不支援 macOS 路徑掛載）

**來源**：PENDING.md 第 106-110 行（2026-04-20 立條目）

### Cowork 建議處理方向

本項**不是修工程**，是**修規範文字讓能力邊界明確化**。

**具體動作**：
1. 編輯 `docs/governance/working-environment.md` §1.2「跨視窗能力矩陣」
2. 在 auto-memory 對應的那行欄位明示：
   - **Cowork**：可讀可寫
   - **Code**：可讀可寫
   - **Chat**：不讀不寫（結構性限制，非 bug）
3. 若 WE §1.2 目前沒有「能力矩陣」這節，則在 §1 下新增子章節 §1.2
4. 更新 `.claude/skills/session-handoff/SKILL.md` 的 Chat 相關段落，把「memory」條款改為「Chat 記憶 ≠ auto-memory，請用開場貼文替代」

**預期產出**：
- WE rev2.4（或 rev2.3.1）
- SKILL.md 對應段落微調
- worklog 三維度紀錄
- 若速記卡沒提到此限制，順便加入相應情境題（但注意速記卡已超軟上限 238 行）

**不要做**：
- 不要發明「把 auto-memory 同步到 Chat」的工程方案（那是 H1 的範圍）
- 不要動憲法第二條（這不是憲法層級議題）

### 預估工作量

**小**（30 分鐘內）。純文字編輯，無跨系統操作。

---

## H4 · Cowork 新 session 剛性核查補強

### 問題脈絡

**事實**：
- 2026-04-20 治理考試發現：Cowork 新 session 被問「session-handoff 目前第幾版」時，會答 v4.13
- 原因：Cowork 開場**讀 sandbox 的 cache 層 mirror 就信**（那是 plugin bundle 解壓的版本，可能過時）
- 沒觸發憲法第三條**剛性核查**（該去 repo 層 git HEAD 驗證）

**為什麼這是結構缺陷**：
- 憲法第三條的剛性核查在 Cowork v5.6 SKILL.md 已擴充觸發句型（類別 A ADR 清單、類別 B 精確事實）
- 但**開場 checklist 沒有強制核查步驟**
- 結果：即使觸發條件在 session 中段才遇到，開場就已經把錯誤答案內化成「事實」

**來源**：PENDING.md 第 111-114 行（2026-04-20 立條目）

### Cowork 建議處理方向

**具體動作**：
1. 編輯 `.claude/skills/session-handoff/SKILL.md` 的開場 Checklist 段落
2. 新增一步：「-1 步驟：版本號 / 行數 / 清單項數類問題，**即使 cache 層或 sandbox 有答案**，仍須跑 repo 層 git HEAD 核查」
3. 具體指令範例：
   - 版本號：`git -C ~/Desktop/01_專案進行中/paulkuo.tw show HEAD:.claude/skills/session-handoff/SKILL.md | head -5`
   - 行數：`wc -l ~/Desktop/01_專案進行中/paulkuo.tw/.claude/skills/session-handoff/SKILL.md`
   - 對比 sandbox 的版本號，若不一致 → 以 repo 層為準
4. 速記卡 rev2（238 行，超軟上限 19%，需注意）的違憲自檢清單第 7、8 項已涵蓋此問題，SKILL.md 修改要與速記卡一致

**預期產出**：
- SKILL.md v5.7（或 v5.6.1，由 Cowork 判斷版號跳動幅度）
- 對應的 CHANGELOG.md 條目
- sync 到使用者級（`cp -r .claude/skills/session-handoff/ ~/.claude/skills/session-handoff/`）
- worklog 三維度紀錄
- cloud 層對齊（`docs/governance/c-layer-snapshot.md` 更新「對齊 repo 層版本號」）

**不要做**：
- 不要寫全自動核查腳本（那是 H7 governance-lint.sh 的範圍，等 Chat 裁決）
- 不要擴充 Chat 對應的 checklist（Chat 無 Read 能力，剛性核查改寫見 H2）

### 預估工作量

**中**（1 小時）。需要更新 SKILL.md + CHANGELOG + sync + cloud 層同步。

---

## 建議處理順序

**H3 先，H4 後**。理由：
- H3 單純（30 分鐘），先結清一項建立動能
- H4 涉及 SKILL.md 升版，工作量較大且要處理 skill 同步管線（sync-skills-to-cowork.sh）

**或並行處理都 OK**，兩項彼此獨立。

---

## 完成後的交接流程

```
下個 Cowork session 完成 H3/H4 ↓
  ↓
更新 PENDING.md 兩條標 [x]（五符號 schema，2026-04-24 採納）
  ↓
寫 worklog（三維度）
  ↓
本 handoff git mv 到 handoffs/done/
  ↓
Paul 本機 commit + push
```

---

## 跟其他並行 Track 的關係

**不影響**的：
- Chat 六項立法裁決（H1/H2/H5/H7/H8/H9）— 獨立戰場
- Code Track 2 執行池（YouTube、AI Ready）— 獨立戰場
- Code 56 個 git 歷史 iCloud 副本清理 — 獨立戰場

**可能相關**的：
- H4 SKILL.md 升版若涉及開場 checklist 大改，可能是未來 session-handoff v6.0 的前哨戰，但本次以最小改動為原則
- H3 / H4 都會寫入 WE 或 SKILL.md，注意今晚 Cowork 最後留下的 WE rev2.3 + SKILL v5.6 基準，避免被 skill commit 分離事件的歷史踩過

---

## 來源事實（F-ID）

**此 handoff 由 Cowork 2026-04-24 下午+晚間 session 起草。引用行數為當時快照，下個 Cowork 請用 Read 核實。**

- F-pending-md: `worklogs/PENDING.md` 第 106-114 行（H3/H4 原始條目）
- F-we-rev2.3: `docs/governance/working-environment.md`（629 行，待新增 §1.2 能力矩陣）
- F-skill-v5.6: `.claude/skills/session-handoff/SKILL.md`（639 行，77% 觸發點）
- F-cheatsheet-rev2: `docs/governance/constitution-v0.2-quick-reference.md`（238 行，已超軟上限 19%）
- F-c-layer-snapshot: `docs/governance/c-layer-snapshot.md`（當前對齊 repo 層 v5.6）
- F-exam-2026-04-20: `docs/governance/exam-2026-04-20-*-answers.md`（H4 原始發現來源）
- F-constitution: `docs/governance/adr-collaboration-constitution-v0.2-2026-04-19.md`
- F-naming-resolution: `docs/governance/adr-naming-conflict-resolution-2026-04-24.md`（β 命名已採納，處理 H3/H4 時文字一律用 repo/cache/cloud 層）

---

## Signature

- **起草**：Cowork session（Opus 4.6），2026-04-24 晚間收尾
- **Status**：Proposed — 下個 Cowork 決定採納或調整
- **建議模型**：Opus 4.6（WE 文字編修 + SKILL.md 升版都需要語感與版號判斷）
- **歸檔**：完成後下個 Cowork 自行 `git mv` 本 handoff 到 `handoffs/done/cowork--h3-h4-judicial-batch-2026-04-24.md`
