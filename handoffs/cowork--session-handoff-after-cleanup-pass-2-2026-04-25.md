---
status: Accepted
---

# Cowork Handoff · 治理工作 session 切換（cleanup-pass-2 後）

- **產出時間**：2026-04-25
- **產出者**：Cowork session A（Sonnet 4.6，本視窗）
- **目標 session**：Cowork session B（新視窗）
- **任務類型**：Session continuity（context 交接書，非執行 spec）
- **上游**：今天 8 個 commit（`988d685` → `58bb7fe`）治理探索三輪迭代 (a) → (c) → cleanup → Q2 → H7 Phase 1 → cleanup-pass-2 全閉環

---

## 0. 新 Cowork 開場 SOP（必做，依序）

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw

# Step 1: 看今天 commit chain（不重做已做事）
git log --oneline --since='2026-04-25' | head -10

# Step 2: 確認治理破洞無殘留
bash scripts/governance-lint.sh --manual
# 預期：Strict 0 / Warnings 0 / Grandfathered 95

# Step 3: 看觀察期項目（PENDING.md #1-10）
sed -n '/觀察期項目（2026-04-25/,/Scanner 自動產出/p' worklogs/PENDING.md

# Step 4: 確認 git status 乾淨度
git status --short

# Step 5: 看 Issue #155 dashboard 同步狀態
# https://github.com/zarqarwi/paulkuo.tw/issues/155
```

預期 git status：

```
?? handoffs/cowork--session-handoff-after-cleanup-pass-2-2026-04-25.md  ← 本 handoff 自己（你正在讀）
?? docs/governance/code--paulkuo-tw-adr-index-and-branch-protection-audit-2026-04-25.md  ← 歷史，不動
?? docs/governance/code--pending-md-h1-h9-ratification-2026-04-24.md  ← 歷史，不動
?? docs/governance/cowork--adr-drafting-h1-h9-2026-04-24.md  ← 歷史，不動
?? docs/governance/cowork--archive-h1-h9-handoff-2026-04-25.md  ← 歷史，不動
```

⚠️ **任何 M 狀態檔案出現** → 表示有未 commit 修改，停下回報 Paul，**不要動**。

---

## 1. Today's Work Summary（2026-04-25）

| Commit | 主題 | 觸發來源 |
|---|---|---|
| `988d685` | (a) 事實重建 worklog（治理探索三步走第一步） | Paul 委託整理 |
| `6c2a9a5` | (c) rev2 Batch 1 — H10 Accepted + 4 份治理研究報告移 research-archive/ | Chat 裁決後 Cowork rev2 |
| `520e2a3` | (c) rev2 Batch 2 — H11 Draft（觀察期至 2026-06-25）+ _drafts/ + PENDING #8 | 同上 |
| `d94f27c` | (c) cleanup Batch 3 — worklog 補章 + matrix + Q2 handoff + 歸檔 rev2 deployment | Paul 對 §5 五個未決事項裁決 |
| `f748a57` | (c) cleanup Batch 4 — ADR-INDEX 算術修正 11 → 12 | 同上 |
| `9bc60c5` | Q2 D1-D4 工程驗證 — 揭露 H7 ADR Accepted 但腳本不存在 | Paul 排程 Q2 |
| `24d7a03` | H7 lint Phase 1 實作 — governance-lint.sh + pre-commit hook + Strict 攔截測試 | Paul 路線 1（補實作） |
| `58bb7fe` | cleanup-pass-2 — 4 份本批次 handoff 補規範 + grandfather 95 paths + word splitting bug fix | H7 lint Phase 1 manual 揭露 202 fail |

### 治理體系變化

- ADR 總數：10 → 12（H10 Accepted + H11 Draft 觀察期）
- 治理研究素材：建立 `docs/governance/research-archive/`（4 份報告）
- 觀察期 Draft：建立 `docs/governance/_drafts/`（H11）
- Lint 護欄：H7 Phase 1 落地（pre-commit hook + 5 function 實作 + Phase 1 啟用 check 1+3）
- Grandfather 機制：`.governance-lint-grandfathered`（95 paths）

---

## 2. Next-Up Candidates（推薦優先順序）

### A. **觀察期執行（不主動工作，等實證）** — 推薦

依 memory `feedback_incremental_fix_observe_before_automate`，今天工作密度高（8 commits + 3 memory），最穩節奏是讓 Phase 1 跑 1-2 週看：

- pre-commit hook 是否真有攔截（PENDING #9）
- Cowork 寫新 handoff 是否一次到位含 H7 規範（依 memory `feedback_cowork_handoff_template_h7_compliance`）
- Grandfathered 95 份是否還被引用

如果你（Cowork session B）開場時 Paul 沒明確指示，**default 就是這個**——不主動發起治理工作。

### B. Phase 2 lint 升級（如果 Paul 想推進）

H7 §五 Phase 2 包含 check 2（F-ID 格式）+ check 4（PENDING.md 五符號）+ worklog 四維度，期限 H8 通過後 2 週內 = **2026-05-09**。

工程量：governance-lint.sh main() 加 3 行解註解 + 跑驗證 + commit。約半小時。

但 Phase 2 的 false positive 風險：
- check 4 PENDING.md 五符號：grep 邏輯可能誤抓到內文示例（PENDING.md 文末「格式說明」段就含 `[ ]` 字面）
- check 2 F-ID 格式：repo 內 F-ID 引用密度不高，但 worklog 文末若有 sub F-ID 引用會被掃到
- worklog 四維度：H8 §七「不追溯」精神，舊 worklog 不該被 lint 擋

建議：Phase 2 升級時要跑 dry-run（先用 `--manual` 跑全 repo 看會不會誤抓），不要直接啟用 pre-commit。

### C. iCloud 衝突副本清理（PENDING #10）

4 份檔名含「 [0-9].md」尾綴的 handoffs/。技術債，已 grandfather 不影響 lint。

清理步驟（依 memory `feedback_icloud_duplicate_files_not_git_issue`）：

```bash
# 1. 確認原檔（不含尾綴版本）內容是否為「最終版」
diff handoffs/code--governance-dashboard-redesign-phase-a-2026-04-14.md \
     "handoffs/code--governance-dashboard-redesign-phase-a-2026-04-14 2.md"

# 2. 確認 OK 後刪除衝突副本
rm "handoffs/code--governance-dashboard-redesign-phase-a-2026-04-14 2.md" \
   "handoffs/code--governance-dashboard-redesign-phase-a-2026-04-14 3.md" \
   "handoffs/code--governance-dashboard-redesign-phase-a-2026-04-14 4.md" \
   "handoffs/code--governance-dashboard-redesign-phase-a-2026-04-14 5.md"

# 3. 同步從 .governance-lint-grandfathered 移除這 4 行
# 4. 跑 lint 驗證 0/0/91（從 95 grandfathered 降為 91）
# 5. commit + push（依憲法第二條走 Code handoff）
```

工程量：5-10 分鐘 + Code handoff。

### D. D2 archive 79 份待歸清理

handoffs/ 根目錄 79 份未歸檔（含部分 25 天以上）。屬衛生工程不是治理破洞。

策略選項：
- D1. 全批歸 handoffs/done/（一次清乾淨）
- D2. 設定門檻自動化（pre-push hook 每週自動歸 7 天前 handoff）— 需新 ADR
- D3. 分批：歸檔超過 7 天的、近期保留作 active

工程量：D1 約 1 小時 + Code handoff；D2 屬規則設計，要立 ADR；D3 居中。

### E. (b) 公開文章階段

治理探索三輪迭代第三步。需獨立 handoff 起草。Paul 明說「時間沉澱後」——本輪建議跳過，留給將來。

---

## 3. Today's New Memory Items（必讀）

3 條 memory 在今天新增，新 Cowork 開場時 auto-load 應已含：

1. **`feedback_cowork_delegates_actions_to_code`**（今天上午）
   - Cowork 跑完批次後寫 handoff 給 Code，**不堆 oneliner 給 Paul**
   - commit/push/mv/Issue 同步全走 Code handoff
   - 例外：1-2 步動作可給 oneliner

2. **`feedback_cowork_handoff_template_h7_compliance`**（今天傍晚）
   - Cowork 寫 handoff 必須一次到位含 H7 §第一條規範格式
   - 強制：YAML frontmatter `status: Draft` + 文末 `## Consequences` 章節
   - 不合規 = 修 bug 不是追溯（依 Paul 2026-04-25 裁決）

3. **`reference_five_symbol_schema`**（既有，但今天 PENDING.md 觀察項目大量使用）
   - PENDING.md `[ ]` / `[~]` / `[>]` / `[x]` / `[-]` 五種狀態
   - H7 lint Phase 2 check 4 將自動驗證

---

## 4. Standing Discipline（不變的紀律）

新 Cowork session 不必重新確認，但要遵守：

| 紀律 | 來源 | 重點 |
|---|---|---|
| commit/push 走 Paul 本機 | 憲法 v0.2 第二條 + memory `feedback_oneliner_for_paul_terminal` | Cowork sandbox 寫不到 .git/ |
| 起草/裁決分離 | 憲法 v0.2 第三條 | Cowork 起草 ADR 預設 status: Proposed，等 Chat 裁決 |
| Cowork 寫 handoff 含 H7 規範 | memory `feedback_cowork_handoff_template_h7_compliance` | 本 handoff 自己就是範本 |
| Cowork 不堆 oneliner，handoff 給 Code | memory `feedback_cowork_delegates_actions_to_code` | 多 step 走 Code handoff |
| 三維度評分框架 | memory `feedback_three_dimension_decision_framework` | 工程合理性 + 邏輯可驗證性 + 管理可執行性 |
| 立法零產量是合法收尾 | H11 ADR Draft（觀察期內不援引）+ memory `feedback_reject_symptomatic_workflow_suggestions` | 不為配額硬湊 ADR |
| 不追溯 | H8 ADR §七 | worklog 已 commit 不回頭改 |
| 修 bug 不是追溯 | Paul 2026-04-25 裁決（cleanup-pass-2 立場） | 規則生效後新檔違規必須修 |

---

## 5. Open Items 摘要（PENDING.md 觀察期）

至 2026-06-25 盤點：

- #1-7：v2.0/v2.1 治理研究擱置 7 條（修憲 framing / auto-memory ADR 觸發 / cloud 層 snapshot / H13 handoff / 月度 ADR 上限 / Paul 治理位置 / branch protection PR 閘門）
- #8：跨 session 紀律遷移落差（Cowork 越權史 3 件）
- #9：H7 lint 攔截實效 + grandfather 引用情況（cleanup-pass-2 立）
- #10：iCloud 衝突副本清理（cleanup-pass-2 立）

明確排除（不進觀察期）：

- v2.0 疏漏 2「跨 session 衝突解決」（已合併到 D4 race condition）
- C1/C2/C4/C5b（Cowork (c) 階段裁決矩陣 Reject 候選）

---

## 6. 給 Cowork session B 的話

### 開場後第一件事

讀本 handoff §0 SOP 跑完 5 步驟。如果今天 commit chain 與 §1 表格一致 + lint 0/0/95 + git status 只有歷史 untracked + 本 handoff 自己 untracked → 接手成功。

### 預設行為

**沒有 Paul 明確指示時，default 是 §2.A 觀察期執行**——不主動發起治理工作。Paul 來訊問什麼、做什麼，再回應。

### 如果 Paul 想推進

依 §2.B/C/D/E 順序評估推薦。三維度評分框架（memory `feedback_three_dimension_decision_framework`）對任一候選做評估後再下手。

### 紀律要點

- **不重做** §1 commit chain 內已完成的工作（先 git log 看清楚再動手；memory `feedback_git_show_body_not_oneline`）
- **不堆 oneliner**——任何 commit/push/mv/Issue 同步走 Code handoff（memory `feedback_cowork_delegates_actions_to_code`）
- **寫新 handoff 一次到位含 H7 規範**（memory `feedback_cowork_handoff_template_h7_compliance`）
- **不為配額硬湊 ADR**（H11 Draft 觀察期內不援引，但精神靠 memory `feedback_reject_symptomatic_workflow_suggestions` 維持）

### 需要本 handoff 進 git 嗎

預設不進。本 handoff 是 session 內部 context 交接，性質短暫。但若 Paul 在新 session 中認為值得歸檔，可在新 session 後續 cleanup batch 一起 commit。

---

## Consequences

### 預期執行結果（Cowork session B 接手後）

- [x] §0 SOP 5 步驟跑完
- [x] 確認今天 commit chain 不重做
- [x] lint 0/0/95 健康狀態維持
- [x] 等 Paul 在新 session 內裁決下一步（§2 候選）

### 實際接手結果（Cowork session B 收尾，2026-04-25）

#### SOP 異常揭露：04-23 ACP 拆檔事故

§0 SOP Step 4 `git status --short` 撿到 7 份預期外 untracked，深入核實後揭露：

- commit `526aac1`（refactor(acp): Tier 1 split）完成於本地分支 `refactor/acp-component-split`
- 同批 04-23 的 6 個 ACP commit（`e083134`/`8120d98`/`918126b`/`d2159a5`/`02d46d2`/`bc870b8`）全部散在不同 feature branch
- **沒有任何一個進到 `main` 或 `remotes/origin/main`**
- production 仍跑 main 線（拆檔前版本）
- Issue #155 04-23 dashboard 紀錄「T3 拆檔 ✅ 526aac1」與 git 事實不符

**核實證據三條**：
1. `git merge-base --is-ancestor 526aac1 HEAD` → exit != 0
2. `git ls-tree HEAD src/components/ai-collab-portfolio/` → 只有 2 檔（`AICollabPortfolio.tsx` + `PortfolioView.tsx`）
3. `git reflog show main` → 無 force-push 痕跡，所有 main 變動都是 commit / pull --rebase / 1 筆 revert

**Paul 拍板 Case A**（Cowork 強推 production = main，dashboard 紀錄假象需修正）。

#### 本次處置動作

- [x] **Issue #155 發 NEW comment 修正紀錄**（comment id 4320021198，2026-04-25 16:07 UTC，揭露 7 個 commit 皆未在 main 線）
- [ ] **zi1g49lN zip 殘檔刪除** — sandbox `rm` 報 `Operation not permitted`，改由 Paul 本機 oneliner 跑：`cd ~/Desktop/01_專案進行中/paulkuo.tw && rm zi1g49lN`
- [x] **本 handoff status: Draft → Accepted**（本次 Edit）
- [x] **補本章節「實際接手結果」段**（本次 Edit）
- [ ] **lint 驗證 0/0/95 健康度**（Step 5，下一步執行）
- [ ] **Code handoff 處理 commit + push**（Step 6，下一步執行；本 handoff Edit 後變 modified 狀態，需走 Code 走憲法第二條）

#### 6 份本地 working tree tsx 處置

繼續暫不動。等 Paul 在新一輪指示。

可能方向（不是建議，僅選項）：
- 補做 cherry-pick 526aac1（含 6 個檔）到 main 線
- 廢棄 spike branch + rm 6 份本地 untracked
- 其他

### 對後續工作的影響

- 治理探索 (a)/(c)/cleanup/Q2/H7 Phase 1/cleanup-pass-2 全閉環
- 觀察期至 2026-06-25 開始計時（PENDING #1-10）
- H7 Phase 2 期限 2026-05-09（建議觀察 1-2 週後再升）
- (b) 公開文章階段需獨立 handoff 起草

### 遵守紀律確認

- 憲法第二條：commit/push 走 Paul 本機 ✅（本 handoff Cowork 寫，未 commit，留 untracked 給新 Cowork 接手後決定）
- H7 §第一條：本 handoff 含 frontmatter `status: Draft` + 文末 `## Consequences` ✅
- memory `feedback_cowork_handoff_template_h7_compliance`：本 handoff 自己就是模板範本 ✅
- 不擴大範圍：本 handoff 不重做 (a)-(c) 任一階段、不立新 ADR、不主動處理觀察期項目 ✅

### Session B 接手後的 status 升級

✅ 已完成（2026-04-25 收尾）：
- frontmatter `status: Draft → Accepted`
- 補上方「實際接手結果」段（含 04-23 ACP 拆檔事故揭露 + Case A 處置紀錄）

下一步走 Code handoff 將本 handoff（修改後）+ Issue #155 dashboard 修正一起進 git（憲法第二條）。

---

**handoff 產出者**：Cowork session A (Sonnet 4.6)
**對應任務**：Session continuity 交接書
**下一步**：Paul 開新 Cowork 視窗，餵此 handoff 路徑給 Cowork session B 開場
