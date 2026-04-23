---
target: chat
project: session-handoff skill
purpose: v5.0 結構性重組規劃——revision 3（整合三份 Chat 審查意見 + Paul 六題拍板）
date: 2026-04-17
revision: 3（收斂版，Paul 六題全同意 + 外部專案登記撤回）
author: Cowork（本視窗）
supersedes: chat--session-handoff-v5-planning-2026-04-17.md（revision 2）
merged_from:
  - chat--session-handoff-v5-review-2026-04-17.md（Chat #1 Review）
  - chat--session-handoff-v5-second-opinion-2026-04-17.md（Chat #2 Second Opinion）
  - chat--session-handoff-v5-meta-review-2026-04-17.md（Chat #3 Meta-Review）
next_step: Cowork × Paul 最後對齊 → Code 執行（兩條主線獨立 handoff）
confidence: 高（三份 Chat 意見收斂 + Paul 六題拍板 + 外部專案登記從 scope 撤回）
estimated_task_size: M（skill 升級主線 2-3 天 + skill-schema-lint POC 獨立 1 天）
related_skill: /sessions/intelligent-peaceful-mccarthy/mnt/.claude/skills/session-handoff/SKILL.md (v4.13)
related_retro: docs/governance/retrospective-2026-04-17-mcp-truncation.md
---

# v5.0 結構性重組規劃（revision 3 收斂版）

> 這份文件是 revision 2 的**替代版本**（非增補）。
> revision 2 的內容已被三份 Chat 審查意見挑戰並收斂。
> Paul 已對收斂後的六題拍板同意。
> Code 直接照本文件執行，revision 2 僅作歷史紀錄保留。

---

## 0. TL;DR

三份 Chat 審查意見共同得出五點共識，Paul 全盤接受：

1. **v5.0 scope 必須縮**——revision 2 塞了四件事（分層 + Metrics + 護欄重分類 + Cockpit），超過 major version 應只解一個主要矛盾的原則
2. **L1.5 管線層 + Cockpit / Ground Station 延到 v5.1**——一次事故不足以支持一整層基礎設施，GitHub Actions concurrency group 就能解 race
3. **SKILL.md 1086 行本身就是問題**——v5.0 核心工程目標改成「拆 skill」（core / guardrails / ops），這是 ROI 最高的單點
4. **治理複雜度必須有上界**——新增第 0 章定義護欄/字數/分層/session 類型軟上限 + 退休機制
5. **外部專案登記從 scope 撤回**——Paul 明確指示「只處理有納入 Cowork Project 的外部專案」且目前全部標「待定」，所以這條平行線整條撤除

---

## 1. Paul 六題拍板紀錄

| # | 題目 | Paul 決策 | 影響 |
|---|------|----------|------|
| 1 | 路線 A / B / C | **路線 C**（skill 升級主線 + skill-schema-lint POC 平行，**不**平行外部專案登記） | revision 3 只留兩條主線 |
| 2 | 拆 skill 進 v5.0 嗎 | **同意**（Second Opinion 論點強） | v5.0 核心工程目標納入拆分 |
| 3 | 撤回 Cockpit / Ground Station | **同意**（推翻先前覆寫 Cowork 的決定，尊重原工程判斷） | 第六章整個拿掉，pipelines.yaml POC 留沙盒 |
| 4 | 治理複雜度上界數字 | **同意**（護欄 ≤ 20 / skill ≤ 900 行 / 分層 ≤ 5 / session 類型 ≤ 4） | 寫入第 0 章 |
| 5 | 外部專案名單 | **全部「待定」先不登記** | 路線 C 的平行登記線撤除 |
| 6 | 最終護欄數 | **17 條**（捨 revision 2 的 #18 多管線 race，加 Chat 建議的 meta 治理宣告延到 v5.1 觀察） | 3.A-3.D 分組重算 |

---

## 2. 背景（摘自 revision 2 與三份 Chat 意見整合）

v4.13 後 retrospective 指出：**治理增長速度 ≈ 事故發生頻率**，v5.0 應降低事故發生頻率而不只是事後補得快。

Paul 決定動 v5.0 處理的痛點（經 Chat 挑戰後再收斂）：

1. ✅ Session 檔案散落四個目錄、v4.x skill 只管兩種——**保留**（四層架構解決）
2. ✅ 檔案缺完整生命週期——**保留**（歸檔規則解決）
3. ⬇️ Metrics 迴圈從 v4.5 欠到現在——**降級到非強制**（Chat 三階段論點採納）
4. ❌ 同專案多管線協調無層級——**撤到 v5.1**（一次事故不足以支持基礎設施；concurrency group 先頂）
5. ➕ **新增（Second Opinion）**：SKILL.md 1086 行造成每次載入高 token 成本——**這是 v5.0 真正的一級矛盾**
6. ➕ **新增（Meta-Review）**：治理複雜度若無上界，一年後護欄 30 條、兩年後 50 條，會被使用者繞過——**預防治理自己膨脹**

v5.0 的「一個主要矛盾」=**降低 skill 本身的載入成本 + 為未來治理膨脹定硬界**。

---

## 3. revision 3 的七項 scope

| # | 項目 | 來源 | 是否動 skill 行為 |
|---|------|------|-----------------|
| 1 | **拆 skill 成 core / guardrails / ops 三份** | Chat #2 | 不改行為只改載入策略 |
| 2 | **四層檔案架構**（L1 + L2 + L3 + L5，L4 暫併 L1） | Cowork rev2 + Chat #1/#3 收斂 | 新增歸檔規則 |
| 3 | **護欄重分類 + 主題代碼命名**（A1-A6 / B1-B2 / C1-C5 / D1-D3） | Cowork rev2 + Chat #1/#2 | 純 rename |
| 4 | **新增 2 條護欄**（C5 SSoT 變更驗證、A6 陰性結果節制）→ 總數 17 條 | 另一 Cowork 視窗 → Paul 拍板 | 新行為 |
| 5 | **Metrics 區塊進 worklog 格式（不強制）+ 月結 scheduled task 第一週就建** | Chat #1/#3 | 新機制但不強制 |
| 6 | **跨 Cowork 撞車事件獨立 retro** 至 `worklogs/investigations/` | Chat #1/#2 | 事件紀錄 |
| 7 | **附錄 A 抽離 v3-v4.x changelog + 新增第 0 章治理複雜度上界** | Chat #3 | 結構性改動 |

**明確不納入**：L1.5 管線層 / pipelines.yaml / Cockpit / Ground Station / Metrics 強制填寫 / Dashboard Phase B/C / #18 多管線 race 護欄 / meta 治理宣告護欄 / 外部專案登記。

---

## 4. 第 0 章：治理複雜度上界（v5.0 新增）

這是整個 v5.0 最重要的章節，直接寫進 skill 第 0 章。

```
# 第 0 章：治理複雜度上界（v5.0 新增）

## 0.1 為什麼需要上界
超級個體的治理有一個硬約束——所有治理複雜度的認知負荷都由 Paul 一個人承擔。
治理工具最大的失敗不是設計錯誤，是被棄用。
當 skill 複雜到「直接動手比較快」時，skill 就死了。

## 0.2 軟上限數字
- 護欄總條數：≤ 20 條
- skill 本文字數：≤ 900 行（附錄不計）
- 檔案分層：≤ 5 層
- session 類型：≤ 4 種

## 0.3 超限時的處置
超過軟上限時，下一次 major version 升級：
- 禁止新增護欄——只能合併或退休既有
- 禁止新增檔案分層——只能壓縮或降級
- 禁止新增 session 類型——只能重劃職責

## 0.4 退休機制
每項治理資產都需要有退休路徑：
- 護欄：連續 3 個月無觸發 + 無相關事故 → 下次 major 升級評估退休
- 檔案分層：6 個月累積 < 5 份檔案 → 下次 major 升級降級併入上層
- session 類型：3 個月無使用 → 評估合併

## 0.5 退休決策的資料依據
Metrics 區塊的月結聚合是退休決策的唯一依據。
沒有資料的退休建議一律駁回——這防止主觀精簡。

## 0.6 每個 major version 只解一個主要矛盾
revision 2 塞四件事違反此原則。未來 major version 升級前，
先在 Issue #155 宣告「本次 major 要解的主要矛盾是什麼」，
其他想做的一律延後或拆 minor。
```

---

## 5. 拆 skill 細部設計（v5.0 核心工程）

### 5.1 三份 skill 的職責切分

| Skill | 行數目標 | 內容 | 觸發時機 |
|-------|---------|------|---------|
| **session-handoff-core** | ≤ 300 行 | 第 0 章（上界）+ 三原則 + 核心架構 + 開場 / Exit Gate + Handoff / Worklog 格式 | 每個 session 必載入 |
| **session-guardrails** | ≤ 350 行 | 17 條護欄（A/B/C/D 分組）+ 執行程序 + 不可逆操作清單 | 討論架構 / 處理事故 / 護欄觸發時載入 |
| **session-ops** | ≤ 250 行 | 分層歸檔 + Metrics + Learned Preferences + Reconciliation + 工程慣例 | Cowork 結案 / Code 執行歸檔時載入 |

Token 目標：日常交接只載 core，平均 token 支出砍 2/3。

### 5.2 拆分後的觸發規則（寫進各自 skill description）

- `session-handoff-core` description：「所有 session 開場、handoff 交接、worklog 撰寫時必載」
- `session-guardrails` description：「討論治理架構、處理事故、懷疑護欄被觸發時載入」
- `session-ops` description：「session 結案 Exit Gate、執行 Metrics 填寫、做 Reconciliation 時載入」

### 5.3 拆分順序

Code 執行順序建議：
1. 先從現有 v4.13 SKILL.md 把「絕對必須隨 session 載入」的段落抽出來 → `core`
2. 把 15 條護欄 + 執行程序抽出來 → `guardrails`
3. 剩下的歸檔 / Metrics / Learned Preferences → `ops`
4. 三份加起來對照 v4.13 確認**沒有內容遺失**
5. 然後再做「新增」的工作（護欄重分類、第 0 章、四層架構）

---

## 6. 四層檔案架構（簡化版）

| 層 | 類型 | 位置 | 生命週期 |
|---|------|------|---------|
| **L1 運作層** | worklog + investigation | `worklogs/` + `worklogs/investigations/` | 14 天 → archive，月度 index |
| **L2 交接層** | handoff | `handoffs/active/` → `handoffs/done/` | 執行完搬 done，30 天 → archive |
| **L3 反思層** | retrospective | `docs/governance/retro/` | 永久（活規則依據） |
| **L5 度量層** | metrics | `docs/governance/metrics/` | 3 年滾動 + 年度精華永久 |

**L4 處理**：併入 L1（`worklogs/investigations/`），保留命名空間。未來若 6 個月內累積 ≥ 5 份，下次 major 升格為獨立層。

**L1.5 處理**：完全拿掉。等 v5.1 有資料再評估。

---

## 7. 護欄重分類（17 條，主題代碼命名）

| 代碼 | 原編號 | 名稱（簡稱） | 來源 |
|------|--------|-------------|------|
| **A1** | #1 | 超出常規先告知 | 早期 |
| **A2** | #3 | — | 早期 |
| **A3** | #4 | 手機實測 | 早期 |
| **A4** | #5 | UI 副作用 | 早期 |
| **A5** | #6 | — | 早期 |
| **A6** | **新增** | 陰性結果結論節制 | 4/17 另一 Cowork 視窗 |
| **B1** | #2 | 驗證盲區意識 | 早期 |
| **B2** | #15 | MCP 寫後驗證 | 4/17 MCP 截斷 |
| **C1** | #7 | 驗證指令先確認可達 | 早期 |
| **C2** | #8 | 錯誤雪球 | v4.3 業界研究 |
| **C3** | #12 | Skill 版本同步閉環 | v4.7 事後分析 |
| **C4** | #13 | 新 endpoint 防護繼承 | v4.8 Issue #168 |
| **C5** | #14 | 跨 repo 真相驗證 | v4.9 Issue #170 |
| **C6** | **新增** | SSoT 變更驗證 | 4/17 另一 Cowork 視窗 |
| **D1** | #9 | 善意過度幫忙 | v4.3 業界研究 |
| **D2** | #10 | — | v4.3 業界研究 |
| **D3** | #11 | Propose-then-Commit | v4.3 業界研究 |

**捨棄項目**：
- revision 2 曾規劃的 #18「多管線 race 防護」——用 GitHub Actions concurrency group 解，不進 skill
- Chat #1/#3 曾建議的 meta「治理 session 開場宣告」——延到 v5.1 觀察是否再度並發

**命名規則**：從此新增護欄一律用主題代碼+序號（不再流水號）。

---

## 8. Metrics 三階段機制（不強制 + 自動觸發器）

**Month 1（4/17-5/17）**：
- worklog 加 `## Metrics` 區塊但完全不強制
- 月結 scheduled task `session-metrics-aggregator` **第一週就建**（每月 1 號 09:00）
- 每月產「自然填寫率報告」push 到 Issue #155 comment + 寫到 `docs/governance/metrics/YYYY-MM-coverage.md`

**Month 2（5/17-6/17）**：
- 看 Month 1 報告
- 自然填寫率 > 70% 且內容品質可用 → 進 Month 3
- 否則改 UX（template / 填寫提示 / 更明確的欄位）

**Month 3（6/17+）**：
- 強制填寫 + `metrics: skipped, reason: <選項>` 允許合法空值（「本日無事」「不適用」「來不及填」三個選項）
- 進 Exit Gate 檢查

**自動觸發器關鍵**：scheduled task 強迫 Paul 在每月 1 號看到數字，不會默認停留在 Month 1。

---

## 9. 跨 Cowork 撞車 retrospective

**檔名**：`worklogs/investigations/2026-04-17-cross-cowork-session-collision.md`（不放 skill 附錄，採 Chat #2 建議——附錄是 skill 一部分，retro 是事件紀錄，生命週期不同）

**重點**：
- 這不是 Cowork 的失誤，是治理架構本身的盲點
- 假設「Chat/Cowork/Code 三角色線性協作」，沒預見同角色多 session 並發
- 是 v5.0 規劃過程自己觸發的新規則情境——治理自己出問題
- 目前對策：靠 skill 0.6 節「major 版本宣告主要矛盾」+ Issue #155 單一事實來源間接防護
- 直接對策（meta 治理宣告護欄）留到 v5.1 觀察

---

## 10. Code 執行兩條主線（**序列，非平行**）

> **路線 C' 修正**（2026-04-17 工程複盤）：revision 3 原寫「路線 C 兩主線平行」，工程複盤後改為**序列**。
> 理由：(a) 主線 A 的拆分尺寸（core 300 / guardrails 350 / ops 250 行）是目測，需要主線 B 的 baseline 提供實際行數；(b) 主線 B 的 lint 會順便檢出 `session-handoff/SKILL.md` 自己的 schema 問題，拆分前先知道；(c) 當天剛發生跨 Cowork 撞車事故，v5.0 第一天再開兩條 Code 平行線是對自己 §0 複雜度原則的挑戰，序列化更穩；(d) 主線 B 產出是主線 A 的 evidence 依據，強制序列。

### 10.1 主線 B（先跑）：skill-schema-lint POC（`code--skill-schema-lint-poc-2026-04-17.md`）

**工程量估 1 天。**

- 掃 `.claude/skills/**/SKILL.md` 的 frontmatter + 檔名 schema
- 抓 typo、缺必填欄位、description 過長、name 不符 kebab-case 等
- 跑一次全站 lint 驗證效果 → 結果寫進 `worklogs/investigations/2026-04-17-skill-schema-lint-baseline.md`
- 不動任何 skill 內容，純讀取 + 報告

**baseline 回收後 Cowork 要拿到的 evidence**：
- 現有 `session-handoff/SKILL.md` 行數 + 各段落分佈
- 其他既有 skill 的 frontmatter 合規範本（新拆出的 core/guardrails/ops 參考用）
- 是否該 skill 自己就違規（description 過長？name 不合規？）

### 10.2 主線 A（後跑）：skill 升級（`code--session-handoff-v5-upgrade-2026-04-17.md`）

**handoff 暫緩撰寫**，等主線 B baseline 回來後，Cowork 依實際行數調整拆分策略再寫。預計：
- handoff 撰寫時機：主線 B 完成後當天
- 主線 A 工程量：2-3 天

執行順序（依目前規劃，細節待 baseline 回來後校正）：
1. 先寫遷移腳本 `scripts/migrate-session-files-v5.sh`（dry-run 模式）
2. Paul 審視腳本輸出
3. 執行遷移 + 三個獨立 commit：
   - commit A: `chore: migrate session files to v5.0 four-layer structure (pure git mv)`
   - commit B: `chore: rename session files to v5.0 naming convention`
   - commit C: `chore: add v5.0 index files (L1/L2/L3/L5)`
4. **拆 skill**：core / guardrails / ops 三份獨立 skill（拆分點依 baseline 調整）
5. 舊 `session-handoff/SKILL.md` 留存但標 deprecated，三個新 skill 啟用後移至 archive
6. Paul 同步到桌面 App Skills 設定（新三個 skill 都要同步）
7. 建 scheduled task `session-metrics-aggregator`（每月 1 號 09:00）
8. 寫跨 Cowork 撞車 retro
9. Exit Gate 驗證全套閉環（含重跑一次 lint 驗證拆分後三份新 skill 都合規）

---

## 11. revision 3 vs revision 2 的差異總覽

| 區塊 | revision 2 | revision 3 | 變因 |
|------|-----------|-----------|------|
| 檔案分層 | 六層（含 L1.5 + L4） | 四層（L4 暫併 L1，L1.5 撤） | Chat 共識 + Paul 拍板 |
| skill 結構 | 單檔六章 | **拆成 core/guardrails/ops 三檔** | Chat #2 |
| 第 0 章 | 無 | **新增治理複雜度上界** | Chat #3 + Paul 拍板 |
| 護欄總數 | 18（#1-#18） | **17（A/B/C/D 代碼命名）** | Chat 共識 + Paul 拍板 |
| Cockpit/Ground Station | v5.0 scope 內 | **撤到 v5.1** | Chat 共識 + Paul 推翻自己 |
| Metrics | 強制填寫 | **三階段（Month 1 不強制）+ 月結 task** | Chat 共識 |
| pipelines.yaml | v5.0 納入 | **撤到 v5.1** | Chat 共識 |
| 外部專案登記 | 考慮平行 | **全部待定，完全撤除** | Paul 明確指示 |
| 路線 | 路線 C（三主線平行） | **路線 C'（兩主線序列：B→A）** | Paul 拍板 + 工程複盤調整 |

---

## 12. 開放問題（少量剩餘）

revision 3 已解決 revision 2 的 Q1-Q10，剩下的：

### Q11：拆 skill 後 v4.13 舊檔處置

拆成三份新 skill 上線後，`.claude/skills/session-handoff/SKILL.md` 要：
- (a) 刪除（乾淨但失去歷史參照）
- (b) 標 deprecated 保留一個月後刪
- (c) 永久保留作為 v5.0 前的歷史快照

Cowork 傾向 (b)——讓搜尋能找到舊版本一個月，之後進入 archive。

### Q12：三份新 skill 的 name 命名

選項：
- (a) `session-handoff-core` / `session-guardrails` / `session-ops`
- (b) `session-core` / `session-guardrails` / `session-ops`（不帶 handoff）
- (c) Paul 自訂

Cowork 傾向 (a)——保留 `handoff` 關鍵字好搜尋，但只 core 一份帶。

### Q13：skill-schema-lint POC 要不要先跑過現有三個 skill（拆分前）

先跑一次舊 v4.13 SKILL.md 抓 baseline，再跑拆分後三份新 skill。好處：能驗證「拆分沒引入新錯誤」。

---

## 13. 下一步

**Cowork 本輪產出**：
- ✅ `handoffs/chat--session-handoff-v5-planning-2026-04-17-rev3.md`（本文件）
- ✅ `handoffs/code--skill-schema-lint-poc-2026-04-17.md`（主線 B，立即可發）
- ✅ `worklogs/worklog-2026-04-17.md` 更新
- ⏸ `handoffs/code--session-handoff-v5-upgrade-2026-04-17.md`（主線 A，**暫緩撰寫**，待 baseline 回來）

**Paul 的下一步**：
- 確認 Q11-Q13
- 把主線 B handoff 轉給 Code 執行（1 天）
- 等 baseline 報告回來 → Cowork 依實際行數撰寫主線 A handoff → 再交 Code（2-3 天）

**模型建議**：
- Code 主線 B（skill-schema-lint POC）：**Sonnet 4.6 + Medium**（明確機械任務，先跑）
- Code 主線 A（skill 升級 + 拆分）：**Opus 4.6 + High**（需理解大量 context，拆分要精確，後跑）

---

## 附錄 A：三份 Chat 意見引用索引

| 觀點 | 出處 | 本文位置 |
|------|------|---------|
| 優先級矛盾（monorepo 精緻 vs 外部零治理） | Chat #1 第 2 節 | 外部專案登記撤回（Paul 另行處理） |
| L4 併入 L1 | Chat #1 挑戰 2 | 第 6 節 |
| L1.5 延後 | Chat #1 挑戰 2 + Chat #3 第 5 節 | 第 6 節 |
| Metrics 三階段 | Chat #1 挑戰 3 + Chat #3 第 5 節 | 第 8 節 |
| 護欄通膨 + 退休機制 | Chat #1 挑戰 4 + Chat #3 第 4 節 | 第 0 章 |
| 跨 Cowork 撞車 meta 層 | Chat #1 挑戰 5 + Chat #2 第 1 節 | 第 9 節 |
| Cockpit 覆寫的工程判斷挑戰 | Chat #1 挑戰 6 | 撤回決定 |
| **拆 skill（最大貢獻）** | Chat #2 第 2.1 節 | 第 5 節 |
| 治理複雜度上界（最大貢獻） | Chat #3 第 4 節 | 第 0 章 |
| 每個 major 只解一個矛盾 | Chat #3 第 3 節 | 第 0.6 節 |
| Metrics 月結 scheduled task 第一週就建 | Chat #3 第 5 節 | 第 8 節 |
| 路線 C | Chat #3 第 7 節 | 第 10 節 |

---

## 附錄 B：本輪事故索引（v5.0 附錄 B 候選）

| 日期 | 事故 | 本質 | 對應護欄 | retro |
|------|------|------|---------|-------|
| 4/17 AM | changelog MCP 截斷 | B2 工具失真 | B2 (ex #15) | `retro-2026-04-17-mcp-truncation.md` |
| 4/17 PM | Wiki KV seed 誤判 | A6 陰性結論（新增護欄） | A6 | 併入下一條 |
| 4/17 PM | 兩 Code session commit race | 管線衝突 | 不進 skill，走 GitHub Actions concurrency | — |
| 4/17 PM | 跨 Cowork 視窗撞車 | 治理架構本身 meta 盲點 | 間接（skill 0.6 節） | `investigations/2026-04-17-cross-cowork-session-collision.md` |
| 4/17 Eve | Cockpit 被 Paul 覆寫進 v5.0 後又撤回 | 決策批次慣性 | 間接（skill 0.6 節） | 併入 cross-cowork retro |

單日五起治理相關事故，全部併入 v5.0 設計依據——這正是 Chat #3 所說「預防治理自己膨脹」的起點。

---

## 14. 信心等級

| 區塊 | 信心 | 說明 |
|------|------|------|
| 第 0 章治理複雜度上界 | **高** | 三份 Chat 一致肯定 + Paul 拍板數字 |
| 拆 skill 三份 | **高** | Chat #2 論點扎實 + Paul 同意 |
| 四層架構（L1+L2+L3+L5） | **高** | 比 revision 2 的六層收斂許多 |
| 護欄 17 條主題命名 | **高** | 純重組 + 新增 2 條有事故背書 |
| Metrics 三階段 + 自動觸發器 | **中高** | 月結 task 第一週就建是關鍵，工程量小 |
| 拆 skill 後的 description 觸發規則 | **中** | 實際觸發準確度要觀察一個月 |
| Code 執行兩主線序列（B→A） | **高** | 主線 B 工程量清楚（1 天），主線 A 等 baseline 回來再定稿可大幅降低拆分風險 |

**整體信心**：**高**。經過三輪 Chat 挑戰 + Paul 六題拍板 + 外部專案登記撤回，scope 已大幅收斂且內部邏輯一致。
