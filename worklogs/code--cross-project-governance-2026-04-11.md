# Code Handoff — 跨子專案治理防線建置

> Repo 路徑：`~/Desktop/01_專案進行中/paulkuo.tw`
> 來源 session：Cowork + Chat（Opus 4.6 Extended Thinking）
> 日期：2026-04-11
> 目的：請 Code review 並 commit 所有新增/修改的檔案

---

## 背景

paulkuo.tw 六個子專案共用一個 codebase，之前只有一份靜態的 `docs/shared-file-impact-map.md` 提供跨專案影響資訊。這份文件是被動的——等人去查、等人問對問題。實際發生過改了 `translator.js` 沒驗 TQEF、handoff 沒帶 CORS 需求等問題。

這一輪 Cowork + Chat 聯合設計了**三層自動防線**，從「只靠規範」升級為「自動偵測 + 攔截」：

| 層 | 機制 | 觸發時機 | 用途 |
|----|------|---------|------|
| 1 | commit-msg hook | 每次 commit | 即時攔截：動到共用檔案但缺 `[影響: ...]` 標注就擋 |
| 2 | cross-project-impact skill | Cowork 開場/handoff/worklog 審查 | 主動分析：比對近期 commits 的影響範圍 |
| 3 | scheduled task（每日 10:30） | cron | 離線稽核：掃近 3 天 commits，漏標注寫入 PENDING.md |

**架構決策（路線 B，經 Chat Opus 4.6 Extended Thinking 確認）：**
- `worklogs/governance/projects.json` → 專案清單的唯一事實來源
- `docs/shared-files.json` → 共用檔案清單的唯一事實來源（不維護自己的子專案列表）
- Hook / skill / scanner 需要子專案名稱時，從 `projects.json` 讀

Chat 額外建議（已納入）：
- scanner 心跳機制（`last-scan.json`，超過 48 小時未更新告警）
- skill 只掃上次 handoff 後的 commits（省 token）
- Rollback Protocol 寫入 CLAUDE.md

---

## Step 0：偵察（先查再改）

請先跑以下指令確認現況：

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw

# 1. 確認新檔案都存在
ls -la docs/shared-files.json
ls -la scripts/commit-msg-hook.sh
ls -la scripts/install-hooks.sh
ls -la .git/hooks/commit-msg
ls -la .claude/skills/cross-project-impact/SKILL.md
ls -la worklogs/governance-architecture-review-2026-04-11.md

# 2. 確認 CLAUDE.md 已有新增區塊
grep -n "新 Clone 後必做" CLAUDE.md
grep -n "Rollback Protocol" CLAUDE.md

# 3. 確認 shared-file-impact-map.md 已更新
grep -n "shared-files.json" docs/shared-file-impact-map.md

# 4. 確認 hook 可執行
test -x .git/hooks/commit-msg && echo "hook is executable" || echo "hook NOT executable"

# 5. 看 git status 確認哪些檔案需要 commit
git status
```

---

## Step 1：測試 commit-msg hook

在 commit 之前，先驗證 hook 運作正常：

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw

# 測試 1：改共用檔案但不標注 → 應該被擋
echo "// test" >> worker/src/utils.js
git add worker/src/utils.js
git commit -m "test: hook should block this"
# 預期：看到 ╔══ 跨子專案影響偵測 ══╗ 錯誤訊息，commit 被拒絕

# 清理
git checkout -- worker/src/utils.js

# 測試 2：改共用檔案且有標注 → 應該放行
echo "// test" >> worker/src/utils.js
git add worker/src/utils.js
git commit -m "test: hook should allow this [影響: 全部]"
# 預期：看到 ✅ 跨子專案影響標注已確認，commit 成功

# 回退測試 commit
git reset HEAD~1
git checkout -- worker/src/utils.js

# 測試 3：改非共用檔案 → 直接放行，不會出提示
echo "test" > /tmp/hooktest.txt && cp /tmp/hooktest.txt test-hooktest.txt
git add test-hooktest.txt
git commit -m "test: non-shared file should pass silently"
# 預期：正常 commit，無任何跨專案提示

# 清理
git reset HEAD~1
rm test-hooktest.txt
```

---

## Step 2：Commit 新增檔案

確認 hook 測試通過後，分批 commit（一個 commit 只做一件事）：

### Commit 1：共用檔案清單（防線的事實來源）

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
git add docs/shared-files.json
git commit -m "feat: 建立跨子專案共用檔案清單 JSON（三層防線事實來源）

- critical: 極高風險檔案（影響全部子專案）
- shared_modules: 共用模組（影響部分子專案）
- ai_ready_auto: AI Ready 相關
- smoke_tests: 各子專案驗證指令
- 路線 B：專案清單指向 projects.json，本檔只管共用檔案

[影響: 僅治理機制]"
```

### Commit 2：Hook 腳本 + 安裝器

```bash
git add scripts/commit-msg-hook.sh scripts/install-hooks.sh
git commit -m "feat: 跨子專案影響偵測 commit-msg hook + 安裝腳本

- hook 動態讀 shared-files.json，缺影響標注就擋 commit
- 讀不到 JSON 或 python3 掛了 → 印警告、放行（graceful degradation）
- install-hooks.sh 供新 clone 後安裝
- 路線 B：子專案名稱從 projects.json 讀

[影響: 僅治理機制]"
```

### Commit 3：Cross-project-impact skill

```bash
git add .claude/skills/cross-project-impact/
git commit -m "feat: 跨子專案影響偵測 Cowork skill（防線第二層）

- 三個觸發點：開場掃描 / handoff 影響分析 / worklog 審查
- 動態讀 shared-files.json + projects.json
- scanner 心跳檢查（last-scan.json > 48h 告警）
- 只掃上次 handoff 後的 commits（省 token）

[影響: 僅治理機制]"
```

### Commit 4：CLAUDE.md 更新

```bash
git add CLAUDE.md
git commit -m "docs: CLAUDE.md 新增 hook 安裝指令 + Rollback Protocol

- 新 Clone 後必做：bash scripts/install-hooks.sh
- Rollback Protocol：5 種故障場景的復原步驟
- 經 Chat Opus 4.6 Extended Thinking 架構審查確認

[影響: 全部]"
```

### Commit 5：影響地圖更新 + 架構審查文件

```bash
git add docs/shared-file-impact-map.md
git add worklogs/governance-architecture-review-2026-04-11.md
git commit -m "docs: 影響地圖加 JSON 來源說明 + 治理架構審查文件

- shared-file-impact-map.md 標注 JSON 為事實來源
- 架構審查文件記錄完整討論脈絡（供未來回溯）

[影響: 僅文件]"
```

---

## Step 3：驗證 commit 完成

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw

# 確認所有 commit 都在
git log --oneline -6

# 確認沒有殘留未 commit 的修改
git status

# 確認 hook 仍然正常（前面的 commit 帶了 [影響:] 標注，應該都通過了）
git log --oneline -5 | grep "影響"
```

---

## Step 4：Push

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
git push origin main
```

---

## 注意事項

1. **`.git/hooks/commit-msg` 不進 git**：這個檔案是 Cowork 直接寫入本機的，已經在 Paul 的電腦上就位。`scripts/commit-msg-hook.sh` 是它的備份版本，進 git。未來新 clone 跑 `bash scripts/install-hooks.sh` 就能恢復。

2. **Scheduled task 不在 repo 裡**：第三層防線（每日 10:30 scanner）是 Cowork 排程任務，由 Cowork 執行環境管理，不需要 Code commit 任何東西。

3. **`worklogs/governance-architecture-review-2026-04-11.md` 放在 worklogs/**：這是給 Chat 的 briefing 文件 + Chat 回覆結論的完整紀錄，放在 worklogs/ 供未來回溯。

4. **Hook 依賴 python3**：macOS 內建 python3，Linux 大多也有。如果極端情況沒有 python3，hook 會印警告然後放行（不會擋住正常工作流程）。

5. **路線 B 的含義**：以前 `shared-files.json` 有自己的 `subprojects` 欄位，現在移除了。需要子專案名稱時去讀 `worklogs/governance/projects.json`。這樣新增子專案只改 `projects.json` + `automation-registry.json`，不用改三個檔案。

---

## 追加變更：affects 欄位一致性修正（Chat 建議）

> 此變更在原 handoff 之後由 Cowork 追加。Code 如果還沒 commit，直接用新版即可。如果已經 commit 了舊版，請額外加一筆 commit。

**問題**：`shared-files.json` 的 `affects` 欄位原本用非正式簡稱（`"Wiki"`、`"主站"`、`"Formosa"`），跟 `projects.json` 的 `id`（`"llm-wiki"`、`"paulkuo-main"`、`"formosa-esg"`）和 `name`（`"LLM Wiki"`、`"Paulkuo 網站"`、`"白沙屯 ESG 繞境"`）都對不上。未來 projects.json 改名就會斷。

**已修正**：
- `shared-files.json`：affects 改用 `project_id`，`"全部"` 改為 `"*"`，新增 `_affects_convention` 欄位說明慣例
- `scripts/commit-msg-hook.sh`：python3 區塊新增 `resolve_affects()` 函式，從 projects.json 查中文名再顯示
- `.git/hooks/commit-msg`：已由 Cowork 同步更新（本機生效）

如果需要獨立 commit：

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
git add docs/shared-files.json scripts/commit-msg-hook.sh
git commit -m "fix: affects 欄位改用 project_id，顯示時查 projects.json 中文名

- shared-files.json affects: 非正式簡稱 → project_id（如 llm-wiki、formosa-esg）
- '全部' → '*'，新增 _affects_convention 欄位說明慣例
- hook 的 resolve_affects() 負責 id → 顯示名稱轉換
- Chat Opus 4.6 Extended Thinking 指出此一致性風險

[影響: 僅治理機制]"
```

---

## 回報格式

完成後請在 worklog 記錄：

```markdown
## 完成日誌
- {HH:MM} 跨子專案治理防線 — review + commit 5 筆（{commit hashes}） Code

## 驗證
- ✅/❌ hook 測試 1（缺標注被擋）
- ✅/❌ hook 測試 2（有標注放行）
- ✅/❌ hook 測試 3（非共用檔案放行）
- ✅/❌ 所有檔案已 commit
- ✅/❌ git push 成功
```
