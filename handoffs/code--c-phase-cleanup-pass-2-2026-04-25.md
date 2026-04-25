---
status: Draft
---

# Code Handoff · cleanup-pass-2 — H7 lint 合規修補 + grandfather 機制

- **產出時間**：2026-04-25
- **產出者**：Cowork session（Sonnet 4.6）
- **目標 session**：Code（建議 Sonnet 4.6）
- **任務類型**：H7 lint Phase 1 後續清理（4 份本批次 handoff 補規範 + grandfather 機制 + lint 腳本 word splitting bug 修正 + PENDING 觀察項目）
- **上游**：
  - `worklogs/code--q2-d1-d4-engineering-verification-2026-04-25.md`（commit `9bc60c5`）D3 揭露
  - `handoffs/code--h7-lint-phase1-implementation-2026-04-25.md`（commit `24d7a03`）H7 lint Phase 1 落地
  - Paul 裁決：「修 bug 不是追溯」（憲法第三條 + memory `feedback_passive_vs_active_defense`）

---

## 0. 開頭警示

**本 handoff 純執行不做判斷**——所有檔案修改已由 Cowork 完成，Code 任務只有：跑 lint 驗證 + Strict 攔截實測 + commit + push + Issue 同步。

H7 lint Phase 1 跑 manual 模式揭露 202 strict fail：

- 96 份 H7 通過前歷史 handoffs → grandfather 處置（C2+C3）
- 4 份 Cowork 自己寫的本批次 handoff → 修 bug 處置（不可 grandfather，依 Paul 裁決「修 bug 不是追溯」）

cleanup-pass-2 一次處理：

| 動作 | 檔案 | 狀態 |
|---|---|---|
| 修 4 份本批次 handoff 補 H7 §第一條規範 | 4 份（M）| ✅ Cowork 完成 |
| 立 grandfather 機制 | `.governance-lint-grandfathered`（A）| ✅ Cowork 完成 |
| 改 governance-lint.sh（grandfather + word splitting bug fix） | `scripts/governance-lint.sh`（M）| ✅ Cowork 完成 |
| PENDING.md 加觀察項目 9 + 10 | `worklogs/PENDING.md`（M）| ✅ Cowork 完成 |
| memory 立 Cowork 寫 handoff 紀律 | auto-memory（A）| ✅ Cowork 完成（不入本 repo） |
| **lint manual 驗證 0/0/95** | — | ⏳ 待 Code |
| **Strict 攔截測試** | — | ⏳ 待 Code |
| **commit + push + Issue 同步** | — | ⏳ 待 Code |

**禁止**：

- 修改任何 Cowork 已修檔內容
- 啟用 Phase 2/3 lint check（H7 §五留下輪）
- 寫 CI workflow（H7 §三次要防線，留下輪）
- 修現有歷史 handoffs 內容（已 grandfather）
- 動歷史 4 份 untracked / cleanup handoff 自己歸檔
- 處理 iCloud 衝突副本（PENDING #10 等 Paul 裁決）

---

## 1. 任務範圍

### 1.1 必做（依序）

| Step | 動作 | 工具 |
|---|---|---|
| 1 | 前置檢查（git status、lint 腳本語法、grandfather 清單存在） | bash |
| 2 | 跑 `bash scripts/governance-lint.sh --manual` 驗證（預期 0/0/95） | bash |
| 3 | Strict 攔截測試（製造違規 handoff 觀察被擋，撤銷） | bash |
| 4 | commit 7 個檔案（4 份 handoff 修補 + grandfather 清單 + lint 腳本 + PENDING）+ 本 handoff 自己（共 8 份） | bash |
| 5 | push | bash |
| 6 | Issue #155 dashboard 同步 comment | GitHub MCP |

### 1.2 不做

依 §0「禁止」清單。

---

## 2. 詳細步驟

### Step 1 · 前置檢查

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw && \
echo "=== git status（預期：8 個本輪檔案 + 既有歷史 untracked）===" && \
git status --short && \
echo "" && \
echo "=== lint 腳本語法 ===" && \
bash -n scripts/governance-lint.sh && echo "✅ syntax OK" && \
echo "" && \
echo "=== grandfather 清單存在 ===" && \
ls -la .governance-lint-grandfathered && \
echo "" && \
echo "=== 最近 commit ===" && \
git log --oneline -3
```

**預期 git status**：

```
 M scripts/governance-lint.sh
 M worklogs/PENDING.md
 M handoffs/code--q2-d1-d4-engineering-verification-2026-04-25.md
 M handoffs/done/code--c-phase-rev2-deployment-2026-04-25.md
?? .governance-lint-grandfathered
?? handoffs/code--c-phase-cleanup-2026-04-25.md   ← 上輪 §5.A1 default 留 untracked，本輪一起 add
?? handoffs/code--h7-lint-phase1-implementation-2026-04-25.md   ← 上輪 §5.D1 default 留 untracked，本輪一起 add
?? handoffs/code--c-phase-cleanup-pass-2-2026-04-25.md   ← 本 handoff 自己
?? docs/governance/code--paulkuo-tw-adr-index-and-branch-protection-audit-2026-04-25.md  ← 歷史 untracked，不動
?? docs/governance/code--pending-md-h1-h9-ratification-2026-04-24.md  ← 歷史 untracked，不動
?? docs/governance/cowork--adr-drafting-h1-h9-2026-04-24.md  ← 歷史 untracked，不動
?? docs/governance/cowork--archive-h1-h9-handoff-2026-04-25.md  ← 歷史 untracked，不動
```

注意：cleanup + phase1 兩份 handoff 雖是 `??`（從未 commit），但已被 Cowork 在 cleanup-pass-2 修檔（補 frontmatter + Consequences）。Step 4 git add 會 stage 它們。

最頂端 commit 應為 `24d7a03 feat(governance): H7 lint Phase 1 implementation` 或更新。

### Step 2 · lint manual 模式驗證

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw && \
bash scripts/governance-lint.sh --manual
```

**預期輸出末段**：

```
──────────────────────────────
Strict fails:    0
Warnings:        0
📦 Grandfathered: 95 (pre-H7 historical, see .governance-lint-grandfathered)
```

**判斷**：

- ✅ 三項皆為 0/0/95 → 繼續 Step 3
- 🛑 任一項不符 → 停下回報 Paul，**不要自行修**

### Step 3 · Strict 攔截測試（驗 lint 護欄真生效）

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw && \
# 製造一個缺 status 欄位的 handoff
cat > handoffs/_test-strict-block-pass2.md <<'EOF'
---
title: Test handoff (intentionally no status)
date: 2026-04-25
---
# Test
## Consequences
- Test for cleanup-pass-2 verification
EOF

git add handoffs/_test-strict-block-pass2.md && \
git commit -m "test: should be blocked by H7 lint" 2>&1 || echo "✅ EXPECTED BLOCK"

# 清理
git reset HEAD handoffs/_test-strict-block-pass2.md 2>/dev/null
rm -f handoffs/_test-strict-block-pass2.md

# 驗證清理乾淨
git status --short handoffs/_test-strict-block-pass2.md 2>&1 | head -1
ls handoffs/_test-strict-block-pass2.md 2>&1 | head -1
```

**預期**：

- commit 被擋（輸出含 `❌ FAIL` + `frontmatter 缺 status 欄位` + `✅ EXPECTED BLOCK`）
- 清理後兩行驗證皆「No such file」

**未被擋**：lint 護欄沒生效，停下回報，**不要繼續 Step 4**。

### Step 4 · commit（單個 batch）

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw && \
git add scripts/governance-lint.sh \
        .governance-lint-grandfathered \
        worklogs/PENDING.md \
        handoffs/done/code--c-phase-rev2-deployment-2026-04-25.md \
        handoffs/code--c-phase-cleanup-2026-04-25.md \
        handoffs/code--q2-d1-d4-engineering-verification-2026-04-25.md \
        handoffs/code--h7-lint-phase1-implementation-2026-04-25.md \
        handoffs/code--c-phase-cleanup-pass-2-2026-04-25.md && \
git commit -m "fix(governance): H7 lint cleanup-pass-2 — Cowork handoff compliance + grandfather mechanism

H7 lint Phase 1 (24d7a03) manual scan revealed 202 strict fails:
- 96 from pre-H7 historical handoffs → grandfather mechanism (C2+C3)
- 4 from H7-era Cowork handoffs → fix-bug mechanism (cannot grandfather)

Cleanup-pass-2 changes:

1. Fix 4 H7-era Cowork handoffs (Per Paul ratification: 修 bug 不是追溯)
   - handoffs/done/code--c-phase-rev2-deployment-2026-04-25.md
   - handoffs/code--c-phase-cleanup-2026-04-25.md
   - handoffs/code--q2-d1-d4-engineering-verification-2026-04-25.md
   - handoffs/code--h7-lint-phase1-implementation-2026-04-25.md
   Each gets YAML frontmatter (status: Accepted) + ## Consequences section.

2. Add .governance-lint-grandfathered (95 paths)
   - 91 historical handoffs from pre-H7 era
   - 4 iCloud conflict copies (temporary grandfather, see PENDING #10)

3. governance-lint.sh updates:
   - Add is_grandfathered() function reading .governance-lint-grandfathered
   - check_handoff_fields(): use 'while IFS= read -r' instead of 'for f in \$files'
     to fix word splitting bug on filenames with spaces
   - check_skill_pillar(): same word splitting fix
   - Summary output adds 'Grandfathered: N' counter
   - Verified: 0 Strict / 0 Warnings / 95 Grandfathered (was 202 fails)

4. PENDING.md add observation items:
   - #9 H7 lint enforcement effect + grandfather reference frequency
   - #10 iCloud conflict copies cleanup (待 Paul 排程)

5. Cleanup-pass-2 handoff itself (this commit)
   - status: Draft (Cowork drafted, awaiting Code execution)

Per H7 ADR §第一條 + memory feedback_passive_vs_active_defense +
constitution v0.2 第三條 (核查義務剛性).
[影響: 治理框架]"
```

驗證：

```bash
git log --oneline -1
git show --stat HEAD | head -15
```

確認：

- 含 `scripts/governance-lint.sh` (M)
- 含 `.governance-lint-grandfathered` (A)
- 含 `worklogs/PENDING.md` (M)
- 含 4 份 handoff (M × 3 + done/ 路徑 M × 1)
- 含 `handoffs/code--c-phase-cleanup-pass-2-2026-04-25.md` (A，本 handoff 自己)

### Step 5 · push

```bash
git push origin main
```

紀錄 commit hash：

```bash
git log --format='%H %s' -1
```

替換 `<hash>` 為實際 commit hash 用於 Step 6。

### Step 6 · Issue #155 dashboard 同步 comment

用 GitHub MCP `add_issue_comment`：

- repository owner: `zarqarwi`
- repository name: `paulkuo.tw`
- issue number: `155`
- body：（替換 `<hash>` 為 Step 5 取得的實際 commit hash）

```markdown
## H7 lint cleanup-pass-2（2026-04-25）

對應 H7 lint Phase 1：commit `24d7a03`
本輪 cleanup-pass-2：commit `<hash>`

### 動機

H7 lint Phase 1 落地後 manual 模式揭露 202 strict fail：

- **96 份**：H7 通過前歷史 handoffs → grandfather 機制
- **4 份**：H7 通過後 Cowork 自己寫的本批次 handoff（rev2 deployment / cleanup / Q2 / Phase 1）→ 修 bug

依 Paul 裁決：「修 bug 不是追溯」。對 H7 通過後的違規 handoff 補規範（不可 grandfather）。

### 落地內容

| 項目 | 動作 | 狀態 |
|---|---|---|
| 4 份本批次 Cowork handoff | 補 YAML frontmatter (status: Accepted) + ## Consequences 章節 | ✅ |
| `.governance-lint-grandfathered` | 95 paths（91 歷史 + 4 iCloud 衝突副本） | ✅ |
| `scripts/governance-lint.sh` | 加 grandfather 跳過邏輯 + 修 word splitting bug | ✅ |
| `worklogs/PENDING.md` | 加觀察項目 #9（lint 攔截實效）+ #10（iCloud 衝突副本清理） | ✅ |
| memory 立 Cowork handoff 紀律 | feedback_cowork_handoff_template_h7_compliance | ✅（不入 repo） |

### lint 驗證結果

```
Strict fails:    0
Warnings:        0
📦 Grandfathered: 95 (pre-H7 historical)
```

從原本 202 fail → 0 fail，符合 H7 ADR §第一條紀律落地。

### 對 H7 ADR 的真實落地

| 落差 | Phase 1 (24d7a03) 後狀態 | cleanup-pass-2 後狀態 |
|---|---|---|
| 腳本本體 | ✅ 已實作 | ✅ + word splitting bug 修正 |
| pre-commit hook | ✅ 已安裝 | ✅ 不變 |
| Strict 攔截測試 | ✅ PASS | ✅ 重測 PASS |
| **manual 模式 lint 結果** | ⚠️ 202 fail（含 4 本批次違規） | ✅ 0 fail（4 本批次合規 + 95 grandfathered） |
| Cowork 寫 handoff 紀律 | ❌ 無紀律，4 份違規 | ✅ memory + 4 份範本（status: Accepted + ## Consequences） |

### 下一步

- 觀察期至 2026-06-25：PENDING #9 看 lint 攔截觸發次數 + grandfathered 引用率
- iCloud 衝突副本清理：PENDING #10，待 Paul 排程
- Phase 2（check 2 + 4 + worklog 四維度）：H8 通過後 2 週內，待 Phase 1 跑 1-2 週看 false positive 後再升級
- CI workflow（H7 §三次要防線）：Phase 1+2 都落地後再評估

---
產出：Cowork (Sonnet 4.6) 起草 + Code (Sonnet 4.6) 執行
```

替換 `<hash>` 後發出。發送前 grep 確認沒 `<hash>` 殘留：

```bash
echo "$BODY" | grep '<hash>' && echo "⚠️ 還有占位符未替換" || echo "✅ 占位符已全替換"
```

---

## 3. 完成標準

- [ ] Step 1 前置檢查（git status 與預期相符、lint 語法 OK、grandfather 清單存在）
- [ ] Step 2 lint manual 驗證（0/0/95）
- [ ] Step 3 Strict 攔截測試 PASS + 清理乾淨
- [ ] Step 4 commit 完成（含 8 個檔案，hash 已記）
- [ ] Step 5 push 完成
- [ ] Step 6 Issue #155 comment 已發（hash 替換完成）
- [ ] 歷史 4 份 untracked 仍 untracked（**不動**）
- [ ] iCloud 衝突副本未刪除（**等 PENDING #10 排程**）

---

## 4. 已知陷阱

1. **commit 範圍 8 份大**：包含 lint 腳本 + 清單檔 + PENDING + 4 份 handoff + 本 handoff 自身。逐檔 add 不 add 整個目錄，避免誤抓歷史 untracked
2. **本 handoff 自身 status: Draft**：依 H7 §第一條 status 白名單合法。Code 跑完後可選擇升 Accepted（自己改 frontmatter + 補 Consequences 實際結果），但不強制本批次完成（下一輪 cleanup-pass-3 自然處理）
3. **Strict 攔截測試 cleanup**：`_test-strict-block-pass2.md` 必須清乾淨
4. **Issue comment hash 占位符**：發送前 grep 確認沒 `<hash>` 殘留
5. **`.git/index.lock` 殘留**：sandbox 殘留可能存在，rm 即可
6. **lint 對 .git/hooks/pre-commit 的依賴**：commit 時 pre-commit hook 會跑——本 commit 含 8 個檔案，但 staged files 含 handoff 後 hook 會跑 check_handoff_fields（pre-commit 模式）
   - 4 份本批次 handoff 已合規（含 frontmatter + Consequences）→ 不會被擋
   - 本 handoff 自身（cleanup-pass-2）含 frontmatter status: Draft + ## Consequences → 不會被擋
   - .governance-lint-grandfathered 不是 handoff → 不在 check_handoff_fields 範圍

---

## 5. 執行完後等 Paul 裁決事項

執行完 Step 1-6 後，**不要繼續做下面任何事**：

### A. 本 cleanup-pass-2 handoff 自身 status 更新時機

執行完後本 handoff 從 Draft → Accepted。三個選項：

- A1. 本批次 commit 後 Cowork 自己改（會擴大本 handoff 邊界）
- A2. 下輪 handoff（cleanup-pass-3 或自然演化）一起改
- **A3（預設）**：跑完不改，等 1-2 週後 H7 lint Phase 2 升級時一起 polish

### B. iCloud 衝突副本清理時機

PENDING #10 已列。4 份檔案是技術債，不影響 lint。Paul 排程處理：

- B1. 立刻處理（新 handoff 給 Code 跑 git rm + commit）
- B2. 跟 Phase 2 一起做
- B3. 觀察期結束後（6/25）再決定

### C. Phase 2 啟動時機

H7 §五 Phase 2 包含 check 2 + 4 + worklog 四維度，期限「H8 通過後 2 週內 = 2026-05-09」。建議：

- C1. Phase 1 跑 1-2 週看 false positive 再升 Phase 2（依 memory `feedback_incremental_fix_observe_before_automate`）
- C2. 立即接著做（已知 H8 通過、規則明確）
- C3. 等 6/25 觀察期一起評估

### D. 4 份歷史 untracked（docs/governance/）清理

繼續留待 H7 lint Phase 2 觸發測試（依上輪 §5.C 議題）。本 handoff 不處理。

---

## 6. 給 Code 的話

本 handoff 跟前面 (c) cleanup / Q2 / Phase 1 deployment 同風格——純執行 spec。所有「為什麼這樣做」的脈絡都已在：

- H7 ADR §第一條 + §五 Phase 1 規範
- Q2 D3 揭露紀錄（commit `9bc60c5`）
- Cowork 對 Paul 「修 bug 不是追溯」回應的逐項分析（chat history）

執行紀律（與既往 handoff 一致）：

1. 嚴格按 §2 順序，每一步驗證通過再進下一步
2. 任何 git status / lint 結果預期外 → 停下回報 Paul
3. 任何驗證 fail → 停下，**禁止** `git reset --hard` 或破壞性復原
4. 記得 Step 3 cleanup（測試完清乾淨）
5. Issue comment hash 替換不能漏
6. 執行完不主動處理 §5 任何項目

memory `feedback_oneliner_for_paul_terminal` + 憲法第二條：commit/push 必須在 Paul 本機。Code 你就在本機 terminal，是合規執行者。

---

## Consequences

### 預期執行結果（待 Code 補實際結果）

- [ ] Step 1 前置檢查通過
- [ ] Step 2 lint manual 驗證 0/0/95
- [ ] Step 3 Strict 攔截測試 PASS
- [ ] Step 4 commit 完成（hash 待填）
- [ ] Step 5 push 完成
- [ ] Step 6 Issue #155 comment 已發

### 對後續工作的影響

- 關閉 H7 ADR §第一條規範對「Cowork 自己寫的 handoff」的破洞
- grandfather 機制建立後，未來 lint 可區分「歷史檔案 vs 規則生效後檔案」
- Cowork 寫 handoff 紀律由 memory 保障（feedback_cowork_handoff_template_h7_compliance）+ pre-commit hook 攔截下游
- PENDING #9 / #10 進入觀察期，6/25 盤點

### 遵守紀律確認（待 Code 跑完補）

- [ ] 憲法第二條：commit/push 走 Paul 本機 ✅（Code 在本機 terminal）
- [ ] §1.2 不擴大範圍（不啟用 Phase 2/3、不寫 CI、不修歷史 handoffs）
- [ ] §4 Strict 攔截測試清理乾淨
- [ ] §6 不主動處理 §5 任何項目

### 修正的 bug（cleanup-pass-2 自身範圍）

- governance-lint.sh word splitting bug：含空格檔名（iCloud 衝突副本）path 切錯為「2.md / 3.md」假 path
- check_handoff_fields() / check_skill_pillar() 兩處 `for f in $files` 改為 `while IFS= read -r f`
- 本修正同時影響 H7 ADR 偽代碼（line 357-537）—— ADR 偽代碼本身有此 bug，未來 Phase 2/3 實作要避免複製偽代碼字面

---

**handoff 產出者**：Cowork session (Sonnet 4.6)
**對應任務**：H7 lint Phase 1 後續清理（cleanup-pass-2）
**下一步**：Paul 開 Code session，餵此 handoff 給 Code 執行
