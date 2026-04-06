# Code Handoff: Wiki Cross-Pillar 補強 — graph/stats 重生 + deploy

> 來源：Cowork session 2026-04-07
> 模型建議：**Sonnet 4.6** · Effort: **Medium**
> 關聯 Issue：待建立（或直接執行）

---

## 背景

Cowork 完成 Phase 4 Cross-Pillar 補強，新增 2 個 concept 頁 + 修 1 個孤島：

| 動作 | 檔案 | 說明 |
|------|------|------|
| 新增 | `src/content/wiki/concepts/builder-mindset.md` | startup pillar 第一個 concept |
| 新增 | `src/content/wiki/concepts/faith-technology-dialogue.md` | faith pillar 第一個 concept |
| 修改 | `src/content/wiki/concepts/ai-education.md` | 加 links_to 解除孤島 |

## 預期結果

修改前（17 concepts）→ 修改後（19 concepts）：
- startup: 0 → 1
- faith: 0 → 1
- cross-pillar edges: 11 → 至少 18（新增 builder-mindset→4 + faith-technology-dialogue→3 + ai-education→4）
- ai-education 不再是孤島

## 執行步驟

### Step 1: 確認新檔案在 repo

```bash
ls -la src/content/wiki/concepts/builder-mindset.md
ls -la src/content/wiki/concepts/faith-technology-dialogue.md
head -5 src/content/wiki/concepts/ai-education.md  # 確認有 links_to
```

### Step 2: 重生 graph.json + stats.json

```bash
node scripts/wiki-kv-seed.cjs
```

### Step 3: 驗證

```bash
cat src/content/wiki/stats.json | jq '.by_type.concept'
# 預期：19
```

### Step 4: git commit + deploy

```bash
git add src/content/wiki/concepts/builder-mindset.md \
       src/content/wiki/concepts/faith-technology-dialogue.md \
       src/content/wiki/concepts/ai-education.md \
       src/content/wiki/graph.json \
       src/content/wiki/stats.json
git commit -m "wiki: add startup/faith concepts + fix ai-education isolation (Phase 4 Cross-Pillar)"
git push origin main
```

## 完成回報

回報給 Cowork：
1. concepts 總數
2. cross-pillar edge 總數
3. builder-mindset 和 faith-technology-dialogue 是否出現在 /wiki/ 頁面
