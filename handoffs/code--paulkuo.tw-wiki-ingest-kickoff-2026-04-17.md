# Code Kickoff: Wiki Ingest Batch 2026-04-17

> **貼我到 Code session 開工**
> **模型**：Sonnet 4.6 + Medium
> **Task Size**：M（預期 1 小時，13 篇）
> **完整細節**：`handoffs/code--paulkuo.tw-wiki-ingest-batch-2026-04-17.md`

---

## 前置假設（Paul 已做）

- [x] `cd ~/Desktop/01_專案進行中/paulkuo.tw && git pull`（同步 handoffs/ 和 worklogs/ 最新）

Code 開工第一步：跑 `ls handoffs/` 確認看得到 `code--paulkuo.tw-wiki-ingest-batch-2026-04-17.md`。看不到就回頭叫 Paul 再 pull 一次。

---

## 你的任務（一段話版本）

把 `worklogs/wiki-ingest-pending.md` 列出的 **public 11 篇 + 01_專欄文章 檔名異常 2 篇**（共 13 篇）從 `~/Desktop/01_專案進行中/get_筆記/notes/` ingest 到 `src/content/wiki/sources/`，每篇產出一個 `getnote-{suffix}-{slug}.md`，完成後跑 `wiki-kv-seed.cjs` 更新 KV，push 到 main。

**細節、上游假設、注意事項、Integration Checklist**：讀完整 handoff `handoffs/code--paulkuo.tw-wiki-ingest-batch-2026-04-17.md`（已在 main，git pull 就有）。

---

## 本批 13 篇（suffix 快速對照）

### 01_專欄文章（6）
`852296` `286224` `379272` `051360` `349784` `027360`

### 01_專欄文章 檔名異常（2，需本機 `ls 01_專欄文章/快刀青衣_專欄/` 確認）
`779_清华李宁教授` `884_硅谷站队风波`

### 03_環保循環經濟（1）
`949040`

### 04_AI與科技（4，**先驗證非錄音卡筆記**才 ingest）
`860776` `426280` `126888` `294528`

完整標題、note_id、路徑見 `worklogs/wiki-ingest-pending.md`。

---

## 執行順序

1. **偵察**：`ls src/content/wiki/sources/ | wc -l`（應為 140，否則停）
2. **04_AI與科技 4 篇驗證**：讀 frontmatter 的 tags，找 `录音笔记` 或 `录音卡笔记` system tag。有 → 降級 internal、從本批移除
3. **01_ 檔名異常 2 篇**：本機 `ls 01_專欄文章/快刀青衣_專欄/` 拿正確檔名
4. **逐篇 ingest**：讀 source → 產 `getnote-{suffix}-{slug}.md` → frontmatter 含 `raw_note_id`、`visibility: public`、`source_folder`、`title`、`tags`、`ingested_at`
5. **wikilinks**：提到既有 concept 改 `[[concept-name]]`，**不新增 concept**（concept 留給 Opus 做另一批）
6. **驗證**：`pnpm astro check` 必須 0 error
7. **KV seed**：`node scripts/wiki-kv-seed.cjs`（先 dry-run 若支援）
8. **commit + push**：commit message `wiki: ingest batch 2026-04-17 (public {N} files)`

---

## 完成回報（硬性格式，護欄 #14）

回報時必須帶三態之一：

- ✅ `commit {SHA} pushed`
- ⚠️ `commit {SHA} local only`
- ⚠️ `local edit uncommitted`

並附下列資訊：

```
本批 ingest 結果
- 實際 ingest：{N} 篇（目標 13，實際可能少於）
- 跳過：{項目 + 原因}（例如「04 的 `868896` 發現是錄音卡筆記，降級 internal」）
- sources 總數：140 → {140+N}
- pnpm astro check：{0 error / N error}
- wiki-kv-seed.cjs：{ran / skipped + 原因}
- commit: {SHA}
```

---

## 不可逆操作提醒（護欄 #11）

- ⚠️ `wiki-kv-seed.cjs` 會覆寫 `TICKER_KV`（與主站共用）→ 先 dry-run
- ⚠️ `git push origin main` → 推送前 `pnpm astro check`

---

## Cowork 後續

Code 回報後，下次 Cowork 開場會自動：
1. 讀最新 worklog
2. Reconcile：驗證 `curl https://paulkuo.tw/api/wiki/search?q={任一新 suffix}` 有回應
3. 同步 Issue #157 的 corpus 計數（140 → 140+N）
4. 如果本批 04 有 2 篇被降級為 internal，更新下輪 pending 清單

Paul 不用手動做這步，Cowork 自動處理。

---

*Cowork kickoff handoff ｜ 2026-04-17 ｜ 完整版見 `handoffs/code--paulkuo.tw-wiki-ingest-batch-2026-04-17.md`*
