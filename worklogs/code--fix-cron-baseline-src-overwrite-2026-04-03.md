# Code Handoff: 調查 cron baseline 腳本為何覆蓋 src/ 手動改動

**日期**：2026-04-03
**來源**：Cowork session
**優先級**：🔴 高（已造成線上事故）

---

## 背景

4/3 部署 2025 LCA 報告連結時，commit `1ede39d`（feat: add 2025 LCA sustainability report link）推上 GitHub 後，8 分鐘內被 `5f8aa84`（chore: external eval temporal baseline）覆蓋回舊版。

**關鍵問題**：baseline commit 把 `src/` 的檔案還原到 LCA commit 之前的狀態。正常的 baseline 應該是「快照當下 working tree 的狀態」，不應該回退已 push 的改動。

⚠️ **不要直接排除 src/**——baseline 腳本可能需要完整 repo 快照才能正常運作。要找的是「為什麼它會把檔案還原到舊版」。

---

## Step 0 偵察

```bash
# 1. 找到產生 baseline commit 的腳本
grep -rn "external eval temporal baseline" scripts/ .claude/ cron* Makefile package.json --include="*.sh" --include="*.js" --include="*.json" --include="*.yml"

# 2. 看那筆 commit 實際改了什麼檔案
git show 5f8aa84 --stat
git diff 1ede39d 5f8aa84 -- src/

# 3. 理解腳本的完整流程
# 找到腳本後，重點看：
#   - 有沒有 git checkout / git restore / git reset？
#   - git stash → pull → stash pop 的順序和錯誤處理
#   - git add 的範圍（-A 還是指定目錄）
#   - 是否有從某個 ref 做 checkout 來「建立 baseline」？

# 4. 確認 cron 排程
crontab -l 2>/dev/null || echo "no user crontab"
```

---

## 診斷方向

### 假設 A：腳本有 git checkout/restore
如果腳本從某個 ref checkout 檔案來建立 baseline，那它會把手動改動蓋掉。
→ 修法：改成只讀（產出 diff report），不要實際修改 working tree

### 假設 B：git stash/pop 衝突解析
如果流程是 stash → pull → stash pop，pop 時可能因為衝突把手動改動丟掉。
→ 修法：stash pop 加 `--index`，或衝突時 abort 而非 silent resolve

### 假設 C：git add -A 把 unstaged 的還原也 commit 了
如果腳本在某處對 src/ 做了 restore 後再 add -A。
→ 修法：找到那個 restore 並移除

---

## 驗證方式

1. 讀完腳本後，先在 worklog 記錄完整流程分析
2. 修復後，手動修改 `src/` 任一檔案 → commit → push
3. 等 cron 跑兩輪（~20 分鐘）
4. `git log --oneline -5` + `git diff HEAD~1 -- src/` 確認 src/ 沒被 revert
5. 同時確認 baseline 功能本身還正常運作

---

## 注意事項

- 不要破壞 baseline/eval 的核心功能
- 不要影響 worklogs/ 和 data/ 的自動 commit
- commit + push 維持原子操作
- 改完之後 4/12 前再觀察幾天，確認穩定

---

## 回報格式

完成後在 worklog 記錄：
- baseline 腳本的完整流程分析（它到底在幹嘛）
- 根本原因是假設 A/B/C 的哪一個
- 修改了哪個腳本、哪幾行
- 驗證結果
- commit hash
