---
adr_id: adr-zero-legislation-as-valid-outcome-2026-04-25
title: 立法零產量是合法收尾 — H11
status: Draft
date: 2026-04-25
supersedes: []
related_adrs:
  - adr-collaboration-constitution-v0.2-2026-04-19
  - adr-length-budget-enforcement-2026-04-25
ratified_by:
drafted_by: Cowork-Opus-4.6
pillar: governance
observation_period_until: 2026-06-25
observation_trigger_for_acceptance: |
  PENDING.md 觀察期內出現至少 1 次「Cowork 為配額硬湊 ADR」的具體事件，
  且該事件由 Chat 或 Code session 在 retro 中明確指認。
observation_trigger_for_rejection: |
  PENDING.md 觀察期結束（2026-06-25）無上述事件發生，
  證明既有 memory `feedback_reject_symptomatic_workflow_suggestions` 已足夠約束。
---

> ## ⚠️ 本 ADR 為 Draft 狀態（觀察期：2026-04-25 → 2026-06-25）
>
> Chat 裁決於 2026-04-25 暫不升 Accepted，理由：
>
> 1. **解的問題尚未驗證**：「Cowork 看到月度配額沒用滿就硬湊 ADR」目前是推測風險，無實證案例。本批次 Cowork 已自我節制（4 Reject + 2 Accept），證明既有 memory 機制已足夠
> 2. **修辭遷移風險**：把 memory 內容升格為 ADR 條文，未增加新剛性核查，可能落入 v2.1 §1 警告的「修辭遷移」模式
>
> **觀察期內的處置**：
>
> - 本 ADR 內容**僅供參考**，不作為現行治理規則引用
> - 引用時必須註明「H11 Draft，觀察期內」
> - 觀察期結束前，PENDING.md 觀察指標 1（≤ 2 份/兩個月）的字面解讀以**現有 memory `feedback_reject_symptomatic_workflow_suggestions` 為準**，不援引本 ADR
> - 觀察期結束時依 frontmatter 兩條 trigger 條件決定升 Accepted 或 Reject

# 立法零產量是合法收尾 — H11

## Context

### 立法動機

`worklogs/PENDING.md` 觀察期段落（2026-04-25 起，2026-06-25 盤點）的觀察指標 1 寫：

> 1. 這兩個月新增幾份 ADR（預期 ≤ 2 份）

**「≤ 2」字面是上限**，但實踐中容易被誤讀為 KPI（「兩個月該立 2 份」）。本批次 (c) ADR 階段的 handoff §「需裁決事項」Q3 已警示：

> 立法產量 0 不是失敗。

但這條原則目前散落在 handoff 內文 + auto-memory `feedback_reject_symptomatic_workflow_suggestions`，**無正式條文錨點**。下一次 Cowork / Code session 起草 ADR 時若忘記讀 handoff，仍可能落入「不立白不立」的 KPI 思維。

### 三維度評分（依 `feedback_three_dimension_decision_framework`）

| 維度 | 評分 | 理由 |
|---|---|---|
| 工程合理性 | N/A（治理原則） | 不是工程議題，但連動 PENDING.md 觀察指標解讀 |
| 邏輯可驗證性 | 高 | 看 ADR 結案紀錄是否有 N=0 收尾範本可循；月底盤點觀察指標時可剛性核對 |
| 管理可執行性 | 高 | 規則簡單；綁定 PENDING.md 觀察指標 1 的解讀 |

詳見 `worklogs/cowork--c-phase-issue-extraction-matrix-2026-04-25.md` §2 C5a 段。

### 與既有 ADR / Memory 的關係

- **PENDING.md 觀察指標 1**：本 ADR 是該指標的解讀條文化
- **memory `feedback_reject_symptomatic_workflow_suggestions`**：本 ADR 把該精神從 memory 升級為制度錨點
- **memory `feedback_three_dimension_decision_framework`**：本 ADR 不取代評分框架，只規範「評分後若全數 Reject 也是合法產出」
- **憲法 v0.2 第三條 起草/裁決分離**：本 ADR 由 Cowork 起草（受益者也是 Cowork），預設 status: Proposed 等 Chat 裁決

---

## Decision

### 第一條 · 觀察期月度配額的字面解讀

PENDING.md 觀察期段落「觀察指標」中的「預期值 ≤ N」**字面意義是上限不是下限**。

具體應用：

- 觀察指標 1「兩個月新增幾份 ADR（預期 ≤ 2 份）」**意思是**「最多 2 份」
- **不意味**「應該 2 份」「至少 2 份」「最好 2 份」
- 觀察指標 2「ADR 引用率（預期 ≥ 50%）」反向同理——「至少 50%」是下限不是上限

### 第二條 · ADR 起草批次允許 N=0 收尾

任何一輪 ADR 起草批次（含本批次 (c) 階段格式、未來類似 batch），**允許最終立法產量為零**。

零產量收尾的合法條件：

1. 必須產出 **Reject 矩陣**（如本批次 §3 範例），明示候選池所有議題的 Reject 理由
2. 必須在 PENDING.md「明確排除」段（或等價段落）登記 Reject 候選 + 理由
3. 必須在對應 worklog `### abandoned` 維度紀錄該批次「評估了 N 條，最終立法 0 條」並含理由

**Reject 矩陣的最低要求**：

- 每條候選獨立段落
- 含三維度評分（工程合理性 / 邏輯可驗證性 / 管理可執行性）
- 含 Reject 主理由（綁定既有 memory 或 ADR 引用更佳）

### 第三條 · 禁止為配額而起草「補位 ADR」

如果起草理由是「**還有額度**」「**用滿配額**」「**這次只立一條好像太少**」，**屬於違反本 ADR 的補位起草**。

判別標準（任一成立即視為補位）：

1. 起草前檢索 auto-memory + 既有 ADR + retro 紀錄，發現本 ADR 預備條文與既有規則高度重疊
2. 三維度評分至少有一項評為「低」或「N/A 但管理可執行性低」，且無工程實效
3. ADR 通過後預期不會被 lint / hook / SOP 任何剛性核查機制引用

**處置**：起草到一半發現符合上述任一條件，**必須撤稿**——已寫的草稿移到 `docs/governance/_drafts/`（暫定路徑，需單獨 issue 確認）或直接刪除，並在 worklog `### abandoned` 維度紀錄撤稿理由。

### 第四條 · 對「立 1 條」與「立 0 條」的精神對等

本 ADR 不偏好任一結果，三種收尾皆合法：

| 收尾 | 條件 | 後續動作 |
|---|---|---|
| 立 N 條（N ≥ 1） | 通過三維度評分 + 有剛性核查 + 不重複既有規則 | ADR Draft 進 `docs/governance/`，status: Proposed |
| **立 0 條** | 候選池全 Reject，理由充足 | Reject 矩陣 + PENDING.md 明確排除段 + worklog abandoned 維度 |
| 撤稿 | 起草到一半發現符合第三條補位判別 | 草稿刪除或移 `_drafts/` + worklog 紀錄 |

**精神**：起草 ADR 不是為了把 PENDING 觀察指標跑滿，而是為了補真正的治理破洞。沒破洞 = 不立法。這與 memory `feedback_avoid_reinventing_solved_problems` 的「平台即將原生支援的不要花力氣手搭」一脈相承。

### 第五條 · 月底盤點時的解讀紀律

PENDING.md 觀察期段落明文「2026-06-25 盤點」。盤點時對觀察指標 1 的解讀紀律：

- 立 0 份：**不視為失敗**，視為候選池無真議題的合法結論
- 立 1 份：正常
- 立 2 份：正常（用滿上限）
- 立 ≥ 3 份：**視為違反**第一條觀察期上限，盤點時必須在當輪 retro 中補說明（但不追溯撤銷已立 ADR）

**盤點報告**最少含：

- 本期立 ADR 數量（含 Proposed + Accepted）
- 每份 ADR 的引用率（被 lint / hook / SOP / 其他 ADR 引用次數）
- 被 Reject 的候選清單（從 PENDING.md「明確排除」段抓）

### 第六條 · 重新評估觸發條件

以下任一成立，重開 ADR 討論本條：

1. 連續 3 個月（自本 ADR 升 Accepted 後計）所有起草批次皆 N=0 → 第二條的「合法零產量」可能反過來變成「永久不立法」傾向，需細化「健康的 N=0 比例」
2. 第三條補位判別標準在實戰中觸發 false positive ≥ 2 次（誤判合理立法為補位） → 第三條判別標準需細化
3. Paul 在 retro 中明確表示「PENDING 觀察指標解讀規則造成執行卡頓」 → 第一條解讀規則需重議

---

## Consequences

### 正面影響

- **PENDING.md 觀察指標 1 的「≤」字面意義被 ADR 層級背書**：閱讀觀察指標的人不會誤把上限當 KPI
- **N=0 收尾有明確範本**：本批次的 §3 矩陣 + PENDING.md 明確排除段成為未來範本
- **緩解「補位 ADR」誘惑**：第三條把 memory 精神制度化，下次 Cowork 想用滿配額時會被剛性核查擋下
- **與 H5 長度預算協同**：減少不必要的 ADR 累積，間接降低 `docs/governance/` 行數膨脹速度

### 負面影響

- **可能讓「立法門檻」過高**：第三條判別標準若太嚴，會讓真有用的 ADR 也被誤撤稿。緩解：第六條觸發條件 2 提供糾偏機制
- **需要起草「Reject 矩陣」的成本**：N=0 收尾要產出矩陣 + PENDING 登記 + worklog abandoned，總量比「不寫」多。緩解：本批次的 §3 已建立模板，未來複用即可
- **第三條的「撤稿」操作可能造成尷尬**：寫到一半撤稿在心理上比立 N=0 收尾更難。緩解：第三條是「最後防線」，預期使用率低（< 1 次/季）

### 中性觀察

- **本 ADR 不規範「ADR 起草頻率上限以外的限制」**：例如「同一主題隔多久才能再立 ADR」「同一 session 連續立幾份」這類問題不在本 ADR 範圍——交由憲法 v0.2 第三條起草/裁決分離 + H5 長度預算自然約束
- **本 ADR 與「越權自審」紅線的關係**：Cowork 起草本 ADR 受益者也是 Cowork，但 status: Proposed + 等 Chat 裁決，符合憲法第三條剛性核查要求

---

## Cross-References

### 依賴的 ADR

- `adr-collaboration-constitution-v0.2-2026-04-19.md` §三 起草/裁決分離：本 ADR 預設 Proposed 是該規則的直接應用

### 相關 ADR / 機制

- `adr-length-budget-enforcement-2026-04-25.md`（H5）：本 ADR 第二條的「N=0 合法」與 H5 的長度預算自然協同——立越少 ADR，governance 目錄越不會膨脹
- `adr-governance-research-git-discipline-2026-04-25.md`（H10）：本 ADR 與 H10 同批次起草，兩條剛好用滿月度配額；本 ADR 第三條反過來保證即使配額未用滿也不該硬湊

### 相關 memory

- `feedback_reject_symptomatic_workflow_suggestions`：本 ADR 把該精神從 memory 升級為制度錨點
- `feedback_three_dimension_decision_framework`：本 ADR 第二條的「Reject 矩陣最低要求」直接引用該框架
- `feedback_avoid_reinventing_solved_problems`：本 ADR 第三條判別標準 1 直接呼應該精神
- `feedback_incremental_fix_observe_before_automate`：本 ADR 第六條的觸發條件設計符合「先觀察再決定升級」原則

### 相關 worklog

- `worklogs/cowork--c-phase-issue-extraction-matrix-2026-04-25.md` §2 C5a：本 ADR 立法的三維度評分依據
- `worklogs/PENDING.md`「觀察期項目（2026-04-25 起，2026-06-25 盤點）」：本 ADR 第一條解讀的對象

---

## Appendix · N=0 收尾的 worklog 範本

依本 ADR §二，N=0 收尾必須在 worklog `### abandoned` 維度紀錄。範本：

```markdown
### abandoned

- **本批次 (c) ADR 起草階段最終立法 0 條**
  - 候選池：C1-C5 + Cowork 補充候選（共 X 條）
  - 三維度評分後全數 Reject，理由詳見：`worklogs/cowork--c-phase-issue-extraction-matrix-YYYY-MM-DD.md`
  - 已在 `worklogs/PENDING.md`「明確排除」段登記候選 + Reject 理由
  - 依 H11 ADR §四，零產量收尾為合法結論，不視為失敗
```

本批次本身**不適用**此範本（本批次立 2 條，符合上限）——範本留給未來真的 N=0 的批次使用。
