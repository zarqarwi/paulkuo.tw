# Code Handoff — working tree cleanup chore（2026-04-27）

> 建立：2026-04-27 由 Cowork session 寫，**等 derived_from acceptance 收尾完成後才能跑**
> 來源：derived_from acceptance handoff（commit `8141947`）跑出來的副作用整理
> 目標 session：Code [WIKI]
> **建議模型**：Claude Sonnet 4.6
> **Effort**：Low（10-15 min；純 chore，三件雜事一起 commit）
> **前置條件**：Issue #157 第三步 acceptance 收尾留言已存在（即 derived_from 任務已結案）

---

## 1. 上下文

derived_from acceptance 收尾過程中，`pnpm install` 跟 corepack 在 working tree 留下三件需要整理的副作用：

1. **`package.json`**：corepack 自動寫入 `"packageManager": "pnpm@10.33.0+sha512..."` 欄位（origin/main 沒這欄位）
2. **`pnpm-lock.yaml`**：對齊 origin package.json 後縮 584 行（砍 `@astrojs/check` + `typescript` + transitive deps，origin/main 早就把 devDependencies 整段刪了，本機是歷史殘留）
3. **動態資料檔被 tracked**：`data/stock.json` / `data/timing.json` / `data/last-scan.json` 等是 cron job 自動更新的動態資料，不該追蹤；`__pycache__/` 也應該排除

這三件單獨開 commit 處理，跟 derived_from 第三步本身不相干。

---

## 2. 護欄（**必讀**）

- **必須等 derived_from acceptance 收尾完成才能跑**：Issue #157 上要先有第三步 acceptance 收尾留言（pnpm build 全綠 + 模板填完）。如果還沒，先停下來問 Paul。
- **不動 Paul 進行中的工作**：working tree 上的下列檔案**全部不動**：
  - `worklogs/worklog-2026-04-27.md`
  - 5 個 ACP component（`EvidenceBadge.tsx` / `RadarChart.tsx` / `ScoreBar.tsx` / `Tooltip.tsx` / `WeightSlider.tsx` / `constants.ts`）
  - 14 個 getnote/youtube wiki sources（`src/content/wiki/sources/`）
  - 4 個 governance docs（`docs/`）
  - 任何 Paul 的本機 modified 檔
- **只動三件事**：`package.json`（packageManager 欄位）/ `pnpm-lock.yaml`（對齊狀態）/ `.gitignore`（加動態資料排除）
- **遇到意外狀態先停**：如果 `git status` 顯示比 handoff 預期多的變更檔（例如 `data/stock.json` 已被 Paul 自己改過內容、不只是 cron 自動更新），停下來問 Paul

---

## 3. 動作清單

### 動作 1：環境前置確認

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw

# 1. derived_from acceptance 已結案？看 Issue #157 最後留言是不是 Paul 或 Code 標記第三步閉環
gh issue view 157 --comments | tail -50
# 或瀏覽器看 https://github.com/zarqarwi/paulkuo.tw/issues/157

# 2. 看 working tree 還有哪些變更
git status
# 期望：
# - modified: package.json（只動 packageManager 那一段）
# - modified: pnpm-lock.yaml
# - modified: data/stock.json / data/timing.json（動態資料）
# - 其他 Paul 進行中工作（不要動）

# 3. 確認 HEAD 是 derived_from 收尾後的最新 commit
git log --oneline -3
```

如果 acceptance 還沒結案 → 先停下來問 Paul。

### 動作 2：commit `package.json` + `pnpm-lock.yaml`

先驗證 `package.json` 只動了 `packageManager` 那一段，沒 Paul 不知道的變更：

```bash
git diff package.json
```

期望：只在尾端多 `"packageManager": "pnpm@10.33.0+sha512..."` 一行（前面有逗號）。如果還有其他變更，先停下來問 Paul。

確認 OK 後：

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore(deps): pin pnpm via packageManager field, sync lockfile to origin

corepack 自動寫入 packageManager: pnpm@10.33.0+sha512.10568bb4...，
鎖定 pnpm 版本給整個團隊用（pnpm 9+ 官方建議做法）。

同時 pnpm install 對齊 origin/main 的 package.json 真實狀態：
- origin/main 的 package.json 沒有 devDependencies 區段
- 本機殘留 @astrojs/check + typescript 是歷史包袱
- lockfile 砍掉 @astrojs/check + typescript + transitive deps（-584 行）

Refs: Issue #157 第三步 derived_from acceptance 收尾"
```

### 動作 3：加 `.gitignore`

讀現有 `.gitignore`：

```bash
cat .gitignore
```

加入下列（如果還沒在裡面）：

```gitignore
# Dynamic data files (updated by cron / runtime, not tracked)
data/stock.json
data/timing.json
data/last-scan.json
data/wiki-ingest-pending.md

# Python cache
__pycache__/
*.pyc
```

macOS 副本檔（`*\ 2.*` / `*\ copy.*`）pattern 太廣會誤殺，**不自動 gitignore**，靠人工 review。

### 動作 4：把已 tracked 的動態資料從 index 移除

`.gitignore` 不會影響已 tracked 的檔。要 `git rm --cached` 把它們從 index 移除（檔案保留在 working tree，只是 git 不再追蹤）：

```bash
# 確認這些檔目前 tracked
git ls-files data/stock.json data/timing.json data/last-scan.json data/wiki-ingest-pending.md 2>/dev/null

# 移除 tracking（檔案保留）
git rm --cached data/stock.json data/timing.json data/last-scan.json 2>/dev/null
# data/wiki-ingest-pending.md 如果 tracked 也加上去
git rm --cached data/wiki-ingest-pending.md 2>/dev/null
```

如果 `git ls-files` 回來空，代表那些檔本來就沒 tracked，跳過 rm cached。

### 動作 5：commit `.gitignore` + 移除 tracking

```bash
git add .gitignore
# 如果動作 4 有 git rm --cached 過任何檔，那些 deletion 也會被 stage
git status  # 確認 staged 內容只有 .gitignore + data/* 的 deletion，沒別的
git commit -m "chore(gitignore): exclude dynamic data files

排除 cron job 自動更新的動態資料檔，避免 working tree 髒、
減少誤 commit 風險：

- data/stock.json / timing.json / last-scan.json
- data/wiki-ingest-pending.md（每日掃描產出）
- __pycache__/ + *.pyc

這些檔保留在 working tree（git rm --cached 不刪檔），
只是不再追蹤 history 變化。

Refs: Issue #157 第三步 derived_from acceptance 收尾"
```

### 動作 6：push

```bash
git push
```

### 動作 7：Issue #157 留一筆 chore 收尾（不是 derived_from 收尾）

```markdown
## working tree cleanup chore（2026-04-27）

derived_from acceptance 跑完後 working tree 留下幾個副作用，獨立兩筆 commit 整理：

### Commits

- `<sha-1>` chore(deps): pin pnpm via packageManager field, sync lockfile to origin
- `<sha-2>` chore(gitignore): exclude dynamic data files

### 內容

1. corepack 寫入 `packageManager: pnpm@10.33.0+...`（鎖版本）
2. lockfile 對齊 origin（origin 早就刪 devDependencies，本機殘留歷史包袱）
3. 排除動態資料追蹤：`data/stock.json` / `timing.json` / `last-scan.json` / `wiki-ingest-pending.md` / `__pycache__/`

不影響 derived_from 第三步成果。
```

---

## 4. Acceptance criteria

| 檢查項 | 期望 | 怎麼驗 |
|------|------|--------|
| package.json packageManager 鎖版本 commit | 1 commit | 動作 2 |
| pnpm-lock.yaml 同 commit 對齊 | 跟 package.json 同 commit | 動作 2 |
| .gitignore 加動態資料排除 | 1 commit | 動作 5 |
| `data/stock.json` 等從 index 移除 | `git ls-files data/stock.json` 回空 | 動作 4-5 |
| working tree Paul 進行中工作不變 | `git status` 上的 worklog / ACP / wiki sources / governance docs 維持 unstaged | 動作 1-2 |
| Issue #157 chore 留言 | 已留言 | 動作 7 |
| push 上 origin/main | 兩 commit fast-forward | 動作 6 |

---

## 5. 跨專案影響檢查

| 檔案 | 影響 |
|------|------|
| `package.json` | 鎖定 pnpm 版本 — 影響任何 contributor 跑 `pnpm install`（會用 corepack 自動切到 pnpm@10.33.0） |
| `pnpm-lock.yaml` | 對齊 origin 真實依賴 — 縮小 lockfile，CI build 時間略減 |
| `.gitignore` | 排除動態資料 — 之後 cron job 更新 `data/*.json` 不會出現在 `git status` |
| `data/stock.json` 等 | **檔案保留**（只是 git 不追蹤）— ACP / dashboard runtime 還能讀 |
| `src/content.config.ts` / 任何 schema / scripts / docs | **不動** |
| `worklogs/` | **不動**（worklog-2026-04-27.md 是 Paul 自己的） |

如果發現 `data/*.json` 其實有 commit 進過 git history、有版本依賴 — 停下來問 Paul（不一定要 untrack）。

---

## 6. 護欄重申

- **不動 derived_from 任何檔案**（schema / SSOT / validator / tests / consistency-check 全不動）
- **不動 Paul 進行中工作**（worklog / ACP / wiki sources / governance docs）
- **不動 Formosa 的 stash@{3}**
- **不寫 Phase 4 handoff**（按 `feedback_handoff_flow_discipline`）
- **遇到意外狀態先停**

---

## 7. 建議模型 / Effort

| 子任務 | 模型 | 時間 |
|------|------|------|
| 動作 1 環境前置確認 | Sonnet 4.6 | 1-2 min |
| 動作 2 packageManager + lockfile commit | Sonnet 4.6 | 2-3 min |
| 動作 3-5 .gitignore + untrack | Sonnet 4.6 | 4-5 min |
| 動作 6-7 push + 留言 | Sonnet 4.6 | 2 min |

整體 **Sonnet 4.6 / Low effort（10-15 min）**。

---

## 8. 不做的事（明確排除）

- 不做 macOS 副本檔自動 gitignore（pattern 太廣會誤殺）
- 不做 `data/` 整個目錄 gitignore（裡面可能有應該追蹤的 schema / 設定檔）
- 不 commit Paul 的進行中工作
- 不寫 Phase 4 handoff
- 不在 derived_from 還沒結案前跑

---

## 9. 依賴 / 來源

- 本任務來源：derived_from acceptance handoff（commit `8141947`）跑 `pnpm install` 時觸發 corepack + lockfile 對齊；Cowork session 2026-04-27 主動寫此 chore handoff
- 相關 commit：
  - `709641e` feat(article-schema): add derived_from field（第三步主成果）
  - `8141947` handoff(code): derived_from acceptance 收尾 + 環境清潔
- 相關記憶：`feedback_cross_project_impact`（跨檔影響檢查）、`feedback_handoff_flow_discipline`（停手等回報）

---

*產出：Cowork session 2026-04-27 在 derived_from 第三步 acceptance 進行中，主動把 working tree 髒度整理寫成 chore handoff，等 acceptance 結案後另開 session 跑*

*下一手：等 derived_from acceptance 結案，Code session 接此 handoff，10-15 min 完成。*
