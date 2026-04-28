# Wiki Phase 4：derived_from 雙向溯源 — 結案紀錄（2026-04-28）

> Issue: #157
> 全程：2026-04-27（Phase 3 SSOT 建立）→ 2026-04-28（Phase 4 A→G 全部完成）

---

## 北極星地基狀態

**article ↔ source 雙向溯源閉環完成。**

- Article 頁顯示「衍生自 N 篇素材」，連 source 獨立頁
- Source 頁顯示「被以下 N 篇文章引用」，連 article 頁（倒序）
- Validator 強制擋 dangling slug + visibility=internal 指向
- prebuild / predev hook 自動重生 index，不 commit 暫存 JSON
- i18n 4 語系（zh-Hant / en / ja / zh-cn）article 端標題切換

---

## Step 時間軸與執行摘要

| Step | 描述 | Commit |
|------|------|--------|
| A | `scripts/wiki-build-derived-index.py` + 8 tests — 掃 articles 產 `data/wiki-derived-index.json` | `fda5a7a` |
| B | `src/components/DerivedFromSection.astro` + ArticlePage 整合 — article 頁衍生自 section | `6df22ab` |
| C-prime | `src/pages/wiki/sources/[slug].astro` 獨立路由 + SourcePage + `ReferencedByArticlesSection.astro` | `dd30e98` |
| D | `package.json` `prebuild` / `predev` / `wiki:build-derived-index` hook 自動化 | `b5d896d` |
| E1 | `scripts/wiki-derived-from-validate.py --strict` visibility 檢查 + dangling slug | `8c99d49` |
| E2 | `DerivedFromSection.astro` lang prop + 4 語系翻譯字典 | `fb80a10` |
| F-batch1 | 2 articles / 6 entries backfill | `497974a` |
| F-batch2 | 7 articles / 19 entries backfill | `ffbc1be` |
| G | SSOT 更新（Phase 4 打勾 + 落地紀錄）+ 結案 worklog（本文件）| （本次 commit） |

---

## 累計成果

| 指標 | 數字 |
|------|------|
| articles with derived_from | 9 |
| derived_from entries | 25 |
| unique sources referenced | 10 |
| 最高密度 source | `getnote-072896-yang-tianrun-non-tech-claw-native`（4 篇引用）|

---

## 工程決策紀錄

**C-prime（而非 C）**：原 Step C 規劃 source 為 concept 頁 embedded section，後決定升級為獨立路由（`/wiki/sources/{slug}/`），改稱 C-prime。好處：source 有自己的 URL、可獨立 link in、未來 SEO 友善。

**prebuild JSON 不 commit**：`data/wiki-derived-index.json` 在 `.gitignore`，每次 build/dev 時由 hook 重生。理由：index 是 derived data，source of truth 是 article frontmatter；commit derived data 會造成 merge conflict 且沒有語意價值。

**visibility=internal 擋在 validator**：不在 UI 層靜默跳過，而是在 validate --strict 明確 exit 1。理由：早期失敗，避免 article 作者寫了 internal source 卻以為 UI 會顯示。

**i18n 策略**：article 端（DerivedFromSection）隨 article lang 切換；source 端（ReferencedByArticlesSection）保持繁中。wiki 路由本身沒有 i18n prefix，source 端不切語系是刻意設計。

---

## Batch 3 / Phase 4.5

剩餘 ~80 篇 article 多數預期低引用密度，暫不 backfill。Batch 3 保留為 Phase 4.5 initiative：

- 觸發時機：有新文章寫完、或發現高密度 source 值得補標
- 不設截止日，Cowork 開場時掃 pending list 決定

---

## 下一手

- **Phase 5**：KV index + Worker API endpoint — 把 `wiki-derived-index.json` 上傳 KV，提供 `GET /wiki/sources/{slug}/referenced-by` API
- **Phase 6**：碰撞 visualization — article ↔ source ↔ concept 三層 graph（長遠目標）
- **Phase 4.5**：Batch 3 backfill（按需啟動）

---

*產出：Code session 2026-04-28（Step G 收尾）*
