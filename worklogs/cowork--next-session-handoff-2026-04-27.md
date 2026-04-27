# Cowork Session Handoff — 接手 paulkuo.tw 進行中狀態（2026-04-27）

> 建立：2026-04-27 由 Cowork session 結尾寫
> 用途：交給**下一個 Cowork session**（Paul 自己或新接手）接手 paulkuo.tw 工作
> 不是給 Code 的執行 handoff（Code 兩份 handoff 已獨立 push）

---

## 1. 一句話總結

paulkuo.tw 第三步「Article schema 加 derived_from」已**全綠閉環**（commit `709641e`）。working tree 還有些副作用待 cleanup chore 收尾，Phase 4 反向索引等 Paul 拍板。

---

## 2. 接手 checklist（5 分鐘內上手）

開場做這幾件事：

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw

# 1. 確認 HEAD（應該是 cleanup handoff commit 或之後）
git log --oneline -5

# 2. 看 working tree 髒度
git status

# 3. 看 stash（應該還有 stash@{0} fix/formosa-post-event WIP）
git stash list

# 4. 讀 Issue #157 最新留言確認在哪個階段
gh issue view 157 --comments | tail -100
```

接著看本 handoff 第 3-5 節，知道哪些已閉環、哪些待跑、哪些不要碰。

---

## 3. 已閉環（不要重做）

### 第三步 derived_from（2026-04-27 全綠）

| 項目 | 狀態 | 證據 |
|---|---|---|
| 程式碼 | 5 檔 push 上 main | commit [`709641e`](https://github.com/zarqarwi/paulkuo.tw/commit/709641e59282a0e847e6c852413ab61ad9e13b42) |
| pytest | 163 passed | Code session 跑過 |
| wiki-consistency-check | 12 component refs verified | Code session 跑過 |
| pnpm build | 554 pages, 0 errors, 111s | Code session 跑過 |
| Issue #157 收尾留言 | [comment 4329902396](https://github.com/zarqarwi/paulkuo.tw/issues/157#issuecomment-4329902396) | Code session 留 |

成果：article frontmatter 多了 optional `derived_from: string[]` 欄位，記錄文章是從哪些 wiki source 衍生出來。SSOT 在 `docs/article-derived-from.md`，validator 在 `scripts/wiki-derived-from-validate.py`。

**詳細閉環過程**：worklog 在 `worklogs/cowork--wiki-article-derived-from-handoff-2026-04-27.md`（Cowork→Code 主 handoff）+ `worklogs/cowork--wiki-derived-from-acceptance-handoff-2026-04-27.md`（acceptance 收尾 handoff）。

---

## 4. 待跑（Code session 任務，已寫好 handoff）

### 4.1 working tree cleanup chore

**檔案**：[`worklogs/cowork--working-tree-cleanup-handoff-2026-04-27.md`](https://github.com/zarqarwi/paulkuo.tw/blob/main/worklogs/cowork--working-tree-cleanup-handoff-2026-04-27.md)（commit `33c560d`）

**內容**：兩筆 commit 整理 working tree
1. `chore(deps)`: commit `package.json` packageManager 欄位 + 對齊 `pnpm-lock.yaml`
2. `chore(gitignore)`: 加 `data/stock.json` / `timing.json` / `last-scan.json` / `__pycache__/` 排除 + `git rm --cached`

**狀態**：handoff 已 push，**未跑**。前置條件（derived_from acceptance 結案）已達成。

**怎麼啟動**：開新 Code session 貼：
```
[WIKI] 接 cowork--working-tree-cleanup-handoff-2026-04-27.md
```

建議 Sonnet 4.6 / Low effort（10-15 min）。

---

## 5. 等 Paul 拍板（不要預先寫 handoff）

按 memory `feedback_handoff_flow_discipline`，Cowork 不預先寫下一階段 handoff。等 Paul 主動說要做才開：

### 5.1 Phase 4：反向索引 + Frontend「衍生自」section

L3 演化層第二步。包含：
- source 端的反向索引（`source → articles` 列表）
- Frontend article page 加「衍生自」section 顯示 wiki sources
- KV index 結構設計

詳細 Phase 規劃見 [`docs/article-derived-from.md`](https://github.com/zarqarwi/paulkuo.tw/blob/main/docs/article-derived-from.md) 的「Phase 規劃」段。

### 5.2 「按工程角度依序處理」第四步以後

第三步是這個流程的中間階段，第四步主題待 Paul 拍板。前三步：
- [x] 第一步 wiki-enrich.cjs gray-matter（commit `3293b4b`）
- [x] 第二步 wiki_corpus_lib 抽出（commit `84ecf72` + `a58b4a4`）
- [x] 第三步 derived_from schema（commit `709641e`）
- [ ] 第四步 — 等 Paul 拍板主題

---

## 6. 護欄 — 不要碰的東西

### 6.1 stash@{0} `fix/formosa-post-event` WIP

`git stash list` 應該還有這個 entry（標題 `WIP on fix/formosa-post-event: 9432608 chore(verify)...`）。這是 Formosa 專案的工作，**跟 paulkuo.tw 第三步無關，絕對不要 drop**。

如果接手後看到 stash list 裡這個 entry 不見了 — 停下來問 Paul。

### 6.2 Paul 進行中工作（不在本 session 範圍）

`git status` 上會看到一堆 modified / untracked，包括但不限於：
- `worklogs/worklog-2026-04-27.md`
- 5 個 ACP component（`EvidenceBadge.tsx` / `RadarChart.tsx` / `ScoreBar.tsx` / `Tooltip.tsx` / `WeightSlider.tsx` / `constants.ts`）
- 14 個 getnote/youtube wiki sources（`src/content/wiki/sources/`）
- 4 個 governance docs（`docs/`）
- `data/stock.json` / `data/timing.json`（動態資料，cleanup handoff 會處理）

這些**不要主動動**。Paul 會自己整理。

### 6.3 Code session 已交付的 commits

不要再修改：
- `709641e`（derived_from 程式碼）
- `8141947`（acceptance handoff）
- `33c560d`（cleanup handoff）

---

## 7. 跨專案狀態（短期記憶 anchor）

| 專案 | 最近狀態 |
|---|---|
| **paulkuo.tw** | 第三步 derived_from 閉環（本任務） |
| **Formosa** | `fix/formosa-post-event` 分支有 WIP stash，跟本任務無關 |
| **ACP** | 5 個 component 在 working tree 進行中（Paul 自己處理） |
| **wiki ingest pipeline** | 14 個 getnote/youtube source untracked 待 review（Paul 自己處理） |

詳細專案狀態看 memory：
- `project_llm_wiki_derived_from_done`（本任務閉環紀錄）
- `project_llmwiki_northstar`（北極星願景：碰撞引擎）
- `project_llmwiki_architecture`（戰略定位：個人知識+對外輸出）
- `project_acp_layer23_done`（ACP 全功能上線）

---

## 8. 給下一個 Cowork session 的 prompt 建議

開 Cowork session 時可以這樣起手：

```
延續 paulkuo.tw — 接 worklogs/cowork--next-session-handoff-2026-04-27.md
```

我會自動讀這份 handoff 的接手 checklist + 等你下指令。

如果想直接做 cleanup chore：

```
跑 worklogs/cowork--working-tree-cleanup-handoff-2026-04-27.md（給 Code 接的 chore handoff）
```

如果想推進 Phase 4：

```
[WIKI] Phase 4 規劃 — 反向索引 source→articles
```

---

## 9. 不做的事（明確排除）

- 不重跑 derived_from 第三步驗收（已全綠）
- 不主動寫 Phase 4 handoff（按 `feedback_handoff_flow_discipline`）
- 不動 Formosa stash@{0}
- 不動 Paul 進行中工作
- 不動 ACP / wiki ingest 的 untracked 檔
- 不在 Cowork 內直接動 paulkuo.tw repo（除非 Paul 明確指示）— Cowork 沒 mount 完整 repo，所有寫操作走 GitHub MCP

---

## 10. 建議模型 / Effort

| 接手場景 | 模型 | 時間 |
|---|---|---|
| 純讀本 handoff + 等 Paul 指示 | Haiku 4.5 | 1 min |
| 啟動 cleanup chore（給 Code）| Sonnet 4.6（傳給 Code session） | Cowork 端 2-3 min |
| 啟動 Phase 4 規劃 | **Opus 4.6**（架構規劃高度） | 30-60 min（先對齊設計，handoff 另計） |

---

## 11. 來源 / 依賴

- 本 handoff 由 Cowork session 2026-04-27（Opus 4.7）寫，承接第三步 derived_from 全週期成果
- 相關 commits：
  - `709641e` feat(article-schema): add derived_from field
  - `8141947` handoff(code): derived_from acceptance 收尾
  - `33c560d` handoff(code): working tree cleanup chore
- 相關 Issue 留言：
  - #157 [4328231497](https://github.com/zarqarwi/paulkuo.tw/issues/157#issuecomment-4328231497)（第二步 wiki_corpus_lib 結案）
  - #157 [4328465652](https://github.com/zarqarwi/paulkuo.tw/issues/157#issuecomment-4328465652)（第三步程式碼落地）
  - #157 [4329693426](https://github.com/zarqarwi/paulkuo.tw/issues/157#issuecomment-4329693426)（acceptance 交接 Code）
  - #157 [4329902396](https://github.com/zarqarwi/paulkuo.tw/issues/157#issuecomment-4329902396)（acceptance 收尾全綠）
- 相關 memory：
  - `project_llm_wiki_derived_from_done`（本任務）
  - `feedback_handoff_local`、`feedback_handoff_push`、`feedback_handoff_flow_discipline`、`feedback_session_single_project`、`feedback_no_parallel_code_sessions`、`feedback_terminal_cd_explicit`

---

*產出：Cowork session 2026-04-27 — 接 [WIKI] 第三步、寫程式（commit 709641e）、跑驗收前兩條（pytest/consistency-check 全綠）、寫 acceptance handoff（commit 8141947）給 Code 收尾、寫 cleanup chore handoff（commit 33c560d）整理 working tree 副作用、寫此 next-session handoff 給下一個 Cowork 接手*
