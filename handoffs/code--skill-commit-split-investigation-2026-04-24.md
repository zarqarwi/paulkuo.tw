# Handoff: skill commit 分離偵查與收尾

**發起**：Cowork（Paul）
**執行**：Code
**產生時間**：2026-04-24
**優先級**：中（不是 blocker，但 repo 狀態目前不乾淨，不宜繼續堆其他工作）

---

## 背景：為什麼需要這份 handoff

原本的任務很單純——把不小心混到 `fix/acp-graphql-observability` 分支的兩個 skill commit 搬到獨立分支 `feat/skill-sync-v1`，讓兩個 PR 主題乾淨。

在 Cowork 執行 cherry-pick + reset 過程中出現幾個訊號，Cowork 判斷「人類剪貼來回 debug」效率不佳、容易失準，決定換 Code 接手一次性偵查+收尾。

---

## 目前已知狀態（Cowork 交接時的理解）

### Remote 端（GitHub）

上一次 push 成功的是 commit `9d42b91`（skill v5.7 那個 commit，當時還混在 ACP 分支上）。push 記錄：

```
9310c80..9d42b91  fix/acp-graphql-observability -> fix/acp-graphql-observability
```

所以 **remote `fix/acp-graphql-observability` 的 tip 目前應該是 `9d42b91`**，包含 2 個 ACP commit + 2 個 skill commit。

`feat/skill-sync-v1` 也已經 push 成功，cherry-pick 後的 tip 是 `0445c5f`（C session 當時的輸出）。

### Local 端（多台電腦的問題）

Paul 有至少**兩台 Mac**，都同步 `~/Desktop/01_專案進行中/paulkuo.tw`（推測是 iCloud Drive 或類似機制同步整個資料夾）：

- **Mac A**（`apple@Mac`）：執行了全部 cherry-pick + reset 的 session
- **Mac B**（`apple@appledeMacBook-Air-2`）：後半段接手的 session

Mac B 的 local 狀態（最後一次指令輸出）：
```
=== 目前在哪個分支 ===
fix/acp-graphql-observability

=== 所有 remote-tracking branches ===
  origin/HEAD -> origin/main
  origin/main        ← 只有這個，沒有 origin/fix/acp-* 或 origin/feat/skill-*

=== 當前 HEAD ===
9310c80 (HEAD -> fix/acp-graphql-observability) fix(acp): add observability to GraphQL commits fetch
bc870b8 (fix/acp-delivery-commits) ...
918126b chore(dashboard): ...
...
```

**關鍵觀察**：
- Mac B 的 `HEAD` 已經停在 `9310c80`——這正是 reset 目標（ACP 分支去掉 skill 兩個 commit 的終點）
- 但 Mac B 的 `git branch -r` 只有 `origin/main`，**沒有** `origin/fix/acp-graphql-observability`——代表 Mac B 從沒 fetch 過這個 remote branch 的 tracking ref（即便 branch 存在 remote 上）
- 這也解釋了為什麼之前跑 `git log origin/fix/acp-graphql-observability` 會報「未知版本」

Mac B 的 HEAD 之所以已經在 `9310c80`，推測是 iCloud 把 Mac A 的 `.git/HEAD` + `refs/heads/` 同步過來了。但 remote-tracking refs（`.git/refs/remotes/origin/`）顯然沒有同步到，或同步到一半。

### 懸而未決

1. **remote `fix/acp-graphql-observability` 目前 tip 是什麼？**
   - Cowork 的理解：`9d42b91`（含 4 個 commit）
   - 需要驗證：直接去 GitHub 或 `git ls-remote` 查

2. **remote `feat/skill-sync-v1` 存在嗎？tip 是什麼？**
   - Cowork 的理解：存在，tip = `0445c5f`
   - 需要驗證

3. **Mac B 的 local 是不是「正確的目標狀態」？**
   - HEAD 是 `9310c80`，看起來是對的
   - 但 iCloud 同步 `.git/` 本來就是危險做法——可能有 index 半同步、objects 缺漏的情況

4. **哪一台是工作主機？**
   - 如果 Paul 現在主要在 Mac B 上操作，就在 Mac B 收尾
   - 如果在 Mac A，就在 Mac A 收尾
   - Handoff 結尾會問這一題

---

## 前情提要：為什麼要做這個分離

**憲法第一條 SSoT + CLAUDE.md「一個 commit 只做一件事」**在 PR / 分支層級的延伸——
一個分支一個主題、一個 PR 一個議題。

`fix/acp-graphql-observability` 原本只做 ACP GraphQL observability，skill sync 是另一個完全獨立的治理主題。兩個搭同一班車合回 main，git log 會變噪音，`git blame` / `git log --grep` 會變笨。

**這次 handoff 是治理結構的自我糾錯案例**，完成後可以視為 constitution v0.2 的一次 dogfood 驗證。

---

## 要做什麼（Code 的任務）

### Phase 1：偵查（不要動任何 remote 或 local state）

先**只讀不寫**地把全貌搞清楚。以下所有指令都是 read-only。

請在**使用者指定的那台 Mac** 上跑（Phase 0 會先問這一題）。

#### 1.1 Remote 實際狀態

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw

# 看 remote 端真的有哪些 branch、tip 在哪
git ls-remote origin 'refs/heads/fix/acp-graphql-observability' 'refs/heads/feat/skill-sync-v1' 'refs/heads/main'
```

預期輸出（大致）：
```
9d42b91... refs/heads/fix/acp-graphql-observability   ← 還沒 reset 過
0445c5f... refs/heads/feat/skill-sync-v1               ← cherry-pick 完成
<SHA>...   refs/heads/main
```

#### 1.2 Local 實際狀態

```bash
# 當前分支 + HEAD
git branch --show-current
git log --oneline HEAD -5

# 所有 local branches + tips
git branch -v

# Remote-tracking refs（判斷 iCloud 同步有沒有帶到）
git branch -r

# 工作區有沒有未提交的變更（應該只有 3 個 modified 的 worklog + 一堆 iCloud " 2" 檔）
git status --short | head -20

# 跟 remote 比（需要先 fetch）
git fetch origin fix/acp-graphql-observability feat/skill-sync-v1
git log --oneline HEAD..FETCH_HEAD   # remote 有、local 沒有的 commit
git log --oneline FETCH_HEAD..HEAD   # local 有、remote 沒有的 commit
```

#### 1.3 判斷分支狀態

比對三個事實產生 status matrix：

| 分支 | Remote tip | Local tip | 差異 | 需要動作 |
|---|---|---|---|---|
| `fix/acp-graphql-observability` | ? | `9310c80`（預期） | remote 多 2 個要丟的 commit | 需要 force-push 把 remote 裁到 `9310c80` |
| `feat/skill-sync-v1` | ? | ? | ? | ? |
| `main` | ? | 無關 | — | 不動 |

**判斷原則**：
- 如果 remote `fix/acp-graphql-observability` 比 local 多出來的**只有** `9d42b91` + `6334832`，表示狀態一切符合預期，Phase 2 可以直接執行
- 如果 local HEAD 不是 `9310c80`，或有其他不認識的 commit → **停下來**，把 matrix 整理好回報，不要自己 force-push
- 如果 `feat/skill-sync-v1` remote 不存在 → 需要在 Phase 2 補 push

### Phase 2：收尾（根據偵查結果執行）

#### 情境 A：狀態符合預期（最可能）

Remote `fix/acp-graphql-observability` tip 是 `9d42b91`（含 4 個 commit），Local tip 是 `9310c80`（2 個 commit），`feat/skill-sync-v1` 已經在 remote 上 tip 是 `0445c5f`。

執行：

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw && \
  git push --force-with-lease origin fix/acp-graphql-observability && \
  echo "" && \
  echo "=== 驗證 ===" && \
  git fetch origin && \
  echo "--- fix/acp-graphql-observability（應該 2 個 commit）---" && \
  git log --oneline origin/fix/acp-graphql-observability -3 && \
  echo "" && \
  echo "--- feat/skill-sync-v1（應該 4 個 commit：2 skill + 2 ACP base）---" && \
  git log --oneline origin/feat/skill-sync-v1 -5
```

如果 `--force-with-lease` 被擋：
1. **不要**直接改 `--force`
2. 先檢查為什麼被擋（通常是 local 對 remote 的認知過期）：
   ```bash
   git fetch origin fix/acp-graphql-observability
   git log --oneline HEAD..FETCH_HEAD
   ```
3. 確認 remote 多出來的**真的只有** `9d42b91` + `6334832`，沒有其他不認識的 commit
4. 再重試 `--force-with-lease`（fetch 完 local 的 lease 更新，通常就會放行）
5. 只有在「確認無其他人變更」且 `--force-with-lease` 重試仍失敗時，才用 `--force`

#### 情境 B：狀態不符預期

整理成下面這張回報表給 Paul，**不要自己修**：

```
## 偵查結果回報

### Remote 狀態
- fix/acp-graphql-observability：tip = <SHA>，共 <N> commit
- feat/skill-sync-v1：tip = <SHA>，共 <N> commit

### Local 狀態（Mac <A 或 B>）
- 當前分支：<name>
- HEAD：<SHA>
- 未追蹤/未提交變更：<count>

### 不符預期的地方
- <具體描述>
- <e.g. local HEAD 不是 9310c80、remote 多出不認識的 commit、feat/skill-sync-v1 不存在>

### 建議做法
- <A/B/C 選項>
```

### Phase 3：驗證（無論走哪條路）

收尾後必須跑這段，確認**兩個分支都乾淨**：

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw && \
  git fetch origin && \
  echo "=== fix/acp-graphql-observability（應該只有 ACP 相關）===" && \
  git log --oneline origin/main..origin/fix/acp-graphql-observability && \
  echo "" && \
  echo "=== feat/skill-sync-v1（應該只有 skill 相關 + ACP base）===" && \
  git log --oneline origin/main..origin/feat/skill-sync-v1 && \
  echo "" && \
  echo "=== 兩個分支共同的 base（應該是 ACP 分支的 commit）===" && \
  git merge-base origin/fix/acp-graphql-observability origin/feat/skill-sync-v1 | xargs git log --oneline -1
```

**驗收條件**：
- `fix/acp-graphql-observability` 比 main 多出來的 commit：**只能有 ACP 相關的**（`fix(acp):` prefix），**不能有** `feat(skills):` 或 `feat(session-handoff):`
- `feat/skill-sync-v1` 比 main 多出來的 commit：包含 2 個 skill commit（`feat(skills):` + `feat(session-handoff):`）+ 2 個 ACP commit（base）
- merge-base 應該是 ACP 的 `9310c80` 或之前的

---

## 給 Paul 的回報格式

Code 完成後請用下面格式回報到這個 session：

```
## Skill commit 分離 — 完成回報

### 最終 remote 狀態
- fix/acp-graphql-observability: <commit count>, tip = <SHA>
- feat/skill-sync-v1: <commit count>, tip = <SHA>

### 執行了什麼
- <列出實際跑的關鍵指令>

### 遇到的問題（如果有）
- <e.g. force-with-lease 被擋 → fetch 後重試成功>

### 驗收
- [ ] fix/acp 分支不含 skill commit
- [ ] feat/skill-sync-v1 含完整 skill commit
- [ ] 工作區沒有遺留 uncommitted 變更

### 下一步建議
- <e.g. 可以開兩個 PR 合回 main>
```

---

## 為什麼這件事值得做成 handoff 而不是繼續剪貼

（給 Code 理解 Paul 的協作偏好用）

Paul 在這個 session 結尾觀察到：

> 我們這樣來回指令剪貼回報已經很多趟。來回除錯偵查會讓事情沒效率且容易出錯。而且人類的記憶能力不擅長處理這種多邊分岔出去的任務。

這是 constitution v0.2「權責分工原則」的實踐——偵查+多步驟執行的任務應該由 Code session 一次跑完，Cowork 負責規劃與審查，不該把人類當 shell pipe。

Code 執行時請**盡量把偵查一次性跑完**（Phase 1 全部指令合成 oneliner），不要再分段等 Paul 回報。

---

## 觸發事件記錄

- **10:02** Cowork 建立 `sync-skills-to-cowork.sh`（commit `6334832`）
- **10:11** Cowork 完成 session-handoff v5.7 A/C 層（commit `9d42b91`）
- **10:11** Paul 發現 commit 被推到 `fix/acp-graphql-observability` 而非 main
- **10:15** Cowork 建議選 B（分離分支），Paul 同意
- **10:17** Mac A 執行 cherry-pick + reset，local 完成，`feat/skill-sync-v1` push 成功
- **10:18** ACP 分支 `--force-with-lease` 被擋（local 對 remote 認知過期）
- **10:21** 切到 Mac B 繼續偵查（iCloud 同步 repo，tracking refs 狀態不完整）
- **10:28** Paul 決定改用 handoff 讓 Code 一次性接手
