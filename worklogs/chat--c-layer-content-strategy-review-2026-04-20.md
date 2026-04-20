# Chat Briefing：C 層內容策略架構決策 — 請審查

建議模型: Opus 4.6
預估量級: S（純決策審查，不寫程式碼）
本輪 metrics: 0 commits, 0 files, +0/-0 lines, 0 deploy

---

## 背景

2026-04-20 跨載體精確事實同步實戰驗收：同一個問題「session-handoff 目前是第幾版」跨 8 查詢點得到 5 個答案。Code 唯一正確（v5.5），Chat×3 全答 v4.7（雲端記憶殘影），Cowork 答 v4.13（sandbox C 層 mirror），C 層冷凍 v4.13。

根因之一：C 層（Claude.ai Personal Skill）從 v4.13 後沒有更新，而 A 層已演進到 v5.6。v5.x 重構把大量內容拆分到 `CHANGELOG.md`、`working-environment.md`、`constitution-v0.2-quick-reference.md` 等子檔案。A 層整體更完整，但 SKILL.md 本體不再自足。**Chat 讀不到子檔案，所以 v5.6 SKILL.md 對 Chat 來說反而是降級。**

Cowork 現在要產出 C 層更新版，但在動手前，需要 Chat（立法角色）和 Code（行政角色）各自審查方案。

---

## Cowork 提案摘要

### 核心立場

**C 層不是 A 層的 mirror，是 adaptation。**

憲法第二條說「C 層永遠是下游 mirror」，精神是「不逆流」——C 層不能有 A 層沒有的規則。但下游可以裁切、可以改寫適配讀者能力邊界。理由：Chat 沒有 filesystem、沒有 terminal、沒有 git，手動更新成本高。

### 設計原則

1. **自足性** — Chat 讀這一份就能做 Chat 該做的事，不依賴任何 `./` 相對路徑的子檔案
2. **角色邊界明確** — 只放 Chat 會用到的規則，Cowork/Code 專屬的執行細節刪掉
3. **更新韌性** — 內容組織方式讓 Paul 即使 2-3 個 minor version 沒更新，Chat 也不會做出危險的事
4. **版本透明** — 頂部標「C 層 v1.0，對齊 A 層 v5.6」，Chat 知道 C 層版本 ≠ A 層版本

### 獨立版本線

C 層用自己的版本號（v1.0 起算），加「對齊 A 層 vX.Y」標注。解決「Chat 被問版本時到底該答什麼」的問題。

### 從 v4.13 搬回的（v5.x 拆走但 Chat 需要的）

- 設計原則（四動機 + 兩目標 + 三錨點）
- 術語定義（儀表板/Worklog/Handoff/Project Instructions）
- 版本號規則
- Chat 角色定位 + 三元能力對比表（v5.6 改雙元，但 Chat 需要看到自己）
- Learned Preferences 機制

### 從 v5.6 新增搬入的

- 治理複雜度上界（800 行觸發線 + 新提議對齊檢查）
- 護欄主題碼命名規則（A/B/C/D + 退休不回收）
- C5 SSoT 變更後下游重驗
- 剛性核查完整版（類別 A + B + N 計數）
- 憲法五條 inline 速記（從 `constitution-v0.2-quick-reference.md` 精華摘入）

### 刪掉不放的（Chat 用不到的）

- 護欄 #14 完整執行程序（400+ 行部署驗證流程）
- 護欄 #15 完整執行程序（MCP 寫後驗證）
- Cowork 開場 Checklist 完整版
- Metrics 收集 SOP
- Worklog 分層歸檔
- 結案宣告 Close Protocol 完整版
- 防重複執行的完整指令表

### 預估大小

~45KB，介於 v5.6 的 31KB 和 v4.13 的 51KB 之間。

---

## Chat 需要審查的 5 個問題

以下是 Cowork 希望 Chat 從「立法角色」給意見的具體問題。不需要寫程式碼，只需要給判斷和理由。

### Q1：憲法第二條的 adaptation 解讀

Cowork 將第二條「C 層永遠是下游 mirror」解讀為「不逆流」而非「verbatim copy」。

**具體意思**：C 層可以（a）裁切掉 Chat 用不到的 Cowork/Code 專屬流程，（b）將 A 層分散在子檔案的內容 inline 回 C 層，（c）針對 Chat 能力邊界改寫執行動作（例如 A 層寫 `grep` 但 Chat 沒有 terminal，改寫成「請 Paul 確認或觸發 Cowork 查」）。

**不做的事**：C 層不會新增 A 層沒有的規則或護欄。

Chat 作為立法機關，你同意這個解讀嗎？如果要正式化，建議寫成什麼等級的文件（ADR / 憲法補款 / 實施細則）？

### Q2：獨立版本線是否合理

C 層 v1.0 對齊 A 層 v5.6。未來 A 層到 v5.8 但 Paul 沒更新 C 層時，Chat 回答「C 層 v1.0，對齊 A 層 v5.6」。

這解決版本混淆問題，但也引入版本追蹤複雜度。Chat 覺得這樣好還是有更好的方案？

### Q3：憲法五條 inline 是否牴觸第四條

第四條「一事實一主責層」。憲法原文在 `docs/governance/adr-collaboration-constitution-v0.2-2026-04-19.md`，速記在 `docs/governance/constitution-v0.2-quick-reference.md`。Cowork 打算再在 C 層放一份精華版。

這是否違反第四條的冗餘禁令？Cowork 的理由是：Chat 物理上讀不到前兩份檔案，不放 inline 等於 Chat 完全沒有憲法參照。

### Q4：H1 + H2 的立法排程

PENDING.md 已登記 H1（A→C 同步協議）和 H2（Chat 精確事實結構性上限）交給 Chat 立法。

Cowork 的 C 層內容策略跟 H1 高度相關——H1 的 ADR 會定義 C 層的同步頻率、驗證方式、觸發條件。Cowork 先出 C 層 v1.0 內容，H1 再定義「以後怎麼維護」，這個順序 Chat 同意嗎？

### Q5：Chat 自己想在 C 層看到什麼

上面是 Cowork 從結構分析推出的清單。但 Chat 作為 C 層的主要讀者，有沒有「我在決策時經常需要但目前 v4.13 缺少的」或「v4.13 有但我其實從不用的」內容？這種使用者視角只有 Chat 自己知道。

---

## 回報方式

Chat 看完後，針對 Q1-Q5 各給判斷（同意/不同意/修改建議），加上任何新洞察。Paul 把 Chat 回覆貼回 Cowork，Cowork 綜合 Chat + Code 意見後定案。

---

## 這份 briefing 的定位

本文件不是 handoff（不要求 Chat 執行任何工作），是 **decision review request**。產出方是 Cowork（司法/協調），審查方是 Chat（立法）。符合憲法第三條分工。

本輪 metrics: 0 commits, 0 files, +0/-0 lines, 0 deploy（純決策文件）
