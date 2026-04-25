# (c) ADR 階段 · Step 1 議題萃取裁決矩陣

- **日期**：2026-04-25
- **產出者**：Cowork session（Sonnet 4.6，受 Paul 授權代打 Step 1+2）
- **上游**：handoff `cowork--c-phase-adr-drafting-2026-04-25` + worklog `worklog-2026-04-25-governance-exploration.md`（commit `988d685`）
- **裁決框架**：三維度評分（工程合理性 / 邏輯可驗證性 / 管理可執行性）— 依 auto-memory `feedback_three_dimension_decision_framework`
- **配額限制**：本階段 ADR 起草上限 2 份（Paul 裁決，用滿 PENDING.md 觀察指標 1 月度配額）

---

## 0. 開頭警示（Step 1 必讀）

handoff §「需裁決事項」Q3 寫得清楚：「立法產量 0 不是失敗」。Paul 雖選「上限 2 份」用滿配額，並非要求一定立 2 份。本矩陣若評估後只有 0/1 條值得立，照實裁決，不為了用滿配額硬立。

裁決矩陣的執行紀律：

- **預設懷疑**：候選議題進場時預設不立法，必須通過三維度檢核才晉級
- **明示排除**：Reject 的候選必須附明確理由 + 對應 auto-memory 引用，避免下一輪 session 重複提案（依 H8 ADR §一第四維度 abandoned 精神）
- **不重啟修辭爭論**：v2.1 §1 的 GitLab framing 質疑、v2.0 已撤銷的 H10、v2.1 建議「不立 H13」，這些**不在本矩陣討論範圍**——重啟即落入 handoff 「已知陷阱 §1/2」

---

## 1. 候選池總覽

| ID | 主題 | 來源 | 預判風險 |
|---|---|---|---|
| C1 | Chat 自我糾正流程的觸發條件與邊界 | v2.0 自述「8 輪偵查 + 兩次自我對話」、v1.0→v2.0 三個 framing 推翻 | v2.1 §1 已質疑為「另一種修辭遷移」 |
| C2 | 多視角挑戰機制 + v2.2 缺軌的補正規則 | v2.0 邀請三軌挑戰；v2.2 由 Chat 模擬 Code 視角產出 | 立規則「v2.x 必須對應 session 產出」屬 MAST 過度設計 |
| C3 | 治理研究報告的 git 紀律 | 四份報告 untracked + Issue #155 無紀錄 → 可追溯性破洞 | 立 ADR 後要綁 lint 檢查（成本） |
| C4 | 事實基礎報告 vs 修辭遷移的判別準則 | v2.1 §1 對 GitLab framing 的根本質疑、v2.0 偏見清單 §4 | 容易陷入定義戰 |
| C5a | 「立法零產量是合法收尾」明文化（Cowork 補充） | handoff §Q3 + memory `feedback_reject_symptomatic_workflow_suggestions` | 可能被視為 self-serving（Cowork 為自己留後路） |
| C5b | 「Chat 模擬 X-session 視角」何時合法的判別準則（Cowork 補充） | v2.2 補軌爭議 + Code feedback 自承「Chat 於 Code 視角模擬」 | 流程儀式，難以剛性核查 |

---

## 2. 逐項裁決

### C1 · Chat 自我糾正流程的觸發條件與邊界

**裁決：REJECT**

| 維度 | 評分 | 理由 |
|---|---|---|
| 工程合理性 | 低 | 「自我糾正」屬流程性議題，無剛性核查接口（無檔案產出可驗、無 commit 可比對） |
| 邏輯可驗證性 | 低 | 「8 輪偵查 + 兩次自我對話」是否合理本身難客觀判定；定義邊界容易陷入「幾輪算夠」之類定義戰 |
| 管理可執行性 | 低 | 即使立 ADR，下次 Chat 仍會在新題目重新自由發揮；ADR 寫死規則反而與「視語境調整」相衝突 |

**Reject 主理由**：

1. v2.1 §1 已明文質疑「為 Chat 自我糾正立 framing」可能是另一種修辭遷移——立 ADR 等於用 ADR 把修辭制度化，正是 v2.1 警告的失敗模式
2. Chat 行為的剛性核查依靠憲法第三條（剛性核查條款）+ H7 lint 已有他律防線，不需要再立專屬 ADR
3. 「過度自我對話」如果出問題，靠 retro 案例累積成 auto-memory 即可（如 `feedback_avoid_reinventing_solved_problems`、`feedback_chat_secondhand_citation_blind_spot`），不需升格為 ADR

**處置**：寫進 PENDING.md「明確排除」段，理由綁定 memory `feedback_reject_symptomatic_workflow_suggestions`。

---

### C2 · 多視角挑戰機制 + v2.2 缺軌的補正規則

**裁決：REJECT**

| 維度 | 評分 | 理由 |
|---|---|---|
| 工程合理性 | 低 | 「v2.x 必須由真正對應 session 產出」屬流程儀式，對應到工程動作只能靠 git author + frontmatter `produced_by` 比對，但 frontmatter 自填欄位剛性核查近乎為零 |
| 邏輯可驗證性 | 中 | 至少能從 git author 看出哪個 session commit；但 Chat 模擬 Code 視角的檔案如果 author 是 Paul（手動同步），仍無法區分 |
| 管理可執行性 | 低 | Chat 模擬 X-session 視角這事 Paul 有時要、有時不要，case-by-case；ADR 寫死禁用會去掉一個有時很好用的工具 |

**Reject 主理由**：

1. 屬個案判斷議題，不適合制度化——禁用 Chat 模擬 Code 視角會誤殺像本批次 Code feedback 這樣有實效的產出
2. v2.0 三軌挑戰本身是 v2.0 自己邀請的修辭設定，不是治理通則。把它當「缺軌就要補」會落入 v2.1 警告的「為補軌而補軌」
3. C5b 候選（同主題從另一切面）也 Reject，原因類似——詳見 C5b 段

**處置**：寫進 PENDING.md「明確排除」段。Q2 Code 真補軌已限定 D1-D4 落地檢查（不做 framing），由獨立 handoff 處理，不需 ADR 兜規則。

---

### C3 · 治理研究報告的 git 紀律

**裁決：ACCEPT（起草為 H10）**

| 維度 | 評分 | 理由 |
|---|---|---|
| 工程合理性 | 中-高 | git tracking 是工程議題；本批次四份報告 untracked + Issue #155 無紀錄已揭露具體破洞 |
| 邏輯可驗證性 | 高 | `git ls-files docs/governance/research-*.md` 可直接驗，H7 lint 可加一條 |
| 管理可執行性 | 中-高 | 規則簡單（治理研究報告產出後同 commit 進 git，與 worklog 同 batch push），靠 commit-msg hook 提醒成本低 |

**Accept 主理由**：

1. 本批次自身案例：(a) 階段 worklog §0 開頭警示已揭露「真正決策時間軸無法從 commit log 推導」，是制度破洞而非偶發疏忽
2. Q1 裁決選「全進 git」=> 治理研究報告會持續產出，沒有 ADR 約束下次仍可能 untracked
3. 與既有 H7 lint 護欄無縫銜接（H7 §五 Phase 2 增量項可加一條檢查 `docs/governance/research-*.md` 是否 tracked）
4. 規則內容窄、可剛性核查、與 H8 worklog 四維度一脈相承——屬「補小破洞」而非「制度大改」

**ADR 關鍵條文預備**（草稿在 §3）：

- 範圍：`docs/governance/research-*.md`、`docs/governance/cowork--*-research-*.md`、`docs/governance/code--*-feedback-*.md`、`worklogs/cowork--*-matrix-*.md` 等治理研究類產出
- 紀律：產出 commit 必須與 worklog 同 batch（同一 push 推送）+ Issue #155 dashboard 同步必須含對應 commit hash
- 救濟：H7 lint Phase 2 增量加一條（Warning 級，不擋 commit 但 push 前提示）

---

### C4 · 事實基礎報告 vs 修辭遷移的判別準則

**裁決：REJECT**

| 維度 | 評分 | 理由 |
|---|---|---|
| 工程合理性 | 極低 | 屬語意/敘事辨識，無工程接口 |
| 邏輯可驗證性 | 極低 | 「什麼算修辭遷移」會永遠吵下去；v2.1 §1 自己就警告陷入此類定義戰 |
| 管理可執行性 | 低 | 即使立 ADR，下個 retro 仍會重新爭論「這次算不算修辭」 |

**Reject 主理由**：

1. 判別準則是 retro 案例累積出來的習慣，不是制度化議題——已有 memory `feedback_avoid_reinventing_solved_problems` 在處理類似精神
2. v2.1 §1 對 GitLab framing 的根本質疑就是這類辯論的範本，硬立 ADR 等於把 v2.1 警告的失敗模式制度化
3. 與 C1 同源——制度化「Chat 主觀判斷」是無解題

**處置**：寫進 PENDING.md「明確排除」段。

---

### C5a · 「立法零產量是合法收尾」明文化（Cowork 補充候選）

**裁決：ACCEPT（起草為 H11）**

| 維度 | 評分 | 理由 |
|---|---|---|
| 工程合理性 | N/A（治理原則） | 本身不是工程議題，但連動 PENDING.md 觀察指標的解讀 |
| 邏輯可驗證性 | 高 | 看 ADR 結案紀錄是否有 N=0 收尾範本可循；月底盤點觀察指標時可剛性核對 |
| 管理可執行性 | 高 | 規則簡單（觀察期月度配額是上限不是下限；產量 0 是合法）；綁定 PENDING.md 觀察指標 1 解讀 |

**Accept 主理由**：

1. 直接回應 handoff §Q3 警示：「上限 2 份不代表要立 2 份」——但實踐中容易被解讀為 KPI，下次 Cowork 起草時會有「不立白不立」的拉扯
2. memory `feedback_reject_symptomatic_workflow_suggestions` + handoff 「立法產量 0 不是失敗」屬同一精神，但目前散落在 memory + handoff 內文，無正式條文錨點
3. 配套 PENDING.md 觀察指標 1（兩個月新增幾份 ADR，預期 ≤ 2）能讓「≤ 2 份」的「≤」字面意義被ADR層級背書——閱讀觀察指標的人不會誤把上限當 KPI
4. 起草成本低（短 ADR，~80 行），對 H5 長度預算威脅小

**ADR 關鍵條文預備**（草稿在 §3）：

- 條文一：觀察期月度配額（PENDING.md 觀察指標 1 預期值）的「≤ N」字面是上限不是下限
- 條文二：ADR 起草批次允許 N=0 收尾，必須產出「Reject 矩陣」說明候選池為何無一晉級（如本檔形式）
- 條文三：禁止為了用滿配額而起草「補位 ADR」——若起草理由是「還有額度」，必須補寫真實工程／治理理由或撤稿

**對 self-serving 風險的回應**：

- 確實有「Cowork 為自己留後路」的疑慮——本 ADR 由 Cowork 起草，受益者也是後續 Cowork session
- 緩解：status: Proposed，由下一輪 Chat 裁決是否升 Accepted（憲法第三條起草/裁決分離）
- 緩解：本 ADR 同時對 Cowork 加紀律（禁止為了配額硬立 ADR），不只是放寬

---

### C5b · 「Chat 模擬 X-session 視角」何時合法的判別準則（Cowork 補充候選）

**裁決：REJECT**

| 維度 | 評分 | 理由 |
|---|---|---|
| 工程合理性 | 低 | 屬流程儀式，無剛性核查機制 |
| 邏輯可驗證性 | 低 | 「合法 vs 不合法」會落入個案爭論 |
| 管理可執行性 | 低 | 即使立 ADR 也會在實戰中被例外打穿 |

**Reject 主理由**：

1. 與 C2 同源（流程儀式制度化），前面已 Reject
2. 本批次的 Code feedback 案例自承「Chat 於 Code 視角模擬」並標明 Status: Feedback（非 v2.2）——揭露機制本身就是緩解，不需 ADR
3. Q2 Code handoff 已限定 D1-D4 落地檢查（不再做 framing 修辭），用個案紀律處理而非通用規則

**處置**：寫進 PENDING.md「明確排除」段。

---

## 3. 最終裁決總結

| 候選 | 裁決 | 後續動作 |
|---|---|---|
| C1 | REJECT | PENDING.md 明確排除段擴充 |
| C2 | REJECT | PENDING.md 明確排除段擴充；Q2 Code handoff 處理補軌 |
| **C3** | **ACCEPT → 起 H10** | 起草 ADR Draft（status: Proposed）；INDEX 同步 |
| C4 | REJECT | PENDING.md 明確排除段擴充 |
| **C5a** | **ACCEPT → 起 H11** | 起草 ADR Draft（status: Proposed）；INDEX 同步；綁定 PENDING.md 觀察指標 1 |
| C5b | REJECT | PENDING.md 明確排除段擴充 |

**本批次 ADR 起草數量**：2 份 Draft（用滿月度配額上限）

**配額用滿說明**：

兩份 ADR 起草理由獨立——H10 解工程破洞（治理研究報告 untracked），H11 解管理迷思（配額誤讀）。不是「為了用滿 2 份配額硬湊」，是「兩條剛好都通過三維度檢核」。

如果 Step 2 起草過程中發現 H10 或 H11 任一條無法寫成有實質約束的 ADR（例如 H11 寫到一半發現所有條文都重複既有 memory 內容），會降級為 Reject 並更新本矩陣，不為配額硬撐。

---

## 4. 不做的事（明確邊界）

依 handoff §「不做的事」+ §「已知陷阱」：

1. 不重啟 v2.1 §1 GitLab framing 爭論
2. 不立 H10/H11/H12/H13 為原 v2.0 主題（H10/H11 編號重新用於本批次新議題；INDEX 編號說明會補一句註明此事）
3. 不替 v2.2 補軌（Q2 Code handoff 限定 D1-D4 落地檢查，不再做 framing 修辭）
4. 不重新詮釋四份報告內容
5. 不超過 2 份 ADR Draft 上限
6. 不假設 Code 視角等於工程權威（worklog §2.3 已標明 Code feedback 為 Chat 模擬產出）
7. commit oneliner 必走 Paul 本機

---

## 5. 與後續 Step 的銜接

- **Step 2**（本 session 接續）：依本矩陣 §3 起草 H10 + H11 ADR Draft，status: Proposed
- **Step 3**（本 session 接續）：同步更新 ADR-INDEX，加入 H10/H11 兩行 + 編號說明
- **Step 4**（本 session 接續）：worklog 補章四維度 + Issue #155 comment + PENDING.md 明確排除段
- **下一輪 Chat session**：裁決 H10/H11 是否從 Proposed 升 Accepted（憲法第三條剛性核查）
- **下一輪 Code session**：執行 Q2 D1-D4 落地檢查，產出工程驗證紀錄（不做 framing）

---

**產出者**：Cowork session（Sonnet 4.6）
**裁決時間**：2026-04-25
**裁決方法**：三維度評分框架 + handoff 預設懷疑紀律
**檔案位置**：`worklogs/cowork--c-phase-issue-extraction-matrix-2026-04-25.md`
