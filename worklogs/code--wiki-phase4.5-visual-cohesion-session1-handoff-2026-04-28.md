# Cowork → Code Handoff — Phase 4.5 Code Session 1：基礎視覺對齊

> 建立：2026-04-28（Cowork [WIKI] session）
> 上游規劃：`worklogs/cowork--wiki-phase4.5-visual-cohesion-plan-2026-04-28.md`
> 接手 session：下一個 [CODE] paulkuo.tw session
> 目標 branch：`main`
> 對齊 SKILL：session-handoff C 層 v1.0（A 層 v5.7）

---

## §0 TL;DR — 30 秒看懂這份 handoff

Phase 4.5 「半融合」方向已拍板（B 選項）。本 session 要做：**把 wiki source 頁的視覺對齊 article 頁的設計語言**，讓使用者跨越「衍生自 ↔ 被引用」連結時不產生視覺斷層。

**關鍵動作不是「新增 design token」，而是「把 source 端錯用的 token 名稱改回既有 ArticlePage 在用的系統」。**

Cowork 在開工前 grep 過真實 codebase，發現規劃文件 §3.1 / §3.2 有 3 個假設跟現況不符（見 §1 踩坑預警），handoff 已修正 Step 描述。**請優先讀 §1 再看 Step**。

範圍：3 個元件 + 1 個全域 CSS。**不動**「16 篇引用」標題（Session 2 處理）、**不動** ArticlePage（作為 reference）、**不動** cover image 邏輯（Session 1 後再評估）。

---

## §1 踩坑預警（Cowork 已驗證，Code 必讀）

開工前 Cowork 已 grep 真實 codebase 對齊規劃文件假設，**3 個假設跟現況不符，handoff 內 Step 已修正，但要先理解 why**：

### ⚠️ 踩坑 1：global.css 在 `public/styles/`，不是 `src/styles/`

規劃文件 §3.1 / Step A/B 都寫「`src/styles/global.css`」，但實際上：

```
✗ src/styles/global.css        — 不存在
✓ public/styles/global.css     — 1848 行真正的全域 stylesheet
✓ src/styles/guide-template.css — 另一份小 css（不在本次範圍）
```

`public/` 是 Astro 直接 serve 的靜態資源，被頁面用 `<link rel="stylesheet" href="/styles/global.css">` 引用（grep BaseLayout / SiteHead 確認）。**Step A 的 grep 路徑必須是 `public/styles/global.css`**。

### ⚠️ 踩坑 2：SourcePage 等 source-side 元件一直在用「fallback hex」，沒接到全域 token

這是本次最大發現。看 SourcePage.astro 的 style：

```css
color: var(--color-text, #1a1a1a);
color: var(--color-text-muted, #6b7280);
background: var(--color-surface-subtle, #f8f8f8);
border: 1px solid var(--color-border, #e5e7eb);
```

但 `public/styles/global.css` 的 `:root` **根本沒有 `--color-text` / `--color-text-muted` / `--color-accent` / `--color-surface` / `--color-border` / `--color-surface-subtle` 這幾個 token**。生產上這些變數都 fallback 到 hex 字面值，等於沒接到設計系統。

實際全域 token 命名（從 global.css `:root` 抓出來）：

| Source 端誤用 | 全域實際存在的 token |
|---|---|
| `--color-text` | `--text-primary` |
| `--color-text-muted` | `--text-secondary` |
| `--color-accent` | `--accent-ai` ~ `--accent-life`（依 pillar）/ 或 `--brand-navy` |
| `--color-surface` | `--bg-section` |
| `--color-border` | `--border` |
| `--color-surface-subtle` | `--bg-section`（同一個變數） |

**所以「對齊 design token」的本質不是「新增 token」，而是「把 source-side 的 `--color-*` 字串替換成 article-side 已在用的 `--text-primary` / `--text-secondary` / `--border` / `--bg-section` 系統」。**

`var(--color-text, #1a1a1a)` 跟 `var(--text-primary)` 視覺上看起來幾乎一樣（hex 都接近 `#1A1A1A`），但**前者沒有暗色模式 / 跨主題支援**，後者連到全站設計系統。

### ⚠️ 踩坑 3：Pillar 色彩系統已是 CSS variable，不要重新發明

規劃文件 §3.2 Token 類別 3 寫「SourcePage 也用 `var(--accent-{pillar})` 系統（從 PILLAR_MAP 取色）」，這個方向正確，**但實作不用拼字串**：

```ts
// src/config.ts 已經是這樣定義
PILLAR_MAP = {
  ai:       { color: 'var(--accent-ai)', ... },
  circular: { color: 'var(--accent-circular)', ... },
  faith:    { color: 'var(--accent-faith)', ... },
  startup:  { color: 'var(--accent-startup)', ... },
  life:     { color: 'var(--accent-life)', ... },
}
```

也就是 `p.color` 已經回傳 `var(--accent-xxx)` 字串，**直接複用 ArticlePage 的 inline style 寫法**：

```astro
<span class="pillar-dot" style={`background:${p.color}`}></span>
<span style={`color:${p.color}`}>{pillarLabel}</span>
```

`.pillar-dot` 在 global.css 已是現成 class（line 281）。SourcePage 不用自己重新定義 dot，直接掛 class 就行。

### ⚠️ 踩坑 4：Typography size token 不存在，只有 font-family token

規劃文件 §3.2 Token 類別 2 提議定義 `--font-size-page-title` / `--font-size-section-title` / `--font-size-body` / `--font-size-meta`。

但全域只有 **font-family 系統 token**：

```
--font-display: 'Playfair Display', Georgia, serif;
--font-body: 'DM Sans', 'Noto Sans TC', sans-serif;
--font-cjk: 'Noto Sans TC', sans-serif;
```

font-size 全部在 global.css 內 hardcoded（rem / px）。

**決策**：本 session **不新增 size token**。理由：
1. 不在規劃文件「半融合」紅線內（半融合 = 站感統一，不是 typography 系統重構）
2. 加 size token 牽動全站 50+ 處 selector，遠超 medium effort
3. 對齊 article h1 視覺強度，**直接在 SourcePage 改 `font-family: var(--font-display); font-size: 2.4rem;`** 就達到目標

如果未來想做完整 typography token 化，另開 issue。

### ⚠️ 踩坑 5：ArticlePage.astro 沒有 scoped `<style>`，全走 global.css

ArticlePage.astro **沒有自己的 `<style>` 區塊**，所有樣式（`.article-page` / `.article-meta` / `.article-cover` / `.article-pillar` / `.pillar-dot`）都在 `public/styles/global.css` 裡（lines 281, 617-680）。

SourcePage.astro 用的是 Astro scoped `<style>`（lines 122-276）。

**對齊策略**：保留 SourcePage 的 scoped style（不大改架構），但**把 token 名統一替換成 global.css 用的 `--text-primary` / `--text-secondary` / `--border` / `--bg-section` / `--accent-{pillar}`**。這樣風險最低、視覺對齊。

不需要把 SourcePage 樣式搬進 global.css。

### ⚠️ 踩坑 6：max-width 不用 `--max-width` 變數對齊

`global.css` 有 `--max-width: 1200px`（給 hero / section-container 用），但 ArticlePage 是 hardcoded `.article-page { max-width: 840px }`（line 617）—— 因為 article 本身要窄一點利於閱讀。

**SourcePage 對齊 ArticlePage 的 container width = 把 720px 改成 840px**，**不是用 `var(--max-width)`**。

---

## §2 改動範圍

### 動的檔案（4 個）

| 檔案 | 改什麼 | 預估 lines |
|---|---|---|
| `src/components/SourcePage.astro` | container 840px / source-title 對齊 article-meta h1 / pillar-badge 改用 PILLAR_MAP color + pillar-dot / 全 token 替換 | ~50 行 |
| `src/components/DerivedFromSection.astro` | 全 token 替換（`--color-*` → `--text-primary` 系統）| ~10 行 |
| `src/components/ReferencedByArticlesSection.astro` | 全 token 替換 + langDisplay() 「中」→「繁」 | ~12 行 |
| `public/styles/global.css` | **可能不用動**。如果 SourcePage 引入 `.pillar-dot` global class 衝突再評估 | 0-5 行 |

### 不動的檔案

- `src/components/ArticlePage.astro` — 視覺基準，**不改**
- `src/layouts/BaseLayout.astro` — 不改
- `src/config.ts` — PILLAR_MAP 已正確，**不改**
- `src/pages/wiki/sources/[slug].astro` — wrapper，SourcePage props 介面不變就**不改**

---

## §3 工程步驟（6 Step）

### Step A：盤點 global.css 真實 token

**目的**：確認 Cowork 提供的 token 對照表（§1 踩坑 2）跟實際情況一致，避免後續 step 改錯名。

**指令**：

```bash
cd "/Users/apple/Desktop/01_專案進行中/paulkuo.tw/Paukuo網站"

# 抓 :root 區塊全部 token
sed -n '/^:root {/,/^}/p' public/styles/global.css | head -40

# 確認本 session 會用到的 token 都存在
grep -nE "^\s*--(text-primary|text-secondary|border|bg-section|brand-navy|accent-ai|accent-circular|accent-faith|accent-startup|accent-life|font-display|font-cjk)\s*:" public/styles/global.css

# 確認 .pillar-dot global class 存在
grep -n "^\.pillar-dot" public/styles/global.css

# 確認 .article-meta h1 樣式（對齊基準）
grep -nE "^\.article-(page|meta|pillar)" public/styles/global.css
```

**驗收**：12 個 token 都印出 + `.pillar-dot` line 281 + `.article-page` `.article-meta` `.article-pillar` line 617/651/652 都印出。如果有任何 token 不存在，**停下來回報 Cowork**，不要硬改下去。

### Step B：（移除原規劃 — 不新增 token）

**動作**：跳過。`global.css` 不動。

如果 Step A 發現有 token 缺漏（例如 dark mode 才有的變數），記錄下來但 **不在本 session 新增**，留給後續 typography 系統重構。

### Step C：改 `src/components/SourcePage.astro`

**目標**：source 頁視覺對齊 article 頁，但保留「資料卡」結構。

**改動清單**（按 SourcePage.astro 行號）：

#### C-1. Container width（line 124）

```diff
  .source-page {
-   max-width: 720px;
+   max-width: 840px;
    margin: 0 auto;
-   padding: 2rem 1rem;
+   padding: 120px 24px 80px;
  }
```

對齊 `.article-page` line 617：`max-width: 840px; padding: 120px 24px 80px;`

#### C-2. source-title 對齊 article h1（line 148-154）

```diff
  .source-title {
-   font-size: 1.75rem;
+   font-family: var(--font-display);
+   font-size: 2.4rem;
    font-weight: 700;
-   line-height: 1.3;
-   margin: 0 0 0.75rem;
-   color: var(--color-text, #1a1a1a);
+   line-height: 1.25;
+   letter-spacing: -0.02em;
+   margin: 0 0 20px;
+   color: var(--brand-navy);
  }
```

對齊 `.article-meta h1` line 653。

#### C-3. source-meta 改 article-pillar 風格 + pillar-dot（line 51-63 template + 156-180 css）

**Template 改動**（line 51-63 `<header>`）：

```diff
  <header class="source-header">
+   {pillar && (
+     <div class="source-pillar" style={`color:${p.color}`}>
+       <span class="pillar-dot" style={`background:${p.color}`}></span>
+       <span>{pillarLabel}</span>
+     </div>
+   )}
    <h1 class="source-title">{title}</h1>
    <div class="source-meta">
-     {pillar && (
-       <span class="source-pillar-badge">{pillarLabel}</span>
-     )}
      <span class="source-type-badge">{sourceTypeLabel(raw_source_type)}</span>
      {createdStr && <span class="source-date">{createdStr}</span>}
      {updatedStr && updatedStr !== createdStr && (
        <span class="source-date">更新 {updatedStr}</span>
      )}
    </div>
  </header>
```

對齊 `ArticlePage.astro` line 227-230：

```astro
<div class="article-pillar" style={`color:${p.color}`}>
  <span class="pillar-dot" style={`background:${p.color}`}></span>
  <span itemprop="articleSection">{pillarLabel}</span>
</div>
<h1 itemprop="headline">{title}</h1>
```

**CSS 改動**（line 144-178 `.source-header` / `.source-title` / `.source-meta` 區塊）：

```diff
  .source-header {
-   margin-bottom: 2rem;
+   margin-bottom: 48px;
  }

+ .source-pillar {
+   font-size: 0.72rem;
+   font-weight: 600;
+   text-transform: uppercase;
+   letter-spacing: 0.08em;
+   margin-bottom: 16px;
+   display: flex;
+   align-items: center;
+   gap: 6px;
+ }

  .source-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
  }

- .source-pillar-badge,
  .source-type-badge {
    display: inline-block;
    padding: 0.2rem 0.6rem;
    border-radius: 1rem;
    font-size: 0.75rem;
    font-weight: 600;
-   background: var(--color-surface, #e5e7eb);
-   color: var(--color-text-muted, #6b7280);
+   background: var(--bg-section);
+   color: var(--text-secondary);
  }

- .source-pillar-badge {
-   background: var(--color-accent, #6366f1);
-   color: #fff;
-   opacity: 0.85;
- }
```

`.pillar-dot` 不用本地定義，global.css line 281 已有。

#### C-4. 全 token 替換（剩餘 source 頁 css，line 122-276 整段）

把整個 `<style>` 區塊內的 token 名替換：

| 原本（fallback） | 改成（接到全域系統） |
|---|---|
| `var(--color-text, #1a1a1a)` | `var(--text-primary)` |
| `var(--color-text-muted, #6b7280)` | `var(--text-secondary)` |
| `var(--color-accent, #6366f1)` | `var(--brand-navy)`（給 link / breadcrumb 用 — 全站連結色）|
| `var(--color-surface, #e5e7eb)` | `var(--bg-section)` |
| `var(--color-border, #e5e7eb)` | `var(--border)` |
| `var(--color-surface-subtle, #f8f8f8)` | `var(--bg-section)`（同個變數）|

**注意**：`source-quote` 的 `border-left: 3px solid var(--color-accent)` 應該改成 **pillar 色**（`var(--accent-faith)` 之類），但本 session 不複雜化，先**統一改成 `var(--brand-navy)`**。如果 Paul 看 staging 覺得需要 pillar 色，留 Session 2 處理。

替換完畢確認 SourcePage 的 `<style>` 區塊**沒有任何 `--color-*` 字串殘留**：

```bash
grep -n "color-" src/components/SourcePage.astro
# 預期：0 行（除了 css property name 本身的 color: 之外）
```

### Step D：改 `src/components/ReferencedByArticlesSection.astro`

#### D-1. langDisplay() 中 → 繁（line 33-38）

```diff
  function langDisplay(lang: string): string {
    if (lang === 'en') return 'EN';
    if (lang === 'ja') return '日';
    if (lang === 'zh-cn') return '简';
-   return '中';
+   return '繁';
  }
```

對齊 ArticlePage 的 mobile-lang-bar 用「繁」（line 215）。

#### D-2. Token 替換（line 64-119 整段 `<style>`）

同 Step C-4 的對照表，把所有 `var(--color-*, ...)` 換成 `--text-primary` / `--text-secondary` / `--border` / `--bg-section` / `--brand-navy` 系統。

特別注意 `.lang-badge` 的 `background: var(--color-surface, #e5e7eb)` 改成 `var(--bg-section)`，避免太搶眼。

驗證：

```bash
grep -n "color-" src/components/ReferencedByArticlesSection.astro
# 預期：0 行
```

### Step E：改 `src/components/DerivedFromSection.astro`

只做 token 替換（這個 component 本身視覺結構已經 OK）。

替換對照表同 Step C-4。`.derived-from-section` 的 `border-left: 3px solid var(--color-accent)` 改成 `var(--brand-navy)`（跟 ReferencedByArticlesSection 一致 → 視覺對稱）。

驗證：

```bash
grep -n "color-" src/components/DerivedFromSection.astro
# 預期：0 行
```

### Step F：驗收

#### F-1. Build & test

```bash
cd "/Users/apple/Desktop/01_專案進行中/paulkuo.tw/Paukuo網站"
pnpm build
# 預期：835+ pages built / 0 errors
pnpm test  # 或 pytest，看實際指令
# 預期：180 passed
```

如果 `pnpm build` 報錯，**98% 機率是 SourcePage template 改動破壞了 props 介面**。先 `git diff src/components/SourcePage.astro` 檢查 `<header>` 結構，確認 `pillar` 變數仍然從 props 解構出來。

#### F-2. 視覺驗收（curl staging）

```bash
# 確認 wiki source 頁
curl -sL https://paulkuo.tw/wiki/sources/<任一 source slug>/ | grep -E "max-width|font-display|--accent-|pillar-dot" | head -10

# 確認跨頁面連結 (article → source)
# 隨便挑一篇 article，找它的「衍生自」section，點 source 連結，看視覺
```

驗收標準（規劃文件 §3.4 Code Session 1）：

- ✅ source 頁 max-width 跟 article 頁一致（840px）
- ✅ source 頁 h1 視覺強度跟 article 頁一致（`--font-display` + 2.4rem + `--brand-navy`）
- ✅ source 頁 pillar 色彩跟 article 頁一致（dot + `var(--accent-{pillar})` inline）
- ✅ DerivedFromSection 跟 ReferencedByArticlesSection 視覺成對（border-left + bg-section + brand-navy 連結色）
- ✅ Lang badge 全站統一（繁/简/EN/日）
- ✅ 全 source-side `<style>` 沒有 `var(--color-*` 殘留

#### F-3. 跨專案影響檢查（記憶 `feedback_cross_project_impact`）

| 影響面 | 風險 | 檢查 |
|---|---|---|
| ArticlePage | 不動 | `git diff src/components/ArticlePage.astro` → 無變更 |
| BaseLayout | 不動 | 同上 |
| 其他 wiki pages（concepts / entities） | 不在範圍 | 確認沒誤改 |
| public/styles/global.css | Step B 已決定不動 | `git diff public/styles/global.css` → 無變更（除非 Step A 發現必要 token 缺漏）|

#### F-4. Commit 規範

建議 commit message：

```
feat(wiki/phase-4.5): align source page visual language with article page (Session 1)

- SourcePage.astro: container 840px / h1 use --font-display + 2.4rem / pillar-dot inline
- DerivedFromSection.astro: tokens replaced with --text-primary system
- ReferencedByArticlesSection.astro: tokens replaced + langDisplay 中→繁
- Source-side --color-* fallback strings → connected to global :root tokens
  (--text-primary / --text-secondary / --border / --bg-section / --brand-navy)
- Pillar color via PILLAR_MAP.color (already CSS var)

Phase 4.5 visual cohesion B-option (semi-fusion).
Session 2 will handle "16 篇引用" title rewrite + A/B test.

Plan: worklogs/cowork--wiki-phase4.5-visual-cohesion-plan-2026-04-28.md
Handoff: worklogs/code--wiki-phase4.5-visual-cohesion-session1-handoff-2026-04-28.md
```

---

## §4 不在本 session 範圍

- ❌ 「16 篇引用」標題改寫 / A/B 版本（Session 2）
- ❌ source 端補 cover image（Session 1 後再評估）
- ❌ Typography size token 系統（記憶 §1 踩坑 4 — 另開 issue）
- ❌ Dark mode token 補齊
- ❌ ArticlePage.astro 結構改動（作為 reference）
- ❌ wiki concept / entity 頁面（不在規劃文件範圍）

---

## §5 模型 / Effort 建議

- **建議模型**：**Sonnet 4.6**
  - 視覺對齊判斷需要中等推理（pillar 色彩 + typography 對齊邏輯）
  - 改動量小（~80 行 css/template diff），不需要 Opus
  - Haiku 太弱，會漏掉 token 對照表細節
- **Effort**：**medium**
  - 預估 1.5–2 hr（含 build / test / staging 視覺確認）
  - 如果 Step A 發現 token 缺漏要回報 Cowork，effort 會延長
- **預估 Token 用量**：未量化，但元件總行數 ~700，預估 input token 中等

---

## §6 接手 prompt（[CODE] session 開場貼這段）

```
[CODE] paulkuo.tw Phase 4.5 Code Session 1 — Wiki 視覺融合（半融合）

接續 Phase 4 i18n（commit 186c9b8）。Phase 4.5 方向已拍板「半融合」（B 選項）。
本 session 範圍：source 頁視覺對齊 article 頁，DerivedFromSection 與 ReferencedByArticlesSection 視覺成對。

讀以下兩份文件再開工：
1. worklogs/cowork--wiki-phase4.5-visual-cohesion-plan-2026-04-28.md（規劃）
2. worklogs/code--wiki-phase4.5-visual-cohesion-session1-handoff-2026-04-28.md（Cowork 已驗證 codebase 後的詳細執行 handoff）

⚠️ 重要：執行 handoff §1 「踩坑預警」必讀，內含 6 個 Cowork grep 過 codebase 後發現的修正點，
特別是 token 命名不是 `--color-*` 而是 `--text-primary` 系統 + global.css 在 public/ 不在 src/。

按 §3 Step A → F 順序執行。Step A 如果發現 token 缺漏，停下來回報 Cowork，不要硬改。

Branch：main（paulkuo.tw default branch）
模型建議：Sonnet 4.6 / Effort medium

完成後 push main + 回 Cowork 結構驗收 + 邀 Paul 體感。
```

---

## §7 完成後回交 Cowork

Code session 完成後：

1. push commit 到 `main`
2. 在 GitHub Issue #157（Wiki 儀表板）留 1 行進度：「Phase 4.5 Session 1 完成 — commit <sha>」
3. 寫 `code--wiki-phase4.5-visual-cohesion-session1-done-YYYY-MM-DD.md` 結案 handoff（記憶 `feedback_handoff_local`：filesystem 寫本機 + git push 雙寫）
4. 觸發 session-handoff skill → 通知 Cowork 開新 session 做：
   - 結構驗收（grep 確認 token 替換乾淨）
   - 邀 Paul 體感（跨頁面點兩下，看斷層消除沒有）
   - 視 Paul 回饋決定是否進 Session 2

**不要**自己接著做 Session 2。Session 1 → Cowork 驗收 → Session 2 是規劃文件 §3.4 拍板流程。

---

*產出：Cowork [WIKI] session 2026-04-28*
*規劃對齊：cowork--wiki-phase4.5-visual-cohesion-plan-2026-04-28.md §3.4 Code Session 1*
*下一手：[CODE] session 接手 → 完成後回交 Cowork 驗收*
*對齊 SKILL：session-handoff C 層 v1.0（A 層 v5.7）*
