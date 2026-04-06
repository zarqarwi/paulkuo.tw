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

這個腳本會讀取所有 concepts/ 和 sources/，重新生成 graph.json 和 stats.json 並上傳 KV。

如果腳本不會自動重生 graph.json，需要手動執行 ingest scanner 或相關腳本。

### Step 3: 驗證

```bash
# 確認 concept 數
cat src/content/wiki/stats.json | jq '.by_type.concept'
# 預期：19

# 確認 startup/faith pillar 有 concept
cat src/content/wiki/stats.json | jq '.by_pillar'

# 確認 graph 更新
cat src/content/wiki/graph.json | python3 -c "
import json, sys
g = json.load(sys.stdin)
concepts = [n for n in g['nodes'] if n.get('type')=='concept']
print(f'Concepts: {len(concepts)}')
cross = 0
for e in g['edges']:
    s = next((n for n in g['nodes'] if n['id']==e['source']), None)
    t = next((n for n in g['nodes'] if n['id']==e['target']), None)
    if s and t and s.get('type')=='concept' and t.get('type')=='concept' and s.get('pillar')!=t.get('pillar'):
        cross += 1
print(f'Cross-pillar concept edges: {cross}')
"
# 預期：Concepts: 19, Cross-pillar ≥ 18
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

### Step 5: KV seed（如果 Step 2 沒有自動上傳）

```bash
node scripts/wiki-kv-seed.cjs
```

## 完成回報

回報給 Cowork：
1. concepts 總數
2. cross-pillar edge 總數
3. builder-mindset 和 faith-technology-dialogue 是否出現在 /wiki/ 頁面
4. 部署 URL 截圖或 smoke test 結果
