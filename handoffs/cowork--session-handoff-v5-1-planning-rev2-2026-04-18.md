---
title: session-handoff skill v5.1 規劃 — revision 2（定稿）
target: code
project: session-handoff skill
purpose: v5.1 收尾 rev3 §3 七項 scope 中未完成的三項（D 撞車 retro + B 護欄編號化 + E 抽 changelog）
date: 2026-04-18
revision: 2（Accepted 定稿）
author: Cowork（本視窗）
status: Accepted（Paul 2026-04-18 拍板 Q-V51-1 ~ Q-V51-5 全 5 題同意）
supersedes: handoffs/cowork--session-handoff-v5-1-planning-rev1-2026-04-18.md
upstream:
  - handoffs/chat--session-handoff-v5-planning-2026-04-17-rev3.md（rev3 §3 七項 scope 源頭）
  - docs/governance/retrospective-2026-04-18-v5-split-reversal.md（v5.0 教訓）
  - docs/governance/working-environment.md（§2 源頭事實規範、§1.3 verifier + planner 分離）
  - worklogs/investigations/2026-04-18-v5-1-source-verification.md（源頭事實依據，commit 734c476）
next_step: Code 依序執行 D → B → E 三份 handoff
confidence: 高（源頭事實 Code 驗證 + rev2 階段 Cowork 讀 11 條實際內容完成精確分組）
estimated_task_size: S+S+S（D + B + E 共約 1-2 天）
sources_of_truth_manifest: §8 附錄 A
verified_by: Code-verified（2026-04-18，commit 734c476） + Cowork 實際內容複核
---

# session-handoff skill v5.1 規劃（revision 2 定稿）

## 0. TL;DR

v5.1 主要矛盾：**將已發生但未資產化的治理產物，收進正確位置**。

三項 scope（依執行序）：
1. **D** — 跨 Cowork 撞車 retro 歸檔
2. **B** — 11 條鐵律首次建立編號系統 + 新增 2 條 = **13 條**（A2 / B4 / C5 / D2 精確分組）
3. **E** — 38 行 changelog 抽離 SKILL.md 成獨立 `CHANGELOG.md`

rev2 相較 rev1 的主要升級：**§3.2 B 的分組從草案升為精確落點**（Cowork 讀 11 條實際內容完成）。其他章節沿用 rev1 邏輯，狀態從 Proposed → Accepted。

---

## 1. Paul 五題拍板紀錄

| # | 題目 | Paul 決策 | 影響 |
|---|------|---------|------|
| Q-V51-1 | 主要矛盾「整理既有治理資產」 | **同意** | §2 主要矛盾確立 |
| Q-V51-2 | scope 三項（B + D + E） | **同意** | §3 scope 鎖定 |
| Q-V51-3 | 執行序列 D → B → E | **同意** | §4 序列鎖定 |
| Q-V51-4 | B 重新定義為首建編號系統 + 新增 2 條 | **同意** | §3.2 落地為 13 條 |
| Q-V51-5 | E 理由採「治理一致性」 | **同意** | §3.3 避免 rationale drift |

---

## 2. 主要矛盾

**將已發生但未資產化的治理產物，收進正確位置**。

v5.0 route C'' 落地後，下列三件事仍處於「已發生但未歸檔」狀態：

1. **11 條鐵律 + 4/17 兩條新事故** — 規則存在但無編號系統，無法引用（B）
2. **跨 Cowork 撞車事件** — 事件已發生 1 天，尚無獨立 retro 檔案（D）
3. **SKILL.md 頂部 38 行 changelog** — 歷史混在規範本體裡，違反「規範與歷史分離」原則（E）

三者共同特徵：**產物已經存在，缺的是歸檔**。v5.1 不建新基礎設施，只整理既有資產。

### 2.1 為什麼 A 與 C 不進 v5.1

依 rev3 §0.6「每個 major 只解一個主要矛盾」原則：

| 項目 | 主軸 | v5.1 不納入理由 |
|------|-----|------------|
| A. 四層檔案架構（L1+L2+L3+L5） | 建新基礎設施 | 38 個 handoff 要搬遷，破壞 v5.1「整理既有」主軸 |
| C. Metrics 三階段 | 建新基礎設施 | scheduled task + aggregator script，同樣破壞收斂性 |

v5.2 候選會是 A + C + CLAUDE.md 245 行越界處置。

---

## 3. v5.1 scope 三項

### 3.1 D — 跨 Cowork 撞車 retro

**本質**：事件紀錄歸檔。

**交付物**：`worklogs/investigations/2026-04-18-cross-cowork-session-collision.md`

**為什麼先做**：
- 時效性最高（事件已 1 天，記憶開始模糊）
- 獨立無依賴
- 工程量 S（純文件）

**內容大綱**（六區塊）：

1. **事實時序**
   - 2026-04-17 PM：兩個 Cowork 視窗同時動 session-handoff v5.0 治理規劃
   - 治理決策在兩視窗之間未同步
   - Paul 覆寫前一視窗的判斷（Cockpit 撤回案）
2. **根因**
   - 假設 Chat/Cowork/Code 三角色線性協作
   - 未預見同角色多 session 並發
   - 治理架構本身的 meta 盲點
3. **代價**
   - Cockpit 一度被覆寫進 v5.0 後再撤回
   - 治理決策連續性受衝擊
4. **學到什麼**
   - 治理規劃的線性假設不成立
   - 需要 meta 治理規則（跨 session 宣告或鎖機制）
5. **目前間接對策**
   - §0.6「每個 major 只解一個主要矛盾」
   - Issue #155 單一事實來源
   - working-environment.md §1 三方職責邊界
6. **直接對策延 v5.2 觀察**
   - 若再次發生，升格為 meta 治理護欄（暫名 E1）

**執行者流程**：
- Cowork 寫文件內容（屬 retro 類，符合 working-environment.md §1.2 Cowork 可動範圍）
- 文件寫完**不由 Cowork commit**——sandbox `.git/index.lock` 已知問題
- 交 Code 本機 commit + push（同 v5.0 rev2 的模式）

**Code handoff**：`handoffs/code--v5-1-D-cross-cowork-retro-2026-04-18.md`

**Exit Gate**：
- [ ] retro 文件建立，含六區塊
- [ ] Code commit + push 成功
- [ ] worklog 追加一行

---

### 3.2 B — 護欄編號系統首建（**rev2 精確落地**）

**本質**：為既有 11 條鐵律首次上編號 + 新增 2 條 = **13 條**。

**交付物**：`.claude/skills/session-handoff/SKILL.md` §「鐵律」節改寫（第 84-108 行）。

#### 3.2.1 11 條鐵律主題分析（rev2 新增）

Cowork 讀 SKILL.md 第 88-108 行 11 條實際內容後，歸納為四個天然主題群：

| 原 # | 一句話精髓 | 主題歸類 |
|-----|-----------|---------|
| 1 | 程式碼修改一律交 Code | A 委託原則 |
| 2 | 含常數的文件 Code dump → Cowork 排版 | A 委託原則 |
| 3 | 對話 30-40 輪或比對 >5 份文件要開新視窗 | D Context 管理 |
| 4 | 完成狀態一律現場查 git log | C 驗證原則 |
| 5 | 不做自我驗證迴圈（文件 A 驗文件 B） | C 驗證原則 |
| 6 | 視窗切換時必須持久化 | D Context 管理 |
| 7 | 偵察先行，行動在後 | C 驗證原則 |
| 8 | GitHub MCP 大檔案截斷 → 「找不到」≠「不存在」 | B 工具失真 |
| 9 | GitHub API 回傳結果要確認語義 | B 工具失真 |
| 10 | Sandbox ≠ Repo，用 filesystem MCP 讀本機 | B 工具失真 |
| 11 | 絕對不用 Apple Notes 存專案狀態 | B 工具失真 |

#### 3.2.2 新增 2 條分類

| 新條 | 事故源 | 主題歸類 |
|------|-------|---------|
| 陰性結果結論節制 | 2026-04-17 另一 Cowork 視窗 Wiki KV seed 誤判（查無 ≠ 不存在，草率下結論） | C 驗證原則 |
| SSoT 變更驗證 | 2026-04-17 另一 Cowork 視窗（SSoT 被改後下游未重驗） | C 驗證原則 |

**新增 2 條都歸 C**（驗證原則），因為性質都是「下結論前的驗證動作」。

#### 3.2.3 最終編號系統（13 條）

| 代碼 | 名稱（簡稱） | 原 # | 事故源 |
|------|-----------|------|-------|
| **A1** | 程式碼修改一律交 Code | 原 1 | 2026-03-31 截斷事故 |
| **A2** | 常數一律 Code dump → Cowork 排版 | 原 2 | — |
| **B1** | GitHub MCP 大檔案截斷意識 | 原 8 | 2026-04-04 RFC #100 |
| **B2** | GitHub API 語義確認 | 原 9 | 2026-04-05 |
| **B3** | Sandbox ≠ Repo | 原 10 | 2026-04-06 Wiki Phase 4 |
| **B4** | 不用 Apple Notes 存專案狀態 | 原 11 | Apple Notes 9000+ 筆卡頓 |
| **C1** | 完成狀態一律現場查 git log | 原 4 | 幻值事件 |
| **C2** | 不做自我驗證迴圈 | 原 5 | 2026-04-04 幻值事件 |
| **C3** | 偵察先行，行動在後 | 原 7 | — |
| **C4** | 陰性結果結論節制（**新增**） | **新** | 2026-04-17 Wiki KV seed 誤判 |
| **C5** | SSoT 變更後下游重驗（**新增**） | **新** | 2026-04-17 SSoT 變更案 |
| **D1** | 對話 30-40 輪或交叉 >5 份文件要換視窗 | 原 3 | — |
| **D2** | 視窗切換時必須持久化 | 原 6 | — |

**分組小計**：
- A 委託原則：2 條
- B 工具失真：4 條
- C 驗證原則：5 條（含新增 2 條）
- D Context 管理：2 條
- **總計：13 條**

#### 3.2.4 命名規則（寫進 SKILL.md）

從 v5.1 起，新增護欄命名必須遵循：

- 以主題代碼開頭（A/B/C/D 擇一，若開新主題需在本節定義主題碼）
- 主題碼後接該主題當前最大序號 + 1
- **不再使用流水號** `#N`
- 退休的護欄編號**不得回收**（保留編號但標 `[retired]`）

#### 3.2.5 與 rev3 §7「17 條」差異說明

| 項目 | rev3 §7 | rev2 實際 | 差因 |
|------|--------|---------|------|
| A 條數 | 6 | 2 | rev3 §7 編號系統虛構 |
| B 條數 | 2 | 4 | 同上 |
| C 條數 | 6 | 5 | 同上 |
| D 條數 | 3 | 2 | 同上 |
| 總計 | 17 | 13 | 源於空中樓閣 |

rev3 §7 的 #1-#15 從未在 SKILL.md 存在（見 §5 治理 meta 紀錄）。v5.1 的 13 條 = 實際 11 條 + 新增 2 條，有源檔 ground truth。

**Code handoff**：`handoffs/code--v5-1-B-guardrail-numbering-2026-04-18.md`

**Exit Gate**：
- [ ] SKILL.md 「鐵律」節改寫為 13 條編號系統
- [ ] 新增 §「命名規則」子節（§3.2.4 內容）
- [ ] skill-schema-lint 跑過 PASS
- [ ] worklog 追加 + commit + push

---

### 3.3 E — 抽 changelog 成獨立 CHANGELOG.md

**本質**：規範與歷史分離。

**交付物**：
- 新增：`.claude/skills/session-handoff/CHANGELOG.md`（收納 v3-v4.8 共七段註記 + v5.0 + v5.1）
- 改寫：SKILL.md 第 13-50 行替換為一行「完整版本歷史見 CHANGELOG.md」

**為什麼做（採用「治理一致性」理由）**：

- 不是為了省 token（skill loader 載入整份）
- 不是為了縮行數（6.9% 無感）
- **是**為了讓 skill 本體只講「當前規則」，歷史歸檔到專屬位置
- **是**收尾 rev3 §7「附錄 A 抽離 v3-v4.x changelog」的遺留項

**為什麼 E 最後做**：
- 純文件搬家，最無風險
- 放在 D + B 之後，確保 B 的 13 條編號化成果能一次寫進 v5.1 changelog entry

**新 CHANGELOG.md 架構**：

```markdown
# session-handoff skill — Changelog

## v5.1 (2026-04-18)
- B：11 條鐵律首次建立編號系統（A2 / B4 / C5 / D2 = 13 條）
- D：跨 Cowork 撞車 retro 歸檔至 worklogs/investigations/
- E：changelog 抽離 SKILL.md 獨立成本檔案（規範與歷史分離）

## v5.0 (2026-04-18)
- 新增 §0 治理複雜度上界（900 硬界 / 800 觸發 / 200 預警）
- 補 3 個 skill frontmatter（Exit Gate 5/5 PASS）
- route C''（不拆只整理，推翻 rev3 拆三份決策）
- 衍生產出：docs/governance/working-environment.md

## v4.8 (2026-04-1x)
（沿用 SKILL.md 原第 13-15 行內容）

## v4.7 (2026-04-1x)
（沿用原第 17-18 行）

... v4.6 → v4.5 → v4.4 → v4.3 → v4.2 → v4.1 → v4 → v3 依序
```

**Code handoff**：`handoffs/code--v5-1-E-changelog-extraction-2026-04-18.md`

**Exit Gate**：
- [ ] CHANGELOG.md 建立，收納 v3 → v5.1 完整歷史
- [ ] SKILL.md 第 13-50 行替換為一行指引
- [ ] skill-schema-lint PASS
- [ ] worklog + commit + push

---

## 4. 執行序列（依賴分析）

```
D（撞車 retro）── 獨立，最先
    ↓
B（護欄編號化）── 改動 SKILL.md 「鐵律」節
    ↓
E（抽 changelog）── 改動 SKILL.md 第 13-50 行 + 新增 CHANGELOG.md
```

### 4.1 為什麼 B → E 不是 E → B

若 E 先做，抽離 changelog 後 SKILL.md 第 13-50 行已消失；B 完成後需在 CHANGELOG.md 新增 v5.1 entry 記錄編號化動作。

順序 D → B → E 讓：
- B 執行時 SKILL.md 仍有 v4.8 changelog（作為歷史參照）
- E 執行時 B 已完成，CHANGELOG.md 的 v5.1 entry 可一次寫完整（包含 D + B + E 三項）

### 4.2 Commit 原子性

三項各自獨立 commit：

```
commit 1: chore(governance): v5.1-D cross-cowork collision retro [影響: session-handoff skill + governance]
commit 2: chore(skills): v5.1-B guardrail numbering system (13 rules) [影響: session-handoff skill only]
commit 3: chore(skills): v5.1-E extract changelog to CHANGELOG.md [影響: session-handoff skill only]
```

---

## 5. 治理 meta 紀錄：空中樓閣現象

### 5.1 兩次實例

| 事件 | 時間 | 性質 | 代價 |
|------|-----|------|------|
| v5.0 「SKILL.md 1086 行」 | 2026-04-17 | 基於未驗證行數假設拍板拆 skill | 1.2 天（事後發現） |
| v5.1 「rev3 §7 #1-#15 編號系統」 | 2026-04-18 | 基於未驗證編號系統規劃 rename | 15 分鐘（rev1 階段抓到） |

### 5.2 共同模式

- 治理文件中出現**言之鑿鑿的具體數字 / 編號 / 規格**
- 在 Chat → Cowork 跨視窗接力時被引用
- 動工前沒人核對源檔，僅在執行準備階段 Cowork 手動驗才發現

### 5.3 對應機制

working-environment.md §2.6「源頭事實清單」規範已建立，本 rev2 §1 就是首次落地實例。

**機制成立證據**：連續兩次踩雷，v5.0 是事後（1.2 天代價），v5.1 是事前（15 分鐘代價）。規範把「撞壁時點」從工程落地階段提前到規劃階段，代價降低 100 倍。

### 5.4 升格觀察

若 v5.2 或後續再出現第三次實例，升格為 skill 護欄（暫名 **E1「治理文件引用之源驗證」**）。v5.1 不納入 scope。

---

## 6. Code handoff 發送清單

rev2 Accepted 後，Cowork 撰寫三份 Code handoff：

| 順序 | Handoff | 工程量 | 模型建議 |
|-----|---------|-------|---------|
| 1 | `handoffs/code--v5-1-D-cross-cowork-retro-2026-04-18.md` | S（Cowork 寫內容 + Code commit） | Sonnet 4.6 + Low（純 commit 任務） |
| 2 | `handoffs/code--v5-1-B-guardrail-numbering-2026-04-18.md` | S（改 SKILL.md §「鐵律」節） | Sonnet 4.6 + Medium（需精確套用 §3.2 分組表） |
| 3 | `handoffs/code--v5-1-E-changelog-extraction-2026-04-18.md` | S（抽 changelog） | Sonnet 4.6 + Low（純文件搬家） |

**三份皆序列執行**，前一份 Exit Gate PASS 後再發下一份。

---

## 7. 信心等級

| 區塊 | 信心 | 說明 |
|------|------|------|
| §1 Paul 拍板紀錄 | **極高** | 五題全 Yes |
| §2 主要矛盾 | **高** | 三項共同特徵收斂度高 |
| §3.1 D 撞車 retro | **高** | 純文件，無技術風險 |
| §3.2 B 13 條編號系統 | **高**（從 rev1 中高升級） | rev2 已讀 11 條實際內容完成精確分組 |
| §3.3 E 抽 changelog | **高** | 純文件搬家 + 理由採「治理一致性」避免 drift |
| §4 執行序列 | **高** | B → E 依賴邏輯清楚 |
| §5 空中樓閣 meta | **高** | 兩次實例模式清楚 + 對應機制已落地 |

**整體信心：高**。rev2 所有論點都有源頭事實或明文原則支撐。rev1 的唯一「中高」項（§3.2 B 分組）在 rev2 升級為「高」。

---

## 8. 附錄 A：源頭事實清單（Sources of Truth Manifest）

依 working-environment.md §7 規範：

| 論點 | X 源頭 | 驗證出處 |
|------|-------|--------|
| §1 所有數字 | Code 驗證報告 | `worklogs/investigations/2026-04-18-v5-1-source-verification.md`（commit 734c476） |
| §3.2.1 11 條鐵律內容 | SKILL.md line 86-108 直接讀取 | Cowork rev2 階段 Read tool |
| §3.2.3 新增 2 條事故源 | 2026-04-17 另一 Cowork 視窗事件 | rev3 §7 表格 + 本輪驗證無衝突 |
| §3.3 changelog 38 行 | Cowork sandbox 更精確 awk 驗 | `awk '/^> \*\*v4.8/.../^## 0\./'` |
| §5 空中樓閣兩次實例 | v5.0 retrospective + 本輪驗證 | docs/governance/retrospective-2026-04-18-v5-split-reversal.md + §1 |

---

## 9. 附錄 B：與 rev1 的差異

| 項目 | rev1（Proposed） | rev2（Accepted） | 變因 |
|------|---------------|---------------|------|
| 狀態 | Proposed | Accepted | Paul 拍板 Q-V51-1~5 |
| §3.2 B 分組 | 草案（A 4-5 / B 1-2 / C 3-4 / D 2-3） | **精確（A 2 / B 4 / C 5 / D 2 = 13 條）** | Cowork 讀 11 條實際內容完成 |
| §3.2 新增 2 條分類 | 預估 A6 + C6 | **實際 C4 + C5（都歸 C 驗證原則）** | 實際內容分析 |
| §3.2.4 命名規則 | 未寫 | 新增（主題碼 + 序號 + 不回收編號） | 編號系統首建的配套 |
| §3.2.5 與 rev3 差異說明 | 未寫 | 新增（A 高估、B 低估的實際落差） | meta 透明度 |
| §4.2 commit 原子性 | 提到 | 加 commit message 範本 | 交 Code 前置明確化 |
| §6 Code handoff 發送清單 | 未寫 | 新增（三份清單 + 模型建議） | rev2 作為 Code handoff 前置步驟 |

---

## 10. 下一步（rev2 生效後）

1. ✅ rev2 Accepted 狀態鎖定（本文件）
2. ⏭ Cowork 撰寫 `handoffs/code--v5-1-D-cross-cowork-retro-2026-04-18.md`（含 retro 內容草稿供 Code 直接 commit）
3. ⏭ Code 執行 D → Exit Gate → 回報
4. ⏭ Cowork 撰寫 `handoffs/code--v5-1-B-guardrail-numbering-2026-04-18.md`（含 §3.2.3 13 條完整文字）
5. ⏭ Code 執行 B → Exit Gate → 回報
6. ⏭ Cowork 撰寫 `handoffs/code--v5-1-E-changelog-extraction-2026-04-18.md`
7. ⏭ Code 執行 E → Exit Gate → 回報
8. ⏭ v5.1 結案：Cowork 更新 Issue #155 + 寫 v5.1 簡短 retrospective + worklog 三維度結算
