# Code Handoff — wrong_pillar 9 支處理（2026-04-26）

> 建立：2026-04-26
> 來源：Cowork wrong_pillar 9 支裁決（Paul 已逐筆同意）
> 目標 session：Code [WIKI]
> **建議模型**：Claude Sonnet 4.6
> **Effort**：Low-Medium（5 支可直接機械執行；YouTube blocklist 擴充另開 ToDo）

---

## 上下文

04-22 batch rerun 後 9 支 source 被 enrichment 標記 `wrong_pillar_suspected: true`。Cowork 04-26 整理表給 Paul 逐筆裁決，9 支結論：

| # | file | 動作 | 細節 |
|---|------|------|------|
| 1 | article-broken-crutch-elderly-faith | keep+wait | 等 concept 庫補完（不本次處理）|
| 2 | article-moral-person-immoral-society | keep+wait | 等 concept 庫補完（不本次處理）|
| 3 | getnote-558096-alien-life-civilization | **change pillar → faith + restart enrich** | 原 ai → faith |
| 4 | getnote-584104-life-energy-management | keep+wait | 等 concept 庫補完（不本次處理）|
| 5 | getnote-617272-positive-sum-vs-zero-sum | **change pillar → startup + restart enrich** | 原 ai → startup |
| 6 | getnote-780904-lab-facility-animal-research | **drop + blocklist** | raw_note_id `1901454756136780904`（從 internal/keep_internal 升級為 delete）|
| 7 | getnote-896520-political-trust-collapse | keep+wait | 等 concept 庫補完（不本次處理）|
| 8 | youtube-0h3P7Ojn-3o | **drop**（source 刪除）+ youtube blocklist 機制獨立 ToDo | youtube_id `0h3P7Ojn-3o` |
| 9 | youtube-j1V_C6qxT20-ai | **restart enrich** | pillar=ai 不變，重跑 enrichment |

「keep+wait」4 支不在本次 handoff 範圍，已加進 Issue #157 等 concept 補完獨立 ToDo。

---

## 動作 1：3 支 restart enrich（#3、#5、#9）

```bash
cd <repo root>

# 改 pillar（#3 ai → faith；#5 ai → startup）
sed -i.bak 's/^pillar: ai$/pillar: faith/' src/content/wiki/sources/getnote-558096-alien-life-civilization.md
sed -i.bak 's/^pillar: ai$/pillar: startup/' src/content/wiki/sources/getnote-617272-positive-sum-vs-zero-sum.md
rm -f src/content/wiki/sources/*.bak

# 確認 pillar 寫對
grep '^pillar:' src/content/wiki/sources/getnote-558096-alien-life-civilization.md
grep '^pillar:' src/content/wiki/sources/getnote-617272-positive-sum-vs-zero-sum.md

# 重 enrich（--force 覆寫已有結果）
node scripts/wiki-enrich.cjs --force --slug getnote-558096-alien-life-civilization
node scripts/wiki-enrich.cjs --force --slug getnote-617272-positive-sum-vs-zero-sum
node scripts/wiki-enrich.cjs --force --slug youtube-j1V_C6qxT20-ai
```

**驗收**：
- 3 支跑完 frontmatter `wrong_pillar_suspected` 應為 false 或被移除
- 至少有 1 個 `matched` concept（如果還是 0，回報 Cowork 評估是否歸到 keep+wait）
- enrichment_notes 應該被覆寫或清空

---

## 動作 2：drop #6 + 加 blocklist

#6 已經是 `visibility: internal` + `quarantine.review_outcome: keep_internal`（04-26 quarantine 流程結果）。Paul 04-26 重新裁決升級為 delete。

```bash
# 移除 source 檔
git rm src/content/wiki/sources/getnote-780904-lab-facility-animal-research.md
```

`data/wiki-ingest-blocklist.json` `blocklist` 區塊新增 entry：

```json
"1901454756136780904": {
  "reason": "純實驗室設施介紹（含具名地點），無公開知識價值；從 keep_internal 升級為 delete（wrong_pillar 9 支裁決）",
  "added_at": "2026-04-26",
  "added_by": "paul+cowork",
  "title_at_delete": "實驗室設施與動物實驗區域介紹"
}
```

---

## 動作 3：drop #8（source 刪除）

```bash
git rm src/content/wiki/sources/youtube-0h3P7Ojn-3o-0h3P7Ojn-3o.md
```

**注意**：目前 `data/wiki-ingest-blocklist.json` 只支援 `raw_note_id`（getnote 雪花 ID）為 key，**不支援 youtube_id**。所以 #8 暫時只能刪 source 檔。下次 youtube ingest 跑時可能會把它撈回來——這要靠下面獨立 ToDo 補完。

---

## 動作 4：commit + push + 收尾

建議拆成 3 個 commits：

```bash
# Commit 1：3 支 pillar / re-enrich
git add src/content/wiki/sources/getnote-558096-alien-life-civilization.md \
        src/content/wiki/sources/getnote-617272-positive-sum-vs-zero-sum.md \
        src/content/wiki/sources/youtube-j1V_C6qxT20-ai.md
git commit -m "fix(wiki): wrong_pillar 9 支裁決——3 支重 enrich

- getnote-558096 alien-life-civilization: pillar ai → faith + re-enrich
- getnote-617272 positive-sum-vs-zero-sum: pillar ai → startup + re-enrich
- youtube-j1V_C6qxT20-ai: pillar 不變，restart enrich

Refs: cowork--wiki-wrong-pillar-9-handoff-2026-04-26.md"

# Commit 2：drop #6 + blocklist
git add data/wiki-ingest-blocklist.json
git rm src/content/wiki/sources/getnote-780904-lab-facility-animal-research.md
git commit -m "feat(wiki): drop getnote-780904 + blocklist (升級為 delete)

raw_note_id 1901454756136780904 從 keep_internal 升級為 delete。
原因：純實驗室設施介紹，含具名地點，無公開知識價值。"

# Commit 3：drop #8（source 刪除，blocklist 機制擴充另開 ToDo）
git rm src/content/wiki/sources/youtube-0h3P7Ojn-3o-0h3P7Ojn-3o.md
git commit -m "feat(wiki): drop youtube-0h3P7Ojn-3o (中東滯脹)

離 paulkuo.tw 主軸太遠（地緣政治/金融），對 wiki 無增量。
TODO: youtube_id blocklist 機制擴充，避免 ingest 撈回來——獨立 ToDo 已開。"

git push
```

收尾：

```bash
# KV 重新 seed（source 數量從 300 → 298）
node scripts/wiki-kv-seed.cjs

# 治理一致性檢查
python3 scripts/wiki-consistency-check.py
```

---

## 完成後在 Issue #157 留言回報

模板：

```
## wrong_pillar 9 支處理回報（2026-04-26）

### 重 enrich 結果
- #3 getnote-558096 (faith): matched X concepts → [...]
- #5 getnote-617272 (startup): matched X concepts → [...]
- #9 youtube-j1V_C6qxT20-ai: matched X concepts → [...]

### Drop 結果
- #6 getnote-780904: ✅ 加進 blocklist (raw_note_id 1901454756136780904)
- #8 youtube-0h3P7Ojn-3o: ✅ source 刪除（YouTube blocklist 擴充另開 ToDo）

### Corpus 變化
- public sources: 281 → 280（減 #8）
- internal sources: 19 → 18（減 #6）
- total: 300 → 298
- blocklist: 12 → 13

### Commits
- <commit-sha-1>: 重 enrich 3 支
- <commit-sha-2>: drop #6 + blocklist
- <commit-sha-3>: drop #8

### 後續 ToDo（已加進 Issue #157）
- YouTube blocklist 機制擴充（避免 #8 重新被 ingest）
- 4 支 keep+wait（#1、#2、#4、#7）等 concept 庫補完再 re-enrich
```

---

## 跨專案影響檢查

| 檔案 | 影響 |
|------|------|
| `src/content/wiki/sources/` | 2 支移除（#6、#8）、3 支 frontmatter 變動（#3、#5、#9）|
| `data/wiki-ingest-blocklist.json` | +1 entry（#6 raw_note_id）|
| `src/content/wiki/stats.json` | KV seed 重跑後同步 |
| `data/wiki-corpus.json` 等衍生檔 | KV seed 重跑後同步 |
| `scripts/wiki-youtube-ingest.cjs` | **不本次動**（YouTube blocklist 擴充獨立 ToDo）|

---

## 護欄

- 改 frontmatter 前先確認 `git status` 乾淨
- 重 enrich 前確認 ANTHROPIC_API_KEY 在 .env（wiki-enrich.cjs 走 Haiku 主力）
- KV seed 重跑要確認 wrangler 已登入
- 不要把 4 支「keep+wait」也跑進來——那批是 concept 庫不夠，不是 enrichment 問題

---

*產出：Cowork session 2026-04-26 暖機任務*
*依賴 handoff：worklogs/cowork--wiki-enrich-e2-review-2026-04-21.md（wrong_pillar 機制設計來源）*
