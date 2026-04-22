# E2.5.1 Handoff：禁止間接類比推理

> 建立：2026-04-22
> Cowork session：LLM Wiki 專案
> 目標 session：Code [WIKI]
> 前序：`worklogs/cowork--wiki-enrich-e2-review-2026-04-21.md`（E2.5 Code 回報 commit `ecc43ca`）
> **建議模型**：Claude Sonnet 4.6 + Effort Low（單一 prompt 修改，驗收一支影片）

---

## 問題描述

E2.5 修完後，睡眠影片（`youtube-OxJzRU-6tuk`）測試結果如下：

- **預期**：`matched: []`、`wrong_pillar_suspected: true`
- **實際**：`matched` 從 3 收斂到 2，但**沒有變成空陣列**，`wrong_pillar_suspected` 未觸發

**根因**：Haiku 使用了「間接類比推理鏈」來繞過空陣列規則。推理路徑大概是：

> 睡眠影響認知 → 認知與學習相關 → `learning-as-meta-skill` 是合法 match

這種推理在語言層面說得通，但違反了 rule #7 的精神——睡眠科學影片的主軸不是「學習作為元技能」，而是睡眠本身的生理機制。規則沒有明確禁止這種間接推理，所以 Haiku 認為自己沒有違規。

---

## 需要做的事：一行 prompt 修改

在 `scripts/wiki-enrich.cjs` 的 SYSTEM_PROMPT rule #7 末尾，在「絕不為了湊數而 match 不相關 concept。空陣列是合法且正確的輸出。」**之後**，追加一句：

```
禁止使用「間接類比」或「跨領域泛化」推理來建立 match（例如：睡眠→認知→學習→`learning-as-meta-skill` 這種推理鏈是不合法的，因為影片的主軸主題是睡眠科學，不是學習方法論）。matched 裡的每個 concept 必須是影片的**直接主軸**，不是透過多步推理才能抵達的連結。
```

---

## 驗證

改完後 `--force` 重跑睡眠影片：

```bash
node scripts/wiki-enrich.cjs --force --source youtube-OxJzRU-6tuk-OxJzRU-6tuk
```

**預期結果**：
- `matched: []`（空陣列）
- `wrong_pillar_suspected: true`
- `enrichment_notes` 包含「主題與現有 concept 清單無核心對齊」

**對照組**（確認不退步，不需 `--force`，只看現有輸出）：
- `youtube-8pncy425QqQ-ai`（群核空間智能）：matched 應維持 `[ai-embodiment, build-for-models]` 或類似 2-3 個精準 concept

---

## 跨專案影響

只改 `scripts/wiki-enrich.cjs` 的 SYSTEM_PROMPT 字串，其他檔案零影響。

---

## 完成後請做

1. commit + push（commit message 格式：`fix(wiki): E2.5.1 禁止間接類比推理，強制睡眠影片空 matched`）
2. 在本 handoff 文件底部加「Code 回報」區塊，貼：
   - 睡眠影片修改後的 `concept_links` 輸出（matched 與 candidates）
   - 是否觸發 `wrong_pillar_suspected: true`
3. 回報 Cowork，Cowork 確認後放行 **全量 batch rerun**（`--force` 重跑全部 26 支）

---

## Code 回報區塊（待填）

```
驗收時間：
commit sha：
睡眠影片結果：
  matched: 
  wrong_pillar_suspected: 
對照組（群核 AI）matched：
```
