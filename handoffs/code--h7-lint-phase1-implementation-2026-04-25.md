---
status: Accepted
---

# Code Handoff · H7 governance-lint.sh Phase 1 補實作

- **產出時間**：2026-04-25
- **產出者**：Cowork session（Sonnet 4.6）
- **目標 session**：Code（建議 Sonnet 4.6）
- **任務類型**：H7 ADR §五 Phase 1 補實作（lint 腳本 + pre-commit hook）
- **Status**：Ready for execution
- **上游**：
  - `worklogs/code--q2-d1-d4-engineering-verification-2026-04-25.md`（commit `9bc60c5`）D3 揭露 H7 Accepted 但腳本不存在
  - Paul 裁決路線 1（補實作，不降級不立元 ADR）

---

## 0. 開頭警示

H7 ADR §五 Phase 1 期限是「H7 通過後 2 週內」（2026-05-09 前），但 Q2 D3 揭露 Phase 1 完全未啟動。本 handoff 補 Phase 1。

**核心參考**：`docs/governance/adr-governance-lint-he-lu-2026-04-25.md`

- §第一條 5 項檢查的具體規則（line 62-181）
- §第二條 兩級攔截策略（line 183-192）
- §第三條 掛載點與安裝流程（line 194-208）
- §第五條 Phase 規劃（line 222-268）
- **§附錄 A skeleton 偽代碼**（line 357-537）—— Code 把它變成可運作腳本即可

**禁止**：

- 改 H7 ADR 內容
- 擴大到 Phase 2 / Phase 3（檢查 2 / 4 / 5）—— Phase 1 只啟用檢查 1 + 3
- 寫 CI workflow（.github/workflows/governance-lint.yml）—— H7 §三明文是「次要防線」，Phase 1 先做 pre-commit
- 順手清 D2 archive 79 份待歸 / 4 份歷史 untracked / 兩份 cleanup handoff
- 修現有違規（若 lint 對 repo 跑出 fail，回報但不自修）
- 立新 ADR

---

## 1. 任務範圍

### 1.1 必做（依序）

| Step | 動作 | 工具 |
|---|---|---|
| 1 | 前置檢查（git status、scripts/ 現況、H7 ADR 存在驗證） | bash |
| 2 | 寫 `scripts/governance-lint.sh`（5 function 全實作，main 只啟用 1+3） | edit |
| 3 | 寫 `scripts/governance-lint-pre-commit.sh`（pre-commit wrapper） | edit |
| 4 | 擴充 `scripts/install-hooks.sh`（增 cp + chmod） | edit |
| 5 | 對現有 repo 跑 `bash scripts/governance-lint.sh --manual`，確認 0 fail | bash |
| 6 | 跑 `bash scripts/install-hooks.sh` 安裝 pre-commit hook | bash |
| 7 | Strict 攔截測試（製造違規 commit 觀察被擋，撤銷） | bash |
| 8 | commit + push | bash |
| 9 | Issue #155 dashboard 同步 comment | GitHub MCP |

### 1.2 不做

1. **不啟用** check 2（F-ID 格式）/ check 4（PENDING 五符號）/ check 5（length-budget 時效）→ Phase 2 / 3 範圍
   - 但 5 個 check function 都**實作**到腳本內，main 只調用 1 + 3，其餘標 `# PHASE_2: not enabled yet` 註解
   - 理由：未來 Phase 2 / 3 升級成本最低化，避免重複改腳本架構
2. **不寫** CI workflow
3. **不自修** 現有違規（若 Step 5 lint 跑出 fail，回報清單，由 Paul 決定）
4. **不擴大** 範圍到 D2 archive 清理、4 份歷史 untracked、handoffs 歸檔
5. **不修改** H7 ADR 任何內容（包括附錄 A 偽代碼字面）

---

## 2. 詳細步驟

### Step 1 · 前置檢查

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw && \
git status --short && \
echo "---" && \
ls -la scripts/ && \
echo "---" && \
ls -la docs/governance/adr-governance-lint-he-lu-2026-04-25.md && \
ls -la docs/governance/adr-worklog-abandoned-dimension-2026-04-25.md && \
echo "---" && \
git log --oneline -3
```

**預期**：

- git status 含本 handoff 自身 `??`（待後續決定歸檔）+ 既有 untracked
- `scripts/install-hooks.sh` 存在（CLAUDE.md「新 Clone 後必做」明文）
- `scripts/skill-schema-lint.sh` 存在（H7 §相關但不依賴）
- `scripts/commit-msg-hook.sh` 存在（H7 §三明文「不掛 commit-msg」，避免衝突）
- H7 ADR + H8 ADR 兩份檔案存在
- git log 最頂端：`9bc60c5 docs(governance): Q2 D1-D4 engineering verification...`

### Step 2 · 寫 `scripts/governance-lint.sh`

**起點**：H7 ADR 附錄 A 偽代碼（line 357-537）。

**Phase 1 落地調整**：

1. **5 個 check function 全部實作**（不省略），但 main 只調用：
   ```bash
   check_handoff_fields    # Strict
   check_skill_pillar      # Strict
   # PHASE_2: check_fid_format            # Warning, not enabled yet
   # PHASE_2: check_pending_symbols       # Strict, not enabled yet
   # PHASE_3: check_length_budget_staleness  # Warning, requires H5 length-budget-status.md
   ```

2. **跨平台 date 處理**（H7 §Consequences §負面影響第 1 點警告）：

   ```bash
   # macOS BSD date vs Linux GNU date
   if date -j -f '%Y-%m-%d' "$last" +%s > /dev/null 2>&1; then
     last_ts=$(date -j -f '%Y-%m-%d' "$last" +%s)  # macOS
   else
     last_ts=$(date -d "$last" +%s)  # Linux
   fi
   ```
   （這個目前在 check_length_budget_staleness 內，Phase 3 才啟用，Phase 1 只要程式碼存在即可）

3. **python3 yaml 依賴**：
   - 偽代碼 line 443-455 用 `python3 -c "import yaml"`
   - 預期 macOS Paul 本機 python3 已含 PyYAML
   - 如執行時 ImportError，附錄 fallback：`grep -E '^pillar:'` + 字面比對白名單（功能弱化但無依賴）
   - **驗證**：Step 5 跑 lint 時若 ImportError，紀錄在 Step 8 commit message + worklog 補章 abandoned 維度

4. **mode 旗標**：
   - `--pre-commit` （hook 調用，從 staged files 取範圍）
   - `--manual`（全 repo 掃描，本 Step 5 用）
   - `--ci-mode`（保留偽代碼，但 Phase 1 不啟用 CI workflow）

5. **頂部 banner 註明 H7 ADR 連結 + Phase 1**：
   ```bash
   # governance-lint.sh — paulkuo.tw governance regulations enforcement
   # Spec: docs/governance/adr-governance-lint-he-lu-2026-04-25.md (H7)
   # Phase: 1 (checks 1 + 3 enabled; checks 2/4/5 implemented but disabled)
   # Implemented: 2026-04-25 per Q2 D3 finding (commit 9bc60c5)
   ```

**驗證腳本可執行**：

```bash
bash -n scripts/governance-lint.sh && echo "syntax OK"
shellcheck scripts/governance-lint.sh 2>&1 || true   # shellcheck 若不存在 OK
```

### Step 3 · 寫 `scripts/governance-lint-pre-commit.sh`

```bash
#!/usr/bin/env bash
# pre-commit hook wrapper for governance-lint.sh
# Per H7 ADR §三 掛載點 + §五 Phase 1
set -euo pipefail
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
exec "$REPO_ROOT/scripts/governance-lint.sh" --pre-commit
```

完成後：

```bash
chmod +x scripts/governance-lint.sh scripts/governance-lint-pre-commit.sh
ls -la scripts/governance-lint*.sh
```

### Step 4 · 擴充 `scripts/install-hooks.sh`

先 Read 現有內容看結構，再 Edit 加入：

```bash
# Per H7 ADR §三：governance-lint pre-commit hook installation
cp "$REPO_ROOT/scripts/governance-lint-pre-commit.sh" "$HOOKS_DIR/pre-commit"
chmod +x "$HOOKS_DIR/pre-commit"
echo "✅ Installed governance-lint pre-commit hook"
```

**注意**：

- `$REPO_ROOT` / `$HOOKS_DIR` 變數名跟現有腳本對齊（先 Read 確認），不要假設
- 若現有 install-hooks.sh 已有其他 pre-commit 安裝 → 衝突，回報 Paul（pre-commit hook 只能裝一個）
- 若有衝突，**不擴大範圍**整合多 hook，停下回報

### Step 5 · 對現有 repo 跑 lint

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw && \
bash scripts/governance-lint.sh --manual
```

**預期**：H7 §五 Phase 1 §驗證 第一條「應 0 fail」。

**處置**：

- ✅ 0 fail：紀錄於 worklog 補章 done 維度，繼續 Step 6
- ⚠️ 有 fail：
  - 紀錄完整 fail 清單（檔案 + 違反規則）
  - **不自修**（依 §1.2.3）
  - 改紀錄到 worklog 補章 pitfalls 維度，回報 Paul 決定下一步
  - 但仍可繼續 Step 6（裝 hook）→ Step 7（測試）→ Step 8（commit），讓 lint 系統落地，違規修復下輪處理

### Step 6 · 安裝 pre-commit hook

```bash
bash scripts/install-hooks.sh
```

驗證：

```bash
ls -la .git/hooks/pre-commit && \
file .git/hooks/pre-commit && \
head -3 .git/hooks/pre-commit
```

預期：

- pre-commit 存在、可執行
- head 顯示 `#!/usr/bin/env bash` + `# pre-commit hook wrapper for governance-lint.sh`

### Step 7 · Strict 攔截測試

製造臨時違規（不真 commit）：

```bash
# 製造一個沒 status 欄位的 handoff
cat > handoffs/_test-strict-block-temp.md <<'EOF'
---
title: Test handoff (intentionally no status)
date: 2026-04-25
---
# Test
## Consequences
- This is a test for H7 lint Phase 1 Strict attempt
EOF

# 嘗試 commit（預期被擋）
git add handoffs/_test-strict-block-temp.md
git commit -m "test: should be blocked by H7 lint" 2>&1 || echo "✅ EXPECTED BLOCK"

# 清理
git reset HEAD handoffs/_test-strict-block-temp.md 2>/dev/null
rm -f handoffs/_test-strict-block-temp.md
```

**預期**：

- commit 被擋
- 輸出含 `❌ FAIL` + `frontmatter 缺 status 欄位`
- 退出碼非零（`echo "✅ EXPECTED BLOCK"` 觸發）

如果**未被擋**：H7 ADR 第一條規則沒生效，停下回報 Paul 不要繼續 Step 8。

清理後驗證 git status 已乾淨：

```bash
git status --short handoffs/_test-strict-block-temp.md 2>&1 | head -1
ls handoffs/_test-strict-block-temp.md 2>&1 | head -1
```

兩行皆應「No such file」。

### Step 8 · commit + push

進 commit 4 個檔（含可能的 worklog 補章修改）：

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw && \
git add scripts/governance-lint.sh \
        scripts/governance-lint-pre-commit.sh \
        scripts/install-hooks.sh && \
# 如有 worklog 補章修改也加入（同 commit 紀律）
git status --short worklogs/  # 看 worklog 補章是否有 modified
# 視情況加：
# git add worklogs/worklog-2026-04-25.md
```

commit message：

```
feat(governance): H7 lint Phase 1 implementation — close D3 gap

- scripts/governance-lint.sh: 5 check functions implemented; Phase 1 only enables check 1 (handoff fields) + check 3 (skill pillar whitelist); checks 2/4/5 stubbed for Phase 2/3
- scripts/governance-lint-pre-commit.sh: pre-commit wrapper per H7 §三
- scripts/install-hooks.sh: install governance-lint pre-commit hook
- Strict attempt test: PASS (test handoff without status correctly blocked)
- repo lint scan: 0 fail / N warnings (specify N)

Closes Q2 D3 finding (commit 9bc60c5): H7 ADR Accepted but script not implemented.
Per H7 ADR §五 Phase 1 deadline (H7 通過後 2 週內 = 2026-05-09).
[影響: 治理框架]
```

push：

```bash
git push origin main
```

紀錄 commit hash：

```bash
git log --format='%H %s' -1
```

### Step 9 · Issue #155 dashboard 同步

用 GitHub MCP `add_issue_comment`：

- repository owner: `zarqarwi`
- repository name: `paulkuo.tw`
- issue number: `155`
- body：

```markdown
## H7 governance-lint.sh Phase 1 補實作（2026-04-25）

對應 Q2 D3 揭露：commit `9bc60c5`
本輪實作：commit `<hash>`

### 落地內容

- `scripts/governance-lint.sh`：5 check function 全實作，Phase 1 只啟用 check 1 + 3
- `scripts/governance-lint-pre-commit.sh`：pre-commit wrapper
- `scripts/install-hooks.sh`：擴充安裝 governance-lint pre-commit hook
- pre-commit hook 已安裝
- Strict 攔截測試：PASS（缺 status 的 handoff 被正確擋下）
- repo 全掃：0 fail / N warnings（待填）

### 對照 Q2 D3

| 落差 | Q2 揭露 | 本輪處置 |
|---|---|---|
| 腳本本體 | ❌ 不存在 | ✅ 已實作 |
| pre-commit hook | ❌ 未安裝 | ✅ 已安裝 |
| 5 項 lint coverage | 0/5 | 2/5（Phase 1：check 1 + 3） |
| 有效護欄 | commit-msg + branch protection | + governance-lint pre-commit |

### 下一步

- Phase 2（check 2 + 4 + worklog 四維度）：H8 通過後 2 週內，本批已就近，可短期排程
- Phase 3（check 5 length-budget）：前提 H5 執行層完成（length-budget-status.md 建立後）
- CI workflow（H7 §三次要防線）：Phase 1 先 pre-commit 跑 1-2 週，再評估

---
產出：Code session，依 handoff `code--h7-lint-phase1-implementation-2026-04-25.md` 執行
```

替換 `<hash>` 為實際 commit hash 再發。發送前 grep 確認沒 `<hash>` 殘留。

---

## 3. 完成標準

- [ ] Step 1 前置檢查通過（含 H7/H8 ADR 存在驗證）
- [ ] Step 2 governance-lint.sh 寫入（5 function 實作、Phase 1 只啟用 1+3、跨平台 date 處理、python3 yaml fallback 已備）
- [ ] Step 3 pre-commit wrapper 寫入 + chmod +x
- [ ] Step 4 install-hooks.sh 擴充（無 hook 衝突）
- [ ] Step 5 lint 對現有 repo 跑（0 fail 或 fail 清單已記）
- [ ] Step 6 pre-commit hook 已安裝（.git/hooks/pre-commit 存在且可執行）
- [ ] Step 7 Strict 攔截測試 PASS（test handoff 被擋 + 清理乾淨）
- [ ] Step 8 commit + push 完成（hash 已記）
- [ ] Step 9 Issue #155 同步 comment 已發
- [ ] worklog 補章四維度已寫（H8 格式，含 done / decisions / pitfalls / abandoned）

---

## 4. 已知陷阱

1. **macOS vs Linux date 相容性**：H7 §Consequences §負面影響第 1 點明文警告。Step 2 處理 + Step 5 跑 manual 模式時實測一次（雖然 Phase 1 沒啟用 check 5，但程式碼存在仍要可解析）
2. **python3 yaml 依賴**：macOS 預設 python3 + PyYAML 通常 OK，但若報 ImportError，採 fallback 純 grep 解析（H7 ADR 偽代碼 line 444 是 yaml.safe_load）。fallback 設計：`grep -E '^pillar:\s*(\w+)$' "$file" | awk '{print $2}'` → 對 6 個白名單做字面比對
3. **install-hooks.sh 既有 pre-commit 衝突**：H7 §三明文「commit-msg hook 不混 governance lint」，但若已有其他 pre-commit hook（例如 lint-staged），需確認衝突。Step 4 先 Read 確認，有衝突就停回報
4. **Strict 測試 cleanup 不能漏**：Step 7 製造的 `_test-strict-block-temp.md` 必須清乾淨。Step 7 末尾兩行驗證確保 git status + ls 都「No such file」
5. **`.git/index.lock` 殘留**：sandbox uid ≠ 本機 uid 造成。Code 在本機 terminal 有權限刪
6. **5 function 全實作但 main 只啟用 2**：實作時保持 5 個 function 完整可運作（不要省略），main 只有 2 行 active call。未來 Phase 2 升級時，main 解註解 + 改 phase banner 即可，不動其他
7. **不重複 H7 偽代碼字面**：偽代碼是 spec，腳本可微調（變數命名、錯誤訊息中文化、加 banner）但邏輯核心要對齊 ADR 第一條規則
8. **Step 8 worklog 補章**：本 handoff 執行屬「H7 §五 Phase 1 落地」事件，worklog 應補章四維度（H8 格式）。abandoned 維度至少寫「Phase 2/3 未啟用（範圍邊界）」+「CI workflow 未寫（H7 §三次要防線，留下輪）」
9. **commit message `[影響: 治理框架]` 必標**（CLAUDE.md「commit message 強制標注」+ memory `feedback_git_show_body_not_oneline`）
10. **Phase 1 lint 跑出 fail 不要自修**：依 §1.2.3，留 fail 清單給 Paul 決定下一輪處置（可能 fail 對象本身需要修，可能規則需要細化）

---

## 5. 執行完後等 Paul 裁決的事項

執行完 Step 1-9 後，**不要繼續做下面任何事**：

### A. Phase 2 何時啟動

H7 §五 Phase 2 包含 check 2（F-ID）+ check 4（PENDING 五符號）+ worklog 四維度。前提 H8 已通過（已通過）。期限「H8 通過後 2 週內 = 2026-05-09」。

選項：

- A1. 立刻接著做（Phase 1 未跑 1-2 週驗證，可能未發現 false positive 就升級）
- A2. Phase 1 跑 1-2 週後再 Phase 2（依 memory `feedback_incremental_fix_observe_before_automate` 紀律）
- A3. 等 6/25 觀察期一起評估

### B. CI workflow（H7 §三次要防線）

Phase 1 只做 pre-commit。H7 §三明文 CI 為「次要防線」防 `--no-verify` 繞過。

選項：

- B1. Phase 1 + Phase 2 都落地後再加 CI（最後一塊拼圖）
- B2. Phase 1 完成即補 CI（並列防線）
- B3. 不做 CI（單人 repo `--no-verify` 風險低）

### C. Step 5 lint 跑出 fail 處置

如果 Step 5 對 repo 跑 lint 出現 fail，回報清單後 Paul 裁決：

- C1. 修復違規（可能需新 handoff）
- C2. 規則細化（H7 ADR 修訂）
- C3. 列入觀察期（PENDING.md）

### D. 本 handoff 自身歸檔

預設 D1（留 untracked，下輪歸檔），仿前面 cleanup 模式。

### E. D2 archive 79 份待歸清理

本 handoff 範圍**不處理** D2。Q2 D3 處置（本 handoff）優先於 D2，因為 D3 是治理破洞 D2 是衛生問題。Phase 1 + Phase 2 落地後再排 D2 cleanup batch。

---

## 6. 給 Code 的話

這份 handoff 跟前面 (c) cleanup / Q2 deployment 同風格——純執行 spec。所有「為什麼這樣做」的脈絡都已寫在 H7 ADR + Q2 D3 紀錄中。

執行紀律（與既往 handoff 一致）：

1. **嚴格按 §2 順序**——每一步驗證通過再進下一步
2. **任何 git status 預期外的狀態出現** → 停下回報 Paul
3. **任何驗證 fail** → 停下，**禁止** `git reset --hard` 或其他破壞性復原
4. **記得 Step 7 cleanup**——測試完一定清乾淨
5. **5 function 全實作但只啟用 2**——架構一次到位，未來 Phase 2 升級成本最低
6. **執行完不主動處理 §5 任何項目**

memory `feedback_oneliner_for_paul_terminal` + 憲法第二條：commit/push 必須在 Paul 本機。Code 你就在本機 terminal，是合規執行者。

H7 ADR 附錄 A 偽代碼是你最強的起點——把它落地到 `scripts/governance-lint.sh`，附 H7 §第一條的具體規則做最終驗證即可。

---

**handoff 產出者**：Cowork session (Sonnet 4.6)
**對應任務**：H7 governance-lint.sh Phase 1 補實作（Q2 D3 跟進）
**下一步**：Paul 開 Code session，餵此 handoff 給 Code 執行

---

## Consequences

### 實際執行結果（Code session 2026-04-25）

- ✅ Step 1-9 全綠
- ✅ Step 2 governance-lint.sh：5 check function 全實作（Phase 2/3 stub），main 只啟用 check 1 + 3
- ⚙️ Code 自己修了 grep fallback bug：H7 偽代碼原版沒限制 frontmatter 範圍，誤判 SKILL.md body 的「pillar」字串為值。Code 落地時加了範圍限制
- ⚠️ Step 5 manual lint 跑出 202 fail（100 unique 檔案 × 2 fail/份）——依 §1.2.3 不自修，列入 §5.C 等 Paul 裁決
- ✅ Step 6 pre-commit hook 安裝（`.git/hooks/pre-commit` 可執行）
- ✅ Step 7 Strict 攔截測試 PASS（缺 status 的 test handoff 被擋 + 清理乾淨）
- ✅ commit `24d7a03` push 成功
- ✅ Issue #155 dashboard 同步：[comment #4319913344](https://github.com/zarqarwi/paulkuo.tw/issues/155#issuecomment-4319913344)

### 對後續工作的影響

- Phase 1 落地關閉 Q2 D3 揭露的治理破洞（H7 ADR Accepted vs 腳本不存在）
- 揭露的 202 fail 清單分析：96 份 H7 通過前歷史 handoffs（grandfather 處置）+ 4 份本批次 Cowork handoff（補規範處置）
  - 4 份本批次：rev2 deployment / cleanup / Q2 / 本 handoff 自身（即本 commit 補的 frontmatter + Consequences）
- 觸發後續 cleanup-pass-2 handoff（grandfather 機制 + 4 份本批次 handoff 補規範 + memory 立 Cowork handoff 模板紀律）
- Phase 2（check 2 + 4 + worklog 四維度）未啟動：依 memory `feedback_incremental_fix_observe_before_automate`，建議 Phase 1 跑 1-2 週看 false positive 再升 Phase 2
- CI workflow 未補：H7 §三次要防線，Phase 1+2 落地後再加

### 遵守紀律確認

- 憲法第二條：commit/push 走 Paul 本機 ✅
- §1.2 不啟用 check 2/4/5 / 不寫 CI workflow / 不自修現有違規 / 不擴大範圍 ✅
- §4.6 5 function 全實作但只啟用 2（架構一次到位） ✅
- §4.10 Phase 1 lint 跑出 fail 不自修，回報清單給 Paul ✅
- §5.C lint fail 處置：Paul 回應 C2+C3（grandfather 機制 + 觀察期），由 cleanup-pass-2 落地

### 修正項目（cleanup-pass-2 範圍）

本 handoff 自身違反 H7 §第一條（缺 frontmatter status + Consequences 章節）——由 cleanup-pass-2 補規範（即本 commit 加入 frontmatter + 本章節）。修 bug 不是追溯，因本 handoff 為 H7 通過後產出，本來即應合規。
