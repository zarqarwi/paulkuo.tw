# Code Handoff — Phase 4 Step B+C：雙向 UI（衍生自 + 被引用 section）（2026-04-28）

> 建立：2026-04-28 由 Cowork session 寫，**Step A 已 push 後才起此 handoff**（commit `fda5a7a` + 8 tests，pytest 171 / pnpm build 554 / .gitignore 補上）
> 來源：Phase 4 規劃文件 `cowork--wiki-phase4-derived-reverse-index-plan-2026-04-28.md`（在 workspace，未進 repo）
> 目標 session：Code [WIKI]
> **建議模型**：Claude Sonnet 4.6
> **Effort**：Medium（45-60 min；兩個 .astro 改動 + 樣式 + 視覺驗收）
> **前置條件**：本機 git pull origin main 後 HEAD 含 `fda5a7a`（Step A）

---

## 1. 上下文

Phase 4 = 反向索引 + 衍生自 section（雙向 UI）。

按工程角度依序處理，**Step A** 已完成（build script + 8 tests），**本 handoff 同時做 Step B + Step C**（雙向 UI 一起上，視覺驗收完整才有意義）。Step D（prebuild 整合自動化）留下個 handoff，本 step 用「Code 手動跑一次 build script」過渡。

### Step B + C 範疇

- **Step B**：Article 頁面加「衍生自 X 篇素材」section（讀 article frontmatter.derived_from）
- **Step C**：Source 頁面加「被以下 N 篇文章引用」section（讀 `data/wiki-derived-index.json`）
- 兩個 section 都是「沒資料就 hide」
- 樣式跟現有頁面一致即可，不做特別新設計

### 第三步現況（pre-flight）

- `articleSchema.derived_from`: `z.array(z.string()).optional()` 已就位
- `scripts/wiki-build-derived-index.py` Step A 已就位（CLI / output JSON 都 OK）
- 0 篇 article 填了 derived_from（Step F backfill 才填）→ Code 視覺驗收時要先手動造一筆假資料測試
- `src/components/ArticlePage.astro` 是 article render 主元件（路由殼是 `articles/[...slug].astro`）
- `src/pages/wiki/[slug].astro` 同一個檔處理 concept / entity / source 三種 type，要找 `type === 'source'` 的 render block

---

## 2. 護欄（**必讀**）

- **只動 4 件事**：
  1. `src/components/ArticlePage.astro`（加「衍生自」section）
  2. `src/pages/wiki/[slug].astro`（加「被引用」section，僅在 type === 'source' 時 render）
  3. （可選）建一個獨立元件如 `src/components/DerivedFromSection.astro` / `ReferencedByArticlesSection.astro` 把 section 抽出來——若覺得 inline 兩個檔太雜
  4. （視覺驗收）暫時造 1-2 筆 derived_from 假資料測 UI，**驗收完必須撤銷，不 commit**
- **不動**：
  - `scripts/wiki-build-derived-index.py`（Step A 已就位）
  - `src/content.config.ts`（schema 已就位）
  - `package.json` prebuild（Step D 才接）
  - 任何 article frontmatter 真實內容（Step F 才填）
  - `src/pages/articles/[...slug].astro` 路由殼（不需動，多語系共用 ArticlePage 元件）
  - `data/wiki-derived-index.json` 直接寫死（要走 build script 重生）
- **遇到意外狀態先停**：
  - git status 出現 Paul 進行中工作（worklog / ACP / governance docs）
  - 假資料造好後 ArticlePage 結構讓「衍生自」section 沒地方放（停下來問 Paul，不要硬塞）
  - wiki/[slug].astro source block 找不到（理論上有，找不到時停下來問）

---

## 3. 動作清單

### 動作 1：環境前置 + 手動跑一次 build script

```bash
cd /Users/apple/Desktop/01_專案進行中/paulkuo.tw
git fetch origin
git pull origin main
git status  # 應該乾淨，HEAD 含 fda5a7a

# 確認 Step A 已 push
git log --oneline -5
# 期望最近看到 fda5a7a feat(wiki-derived-index)

# 手動跑一次 build script，生出空 JSON
python3 scripts/wiki-build-derived-index.py --strict
ls -la data/wiki-derived-index.json
cat data/wiki-derived-index.json
# 期望：exit 0，內容 {} 空 object
```

### 動作 2：讀 ArticlePage + wiki/[slug] 摸結構

```bash
# 看 ArticlePage 哪裡 render 文章內容
wc -l src/components/ArticlePage.astro
# 找出 article body / footer / sources section 的相對位置

# 看 wiki/[slug] type === 'source' 的 render block
grep -n "type === 'source'" src/pages/wiki/[slug].astro
grep -n "raw_source" src/pages/wiki/[slug].astro
```

決定「衍生自」section 放哪：建議放 article body 之後、留言區（如有）之前；或者放 footer 區。Code 自己抓一個跟現有結構一致的位置。

「被引用」section 放哪：source 頁面 body 之後（讓使用者讀完 source 內容後看到「這個素材撞出了 X 篇文章」）。

### 動作 3：實作 Step B —「衍生自」section（ArticlePage.astro）

**邏輯**：
- 讀 `article.data.derived_from`（型別 `string[] | undefined`）
- 若 undefined / 空陣列 → return null（不 render section）
- 用 `getCollection('wiki_sources')` 找對應 slug 的 source（`source.id.replace(/\.md$/, '')` === slug）
- 對每個 source 取 `data.title` + `data.summary`（前 80 字截斷加 …）+ slug
- Render：

```html
<section class="derived-from-section">
  <h3>衍生自 {N} 篇素材</h3>
  <ul>
    <li>
      <a href="/wiki/{source-slug}/">{source-title}</a>
      <p class="summary">{summary-truncated}</p>
    </li>
    ...
  </ul>
</section>
```

**邊 case**：
- derived_from slug 對應的 source 不存在 → console.warn + skip 該筆（不該發生，Step A strict validator 會擋；但防禦性處理）
- 若 source visibility=internal → 仍顯示 title + link（路由本身的訪問控制由其他層管）

**i18n（多語系）**：
- ArticlePage 已透過 `lang` prop 傳遞語系
- section 標題硬寫繁中「衍生自 N 篇素材」即可（Step E/F 才補多語系字串，避免本 step 範圍擴大）
- 但**標記 TODO 註解**：`// TODO i18n: derived_from section title for en/ja/zh-cn`

### 動作 4：實作 Step C —「被引用」section（wiki/[slug].astro）

**邏輯**：
- 在檔案頂部 `import derivedIndex from '../../../data/wiki-derived-index.json';`（路徑相對 wiki/[slug].astro 位置；Astro 支援 import json）
- 在 source render block（type === 'source'）加：
  ```typescript
  const referencingArticles = derivedIndex[Astro.params.slug] ?? [];
  ```
- 若 `referencingArticles.length === 0` → return null（不 render section）
- 對每筆 article 取 `article_slug` / `lang` / `title` / `date` / `pillar`
- Render：

```html
<section class="referenced-by-section">
  <h3>被以下 {N} 篇文章引用</h3>
  <ul>
    <li>
      <a href="{article-url}">{article-title}</a>
      <span class="meta">{date} · <span class="lang-badge">{lang}</span></span>
    </li>
    ...
  </ul>
</section>
```

**article-url 拼法**：
- `lang === 'zh'` → `/articles/{article-slug}/`
- `lang === 'en'` → `/en/articles/{article-slug}/` 或 ArticlePage 對應 en 路由（Code 看 src/pages/en/ 找實際路由）
- 同理 `ja` → `/ja/...`、`zh-cn` → `/zh-cn/...`
- 若實際路由結構不確定，Code 可先全部用 `/articles/{slug}` 加 TODO 註解，Step E 驗收時統一修正

**fallback（必要）**：
- 若 `data/wiki-derived-index.json` 不存在（dev 環境忘了跑 build script）→ Astro import 會 fail
- 兩種解法擇一：
  - A. import 用 try/catch（Astro frontmatter 不太好做）
  - B. **建議**：在 wiki/[slug].astro 頂部用 dynamic import 加 fallback：
    ```typescript
    let derivedIndex = {};
    try {
      derivedIndex = (await import('../../../data/wiki-derived-index.json')).default;
    } catch {
      derivedIndex = {};
    }
    ```

### 動作 5：UI 樣式

樣式需求**最小化**：
- 跟現有 ArticlePage / wiki page 同樣的字級、卡片/列表風格
- 不做動畫、icon、特殊配色
- Tailwind class 跟現有頁面一致即可
- lang badge 用簡單 `<span>` + 灰底圓角即可

不要花時間調 UI 細節——Step E 驗收時 Paul 看到視覺再迭代。

### 動作 6：視覺驗收（手動造假資料）

```bash
# 找一篇現有 article，手動加 derived_from 假資料
# 挑一個 wiki source 的 slug 放進去
ls src/content/wiki/sources/ | head -5
# 假設 source slug 是 "ai-collaboration-pivot-source"

# 找一篇 article
ls src/content/articles/*.md | head -3
# 假設 "test-article.md"

# 編輯 frontmatter 暫時加：
# derived_from:
#   - <source-slug>
```

**重要**：這份假資料**只是視覺驗收用，不 commit**。視覺驗收完後 `git checkout` 撤銷。

```bash
# 重跑 build script 把假資料生進 JSON
python3 scripts/wiki-build-derived-index.py --strict
cat data/wiki-derived-index.json  # 應該有一筆

# 跑 dev 起 server
pnpm dev

# 瀏覽器看：
# - http://localhost:4321/articles/<那篇 article slug>/  → 看「衍生自」section
# - http://localhost:4321/wiki/<那個 source slug>/  → 看「被引用」section

# 視覺確認 OK 後撤銷假資料
git checkout src/content/articles/<那篇>.md
python3 scripts/wiki-build-derived-index.py  # 重生 JSON 回到空
```

### 動作 7：驗收

```bash
# 1. pytest 不破
python3 -m pytest tests/ -v
# 期望：171 pass（不變，本 step 不動 Python）

# 2. consistency-check 不破
python3 scripts/wiki-consistency-check.py
# 期望：12 refs verified

# 3. pnpm build 不破
pnpm build
# 期望：554 pages 0 errors，UI 改動讓 dist 內容變但頁數不變

# 4. 確認假資料已撤銷
git status
# 期望：staged 只有 ArticlePage.astro + wiki/[slug].astro（+ 可能 1-2 個新元件）
git diff src/content/articles/  # 應該為空
```

### 動作 8：commit + push

```bash
git add src/components/ArticlePage.astro src/pages/wiki/[slug].astro
# 若有新元件
git add src/components/DerivedFromSection.astro src/components/ReferencedByArticlesSection.astro 2>/dev/null || true

git status  # 確認沒有 article frontmatter / data/*.json / 假資料

git commit -m "feat(wiki-derived-ui): 衍生自 + 被引用 section — Phase 4 Step B+C

Phase 4 雙向 UI：

- src/components/ArticlePage.astro：
  - 加「衍生自 N 篇素材」section（讀 article.data.derived_from）
  - 對應 wiki source 取 title + summary 截斷顯示
  - 沒填 derived_from 時 hide section

- src/pages/wiki/[slug].astro（type === 'source' block）：
  - 加「被以下 N 篇文章引用」section（讀 data/wiki-derived-index.json）
  - 列表 sort by date 倒序，含 lang badge
  - 沒被引用 / JSON 不存在時 hide section（含 fallback）

樣式跟現有頁面一致，未做新設計。
i18n 標題暫硬寫繁中（TODO 註解）等 Step E/F 補。

Step D（prebuild 整合自動化）留下個 handoff，
本 step 用 Code 手動跑 build script 過渡。

Refs: Issue #157 Phase 4 / docs/article-derived-from.md SSOT"

git push
```

### 動作 9：Issue #157 留 Step B+C 收尾

```markdown
## Phase 4 Step B+C — 雙向 UI（衍生自 + 被引用 section）✅

| Phase | Commit | 內容 |
|-------|--------|------|
| Code — feat | `<sha>` | ArticlePage.astro + wiki/[slug].astro 雙向 section |

**Step B 設計**：
- Article 頁加「衍生自 N 篇素材」section
- 讀 `article.data.derived_from` → 對應 wiki source 取 title + summary
- 沒填 → hide
- 多語系標題 TODO（Step E/F 補）

**Step C 設計**：
- Source 頁加「被以下 N 篇文章引用」section
- 讀 `data/wiki-derived-index.json[slug]`
- 列表 sort by date 倒序，含 lang badge
- 無引用 / JSON 不存在 → hide（fallback）

**驗收**：
- pytest 171 pass（不變）
- consistency-check 12 refs
- pnpm build 554 pages 0 errors
- 視覺驗收（手動造假資料 → 確認 UI → 撤銷）OK

**待跑**：
- Step D: prebuild 整合（自動化 build script，避免 dev 忘記跑）
- Step E: 整體驗收 + i18n 多語系字串
- Step F: Cowork 提議 backfill → Paul 裁決 → 寫進 frontmatter
- Step G: SSOT + Issue #157 收尾
```

### 動作 10：回 Cowork 報告

5 行內執行摘要，含：
1. 環境確認 + Step A commit OK
2. Step B 改動範圍（檔案 + 行數）
3. Step C 改動範圍（檔案 + fallback 機制）
4. 視覺驗收結果（造假資料看到、撤銷確認）
5. commit sha + push + Issue #157 留言連結

---

## 4. Acceptance criteria

| 檢查項 | 期望 |
|--------|------|
| `src/components/ArticlePage.astro` 加「衍生自」section | derived_from 有資料 → render；無 → hide |
| `src/pages/wiki/[slug].astro` source block 加「被引用」section | JSON 有資料 → render；無 → hide；JSON 不存在 → fallback hide |
| 假資料視覺驗收 OK | 兩端 section 都看到 |
| 假資料撤銷 | `git status` 沒 article frontmatter 變更 |
| pytest | 171 pass（不變） |
| consistency-check | 12 refs（不變） |
| pnpm build | 554 pages 0 errors |
| commit + push | 1 commit fast-forward |
| Issue #157 留言 | 已留 |

---

## 5. 跨專案影響檢查

| 檔案 | 影響 |
|------|------|
| `src/components/ArticlePage.astro` | 加 section — 全語系 article 頁都受影響（同元件） |
| `src/pages/wiki/[slug].astro` | source render block 加 section — concept / entity 不受影響 |
| `src/components/DerivedFromSection.astro`（如建立） | 新增 |
| `src/components/ReferencedByArticlesSection.astro`（如建立） | 新增 |
| `data/wiki-derived-index.json` | **不動內容**，僅 import；Step C 依賴此檔存在（含 fallback） |
| `scripts/wiki-build-derived-index.py` | **不動**（Step A 已就位） |
| `src/content.config.ts` | **不動** |
| article frontmatter | **不動**（視覺驗收用假資料完整撤銷） |
| `package.json` prebuild | **不動**（Step D 才接） |

---

## 6. 護欄重申

- 不寫 Step D handoff（按 `feedback_handoff_flow_discipline`）
- 不寫 Step E-G（整體驗收 / backfill / 收尾）
- 不接 prebuild（Step D 範圍）
- 不擴 schema / 不改 build script
- 不做完整 i18n（標題硬寫繁中 + TODO 註解，Step E/F 才補）
- 視覺驗收用假資料**必須撤銷**，commit 前 git status 不可有 article frontmatter 變更

---

## 7. 建議模型 / Effort

| 子任務 | 模型 | 時間 |
|--------|------|------|
| 動作 1 環境前置 + build script | Sonnet 4.6 | 2 min |
| 動作 2 摸結構 | Sonnet 4.6 | 5 min |
| 動作 3 Step B 衍生自 section | Sonnet 4.6 | 12-15 min |
| 動作 4 Step C 被引用 section + fallback | Sonnet 4.6 | 12-15 min |
| 動作 5 樣式（最小化） | Sonnet 4.6 | 5 min |
| 動作 6 視覺驗收 + 假資料撤銷 | Sonnet 4.6 | 5-8 min |
| 動作 7 驗收 | Sonnet 4.6 | 3 min |
| 動作 8-10 commit + push + 留言 + 報告 | Sonnet 4.6 | 5 min |

整體 **Sonnet 4.6 / Medium effort（45-60 min）**。

---

## 8. 不做的事（明確排除）

- 不接 prebuild（Step D）
- 不做完整 i18n 翻譯（Step E/F）
- 不寫 backfill 內容到 article frontmatter（Step F；視覺驗收用的假資料必須撤銷）
- 不動 KV seed / Worker（Phase 5）
- 不擴張 derived_from schema
- 不改 ArticlePage 既有結構（純加新 section）
- 不改 wiki/[slug] 既有 concept / entity render（純加 source block 內的 section）
- 不寫下個 step 的 handoff（按紀律 Cowork 才寫）

---

## 9. 依賴 / 來源

- Phase 4 規劃文件：`cowork--wiki-phase4-derived-reverse-index-plan-2026-04-28.md`（workspace）
- Step A handoff：`worklogs/cowork--wiki-phase4-step-a-build-derived-index-handoff-2026-04-28.md`
- Phase 3 SSOT：`docs/article-derived-from.md`
- 相關 commits：
  - `709641e` feat(article-schema): add derived_from field
  - `8141947` handoff(code): derived_from acceptance 收尾
  - `af0e921` chore(deps): pin pnpm + sync lockfile
  - `bb795f0` chore(gitignore): exclude dynamic data files
  - `fda5a7a` feat(wiki-derived-index): build script Step A
- 相關記憶：
  - `feedback_handoff_flow_discipline`（停手等回報）
  - `feedback_no_parallel_code_sessions`（一 repo 一次一個 Code session）
  - `feedback_terminal_cd_explicit`（指令絕對路徑）
  - `feedback_model_recommendation`（handoff 附建議模型）
  - `feedback_cross_project_impact`（跨檔影響檢查）

---

*產出：Cowork session 2026-04-28，Step A 完成後接 Phase 4 Step B+C 雙向 UI 落地*

*下一手：Code 接此 handoff，45-60 min 完成 B+C；完成後回 Cowork，Cowork 才寫 Step D handoff*
