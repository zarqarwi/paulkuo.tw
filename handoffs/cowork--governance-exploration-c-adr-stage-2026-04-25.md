# Cowork Handoff · 治理探索三輪迭代 (c) ADR 起草階段

- **產出時間**：2026-04-25
- **產出者**：Cowork session（執行完上游 handoff `cowork--worklog-governance-exploration-2026-04-25.md`）
- **目標 session**：Chat（先做議題萃取與裁決），下游交 Cowork（起草 ADR）+ Code（歸檔）
- **任務類型**：(c) ADR 起草階段（治理探索三步走第二步）
- **Status**：Ready for execution
- **上游**：本批次三步走的 (a) worklog 已完成（commit `988d685`）

---

## 任務背景（前一階段已完成）

(a) worklog 階段已產出並 push：

| 產物 | 路徑 / URL | 狀態 |
|---|---|---|
| 事實重建 worklog | `worklogs/worklog-2026-04-25-governance-exploration.md` | ✅ commit 988d685 |
| PENDING.md 觀察期段落 | `worklogs/PENDING.md`（line 274-300） | ✅ 7 條 `[-]` + 「明確排除」子段 |
| Issue #155 dashboard 同步 | https://github.com/zarqarwi/paulkuo.tw/issues/155#issuecomment-4317618006 | ✅ 已送出 |

四份治理研究報告事實基礎已重建：

1. v1.0 `docs/governance/research-governance-gaps-vs-industry-2026-04-25.md`（655 行）
2. v2.0 `docs/governance/research-governance-gaps-vs-industry-2026-04-25-v2.md`（452 行）
3. v2.1 `docs/governance/research-governance-gaps-vs-industry-2026-04-25-v2.1-cowork.md`（182 行）
4. Code feedback `docs/governance/code--research-governance-gaps-v2-engineering-feedback-2026-04-25.md`（199 行）

⚠️ 四份報告目前 `git status` 為 untracked，是否進 git **由本階段決定**（見 §「需裁決事項」）。

---

## (c) ADR 起草階段的任務範圍

### Step 1 · 議題萃取（Chat 主導）

從 worklog + 四份報告中識別**值得立 ADR 的議題**。預設懷疑、明示排除。

**候選議題池**（已從 worklog 萃取，非完整也非保證要立）：

| # | 候選主題 | 來源 | 預判風險 |
|---|---|---|---|
| C1 | Chat 自我糾正流程的觸發條件與邊界 | v2.0 自述「8 輪偵查 + 兩次自我對話」、v1.0→v2.0 三個 framing 推翻 | 寫成 ADR 可能被 v2.1 §1 質疑為「另一種修辭遷移」 |
| C2 | 多視角挑戰機制 + v2.2 缺軌的補正規則 | v2.0 邀請「Cowork v2.1 / Code v2.2 / Paul 三個月後重讀」三軌；實際 v2.2 由 Chat 模擬 Code 視角產出 | 若立規則「v2.x 必須由真正對應 session 產出」可能 MAST 過度設計 |
| C3 | 治理研究報告的 git 紀律 | 四份報告 untracked + Issue #155 無紀錄 → 可追溯性破洞 | 立 ADR 後要綁 lint 檢查（成本） |
| C4 | 事實基礎報告 vs 修辭遷移的判別準則 | v2.1 §1 對 GitLab framing 的根本質疑、v2.0 偏見清單 §4 | 做成 ADR 容易陷入定義戰 |
| C5 | （由 Chat 自由補充） | — | — |

**Step 1 產出**：Chat 對候選議題的**裁決矩陣**（Accept / Modify / Reject + 理由），寫進新 handoff 給 Cowork。

### Step 2 · ADR 起草（Cowork）

依 Chat 裁決結果起草 ADR，遵循既有規範：

- **Frontmatter 7 個必填欄位**：`adr_id` / `title` / `status` / `date` / `ratified_by` / `drafted_by` / `pillar`
- **四章骨架**：Context / Decision / Consequences / Cross-References
- **預設 status: Proposed**（憲法 v0.2 規則，避免同一 session 既起草又裁決）
- **編號**：H 編號從 H10 開始（需確認 H10/H11/H12 的撤銷狀態，見 worklog §3.3）；或用主題短碼如本批次 SKL-draft 的做法

**Step 2 產出**：N 份 ADR Draft（N ≥ 0），歸 `docs/governance/`。

### Step 3 · ADR-INDEX 同步（Cowork）

新 ADR 合併前必須同步更新 `docs/governance/ADR-INDEX.md`（INDEX 維護 SOP 第 1 條）：

- 快速導航表加新行
- 主題分組更新
- 「尚未立法的議題」段更新（若有 H 編號從凍結移出）
- INDEX 行數應等於實際 ADR 檔案數（驗證指令見 INDEX 維護 SOP 第 3 條）

### Step 4 · 結案產出

- worklog 補章 / 新 worklog（H8 四維度：done / decisions / pitfalls / abandoned）
- Issue #155 comment 更新
- PENDING.md 「明確排除」段視情況更新（若某 C 候選被 Reject，理由寫進這裡）

---

## 需裁決事項（請 Chat / Paul 判斷）

### Q1 · 四份治理研究報告要不要進 git？

**現況**：四份檔案 `??` untracked。
**贊成入 git**：可追溯性、Issue #155 引用可查、長期治理研究素材庫。
**反對入 git**：四份報告之間有立場衝突（v2.1 推翻 v2.0 部分），入 git 後形同把「過程稿」當「定稿」展示；docs/governance/ 已偏重，再加 4 份報告可能達 H5 長度預算閾值。
**建議**：本階段裁決時定調，不要拖到下一階段。

### Q2 · v2.2「真 Code session 視角」要不要補產出？

**現況**：repo 中只有 Chat 模擬 Code 視角的 Feedback。v2.0 三軌挑戰只完成 1.5 軌。
**贊成補**：完成度、Code 視角可能挖出 Chat 看不到的工程實況。
**反對補**：v2.1 + Code Feedback 已警告「v1.0→v2.0 過度做 framing 工作」，再來一輪 v2.2 可能是「為補軌而補軌」。
**建議**：若補，限定範圍——只要 Code 跑 Code feedback 的 D1-D4 落地檢查，不再做 framing 修辭。

### Q3 · ADR 起草數量上限？

**背景**：PENDING.md 觀察指標 1 寫「兩個月新增幾份 ADR（預期 ≤ 2 份）」。本階段（c）若立 3+ 份 ADR，自打觀察指標。
**建議**：本階段 ADR 立法數 **預設 0-1 份**，超過要寫明理由（綁定觀察指標 1）。

---

## 源頭事實清單（F-ID）

| F-ID | 路徑 / URL | 用途 |
|---|---|---|
| F1 | `worklogs/worklog-2026-04-25-governance-exploration.md`（commit 988d685） | 事實重建主體 |
| F2 | `worklogs/PENDING.md` line 274-300（觀察期 + 明確排除） | 已採納/已排除清單 |
| F3 | `docs/governance/ADR-INDEX.md` | ADR 現況、新 ADR 編號參考 |
| F4 | `docs/governance/research-governance-gaps-vs-industry-2026-04-25*.md` ×4（皆 untracked） | 議題素材庫 |
| F5 | https://github.com/zarqarwi/paulkuo.tw/issues/155#issuecomment-4317618006 | Issue dashboard 紀錄 |
| F6 | `docs/governance/adr-collaboration-constitution-v0.2-2026-04-19.md` | 憲法骨架（ADR 預設 Proposed 等規則來源） |
| F7 | `docs/governance/adr-worklog-abandoned-dimension-2026-04-25.md`（H8） | worklog 四維度規範 |
| F8 | `docs/governance/adr-length-budget-enforcement-2026-04-25.md`（H5） | 長度預算閾值 |
| F9 | `docs/governance/adr-governance-lint-he-lu-2026-04-25.md`（H7） | lint 護欄基礎 |

---

## 完成標準

- [ ] Step 1 議題萃取裁決矩陣產出（Chat）
- [ ] Step 2 N 份 ADR Draft 起草完成（N ≥ 0；若 N=0 寫明理由）
- [ ] Step 3 ADR-INDEX 同步（若 N ≥ 1）
- [ ] Step 4 worklog 補章 + Issue #155 comment + PENDING.md 同步
- [ ] commit + push 走 Paul 本機（憲法 v0.2 寫入邊界）
- [ ] Q1/Q2/Q3 三件需裁決事項皆有明確答覆

---

## 已知陷阱（請避開）

1. **不重啟 v2.1 §1 質疑的 GitLab framing 爭論**——疏漏 2 已明確排除，不再進來
2. **不立 H10/H11/H12/H13**——已在 v2.0 撤銷或經 v2.1 建議「不立」，再立屬「重新點燃修辭爭論」
3. **不替 v2.2 補軌（除非 Q2 明確同意）**——避免「為補軌而補軌」
4. **不重新詮釋四份報告內容**——事實基礎已在 worklog 重建，引用 F-ID 即可，不要再做一輪 framing
5. **不超過月度 ADR 觀察指標**——本階段預設 0-1 份，超過要寫明理由
6. **不假設 Code 視角等於工程權威**——Code feedback 是 Chat 模擬產出（worklog §2.3 已標明）
7. **commit oneliner 必走 Paul 本機**——sandbox 寫不到 .git/（憲法第二條 + WE §1.3.2）

---

## 不做的事（明確邊界）

- **不做**：v3.0 整體治理框架重寫
- **不做**：把 v1.0/v2.0/v2.1 三份合併成一份「定稿」
- **不做**：替 4 份報告的事實衝突調解（保留衝突是事實基礎的一部分）
- **不做**：擴大範圍到非治理議題

---

## 給下一輪 Chat / Cowork 的提示

worklog §0「開頭警示」+ 附錄 A「核心分工原則」是這次三步走的紀律核心：

> 方向性判斷 = Paul；程式 / 資料整理 / 快速消化 = Claude。
> 唯一可信的事實源是 repo + worklog + GitHub Issue + handoff 檔案。
> 資料如果不在系統 log 裡，就是系統優化機會，不是用人腦補。

(c) ADR 階段如果做完發現「沒什麼值得立 ADR」，**這是合法產出**——直接 Reject 整池候選、寫進 PENDING.md「明確排除」段、結案。立法產量 = 0 不是失敗。

---

**Cowork 產出**：Sonnet 4.6（本對話），2026-04-25
**對應任務**：Paul 的「治理探索三步走」第二步
**下一步**：(b) 公開文章（時間沉澱後，需獨立 handoff）
