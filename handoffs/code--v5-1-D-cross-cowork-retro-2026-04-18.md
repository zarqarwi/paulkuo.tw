---
target: code
project: session-handoff skill v5.1 — D 跨 Cowork 撞車 retro 歸檔
purpose: 將 2026-04-17 跨 Cowork 視窗撞車事件寫成獨立 retro 檔案，歸檔至 worklogs/investigations/
date: 2026-04-18
author: Cowork（本視窗）
upstream:
  - handoffs/cowork--session-handoff-v5-1-planning-rev2-2026-04-18.md（rev2 §3.1 本任務來源）
  - docs/governance/working-environment.md（§1.2 Cowork 可動 retro 類文件，但 commit 交 Code）
blocks: v5.1-B 護欄編號化（D 完成後才發）
confidence: 高（純文件 commit，無判斷、無技術風險）
estimated_effort: 10 分鐘（Code 端純 commit + push）
model_suggestion: Sonnet 4.6 + Low（機械任務）
status: Proposed
consequences: |
  Cowork 已在本 handoff §3 寫完整份 retro 內容。Code 的唯一工作是把 §3 內容逐字寫進
  worklogs/investigations/2026-04-18-cross-cowork-session-collision.md，加 worklog 一行後
  commit + push。不做內容修改、不做結論增刪。若發現內容有事實錯誤（如時間、事件描述），
  停下來回報 Cowork，不要自行修。
---

# Code Handoff：v5.1-D 跨 Cowork 撞車 retro 歸檔

## 0. 任務來源

v5.1 規劃 rev2 §3.1 第一項 scope。Cowork 在 sandbox 寫好 retro 內容，但 sandbox `.git/index.lock` 已知無法 commit，交 Code 本機寫檔 + commit + push。

---

## 1. 工作目錄

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
```

---

## 2. 任務清單

### 2.1 建立 retro 檔案

**目標路徑**：`worklogs/investigations/2026-04-18-cross-cowork-session-collision.md`

**內容**：直接複製本 handoff §3 的完整內容（從 `# 跨 Cowork 視窗撞車事件 retro` 標題開始，到 §6 結束），逐字寫入。

### 2.2 追加 worklog

在 `worklogs/worklog-2026-04-18.md` 的「完成日誌（最新在上）」區塊頂部追加：

```markdown
- {HH:MM} v5.1-D 跨 Cowork 撞車 retro 歸檔 ({commit hash}) Code
```

`{HH:MM}` 用執行當下的時間；`{commit hash}` 用 commit 完成後的短 hash（前 7 碼）。

### 2.3 Commit + push

```bash
git add worklogs/investigations/2026-04-18-cross-cowork-session-collision.md worklogs/worklog-2026-04-18.md
git commit -m "chore(governance): v5.1-D cross-cowork collision retro [影響: session-handoff skill + governance]"
git push origin main
```

---

## 3. Retro 檔案完整內容（Code 逐字複製）

以下為 `worklogs/investigations/2026-04-18-cross-cowork-session-collision.md` 的完整內容。從下一行的 `# 跨 Cowork 視窗撞車事件 retro` 開始到 §6 結束，全部逐字貼入檔案。

---

# 跨 Cowork 視窗撞車事件 retro

**事件日期**：2026-04-17
**歸檔日期**：2026-04-18
**歸檔緣起**：v5.1-D scope（session-handoff skill v5.1 規劃 rev2 §3.1）
**分類**：治理架構 meta 事故

---

## 1. 事實時序

- **2026-04-17 下午**：兩個 Cowork 視窗（下稱 Cowork-A、Cowork-B）同時在處理 session-handoff v5.0 治理規劃的相關議題。
- Cowork-A 在推進 v5.0 的 Cockpit 整合方案；Cowork-B 在進行另一條治理修訂線。
- 兩視窗之間的治理決策**未同步**——各自基於片段資訊推進。
- Paul 於晚間察覺兩條線產生衝突，覆寫前一視窗（Cowork-A）的 Cockpit 決策，撤回原方案。
- 衝突消化後，Chat → Cowork v5 規劃流程被迫回溯檢視。

---

## 2. 根因

### 2.1 線性協作假設

當時的治理架構（pre-v5.0）隱含以下假設：

- Chat 做規劃 → Cowork 執行規劃 → Code 落地程式
- 三角色**線性接力**，無同角色並發情境

### 2.2 未預見的並發

實際運作中，Paul 會同時開多個 Cowork 視窗處理不同議題——這是正常工作習慣，不是濫用。但治理架構未考慮：

- **同一 Cowork 角色**可能有兩個活躍 session 在平行工作
- 兩個 Cowork session 對同一份治理文件的修改順序未定義
- Issue #155 / handoffs/ / worklogs/ 的寫入沒有跨 session 鎖機制

### 2.3 Meta 盲點

這是治理架構**本身**的盲點：治理規則定義了角色之間（Chat/Cowork/Code）的分工，但沒定義**同角色多 session** 的協調規則。用語言模型的術語：定義了 inter-role protocol，沒定義 intra-role protocol。

---

## 3. 代價

- **Cockpit 方案一度被寫進 v5.0 後再撤回**——規劃文件版本歷史出現「錯誤的決策痕跡」。
- **治理決策連續性受衝擊**——原本的線性推進假設被打破，需要補救性的手動整併。
- **時間成本**：難以精確量化，但至少 Paul 的半天時間用在覆核、裁決、撤回上，而非推進新工作。
- **信心成本**：對治理架構本身的穩定性產生疑慮，進一步推動 v5.0 的 route C''（整合不拆）決策。

---

## 4. 學到什麼

### 4.1 線性協作假設不成立

治理架構必須容納**同角色多 session 並發**作為預設情境，不是例外情境。

### 4.2 Meta 治理規則需求浮現

若要從根本解決跨 Cowork 撞車，需要**跨 session 宣告或鎖機制**。可能形式：

- 開新 Cowork 視窗前先查 Issue #155 的「活躍 session」清單
- handoffs/ 寫入前檢查最近 24h 是否有同主題的 in-progress handoff
- Cowork 開場時強制讀 worklogs/ 最新一份與 PENDING.md（此已於 v4.x 規範，但無強制執行）

### 4.3 事前 vs 事後補救

事後手動整併成本極高（本次至少半天）。事前的輕量宣告機制（例如「開 Cowork 先宣告要動哪份文件」）成本可控（每次開場 30 秒）。槓桿比極高。

---

## 5. 目前間接對策

雖然本次事件未產出直接對策（延 v5.2 觀察），但 v5.0 的幾項產出**間接**降低了再次發生機率：

### 5.1 §0.6「每個 major 只解一個主要矛盾」

若每個 major 只推一件事，跨 session 動同一文件的機率降低。多視窗若各自推進不同 scope，衝突自然少。

### 5.2 Issue #155 單一事實來源

所有跨 session 狀態收斂到 Issue #155。兩個 Cowork 開場時讀同一份事實，理論上能發現對方存在（若 Issue #155 有更新）。

### 5.3 working-environment.md §1 三方職責邊界

明文劃分 Chat/Cowork/Code 的可動範圍，降低角色混淆。但**未解決同角色並發**——這是 v5.2 待處理。

### 5.4 §2.6 源頭事實清單規範

雖非直接對應，但「任何具體數字 / 編號 / 規格必須有 ground truth 驗證」的規範，間接提高了跨 session 協作的事實對齊度。v5.0 的 1086 行幻值、v5.1 rev3 §7 的 17 條幻編號，都是同類現象的不同表現。

---

## 6. 直接對策延 v5.2 觀察

### 6.1 為何不進 v5.1

v5.1 的主要矛盾是「整理既有治理資產」——收納已發生但未歸檔的產物。建立跨 session 鎖機制屬於「建新基礎設施」，違反 §0.6「每個 major 只解一個主要矛盾」。

### 6.2 v5.2 候選護欄（暫名 **E1**）

若 v5.2 或後續再出現第三次跨 Cowork 撞車實例，升格為 skill 護欄。暫定名與規則初稿：

> **E1「跨 Cowork session 動同文件前宣告」**
> Cowork 開場寫 handoff / retro / skill 前，必先 grep handoffs/ 最近 24h 是否有同主題 in-progress 文件。若有，先讀完對方狀態再決定是否併軌或等待。

### 6.3 升格觸發條件

- 再次發生跨 session 覆寫事件
- 或 Paul 主動要求納入 v5.2 scope

### 6.4 歸檔位置

本 retro 存於 `worklogs/investigations/`（對應 working-environment.md §2 investigations 目錄規範）。若 v5.2 升格為護欄，將在 SKILL.md 新增 E1 條目 + 於本 retro 加「後續處置」區塊。

---

**retro 結束。**

---

## 4. Integration Checklist

- [x] 工作目錄：`~/Desktop/01_專案進行中/paulkuo.tw`
- [x] 無 API 呼叫、無 CORS 影響、無 deploy
- [x] 無 wrangler.toml / wrangler.jsonc 影響
- [x] 跨子專案影響：session-handoff skill + governance（commit message 已標注）
- [x] 檔案新增路徑：`worklogs/investigations/2026-04-18-cross-cowork-session-collision.md`
- [x] 檔案修改：`worklogs/worklog-2026-04-18.md`（追加一行）

---

## 5. Exit Gate

- [ ] `worklogs/investigations/2026-04-18-cross-cowork-session-collision.md` 建立，§1-§6 完整
- [ ] `worklogs/worklog-2026-04-18.md` 追加完成日誌一行
- [ ] `git commit` 成功，commit message 含 `[影響: session-handoff skill + governance]` 標注
- [ ] `git push origin main` 成功
- [ ] 回報 Cowork：commit hash + push 確認

---

## 6. 明確不要做的

- **不修改 §3 retro 內容**。逐字複製貼入檔案。
- **不做事實判斷**（「這段寫得對嗎」——那是 Paul 的事，Cowork 已與 Paul 對齊）。
- **不動 SKILL.md**（B 項工作，下一份 handoff 處理）。
- **不動 CHANGELOG.md**（E 項工作，第三份 handoff 處理）。
- **不合併 commit**。本任務獨立一個 commit，不與其他動作混。
- **若發現事實錯誤**（例如日期、事件描述有誤），**停下來回報 Cowork**，不要自行修。

---

## 7. 模型建議

**Sonnet 4.6 + Low**

理由：
- 純文件複製 + commit + push
- 無架構判斷、無決策、無技術風險
- token 成本最低者勝

---

## 8. 預期後續

本任務完成後：

1. Code 回報 commit hash + push 結果
2. Cowork 撰寫下一份 handoff：`handoffs/code--v5-1-B-guardrail-numbering-2026-04-18.md`（B 護欄編號化）
3. v5.1 三項 scope 依序推進：D → **B** → E

---

## 附錄：源頭事實清單

| 論點 | X 源頭 | 驗證出處 |
|------|-------|--------|
| 2026-04-17 撞車事件 | Paul 口述 + rev3 §7 表格相關記載 | rev3 §7 + v5.0 retro |
| Cowork-A Cockpit 被覆寫 | v5.0 規劃歷程 | docs/governance/retrospective-2026-04-18-v5-split-reversal.md |
| §0.6 原則 | working-environment.md | `wc -l docs/governance/working-environment.md` = 408 |
| v5.1 主要矛盾「整理既有」 | rev2 §2 | handoffs/cowork--session-handoff-v5-1-planning-rev2-2026-04-18.md |
