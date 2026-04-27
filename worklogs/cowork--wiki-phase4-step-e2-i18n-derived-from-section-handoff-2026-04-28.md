# Code Handoff — Phase 4 Step E2：i18n 多語系字串（DerivedFromSection 標題）（2026-04-28）

> 建立：2026-04-28 由 Cowork session 寫，**Step E1 已完成（8c99d49）後落地**
> 目標 session：Code [WIKI]
> **建議模型**：Claude Sonnet 4.6
> **Effort**：Low（15-20 min；單一元件改動 + 視覺驗收）
> **前置條件**：本機 git pull origin main 後 HEAD 含 `8c99d49`

---

## 1. 上下文

Step C-prime 寫的 UI 字串硬寫繁中，原 Step E 規劃要做 i18n。Cowork verify 發現範圍很小：

- **wiki 路由沒 i18n**：只有 `/wiki/sources/{slug}/`（zh），沒有 `/en/wiki/`、`/ja/wiki/`，所以 SourcePage / ReferencedByArticlesSection 保持繁中即可
- **article 路由有 i18n**：`/articles/{slug}/`（zh）/ `/{en|ja|zh-cn}/articles/{slug}/`，所以 DerivedFromSection（article 端）標題需要隨 lang 切換

E2 範圍 = 只動 `DerivedFromSection.astro` 一個元件。

### 既有 lang 傳遞鏈

`ArticlePage.astro` 已經透過 `lang` prop 收到當前語系（zh-Hant / en / ja / zh-cn），DerivedFromSection 接著拿到即可。Step B 實作時已標 `// TODO i18n` 註解，本 step 落實。

---

## 2. 護欄

- **只動 1 個檔案**：`src/components/DerivedFromSection.astro`
- **不動**：
  - `SourcePage.astro` / `ReferencedByArticlesSection.astro`（wiki 繁中專屬）
  - `ArticlePage.astro`（lang prop 已就位）
  - `wiki/[slug].astro` / `wiki/sources/[slug].astro`（路由不變）
  - `package.json`（不裝 i18n library）
  - 任何 article frontmatter
- **不裝 i18n library**：用 simple inline translation map dict 即可（4 個 lang × ~2 句字串，不需 i18next）
- **遇到意外狀態先停**：
  - lang prop 傳進來不是 zh-Hant / en / ja / zh-cn 其中之一
  - DerivedFromSection 結構讓翻譯字串無處可放

---

## 3. 動作清單

### 動作 1：環境前置

```bash
cd /Users/apple/Desktop/01_專案進行中/paulkuo.tw
git fetch origin
git pull origin main
git status  # 應該乾淨
git log --oneline -5
# 期望：最近 8c99d49 Step E1 在 log
```

### 動作 2：摸 ArticlePage 怎麼傳 lang 給 DerivedFromSection

```bash
grep -n "DerivedFromSection\|lang" src/components/ArticlePage.astro | head -20
grep -n "lang" src/components/DerivedFromSection.astro
```

確認 lang prop 的型別（可能是 `'zh-Hant' | 'en' | 'ja' | 'zh-cn'`，或者其他寫法），handoff 用 `lang` 統稱，實際以代碼為準。

### 動作 3：實作 i18n

**改 `src/components/DerivedFromSection.astro`**:

1. **Props 介面加 lang**（如已存在則對齊型別）:
   ```typescript
   interface Props {
     sources: Array<{ slug: string; title: string; summary?: string; visibility?: string }>;
     lang: 'zh-Hant' | 'en' | 'ja' | 'zh-cn';  // 對齊 ArticlePage 既有寫法
   }
   ```

2. **加 translation map**（在 frontmatter 區）:
   ```typescript
   const translations = {
     'zh-Hant': {
       heading: (n: number) => `衍生自 ${n} 篇素材`,
     },
     'en': {
       heading: (n: number) => `Derived from ${n} ${n === 1 ? 'source' : 'sources'}`,
     },
     'ja': {
       heading: (n: number) => `${n} 件の素材から派生`,
     },
     'zh-cn': {
       heading: (n: number) => `衍生自 ${n} 篇素材`,
     },
   };
   const t = translations[lang] ?? translations['zh-Hant'];  // fallback
   ```

3. **Render 用 t.heading(N)**:
   ```html
   <h3>{t.heading(sources.length)}</h3>
   ```

4. **移除 Step B 留下的 `// TODO i18n` 註解**。

### 動作 4：（可選）lang fallback 防禦

如果傳進來的 lang 不在 4 個語系內：
- console.warn: `unknown lang '${lang}', falling back to zh-Hant`
- 用 zh-Hant 翻譯

### 動作 5：視覺驗收

```bash
# 1. 暫時造假資料：找 4 個 article（zh + en + ja + zh-cn 各一）+ 1 個 public source
# zh: src/content/articles/<某>.md
# en: src/content/articles/en/<某>.md
# ja: src/content/articles/ja/<某>.md
# zh-cn: src/content/articles/zh-cn/<某>.md
# 全部加上同一個 derived_from slug（一個 public source）

# 2. 重生 JSON
pnpm wiki:build-derived-index

# 3. dev server
pnpm dev

# 4. 開 4 個語系的 article 頁，確認「衍生自」section 標題分別顯示：
#    /articles/<zh-slug>/  → 衍生自 1 篇素材
#    /en/articles/<en-slug>/  → Derived from 1 source
#    /ja/articles/<ja-slug>/  → 1 件の素材から派生
#    /zh-cn/articles/<zhcn-slug>/  → 衍生自 1 篇素材

# 5. 撤銷假資料
git checkout src/content/articles/
pnpm wiki:build-derived-index
```

如果某個語系沒有任何現成 article 可以借（例如 ja 全空），就用對應有的語系即可，不必為了測試新建 article。

### 動作 6：驗收

```bash
# 1. 全 pytest
python3 -m pytest tests/ -v
# 期望：180 pass（不變，純前端）

# 2. consistency-check
python3 scripts/wiki-consistency-check.py
# 期望：12 refs verified

# 3. pnpm build
pnpm build
# 期望：835 pages 0 errors

# 4. 假資料已撤銷
git status
git diff src/content/articles/  # 應為空
```

### 動作 7：commit + push

```bash
git add src/components/DerivedFromSection.astro
git status  # 確認只有這個檔
git diff --staged

git commit -m "feat(wiki-derived-ui): i18n derived_from section heading — Phase 4 Step E2

DerivedFromSection.astro 標題隨 article lang 切換：
- zh-Hant: 衍生自 N 篇素材
- en: Derived from N source(s)
- ja: N 件の素材から派生
- zh-cn: 衍生自 N 篇素材

不裝 i18n library，用 inline translation map dict（簡單夠用）。
未知 lang fallback 到 zh-Hant + console warning。

Source 頁元件（SourcePage / ReferencedByArticlesSection）保持繁中——
wiki 路由本身沒 i18n 對應（沒有 /en/wiki/ 等路徑），不需翻譯。

Refs: Issue #157 Phase 4 / docs/article-derived-from.md SSOT"

git push
```

### 動作 8：Issue #157 留 Step E2 收尾

```markdown
## Phase 4 Step E2 — i18n DerivedFromSection 標題 ✅

| Phase | Commit | 內容 |
|-------|--------|------|
| Code — feat | `<sha>` | DerivedFromSection.astro 標題隨 article lang 切換 |

**範圍說明**：
- Article 端 (`/articles`、`/en/articles`、`/ja/articles`、`/zh-cn/articles`) 的「衍生自 N 篇素材」標題隨 lang 切換
- Source 頁元件保持繁中（wiki 路由本身沒 i18n 對應）

**翻譯 map**（inline）：
- zh-Hant / zh-cn：「衍生自 N 篇素材」
- en：「Derived from N source(s)」
- ja：「N 件の素材から派生」
- unknown lang fallback 到 zh-Hant + warning

**驗收**：
- pytest 180 pass（不變）
- consistency-check 12 refs
- pnpm build 835 pages 0 errors
- 視覺驗收 4 個語系標題正確切換

**Phase 4 進度**：
- [x] Step A: build script
- [x] Step B: Article「衍生自」section
- [x] Step C-prime: Source 獨立路由 + 被引用 section
- [x] Step D: prebuild 整合
- [x] Step E1: validator 限 public source
- [x] Step E2: i18n（本 step）
- [ ] Step F: Cowork 提議 backfill → Paul 裁決 → 寫進 frontmatter
- [ ] Step G: SSOT + Issue #157 收尾
```

### 動作 9：回 Cowork 報告

5 行內：
1. 環境確認 + Step E1 commit OK
2. DerivedFromSection.astro 改動內容（translation map）
3. 視覺驗收 4 語系切換 OK
4. 全驗收 pass
5. commit sha + push + Issue #157 留言連結

---

## 4. Acceptance criteria

| 檢查項 | 期望 |
|--------|------|
| `DerivedFromSection.astro` 加 lang prop + translation map | 4 個語系翻譯 |
| 視覺驗收 zh / en / ja / zh-cn 4 個語系標題正確 | 4 個都看到對應翻譯 |
| 假資料撤銷 | git status 沒 article frontmatter 變更 |
| pytest | 180 pass（不變） |
| consistency-check | 12 refs verified |
| pnpm build | 835 pages 0 errors |
| commit + push | 1 commit fast-forward |
| Issue #157 留言 | 已留 |

---

## 5. 跨專案影響

| 檔案 | 影響 |
|------|------|
| `src/components/DerivedFromSection.astro` | 元件改動 — 影響所有 article 頁的「衍生自」section |
| `src/components/SourcePage.astro` | **不動** |
| `src/components/ReferencedByArticlesSection.astro` | **不動** |
| `src/components/ArticlePage.astro` | **不動**（lang prop 已就位） |
| `package.json` | **不動**（不裝 i18n library） |
| article / source frontmatter | **不動** |

未來如果 Wiki 開 i18n 路由（`/en/wiki/`），SourcePage / ReferencedByArticlesSection 才需要再做 i18n —— 留待那時候。

---

## 6. 護欄重申

- 不裝 i18n library
- 不動 SourcePage / ReferencedByArticlesSection
- 不動 ArticlePage（lang prop 已就位）
- 不寫 backfill（Step F）
- 不動 frontmatter
- 不寫下個 step handoff

---

## 7. 建議模型 / Effort

| 子任務 | 模型 | 時間 |
|--------|------|------|
| 動作 1 環境前置 | Sonnet 4.6 | 1 min |
| 動作 2 摸 lang prop 鏈 | Sonnet 4.6 | 2 min |
| 動作 3 實作 i18n | Sonnet 4.6 | 5 min |
| 動作 4 fallback | Sonnet 4.6 | 2 min |
| 動作 5 視覺驗收 4 語系 | Sonnet 4.6 | 4-5 min |
| 動作 6 驗收 | Sonnet 4.6 | 2 min |
| 動作 7-9 commit + push + 留言 + 報告 | Sonnet 4.6 | 3 min |

整體 **Sonnet 4.6 / Low effort（15-20 min）**。

---

## 8. 不做的事

- 不做 SourcePage i18n（wiki 沒 i18n 路由）
- 不做 ReferencedByArticlesSection i18n（同上）
- 不裝 i18n library（4 句字串用 inline map 夠了）
- 不寫 backfill（Step F）
- 不做 schema 變動

---

## 9. 依賴 / 來源

- Phase 4 規劃文件：`cowork--wiki-phase4-derived-reverse-index-plan-2026-04-28.md`（workspace）
- Step C-prime handoff（DerivedFromSection.astro 留下 `// TODO i18n` 註解）
- Step B 實作（commit `6df22ab`，DerivedFromSection.astro 主體）
- 相關 commits：
  - `fda5a7a` Step A
  - `6df22ab` Step B
  - `dd30e98` Step C-prime
  - `b5d896d` Step D
  - `8c99d49` Step E1
- 相關記憶：
  - `feedback_handoff_flow_discipline`
  - `feedback_verify_route_exists_before_phase_planning`
  - `feedback_no_parallel_code_sessions`
  - `feedback_terminal_cd_explicit`
  - `feedback_model_recommendation`

---

*產出：Cowork session 2026-04-28，Step E1 完成後接 Step E2 i18n 落地*

*下一手：Code 接此 handoff，15-20 min 完成 E2；完成後回 Cowork，Cowork 接 Step F (Cowork 提議 backfill 清單) handoff*
