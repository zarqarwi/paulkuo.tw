---
adr_id: adr-governance-research-git-discipline-2026-04-25
title: 治理研究報告的 git 紀律 — H10
status: Accepted
date: 2026-04-25
supersedes: []
related_adrs:
  - adr-collaboration-constitution-v0.2-2026-04-19
  - adr-governance-lint-he-lu-2026-04-25
  - adr-worklog-abandoned-dimension-2026-04-25
related_issues:
  - 155
ratified_by: Chat-Opus-4.7（2026-04-25）
drafted_by: Cowork-Opus-4.6
pillar: governance
---

# 治理研究報告的 git 紀律 — H10

## Context

### 立法動機

2026-04-25 「治理探索三輪迭代」產出四份治理研究報告（v1.0 / v2.0 / v2.1 / Code feedback），合計 1,488 行。Cowork (a) 階段事實重建發現：

```
?? docs/governance/research-governance-gaps-vs-industry-2026-04-25.md
?? docs/governance/research-governance-gaps-vs-industry-2026-04-25-v2.md
?? docs/governance/research-governance-gaps-vs-industry-2026-04-25-v2.1-cowork.md
?? docs/governance/code--research-governance-gaps-v2-engineering-feedback-2026-04-25.md
```

**四份檔案皆為 untracked + Issue #155 dashboard 無紀錄**。

`worklog-2026-04-25-governance-exploration.md` §0 開頭警示已揭露具體破洞：

> 真正的決策時間軸無法從 commit log 推導，只能從 sandbox mtime + 報告 frontmatter 自述的觸發語推導。

四份檔案的 sandbox mtime 落在 21 分鐘內（16:53 → 17:14），與「依序起草」的實際時長嚴重不符——這個區間長度只是「Paul 把 Chat 對話成果分批存檔到本機」的時間，不是真實對話時間軸。

**結論**：治理研究報告未進 git 是制度破洞（不是偶發疏忽），不修補下次仍會復發。

### 三維度評分（依 `feedback_three_dimension_decision_framework`）

| 維度 | 評分 | 理由 |
|---|---|---|
| 工程合理性 | 中-高 | git tracking 是工程議題；本批次案例已揭露具體破洞 |
| 邏輯可驗證性 | 高 | `git ls-files docs/governance/research-*.md` 可直接驗 |
| 管理可執行性 | 中-高 | 規則窄（產出 commit 必須與 worklog 同 batch），靠 commit-msg hook + lint Warning 提醒成本低 |

詳見 `worklogs/cowork--c-phase-issue-extraction-matrix-2026-04-25.md` §2 C3 段。

### 與既有 ADR 的關係

- **憲法 v0.2 第一條 SSoT**：worklog 已是治理事件歷史 SSoT（CLAUDE.md「Worklog 自動記錄」段強制），治理研究報告若不進 git，`docs/governance/` 內檔案無 SSoT 來源，事實基礎可能失聯
- **H7 ADR §五 Phase 2 增量**：H7 lint 已預留 Phase 2 擴充項，本 ADR 加一條檢查項（治理研究報告檔名 pattern 必須 tracked）
- **H8 ADR §三 強制性**：H8 對 worklog 四維度「沒有寫『無』」，本 ADR 對治理研究報告「沒進 git」，精神一致——強制顯性宣告，禁止默默漏接

---

## Decision

### 第一條 · 範圍界定

本 ADR 規範的「治理研究報告」範圍如下，所有滿足任一條件的檔案皆屬規範內：

| 路徑 pattern | 用途 |
|---|---|
| `docs/governance/research-*.md` | 治理現況研究、業界比對 |
| `docs/governance/*-research-*.md` | 同上（檔名前綴標 session 來源時） |
| `docs/governance/cowork--*.md` | Cowork session 產出的治理性報告（governance review、artifact） |
| `docs/governance/code--*-feedback-*.md` | Code session 對治理 ADR 的工程回饋 |
| `worklogs/cowork--*-matrix-*.md` | 跨 session 裁決矩陣、議題萃取矩陣（本 ADR 立法時的範本） |
| `worklogs/cowork--*-retro-*.md` | retro 報告 |
| `worklogs/cowork--*-handoff-*.md` | 跨 session handoff（如已歸檔則例外，見第二條） |

**排除**：

- ADR 本體（`docs/governance/adr-*.md`）—— 已由現有 SOP 強制 tracked
- 一般 worklog（`worklogs/worklog-YYYY-MM-DD*.md`）—— CLAUDE.md「Worklog 自動記錄」段已強制
- 私人筆記、草稿（`*.draft.md`、`.tmp.md`）—— 不屬治理研究產出

### 第二條 · 進 git 的時機與紀律

**第一款 · 同 batch 紀律**：

治理研究報告產出後，必須與「指認其產出脈絡的 worklog」**同一個 push batch** 進 git。

「同一個 push batch」定義：兩個 commit 之間沒有其他 push 事件分隔。允許分兩個 commit（一個 commit 加報告、一個 commit 加 worklog 引用），但中間不可 push。

**理由**：避免報告進 git 後 worklog 沒跟上，或 worklog 引用了未 tracked 的報告（如 (a) 階段 worklog 引用四份 untracked 報告的破洞）。

**第二款 · Issue #155 同步紀律**：

治理研究報告 push 後，**必須**在 24 小時內於 Issue #155 dashboard 同步一段 comment，內容含：

- 報告檔名
- 對應 commit hash
- 一句話摘要（≤ 100 字）

**理由**：Issue #155 是 Paul 跨視窗檢索的單一事實來源（依 memory `reference_status_sources`）。報告進 git 但 Issue #155 無紀錄等於「對 Paul 不可見」。

**第三款 · handoff 歸檔例外**：

`handoffs/done/` 下的歸檔 handoff 不適用本紀律——歸檔即代表脈絡已固化，不再產生新的決策事實。但**未歸檔的 handoff**（仍在 `handoffs/` 根目錄）若超過 7 天未進 git，視同違反第一款。

### 第三條 · 違憲救濟：H7 lint Phase 2 增量項

本 ADR 為 H7 lint Phase 2 提供以下擴充項：

**檢查規則 H7-Phase2-research-tracked**：

- **觸發時機**：commit-msg hook（push 前）
- **檢查內容**：對 `git diff --cached --name-only` 中匹配第一條 pattern 的檔案，確認檔案已 tracked（或本 commit 正在加入 tracking）
- **未通過行為**：Warning 級（不擋 commit），輸出訊息：「治理研究報告 `<path>` 未進 git tracking。依 H10 §二，治理研究報告必須與 worklog 同 batch 進 git。」
- **實作位置**：`scripts/governance-lint.sh`（H7 ADR §三實作）
- **實作期限**：本 ADR 升 Accepted 後 2 週內（與 H7 Phase 2 同期）

**為何用 Warning 而非 Error**：

依 H8 ADR §六與 H7 ADR §四的紀律一致——commit-time 的剛性檢查若過嚴會誤殺合理例外（例：Paul 手動 push 的測試 commit）。本 ADR 的精神是**提醒 + 紀錄**，不是強制阻擋。

### 第四條 · 對既有 untracked 報告的回溯處理

本 ADR 通過後，**現有四份 untracked 報告的處理方式**：

1. **進 git，但放在新建子目錄** `docs/governance/research-archive/`
   - 子目錄用途：明示這些是研究素材庫、含立場衝突的多輪迭代稿，**非定稿、不代表現行治理規則**
   - 避免「過程稿被當定稿展示」的問題（Q1 裁決時 Paul 已採納此設計）
2. **子目錄必須含 `README.md`**，內容明示：
   - 本目錄存放治理研究素材
   - 含 v1.0 / v2.0 / v2.1 / Code feedback 等多輪迭代稿，立場可能彼此衝突
   - 不是定稿、不代表現行治理規則
   - 引用時請註明是「研究稿」非「ADR」
3. **commit message 必須**標明本 ADR 編號 + research-archive 設計理由，例：

   ```
   docs(governance): archive 4 governance research reports per H10

   Move to docs/governance/research-archive/ to mark as research material,
   not authoritative governance documents. Per H10 §四 second clause.

   - research-governance-gaps-vs-industry-2026-04-25.md (v1.0)
   - research-governance-gaps-vs-industry-2026-04-25-v2.md (v2.0)
   - research-governance-gaps-vs-industry-2026-04-25-v2.1-cowork.md (v2.1)
   - code--research-governance-gaps-v2-engineering-feedback-2026-04-25.md
   ```

4. **同 push batch** 必須含 `worklog-2026-04-25-governance-exploration.md`（已 commit `988d685`）的引用——Issue #155 comment 同步 commit hash

**禁止**：

- 不允許重寫四份報告再進 git——保留事實衝突（v2.1 推翻 v2.0 部分）是事實基礎的一部分
- 不允許合併四份為一份「定稿」——四份的衝突點本身是治理研究素材
- 不允許把報告放在 `docs/governance/` 根目錄——必須在 research-archive 子目錄，避免與 ADR 視覺混淆

### 第五條 · 重新評估觸發條件

以下任一成立，重開 ADR 討論本條：

1. 連續 2 個月（自本 ADR 升 Accepted 後計）未產出治理研究報告 → 第一條範圍可能過寬，可降級為「按需建檔」
2. H7 lint Phase 2 實作後，本 ADR 觸發 false positive ≥ 3 次（誤判正當例外為違反） → 第二條紀律或第三條檢查邏輯需細化
3. Paul 在 retro 中明確表示「Issue #155 同步成本超過收益」 → 第二條第二款（24 小時同步）需重議

---

## Consequences

### 正面影響

- **治理研究素材庫不再散失**：本批次四份報告進 git 後，未來引用 v1.0/v2.0/v2.1 衝突點時可直接 grep + 看 commit history
- **Issue #155 真的成為 SSoT**：第二條第二款讓 Paul 跨視窗檢索時不會漏報告
- **本批次自身案例直接緩解**：(a) 階段 worklog §0 揭露的「決策時間軸不可從 commit log 推導」破洞，未來不再重演
- **與 H7/H8 一脈相承**：lint Warning 級護欄、強制顯性宣告、不擋 commit 但提醒——同套精神

### 負面影響

- **commit batch 紀律增加 Paul 心智負擔**：產出報告後必須記得加 worklog 引用 + Issue #155 comment。緩解：H7 lint Phase 2 加 Warning 提醒；commit-msg hook 文字直接給範本
- **24 小時 Issue 同步紀律可能誤殺週末產出**：週五產出的報告可能週一才同步。緩解：第二款只說「24 小時內」，未明文工作日；第五條觸發條件 3 留糾偏空間
- **第一條範圍未來可能需擴充**：新類型治理產出（例：podcast transcript、video script）若加入 docs/governance/，第一條 pattern 需更新。緩解：本 ADR 立法後仍可在 minor revision 擴充 pattern 清單，不需重立 ADR

### 中性觀察

- **本 ADR 不處理「治理研究報告品質」**：報告寫得好不好、framing 是否合理，不在本 ADR 範圍。第四條明文禁止合併「定稿」，正是因為品質問題不靠 git 紀律解，靠多視角挑戰機制（這個議題本批次 C2 已 Reject，留 case-by-case）
- **本 ADR 不解決「重複報告」**：同主題多輪報告（如本批次 v1.0 → v2.0 → v2.1）是否該合併、何時該歸檔，屬寫作策略問題不屬 git 紀律
- **本 ADR 與 H5 長度預算的潛在張力**：報告全進 git 後，`docs/governance/` 行數會擴大。緩解：H5 §三閾值機制是「自動觸發拆分」，本 ADR 不影響該機制運作；若四份報告合計 1,488 行讓 governance 目錄超閾值，由 H5 機制處理拆分

---

## Cross-References

### 依賴的 ADR（我需要這些先存在）

- `adr-collaboration-constitution-v0.2-2026-04-19.md` §2 第一條 SSoT：本 ADR 把治理研究報告納入 SSoT 治理範圍
- `adr-governance-lint-he-lu-2026-04-25.md`（H7）§五 Phase 2：本 ADR 第三條的 lint 增量項依賴 H7 的擴充機制

### 被依賴的 ADR / 機制（這些需要我存在）

- H7 ADR §五 Phase 2 的「H7-Phase2-research-tracked」檢查實作直接依賴本 ADR §一的 pattern 定義 + §二的紀律規則

### 相關但不依賴的檔案

- `worklogs/worklog-2026-04-25-governance-exploration.md` §0 + §5：本 ADR Context 的源頭事件依據
- `worklogs/cowork--c-phase-issue-extraction-matrix-2026-04-25.md` §2 C3：本 ADR 立法的三維度評分依據
- `docs/governance/research-governance-gaps-vs-industry-2026-04-25*.md` × 4 + `code--research-governance-gaps-v2-engineering-feedback-2026-04-25.md`：本 ADR 第四條的回溯處理對象
- 已存在的 `scripts/install-hooks.sh`（CLAUDE.md「新 Clone 後必做」）：第三條 lint 實作的工程基礎

---

## Appendix

### 附錄 A · 第一條 pattern 的 grep 指令範本

驗證本 ADR 是否有違規檔案的剛性檢查指令：

```bash
# 列出所有應 tracked 但 untracked 的治理研究報告
git status --porcelain | grep -E '^\?\? (docs/governance/(research-|cowork--|code--.*-feedback-)|worklogs/cowork--.*-(matrix|retro|handoff)-)'

# 列出 docs/governance/ 全部 untracked 檔案（含本 ADR 範圍外的）
git status --porcelain docs/governance/ | grep '^??'
```

H7 lint Phase 2 實作時可直接套用第一條指令的 regex。

### 附錄 B · 第二條第二款 Issue #155 comment 範本

```
H10 治理研究報告同步紀錄

- 檔名：{path/to/report.md}
- Commit：{hash}
- 摘要：{≤ 100 字}

依 H10 §二第二款。
```

### 附錄 C · 與 H8 ADR 的精神對照表

| 維度 | H8（worklog 四維度） | H10（本 ADR） |
|---|---|---|
| 規範對象 | worklog 段落結構 | 治理研究報告 git tracking |
| 強制機制 | 「沒有寫『無』」（顯性宣告） | 「沒進 git 標 Warning」（顯性提醒） |
| Lint 等級 | Warning（H7 Phase 2） | Warning（H7 Phase 2） |
| 違反後行為 | 不擋 commit，提示補寫 | 不擋 commit，提示補 track |
| 重新評估觸發 | 連續兩週全「無」 → 降級 | 連續 2 個月無報告 → 範圍縮窄 |

兩 ADR 同源於憲法第四條（記憶層次原則）+ H7 lint 機制，可並行實作不衝突。
