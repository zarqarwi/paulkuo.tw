---
adr_id: adr-length-budget-enforcement-2026-04-25
title: 治理文件長度預算執行機制（length-budget enforcement）
status: Accepted
date: 2026-04-25
supersedes: []
related_adrs:
  - adr-collaboration-constitution-v0.2-2026-04-19
  - adr-chat-factual-query-limit-2026-04-25
  - adr-governance-lint-he-lu-2026-04-25
related_issues: []
ratified_by: Chat-Opus-4.7
drafted_by: Cowork-Opus-4.6
pillar: governance
---

# 治理文件長度預算執行機制

## Context

### 立法動機

paulkuo.tw 治理文件中有多份同時逼近 Anthropic 官方軟上限：`session-handoff/SKILL.md`、`CLAUDE.md`、`constitution-v0.2-quick-reference.md`（速記卡）。`docs/governance/working-environment.md` §4「Skill / CLAUDE.md 長度管制」已定義**三層閾值**（200 / 800 / 900），但沒有規定「什麼時候觸發拆分 ADR」「誰來啟動」「多久內要完成」。結果是文件繼續膨脹，沒有結構性剎車。

本 ADR **不重定閾值**（WE §4 的 200/800/900 繼續有效），而是補上「超過軟上限 X% 時自動啟動拆分 ADR」的觸發機制，讓既有三層閾值真正能執行。

### 既有閾值回顧（引用自 WE §4.1）

| 規則 | 行數 | 動作 |
|---|---|---|
| 官方軟上限（預警） | 200 行 | 通知但不觸發拆檔；在 worklog 記錄「已達預警，追蹤趨勢」 |
| 內部觸發點 | 800 行 | 觸發「是否拆分」討論 procedure（不自動拆） |
| 硬界 | 900 行 | 強制啟動拆分，不得拖延 |

**缺口**：「超軟上限後做什麼」未規定。實戰上文件會在 200 → 800 之間長時間停留（例：SKILL.md 從 522 行長到 639 行經過 8 次 minor bump 無人喊停），直到撞 800 行才有人注意——但那時拆分成本已很高。

### 質性證據：三份文件同時臨界（2026-04-24 Cowork 回顧記載）

- `constitution-v0.2-quick-reference.md`（速記卡）：行數已超軟上限（歷史記載 238 行，119%）
- `.claude/skills/session-handoff/SKILL.md`：逼近 800 行內部觸發點（歷史記載 639 行，77%）
- `CLAUDE.md`（根目錄）：卡在軟上限（歷史記載 200 行，100%）

三份文件同時在長度邊緣，若都等到撞 800/900 才開始規劃拆分，會產生連鎖決策瓶頸。本 ADR 的觸發機制讓三份可以錯峰處置。

### 上位法依據

- **憲法 v0.2 第一條 SSoT**：治理文件是 repo 層的事實來源，不能因為無限膨脹讓任一 session 讀不完整、也不能因為讀不完整而退化到「憑印象引用」。長度預算是維持 SSoT 可讀性的治理手段。
- **憲法 v0.2 第五條 記憶擴充原則**：新載體要走 ADR 流程——本 ADR 的結構化拆分觸發本身就是「新增載體的 ADR 流程」的規範化。

### 與 H2 的關係

H2 ADR（`adr-chat-factual-query-limit-2026-04-25.md`）禁止 Chat 引用二手精確事實當一手來源。本 ADR 第五條「事實核實義務」是 H2 的**第一個實戰應用**——Cowork 未來依本 ADR 觸發拆分時，不能沿用 PENDING.md 或本 ADR 正文記載的 238 / 639 / 200 二手歷史數字來決定是否觸發，必須當場核實。

---

## Decision

### 第一條 · 三段式觸發線（以 WE §4 既有閾值為基礎延伸）

基於 WE §4 的 200 / 800 / 900 三層閾值，本 ADR 新增**三段式觸發線**與對應動作：

| 觸發線 | 判定閾值 | 狀態符號 | 責任方 | 期限 |
|---|---|---|---|---|
| **軟上限** | 行數 == 軟上限（200 行） | 🟡 預警 | 文件維護者 | 無期限（記 worklog 追蹤） |
| **拆分 ADR 觸發線** | 行數 ≥ 軟上限 × 1.15（≥ 230 行） | 🔶 觸發 | Cowork 司法 | 兩週內起草拆分 ADR |
| **硬上限前警戒線** | SKILL.md ≥ 640 行 / CLAUDE.md ≥ 720 行（即硬上限前 20%） | 🔴 警戒 | Cowork 司法 | 一週內起草拆分 ADR + handoff Chat 審查 |
| **硬上限** | SKILL.md ≥ 800 行 / CLAUDE.md ≥ 900 行 | ⛔ 凍結 | 所有 session | **立即凍結該文件寫入**，所有新規則走子文件；未完成拆分 ADR 優先級升至最高 |

**閾值計算規則**：

- 1.15 係數（15% 緩衝）來源：200 × 1.15 = 230 行。選 15% 而非 10% / 20% 的理由：10% 太嚴（小幅波動就觸發），20% 太鬆（拖延成本過大），15% 對應「一個中等章節的增幅」，適合做觸發線
- 硬上限前警戒線 = 硬上限 × 0.8（即保留 20% 緩衝期）；對 SKILL.md（硬上限 800）是 640 行，對 CLAUDE.md（硬上限 900）是 720 行
- 速記卡類文件（無明確硬上限）只適用軟上限與拆分觸發線

**狀態符號定義**：

| 符號 | 階段 | 可否接受新內容 |
|---|---|---|
| ✅ | < 軟上限 | 可 |
| 🟡 | = 軟上限 | 可，但新增前先評估必要性 |
| 🔶 | ≥ 軟上限 × 1.15（觸發拆分） | 可，但文件維護者必須知悉正在排起草 |
| 🔴 | ≥ 硬上限 × 0.8（警戒） | 建議走子文件，除非不可分割 |
| ⛔ | ≥ 硬上限 | **不可新增**，寫入凍結 |

### 第二條 · 觸發後的責任歸屬

觸發線對應的具體 ADR 起草責任：

1. **🔶 拆分 ADR 觸發線（≥ 軟上限 × 1.15）**：
   - **責任方**：Cowork 司法
   - **期限**：兩週內起草拆分 ADR 並寫入 `docs/governance/`
   - **內容**：包含當前行數（F-ID 核實）、拆分選項比較、建議選項、對下游的影響
   - **授權邊界**：Cowork 可直接 commit 到 `docs/governance/` 白名單，但 push 前等 Paul 授權

2. **🔴 硬上限前警戒線**：
   - **責任方**：Cowork 司法 + Chat 立法審查
   - **期限**：一週內 Cowork 起草拆分 ADR，同時產出 handoff 給 Chat 做審查
   - **Chat 審查內容**：結構性取捨（拆成幾份、邊界怎麼畫）、是否需要修憲
   - **若 Chat 審查超過一週未回**：Cowork 有權代行執行（跟 H3/H4 司法專區同樣邏輯），但事後補 Chat session 追認

3. **⛔ 硬上限**：
   - **即時動作**：所有 session 看到該文件行數觸硬上限時，**立即**停止對該文件新增內容
   - **新規則改走**：對應子文件（例：SKILL.md ⛔ 時，新規則改進 `docs/governance/` 或衛星 skill）
   - **Unfreeze 條件**：拆分 ADR 通過 + 執行完成 + 行數降到 🔴 警戒線以下

### 第三條 · length-budget-status.md 追蹤表

本 ADR 通過後，建立 `docs/governance/length-budget-status.md`，作為所有治理文件長度狀態的 SSoT 儀表板。

**檔案規格**：

- **位置**：`docs/governance/length-budget-status.md`
- **更新機制**：pre-commit hook 自動更新（由 Code 實作，屬 H7 ADR Phase 3 第 5 項執行範圍）
- **手動更新**：hook 未實作前，Cowork 每次 session 開場跑一次更新
- **內容結構**：
  ```markdown
  # 治理文件長度預算狀態

  > Last-updated: YYYY-MM-DD HH:MM by {session-type}
  > 規則來源：adr-length-budget-enforcement-2026-04-25.md §一

  | 檔案 | 行數 | 軟上限 | % | 硬上限 | % | 狀態 | 下一步 |
  |---|---|---|---|---|---|---|---|
  | .claude/skills/session-handoff/SKILL.md | {N} | 200 | {M%} | 800 | {K%} | {符號} | {動作} |
  | CLAUDE.md | {N} | 200 | {M%} | 900 | {K%} | {符號} | {動作} |
  | docs/governance/constitution-v0.2-quick-reference.md | {N} | 200 | {M%} | — | — | {符號} | {動作} |
  ```

- **觸發邏輯**：hook 執行時比對行數與第一條閾值，自動更新狀態符號並把觸發 🔶 / 🔴 / ⛔ 的檔案列入「需行動項」段落

**時效規則**：length-budget-status.md 每次 commit 後最長 7 天內必須有更新（無論行數是否變動，last-updated 時間戳至少刷新一次）。超過 7 天未更新 → H7 governance-lint.sh 在 pre-commit 階段攔截（H7 ADR Phase 3 第 5 項）。

### 第四條 · 執行層範圍（本 ADR 明確排除的事項）

本 ADR **立規則**，不立具體執行動作。以下事項**不**在本 ADR 範圍：

1. **不核實當前三份文件的實際行數**（238 / 639 / 200 是歷史二手數字，不被本 ADR 採用）
2. **不起草三份文件的拆分方案草稿**（拆分 ADR 是執行層觸發後由 Cowork 另起草）
3. **不決定「當前三份文件是否已觸發拆分線」**（由下次 Cowork session 執行核實後判定）

執行層動作的後續 handoff 規格（由其他 handoff 處理）：

- **動作 A**：Cowork session 在本 ADR 通過後，跑 `wc -l` 核實三份文件真實行數，依第一條觸發線判定狀態
- **動作 B**：狀態為 🔶 的文件各起草拆分 ADR（兩週期限）
- **動作 C**：狀態為 🔴 的文件起草拆分 ADR + 送 Chat 審查（一週期限）
- **動作 D**：狀態為 ⛔ 的文件**立即**凍結寫入（所有 session 共同遵守）

### 第五條 · 事實核實義務（硬性條款）

**本條為 H2 ADR 第四條「結構性立法優先原則」的第一個實戰應用，獨立成條以強化可見度。**

> **Cowork 執行本 ADR 下游動作時，不可直接採用本 ADR、PENDING.md、上游 handoff、Cowork artifact 或任何歷史紀錄所記載的 238 / 639 / 200 等二手行數**，必須在本 ADR 通過後**當場**以 `wc -l` 或同等指令核實真實行數，才能判定觸發線狀態並起草拆分 ADR。

**核實規則**：

1. **採用指令**：`wc -l <path>`（`grep -c '^' <path>` 可作備援）
2. **核實時間**：依第一條觸發線判定的**當下** session 之內，不得隔日或隔 session 沿用
3. **F-ID 紀錄**：核實後在拆分 ADR 正文附源頭事實清單（WE §2 規範），包含：
   - 指令原始輸出（含檔案路徑）
   - 驗證者 session 類型
   - 驗證時間戳
4. **快取上限**：F-ID 記錄的行數 48 小時內可沿用（若文件未變動），超過 48 小時重驗

**違反後果**：若發現拆分 ADR 使用二手行數，該 ADR 作廢重起草；Cowork 相關 worklog 必須記入 `pitfalls` 維度（待 H8 ADR 通過後走四維度）。

**來源**：H2 ADR 第四條裁決層級特殊規則——Chat 立法時立規則不立具體數字，Cowork 執行時必須核實。

### 第六條 · 重新評估觸發條件

以下任一成立，重開 ADR 討論本條：

1. Anthropic 調整官方 skill / CLAUDE.md 軟硬上限（例：200 改為 300，800 改為 1000）
2. 連續兩次觸發 🔶 拆分線後，Cowork 在兩週期限內**無法**完成起草 → 代表機制過嚴
3. 硬上限 ⛔ 在單 session 內被觸發 3 次以上 → 代表文件體質問題，需要更積極的前置抽離機制（可能是憲法層級修訂）
4. H7 ADR 的 Phase 3 第 5 項（length-budget 時效檢查）實作完成後，本 ADR 第三條的「手動更新」條款可停用

---

## Consequences

### 正面影響

- **三層閾值從「預警燈」升格為「可執行剎車」**：WE §4 既有閾值原本只預警不啟動；本 ADR 補上觸發機制後，預警會自動導向行動。
- **length-budget-status.md 成為治理儀表板**：未來任何 session 想知道「治理文件現在有哪幾份在壓力帶」，只需讀一份檔案，不必個別 `wc -l`。
- **H7 lint 有事實依據**：H7 Phase 3 第 5 項「length-budget 時效檢查」引用本 ADR 第三條的 7 天規則，pre-commit 階段自動攔截未更新狀態表。
- **為 H9 提供取捨依據**：H9 ADR 選項 A（L3 併回 L2）會讓 WE 文件踩 230 行觸發線，本 ADR 第一條明文後，H9 選項 A 否決理由有書面錨點。

### 負面影響

- **Cowork 負擔增加**：每次觸發 🔶 / 🔴 都要在期限內起草 ADR，若三份文件同時觸發，兩週內要寫三份拆分 ADR，密度高。緩解：第二條允許 Cowork 起草後走 Chat 審查，不必 Cowork 獨自完成全部結構決策。
- **15% 係數可能不適用所有文件類型**：對於 SKILL.md 這類長文，230 行觸發線過早；但對於 CLAUDE.md 這類精簡入口文件，230 行已算寬鬆。實際運作若發現某類文件係數不合，走第六條重新評估。
- **length-budget-status.md 未更新時本身是治理破口**：若 hook 沒實作、Cowork 忘記手動更新，狀態表會過時，下游引用會錯判。緩解：H7 第三條第 5 項用 lint 強制更新時效。

### 中性觀察

- **本 ADR 不解決「文件該不該存在」**：只管「存在的文件長度預算」，不管「這份文件一開始該不該建」。後者屬憲法第四條記憶層次原則 + §4.3 判斷樹（WE 現行規範），本 ADR 不重複。
- **本 ADR 不涉及 cloud 層 snapshot 長度**：cloud 層 snapshot 是 repo 層的 adaptation，長度預算由 repo 層上位條文決定，不需獨立觸發線。

---

## Cross-References

### 依賴的 ADR（我需要這些先存在）

- `adr-collaboration-constitution-v0.2-2026-04-19.md` §2 第一條 SSoT + 第四條記憶層次：本 ADR 是第一條「repo HEAD 是唯一事實來源」在文件可讀性維度的實施細則，也是第四條「一事實一主責層」的執行配套。
- `adr-chat-factual-query-limit-2026-04-25.md` §四「裁決層級特殊規則」：本 ADR 第五條事實核實義務直接承 H2 第四條立法邏輯。

### 被依賴的 ADR（這些 ADR 需要我存在）

- `adr-governance-lint-he-lu-2026-04-25.md` §一檢查 5 項第 5 項「length-budget-status.md 時效」：H7 lint 直接讀本 ADR 第三條的 7 天規則做 pre-commit 攔截；沒有本 ADR，H7 這項檢查無事實依據。

### 相關但不依賴的檔案

- `docs/governance/working-environment.md` §4.1「三層長度規則」：既有 200 / 800 / 900 閾值定義，本 ADR 引用但不改動。
- `docs/governance/working-environment.md` §4.2「當前狀態 F-ID 化」：當前狀態表，未來 length-budget-status.md 上線後，WE §4.2 改為「詳見 `length-budget-status.md`」的 hyperlink，避免兩處同步漂移。
- `docs/governance/working-environment.md` §4.3「CLAUDE.md 越界處置與判斷樹」：前置攔截機制（新規則入檔前先判斷），與本 ADR 的事後觸發機制互補。
- `adr-l3-positioning-2026-04-25.md` §Decision 選項 A 否決理由：引用本 ADR 第一條的 230 行觸發線作為否決依據。

---

## Appendix

### 附錄 A · 狀態符號判定 FAQ

**Q：CLAUDE.md 行數 = 200 行（剛好卡軟上限），狀態是什麼？**
A：🟡（軟上限預警）。新內容入檔前先跑 WE §4.3 判斷樹，能進子文件的不進 CLAUDE.md。

**Q：CLAUDE.md 行數 = 229 行，狀態是什麼？**
A：🟡（未達觸發線 230）。但已在 99.6% 觸發線，下次變動應謹慎。

**Q：CLAUDE.md 行數 = 230 行，狀態是什麼？**
A：🔶（觸發拆分 ADR），Cowork 兩週內起草拆分 ADR。

**Q：SKILL.md 行數 = 641 行（剛越 640 警戒線），狀態是什麼？**
A：🔴（硬上限前警戒）。Cowork 一週內起草拆分 ADR + handoff Chat 審查。

**Q：SKILL.md 行數 = 800 行（硬上限），狀態是什麼？**
A：⛔（凍結寫入）。即便本次 commit 只是修 typo，也不准新增內容——所有 session 共同遵守。

**Q：速記卡（`constitution-v0.2-quick-reference.md`）無硬上限，如何套用？**
A：適用軟上限（200）+ 觸發線（230），不適用警戒線與硬上限。超過 230 即 🔶，Cowork 兩週內起草拆分。

### 附錄 B · 拆分 ADR 應包含的最小欄位

觸發後起草的拆分 ADR 最小欄位清單（供 Cowork 下次執行參考）：

1. **Context**：為什麼這份文件需要拆（觸發線 + 內容類型分析）
2. **Decision**：拆成幾份、邊界怎麼畫、命名規則
3. **Consequences**：原文件行數降至多少、對 session-handoff / CLAUDE.md 等引用點的影響、是否需要修憲
4. **附錄 · F-ID 清單**：本 ADR §五要求的核實行數紀錄
5. **Cross-References**：被本 ADR（length-budget-enforcement）觸發、是否影響 H7 lint 等

### 附錄 C · 與 WE §4.3 的互補關係

WE §4.3 定義「新規則該寫哪裡」的**前置判斷樹**（寫入前先判斷）。本 ADR 定義「已經寫進去但膨脹」的**事後觸發機制**（寫入後監控）。兩者互補：

```
新規則要寫進治理文件
     │
     ▼
WE §4.3 判斷樹（前置）──────→ 決定寫進 CLAUDE.md / 子文件 / skill
     │
     ▼
文件行數增長（時間推進）
     │
     ▼
本 ADR 觸發線（事後）───────→ 🟡 / 🔶 / 🔴 / ⛔ 狀態符號
     │
     ▼
對應責任方啟動拆分 ADR
```

前置防守失效時（例：新規則判斷錯寫進 CLAUDE.md），事後觸發機制接住。兩者都失效時（例：WE §4.3 判斷錯 + 本 ADR 觸發線被忽略），最後防線是硬上限 ⛔ 凍結寫入。
