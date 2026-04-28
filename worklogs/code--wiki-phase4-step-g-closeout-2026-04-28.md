# Code Handoff — Phase 4 Step G：收尾（2026-04-28）

> 建立：2026-04-28 由 Cowork [WIKI] session 寫
> 接手 session：Code session
> 上游狀態：Step F batch 1+2 全綠（累計 9 articles / 25 entries / 10 unique sources）
> **建議模型**：Claude Sonnet 4.6（doc 改動 + 結案 worklog 需要對 Phase 4 全貌的判斷力，Haiku 偏弱）
> **Effort**：medium（兩個檔案改動 + 一個 GitHub Issue comment + 一個 commit）

---

## 1. 任務（三件）

### 任務 A — 更新 SSOT `docs/article-derived-from.md`

兩處改動：

**改動 1**：Phase 規劃段把 Phase 4 打勾。

從：
```markdown
- [x] **Phase 3**：schema 加欄位 + validation script + SSOT（本文件）
- [ ] **Phase 4**：反向索引（source → articles）+ Frontend「衍生自」section
- [ ] **Phase 5**：KV index + Worker API endpoint
- [ ] **Phase 6**：碰撞 visualization（article ↔ source ↔ concept 三層 graph）
```

改成：
```markdown
- [x] **Phase 3**：schema 加欄位 + validation script + SSOT（本文件）
- [x] **Phase 4**：反向索引（source → articles）+ Frontend「衍生自」section（2026-04-28 完成）
- [ ] **Phase 5**：KV index + Worker API endpoint
- [ ] **Phase 6**：碰撞 visualization（article ↔ source ↔ concept 三層 graph）
```

**改動 2**：在「Phase 4 路由變更」段之後（或「跟 wiki schema links_to / linked_from 的差異」段之前），新增一個 `## Phase 4 落地紀錄` 段落，內容如下：

```markdown
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
```

> 註：實際插入位置以你判斷為準（不一定要照「Phase 4 路由變更」段之後，可放在最自然的地方）。重點是保留 Phase 規劃段的打勾改動 + 補上落地紀錄。

### 任務 B — 寫 Phase 4 結案 worklog

**檔案**：`worklogs/wiki-phase4-derived-reverse-index-2026-04-28.md`

**內容**（自由發揮，但需涵蓋以下重點）：

- Phase 4 開工 → 完成的時間軸
- 7 個 Step（A/B/C-prime/D/E1/E2/F/G）的執行摘要
- Step F batch 1+2 累計數字（9 articles / 25 entries / 10 sources）
- Phase 4 涉及的 commits（建議列表，下面 Cowork 已整理好）
- 北極星地基狀態：article ↔ source 雙向溯源閉環完成
- 下一手：Phase 5 KV / Phase 4.5 batch 3 / 等新文章

**Phase 4 涉及 commits 列表（給 worklog 用）**：

| Step | Commit | 描述 |
|------|--------|------|
| A | `fda5a7a` | wiki-build-derived-index.py + 8 tests |
| B | `6df22ab` | ArticlePage 衍生自 section + DerivedFromSection.astro |
| C-prime | `dd30e98` | wiki/sources/[slug].astro 獨立路由 + SourcePage + ReferencedByArticlesSection |
| D | `b5d896d` | package.json prebuild + predev + wiki:build-derived-index |
| E1 | `8c99d49` | wiki-derived-from-validate.py + visibility 檢查 |
| E2 | `fb80a10` | DerivedFromSection.astro lang prop + 4 語系翻譯 |
| F-batch1 | `497974a` | 2 articles / 6 entries |
| F-batch2 | `ffbc1be` | 7 articles / 19 entries |
| G | （本次 commit）| SSOT 更新 + 結案 worklog |

### 任務 C — Issue #157 加 Phase 4 結案 comment

在 Issue #157 加 comment，內容大綱：

- **Phase 4 全部完成 (2026-04-28)**
- Step A→G 各步驟 commit hash 列表（用上面的表）
- 累計成果：9 articles / 25 entries / 10 unique sources
- 北極星地基：article ↔ source 雙向溯源閉環，validator 強制 public-only，prebuild 自動化，i18n 4 語系
- Phase 5+ 後續路徑

---

## 2. 驗收

| 步驟 | 通過標準 |
|------|---------|
| `python3 scripts/wiki-consistency-check.py` | 不破，refs 數不變或 +0 |
| `pnpm build` | 0 errors（doc md 改動不影響 build） |
| `pytest` | 180 不變 |
| 視覺檢查 | docs/article-derived-from.md 在 GitHub 上可讀，Phase 規劃段勾號正確 |

---

## 3. 約束

- **不改 schema / build script / UI 元件**：Phase 4 工程端已關門
- **不動已寫入的 derived_from**：保留 9 篇 article 現狀
- **不啟動 batch 3**：Cowork 已決定保留為 Phase 4.5
- **不開 Phase 5 工**：KV / Worker API 留下一階段
- **doc 文字風格沿用 SSOT 既有風格**：簡潔、直白、不堆砌

---

## 4. Commit message 建議

```
wiki(phase4): close out — SSOT update + closing worklog (Step G)

- docs/article-derived-from.md: Phase 4 打勾 + Phase 4 落地紀錄段
- worklogs/wiki-phase4-derived-reverse-index-2026-04-28.md: Phase 4 完整結案紀錄
- Issue #157 加 Phase 4 結案 comment

Phase 4 全部完成（A→G）。累計 9 articles / 25 entries / 10 unique sources。
article ↔ source 雙向溯源閉環、validator 強制 public-only、prebuild 自動化、i18n 4 語系。
北極星地基鋪好，Phase 5（KV index + Worker API）為下一階段。

Refs: #157
```

---

## 5. 完成後

- push 到 `main`（**不是 master**）
- Issue #157 comment 推上去（任務 C）
- 寫個短 Code→Cowork 回報 `worklogs/code--wiki-phase4-step-g-done-2026-04-28.md`：
  - 三件任務的執行結果
  - commit hash
  - Issue comment 連結
- Cowork 收到回報後更新 memory（`project_llm_wiki_derived_from_done` → 改成 `project_llm_wiki_phase4_done`，標 Phase 4 全部完成）

---

## 6. 風險與緩解

| 風險 | 緩解 |
|------|------|
| SSOT 文字插入位置選擇困難 | 不必照本 handoff 字面位置；以可讀性為準，最後留段落即可 |
| 結案 worklog 寫太長 | 重點是清單、commit hash、累計數字；不必重述 Phase 規劃文件 |
| Issue #157 comment 跟之前 batch 1/2 comment 重複 | 結案 comment 寫整體 Phase 4 全貌，不重複 batch 細節（batch 細節已在前面 comment） |
| consistency-check 因新增段落 EXPECTED_REFS 沒對齊 | 本次只動 doc 段落，不新增 cross-ref 路徑；如真破檢查則調整 EXPECTED_REFS |

---

## 7. 不在本 Code handoff 範圍

- 不動 article frontmatter（Step F 已關門）
- 不動 schema / build script / UI 元件（Phase 4 工程端已關門）
- 不啟動 batch 3 / Phase 5
- 不寫 Phase 5 規劃文件（等真要做時再寫）
- 不更新 memory（Cowork 自己處理）

---

*產出：Cowork [WIKI] session 2026-04-28（Step F batch 2 done 確認 + Step G 啟動）*

*下一手：Code session 接 SSOT + 結案 worklog + Issue 結案 comment → push → 回報後 Cowork 收 memory*
