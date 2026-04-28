# Article ↔ Wiki Source 溯源規則 (SSOT)

> 建立：2026-04-27（Phase 3 — L3 演化層第一步）
> Issue: #157
> 相關 SSOT：`docs/wiki-visibility-rules.md`（Wiki visibility 規則）

## 為什麼

paulkuo.tw Wiki 的北極星是「**碰撞引擎**：讓多源素材在 Paul 腦中撞出心得文，並追溯每篇文章的素材脈絡」。

文章是**輸出層**，wiki source 是**輸入層**。`derived_from` 把這條 article ← source 的線記錄下來，讓未來能反推「這篇文章從哪些素材撞出來」、「某個 source 啟發了哪幾篇文章」。

第三步只做最小一步：article frontmatter 加一個 optional `derived_from` 欄位。反向索引、UI 全留 Phase 4+。

## 設計

### 型別

```typescript
derived_from: z.array(z.string()).optional()
```

純 slug list。**不結構化**（不加 role / weight / note 等子欄位）。理由：

- 跟 wiki schema 的 `links_to` / `linked_from` 一致
- frontmatter 簡潔、人類可讀
- 未來想擴成 `Array<{slug, role}>` 隨時可以平滑升級（先 string[] 後續擴 union 不破舊資料）

### 指向範圍

**只能指 wiki source**（即 `src/content/wiki/sources/*.md` 的 slug）。

不能指 concept / entity 的理由：

- concept 跟 article tags 容易語意重疊（雙標籤系統）
- 「素材→心得」的 mental model 是具體 source，不是抽象概念
- concept 可以透過 source 間接連結（A 文章 → B source → C concept）

`scripts/wiki-derived-from-validate.py` 會嚴格檢查每個 slug 必須對應 `src/content/wiki/sources/{slug}.md` 已存在的檔。

### 必填 / 選填

**全 optional**。舊文章不需 backfill，新寫的文章選擇性填。

理由：

- L3 的真正價值在未來文章
- 強制 backfill 工作量大、邊際效益低
- optional 不破現有 build

## 如何填

### Frontmatter

```yaml
---
title: "從碰撞到心得：我怎麼讀 LLM 內部工具鏈"
pillar: ai
date: 2026-04-30
derived_from:
  - youtube-abc12345678-ai
  - getnote-558096-llm-anchor-points
  - getnote-617272-stakeholder-collab
---
```

slug 必須對應 `src/content/wiki/sources/{slug}.md` 已存在的檔。

### 驗證

```bash
# 全文章驗證
python3 scripts/wiki-derived-from-validate.py

# 單檔驗證
python3 scripts/wiki-derived-from-validate.py src/content/articles/<file>.md

# CI strict 模式（有 missing slug 即 exit 1）
python3 scripts/wiki-derived-from-validate.py --strict
```

### 一次填多篇

如果要批次補（例如把 04-26 wrong_pillar 處理過的 enriched source 補進舊文章），手動編輯各 article frontmatter，再跑 validate script 確認 slug 都對。

## visibility 限制

`derived_from` slug 必須對應 **visibility=public** 的 wiki source：

- `wiki/sources/[slug].astro` route 只 build visibility=public 的 source（getStaticPaths 過濾）
- visibility=internal source 沒有獨立可瀏覽頁，UI 上「衍生自」section 會顯示 title 但**不連結**（避免讀者點擊 404）
- 建議實作上由 author 自律避免指 internal source；Phase 4 Step E 會加 validator 強制檢查

## Phase 4 路由變更

Phase 4 Step C-prime（2026-04-28）新增 `src/pages/wiki/sources/[slug].astro` route，sources 從「附屬於 concept 頁的 embedded 資料」升級為「獨立可瀏覽頁面」，與 concept / entity 並列。

URL pattern：`/wiki/sources/{slug}/`

## Phase 4 落地紀錄（2026-04-28）

Phase 4 把 article ↔ source 的單向關係升級成雙向視圖：

### 反向索引

`scripts/wiki-build-derived-index.py`（Step A）掃所有 article 的 `derived_from`，產出 `data/wiki-derived-index.json`：

```json
{
  "<source_slug>": [
    {
      "article_slug": "...",
      "lang": "zh|en|ja|zh-cn",
      "title": "...",
      "date": "YYYY-MM-DD",
      "pillar": "ai|startup|..."
    }
  ]
}
```

JSON 在 `.gitignore`（prebuild 重生，不 commit），由 `package.json` 的 `prebuild` / `predev` hook 自動跑（Step D）。

### 雙向 UI

- **Article 頁**：`src/components/DerivedFromSection.astro` — 顯示「衍生自 N 篇素材」+ 各 source title 連 `/wiki/sources/{slug}/`（Step B）
- **Source 頁**：`src/components/ReferencedByArticlesSection.astro` — 顯示「被以下 N 篇文章引用」+ article 連結（按 date 倒序）（Step C-prime）
- 多語系 i18n：article 端標題隨 article lang 切換（zh-Hant / en / ja / zh-cn）；source 端保持繁中（wiki 路由本身沒 i18n）（Step E2）

### 嚴格驗證

`scripts/wiki-derived-from-validate.py --strict`（Step E1）擋三類錯：
1. dangling slug（指向不存在的 source）
2. 指向 visibility=internal 的 source（避免 UI 顯示但點擊 404）
3. schema 型別錯誤

### Step F backfill 紀錄

| 批次 | 日期 | Articles | Entries | Unique Sources |
|------|------|----------|---------|----------------|
| Batch 1 | 2026-04-28 | 2 | 6 | 6 |
| Batch 2 | 2026-04-28 | 7 | 19 | 10（含 batch 1 的 6）|
| **累計** | — | **9** | **25** | **10** |

最高密度 source：`getnote-072896-yang-tianrun-non-tech-claw-native` 被 4 篇 article 引用（驗證 N>1 UI 排序）。

剩餘 ~80 篇 article 多數預期低引用密度，Batch 3 保留為 Phase 4.5 initiative，等有新文章或明確高密度 source 再啟動。

## 不做的事（明確排除）

- **不指 concept / entity**：避免雙標籤系統，validation 嚴格只 check `wiki/sources/`
- **不做反向索引**（source → articles）：留 Phase 4，到時候做 KV index 一次處理
- **不強制 backfill 既有文章**：optional + 漸進，手動填的決策權留給 Paul
- **不做 Frontend UI**：Phase 4 才上「衍生自」section
- **不擴張 schema 結構**：維持 string[]，未來真有需求再升級成 union type

## 跟 wiki schema links_to / linked_from 的差異

| 項目 | derived_from | links_to / linked_from |
|---|---|---|
| 方向 | article → source（單向）| concept ↔ concept（雙向）|
| 用途 | 溯源（這篇從哪來）| Graph view（知識網絡）|
| 必填 | optional | default `[]` |
| 應用層 | Phase 4 才上 UI | 已上 wiki graph |

兩個系統獨立。未來如果要做「文章圖譜」可以同樣機制延伸到 article ↔ article。

## Phase 規劃

- [x] **Phase 3**：schema 加欄位 + validation script + SSOT（本文件）
- [x] **Phase 4**：反向索引（source → articles）+ Frontend「衍生自」section（2026-04-28 完成）
- [ ] **Phase 5**：KV index + Worker API endpoint
- [ ] **Phase 6**：碰撞 visualization（article ↔ source ↔ concept 三層 graph）

## 實作對應檔

- Schema：`src/content.config.ts`（articleSchema）
- Validator：`scripts/wiki-derived-from-validate.py`
- Tests：`tests/test_wiki_derived_from_validate.py`
- Consistency check：`scripts/wiki-consistency-check.py`（EXPECTED_REFS 含本文件）

## 關鍵記憶

- Northstar：`project_llmwiki_northstar` — 碰撞引擎 / 素材脈絡
- Visibility SSOT：`docs/wiki-visibility-rules.md`
- 第二步成果：`scripts/wiki_corpus_lib.py`（提供 `load_source` / `iter_source_paths` 給 validator 用）
