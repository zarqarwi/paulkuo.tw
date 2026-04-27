# Code Handoff — Phase 4 Step C-prime：建 source 獨立路由 + 被引用 section（2026-04-28）

> 建立：2026-04-28 由 Cowork session 寫，**替代原 Step C handoff**
> 觸發原因：原 Step C 規劃失誤——假設 wiki source 有獨立路由（`/wiki/{slug}/`），實際 `wiki/[slug].astro` getStaticPaths 只 build `[...concepts, ...entities]`，sources 沒獨立 page route。Code 實作 Step B 後觸發護欄抓出此問題
> 拍板：Paul 2026-04-28 選擇「建 source 獨立路由」（符合北極星「碰撞引擎」追溯 UX）
> 來源：原 Step C handoff `worklogs/cowork--wiki-phase4-step-bc-bidirectional-ui-handoff-2026-04-28.md`（Step B 段已完成 commit；Step C 段廢棄改本 handoff）
> 目標 session：Code [WIKI]
> **建議模型**：Claude Sonnet 4.6
> **Effort**：Medium-High（60-90 min；新 page route + render component + 被引用 section + visibility 過濾 + SSOT 修正）
> **前置條件**：Step B 已 commit + push（含 ArticlePage.astro + DerivedFromSection.astro + TODO 連結）

---

## 1. 上下文

Phase 4 = 反向索引 + 衍生自 section（雙向 UI）。

Step A（build script）+ Step B（Article「衍生自」section）已完成。**Step C 原規劃發現假設錯**——Phase 4 規劃時誤以為 wiki source 有獨立路由，實際只有 concept / entity 有路由。Paul 拍板走「**建 source 獨立路由**」方案，與 concept / entity 並列，符合北極星「接住碰撞瞬間：自動連回孕育它的源頭素材」。

### Step C-prime 範疇

1. **新增 `src/pages/wiki/sources/[slug].astro`** route（visibility=public only）
2. **新增 `src/components/SourcePage.astro`** render 元件（建議拆出，未來多語系也能用）
3. **新增 `src/components/ReferencedByArticlesSection.astro`** 元件（被引用 section）
4. **補 `src/components/ArticlePage.astro`** 的 Step B TODO 連結（指向 `/wiki/sources/{slug}/`）
5. **修 SSOT `docs/article-derived-from.md`** source URL 寫法 + derived_from 限制條款
6. **edge case**：derived_from 指向 visibility=internal source 時，UI 顯示 title 但**不連結**（Step E 才加 schema validator 嚴格擋）

### 第三步現況（pre-flight）

- Step A: `scripts/wiki-build-derived-index.py` 已就位
- Step B: `ArticlePage.astro` 已加「衍生自」section + `DerivedFromSection.astro`，TODO 連結待補
- 0 篇 article 真實填了 derived_from（Step F backfill 才填，視覺驗收用假資料）
- Source frontmatter 已驗證有 `title` / `summary` / `key_points` / `chapters` / `quotes` / `pillar` 等欄位
- Source 數量：298（visibility=public 280 / visibility=internal 18，按 Issue #157 corpus 數據）

---

## 2. 護欄（**必讀**）

- **只動以下檔案**：
  1. **新增** `src/pages/wiki/sources/[slug].astro`
  2. **新增** `src/components/SourcePage.astro`
  3. **新增** `src/components/ReferencedByArticlesSection.astro`
  4. **修改** `src/components/ArticlePage.astro` 或 `DerivedFromSection.astro`（補 TODO 連結）
  5. **修改** `docs/article-derived-from.md`（修 source URL 寫法 + 加 derived_from 限制條款）
  6. （視覺驗收）暫時造假資料測 UI，**驗收完必須撤銷**
- **不動**：
  - `src/pages/wiki/[slug].astro`（既有 concept / entity 路由不動）
  - `src/content.config.ts`（schema 不變動，含 `wikiSchema` 已有 visibility 欄位）
  - `scripts/wiki-build-derived-index.py`（Step A 已就位）
  - `package.json` prebuild（Step D 才接）
  - 任何 article frontmatter 真實內容
  - 其他 src/pages/ 既有路由
- **遇到意外狀態先停**：
  - source frontmatter 缺關鍵欄位（title 該有）
  - getStaticPaths build 出來頁數異常（不該 < 200 或 > 350）
  - SSOT 改動 conflict consistency-check refs

---

## 3. 動作清單

### 動作 1：環境前置 + Step B 確認

```bash
cd /Users/apple/Desktop/01_專案進行中/paulkuo.tw
git fetch origin
git pull origin main
git status  # 應該乾淨

# 確認 Step B commit 已在 log
git log --oneline -8
# 期望最近：fda5a7a Step A → <Step B sha> ArticlePage.astro 衍生自 section

# 確認 build script 跑得過
python3 scripts/wiki-build-derived-index.py --strict
ls -la data/wiki-derived-index.json  # 期望存在，內容 {}
```

### 動作 2：摸 source 結構

```bash
# 看 wiki source frontmatter 範例
ls src/content/wiki/sources/ | head -3
# 挑一個 public visibility 的看完整 frontmatter
head -50 src/content/wiki/sources/<sample>.md

# 看 wiki/[slug].astro 既有 source render 風格（即使是 inline-in-concept-page，UI 模式可借鑑）
grep -n -A 3 "type === 'source'\|wiki_sources\|source-card\|source-item" src/pages/wiki/[slug].astro

# 看 wiki/index.astro 看 source 列表 UI 風格
grep -n "wiki_sources\|source-" src/pages/wiki/index.astro | head -20

# 統計 source visibility 分布
ls src/content/wiki/sources/ | wc -l
# 抽幾個確認 visibility 標籤位置
grep -l "visibility: internal" src/content/wiki/sources/ | wc -l
grep -l "visibility: public" src/content/wiki/sources/ | wc -l
```

依現有 wiki page 風格決定 source 頁的視覺基調（卡片、字級、配色）。

### 動作 3：建立 `src/components/SourcePage.astro`

**Props**:
```typescript
interface Props {
  source: CollectionEntry<'wiki_sources'>;
  referencingArticles: ReferencingArticle[];  // 從 derived index 來
}
```

**Render 內容**（依存在性條件 render，不是空的就硬塞）:

1. **Header**:
   - title (h1)
   - meta 行：pillar badge + type badge（"Wiki 素材"）+ created/updated 日期
   - 來源類型 badge（YouTube / 得到App / 文章 等，依 raw_source_type）

2. **Summary section**（如有 `data.summary`）:
   - h2 「摘要」
   - prose paragraph

3. **Key points section**（如有 `data.key_points`）:
   - h2 「重點」
   - bullet list

4. **Chapters section**（如有 `data.chapters`）:
   - h2 「章節」
   - 列表，每筆 `start` + `title` + `summary`

5. **Quotes section**（如有 `data.quotes`）:
   - h2 「金句」
   - blockquote，含 `timestamp`

6. **被引用 section**（用元件 `ReferencedByArticlesSection`）:
   - 傳入 `referencingArticles`

7. **不顯示**：
   - raw transcript / body 全文（內容可能很長）
   - `raw_source_path`、`raw_note_id`（內部 metadata）
   - enrichment metadata（enriched_at / enriched_by）

樣式 Tailwind class 跟 ArticlePage / wiki/[slug].astro 一致即可，不做新設計。

### 動作 4：建立 `src/components/ReferencedByArticlesSection.astro`

**Props**:
```typescript
interface Props {
  articles: ReferencingArticle[];  // [{ article_slug, lang, title, date, pillar }]
}
```

**邏輯**:
- 若 `articles.length === 0` → return null（不 render）
- Render：

```html
<section class="referenced-by-section">
  <h2>被以下 {N} 篇文章引用</h2>
  <ul>
    <li>
      <a href="{article-url}">{title}</a>
      <span class="meta">
        {date}
        <span class="lang-badge">{lang-display}</span>
      </span>
    </li>
    ...
  </ul>
</section>
```

**article-url 拼法**（先用簡單版，Step E 統一精修）:
- `lang === 'zh'` → `/articles/{article_slug}/`
- `lang === 'en'` → `/en/articles/{article_slug}/`
- `lang === 'ja'` → `/ja/articles/{article_slug}/`
- `lang === 'zh-cn'` → `/zh-cn/articles/{article_slug}/`
- 若實際路由不確定 → 加 TODO 註解先用 `/articles/{slug}`，留待 Step E 修正

**lang-display**:
- `zh` → "中"
- `en` → "EN"
- `ja` → "日"
- `zh-cn` → "简"

### 動作 5：建立 `src/pages/wiki/sources/[slug].astro` route

**`getStaticPaths()`**:
```typescript
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const sources = await getCollection('wiki_sources', ({ data }) => data.visibility === 'public');
  return sources.map((source) => ({
    params: { slug: source.id.replace(/\.md$/, '') },
    props: { source },
  }));
}
```

**主邏輯**:
```typescript
import derivedIndex from '../../../../data/wiki-derived-index.json';

const { source } = Astro.props;
const slug = source.id.replace(/\.md$/, '');
const referencingArticles = derivedIndex[slug] ?? [];
```

**fallback for missing JSON**:
```typescript
let derivedIndex: Record<string, ReferencingArticle[]> = {};
try {
  derivedIndex = (await import('../../../../data/wiki-derived-index.json')).default;
} catch {
  derivedIndex = {};
}
```

**Render**:
```astro
<BaseLayout title={source.data.title} description={source.data.summary ?? ''}>
  <SourcePage source={source} referencingArticles={referencingArticles} />
</BaseLayout>
```

**SEO/OG**: 簡單版，title + description 即可，不必動 OG image worker（留 Phase 5）。

### 動作 6：補 Step B TODO 連結

修 `src/components/ArticlePage.astro` 或 `DerivedFromSection.astro` 內：

**現況**（Step B commit）:
```html
<a href="<!-- TODO source URL -->">{source-title}</a>
```

**改成**:
```typescript
const buildSourceUrl = (slug: string, sourceVisibility?: string): string | null => {
  // visibility=internal source 不建頁，不連結
  if (sourceVisibility === 'internal') return null;
  return `/wiki/sources/${slug}/`;
};
```

**UI 邏輯**:
```html
{sourceUrl ? (
  <a href={sourceUrl}>{source-title}</a>
) : (
  <span>{source-title}</span>  <!-- internal source: 顯示 title 不連結 -->
)}
```

**獲取 visibility**:
- `DerivedFromSection.astro` 收 article.data.derived_from（slug list）後 lookup wiki_sources collection
- 從 lookup 結果讀 `data.visibility`
- 傳給 `buildSourceUrl(slug, sourceVisibility)`

### 動作 7：修 SSOT `docs/article-derived-from.md`

**修兩段**:

**(a) source URL 寫法**：原文若有寫 `/wiki/{slug}/` 改成 `/wiki/sources/{slug}/`（搜尋 `/wiki/{` 確認所有出現處）

**(b) 加新段落（在「不做的事」之前，或合適位置）**:

```markdown
## visibility 限制

`derived_from` slug 必須對應 **visibility=public** 的 wiki source：

- `wiki/sources/[slug].astro` route 只 build visibility=public 的 source（getStaticPaths 過濾）
- visibility=internal source 沒有獨立可瀏覽頁，UI 上「衍生自」section 會顯示 title 但**不連結**（避免讀者點擊 404）
- 建議實作上由 author 自律避免指 internal source；Phase 4 Step E 會加 validator 強制檢查

## Phase 4 路由變更

Phase 4 Step C-prime（2026-04-28）新增 `src/pages/wiki/sources/[slug].astro` route，sources 從「附屬於 concept 頁的 embedded 資料」升級為「獨立可瀏覽頁面」，與 concept / entity 並列。

URL pattern：`/wiki/sources/{slug}/`
```

### 動作 8：視覺驗收

```bash
# 1. 跑 build script 一次（保證 JSON 存在）
python3 scripts/wiki-build-derived-index.py --strict

# 2. 找一篇 article + 一個 public source 造假資料
# 挑現有的 article（看 git log 找 Step B 用的那個）
# 挑現有的 public source（grep visibility: public）

# 3. 暫時加 derived_from 假資料
# 改 article frontmatter

# 4. 重跑 build script
python3 scripts/wiki-build-derived-index.py --strict

# 5. 起 dev server
pnpm dev

# 6. 瀏覽器驗證：
#    - http://localhost:4321/articles/<那篇 slug>/  → 看「衍生自」section，現在有連結
#    - 點擊連結 → 跳到 /wiki/sources/<source-slug>/
#    - 看 source 頁顯示完整（summary / key_points / chapters / quotes）
#    - 看「被引用」section，看到該 article
#    - 點 article 連結 → 跳回 article 頁

# 7. 邊 case：
#    - 找一個 visibility=internal source slug，瀏覽 /wiki/sources/<internal-slug>/ → 應該 404
#    - 假資料若指 internal source（手動測），article「衍生自」section 該 source title 應無連結

# 8. 撤銷假資料
git checkout src/content/articles/<那篇>.md
python3 scripts/wiki-build-derived-index.py
```

### 動作 9：驗收

```bash
# 1. pytest 不破
python3 -m pytest tests/ -v
# 期望：171 pass（不變，純前端）

# 2. consistency-check
python3 scripts/wiki-consistency-check.py
# 期望：12 refs verified（SSOT 改了但 refs 應不變；若新增 ref 需更新 EXPECTED_REFS）

# 3. pnpm build 增加 source 頁
pnpm build
# 期望：554 + 280 = 約 834 pages（依實際 visibility=public source 數）
# 0 errors

# 4. 假資料已撤銷
git status
git diff src/content/articles/  # 應為空
```

如有任一項 fail → 停下來回 Cowork。

### 動作 10：commit + push

```bash
git add src/pages/wiki/sources/ \
       src/components/SourcePage.astro \
       src/components/ReferencedByArticlesSection.astro \
       src/components/ArticlePage.astro \
       src/components/DerivedFromSection.astro \
       docs/article-derived-from.md

git status  # 確認 staged 內容只有以上

git commit -m "feat(wiki-source-route): 建 source 獨立路由 + 被引用 section — Phase 4 Step C-prime

替代原 Step C 規劃（假設 source 有獨立路由失誤）。Paul 2026-04-28 拍板選擇
建獨立路由方案，符合北極星「碰撞引擎」追溯 UX。

新增：
- src/pages/wiki/sources/[slug].astro：visibility=public 才 build
- src/components/SourcePage.astro：title / summary / key_points / chapters / quotes
- src/components/ReferencedByArticlesSection.astro：被引用 section（含 fallback）

修改：
- ArticlePage / DerivedFromSection：補 TODO 連結，internal source 顯示 title 不連結
- docs/article-derived-from.md：修 source URL 寫法 + 加 visibility 限制段

不動：
- wiki/[slug].astro（既有 concept/entity 路由）
- content.config.ts schema
- 任何 article 真實 frontmatter

Step D（prebuild 整合）+ Step E（i18n + validator）+ Step F-G 留後續 handoff。

Refs: Issue #157 Phase 4 / docs/article-derived-from.md SSOT"

git push
```

### 動作 11：Issue #157 留 Step C-prime 收尾

```markdown
## Phase 4 Step C-prime — 建 source 獨立路由 + 被引用 section ✅

⚠️ **規劃返工說明**：原 Step C handoff 假設 wiki source 有獨立路由，
Code 實作 Step B 後觸發護欄發現此假設錯。Paul 2026-04-28 拍板走「建獨立路由」方案。

| Phase | Commit | 內容 |
|-------|--------|------|
| Code — feat | `<sha>` | sources/[slug].astro + SourcePage + ReferencedByArticlesSection + Step B TODO 補 + SSOT 修 |

**新路由**：
- `src/pages/wiki/sources/[slug].astro`：visibility=public 才 build
- 預估新增 ~280 個 source page（依實際 public source 數）

**Source 頁內容**：
- Header（title + pillar + type + date）
- Summary / Key points / Chapters / Quotes（依 frontmatter 存在性）
- 被引用 section（讀 data/wiki-derived-index.json）
- 不顯示 raw transcript / 內部 metadata

**Step B TODO 補完**：
- ArticlePage「衍生自」section 連結到 `/wiki/sources/{slug}/`
- visibility=internal source 顯示 title 不連結

**SSOT 更新**：
- `docs/article-derived-from.md` source URL 寫法修正
- 新增 visibility 限制段（derived_from 應指 public source）

**驗收**：
- pytest 171 pass（不變）
- consistency-check 12 refs verified
- pnpm build 554 → ~834 pages 0 errors
- 視覺驗收：article ↔ source 雙向連結通

**待跑**：
- Step D: prebuild 整合（避免 dev 忘記跑 build script）
- Step E: i18n 多語系字串 + derived_from 限 public source 的 schema validator
- Step F: Cowork 提議 backfill → Paul 裁決 → 寫進 frontmatter
- Step G: SSOT + Issue #157 收尾
```

### 動作 12：回 Cowork 報告

5 行內，含：
1. 環境確認 + Step B commit OK
2. 新增檔案清單
3. SSOT 修改範圍
4. 視覺驗收結果（article→source→article 雙向通）
5. commit sha + push + Issue #157 留言連結

---

## 4. Acceptance criteria

| 檢查項 | 期望 |
|--------|------|
| `src/pages/wiki/sources/[slug].astro` 建立 | 1 個新 route |
| `src/components/SourcePage.astro` 建立 | 1 個新元件 |
| `src/components/ReferencedByArticlesSection.astro` 建立 | 1 個新元件 |
| ArticlePage TODO 連結補完 | derived_from public source → 連 `/wiki/sources/{slug}/`；internal → 不連結 |
| SSOT 修正 | source URL 寫法 + visibility 限制段 |
| pytest | 171 pass（不變） |
| consistency-check | 12 refs verified（不變或更新 EXPECTED_REFS） |
| pnpm build | 554 → ~834 pages（依 visibility=public source 數）/ 0 errors |
| 視覺驗收 article→source→article 雙向 | 通 |
| Internal source 直接訪問 | 404 |
| 假資料撤銷 | git status 沒 article frontmatter 變更 |
| commit + push | 1 commit fast-forward |
| Issue #157 留言 | 已留 |

---

## 5. 跨專案影響檢查

| 檔案 | 影響 |
|------|------|
| `src/pages/wiki/sources/[slug].astro` | **新增** route — pnpm build 頁數 +280（依 public source 數） |
| `src/components/SourcePage.astro` | **新增** |
| `src/components/ReferencedByArticlesSection.astro` | **新增** |
| `src/components/ArticlePage.astro` / `DerivedFromSection.astro` | TODO 補完 — 真實 derived_from 上線後生效 |
| `docs/article-derived-from.md` | SSOT 修正 — Phase 4 後續 step 與 validator 都會引用 |
| `data/wiki-derived-index.json` | 不動內容（純讀取） |
| `scripts/wiki-build-derived-index.py` | **不動** |
| `src/content.config.ts` | **不動** |
| `src/pages/wiki/[slug].astro` | **不動**（concept/entity 路由不受影響） |
| KV / Worker | **不動**（Phase 5 才接） |
| article frontmatter | **不動**（視覺驗收用假資料完整撤銷） |

**新增可瀏覽 URL**：`/wiki/sources/{public-source-slug}/`，將來會被搜尋引擎索引。要不要進 sitemap.xml 留 Step E 評估。

---

## 6. 護欄重申

- 不寫 Step D handoff（按 `feedback_handoff_flow_discipline`）
- 不接 prebuild（Step D）
- 不做 i18n 完整翻譯（Step E）
- 不加 schema validator 強制 derived_from 限 public（Step E）
- 不動 wiki/[slug].astro 既有 concept/entity render
- 不擴張 source schema（保持現有）
- 視覺驗收假資料**必須撤銷**

---

## 7. 建議模型 / Effort

| 子任務 | 模型 | 時間 |
|--------|------|------|
| 動作 1 環境前置 | Sonnet 4.6 | 2 min |
| 動作 2 摸 source 結構 | Sonnet 4.6 | 5 min |
| 動作 3 SourcePage.astro | Sonnet 4.6 | 15-20 min |
| 動作 4 ReferencedByArticlesSection | Sonnet 4.6 | 8-10 min |
| 動作 5 sources/[slug].astro route | Sonnet 4.6 | 5-8 min |
| 動作 6 Step B TODO 補連結 | Sonnet 4.6 | 5-8 min |
| 動作 7 SSOT 修正 | Sonnet 4.6 | 5 min |
| 動作 8 視覺驗收 | Sonnet 4.6 | 8-10 min |
| 動作 9 驗收 | Sonnet 4.6 | 3 min |
| 動作 10-12 commit + push + 留言 + 報告 | Sonnet 4.6 | 5 min |

整體 **Sonnet 4.6 / Medium-High effort（60-90 min）**。

---

## 8. 不做的事（明確排除）

- 不接 prebuild（Step D）
- 不做完整 i18n（Step E）
- 不加 schema validator 強制 derived_from 限 public（Step E）
- 不寫 backfill 內容（Step F）
- 不動 KV seed / Worker（Phase 5）
- 不擴張 source schema
- 不動 wiki/[slug].astro 既有 render
- 不寫下個 step 的 handoff（按紀律 Cowork 才寫）
- internal source 不建頁、不連結，但**不從 derived_from 列表 hide**（顯示 title 讓 author 知道 reference 存在）

---

## 9. 依賴 / 來源

- 規劃失誤教訓：`feedback_verify_route_exists_before_phase_planning.md`（Cowork memory，2026-04-28 存）
- 替代的 handoff：`worklogs/cowork--wiki-phase4-step-bc-bidirectional-ui-handoff-2026-04-28.md`（原 Step C 範圍廢棄）
- Phase 4 規劃文件：`cowork--wiki-phase4-derived-reverse-index-plan-2026-04-28.md`（workspace；Step C 段需後續修）
- Step A handoff：`worklogs/cowork--wiki-phase4-step-a-build-derived-index-handoff-2026-04-28.md`
- Phase 3 SSOT：`docs/article-derived-from.md`
- 相關 commits：
  - `709641e` feat(article-schema): add derived_from field
  - `8141947` handoff(code): derived_from acceptance 收尾
  - `af0e921` chore(deps): pin pnpm + sync lockfile
  - `bb795f0` chore(gitignore): exclude dynamic data files
  - `fda5a7a` feat(wiki-derived-index): build script Step A
  - `<Step B sha>` feat(article-derived-ui): 衍生自 section
- 相關記憶：
  - `feedback_verify_route_exists_before_phase_planning`（規劃前驗證）
  - `feedback_handoff_flow_discipline`（停手等回報）
  - `feedback_no_parallel_code_sessions`
  - `feedback_terminal_cd_explicit`
  - `feedback_model_recommendation`
  - `feedback_cross_project_impact`
  - `project_llmwiki_northstar`（碰撞引擎，追溯 UX）

---

*產出：Cowork session 2026-04-28，原 Step C 規劃失誤後 Paul 拍板返工*

*下一手：Code 接此 handoff，60-90 min 完成 Step C-prime；完成後回 Cowork，Cowork 才寫 Step D handoff*
