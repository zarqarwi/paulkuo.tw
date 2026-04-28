# Cowork→Cowork Handoff — Phase 4.5 規劃：Wiki 視覺融合

> 建立：2026-04-28（Cowork B+D 收尾後接力寫）
> 接手 session：下一個 Cowork [WIKI] session（依 `feedback_session_single_project` 開乾淨 session 開工）
> 上游：`worklogs/cowork--wiki-phase4-i18n-and-northstar-closeout-2026-04-28.md`
> 對齊 SKILL：session-handoff C 層 v1.0（A 層 v5.7）

---

## §1 議題：跨頁面視覺斷層

D 北極星驗證體感發現的核心問題：**paulkuo.tw 文章頁** 跟 **wiki source 頁** 設計語言不一致，使用者跨越 article ↔ source 連結時會產生視覺認知斷層。

### 對北極星的影響（為何不是低級美編議題）

「碰撞引擎」的價值靠 **article ↔ source 反覆穿梭**誘發新文章想法。如果每次跨越都要重新適應 UI，**碰撞效率打對折**。Paul 卡在視覺斷層的瞬間不會誘發想法，反而去調整認知。

**結論**：這個議題比原本 Phase 4.5 candidate 1/2/3（標題誤導 / lang badge / 跨語系跳轉）都更高層次。前面 3 個 candidate 是這個大議題的子集。

### 現況對比表（D 體感觀察）

| 元素 | paulkuo.tw 文章頁（ArticlePage.astro） | wiki source 頁（SourcePage.astro） |
|------|-------------------------------------|----------------------------------|
| **Container** | 透過 BaseLayout（無 hardcoded width）| `max-width: 720px` hardcoded |
| **Cover image** | ✅ 1792×1024 視覺主圖 | ❌ 無 |
| **H1 title** | 透過 layout 大字（視覺強）| `font-size: 1.75rem`（弱）|
| **Pillar 色彩** | `var(--accent-{pillar})` + pillar dot inline 強烈聯動 | `var(--color-accent)` opacity 0.85（弱化版 badge）|
| **Author / 來源人格** | ✅ 大頭照 + bio + tagline | ❌ 無 |
| **Reading time** | ✅ | ❌ |
| **Share buttons** | ✅ LINE/FB/X/LinkedIn/Threads | ❌ 無 |
| **Comments** | ✅ ArticleComments | ❌ 無 |
| **Related / Prev-Next** | ✅ 完整導航 | ❌ 無 |
| **整體氣場** | 「閱讀體驗」 | 「資料卡」 |

---

## §2 決策：半融合（B 選項）

3 選項評估後選 B：

- **A. 完整融合**（high effort）：source 頁也用 BaseLayout 加全套 article 元素 → ❌ 失去 source 的「資料卡」清晰感，且 source 性質本就跟 article 不同
- **B. 半融合**（medium effort）：保留 source 「資料卡」性質，統一視覺語言 → ✅ **選這個**
- **C. 過渡 UI**（low effort）：article 端加視覺橋接 → ❌ 治標不治本，跳過去仍斷層

### 半融合定義

「**站感統一但角色清楚**」。典型對標：
- Notion: page vs database row
- Wikipedia: article vs 維基條目側欄
- GitHub: README vs Issue

source 頁不該變成迷你 article，但要看起來「同一個站」。

---

## §3 工程拆解

### §3.1 動的 Component（必動 3 個 + 可能延伸 1-2 個）

**必動**：

| 檔案 | 改什麼 |
|------|-------|
| `src/components/SourcePage.astro` | container max-width / typography / pillar 色彩系統 / source-meta 結構（補 source attribution）/ 補可選 cover slot |
| `src/components/ReferencedByArticlesSection.astro` | langDisplay() 中→繁 / list item 視覺對齊 DerivedFromSection / 解 Candidate 1（標題誤導）|
| `src/components/DerivedFromSection.astro` | list item 視覺對齊 ReferencedByArticlesSection |

**可能延伸**：

| 檔案 | 改什麼 |
|------|-------|
| `src/styles/global.css` | 補對齊 design token（如果現有 token 不夠用）|
| `src/pages/wiki/sources/[slug].astro` | thin wrapper 不大改（除非 SourcePage props 介面調整）|

**不動**（作為 reference）：
- `src/components/ArticlePage.astro` — 作為視覺基準參考，不直接改
- `src/layouts/BaseLayout.astro` — 不改，但 SourcePage 要更貼近它的 layout 規範

### §3.2 對齊的 Design Token（4 類）

#### Token 類別 1: Layout container

**現況**：
- ArticlePage 透過 BaseLayout（無 hardcoded width）
- SourcePage `max-width: 720px` hardcoded

**對齊**：移除 SourcePage 的 hardcoded max-width，統一透過 BaseLayout 機制。如 BaseLayout 沒有 article-style container，加一個 `--container-max-width` token。

#### Token 類別 2: Typography scale

**現況差異**：
- ArticlePage h1：透過 layout 大字（視覺強）
- SourcePage `.source-title`：1.75rem
- ArticlePage `.article-meta` / SourcePage `.source-meta`：基本一致

**對齊**：
- 定義 `--font-size-page-title`（h1 統一）
- 定義 `--font-size-section-title`（h2 統一）
- 定義 `--font-size-body`（內文統一）
- 定義 `--font-size-meta`（meta 訊息統一）

#### Token 類別 3: Pillar 色彩系統

**現況**：
- ArticlePage 用 `var(--accent-{pillar})` 強烈聯動，pillar dot inline style 跟著主色
- SourcePage 用通用 `var(--color-accent)` opacity 0.85，pillar 退化成弱 badge

**對齊**：
- SourcePage 也用 `var(--accent-{pillar})` 系統（從 PILLAR_MAP 取色）
- 加 pillar dot 視覺元素（跟 ArticlePage 一致）
- pillar badge 改用 pillar 主色，不用通用 accent

#### Token 類別 4: Color hierarchy

**現況**：基本一致（兩邊都用 `--color-text` / `--color-text-muted` / `--color-surface-subtle`）。

**對齊**：確認以下使用一致：
- title → `--color-text`
- meta info → `--color-text-muted`
- accent / link → `var(--accent-{pillar})` 或 `--color-accent`（保留通用用法給 wiki 全站連結）
- subtle background → `--color-surface-subtle`
- border → `--color-border`

### §3.3 視覺 Mockup 處理：不做 mockup

**決策**：直接寫文字規格 + 抽 ArticlePage 既有 design pattern + 對照表，**不做 mockup**。

**理由**：
1. ArticlePage.astro 已是現成「視覺基準」，Code session 直接 reference 就有清楚目標
2. 半融合的本質是「**source 頁複製 article 頁的視覺基礎，但保留 source 的內容結構**」——文字規格表達精準度高於 sketch
3. mockup 易誤導工程往視覺方向走偏，文字規格反而能控住「半融合 ≠ 完整融合」的紅線
4. 做 mockup 等 Paul 看完再回饋，會拖慢流程

**逃生口**：Code Session 1 完成後若 Paul 看了 staging build 覺得方向偏了，**才**追加輕量 HTML mockup（不畫，直接用 SourcePage.astro 改一份對比版）。

### §3.4 Effort 拆解：2 個 Code Session

工作流複用 Phase 4 Step F 模式（**Cowork propose → Code 寫 → Cowork 驗證**）：

```
Cowork 寫 Phase 4.5 規劃文件（本 commit）
↓
[CODE] Session 1: 基礎視覺對齊 + 衍生 UI 對齊（~2 hr）
↓
Cowork 結構驗證 + 邀 Paul 體感
↓
[CODE] Session 2: 資訊架構修正（~1.5 hr，含 A/B 版本選擇）
↓
Cowork 結案 + Phase 4.5 done memory
```

#### Code Session 1: 基礎視覺對齊 + 衍生 UI 對齊（~2 hr）

**範圍**：design token 對齊 + SourcePage 視覺重整 + DerivedFromSection / ReferencedByArticlesSection 互相對齊。**不動**「16 篇引用」標題（留給 Session 2）。

**工程步驟**：
1. **Step A**：grep `src/styles/global.css` 確認既有 token 命名規範
2. **Step B**：補缺漏 token（typography / pillar 色彩 layer）寫進 global.css
3. **Step C**：改 SourcePage.astro：
   - 移除 hardcoded max-width，依 BaseLayout 機制
   - source-title 改用 `--font-size-page-title` token
   - source-pillar-badge 改用 `var(--accent-{pillar})` + pillar dot
4. **Step D**：改 ReferencedByArticlesSection.astro：
   - langDisplay() 中→繁
   - list item style 對齊 DerivedFromSection（spacing / hover / typography）
5. **Step E**：改 DerivedFromSection.astro：
   - list item style 跟 ReferencedByArticlesSection 同 pattern
6. **Step F**：驗收
   - `pnpm build` → 835+ pages / 0 errors
   - `pytest` → 180 passed
   - 視覺驗證（fetch 兩種頁面對比）

**驗收基準**：
- ✅ source 頁 max-width 跟 article 頁一致
- ✅ source 頁 h1 視覺強度跟 article 頁一致
- ✅ source 頁 pillar 色彩使用跟 article 頁一致（dot + accent）
- ✅ DerivedFromSection 跟 ReferencedByArticlesSection 從外觀感覺像「同一族」
- ✅ Lang badge 全站統一（繁/简/EN/日）

**模型建議**：Sonnet 4.6（視覺判斷需要）
**Effort**：medium（~2 hr）

#### Code Session 2: 資訊架構修正（~1.5 hr）

**範圍**：解 Phase 4.5 Candidate 1（「16 篇引用」標題誤導）。Code 實作 A 版 + B 版兩個方案，Paul 看完選一個 ship。

**A 版方案**（最簡 — 改文案）：
- 標題改成「被 4 篇文章引用（含 12 個翻譯版本）」
- list 結構不變

**B 版方案**（按 article_slug group）：
- list 按 article_slug group，主行用 zh 版（無 zh 則用 en）
- 主行下方 inline 顯示其他語系 badge：「[EN] [日] [简]」可點切換
- 標題改成「被 4 篇文章引用」

**工程步驟**：
1. **Step A**：grep + 改 ReferencedByArticlesSection.astro 的 logic
   - A 版：純 template 改文案
   - B 版：JS group by article_slug，主行 + lang badges 並排
2. **Step B**：用 feature flag / env variable 切換 A/B 版本
3. **Step C**：deploy A/B 兩個 staging URL（或同一 URL 用 query param 切換）
4. **Step D**：驗收
   - `pnpm build` → 0 errors
   - `pytest` → 180 passed
   - Cowork 端 fetch A/B 版本給 Paul 比較
5. **Step E**：Paul 選定後移除 feature flag，留勝出版本

**驗收基準**：
- ✅ A/B 版本都能 build 出來不出錯
- ✅ Paul 拍板後勝出版本是 main 上的 source of truth
- ✅ unique source keys 維持 10（不能改動 build-derived-index.json 的計數）

**模型建議**：Sonnet 4.6（A/B 設計判斷 + 工程實作）
**Effort**：medium（~1.5 hr）

---

## §4 跟其他工作的依賴關係

| 工作 | 依賴關係 | 處理 |
|------|---------|------|
| **Phase 5（KV index + Worker API）** | 不衝突，可並行 | 視覺改動跟 KV 邏輯解耦，可同期跑 |
| **paulkuo-writing skill 升級** | 不衝突，但建議 Phase 5 上線後做 | skill 升級會讀現有 design pattern，Phase 4.5 視覺穩定後升級更穩 |
| **ja/zh-cn ai-collab-realtime-translator stub 翻譯** | 完全獨立 | 屬 paulkuo-writing 翻譯系列，另開 issue 追蹤 |
| **Phase 6（碰撞 visualization）** | 強依賴 Phase 4.5 視覺基礎 | 視覺一致後做 graph view 才有 design language 基礎 |

**結論**：Phase 4.5 是 Phase 6 的前置，但跟 Phase 5 解耦。建議 Phase 4.5 跟 Phase 5 並行（兩個獨立 session），Phase 6 等兩者都完成。

---

## §5 開場 prompt 範本（下個 [WIKI] session 開場用）

開新 [WIKI] session 後貼這段：

```
[WIKI] Phase 4.5 視覺融合 — Code Session 1 handoff 撰寫

接續 Phase 4 i18n 補完（commit 186c9b8）。Phase 4.5 議題：跨頁面視覺斷層
（article 頁 vs wiki source 頁設計語言不一致），方向已拍板「半融合」（B 選項）。

讀 worklogs/cowork--wiki-phase4.5-visual-cohesion-plan-2026-04-28.md 還原規劃，
按 §3.4 Code Session 1 範圍寫詳細 Cowork→Code handoff，含：
- §3 6 個 Step 的 grep / 改動 / 驗收細節
- 模型建議 Sonnet 4.6 / Effort medium
- 踩坑預警（特別是 typography token 重複定義 / 既有 pillar 色系統可能已有 token）

push handoff 到 main 後，等 Code session 接手執行。
```

---

## §6 不在 Phase 4.5 範圍

- Phase 5 KV+API（獨立 session）
- Phase 6 graph visualization（等 4.5 + 5 完成）
- batch 3 backfill（剩 ~80 篇低引用密度 article）
- ja/zh-cn ai-collab-realtime-translator stub 翻譯（屬 paulkuo-writing）
- source 端「補 cover image」如果要做（半融合範圍內可選，但 source 沒有預設 cover 來源，需另外規劃 thumbnail 抓取邏輯。**Code Session 1 預設不做**，留 Code Session 1 後評估）

---

## §7 防重複執行 checklist

下個 [WIKI] session 接手時別重做：

- ❌ 不要重議「半融合方向」（已拍板 B）
- ❌ 不要做 mockup（已決策不做，逃生口在 Session 1 後）
- ❌ 不要把 Code Session 1 + 2 合併成一個 session（中間 Paul 要驗收，A/B 版本要看效果）
- ❌ 不要動 ArticlePage.astro 的結構（作為 reference，不改）
- ❌ 不要 cover image 邏輯（留 Code Session 1 後評估）
- ✅ 要做：照 §5 開場 prompt 寫 Code Session 1 詳細 handoff，push main，停下等 Code

---

## §8 模型 / Effort 紀錄

本規劃文件：
- 模型：Claude Opus（Cowork 預設）
- Effort：medium（規劃 + 工程拆解 + 4 個維度文字規格）
- Token 用量：未量化
- Session 時長：~30 min

---

## §9 跟北極星的對齊驗收

Phase 4.5 完成後該滿足的北極星指標（不在 driving metrics 裡，但是體感判準）：

- 從 article 端「衍生自」→ 點 source 連結 → source 頁打開的瞬間，**視覺認知不斷層**
- 從 source 端「被引用」→ 點 article 連結 → article 頁打開的瞬間，**視覺認知不斷層**
- 兩種頁面看起來「**同一個站、不同角色**」（站感統一，角色清楚）

---

*產出：Cowork [WIKI] session 2026-04-28（Phase 4.5 規劃）*

*下一手：開新 [WIKI] session → 寫 Code Session 1 詳細 handoff → push main → 等 Code 跑*

*對齊 SKILL：session-handoff C 層 v1.0（A 層 v5.7）*
