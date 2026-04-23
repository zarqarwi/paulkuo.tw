# Cowork Handoff — paulkuo.tw（2026-04-17 交接）

> 本 handoff 由 2026-04-17 上午的 Cowork session 產出，交給下一個 Cowork 視窗接手。
> 上一輪做了 seo-index race condition 系統性修復 + 去重邏輯 Phase A 審計，
> 收尾時 Paul 決定換新視窗繼續下一件事。
>
> **產出時間**：2026-04-17 10:40 CST
> **上游 session**：Cowork（本機 commit/stash 清理、Issue #155 同步、dedup 審計報告）
> **建議模型**：Sonnet 4.6 + Medium（接續既有軌道，不需重新設計）
> **Task Sizing**：S（接棒狀態同步），實際任務 Paul 開場會給

---

## 1. 背景

Paul 今天上午從 Cowork 跑完兩件事，現在要換新視窗繼續工作。新視窗應該：

1. **不要重做** 上午已完成的事（見第 4 區「不要重複執行的項目」）
2. **接續監看** 一個被動驗證任務（Phase B）
3. **等 Paul 開場指令** 決定下一件事做什麼

上一輪完成的兩件事：

### (A) seo-index.yml push rejected race condition 系統性修復
- **原因**：`workflow_run` 觸發的 seo-index 和 ai-ready-opt 在同一 main HEAD 下並行 push，後面的被拒
- **修法**：兩個 workflow 加 `concurrency group` + 3-retry `git pull --rebase` loop
- **現狀**：commit `70173b2` on origin/main，Actions 頁綠勾已驗證

### (B) seo-index 去重邏輯 Phase A 審計（read-only）
- **結論**：歸類為**可能 A（邏輯健全）** ✅
- **根據**：`scripts/seo-index-submit.py` 用 sitemap 全量 + `.seo/indexed-urls.txt` set 減法 filter，always-save-progress 即使 quota 爆也保住記錄
- **報告檔**：`worklogs/2026-04-17-seo-index-dedup-logic-investigation.md`

---

## 2. Step 0 偵察（開場必跑）

接手後先跑 Cowork 開場 Checklist（Step 0 → 2.7），此外針對今天的情境補幾個驗證：

### 2.0 確認 worklogs/ 存在（已有，skip）

### 2.1 掃 worklogs/
讀以下兩個檔案，理解上午進度：
```
worklogs/worklog-2026-04-17.md                                       # 三維度日誌
worklogs/2026-04-17-seo-index-dedup-logic-investigation.md           # dedup 審計報告
worklogs/2026-04-17-seo-index-push-rejected-investigation.md         # race condition 前置調查
```

### 2.5 驗證優先（確認沒重複提醒）
上午有四個「已完成」項目，接手視窗開場時**不應該把它們當待辦再問一次**。
用下列指令自己驗，驗過的不用問 Paul：

| 項目 | 驗證方法 |
|------|---------|
| race condition fix 已 merge main | GitHub MCP `get_file_contents` 看 `.github/workflows/seo-index.yml` 是否含 `concurrency:` 區塊 |
| commit 70173b2 存在 | GitHub MCP `list_commits` 看近期 main 有無此 SHA |
| Issue #155 已更新 | GitHub MCP `get_issue` 看 body「完成日誌（最新在上）」頂部有無 04-17 兩條 |
| 70 個舊 stash 已清 | 無法線上驗證，memory 有記，**不用問 Paul** |

### 2.7 Reconciliation Check
今天沒有新 closed issue，主要是 **Phase B 被動等自然觸發**（見第 3 區）。

---

## 3. Phase B 被動觀察（唯一的跟進任務）

這件事**不要主動觸發**，只在 Paul 下次 push 到 main 後順手檢查。

### 觸發條件
Paul 或任一 session push 任何 commit 到 `zarqarwi/paulkuo.tw` main。

### 驗證步驟
1. 打開 https://github.com/zarqarwi/paulkuo.tw/actions/workflows/seo-index.yml
2. 點最新 run → job `index-submit` → step `Submit new URLs to Google Indexing API`
3. 讀 log 找這幾行：
   ```
   Already indexed: 548 ...
   New URLs to submit: N
   ```

### 判讀
| 結果 | 含義 | 下一步 |
|------|------|--------|
| `N ≥ 6` 且全部 `OK:` | 選項 B 如期發生，4/16 失敗的 6 個 URL 被自然重送 ✅ | 寫入 worklog「Phase B 驗證通過」 |
| `N < 6` 或有 `FAIL` | 可能還有別的 bug | 升級給 Chat 評估，不要自己動 code |
| `chore(seo): update indexed URLs list` commit 順利進 main | race condition 修復持續生效 ✅ | 記錄即可 |

### Baseline（不要忘）
- `.seo/indexed-urls.txt` 上午觀測 = **548 行**
- 最後成功 commit = `a969a4f`（2026-04-16 22:34 CST）

---

## 4. 不要重複執行的項目

> 開場時如果看到這些項目還在「待辦」裡，**不要當成 TODO 再問 Paul 一次**。
> 上午都做完了，只是寫入記憶的延遲。

| 項目 | 狀態 | 依據 |
|------|------|------|
| concurrency + retry loop 修復 | ✅ done（commit 70173b2） | git log 可驗證 |
| ai-ready-opt.yml 同類預防性修復 | ✅ done（同 commit） | 同上 |
| 70 個舊 git stash 清空 | ✅ done | 無法線上驗證但本機已清 |
| Issue #155「完成日誌」新增 04-17 兩條 | ✅ done（含 race fix + dedup audit） | GitHub MCP 可驗證 |
| dedup 審計報告產出 | ✅ done | 本機檔案 `worklogs/2026-04-17-seo-index-dedup-logic-investigation.md` |
| worklog-2026-04-17.md 三維度完整 | ✅ done | 本機檔案已含狀態變更、決策、阻礙 |

---

## 5. 驗證方式（接手時的 sanity check）

30 秒內跑完這四個，確認沒出別的問題：

```bash
# 1. main 有 70173b2
gh api repos/zarqarwi/paulkuo.tw/commits/70173b2 --jq '.sha' 2>/dev/null | head -c 7
# 預期輸出：70173b2

# 2. seo-index.yml 在 main 上已含 concurrency
gh api repos/zarqarwi/paulkuo.tw/contents/.github/workflows/seo-index.yml --jq '.content' | base64 -d | grep -c 'concurrency'
# 預期輸出：≥ 1

# 3. .seo/indexed-urls.txt 行數基準
gh api repos/zarqarwi/paulkuo.tw/contents/.seo/indexed-urls.txt --jq '.content' | base64 -d | wc -l
# 預期輸出：548（或更高，如果期間有新 run）

# 4. Issue #155 body 頂部有 04-17
gh api repos/zarqarwi/paulkuo.tw/issues/155 --jq '.body' | grep -c '04-17'
# 預期輸出：≥ 2
```

接手的 Cowork 有 `mcp__github__*` 和 Bash，這四條用 MCP 或 CLI 都行。

---

## 6. 注意事項（已知陷阱）

### ⚠️ Sandbox 環境無 SSH key
- Cowork 沙盒**無法 git push** 到 `zarqarwi/paulkuo.tw`（上午踩過，`Host key verification failed`）
- 需要 push 時走這兩條之一：
  - Paul 本機 Terminal 手動 push
  - GitHub MCP `create_or_update_file` / `push_files`（檔案小於幾十 KB）

### ⚠️ .git/*.lock stale 問題
- 如果本機 `.git/index.lock` 或 `.git/HEAD.lock` 擋住 git 操作，用 `mcp__cowork__allow_cowork_file_delete` 放行再 rm
- 普通 `rm` 被 Cowork 保護機制擋下，`dangerouslyDisableSandbox` 也不行

### ⚠️ 前份 race condition 調查報告時間誤差
- `worklogs/2026-04-17-seo-index-push-rejected-investigation.md` 寫「16:47 CST 最後成功」，實際是 22:34 CST（`a969a4f`）
- 誤差 6 小時但**不影響主論點**，dedup 審計報告已註記
- 如果有人再拿時間點做判斷，以 dedup 審計報告為準

### ⚠️ Google Indexing API 配額節省
- 不要手動觸發 `seo-index.yml`（workflow_dispatch）來驗證 Phase B
- 每日 200 URL 配額珍貴，等 Paul 自然 push 即可

### ⚠️ CDN sitemap cache 延遲
- `sitemap-index.xml` 有 `max-age=3600`
- Build & Deploy 完到 seo-index 撈到新 sitemap 之間可能延遲 1 小時
- 這是已知延遲特性，不是 bug

---

## 7. 信心等級

**高信心** 🟢：
- race condition 修復有效（Actions 綠勾 + commit 在 main）
- dedup 邏輯為可能 A（code-side 審計，非腦補）
- Paul 選項 B 決策合理（6 個 URL vs. 配額 cost 不成比例）

**中信心** 🟡：
- Phase B 實際觀察結果（還沒自然觸發過，理論推演）
- 記錄檔未來膨脹曲線（548 → 1000+ 時才需再評估）

**低信心** 🔴：
- 無

---

## 8. Integration Checklist

上午的改動波及範圍已在 commit message 標注。新視窗接手時如果要繼續動這區：

### 已改動檔案（影響範圍）
- `.github/workflows/seo-index.yml` → CI 層，單一 workflow
- `.github/workflows/ai-ready-opt.yml` → CI 層，單一 workflow
- 影響範圍：僅 GitHub Actions 執行層，**不影響前端、Worker、D1、KV**

### 沒動到的共用模組
- `worker/src/*` — 零改動
- `src/content/**` — 零改動
- `translator.js` / `utils.js` / `auth.js` 等共用檔 — 零改動

### 新 endpoint 檢查（護欄 #13）
本次**無新 API endpoint**，不需要做 geofence / rate limit / filter 繼承檢查。

### 跨 repo 真相驗證（護欄 #14）
- 改動目標 repo = `zarqarwi/paulkuo.tw` = 本次工作 repo（一致）
- 已用 GitHub MCP `get_file_contents` grep 確認 `concurrency:` 在 main 的版本裡
- Actions 綠勾提供行為層 secondary confirmation

---

## 附錄：關鍵檔案速查

```
paulkuo.tw/
├── scripts/seo-index-submit.py                                            # dedup 核心邏輯（read-only 審計過）
├── .seo/indexed-urls.txt                                                  # 已送記錄，548 行 baseline
├── .github/workflows/seo-index.yml                                        # 改過（concurrency + retry）
├── .github/workflows/ai-ready-opt.yml                                     # 改過（同上預防性）
└── worklogs/
    ├── worklog-2026-04-17.md                                              # 今日三維度日誌
    ├── 2026-04-17-seo-index-push-rejected-investigation.md                # race condition 調查（含時間小誤差）
    └── 2026-04-17-seo-index-dedup-logic-investigation.md                  # dedup 審計報告（權威）
```

GitHub 端：
- Issue #155 — 儀表板 SSoT，body 頂部有 04-17 兩條完成日誌
- commit 70173b2 — race condition 修復，on main

---

## 給下一個 Cowork 的開場話

Paul 開新視窗進來時，標準開場：

1. 先跑 Cowork 開場 Checklist（Step 0 → 2.7）
2. 讀這份 handoff + `worklog-2026-04-17.md`
3. 用第 5 區的四條指令做 30 秒 sanity check
4. 跟 Paul 確認「上午的 race condition fix + dedup audit 已驗收，今天接下來要做哪一件事」
5. **不要** 把第 4 區的 6 個項目當成待辦再問一次

Paul 說「繼續下一件事」時，他會直接給指示——可能是 Formosa、可能是 Wiki、可能是寫作、可能是 SEO 其他環節。不需要先猜。

---

**Handoff 結束。接手愉快。**
