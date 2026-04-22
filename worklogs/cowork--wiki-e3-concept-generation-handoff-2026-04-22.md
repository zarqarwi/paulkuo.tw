# E3 Handoff：Concept 頁面生成

> 建立：2026-04-22
> Cowork session：LLM Wiki 專案
> 目標 session：Code [WIKI]
> 前序：全量 batch rerun 完成，commit `284cee2`，295/300 成功
> **建議模型**：Claude Sonnet 4.6 + Effort Medium（需推理 candidates 去重與合併）

---

## 背景

全量 batch rerun 完成後，295 支 sources 的 `concept_links.candidates` 裡積累了大量「建議新建」的 concept。E3 的目標是：

1. **掃描所有 sources 的 candidates**，統計每個候選 concept 被提名幾次
2. **篩選高頻 + 有價值的候選**，建立新的 concept 頁面
3. **Schema 加入 `paul_perspective` 欄位**（先空著，為 L3 演化層占位）
4. **更新已有 concept 頁面**，補上來自 batch rerun 的新 source 連結

---

## 現有狀況

### 現有 13 個 concept 頁面

```
agentic-web, ai-agent-economy, ai-education, ai-skill-methodology,
build-for-models, enterprise-ai-adoption, human-ai-collaboration,
human-judgment-in-ai-era, leverage-and-compounding, mental-models,
one-person-team, personal-agency, skill-development
```

### 已知高優先候選（從抽查樣本觀察）

| slug | 被提名來源數 | 優先度 |
|------|------------|--------|
| `spatial-intelligence` | 至少 1（群核影片為主軸）| ⭐⭐⭐ 核心 |
| `world-model-stack` | 至少 2（群核影片、其他 AI 影片）| ⭐⭐⭐ 核心 |
| `ai-embodiment` | 已有頁面，但需更多 sources 補充 | 更新 |
| `learning-as-meta-skill` | 多支 sources | ⭐⭐ |
| `personal-knowledge-system` | 多支 sources | ⭐⭐ |
| `software-disruption` | 多支 sources | ⭐⭐ |
| `one-person-team` | 已有頁面 | 更新 |

---

## E3 執行步驟

### Step 1：建立 candidates 彙整腳本

建立 `scripts/wiki-concept-candidates.cjs`，功能：
- 掃描 `src/content/wiki/sources/` 所有 .md 的 `concept_links.candidates`
- 統計每個 `slug_zh` 被提名的次數與來源清單
- 輸出排序後的候選清單（JSON 或 markdown table）

執行：
```bash
node scripts/wiki-concept-candidates.cjs > /tmp/candidates-report.md
```

### Step 2：Schema 更新

在 `src/content.config.ts` 的 `wikiSchema` 加入：

```typescript
paul_perspective: z.string().optional(),
```

放在 `enrichment_notes` 之後。

### Step 3：建立新 concept 頁面

**優先建立被提名 ≥ 2 次的候選**（由 Step 1 報告決定確切清單）。

每個新 concept 頁面的格式參考現有的 `ai-embodiment.md`，frontmatter 結構：

```yaml
---
title: "（繁體中文標題）"
type: concept
pillar: ai
visibility: public
created: 2026-04-22
updated: 2026-04-22
source_count: （來源數）
confidence: low
tags: [...]
links_to: [（相關 concept slugs）]
linked_from: [（提名此 concept 的 source slugs）]
paul_perspective: ""
---

## 摘要

（2-3 句，說明這個 concept 在 Paul 的知識圖譜裡的意義）

## 核心觀點

（從 candidates reason 彙整，列出 2-4 個觀點，附來源 wikilink）

## 來源引用

- [[source-slug]] — 一句話說明這個 source 的貢獻

## 矛盾與爭議

（若目前來源觀點一致，說明待補充方向）

## 延伸連結

- → [[concept-slug]] 說明關係
```

### Step 4：更新現有 concept 頁面

對已有的 13 個 concept，更新：
- `linked_from` 加入 batch rerun 後新建立連結的 source slugs
- `source_count` 更新
- 加入 `paul_perspective: ""` 欄位（若尚未有）

### Step 5：commit + push

```
feat(wiki): E3 concept 生成 — 新增 N 個 concept 頁面、更新 13 個現有頁面、schema 加 paul_perspective
```

---

## 重要設計決策

### `paul_perspective` 欄位說明

這個欄位**現在留空**，不讓 LLM 填寫。原因：

> Wiki 不是知識展示櫃，而是碰撞引擎。`paul_perspective` 記錄的是 Paul 自己讀完這些素材後的想法、連結、與觀點演化——這是機器沒辦法代勞的那一層。

空欄位是系統為 L3 演化層預留的插槽，日後 Paul 或 Cowork 可以手動填寫。

### Concept 頁面生成策略

Code 使用 **Sonnet**（不是 Haiku）來生成 concept 頁面，原因：
- Concept 頁面需要綜合多個 sources 的觀點
- 需要判斷 links_to 的合理性（哪些 concept 真的有概念關係）
- 品質比速度重要

每次生成前，先讀所有提名該 concept 的 source 頁面的 `candidates.reason` 欄位，作為輸入。

### 不做的事

- **不自動填 `paul_perspective`**：這是人類的工作
- **不建立被提名只有 1 次的 candidate**：除非內容特別重要（由 Code 判斷）
- **不修改 wrong_pillar sources 的 pillar**：這是另一個 issue，不在 E3 範圍

---

## 完成後請做

1. commit + push
2. 在本 handoff 底部填「Code 回報」區塊：
   - 新建 concept 頁面數量與清單
   - 更新 concept 頁面數量
   - candidates 彙整報告中前 10 名候選的統計
3. 回報 Cowork 確認，再跑 `wiki-kv-seed.cjs` 更新 KV

---

## Code 回報區塊（待填）

```
完成時間：
commit sha：
新建 concept 頁面：（數量）
  清單：
更新現有 concept 頁面：（數量）
candidates 前 10 名：
  1. slug: / 被提名次數: 
  2. ...
KV seed 是否已跑：
```
