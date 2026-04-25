# Worklog · 治理框架探索三輪迭代（事實重建）

- **日期**：2026-04-25
- **類型**：事實重建（非敘事、非 ADR）
- **產出者**：Cowork session（依 handoff `cowork--worklog-governance-exploration-2026-04-25.md` 執行）
- **觸發**：Paul 要求把治理探索整理成三種產出，本檔為 (a) worklog 階段
- **後續**：(c) ADR、(b) 公開文章（時間沉澱後）

---

## 0. 開頭警示 · 可追溯性實況

> 本輪治理探索的**核心產物（四份報告）目前皆未進 git**。
> Cowork 偵查範圍涵蓋：`docs/governance/` ls / `git log` / `git status` / Issue #155 body 與 4 則 comments / `worklogs/PENDING.md` / `worklogs/worklog-2026-04-25.md` / 報告自身 frontmatter 與內文。
> 結論：**真正的決策時間軸無法從 commit log 推導**，只能從 sandbox mtime + 報告 frontmatter 自述的觸發語推導。
> 這個發現本身就是 handoff 強調的「資料如果不在系統 log 裡，就是系統優化機會」的具體實例。

`git status` 顯示四份報告皆為 `??`（untracked）：

```
?? docs/governance/research-governance-gaps-vs-industry-2026-04-25.md
?? docs/governance/research-governance-gaps-vs-industry-2026-04-25-v2.md
?? docs/governance/research-governance-gaps-vs-industry-2026-04-25-v2.1-cowork.md
?? docs/governance/code--research-governance-gaps-v2-engineering-feedback-2026-04-25.md
```

Issue #155（最後更新 2026-04-23T15:43:57Z）的 body 與 4 則 comments 也均無本輪治理探索的紀錄。

---

## 1. 時間軸（基於可得實證）

| 順序 | 檔案 | 行數 | 大小 | sandbox mtime | frontmatter 觸發語（自述） |
|---|---|---|---|---|---|
| ① | `research-governance-gaps-vs-industry-2026-04-25.md`（v1.0） | 655 | 35.8 KB | 2026-04-24 16:53 | 「2026-04-24 H1-H9 立法鏈完成後，Paul 委託整理疏漏對照」 |
| ② | `research-governance-gaps-vs-industry-2026-04-25-v2.md`（v2.0） | 452 | 23.8 KB | 2026-04-24 17:05 | 「Paul 指示『不介意慢慢調查仔細研究，反覆自我對話』」；自述「8 輪偵查 + 兩次自我對話」 |
| ③ | `code--research-governance-gaps-v2-engineering-feedback-2026-04-25.md`（Code 視角回饋） | 199 | 11.3 KB | 2026-04-24 17:11 | 「產出者：Chat session(Opus 4.7)於 Code 視角模擬」；「Status: Feedback（非 v2.2，只挑工程面）」 |
| ④ | `research-governance-gaps-vs-industry-2026-04-25-v2.1-cowork.md`（v2.1 Cowork peer review） | 182 | 10.4 KB | 2026-04-24 17:14 | 「Chat v2.0 明文邀請『Cowork 讀完後寫一份 v2.1 挑戰我的判斷』」 |

**資料解讀注意事項**

- **檔名與 frontmatter 的「2026-04-25」 vs sandbox mtime「2026-04-24」並列**：mtime 與檔名日不同步在這個 sandbox mount 環境是常態（檔案實體在 macOS 本機，sandbox 是 mount 過去），不能視為矛盾。事實基準以 frontmatter 自述為準。
- **四份檔案的 mtime 落在 21 分鐘內**（16:53 → 17:14）：這個區間長度不合於「四份報告依序起草」的實際時長，較可能是 Paul 把先前 Chat session 對話成果分批存檔到本機的時間，**真實對話時間軸不可從 mtime 取得**。

---

## 2. 核心轉折（事實性，不修辭潤飾）

### 2.1 v1.0 → v2.0：framing 結構性修正

**v2.0 §「v1.0 的三個根本性錯誤」自述（檔案 line 41 附近）**：

> v1.0 是我在 Paul 第一次問「有哪些疏漏」時，花大約 1 小時、做 3 輪 web_search 整理出來的。
> 當 Paul 說「不介意慢慢調查仔細研究」後，我做了 8 輪偵查（v1.0 的 2.7 倍），並且強迫自己兩次自我對話（找盲點 / 推翻假設）。

**v2.0 自述對 v1.0 的三個推翻點**（取自報告目錄）：

1. 「三權分立 + 憲法」 → 降為「功能分工」（v2.0 line 129、138）
2. 「修憲程序」議題從 H10 撤銷（v2.0 line 251、260）
3. H13 handoff 格式從 v1.0 擺最後 → v2.0 翻盤擺第一（v2.0 line 334；v2.1 line 69 對此提出質疑）

**v2.0 末尾的明文授權鏈**（v2.0 line 396 附近）：

> 1. **Cowork 讀完後寫一份 v2.1**，挑戰我的判斷
> 2. **Code 讀完後寫一份 v2.2**，從實作可行性挑戰
> 3. **三個月後 Paul 重讀**，用實際執行經驗挑戰

### 2.2 v2.0 → v2.1：Cowork 戳「修辭遷移」

**v2.1 §「v2.0 有四個我覺得也該推翻的東西」（v2.1 line 27 起）**：

1. GitLab Handbook 是另一種修辭移植，不是解藥（v2.1 §1）
2. （條目 2、條目 4 未細看，僅依目錄列出）
3. 「優先做 H13 handoff 格式」的推論鏈有問題：v1.0 把 H13 擺最後，v2.0 翻盤擺第一，**翻盤的唯一新證據就是「今天這次對話」**——這種以單次 session 表現當實證的推論，自己的「偏見清單」裡就該列一條（v2.1 line 59-69）

**v2.1 §「給 Paul 的兩條實操建議」中的核心提案**（v2.1 line 129 附近）：

- 不立 H13
- （配套兩個月觀察期，配套不加月度上限）

### 2.3 v2.0 → Code 視角回饋：工程斷言的反駁

**檔案署名與定位**（檔案 frontmatter）：

> 產出者：**Chat session(Opus 4.7)於 Code 視角模擬**
> Status：Feedback（非 v2.2，只挑工程面）
> 立場：v1.0→v2.0 已經過度做 framing 工作了。如果還有 v2.2，應該交付 artifact，不是再一輪修辭調整。

⚠️ **[資料缺失]**：v2.0 明文邀請的「Code 讀完後寫一份 v2.2」**未由真正的 Code session 產出**。檔案是 Chat 自己模擬 Code 視角產出的 Feedback，不是 Code session 的實際輸出。

**Code 視角 Feedback 的工程反駁主軸**（檔案 line 41-45、126-160）：

| 編號 | 反駁內容 | 行數 |
|---|---|---|
| A1 | MAST「17x error amplification」誤用（並行 agent vs 序列 handoff，category error） | line 17-25 |
| A2 | 「plateau beyond 4 agents」對 paulkuo.tw 是 **有利**而非警訊（3 agent 沒撞閾值） | line 27-29 |
| A3 | Boris Cherny「context rot 300-400k tokens」不適用（Opus/Sonnet 上限 200k） | line 41-45 |
| D1-D4 | 工程議題：ADR 索引、Handoff 生命週期、Immutable ADR 工程基礎、多 session race condition | line 126 起 |

---

## 3. 未決項與建議盤點

### 3.1 v2.1 兩個月觀察期建議 — **狀態：已採納**

證據在 `worklogs/PENDING.md`（commit `d46ff7f`，2026-04-25）新增「觀察期項目（2026-04-25 起，2026-06-25 盤點）」段落，含 7 條 `[-]`（暫緩）：

```
- [-] v2.0 疏漏 1 · 修憲→handbook 變更 framing 切換
- [-] v2.0 疏漏 3 · auto-memory 升格 ADR 觸發規則
- [-] v2.0 疏漏 4 · cloud 層 snapshot 維護者明文化
- [-] v2.0 疏漏 5 · H13 handoff 格式（含時間 budget metadata）
- [-] v2.0 疏漏 6 · 月度 ADR 產出上限規則
- [-] v2.0 疏漏 7 · Paul 在治理體系的明文位置
- [-] Branch protection PR 閘門啟用（待 2026-06-25 用實例重議）
```

PENDING.md 同段附觀察指標：

1. 這兩個月新增幾份 ADR（預期 ≤ 2 份）
2. 幾份 ADR 真的被後續 session 引用（預期 ≥ 50%）
3. Chat 還會不會主動發類似 v3.0 的 meta-report（預期：不會）

⚠️ **[資料缺失]**：v2.0 列出 7 項疏漏，PENDING.md 觀察期段落只 [-] 6 項（缺 v2.0 疏漏 2）。需確認疏漏 2 是被合併、被否決，還是漏寫。**Cowork 不自行補正，標註不一致**。

**事後處理紀錄（本 worklog 產出後）**：Paul 採選項 (B)「明確排除」，於 `worklogs/PENDING.md` 觀察期段落結尾新增「### 明確排除（不進觀察期）」子段。疏漏 2 不進觀察期，理由綁定 D4 重疊、v2.1 §1 對 GitLab framing 的根本質疑、與工程面已部分運作的事實。6/25 盤點時若 D4 有實例則與此項合併重議。

### 3.2 Code 視角 D1-D4 工程議題 — repo 實際狀態

**D1 · ADR 索引**

- 報告質疑：「ADR 從 H1-H9 成長到 H30+ 後，如何快速找到相關?目前是 grep?有 index 嗎?」（Code feedback line 126）
- repo 實況：✅ **已存在** `docs/governance/ADR-INDEX.md`（commit `cbf81cb`，2026-04-25）
- 內容：10 份 ADR 單頁索引（H1/H2/H5/H6/H7/H8/H9 + CON-v0.2/v0.3 + SKL-draft），含維護 SOP

**D2 · Handoff 生命週期**

- 報告質疑：handoffs/ 目錄結構是什麼?有 archive 嗎?
- repo 實況：✅ **archive 機制已存在**
  - `handoffs/done/` 目錄已建立，內含 16+ 份舊 handoff（worklog-2026-04-25.md 自述「目錄存在，內含 16 份舊 handoff」）
  - 本日新增兩次 handoff 歸檔 commit：`e0063f3`（H1-H9 立法 handoff）、`807fac2`（ADR-INDEX + branch protection handoff）
  - PENDING.md 同時加入待辦：「治理 hygiene：handoffs/ 根目錄仍有 8 份完成 handoff 待審視歸檔」（🟡 Cowork 待排）

**D3 · Immutable ADR 的工程基礎**

- 報告質疑：repo 是 public 嗎?有 branch protection 嗎?
- repo 實況：✅ **已稽核** `worklogs/branch-protection-audit-2026-04-25.md`（commit `d46ff7f`，2026-04-25）
- 稽核發現：
  - Force push 禁止 ✅、分支刪除禁止 ✅、Admin 不可繞過 ✅
  - PR 合併前必審 ❌、Linear history ❌、CI 狀態檢查 ❌
- 裁決（2026-04-25 Paul）：選 (b) 暫不啟用 PR 閘門；理由：force-push 禁止已滿足 immutable 工程核心需求；PR 閘門對單人 repo 屬過度工程；2026-06-25 觀察期結束後若有實際覆蓋 ADR 事故再重議

**D4 · 多 session 並行 race condition**

- 報告質疑：是否有實例?
- repo 實況：⚠️ **[資料缺失]** 無獨立稽核檔。但下列散落紀錄與此議題相關：
  - `worklogs/code--v5-1-D-cross-cowork-retro-2026-04-18.md`（v5.1 D 軌「跨 Cowork 撞車 retro」）
  - `worklogs/worklog-2026-04-25.md` Cowork section pitfalls 自述：「.git/index.lock 殘留：前一個 session（Apr 24 15:33）留下的 0-byte lock 檔，本 session sandbox uid 與前 session 不同，rm 無權限」
- D4 議題未獨立成 ADR 或稽核檔；散落實例存在但未集中盤點

### 3.3 H10-H30 ADR 編號的實際狀態

報告中提及 H10/H11/H12/H13/H30+ 的編號。對照 `docs/governance/ADR-INDEX.md` 實況：

| 編號 | 報告中的狀態 | repo 實況 |
|---|---|---|
| H1 | 已立法（v2.0 不爭議） | ✅ Accepted（adr-cloud-sync-protocol-2026-04-25.md） |
| H2 | 已立法 | ✅ Accepted |
| H3 | 凍結 | ⏸ 凍結（frozen-h1-h4-memo-2026-04-23.md，見 ADR-INDEX 「尚未立法的議題」段） |
| H4 | 凍結 | ⏸ 凍結 |
| H5 | 已立法 | ✅ Accepted |
| H6 | 已立法 | ✅ Accepted（2026-04-24） |
| H7 | 已立法 | ✅ Accepted |
| H8 | 已立法 | ✅ Accepted |
| H9 | 已立法 | ✅ Accepted |
| H10 | v1.0 提案、v2.0 撤銷 | ❌ ADR-INDEX 不存在 |
| H11 | v1.0 提案 | ❌ ADR-INDEX 不存在 |
| H12 | （未明確展開） | ❌ ADR-INDEX 不存在 |
| H13 | v1.0 末尾、v2.0 第一、v2.1 不立 | ❌ ADR-INDEX 不存在；PENDING.md 已 [-] 擱置 |
| H30+ | Code feedback 的假設情境 | ❌ ADR-INDEX 不存在（目前 ADR 總數 10） |

---

## 4. 已動工項（commit hash 對照）

按 `git log --since="2026-04-24"` 與 worklog 紀錄：

| commit | 主題 | 對應議題 |
|---|---|---|
| `cbf81cb` | docs(adr): add ADR-INDEX for single-page navigation | D1 ADR 索引 |
| `d46ff7f` | docs(governance): branch protection audit + park v2.0/v2.1 items | D3 branch protection 稽核 + v2.1 兩個月觀察期落地（PENDING.md 7 條 [-]） |
| `e0063f3` | chore(governance): archive H1-H9 legislative handoff to done/ | D2 handoff 生命週期 |
| `807fac2` | chore(governance): archive code handoff for ADR-INDEX + branch protection | D2 handoff 生命週期 |
| `279d62e` | docs(worklog): 追加 Cowork session H1-H9 handoff 歸檔紀錄 | worklog 2026-04-25 補登 |
| `ca53dc6` | docs(worklog): 追加 Code session handoff 收尾 + 歸檔紀錄（H8 四維度） | worklog 2026-04-25 補登 |

⚠️ 四份治理研究報告本身**尚未進 git**，目前未有對應 commit。

---

## 5. 資料缺失清單（誠實標註，不補）

### 5.1 真正的對話時間軸不在 repo 中

**[資料缺失]** 項目：v1.0 / v2.0 / v2.1 / Code Feedback 各自的「起草開始時間」「起草結束時間」「Paul 介入點」
- 已偵查路徑：`git log` / sandbox mtime / 報告 frontmatter / Issue #155 body + 4 comments / `worklogs/worklog-2026-04-25.md`
- 找不到的原因：四份報告未進 git；mtime 是 sandbox 同步時間非實際對話時間；Issue #155 comments 無相關紀錄
- 系統優化建議候選：Chat session 起草任何 framing-level 報告前，先寫一條 worklog entry 紀錄觸發脈絡（**屬建議，未經 Paul 批准，不視為決策**）

### 5.2 v2.0 疏漏 2 在 PENDING.md 缺漏

**[資料不一致]** 項目：v2.0 提出 7 項疏漏，PENDING.md 觀察期段落只 [-] 標 6 項（疏漏 1/3/4/5/6/7，缺 2）
- 不確認原因：可能合併、可能否決、可能漏寫
- 處理：**不自動補正**，本 worklog 標註不一致，由 Paul 裁決

### 5.3 v2.2 應由 Code session 真正產出

**[資料缺失]** 項目：v2.0 明文邀請「Code 讀完後寫一份 v2.2，從實作可行性挑戰」，但 repo 中只有 Chat 模擬 Code 視角產出的 Feedback（檔名 code--research-governance-gaps-v2-engineering-feedback-2026-04-25.md，frontmatter 自述為「Chat 於 Code 視角模擬」）
- 已偵查路徑：`docs/governance/` ls / `worklogs/` 4-25 worklog
- 影響：v2.0 三軌挑戰（Cowork v2.1 / Code v2.2 / Paul 三個月後重讀）只完成 1.5 軌
- 此事實本身可作為治理優化的參考素材

### 5.4 D4 多 session race condition 無獨立盤點

**[資料缺失]** 項目：D4 議題在 repo 中無集中盤點檔
- 已偵查路徑：`worklogs/` 全範圍 grep `governance` / D4 / race / 並發 / 撞車
- 散落紀錄存在於：`worklogs/code--v5-1-D-cross-cowork-retro-2026-04-18.md`、`worklogs/worklog-2026-04-25.md` (.git/index.lock 事件)
- 處理：**不主動建立 D4 盤點檔**（超出本 worklog 範圍，由 Paul 裁決是否升格）

---

## 附錄 A · 核心分工原則（Paul 2026-04-25 確認，handoff 內引用）

> 方向性判斷 = Paul；程式 / 資料整理 / 快速消化 = Claude（Chat / Cowork / Code）。
> 口述記憶不可信，剪貼指令是風險，唯一可信的事實源是 repo + worklog + GitHub Issue + handoff 檔案。
> 資料如果不在系統 log 裡，就是系統優化機會，不是用人腦補。

來源：handoff `cowork--worklog-governance-exploration-2026-04-25.md` 第 31-34 行，handoff 中 Paul 親自確認。

---

## 附錄 B · 四份報告引用清單

| # | 檔名 | 路徑 | 行數 |
|---|---|---|---|
| 1 | research-governance-gaps-vs-industry-2026-04-25.md（v1.0） | docs/governance/ | 655 |
| 2 | research-governance-gaps-vs-industry-2026-04-25-v2.md（v2.0） | docs/governance/ | 452 |
| 3 | research-governance-gaps-vs-industry-2026-04-25-v2.1-cowork.md（v2.1） | docs/governance/ | 182 |
| 4 | code--research-governance-gaps-v2-engineering-feedback-2026-04-25.md（Chat 模擬 Code 視角 Feedback） | docs/governance/ | 199 |

四份檔案目前 `git status` 皆為 untracked。

---

## 附錄 C · 偵查範圍

本 worklog 偵查涵蓋：

- `docs/governance/` ls + `git log --diff-filter=A --follow` 對四份報告（皆無紀錄）
- `git log --since="2026-04-24"` 25 條 commit
- `git status -s docs/governance/`
- `worklogs/PENDING.md` 全文檢索 `[-]` 與「觀察期」關鍵字
- `worklogs/worklog-2026-04-25.md` 全文
- `worklogs/branch-protection-audit-2026-04-25.md` 全文
- Issue #155 body（透過 GitHub MCP `get_issue`）
- Issue #155 4 則 comments（透過 GitHub REST API）
- `docs/governance/ADR-INDEX.md`
- 四份報告 frontmatter + 局部內文 grep（`H1[0-9]`、`Cowork`、`邀請`）

---

**產出者**：Cowork session
**對應 handoff**：`/Users/apple/Library/Application Support/Claude/local-agent-mode-sessions/.../uploads/cowork--worklog-governance-exploration-2026-04-25.md`
**狀態**：Draft（待 Paul 批准 commit + push）

---

## (c) ADR 起草階段補章 · 四維度（H8 格式）

- **執行 handoff**：`cowork--c-phase-adr-drafting-2026-04-25`（Paul 授權 Cowork 代打 Step 1+2）
- **產出時間**：2026-04-25 接續 (a) 階段同 session
- **裁決基準**：handoff 三件需裁決事項已由 Paul 答覆 — Q1 全進 git / Q2 補但限定 D1-D4 / Q3 上限 2 份用滿配額

### done

- 產出 Step 1 議題萃取裁決矩陣：`worklogs/cowork--c-phase-issue-extraction-matrix-2026-04-25.md`
  - 候選池 6 條（C1/C2/C3/C4 + Cowork 補充 C5a/C5b）
  - 三維度評分：C3 + C5a Accept、C1/C2/C4/C5b Reject
- 起草 ADR Draft #1：`docs/governance/adr-governance-research-git-discipline-2026-04-25.md`
  - 編號 H10、status: Proposed
  - 規範治理研究報告必須與 worklog 同 batch 進 git + Issue #155 同步紀律
  - 綁定 H7 lint Phase 2 增量項
- 起草 ADR Draft #2：`docs/governance/adr-zero-legislation-as-valid-outcome-2026-04-25.md`
  - 編號 H11、status: Proposed
  - 明文化「觀察期月度配額是上限不是 KPI」+「立法產量 0 是合法收尾」+「禁止為配額補位起草」
- 同步更新 `docs/governance/ADR-INDEX.md`
  - 總數 10 → 12（Accepted 9 / Draft 1 / Proposed 2）
  - 快速導航表加 H10/H11 兩行
  - 主題分組「憲法與治理框架」加 H10/H11
  - 編號說明補一句說明 H10/H11 為新議題重新使用（v1.0/v2.0 曾以 H10-H13 編號討論不同主題後撤銷）
  - 「尚未立法的議題」段補「2026-04-25 治理探索批次的明確排除」子段（C1/C2/C4/C5b 四條 Reject）
- 同步更新 `worklogs/PENDING.md`「明確排除（不進觀察期）」段
  - 加「2026-04-25 (c) ADR 階段裁決排除」子段，4 條 Reject 候選 + 理由 + memory 綁定
  - 觀察指標 1 註明「已用 2 份」+ 配額已滿
- 起草下一輪 Code session 用 handoff（D1-D4 落地檢查，限定範圍）— Step 7 進行中
- 準備 Issue #155 dashboard 同步 comment 草稿 — Step 8 進行中

### decisions

- **C3 與 C5a 同批次立 2 份 ADR、用滿月度配額**
  - 理由：兩條起草理由獨立——H10 解工程破洞（治理研究報告 untracked）+ H11 解管理迷思（配額誤讀），不是「為了用滿配額硬湊」
  - 緩解 self-serving 風險：H11 由 Cowork 起草+受益者也是 Cowork，但 status: Proposed 等 Chat 裁決（憲法第三條）
- **H10/H11 編號重新使用而非跳號到 H14**
  - 理由：v2.0 自己撤銷 H10 但未產出 ADR、v2.1 建議「不立 H13」也未產出 ADR，因此 H10-H13 編號未實質佔用
  - 跳號到 H14 反而加深「H10-H13 是禁忌」迷思
  - 緩解：INDEX 編號說明補一句註明此事，未來 retro 可追溯
- **裁決矩陣放 `worklogs/` 而非 `docs/governance/`**
  - 理由：屬「過程稿」性質（裁決矩陣）非「規範稿」（ADR），放 worklogs 更合適
  - 同時與 (a) 階段 worklog 並排好辨識（`worklog-2026-04-25-governance-exploration.md` ↔ `cowork--c-phase-issue-extraction-matrix-2026-04-25.md`）
- **ADR status: Proposed 而非 Accepted**
  - 理由：憲法第三條起草/裁決分離——Cowork 起草、status 預設 Proposed、ratified_by 留空，下一輪 Chat 裁決才升 Accepted
  - 與 H8 模板（drafted_by: Cowork-Opus-4.6, ratified_by: Chat-Opus-4.7）一致

### pitfalls

- 無實質踩坑（本階段純文件產出，無 sandbox / git / 工程衝突）
- handoff 「需裁決事項」Q1/Q2/Q3 設計到位，AskUserQuestion 一次取得三個答案，省去往返延遲

### abandoned

- **未自行裁決 C 系列議題的「不立法」改為「凍結」**
  - 考慮過：是否把 C1/C4 從 Reject 改為「凍結待解凍門檻」（如 H3/H4 那樣）
  - 放棄理由：handoff 「已知陷阱 §3 不替 v2.2 補軌」「§5 不超過月度 ADR 觀察指標」明確排除模糊處理；C1/C4 的 Reject 理由本身就是「無解定義戰」，沒有解凍門檻可寫
  - 處置：直接 Reject + PENDING.md 「明確排除」段登記，不留凍結口袋
- **未為 H11 加「補位 ADR」的回溯掃描機制**
  - 考慮過：H11 §三禁止為配額補位起草，是否該加一條「對既有 ADR 做回溯掃描，找出符合補位判別的 ADR 並降級」
  - 放棄理由：屬過度設計（既有 ADR 都已 Accepted 不該追溯）+ 工程成本（需重審所有 ADR）+ memory `feedback_incremental_fix_observe_before_automate` 的「先觀察再決定升級」原則
  - 處置：H11 第六條觸發條件 1 已預備未來糾偏機制，不需現在加回溯
- **未動 v2.0 疏漏 2 在 PENDING.md 缺漏的紀錄**
  - 考慮過：本 session 順手把 (a) 階段 §5.2 標的「v2.0 疏漏 2」缺漏跟 PENDING.md 「明確排除」段已有的 v2.0 疏漏 2 處理對照清晰
  - 放棄理由：(a) 階段 worklog 已含「事後處理紀錄」段落（line 126）說明 Paul 採選項 (B) 已處理；本階段不重複動作，避免兩處紀錄出現分歧
  - 處置：保留現狀
- **未撤稿 H11**
  - 考慮過：H11 由 Cowork 起草+受益者也是 Cowork，是否該主動撤稿避免「越權」嫌疑
  - 放棄理由：handoff §「需裁決事項」Q3 + Paul 「上限 2 份用滿配額」決策已含背書；status: Proposed 已是憲法第三條剛性核查的緩解；主動撤稿等於對 Paul 決策的二次質疑
  - 處置：保留 Proposed status，等 Chat 裁決
- **未自動執行 commit + push**
  - 理由：handoff §「已知陷阱 §7」+ 憲法第二條 + memory `feedback_oneliner_for_paul_terminal` 明文要求 commit/push 必須走 Paul 本機
  - 處置：本 session 結束時提供 oneliner 給 Paul

---

**(c) 階段產出者**：Cowork session（Sonnet 4.6）
**(c) 階段對應 handoff**：`cowork--c-phase-adr-drafting-2026-04-25`
**(c) 階段狀態**：Step 1+2 完成；Step 3 INDEX 同步完成；Step 4 worklog 補章完成（即本段）；Q2 Code handoff 起草中；Issue #155 同步 comment 起草中
**下一步**：Paul 在本機跑 git oneliner（commit + push）+ Chat 裁決 H10/H11 是否升 Accepted

---

## [wiki-youtube] 本機 cron 設定 — Issue #186

**時間**: 2026-04-25
**Commit**: c6a2db4

### 做了什麼

1. `scripts/wiki-youtube-ingest.cjs` 加 `--write-log` 旗標：跑完寫 `worklogs/wiki-youtube-daily-YYYY-MM-DD.md`
   - `pullPending()` return 值改為 `{ written, failed, remaining }`
   - `triggerIngest()` 相應調整
   - 加 log 寫出邏輯（只在 default pull 模式觸發）
2. launchd plist 建立並載入：`~/Library/LaunchAgents/tw.paulkuo.wiki-youtube.plist`（每日 09:50，自動 commit + push）
   - git commit 前加 `git diff --cached --quiet ||` 守衛，KV 空時不會失敗
3. 手動驗證：KV 有 7 支 pending，全部寫完，log 正確輸出 `新增: 7 / 失敗: 0 / 剩餘: 0`

### 決策原因

CF MCP 無 KV key 操作導致 Cowork Step 2 連兩天阻塞，拆出走本機 wrangler 是 Paul 2026-04-25 拍板的解法。

### 阻礙踩坑

- 無。腳本本體完整，工作僅是加旗標 + 設排程。

### 待辦（交 Paul 手動完成）

- [ ] Cowork 端 SKILL.md 移除 Step 2，改為讀本機 log（git pull 後才有當日資料）
- [ ] Issue #157 儀表板 Scheduled Tasks 表新增 wiki-youtube-local 一列
