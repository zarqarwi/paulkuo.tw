# code--repo-hygiene-icloud-residue-2026-04-24

## Meta

- **Date**: 2026-04-24
- **From**: Cowork session（Opus 4.6）
- **To**: Code session（建議 Sonnet 4.6；Opus 4.6 僅在偵查階段卡關時升級）
- **Scope**: Repo 殘渣清理 + 補 commit 合法治理檔 + data/ 目錄策略判斷
- **Status**: Proposed — 待 Code 偵查後提決策清單給 Paul 確認
- **Triggering incident**: `git status` 顯示 60+ 個未追蹤檔案，混合 iCloud 衝突副本、漏 commit 的治理檔、cron 產出資料

---

## Context

Paul 今天連跑兩次 commit（`d0d52fe` Chat handoff + 五符號 schema；`694c2d4` H6 ADR + worklog）之間，終端機 `git status` 意外曝光了 repo 的真實髒亂程度：

```
修改：data/stock.json
修改：data/timing.json
修改：worklogs/worklog-2026-04-24.md（此項已於 694c2d4 commit 解決）

未追蹤的檔案:
（~60 個，見本 handoff §Appendix A「git status 現場快照」）
```

**Cowork 在 sandbox 內看不到本機 inode、iCloud 衝突時間戳、檔案內容 diff**，硬預判會踩坑。所以 Cowork 的角色是——**定義清理邊界與決策框架**，實際偵查與執行交給 Code。

本 handoff 不含預先分類清單。Code 必須自己跑偵查、自己分類、把結果給 Paul 審核。

---

## 授權範圍（Code 可自主執行）

### ✅ 可以做

1. **偵查類指令**（全部無副作用，不需 Paul 確認）：
   - `ls -la`、`find`、`stat`、`wc -l`、`diff`、`md5`/`shasum`
   - `git log`、`git status`、`git blame`、`git show`
   - grep / ripgrep / head / tail / cat
2. **清理副本**（分類 + 提決策清單給 Paul 後）：
   - `rm` 確認為 iCloud 衝突副本的檔案
   - 但必須先列出完整刪除清單，**等 Paul 回「確認刪除」才動**
3. **補 commit 合法治理檔**（分類 + 提清單給 Paul 後）：
   - `git add` 後 `git commit`（commit message 由 Code 起草）
   - **push 前停手**，等 Paul 在終端機跑
4. **建立 / 修改 `.gitignore`**：
   - 若判斷 data/*.json 是 cron 產出（非手動維護），可提議加 gitignore 規則
   - 清單給 Paul 確認後才加

### ❌ 不可以做

1. **不改任何治理文件內容**：
   - `docs/governance/**`（憲法、ADR、WE、速記卡、各種 memo）
   - `.claude/skills/**`（任何 skill）
   - `worklogs/worklog-*.md`（歷史 worklog）
   - `CLAUDE.md` 根部
   - 例外：**本 handoff 要求你寫一份 cleanup worklog** 到 `worklogs/worklog-2026-04-24.md` 附加段落，記錄你的偵查、決策、執行結果（三維度）
2. **不自動刪任何無法分類的檔**：
   - 看不懂的、無法確定是副本還是原檔的，**一律留著**，列入「需 Paul 人工判斷」清單
3. **不合併多個 commit**：
   - 殘渣清理、治理檔補 commit、gitignore 三件事**分三個 commit**
   - commit message 都要標 `[影響: governance/hygiene]`
4. **不自動 `git push`**：
   - 所有 commit 完成後，給 Paul 一條 oneliner 讓他手動 push
   - 允許 `git push --dry-run` 預覽

---

## 三類檔案的偵查與決策框架

### 🔴 第一類：iCloud 衝突副本（高度疑似）

**特徵**：檔名後綴帶 ` 2`、` 3`、` 4`... ` 9`（空格+數字，Apple iCloud 衝突命名慣例）

**偵查步驟**：
1. 列出所有疑似副本：`find . -type f \( -name "* [2-9].md" -o -name "* [2-9].json" -o -name "* [2-9].log" \) -not -path "./node_modules/*" -not -path "./.git/*"`
2. 對每一個副本，**檢查對應原檔是否存在**：
   - 副本 `foo 2.md` → 原檔 `foo.md` 是否存在？
   - 用 `diff` 比對內容差異（幾%？）
3. 三種處境，三種處理：

| 情況 | 判斷 | 處理 |
|---|---|---|
| 原檔存在 + diff 差異小（<10%） | iCloud 衝突副本，舊版本 | **可刪** |
| 原檔存在 + diff 差異大（>30%） | 可能是被遺忘的 fork | **列入 Paul 人工判斷** |
| 原檔不存在，只有副本 | 原檔遺失，副本是唯一版本 | **不可刪**，列入「重命名為原檔名」候選 |

4. 把三類分別列清單給 Paul，附「抽樣 diff 結果」（挑 3-5 個副本跑 diff 結果貼進清單）

**Cowork 的初步觀察**（僅供參考，以 Code 偵查為準）：
- 從 `git status` 輸出看，疑似副本約 45 個
- 集中在 `handoffs/`（大宗）、`worklogs/`（次之）、`docs/governance/`（少數）
- 時間集中在 2026-04-14 ~ 2026-04-23
- 推測：Paul 之前多終端機視窗 + iCloud 同步並行時累積的

---

### 🟡 第二類：未追蹤但合法的治理檔

**Cowork 識別的候選**（Code 請驗證）：
```
docs/governance/adr-naming-conflict-resolution-2026-04-24.md          ← 已於 694c2d4 commit ✅
docs/governance/cowork--governance-architecture-review-2026-04-24.md  ← 今天 Chat 評審
docs/governance/frozen-h1-h4-memo-2026-04-23.md                       ← 昨天 H1-H4 凍結備忘
docs/governance/paulkuo-governance-architecture-2026-04-24.pdf        ← 給 Chat 的 PDF
handoffs/code--skill-commit-split-investigation-2026-04-24.md         ← 今天上午 skill commit 分離事件
handoffs/cowork--governance-followups-from-icloud-git-incident-2026-04-24.md  ← 今天上午 handoff
handoffs/chat--h1-h9-legislative-batch-2026-04-24.md                  ← 已於 d0d52fe commit ✅
```

**偵查步驟**：
1. 對每個候選跑 `git log -- <path>` 確認確實從未 commit
2. 讀檔案頭部，確認是正常治理文件（有 frontmatter / Meta 段落 / 是 Paul 或 Cowork 近期產出）
3. 若有發現 Cowork 清單外的其他未追蹤治理檔，補進清單

**處理**：
- 打包成一個 commit：`chore(governance): 補 commit 2026-04-23~24 治理檔 [影響: governance]`
- commit message 列出所有檔名

---

### 🟢 第三類：data/ 目錄與其他自動產出

**Cowork 識別的候選**：
```
修改：data/stock.json
修改：data/timing.json
```

還可能包含（Code 偵查確認）：
- `logs/wiki-enrich-2026-04-22 2.log`（iCloud 副本，屬第一類）
- `worklogs/impact-scan-*.md`（大量 iCloud 副本，屬第一類）
- `worklogs/wiki-*-pending*.md`（待確認是副本還是合法 scanner 產出）
- `worklogs/wiki-digest-*.md`（同上）

**判斷依據**：
1. 該檔對應是否有 cron / scanner 產出（看 `scripts/`、`.github/workflows/`、scheduled-tasks 設定）
2. 若是 cron 產出 → 加 `.gitignore`
3. 若是 Paul 手動維護 → 建議 commit 進 git
4. 若無法判斷 → 列入 Paul 人工判斷

**對 data/stock.json 和 data/timing.json 的猜測**（以 Code 偵查為準）：
- 看檔名推測是 paulkuo.tw 主站的 ticker 資料（股票 + 時區），可能由 Worker cron 每小時寫入
- 若確實是 cron 產出 → `.gitignore` 加 `data/stock.json` 和 `data/timing.json`
- 若是手動維護的 metadata → commit 進 git

---

## 執行流程（Code 必須遵守的順序）

```
Phase 1：偵查（只讀，不需 Paul 確認）
  ↓ 輸出：三類檔案完整清單 + 抽樣 diff + 初步分類
  ↓ 格式見下方「報告格式」
Phase 2：Paul 審核（Code 停手等回覆）
  ↓ Paul 回「確認」或指定修改項
Phase 3：執行清理（Paul 確認後才動）
  ↓ 三個獨立 commit（殘渣刪除 / 治理檔補 commit / gitignore）
  ↓ 每個 commit 後跑 `git status` 驗證
Phase 4：寫 cleanup worklog
  ↓ 附加到 worklogs/worklog-2026-04-24.md（Cowork 下午段落之後）
  ↓ 三維度：做了什麼 / 決策紀錄 / 阻礙與踩坑
Phase 5：給 Paul push oneliner
  ↓ 不自動 push
  ↓ 附 `git log --oneline -5` 讓 Paul 預覽要推的 commits
```

---

## 報告格式（Phase 1 偵查完成時提供）

```markdown
# Repo Hygiene 偵查報告（Code session YYYY-MM-DD HH:MM）

## 第一類：iCloud 衝突副本（N 個）

### A. 可直接刪除（原檔存在 + diff 差異小）
- handoffs/xxx 2.md  (原檔存在；diff: 5 行差異)
- worklogs/yyy 5.md  (原檔存在；diff: 0 行差異，完全重複)
- ...

### B. 需 Paul 人工判斷（diff 差異大或情況特殊）
- handoffs/zzz 2.md  (原檔存在；diff: 120 行差異，可能是獨立 fork)
- ...

### C. 不可刪（只有副本，原檔遺失）
- worklogs/www 6.md  (原檔不存在；建議重命名為 www.md)
- ...

## 第二類：合法治理檔補 commit（N 個）

列出路徑 + 檔案大小 + 預計 commit message：
- docs/governance/aaa.md  (2.3 KB)
- handoffs/bbb.md  (4.1 KB)
- ...

**預計 commit message**：
chore(governance): 補 commit YYYY-MM-DD 治理檔 [影響: governance]

## 第三類：data/ 目錄與自動產出策略

### 確認為 cron 產出（建議 .gitignore）
- data/stock.json  (證據：scripts/xxx.sh 每小時寫入)
- ...

### 確認為手動維護（建議 commit）
- ...

### 無法判斷（需 Paul 指示）
- ...

## Phase 2 等 Paul 回覆

請 Paul 回覆：
- [ ] 第一類 A 組刪除清單：確認 / 修改（指出哪些要留）
- [ ] 第一類 B 組人工判斷結果：逐項指示
- [ ] 第一類 C 組重命名：確認 / 跳過
- [ ] 第二類 commit：確認 / 修改 message
- [ ] 第三類 gitignore：確認規則 / 修改 / 跳過
```

---

## 風險與防線

### 誤刪風險

**場景**：把「只有副本沒原檔」的檔案當成可刪殘渣。
**防線**：偵查時對每個副本檢查原檔是否存在（`test -f "${filename_without_suffix}"`），分類到 C 組而非 A 組。

### git 歷史污染

**場景**：把 cron 產出的 `data/*.json` 不小心 commit 進 git，未來每次 cron 跑 repo 就髒。
**防線**：第三類的判斷依據要具體（找 cron 定義、scheduled-tasks 紀錄、Worker 程式碼），不憑猜測。

### commit message 標準

**強制規範**：
- 殘渣清理：`chore(hygiene): 清理 iCloud 衝突副本 N 個 [影響: hygiene]`
- 治理檔補 commit：`chore(governance): 補 commit 2026-04-23~24 治理檔 [影響: governance]`
- gitignore：`chore(build): 加入 data/ cron 產出 gitignore [影響: hygiene]`

### push 前最後防線

**強制規範**：**Code 絕不自動 push**。所有 commit 完成後：
1. 跑 `git log --oneline -5` 顯示本 session 的 commits
2. 跑 `git push --dry-run` 顯示會推什麼
3. 把兩個輸出貼給 Paul
4. 給 Paul 一條 push oneliner
5. 等 Paul 跑完、回報 push 成功，才算完成

---

## Cowork 看得到的既有失效觀察

### iCloud 副本持續繁殖現象

Paul 有 auto-memory `feedback_icloud_git_sync.md` 記載 2026-04-24 上午曾把「iCloud 同步 .git」誤判為 git tracking refs 不完整的根因。**那次誤判後證實 iCloud 不影響 .git/**——但 iCloud 對 repo **普通檔案** 的衝突副本問題是真的存在的，只是跟 git 無關。

所以本次清理的**認知框架**是：
- iCloud 會在 repo 工作區製造衝突副本（檔案繁殖，影響 `git status` 可讀性）
- iCloud 不會動 `.git/`（git 本身運作正常）
- 清理衝突副本 = 檔案管理問題，不是 git 問題

### 長期預防

若 Code 偵查發現 iCloud 副本**持續繁殖**的實際證據（例：同一檔名出現 `2.md`、`3.md`、`4.md`... 連號），建議在 Phase 4 worklog 提議：

- 選項 1：paulkuo.tw repo 移出 iCloud Drive 同步路徑
- 選項 2：在 iCloud 同步排除清單加入 `~/Desktop/01_專案進行中/paulkuo.tw/`
- 選項 3：維持現狀 + 定期手動清理（cron + 本 handoff 的清理流程）

**這個議題不屬於本 handoff 執行範圍**，只是觀察材料丟給 Paul，未來可開成新的 PENDING.md 條目。

---

## Appendix A：git status 現場快照（Paul 於 2026-04-24 提供）

```
位於分支 main
您的分支與上游分支 'origin/main' 一致。

尚未暫存以備提交的變更：
  修改：data/stock.json
  修改：data/timing.json
  修改：worklogs/worklog-2026-04-24.md  ← 已於 694c2d4 commit 解決

未追蹤的檔案（60+，摘錄）:
  .claude/settings 2.json
  PROJECT_AUDIT_2026-04-23 2.md
  docs/governance/adr-naming-conflict-resolution-2026-04-24.md  ← 已於 694c2d4 commit
  docs/governance/cowork--governance-architecture-review-2026-04-24.md
  docs/governance/cowork--hygiene-task-ab-sonnet-handoff-2026-04-20 2.md
  docs/governance/frozen-h1-h4-memo-2026-04-23.md
  docs/governance/paulkuo-governance-architecture-2026-04-24.pdf
  handoffs/chat--session-handoff-v5-planning-2026-04-17 2.md
  handoffs/chat--session-handoff-v5-planning-2026-04-17-rev3 2.md
  handoffs/code--ai-ready-jsonld-fix-2026-04-21 2.md
  handoffs/code--ai-ready-wellknown-fix-2026-04-21 2.md
  handoffs/code--governance-dashboard-redesign-phase-a-2026-04-14 6.md
  handoffs/code--governance-dashboard-redesign-phase-a-2026-04-14 7.md
  handoffs/code--governance-dashboard-redesign-phase-a-2026-04-14 8.md
  handoffs/code--governance-dashboard-redesign-phase-a-2026-04-14 9.md
  handoffs/code--governance-exam-files-consolidation-2026-04-20 2.md
  handoffs/code--paulkuo-tw-fix-visitor-analytics-2026-04-21 2.md
  handoffs/code--scanner-dedup-mechanism-2026-04-20 2.md
  handoffs/code--session-handoff-v5-upgrade-2026-04-18 2.md
  handoffs/code--skill-commit-split-investigation-2026-04-24.md
  handoffs/code--skill-schema-lint-poc-2026-04-17 2.md
  handoffs/code--skill-source-verification-2026-04-18 2.md
  handoffs/code--tqef-stage-b-axis1-comet-bootstrap-2026-04-23 2.md
  handoffs/code--translator-dead-code-and-qwen-cost-fix-2026-04-23 2.md
  handoffs/code--v5-1-B-guardrail-numbering-2026-04-18 2.md
  handoffs/code--v5-1-D-cross-cowork-retro-2026-04-18 2.md
  handoffs/code--v5-1-E-changelog-extraction-2026-04-18 2.md
  handoffs/code--v5-1-closure-2026-04-18 2.md
  handoffs/code--v5-1-source-verification-2026-04-18 2.md
  handoffs/code--wiki-api-route-fix-2026-04-20 2.md
  handoffs/code--wiki-youtube-push-and-backfill-2026-04-19 2.md
  handoffs/cowork--gap-closure-2026-04-18 2.md
  handoffs/cowork--governance-followups-from-icloud-git-incident-2026-04-24.md
  handoffs/cowork--project-audit-cleanup-batch-2026-04-23 2.md
  handoffs/cowork--session-handoff-v5-1-planning-rev1-2026-04-18 2.md
  handoffs/cowork--session-handoff-v5-1-planning-rev2-2026-04-18 2.md
  handoffs/cowork--session-handoff-v5-baseline-complete-2026-04-18 2.md
  handoffs/cowork--session-handoff-v5-split-reassessment-2026-04-18 2.md
  handoffs/cowork--session-opening-2026-04-21 2.md
  handoffs/cowork--skill-sync-long-term-plan-briefing-2026-04-19 2.md
  handoffs/cowork--v5-3-commit-and-user-level-sync-2026-04-19 2.md
  handoffs/cowork--wiki-youtube-rate-limit-retry-2026-04-20 2.md
  handoffs/cowork--working-environment-deployment-2026-04-18 2.md
  handoffs/done/code--agentic-seo-three-tier-classification-2026-04-17 2.md
  handoffs/done/code--bot-classification-historical-reclass-2026-04-17 2.md
  logs/wiki-enrich-2026-04-22 2.log
  worklogs/2026-04-23-project-audit 2.md
  worklogs/cowork--ai-ready-restart-handoff-2026-04-23 2.md
  worklogs/cowork--git-workspace-cleanup-handoff-2026-04-23 2.md
  worklogs/cowork--youtube-whisper-backfill-handoff-2026-04-23 2.md
  worklogs/impact-scan-2026-04-16 5.md
  worklogs/impact-scan-2026-04-17 5.md
  worklogs/impact-scan-2026-04-17 6.md
  worklogs/impact-scan-2026-04-20 2.md
  worklogs/impact-scan-2026-04-21 2.md
  worklogs/impact-scan-2026-04-22 2.md
  worklogs/project-audit-2026-04-23 2.md
  worklogs/wiki-column-pending 5.md
  worklogs/wiki-digest-2026-04-22 2.md
  worklogs/wiki-web-pending-2026-04-16 6.md
  worklogs/wiki-web-pending-2026-04-22 2.md
  worklogs/worklog-2026-04-17 4.md
  worklogs/worklog-2026-04-23 2.md
```

---

## Signature

- **起草**：Cowork session（Opus 4.6），2026-04-24 下午
- **Status**：Proposed — Code 偵查後提決策清單給 Paul 確認
- **建議模型**：Sonnet 4.6（純執行+判斷類任務，不需 Opus）
- **歸檔**：執行完成後由 Code 自行 `git mv` 本 handoff 到 `handoffs/done/code--repo-hygiene-icloud-residue-2026-04-24.md`（作為最後一個 commit 的一部分）
