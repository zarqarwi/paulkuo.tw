# Wiki Batch 2B 收尾 — Handoff to Code

> **建議模型：Sonnet 4.6 + Medium** | **Task Size: M**（~45 min）

---

## 1. 背景

Cowork 已完成 Batch 2B ingest：12 篇快刀青衣_專欄 public source 寫入 `src/content/wiki/sources/`。全部 pillar: ai。需要 Code 做 git commit + push、更新 5 個 concept 的 linked_from、重跑 stats/graph、KV seed。

## 2. Step 0 偵察

```bash
# 確認 12 篇新檔案都在
ls src/content/wiki/sources/getnote-{764480,896696,439768,140832,867472,324832,285888,625104,795792,395392,966824,915136}-*.md | wc -l
# 預期：12

# 確認 frontmatter 完整性
grep -l "^type: source" src/content/wiki/sources/getnote-{764480,896696,439768,140832,867472,324832,285888,625104,795792,395392,966824,915136}-*.md | wc -l
# 預期：12

# 目前 corpus 總數
find src/content/wiki -name "*.md" | wc -l
```

## 3. 具體步驟

### Step 1：Git commit + push（新 source 檔案）

```bash
git add src/content/wiki/sources/getnote-764480-ai-advisor-new-materials.md
git add src/content/wiki/sources/getnote-896696-saas-collapse-anthropic-trends.md
git add src/content/wiki/sources/getnote-439768-talk-cheap-code-cheap.md
git add src/content/wiki/sources/getnote-140832-turing-to-einstein-test.md
git add src/content/wiki/sources/getnote-867472-carrier-toilet-pope-ai-friction.md
git add src/content/wiki/sources/getnote-324832-ai-autonomous-attack-mckinsey.md
git add src/content/wiki/sources/getnote-285888-lobster-disrupts-university.md
git add src/content/wiki/sources/getnote-625104-hormuz-insurance-risk.md
git add src/content/wiki/sources/getnote-795792-jensen-huang-token-economics.md
git add src/content/wiki/sources/getnote-395392-tariff-war-trump-scorecard.md
git add src/content/wiki/sources/getnote-966824-learning-as-meta-ability.md
git add src/content/wiki/sources/getnote-915136-learn-meditation.md

git commit -m "wiki: batch 2B ingest — 12 快刀青衣專欄 sources"
git push
```

### Step 2：更新 5 個 concept 的 linked_from

以下 concept 頁面需要在 `linked_from` array 新增對應 source：

| Concept | 新增 linked_from |
|---------|-----------------|
| `human-judgment-in-ai-era` | getnote-764480-ai-advisor-new-materials, getnote-140832-turing-to-einstein-test, getnote-867472-carrier-toilet-pope-ai-friction |
| `one-person-team` | getnote-896696-saas-collapse-anthropic-trends, getnote-439768-talk-cheap-code-cheap, getnote-285888-lobster-disrupts-university, getnote-795792-jensen-huang-token-economics |
| `tacit-knowledge` | getnote-867472-carrier-toilet-pope-ai-friction, getnote-966824-learning-as-meta-ability |
| `content-moat` | getnote-896696-saas-collapse-anthropic-trends |
| `harness-engineering` | getnote-439768-talk-cheap-code-cheap |

也更新這些 concept 的 `source_count` 和 `confidence`（如因新增來源而需升級）。

### Step 3：Stats/Graph 重建 + KV seed

```bash
# 重跑 stats 和 graph
node scripts/wiki-kv-seed.cjs
```

預期：corpus 總數 ~262（以實際 `find` 結果為準）。

## 4. 上游假設

- Cowork 已用 filesystem MCP 將 12 個 .md 檔寫入 Paul 本機的 `src/content/wiki/sources/`
- 所有檔案已轉繁體中文、frontmatter schema 完整（type/title/source_type/pillar/visibility/confidence/raw_note_id/tags/links_to/linked_from）
- Issue #157 已更新（Batch 2B 區段 + corpus 預估）

## 5. 驗證方式

- **Step 1 驗證**：`git log --oneline -1` 顯示 batch 2B commit + `git status` clean
- **Step 2 驗證**：`grep -c "linked_from" src/content/wiki/concepts/human-judgment-in-ai-era.md` 確認 linked_from 有新增項目
- **Step 3 驗證**：KV seed 腳本輸出顯示 stats key 已更新，graph nodes 數量增加

## 6. 注意事項

- 12 篇 source 中，3 篇（625104 霍爾木茲、395392 關稅戰、915136 冥想）沒有 links_to，不需要更新任何 concept
- `circular-economy-practice` concept 已存在（14 source, high confidence），本批不需動它
- sdt-agency concept 不建立（Paul 決定擱置）
- 部分 source 的 links_to 指向的 concept 如果不存在（如某些 edge case），graph 會自動忽略，不影響 build

## 7. 信心等級

**高** — 12 篇檔案全部用 filesystem MCP 寫入確認成功，frontmatter 格式與先前 Batch 2A 一致。

## 8. Integration Checklist

- [ ] Astro build 不會因為新增 12 個 source 而失敗（schema 一致）
- [ ] Graph view 新增 12 個 nodes + 對應 edges（links_to 指向的 concept）
- [ ] `/api/wiki/search` 不直接索引 source，但透過 concept 的 linked_from 可間接連結
- [ ] KV seed 更新後 stats dashboard 數字正確
- [ ] 無新 API endpoint，無防護繼承需求
