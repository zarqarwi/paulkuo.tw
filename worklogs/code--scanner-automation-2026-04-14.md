# Code Handoff — Scanner 自動化 workflow 建置

> **來源**：Cowork session 發現 Phase 3 Dashboard 顯示「48h 未更新」→ 診斷發現 scanner 從未排程
> **日期**：2026-04-14（下午）
> **Task Size**：M-L（預估 45-75 分鐘）
> **建議模型**：Sonnet 4.6
> **信心等級**：中高——路徑清楚，主要風險在 GitHub Actions concurrency + git push back 流程

## TL;DR

三件事，**按順序做**，不要跳：

1. **先 cleanup 假資料**（5 min）：revert local `last-scan.json` 改動、rm 3 個 untracked `impact-scan-*.md` 假檔、commit 這個 cleanup
2. **建新 workflow**（30-50 min）：`.github/workflows/governance-scanner.yml`，每日 UTC 02:00（台灣 10:00）自動跑 scanner + kv-seed，結果 commit back
3. **手動觸發一次驗證**（10 min）：workflow_dispatch 跑一次、看 Actions logs、確認 KV 更新、Paul 肉眼看 Dashboard badge 轉綠

**為什麼要這樣順序**：cleanup 先做才能有乾淨的 baseline。若先跑 workflow，假資料會跟真資料混在一起，未來追蹤問題會亂。

---

## Changelog

- **2026-04-14 v1**：Cowork 偵察完成、scope 確認、integration 細節補完後產出

---

## 0. 開場

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
pwd
git status --short
git log --oneline -3
```

預期：乾淨的 main branch、最新 commit 是 `a38de6d docs(worklog): Harness 文件庫上架完成紀錄`（或之後有別的 commit）。如果有 uncommitted 改動，先確認是不是你預期的，不是就 stash。

---

## 1. 背景（為什麼有這個任務）

Phase 3（commit 851dd58）把 governance Dashboard 的稽核面板做出來了，包含：
- `/api/governance/audit` endpoint 讀 KV `gov:audit`
- 前端 panel 顯示 scanner_status badge / open_issues / trend chart
- `governance-kv-seed.cjs` 把 `worklogs/governance/audit-results/*.json` 寫進 KV
- `cross-project-scanner.cjs` 產出 audit-results JSON + 更新 last-scan.json

**但 scanner 那一端的自動化沒做完**：沒有任何 workflow 呼叫 scanner。所以從 04-11 Phase 3 commit 那一天手動跑過一次之後，scanner 就沒再跑過。

Dashboard 顯示「⚠️ 48h 未更新」是 100% 正確的——真的就是那麼久沒更新。

更糟的是：過去幾天有 Claude session（不確定是 Cowork 還是 Code）為了讓 Dashboard badge 不要 warning，**手動偽造了 3 個 impact-scan markdown + 改過 last-scan.json 的時間戳**（但都沒 commit）。這些假資料必須清掉，不能跟真的 scanner 自動化混在一起。

---

## 2. Part 1 — Cleanup 假資料（5 分鐘）

### 2.1 Revert `last-scan.json`

這個檔案的本機版是**假資料**（格式跟 scanner 實際輸出不符、時間戳是偽造的）：

```bash
# 先看 diff 確認你要 revert 的是什麼
git diff worklogs/governance/last-scan.json
```

你會看到：
- 舊版（committed，真的）：`last_success: 2026-04-11T09:27:53.391Z`、`flagged_count: 6`
- 新版（local，假的）：`last_success: 2026-04-14T10:02:00+08:00`、`issues_found: 1`、還有 scanner 不會寫的 `source_files` 欄位

Revert：

```bash
git checkout worklogs/governance/last-scan.json
```

再 `cat` 確認回到 04-11 的版本。

### 2.2 刪除 3 個假 markdown

這三個 untracked 檔案**不是 scanner 寫的**（scanner 根本不寫 markdown），是某個 session 手寫模擬的：

```bash
ls -la worklogs/impact-scan-2026-04-1{2,3,4}.md   # 確認都在
rm worklogs/impact-scan-2026-04-12.md worklogs/impact-scan-2026-04-13.md worklogs/impact-scan-2026-04-14.md
git status --short worklogs/impact-scan* 2>&1   # 確認沒了
```

### 2.3 Commit cleanup

```bash
git add -u worklogs/governance/last-scan.json
git status --short
# 應該看到：
#   M  worklogs/governance/last-scan.json（revert 後的狀態）
#   （impact-scan-*.md 因為是 untracked + rm，git status 不會顯示）

git commit -m "chore(governance): 清理 scanner 假資料

- revert last-scan.json 的假時間戳（本機被改成 2026-04-14，
  但 scanner 實際最後執行是 2026-04-11）
- 刪除 3 個手寫的 impact-scan-*.md（04-12/13/14），scanner
  本身只產 JSON 不產 markdown，這些檔案是模擬輸出

為 Part 2 建立乾淨 baseline，scanner workflow 之後產出的
才是真資料。

Refs: worklogs/code--scanner-automation-2026-04-14.md"
```

**先不 push**，等 Part 2 做完一起 push。

---

## 3. Part 2 — 建 scanner workflow（30-50 分鐘）

### 3.1 建檔路徑

```
.github/workflows/governance-scanner.yml
```

### 3.2 Secrets 檢查

這個 workflow 需要的 secrets 已經存在（其他 workflow 已在用）：
- `CLOUDFLARE_API_TOKEN`（backup-d1.yml / deploy.yml 都在用）
- `CLOUDFLARE_ACCOUNT_ID`

不需要新增 secret。

### 3.3 Workflow 完整內容

以下是建議的 workflow，**不要盲抄**，請逐行理解：

```yaml
name: Governance Scanner — Daily Cross-Project Audit

on:
  schedule:
    # UTC 02:00 = Taiwan 10:00
    # 選 10:00 是因為：(1) Taiwan 工作時間開始、(2) 對齊其他治理 cron task
    - cron: '0 2 * * *'
  workflow_dispatch:  # 手動觸發用

# 防止同時跑兩個 scanner 導致 commit 衝突
concurrency:
  group: governance-scanner
  cancel-in-progress: false

jobs:
  scan:
    name: Cross-project scan + KV seed
    runs-on: ubuntu-latest
    permissions:
      contents: write   # 需要 push scanner 產出回 repo

    steps:
      - name: Checkout（要完整 history 才能掃 git log）
        uses: actions/checkout@v4
        with:
          fetch-depth: 0   # scanner 用 git log 掃近 N 天 commit

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install wrangler
        run: npm install -g wrangler@3

      - name: Validate Cloudflare secrets
        env:
          CF_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CF_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        run: |
          MISSING=0
          [ -z "$CF_API_TOKEN" ] && { echo "❌ CLOUDFLARE_API_TOKEN missing"; MISSING=1; }
          [ -z "$CF_ACCOUNT_ID" ] && { echo "❌ CLOUDFLARE_ACCOUNT_ID missing"; MISSING=1; }
          [ "$MISSING" -eq 1 ] && exit 1
          echo "✅ Cloudflare secrets OK"

      - name: Run cross-project scanner
        run: |
          node scripts/cross-project-scanner.cjs
          echo "--- last-scan.json ---"
          cat worklogs/governance/last-scan.json
          echo "--- audit-results/ ---"
          ls -la worklogs/governance/audit-results/

      - name: Seed governance KV
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        run: |
          node scripts/governance-kv-seed.cjs --remote

      - name: Commit scanner outputs back to repo
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"

          # 只 add scanner 產出的路徑，不要順手 add 別的
          git add worklogs/governance/audit-results/ worklogs/governance/last-scan.json worklogs/PENDING.md || true

          # 如果沒有實際變更就跳過 commit
          if git diff --cached --quiet; then
            echo "No changes to commit"
            exit 0
          fi

          TODAY=$(date +%Y-%m-%d)
          git commit -m "auto(scanner): daily audit ${TODAY}

          自動產出：
          - audit-results/${TODAY}.json（新）
          - last-scan.json（更新時間戳）
          - PENDING.md（如有新 missing smoke test）"

          # rebase 上最新 main 後 push，避免跟其他 auto commit 衝突
          git pull --rebase origin main || {
            echo "❌ rebase failed, manual intervention needed"
            exit 1
          }
          git push origin main
```

### 3.4 為什麼這樣設計（重要，Code 必讀）

- **`fetch-depth: 0`**：scanner 用 `git log --since` 掃近 3 天 commits，shallow clone 抓不到歷史會回空清單
- **`concurrency: group`**：防止 cron 跟 workflow_dispatch 同時觸發導致 commit race
- **`permissions: contents: write`**：workflow 要 push 回 repo，預設 permissions 不夠
- **`git pull --rebase` 再 push**：scanner 跑的時候，其他 auto commit（例如 `auto-close.yml`、`translate.yml`）可能已經 push 了新 commit，直接 push 會 reject
- **`git diff --cached --quiet` 跳空 commit**：如果某天沒新 flagged，scanner 不會產新 JSON，不該留 empty commit
- **Scanner 會碰 PENDING.md**：`scripts/cross-project-scanner.cjs` line 216 會 `appendFileSync` 到 PENDING.md（有 flagged smoke test 時）。workflow 要 add `PENDING.md`，但有去重檢查（line 215 `!existing.includes(...)`），同一天多次跑不會重複追加
- **不要用 GITHUB_TOKEN push**：預設 GITHUB_TOKEN push 進 main 不會觸發其他 workflow——這次沒差（scanner 不應該觸發 deploy），但如果未來想讓這個 commit 觸發其他 action，要改用 deploy key 或 PAT

### 3.5 Commit workflow

```bash
git add .github/workflows/governance-scanner.yml
git status --short
git commit -m "feat(ci): 新增 governance scanner daily workflow

- 每日 UTC 02:00（台灣 10:00）自動跑 cross-project-scanner.cjs
- 跑完後 governance-kv-seed.cjs --remote 推結果到 KV
- audit-results/ + last-scan.json + PENDING.md 新增 commit 回 repo
- 補完 Phase 3（851dd58）未完成的 scanner 自動化環節

Refs: worklogs/code--scanner-automation-2026-04-14.md"
```

---

## 4. Part 3 — 手動觸發 + 驗證（10 分鐘）

### 4.1 Push 先告知 Paul

跟上一個 Harness handoff 一樣的規則：**不要自己 push**，先告知 Paul。

到這個階段你已經有 2 個 commit（cleanup + workflow）。告訴 Paul：
```
已完成：
- {cleanup commit hash} chore(governance): 清理 scanner 假資料
- {workflow commit hash} feat(ci): 新增 governance scanner daily workflow
請 Paul 授權 push origin main。Push 後我會手動觸發 workflow 驗證。
```

### 4.2 Paul 授權後

```bash
git push origin main
```

### 4.3 手動觸發 workflow

```bash
gh workflow run governance-scanner.yml
# 等 5-10 秒
gh run list --workflow=governance-scanner.yml --limit 1
# 看最新一筆的 status、id
```

或到 GitHub UI：`Repo → Actions → Governance Scanner → Run workflow`。

### 4.4 觀察 run

```bash
# 抓最新 run id
RUN_ID=$(gh run list --workflow=governance-scanner.yml --limit 1 --json databaseId --jq '.[0].databaseId')

# 跟 run
gh run watch $RUN_ID

# run 完看 logs
gh run view $RUN_ID --log | tail -100
```

### 4.5 驗證產出

```bash
# 拉最新（scanner push 了新 commit 回 repo）
git pull origin main

# 確認新 JSON 有產出
ls -la worklogs/governance/audit-results/
# 預期：除了 2026-04-11.json，還看到 2026-04-14.json

# 看 last-scan.json 是真的 scanner 寫的（UTC Z 時間戳、flagged_count 欄位）
cat worklogs/governance/last-scan.json
```

驗證 KV 有更新：

```bash
# 需要 Paul 的 GOVERNANCE_TOKEN（請在 chat 跟他要）
curl -sH "Authorization: Bearer <TOKEN>" https://paulkuo.tw/api/governance/audit | head -50
```

預期看到今天日期的 `last_scan` 欄位。

### 4.6 Paul 肉眼驗證

請 Paul 開 https://paulkuo.tw/governance/ → 輸入 token → 拉到稽核面板底部：

- [ ] Badge 從 `⚠️ 48h 未更新` 變成 `✅ OK`（或「正常」之類綠色狀態）
- [ ] `#audit-open-issues` 數字更新為今天的真實數
- [ ] `last_scan` 時間變成今天
- [ ] Trend chart 多了一個今天的資料點

全 pass → workflow 正式生效，明天 UTC 02:00 會自動跑。

---

## 5. 跨子專案影響

**這次動的檔案**：
- `.github/workflows/governance-scanner.yml`（新增）
- `worklogs/governance/last-scan.json`（revert）
- `worklogs/impact-scan-2026-04-1{2,3,4}.md`（刪除）

**commit message 需不需要 `[影響: ...]` 標注？**

不需要——都不是 `docs/shared-file-impact-map.md` 裡列的共用模組。`.github/workflows/` 是獨立於 Astro/Worker 兩端的 CI 層。

---

## 6. Scope boundary — NOT to do

- ❌ **不要修改 `scripts/cross-project-scanner.cjs`** 的邏輯（這次只是「把它排程跑起來」，不是改 scanner 本身）
- ❌ **不要修改 `scripts/governance-kv-seed.cjs`**
- ❌ **不要修改 `worker/src/governance-api.js`** 或 governance 前端頁面（Phase 3 那一端是好的）
- ❌ **不要順手處理那 9 個積欠的稽核問題**（4 缺 tag + 5 缺 smoke test）——那是另一回事，讓 scanner 明天自動 re-scan 會重新掃到
- ❌ **不要改 concurrency 以外的 workflow 共用設定**
- ❌ **不要刪除 `worklogs/governance/audit-results/2026-04-11.json`**（這是唯一一個真的 scanner 輸出，留著當歷史）
- ❌ **不要手動編輯 `worklogs/PENDING.md`**（scanner 會自己 append，workflow 會 commit 回 repo，你改了會衝突）
- ❌ **不要自己 push**（兩個 commit 都要先告知 Paul）

---

## 7. 不可逆操作

- **刪除 3 個 untracked `impact-scan-*.md`**：這些檔案是假資料，但刪了就沒了。不過它們沒進 git，沒歷史可查，且是偽造輸出——確認**不可惜**
- **revert `last-scan.json`**：把本地假時間戳覆蓋掉。其實 `git checkout` 是拿 committed 版本覆蓋 working tree，工作樹本地改動消失但能從 git 拿回（如果你想要的話）——不過這些改動本身是假資料，**不值得留**

---

## 8. 卡關指南

- **Workflow run 失敗在「Install wrangler」**：`npm install -g` 可能在 CI 慢，檢查是不是 timeout；或用 `--prefix` 裝到本地 `./node_modules/.bin`
- **Wrangler KV 寫入權限錯誤**：檢查 `CLOUDFLARE_API_TOKEN` 是否有 `Workers KV Storage:Edit` permission（backup-d1.yml 已在用，正常應該有）
- **`git push` 被 reject（non-fast-forward）**：別的 auto workflow 搶先 push 了，workflow 裡已經有 `git pull --rebase` 處理；如果 rebase 也失敗（conflict），手動解或讓 workflow 下次重跑
- **Scanner 掃不到 commit**：檢查 `fetch-depth: 0` 有沒有設定，預設 shallow clone 只抓最新 commit
- **Scanner 產出 JSON 但 KV 沒更新**：檢查 kv-seed 的 `--remote` flag 有沒有傳，以及環境變數是不是進到 kv-seed
- **Workflow 跑了但 Dashboard 還是 48h 警告**：KV CDN 生效要等 30-60 秒，Worker 快取更久；hard refresh 還不行的話檢查 `/api/governance/audit` 回應
- **其他**：停下來問 Paul，不要猜

---

## 附錄 A：相關檔案

| 檔案 | 狀態 | 動作 |
|------|------|------|
| `.github/workflows/governance-scanner.yml` | 📝 新增 | Part 2 |
| `worklogs/governance/last-scan.json` | 📝 revert | Part 1 |
| `worklogs/impact-scan-2026-04-12.md` | 🗑️ 刪 | Part 1 |
| `worklogs/impact-scan-2026-04-13.md` | 🗑️ 刪 | Part 1 |
| `worklogs/impact-scan-2026-04-14.md` | 🗑️ 刪 | Part 1 |
| `scripts/cross-project-scanner.cjs` | ❌ 不動 | Scope boundary |
| `scripts/governance-kv-seed.cjs` | ❌ 不動 | Scope boundary |
| `worker/src/governance-api.js` | ❌ 不動 | Scope boundary |
| `src/pages/governance/index.astro` | ❌ 不動 | 上午才改過 |
| `worklogs/governance/audit-results/2026-04-11.json` | ❌ 不動 | 歷史資料 |

## 附錄 B：參考既有 workflow

這份 handoff 的 workflow 模板參考：
- `.github/workflows/backup-d1.yml`：Cloudflare secrets 驗證模式、wrangler install 方式
- `.github/workflows/deploy.yml`：CLOUDFLARE_API_TOKEN 使用方式

---

## 9. 完成後回報

結構化回報：
1. 兩個 commit hash（cleanup + workflow）
2. Workflow run URL（`gh run view $RUN_ID --json url --jq .url`）
3. `audit-results/` 產出的新 JSON 檔名
4. Paul 回報的 Dashboard badge 狀態（該 Paul 回報你補進來）
5. worklog 追加（`worklogs/worklog-2026-04-14.md` 三維度紀錄）
6. PENDING.md 更新：「Scanner 自動化」那筆（如果 Cowork 有 stage）標 `[x]`

### Worklog 範本

```markdown
## 完成日誌
- HH:MM scanner 自動化 workflow 建置完成 ({cleanup-hash}, {workflow-hash}) Code

## 決策紀錄
- Workflow 排程選 UTC 02:00 (台灣 10:00)：對齊原 PENDING 裡「每日 10:02」的預期，也避開其他 auto workflow 集中時段
- 用 `git pull --rebase` 而不是 merge commit：avoid polluting git log

## 阻礙與踩坑
- {如果有，寫在這裡}

## Smoke Test
- ✅ Cleanup commit 乾淨（last-scan.json revert + 3 個 untracked md 刪除）
- ✅ Workflow manual trigger 成功
- ✅ audit-results/2026-04-14.json 產出
- ✅ last-scan.json 是 scanner 真實輸出格式（UTC Z + flagged_count）
- ✅ KV gov:audit 有今天資料
- ✅ Paul 回報 Dashboard badge 轉綠

## 狀態變更
- Phase 3 Scanner 自動化（未完成）→ 已完成（{workflow-hash}）
- `worklogs/PENDING.md` 若有相關項目：待 Code → 已完成
- 揭示 memory「跨子專案影響偵測三層防線」：scanner 層從排程缺失 → 正式啟用
```

---

**一句話總結**：Phase 3 當初只做了 Dashboard 前端，沒做 scanner 排程。這次補上 GitHub Actions daily workflow、清掉過去幾天的假資料、手動觸發一次驗證 end-to-end 通了。Scope 嚴格鎖在「排程 + cleanup」，不碰 scanner 邏輯本身。
