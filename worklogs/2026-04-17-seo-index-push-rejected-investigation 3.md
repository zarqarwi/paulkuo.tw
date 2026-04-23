# SEO Index Submit Workflow — Push Rejected 調查回報

**日期**：2026-04-17（調查）
**回報對象**：Chat session（Paul × Claude 主線）
**調查範圍**：`.github/workflows/seo-index.yml` push rejected 根本原因
**本回報只做診斷，不改 code。** 修復策略由 Chat 決定。

---

## 1. Workflow 基本資訊

| 項目 | 值 |
|---|---|
| 檔案 | `.github/workflows/seo-index.yml` |
| Job name | `index-submit` |
| 觸發條件 | `workflow_run` on "Build & Deploy" 完成時（只跑 conclusion==success）<br>+ `workflow_dispatch`（手動） |
| Cron schedule | **無**（不是排程觸發，是 Build & Deploy 連動） |
| Concurrency | **無設定** ⚠️ |
| Push 前 pull --rebase | **無** ⚠️ |
| Retry 機制 | **無** ⚠️ |
| Permissions | `contents: write` |

**Build & Deploy 自己的觸發條件**（`deploy.yml`）：
- `push: branches: [main]` — 每次 push 都跑
- `repository_dispatch: types: [content-updated]`
- `workflow_dispatch`
- `schedule: '0 0 * * *'`（每日 UTC 00:00 = 台灣 08:00）

也就是說，**每一次進 main 的 commit 都會觸發 Build & Deploy → 觸發 seo-index**。高頻 push 日會連續觸發多次 seo-index，而它彼此之間沒有 concurrency 保護。

---

## 2. 失敗時間線（4/16）

截圖顯示「failed 16 hours ago in 15s」，對照目前時間（2026-04-17 09:06 CST）推回來，失敗大約發生在 **2026-04-16 17:00 CST ±30 分鐘**（UTC 09:00 ±30 min）。

當天 main 的 commit 時序（台灣時間）：

```
16:18  16803d1  youtube-channels 更新
16:26  0aeb496  fix(ci): auto-close.yml injection (#175)
16:33  6717f3d  handoff: Wiki Ask UI Perplexity redesign
16:44  619283d  feat(wiki): concept token-economics
16:44  d209bc7  feat(wiki): concept software-disruption
16:44  59373e4  feat(wiki): concept ai-capabilities-benchmark
16:44  1531b41  feat(wiki): concept gpu-economics
16:45  3246111  feat(wiki): concept learning-as-meta-skill
16:45  3bf2cda  feat(wiki): concept personal-knowledge-system
16:47  a5812d4  ✅ chore(seo): update indexed URLs list   ← 最後一次成功
16:50  f9fc2f4  handoff: wiki Batch 3
16:53  d4b7da0  handoff: wiki scanner fix
16:57  5c58ee0  fix: YouTube transcript pipeline
16:57  ad205d2  worklog: YouTube transcript 修復
17:26  720bf90  feat(wiki): redesign ask UI
20:03  b8824e4  feat(articles): California SB 253
20:10  a0ff391  Auto-translate cover [skip-translate]   ← translate.yml 產出
```

**關鍵發現**：`a5812d4`（16:47 CST）之後，main 上再無成功的 `chore(seo)` commit，直到現在（4/17 09:06 CST）已經 **超過 16 小時沒有 seo-index 成功入庫**。

---

## 3. 兇手鎖定

### 主因：seo-index 自己跟自己 race（無 concurrency）

Build & Deploy 由每次 push 觸發。16:50、16:53、16:57、17:26 連續四波 push 在 40 分鐘內觸發四次 Build & Deploy，每次完成都啟動一次 seo-index run。四個 run 之間沒有 concurrency 保護，可以並行跑：

- Run N 已 checkout main @ commit X，還在跑 `seo-index-submit.py`
- Run N-1 剛剛 push 成功，main 前進到 X+1
- Run N 跑完要 push → rejected（main 已經不是 X）

截圖的 commit `9c43db1`（本地產生、未進 main）就是這個情境下 15 秒內產生並被拒絕的證據（`1 file changed, 6 insertions(+)` 代表它確實抓到 6 個新 URL 要送 Google）。

### 次因：同時有其他 workflow 也在 push main

`workflow_run: ["Build & Deploy"]` 觸發的不只 seo-index，還有 `publish-social.yml`，外加其他會 push 的 workflow：

| Workflow | 觸發 | 有 pull --rebase？ | 有 concurrency？ | 風險 |
|---|---|---|---|---|
| **seo-index.yml** | workflow_run（Build & Deploy） | ❌ | ❌ | ⚠️ 高 |
| ai-ready-opt.yml | cron `0 1 * * 1`（週一）+ push | ❌ | ❌ | ⚠️ 中（頻率低） |
| external-eval.yml | cron `0 1 * * *`（每日） | ✅ | ❌ | 低 |
| feedback-batch-update.yml | push on `feedback-batch-update.json` | ✅（`|| true`） | ❌ | 低 |
| governance-scanner.yml | cron `0 2 * * *`（每日） | ✅ | ✅ | 最低 |
| publish-social.yml | workflow_run（Build & Deploy）+ dispatch | ✅ + 3-retry | ❌ | 低（有 retry） |
| translate.yml | push on `articles/*.md` | ✅ | ❌ | 低 |
| seo-index.yml | workflow_run（Build & Deploy） | ❌ | ❌ | ⚠️ 高 |

translate.yml 在 4/16 20:10 產出 `a0ff391`，但那是 20:03 Paul 推 California SB 253 之後的事，時間點跟 17:00 的失敗對不上。

**結論：失敗主因是 seo-index 自己的並行 race，不是跟別的 workflow 撞到。**

### auto_update_data.sh（本機 cron）不是兇手

`scripts/auto_update_data.sh` v8 已經有：
- mkdir lock（mutex）防止多重執行
- `PUSH_MIN_INTERVAL=1800`（30 分鐘最小間隔）
- Push rejected 時 `git reset HEAD~1` 乾淨退出、下次 retry

這支腳本設計得很保守，不會搶先 push 造成別人失敗，就算它跟 workflow 撞到，它會自己退一步。**排除這個嫌疑。**

---

## 4. 風險評估

### 失敗後的副作用

- `9c43db1` 這個 commit **只存在於 runner 本地**，push 失敗後連同 6 個新 URL 的 `.seo/indexed-urls.txt` 變更都沒進 main。
- 但這 6 個 URL **已經送給 Google Indexing API**（python 腳本在 commit 之前就已經送出）。Google 那邊已收到通知。
- 下次 run 時，script 會重新比對 sitemap vs main 的 `.seo/indexed-urls.txt`，同樣那 6 個 URL 還是會被判定為「未 indexed」，再送一次 Google API。**這會重複消耗每日 200 的 Indexing API 配額**。
- 從 16:47 UTC 以來 16+ 小時沒有成功 commit，代表後續每次 run 都被這個問題卡住，重複送同一批 URL。配額可能已經見底。

### 頻率評估（用 main 成功 commit 間接推算）

從 4/1 ~ 4/16 期間成功的 `chore(seo)` commit 共 19 次。但同期間 main 被推的次數遠多於此（光 4/16 一天就有 20+ 次）。

光靠 git log 無法判斷「失敗幾次」——因為失敗的 commit 不會進 main。但**從成功頻率的密度**（4/6、4/8、4/16 這些高活躍日常常出現兩三個 seo commit）可以推斷：**seo-index 在單日多 push 的情境下時不時會失敗，失敗的 run 無聲無息地消失，只有偶爾被發現**。

這不是第一次失敗，也不會是最後一次。**系統性 race condition，不是偶發**。

---

## 5. 現有 workflow concurrency / retry 現況

| Pattern | 使用的 workflow |
|---|---|
| 無任何保護（裸 push） | `seo-index.yml`, `ai-ready-opt.yml` |
| 只有 pull --rebase | `translate.yml`, `feedback-batch-update.yml`, `external-eval.yml` |
| pull --rebase + retry loop | `publish-social.yml` |
| concurrency group + pull --rebase | `governance-scanner.yml`（最嚴謹） |

**防守力最差的就是 seo-index。** 而且它的觸發條件（workflow_run）比 cron 更密集，暴露面最大。

---

## 6. 建議的修復方向（不含實作，等 Chat 決策）

列三個選項給 Chat 評估，**各有 trade-off**：

### 選項 A：抄 publish-social.yml 的 retry loop（最低成本）

在 seo-index.yml 的 `Commit updated indexed URLs` step 直接改成 3-retry + pull --rebase 樣板：

```yaml
for attempt in 1 2 3; do
  if git push 2>/dev/null; then break; fi
  git pull --rebase origin main || {
    git rebase --abort 2>/dev/null || true
    git pull --no-rebase origin main
  }
done
```

- 優點：改動最小，跟 publish-social 行為一致，容易理解
- 缺點：並行 run 之間還是會同時送 Google API（重複配額消耗），只是 git push 不會失敗

### 選項 B：加 concurrency group（治本）

```yaml
concurrency:
  group: seo-index
  cancel-in-progress: false
```

- 優點：徹底消除並行 run，配額不會重複消耗
- 缺點：如果 cancel-in-progress: true，可能把中途的 run 殺掉、漏掉某批 URL；設 false 則後續 run 會排隊、延遲拉長

### 選項 C：A + B 一起上（最保險）

concurrency group 確保只有一個 run 跑，retry loop 是防禦性保險，處理跟 auto_update_data.sh 或其他 push 撞到的邊緣情境。

**額外建議**：
- ai-ready-opt.yml 有同樣的裸 push 問題，雖然頻率低但最好一併補上
- seo-index 的 .seo/indexed-urls.txt 本身其實可以改成 KV 或 D1 存，避免要靠 git commit 這種高競爭資源同步狀態——但這是大手術，不急

---

## 完成標準 checklist

- [x] Task 1: workflow 檔案 `.github/workflows/seo-index.yml`，job name `index-submit`，觸發條件 workflow_run + workflow_dispatch，無 cron
- [x] Task 2: 4/16 16:47 UTC 後 16+ 小時無成功 commit，這不是第一次失敗（系統性 race condition）
- [x] Task 3: 主因鎖定 = seo-index 自己並行 race（無 concurrency），16:50-17:26 四波 push 觸發多重並行 run
- [x] Task 4: 7 個會 push main 的 workflow 都列表比對，seo-index + ai-ready-opt 是兩個裸 push 違例
- [x] Task 5: auto_update_data.sh v8 有 mutex + reset retry，不是兇手
- [x] Task 6: 頻率為「高活躍日時不時失敗，無人察覺」的系統性問題，非偶發
- [x] 調查回報 .md 寫好（此檔）
- [ ] Apple Notes 互動日誌對應條目（下一步）
- [ ] 通知 Paul 調查完成（下一步）

---

## 附錄：關鍵事實摘要（給 Chat 快速讀）

1. **Workflow**：`seo-index.yml` → 觸發源是 Build & Deploy 完成事件，不是 cron
2. **失敗點**：`Commit updated indexed URLs` 的裸 `git push`，15 秒內 reject
3. **根本原因**：無 concurrency group + 無 pull --rebase + 無 retry，並行 Build & Deploy run 導致 seo-index 並行 run 互相搶 main
4. **副作用**：16+ 小時無 seo 更新；6 個 URL 已送 Google 但沒記錄到 main；下次 run 會重送、浪費 API 配額
5. **修法優先度**：先 concurrency group（治本）+ retry loop（防禦），ai-ready-opt 順手補上
6. **不是兇手**：auto_update_data.sh、translate.yml、publish-social.yml 都防守得不錯
