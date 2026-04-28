# Cowork → Code Handoff — Phase 4.5 Code Session 2：資訊架構修正（「16 篇引用」標題）

> 建立：2026-04-28（Cowork [WIKI] session）
> 上游：
> - 規劃 SSOT：`worklogs/cowork--wiki-phase4.5-visual-cohesion-plan-2026-04-28.md` §3.4 Code Session 2
> - Session 1 結案：`worklogs/code--wiki-phase4.5-visual-cohesion-session1-done-2026-04-28.md`
> - Session 1 結構驗收：[Issue #157 comment](https://github.com/zarqarwi/paulkuo.tw/issues/157#issuecomment-4336859954)
> 接手 session：下一個 [CODE] paulkuo.tw session
> 目標 branch：`main`
> 對齊 SKILL：session-handoff C 層 v1.0（A 層 v5.7）

---

## §0 TL;DR — 30 秒看懂

Phase 4.5 Session 1（視覺對齊）已 ship 並通過 Paul 體感驗收（commits `c2b65d2` / `cee1e4c`）。

Session 2 處理規劃 §3.4 拖到後面的「**16 篇引用」標題誤導**問題：source 頁顯示「被 16 篇文章引用」，但其實是 4 篇文章 × 平均 4 個語系（繁/EN/日/简）= 16 筆翻譯版本。讀者誤以為被 16 個獨立文章引用，碰撞引擎的訊號失真。

**Cowork 的執行建議（規劃文件外的簡化）**：

規劃文件原寫 A/B 雙版本 deploy 給 Paul 比較。Cowork grep codebase 後判斷**直接做 B 版即可**，理由：
1. B 版（group by article_slug + lang badge）是 A 版（純文案）的 superset 實作 — group 完的 list 長度就是 A 版要的 unique count
2. 不用 feature flag / 不用雙 deploy / 不用 query param toggle，工程量單純
3. Paul 看完 staging 如果覺得 B 版太花 → **退回 A 版只是文案改寫 + 拿掉 inline lang badge**，回退成本極低

**保留逃生口**：handoff §3 Step E 寫了「B 版太花的回退路徑」，Code 不用提前實作 A 版。

---

## §1 已驗證的事實（Cowork grep 完）

### §1.1 反向索引資料源

`/wiki/sources/[slug].astro` line 31-37：

```ts
let derivedIndex: Record<string, ReferencingArticle[]> = {};
try {
  derivedIndex = (await import('../../../../data/wiki-derived-index.json')).default ...;
} catch {
  // graceful fallback
}
const referencingArticles = derivedIndex[slug] ?? [];
```

`data/wiki-derived-index.json` **不在 git repo**，由 `scripts/wiki-build-derived-index.py` build 時產出。
產出規則（從該 script line 99-150）：

```python
# 對每個 article 的 derived_from list 中每個 slug，加一筆 entry：
entry = {
  "article_slug": article_slug,  # 4 個語系共用同 slug
  "lang": lang,                  # zh / en / ja / zh-cn
  "title": title,
  "date": date_str,
  "pillar": pillar,
}
# 同一個 slug 的 list 已 sort by date desc
```

**關鍵**：同一篇文章在 4 個語系 collection 各有一份 .md，每份有 `derived_from`，所以同一個 source 會收到 4 筆 entry（article_slug 相同，lang 不同）。「16 筆」 = 4 unique articles × 4 langs。

### §1.2 ReferencedByArticlesSection.astro 現況

Session 1 後（commit `c2b65d2`）的版本：

```astro
{articles.map(a => (
  <li class="referenced-by-item">
    <a href={buildArticleUrl(a.article_slug, a.lang)}>{a.title}</a>
    <span class="referenced-by-meta">
      {a.date}
      <span class="lang-badge">{langDisplay(a.lang)}</span>
    </span>
  </li>
))}
```

每筆 entry 一個 `<li>` 平鋪。h2 標題：`被以下 {articles.length} 篇文章引用` — 直接拿 `articles.length` 當 N，**就是 bug 來源**。

### §1.3 Token 系統（Session 1 已對齊）

CSS 用 `--brand-navy` / `--bg-section` / `--text-secondary` / `--text-primary`，無 `--color-*` 殘留。Session 2 加 inline lang badge / group hover / active state 等樣式時繼續用同套 token。

### §1.4 i18n 範圍

ReferencedByArticlesSection.astro **目前只有繁體中文標題硬寫**（`被以下 N 篇文章引用` + `aria-label`）。SourcePage 本身只在繁體 collection（`/wiki/sources/`）下 build，沒有跨語系版本。**Session 2 不需要做 i18n**，但要保留 hard-coded 中文不踩 wiki source 跨語系的雷（規劃文件未來可能擴成跨語系）。

---

## §2 改動範圍

### 動的檔案（1 個）

| 檔案 | 改什麼 | 預估 lines |
|---|---|---|
| `src/components/ReferencedByArticlesSection.astro` | group by article_slug + lang badge group + 標題改寫 | ~50 行 |

### 不動的檔案

- `scripts/wiki-build-derived-index.py` — 資料產出邏輯不動，繼續餵平鋪 entries
- `src/pages/wiki/sources/[slug].astro` — 不動，繼續從 `wiki-derived-index.json` 讀
- `src/components/SourcePage.astro` — 不動
- `src/components/DerivedFromSection.astro` — 不動（這是 article 端，不在範圍）
- `data/wiki-derived-index.json` — build 時產出，不動 schema
- `public/styles/global.css` — 不動

---

## §3 工程步驟（5 Step）

### Step A：盤點現況 + 抽樣資料

```bash
cd "/Users/apple/Desktop/01_專案進行中/paulkuo.tw/Paukuo網站"

# 確認 ReferencedByArticlesSection.astro 還是 Session 1 的版本（未被人動過）
grep -nE "articles.length|articles.map|langDisplay" src/components/ReferencedByArticlesSection.astro

# 跑 build script 一次產出最新 wiki-derived-index.json（如果尚未 build）
python3 scripts/wiki-build-derived-index.py

# 抽樣看資料形狀：找一個被多語系引用的 source
python3 -c "
import json
with open('data/wiki-derived-index.json') as f:
    d = json.load(f)
print(f'總 source keys: {len(d)}')
multi = {k: v for k, v in d.items() if len(v) > 1}
print(f'被 >1 entries 引用: {len(multi)}')
# 找出 article_slug 重複（multi-lang）的 case
for k, v in list(multi.items())[:3]:
    slugs = [a.get('article_slug') for a in v]
    n_uniq = len(set(slugs))
    print(f'  {k}: {len(v)} entries / {n_uniq} unique articles')
    for entry in v[:6]:
        print(f'    - [{entry[\"lang\"]}] {entry[\"article_slug\"]}: {entry[\"title\"][:40]}')
"
```

**驗收**：找到至少一個 source key，list 長度 > unique article_slug 數（亦即同一篇文章多語系入列），確認資料形狀符合 §1.1 預期。

如果 §1.1 預期不符（例如 build script 已經自動 dedup），**停下來回報 Cowork** — 整個 Session 2 的前提就崩了。

### Step B：在 ReferencedByArticlesSection.astro 內 group by article_slug

新增 group 邏輯（在 frontmatter 區塊，`langDisplay` function 之後加）：

```ts
// Group by article_slug — 同一篇文章不同語系合併成一個顯示節點
interface ArticleGroup {
  article_slug: string;
  pillar: string;
  // primary lang 用優先順序選：zh → en → ja → zh-cn
  primary: ReferencingArticle;
  // 其他語系版本（按 zh, en, ja, zh-cn 順序排）
  others: ReferencingArticle[];
}

const LANG_PRIORITY = ['zh', 'en', 'ja', 'zh-cn'];

function groupByArticle(articles: ReferencingArticle[]): ArticleGroup[] {
  const groups = new Map<string, ReferencingArticle[]>();
  for (const a of articles) {
    if (!groups.has(a.article_slug)) groups.set(a.article_slug, []);
    groups.get(a.article_slug)!.push(a);
  }
  const result: ArticleGroup[] = [];
  for (const [slug, entries] of groups) {
    // 按 LANG_PRIORITY 排序
    entries.sort((x, y) => {
      const ix = LANG_PRIORITY.indexOf(x.lang);
      const iy = LANG_PRIORITY.indexOf(y.lang);
      return (ix === -1 ? 99 : ix) - (iy === -1 ? 99 : iy);
    });
    result.push({
      article_slug: slug,
      pillar: entries[0].pillar,
      primary: entries[0],
      others: entries.slice(1),
    });
  }
  // 整體再 sort by primary.date desc（保持原 build script 的 sort 行為）
  result.sort((a, b) => (b.primary.date || '').localeCompare(a.primary.date || ''));
  return result;
}

const groups = groupByArticle(articles);
```

註解這段邏輯為什麼這樣寫：「同一篇文章 4 語系算 1 篇，不算 4 篇」+ link 回 handoff。

### Step C：改 template — 標題 + group 顯示 + lang badge

```astro
{groups.length > 0 && (
  <section class="referenced-by-section" aria-label={`被 ${groups.length} 篇文章引用`}>
    <h2 class="referenced-by-title">
      被 {groups.length} 篇文章引用
      {articles.length > groups.length && (
        <span class="referenced-by-translation-count">（含 {articles.length - groups.length} 個翻譯版本）</span>
      )}
    </h2>
    <ul class="referenced-by-list">
      {groups.map(g => (
        <li class="referenced-by-item">
          <a href={buildArticleUrl(g.primary.article_slug, g.primary.lang)} class="referenced-by-link">
            {g.primary.title}
          </a>
          <span class="referenced-by-meta">
            {g.primary.date}
            <span class="lang-badge primary-lang">{langDisplay(g.primary.lang)}</span>
            {g.others.length > 0 && (
              <span class="lang-badge-group" aria-label="其他語系版本">
                {g.others.map(o => (
                  <a href={buildArticleUrl(o.article_slug, o.lang)} class="lang-badge alt-lang"
                     aria-label={`切換到${langDisplay(o.lang)}版`}>
                    {langDisplay(o.lang)}
                  </a>
                ))}
              </span>
            )}
          </span>
        </li>
      ))}
    </ul>
  </section>
)}
```

設計重點：

- **標題**：「被 N 篇文章引用」N 用 group 完的數，**不含翻譯版本計入**。
  - 如果 `articles.length > groups.length`（有翻譯版本）→ 加 inline 副文「（含 M 個翻譯版本）」做為 disclosure
  - 如果剛好 N==M（每篇都單一語系）→ 不顯示副文
- **主行**：用 primary lang（zh 優先）的 title + date + 該 lang 的 badge
- **inline lang badges**：其他語系做成 anchor，點下去切換到該語系版本
- **可訪問性**：`aria-label` 中文化（保持跟原 section 風格一致），key navigation 走原本 anchor 預設行為

### Step D：改 CSS — lang badge group 視覺對齊

新增 / 修改的 selector（接在 `.lang-badge` 既有規則後）：

```css
.referenced-by-translation-count {
  font-size: 0.85rem;
  font-weight: 400;
  color: var(--text-secondary);
  margin-left: 0.4rem;
}

.lang-badge.primary-lang {
  /* primary 用既有 lang-badge 樣式（已存在），不額外加東西 */
}

.lang-badge-group {
  display: inline-flex;
  gap: 0.25rem;
  margin-left: 0.4rem;
}

.lang-badge.alt-lang {
  text-decoration: none;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-secondary);
}

.lang-badge.alt-lang:hover {
  background: var(--brand-navy);
  color: #fff;
  border-color: var(--brand-navy);
}
```

**設計**：
- primary badge 維持原樣（fill 風 — 跟原本一樣）
- alt badges 改 outline 風（border + transparent bg）— 視覺上區分主/次
- hover 變 brand-navy fill 給可點擊提示
- 全部用 §1.3 已對齊的 token，不引入新 token

### Step E：驗收（含 A 版回退路徑）

#### E-1. Build & test

```bash
cd "/Users/apple/Desktop/01_專案進行中/paulkuo.tw/Paukuo網站"
pnpm build
# 預期：835+ pages / 0 errors
pytest
# 預期：180 passed（沒新增 test，跟 Session 1 同數量）
```

#### E-2. 視覺驗收

```bash
# 找一個被多語系引用的 source（從 Step A 抽樣輸出挑一個）
curl -sL https://paulkuo.tw/wiki/sources/<slug>/ | grep -oE "被 [0-9]+ 篇文章引用|含 [0-9]+ 個翻譯版本|alt-lang" | head -10
```

驗收標準：

- ✅ 標題的 N 是 unique article_slug 數（不是 entries 總數）
- ✅ 副文「含 M 個翻譯版本」只在 N < entries 時出現
- ✅ 每筆 group 主行 + inline lang badges 都點得開
- ✅ Build 0 errors / pytest 180 passed
- ✅ ReferencedByArticlesSection.astro 沒有 `var(--color-*` 殘留（Session 1 已清，Step D 新增 selector 維持新 token 系統）

#### E-3. A 版回退路徑（**Paul 看完才執行**）

如果 Paul staging 體感「太花了」：

1. 拿掉 inline lang badges（template 中 `{g.others.length > 0 && ...}` 整段刪）
2. h2 改文案改成：「被 {groups.length} 篇文章引用（含 {articles.length - groups.length} 個翻譯版本）」（永遠顯示翻譯版本，不做 conditional）
3. CSS 中 `.lang-badge-group` / `.lang-badge.alt-lang` / `.referenced-by-translation-count` 全刪

回退成本：~15 行 diff。**但本 session 不預先做**，等 Paul 看完才動。

#### E-4. 跨專案影響檢查

| 影響面 | 檢查 |
|---|---|
| ArticlePage / DerivedFromSection / SourcePage | `git diff` 應為空（不在範圍）|
| `data/wiki-derived-index.json` schema | 不動，build script 沒改 |
| `scripts/wiki-build-derived-index.py` | 不改 |
| `public/styles/global.css` | 不動 |

#### E-5. Commit 規範

```
feat(wiki/phase-4.5): group multilang articles in referenced-by section (Session 2)

Fix N=16 misleading title — was counting (4 articles × 4 langs) entries.

- ReferencedByArticlesSection.astro: groupByArticle() merges entries by article_slug
- Title: "被 N 篇文章引用 (含 M 個翻譯版本)" — N=unique articles, M=translation count
- Primary lang priority: zh → en → ja → zh-cn (from PRIORITY array)
- Inline alt-lang badges (outline style) link to other lang versions
- New CSS: .referenced-by-translation-count / .lang-badge-group / .alt-lang hover

Phase 4.5 visual cohesion B-option (semi-fusion) — Session 2 of 2.
A-version fallback path documented in handoff §3 Step E-3 (text-only) if too busy.

Plan: worklogs/cowork--wiki-phase4.5-visual-cohesion-plan-2026-04-28.md
Handoff: worklogs/code--wiki-phase4.5-visual-cohesion-session2-handoff-2026-04-28.md
```

---

## §4 不在本 session 範圍

- ❌ Session 1 的 token 替換 / 視覺對齊（已完成，commit `c2b65d2`）
- ❌ build script 修改（資料源繼續餵平鋪 entries，group 邏輯放 component 端）
- ❌ ReferencedByArticlesSection 的跨語系 i18n（如果 source 頁未來支援多語系才做）
- ❌ DerivedFromSection 的對應改動（article 端的「衍生自」不需要 group — 它本來就是 source list，沒有翻譯版本問題）
- ❌ KV / Worker API 同步（Phase 5 處理）
- ❌ 移除 lang badge 後的鍵盤導航測試（如果 Paul 拍板回退到 A 版才需要）

---

## §5 模型 / Effort 建議

- **建議模型**：**Sonnet 4.6**
  - groupByArticle() 邏輯偏單純（Map dedupe + sort）
  - template 改動範圍小
  - 不需要 Opus
- **Effort**：**medium**
  - 預估 1–1.5 hr（含 build / 抽樣資料 / staging 視覺確認）
  - 如果 Step A 發現資料形狀跟 §1.1 不符，停下回報，effort 延長
- **Token 用量預估**：低，元件 ~120 行 + frontmatter group function ~30 行

---

## §6 接手 prompt（[CODE] session 開場貼這段）

```
[CODE] paulkuo.tw Phase 4.5 Code Session 2 — 「16 篇引用」標題修正

接續 Phase 4.5 Session 1（commit c2b65d2 視覺對齊 + cee1e4c 結案 handoff），Paul 體感驗收 OK。

本 session 範圍：修正 ReferencedByArticlesSection 標題 N=16 誤導問題，group by article_slug + 加 inline lang badges。

讀以下兩份文件再開工：
1. worklogs/cowork--wiki-phase4.5-visual-cohesion-plan-2026-04-28.md（規劃 §3.4 Code Session 2）
2. worklogs/code--wiki-phase4.5-visual-cohesion-session2-handoff-2026-04-28.md（Cowork 已驗證 codebase 後的詳細執行 handoff）

⚠️ Cowork 已簡化規劃 §3.4 的 A/B 雙 deploy 機制：
本 session 直接做 B 版（group + lang badge）即可，不用 feature flag / 雙 deploy。
A 版（純文案）作為 Paul 看完 staging 太花時的回退路徑（handoff §3 Step E-3）。
如果 Paul 看完拍板太花，再退 ~15 行 diff 改成 A 版。

按 §3 Step A → E 順序執行。Step A 如果發現資料形狀跟 §1.1 不符，停下回報。

Branch：main
模型建議：Sonnet 4.6 / Effort medium

完成後 push main + 回 Cowork 結構驗收 + 邀 Paul 體感拍板 B 版 ship 或 A 版回退。
```

---

## §7 完成後回交 Cowork

1. push commits 到 `main`（建議拆兩個：feat + docs/worklog）
2. 留 [Issue #157](https://github.com/zarqarwi/paulkuo.tw/issues/157) 進度 comment：「Phase 4.5 Session 2 完成 — commit \<sha\>」
3. 寫 `worklogs/code--wiki-phase4.5-visual-cohesion-session2-done-YYYY-MM-DD.md`
4. **不**同時觸發 Phase 4.5 結案，等 Paul 拍板 B 版 ship 或退 A 版

Cowork 接手後做：
- 結構驗收（grep group function 邏輯正確 + token 替換乾淨）
- 邀 Paul 體感（隨便挑一個多語系 source 看標題 + lang badge 行為）
- 視拍板：
  - **B 版 OK** → 結案 Phase 4.5，更新 Issue #157 body（同步 Phase 4 + Phase 4.5 全完成）
  - **A 版回退** → 開短 handoff 給下一個 Code session 跑 §3 E-3 的 ~15 行 diff

---

*產出：Cowork [WIKI] session 2026-04-28*
*規劃對齊：cowork--wiki-phase4.5-visual-cohesion-plan-2026-04-28.md §3.4 Code Session 2*
*下一手：[CODE] session 接手 → 完成後回交 Cowork → Paul 拍板 B/A*
*對齊 SKILL：session-handoff C 層 v1.0（A 層 v5.7）*
