# RFC #100 調查討論文件 — Cowork → Code

**日期**：2026-04-05
**性質**：討論用，非行動指令。請 Code 先review，有異議或新發現再一起決定下一步。

---

## 一、已確認的事實（Cowork 有信心的部分）

### 1. Build 失敗的直接原因
- `wrangler deploy` 報錯：`No matching export in "src/formosa.js" for import "handleFormosaHealthAlert"`
- `worker/src/index.js` 第 31 行有 `import { handleFormosaHealthAlert } from './formosa.js'`（commit 4275cc6，Issue #99 時加入）
- `worker/src/formosa.js` 在 GitHub main 上**從未有過** `handleFormosaHealthAlert` 這個 export
- 用 GitHub code search 搜 `handleFormosaHealthAlert`，只在 `index.js` 出現，`formosa.js` 完全沒有

### 2. Cron 腳本確認安全
- `crontab -l` 顯示每 10 分鐘執行的是 `scripts/auto_update_data.sh`（v7）
- v7 只 `git add data/timing.json data/stock.json`，不碰 `src/` 或 `worker/`
- "auto: data update" commits 逐一查看 diff，全部只改 `data/timing.json`
- **Cron 不是造成程式碼遺失的兇手**

### 3. 根目錄舊版腳本
- 根目錄有一份 `auto_update_data.sh`（v3），裡面有 `git stash --include-untracked` 和 `git reset --hard origin/main` 等危險操作
- **目前不在 crontab 裡**，不會自動執行
- 但留在 repo 裡容易混淆，建議清理

### 4. RFC #100 worklog 記錄 vs 實際
- Worklog 記載「04-04 15:xx RFC #100 三項全完成」
- 但 GitHub main 上找不到對應的 commit
- 結論：Code session 可能在 local 做完了，但沒有成功 push 到 remote

---

## 二、Cowork 的誤判經過（透明交代）

### 誤判 1：最初把 cron 當成兇手
**錯誤推論**：看到 GitHub `list_commits` 回傳「auto: data update」commits 跟 `formosa.js` 有關聯，就推斷 cron 覆蓋了 formosa.js。

**實際情況**：GitHub API 的 `list_commits(path=worker/src/formosa.js)` 回傳的是「該檔案存在於 commit tree 中」的 commits，不代表「那些 commits 改動了該檔案」。查看 diff 後確認那些 commit 只改了 `data/timing.json`。

**教訓**：`list_commits` + `path` 參數的語義跟直覺不同，不能當作「哪些 commit 改了這個檔案」來用。

### 誤判 2：之前的 memory 宣稱「RFC #100 已完成已部署」
**錯誤來源**：之前的 Cowork session 根據 Code session 的 worklog 記錄就標記為「完成」，沒有獨立驗證 GitHub main 上是否真的有對應的 commit。

**教訓**：worklog 說「做完了」≠ 程式碼已經在 GitHub main 上。Cowork 驗收必須查 remote，不能只信 worklog。

---

## 三、目前的假說

**RFC #100 的程式碼（handleFormosaHealthAlert + 等級統一 + SW）從未 push 到 GitHub main。**

可能原因（需要 Code 在 Paul 本機驗證）：
1. Code session 做完後忘記 commit + push
2. Commit 了但被 `git pull --rebase --autostash` 的 autostash pop 衝突 silently drop
3. 程式碼只存在 Code session 的暫存記憶體裡，session 結束就消失了

---

## 四、待 Code 調查的問題

### Q1：本機 reflog 有沒有 RFC #100 的痕跡？
```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
git reflog | grep -i "health\|rfc\|#100\|alert" | head -20
git reflog --since="2026-04-04 14:00" --until="2026-04-04 20:00"
```
如果有找到 commit hash → cherry-pick 回來最快。

### Q2：本機 formosa.js 目前有沒有 handleFormosaHealthAlert？
```bash
grep -n "handleFormosaHealthAlert" worker/src/formosa.js
```
如果本機有但 remote 沒有 → 代表是 push 失敗或遺失，直接 commit + push 即可。

### Q3：有沒有殘留的 stash？
```bash
git stash list
```
v7 cron 在 push 失敗時用 `git pull --rebase --autostash`，autostash 可能產生殘留的 stash。

### Q4：04-04 下午的 Code session 到底做了什麼？
Code 的 worklog 寫「三項全完成」，但 git log 裡沒有對應的 commit。有幾種可能：
- (a) 做完了沒 commit
- (b) commit 了沒 push
- (c) commit + push 了但被後續的 rebase 操作覆蓋
- (d) Code session 在記憶體裡完成，還沒寫入檔案 session 就結束了

Code 能不能回憶一下那次 session 的操作紀錄？

### Q5：其他兩項 RFC #100 功能是否也遺失？
- **P0 等級計算統一**：`grep -n "computeRank" worker/src/formosa.js` 確認邏輯
- **A2 Service Worker**：`ls public/sw.js public/offline.html` 確認檔案是否存在

這三項可能是一起遺失的。

### Q6：根目錄 v3 腳本怎麼處理？
Cowork 確認它不在 crontab 裡，但它留在 repo 很容易造成混淆。建議刪除，但想聽 Code 的意見——有沒有任何原因需要保留？

---

## 五、Cowork 的建議方向（待討論，非指令）

| 情況 | 處理方式 |
|------|----------|
| reflog 找到 commit | cherry-pick → push → Paul 跑 wrangler deploy |
| 本機有程式碼但沒 commit | commit → push → Paul 跑 wrangler deploy |
| 完全找不到 | 依 handoff spec 重新實作（spec 已在 `worklogs/code--rfc100-missing-push-2026-04-05.md`）|

不管哪種情況，之後都需要：
1. `npx wrangler deploy --dry-run --config worker/wrangler.toml` 確認 build 過
2. Paul 跑 `wrangler deploy`
3. 等 5 分鐘 cron 觸發，確認 health alert 有 log 輸出

---

## 六、這份文件的用法

1. Code 先讀這份文件
2. 跑 Q1-Q5 的偵察指令
3. 把發現回報（worklog 或直接跟 Paul 說）
4. 雙方對齊後再決定修復路徑
5. **不急著立刻行動**

---

*Cowork session 2026-04-05 產出*
