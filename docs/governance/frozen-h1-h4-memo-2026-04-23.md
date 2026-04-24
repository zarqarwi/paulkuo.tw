# 凍結備忘錄 — H1/H2 立法 + H3/H4 司法

> 建立：2026-04-23
> 狀態：**凍結中**（非 Code handoff，是記憶存檔）
> 緣由：2026-04-23 Project Audit §6 R4 + §8.4
> 解凍條件：見本文「解凍觸發條件」一節
> 上位依據：[協作憲法 v0.2](./adr-collaboration-constitution-v0.2-2026-04-19.md) 第二、三、五條
> 對應 PENDING.md：Lines 98-118（待 Cowork 司法 / 待 Chat 立法）

---

## 為什麼要凍結這份記憶

paulkuo.tw 的治理有四個未竟問題（H1-H4），2026-04-20 系統考試（exam-2026-04-20）時暴露。四個問題都**真的存在**，但現在動會出事：

1. **立法還沒有足夠案例** — H1/H2 要處理「C 層同步機制」「Chat 精確事實查詢上限」，但 2026-04-20 之後 C 層根本沒再大幅變動，手上只有 1-2 個觀察案例，立法會變成過度抽象
2. **司法還沒有足夠判例** — H3/H4 要處理「auto-memory 跨視窗不對稱」「Cowork 新 session 剛性核查」，但同期 Cowork session 大多在處理 Wiki E2/E3，沒踩到 H3/H4 的雷
3. **前三件事還沒做完** — Project Audit §8.1-§8.3 的三件實體工作（git 清理、AI Ready 重啟、YouTube backfill）沒跑完前，立法/司法都沒有真實 eval 數據可用

**凍結 ≠ 放棄。凍結 = 現在不動、保留脈絡、等解凍條件滿足再開。**

---

## 四個問題的核心摘要（給未來的自己看）

### H1：🔴 憲法第二條 C 層同步機制缺失 [Chat 立法]

**問題句**：「C 層（Claude.ai Personal Skill）從 2026-04-17 冷凍在 v4.13，repo 已到 v5.5/v5.6。憲法第二條寫 C 層是下游 mirror，但沒寫怎麼 mirror。」

**卡點**：Personal Skill 要手動去 Claude.ai 後台貼，誰來貼、多久一次、怎麼驗證「C 已同步」沒有協議。自動化會撞到 Claude.ai 不給 API 寫入的限制。

**已知候選解**：
- 方案 A：定義「每次 A 層 SKILL.md 有 commit，Paul 當天自己手動貼到 C 層」，但這是人工流程不是機制
- 方案 B：Cowork 產出「A→C diff 報告」貼在 handoff，Paul 用一鍵貼到 C
- 方案 C：承認 C 層本質上就是滯後的 mirror，在憲法補一條「C 容許 ≤ 7 天延遲」

**立法需要的輸入**：跑完前三份 handoff 後，觀察 **至少 2 個** 因 C 層滯後導致的實際踩坑案例。沒有踩坑前強制立法等於在治理空氣。

---

### H2：🔴 Chat 視窗精確事實查詢結構性上限 [Chat 立法]

**問題句**：「Chat 三模型（Opus 4.7 / Sonnet 4.6 / Opus 4.6）同答 v4.7 版本號——比 C 層還舊。版本號/行數/commit hash/清單項數/時序狀態類精確事實在 Chat 系統性不可靠。」

**卡點**：Paul 習慣在 Chat 問「目前憲法版本是多少」「PENDING.md 現在第幾項」，Chat 會答得很有自信但答錯。責任該 Chat 自我剋制，還是該由治理文件強制用戶不要在 Chat 問這類問題？

**已知候選解**：
- 方案 A：憲法實施細則寫「Chat 不回答精確事實查詢，一律引導到 Cowork」——但這違反「Chat 是對話介面」的直覺
- 方案 B：定義「精確事實查詢」的白名單（版本號/行數/commit/項數/時序），Chat 遇到這類問題系統性回「我可能記錯，請到 Cowork 跑 `git log` 核查」
- 方案 C：讓 Paul 養成習慣——這是最便宜的方案，但違反「治理應該建立機制而非依賴人類自律」

**立法需要的輸入**：前三份 handoff 跑完後，統計本週 Chat 有幾次精確事實查詢踩坑。**數字未滿 3 次，暫不立法**（避免 over-engineering）。

---

### H3：🟡 auto-memory 跨視窗不對稱寫入 [Cowork 司法]

**問題句**：「Cowork 能寫 `.auto-memory/`，但 Chat 視窗不掛載這個路徑，R1 護欄在 Chat 穿透率 = 0。」

**卡點**：工程上 Chat 沒辦法讀 Cowork sandbox 路徑，這是平台限制不是治理問題。但治理文件（working-environment.md §1.2）沒明示這個不對稱，導致使用者誤以為 Chat 也能讀 auto-memory。

**已知候選解**：在 working-environment.md §1.2「跨視窗能力矩陣」補一行「auto-memory 只對 Cowork 生效，Chat 不讀」。這是**單行文件修訂**，司法上已成熟，等解凍就能做。

**解凍門檻比 H1/H2 低**：不需要新案例，只要前三份 handoff 跑完、Cowork 手上沒大工作時就能做。

---

### H4：🟡 Cowork 新 session 剛性核查補強 [Cowork 司法]

**問題句**：「Cowork 新 session 答 v4.13 版本號，讀 sandbox C 層 mirror 就信，沒觸發憲法第三條剛性核查去 A 層驗。」

**卡點**：憲法第三條說「精確事實要剋性核查」，但沒定義 Cowork 開場時怎麼強制做。v5.6 已補 R1 觸發句型，但 H4 需要在**新 session 開場 checklist** 也加強制步驟。

**已知候選解**：在 `.claude/skills/session-handoff/SKILL.md` 的「Cowork 驗證盲區」章節，新增一條——版本號/行數/清單項數類問題，即使從 sandbox 讀到答案，仍須跑 A 層 git HEAD 核查。

**解凍門檻**：前三份 handoff 跑完、Cowork 下一次要接新 session 時，順手補進 SKILL.md。

---

## 解凍觸發條件

### 解凍 H3 + H4（司法層，低阻力）

**只要滿足任一**：
- 前三份 Code handoff（git cleanup / AI Ready 重啟 / YouTube backfill）至少跑完兩份 ✅
- 下次 Cowork 開新 session 時，本身工作量 < 1 小時，有餘裕 ✅
- Paul 主動點名「來處理 H3/H4」 ✅

**動作**：單一 Cowork session 同時解 H3 和 H4。預估工時 30-45 分鐘。兩個都是單一文件修訂，不需立法討論。

### 解凍 H1 + H2（立法層，高阻力）

**必須同時滿足**：
- 前三份 Code handoff 全部跑完 ✅
- H1：累積 ≥ 2 個 C 層滯後踩坑案例（Cowork 或 Paul 發現並記錄在 worklog）
- H2：累積 ≥ 3 次 Chat 精確事實查詢踩坑案例（Paul 自己記錄，或 Cowork 觀察到）
- Paul 主動決定「要開 Chat 立法 session」

**動作**：Chat session 先用 Opus 4.7 寫立法討論，產出 ADR 草案，再由 Cowork 審查是否能執行。不要讓 Code 直接碰這兩個。

---

## 解凍時要帶的資料包

未來 Chat/Cowork 解凍 H1-H4 時，在開場貼以下資料：

```
本次要解凍：H1 / H2 / H3 / H4（勾選）
前置條件確認：
  [ ] 前三份 handoff 已完成（2026-04-23 三份）
  [ ] H1/H2 踩坑案例已達門檻
凍結備忘錄：docs/governance/frozen-h1-h4-memo-2026-04-23.md
PENDING.md 對應行：Lines 98-118
上位依據：協作憲法 v0.2 第二、三、五條
```

有這份 memo 當上下文，Chat/Cowork 不需要重新讀憲法、working-environment.md、exam 答案包就能理解背景。

---

## 不要對這份備忘錄做的事

❌ 不要把這份 memo 當 handoff 給 Code 跑。它不是工作包，是**記憶膠囊**。

❌ 不要刪 PENDING.md 裡 H1-H4 那 4 行。PENDING.md 是索引，memo 是展開版，兩層都要在。

❌ 不要擅自擴寫候選解。現在列的候選解是 2026-04-23 盤點時的快照，解凍當下應該重新評估，而不是鎖死在今天的想法。

❌ 不要用這份 memo 作為未來立法的「唯一輸入」。立法當下必須重新讀當時的憲法最新版和 C 層狀態，不能只靠這份（可能已過期的）摘要。

---

## 跨專案影響

這份文件只**記錄**治理層面的凍結決策，不改任何共用檔案（`worker/src/*`、`siteSchema.ts`、`BaseLayout.astro` 等）。無須跑 shared-file-impact-map §最低驗證。

唯一的副作用：PENDING.md 需要在 H1-H4 那 4 行旁邊加一個交叉引用，讓未來 session 看到 PENDING 時知道有凍結備忘錄可讀。

---

## 同步更新（本次建檔同時做的事）

- [x] 建立本備忘錄
- [ ] 更新 PENDING.md H1-H4 四行，各自加「詳見 docs/governance/frozen-h1-h4-memo-2026-04-23.md」
- [ ] 更新 `worklogs/2026-04-23-project-audit.md` §8.4 註解「H1-H4 已凍結，見 memo」

後兩項是本 memo 建立後的後續動作，Cowork 會在下一步處理。

---

## Consequences（憲法第三條要求的 ADR 欄位）

- **好**：未來 Chat/Cowork 不需要重讀 2026-04-20 exam 和憲法就能接手，降低記憶熵
- **好**：明確的解凍門檻（案例數量 + 前置條件），避免在真空中過早立法
- **壞**：如果 Paul 或未來 session 忘了讀這份 memo，會重新在 H1-H4 上浪費討論時間
- **緩解**：PENDING.md 已有 4 行索引指向 memo；下次 Cowork 開場 skill（session-handoff）會掃 PENDING.md，自然會看到
