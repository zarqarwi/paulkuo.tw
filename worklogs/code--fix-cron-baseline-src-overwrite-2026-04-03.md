# Code Handoff: 修復 cron baseline 腳本覆蓋 src/ 問題

**日期**：2026-04-03
**來源**：Cowork session
**優先級**：🔴 高（已造成線上事故）

---

## 背景

4/3 部署 2025 LCA 報告連結時，commit `1ede39d`（feat: add 2025 LCA sustainability report link）推上 GitHub 後，8 分鐘內被 `5f8aa84`（chore: external eval temporal baseline）覆蓋回舊版。

根本原因：cron 的 baseline/eval 腳本對整個 repo 做全檔案 commit，把手動修改的 `src/` 原始碼檔案蓋回舊版本。

這代表**任何對 src/ 的手動改動，都有被下一輪 cron 吃掉的風險**。4/12 起駕前如果還要改前端，同樣的事會再發生。

---

## Step 0 偵察

先找出是哪個腳本在產生 "external eval temporal baseline" commit：

```bash
# 找到產生 baseline commit 的腳本
grep -rn "external eval temporal baseline" scripts/ .claude/ cron* Makefile package.json --include="*.sh" --include="*.js" --include="*.json" --include="*.yml"

# 確認 cron 排程
crontab -l 2>/dev/null || echo "no user crontab"
cat scripts/*.sh | grep -i "baseline\|eval\|stash"

# 確認 git stash/pop 的邏輯
grep -rn "git stash\|git add \.\|git add -A\|git commit" scripts/ .claude/
```

---

## 具體修復

### 方案：排除 src/ 目錄

在 baseline/eval 腳本的 `git add` 指令中，排除 `src/` 和其他原始碼目錄：

```bash
# 改前（推測）
git add -A && git commit -m "..."

# 改後
git add worklogs/ data/ scripts/.last_push_ts .claude/ -- ':!src/' && git commit -m "..."
# 或者用白名單模式，只 add 資料目錄
```

確保以下目錄**不會**被 cron 自動 commit：
- `src/`（前端原始碼）
- `worker/src/`（Worker 原始碼）
- `public/`（靜態資源）

### 同時檢查 git stash/pop 邏輯

如果 cron 有跑 `git stash` → `git pull` → `git stash pop`，確認：
- stash pop 失敗時的 fallback（不要 silent fail）
- stash 不要意外把手動改動帶進 auto commit

---

## 驗證方式

1. 手動修改 `src/` 任一檔案（例如加個 HTML comment）
2. commit + push
3. 等 cron 跑兩輪（~20 分鐘）
4. `git log --oneline -5` 確認 auto commit 沒有 touch `src/`
5. `git diff HEAD~1 -- src/` 確認 src/ 沒有被 revert

---

## 注意事項

- cron 每 10 分鐘跑一次，改腳本後要確認下一輪正常
- 不要影響 `worklogs/` 和 `data/` 的自動 commit 功能
- commit + push 要維持原子操作（session-handoff SOP 已有記載）

---

## 回報格式

完成後在 worklog 記錄：
- 修改了哪個腳本、哪幾行
- 驗證結果（等了幾輪 cron，src/ 有無被動）
- commit hash
