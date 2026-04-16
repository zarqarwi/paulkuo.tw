# Cowork → Code Handoff：Wiki Batch 2A 收尾

- **日期**：2026-04-16
- **來源**：Cowork session（wiki-ingest-scanner Batch 2A）
- **建議模型**：Sonnet 4.6 · Effort: Medium
- **Task Size**：M（30 min ~ 1 hr）

---

## 1. 背景

Cowork 完成 wiki-ingest-scanner Batch 2A，將 6 篇 01_專欄文章 public source 寫入磁碟（萬維鋼 4 篇 + 快刀 2 篇），並更新 attention-time concept（source_count 1→2, confidence medium→high）。Code 需要收尾：git commit + push、重建 stats.json + graph.json、KV seed。

---

## 2. Step 0 偵察

Code 開場先跑以下確認檔案在磁碟：

```bash
# 確認 6 篇新 source 存在
ls -la src/content/wiki/sources/getnote-617272-positive-sum-vs-zero-sum.md
ls -la src/content/wiki/sources/getnote-705416-free-energy-principle.md
ls -la src/content/wiki/sources/getnote-912984-compound-interest-qa.md
ls -la src/content/wiki/sources/getnote-666072-elite-not-painful-grind.md
ls -la src/content/wiki/sources/getnote-800608-attention-time-li-ning.md
ls -la src/content/wiki/sources/getnote-309416-canary-coal-mine-ai-employment.md

# 確認 concept 有更新（source_count 應為 2, confidence 應為 high）
grep -n "source_count" src/content/wiki/concepts/attention-time.md
grep -n "confidence" src/content/wiki/concepts/attention-time.md

# 確認 git 狀態
git status
```

---

## 3. 具體步驟

### Step 1: Git commit + push

```bash
git add src/content/wiki/sources/getnote-617272-positive-sum-vs-zero-sum.md
git add src/content/wiki/sources/getnote-705416-free-energy-principle.md
git add src/content/wiki/sources/getnote-912984-compound-interest-qa.md
git add src/content/wiki/sources/getnote-666072-elite-not-painful-grind.md
git add src/content/wiki/sources/getnote-800608-attention-time-li-ning.md
git add src/content/wiki/sources/getnote-309416-canary-coal-mine-ai-employment.md
git add src/content/wiki/concepts/attention-time.md

git commit -m "wiki: batch 2A ingest — 6 source + attention-time concept升high

- 萬維鋼4篇：正和零和/自由能原理/複利問答/卷王SDT
- 快刀2篇：李寧注意力時長/煤礦金絲雀AI就業
- attention-time concept: source_count 1→2, confidence→high
- corpus 233→239"

git push
```

### Step 2: 重建 stats.json + graph.json

更新 `src/content/wiki/stats.json`：
- sources: +6（原值 +6）
- total: +6（原值 +6）

更新 `src/content/wiki/graph.json`：
- 新增 6 個 source node
- 新增 edge：
  - `getnote-800608` → `attention-time`（concept link）
  - `getnote-800608` → `one-person-team`（links_to）
  - `getnote-309416` → `human-judgment-in-ai-era`（links_to）
  - `getnote-666072` → `sdt-agency`（links_to）
  - `getnote-912984` → `sdt-agency`（links_to）
  - `getnote-912984` ↔ `getnote-705416`（互引）
  - `getnote-912984` ↔ `getnote-666072`（互引）
  - `getnote-800608` ↔ `getnote-343376`（同 concept 雙來源）

commit 並 push stats.json + graph.json。

### Step 3: KV seed

```bash
node scripts/wiki-kv-seed.cjs
```

預期輸出：22 concepts + index/graph/stats seeded。

---

## 4. 上游假設

| 假設 | 驗證方式 |
|------|---------|
| 6 篇 source 的 frontmatter 符合 content.config.ts schema | `git status` 不報 error + Astro build 不報 schema error |
| attention-time.md 的 linked_from 陣列格式正確 | grep 確認 |
| Batch 1 的 commit 已在 main（commit `970c2f3` 之後） | `git log --oneline -5` 確認 |

---

## 5. 驗證方式

| 項目 | 驗證方式 | 來源 |
|------|---------|------|
| Git commit 成功 | `git log --oneline -3` 看到新 commit | 本機 terminal |
| stats.json 數字正確 | `cat src/content/wiki/stats.json` 核對 total | 本機 grep |
| graph.json 包含新 node | `grep "getnote-800608" src/content/wiki/graph.json` | 本機 grep |
| KV seed 成功 | wiki-kv-seed.cjs 輸出無 error | 本機 terminal |
| 線上 /wiki/ 可查到新頁面 | `curl https://paulkuo.tw/wiki/sources/getnote-800608-attention-time-li-ning` 回 200 | 線上 API |

---

## 6. 注意事項

- ⚠️ `wrangler deploy` 是不可逆操作，確認 KV seed 無 error 後再 deploy（如果需要的話）
- 萬維鋼 617272 和 705416 是短筆記（untitled），content 較薄但概念獨立
- `getnote-309416` 與 `articles/canary-in-coal-mine-ai-employment.md` 主題高度重疊，本次不處理雙向連結，記在待辦

---

## 7. 信心等級

**高** — 6 篇 source 已用 filesystem MCP 寫入磁碟並確認成功回應，concept 更新內容明確。Step 0 偵察可快速驗證。

---

## 8. Integration Checklist

| 影響範圍 | 說明 | 需要動作 |
|---------|------|---------|
| `src/content/wiki/sources/` | +6 新檔案 | git add + commit |
| `src/content/wiki/concepts/attention-time.md` | 更新 source_count/confidence/linked_from | git add + commit |
| `src/content/wiki/stats.json` | 需重建 | Code 手動更新 |
| `src/content/wiki/graph.json` | 需重建（+6 nodes, +8 edges） | Code 手動更新 |
| KV namespace `c066a2fd...` | 需 seed | `node scripts/wiki-kv-seed.cjs` |
| Issue #157 | ✅ 已由 Cowork 更新（corpus 233→239） | 無需動作 |
| 新增 API endpoint | ❌ 本次無新 endpoint | — |
| 防護繼承檢查 | ❌ 不適用 | — |

---

## 新增 source 清單（完整 frontmatter 參考）

| # | slug | title | pillar | tags 重點 |
|---|------|-------|--------|----------|
| 1 | `getnote-617272-positive-sum-vs-zero-sum` | 正和思維與零和思維 | ai | 正和博弈, 零和博弈, 精神內耗 |
| 2 | `getnote-705416-free-energy-principle` | 自由能原理：活著就是對齊 | ai | 自由能原理, 神經科學, 熵增定律 |
| 3 | `getnote-912984-compound-interest-qa` | 萬維鋼《複利》等主題讀者問答 | ai | 複利積累, SDT, 自由能, WOOP |
| 4 | `getnote-666072-elite-not-painful-grind` | 一流人物不是痛苦的卷王 | ai | SDT, 能動性, 內在動機, 心流 |
| 5 | `getnote-800608-attention-time-li-ning` | 清華李寧：40分鐘 + AI 20人天 | ai | 注意力時長, 人月神話, 碎片化注意力 |
| 6 | `getnote-309416-canary-coal-mine-ai-employment` | 煤礦金絲雀 AI 就業真相 | ai | AI就業, 半人馬模式, 史丹佛研究 |
