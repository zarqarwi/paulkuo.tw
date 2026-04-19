# Skill Storage 四層盤點報告

**建立**：2026-04-19（Cowork，方案 C 規劃前置偵察）
**對應 handoff**：
- `handoffs/cowork--skill-sync-long-term-plan-briefing-2026-04-19.md`（briefing v2，本盤點為其階段 1）
- `/mnt/uploads/cowork--skill-storage-inventory-2026-04-19.md`（Chat 提供的盤點 SOP）

**性質**：純偵察、零改動。

---

## 1. 結論先行

| 結論 | 證據 |
|---|---|
| 四層 storage 架構成立 | A/B/C 三層皆驗證；D 層 N/A |
| **B 層只有 session-handoff 一個 skill** | Paul 本機 `ls ~/.claude/skills/` 直接驗 |
| **其他 4 個 Personal skills 只在 C 層**（無 A/B 副本） | A 層 ls + B 層 ls 雙重確認 |
| session-handoff 的 A/B 已同步到 v5.3，C 層停在 v4.13 | 本機 `diff -r` 空、`mtime` 4/19 16:43 |
| Briefing v2 §2 對照表「副本數 ≥ 3 × 5 = 15 份」假設不成立 | 實際只有 1×3 + 4×1 = 7 份 |
| 前一輪 Cowork 「審核 cp 同步」流程不嚴謹（C 層當 B 層驗）| 本輪重做時發現 sandbox mount 是 C 層 mirror |

---

## 2. 四層架構（修正版）

| 層 | 儲存位置 | 版本管理 | 讀取者 | Cowork 觀察路徑 |
|---|---|---|---|---|
| A. Project | repo 內 `.claude/skills/` | git | Claude Code 在該 repo 內 | `/sessions/.../mnt/paulkuo.tw/.claude/skills/` |
| B. Personal CLI | Mac 本機 `~/.claude/skills/` | 無 | Claude Code 全域 | **sandbox 看不到** — 需 computer-use 或 Paul 貼 |
| C. Personal Cloud | Anthropic 雲端 | 無（UI 編輯） | Claude.ai、Desktop App、Excel/PPT 外掛、**Cowork runtime**、Chat runtime | `/sessions/.../mnt/.claude/skills/`（Cowork runtime mirror）+ Chat `/mnt/skills/user/` |
| D. Organization | 組織目錄 | Owner 管理 | Team/Enterprise 成員 | N/A — Paul 個人方案 |

### 重要更正（vs briefing v2 §2）

**Briefing v2 §2 寫**：「Cowork sandbox 看到的 `.claude/skills/` 是 B 層」→ **錯**。

**事實**：sandbox `/sessions/.../mnt/.claude/skills/` 底下有 `skill-creator / setup-cowork / docx / pptx / schedule` 等 Anthropic 平台 skills，這些根本不在 Paul 本機 `~/.claude/skills/`。**Cowork runtime 掛的是 C 層**，跟 Chat 的 `/mnt/skills/user/` 同一層。

這意味著 briefing v2 §2 對照表「B 層 v5.3（Code 本輪 cp 同步）| 證據：Code 本輪 `diff -r` 無輸出」中，前一輪 Cowork 沒有真正獨立驗 B 層——是「Code 在本機 Mac 跑 diff -r」這個聲稱被信任，而 Cowork sandbox 對該結論完全沒有獨立查證能力。**本輪透過 Paul 在 Mac Terminal 直接執行才完成 B 層真正的跨來源驗證**。

---

## 3. 各 skill 跨層比對

| Skill | A 層（paulkuo.tw repo） | B 層（~/.claude/skills/） | C 層（雲端 Personal） | 發散等級 |
|---|---|---|---|---|
| **session-handoff** | ✅ 標題 v4.8 / 內容 v5.3（mtime 4/19 16:06）| ✅ 完整鏡像（mtime 4/19 16:43，`diff -r` 空）| v4.13（Apr 17 凍結）| 🔴 A/B 超前 C 一個 major |
| paulkuo-writing | ❌ | ❌ | ✅（v2.4）| ❓ C 層獨點，無 A/B 備份 |
| paulkuo-social | ❌ | ❌ | ✅ | ❓ 同上 |
| formosa-feedback | ❌ | ❌ | ✅ | ❓ 同上 |
| organize-downloads | ❌ | ❌ | ✅ | ❓ 同上 |
| skill-creator | ❌（Anthropic Example）| ❌ | C/Examples（`/mnt/skills/examples/`）| 跳過 |

**註**：A 層 paulkuo.tw repo 還有其他專案級 skills（cross-project-impact、formosa-feedback-triage、wiki-ingest、wiki-lint）——這些不是 Personal skill，不在本盤點範圍。

### 發散等級定義

- 🟢 一致：版本號相同
- ⚠️ 小落差：minor 版本差 1
- 🔴 大落差：major 差或 minor 差 ≥ 2
- ❓ 單邊存在：只在一層有，另一層沒備份/正本

---

## 4. session-handoff 三層版本歷史對照

| 層 | 版本標誌 | 哲學 |
|---|---|---|
| A/B | v5.3 內容（標題凍結 v4.8，CHANGELOG v5.3）| C1-C5 編號護欄、空中樓閣 retro、paulkuo.tw 特化 |
| C | v4.13 | 三元分工、Learned Preferences、業界護欄 #8-#11 通用 SOP |

兩棵樹分岔點約落在 v4.8 → v4.9。v4.9-v4.13 走 C 層通用線；v5.0-v5.3 走 A/B 層 paulkuo.tw 特化線。Briefing v2 §3 已詳述。

---

## 5. 建議行動（供 Q1-Q4 決策參考）

### 短期（1 週內可做）

1. **C 層更新**：把 A/B v5.3 的關鍵內容（C1-C5 編號、空中樓閣 retro、C4 邊界）人工貼到 Claude Desktop App → Customize → Skills → session-handoff。**只能 Paul 手動操作**，沒有 API/同步路徑。
2. **CLAUDE.md 加條款**：每次 SKILL.md 改動 commit 後，工程慣例增加「立即 cp 到 ~/.claude/skills/ + 提醒 Paul 手動更新 C 層」。涵蓋 PENDING.md line 112 的方案 B 後半段（前半 cp 已實裝）。

### 中期（方案 C 決策後）

依 briefing v2 §4 Q1-Q4 結果：
- 若選 1a（合併）→ 設計 v6.0，整併兩棵樹
- 若選 1b（分工）→ 明文定義「什麼歸 C 層通用、什麼歸 A 層 paulkuo.tw 特化」
- Q4 推廣 → 因為其他 4 skills 在 A/B 沒副本，「推廣」實質意義是「要不要把 C 層獨點 export 成 repo 副本」

### 長期（v6.0 之後）

- 增護欄 C6 / #16「跨介面 skill 版本同步」
- 加自動偵察：每次 session 開場比對 A/B/C 版本號

---

## 6. 流程教訓（記入 retro，避免下次踩同坑）

### 6.1 Sandbox mount 不是 B 層 mirror

前一輪 Cowork（briefing v1）以為 `/sessions/.../mnt/.claude/skills/` 是 Paul 本機 `~/.claude/skills/` 的 mirror，把 v4.13 結果當成 B 層證據——**錯**。Cowork runtime 掛的是 **C 層**。任何「B 層查驗」都必須走獨立來源（Paul Terminal、computer-use）。

### 6.2 Code 自驗不算跨來源

Code 在本機 Mac 跑 `diff -r`，輸出寫進 worklog——這是**單一來源**。前一輪 Cowork 把這個聲稱當「已驗證」傳遞到 worklog line 5/16、PENDING.md line 110、briefing v2 §2，**整條傳遞鏈沒有任何獨立查證點**。本次 Paul Terminal 直接驗才是真正的 C4 邊界 🟢 級跨來源。

幸運的是這次 Code 真的執行了 cp（mtime 4/19 16:43、diff -r 空），陽性結論為真。但流程上的 C4 違反獨立存在——下次未必同樣幸運。

### 6.3 「副本數」估算前必先列舉

Briefing v2 §2 寫「副本數 ≥ 3 × 5 = 15 份」基於「每個 Personal skill 都三層皆有副本」的假設。實際 4 個 skills 只在 C 層——副本數其實是 3 + 4 = 7。**任何結構性陳述前，先實際列舉**，不要從層 × 數量推算。

### 6.4 待辦快照與 PENDING/log 的內部矛盾

worklog 4/19 line 5/16/17 寫使用者級 skill 同步「完成」，但同檔 line 47 的待辦快照又寫「`- [ ]` 使用者級 skill 同步 → Code/Paul」未完成。這是同一份文件內兩個區塊互不一致。實際是 line 5/16/17 為真（已完成）、line 47 沒同步更新。**寫 worklog 結尾的待辦快照時，必須回頭比對前面的「狀態變更」區塊**。

---

## 7. Exit Gate 自檢（briefing §10 + Chat handoff §9）

- ✅ 四層都有盤點結果（A/B/C 實證、D 層 N/A）
- ✅ 發散點清單具體：session-handoff 🔴、其他 4 個 ❓
- ⏳ 報告 commit 到 paulkuo.tw repo（待本輪結束時 Code 補）
- ⏳ Issue #155 日誌寫入 + 寫後驗證（階段 3 任務）
- ⏳ Briefing handoff 消化 DONE 標記（階段 3 任務）
- ⏳ Q1-Q4 決策對齊（階段 2 任務）

---

## 8. 偵察事實清單（給後續 ADR 引用）

| 編號 | 事實 | 來源 |
|---|---|---|
| F1 | A 層 session-handoff/SKILL.md 標題 `v4.8`、內容含 v5.3 C4 邊界 | sandbox `head` |
| F2 | A 層 mtime 2026-04-19 16:06:50 | sandbox `stat` |
| F3 | B 層 session-handoff/SKILL.md 與 A 層 `diff -r` 為空 | Paul Terminal |
| F4 | B 層 mtime 2026-04-19 16:43:36 | Paul Terminal |
| F5 | B 層只有 session-handoff 一個 skill 目錄 | Paul Terminal `for d in ~/.claude/skills/*/` 只回 1 行 |
| F6 | C 層 session-handoff = v4.13、mtime Apr 17（Cowork runtime 一致）| sandbox `/mnt/.claude/skills/` + Chat 截圖 |
| F7 | C 層含 5 個 Personal skills + Anthropic Example/Public skills | Chat handoff §3 + sandbox 路徑列舉 |
| F8 | Cowork runtime `/sessions/.../mnt/.claude/skills/` 掛的是 C 層、不是 B 層 | sandbox 路徑包含 `skill-creator/setup-cowork/docx` 等 Anthropic 平台 skills |
| F9 | d5b0877 commit 內容只含 A 層改動（無 cp 證據），cp 動作在 commit 之外執行 | `git show d5b0877` |
| F10 | worklog 4/19 line 5/16/17 與 line 47 內部矛盾（同 skill 同步狀態前完成後未完成）| `worklog-2026-04-19.md` |
