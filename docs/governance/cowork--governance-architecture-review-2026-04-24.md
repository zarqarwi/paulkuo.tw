# cowork--governance-architecture-review-2026-04-24

## Meta

- **Date**: 2026-04-24
- **From**: Chat（Claude.ai）
- **To**: Cowork
- **Source**: `paulkuo-governance-architecture-2026-04-24.pdf`（治理分層架構快照）
- **Scope**: 針對治理分層架構圖的評審意見 → 拆解為可執行任務
- **Type**: Review + Action Items（不含程式碼修改，多為文件/ADR 工作）

---

## Status

`DRAFT` — 待 Paul 審閱後決定接受哪些建議、排序、以及是否進入 PENDING.md

---

## Context

Paul 請 Cowork 整理的治理架構快照已完成（L1-L5 + Claude Skill 儲存位置副圖）。Chat 進行 read-only 評審後，識別出 6 個結構性問題，分三個優先級。本 handoff 的任務是把評審意見**落地為具體可執行的文件變更、ADR 草稿、或腳本修改**，不含 Chat 的主觀偏好強加。

Paul 的最終決策權保留——以下所有 Action Items 皆需 Paul 點頭才執行。

---

## 評審摘要（Chat 觀察）

### 架構強處（保留）

1. 上位法錨點清楚：憲法 v0.2 五條原則統攝所有下游文件
2. 來源分辨做得好：明確區分「Anthropic 官方事實」vs「paulkuo 自創術語」
3. 層間關係有畫出跨層連線（大多數治理文件會漏）

### 結構性問題（6 項）

| # | 問題 | 嚴重度 | 建議優先級 |
|---|---|---|---|
| P1 | 三個文件同時在長度邊緣（速記卡 238、SKILL.md 639、CLAUDE.md 200），只被動觀察 | 高 | P0 |
| P2 | A/B/C 編號兩套意義並存，等 ADR 升格才處理過於溫和 | 中 | P0 |
| P3 | Claude.ai Personal Skill 凍結 v4.13，與 A 層 v5.6 脫鉤 | 高 | P0 |
| P4 | 違憲救濟機制只有自律（速記卡自檢），缺他律（機器檢查） | 中 | P1 |
| P5 | Worklog 三維度缺「放棄了什麼」這個維度 | 低 | P1 |
| P6 | L3 操作 SOP 內容過薄，定位與 L2 WE 重疊 | 中 | P2 |

---

## Action Items（分優先級）

### 🔴 P0 · 本週內處理

#### A1. 三個邊緣文件的拆分計畫

**目標**：在撞到硬上限前主動規劃拆分路徑，避免被迫重構。

**任務**：
- [ ] 建立 `docs/governance/length-budget-status.md`，列出三個文件當前行數、軟/硬上限、距離百分比
- [ ] 對每個文件產出拆分方案草稿：
  - `session-handoff SKILL.md`（639/800，77%）：候選方案為 v5.0 結構重組 + v5.1 metrics/pipeline 拆出（記憶中既有提案）
  - `速記卡 rev2`（238/200，已超軟上限 19%）：候選方案為按情境分類拆為多檔，或升格為獨立 SOP 文件
  - `CLAUDE.md`（200/200，卡軟上限）：候選方案為 WE §4.3 判斷樹直接執行，新規則強制走子文件
- [ ] 在 PENDING.md 新增 `H3-length-budget-enforcement` 議題，描述「超過軟上限自動開 ADR」的觸發規則

**Exit Gate**：三份拆分方案草稿完成 + PENDING.md H3 成立

**Consequences**：若不處理，SKILL.md 撞 800 硬上限時，L4 執行工具會被迫重構，影響跨 session 協作。

---

#### A2. A/B/C 命名衝突直接解決

**目標**：消除命名衝突的認知負擔，不等 ADR 升格。

**任務**：
- [ ] 盤點所有使用 A/B/C 編號的文件（grep repo + auto-memory）
- [ ] 二擇一決策（建議由 Paul 拍板）：
  - **選項 A**：三視窗保留原名（Code/Cowork/Chat），A/B/C 專屬 skill 儲存層
  - **選項 B**：skill 儲存層改用 L1/L2/L3（但會與「L1-L5 治理層」衝突，不建議）
- [ ] 產出 `adr-naming-conflict-resolution-2026-04-24.md`，記錄決策與全面替換計畫
- [ ] 批次替換所有文件中的舊命名（預期影響：憲法 v0.2、WE rev2.3、reference_skill_storage_layers.md、部分 handoff）
- [ ] 替換後跑一次 grep 確認無殘留舊命名

**Exit Gate**：ADR 歸檔 + grep 無殘留 + 所有受影響文件 commit

**Consequences**：若不處理，每次新讀者（含未來的 Paul）遇到 A 層都要判斷是哪一套，認知負擔複利累積。

---

#### A3. Chat 視窗 skill 同步最小可行方案

**目標**：在自動管線（H1）出來前，至少讓 Chat 視窗的我拿到的 skill 不是 v4.13 舊版。

**任務**：
- [ ] 產出一份「Chat 開場用的 skill 摘要貼文」模板：
  - 包含：session-handoff 目前版本 + 關鍵變更摘要（最近 3 個 minor 版）
  - 包含：paulkuo-writing、paulkuo-social、formosa-feedback 當前版本號
  - 位置建議：`docs/governance/chat-skill-briefing.md`
- [ ] 寫一個 cron 或 hook，A 層 skill 有 minor 以上變更時，自動更新此摘要
- [ ] 在 Paul 的 Chat 工作流加一步：開新對話時貼此摘要到對話開頭（或 Project instruction）
- [ ] 在 PENDING.md H1 議題下附註：此為短期權宜方案，自動同步管線仍待立法

**Exit Gate**：摘要模板 + 自動更新機制 + Paul 確認 Chat 工作流調整

**Consequences**：若不處理，Chat 討論治理時，Chat 手上的 skill 理解會持續與 repo 脫節，治理討論品質下降。

---

### 🟡 P1 · 兩週內處理

#### A4. 違憲救濟機制：他律防線

**目標**：把可機器化的憲法條款自動化檢查，補充 N=1 對話瞬時判斷盲區。

**任務**：
- [ ] 盤點憲法五條 + WE §1-§9 中「可機器化檢查」的條款，例如：
  - Handoff ADR Status + Consequences 欄位必填
  - F-ID 格式規範
  - 源頭事實引用的跨載體一致性
  - skill frontmatter pillar 白名單（已有 skill-schema-lint.sh，擴充即可）
- [ ] 產出 `scripts/governance-lint.sh`，整合成 pre-commit hook
- [ ] 新增到 install-hooks.sh，clone 後自動裝上
- [ ] 在 WE §3（Handoff ADR 欄位）補一行「檢查由 governance-lint.sh 強制」

**Exit Gate**：腳本可執行 + pre-commit hook 掛上 + 至少攔截一次真實違規（或跑過完整 repo 驗證無誤）

**Consequences**：若不處理，護欄結構盲區 N=1 持續，違憲只能事後追溯。

---

#### A5. Worklog 加第四維度「abandoned」

**目標**：避免同一個壞主意被重新提出。

**任務**：
- [ ] 修改 Worklog 模板，四維度：
  1. 做了什麼（done）
  2. 決策（decisions）
  3. 踩坑（pitfalls）
  4. 放棄了什麼 + 為什麼放棄（abandoned）— 新增
- [ ] 每維度「無」也要寫「無」（維持現有規則）
- [ ] 更新 session-handoff SKILL.md 中的 Worklog 說明段落
- [ ] 更新速記卡 rev2 對應情境（若有提到 Worklog 的情境）

**Exit Gate**：模板更新 + SKILL.md 更新 + 至少一次實際 Worklog 使用新格式驗證

**Consequences**：若不處理，歷史上被否決的方案缺乏紀錄，容易重複提案。

---

### 🟢 P2 · 本月處理（視情況）

#### A6. L3 操作 SOP 的定位釐清

**目標**：解決 L2 WE 與 L3 SOP 內容重疊的模糊地帶。

**任務**：
- [ ] 評估三個選項：
  - **選項 A**：L3 併回 L2，五層改四層
  - **選項 B**：L2 拆成「原則篇」（留在 L2）+「操作篇」（升到 L3）
  - **選項 C**：維持現狀，但明確定義 L2 vs L3 的寫作規則（例如 L3 只收「跨三窗的操作流程」）
- [ ] 產出 `adr-layer-3-positioning-2026-04-XX.md`，含三選項利弊分析
- [ ] Paul 決策後批次調整文件歸屬

**Exit Gate**：ADR 歸檔 + 選定方案實施完成

**Consequences**：若不處理，新操作規則繼續出現「不知道該寫在 L2 還是 L3」的猶豫，長期增加治理文件熵。

---

## 執行順序建議

```
Week 1（2026-04-24 ~ 2026-04-30）
  Day 1-2: A2（命名衝突）— 最單純，先清
  Day 3-4: A3（Chat skill 同步）— 影響當下協作品質
  Day 5-7: A1（長度邊緣拆分計畫）— 需要較多思考

Week 2（2026-05-01 ~ 2026-05-07）
  A4（governance-lint.sh）
  A5（Worklog 第四維度）

Week 3+（視狀況）
  A6（L3 定位）
```

---

## 需要 Paul 決策的事項

1. **A1**：是否接受「SKILL.md 超軟上限自動開 ADR」這個規則？（會增加 ADR 數量）
2. **A2**：A/B/C 命名衝突的二擇一決策
3. **A3**：Chat 開場摘要是否接受「手動貼到對話開頭」這個工作流？還是要等自動管線？
4. **A4**：governance-lint.sh 若攔截 commit，是直接擋還是只警告？
5. **A6**：L3 定位三選項偏好？（或先擱置）

---

## 不在本 handoff 範圍內（明確排除）

- 實際修改 SKILL.md / 速記卡 / CLAUDE.md 的內容（需另開 handoff，且需 Paul 逐項確認）
- 修改憲法 v0.2 條文（屬立法層級，需 ADR 流程）
- commit + push 任何變更（依 Paul 規則，所有推送需明確授權）

---

## Commit 策略

本 handoff 屬**文件/ADR 工作**，commit 時：
- 分階段 commit：每個 Action Item 完成後獨立 commit
- commit message 標注 `[影響: governance]` 或對應範圍
- push 前須 Paul 明確授權（依 auto-memory handoff 完成標準）

---

## 來源事實（F-ID）

- F-governance-snapshot-2026-04-24: Paul 提供的 PDF 治理架構圖
- F-constitution-v0.2: adr-collaboration-constitution-v0.2-2026-04-19.md（299 行）
- F-we-rev2.3: working-environment.md（629 行）
- F-skill-v5.6: session-handoff SKILL.md（639 行）
- F-cheatsheet-rev2: 速記卡 rev2（238 行）
- F-pending-md: PENDING.md 現有 H1/H2 議題
- F-auto-memory: 28 檔 auto-memory 現況
