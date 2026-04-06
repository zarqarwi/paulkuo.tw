# Wiki 健檢 (wiki-lint)

當 Paul 提到「wiki 健檢」、「wiki lint」、「知識庫檢查」、「概念品質」、「wiki 品質報告」時觸發此 skill。
也在 wiki ingest 完成後、或 Paul 要求盤點知識庫狀態時觸發。

---

## 執行流程

### Step 1: 讀取 Wiki 資料

透過 GitHub MCP 從 `zarqarwi/paulkuo.tw` repo 讀取：

1. `src/content/wiki/concepts/` — 所有概念 markdown 檔
2. `src/content/wiki/entities/` — 所有 entity markdown 檔
3. `src/content/wiki/graph.json` — 知識圖譜
4. `src/content/wiki/stats.json` — 統計資料

```
owner: zarqarwi
repo: paulkuo.tw
```

### Step 2: 逐項檢查

對每個 concept/entity 執行以下檢查：

| 檢查 | 邏輯 | 嚴重度 |
|------|------|--------|
| 概念無摘要 | body 不包含 `## 摘要` 或摘要區段 < 20 字 | 🔴 高 |
| 來源數低 | `source_count < 3` 的 concept | 🟡 中 |
| 孤立節點 | graph.json 中 degree=0 的 node（concept/entity 類型） | 🔴 高 |
| 重複概念 | title 字元重疊率 > 0.8（用 token Jaccard） | 🟡 中 |
| 斷裂 wikilink | body 中 `[[slug]]` 指向不存在的 concept/entity | 🔴 高 |
| 缺 OG image | 用 GitHub MCP 檢查 `public/og/wiki/{slug}.png` 是否存在 | 🟡 中 |
| 缺核心觀點 | body 不包含 `## 核心觀點` 區段 | 🟡 中 |
| 缺來源引用 | body 不包含 `## 來源引用` 區段 | 🟡 中 |
| frontmatter 不完整 | 缺少 title/type/pillar/visibility 任一欄位 | 🔴 高 |
| tags 為空 | tags 陣列長度為 0 | 🟡 中 |

#### Jaccard Token 相似度計算

```python
def jaccard(a, b):
    tokens_a = set(a.lower().split())
    tokens_b = set(b.lower().split())
    if not tokens_a or not tokens_b:
        return 0
    return len(tokens_a & tokens_b) / len(tokens_a | tokens_b)
```

#### 孤立節點檢查

```python
# 從 graph.json 計算每個 node 的 degree
degree = {}
for edge in graph['edges']:
    degree[edge['source']] = degree.get(edge['source'], 0) + 1
    degree[edge['target']] = degree.get(edge['target'], 0) + 1

# 只檢查 concept 和 entity 類型的 node
for node in graph['nodes']:
    if node['type'] in ('concept', 'entity') and degree.get(node['id'], 0) == 0:
        # 這是孤立節點
```

### Step 3: 產出報告

寫到 `worklogs/wiki-lint-{YYYY-MM-DD}.md`，使用 filesystem MCP 寫到本機。

報告格式：

```markdown
# Wiki 健檢報告 {YYYY-MM-DD}

## 統計
- 概念: {N} | 來源: {N} | Entity: {N}
- 健康: ✅ {N} | 警告: ⚠️ {N} | 錯誤: ❌ {N}
- 總分: {score}/100

## 問題清單

### 🔴 高優先
- [{concept-slug}] 無摘要
- [{concept-slug}] 孤立節點（degree=0）
- [{concept-slug}] 斷裂 wikilink: [[不存在的slug]]
- [{concept-slug}] frontmatter 缺少: pillar

### 🟡 中優先
- [{concept-slug}] source_count=2（低於門檻 3）
- [{concept-slug}] 缺 OG image
- [{concept-slug}] tags 為空

## 各概念詳情

| 概念 | 摘要 | 來源數 | 連結數 | OG | 狀態 |
|------|------|--------|--------|-----|------|
| ai-agent-economy | ✅ | 38 | 8 | ✅ | 健康 |
| agentic-web | ❌ 無摘要 | 2 | 3 | ❌ | 需修復 |

## 建議行動
1. [最重要] ...
2. ...
```

### Step 4: 計算健康分數

```
base = 100
每個 🔴 問題: -5 分
每個 🟡 問題: -2 分
最低 0 分
```

### Step 5: 同步到儀表板

如果分數有變化，更新 Apple Notes 儀表板的 Wiki 區塊：
```
Wiki 健檢: {score}/100 ({date})
```

---

## 注意事項

- 報告要寫到本機 `worklogs/`，不要用 GitHub API commit
- OG image 檢查用 GitHub MCP `get_file_contents` 嘗試讀取，404 = 缺少
- 如果概念數量 < 5，可能是資料讀取有問題，先確認再產出報告
- graph.json 可能很大（~85KB），直接解析 JSON 即可
- wikilink 格式是 `[[slug]]`，不是 `[[title]]`
