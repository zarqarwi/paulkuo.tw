# Wiki Lint — 知識圖譜健檢 Skill

> 觸發詞：wiki lint、wiki 健檢、wiki 品質檢查、wiki audit、知識圖譜檢查、graph 檢查
> Session 類型：Cowork（分析 + 報告產出，不改程式碼）
> 頻率建議：每週一次，或大批 ingest 後

---

## 目的

隨著 wiki 規模成長，品質容易悄悄劣化。這個 skill 自動掃描所有 wiki 檔案，產出一份健檢報告。

---

## 執行步驟

### Step 1: 讀取 wiki 資料

```bash
# 概念頁
ls src/content/wiki/concepts/

# 統計
cat src/content/wiki/stats.json

# 圖譜
cat src/content/wiki/graph.json
```

### Step 2: 逐項檢查

對每個 concept markdown 檔案執行以下檢查：

| 檢查項 | 邏輯 | 嚴重度 |
|--------|------|--------|
| **無摘要** | body 長度 < 50 字 | 🔴 高 |
| **來源數低** | `source_count < 3` | 🟡 中 |
| **缺 pillar** | frontmatter 沒有 `pillar` 欄位或值為空 | 🔴 高 |
| **缺 linked_from** | `linked_from` 為空陣列 | 🟡 中 |
| **過期未更新** | `last_updated` 距今 > 30 天 | 🟡 中 |

### Step 3: Graph 結構檢查

| 檢查項 | 邏輯 | 嚴重度 |
|--------|------|--------|
| **孤立節點** | graph.json 中某 concept node 的 degree = 0 | 🔴 高 |
| **跨 pillar 比例** | cross-pillar concept edges / 全部 concept edges < 20% | 🟡 中 |
| **斷裂 edge** | edge 的 source 或 target 指向不存在的 node id | 🔴 高 |
| **stats 不一致** | stats.json 的數字與實際檔案數不符 | 🔴 高 |

### Step 4: 進階檢查（可選）

| 檢查項 | 邏輯 | 嚴重度 |
|--------|------|--------|
| **疑似重複概念** | 兩個 concept 的 title 有 > 3 個相同的 tag | 🟡 中 |
| **缺 OG image** | `public/og/wiki/{slug}.png` 不存在 | ⚪ 低 |
| **index.md 同步** | index.md 列出的 concept 數量與 concepts/ 目錄實際數量不符 | 🟡 中 |

### Step 5: 產出報告

寫入 `worklogs/wiki-lint-{YYYY-MM-DD}.md`，格式如下：

```markdown
# Wiki 健檢報告 {YYYY-MM-DD}

## 總覽
- 概念頁：{n} | 來源頁：{n} | Entity：{n}
- Graph：{n} nodes / {n} edges（跨 pillar {n} 條 = {x}%）
- 健康：✅ {n} | 警告：⚠️ {n} | 錯誤：❌ {n}

## 🔴 錯誤（必須修）
- [{slug}] {問題描述}

## 🟡 警告（建議修）
- [{slug}] {問題描述}

## ⚪ 建議（可選）
- [{slug}] {問題描述}

## 趨勢（與上次健檢比較）
- 概念頁：{n} → {n}（+{diff}）
- 跨 pillar 比例：{x}% → {y}%
- 新增問題：{n} | 已解決：{n}
```

### Step 6: 同步

- 如果有 🔴 錯誤 → 提醒 Paul，建議在下一輪 Code session 修
- 如果只有 🟡 和 ⚪ → 記錄在 worklog，不主動打擾
- 更新 Apple Notes 儀表板的 Wiki 區塊（如果有重大變化）

---

## 注意事項

- 這個 skill **只讀不寫**（除了產出 worklog 報告）。修改 wiki 檔案是 Code 的事。
- graph.json 的 node id 必須與 concepts/ 目錄的檔名（去掉 .md）完全一致。
- stats.json 是給前端用的，如果發現不一致，應該更新 stats.json 而非改檔案。
- 第一次執行沒有「上次健檢」可比較，趨勢區塊可以寫「首次健檢，無歷史資料」。
