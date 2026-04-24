# chat--h1-h9-legislative-batch-2026-04-24

## Meta

- **Date**: 2026-04-24
- **From**: Cowork session（Opus 4.6）
- **To**: Chat（任一模型，Opus 4.7 / Sonnet 4.6 / Opus 4.6）
- **Source**: `worklogs/PENDING.md` 待 Chat 立法區（2026-04-24 下午由 Cowork 整理）
- **Scope**: 六項治理議題立法裁決 · 只列議題脈絡版
- **Status**: Proposed — awaiting Chat ratification

---

## ⚠️ Chat 必讀：本 handoff 的運作規則

### 1. 你的角色

依協作憲法 v0.2 第三條權責分工，**Chat 是立法部門**。本 handoff 的六項議題都屬憲法或實施細則層級的變更，只有 Chat 有權裁決。

Cowork 起草本 handoff 時**刻意不預寫 ADR 草稿**，理由：
- 避免 Cowork 的傾向植入框架、扭曲 Chat 獨立判斷
- 留完整立法邏輯鏈在 Chat 手裡
- 若 Chat 裁決品質退化，正好暴露 H2 結構問題，累積未來修憲證據

### 2. 你的結構性弱點要自覺

- **無法 Read 檔案核實**：本 handoff 引用的行數、版本號（如 SKILL.md 639 行、速記卡 238 行）皆為 Cowork artifact 二手數字，你無法直接查證。若精確數字對裁決重要，回答「此項需 Cowork 核實數字後再裁決」而非硬答。
- **長對話 context drift**：若六項一次處理導致後期判斷力下降，分批處理（例如先 H1/H2/H5 紅色，再 H7/H8 黃色，最後 H9 綠色）。
- **Cowork artifact 引用的是 repo 事實**：行數可能已隨 commit 改變，請以「當下 repo 狀態」為準而非本 handoff 凍結的快照。

### 3. 裁決格式（每項必填三欄位）

```
【裁決】Accept / Modify / Reject
【理由】（2-4 句話說明）
【後續動作】若 Accept：誰執行（Cowork / Code / Paul）+ 執行規格
           若 Modify：具體修改條目（逐點列出）
           若 Reject：是否重新評估的觸發條件
```

### 4. 五符號系統（2026-04-24 由 Cowork 拍板，PENDING.md 正式採用）

| 符號 | 狀態 | 意義 |
|---|---|---|
| `[ ]` | pending | 待處理 |
| `[~]` | in-progress | 進行中 |
| `[>]` | delegated | 已裁決授權，等下游視窗執行 |
| `[x]` | done | 完成結案（重大里程碑可加 ✅） |
| `[-]` | rejected | 明確拒絕 |

**Chat 裁決對應**：
- Accept + 需下游執行 → `[>]`
- Accept + Chat 已完成（純立法條文） → `[x]`
- Modify → `[ ]` 保持 pending，改寫議題內容
- Reject → `[-]`

### 5. 裁決結果寫回規範

**每項裁決後必做**：
1. 更新 `worklogs/PENDING.md` 對應議題的 checkbox 與狀態
2. 在議題下附裁決要旨（上述三欄位格式，簽名：「裁決：YYYY-MM-DD Chat-{model}」）
3. 若 Accept 產生新執行項（例如 H7 的 governance-lint.sh），Chat **不自己寫正式 ADR**，而是在 PENDING.md 加註「待 Cowork 起草正式 ADR 並執行」

**session 結束前**：
- 回報 Paul 裁決摘要（一行一項）
- 給 PENDING.md 修改的 diff（供 Paul commit）
- 給本機 commit oneliner

**不要做**：
- ❌ 不自行 `git mv` 本 handoff 到 `handoffs/done/`（Chat 沒 bash，由 Cowork 或 Paul 完成）
- ❌ 不自行寫正式 ADR 進 `docs/governance/`（那是 Cowork 執行階段的工作）
- ❌ 不改 `docs/governance/adr-collaboration-constitution-v0.2-*.md` 直接修憲（重大修憲需另開 constitution v0.3 ADR）

---

## 議題一覽（優先級建議）

| ID | 議題 | 優先級 | 建議批次 |
|---|---|---|---|
| H1 | cloud 層同步機制缺失 | 🔴 | 批次 1 |
| H2 | Chat 精確事實查詢結構性上限（含 A3 併入） | 🔴 | 批次 1 |
| H5 | 長度邊緣文件拆分計畫 | 🔴 | 批次 1 |
| H7 | governance-lint.sh 他律防線 | 🟡 | 批次 2 |
| H8 | Worklog 加第四維度 abandoned | 🟡 | 批次 2 |
| H9 | L3 操作 SOP 定位釐清 | 🟢 | 批次 3 |

**建議**：三批次處理，避免六項一次 context drift。若必須一次處理，至少先做批次 1（紅色議題）。

---

## H1 · cloud 層同步機制缺失

**背景**（此段已由命名消歧 ADR 確認，名詞已採 β 方案）：
- **cloud 層** = Claude.ai 雲端 Personal Skill
- **repo 層** = paulkuo.tw repo `.claude/skills/`（SSoT）
- 憲法第二條：cloud 層永遠是 repo 層的下游 mirror

**問題**：
- 2026-04-17 起 cloud 層凍結於 session-handoff v4.13
- repo 層已到 v5.6，兩端版本脫鉤 7 天（至 2026-04-24）
- 憲法第二條明文「cloud 層下游 mirror」，但無配套同步機制
- 手動同步的前提是 Paul 要知道 repo 層版本變化，目前靠 Cowork 每次 session 提醒，不可靠

**需 Chat 立法決定**：
1. **同步協議由誰按**：Paul 手動 / Cowork 起草通知 / Code commit 後自動產生通知 / 其他？
2. **同步頻率**：每個 minor 版 / 每個 major 版 / 每週批次 / 其他？
3. **驗證方式**：版本號比對 / diff 比對 / 完全 verbatim mirror？
4. **cloud 層無法自動控制時的治理原則**：若 Paul 忘記同步，如何止血？（例：Cowork 開場主動檢查 cloud 層對齊版本）

**Cowork 已有的參考資料**：
- `docs/governance/c-layer-snapshot.md` 是 cloud 層 session-handoff 的人工快照，目前對齊 repo 層 v5.6
- 該檔已內含「版本回答規則」：被問版本時回答「cloud 層 v1.0，對齊 repo 層 v5.6」
- 若 repo 層超過對齊版本 ≥ 2 minor，cloud 層會主動提示「可能需要更新」

**Chat 裁決範例（示範格式，不代表傾向）**：
```
【裁決】Accept
【理由】cloud 層為下游 mirror 的憲法規範若無同步配套，實質是死條文。同意立法建立協議。
【後續動作】
  - 由 Cowork 起草正式 ADR `adr-cloud-sync-protocol-2026-04-XX.md`
  - 協議內容：{Chat 填}
  - 執行：Cowork 寫 ADR → Paul commit → Chat 下次 session 驗收採納
```

---

## H2 · Chat 精確事實查詢結構性上限（含 A3 併入）

**背景**：
- 2026-04-20 治理考試結果：Code 97% / Chat 77% / Cowork 70%
- 2026-04-24 Chat 評審 Cowork artifact 時引用 F-ID 皆為二手數字（Cowork artifact 拷貝），無法核實
- 此非 bug，是結構性：Chat 無 Read 工具，無法觸達 A 層（repo）事實

**A3 併入說明**：
- Chat 原在 `cowork--governance-architecture-review-2026-04-24.md` A3 建議「Paul 每次貼 skill 摘要」
- Paul + Cowork 一致認為：此方案違反「被動文件不等於主動防線」（依賴人工執行），併入 H2 本體

**需 Chat 立法決定**：
1. **觸發句型白名單**：哪些問題 Chat 必須 reflexive 拒答並引導？候選：
   - 版本號（「X 目前第幾版？」）
   - 行數（「Y 有幾行？」）
   - commit hash
   - 清單項數（「有幾個 pillar？」）
   - 時序狀態（「Z 最後一次更新是什麼時候？」）
2. **拒答時的標準回應模板**：
   - 範例：「此問題涉及精確事實，Chat 結構性不可靠（憲法實施細則 §X）。請用 Cowork 查 A 層或 Code Read 核查。」
   - 是否要自動附上「如何在 Cowork 查」的具體指令？
3. **例外情況**：Chat 能答的精確事實有哪些（例：憲法五條條文本身、公開文件頁數）？
4. **寫入位置**：新增 WE 條款 §X / 新增速記卡情境 10 / 新增 SKILL.md 段落 / 全部都寫？

**Cowork 佐證 H2 為結構問題的新證據**：
- Chat 產出 `cowork--governance-architecture-review-2026-04-24.md` 時引用：
  - F-skill-v5.6: session-handoff SKILL.md（639 行）
  - F-cheatsheet-rev2: 速記卡 rev2（238 行）
  - F-constitution-v0.2: 憲法（299 行）
- 這些行數 Chat 無法直接 Read 驗證，全部從 Cowork artifact 拷貝
- Chat 自己不自知，當成「源頭事實」引用——這本身就是 H2 要處理的現象

---

## H5 · 長度邊緣文件拆分計畫

**背景**：
WE §4 定義 Skill/CLAUDE.md 三層閾值：
- Soft limit: 200 行
- Hard limit: 800 行（SKILL.md） / 900 行（CLAUDE.md）
- 超軟上限應啟動判斷樹

**當前狀態**（Cowork 2026-04-24 artifact 記載，Chat 需 Cowork 核實數字）：
- 速記卡 rev2: 238 行（已超軟上限 19%）
- session-handoff SKILL.md: 639 行（77% of 800 觸發點）
- CLAUDE.md: 200 行（卡軟上限）
- 三份文件同時在長度邊緣

**需 Chat 立法決定**：
1. **「超軟上限自動開拆分 ADR」觸發規則**：
   - 觸發點候選：超軟上限 10% / 15% / 20% / 其他？
   - 觸發後誰開 ADR：Cowork 司法 / Code handoff 到 Cowork / 其他？
2. **是否立即對三份文件各開拆分 ADR**：
   - 速記卡：候選方案「情境案例抽到 constitution-v0.2-scenarios.md，速記卡縮回 180 行」
   - SKILL.md：v5.0 結構重組（記憶中既有提案）/ 拆 metrics+pipeline 到獨立檔
   - CLAUDE.md：WE §4.3 判斷樹直接執行（新規則一律進子文件，不動 CLAUDE.md）
3. **是否建立 `docs/governance/length-budget-status.md`**：集中追蹤所有治理文件長度，由腳本或 hook 定期更新

**潛在取捨**：
- 過度拆分 → 治理文件碎片化，Cowork 開場讀取負擔增加
- 不拆分 → 撞硬上限時被迫重構，風險大

---

## H7 · governance-lint.sh 他律防線

**背景**：
- 目前違憲救濟只有自律（速記卡自檢清單 8 項）
- auto-memory `project_guardrail_structural_hole.md` 記載「對話瞬時判斷無書面痕跡」盲點（N=1，候選 C6/E1）
- 純自律在 N=1 時已失靈

**需 Chat 立法決定**：
1. **可機器化檢查的條款清單**（Chat 圈選哪些納入）：
   - Handoff ADR Status + Consequences 欄位必填
   - F-ID 格式規範（F-{name}-{date}）
   - 源頭事實引用的跨載體一致性
   - skill frontmatter pillar 白名單（已有 `skill-schema-lint.sh`，擴充即可）
   - PENDING.md checkbox 五符號系統
   - 其他 Chat 認為重要的？
2. **攔截策略**：
   - 直接擋 commit（嚴格）
   - 警告但允許（寬鬆）
   - 分級：某些擋、某些警告
3. **掛載點**：
   - pre-commit hook（commit 前擋）
   - commit-msg hook（擴充既有 hook）
   - CI-only（push 後才跑）
4. **違規處理**：
   - Paul 單人可 `--no-verify` 跳過？
   - 跳過時強制寫 worklog 說明？

---

## H8 · Worklog 加第四維度 abandoned

**背景**：
- 現行 worklog 三維度：做了什麼 / 決策 / 踩坑
- 缺「放棄了什麼 + 為什麼放棄」維度
- 例：Cowork 本 session 曾考慮「為 H6 預寫 ADR 草稿」後放棄（見 2026-04-24 下午 worklog 決策紀錄），這類「不選的路」目前只能散在決策欄
- 長期問題：被否決的方案缺紀錄，容易重複提案（如 H4 治理考試發現的 memory lag 現象）

**需 Chat 立法決定**：
1. **是否採納四維度**：
2. **「放棄」的定義**：
   - 僅限本 session 內評估後放棄？
   - 或包含跨 session 的「被討論但未採納的方案」？
3. **強制性**：
   - 無論如何都要寫「無」（如現行三維度）
   - 還是只在確實有放棄方案時才寫
4. **寫入範圍**：
   - `docs/governance/worklog-format.md` 是 SSoT，改這個
   - session-handoff SKILL.md / 速記卡 / CLAUDE.md 同步引用

---

## H9 · L3 操作 SOP 定位釐清

**背景**：
- Cowork 2026-04-24 artifact 的治理分層架構圖分 L1-L5 共五層
- L2 = working-environment.md（實施細則，§1-§9）
- L3 = working-environment.md §5（操作 SOP，2026-04-24 新增）+ 速記卡
- **問題**：L3 實際上就是 L2 的一部分（§5 是 WE 內部章節），但架構圖把它拉出來視為獨立層，有邏輯重疊

**需 Chat 立法決定（三選項）**：

**選項 A · 合併**：L3 併回 L2，治理架構從五層改四層
- 優點：邏輯乾淨，一份文件一層
- 缺點：L2 變巨（WE 已 629 行），§5 在結構圖失去視覺權重

**選項 B · 拆分**：L2 拆成「原則篇」（留 L2）+「操作篇」（升到 L3 獨立文件）
- 優點：L2 瘦身到 400 行以下，§5 正式獨立成 operational SOPs 文件
- 缺點：WE 被切成兩半，跨引用成本增加；涉及實質文件重構

**選項 C · 維持現狀 + 明確寫作規則**：L2/L3 都在 WE 裡，但定義清楚「L3 只收跨三窗的操作流程，其他留 L2」
- 優點：不動實質結構
- 缺點：分層概念模糊，未來新規則又會有「該寫 L2 還 L3」的猶豫

---

## 六項裁決完成後的執行流程

```
Chat 完成六項裁決
  ↓
[Chat 必做] 更新 PENDING.md 六項狀態 + 附裁決要旨
  ↓
[Chat 回報 Paul] 裁決摘要 + PENDING.md diff + commit oneliner
  ↓
[Paul 本機] commit + push
  ↓
[下次 Cowork session] 開場讀 PENDING.md
  ↓ 看到 Chat 裁決結果
  ↓ Accept 的議題按授權起草正式 ADR 並執行
  ↓ 本 handoff git mv 到 handoffs/done/
  ↓ Paul commit + push 歸檔
```

---

## 來源事實（F-ID）

**提醒 Chat**：以下行數為 Cowork 2026-04-24 artifact 的二手引用，請 Cowork 核實現況後再採用。

- F-governance-snapshot-2026-04-24: artifact `paulkuo-governance-architecture-2026-04-24`
- F-constitution-v0.2: `docs/governance/adr-collaboration-constitution-v0.2-2026-04-19.md`
- F-we-rev2.3: `docs/governance/working-environment.md`
- F-cheatsheet-rev2: `docs/governance/constitution-v0.2-quick-reference.md`
- F-skill-v5.6: `.claude/skills/session-handoff/SKILL.md`
- F-pending-md: `worklogs/PENDING.md`（本 handoff 的對照點）
- F-adr-naming-resolution: `docs/governance/adr-naming-conflict-resolution-2026-04-24.md`（H6 β 方案基礎）
- F-chat-review-input: `cowork--governance-architecture-review-2026-04-24.md`（本 handoff 源起）

---

## 附錄：Chat 完成裁決後的 PENDING.md diff 範例

**範例（H6 已完成的範本，Chat 可照此格式更新六項）**：

```markdown
- [x] ✅ H6：A/B/C 命名衝突消歧 → 已解決（2026-04-24 β 方案採納）
  - 問題：...
  - 解決：Paul 拍板 β 方案 — ...
  - 執行結果：...
```

**Chat 對 H1-H5/H7/H8/H9 的預期更新**：

```markdown
- [>] 🔴 H1：cloud 層同步機制缺失 → 已授權 Cowork 起草 ADR (2026-04-24)
  - 原議題：...（保留原文）
  - **裁決：Accept (2026-04-24 Chat-{model})**
  - 理由：...
  - 後續動作：待 Cowork 起草 `adr-cloud-sync-protocol-2026-04-XX.md`，執行規格：...
```

或：

```markdown
- [ ] 🔴 H5：長度邊緣文件拆分計畫（Modified） → Chat 立法 (2026-04-24)
  - 原議題：...
  - **裁決：Modify (2026-04-24 Chat-{model})**
  - 修改條目：
    1. ...
    2. ...
  - 重新提交：下次 Chat session
```

或：

```markdown
- [-] 🟢 H9：L3 定位 → 駁回 (2026-04-24)
  - 原議題：...
  - **裁決：Reject (2026-04-24 Chat-{model})**
  - 理由：選項 C 維持現狀成本最低，暫不動結構
  - 重新評估觸發：新增第三條操作 SOP 時重新檢視
```

---

## Signature

- **起草**：Cowork session（Opus 4.6），2026-04-24
- **Status**：Proposed — awaiting Chat ratification
- **預期處理**：下次 Chat session（分 3 批次為佳，一次處理完亦可）
- **歸檔**：裁決完成後由 Cowork 或 Paul 本機 `git mv` 到 `handoffs/done/`
